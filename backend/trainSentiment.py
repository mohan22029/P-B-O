# *Sentiment Analysis using NLTK - VADER & RoBERTa Model for Drug Reviews*
# Clean version for 465 reviews using only relevant columns

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from tqdm import tqdm

import warnings
warnings.filterwarnings('ignore')

# Download NLTK data
import nltk
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('vader_lexicon', quiet=True)

### Read the Drug Reviews Data (Clean Version)
print("📁 Loading Drug Reviews Dataset...")
review_ds = pd.read_csv(r"data\review_drug.csv", encoding='latin1')

# *CLEAN THE DATA - Use only relevant columns*
review = review_ds[['drug_name', 'Reviews']].copy()
review.columns = review.columns.str.strip()  # Remove any whitespace

print(f"✅ Dataset loaded: {len(review)} reviews")
print(f"📊 Clean dataset shape: {review.shape}")
print("\nFirst 5 rows:")
print(review.head())

# Add review analysis columns
review['review_length'] = review['Reviews'].str.len()
review['word_count'] = review['Reviews'].str.split().str.len()

print(f"\n💊 Dataset Summary:")
print(f"   Total Reviews: {len(review)}")
print(f"   Unique Drugs: {review['drug_name'].nunique()}")
print(f"   Average Review Length: {review['review_length'].mean():.1f} characters")
print(f"   Average Word Count: {review['word_count'].mean():.1f} words")

# Drug distribution
drug_counts = review['drug_name'].value_counts()
print(f"\n📊 Drug Distribution:")
for drug, count in drug_counts.items():
    print(f"   {drug}: {count} reviews")

## Step 4: *VADER Analysis*
print("\n📊 VADER Sentiment Analysis")

sia = SentimentIntensityAnalyzer()

# Test examples
print("VADER Test Examples:")
print("'This drug is terrible':", sia.polarity_scores('This drug is terrible'))
print("'This medication works great!':", sia.polarity_scores('This medication works great!'))

### Run VADER on entire dataset
print(f"\n🔄 Processing {len(review)} reviews with VADER...")

res = {}
for i, row in tqdm(review.iterrows(), total=len(review), desc="VADER Analysis"):
    text = row['Reviews']
    myid = i
    res[myid] = sia.polarity_scores(text)

vaders = pd.DataFrame(res).T
vaders = vaders.reset_index().rename(columns={'index': 'review_id'})
vaders = vaders.merge(review.reset_index().rename(columns={'index': 'review_id'}), how="left")

print("✅ VADER Analysis Complete")
print(f"VADER Results Shape: {vaders.shape}")

## Step 5: *RoBERTa Analysis*
print("\n🤖 RoBERTa Sentiment Analysis")

from transformers import AutoTokenizer, AutoModelForSequenceClassification
from scipy.special import softmax
import torch

MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSequenceClassification.from_pretrained(MODEL)

print(f"✅ RoBERTa Model Loaded")

def preprocess_text_roberta(text):
    """Preprocess text for RoBERTa"""
    new_text = []
    for t in str(text).split(" "):
        t = '@user' if t.startswith('@') and len(t) > 1 else t
        t = 'http' if t.startswith('http') else t
        new_text.append(t)
    return " ".join(new_text)[:512]  # Truncate to max length

def polarity_scores_roberta(text):
    """Get RoBERTa polarity scores"""
    try:
        processed_text = preprocess_text_roberta(text)
        encoded_text = tokenizer(processed_text, return_tensors='pt', max_length=512, truncation=True)

        with torch.no_grad():
            output = model(**encoded_text)

        scores = output[0][0].detach().numpy()
        scores = softmax(scores)

        return {
            'roberta_neg': float(scores[0]),
            'roberta_neu': float(scores[1]),
            'roberta_pos': float(scores[2])
        }
    except Exception as e:
        return {'roberta_neg': 0.33, 'roberta_neu': 0.33, 'roberta_pos': 0.33}

### Run combined analysis
print(f"\n🔄 Processing {len(review)} reviews with both models...")

