"""
Main script to run Yelp rating prediction experiments.

Usage:
    python main.py --input ../subset_200_balanced.csv
    python main.py --input ../subset_200_balanced.csv --sample 10
"""
import argparse
import os
import sys
import pandas as pd
from tqdm import tqdm

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.config import (
    METHOD_ZERO_SHOT, 
    METHOD_FEW_SHOT, 
    METHOD_COT_FEW_SHOT,
    METHOD_NAMES,
    OPENROUTER_API_KEY,
)
from src.predictor import predict_rating, test_api_connection
from src.evaluator import calculate_all_accuracies, print_accuracy_table, save_results


def load_data(input_path: str, sample_size: int = None) -> pd.DataFrame:
    """Load and optionally sample the input CSV."""
    df = pd.read_csv(input_path)
    
    # Ensure required columns exist
    required_cols = ['stars', 'text']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Input CSV must have '{col}' column. Found: {df.columns.tolist()}")
    
    # Rename for consistency
    df = df.rename(columns={'stars': 'star', 'text': 'review'})
    
    if sample_size and sample_size < len(df):
        df = df.sample(n=sample_size, random_state=42)
        print(f"Sampled {sample_size} reviews from {len(df)} total")
    
    return df[['star', 'review']].reset_index(drop=True)


def run_predictions(df: pd.DataFrame, methods: list = None) -> pd.DataFrame:
    """
    Run predictions for all reviews using all methods.
    
    Returns DataFrame with columns:
        star, review, predicted_star, explanation, method_id, raw_llm_output
    """
    if methods is None:
        methods = [METHOD_ZERO_SHOT, METHOD_FEW_SHOT, METHOD_COT_FEW_SHOT]
    
    results = []
    total_iterations = len(df) * len(methods)
    
    print(f"\nRunning predictions: {len(df)} reviews × {len(methods)} methods = {total_iterations} API calls")
    print("="*60)
    
    with tqdm(total=total_iterations, desc="Predicting") as pbar:
        for idx, row in df.iterrows():
            review = row['review']
            actual_star = row['star']
            
            for method_id in methods:
                pbar.set_description(f"Review {idx+1}/{len(df)}, Method {method_id}")
                
                try:
                    prediction = predict_rating(review, method_id)
                    
                    results.append({
                        'star': actual_star,
                        'review': review[:500] + "..." if len(review) > 500 else review,  # Truncate for CSV
                        'predicted_star': prediction['predicted_stars'],
                        'explanation': prediction['explanation'],
                        'method_id': method_id,
                        'raw_llm_output': prediction['raw_llm_output'],
                    })
                except Exception as e:
                    results.append({
                        'star': actual_star,
                        'review': review[:500] + "..." if len(review) > 500 else review,
                        'predicted_star': -1,
                        'explanation': f"Error: {str(e)}",
                        'method_id': method_id,
                        'raw_llm_output': str(e),
                    })
                
                pbar.update(1)
    
    return pd.DataFrame(results)


def main():
    parser = argparse.ArgumentParser(description="Yelp Rating Prediction via LLM Prompting")
    parser.add_argument("--input", type=str, required=True, help="Path to input CSV file")
    parser.add_argument("--sample", type=int, default=None, help="Number of reviews to sample (optional)")
    parser.add_argument("--output-dir", type=str, default="results", help="Output directory for results")
    parser.add_argument("--method", type=int, choices=[1, 2, 3], default=None, 
                        help="Run only specific method (1=zero-shot, 2=few-shot, 3=cot)")
    parser.add_argument("--test-api", action="store_true", help="Only test API connection")
    
    args = parser.parse_args()
    
    # Check API key
    if not OPENROUTER_API_KEY:
        print("❌ Error: OPENROUTER_API_KEY environment variable not set!")
        print("   Set it with: export OPENROUTER_API_KEY='your-key-here'")
        sys.exit(1)
    
    # Test API only
    if args.test_api:
        success = test_api_connection()
        sys.exit(0 if success else 1)
    
    # Load data
    print(f"Loading data from: {args.input}")
    df = load_data(args.input, args.sample)
    print(f"Loaded {len(df)} reviews")
    print(f"Star distribution:\n{df['star'].value_counts().sort_index()}")
    
    # Determine methods to run
    methods = [args.method] if args.method else [METHOD_ZERO_SHOT, METHOD_FEW_SHOT, METHOD_COT_FEW_SHOT]
    
    # Run predictions
    predictions_df = run_predictions(df, methods)
    
    # Calculate accuracies
    print("\nCalculating accuracies...")
    accuracies = calculate_all_accuracies(predictions_df)
    
    # Print results
    print_accuracy_table(accuracies)
    
    # Save results
    save_results(predictions_df, accuracies, args.output_dir)
    
    print("\n✅ Done!")


if __name__ == "__main__":
    main()
