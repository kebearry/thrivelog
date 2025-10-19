import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'large', 
  disabled = false, 
  loading = false,
  style,
  textStyle,
  ...props 
}) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#fff' : '#D36B37'} 
          size="small" 
        />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  
  // Variants
  primary: {
    backgroundColor: '#D36B37',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: '#1F513F',
    borderWidth: 2,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#D36B37',
    borderWidth: 2,
  },
  
  // Sizes
  large: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#1F513F',
  },
  outlineText: {
    color: '#D36B37',
  },
  
  // Size text
  largeText: {
    fontSize: 18,
  },
  mediumText: {
    fontSize: 16,
  },
  smallText: {
    fontSize: 14,
  },
  
  // Disabled states
  disabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  disabledText: {
    color: '#888',
  },
});
