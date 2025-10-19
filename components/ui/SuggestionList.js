import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export default function SuggestionList({ 
  suggestions, 
  onSuggestionSelect, 
  searchTerm,
  showNoSuggestions = false,
  style 
}) {
  if (!showNoSuggestions && suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item, index }) => {
    const matchIndex = item.toLowerCase().indexOf(searchTerm.toLowerCase());
    let before = item.slice(0, matchIndex);
    let match = item.slice(matchIndex, matchIndex + searchTerm.length);
    let after = item.slice(matchIndex + searchTerm.length);

    return (
      <TouchableOpacity
        key={item + index}
        onPress={() => onSuggestionSelect(item)}
        style={styles.suggestionItem}
      >
        <Text style={styles.suggestionText}>
          {before}
          <Text style={styles.highlightedText}>{match}</Text>
          {after}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNoSuggestions = () => (
    <View style={styles.noSuggestionsContainer}>
      <Text style={styles.noSuggestionsText}>
        No suggestions found for "{searchTerm}"
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {suggestions.length > 0 ? (
        <FlatList
          data={suggestions.slice(0, 8)}
          renderItem={renderSuggestion}
          keyExtractor={(item, index) => item + index}
          showsVerticalScrollIndicator={false}
          style={styles.suggestionsList}
        />
      ) : showNoSuggestions ? (
        renderNoSuggestions()
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    maxHeight: 200,
  },
  suggestionsList: {
    paddingVertical: 2,
  },
  suggestionItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  suggestionText: {
    fontSize: 17,
    color: '#3A4D39',
    lineHeight: 22,
  },
  highlightedText: {
    fontWeight: 'bold',
    color: '#D36B37',
  },
  noSuggestionsContainer: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
