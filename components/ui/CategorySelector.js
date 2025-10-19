import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CategorySelector({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  label = "Category",
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
      
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              variant === "pill" ? styles.pillButton : styles.categoryButton,
              selectedCategory === category && (variant === "pill" ? styles.pillButtonSelected : styles.categoryButtonSelected),
              buttonStyle,
              selectedCategory === category && selectedButtonStyle
            ]}
            onPress={() => onCategorySelect(category)}
          >
            <Text style={[
              variant === "pill" ? styles.pillText : styles.categoryText,
              selectedCategory === category && (variant === "pill" ? styles.pillTextSelected : styles.categoryTextSelected),
              textStyle,
              selectedCategory === category && selectedTextStyle
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#D36B37',
    borderColor: '#D36B37',
  },
  categoryText: {
    fontSize: 16,
    color: '#3A4D39',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Pill variant styles (for original FoodLogScreen design)
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
  },
  pillTextSelected: {
    color: '#22372B',
    fontWeight: '600',
  },
});
