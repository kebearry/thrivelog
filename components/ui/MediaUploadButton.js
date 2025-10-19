import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function MediaUploadButton({ 
  onImageSelect, 
  style, 
  textStyle,
  iconName = "camera",
  buttonText = "Add a photo (optional)",
  iconSize = 28,
  iconColor = "#22372B"
}) {
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
                  onImageSelect(result.assets[0].uri);
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
                  onImageSelect(result.assets[0].uri);
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

  return (
    <TouchableOpacity 
      style={style} 
      onPress={pickImage} 
      accessibilityLabel="Add Photo" 
      accessible={true}
    >
      <Feather name={iconName} size={iconSize} color={iconColor} style={{ marginRight: 10 }} />
      <Text style={textStyle}>{buttonText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
