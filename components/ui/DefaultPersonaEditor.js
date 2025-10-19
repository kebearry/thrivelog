import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { createPersona } from '../../src/api/personas';

const DefaultPersonaEditor = ({ 
  userId, 
  onSave, 
  onCancel 
}) => {
  const [personas, setPersonas] = useState([]);
  const [savingPersona, setSavingPersona] = useState(null);
  const [expandedPersona, setExpandedPersona] = useState(null);

  useEffect(() => {
    // Default personas with editable fields
    const defaultPersonas = [
      {
        id: 'mom',
        name: 'Mom',
        emoji: '👩‍👧',
        baseDescription: 'Caring and nurturing',
        personality: '',
        communication_style: '',
        interests: '',
        memories: '',
        speaking_style: '',
      },
      {
        id: 'teacher',
        name: 'Teacher',
        emoji: '👨‍🏫',
        baseDescription: 'Wise and encouraging',
        personality: '',
        communication_style: '',
        interests: '',
        memories: '',
        speaking_style: '',
      },
      {
        id: 'friend',
        name: 'Best Friend',
        emoji: '👫',
        baseDescription: 'Supportive and understanding',
        personality: '',
        communication_style: '',
        interests: '',
        memories: '',
        speaking_style: '',
      },
      {
        id: 'therapist',
        name: 'Therapist',
        emoji: '🧠',
        baseDescription: 'Professional and insightful',
        personality: '',
        communication_style: '',
        interests: '',
        memories: '',
        speaking_style: '',
      },
      {
        id: 'mentor',
        name: 'Mentor',
        emoji: '👨‍💼',
        baseDescription: 'Experienced and guiding',
        personality: '',
        communication_style: '',
        interests: '',
        memories: '',
        speaking_style: '',
      },
    ];
    
    setPersonas(defaultPersonas);
  }, []);

  const updatePersonaField = (personaId, field, value) => {
    setPersonas(prev => prev.map(p => 
      p.id === personaId ? { ...p, [field]: value } : p
    ));
  };

  const togglePersonaExpansion = (personaId) => {
    setExpandedPersona(expandedPersona === personaId ? null : personaId);
  };

  const savePersona = async (persona) => {
    if (!persona.name.trim()) {
      Alert.alert('Error', 'Please enter a name for this persona');
      return;
    }

    setSavingPersona(persona.id);
    try {
      const personaData = {
        user_id: userId,
        name: persona.name.trim(),
        relationship: persona.name.trim(),
        personality: persona.personality.trim(),
        communication_style: persona.communication_style.trim(),
        interests: persona.interests.trim(),
        memories: persona.memories.trim(),
        speaking_style: persona.speaking_style.trim(),
      };

      await createPersona(personaData);
      Alert.alert('Success', `${persona.name} persona customized successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save persona. Please try again.');
      console.error('Error saving persona:', error);
    } finally {
      setSavingPersona(null);
    }
  };

  const renderPersonaEditor = (persona) => {
    const isExpanded = expandedPersona === persona.id;
    const hasCustomizations = persona.personality || persona.communication_style || 
                             persona.interests || persona.memories || persona.speaking_style;

    return (
      <Card key={persona.id} style={styles.personaCard}>
        <TouchableOpacity 
          style={styles.personaHeader}
          onPress={() => togglePersonaExpansion(persona.id)}
        >
          <Text style={styles.personaEmoji}>{persona.emoji}</Text>
          <View style={styles.personaInfo}>
            <Text style={styles.personaName}>{persona.name}</Text>
            <Text style={styles.baseDescription}>{persona.baseDescription}</Text>
            {hasCustomizations && (
              <Text style={styles.customizedLabel}>✓ Customized</Text>
            )}
          </View>
          <Feather 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#D36B37" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.form}>
              <Input
                label="Personality Traits"
                value={persona.personality}
                onChangeText={(value) => updatePersonaField(persona.id, 'personality', value)}
                placeholder="e.g., Warm, caring, sometimes strict but loving"
                multiline
                numberOfLines={2}
                style={styles.input}
              />

              <Input
                label="Communication Style"
                value={persona.communication_style}
                onChangeText={(value) => updatePersonaField(persona.id, 'communication_style', value)}
                placeholder="e.g., Direct, gentle, uses lots of questions, gives advice"
                multiline
                numberOfLines={2}
                style={styles.input}
              />

              <Input
                label="Interests & Hobbies"
                value={persona.interests}
                onChangeText={(value) => updatePersonaField(persona.id, 'interests', value)}
                placeholder="e.g., Gardening, cooking, reading, traveling"
                multiline
                numberOfLines={2}
                style={styles.input}
              />

              <Input
                label="Shared Memories"
                value={persona.memories}
                onChangeText={(value) => updatePersonaField(persona.id, 'memories', value)}
                placeholder="e.g., Our family trips, that time we baked cookies together"
                multiline
                numberOfLines={2}
                style={styles.input}
              />

              <Input
                label="Speaking Style"
                value={persona.speaking_style}
                onChangeText={(value) => updatePersonaField(persona.id, 'speaking_style', value)}
                placeholder="e.g., Uses pet names, tells stories, asks about your day"
                multiline
                numberOfLines={2}
                style={styles.input}
              />
            </View>

            <View style={styles.personaActions}>
              <Button
                title={savingPersona === persona.id ? 'Saving...' : 'Save This Persona'}
                onPress={() => savePersona(persona)}
                style={styles.saveButton}
                disabled={savingPersona === persona.id}
              />
              {savingPersona === persona.id && (
                <ActivityIndicator size="small" color="#D36B37" style={styles.loading} />
              )}
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>

      {personas.map(renderPersonaEditor)}

      <View style={styles.footer}>
        <Button
          title="Done Customizing"
          onPress={onSave}
          style={styles.doneButton}
        />
        <Button
          title="Cancel"
          onPress={onCancel}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 24,
  },
  personaCard: {
    margin: 16,
    marginBottom: 8,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  personaEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  baseDescription: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  customizedLabel: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 0,
  },
  personaActions: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#D36B37',
  },
  loading: {
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    gap: 12,
  },
  doneButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#6c757d',
  },
});

export default DefaultPersonaEditor;
