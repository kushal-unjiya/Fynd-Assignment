"""LLM predictor for rating prediction using OpenRouter API."""
import json
import re
import time
import requests
from typing import Optional

from .config import (
    OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL,
    MODEL_NAME,
    TEMPERATURE,
    MAX_TOKENS,
    REQUEST_DELAY,
    METHOD_ZERO_SHOT,
    METHOD_FEW_SHOT,
    METHOD_COT_FEW_SHOT,
)
from .prompts import get_step1_prompt, get_step2_prompt, get_step3_prompt


def call_openrouter(system_prompt: str, user_prompt: str) -> tuple[str, str]:
    """
    Call OpenRouter API and return (raw_json_response, parsed_json_string).
    Returns the raw LLM output and attempts to extract JSON.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS,
    }
    
    try:
        response = requests.post(OPENROUTER_BASE_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        raw_output = result["choices"][0]["message"]["content"]
        
        return raw_output, raw_output
        
    except requests.exceptions.RequestException as e:
        error_msg = f"API Error: {str(e)}"
        return error_msg, json.dumps({"predicted_stars": -1, "explanation": error_msg})


def extract_json_from_response(raw_response: str) -> dict:
    """
    Extract JSON from LLM response.
    Handles cases where JSON is wrapped in markdown code blocks or extra text.
    """
    # Try direct JSON parse first
    try:
        return json.loads(raw_response)
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON in markdown code block
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find raw JSON object
    json_match = re.search(r'\{[^{}]*"predicted_stars"[^{}]*\}', raw_response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    # Return error dict if parsing fails
    return {"predicted_stars": -1, "explanation": f"Failed to parse JSON from: {raw_response[:100]}..."}


def predict_rating(review: str, method_id: int) -> dict:
    """
    Predict star rating for a review using specified method.
    
    Args:
        review: The review text to analyze
        method_id: 1 (zero-shot), 2 (few-shot), 3 (cot-few-shot)
    
    Returns:
        dict with: predicted_stars, explanation, raw_llm_output, method_id
    """
    # Get appropriate prompt based on method
    if method_id == METHOD_ZERO_SHOT:
        system_prompt, user_prompt = get_step1_prompt(review)
    elif method_id == METHOD_FEW_SHOT:
        system_prompt, user_prompt = get_step2_prompt(review)
    elif method_id == METHOD_COT_FEW_SHOT:
        system_prompt, user_prompt = get_step3_prompt(review)
    else:
        raise ValueError(f"Invalid method_id: {method_id}. Must be 1, 2, or 3.")
    
    # Call API
    raw_output, _ = call_openrouter(system_prompt, user_prompt)
    
    # Parse response
    parsed = extract_json_from_response(raw_output)
    
    # Rate limiting
    time.sleep(REQUEST_DELAY)
    
    return {
        "predicted_stars": parsed.get("predicted_stars", -1),
        "explanation": parsed.get("explanation", ""),
        "reasoning": parsed.get("reasoning", ""),  # Only for method 3
        "raw_llm_output": raw_output,
        "method_id": method_id,
    }


def test_api_connection() -> bool:
    """Test if API connection works."""
    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY environment variable not set!")
        return False
    
    print(f"Testing connection to OpenRouter with model: {MODEL_NAME}")
    
    try:
        result = predict_rating("The food was great!", METHOD_ZERO_SHOT)
        if result["predicted_stars"] > 0:
            print(f"✅ API connection successful! Predicted: {result['predicted_stars']} stars")
            print(f"   Explanation: {result['explanation']}")
            return True
        else:
            print(f"❌ API returned invalid response: {result}")
            return False
    except Exception as e:
        print(f"❌ API connection failed: {e}")
        return False


if __name__ == "__main__":
    test_api_connection()
