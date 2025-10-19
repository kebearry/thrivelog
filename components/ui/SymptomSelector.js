import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function SymptomSelector({ 
  symptoms, 
  selectedSymptom, 
  onSymptomSelect, 
  label = "Select Symptom",
  style,
  labelStyle,
  buttonStyle,
  selectedButtonStyle,
  textStyle,
  selectedTextStyle,
  variant = "default" // "default" or "pill"
}) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.symptomGrid}>
        {symptoms.map((symptom) => (
          <TouchableOpacity
            key={symptom.key}
            style={[
              variant === "pill" ? styles.pillButton : styles.symptomButton,
              selectedSymptom === symptom.key && (variant === "pill" ? styles.pillButtonSelected : styles.symptomButtonSelected),
              buttonStyle,
              selectedSymptom === symptom.key && selectedButtonStyle
            ]}
            onPress={() => onSymptomSelect(symptom.key)}
          >
            <View style={styles.symptomContent}>
              {symptom.icon}
              <Text style={[
                variant === "pill" ? styles.pillText : styles.symptomText,
                selectedSymptom === symptom.key && (variant === "pill" ? styles.pillTextSelected : styles.symptomTextSelected),
                textStyle,
                selectedSymptom === symptom.key && selectedTextStyle
              ]}>
                {symptom.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A4D39',
    marginBottom: 15,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  symptomButton: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    margin: 4,
    marginBottom: 8,
  },
  symptomButtonSelected: {
    backgroundColor: '#D36B37',
    borderColor: '#D36B37',
  },
  symptomContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomText: {
    fontSize: 16,
    color: '#3A4D39',
    fontWeight: '500',
    marginLeft: 8,
  },
  symptomTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Pill variant styles (for original LogSymptomScreen design)
  pillButton: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    margin: 4,
    marginBottom: 8,
  },
  pillButtonSelected: {
    backgroundColor: '#FBE9D0',
    borderColor: '#D36B37',
  },
  pillText: {
    fontSize: 18,
    color: '#22372B',
    fontWeight: '500',
    marginLeft: 12,
  },
  pillTextSelected: {
    color: '#22372B',
    fontWeight: '600',
  },
});
