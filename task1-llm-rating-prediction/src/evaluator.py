"""Evaluator for comparing predicted vs actual star ratings."""
import pandas as pd
from typing import Dict, List
import json

from .config import METHOD_NAMES, METHOD_ZERO_SHOT, METHOD_FEW_SHOT, METHOD_COT_FEW_SHOT


def calculate_accuracy(predictions_df: pd.DataFrame, method_id: int) -> Dict:
    """
    Calculate accuracy for a specific method.
    
    Args:
        predictions_df: DataFrame with 'star' (actual) and 'predicted_star' columns
        method_id: 1, 2, or 3
    
    Returns:
        dict with accuracy metrics
    """
    # Filter by method
    method_df = predictions_df[predictions_df['method_id'] == method_id].copy()
    
    if len(method_df) == 0:
        return {
            "method_id": method_id,
            "method_name": METHOD_NAMES.get(method_id, "unknown"),
            "total": 0,
            "exact_accuracy": 0.0,
            "within_1_accuracy": 0.0,
            "valid_predictions": 0,
        }
    
    # Filter out invalid predictions (-1)
    valid_df = method_df[method_df['predicted_star'] > 0]
    
    total = len(method_df)
    valid = len(valid_df)
    
    if valid == 0:
        return {
            "method_id": method_id,
            "method_name": METHOD_NAMES.get(method_id, "unknown"),
            "total": total,
            "exact_accuracy": 0.0,
            "within_1_accuracy": 0.0,
            "valid_predictions": 0,
        }
    
    # Exact match
    exact_matches = (valid_df['star'] == valid_df['predicted_star']).sum()
    exact_accuracy = exact_matches / valid
    
    # Within 1 star
    within_1 = (abs(valid_df['star'] - valid_df['predicted_star']) <= 1).sum()
    within_1_accuracy = within_1 / valid
    
    return {
        "method_id": method_id,
        "method_name": METHOD_NAMES.get(method_id, "unknown"),
        "total": total,
        "valid_predictions": valid,
        "exact_matches": int(exact_matches),
        "exact_accuracy": round(exact_accuracy, 4),
        "within_1_accuracy": round(within_1_accuracy, 4),
    }


def calculate_all_accuracies(predictions_df: pd.DataFrame) -> Dict:
    """
    Calculate accuracy for all three methods.
    
    Returns:
        dict with accuracy metrics for each method
    """
    results = {}
    
    for method_id in [METHOD_ZERO_SHOT, METHOD_FEW_SHOT, METHOD_COT_FEW_SHOT]:
        method_name = METHOD_NAMES[method_id]
        results[method_name] = calculate_accuracy(predictions_df, method_id)
    
    return results


def print_accuracy_table(accuracies: Dict) -> str:
    """
    Print a formatted accuracy comparison table.
    Returns the table as a string.
    """
    lines = []
    lines.append("\n" + "="*70)
    lines.append("ACCURACY COMPARISON RESULTS")
    lines.append("="*70)
    lines.append(f"{'Method':<15} {'Total':<8} {'Valid':<8} {'Exact':<10} {'Within-1':<10}")
    lines.append("-"*70)
    
    for method_name, metrics in accuracies.items():
        exact = f"{metrics['exact_accuracy']*100:.1f}%"
        within1 = f"{metrics['within_1_accuracy']*100:.1f}%"
        lines.append(
            f"{method_name:<15} {metrics['total']:<8} {metrics['valid_predictions']:<8} "
            f"{exact:<10} {within1:<10}"
        )
    
    lines.append("="*70)
    
    table_str = "\n".join(lines)
    print(table_str)
    return table_str


def save_results(predictions_df: pd.DataFrame, accuracies: Dict, output_dir: str):
    """
    Save predictions CSV and accuracy JSON to output directory.
    """
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    # Save predictions CSV
    csv_path = os.path.join(output_dir, "predictions.csv")
    predictions_df.to_csv(csv_path, index=False)
    print(f"Saved predictions to: {csv_path}")
    
    # Save accuracy JSON
    json_path = os.path.join(output_dir, "accuracy.json")
    with open(json_path, 'w') as f:
        json.dump(accuracies, f, indent=2)
    print(f"Saved accuracy results to: {json_path}")
