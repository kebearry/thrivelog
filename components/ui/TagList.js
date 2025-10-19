import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TagList({ 
  tags, 
  onTagsChange, 
  label,
  placeholder = "Type here",
  addButtonText = "+ Add",
  style,
  labelStyle,
  variant = "default", // "default", "preferences", "conditions"
  maxTags = 10
}) {
  const [adding, setAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    setAdding(true);
    setInputValue('');
    setTimeout(() => inputRef.current && inputRef.current.focus(), 100);
  };

  const submitTag = () => {
    const val = inputValue.trim();
    if (val && !tags.includes(val) && tags.length < maxTags) {
      onTagsChange([...tags, val]);
    }
    setAdding(false);
    setInputValue('');
  };

  const removeTag = (tag) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  const getTagStyle = () => {
    switch (variant) {
      case "preferences":
        return styles.prefPill;
      case "conditions":
        return styles.aboutPill;
      default:
        return styles.defaultPill;
    }
  };

  const getTagTextStyle = () => {
    switch (variant) {
      case "preferences":
        return styles.prefPillText;
      case "conditions":
        return styles.aboutPillText;
      default:
        return styles.defaultPillText;
    }
  };

  const getRemoveIconColor = () => {
    switch (variant) {
      case "preferences":
        return "#d56c3e";
      case "conditions":
        return "#275B44";
      default:
        return "#888";
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.tagRow}>
        {tags.map((tag) => (
          <View key={tag} style={getTagStyle()}>
            <Text style={getTagTextStyle()}>{tag}</Text>
            <TouchableOpacity 
              onPress={() => removeTag(tag)} 
              style={styles.removeIcon} 
              hitSlop={10} 
              accessibilityLabel={`Remove ${tag}`}
            >
              <Feather name="x" size={18} color={getRemoveIconColor()} />
            </TouchableOpacity>
          </View>
        ))}
        
        {adding ? (
          <View style={getTagStyle()}>
            <TextInput
              ref={inputRef}
              value={inputValue}
              onChangeText={setInputValue}
              onBlur={submitTag}
              onSubmitEditing={submitTag}
              style={styles.inlineInput}
              placeholder={placeholder}
              autoFocus
              returnKeyType="done"
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAdd}
            disabled={tags.length >= maxTags}
          >
            <Text style={[
              styles.addButtonText,
              tags.length >= maxTags && styles.addButtonTextDisabled
            ]}>
              {addButtonText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A4D39',
    marginBottom: 15,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  // Default pill styles
  defaultPill: {
    backgroundColor: '#F5EBE4',
    borderColor: '#d56c3e',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultPillText: {
    color: '#d56c3e',
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  // Preferences pill styles
  prefPill: {
    backgroundColor: '#F5EBE4',
    borderColor: '#d56c3e',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefPillText: {
    color: '#d56c3e',
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  // Conditions pill styles
  aboutPill: {
    backgroundColor: '#E3F0E7',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutPillText: {
    color: '#275B44',
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  // Add button styles
  addButton: {
    borderColor: '#275B44',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  addButtonText: {
    color: '#275B44',
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  addButtonTextDisabled: {
    color: '#ccc',
  },
  // Input styles
  inlineInput: {
    minWidth: 60,
    fontSize: 18,
    fontFamily: 'serif',
    color: '#275B44',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderColor: '#275B44',
  },
  removeIcon: {
    marginLeft: 6,
    alignSelf: 'center',
  },
});
