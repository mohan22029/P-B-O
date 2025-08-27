# main.py
"""
This script combines four separate Python backend applications into a single, runnable file.
This version ensures ALL original API endpoint URLs are preserved without any changes or prefixes.

- Original app.py (FastAPI): Drug cost forecasting.
- Original form.py (Flask): Formulary data handler.
- Original server.py (Flask): Drug recommendation and interaction engine.
- NEW cia.py (Flask): Cost Impact Analysis logger and summarizer.

The Flask applications are converted to Blueprints and registered on a single Flask app,
which is then mounted onto the main FastAPI server at the root path.

To run this server, execute:
pip install "fastapi[all]" "uvicorn[standard]" flask flask-cors pandas numpy statsmodels scikit-learn
python main.py
"""

# ==============================================================================
# 1. COMBINED IMPORTS
# ==============================================================================

# General & System Imports
import pickle
import numpy as np
import pandas as pd
import logging
import sys
import os
import warnings
from typing import List
import sqlite3 ### NEW ###
from datetime import datetime ### NEW ###

# FastAPI Imports
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.wsgi import WSGIMiddleware
from pydantic import BaseModel
import uvicorn

# Flask Imports
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS as FlaskCORS

# Machine Learning & Stats Imports
from statsmodels.tsa.arima.model import ARIMAResults
from sklearn.metrics.pairwise import cosine_similarity

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore', category=UserWarning, module='pandas')
warnings.filterwarnings('ignore', category=FutureWarning)


# ==============================================================================
# 2. FORECASTING API (from app.py - FastAPI)
# ==============================================================================

# Setting up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initializing FastAPI app (This is the main application)
app = FastAPI(title="Combined Drug Analytics API")

# Loading pre-trained ARIMA models
drug_models = {}
try:
    with open("data/time_series_forecast_drugs.pkl", "rb") as f:
        drug_models = pickle.load(f)
    logger.info(f"Loaded {len(drug_models)} drug models from time_series_forecast_drugs.pkl")
except FileNotFoundError:
    logger.error("time_series_forecast_drugs.pkl not found. Please ensure it is in the 'data' directory.")
except Exception as e:
    logger.error(f"Error loading time_series_forecast_drugs.pkl: {str(e)}")

# Defining FastAPI response models
class ForecastResponse(BaseModel):
    drug_name: str
    years: List[str]
    forecast: List[float]
    pmpm_cost: List[float]
    confidence_lower: List[float]
    confidence_upper: List[float]

# Endpoint to get list of available drugs for forecasting
@app.get("/drugs", response_model=List[str], tags=["Forecasting API"])
async def get_drugs():
    if not drug_models:
        raise HTTPException(
            status_code=500,
            detail="No drug models available. Ensure time_series_forecast_drugs.pkl exists in the 'data' directory."
        )
    return list(drug_models.keys())

# Endpoint to generate forecast for a specific drug
@app.post("/forecast", response_model=ForecastResponse, tags=["Forecasting API"])
async def forecast(drug_name: str = Form(...), steps: int = Form(90)):
    logger.info(f"Received forecast request: drug_name='{drug_name}', steps={steps}")
    if not drug_name or not isinstance(drug_name, str):
        logger.error(f"Invalid drug_name: {drug_name}")
        raise HTTPException(status_code=422, detail="drug_name must be a non-empty string")
    if drug_name not in drug_models:
        logger.error(f"Drug not found for forecasting: {drug_name}")
        raise HTTPException(status_code=404, detail=f"Drug '{drug_name}' not found in forecast models")
    
    try:
        model: ARIMAResults = drug_models[drug_name]
        forecast_result = model.get_forecast(steps=steps)
        forecast_values = forecast_result.predicted_mean
        conf_int = forecast_result.conf_int(alpha=0.05)
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


# ==============================================================================
# 3. FORMULARY API (from form.py - Now a Flask Blueprint)
# ==============================================================================

# Create a Blueprint instead of a full Flask App
form_bp = Blueprint('form_bp', __name__)

