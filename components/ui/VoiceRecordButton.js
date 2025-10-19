import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function VoiceRecordButton({ 
  onRecordingStart,
  onRecordingStop,
  onRecordingComplete,
  style,
  textStyle,
  iconSize = 20,
  iconColor = "#3A4D39",
  buttonText = "Record Voice",
  isRecording = false,
  recordedAudio = null,
  onRemoveRecording
}) {
  const [recording, setRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone permission is required to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      onRecordingStart && onRecordingStart();

      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      onRecordingStop && onRecordingStop();
      onRecordingComplete && onRecordingComplete(uri);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playAudio = async () => {
    if (!recordedAudio) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: recordedAudio });
      soundRef.current = sound;

      await sound.playAsync();
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    }
  };

  const removeRecording = () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
    onRemoveRecording && onRemoveRecording();
    setIsPlaying(false);
  };

  // Show recording state
  if (isRecording) {
    return (
      <View style={[style, { backgroundColor: '#E53935', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]}>
          <Feather name="mic" size={iconSize} color="#fff" />
        </Animated.View>
        <Text style={[textStyle, { color: '#fff', textAlign: 'center', marginHorizontal: 8 }]}>...</Text>
        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
          <Feather name="square" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Show recorded audio state
  if (recordedAudio) {
    return (
      <View style={[style, { backgroundColor: '#1F513F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.playButton} onPress={isPlaying ? stopPlayback : playAudio}>
          <Feather name={isPlaying ? "square" : "play"} size={16} color="#fff" />
        </TouchableOpacity>
        <Text style={[textStyle, { color: '#fff', textAlign: 'center', marginHorizontal: 4 }]}>
          {isPlaying ? "Playing..." : "Play"}
        </Text>
        <TouchableOpacity style={styles.removeButton} onPress={removeRecording}>
          <Feather name="x" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Show default record button
  return (
    <TouchableOpacity 
      style={style} 
      onPress={startRecording}
    >
      <Feather name="mic" size={iconSize} color={iconColor} />
      <Text style={textStyle}>{buttonText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  recordButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3A4D39',
    fontWeight: '600',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53935',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  recordingIndicator: {
    backgroundColor: '#E53935',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  stopButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F513F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  playButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  audioText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  removeButton: {
    backgroundColor: '#FF4444',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
