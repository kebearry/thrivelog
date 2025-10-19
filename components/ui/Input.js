import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import VoiceRecordButton from "./VoiceRecordButton";
import { generateMoodTags } from "../../src/services/groqService";

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = "default",
  style,
  inputStyle,
  labelStyle,
  error,
  onImageSelect,
  onAudioRecord,
  onTranscriptionComplete,
  onTranscriptionStart,
  selectedImage,
  recordedAudio,
  isRecording,
  isTranscribing,
  onRemoveImage,
  onRemoveAudio,
  onClear,
  // Mood tags props
  selectedTags = [],
  moodTagSources = {},
  showMoodTags = false,
  onMoodTagSelect,
  onClearSelectedTags,
  showTooltip = false,
  setShowTooltip,
  ...props
}) {
  // Mood tag generation state
  const [moodTags, setMoodTags] = useState([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const selectedTagsRef = useRef(selectedTags);

  // Update ref when selectedTags changes
  useEffect(() => {
    selectedTagsRef.current = selectedTags;
  }, [selectedTags]);

  // Generate mood tags when text changes
  useEffect(() => {
    if (showMoodTags && value && value.trim().length > 10) {
      generateMoodTagsDebounced(value);
    } else {
      setMoodTags([]);
    }
  }, [value, showMoodTags, generateMoodTagsDebounced]);

  const generateMoodTagsDebounced = useCallback(async (text) => {
    if (isGeneratingTags) return;
    
    setIsGeneratingTags(true);
    try {
      const tags = await generateMoodTags(text);
      setMoodTags(tags);
      
      // Auto-select new tags
      if (tags.length > 0 && onMoodTagSelect) {
        console.log('🏷️ Input: Auto-selecting new mood tags:', tags);
        tags.forEach(tag => {
          // Only select if not already selected
          if (!selectedTagsRef.current.includes(tag)) {
            onMoodTagSelect(tag);
          }
        });
      }
    } catch (error) {
      console.error('Error generating mood tags:', error);
      setMoodTags([]);
    } finally {
      setIsGeneratingTags(false);
    }
  }, [isGeneratingTags, onMoodTagSelect]);

  const pickImage = async () => {
    try {
      Alert.alert("Add Photo", "Choose an option", [
        {
          text: "Take Photo",
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission Required",
                  "Please allow camera access to take photos.",
                  [{ text: "OK" }]
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
              Alert.alert("Error", "Failed to take photo. Please try again.");
            }
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            try {
              const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission Required",
                  "Please allow photo library access to select photos.",
                  [{ text: "OK" }]
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
              Alert.alert("Error", "Failed to select photo. Please try again.");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to open photo options. Please try again.");
    }
  };
  console.log("🔍 Input: Starting render");
  console.log("🔍 Input: Props:", {
    label: !!label,
    value: value?.length || 0,
    isTranscribing,
    showMoodTags,
    moodTags: moodTags?.length || 0,
    selectedTags: selectedTags?.length || 0,
  });

  try {
    return (
      <View style={[styles.container, style]}>
        {console.log("🔍 Input: Rendering label")}
        {label && (
          <View style={styles.labelContainer}>
            <Feather
              name="zap"
              size={16}
              color="#D36B37"
              style={styles.sparkleIcon}
            />
            <Text style={[styles.label, labelStyle]}>{label}</Text>
          </View>
        )}
        {console.log("🔍 Input: Rendering input container")}
        <View style={styles.inputContainer}>
          {console.log("🔍 Input: Rendering text input wrapper")}
          <View style={styles.textInputWrapper}>
            {console.log("🔍 Input: Rendering TextInput")}
            <TextInput
              style={[
                styles.input,
                multiline && styles.multilineInput,
                error && styles.errorInput,
                inputStyle,
              ]}
              value={isTranscribing ? "Transcribing your voice..." : value}
              onChangeText={onChangeText}
              placeholder={
                isTranscribing ? "Transcribing your voice..." : placeholder
              }
              placeholderTextColor="#B0B0B0"
              multiline={multiline}
              numberOfLines={numberOfLines}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType}
              textAlignVertical={multiline ? "top" : "center"}
              editable={!isTranscribing}
              {...props}
            />
            {console.log("🔍 Input: TextInput rendered successfully")}
            {console.log("🔍 Input: Checking clear button")}
            {value && value.length > 0 && (
              <>
                {console.log("🔍 Input: Rendering clear button")}
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    if (onClear) {
                      onClear();
                    } else {
                      onChangeText("");
                    }
                  }}
                >
                  <Feather name="x" size={16} color="#B0B0B0" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Mood tags section */}
          {console.log("🔍 Input: Checking mood tags section")}
          {showMoodTags && (moodTags.length > 0 || isGeneratingTags) && (
            <>
              {console.log("🔍 Input: Rendering mood tags section")}
              <View style={styles.moodTagsSection}>
                {(() => {
                  // Console log the overall mood tags state
                  return null;
                })()}
                <View style={styles.moodTagsHeader}>
                  <Feather name="heart" size={16} color="#D36B37" />
                  <Text style={styles.moodTagsTitle}>
                    Suggested Mood Tags
                    {selectedTags.length > 0 &&
                      ` (${selectedTags.length} selected)`}
                  </Text>
                  <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() =>
                      setShowTooltip && setShowTooltip(!showTooltip)
                    }
                  >
                    <Feather name="help-circle" size={16} color="#D36B37" />
                  </TouchableOpacity>
                  {isGeneratingTags && (
                    <ActivityIndicator size="small" color="#D36B37" />
                  )}
                </View>

                {showTooltip && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>
                      Tags are selected by default. Tap the X button to remove
                      tags you don&apos;t want.{"\n\n"}
                      <Text style={styles.tooltipBold}>Tag Sources:</Text>
                      {"\n"}
                      Blue tags: From Gemini (photo analysis){"\n"}
                      Orange tags: From Groq (text analysis){"\n\n"}
                      Different colors show which AI service generated each tag.
                    </Text>
                  </View>
                )}

                {(moodTags.length > 0 ||
                  Object.keys(moodTagSources).length > 0) && (
                  <View style={styles.moodTagsGrid}>
                    {(() => {
                      // Combine all tags from both sources
                      const allTags = [
                        ...new Set([
                          ...moodTags, // Groq tags
                          ...Object.keys(moodTagSources), // Gemini tags
                        ]),
                      ];
                      return allTags;
                    })().map((tag, index) => {
                      const isSelected = selectedTags.includes(tag);
                      const source = moodTagSources[tag] || "groq";
                      const isGemini = source === "gemini";

                      return (
                        <View key={index} style={styles.moodTagContainer}>
                          <TouchableOpacity
                            style={[
                              styles.moodTag,
                              isGemini && styles.moodTagGemini,
                              isSelected &&
                                (isGemini
                                  ? styles.moodTagGeminiSelected
                                  : styles.moodTagSelected),
                            ]}
                            onPress={() =>
                              onMoodTagSelect && onMoodTagSelect(tag)
                            }
                          >
                            <View style={styles.moodTagContent}>
                              <Text
                                style={[
                                  styles.moodTagText,
                                  isGemini && styles.moodTagTextGemini,
                                  isSelected &&
                                    (isGemini
                                      ? styles.moodTagTextGeminiSelected
                                      : styles.moodTagTextSelected),
                                ]}
                              >
                                {tag}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          {isSelected && (
                            <TouchableOpacity
                              style={styles.crossOutButton}
                              onPress={() =>
                                onMoodTagSelect && onMoodTagSelect(tag)
                              }
                            >
                              <Feather name="x" size={14} color="#D36B37" />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

          {/* Media buttons inside the input */}
          {console.log("🔍 Input: Checking media section")}
          {(onImageSelect || onAudioRecord) && (
            <>
              {console.log("🔍 Input: Rendering media section")}
              <View style={styles.mediaSection}>
                <Text style={styles.mediaLabel}>
                  Or express it differently:
                </Text>
                {console.log("🔍 Input: Rendering media buttons container")}
                <View style={styles.mediaButtons}>
                  {console.log("🔍 Input: Checking image select button")}
                  {onImageSelect &&
                    (selectedImage ? (
                      <>
                        {console.log(
                          "🔍 Input: Rendering selected image button"
                        )}
                        <View
                          style={[
                            styles.mediaButton,
                            {
                              backgroundColor: "#1F513F",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                        >
                          <Feather name="image" size={16} color="#fff" />
                          <Text
                            style={[
                              styles.mediaButtonText,
                              { color: "#fff", marginLeft: 4 },
                            ]}
                          >
                            Photo Added
                          </Text>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={onRemoveImage}
                          >
                            <Feather
                              name="x"
                              size={18}
                              color="#fff"
                              strokeWidth={2.5}
                            />
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.mediaButton}
                        onPress={pickImage}
                      >
                        <Feather name="camera" size={20} color="#D36B37" />
                        <Text style={styles.mediaButtonText}>Add Photo</Text>
                      </TouchableOpacity>
                    ))}
                  {console.log("🔍 Input: Checking audio record button")}
                  {onAudioRecord && (
                    <>
                      {console.log("🔍 Input: Rendering VoiceRecordButton")}
                      <VoiceRecordButton
                        onRecordingStart={() => onAudioRecord("start")}
                        onRecordingStop={() => onAudioRecord("stop")}
                        onRecordingComplete={(uri) =>
                          onAudioRecord("stop", uri)
                        }
                        onTranscriptionStart={onTranscriptionStart}
                        onTranscriptionComplete={onTranscriptionComplete}
                        onRemoveRecording={onRemoveAudio}
                        isRecording={isRecording}
                        recordedAudio={recordedAudio}
                        buttonText="Record Voice"
                        style={styles.mediaButton}
                        textStyle={styles.mediaButtonText}
                        iconSize={20}
                        iconColor="#D36B37"
                      />
                    </>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  } catch (error) {
    console.error("🔍 Input: CRASH during render:", error);
    console.error("🔍 Input: Error stack:", error.stack);
    return (
      <View style={[styles.container, style]}>
        <Text>Input Error: {error.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sparkleIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3A4D39",
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: "hidden",
  },
  textInputWrapper: {
    position: "relative",
  },
  input: {
    padding: 20,
    paddingRight: 50, // Make room for clear button
    fontSize: 16,
    color: "#3A4D39",
    borderWidth: 0,
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: 15,
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  mediaSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    padding: 16,
    backgroundColor: "#FAFAFA",
  },
  mediaLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3A4D39",
    marginBottom: 12,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D36B37",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flex: 1,
  },
  mediaButtonText: {
    fontSize: 14,
    color: "#D36B37",
    fontWeight: "500",
    marginLeft: 8,
  },
  errorInput: {
    borderColor: "#E53935",
    borderWidth: 1,
  },
  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginTop: 8,
  },
  // Mood tags styles
  moodTagsSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  moodTagsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  moodTagsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#D36B37",
    marginLeft: 6,
    flex: 1,
  },
  helpButton: {
    marginLeft: 8,
    padding: 4,
  },
  tooltip: {
    backgroundColor: "#F8F3F0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tooltipText: {
    fontSize: 12,
    color: "#8B4513",
    lineHeight: 16,
  },
  tooltipBold: {
    fontWeight: "600",
    color: "#D36B37",
  },
  moodTagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  moodTag: {
    backgroundColor: "#F8F3F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  moodTagSelected: {
    backgroundColor: "#D36B37",
    borderColor: "#D36B37",
  },
  moodTagText: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "500",
  },
  moodTagTextSelected: {
    color: "#FFFFFF",
  },
  crossOutButton: {
    backgroundColor: "transparent",
    borderRadius: 10,
    width: 22,
    height: 22,
    marginLeft: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D36B37",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeButton: {
    backgroundColor: "#E53935",
    borderRadius: 6,
    width: 24,
    height: 24,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  moodTagContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceIcon: {
    marginRight: 4,
  },
  // Gemini-specific styles
  moodTagGemini: {
    backgroundColor: "#E8F0FE",
    borderColor: "#4285F4",
    borderWidth: 2,
  },
  moodTagGeminiSelected: {
    backgroundColor: "#4285F4",
    borderColor: "#1A73E8",
  },
  moodTagTextGemini: {
    color: "#1A73E8",
    fontWeight: "600",
  },
  moodTagTextGeminiSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
