"""PyTorch spatio-temporal surrogate for rainfall + temperature forecasting."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
METRICS_PATH = MODEL_DIR / "metrics.json"


class ClimateSurrogate(nn.Module):
    """Lightweight PINN-inspired CNN surrogate — 2-channel in, 2-channel out."""

    def __init__(self, hidden: int = 32):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(2, hidden, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(hidden, hidden, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(hidden, hidden * 2, 3, padding=1),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(hidden * 2, hidden, 2, stride=2),
            nn.ReLU(),
            nn.Conv2d(hidden, hidden, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(hidden, 2, 3, padding=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.decoder(self.encoder(x))


def normalize(arr: np.ndarray) -> tuple[np.ndarray, float, float]:
    lo = float(np.nanpercentile(arr, 2))
    hi = float(np.nanpercentile(arr, 98))
    if hi <= lo:
        hi = lo + 1.0
    norm = (arr - lo) / (hi - lo)
    return np.nan_to_num(norm, nan=0.5), lo, hi


def denormalize(arr: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return arr * (hi - lo) + lo


def build_sequences(rain: np.ndarray, temp: np.ndarray, seq_len: int = 1) -> tuple[np.ndarray, np.ndarray]:
    """Build (N, 2, H, W) -> (N, 2, H, W) training pairs on full India grid."""
    rain_n, r_lo, r_hi = normalize(rain)
    temp_n, t_lo, t_hi = normalize(temp)
    x_list, y_list = [], []
    for d in range(seq_len, rain.shape[0] - 1):
        x = np.stack([rain_n[d], temp_n[d]], axis=0)
        y = np.stack([rain_n[d + 1], temp_n[d + 1]], axis=0)
        x_list.append(x)
        y_list.append(y)
    return np.array(x_list, dtype=np.float32), np.array(y_list, dtype=np.float32)


def train_model(
    rain: np.ndarray,
    temp: np.ndarray,
    epochs: int = 12,
    batch_size: int = 16,
    lr: float = 1e-3,
) -> dict:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    x, y = build_sequences(rain, temp)
    # Subsample for faster PoC if grid is large
    n = x.shape[0]
    idx = np.linspace(0, n - 1, min(n, 200), dtype=int)
    x, y = x[idx], y[idx]

    xt = torch.from_numpy(x).to(device)
    yt = torch.from_numpy(y).to(device)

    model = ClimateSurrogate().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()

    history = []
    for ep in range(epochs):
        model.train()
        perm = torch.randperm(xt.shape[0], device=device)
        ep_loss = 0.0
        batches = 0
        for i in range(0, xt.shape[0], batch_size):
            b = perm[i : i + batch_size]
            pred = model(xt[b])
            loss = loss_fn(pred, yt[b])
            opt.zero_grad()
            loss.backward()
            opt.step()
            ep_loss += loss.item()
            batches += 1
        avg = ep_loss / max(batches, 1)
        history.append({"epoch": ep + 1, "loss": round(avg, 6)})
        print(f"Epoch {ep + 1}/{epochs}  loss={avg:.6f}")

    # Validation on last 20 samples
    model.eval()
    with torch.no_grad():
        pred = model(xt[-20:])
        mse = loss_fn(pred, yt[-20:]).item()
        rain_mse = loss_fn(pred[:, 0], yt[-20:, 0]).item()
        temp_mse = loss_fn(pred[:, 1], yt[-20:, 1]).item()

    rain_n, r_lo, r_hi = normalize(rain)
    temp_n, t_lo, t_hi = normalize(temp)
    norm_stats = {"rain": [r_lo, r_hi], "temp": [t_lo, t_hi]}

    torch.save({"state_dict": model.state_dict(), "norm_stats": norm_stats}, MODEL_DIR / "climate_surrogate.pt")

    metrics = {
        "framework": "PyTorch",
        "epochs": epochs,
        "samples": int(x.shape[0]),
        "mse_total": round(mse, 6),
        "mse_rainfall": round(rain_mse, 6),
        "mse_temperature": round(temp_mse, 6),
        "rmse_rainfall_mm": round(float(np.sqrt(rain_mse)) * (r_hi - r_lo), 3),
        "rmse_temperature_c": round(float(np.sqrt(temp_mse)) * (t_hi - t_lo), 3),
        "history": history,
        "sources": [
            "IMD Pune 0.25° Rainfall (.grd)",
            "IMD Pune 1.0° Max Temperature (.grd)",
            "MOSDAC INSAT-3R (LST proxy via temp fusion)",
        ],
        "status": "trained",
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    return metrics


def load_model() -> tuple[ClimateSurrogate, dict]:
    path = MODEL_DIR / "climate_surrogate.pt"
    if not path.exists():
        raise FileNotFoundError("Model not trained yet. Run train.py first.")
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    model = ClimateSurrogate()
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    return model, ckpt["norm_stats"]


def forecast_day(rain_slice: np.ndarray, temp_slice: np.ndarray, norm_stats: dict) -> tuple[np.ndarray, np.ndarray]:
    model, stats = load_model()
    r_lo, r_hi = stats["rain"]
    t_lo, t_hi = stats["temp"]
    rain_n = np.nan_to_num((rain_slice - r_lo) / (r_hi - r_lo), nan=0.5)
    temp_n = np.nan_to_num((temp_slice - t_lo) / (t_hi - t_lo), nan=0.5)
    x = torch.from_numpy(np.stack([rain_n, temp_n], axis=0)[None].astype(np.float32))
    with torch.no_grad():
        y = model(x).numpy()[0]
    rain_pred = denormalize(y[0], r_lo, r_hi)
    temp_pred = denormalize(y[1], t_lo, t_hi)
    return np.clip(rain_pred, 0, None), temp_pred
