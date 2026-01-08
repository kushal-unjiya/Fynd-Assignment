# Yelp Review Rating Prediction via LLM Prompting

Predict Yelp review star ratings (1-5) using three LLM prompting strategies.

## Approaches

| Method | ID | Description |
|--------|-----|-------------|
| Zero-Shot | 1 | Role-playing prompt, no examples |
| Few-Shot | 2 | Zero-shot + 15 curated examples (3 per star) |
| CoT + Few-Shot | 3 | Few-shot + chain-of-thought reasoning |

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set API key
export OPENROUTER_API_KEY='your-openrouter-api-key'
```

## Usage

```bash
# Test API connection
python main.py --test-api

# Run on sample (5 reviews)
python main.py --input ../subset_200_balanced.csv --sample 5

# Run full evaluation
python main.py --input ../subset_200_balanced.csv

# Run specific method only
python main.py --input ../subset_200_balanced.csv --method 1
```

## Output

- `results/predictions.csv` - All predictions with columns: star, review, predicted_star, explanation, method_id, raw_llm_output
- `results/accuracy.json` - Accuracy metrics per method

## Model

Uses `nex-agi/deepseek-v3.1-nex-n1:free` via OpenRouter API.
