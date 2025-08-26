from fastapi import FastAPI, HTTPException, Form, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
from typing import List
from statsmodels.tsa.arima.model import ARIMAResults
import logging
import pandas as pd
import sys
import os
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore', category=UserWarning, module='pandas')
warnings.filterwarnings('ignore', category=FutureWarning)

# Setting up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initializing FastAPI app
app = FastAPI(title="Drug Cost Forecasting API")

# Adding CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
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
    logger.info(f"First 10 drug names: {list(drug_models.keys())[:50]}")
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

# Column names
column_names = [
    'FORMULARY_ID', 'FORMULARY_VERSION', 'CONTRACT_YEAR', 'RXCUI', 'NDC',
    'TIER_LEVEL_VALUE', 'QUANTITY_LIMIT_YN', 'QUANTITY_LIMIT_AMOUNT',
    'QUANTITY_LIMIT_DAYS', 'PRIOR_AUTHORIZATION_YN', 'STEP_THERAPY_YN'
]

# --- Data Loading ---
# Verify file exists
csv_path = 'data/formulary.csv'
if not os.path.exists(csv_path):
    print(f"Error: '{csv_path}' not found in the current directory: {os.getcwd()}")
    sys.exit(1)

# Load data in chunks for memory efficiency
print("Loading formulary data in chunks...")
chunksize = 100000
df_list = []
try:
    # CORRECTED: Changed separator from pipe '|' to comma ',' to match the data format.
    # This is the key fix for the 'None' data issue.
    for chunk in pd.read_csv(csv_path, sep=',', dtype=str, header=None, names=column_names, chunksize=chunksize):
        if not chunk.empty:
            df_list.append(chunk)
except Exception as e:
    print(f"Error reading CSV: {e}")
    print("Please check if 'formulary.csv' is a standard comma-separated file.")
    sys.exit(1)

# Concatenate chunks into a single DataFrame
if df_list:
    formulary_df = pd.concat(df_list, ignore_index=True)
else:
    formulary_df = pd.DataFrame(columns=column_names)
    print("Warning: No data loaded from 'formulary.csv'. File may be empty or malformed.")

# --- Data Cleaning ---
# CRITICAL FIX: Replace pandas NaN values with None.
# pandas uses np.nan for missing values, which becomes `NaN` in the API response.
# JSON does not support `NaN`, but it does support `null`. `None` in Python becomes `null` in JSON.
formulary_df = formulary_df.replace({np.nan: None})

# Verify columns
if 'RXCUI' not in formulary_df.columns:
    print(f"Error: 'RXCUI' column not found. Available columns: {list(formulary_df.columns)}")
    sys.exit(1)

# Add placeholder drug_name (since RxNorm is not used)
formulary_df['drug_name'] = 'RXCUI: ' + formulary_df['RXCUI'].astype(str)

# Log data details
print(f"Data loaded: {len(formulary_df)} rows")
print(f"Unique FORMULARY_IDs found: {formulary_df['FORMULARY_ID'].unique().tolist()}")

# --- Helper Functions ---
def get_tier_string(tier_num):
    tier_map = {
        '1': 'Generic', '2': 'Preferred', '3': 'Non-Preferred',
        '4': 'Specialty', '5': 'Excluded'
    }
    return tier_map.get(tier_num, 'Unknown')

def get_tier_num(tier_str):
    tier_map = {
        'Preferred': '2', 'Non-Preferred': '3', 'Specialty': '4', 'Excluded': '5'
    }
    return tier_map.get(tier_str)

