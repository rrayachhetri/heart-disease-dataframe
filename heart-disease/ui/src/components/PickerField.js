import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function PickerField({ label, hint, selectedValue, onValueChange, options }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.pickerWrapper}>
        {Platform.OS === 'web' ? (
          <select
            value={selectedValue}
            onChange={(e) => onValueChange(Number(e.target.value))}
            style={webSelectStyle}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <Picker
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={styles.picker}
          >
            {options.map((opt) => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        )}
      </View>
    </View>
  );
}

const webSelectStyle = {
  width: '100%',
  height: 48,
  padding: '0 12px',
  fontSize: 15,
  color: '#2D3748',
  backgroundColor: '#FFFFFF',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 2 },
  hint: { fontSize: 12, color: '#718096', marginBottom: 4 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: { height: 48, color: '#2D3748' },
});
