import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function InlineEditor({ 
  value, 
  onValueChange, 
  placeholder = "Enter text",
  label,
  isDefault = false,
  defaultHint = "This is the default. Tap to personalize!",
  style,
  labelStyle,
  textStyle,
  inputStyle,
  editIconColor = "#d56c3e",
  variant = "default" // "default", "name"
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  const startEdit = () => {
    setEditing(true);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 100);
  };

  const finishEdit = () => {
    if (value.trim()) {
      setEditing(false);
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "name":
        return [styles.nameText, textStyle];
      default:
        return [styles.defaultText, textStyle];
    }
  };

  const getInputStyle = () => {
    switch (variant) {
      case "name":
        return [styles.nameInput, styles.nameInputActive, inputStyle];
      default:
        return [styles.defaultInput, inputStyle];
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.editorContainer}>
        {editing ? (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onValueChange}
            onBlur={finishEdit}
            onSubmitEditing={finishEdit}
            style={getInputStyle()}
            autoFocus
            returnKeyType="done"
            placeholder={placeholder}
          />
        ) : (
          <TouchableOpacity 
            onPress={startEdit} 
            accessibilityLabel="Edit text" 
            style={styles.textContainer}
          >
            <Text style={getTextStyle()}>{value}</Text>
            <Feather 
              name="edit-2" 
              size={20} 
              color={editIconColor} 
              style={styles.editIcon} 
            />
          </TouchableOpacity>
        )}
        
        {isDefault && !editing && (
          <Text style={styles.defaultHint}>{defaultHint}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A4D39',
    marginBottom: 15,
  },
  editorContainer: {
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Text styles
  defaultText: {
    fontSize: 18,
    color: '#3A4D39',
    fontWeight: '500',
  },
  nameText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36,
    color: '#275B44',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  // Input styles
  defaultInput: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderColor: '#275B44',
    paddingHorizontal: 8,
    minWidth: 120,
    textAlign: 'center',
    fontSize: 18,
    color: '#275B44',
  },
  nameInput: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderColor: '#275B44',
    paddingHorizontal: 8,
    minWidth: 120,
    textAlign: 'center',
  },
  nameInputActive: {
    color: '#275B44',
    fontWeight: 'bold',
    fontSize: 36,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  // Icon and hint styles
  editIcon: {
    marginLeft: 4,
    marginTop: 2,
  },
  defaultHint: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'center',
  },
});
