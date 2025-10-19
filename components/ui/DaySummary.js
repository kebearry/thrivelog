import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

export default function DaySummary({ 
  date, 
  dayData, 
  foodLogs = [], 
  symptomLogs = [], 
  productLogs = [], 
  canonEvents = [],
  style,
  titleStyle,
  itemStyle,
  rowStyle
}) {
  const isPeriod = dayData?.is_period;
  const isPooped = dayData?.is_pooped;
  const isHousekeepingDay = dayData?.is_housekeeping_day;
  const reflection = dayData?.reflection;

  const hasAnyData =
    isPeriod ||
    isPooped ||
    isHousekeepingDay ||
    !!reflection ||
    foodLogs.length > 0 ||
    symptomLogs.length > 0 ||
    productLogs.length > 0 ||
    canonEvents.length > 0;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, titleStyle]}>
        Summary for {formatDate(date)}
      </Text>
      
      {dayData && (
        <>
          {isPeriod && (
            <View style={[styles.row, rowStyle]}>
              <MaterialCommunityIcons name="water" size={22} color={colors.error} style={styles.icon} />
              <Text style={[styles.item, itemStyle]}>Period Day</Text>
            </View>
          )}
          
          {isPooped && (
            <View style={[styles.row, rowStyle]}>
              <Text style={styles.emojiIcon}>💩</Text>
              <Text style={[styles.item, itemStyle]}>Pooped</Text>
            </View>
          )}
          
          {isHousekeepingDay && (
            <View style={[styles.row, rowStyle]}>
              <MaterialCommunityIcons name="broom" size={20} color={colors.secondary} style={styles.icon} />
              <Text style={[styles.item, itemStyle]}>Housekeeping Day</Text>
            </View>
          )}
          
          {reflection && reflection.trim() !== '' && (
            <View style={[styles.reflectionRow, rowStyle]}>
              <Text style={styles.emojiIcon}>💬</Text>
              <Text style={[styles.item, itemStyle, styles.bold]}>Reflection:</Text>
              <Text style={[styles.item, itemStyle]}> {reflection}</Text>
            </View>
          )}
        </>
      )}
      
      {!hasAnyData && (
        <Text style={[styles.item, itemStyle, { paddingBottom: 20 }]}>No data for this day.</Text>
      )}
      
      {/* Food Summary */}
      <View style={[styles.row, rowStyle]}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.success} style={styles.icon} />
        <Text style={[styles.item, itemStyle]}>
          {foodLogs.length > 0 ? foodLogs.map(f => f.food).join(', ') : 'No food logged'}
        </Text>
      </View>
      
      {/* Symptoms Summary */}
      <View style={[styles.row, rowStyle]}>
        <MaterialCommunityIcons name="emoticon-sad-outline" size={20} color={colors.primary} style={styles.icon} />
        <Text style={[styles.item, itemStyle]}>
          {symptomLogs.length > 0 ? Array.from(new Set(symptomLogs.map(s => s.symptom.toLowerCase()))).join(', ') : 'No symptoms logged'}
        </Text>
      </View>
      
      {/* Products Summary */}
      <View style={[styles.row, rowStyle]}>
        <MaterialCommunityIcons name="cup" size={20} color={colors.info} style={styles.icon} />
        <Text style={[styles.item, itemStyle]}>
          {productLogs.length > 0 ? productLogs.map(p => p.product).join(', ') : 'No products logged'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8FA',
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 18,
    marginHorizontal: 16,
    alignItems: 'flex-start',
  },
  title: {
    color: '#C2185B',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reflectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  item: {
    color: '#22372B',
    fontSize: 16,
    marginBottom: 2,
    textAlign: 'left',
  },
  bold: {
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 8,
  },
  emojiIcon: {
    fontSize: 22,
    marginRight: 8,
    marginTop: 1,
  },
});
