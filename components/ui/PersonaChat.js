import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { geminiPersonaService } from '../../src/services/geminiPersonaService';
import { getPersonas } from '../../src/api/personas';

export default function PersonaChat({ 
  context, 
  onPersonaSelect, 
  embedded = false, 
  userId,
  customPersonas = null,
  navigation = null 
}) {
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingStarter, setIsGeneratingStarter] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true);

  // Default personas as fallback
  const defaultPersonas = [
    { id: 'mom', name: 'Mom', emoji: '👩‍👧', description: 'Caring and nurturing' },
    { id: 'teacher', name: 'Teacher', emoji: '👨‍🏫', description: 'Wise and encouraging' },
    { id: 'friend', name: 'Best Friend', emoji: '👫', description: 'Supportive and understanding' },
    { id: 'therapist', name: 'Therapist', emoji: '🧠', description: 'Professional and insightful' },
    { id: 'mentor', name: 'Mentor', emoji: '👨‍💼', description: 'Experienced and guiding' },
  ];

  useEffect(() => {
    loadPersonas();
  }, [userId]);

  const loadPersonas = async () => {
    try {
      setIsLoadingPersonas(true);
      if (customPersonas) {
        setPersonas(customPersonas);
      } else if (userId) {
        const userPersonas = await getPersonas(userId);
        
        if (userPersonas.length === 0) {
          // No personas exist, show default personas with create prompt
          setPersonas([
            ...defaultPersonas,
            {
              id: 'customize-personas',
              name: 'Customize Personas',
              emoji: '⚙️',
              description: 'Edit default personas with specific personality traits',
              isCreatePrompt: true
            }
          ]);
        } else {
          // Combine user personas with default ones
          const combinedPersonas = [
            ...userPersonas.map(p => ({
              id: p.id.toString(),
              name: p.name,
              emoji: getPersonaEmoji(p.relationship),
              description: p.personality || p.relationship || 'Your personalized persona',
              isCustom: true,
              ...p
            })),
            ...defaultPersonas
          ];
          setPersonas(combinedPersonas);
        }
      } else {
        setPersonas(defaultPersonas);
      }
    } catch (error) {
      console.error('Error loading personas:', error);
      setPersonas(defaultPersonas);
    } finally {
      setIsLoadingPersonas(false);
    }
  };

  const getPersonaEmoji = (relationship) => {
    const emojiMap = {
      'mother': '👩‍👧',
      'mom': '👩‍👧',
      'father': '👨‍👧',
      'dad': '👨‍👧',
      'sister': '👭',
      'brother': '👬',
      'friend': '👫',
      'partner': '💕',
      'spouse': '💕',
      'grandma': '👵',
      'grandpa': '👴',
      'teacher': '👨‍🏫',
      'mentor': '👨‍💼',
      'therapist': '🧠'
    };
    
    const lowerRelationship = relationship?.toLowerCase() || '';
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lowerRelationship.includes(key)) {
        return emoji;
      }
    }
    return '👤'; // Default emoji
  };

  const handlePersonaSelect = useCallback(async (persona) => {
    // Handle create prompt
    if (persona.isCreatePrompt) {
      if (navigation) {
        // Direct navigation if navigation prop is available
        navigation.navigate('PersonaManagement', { mode: 'create' });
        return;
      }
      
      // Fallback to alert if no navigation
      Alert.alert(
        'Customize Your Personas',
        'You can customize the default personas (Mom, Teacher, Friend, etc.) with specific personality traits to make conversations more personal. Would you like to customize them now?',
        [
          { text: 'Later', style: 'cancel' },
          { 
            text: 'Customize Now', 
            onPress: () => {
              // Navigate to persona management
              if (onPersonaSelect) {
                onPersonaSelect({ isCreateNew: true });
              }
            }
          }
        ]
      );
      return;
    }

    setSelectedPersona(persona);
    setIsGeneratingStarter(true);
    
    try {
      // Create enhanced context with persona details
      const enhancedContext = {
        ...context,
        persona: {
          name: persona.name,
          relationship: persona.relationship,
          personality: persona.personality,
          communication_style: persona.communication_style,
          interests: persona.interests,
          memories: persona.memories,
          speaking_style: persona.speaking_style,
        }
      };

      const starter = await geminiPersonaService.generateConversationStarter(persona.id, enhancedContext);
      setMessages([{
        id: Date.now(),
        text: starter,
        isUser: false,
        persona: persona.name
      }]);
    } catch (error) {
      console.error('Error generating starter:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setIsGeneratingStarter(false);
    }
    
    onPersonaSelect && onPersonaSelect(persona);
  }, [context, onPersonaSelect]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !selectedPersona) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Create enhanced context with persona details
      const enhancedContext = {
        ...context,
        persona: {
          name: selectedPersona.name,
          relationship: selectedPersona.relationship,
          personality: selectedPersona.personality,
          communication_style: selectedPersona.communication_style,
          interests: selectedPersona.interests,
          memories: selectedPersona.memories,
          speaking_style: selectedPersona.speaking_style,
        }
      };

      const response = await geminiPersonaService.generateResponse(
        selectedPersona.id,
        inputText,
        messages,
        enhancedContext
      );

      const aiMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        persona: selectedPersona.name
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      Alert.alert('Error', 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedPersona, messages, context]);

  if (!selectedPersona) {
    return (
      <View style={embedded ? styles.embeddedContainer : styles.container}>
        <Text style={styles.title}>Choose who you'd like to talk to:</Text>
        
        {isLoadingPersonas ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#D36B37" />
            <Text style={styles.loadingText}>Loading your personas...</Text>
          </View>
        ) : (
          <ScrollView style={styles.personasList}>
            {personas.map((persona) => (
              <TouchableOpacity
                key={persona.id}
                style={[
                  styles.personaItem,
                  persona.isCustom && styles.customPersonaItem,
                  persona.isCreatePrompt && styles.createPromptItem
                ]}
                onPress={() => handlePersonaSelect(persona)}
              >
                <Text style={styles.personaEmoji}>{persona.emoji}</Text>
                <View style={styles.personaInfo}>
                  <View style={styles.personaHeader}>
                    <Text style={[
                      styles.personaName,
                      persona.isCreatePrompt && styles.createPromptName
                    ]}>
                      {persona.name}
                    </Text>
                    {persona.isCustom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>Your</Text>
                      </View>
                    )}
                    {persona.isCreatePrompt && (
                      <View style={styles.createBadge}>
                        <Text style={styles.createBadgeText}>New</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.personaDescription,
                    persona.isCreatePrompt && styles.createPromptDescription
                  ]}>
                    {persona.description}
                  </Text>
                  {persona.relationship && !persona.isCreatePrompt && (
                    <Text style={styles.personaRelationship}>{persona.relationship}</Text>
                  )}
                </View>
                <Feather 
                  name={persona.isCreatePrompt ? "plus" : "chevron-right"} 
                  size={20} 
                  color={persona.isCreatePrompt ? "#D36B37" : "#D36B37"} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={embedded ? styles.embeddedContainer : styles.container}>
      <View style={styles.chatHeader}>
        <View style={styles.personaInfo}>
          <Text style={styles.personaEmoji}>
            {personas.find(p => p.id === selectedPersona.id)?.emoji}
          </Text>
          <View>
            <Text style={styles.personaName}>{selectedPersona.name}</Text>
            <Text style={styles.personaDescription}>is here to listen</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.changePersonaButton}
          onPress={() => setSelectedPersona(null)}
        >
          <Feather name="refresh-cw" size={16} color="#D36B37" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {isGeneratingStarter && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#D36B37" />
            <Text style={styles.loadingText}>Starting conversation...</Text>
          </View>
        )}

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.aiMessage
            ]}
          >
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.aiMessageText
            ]}>
              {message.text}
            </Text>
            {!message.isUser && (
              <Text style={styles.personaLabel}>- {message.persona}</Text>
            )}
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#D36B37" />
            <Text style={styles.loadingText}>{selectedPersona.name} is typing...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={`Message ${selectedPersona.name}...`}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Feather name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  embeddedContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F513F',
    marginBottom: 16,
    textAlign: 'center',
  },
  personasList: {
    maxHeight: 300,
  },
  personaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F3F0',
    borderRadius: 12,
    marginBottom: 8,
  },
  customPersonaItem: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#D36B37',
  },
  createPromptItem: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#D36B37',
    borderStyle: 'dashed',
  },
  personaEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  personaInfo: {
    flex: 1,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  personaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F513F',
  },
  customBadge: {
    backgroundColor: '#D36B37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  createBadge: {
    backgroundColor: '#D36B37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  createBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  createPromptName: {
    color: '#D36B37',
    fontWeight: '700',
  },
  createPromptDescription: {
    color: '#D36B37',
    fontWeight: '500',
  },
  personaDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  personaRelationship: {
    fontSize: 12,
    color: '#D36B37',
    fontStyle: 'italic',
    marginTop: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  changePersonaButton: {
    padding: 8,
  },
  messagesContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#D36B37',
    alignSelf: 'flex-end',
    marginLeft: 50,
  },
  aiMessage: {
    backgroundColor: '#F8F3F0',
    alignSelf: 'flex-start',
    marginRight: 50,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#1F513F',
  },
  personaLabel: {
    fontSize: 12,
    color: '#D36B37',
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F3F0',
    borderRadius: 12,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F3F0',
    borderRadius: 12,
    padding: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F513F',
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#D36B37',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
