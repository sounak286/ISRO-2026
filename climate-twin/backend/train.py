"""Train AI surrogate on IMD rainfall + temperature grids."""
from sample_data import ensure_sample_data, load_fused_series
from model import train_model


def main():
    print("=== AI Digital Twin — Model Training ===")
    print("Data sources:")
    print("  - IMD 0.25° Rainfall: https://www.imdpune.gov.in/cmpg/Griddata/Rainfall_25_Bin.html")
    print("  - IMD 1.0° Max Temp:   https://www.imdpune.gov.in/cmpg/Griddata/Max_1_Bin.html")
    print("  - MOSDAC satellite:    https://www.mosdac.gov.in/")
    print()

    status = ensure_sample_data([2023, 2024])
    print("Data inventory:", status)
    print()

    rain, temp = load_fused_series([2023, 2024])
    print(f"Loaded fused series: rain {rain.shape}, temp {temp.shape}")

    metrics = train_model(rain, temp, epochs=15)
    print("\nTraining complete.")
    print(f"  RMSE Rainfall: {metrics['rmse_rainfall_mm']} mm")
    print(f"  RMSE Temperature: {metrics['rmse_temperature_c']} °C")


if __name__ == "__main__":
    main()
