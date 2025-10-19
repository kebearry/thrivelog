import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { groqService } from '../../src/services/groqService';

export default function InputWithMoodTags({ 
  value, 
  onChangeText, 
  onMoodTagSelect, 
  onClearSelectedTags,
  selectedMoodTags = [],
  placeholder = "How are you feeling today?"
}) {
  const [moodTags, setMoodTags] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Generate mood tags when text changes
  useEffect(() => {
    if (value && value.trim().length > 10) {
      generateTags(value);
    } else {
      setMoodTags([]);
    }
  }, [value]);

  // Auto-select new tags when they appear
  useEffect(() => {
    if (moodTags.length > 0 && onMoodTagSelect) {
      moodTags.forEach(tag => {
        if (!selectedMoodTags.some(selected => selected.text === tag.text)) {
          onMoodTagSelect(tag);
        }
      });
    }
  }, [moodTags, selectedMoodTags, onMoodTagSelect]);

  const generateTags = useCallback(async (text) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const tags = await groqService.generateMoodTags(text);
      setMoodTags(tags);
    } catch (error) {
      console.error('Error generating mood tags:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating]);

  const handleTagPress = useCallback((tag) => {
    if (onMoodTagSelect) {
      onMoodTagSelect(tag);
    }
  }, [onMoodTagSelect]);

  const isTagSelected = (tag) => {
    return selectedMoodTags.some(selected => selected.text === tag.text);
  };

  const selectedCount = selectedMoodTags.length;

  return (
    <View style={styles.container}>
      {moodTags.length > 0 && (
        <View style={styles.moodTagsSection}>
          <View style={styles.moodTagsHeader}>
            <Text style={styles.moodTagsTitle}>
              {selectedCount} selected, tap ✕ to remove
            </Text>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setShowTooltip(!showTooltip)}
            >
              <Feather name="help-circle" size={16} color="#D36B37" />
            </TouchableOpacity>
          </View>
          
          {showTooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>
                Blue tags are from photo analysis, orange tags are from text analysis
              </Text>
            </View>
          )}

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScrollView}
          >
            <View style={styles.tagsContainer}>
              {moodTags.map((tag, index) => {
                const isSelected = isTagSelected(tag);
                return (
                  <TouchableOpacity
                    key={`${tag.text}-${index}`}
                    style={[
                      styles.moodTag,
                      tag.source === 'gemini' ? styles.geminiTag : styles.groqTag,
                      isSelected && styles.selectedTag
                    ]}
                    onPress={() => handleTagPress(tag)}
                  >
                    <Text style={[
                      styles.moodTagText,
                      tag.source === 'gemini' ? styles.geminiTagText : styles.groqTagText,
                      isSelected && styles.selectedTagText
                    ]}>
                      {tag.text}
                    </Text>
                    {isSelected && (
                      <TouchableOpacity
                        style={styles.crossOutButton}
                        onPress={() => handleTagPress(tag)}
                      >
                        <Feather name="x" size={12} color="#D36B37" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  moodTagsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  moodTagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moodTagsTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  helpButton: {
    padding: 4,
  },
  tooltip: {
    backgroundColor: '#F8F3F0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  tooltipText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tagsScrollView: {
    maxHeight: 40,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  groqTag: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  geminiTag: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#42A5F5',
  },
  selectedTag: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D36B37',
  },
  moodTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  groqTagText: {
    color: '#E65100',
  },
  geminiTagText: {
    color: '#1976D2',
  },
  selectedTagText: {
    color: '#D36B37',
  },
  crossOutButton: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D36B37',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
