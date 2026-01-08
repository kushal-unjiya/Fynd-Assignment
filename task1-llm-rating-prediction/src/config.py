"""Configuration for OpenRouter API and model settings."""
import os

# API Configuration
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Model Configuration
MODEL_NAME = "nex-agi/deepseek-v3.1-nex-n1:free"
TEMPERATURE = 0.3
MAX_TOKENS = 1024

# Rate Limiting
REQUEST_DELAY = 1.0  # seconds between requests

# Method IDs
METHOD_ZERO_SHOT = 1
METHOD_FEW_SHOT = 2
METHOD_COT_FEW_SHOT = 3

METHOD_NAMES = {
    METHOD_ZERO_SHOT: "zero_shot",
    METHOD_FEW_SHOT: "few_shot", 
    METHOD_COT_FEW_SHOT: "cot_few_shot"
}
