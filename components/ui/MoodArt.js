import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Share,
  Platform,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { falArtService } from '../../src/services/falArtService';

// Memoized mood emoji function outside component
const getMoodEmoji = (mood) => {
  const moodEmojis = {
    'happy': '😊',
    'sad': '😢',
    'anxious': '😰',
    'calm': '😌',
    'excited': '🤩',
    'grateful': '🙏',
    'proud': '💪',
    'hopeful': '🌟',
    'peaceful': '🧘',
    'energetic': '⚡',
    'content': '😌',
    'focused': '🎯',
    'creative': '🎨',
    'loving': '❤️',
    'confident': '💪'
  };
  
  return moodEmojis[mood] || '🎨';
};

function MoodArt({ reflectionData, onArtGenerated }) {
  const [artData, setArtData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [postcardText, setPostcardText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  useEffect(() => {
    if (reflectionData && !hasGenerated) {
      generateArt();
      setHasGenerated(true);
    }
  }, [reflectionData, hasGenerated, generateArt]);

  const generateArt = useCallback(async () => {
    setIsLoading(true);
    try {
      const art = await falArtService.generateMoodArt(
        reflectionData.mood,
        reflectionData.theme,
        postcardText
      );
      setArtData(art);
      onArtGenerated && onArtGenerated(art);
    } catch (error) {
      console.error('Error generating mood art:', error);
      Alert.alert(
        'Error',
        'Failed to generate mood art. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [reflectionData, postcardText, onArtGenerated]);

  // Memoize the mood emoji to prevent unnecessary recalculations
  const moodEmoji = useMemo(() => {
    if (!artData?.mood) return '🎨';
    return getMoodEmoji(artData.mood);
  }, [artData?.mood]);

  const regenerateArt = useCallback(async () => {
    setHasGenerated(false);
    await generateArt();
  }, [generateArt]);

  const handleAddText = useCallback(() => {
    setShowTextInput(true);
  }, []);

  const handleSaveText = useCallback(async () => {
    setShowTextInput(false);
    console.log('Postcard text saved:', postcardText);
    
    // Regenerate art with the text integrated into the image
    if (postcardText.trim()) {
      setIsLoading(true);
      try {
        const newArtData = await falArtService.generateMoodArt(
          reflectionData.mood,
          reflectionData.theme,
          postcardText.trim()
        );
        setArtData(newArtData);
        setHasGenerated(true);
        if (onArtGenerated) {
          onArtGenerated(newArtData);
        }
      } catch (error) {
        console.error('Error regenerating art with text:', error);
        Alert.alert(
          'Error',
          'Failed to regenerate art with your text. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
  }, [postcardText, reflectionData, onArtGenerated]);

  const downloadArt = useCallback(async () => {
    if (!artData?.imageUrl) return;

    try {
      if (Platform.OS === 'ios') {
        // For iOS, use Share API to save to Photos
        await Share.share({
          url: artData.imageUrl,
          message: `My mood art: ${artData.mood}`,
        });
      } else {
        // For Android, use Share API to save to Gallery
        await Share.share({
          url: artData.imageUrl,
          message: `My mood art: ${artData.mood}`,
        });
      }
    } catch (error) {
      console.error('Error sharing art:', error);
      Alert.alert(
        'Error',
        'Failed to save the image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [artData?.imageUrl, artData?.mood]);

  if (isLoading) {
    return (
      <View style={styles.artCard}>
        <View style={styles.artHeader}>
          <View style={styles.artTitleContainer}>
            <Feather name="image" size={20} color="#D36B37" />
            <Text style={styles.artTitle}>Mood Art</Text>
          </View>
          <ActivityIndicator size="small" color="#D36B37" />
        </View>
        <Text style={styles.artSubtext}>
          Creating visual representation of your emotions...
        </Text>
      </View>
    );
  }

  if (!artData) {
    return (
      <View style={styles.artCard}>
        <View style={styles.artHeader}>
          <View style={styles.artTitleContainer}>
            <Feather name="image" size={20} color="#D36B37" />
            <Text style={styles.artTitle}>Mood Art</Text>
          </View>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={regenerateArt}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.artSubtext}>
          Generate AI art from your emotional state
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.artCard}>
      <View style={styles.artHeader}>
        <View style={styles.artTitleContainer}>
          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
          <View>
            <Text style={styles.artTitle}>Mood Art</Text>
            <Text style={styles.artMood}>{artData.mood}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setShowFullImage(true)}
        >
          <Feather name="maximize-2" size={20} color="#D36B37" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => setShowFullImage(true)}
      >
        <Image
          source={{ uri: artData.imageUrl }}
          style={styles.artImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <Feather name="zoom-in" size={24} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={styles.artInfo}>
        <Text style={styles.artPrompt}>
          &ldquo;{artData.prompt.substring(0, 100)}...&rdquo;
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={regenerateArt}
          disabled={isLoading}
        >
          <Feather name="refresh-cw" size={16} color="#D36B37" />
          <Text style={styles.regenerateButtonText}>Generate New Art</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.postcardButton}
          onPress={handleAddText}
        >
          <Feather name="edit-3" size={16} color="#D36B37" />
          <Text style={styles.postcardButtonText}>Add Text</Text>
        </TouchableOpacity>
      </View>

      {postcardText ? (
        <View style={styles.postcardTextContainer}>
          <Text style={styles.postcardTextLabel}>Your message:</Text>
          <Text style={styles.postcardText}>{postcardText}</Text>
        </View>
      ) : null}

      {/* Full Image Modal */}
      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalDownloadButton}
                onPress={downloadArt}
              >
                <Feather name="download" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFullImage(false)}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: artData.imageUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <View style={styles.modalInfo}>
              <Text style={styles.modalTitle}>Mood Art</Text>
              <Text style={styles.modalMood}>{artData.mood}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Text Input Modal */}
      <Modal
        visible={showTextInput}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTextInput(false)}
      >
        <View style={styles.textModalContainer}>
          <View style={styles.textModalContent}>
            <View style={styles.textModalHeader}>
              <Text style={styles.textModalTitle}>Add Postcard Text</Text>
              <TouchableOpacity
                style={styles.textModalCloseButton}
                onPress={() => setShowTextInput(false)}
              >
                <Feather name="x" size={24} color="#D36B37" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.textModalSubtitle}>
              Write a message to yourself on this mood art
            </Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Write your message here..."
              value={postcardText}
              onChangeText={setPostcardText}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.textModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTextInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveText}
              >
                <Text style={styles.saveButtonText}>Save Text</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  artCard: {
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
  artHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  artTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  artTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F513F',
  },
  artMood: {
    fontSize: 14,
    color: '#D36B37',
    fontWeight: '600',
    marginTop: 2,
  },
  artSubtext: {
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
  expandButton: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  artImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artInfo: {
    marginBottom: 12,
  },
  artPrompt: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
    maxWidth: '70%',
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F3F0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  regenerateButtonText: {
    color: '#D36B37',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  postcardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
  },
  postcardButtonText: {
    color: '#D36B37',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  postcardTextContainer: {
    backgroundColor: '#F8F3F0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  postcardTextLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  postcardText: {
    fontSize: 14,
    color: '#1F513F',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  modalHeader: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    zIndex: 1,
  },
  modalDownloadButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
  },
  modalInfo: {
    marginTop: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F513F',
  },
  modalMood: {
    fontSize: 14,
    color: '#D36B37',
    fontWeight: '600',
    marginTop: 4,
  },
  textModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  textModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F513F',
  },
  textModalCloseButton: {
    padding: 4,
  },
  textModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F513F',
    backgroundColor: '#f9f9f9',
    minHeight: 100,
    marginBottom: 20,
  },
  textModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#D36B37',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default React.memo(MoodArt);
