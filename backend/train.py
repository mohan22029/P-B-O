import pandas as pd
import warnings
import pickle
import numpy as np

# --- LIBRARIES for the Models ---
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.cluster import KMeans
from sklearn.decomposition import NMF, LatentDirichletAllocation
from sklearn.metrics.pairwise import cosine_similarity

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
        
        # Clean numeric columns
        for col in ['pmpm_cost', 'avg_age']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Clean text columns
        for col in ['drug_name', 'generic_name']:
            df[col] = df[col].astype(str).str.strip().str.upper().replace('NAN', np.nan)
        
        # Fill missing values
        df['drug_interactions'].fillna('No interaction data', inplace=True)
        df['therapeutic_equivalence_code'].fillna('NA', inplace=True)
        df['clinical_efficacy'].fillna('No efficacy data available', inplace=True)
        
        # Clean numeric columns with commas
        for col in ['total_prescription_fills', 'member_count']:
            if col in df.columns:
                df[col] = df[col].astype(str).str.replace(',', '').astype(float, errors='ignore')
        
        print("✅ Dataset loaded and cleaned successfully.")
        return df
    except FileNotFoundError:
        print(f"❌ ERROR: The file '{filepath}' was not found.")
        return None
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

def train_and_save_models(df, inter_output_path="drug_interaction_model.pkl", 
                         group_output_path="drug_grouping_model.pkl",
                         efficacy_output_path="clinical_efficacy_model.pkl"):
    """
    Trains the interaction model, grouping model, and clinical efficacy model,
    and saves them to pickle files.
    """
    print("\n--- Training Models ---")

    # 1. Combine text for NLP context understanding
    df['combined_text'] = df['drug_name'] + ' ' + df['generic_name'] + ' ' + df['drug_interactions']

    # 2. Engineer the Target Variable for interaction risk
    def assign_risk(description):
        description = str(description).lower()
        if 'decrease the excretion rate' in description or 'higher serum level' in description or 'increased when combined' in description:
            return "High Risk"
        elif 'metabolism' in description or 'can be decreased' in description:
            return "Potential Interaction"
        else:
            return "Low Risk"
    
    df['interaction_risk'] = df['combined_text'].apply(assign_risk)

    # 3. Train Interaction Model
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

    # Interaction Pipeline: RandomForest
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

    # 4. Train Grouping Model
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

    # KMeans clustering
    kmeans = KMeans(n_clusters=40, random_state=42)
    kmeans.fit(X_group)
    print("✅ Grouping ML model trained successfully.")

    # Save Grouping Model
    grouping_model = {'preprocessor': preprocessor_group, 'kmeans': kmeans}
    with open(group_output_path, 'wb') as f:
        pickle.dump(grouping_model, f)
    print(f"✅ Grouping model saved to '{group_output_path}'")

    # 5. NEW: Train Clinical Efficacy Topic Modeling System
    print("\n--- Training Clinical Efficacy Topic Model ---")
    
    # Prepare clinical efficacy text data
    efficacy_data = df.dropna(subset=['clinical_efficacy'])
    efficacy_texts = efficacy_data['clinical_efficacy'].astype(str).tolist()
    
    if len(efficacy_texts) < 10:
        print("❌ Not enough clinical efficacy data for topic modeling.")
        return False
    
    # TF-IDF Vectorization for clinical efficacy
    tfidf_vectorizer = TfidfVectorizer(
        max_features=500,
        ngram_range=(1, 3),
        stop_words='english',
        min_df=2,
        max_df=0.8
    )
    
    tfidf_matrix = tfidf_vectorizer.fit_transform(efficacy_texts)
    
    # Hybrid Topic Modeling: NMF + LDA
    n_topics = min(15, len(efficacy_texts) // 3)  # Dynamic topic count
    
    # NMF Model
    nmf_model = NMF(
        n_components=n_topics,
        random_state=42,
        max_iter=200,
        alpha=0.1,
        l1_ratio=0.5
    )
    nmf_topics = nmf_model.fit_transform(tfidf_matrix)
    
    # LDA Model
    lda_model = LatentDirichletAllocation(
        n_components=n_topics,
        random_state=42,
        max_iter=100,
        learning_method='batch'
    )
    lda_topics = lda_model.fit_transform(tfidf_matrix)
    
    # Combine NMF and LDA topic distributions (weighted average)
    combined_topics = 0.6 * nmf_topics + 0.4 * lda_topics
    
    # Create efficacy model package
    efficacy_model = {
        'tfidf_vectorizer': tfidf_vectorizer,
        'nmf_model': nmf_model,
        'lda_model': lda_model,
        'combined_topics': combined_topics,
        'drug_data': efficacy_data[['drug_name', 'generic_name', 'therapeutic_class', 'pmpm_cost', 'clinical_efficacy']].copy(),
        'n_topics': n_topics
    }
    
    # Save Clinical Efficacy Model
    with open(efficacy_output_path, 'wb') as f:
        pickle.dump(efficacy_model, f)
    print(f"✅ Clinical Efficacy model saved to '{efficacy_output_path}'")
    
    print("✅ All models trained and saved successfully.")
    return True

def main():
    """
    Main function to run the training and saving process.
    """
    # Update this path to your CSV file location
    filepath = "test002.csv"  # or your actual file path
    
    df = load_and_clean_data(filepath)
    if df is not None:
        success = train_and_save_models(
            df, 
            inter_output_path="drug_interaction_model.pkl",
            group_output_path="drug_grouping_model.pkl", 
            efficacy_output_path="clinical_efficacy_model.pkl"
        )
        
        if success:
            print("\n🎉 Training completed successfully!")
            print("Models saved:")
            print("- drug_interaction_model.pkl")
            print("- drug_grouping_model.pkl") 
            print("- clinical_efficacy_model.pkl")
        else:
            print("\n❌ Training failed. Check error messages above.")
    else:
        print("❌ Failed to load dataset.")

if __name__ == "__main__":
    main()