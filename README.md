# AI4I 2020 Predictive Maintenance

An end-to-end ML project that predicts machine failures from live sensor telemetry, using the
AI4I 2020 Predictive Maintenance dataset. Built the same way, step by step, as the ML → FastAPI
workflow: explore and engineer features in a notebook, train and compare models, save the winning
pipeline, then serve it behind a FastAPI `/predict` endpoint.

## What's in here
- `ai4i2020.csv` — the raw dataset.
- `ml_pipeline.ipynb` — EDA, feature engineering, model comparison (Logistic Regression, Random
  Forest, XGBoost), and saving the final pipeline as `model.joblib`.
- `model.joblib` — the trained pipeline (preprocessing + Random Forest), ready to load and predict.
- `main.py` — the FastAPI backend that loads `model.joblib` and exposes a `/predict` endpoint.
- `streamlit_app.py` — a small dashboard for testing predictions through a UI instead of raw JSON.
- `requirements.txt` — everything needed to run the notebook, API, and dashboard.

## 1. Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Build the model (optional — `model.joblib` is already included)
Open `ml_pipeline.ipynb` and run it top to bottom. It loads `ai4i2020.csv`, engineers three
domain-specific features (temperature differential, power draw, wear-torque interaction),
trains and compares three models, and saves the winning pipeline to `model.joblib`.

## 3. Run the API
```bash
uvicorn main:app --reload
```
Visit `http://localhost:8000/docs` for the interactive Swagger UI, or POST directly to `/predict`:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
        "machine_type": "M",
        "air_temperature_k": 298.1,
        "process_temperature_k": 308.6,
        "rotational_speed_rpm": 1551,
        "torque_nm": 42.8,
        "tool_wear_min": 0
      }'
```
Response:
```json
{"failure_probability": 0.0, "predicted_failure": 0}
```

## Run with Docker (optional)
```bash
docker build -t predictive-maintenance-api .
docker run -p 8000:8000 predictive-maintenance-api
```
The image only bundles `main.py` and `model.joblib` — enough to serve `/predict`. The Streamlit
dashboard and notebook aren't included in the image; run those locally or containerize them
separately if needed.

## 4. Open the frontend
`index.html` + `style.css` + `script.js` are a plain static frontend — no build step, no server
needed beyond the API itself. Open `index.html` directly in a browser, or serve it with any
static host. Before deploying, update the `API_BASE` constant at the top of `script.js` to point
at your deployed API URL instead of `http://localhost:8000`.

This is the recommended frontend for a live deployment: it deploys as a static site (Netlify,
Vercel, GitHub Pages, Render static site) with no cold start, unlike the Streamlit dashboard below.


## Feature engineering (must match between notebook and `main.py`)
- `temp_diff` = Process temperature − Air temperature
- `power_w` = Torque × (Rotational speed × 2π / 60)
- `wear_torque_product` = Tool wear × Torque

## Next steps
Deploy `main.py` to a live URL (Render, Railway, Fly.io) and point the dashboard at it — this is
the piece most portfolio projects are missing.
