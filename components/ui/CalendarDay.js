import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

export default function CalendarDay({ 
  date, 
  state, 
  markedDates, 
  selectedDate, 
  onPress, 
  onLongPress,
  scaleAnim,
  style,
  dayTextStyle,
  selectedDayStyle,
  periodDayStyle,
  marksRowStyle
}) {
  const dayStr = date.dateString;
  const mark = markedDates[dayStr];
  const isSelected = selectedDate === dayStr;
  const DayWrapper = isSelected ? Animated.View : View;

  return (
    <Pressable
      onPress={() => onPress(dayStr)}
      onLongPress={() => onLongPress(dayStr)}
      accessibilityLabel="Select day"
      accessible={true}
    >
      <DayWrapper
        style={[
          styles.dayCell,
          mark?.isPeriod && styles.periodDay,
          isSelected && styles.selectedDay,
          isSelected && {
            transform: [{ scale: scaleAnim }],
          },
          style,
          mark?.isPeriod && periodDayStyle,
          isSelected && selectedDayStyle,
        ]}
      >
        <Text style={[
          styles.dayText, 
          state === 'disabled' && styles.dayTextDisabled,
          dayTextStyle
        ]}>
          {date.day}
        </Text>
        
        <View style={[styles.marksRow, marksRowStyle]}>
          {mark?.isPooped && <View style={styles.poopDot} />}
          {mark?.isHousekeeping && (
            <MaterialCommunityIcons 
              name="broom" 
              size={16} 
              color={colors.secondary} 
              style={styles.housekeepingIcon} 
            />
          )}
        </View>
      </DayWrapper>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dayCell: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    margin: 2,
  },
  periodDay: {
    backgroundColor: 'rgba(255, 214, 230, 0.45)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E48CB2',
  },
  selectedDay: {
    borderWidth: 3,
    borderColor: 'rgba(255, 136, 180, 0.45)',
    borderRadius: 16,
    backgroundColor: 'transparent',
    shadowColor: '#FFD6E6',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  dayText: {
    fontSize: 20,
    color: '#22372B',
    fontWeight: '500',
  },
  dayTextDisabled: {
    color: '#ccc',
  },
  marksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    minHeight: 16,
  },
  poopDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8B5C2A',
    marginHorizontal: 1,
  },
  housekeepingIcon: {
    marginLeft: 2,
  },
});