res = {}
for i, row in tqdm(review.iterrows(), total=len(review), desc="Combined Analysis"):
    try:
        text = row['Reviews']
        myid = i

        # VADER results
        vader_results = sia.polarity_scores(text)
        vader_results_rename = {f"vader_{k}": v for k, v in vader_results.items()}

        # RoBERTa results
        roberta_results = polarity_scores_roberta(text)

        # Combine
        both = {**vader_results_rename, **roberta_results}
        res[myid] = both

    except Exception as e:
        print(f'Error for review {myid}: {e}')

print("✅ Combined Analysis Complete")

# Create results dataframe
results_df = pd.DataFrame(res).T
results_df = results_df.reset_index().rename(columns={'index': 'review_id'})
results_df = results_df.merge(review.reset_index().rename(columns={'index': 'review_id'}), how='left')

## Calculate Member Satisfaction Scores
print("\n📊 Calculating Member Satisfaction Scores...")

def calculate_satisfaction_scores(df):
    """Calculate member satisfaction scores from sentiment analysis"""

    # VADER satisfaction (compound score from -1 to 1, convert to 0-10)
    df['satisfaction_vader'] = (df['vader_compound'] + 1) * 5

    # RoBERTa satisfaction (positive - negative, then scale to 0-10)
    df['roberta_compound'] = df['roberta_pos'] - df['roberta_neg']
    df['satisfaction_roberta'] = (df['roberta_compound'] + 1) * 5

    # Combined satisfaction (average of both)
    df['satisfaction_combined'] = (df['satisfaction_vader'] + df['satisfaction_roberta']) / 2

    # Weighted satisfaction (RoBERTa weighted more heavily)
    df['satisfaction_weighted'] = 0.3 * df['satisfaction_vader'] + 0.7 * df['satisfaction_roberta']

    return df

results_df = calculate_satisfaction_scores(results_df)

print("✅ Satisfaction Scores Calculated")

## Drug-Level Aggregated Member Satisfaction Analysis
print("\n💊 Drug-Level Aggregated Member Satisfaction Analysis")

drug_satisfaction = results_df.groupby('drug_name').agg({
    'satisfaction_vader': ['mean', 'std', 'count', 'min', 'max'],
    'satisfaction_roberta': ['mean', 'std', 'min', 'max'],
    'satisfaction_combined': ['mean', 'std', 'min', 'max'],
    'satisfaction_weighted': ['mean', 'std', 'min', 'max'],
    'vader_compound': ['mean', 'std'],
    'roberta_compound': ['mean', 'std']
}).round(3)

drug_satisfaction.columns = ['_'.join(col) for col in drug_satisfaction.columns]
drug_satisfaction = drug_satisfaction.reset_index()

print("Drug-Level Satisfaction Summary:")
print(drug_satisfaction)

## Performance Metrics Evaluation
print("\n🎯 Performance Metrics Evaluation")

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from scipy.stats import pearsonr, spearmanr

# Classification function
def classify_sentiment(compound_score, threshold=0.1):
    if compound_score >= threshold:
        return 'Positive'
    elif compound_score <= -threshold:
        return 'Negative'
    else:
        return 'Neutral'

# Create sentiment classes
results_df['vader_sentiment'] = results_df['vader_compound'].apply(classify_sentiment)
results_df['roberta_sentiment'] = results_df['roberta_compound'].apply(classify_sentiment)

# Performance metrics
pearson_corr, pearson_p = pearsonr(results_df['vader_compound'], results_df['roberta_compound'])
spearman_corr, spearman_p = spearmanr(results_df['vader_compound'], results_df['roberta_compound'])
agreement_rate = (results_df['vader_sentiment'] == results_df['roberta_sentiment']).mean()

# Regression metrics
mse = mean_squared_error(results_df['vader_compound'], results_df['roberta_compound'])
mae = mean_absolute_error(results_df['vader_compound'], results_df['roberta_compound'])
r2 = r2_score(results_df['vader_compound'], results_df['roberta_compound'])

