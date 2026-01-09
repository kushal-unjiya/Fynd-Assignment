# Task 1: Rating Prediction via Prompting - Deliverables

## 📋 Task Overview

Design prompts that classify Yelp reviews into 1–5 star ratings, returning structured JSON output.

---

## ✅ Completed Items

### 1. Implementation ✅

#### Core Components
- [x] `main.py` - Main script with all functionality
- [x] `prompts.py` - Three prompting approaches implemented
- [x] `requirements.txt` - All dependencies listed
- [x] `.gitignore` - Proper git ignore rules
- [x] `README.md` - Setup and usage documentation

#### Three Prompting Approaches Implemented

##### Approach 1: Zero-Shot Prompting ✅
**File:** `prompts.py` - `ZERO_SHOT_SYSTEM_PROMPT`

**Characteristics:**
- Direct instruction without examples
- Clear rating scale definition
- Structured JSON output format
- Emphasis on text-based analysis only

**Strengths:**
- Simple and straightforward
- No token overhead from examples
- Fast inference
- General-purpose

**Weaknesses:**
- May lack context for edge cases
- No guidance from examples
- Potentially less consistent

##### Approach 2: Few-Shot Prompting ✅
**File:** `prompts.py` - `FEW_SHOT_SYSTEM_PROMPT` + `longest_15_formatted.txt`

**Characteristics:**
- Includes 15 curated examples (3 per rating)
- Shows model what good predictions look like
- Examples cover diverse review styles
- Balanced representation across all ratings

**Strengths:**
- Better consistency
- Learns from examples
- Handles edge cases better
- More aligned predictions

**Weaknesses:**
- Larger token count
- Slower inference
- Example selection matters
- More expensive per call

##### Approach 3: Chain-of-Thought (CoT) Reasoning ✅
**File:** `prompts.py` - `COT_SYSTEM_PROMPT`

**Characteristics:**
- Step-by-step reasoning process
- Analyzes: Sentiment → Positives → Negatives → Severity → Rating
- Transparent decision-making
- Structured thinking approach

**Strengths:**
- Most explainable
- Catches nuance better
- Reduces reasoning errors
- Better edge case handling

**Weaknesses:**
- Slowest approach
- Most expensive (longest outputs)
- More tokens generated
- Overkill for simple reviews

### 2. JSON Output Format ✅

Implemented structure as required:
```json
{
  "predicted_stars": 4,
  "explanation": "Brief reasoning for the assigned rating."
}
```

**Validation Features:**
- [x] JSON parsing with error handling
- [x] Fallback to regex extraction if JSON invalid
- [x] Validity tracking and reporting
- [x] Detailed error logging

### 3. Test Data ✅

#### Test File: `test_5_reviews.csv`
- [x] 5 diverse reviews created
- [x] All ratings covered (1-5 stars)
- [x] Includes positive, neutral, and negative reviews
- [x] Edge cases represented

**Coverage:**
- 5 ⭐: Extremely positive review
- 4 ⭐: Positive with minor issues
- 3 ⭐: Neutral/mixed review
- 2 ⭐: Negative with some positives
- 1 ⭐: Extremely negative review

### 4. Results & Evaluation ✅

#### Results File: `results/prediction_results.csv`
Contains for each review:
- [x] Review ID and text
- [x] Actual rating
- [x] Predictions from all 3 methods
- [x] Explanations from each method
- [x] Raw LLM output
- [x] Correctness indicators

#### Test Summary: `TEST_SUMMARY.md`
- [x] Configuration details
- [x] Test data overview
- [x] Results by method
- [x] Accuracy metrics (exact, ±1)
- [x] JSON validity rates
- [x] Detailed predictions for each review
- [x] Key observations
- [x] Performance metrics

**Current Results (5 reviews):**
| Method | Exact Accuracy | ±1 Accuracy | JSON Validity |
|--------|----------------|-------------|---------------|
| Zero-Shot | 100% | 100% | 100% |
| Few-Shot | 100% | 100% | 100% |
| CoT | 100% | 100% | 100% |

---

## 🔄 Remaining Tasks

### 1. Full Dataset Evaluation ⚠️

**Status:** NOT COMPLETED

**Required:**
- [ ] Download full Yelp Reviews dataset from Kaggle
- [ ] Sample ~200 rows (recommended for cost/efficiency)
- [ ] Run evaluation on all 3 methods
- [ ] Generate comprehensive results
- [ ] Create comparison analysis

**Command to run:**
```bash
python main.py --input yelp_reviews.csv --sample 200
```

**Expected outputs:**
- `results/prediction_results_200.csv` - Full results
- Updated accuracy metrics
- More robust comparison data

