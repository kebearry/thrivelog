import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RadioGroup({ 
  options, 
  selectedValue, 
  onValueChange, 
  label,
  style,
  labelStyle,
  layout = "vertical", // "vertical" or "grid"
  columns = 2
}) {
  const renderOption = (option) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.radioRow,
        layout === "grid" && styles.radioRowGrid
      ]}
      onPress={() => onValueChange(option.value)}
      accessibilityLabel={option.label}
      activeOpacity={0.7}
    >
      <View style={[
        styles.radioOuter, 
        selectedValue === option.value && styles.radioOuterSelected
      ]}>
        {selectedValue === option.value && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{option.label}</Text>
    </TouchableOpacity>
  );

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < options.length; i += columns) {
      const rowOptions = options.slice(i, i + columns);
      rows.push(
        <View key={i} style={styles.radioRowCompact}>
          {rowOptions.map(renderOption)}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.radioGroup}>
        {layout === "grid" ? renderGrid() : options.map(renderOption)}
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
  radioGroup: {
    marginTop: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginRight: 24,
  },
  radioRowGrid: {
    marginRight: 24,
  },
  radioRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#275B44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#275B44',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#275B44',
  },
  radioLabel: {
    fontSize: 18,
    color: '#22372B',
    fontFamily: 'serif',
  },
});
