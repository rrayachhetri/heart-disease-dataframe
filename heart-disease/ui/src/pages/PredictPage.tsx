import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Heart, Activity, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { AppDispatch, RootState } from '../store';
import { submitPrediction } from '../store/slices/predictionSlice';
import { useNotification } from '../hooks/useNotification';
import FormField from '../components/Form/FormField';
import SelectField from '../components/Form/SelectField';
import type { PatientData } from '../types';
import styles from './PredictPage.module.less';

interface FormState {
  age: string;
  trestbps: string;
  chol: string;
  thalach: string;
  oldpeak: string;
  sex: number;
  cp: number;
  fbs: number;
  restecg: number;
  exang: number;
  slope: number;
  ca: number;
  thal: number;
}

const INITIAL: FormState = {
  age: '',
  trestbps: '',
  chol: '',
  thalach: '',
  oldpeak: '',
  sex: 1,
  cp: 0,
  fbs: 0,
  restecg: 0,
  exang: 0,
  slope: 1,
  ca: 0,
  thal: 2,
};

export default function PredictPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {}
  );
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((s: RootState) => s.prediction.loading);
  const { sendNotification, requestPermission, permission } = useNotification();

  const set =
    <K extends keyof FormState>(key: K) =>
    (val: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: val }));

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    const numFields: {
      key: keyof FormState;
      min: number;
      max: number;
      label: string;
    }[] = [
      { key: 'age', min: 1, max: 120, label: 'Age' },
      { key: 'trestbps', min: 50, max: 250, label: 'Resting BP' },
      { key: 'chol', min: 50, max: 600, label: 'Cholesterol' },
      { key: 'thalach', min: 50, max: 250, label: 'Max Heart Rate' },
      { key: 'oldpeak', min: 0, max: 10, label: 'ST Depression' },
    ];

    for (const { key, min, max, label } of numFields) {
      const val = parseFloat(form[key] as string);
      if (!form[key] || isNaN(val)) {
        newErrors[key] = `${label} is required`;
      } else if (val < min || val > max) {
        newErrors[key] = `${label} must be between ${min} and ${max}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    if (permission === 'default') {
      await requestPermission();
    }

    const payload: PatientData = {
      age: parseFloat(form.age),
      sex: form.sex,
      cp: form.cp,
      trestbps: parseFloat(form.trestbps),
      chol: parseFloat(form.chol),
      fbs: form.fbs,
      restecg: form.restecg,
      thalach: parseFloat(form.thalach),
      exang: form.exang,
      oldpeak: parseFloat(form.oldpeak),
      slope: form.slope,
      ca: form.ca,
      thal: form.thal,
    };

    try {
      const result = await dispatch(submitPrediction(payload)).unwrap();
      const isHigh = result.result.prediction === 1;
      const pct = Math.round(result.result.probability * 100);

      sendNotification({
        type: isHigh ? 'warning' : 'success',
        title: isHigh ? 'High Risk Detected' : 'Low Risk Result',
        message: `Patient risk score: ${pct}%. ${
          isHigh
            ? 'Recommend follow-up consultation.'
            : 'No immediate concern.'
        }`,
      });

      toast.success('Prediction complete!');
      navigate('/result');
    } catch {
      toast.error('Failed to get prediction. Is the API running?');
    }
  };

  const handleReset = () => {
    setForm(INITIAL);
    setErrors({});
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Patient Risk Assessment</h2>
        <p>Enter patient clinical data to predict heart disease risk.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Personal Info */}
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.sectionHeader}>
            <User size={18} />
            <h3>Personal Information</h3>
          </div>
          <div className={styles.grid2}>
            <FormField
              label="Age"
              hint="(years)"
              type="number"
              placeholder="e.g. 63"
              value={form.age}
              onChange={(e) => set('age')(e.target.value)}
              error={errors.age}
            />
            <SelectField
              label="Sex"
              value={form.sex}
              onChange={set('sex')}
              options={[
                { label: 'Male', value: 1 },
                { label: 'Female', value: 0 },
              ]}
            />
          </div>
        </motion.section>

        {/* Symptoms */}
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.sectionHeader}>
            <Heart size={18} />
            <h3>Symptoms &amp; Pain</h3>
          </div>
          <div className={styles.grid2}>
            <SelectField
              label="Chest Pain Type"
              value={form.cp}
              onChange={set('cp')}
              options={[
                { label: 'Typical Angina', value: 0 },
                { label: 'Atypical Angina', value: 1 },
                { label: 'Non-anginal Pain', value: 2 },
                { label: 'Asymptomatic', value: 3 },
              ]}
            />
            <SelectField
              label="Exercise Induced Angina"
              value={form.exang}
              onChange={set('exang')}
              options={[
                { label: 'No', value: 0 },
                { label: 'Yes', value: 1 },
              ]}
            />
          </div>
          <div className={styles.grid2}>
            <FormField
              label="ST Depression"
              hint="(oldpeak)"
              type="number"
              step="0.1"
              placeholder="e.g. 2.3"
              value={form.oldpeak}
              onChange={(e) => set('oldpeak')(e.target.value)}
              error={errors.oldpeak}
            />
            <SelectField
              label="ST Slope"
              value={form.slope}
              onChange={set('slope')}
              options={[
                { label: 'Upsloping', value: 0 },
                { label: 'Flat', value: 1 },
                { label: 'Downsloping', value: 2 },
              ]}
            />
          </div>
        </motion.section>

        {/* Vitals & Lab Results */}
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.sectionHeader}>
            <Activity size={18} />
            <h3>Vitals &amp; Lab Results</h3>
          </div>
          <div className={styles.grid3}>
            <FormField
              label="Resting Blood Pressure"
              hint="(mm Hg)"
              type="number"
              placeholder="e.g. 145"
              value={form.trestbps}
              onChange={(e) => set('trestbps')(e.target.value)}
              error={errors.trestbps}
            />
            <FormField
              label="Cholesterol"
              hint="(mg/dl)"
              type="number"
              placeholder="e.g. 233"
              value={form.chol}
              onChange={(e) => set('chol')(e.target.value)}
              error={errors.chol}
            />
            <FormField
              label="Max Heart Rate"
              hint="(thalach)"
              type="number"
              placeholder="e.g. 150"
              value={form.thalach}
              onChange={(e) => set('thalach')(e.target.value)}
              error={errors.thalach}
            />
          </div>
          <div className={styles.grid3}>
            <SelectField
              label="Fasting Blood Sugar > 120"
              value={form.fbs}
              onChange={set('fbs')}
              options={[
                { label: 'No', value: 0 },
                { label: 'Yes', value: 1 },
              ]}
            />
            <SelectField
              label="Resting ECG"
              value={form.restecg}
              onChange={set('restecg')}
              options={[
                { label: 'Normal', value: 0 },
                { label: 'ST-T Abnormality', value: 1 },
                { label: 'LV Hypertrophy', value: 2 },
              ]}
            />
            <SelectField
              label="# Major Vessels (ca)"
              value={form.ca}
              onChange={set('ca')}
              options={[
                { label: '0', value: 0 },
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
              ]}
            />
          </div>
          <div className={styles.grid2}>
            <SelectField
              label="Thalassemia"
              value={form.thal}
              onChange={set('thal')}
              options={[
                { label: 'Normal', value: 1 },
                { label: 'Fixed Defect', value: 2 },
                { label: 'Reversible Defect', value: 3 },
              ]}
            />
          </div>
        </motion.section>

        {/* Actions */}
        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Reset Form
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Analyzing...
              </>
            ) : (
              <>
                Predict Risk
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}
