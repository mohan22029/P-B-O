# server.py
# Flask backend to handle formulary CSV without RxNorm.
# This version is updated to prevent sending invalid JSON to the frontend.

import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import numpy as np # Import numpy to handle NaN conversion

app = Flask(__name__)
# UPDATED: Made CORS more flexible for common local development ports
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"]}})

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
    df = pd.concat(df_list, ignore_index=True)
else:
    df = pd.DataFrame(columns=column_names)
    print("Warning: No data loaded from 'formulary.csv'. File may be empty or malformed.")

# --- Data Cleaning ---
# CRITICAL FIX: Replace pandas NaN values with None.
# pandas uses np.nan for missing values, which becomes `NaN` in the API response.
# JSON does not support `NaN`, but it does support `null`. `None` in Python becomes `null` in JSON.
df = df.replace({np.nan: None})

# Verify columns
if 'RXCUI' not in df.columns:
    print(f"Error: 'RXCUI' column not found. Available columns: {list(df.columns)}")
    sys.exit(1)

# Add placeholder drug_name (since RxNorm is not used)
df['drug_name'] = 'RXCUI: ' + df['RXCUI'].astype(str)

# Log data details
print(f"Data loaded: {len(df)} rows")
print(f"Unique FORMULARY_IDs found: {df['FORMULARY_ID'].unique().tolist()}")


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
@app.route('/api/formulary', methods=['GET'])
def get_formulary():
    try:
        search = request.args.get('search', '').lower()
        tier = request.args.get('tier', 'all')
        pa = request.args.get('pa', 'all')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))

        filtered = df.copy()

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

        return jsonify({'data': data, 'total': total})
    except Exception as e:
        print(f"Error in /api/formulary: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        total = len(df)
        pa = len(df[df['PRIOR_AUTHORIZATION_YN'] == 'Y']) if not df.empty else 0
        step = len(df[df['STEP_THERAPY_YN'] == 'Y']) if not df.empty else 0
        return jsonify({'total': total, 'pa': pa, 'step': step})
    except Exception as e:
        print(f"Error in /api/stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# --- Main Execution ---
if __name__ == '__main__':
    print(f"Starting Flask server on http://localhost:3001")
    app.run(port=3001, debug=True)
