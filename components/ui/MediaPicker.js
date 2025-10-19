import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import MediaUploadButton from './MediaUploadButton';
import VoiceRecordButton from './VoiceRecordButton';

export default function MediaPicker({ 
  onImageSelect, 
  onAudioRecord, 
  selectedImage, 
  recordedAudio,
  isRecording = false,
  onRemoveImage,
  onRemoveAudio,
  style 
}) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Or express it differently:</Text>
      
      <View style={styles.mediaRow}>
        <MediaUploadButton
          onImageSelect={onImageSelect}
          iconName="camera"
          buttonText="Add Photo"
          style={styles.mediaButton}
          textStyle={styles.mediaButtonText}
          iconSize={20}
          iconColor="#D36B37"
        />
        <VoiceRecordButton
          onRecordingStart={() => onAudioRecord('start')}
          onRecordingStop={() => onAudioRecord('stop')}
          onRecordingComplete={(uri) => onAudioRecord('stop', uri)}
          onRemoveRecording={onRemoveAudio}
          isRecording={isRecording}
          recordedAudio={recordedAudio}
          buttonText="Record Clip"
          style={styles.mediaButton}
          textStyle={styles.mediaButtonText}
          iconSize={20}
          iconColor="#D36B37"
        />
      </View>

      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          <TouchableOpacity style={styles.removeButton} onPress={onRemoveImage}>
            <Feather name="x" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
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
  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D36B37',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 4,
  },
  mediaButtonText: {
    fontSize: 16,
    color: '#D36B37',
    fontWeight: '500',
    marginLeft: 8,
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