# --- API Endpoints ---
@app.get('/api/formulary')
async def get_formulary(search: str = Query(''), tier: str = Query('all'), pa: str = Query('all'), page: int = Query(1), limit: int = Query(50)):
    try:
        search = search.lower()
        filtered = formulary_df.copy()

        # Apply search filters
        if search:
            mask = (filtered['drug_name'].str.lower().str.contains(search, na=False) |
                    filtered['NDC'].str.contains(search, na=False) |
                    filtered['RXCUI'].str.contains(search, na=False))
            filtered = filtered[mask]

        # Apply tier filter
        if tier != 'all':
            tier_num = get_tier_num(tier)
            if tier_num:
                filtered = filtered[filtered['TIER_LEVEL_VALUE'] == tier_num]

        # Apply Prior Authorization filter
        if pa != 'all':
            pa_yn = 'Y' if pa == 'pa_required' else 'N'
            filtered = filtered[filtered['PRIOR_AUTHORIZATION_YN'] == pa_yn]

        # Paginate results
        total = len(filtered)
        start = (page - 1) * limit
        end = min(start + limit, total)
        data = filtered.iloc[start:end].to_dict(orient='records')

        # Format data for the frontend
        for row in data:
            row['tier'] = get_tier_string(row['TIER_LEVEL_VALUE'])
            row['pa_required'] = row['PRIOR_AUTHORIZATION_YN'] == 'Y'
            row['step_therapy'] = row['STEP_THERAPY_YN'] == 'Y'
            row['ndc'] = row['NDC']

        return {'data': data, 'total': total}
    except Exception as e:
        print(f"Error in /api/formulary: {e}")
        raise HTTPException(status_code=500, detail='Internal server error')

@app.get('/api/stats')
async def get_stats():
    try:
        total = len(formulary_df)
        pa = len(formulary_df[formulary_df['PRIOR_AUTHORIZATION_YN'] == 'Y']) if not formulary_df.empty else 0
        step = len(formulary_df[formulary_df['STEP_THERAPY_YN'] == 'Y']) if not formulary_df.empty else 0
        return {'total': total, 'pa': pa, 'step': step}
    except Exception as e:
        print(f"Error in /api/stats: {e}")
        raise HTTPException(status_code=500, detail='Internal server error')

# --- Configuration ---
# Update these paths to point to your model and data files
INTERACTION_MODEL_FILEPATH = "data/drug_interaction_model (1).pkl"
GROUPING_MODEL_FILEPATH = "data/drug_grouping_model.pkl"
DATA_FILEPATH = "data/test002.csv"

# Global variables to hold the loaded models and dataframe
ml_pipeline = None
grouping_model = None
recommendation_df = None

# -------------------------------
# Core Application Logic (Adapted from analyzer script)
# -------------------------------

def load_models(inter_filepath=INTERACTION_MODEL_FILEPATH, group_filepath=GROUPING_MODEL_FILEPATH):
    """
    Loads the pre-trained models from pickle files.
    """
    global ml_pipeline, grouping_model
    try:
        with open(inter_filepath, 'rb') as f:
            ml_pipeline = pickle.load(f)
        with open(group_filepath, 'rb') as f:
            grouping_model = pickle.load(f)
        print("✅ Pre-trained models loaded successfully.")
        return True
    except FileNotFoundError:
        print(f"❌ ERROR: Model file not found. Please run the training script first.")
        return False
    except Exception as e:
        print(f"❌ An error occurred while loading the models: {e}")
        return False

def load_and_clean_data(filepath):
    """
    Loads and cleans the dataset for the application to use.
    """
    try:
        df_loaded = pd.read_csv(filepath)
        df_loaded.columns = df_loaded.columns.str.strip()
        # Clean numeric columns with commas and currency symbols
        numeric_cols = ['pmpm_cost', 'avg_age', 'total_prescription_fills', 'total_drug_cost', 'member_count', 'Repeat_Utilization']
        for col in numeric_cols:
            if col in df_loaded.columns:
                df_loaded[col] = pd.to_numeric(
                    df_loaded[col].astype(str).str.replace('$', '', regex=False).str.replace(',', ''),
                    errors='coerce'
                )
        for col in ['drug_name', 'generic_name']:
            if col in df_loaded.columns:
                df_loaded[col] = df_loaded[col].astype(str).str.strip().str.upper().replace('NAN', np.nan)
        df_loaded['therapeutic_equivalence_code'].fillna('NA', inplace=True)
        df_loaded['drug_interactions'].fillna('No interaction data', inplace=True)
        # Drop rows where essential data is missing
        df_loaded.dropna(subset=['drug_name', 'generic_name', 'pmpm_cost', 'therapeutic_class'], inplace=True)
        print("✅ Dataset loaded and cleaned successfully.")
        return df_loaded
    except FileNotFoundError:
        print(f"❌ ERROR: The file '{filepath}' was not found.")
        return None
    except Exception as e:
        print(f"❌ An error occurred while loading the data: {e}")
        return None