### 2. Jupyter Notebook Version 📓

**Status:** NOT CREATED

**Required:**
- [ ] Create `notebook.ipynb` in task1 folder
- [ ] Include all code from `main.py` and `prompts.py`
- [ ] Add markdown cells explaining each approach
- [ ] Include visualizations:
  - [ ] Accuracy comparison charts
  - [ ] Confusion matrices
  - [ ] Rating distribution plots
  - [ ] Performance metrics visualization
- [ ] Add step-by-step execution
- [ ] Include sample outputs
- [ ] Export results inline

**Suggested Structure:**
```
1. Introduction & Setup
   - Import libraries
   - Set API keys
   - Load data

2. Approach 1: Zero-Shot
   - Prompt explanation
   - Code implementation
   - Results visualization

3. Approach 2: Few-Shot
   - Prompt explanation
   - Example selection process
   - Code implementation
   - Results visualization

4. Approach 3: Chain-of-Thought
   - Prompt explanation
   - Reasoning steps breakdown
   - Code implementation
   - Results visualization

5. Comparison & Analysis
   - Side-by-side metrics
   - Trade-offs discussion
   - Recommendations

6. Conclusion
```

### 3. Enhanced Documentation 📝

**Status:** PARTIALLY COMPLETE

**Remaining:**
- [ ] Add prompt iteration details to README
- [ ] Document why each prompt was designed that way
- [ ] Explain improvements made during development
- [ ] Add troubleshooting section
- [ ] Include API cost estimates
- [ ] Add performance benchmarks

---

## 📊 Evaluation Metrics Explained

### 1. Exact Accuracy
- **Definition:** Percentage of predictions matching actual rating exactly
- **Formula:** `(Correct Predictions / Total Predictions) × 100`
- **Current:** All methods at 100% (on 5 reviews)

### 2. Within ±1 Accuracy
- **Definition:** Percentage within 1 star of actual rating
- **Formula:** `(Predictions within ±1 / Total Predictions) × 100`
- **Current:** All methods at 100% (on 5 reviews)
- **Note:** More forgiving metric, useful for edge cases

### 3. JSON Validity Rate
- **Definition:** Percentage of responses with valid JSON
- **Formula:** `(Valid JSON Responses / Total Responses) × 100`
- **Current:** All methods at 100%
- **Importance:** Critical for production systems

### 4. Response Time (Tracked)
- **Current average:** ~2.8s per prediction
- **API:** Groq (moonshotai/kimi-k2-instruct-0905)
- **Sequential execution** with 2s delay between calls

---

## 🔍 Prompt Design Rationale

### Design Decisions

#### 1. Clear Rating Scale Definition
All prompts explicitly define what each rating means:
```
1 star = terrible
2 stars = poor/bad
3 stars = okay/average
4 stars = good/great
5 stars = excellent/outstanding
```

**Why:** Eliminates ambiguity in rating interpretation

#### 2. JSON Structure Emphasis
All prompts specify exact JSON format with examples

**Why:** Ensures parseable, structured outputs for production use

#### 3. Text-Only Analysis
Explicitly instructed to ignore non-textual factors

**Why:** Dataset only contains review text, not metadata

#### 4. Balanced Training Examples (Few-Shot)
15 examples with 3 from each rating category

**Why:** Prevents bias toward any particular rating

#### 5. Step-by-Step CoT Process
Structured reasoning: Sentiment → Positives → Negatives → Severity → Rating

**Why:** Mimics human rating process, reduces errors

### Iterations & Improvements

#### Initial Version Issues:
- ❌ JSON was sometimes wrapped in markdown code blocks
- ❌ Explanations were too verbose
- ❌ Inconsistent rating for neutral reviews

#### Improvements Made:
- ✅ Added explicit "Do not wrap in markdown" instruction
- ✅ Specified "brief reasoning" for explanations
- ✅ Added examples of neutral reviews (3-star)
- ✅ Enhanced error handling for JSON parsing
- ✅ Added regex fallback for malformed JSON

---

## 📈 Report Content Checklist

### For Final Report - Task 1 Section

- [ ] **Overview**
  - [ ] Problem statement
  - [ ] Approach summary
  - [ ] Dataset description

- [ ] **Prompting Approaches**
  - [ ] Zero-Shot: Design & rationale
  - [ ] Few-Shot: Example selection process
  - [ ] CoT: Reasoning structure explanation

- [ ] **Prompt Iterations**
  - [ ] Initial designs
  - [ ] Issues encountered
  - [ ] Improvements made
  - [ ] Final versions

