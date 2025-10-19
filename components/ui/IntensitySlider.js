import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function IntensitySlider({ 
  value, 
  onValueChange, 
  labels = ['Mild', 'Moderate', 'Strong', 'Very Strong', 'Severe'],
  label = "Intensity",
  style,
  labelStyle 
}) {
  const [sliderWidth, setSliderWidth] = useState(0);

  const LABEL_WIDTH = 120;
  const SLIDER_PADDING = 16;

  const getLabelLeftPx = () => {
    if (sliderWidth === 0) return '50%';
    const interval = (sliderWidth - 2 * SLIDER_PADDING) / 4;
    return SLIDER_PADDING + interval * (value - 1) - LABEL_WIDTH / 2;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.sliderContainer}>
        <View
          style={styles.sliderWrapper}
          onLayout={(event) => {
            setSliderWidth(event.nativeEvent.layout.width);
          }}
        >
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={value}
            onValueChange={onValueChange}
            minimumTrackTintColor="#D36B37"
            maximumTrackTintColor="#E5E5E5"
            thumbStyle={styles.thumb}
          />
          
          {/* Intensity Label */}
          <View style={[styles.intensityLabel, { left: getLabelLeftPx() }]}>
            <Text style={styles.intensityText}>
              {labels[value - 1]}
            </Text>
          </View>
        </View>
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
  sliderContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sliderWrapper: {
    position: 'relative',
    paddingHorizontal: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    backgroundColor: '#D36B37',
    width: 20,
    height: 20,
  },
  intensityLabel: {
    position: 'absolute',
    top: -30,
    width: 120,
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 14,
    color: '#D36B37',
    fontWeight: '600',
    textAlign: 'center',
  },
});