def check_interaction_with_ml(drug1_info, drug2_info):
    """
    Uses the loaded interaction model to classify risk, with combined text for context.
    """
    if not ml_pipeline:
        return "Warning", "ML model is not available."
    interaction_text = "No interaction data"
    source_drug_for_prediction = None
    if str(drug2_info['generic_name']).lower() in str(drug1_info['drug_interactions']).lower():
        interaction_text = str(drug1_info['drug_interactions'])
        source_drug_for_prediction = drug1_info
    elif str(drug1_info['generic_name']).lower() in str(drug2_info['drug_interactions']).lower():
        interaction_text = str(drug2_info['drug_interactions'])
        source_drug_for_prediction = drug2_info
    else:
        return None
    # Combine text for prediction (matches training)
    combined_text = f"{source_drug_for_prediction['drug_name']} {source_drug_for_prediction['generic_name']} {interaction_text}"
    prediction_df = pd.DataFrame([{
        'combined_text': combined_text,
        'pmpm_cost': source_drug_for_prediction['pmpm_cost'],
        'avg_age': source_drug_for_prediction['avg_age']
    }])
    predicted_risk = ml_pipeline.predict(prediction_df)[0]
    full_description = f"DRUG INTERACTION FOUND in '{source_drug_for_prediction['drug_name']}' data: {interaction_text}"
    return predicted_risk, full_description

def get_cluster(drug_info):
    """
    Predicts the cluster for a drug using the grouping model.
    """
    if not grouping_model:
        return None
    input_df = pd.DataFrame([drug_info])
    X = grouping_model['preprocessor'].transform(input_df[['generic_name', 'therapeutic_class', 'pmpm_cost', 'avg_age']])
    return grouping_model['kmeans'].predict(X)[0]

def find_cost_effective_alternative(df_all, drug_info, generic_name):
    """
    Finds the most cost-effective alternative using learned clusters (approximates rules).
    """
    drug_info = dict(drug_info)
    if pd.isna(generic_name) or generic_name == 'NA':
        print(f"  - Generic name for '{drug_info['drug_name']}' is missing. Cannot find alternatives.")
        return drug_info
    if drug_info['therapeutic_equivalence_code'] == 'NA':
        print(f"  - Original drug '{drug_info['drug_name']}' has TE code 'NA'. No alternative can be provided.")
        return drug_info
    cluster = get_cluster(drug_info)
    if cluster is None:
        return drug_info
    alternatives = df_all[
        (df_all['cluster'] == cluster) &
        (df_all['therapeutic_equivalence_code'] != 'NA')
    ].dropna(subset=['pmpm_cost'])
    if alternatives.empty: return drug_info
    return alternatives.sort_values('pmpm_cost').iloc[0].to_dict()