# --- Data Loading for Formulary App ---
df_formulary = pd.DataFrame() 
formulary_column_names = [
    'FORMULARY_ID', 'FORMULARY_VERSION', 'CONTRACT_YEAR', 'RXCUI', 'NDC',
    'TIER_LEVEL_VALUE', 'QUANTITY_LIMIT_YN', 'QUANTITY_LIMIT_AMOUNT',
    'QUANTITY_LIMIT_DAYS', 'PRIOR_AUTHORIZATION_YN', 'STEP_THERAPY_YN'
]
formulary_csv_path = 'data/formulary.csv'

if not os.path.exists(formulary_csv_path):
    print(f"Error: '{formulary_csv_path}' not found. Formulary API will not work.")
else:
    print("Loading formulary data in chunks...")
    chunksize = 100000
    df_list = []
    try:
        for chunk in pd.read_csv(formulary_csv_path, sep=',', dtype=str, header=None, names=formulary_column_names, chunksize=chunksize):
            if not chunk.empty:
                df_list.append(chunk)
        
        if df_list:
            df_formulary = pd.concat(df_list, ignore_index=True)
            df_formulary = df_formulary.replace({np.nan: None})
            df_formulary['drug_name'] = 'RXCUI: ' + df_formulary['RXCUI'].astype(str)
            print(f"Formulary data loaded: {len(df_formulary)} rows")
        else:
            print("Warning: No data loaded from 'formulary.csv'. File may be empty or malformed.")
            df_formulary = pd.DataFrame(columns=formulary_column_names)

    except Exception as e:
        print(f"Error reading formulary.csv: {e}")
        df_formulary = pd.DataFrame(columns=formulary_column_names)

# --- Helper Functions for Formulary App ---
def get_tier_string(tier_num):
    tier_map = {'1': 'Generic', '2': 'Preferred', '3': 'Non-Preferred', '4': 'Specialty', '5': 'Excluded'}
    return tier_map.get(tier_num, 'Unknown')

def get_tier_num(tier_str):
    tier_map = {'Preferred': '2', 'Non-Preferred': '3', 'Specialty': '4', 'Excluded': '5'}
    return tier_map.get(tier_str)