print(f"\n📊 Model Performance Metrics:")
print(f"   Pearson Correlation: {pearson_corr:.4f} (p-value: {pearson_p:.4f})")
print(f"   Spearman Correlation: {spearman_corr:.4f} (p-value: {spearman_p:.4f})")
print(f"   Classification Agreement: {agreement_rate:.3f} ({agreement_rate*100:.1f}%)")
print(f"   Mean Squared Error: {mse:.4f}")
print(f"   Mean Absolute Error: {mae:.4f}")
print(f"   R² Score: {r2:.4f}")

## Drug-Specific Performance Analysis
print(f"\n💊 Drug-Specific Model Performance:")

drug_performance = {}
for drug in results_df['drug_name'].unique():
    drug_data = results_df[results_df['drug_name'] == drug]

    if len(drug_data) > 1:
        drug_corr = drug_data['vader_compound'].corr(drug_data['roberta_compound'])
        drug_agreement = (drug_data['vader_sentiment'] == drug_data['roberta_sentiment']).mean()
        avg_satisfaction = drug_data['satisfaction_weighted'].mean()

        drug_performance[drug] = {
            'correlation': drug_corr,
            'agreement_rate': drug_agreement,
            'avg_satisfaction': avg_satisfaction,
            'review_count': len(drug_data)
        }

        print(f"   {drug}:")
        print(f"     📊 Reviews: {len(drug_data)}")
        print(f"     🔗 Model Correlation: {drug_corr:.3f}")
        print(f"     🤝 Agreement Rate: {drug_agreement:.3f}")
        print(f"     ⭐ Avg Satisfaction: {avg_satisfaction:.2f}/10")
        print()

## Final Summary
print("\n" + "="*60)
print("🎯 FINAL SUMMARY FOR 465 DRUG REVIEWS")
print("="*60)

print(f"\n📊 Dataset Summary:")
print(f"   Total Reviews Processed: {len(results_df):,}")
print(f"   Unique Drugs: {results_df['drug_name'].nunique()}")

print(f"\n🏆 Overall Model Performance:")
print(f"   Model Correlation: {pearson_corr:.3f}")
print(f"   Classification Agreement: {agreement_rate:.3f}")
print(f"   R² Score: {r2:.3f}")

print(f"\n💊 Drug Satisfaction Rankings (Weighted Model):")
drug_rankings = results_df.groupby('drug_name')['satisfaction_weighted'].mean().sort_values(ascending=False)
for i, (drug, score) in enumerate(drug_rankings.items(), 1):
    review_count = len(results_df[results_df['drug_name'] == drug])
    print(f"   {i}. {drug}: {score:.2f}/10 (n={review_count})")

print(f"\n🎯 Model Recommendations:")
if pearson_corr > 0.7:
    print("   ✅ Both models show strong agreement - results are reliable")
elif pearson_corr > 0.5:
    print("   ⚠  Moderate model agreement - consider weighted approach")
else:
    print("   ❌ Low model agreement - investigate further")

# Save Results
print(f"\n💾 Saving Results...")

# Save detailed results
results_df.to_csv('drug_sentiment_analysis_465_reviews.csv', index=False)

# Save drug-level summary
drug_satisfaction.to_csv('drug_satisfaction_summary_465.csv', index=False)

# Save performance summary
performance_summary = {
    'total_reviews': len(results_df),
    'unique_drugs': results_df['drug_name'].nunique(),
    'model_performance': {
        'pearson_correlation': float(pearson_corr),
        'spearman_correlation': float(spearman_corr),
        'classification_agreement': float(agreement_rate),
        'mse': float(mse),
        'mae': float(mae),
        'r2_score': float(r2)
    },
    'drug_performance': drug_performance,
    'drug_satisfaction_rankings': drug_rankings.to_dict()
}

import json
with open('performance_summary_465_reviews.json', 'w') as f:
    json.dump(performance_summary, f, indent=2)

print("✅ All results saved!")
print("   📄 drug_sentiment_analysis_465_reviews.csv")
print("   📄 drug_satisfaction_summary_465.csv")
print("   📄 performance_summary_465_reviews.json")

print(f"\n🎉 ANALYSIS COMPLETE!")
print(f"🚀 Member satisfaction scores calculated for all {results_df['drug_name'].nunique()} drugs from 465 reviews!")