# CardioSense Dataset & Model Overview

## Source datasets
CardioSense trains on all four processed UCI Heart Disease datasets
(https://archive.ics.uci.edu/dataset/45/heart+disease):
- **Cleveland** (Cleveland Clinic Foundation)
- **Hungarian** (Hungarian Institute of Cardiology, Budapest)
- **Switzerland** (University Hospital, Zurich and Basel)
- **VA** (V.A. Medical Center, Long Beach, CA)

Combined, these contribute 920 patient records. Each originally had up to 76
attributes; CardioSense - like most published research using this dataset -
uses the standard 13-feature subset plus the target.

## Target definition
The original target (`num`) records the diameter narrowing of major
coronary vessels found on angiography, graded 0 (no disease) to 4
(most severe). CardioSense binarizes this: 0 stays "no disease", and any
value 1-4 becomes "disease present" (>=50% narrowing in at least one
vessel).

## Missing-value handling
Missing values (marked `?` or `-9` in the raw files) and physiologically
impossible zeros for blood pressure, cholesterol, and max heart rate are
treated as missing, then filled using median imputation computed across the
combined pooled dataset.

## Model architecture
A soft-voting ensemble of:
- Random Forest (300 trees, class-balanced)
- Gradient Boosting (200 estimators)
- Logistic Regression (standardized features)

Cross-validated AUC on the combined dataset is approximately 0.886 (5-fold
stratified CV). Metrics, feature importances, and per-dataset statistics are
available via the `/api/predictions/model-info` and `/api/analytics/datasets`
endpoints.

## Known limitations (important for honest answers)
- The four cohorts are referral populations (patients already being
  evaluated for suspected heart disease), not a general-population sample -
  so the base disease rate here is much higher than in the public at large.
- `ca` (fluoroscopy vessel count) and `thal` (thallium stress test result)
  are themselves diagnostic test findings, so the model is partly built on
  information only available after specialized cardiac testing, not purely
  on routine screening-stage inputs.
- Imputation statistics were computed on the pooled training data, so very
  unusual combinations of feature values may fall outside what the model
  has reliably learned.
- CardioSense is an educational/research tool and is not a certified
  medical device.
