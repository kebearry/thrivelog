import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import PersonaChat from './PersonaChat';
import { supabase } from '../../src/supabaseClient';

export default function TalkToSomeone({ context, navigation }) {
  const [showPersonaChat, setShowPersonaChat] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = supabase.auth.user();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handlePersonaSelect = useCallback((persona) => {
    if (persona.isCreateNew) {
      // Navigate to persona management screen for creation
      if (navigation) {
        navigation.navigate('PersonaManagement', { mode: 'create' });
      }
      return;
    }
    
    setSelectedPersona(persona);
    setShowPersonaChat(true);
    setIsChatExpanded(true);
  }, [navigation]);

  const toggleChat = useCallback(() => {
    setIsChatExpanded(!isChatExpanded);
  }, [isChatExpanded]);

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setShowPersonaChat(true);
            setIsChatExpanded(true);
          }}
        >
          <Feather name="message-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Yap with someone</Text>
        </TouchableOpacity>
        
        {navigation && (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('PersonaManagement')}
          >
            <Feather name="settings" size={18} color="#D36B37" />
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        )}
      </View>

      {showPersonaChat && (
        <View style={styles.chatContainer}>
          {!isChatExpanded && (
            <TouchableOpacity
              style={styles.collapseButton}
              onPress={toggleChat}
            >
              <Text style={styles.collapseButtonText}>Collapse chat</Text>
            </TouchableOpacity>
          )}
          
          {isChatExpanded && (
            <PersonaChat
              context={context}
              onPersonaSelect={handlePersonaSelect}
              embedded={true}
              userId={userId}
              navigation={navigation}
            />
          )}
        </View>
      )}
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D36B37',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D36B37',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  manageButtonText: {
    color: '#D36B37',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  chatContainer: {
    marginTop: 16,
  },
  collapseButton: {
    backgroundColor: '#F8F3F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  collapseButtonText: {
    color: '#D36B37',
    fontSize: 14,
    fontWeight: '600',
  },
});
