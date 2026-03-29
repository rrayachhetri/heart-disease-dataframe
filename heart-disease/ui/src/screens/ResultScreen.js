import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const { result } = route.params;
  const { prediction, probability } = result;

  const isHigh = prediction === 1;
  const pct = Math.round(probability * 100);
  const color = isHigh ? '#E53E3E' : '#38A169';
  const bgColor = isHigh ? '#FFF5F5' : '#F0FFF4';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: bgColor, borderColor: color }]}>
        <Text style={[styles.icon]}>{isHigh ? '⚠️' : '✅'}</Text>
        <Text style={[styles.verdict, { color }]}>
          {isHigh ? 'Higher Risk Detected' : 'Lower Risk Detected'}
        </Text>
        <Text style={styles.subtext}>
          {isHigh
            ? 'The model predicts an elevated risk of heart disease. Please consult a physician.'
            : 'The model predicts a lower risk of heart disease. Continue healthy habits!'}
        </Text>
      </View>

      <View style={styles.probCard}>
        <Text style={styles.probLabel}>Risk Probability</Text>
        <Text style={[styles.probValue, { color }]}>{pct}%</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.barLabels}>
          <Text style={styles.barLabelText}>0%</Text>
          <Text style={styles.barLabelText}>50%</Text>
          <Text style={styles.barLabelText}>100%</Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚕️ This is a machine learning prediction for educational purposes only.
          It is not a medical diagnosis.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>← New Prediction</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7FAFC' },
  content: { padding: 24, paddingBottom: 40 },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: { fontSize: 48, marginBottom: 8 },
  verdict: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtext: { fontSize: 14, color: '#4A5568', textAlign: 'center', lineHeight: 20 },
  probCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  probLabel: { fontSize: 14, color: '#718096', marginBottom: 4 },
  probValue: { fontSize: 40, fontWeight: '800', marginBottom: 12 },
  barBg: {
    height: 12,
    backgroundColor: '#EDF2F7',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 6 },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  barLabelText: { fontSize: 11, color: '#A0AEC0' },
  disclaimer: {
    backgroundColor: '#EBF8FF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  disclaimerText: { fontSize: 12, color: '#2B6CB0', lineHeight: 18 },
  button: {
    backgroundColor: '#2D3748',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
