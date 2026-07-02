"""FastAPI backend — serves IMD-fused grids and AI forecasts to HTML dashboard."""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from imd_parser import REGIONS, crop_region, grid_to_geojson_points, RAIN_META
from model import METRICS_PATH, forecast_day, load_model
from sample_data import ensure_sample_data, load_fused_series

app = FastAPI(title="India Climate Digital Twin API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DATE = datetime(2024, 6, 20)
_cache: dict = {}


def _load_cache():
    if _cache.get("ready"):
        return
    ensure_sample_data([2023, 2024])
    rain, temp = load_fused_series([2023, 2024])
    _cache["rain"] = rain
    _cache["temp"] = temp
    _cache["base_day"] = 200  # day index in fused series for PoC "now"
    _cache["ready"] = True


@app.on_event("startup")
def startup():
    _load_cache()
    model_path = Path(__file__).resolve().parent.parent / "models" / "climate_surrogate.pt"
    if not model_path.exists():
        from model import train_model
        train_model(_cache["rain"], _cache["temp"], epochs=10)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "climate-digital-twin"}


@app.get("/api/datasets")
def datasets():
    _load_cache()
    data_dir = Path(__file__).resolve().parent.parent / "data" / "imd"
    files = list(data_dir.glob("*.grd")) + list(data_dir.glob("*.GRD"))
    return {
        "sources": [
            {
                "name": "IMD 0.25° Rainfall",
                "url": "https://www.imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html",
                "format": "Binary .grd",
                "grid": "135×129 @ 0.25°",
            },
            {
                "name": "IMD 1.0° Max Temperature",
                "url": "https://www.imdpune.gov.in/cmpg/Griddata/Max_1_Bin.html",
                "format": "Binary .GRD",
                "grid": "31×31 @ 1.0°",
            },
            {
                "name": "MOSDAC Satellite Archive",
                "url": "https://www.mosdac.gov.in/",
                "format": "HDF5 / NetCDF",
                "grid": "INSAT-3R LST / SST",
            },
        ],
        "local_files": [f.name for f in files],
        "fused_days": int(_cache["rain"].shape[0]),
    }


@app.get("/api/pipeline")
def pipeline():
    _load_cache()
    return [
        {"name": "IMD Rainfall 0.25°", "format": ".grd", "status": "ok", "meta": f"{_cache['rain'].shape[0]} days loaded"},
        {"name": "IMD Max Temperature 1°", "format": ".GRD", "status": "ok", "meta": "Upsampled to 0.25°"},
        {"name": "MOSDAC INSAT-3R", "format": "HDF5", "status": "sync", "meta": "LST fusion proxy"},
        {"name": "PINN Surrogate (PyTorch)", "format": "EnKF", "status": "ok", "meta": "Model active"},
    ]


@app.get("/api/model/metrics")
def model_metrics():
    if not METRICS_PATH.exists():
        raise HTTPException(404, "Model not trained")
    return json.loads(METRICS_PATH.read_text())


@app.get("/api/grid")
def get_grid(
    region: str = Query("western-ghats"),
    day_offset: int = Query(0),
    forecast: bool = Query(False),
):
    _load_cache()
    if region not in REGIONS:
        raise HTTPException(400, f"Unknown region: {region}")

    day_idx = _cache["base_day"] + day_offset
    rain = _cache["rain"]
    temp = _cache["temp"]

    if forecast and day_offset > 0:
        r_slice = rain[day_idx - 1].copy()
        t_slice = temp[day_idx - 1].copy()
        for _ in range(day_offset):
            r_slice, t_slice = forecast_day(r_slice, t_slice, {})
        rain_day = r_slice
        temp_day = t_slice
    else:
        day_idx = np.clip(day_idx, 0, rain.shape[0] - 1)
        rain_day = rain[day_idx]
        temp_day = temp[day_idx]

    bounds = REGIONS[region]["bounds"]
    r_crop, lons, lats = crop_region(rain_day[None], RAIN_META, bounds)
    t_crop, _, _ = crop_region(temp_day[None], RAIN_META, bounds)

    points = grid_to_geojson_points(r_crop, t_crop, lons, lats, 0)
    current_date = BASE_DATE + timedelta(days=day_offset)

    return {
        "region": region,
        "date": current_date.strftime("%Y-%m-%d"),
        "day_offset": day_offset,
        "forecast": forecast,
        "points": points,
        "stats": {
            "mean_rainfall": round(float(np.nanmean(r_crop)), 2),
            "max_lst": round(float(np.nanmax(t_crop)), 2),
            "grid_points": len(points),
        },
        "meta": {"resolution": "0.25°", "source": "IMD Pune + PyTorch surrogate"},
    }


@app.get("/api/forecast/series")
def forecast_series(region: str = Query("western-ghats"), horizon: int = Query(7)):
    _load_cache()
    bounds = REGIONS[region]["bounds"]
    base = _cache["base_day"]
    dates, rain_vals, temp_vals = [], [], []

    r_slice = _cache["rain"][base].copy()
    t_slice = _cache["temp"][base].copy()

    for h in range(horizon + 1):
        dates.append((BASE_DATE + timedelta(days=h)).strftime("%Y-%m-%d"))
        r_crop, _, _ = crop_region(r_slice[None], RAIN_META, bounds)
        t_crop, _, _ = crop_region(t_slice[None], RAIN_META, bounds)
        rain_vals.append(round(float(np.nanmean(r_crop)), 2))
        temp_vals.append(round(float(np.nanmean(t_crop)), 2))
        if h < horizon:
            r_slice, t_slice = forecast_day(r_slice, t_slice, {})

    return {"region": region, "dates": dates, "rainfall": rain_vals, "temperature": temp_vals}


@app.post("/api/train")
def retrain():
    from model import train_model
    _load_cache()
    metrics = train_model(_cache["rain"], _cache["temp"], epochs=10)
    return JSONResponse({"status": "trained", "metrics": metrics})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
