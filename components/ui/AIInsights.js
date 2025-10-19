import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { groqSummaryService } from '../../src/services/groqSummaryService';
import MoodArt from './MoodArt';

export default function AIInsights({ onDigestGenerated }) {
  const [weeklyDigest, setWeeklyDigest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [artData, setArtData] = useState(null);


  const generateDigest = useCallback(async () => {
    setIsLoading(true);
    try {
      const digest = await groqSummaryService.generateWeeklyDigest();
      setWeeklyDigest(digest);
      onDigestGenerated && onDigestGenerated(digest);
      
      // Create reflection data for MoodArt
      const reflectionData = {
        mood: digest.theme?.toLowerCase() || 'content',
        theme: digest.theme || 'Reflection',
        summary: digest.summary || 'Your recent reflections',
        bullets: digest.bullets || [],
        tip: digest.tip || 'Keep reflecting on your journey'
      };
      setArtData(reflectionData);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      Alert.alert(
        'Error',
        'Failed to generate AI insights. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [onDigestGenerated]);

  // Auto-generate on mount only - use ref to prevent infinite loops
  const hasGeneratedRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasGeneratedRef.current && !weeklyDigest && !isLoading) {
      hasGeneratedRef.current = true;
      generateDigest();
    }
  }, [generateDigest, weeklyDigest, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.digestCard}>
        <View style={styles.digestHeader}>
          <View style={styles.digestTitleContainer}>
            <Feather name="cpu" size={20} color="#D36B37" />
            <Text style={styles.digestTitle}>AI Insights</Text>
          </View>
          <ActivityIndicator size="small" color="#D36B37" />
        </View>
        <Text style={styles.digestSubtext}>
          Analyzing your recent reflections...
        </Text>
      </View>
    );
  }

  if (!weeklyDigest) {
    return (
      <View style={styles.digestCard}>
        <View style={styles.digestHeader}>
          <View style={styles.digestTitleContainer}>
            <Feather name="cpu" size={20} color="#D36B37" />
            <Text style={styles.digestTitle}>AI Insights</Text>
          </View>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateDigest}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.digestSubtext}>
          Get AI-powered insights from your recent reflections
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Mood Art Component */}
      {artData && (
        <MoodArt 
          reflectionData={artData}
          onArtGenerated={(art) => {
            console.log('Mood art generated:', art);
          }}
        />
      )}

      {/* AI Insights Card */}
      <View style={styles.digestCard}>
        <View style={styles.digestHeader}>
          <View style={styles.digestTitleContainer}>
            <Feather name="cpu" size={20} color="#D36B37" />
            <Text style={styles.digestTitle}>AI Insights</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={generateDigest}
            disabled={isLoading}
          >
            <Feather name="refresh-cw" size={16} color="#D36B37" />
          </TouchableOpacity>
        </View>

        <Text style={styles.summaryText}>
          {typeof weeklyDigest.summary === 'string' 
            ? weeklyDigest.summary 
            : weeklyDigest.summary?.message || JSON.stringify(weeklyDigest.summary)}
        </Text>

        {weeklyDigest.bullets && weeklyDigest.bullets.length > 0 && (
          <View style={styles.bulletsContainer}>
            {weeklyDigest.bullets.map((bullet, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>
                  {typeof bullet === 'string' 
                    ? bullet 
                    : bullet.label 
                      ? `${bullet.label}: ${bullet.items ? bullet.items.join(', ') : ''}`
                      : bullet.title || bullet.description || JSON.stringify(bullet)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {weeklyDigest.tip && (
          <View style={styles.tipContainer}>
            <View style={styles.tipHeader}>
              <Feather name="zap" size={16} color="#D36B37" />
              <Text style={styles.tipTitle}>Tip</Text>
            </View>
            <Text style={styles.tipText}>
              {typeof weeklyDigest.tip === 'string' 
                ? weeklyDigest.tip 
                : weeklyDigest.tip?.title 
                  ? `${weeklyDigest.tip.title}: ${weeklyDigest.tip.description || ''}`
                  : weeklyDigest.tip?.description || JSON.stringify(weeklyDigest.tip)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  digestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#D36B37',
  },
  digestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  digestTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  digestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F513F',
    marginLeft: 8,
  },
  digestSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D36B37',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshButton: {
    padding: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#1F513F',
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletsContainer: {
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#D36B37',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    color: '#1F513F',
    lineHeight: 20,
    flex: 1,
  },
  tipContainer: {
    backgroundColor: '#F8F3F0',
    borderRadius: 8,
    padding: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D36B37',
    marginLeft: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#1F513F',
    lineHeight: 20,
  },
});
