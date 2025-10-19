import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Image, Pressable, Alert, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, fonts } from '../theme';
import { addProductLog, getDistinctProducts, getProductLogs } from '../api/productlogs';

const categories = ['supplement', 'medication', 'skincare', 'cleaning', 'shower', 'other'];

export default function ProductLogScreen({ navigation }) {
  const [product, setProduct] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [pendingPicker, setPendingPicker] = useState(null);
  const [category, setCategory] = useState('supplement');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date().toISOString());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [productLogs, setProductLogs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showNoSuggestions, setShowNoSuggestions] = useState(false);

  const handleSave = async () => {
    try {
      await addProductLog({ 
        product, 
        notes, 
        category: category === 'other' ? customCategory : category, 
        photo_url: image, 
        time: selectedTime 
      });
      setProduct('');
      setNotes('');
      setImage(null);
      setCustomCategory('');
      Alert.alert('Product logged!');
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
    getDistinctProducts().then(setAllProducts).catch(() => setAllProducts([]));
    getProductLogs().then(setProductLogs).catch(() => setProductLogs([]));
  }, []);

  useEffect(() => {
    if (product.length < 2) {
      setSuggestions([]);
      setShowNoSuggestions(false);
    } else {
      const filtered = allProducts.filter(p => p.toLowerCase().includes(product.toLowerCase()) && p.toLowerCase() !== product.toLowerCase());
      setSuggestions(filtered);
      setShowNoSuggestions(filtered.length === 0);
      if (filtered.length === 0) {
        const timer = setTimeout(() => setShowNoSuggestions(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [product, allProducts]);

  useEffect(() => {
    if (pendingPicker === 'camera') {
      (async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera permissions!');
          setPendingPicker(null);
          return;
        }
        let result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
        if (!result.canceled) {
          setImage(result.assets[0].uri);
        }
        setPendingPicker(null);
      })();
    } else if (pendingPicker === 'library') {
      (async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions!');
          setPendingPicker(null);
          return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
        if (!result.canceled) {
          setImage(result.assets[0].uri);
        }
        setPendingPicker(null);
      })();
    }
  }, [pendingPicker]);

  const removeImage = () => setImage(null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }}>
        <View style={{ padding: 24 }}>
          <Text style={styles.title}>Let&apos;s add your product.</Text>
          <Text style={styles.subtitle}>Every product leaves a trace.</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage} accessibilityLabel="Add Photo" accessible={true}>
              <Feather name="camera" size={28} color={colors.text} style={{ marginRight: 10 }} />
              <Text style={styles.photoText}>Add a photo (optional)</Text>
            </TouchableOpacity>
            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <Pressable style={styles.removeImageButton} onPress={removeImage} hitSlop={10} accessibilityLabel="Remove Photo" accessible={true}>
                  <Text style={styles.removeImageText}>✕</Text>
                </Pressable>
              </View>
            )}
            {image && (
              <TouchableOpacity onPress={pickImage} style={styles.replaceLink} accessibilityLabel="Replace Photo" accessible={true}>
                <Text style={styles.replaceLinkText}>Replace photo</Text>
              </TouchableOpacity>
            )}
            <View style={styles.categoryGroup}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    category === cat && styles.categoryPillSelected
                  ]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.8}
                  accessibilityLabel={`Select category ${cat}`}
                  accessible={true}
                >
                  <Text style={[
                    styles.categoryPillText,
                    category === cat && styles.categoryPillTextSelected
                  ]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {category === 'other' && (
              <TextInput
                style={styles.input}
                placeholder="Enter category name"
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Custom Category Input"
                accessible={true}
              />
            )}
            <Text style={styles.categoryHint}>
              Help us sort your log by selecting a product type.
            </Text>
            <View style={{ width: '100%', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, color: colors.text, marginBottom: 8, fontFamily: fonts.serif }}>Time</Text>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  backgroundColor: colors.card,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => setShowTimePicker(true)}
                accessibilityLabel="Select Time"
                accessible={true}
              >
                <Feather name="clock" size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 17, color: colors.text, fontFamily: fonts.serif }}>
                  {new Date(selectedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={new Date(selectedTime)}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) setSelectedTime(date.toISOString());
                  }}
                  style={{ backgroundColor: colors.card }}
                />
              )}
            </View>
            <View style={{ width: '100%', marginBottom: 18, position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  product.length >= 2 && (suggestions.length > 0 || showNoSuggestions) && { marginBottom: 0 }
                ]}
                placeholder="What product did you use?"
                value={product}
                onChangeText={setProduct}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Product Name"
                accessible={true}
              />
              {product.length >= 2 && (suggestions.length > 0 || showNoSuggestions) && (
                <View style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  backgroundColor: colors.card,
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderTopWidth: 0,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                  paddingVertical: 2,
                  paddingHorizontal: 0,
                  maxHeight: 200,
                }}>
                  {suggestions.length > 0 ? (
                    suggestions.slice(0, 8).map((item, idx) => {
                      const matchIndex = item.toLowerCase().indexOf(product.toLowerCase());
                      let before = item.slice(0, matchIndex);
                      let match = item.slice(matchIndex, matchIndex + product.length);
                      let after = item.slice(matchIndex + product.length);
                      const lastLog = productLogs.find(p => p.product === item && p.notes);
                      return (
                        <TouchableOpacity
                          key={item + idx}
                          onPress={() => {
                            setProduct(item);
                            setSuggestions([]);
                            if (lastLog && lastLog.notes) setNotes(lastLog.notes);
                          }}
                          style={{ paddingVertical: 14 }}
                        >
                          <Text style={{
                            fontSize: 17,
                            color: colors.text,
                            fontFamily: fonts.serif,
                            lineHeight: 22,
                            paddingLeft: 18,
                            paddingRight: 18,
                          }}>
                            {before}
                            <Text style={{ fontWeight: 'bold', color: '#d56c3e' }}>{match}</Text>
                            {after}
                          </Text>
                          {lastLog && lastLog.notes ? (
                            <Text style={{ fontSize: 14, color: colors.textMuted, marginLeft: 18, marginTop: 2, fontStyle: 'italic' }} numberOfLines={1}>
                              {lastLog.notes}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={{
                      padding: 16,
                      color: colors.textMuted,
                      fontStyle: 'italic',
                      fontSize: 16,
                      textAlign: 'center'
                    }}>
                      No suggestions found
                    </Text>
                  )}
                </View>
              )}
            </View>
            <View style={styles.notesContainer}>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor={colors.textMuted}
                multiline
                accessibilityLabel="Product Notes"
                accessible={true}
              />
              <Text style={styles.notesHint}>Optional—brand, batch, effects, etc.</Text>
            </View>
            <View style={styles.saveButtonSpacer} />
            <TouchableOpacity style={styles.button} onPress={handleSave} accessibilityLabel="Save Product Log" accessible={true}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.boldItalic,
    fontSize: 32,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 20,
    color: colors.text,
    marginBottom: 36,
    fontFamily: fonts.serif,
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
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
    color: colors.text,
    fontFamily: fonts.serif,
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
    backgroundColor: colors.card,
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
    borderColor: colors.border,
  },
  removeImageText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  replaceLink: {
    marginBottom: 10,
  },
  replaceLinkText: {
    color: colors.text,
    fontSize: 15,
    textDecorationLine: 'underline',
    opacity: 0.7,
    fontFamily: fonts.serif,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
    fontSize: 18,
    marginBottom: 18,
    backgroundColor: colors.card,
    color: colors.text,
    fontFamily: fonts.serif,
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
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: 6,
    fontFamily: fonts.serif,
  },
  saveButtonSpacer: {
    height: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 0,
    width: '100%',
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: fonts.serif,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryPillText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.serif,
    fontWeight: '500',
  },
  categoryPillTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
    marginTop: -8,
    textAlign: 'center',
    fontFamily: fonts.serif,
    opacity: 0.85,
  },
}); 
