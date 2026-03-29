import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import FormField from '../components/FormField';
import PickerField from '../components/PickerField';
import { predictHeartDisease } from '../api/predict';

const DEFAULTS = {
  age: '', trestbps: '', chol: '', thalach: '', oldpeak: '',
  sex: 1, cp: 0, fbs: 0, restecg: 0, exang: 0, slope: 1, ca: 0, thal: 2,
};

export default function HomeScreen({ navigation }) {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit() {
    const requiredText = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak'];
    for (const key of requiredText) {
      if (!form[key].toString().trim()) {
        Alert.alert('Missing field', `Please enter a value for "${key}".`);
        return;
      }
    }

    const payload = {
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
      setLoading(true);
      const result = await predictHeartDisease(payload);
      navigation.navigate('Result', { result, payload });
    } catch (err) {
      Alert.alert('Error', `Could not reach the API.\n${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❤️ Heart Disease Risk</Text>
        <Text style={styles.headerSub}>Enter patient details below</Text>
      </View>

      <SectionHeader title="Personal Info" />
      <FormField label="Age" hint="Years" value={form.age} onChangeText={set('age')} />
      <PickerField
        label="Sex"
        selectedValue={form.sex}
        onValueChange={set('sex')}
        options={[{ label: 'Male', value: 1 }, { label: 'Female', value: 0 }]}
      />

      <SectionHeader title="Symptoms" />
      <PickerField
        label="Chest Pain Type"
        hint="0=Typical Angina, 1=Atypical, 2=Non-anginal, 3=Asymptomatic"
        selectedValue={form.cp}
        onValueChange={set('cp')}
        options={[
          { label: '0 – Typical Angina', value: 0 },
          { label: '1 – Atypical Angina', value: 1 },
          { label: '2 – Non-anginal Pain', value: 2 },
          { label: '3 – Asymptomatic', value: 3 },
        ]}
      />
      <PickerField
        label="Exercise Induced Angina"
        selectedValue={form.exang}
        onValueChange={set('exang')}
        options={[{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }]}
      />
      <FormField
        label="ST Depression (Oldpeak)"
        hint="Exercise vs rest ST depression"
        value={form.oldpeak}
        onChangeText={set('oldpeak')}
      />

      <SectionHeader title="Vitals & Test Results" />
      <FormField label="Resting Blood Pressure" hint="mm Hg" value={form.trestbps} onChangeText={set('trestbps')} />
      <FormField label="Serum Cholesterol" hint="mg/dl" value={form.chol} onChangeText={set('chol')} />
      <FormField label="Max Heart Rate Achieved" hint="bpm" value={form.thalach} onChangeText={set('thalach')} />
      <PickerField
        label="Fasting Blood Sugar > 120 mg/dl"
        selectedValue={form.fbs}
        onValueChange={set('fbs')}
        options={[{ label: 'No', value: 0 }, { label: 'Yes', value: 1 }]}
      />
      <PickerField
        label="Resting ECG"
        selectedValue={form.restecg}
        onValueChange={set('restecg')}
        options={[
          { label: '0 – Normal', value: 0 },
          { label: '1 – ST-T Wave Abnormality', value: 1 },
          { label: '2 – Left Ventricular Hypertrophy', value: 2 },
        ]}
      />
      <PickerField
        label="Slope of Peak Exercise ST"
        selectedValue={form.slope}
        onValueChange={set('slope')}
        options={[
          { label: '0 – Upsloping', value: 0 },
          { label: '1 – Flat', value: 1 },
          { label: '2 – Downsloping', value: 2 },
        ]}
      />
      <PickerField
        label="Major Vessels (Fluoroscopy)"
        hint="Number of vessels colored (0–3)"
        selectedValue={form.ca}
        onValueChange={set('ca')}
        options={[0, 1, 2, 3].map((v) => ({ label: `${v}`, value: v }))}
      />
      <PickerField
        label="Thalassemia"
        selectedValue={form.thal}
        onValueChange={set('thal')}
        options={[
          { label: '1 – Normal', value: 1 },
          { label: '2 – Fixed Defect', value: 2 },
          { label: '3 – Reversible Defect', value: 3 },
        ]}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Predict Risk →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#FED7D7', marginTop: 4 },
  sectionHeader: {
    borderLeftWidth: 4,
    borderLeftColor: '#E53E3E',
    paddingLeft: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748' },
  button: {
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