def find_safe_and_cost_effective_pair(df_all, drug1_info, generic1, drug2_info, generic2):
    """
    Finds the cheapest pair using learned clusters, with ML-predicted risks.
    """
    drug1_info = dict(drug1_info)
    drug2_info = dict(drug2_info)
    alts1 = pd.DataFrame([drug1_info])
    alts2 = pd.DataFrame([drug2_info])
    if pd.notna(generic1) and drug1_info['therapeutic_equivalence_code'] != 'NA':
        cluster1 = get_cluster(drug1_info)
        if cluster1 is not None:
            alts1 = df_all[
                (df_all['cluster'] == cluster1) &
                (df_all['therapeutic_equivalence_code'] != 'NA')
            ].sort_values('pmpm_cost').dropna(subset=['pmpm_cost'])
            if alts1.empty:
                alts1 = pd.DataFrame([drug1_info])
    else:
        print(f"  - Drug 1 '{drug1_info['drug_name']}' has TE code 'NA' or invalid generic. Using original.")
    if pd.notna(generic2) and drug2_info['therapeutic_equivalence_code'] != 'NA':
        cluster2 = get_cluster(drug2_info)
        if cluster2 is not None:
            alts2 = df_all[
                (df_all['cluster'] == cluster2) &
                (df_all['therapeutic_equivalence_code'] != 'NA')
            ].sort_values('pmpm_cost').dropna(subset=['pmpm_cost'])
            if alts2.empty:
                alts2 = pd.DataFrame([drug2_info])
    else:
        print(f"  - Drug 2 '{drug2_info['drug_name']}' has TE code 'NA' or invalid generic. Using original.")
    print("  - Searching for the cheapest, non-interacting combination using the pre-trained model...")
    for _, alt1 in alts1.iterrows():
        for _, alt2 in alts2.iterrows():
            interaction_result = check_interaction_with_ml(alt1.to_dict(), alt2.to_dict())
            if interaction_result is None or interaction_result[0] == "Low Risk":
                print("  - Found a safe and cost-effective pair.")
                return alt1.to_dict(), alt2.to_dict()
    print("  - ⚠️ Warning: Could not find any combination without a potential interaction.")
    return alts1.iloc[0].to_dict(), alts2.iloc[0].to_dict()

# Add cluster prediction to df after loading
def add_clusters_to_df(df_loaded):
    df_loaded['cluster'] = np.nan
    valid_rows = df_loaded[['generic_name', 'therapeutic_class', 'pmpm_cost', 'avg_age']].dropna().index
    if not valid_rows.empty:
        X = grouping_model['preprocessor'].transform(df_loaded.loc[valid_rows])
        df_loaded.loc[valid_rows, 'cluster'] = grouping_model['kmeans'].predict(X)
    return df_loaded

# -------------------------------
# Helper Function for API Response
# -------------------------------
def clean_nan_for_json(obj):
    """Recursively converts NaN values to None for JSON compatibility."""
    if isinstance(obj, list):
        return [clean_nan_for_json(v) for v in obj]
    elif isinstance(obj, dict):
        return {k: clean_nan_for_json(v) for k, v in obj.items()}
    elif pd.isna(obj):
        return None
    return obj

# -------------------------------
# Flask API Endpoints
# -------------------------------

@app.get('/api/drugs')
async def get_drug_names():
    """Provides the list of all unique drug names and their generic names."""
    if recommendation_df is None:
        raise HTTPException(status_code=500, detail='Dataset not loaded')
    drugs_list = recommendation_df.drop_duplicates(subset=['drug_name']).to_dict('records')
    return {'drugs': clean_nan_for_json(drugs_list), 'total_count': len(drugs_list)}

@app.get('/api/drug-stats')
async def get_drug_stats():
    """Provides key metrics for KPI cards on a dashboard."""
    if recommendation_df is None:
        raise HTTPException(status_code=500, detail='Dataset not loaded')
    
    try:
        stats = {
            'total_drugs': int(recommendation_df['drug_name'].nunique()),
            'avg_pmpm_cost': round(recommendation_df['pmpm_cost'].mean(), 2),
            'therapeutic_classes': int(recommendation_df['therapeutic_class'].nunique()),
            'total_prescriptions': int(recommendation_df['total_prescription_fills'].sum()) if 'total_prescription_fills' in recommendation_df.columns and not recommendation_df['total_prescription_fills'].isnull().all() else 0
        }
        return stats
    except Exception as e:
        print(f"❌ ERROR inside /api/drug-stats endpoint: {e}")
        raise HTTPException(status_code=500, detail='An internal error occurred while calculating stats.')

