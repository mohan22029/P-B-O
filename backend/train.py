import pandas as pd
import warnings
import pickle
import numpy as np

# --- LIBRARIES for the Models ---
from sklearn.ensemble import RandomForestClassifier  # Upgraded for better text context understanding
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.cluster import KMeans

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore', category=UserWarning, module='pandas')
warnings.filterwarnings('ignore', category=FutureWarning)

def load_and_clean_data(filepath):
    """
    Loads and cleans the dataset for training.
    """
    try:
        df = pd.read_csv(filepath)
        df.columns = df.columns.str.strip()
        for col in ['pmpm_cost', 'avg_age']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        for col in ['drug_name', 'generic_name']:
            df[col] = df[col].astype(str).str.strip().str.upper().replace('NAN', np.nan)
        df['drug_interactions'].fillna('No interaction data', inplace=True)
        df['therapeutic_equivalence_code'].fillna('NA', inplace=True)
        # Clean numeric columns with commas
        for col in ['total_prescription_fills', 'member_count']:
            if col in df.columns:
                df[col] = df[col].str.replace(',', '').astype(float, errors='ignore')
        print("✅ Dataset loaded and cleaned successfully.")
        return df
    except FileNotFoundError:
        print(f"❌ ERROR: The file '{filepath}' was not found.")
        return None

def train_and_save_models(df, inter_output_path="drug_interaction_model.pkl", group_output_path="drug_grouping_model.pkl"):
    """
    Trains the interaction model (with NLP text context) and grouping model (learns rules via clustering),
    and saves them to pickle files.
    """
    print("\n--- Training Models ---")

    # 1. Combine text for NLP context understanding: drug_name + generic_name + drug_interactions
    df['combined_text'] = df['drug_name'] + ' ' + df['generic_name'] + ' ' + df['drug_interactions']

    # 2. Engineer the Target Variable: Create the 'interaction_risk' label based on text phrases
    def assign_risk(description):
        description = str(description).lower()
        if 'decrease the excretion rate' in description or 'higher serum level' in description or 'increased when combined' in description:
            return "High Risk"
        elif 'metabolism' in description or 'can be decreased' in description:
            return "Potential Interaction"
        else:
            return "Low Risk"
    df['interaction_risk'] = df['combined_text'].apply(assign_risk)

    # 3. Prepare for Interaction Model
    df_train = df.dropna(subset=['pmpm_cost', 'avg_age', 'combined_text', 'interaction_risk'])
    if df_train.empty:
        print("❌ Cannot train interaction model: Not enough valid data after cleaning.")
        return False
    X_inter = df_train[['combined_text', 'pmpm_cost', 'avg_age']]
    y_inter = df_train['interaction_risk']

    # Preprocessor: TF-IDF with n-grams for better context
    preprocessor_inter = ColumnTransformer(
        transformers=[
            ('text', TfidfVectorizer(ngram_range=(1, 2)), 'combined_text'),
            ('numeric', StandardScaler(), ['pmpm_cost', 'avg_age'])
        ])

    # Interaction Pipeline: RandomForest for improved understanding
    ml_pipeline_inter = Pipeline(steps=[
        ('preprocessor', preprocessor_inter),
        ('classifier', RandomForestClassifier(random_state=42, class_weight='balanced'))
    ])
    ml_pipeline_inter.fit(X_inter, y_inter)
    print("✅ Interaction ML model trained successfully.")

    # Save Interaction Model
    with open(inter_output_path, 'wb') as f:
        pickle.dump(ml_pipeline_inter, f)
    print(f"✅ Interaction model saved to '{inter_output_path}'")

    # 4. Prepare for Grouping Model: Learn rules via clustering on generic, class, cost, age
    cluster_features = df[['generic_name', 'therapeutic_class', 'pmpm_cost', 'avg_age']].dropna()
    if cluster_features.empty:
        print("❌ Cannot train grouping model: Not enough valid data.")
        return False

    preprocessor_group = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['generic_name', 'therapeutic_class']),
            ('num', StandardScaler(), ['pmpm_cost', 'avg_age'])
        ])

    X_group = preprocessor_group.fit_transform(cluster_features)

    # KMeans: n_clusters approximated to unique generics/classes (~40-50)
    kmeans = KMeans(n_clusters=40, random_state=42)
    kmeans.fit(X_group)
    print("✅ Grouping ML model trained successfully.")

    # Save Grouping Model (preprocessor + kmeans)
    grouping_model = {'preprocessor': preprocessor_group, 'kmeans': kmeans}
    with open(group_output_path, 'wb') as f:
        pickle.dump(grouping_model, f)
    print(f"✅ Grouping model saved to '{group_output_path}'")

    return True

def main():
    """
    Main function to run the training and saving process.
    """
    filepath = "/kaggle/input/dataset-drug/test002.csv"
    df = load_and_clean_data(filepath)
    if df is not None:
        train_and_save_models(df)

if __name__ == "__main__":
    main()