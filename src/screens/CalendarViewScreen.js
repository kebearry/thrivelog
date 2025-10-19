import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getDaysForMonth } from '../api/day';
import { useNavigation } from '@react-navigation/native';
import { getFoodLogs } from '../api/foodlogs';
import { getSymptomLogs } from '../api/symptomlogs';
import { getProductLogs } from '../api/productlogs';
import { getCanonEventsForDay } from '../api/canonevents';
import { colors, fonts } from '../theme';
import { supabase } from '../supabaseClient';
import { DaySummary, CalendarDay, LoadingScreen, EmptyState } from '../../components/ui';

function toDateString(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.slice(0, 10);
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  return String(date);
}

function getMarkedDates(days) {
  const marked = {};
  days.forEach(day => {
    const dateStr = toDateString(day.date);
    marked[dateStr] = {
      isPeriod: !!day.is_period,
      isPooped: !!day.is_pooped,
      isHousekeeping: !!day.is_housekeeping_day,
      reflection: day.reflection,
    };
  });
  return marked;
}

export default function CalendarViewScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(true);
  const [daysData, setDaysData] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [symptomLogs, setSymptomLogs] = useState([]);
  const [productLogs, setProductLogs] = useState([]);
  const [canonEvents, setCanonEvents] = useState([]);
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  });

  // Add double tap detection logic
  let lastTap = null;
  const DOUBLE_TAP_DELAY = 300;

  useEffect(() => {
    const fetchDays = async () => {
      setLoading(true);
      try {
        const { year, month } = displayedMonth;
        const days = await getDaysForMonth(year, month);
        setDaysData(days);
        setMarkedDates(getMarkedDates(days));
      } catch (e) {
        setDaysData([]);
        setMarkedDates({});
      } finally {
        setLoading(false);
      }
    };
    fetchDays();
  }, [displayedMonth]);

  // Fetch food and symptom logs for today
  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedDate) return;
      try {
        const foods = await getFoodLogs(selectedDate);
        setFoodLogs(foods);
      } catch (e) {
        setFoodLogs([]);
      }
      try {
        const symptoms = await getSymptomLogs(selectedDate);
        setSymptomLogs(symptoms);
      } catch (e) {
        setSymptomLogs([]);
      }
      try {
        const products = await getProductLogs(selectedDate);
        setProductLogs(products);
      } catch (e) {
        setProductLogs([]);
      }
      try {
        const user = supabase.auth.user();
        if (user) {
          const events = await getCanonEventsForDay(user.id, selectedDate ? new Date(selectedDate) : new Date());
          setCanonEvents(events);
        } else {
          setCanonEvents([]);
        }
      } catch (e) {
        setCanonEvents([]);
      }
    };
    fetchLogs();
  }, [selectedDate]);

  // Animate scale when selectedDate changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.12,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedDate]);

  if (loading) {
    return <LoadingScreen message="Loading calendar..." />;
  }

  // Custom day rendering
  const renderDay = ({ date, state }) => {
    return (
      <CalendarDay
        date={date}
        state={state}
        markedDates={markedDates}
        selectedDate={selectedDate}
        scaleAnim={scaleAnim}
        onPress={(dayStr) => {
          const now = Date.now();
          if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
            lastTap = null;
            navigation.navigate('ViewYourDay', { date: dayStr });
          } else {
            lastTap = now;
            setSelectedDate(dayStr);
          }
        }}
        onLongPress={(dayStr) => navigation.navigate('ViewYourDay', { date: dayStr })}
      />
    );
  };

  const selectedDayData = daysData.find(d => toDateString(d.date) === selectedDate);

  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        <Calendar
          markingType={undefined}
          dayComponent={renderDay}
          style={styles.calendar}
          theme={{
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
            textSectionTitleColor: colors.secondary,
          }}
          onMonthChange={(monthObj) => {
            setDisplayedMonth({ year: monthObj.year, month: monthObj.month });
            setCurrentMonthDate(`${monthObj.year}-${String(monthObj.month).padStart(2, '0')}-01`);
          }}
          current={currentMonthDate}
        />
        {daysData.length === 0 && foodLogs.length === 0 && symptomLogs.length === 0 && productLogs.length === 0 && (
          <EmptyState message="No data found for this month." />
        )}
        {/* Show summary for today as a card/section below the calendar */}
        {selectedDate && (
          <DaySummary
            date={selectedDate}
            dayData={selectedDayData}
            foodLogs={foodLogs}
            symptomLogs={symptomLogs}
            productLogs={productLogs}
            canonEvents={canonEvents}
          />
        )}
        {/* Add more margin below summary for today */}
        {selectedDate === new Date().toISOString().slice(0, 10) && <View style={{ marginBottom: 40 }} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 24,
  },
  calendar: {
    borderRadius: 18,
    margin: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
}); 
