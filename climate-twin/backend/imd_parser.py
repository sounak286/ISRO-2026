"""
IMD Pune binary grid parsers — official format specifications:
- Rainfall 0.25°: https://www.imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html
- Max Temperature 1.0°: https://www.imdpune.gov.in/cmpg/Griddata/Max_1_Bin.html
"""
from __future__ import annotations

import struct
from dataclasses import dataclass
from pathlib import Path

import numpy as np

RAIN_LON = 135
RAIN_LAT = 129
RAIN_LON_START = 66.5
RAIN_LAT_START = 6.5
RAIN_RES = 0.25
RAIN_UNDEF = -999.0

TEMP_LON = 31
TEMP_LAT = 31
TEMP_LON_START = 67.5
TEMP_LAT_START = 7.5
TEMP_RES = 1.0
TEMP_UNDEF = 99.9


@dataclass
class GridMeta:
    variable: str
    resolution: float
    lon_start: float
    lat_start: float
    n_lon: int
    n_lat: int
    source: str
    citation: str


RAIN_META = GridMeta(
    variable="rainfall",
    resolution=RAIN_RES,
    lon_start=RAIN_LON_START,
    lat_start=RAIN_LAT_START,
    n_lon=RAIN_LON,
    n_lat=RAIN_LAT,
    source="IMD Pune — 0.25° Daily Gridded Rainfall (1901–2024)",
    citation="Pai et al. (2014), MAUSAM 65(1)",
)

TEMP_META = GridMeta(
    variable="max_temperature",
    resolution=TEMP_RES,
    lon_start=TEMP_LON_START,
    lat_start=TEMP_LAT_START,
    n_lon=TEMP_LON,
    n_lat=TEMP_LAT,
    source="IMD Pune — 1.0° Daily Gridded Max Temperature (1951–2024)",
    citation="Srivastava et al. (2009), Atmospheric Science Letters",
)


def _lon_lat_axes(meta: GridMeta) -> tuple[np.ndarray, np.ndarray]:
    lons = meta.lon_start + np.arange(meta.n_lon) * meta.resolution
    lats = meta.lat_start + np.arange(meta.n_lat) * meta.resolution
    return lons, lats


def read_rainfall_yearly(path: Path) -> np.ndarray:
    """Read yearly rainfall .grd — shape (days, lat, lon)."""
    rec_size = RAIN_LON * RAIN_LAT * 4
    raw = path.read_bytes()
    n_days = len(raw) // rec_size
    data = np.frombuffer(raw, dtype=np.float32).reshape(n_days, RAIN_LAT, RAIN_LON).copy()
    data[data <= RAIN_UNDEF + 1] = np.nan
    return data


def read_temperature_yearly(path: Path) -> np.ndarray:
    """Read yearly max temperature .grd — Fortran direct-access order."""
    rec_size = TEMP_LON * TEMP_LAT * 4
    raw = path.read_bytes()
    n_days = len(raw) // rec_size
    out = np.zeros((n_days, TEMP_LAT, TEMP_LON), dtype=np.float32)
    for d in range(n_days):
        chunk = raw[d * rec_size : (d + 1) * rec_size]
        # Fortran: ((T(I,J), J=1,JSIZ), I=1,ISIZ) => I fastest
        day = np.frombuffer(chunk, dtype=np.float32).reshape(TEMP_LON, TEMP_LAT, order="F")
        out[d] = day.T  # (lat, lon)
    out[out >= TEMP_UNDEF - 1] = np.nan
    return out


def upsample_temp_to_rain(temp: np.ndarray) -> np.ndarray:
    """Bilinear upsample 1° temperature to 0.25° rainfall grid."""
    from numpy import linspace

    t_lons, t_lats = _lon_lat_axes(TEMP_META)
    r_lons, r_lats = _lon_lat_axes(RAIN_META)
    out = np.zeros((temp.shape[0], RAIN_LAT, RAIN_LON), dtype=np.float32)
    for d in range(temp.shape[0]):
        plane = temp[d]
        for i, lat in enumerate(r_lats):
            for j, lon in enumerate(r_lons):
                li = np.clip((lat - TEMP_LAT_START) / TEMP_RES, 0, TEMP_LAT - 1.001)
                lj = np.clip((lon - TEMP_LON_START) / TEMP_RES, 0, TEMP_LON - 1.001)
                i0, i1 = int(np.floor(li)), min(int(np.ceil(li)), TEMP_LAT - 1)
                j0, j1 = int(np.floor(lj)), min(int(np.ceil(lj)), TEMP_LON - 1)
                wi, wj = li - i0, lj - j0
                v = (
                    plane[i0, j0] * (1 - wi) * (1 - wj)
                    + plane[i0, j1] * (1 - wi) * wj
                    + plane[i1, j0] * wi * (1 - wj)
                    + plane[i1, j1] * wi * wj
                )
                out[d, i, j] = v
    return out


def crop_region(
    grid: np.ndarray,
    meta: GridMeta,
    bounds: tuple[float, float, float, float],
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Crop to (min_lon, min_lat, max_lon, max_lat). Returns data, lons, lats."""
    min_lon, min_lat, max_lon, max_lat = bounds
    lons, lats = _lon_lat_axes(meta)
    lon_mask = (lons >= min_lon) & (lons <= max_lon)
    lat_mask = (lats >= min_lat) & (lats <= max_lat)
    return grid[:, lat_mask][:, :, lon_mask], lons[lon_mask], lats[lat_mask]


REGIONS = {
    "western-ghats": {"name": "Western Ghats", "bounds": (73.5, 8.0, 78.5, 16.5), "center": (76.2, 12.5), "zoom": 6.2},
    "indo-gangetic": {"name": "Indo-Gangetic Plain", "bounds": (77.0, 22.0, 88.0, 31.0), "center": (82.5, 26.5), "zoom": 5.5},
    "deccan": {"name": "Deccan Plateau", "bounds": (73.0, 12.0, 83.0, 22.0), "center": (78.0, 17.5), "zoom": 5.8},
    "northeast": {"name": "Northeast India", "bounds": (89.0, 22.0, 97.5, 29.5), "center": (93.5, 26.0), "zoom": 6.0},
    "kerala": {"name": "Coastal Kerala", "bounds": (74.8, 8.0, 77.5, 12.5), "center": (76.3, 10.2), "zoom": 7.0},
}


def grid_to_geojson_points(
    rain: np.ndarray,
    temp: np.ndarray,
    lons: np.ndarray,
    lats: np.ndarray,
    day_idx: int,
) -> list[dict]:
    """Convert day slice to point list for frontend."""
    points = []
    r_slice = rain[day_idx] if rain.ndim == 3 else rain
    t_slice = temp[day_idx] if temp.ndim == 3 else temp
    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            rv = float(r_slice[i, j]) if not np.isnan(r_slice[i, j]) else 0.0
            tv = float(t_slice[i, j]) if not np.isnan(t_slice[i, j]) else 28.0
            points.append({
                "lng": float(lon),
                "lat": float(lat),
                "rainfall": max(0.0, rv),
                "lst": tv,
                "sst": 27.5 + 0.05 * (lat - 10),
                "windU": 2.0 * np.sin(np.radians(lat)),
                "windV": 1.5 * np.cos(np.radians(lon)),
            })
    return points
