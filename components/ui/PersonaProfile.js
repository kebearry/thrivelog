import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { createPersona, updatePersona, deletePersona } from '../../src/api/personas';

const PersonaProfile = ({ 
  persona = null, 
  onSave, 
  onDelete, 
  onCancel,
  userId,
  onPersonaCreated 
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [personality, setPersonality] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [interests, setInterests] = useState('');
  const [memories, setMemories] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (persona) {
      setName(persona.name || '');
      setRelationship(persona.relationship || '');
      setPersonality(persona.personality || '');
      setCommunicationStyle(persona.communication_style || '');
      setInterests(persona.interests || '');
      setMemories(persona.memories || '');
      setSpeakingStyle(persona.speaking_style || '');
    }
  }, [persona]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this persona');
      return;
    }

    setIsLoading(true);
    try {
      const personaData = {
        user_id: userId,
        name: name.trim(),
        relationship: relationship.trim(),
        personality: personality.trim(),
        communication_style: communicationStyle.trim(),
        interests: interests.trim(),
        memories: memories.trim(),
        speaking_style: speakingStyle.trim(),
      };

      if (persona) {
        await updatePersona(persona.id, personaData);
        Alert.alert('Success', 'Persona updated successfully!');
        onSave?.();
      } else {
        const newPersona = await createPersona(personaData);
        Alert.alert('Success', 'Persona created successfully!');
        onPersonaCreated?.(newPersona);
        onSave?.();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save persona. Please try again.');
      console.error('Error saving persona:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!persona) return;
    
    Alert.alert(
      'Delete Persona',
      `Are you sure you want to delete "${persona.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deletePersona(persona.id);
              Alert.alert('Success', 'Persona deleted successfully!');
              onDelete?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete persona. Please try again.');
              console.error('Error deleting persona:', error);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {persona ? 'Edit Persona' : 'Create New Persona'}
          </Text>
          {persona && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Feather name="trash-2" size={20} color="#E53935" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.form}>
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Mom, Dad, Sarah, Grandma"
            style={styles.input}
          />

          <Input
            label="Relationship"
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g., Mother, Sister, Best Friend, Partner"
            style={styles.input}
          />

          <Input
            label="Personality"
            value={personality}
            onChangeText={setPersonality}
            placeholder="e.g., Warm, caring, sometimes strict but loving"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Input
            label="Communication Style"
            value={communicationStyle}
            onChangeText={setCommunicationStyle}
            placeholder="e.g., Direct, gentle, uses lots of questions, gives advice"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Input
            label="Interests & Hobbies"
            value={interests}
            onChangeText={setInterests}
            placeholder="e.g., Gardening, cooking, reading, traveling"
            multiline
            numberOfLines={2}
            style={styles.input}
          />

          <Input
            label="Shared Memories"
            value={memories}
            onChangeText={setMemories}
            placeholder="e.g., Our family trips, that time we baked cookies together"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Input
            label="Speaking Style"
            value={speakingStyle}
            onChangeText={setSpeakingStyle}
            placeholder="e.g., Uses pet names, tells stories, asks about your day"
            multiline
            numberOfLines={2}
            style={styles.input}
          />
        </View>

        <View style={styles.buttons}>
          <Button
            title="Cancel"
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
            textStyle={styles.cancelButtonText}
          />
          <Button
            title={persona ? 'Update Persona' : 'Create Persona'}
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            textStyle={styles.saveButtonText}
            disabled={isLoading}
          />
        </View>

        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#D36B37" />
            <Text style={styles.loadingText}>
              {persona ? 'Updating...' : 'Creating...'}
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  card: {
    margin: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 0,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#D36B37',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  loadingText: {
    color: '#6c757d',
    fontSize: 14,
  },
});

export default PersonaProfile;
