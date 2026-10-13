# How CardioSense Risk Scores Are Calculated and Labeled

## What the probability means
CardioSense's ensemble model (RandomForest-300 + GradientBoosting-200 +
Logistic Regression, soft-voting) outputs a probability between 0 and 1 that
represents the model's estimated likelihood of angiographically significant
coronary artery disease (>=50% narrowing in at least one major vessel), based
on patterns learned from the combined UCI Cleveland, Hungarian, Switzerland,
and VA cohorts (920 patients total).

This is a statistical pattern match against historical patients with similar
feature profiles - it is not a diagnostic test result and does not replace a
physician's evaluation, an ECG, bloodwork, or imaging ordered by a doctor.

## Risk level thresholds
CardioSense buckets the raw probability into three labels used across the
app:
- **Low risk**: probability < 0.40
- **Moderate risk**: probability between 0.40 and 0.70
- **High risk**: probability >= 0.70

These thresholds are app-level conventions for communicating results clearly
to users; they are not clinically validated cut-points and have not been
calibrated against a prospective population.

## Top factors / explainability
For each prediction, CardioSense also computes "top factors" - the features
that moved the model's output the most away from a population-average
baseline. A positive contribution means that feature pushed the probability
up (toward higher risk); a negative contribution means it pulled the
probability down (toward lower risk). This method is model-agnostic
baseline-perturbation, not a causal explanation - it describes what the
model responded to, not necessarily what causes disease in that individual.

## Population percentile benchmarking
CardioSense also shows where a patient's raw feature values (such as
cholesterol or resting blood pressure) rank as a percentile against each of
the four historical cohorts. A high percentile means the value is higher
than most patients in that historical group; it is a descriptive comparison,
not a risk score by itself.

## What this model does NOT do
- It does not diagnose a heart attack, arrhythmia, or heart failure.
- It does not replace urgent care for acute chest pain, shortness of breath,
  or other emergency symptoms - those situations require immediate medical
  attention regardless of any score shown here.
- It is not trained on, nor validated against, a general unselected
  population; the four source cohorts were originally collected from
  patients referred for cardiac evaluation, so prevalence and presentation
  patterns may not generalize to the public at large.
