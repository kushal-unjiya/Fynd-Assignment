"""
Yelp Rating Prediction via LLM Prompting
Simple, self-contained implementation for Task 1.

Usage:
    python main.py
    python main.py --input dummy_data.csv --sample 10
"""
import argparse
import json
import os
import sys
import time
import pandas as pd
import requests
from tqdm import tqdm
from dotenv import load_dotenv
from prompts import get_step1_prompt, get_step2_prompt, get_step3_prompt

# --- Config ---
load_dotenv()
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
# MODEL_NAME = "meta-llama/llama-3.2-3b-instruct:free"
MODEL_NAME = "nex-agi/deepseek-v3.1-nex-n1:free"

# --- Predictor ---
def call_llm(system_prompt, user_prompt):
    """Make API call to OpenRouter with retries."""
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")
        
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/your-repo", # Optional
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1024,
        "response_format": {"type": "json_object"} 
    }
    
    for attempt in range(5): # Increased to 5 attempts
        try:
            response = requests.post(OPENROUTER_BASE_URL, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                response_json = response.json()
                if 'error' in response_json:
                     # Handle cases where API returns 200 but body contains error
                    print(f"API Error in body: {response_json['error']}")
                    time.sleep(5)
                    continue
                    
                return response_json['choices'][0]['message']['content']
            elif response.status_code == 429:
                sleep_time = 5 * (attempt + 1) # Increased backoff
                print(f"Rate limited. Sleeping {sleep_time}s...")
                time.sleep(sleep_time) 
            else:
                print(f"API Error {response.status_code}: {response.text}")
                time.sleep(2)
        except Exception as e:
            print(f"Request failed: {e}")
            time.sleep(2)
            
    return None

def parse_json(raw_text):
    """Extract and parse JSON from LLM output."""
    try:
        # Clean markdown code blocks if present
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        
        data = json.loads(cleaned)
        
        # Normalize keys
        if 'rating' in data and 'predicted_stars' not in data:
            data['predicted_stars'] = data['rating']
            
        return data
    except Exception:
        return None

def predict_rating(review, method_id):
    """
    Get prediction for a review using specified method.
    Methods: 1=Zero-shot, 2=Few-shot, 3=CoT
    """
    if method_id == 1:
        sys_p, user_p = get_step1_prompt(review)
    elif method_id == 2:
        sys_p, user_p = get_step2_prompt(review)
    elif method_id == 3:
        sys_p, user_p = get_step3_prompt(review)
    else:
        raise ValueError("Unknown method_id")
        
    raw_output = call_llm(sys_p, user_p)
    if not raw_output:
        return {"predicted_stars": -1, "explanation": "API Call Failed", "valid_json": False}
        
    parsed = parse_json(raw_output)
    
    if parsed and isinstance(parsed.get('predicted_stars'), (int, float)):
        return {
            "predicted_stars": int(parsed['predicted_stars']),
            "explanation": parsed.get('explanation', ''),
            "valid_json": True,
            "raw_output": raw_output
        }
    else:
        return {
            "predicted_stars": -1, 
            "explanation": "JSON Parse Error", 
            "valid_json": False,
            "raw_output": raw_output
        }

# --- Evaluation ---
def evaluate_results(results_df):
    """Calculate and print metrics."""
    metrics = []
    
    print("\n--- Evaluation Results ---")
    print(f"{'Method':<15} | {'Acc (Exact)':<12} | {'Acc (±1)':<12} | {'JSON Valid %':<12} | {'Time (s)':<10}")
    print("-" * 70)
    
    for method_id, group_df in results_df.groupby('method'):
        total = len(group_df)
        valid_json_count = group_df['valid_json'].sum()
        
        # Filter for valid predictions for accuracy
        valid_preds = group_df[group_df['predicted_stars'] != -1]
        
        if len(valid_preds) > 0:
            exact_matches = (valid_preds['actual_stars'] == valid_preds['predicted_stars']).sum()
            within_one = (abs(valid_preds['actual_stars'] - valid_preds['predicted_stars']) <= 1).sum()
            
            acc_exact = (exact_matches / len(valid_preds)) * 100
            acc_within1 = (within_one / len(valid_preds)) * 100
        else:
            acc_exact = 0
            acc_within1 = 0
            
        json_valid_rate = (valid_json_count / total) * 100
        
        method_name = ["Zero-Shot", "Few-Shot", "CoT-Reason"][method_id-1] if method_id <=3 else str(method_id)
        
        print(f"{method_name:<15} | {acc_exact:5.1f}%       | {acc_within1:5.1f}%       | {json_valid_rate:5.1f}%       | {'N/A'}")
        
        metrics.append({
            "method": method_name,
            "exact_accuracy": acc_exact,
            "within_1_accuracy": acc_within1,
            "json_validity": json_valid_rate
        })
        
    return metrics

# --- Main ---
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="dummy_data.csv", help="Input CSV file (must have 'stars' and 'text' cols)")
    parser.add_argument("--sample", type=int, default=None, help="Sample size")
    args = parser.parse_args()

    if not OPENROUTER_API_KEY:
        print("WARNING: OPENROUTER_API_KEY not set. API calls will fail.")
    
    print(f"Loading {args.input}...")
    try:
        df = pd.read_csv(args.input)
    except FileNotFoundError:
        print(f"Error: {args.input} not found.")
        return

    if 'stars' not in df.columns or 'text' not in df.columns:
        print("Error: CSV must contain 'stars' and 'text' columns.")
        return

    if args.sample:
        df = df.sample(min(args.sample, len(df)))
        print(f"Sampled {len(df)} rows.")

    results = []
    methods = [1, 2, 3] # Run all 3 approaches
    
    # Prepare tasks for parallel execution
    tasks = []
    
    # Create method names mapping for better progress bar
    method_names = {1: "Zero-Shot", 2: "Few-Shot", 3: "CoT"}

    for index, row in df.iterrows():
        review_text = row['text']
        actual_star = row['stars']
        for m_id in methods:
            tasks.append({
                "index": index,
                "review": review_text,
                "actual_star": actual_star,
                "method_id": m_id,
                "method_name": method_names[m_id]
            })

    print(f"Processing {len(tasks)} total API calls (Sequential for stability)...")
    
    # Define a helper for the thread pool
    def process_task(task):
        m_id = task['method_id']
        rev = task['review']
        # SLEEP to avoid rate limits
        time.sleep(2)
        res = predict_rating(rev, m_id)
        
        return {
            "method": m_id,
            "review_preview": rev[:50] + "...",
            "actual_stars": task['actual_star'],
            "predicted_stars": res['predicted_stars'],
            "explanation": res['explanation'],
            "valid_json": res['valid_json'],
            "raw_output": res.get('raw_output', '')
        }

    # Run in parallel
    import concurrent.futures
    
    # Set to 1 to effectively run sequentially but keep architecture
    MAX_WORKERS = 1 
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        futures = [executor.submit(process_task, task) for task in tasks]
        
        # Process as they complete
        for future in tqdm(concurrent.futures.as_completed(futures), total=len(futures)):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"Task failed: {e}")

    results_df = pd.DataFrame(results)
    
    # Save raw results
    results_df.to_csv("results/prediction_results.csv", index=False)
    print("\nSaved detailed results to results/prediction_results.csv")
    
    # Evaluate
    evaluate_results(results_df)

if __name__ == "__main__":
    # Ensure results dir exists
    os.makedirs("results", exist_ok=True)
    main()