# --- API Endpoints for Formulary App (attached to the Blueprint) ---
@form_bp.route('/api/formulary', methods=['GET'])
def get_formulary():
    try:
        search = request.args.get('search', '').lower()
        tier = request.args.get('tier', 'all')
        pa = request.args.get('pa', 'all')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))

        filtered = df_formulary.copy()

        if search:
            mask = (filtered['drug_name'].str.lower().str.contains(search, na=False) |
                    filtered['NDC'].str.contains(search, na=False) |
                    filtered['RXCUI'].str.contains(search, na=False))
            filtered = filtered[mask]

        if tier != 'all':
            tier_num = get_tier_num(tier)
            if tier_num:
                filtered = filtered[filtered['TIER_LEVEL_VALUE'] == tier_num]

        if pa != 'all':
            pa_yn = 'Y' if pa == 'pa_required' else 'N'
            filtered = filtered[filtered['PRIOR_AUTHORIZATION_YN'] == pa_yn]

        total = len(filtered)
        start = (page - 1) * limit
        end = min(start + limit, total)
        data = filtered.iloc[start:end].to_dict(orient='records')

        for row in data:
            row['tier'] = get_tier_string(row['TIER_LEVEL_VALUE'])
            row['pa_required'] = row['PRIOR_AUTHORIZATION_YN'] == 'Y'
            row['step_therapy'] = row['STEP_THERAPY_YN'] == 'Y'
            row['ndc'] = row['NDC']

        return jsonify({'data': data, 'total': total})
    except Exception as e:
        print(f"Error in /api/formulary: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@form_bp.route('/api/stats', methods=['GET'])
def get_formulary_stats():
    try:
        total = len(df_formulary)
        pa = len(df_formulary[df_formulary['PRIOR_AUTHORIZATION_YN'] == 'Y']) if not df_formulary.empty else 0
        step = len(df_formulary[df_formulary['STEP_THERAPY_YN'] == 'Y']) if not df_formulary.empty else 0
        return jsonify({'total': total, 'pa': pa, 'step': step})
    except Exception as e:
        print(f"Error in /api/stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ==============================================================================
# 4. RECOMMENDATION API (from server.py - Now a Flask Blueprint)
# ==============================================================================

# Create another Blueprint
recommend_bp = Blueprint('recommend_bp', __name__)

# --- Configuration for Recommendation App ---
INTERACTION_MODEL_FILEPATH = "data/drug_interaction_model (1).pkl"
GROUPING_MODEL_FILEPATH = "data/drug_grouping_model.pkl"
EFFICACY_MODEL_FILEPATH = "data/clinical_efficacy_model.pkl"
DATA_FILEPATH = "data/test002.csv"

# Global variables for the recommendation app
ml_pipeline = None
grouping_model = None
efficacy_model = None
df_recommend = None

# --- Helper Functions for Recommendation App (Identical to original) ---
def load_recommendation_models(inter_filepath=INTERACTION_MODEL_FILEPATH, group_filepath=GROUPING_MODEL_FILEPATH, efficacy_filepath=EFFICACY_MODEL_FILEPATH):
    global ml_pipeline, grouping_model, efficacy_model
    try:
        with open(inter_filepath, 'rb') as f: ml_pipeline = pickle.load(f)
        with open(group_filepath, 'rb') as f: grouping_model = pickle.load(f)
        with open(efficacy_filepath, 'rb') as f: efficacy_model = pickle.load(f)
        print("✅ All pre-trained recommendation models loaded successfully.")
        return True
    except FileNotFoundError as e:
        print(f"❌ ERROR: Recommendation model file not found: {e}. Recommendation API will not work.")
        return False
    except Exception as e:
        print(f"❌ An error occurred while loading the recommendation models: {e}")
        return False

def load_and_clean_recommendation_data(filepath):
    try:
        df_loaded = pd.read_csv(filepath)
        df_loaded.columns = df_loaded.columns.str.strip()
        numeric_cols = ['pmpm_cost', 'avg_age', 'total_prescription_fills', 'total_drug_cost', 'member_count', 'Repeat_Utilization']
        for col in numeric_cols:
            if col in df_loaded.columns:
                df_loaded[col] = pd.to_numeric(df_loaded[col].astype(str).str.replace('$', '', regex=False).str.replace(',', ''), errors='coerce')
        for col in ['drug_name', 'generic_name']:
            if col in df_loaded.columns:
                df_loaded[col] = df_loaded[col].astype(str).str.strip().str.upper().replace('NAN', np.nan)
        df_loaded['therapeutic_equivalence_code'].fillna('NA', inplace=True)
        df_loaded['drug_interactions'].fillna('No interaction data', inplace=True)
        df_loaded['clinical_efficacy'].fillna('No efficacy data available', inplace=True)
        df_loaded.dropna(subset=['drug_name', 'generic_name', 'pmpm_cost', 'therapeutic_class'], inplace=True)
        print("✅ Recommendation dataset loaded and cleaned successfully.")
        return df_loaded
    except FileNotFoundError:
        print(f"❌ ERROR: The recommendation data file '{filepath}' was not found. Recommendation API will not work.")
        return None
    except Exception as e:
        print(f"❌ An error occurred while loading the recommendation data: {e}")
        return None

def find_clinical_efficacy_alternatives(drug_info, top_n=3):
    if not efficacy_model: return []
    try:
        target_generic = drug_info['generic_name']
        target_therapeutic_class = drug_info['therapeutic_class']
        target_efficacy = str(drug_info.get('clinical_efficacy', 'No efficacy data available'))
        efficacy_data = efficacy_model['drug_data']
        candidates = efficacy_data[
            (efficacy_data['generic_name'] == target_generic) &
            (efficacy_data['therapeutic_class'] == target_therapeutic_class) &
            (efficacy_data['drug_name'] != drug_info['drug_name'])
        ].copy()
        if candidates.empty: return []
        target_tfidf = efficacy_model['tfidf_vectorizer'].transform([target_efficacy])
        target_nmf = efficacy_model['nmf_model'].transform(target_tfidf)
        target_lda = efficacy_model['lda_model'].transform(target_tfidf)
        target_combined = 0.6 * target_nmf + 0.4 * target_lda
        similarities = []
        for idx, candidate in candidates.iterrows():
            candidate_efficacy = str(candidate['clinical_efficacy'])
            candidate_tfidf = efficacy_model['tfidf_vectorizer'].transform([candidate_efficacy])
            candidate_nmf = efficacy_model['nmf_model'].transform(candidate_tfidf)
            candidate_lda = efficacy_model['lda_model'].transform(candidate_tfidf)
            candidate_combined = 0.6 * candidate_nmf + 0.4 * candidate_lda
            similarity = cosine_similarity(target_combined, candidate_combined)[0][0]
            similarities.append({
                'drug_info': candidate.to_dict(),
                'efficacy_similarity': similarity,
                'cost_difference': candidate['pmpm_cost'] - drug_info['pmpm_cost']
            })
        similarities.sort(key=lambda x: (-x['efficacy_similarity'], x['drug_info']['pmpm_cost']))
        return similarities[:top_n]
    except Exception as e:
        print(f"❌ Error in clinical efficacy recommendation: {e}")
        return []

def check_interaction_with_ml(drug1_info, drug2_info):
    if not ml_pipeline: return "Warning", "ML model is not available."
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
    combined_text = f"{source_drug_for_prediction['drug_name']} {source_drug_for_prediction['generic_name']} {interaction_text}"
    prediction_df = pd.DataFrame([{'combined_text': combined_text, 'pmpm_cost': source_drug_for_prediction['pmpm_cost'], 'avg_age': source_drug_for_prediction['avg_age']}])
    predicted_risk = ml_pipeline.predict(prediction_df)[0]
    full_description = f"DRUG INTERACTION FOUND in '{source_drug_for_prediction['drug_name']}' data: {interaction_text}"
    return predicted_risk, full_description

def get_cluster(drug_info):
    if not grouping_model: return None
    input_df = pd.DataFrame([drug_info])
    X = grouping_model['preprocessor'].transform(input_df[['generic_name', 'therapeutic_class', 'pmpm_cost', 'avg_age']])
    return grouping_model['kmeans'].predict(X)[0]

def find_cost_effective_alternative(df_all, drug_info, generic_name):
    drug_info = dict(drug_info)
    if pd.isna(generic_name) or generic_name == 'NA' or drug_info['therapeutic_equivalence_code'] == 'NA':
        return drug_info
    cluster = get_cluster(drug_info)
    if cluster is None: return drug_info
    alternatives = df_all[(df_all['cluster'] == cluster) & (df_all['therapeutic_equivalence_code'] != 'NA')].dropna(subset=['pmpm_cost'])
    if alternatives.empty: return drug_info
    return alternatives.sort_values('pmpm_cost').iloc[0].to_dict()

def find_safe_and_cost_effective_pair(df_all, drug1_info, generic1, drug2_info, generic2):
    drug1_info, drug2_info = dict(drug1_info), dict(drug2_info)
    alts1, alts2 = pd.DataFrame([drug1_info]), pd.DataFrame([drug2_info])
    if pd.notna(generic1) and drug1_info['therapeutic_equivalence_code'] != 'NA':
        cluster1 = get_cluster(drug1_info)
        if cluster1 is not None:
            alts1 = df_all[(df_all['cluster'] == cluster1) & (df_all['therapeutic_equivalence_code'] != 'NA')].sort_values('pmpm_cost').dropna(subset=['pmpm_cost'])
            if alts1.empty: alts1 = pd.DataFrame([drug1_info])
    if pd.notna(generic2) and drug2_info['therapeutic_equivalence_code'] != 'NA':
        cluster2 = get_cluster(drug2_info)
        if cluster2 is not None:
            alts2 = df_all[(df_all['cluster'] == cluster2) & (df_all['therapeutic_equivalence_code'] != 'NA')].sort_values('pmpm_cost').dropna(subset=['pmpm_cost'])
            if alts2.empty: alts2 = pd.DataFrame([drug2_info])
    for _, alt1 in alts1.iterrows():
        for _, alt2 in alts2.iterrows():
            interaction_result = check_interaction_with_ml(alt1.to_dict(), alt2.to_dict())
            if interaction_result is None or interaction_result[0] == "Low Risk":
                return alt1.to_dict(), alt2.to_dict()
    return alts1.iloc[0].to_dict(), alts2.iloc[0].to_dict()

def add_clusters_to_df(df_loaded):
    if grouping_model is None or 'preprocessor' not in grouping_model: return df_loaded
    df_loaded['cluster'] = np.nan
    valid_rows = df_loaded[['generic_name', 'therapeutic_class', 'pmpm_cost', 'avg_age']].dropna().index
    if not valid_rows.empty:
        X = grouping_model['preprocessor'].transform(df_loaded.loc[valid_rows])
        df_loaded.loc[valid_rows, 'cluster'] = grouping_model['kmeans'].predict(X)
    return df_loaded

def clean_nan_for_json(obj):
    if isinstance(obj, list): return [clean_nan_for_json(v) for v in obj]
    elif isinstance(obj, dict): return {k: clean_nan_for_json(v) for k, v in obj.items()}
    elif pd.isna(obj): return None
    return obj

# --- API Endpoints for Recommendation App (attached to the Blueprint) ---
@recommend_bp.route('/api/drugs', methods=['GET'])
def get_recommendation_drug_names():
    if df_recommend is None: return jsonify({'error': 'Recommendation dataset not loaded'}), 500
    drugs_list = df_recommend.drop_duplicates(subset=['drug_name']).to_dict('records')
    return jsonify({'drugs': clean_nan_for_json(drugs_list), 'total_count': len(drugs_list)})

@recommend_bp.route('/api/drug-stats', methods=['GET'])
def get_recommendation_drug_stats():
    if df_recommend is None: return jsonify({'error': 'Recommendation dataset not loaded'}), 500
    try:
        stats = {
            'total_drugs': int(df_recommend['drug_name'].nunique()),
            'avg_pmpm_cost': round(df_recommend['pmpm_cost'].mean(), 2),
            'therapeutic_classes': int(df_recommend['therapeutic_class'].nunique()),
            'total_prescriptions': int(df_recommend['total_prescription_fills'].sum()) if 'total_prescription_fills' in df_recommend.columns and not df_recommend['total_prescription_fills'].isnull().all() else 0
        }
        return jsonify(stats)
    except Exception as e:
        print(f"❌ ERROR inside /api/drug-stats endpoint: {e}")
        return jsonify({'error': 'An internal error occurred while calculating stats.'}), 500

@recommend_bp.route('/api/recommend', methods=['POST'])
def get_recommendations():
    if ml_pipeline is None or grouping_model is None or df_recommend is None:
        return jsonify({'error': 'Models or recommendation dataset not loaded'}), 500

    data = request.get_json()
    drug_names = [name.strip().upper() for name in data.get('drug_names', [])]
    if not drug_names: return jsonify({'error': 'No drug names provided'}), 400

    original_drugs_info, selected_generics = [], []
    for name in drug_names:
        info_df = df_recommend[df_recommend['drug_name'] == name]
        if not info_df.empty:
            info = info_df.iloc[0].to_dict()
            original_drugs_info.append(info)
            selected_generics.append(info['generic_name'])

    if len(original_drugs_info) != len(drug_names):
        found_names = [d['drug_name'] for d in original_drugs_info]
        not_found = [name for name in drug_names if name not in found_names]
        return jsonify({'error': f"Could not find data for drug(s): {', '.join(not_found)}"}), 404

    if len(original_drugs_info) >= 2 and selected_generics[0] == selected_generics[1] and pd.notna(selected_generics[0]):
        return jsonify({'error': f"Both drugs have the same generic name ({selected_generics[0]}). This is not a recommended combination."}), 400

    recommended_drugs, analysis = [], {}
    if len(original_drugs_info) == 1:
        drug_orig, generic_name = original_drugs_info[0], selected_generics[0]
        drug_rec = find_cost_effective_alternative(df_recommend, drug_orig, generic_name)
        recommended_drugs.append(drug_rec)
        cost_saving = drug_orig['pmpm_cost'] - drug_rec['pmpm_cost']
        percentage_saving = (cost_saving / drug_orig['pmpm_cost']) * 100 if drug_orig['pmpm_cost'] > 0 else 0
        efficacy_alternatives = find_clinical_efficacy_alternatives(drug_orig, top_n=3)
        analysis = {'type': 'single_drug', 'cost_saving_per_member': cost_saving, 'percentage_saving': percentage_saving, 'clinical_efficacy_alternatives': efficacy_alternatives}
        
        ### MODIFIED: Save to CIA database ###
        try:
            if cost_saving > 0:
                save_cost_impact_to_db(drug_orig['pmpm_cost'], drug_rec['pmpm_cost'])
        except Exception as e:
            print(f"⚠️ Warning: Could not save cost impact to database. Error: {e}")

    elif len(original_drugs_info) >= 2:
        drug1_orig, drug2_orig = original_drugs_info[0], original_drugs_info[1]
        generic1, generic2 = selected_generics[0], selected_generics[1]
        original_interaction = check_interaction_with_ml(drug1_orig, drug2_orig)
        drug1_rec, drug2_rec = find_safe_and_cost_effective_pair(df_recommend, drug1_orig, generic1, drug2_orig, generic2)
        recommended_drugs.extend([drug1_rec, drug2_rec])
        final_interaction = check_interaction_with_ml(drug1_rec, drug2_rec)
        total_orig_cost = drug1_orig['pmpm_cost'] + drug2_orig['pmpm_cost']
        total_rec_cost = drug1_rec['pmpm_cost'] + drug2_rec['pmpm_cost']
        total_saving = total_orig_cost - total_rec_cost
        percentage_saving = (total_saving / total_orig_cost) * 100 if total_orig_cost > 0 else 0
        efficacy_alternatives_drug1 = find_clinical_efficacy_alternatives(drug1_orig, top_n=3)
        efficacy_alternatives_drug2 = find_clinical_efficacy_alternatives(drug2_orig, top_n=3)
        analysis = {
            'type': 'combination', 'total_cost_saving': total_saving, 'percentage_saving': percentage_saving,
            'original_interaction': {'risk_label': original_interaction[0] if original_interaction else "No Interaction", 'description': original_interaction[1] if original_interaction else "No interaction found in data."},
            'recommended_interaction': {'risk_label': final_interaction[0] if final_interaction else "No Interaction", 'description': final_interaction[1] if final_interaction else "This combination is considered safe (no interaction found)."},
            'clinical_efficacy_alternatives': {'drug1': efficacy_alternatives_drug1, 'drug2': efficacy_alternatives_drug2}
        }
        
        ### MODIFIED: Save to CIA database ###
        try:
            if total_saving > 0:
                save_cost_impact_to_db(total_orig_cost, total_rec_cost)
        except Exception as e:
            print(f"⚠️ Warning: Could not save cost impact to database. Error: {e}")

    response = {'original_drugs': original_drugs_info, 'recommended_drugs': recommended_drugs, 'analysis': analysis}
    return jsonify(clean_nan_for_json(response))

# ==============================================================================
# 5. COST IMPACT ANALYSIS API (New Flask Blueprint)
# ==============================================================================
### MAKE SURE YOUR SECTION 5 LOOKS EXACTLY LIKE THIS ###

cia_bp = Blueprint('cia_bp', __name__)

# --- Configuration for CIA App ---
DB_PATH = 'data/cia.db'

# --- Helper Functions for CIA App ---
def init_cia_db():
    """Initialize the SQLite database for Cost Impact Analysis"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cost_impact (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_cost REAL NOT NULL,
            reduced_cost REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("✅ Cost Impact Analysis database initialized.")

def get_cia_db_connection():
    """Get a database connection for CIA"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def save_cost_impact_to_db(original_cost, reduced_cost):
    """Helper function to directly save cost impact data. Called by the recommendation engine."""
    try:
        conn = get_cia_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO cost_impact (original_cost, reduced_cost, timestamp)
            VALUES (?, ?, ?)
        ''', (original_cost, reduced_cost, datetime.now()))
        conn.commit()
        conn.close()
        print(f"✅ Saved cost impact to DB: Original=${original_cost:.2f}, Reduced=${reduced_cost:.2f}")
    except Exception as e:
        print(f"❌ Failed to save cost impact to DB. Error: {e}")
        raise e

# --- API Endpoints for CIA App (attached to Blueprint) ---
# Note: We use @cia_bp.route, NOT @app.route
@cia_bp.route('/api/cia/add', methods=['POST'])
def add_cost_impact():
    """Add a new cost impact record manually via API"""
    # ... (function content is the same)
    try:
        data = request.get_json()
        if not data: return jsonify({'error': 'No data provided'}), 400
        original_cost = data.get('original_cost')
        reduced_cost = data.get('reduced_cost')
        if original_cost is None or reduced_cost is None: return jsonify({'error': 'Both original_cost and reduced_cost are required'}), 400
        if not isinstance(original_cost, (int, float)) or not isinstance(reduced_cost, (int, float)): return jsonify({'error': 'Costs must be numeric values'}), 400
        if original_cost < 0 or reduced_cost < 0: return jsonify({'error': 'Costs cannot be negative'}), 400
        save_cost_impact_to_db(original_cost, reduced_cost)
        return jsonify({'message': 'Cost impact record added successfully','original_cost': original_cost,'reduced_cost': reduced_cost}), 201
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@cia_bp.route('/api/cia/summary', methods=['GET'])
def get_cost_summary():
    """Get summary statistics for all cost impact records"""
    # ... (function content is the same)
    try:
        conn = get_cia_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT SUM(original_cost) as original, SUM(reduced_cost) as reduced FROM cost_impact')
        result = cursor.fetchone()
        conn.close()
        original_total_cost = result['original'] if result and result['original'] is not None else 0.0
        reduced_total_cost = result['reduced'] if result and result['reduced'] is not None else 0.0
        total_savings = original_total_cost - reduced_total_cost
        if original_total_cost > 0:
            reduction_percent = (total_savings / original_total_cost) * 100
        else:
            reduction_percent = 0.0
        return jsonify({'original_total_cost': original_total_cost,'reduced_total_cost': reduced_total_cost,'total_savings': total_savings,'reduction_percent': reduction_percent}), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@cia_bp.route('/api/cia/records', methods=['GET'])
def get_cost_records():
    """Get all cost impact records"""
    # ... (function content is the same)
    try:
        conn = get_cia_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, original_cost, reduced_cost, timestamp FROM cost_impact ORDER BY timestamp DESC')
        records = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({'records': records}), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@cia_bp.route('/api/cia/clear', methods=['DELETE'])
def clear_cost_records():
    """Clear all cost impact records"""
    # ... (function content is the same)
    try:
        conn = get_cia_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM cost_impact')
        conn.commit()
        conn.close()
        return jsonify({'message': 'All cost impact records cleared successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500



# ==============================================================================
# 6. COMBINING, MOUNTING AND MAIN EXECUTION
# ==============================================================================

# Create a master Flask app to hold the blueprints
combined_flask_app = Flask(__name__)

# Register the blueprints with the master Flask app
combined_flask_app.register_blueprint(form_bp)
combined_flask_app.register_blueprint(recommend_bp)
combined_flask_app.register_blueprint(cia_bp) ### NEW ###

# Apply CORS to all Flask routes through the master Flask app and the FastAPI app
FlaskCORS(combined_flask_app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the single, combined Flask app at the root.
# FastAPI will handle its own routes first. Any request that doesn't match a FastAPI route
# will be passed to the combined_flask_app.
app.mount("/", WSGIMiddleware(combined_flask_app))

# Main execution block
if __name__ == "__main__":
    print("🚀 Starting Combined Drug Analytics Server (with original URLs)...")

    if not os.path.exists('data'):
        os.makedirs('data')
        print("Created 'data' directory. Please place your models and CSV files there.")
        
    ### MODIFIED ###
    print("\n--- Initializing Cost Impact Analysis DB ---")
    init_cia_db()

    print("\n--- Initializing Recommendation Engine ---")
    load_recommendation_models()
    df_temp = load_and_clean_recommendation_data(DATA_FILEPATH)
    if df_temp is not None:
        df_recommend = add_clusters_to_df(df_temp)

    if ml_pipeline is not None and grouping_model is not None :
        print("\n✅ Server ready to accept requests!")
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        print("\n❌ Server failed to initialize. Please check file paths and errors.")