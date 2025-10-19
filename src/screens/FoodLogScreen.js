import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Image, ToastAndroid, Alert, ScrollView, KeyboardAvoidingView, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addFoodLog, getDistinctFoods, getFoodLogs } from '../api/foodlogs';
import { Button, Input, TimePicker, CategorySelector, SuggestionList } from '../../components/ui';

export default function FoodLogScreen({ navigation, allowNotifications }) {
  const [food, setFood] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState('breakfast');
  const categories = ['breakfast', 'lunch', 'dinner', 'others'];
  const [selectedTime, setSelectedTime] = useState(new Date().toISOString());
  const [allFoods, setAllFoods] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showNoSuggestions, setShowNoSuggestions] = useState(false);

  const handleSave = async () => {
    try {
      await addFoodLog({
        food,
        notes,
        category,
        photo_url: image,
        time: selectedTime,
      });
      setFood('');
      setNotes('');
      setImage(null);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Meal logged!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Meal logged!');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    try {
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              try {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert(
                    'Permission Required',
                    'Please allow camera access to take photos.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                const result = await ImagePicker.launchCameraAsync({
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                  exif: false,
                });
                if (!result.canceled) {
                  setImage(result.assets[0].uri);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to take photo. Please try again.');
              }
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert(
                    'Permission Required',
                    'Please allow photo library access to select photos.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                  exif: false,
                });
                if (!result.canceled) {
                  setImage(result.assets[0].uri);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to select photo. Please try again.');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open photo options. Please try again.');
    }
  };

  useEffect(() => {
    getDistinctFoods().then(setAllFoods).catch(() => setAllFoods([]));
    getFoodLogs().then(setFoodLogs).catch(() => setFoodLogs([]));
  }, []);

  useEffect(() => {
    if (food.length < 2) {
      setSuggestions([]);
      setShowNoSuggestions(false);
    } else {
      const filtered = allFoods.filter(f => f.toLowerCase().includes(food.toLowerCase()) && f.toLowerCase() !== food.toLowerCase());
      setSuggestions(filtered);
      setShowNoSuggestions(filtered.length === 0);
      if (filtered.length === 0) {
        const timer = setTimeout(() => setShowNoSuggestions(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [food, allFoods]);

  const removeImage = () => setImage(null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: 24 }}>
          <Text style={styles.title}>Let&apos;s add your meal.</Text>
          <Text style={styles.subtitle}>Every bite tells a story.</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage} accessibilityLabel="Add Photo" accessible={true}>
              <Feather name="camera" size={28} color="#22372B" style={{ marginRight: 10 }} />
              <Text style={styles.photoText}>Add a photo (optional)</Text>
            </TouchableOpacity>
            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.imagePreview}
                />
                <Pressable style={styles.removeImageButton} onPress={removeImage} hitSlop={10}>
                  <Text style={styles.removeImageText}>✕</Text>
                </Pressable>
              </View>
            )}
            {image && (
              <TouchableOpacity onPress={pickImage} style={styles.replaceLink} accessibilityLabel="Replace Photo" accessible={true}>
                <Text style={styles.replaceLinkText}>Replace photo</Text>
              </TouchableOpacity>
            )}
            <CategorySelector
              categories={categories}
              selectedCategory={category}
              onCategorySelect={setCategory}
              variant="pill"
            />
            <Text style={styles.categoryHint}>
              Help us sort your day by selecting a meal time.
            </Text>
            <TimePicker
              value={new Date(selectedTime)}
              onTimeChange={(date) => setSelectedTime(date.toISOString())}
              label="Time"
            />
            <View style={{ width: '100%', marginBottom: 18, position: 'relative' }}>
              <Input
                label="What did you eat?"
                value={food}
                onChangeText={setFood}
                placeholder="What did you eat?"
                style={[
                  food.length >= 2 && (suggestions.length > 0 || showNoSuggestions) && styles.inputAttached
                ]}
              />
              <SuggestionList
                suggestions={suggestions}
                searchTerm={food}
                showNoSuggestions={showNoSuggestions}
                onSuggestionSelect={(item) => {
                  setFood(item);
                  setSuggestions([]);
                  const lastLog = foodLogs.find(f => f.food === item && f.notes);
                  if (lastLog && lastLog.notes) setNotes(lastLog.notes);
                }}
              />
            </View>
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional—portion size, time, brand, etc."
              multiline
              numberOfLines={3}
            />
            <Button
              title="Save"
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#FCFAF3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    fontSize: 32,
    color: '#22372B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#22372B',
    marginBottom: 36,
    fontFamily: 'serif',
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    alignItems: 'center',
    marginTop: 0,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E3E3D7',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 28,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#FCFAF3',
  },
  photoText: {
    fontSize: 20,
    color: '#22372B',
    fontFamily: 'serif',
  },
  imagePreviewContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: 120,
    height: 90,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  removeImageText: {
    color: '#22372B',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  replaceLink: {
    marginBottom: 10,
  },
  replaceLinkText: {
    color: '#22372B',
    fontSize: 15,
    textDecorationLine: 'underline',
    opacity: 0.7,
    fontFamily: 'serif',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 18,
    fontSize: 18,
    marginBottom: 0,
    backgroundColor: '#fff',
    color: '#22372B',
    fontFamily: 'serif',
  },
  inputAttached: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  notesContainer: {
    width: '100%',
    marginBottom: 18,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  notesHint: {
    fontSize: 15,
    color: '#888',
    marginTop: 4,
    marginLeft: 6,
    fontFamily: 'serif',
  },
  saveButtonSpacer: {
    height: 16,
  },
  button: {
    backgroundColor: '#d56c3e',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 0,
    width: '100%',
    shadowColor: '#d56c3e',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  categoryGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: 24,
    marginTop: 8,
    rowGap: 12,
  },
  categoryPill: {
    marginHorizontal: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#F3F3F3',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 1,
    minWidth: 70,
    flexGrow: 0,
    flexShrink: 1,
  },
  categoryPillSelected: {
    backgroundColor: '#d56c3e',
    borderColor: '#d56c3e',
    elevation: 3,
    shadowColor: '#d56c3e',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryPillText: {
    color: '#22372B',
    fontSize: 16,
    fontFamily: 'serif',
    fontWeight: '500',
  },
  categoryPillTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryHint: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    marginTop: -8,
    textAlign: 'center',
    fontFamily: 'serif',
    opacity: 0.85,
  },
  saveButton: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 20,
  },
}); 