@app.post('/api/recommend')
async def get_recommendations(request: Request):
    """The main recommendation endpoint, using the specified logic."""
    if ml_pipeline is None or grouping_model is None or recommendation_df is None:
        raise HTTPException(status_code=500, detail='Models or dataset not loaded')
    
    data = await request.json()
    drug_names = [name.strip().upper() for name in data.get('drug_names', [])]
    
    if not drug_names:
        raise HTTPException(status_code=400, detail='No drug names provided')

    # Find the drug info from the dataframe. We take the first match for each name.
    original_drugs_info = []
    selected_generics = []
    for name in drug_names:
        info_df = recommendation_df[recommendation_df['drug_name'] == name]
        if not info_df.empty:
            info = info_df.iloc[0].to_dict()
            original_drugs_info.append(info)
            selected_generics.append(info['generic_name'])

    if len(original_drugs_info) != len(drug_names):
        found_names = [d['drug_name'] for d in original_drugs_info]
        not_found = [name for name in drug_names if name not in found_names]
        raise HTTPException(status_code=404, detail=f"Could not find data for drug(s): {', '.join(not_found)}")

    recommended_drugs = []
    analysis = {}

    # Check if two drugs have the same generic name
    if len(original_drugs_info) >= 2:
        if selected_generics[0] == selected_generics[1] and pd.notna(selected_generics[0]):
            raise HTTPException(status_code=400, detail=f"Both drugs have the same generic name ({selected_generics[0]}). It is not recommended combination.")

    if len(original_drugs_info) == 1:
        drug_orig = original_drugs_info[0]
        generic_name = selected_generics[0]
        
        drug_rec = find_cost_effective_alternative(recommendation_df, drug_orig, generic_name)
        recommended_drugs.append(drug_rec)
        
        cost_saving = drug_orig['pmpm_cost'] - drug_rec['pmpm_cost']
        percentage_saving = (cost_saving / drug_orig['pmpm_cost']) * 100 if drug_orig['pmpm_cost'] > 0 else 0
        
        analysis = {
            'type': 'single_drug',
            'cost_saving_per_member': cost_saving,
            'percentage_saving': percentage_saving
        }

    elif len(original_drugs_info) >= 2:
        drug1_orig, drug2_orig = original_drugs_info[0], original_drugs_info[1]
        generic1, generic2 = selected_generics[0], selected_generics[1]
        
        # Check interaction for the original pair
        original_interaction = check_interaction_with_ml(drug1_orig, drug2_orig)
        
        # Find the best recommended pair
        drug1_rec, drug2_rec = find_safe_and_cost_effective_pair(
            recommendation_df, drug1_orig, generic1, drug2_orig, generic2
        )
        recommended_drugs.extend([drug1_rec, drug2_rec])
        
        # Check interaction for the recommended pair
        final_interaction = check_interaction_with_ml(drug1_rec, drug2_rec)
        
        total_orig_cost = drug1_orig['pmpm_cost'] + drug2_orig['pmpm_cost']
        total_rec_cost = drug1_rec['pmpm_cost'] + drug2_rec['pmpm_cost']
        total_saving = total_orig_cost - total_rec_cost
        percentage_saving = (total_saving / total_orig_cost) * 100 if total_orig_cost > 0 else 0
        
        analysis = {
            'type': 'combination',
            'total_cost_saving': total_saving,
            'percentage_saving': percentage_saving,
            'original_interaction': {
                'risk_label': original_interaction[0] if original_interaction else "No Interaction",
                'description': original_interaction[1] if original_interaction else "No interaction found in data."
            },
            'recommended_interaction': {
                'risk_label': final_interaction[0] if final_interaction else "No Interaction",
                'description': final_interaction[1] if final_interaction else "This combination is considered safe (no interaction found)."
            }
        }
    
    response = {
        'original_drugs': original_drugs_info,
        'recommended_drugs': recommended_drugs,
        'analysis': analysis
    }
    
    # Clean up any NaN/NaT values before sending JSON
    return clean_nan_for_json(response)

# -------------------------------
# Server Initialization
# -------------------------------
if __name__ == '__main__':
    print("🚀 Starting Drug Recommendation Server...")
    
    if not os.path.exists('data'):
        os.makedirs('data')
        print("Created 'data' directory. Please place your models and CSV file there.")
        
    # Load models and data
    load_models()
    df_temp = load_and_clean_data(DATA_FILEPATH)
    if df_temp is not None:
        recommendation_df = add_clusters_to_df(df_temp)
    
    if ml_pipeline is not None and grouping_model is not None and recommendation_df is not None:
        print("✅ Server ready to accept requests!")
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        print("❌ Server failed to initialize. Please check file paths and errors.")