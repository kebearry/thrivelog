import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MoodSelector({ 
  selectedMood, 
  onMoodSelect, 
  promptQuestion = "How are you feeling right now?",
  style 
}) {
  // Contextual emojis based on prompt question
  const getContextualEmojis = (question) => {
    if (question.includes('feeling') || question.includes('mood')) {
      return ['😢', '😐', '🙂', '😊', '🤩'];
    } else if (question.includes('well') || question.includes('good')) {
      return ['😞', '😐', '🙂', '😊', '🤩'];
    } else if (question.includes('challenge') || question.includes('difficult')) {
      return ['😰', '😕', '😐', '🙂', '😌'];
    } else if (question.includes('grateful') || question.includes('thankful')) {
      return ['😔', '🙂', '😊', '🤗', '🥰'];
    } else if (question.includes('body') || question.includes('physical')) {
      return ['😣', '😐', '🙂', '😌', '💪'];
    } else if (question.includes('remember') || question.includes('special')) {
      return ['😴', '😐', '🙂', '😊', '✨'];
    } else if (question.includes('differently') || question.includes('tomorrow')) {
      return ['😔', '😐', '🙂', '😊', '🚀'];
    }
    // Default emojis
    return ['😢', '😐', '🙂', '😊', '🤩'];
  };

  // Contextual labels based on prompt question
  const getContextualLabels = (question) => {
    if (question.includes('feeling') || question.includes('mood')) {
      return ['Sad', 'Neutral', 'Okay', 'Good', 'Great'];
    } else if (question.includes('well') || question.includes('good')) {
      return ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    } else if (question.includes('challenge') || question.includes('difficult')) {
      return ['Very Hard', 'Hard', 'Okay', 'Easy', 'Very Easy'];
    } else if (question.includes('grateful') || question.includes('thankful')) {
      return ['Not Much', 'A Little', 'Some', 'A Lot', 'Overwhelming'];
    } else if (question.includes('body') || question.includes('physical')) {
      return ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    } else if (question.includes('remember') || question.includes('special')) {
      return ['Forgettable', 'Okay', 'Nice', 'Special', 'Unforgettable'];
    } else if (question.includes('differently') || question.includes('tomorrow')) {
      return ['Not Ready', 'Maybe', 'Ready', 'Excited', 'Very Excited'];
    }
    // Default labels
    return ['Sad', 'Neutral', 'Okay', 'Good', 'Great'];
  };

  const emojis = getContextualEmojis(promptQuestion);
  const labels = getContextualLabels(promptQuestion);

  return (
    <View style={[styles.container, style]}>
      {promptQuestion && <Text style={styles.label}>{promptQuestion}</Text>}
      <View style={styles.moodButtons}>
        {emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.moodButton,
              selectedMood === index + 1 && styles.moodButtonSelected
            ]}
            onPress={() => onMoodSelect(index + 1)}
          >
            <Text style={styles.moodEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A4D39',
    marginBottom: 15,
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  moodButtonSelected: {
    backgroundColor: '#D36B37',
  },
  moodEmoji: {
    fontSize: 20,
  },
});
