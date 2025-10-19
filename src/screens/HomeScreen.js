import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useFonts } from 'expo-font';
import { supabase } from '../supabaseClient';
// import { useTranslation } from '../hooks/useTranslation';
// import TranslatedText from '../components/TranslatedText';

export default function HomeScreen({ navigation }) {
  const [dailyStats, setDailyStats] = useState({ foods: 0, symptoms: 0 });
  
  let [fontsLoaded] = useFonts({
    "PlayfairDisplay-Bold": require("../../assets/fonts/PlayfairDisplay-Bold.ttf"),
  });

  // Fetch today's stats
  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get food logs count
        const { count: foodCount } = await supabase
          .from('food_logs')
          .select('*', { count: 'exact', head: true })
          .eq('created_at', today);
        
        // Get symptom logs count
        const { count: symptomCount } = await supabase
          .from('symptom_logs')
          .select('*', { count: 'exact', head: true })
          .eq('created_at', today);
        
        setDailyStats({
          foods: foodCount || 0,
          symptoms: symptomCount || 0
        });
      } catch (error) {
      }
    };

    fetchDailyStats();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            <Text style={styles.logoThrive}>Thrive</Text>
            <Text style={styles.logoLog}>log</Text>
          </Text>
        </View>
        <Text style={styles.tagline}>Your body&apos;s data. Decoded.</Text>
      </View>

      {/* Main Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
          onPress={() => navigation.navigate("FoodLog")}
        >
          <MaterialCommunityIcons name="food-apple-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Add Food</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
          onPress={() => navigation.navigate("LogSymptom")}
        >
          <Feather name="frown" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Log Symptom</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed
          ]}
          onPress={() => navigation.navigate("Reflect")}
        >
          <Feather name="message-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Reflect</Text>
        </Pressable>
      </View>

      {/* Daily Summary */}
      <View style={styles.dailySummary}>
        <Text style={styles.dailySummaryText}>
          You logged {dailyStats.foods} foods and {dailyStats.symptoms} symptoms today.
        </Text>
        <Pressable
          style={styles.viewFullDayButton}
          onPress={() => navigation.navigate("ViewYourDay")}
        >
          <Text style={styles.viewFullDayText}>View Full Day</Text>
          <Feather name="chevron-right" size={16} color="#275B44" />
        </Pressable>
      </View>

      {/* Reflection Prompt */}
      <View style={styles.reflectionSection}>
        <View style={styles.reflectionHeader}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.reflectionText}>Take a minute to review how you feel.</Text>
        </View>
        <Pressable
          style={styles.reflectButton}
          onPress={() => navigation.navigate("ReflectionsFeed")}
        >
          <Text style={styles.reflectButtonText}>Start Reflect Mode</Text>
        </Pressable>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBE4',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 36,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  logoThrive: {
    color: '#D36B37',
  },
  logoLog: {
    color: '#1F513F',
  },
  tagline: {
    fontSize: 18,
    color: '#1F513F',
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D36B37',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    width: '100%',
  },
  actionButtonPressed: {
    backgroundColor: '#B85A2A',
    shadowOpacity: 0.2,
    elevation: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  dailySummary: {
    backgroundColor: '#F8F3F0',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  dailySummaryText: {
    fontSize: 16,
    color: '#1F513F',
    marginBottom: 12,
    fontWeight: '600',
  },
  viewFullDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFullDayText: {
    fontSize: 16,
    color: '#D36B37',
    fontWeight: '600',
    marginRight: 8,
  },
  reflectionSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparkleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reflectionText: {
    fontSize: 16,
    color: '#1F513F',
    fontWeight: '600',
    flex: 1,
  },
  reflectButton: {
    backgroundColor: '#fff',
    borderColor: '#1F513F',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  reflectButtonText: {
    fontSize: 16,
    color: '#1F513F',
    fontWeight: '600',
  },
});
