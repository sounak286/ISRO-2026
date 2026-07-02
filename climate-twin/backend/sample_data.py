"""
Generate IMD-format sample .grd files when official downloads are unavailable.
Patterns follow monsoon climatology for PoC training.
Place real files from IMD Pune in data/imd/ to replace these.
"""
from __future__ import annotations

import struct
from pathlib import Path

import numpy as np

from imd_parser import (
    RAIN_LAT,
    RAIN_LON,
    TEMP_LAT,
    TEMP_LON,
    read_rainfall_yearly,
    read_temperature_yearly,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "imd"


def _is_leap(year: int) -> bool:
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def generate_rainfall_year(year: int, seed: int = 42) -> np.ndarray:
    rng = np.random.default_rng(seed + year)
    days = 366 if _is_leap(year) else 365
    lons = 66.5 + np.arange(RAIN_LON) * 0.25
    lats = 6.5 + np.arange(RAIN_LAT) * 0.25
    lon2d, lat2d = np.meshgrid(lons, lats)

    data = np.zeros((days, RAIN_LAT, RAIN_LON), dtype=np.float32)
    for d in range(days):
        doy = d + 1
        monsoon = np.clip(np.sin((doy - 120) / 60 * np.pi), 0, 1)
        coastal = np.exp(-((lon2d - 74) ** 2) / 18) * 0.6
        orographic = np.sin(lon2d * 0.08) * np.cos(lat2d * 0.1) * 0.25
        noise = rng.normal(0, 0.15, lon2d.shape)
        base = (monsoon * 35 + coastal * 25 + orographic * 12) * (1 + noise)
        base[lat2d > 30] *= 0.55
        data[d] = np.clip(base, 0, 120).astype(np.float32)
    return data


def generate_temperature_year(year: int, seed: int = 7) -> np.ndarray:
    rng = np.random.default_rng(seed + year)
    days = 366 if _is_leap(year) else 365
    lons = 67.5 + np.arange(TEMP_LON)
    lats = 7.5 + np.arange(TEMP_LAT)
    lon2d, lat2d = np.meshgrid(lons, lats)

    data = np.zeros((days, TEMP_LAT, TEMP_LON), dtype=np.float32)
    for d in range(days):
        doy = d + 1
        seasonal = 26 + 8 * np.sin((doy - 80) / 365 * 2 * np.pi)
        lat_grad = (lat2d - 20) * 0.35
        noise = rng.normal(0, 0.8, lon2d.shape)
        data[d] = (seasonal + lat_grad + noise).astype(np.float32)
    return data


def write_rainfall_yearly(path: Path, data: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as f:
        for d in range(data.shape[0]):
            f.write(data[d].astype(np.float32).tobytes())


def write_temperature_yearly(path: Path, data: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("wb") as f:
        for d in range(data.shape[0]):
            # Fortran order: ((T(I,J), J=1,JSIZ), I=1,ISIZ)
            rec = data[d].T.astype(np.float32).tobytes(order="F")
            f.write(rec)


def ensure_sample_data(years: list[int] | None = None) -> dict:
    years = years or [2023, 2024]
    status = {"rainfall": [], "temperature": [], "dir": str(DATA_DIR)}

    for year in years:
        rain_path = DATA_DIR / f"ind{year}_rfp25.grd"
        temp_path = DATA_DIR / f"MaxT{year}.GRD"

        if not rain_path.exists():
            write_rainfall_yearly(rain_path, generate_rainfall_year(year))
            status["rainfall"].append({"year": year, "generated": True, "path": str(rain_path)})
        else:
            status["rainfall"].append({"year": year, "generated": False, "path": str(rain_path)})

        if not temp_path.exists():
            write_temperature_yearly(temp_path, generate_temperature_year(year))
            status["temperature"].append({"year": year, "generated": True, "path": str(temp_path)})
        else:
            status["temperature"].append({"year": year, "generated": False, "path": str(temp_path)})

    return status


def load_fused_series(years: list[int] | None = None) -> tuple[np.ndarray, np.ndarray]:
    from imd_parser import upsample_temp_to_rain

    years = years or [2023, 2024]
    rain_parts, temp_parts = [], []

    for year in years:
        rain_path = DATA_DIR / f"ind{year}_rfp25.grd"
        temp_path = DATA_DIR / f"MaxT{year}.GRD"
        if not rain_path.exists() or not temp_path.exists():
            ensure_sample_data([year])
        rain_parts.append(read_rainfall_yearly(rain_path))
        temp_parts.append(read_temperature_yearly(temp_path))

    rain = np.concatenate(rain_parts, axis=0)
    temp_hi = np.concatenate([upsample_temp_to_rain(t) for t in temp_parts], axis=0)
    return rain, temp_hi


if __name__ == "__main__":
    info = ensure_sample_data()
    print("Sample IMD data ready:", info)
