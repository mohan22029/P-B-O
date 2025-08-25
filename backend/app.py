# main.py (FastAPI backend)
from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pickle
from statsmodels.tsa.arima.model import ARIMAResults
import numpy as np
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Load trained models
with open("time_series_forecast_drugs.pkl", "rb") as f:
    drug_models: dict[str, ARIMAResults] = pickle.load(f)

# For serving React build (assuming build folder)
app.mount("/static", StaticFiles(directory="build/static"), name="static")
templates = Jinja2Templates(directory="build")

class ForecastRequest(BaseModel):
    drug: str
    steps: int = 5

@app.get("/")
async def index():
    return templates.TemplateResponse("index.html", {"request": {}})

@app.post("/forecast")
async def forecast(drug: str = Form(...), steps: int = Form(5)):
    if drug not in drug_models:
        return JSONResponse({"error": f"{drug} not found."}, status_code=404)

    model = drug_models[drug]
    forecast_obj = model.get_forecast(steps=steps)
    forecast_values = forecast_obj.predicted_mean
    conf_int = forecast_obj.conf_int()

    pmpm_costs = forecast_values / 12

    historical = model.data.orig_endog
    historical_list = historical.tolist()
    hist_years = [str(year) for year in range(2019, 2019 + len(historical_list))]

    forecast_years = [str(int(hist_years[-1]) + i + 1) for i in range(steps)]

    return {
        "drug": drug,
        "historical_years": hist_years,
        "historical_spending": historical_list,
        "forecast_years": forecast_years,
        "forecast": forecast_values.tolist(),
        "pmpm_cost": pmpm_costs.tolist(),
        "confidence_lower": conf_int.iloc[:, 0].tolist(),
        "confidence_upper": conf_int.iloc[:, 1].tolist()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)