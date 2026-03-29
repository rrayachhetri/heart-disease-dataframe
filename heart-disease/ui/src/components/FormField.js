import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function FormField({ label, hint, value, onChangeText }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="Enter value"
        placeholderTextColor="#A0AEC0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 2 },
  hint: { fontSize: 12, color: '#718096', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#2D3748',
    backgroundColor: '#FFFFFF',
  },
});
