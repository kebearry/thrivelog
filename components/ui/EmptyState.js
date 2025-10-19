import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/theme';

export default function EmptyState({ 
  message = "No data found", 
  icon,
  style,
  messageStyle,
  containerStyle,
  title,
  titleStyle,
  centered = false,
  showIcon = true
}) {
  return (
    <View style={[
      styles.container, 
      centered && styles.centered,
      containerStyle
    ]}>
      {showIcon && icon && <View style={styles.iconContainer}>{icon}</View>}
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      <Text style={[styles.message, messageStyle]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 0,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  message: {
    color: colors.secondary,
    fontSize: 16,
    textAlign: 'center',
    paddingBottom: 20,
  },
});
