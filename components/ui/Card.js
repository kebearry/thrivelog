import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Card({ 
  children, 
  style, 
  padding = 20,
  shadow = true,
  ...props 
}) {
  const cardStyle = [
    styles.card,
    { padding },
    shadow && styles.shadow,
    style
  ];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shadow: {
    // Shadow styles are included in the card style above
  },
});
