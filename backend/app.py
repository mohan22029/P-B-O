from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
from typing import List
from statsmodels.tsa.arima.model import ARIMAResults
import logging

# Setting up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initializing FastAPI app
app = FastAPI(title="Drug Cost Forecasting API")

# Adding CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Loading pre-trained ARIMA models
drug_models = {}
try:
    with open("data/time_series_forecast_drugs.pkl", "rb") as f:
        drug_models = pickle.load(f)
    logger.info(f"Loaded {len(drug_models)} drug models from time_series_forecast_drugs.pkl")
    logger.info(f"First 10 drug names: {list(drug_models.keys())[:10]}")
except FileNotFoundError:
    logger.error("time_series_forecast_drugs.pkl not found. Please run generate_models.py to create it.")
except Exception as e:
    logger.error(f"Error loading time_series_forecast_drugs.pkl: {str(e)}")

# Defining response models
class ForecastResponse(BaseModel):
    drug_name: str
    years: List[str]
    forecast: List[float]
    pmpm_cost: List[float]
    confidence_lower: List[float]
    confidence_upper: List[float]

# Endpoint to get list of available drugs
@app.get("/drugs", response_model=List[str])
async def get_drugs():
    if not drug_models:
        raise HTTPException(
            status_code=500,
            detail="No drug models available. Ensure time_series_forecast_drugs.pkl exists in the backend directory or run generate_models.py to create it."
        )
    return list(drug_models.keys())

# Endpoint to generate forecast for a specific drug
@app.post("/forecast", response_model=ForecastResponse)
async def forecast(drug_name: str = Form(...), steps: int = Form(90)):
    logger.info(f"Received forecast request: drug_name='{drug_name}', steps={steps}")
    if not drug_name or not isinstance(drug_name, str):
        logger.error(f"Invalid drug_name: {drug_name}")
        raise HTTPException(status_code=422, detail="drug_name must be a non-empty string")
    if drug_name not in drug_models:
        logger.error(f"Drug not found: {drug_name}")
        raise HTTPException(status_code=404, detail=f"Drug '{drug_name}' not found in models")
    
    try:
        model: ARIMAResults = drug_models[drug_name]
        # Generating forecast and confidence intervals
        forecast_result = model.get_forecast(steps=steps)
        forecast_values = forecast_result.predicted_mean
        conf_int = forecast_result.conf_int(alpha=0.05)  # 95% confidence interval
        
        # Calculating PMPM costs
        pmpm_costs = forecast_values / 12
        
        logger.info(f"Generated forecast for {drug_name} with {steps} steps")
        return {
            "drug_name": drug_name,
            "years": [f"Year +{i+1}" for i in range(steps)],
            "forecast": forecast_values.tolist(),
            "pmpm_cost": pmpm_costs.tolist(),
            "confidence_lower": conf_int.iloc[:, 0].tolist(),
            "confidence_upper": conf_int.iloc[:, 1].tolist()
        }
    except Exception as e:
        logger.error(f"Error generating forecast for {drug_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating forecast for {drug_name}: {str(e)}")

# Running the app (for development)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)