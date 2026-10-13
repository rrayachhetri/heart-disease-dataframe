# CardioSense Feature Glossary

This glossary explains the 13 clinical inputs used by the CardioSense ensemble
model. Definitions are distilled from the UCI Heart Disease dataset
documentation (https://archive.ics.uci.edu/dataset/45/heart+disease).

## age
Patient age in years. Cardiovascular risk generally rises with age in all
four source cohorts (Cleveland, Hungarian, Switzerland, VA).

## sex
Biological sex coded as 1 = male, 0 = female. In these cohorts, male patients
have a higher observed rate of angiographic disease, partly reflecting
referral patterns in the original studies.

## cp (Chest Pain Type)
Describes the character of chest pain reported by the patient:
- 0 = Typical angina — classic exertional chest pain relieved by rest/nitrates.
- 1 = Atypical angina — chest discomfort that only partially fits the typical
  pattern.
- 2 = Non-anginal pain — chest pain unlikely to be cardiac in origin.
- 3 = Asymptomatic — no chest pain reported at all.
Interestingly, "asymptomatic" patients in this dataset have the HIGHEST
observed disease rate, because silent or atypical presentation is common in
real angiographic referral populations.

## trestbps (Resting Blood Pressure)
Resting systolic blood pressure in mmHg, measured at hospital admission.
Elevated resting BP is an established, modifiable cardiovascular risk factor.

## chol (Serum Cholesterol)
Serum cholesterol in mg/dl. Elevated total cholesterol is associated with
atherosclerotic risk, though LDL/HDL breakdown (not captured by this single
feature) gives a fuller clinical picture.

## fbs (Fasting Blood Sugar)
Whether fasting blood sugar > 120 mg/dl (1 = true, 0 = false). A simple proxy
for glucose intolerance / undiagnosed diabetes risk.

## restecg (Resting ECG results)
- 0 = Normal
- 1 = ST-T wave abnormality (may indicate ischemia)
- 2 = Probable or definite left ventricular hypertrophy

## thalach (Maximum Heart Rate Achieved)
Peak heart rate reached during an exercise stress test. Lower achieved max
heart rate (relative to age-predicted max) can indicate reduced cardiac
reserve or chronotropic incompetence.

## exang (Exercise-Induced Angina)
Whether chest pain occurred during exercise testing (1 = yes, 0 = no). A
strong, well-known marker of inducible ischemia.

## oldpeak (ST Depression)
ST-segment depression induced by exercise relative to rest, measured in mm.
Larger ST depression generally reflects more significant ischemia during
stress testing.

## slope (Slope of Peak Exercise ST Segment)
- 0 = Upsloping (generally more benign)
- 1 = Flat
- 2 = Downsloping (generally more concerning for ischemia)

## ca (Number of Major Vessels Colored by Fluoroscopy)
Count (0-3) of major coronary vessels showing contrast uptake on
fluoroscopy during cardiac catheterization. This is itself a diagnostic
test finding, not a screening-stage risk factor - a higher count directly
reflects visualized coronary involvement.

## thal (Thalassemia / Thallium Stress Test Result)
Result of a thallium stress test:
- 3 = Normal
- 6 = Fixed defect (an old, stable area of reduced perfusion, often from a
  prior infarction)
- 7 = Reversible defect (perfusion defect that improves at rest, suggesting
  inducible ischemia from a significant stenosis)

## Important caveat about ca and thal
`ca` and `thal` are results of invasive or specialized cardiac testing, not
routine self-reported risk factors like smoking or blood pressure. When
CardioSense explains "top factors" that include `ca` or `thal`, it means the
model is responding to actual test results already available for that
patient - not something a patient can change through lifestyle.
