# Yelp Review Rating Prediction (Task 1)

This project implements an LLM-based system to predict star ratings (1-5) from Yelp review text using three different prompting strategies.

## Requirements

- Python 3.8+
- OpenRouter API Key (for LLM access)

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set API Key**:
   ```bash
   export OPENROUTER_API_KEY="your_api_key_here"
   ```

## Usage

**Run with Dummy Data (Test)**:
```bash
python main.py --input dummy_data.csv
```

**Run with Full Dataset**:
1. Download the YELP dataset CSV.
2. Run:
```bash
python main.py --input path/to/yelp_reviews.csv --sample 200
```
(Use `--sample 200` to limit to 200 rows for cost/efficiency).

## Approaches Implemented

1. **Zero-Shot**: Direct instruction without examples.
2. **Few-Shot**: Includes 15 curated examples (3 per star rating) in the system prompt.
3. **Chain-of-Thought (CoT)**: Asks the model to reason step-by-step (Sentiment -> Positives -> Negatives -> Severity -> Rating).

## Output

- **Console**: Displays an accuracy comparison table.
- **`results/prediction_results.csv`**: Contains every prediction, explanation, and raw LLM output.