- [ ] **Evaluation Methodology**
  - [ ] Test data creation
  - [ ] Metrics chosen (why these metrics?)
  - [ ] Execution approach
  - [ ] API configuration

- [ ] **Results**
  - [ ] Comparison table (all metrics)
  - [ ] Per-method analysis
  - [ ] Example predictions
  - [ ] Performance data

- [ ] **Analysis & Discussion**
  - [ ] Which approach works best?
  - [ ] Trade-offs analysis:
    - [ ] Speed vs Accuracy
    - [ ] Cost vs Performance
    - [ ] Simplicity vs Robustness
  - [ ] When to use each approach
  - [ ] Limitations observed
  - [ ] Production recommendations

- [ ] **Conclusion**
  - [ ] Key findings
  - [ ] Best practices learned
  - [ ] Future improvements

---

## 🛠️ Technical Specifications

### Technologies Used
- **Language:** Python 3.13
- **LLM API:** Groq API (moonshotai/kimi-k2-instruct-0905)
- **Key Libraries:**
  - `requests` - API calls
  - `pandas` - Data handling
  - `python-dotenv` - Environment variables
  - `tqdm` - Progress bars

### API Configuration
```python
API: Groq
Model: moonshotai/kimi-k2-instruct-0905
Temperature: 0.7
Max Tokens: 1500 (CoT), 500 (others)
```

### Error Handling
- [x] API failures with retries
- [x] JSON parsing errors
- [x] Missing fields validation
- [x] Rate limiting (2s delay)
- [x] Malformed response handling

---

## 📁 File Inventory

### Source Files
```
task1-llm-rating-prediction/
├── main.py                          # Main implementation (268 lines)
├── prompts.py                       # All 3 prompts (111 lines)
├── requirements.txt                 # Dependencies (5 packages)
├── README.md                        # Documentation (47 lines)
├── TASK1_DELIVERABLES.md           # This file
├── TEST_SUMMARY.md                 # Test results (109 lines)
├── .gitignore                      # Git ignore rules
├── longest_15_formatted.txt        # Few-shot examples (31 lines)
├── test_5_reviews.csv              # Test data (5 reviews)
└── results/
    └── prediction_results.csv      # Detailed results
```

### To Be Created
- [ ] `notebook.ipynb` - Jupyter notebook version
- [ ] `yelp_reviews.csv` - Full dataset (downloaded from Kaggle)
- [ ] `results/prediction_results_200.csv` - Full evaluation results
- [ ] `results/analysis_charts/` - Visualization outputs

---

## 🚀 Next Steps

### Immediate (High Priority)
1. Download Yelp dataset from Kaggle
2. Run full 200-row evaluation
3. Create Jupyter notebook version
4. Generate visualizations

### Short Term
5. Update documentation with full results
6. Add visualizations to report
7. Complete Task 1 section of main report

### Before Submission
8. Verify all files are committed
9. Test notebook executes end-to-end
10. Ensure all deliverables are present

---

## 📊 Success Criteria

### Minimum Requirements ✅
- [x] 3 different prompting approaches implemented
- [x] JSON output format working
- [x] Evaluation on test data
- [x] Metrics calculated (accuracy, JSON validity)
- [x] Results documented

### Recommended Additions
- [ ] Full dataset evaluation (~200 rows)
- [ ] Jupyter notebook for easy reproduction
- [ ] Visualizations and charts
- [ ] Detailed comparison analysis
- [ ] Production recommendations

### Excellent Submission
- [ ] All above +
- [ ] Error analysis (which reviews are hardest?)
- [ ] Cost analysis (API costs per method)
- [ ] Optimization suggestions
- [ ] Confidence scores added
- [ ] A/B testing framework

---

## 💡 Key Insights & Observations

### What Works Well
- ✅ All three methods achieve perfect accuracy on test set
- ✅ JSON output is consistently valid
- ✅ CoT provides most detailed explanations
- ✅ Few-shot is most consistent (theoretically)
- ✅ Zero-shot is fastest and cheapest

### Challenges Encountered
- ⚠️ Initial JSON wrapping in markdown blocks
- ⚠️ Rate limiting on some APIs
- ⚠️ Cost considerations for large datasets
- ⚠️ Explanation verbosity control

### Recommendations
- 💡 Use Zero-Shot for simple, clear reviews
- 💡 Use Few-Shot for edge cases and consistency
- 💡 Use CoT when explanations are critical
- 💡 Consider hybrid approach based on review complexity

---

**Last Updated:** January 9, 2026
**Status:** Implementation Complete | Evaluation Pending | Notebook Pending
