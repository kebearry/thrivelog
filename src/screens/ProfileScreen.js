import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { getProfile, updateProfile, createProfile } from "../api/profiles";
import { supabase } from "../supabaseClient";
import {
  RadioGroup,
  TagList,
  ModalDialog,
  AvatarSelector,
  InlineEditor,
} from "../../components/ui";
import { languageService } from "../services/languageService";
import { translationService } from "../services/translationService";

export default function ProfileScreen() {
  const [trackingPrefs, setTrackingPrefs] = useState([]);
  const [about, setAbout] = useState([]);
  const defaultName = "Riley";
  const [name, setName] = useState("Riley");
  const isDefaultName = name === defaultName;
  const [gender, setGender] = useState("");
  const [language, setLanguage] = useState("");
  const [languageOptions, setLanguageOptions] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const genderOptions = [
    { label: "Female", value: "female" },
    { label: "Male", value: "male" },
    { label: "Non-binary", value: "non-binary" },
    { label: "Prefer not to say", value: "prefer-not-to-say" },
  ];
  const [showPrefTooltip, setShowPrefTooltip] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = supabase.auth.user();

  // Load supported languages on mount
  useEffect(() => {
    console.log('🌍 ProfileScreen: Starting language loading useEffect');
    const loadLanguages = async () => {
      try {
        console.log('🌍 ProfileScreen: Setting loading to true');
        setLoadingLanguages(true);
        console.log('🌍 ProfileScreen: Calling languageService.getSupportedLanguages()');
        const languages = await languageService.getSupportedLanguages();
        console.log('🌍 ProfileScreen: Languages received:', languages?.length || 0, 'languages');
        
        // Transform language data to match UI expectations
        const transformedLanguages = languages.map(lang => ({
          value: lang.code,
          label: lang.name
        }));
        
        console.log('🌍 ProfileScreen: Transformed languages:', transformedLanguages.slice(0, 3));
        
        // Check if English is in the list
        const englishLang = transformedLanguages.find(lang => lang.value === 'en');
        console.log('🌍 ProfileScreen: English language found:', englishLang);
        setLanguageOptions(transformedLanguages);
      } catch (error) {
        console.error("🌍 ProfileScreen: Error loading languages:", error);
        // Fallback languages will be loaded by the service
        setLanguageOptions([]);
      } finally {
        console.log('🌍 ProfileScreen: Setting loading to false');
        setLoadingLanguages(false);
      }
    };

    loadLanguages();
  }, []);

  // Get selected language label
  const getSelectedLanguageLabel = () => {
    const selectedLang = languageOptions.find(
      (option) => option.value === language
    );
    return selectedLang ? selectedLang.label : "Select Preferred Language";
  };

  // Fetch profile on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getProfile(user.id)
      .then((profile) => {
        setName(profile.name || defaultName);
        setGender(profile.gender || "");
        console.log('🌍 ProfileScreen: Profile language from database:', profile.language);
        setLanguage(profile.language || "");
        setTrackingPrefs(profile.tracking_preferences || []);
        setAbout(profile.about || []);
        setLoading(false);
      })
      .catch((e) => {
        // If no profile, create one
        if (e.code === "PGRST116" || e.message?.includes("No rows")) {
          createProfile(user.id, {
            name: defaultName,
            gender: "",
            language: "",
            tracking_preferences: [],
            about: [],
          })
            .then(() => setLoading(false))
            .catch((error) => {
              console.error("Profile creation error:", error);
              setError("Failed to create profile: " + error.message);
              setLoading(false);
            });
        } else {
          setError("Failed to load profile");
          setLoading(false);
        }
      });
  }, [user]);

  // Auto-save profile on change
  useEffect(() => {
    if (!user || loading) return;
    updateProfile(user.id, {
      name,
      gender,
      language,
      tracking_preferences: trackingPrefs,
      about,
    }).catch((error) => {
      console.error("Profile save error:", error);
      setError("Failed to save profile: " + error.message);
    });
  }, [name, gender, language, trackingPrefs, about]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#22372B", fontSize: 18 }}>
          Loading profile...
        </Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", fontSize: 18 }}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { paddingTop: 60 }]}>
          {/* Avatar and Name */}
          <View
            style={{ alignItems: "center", marginTop: 32, marginBottom: 16 }}
          >
            <AvatarSelector gender={gender} size={120} />
            <InlineEditor
              value={name}
              onValueChange={setName}
              variant="name"
              isDefault={isDefaultName}
              defaultHint="This is the default name. Tap to personalize!"
            />

            {/* Language Selector */}
            <TouchableOpacity
              style={[
                styles.compactLanguageSelector,
                loadingLanguages && styles.compactLanguageSelectorDisabled,
              ]}
              onPress={() => !loadingLanguages && setShowLanguagePicker(true)}
              disabled={loadingLanguages}
            >
              <Text
                style={[
                  styles.compactLanguageText,
                  loadingLanguages && styles.compactLanguageTextDisabled,
                ]}
              >
                {loadingLanguages
                  ? "Loading languages..."
                  : getSelectedLanguageLabel()}
              </Text>
              <Feather
                name="chevron-down"
                size={16}
                color={loadingLanguages ? "#ccc" : "#666"}
              />
            </TouchableOpacity>
          </View>

          {/* Gender */}
          <View style={styles.card}>
            <RadioGroup
              options={genderOptions}
              selectedValue={gender}
              onValueChange={setGender}
              layout="grid"
              columns={2}
              labelStyle={styles.cardLabel}
            />
          </View>

          {/* Tracking Preferences */}
          <View style={styles.card}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 0,
              }}
            >
              <Text style={styles.cardLabel}>
                Tracking Preferences
                <Text
                  onPress={() => setShowPrefTooltip(true)}
                  accessibilityLabel="What does Tracking Preferences mean?"
                >
                  {" "}
                  <Feather name="info" size={18} color="#888" />
                </Text>
              </Text>
            </View>
            <TagList
              tags={trackingPrefs}
              onTagsChange={setTrackingPrefs}
              variant="preferences"
              placeholder="Type here"
              addButtonText="+ Add"
            />
          </View>

          {/* About You */}
          <View style={styles.card}>
            <TagList
              tags={about}
              onTagsChange={setAbout}
              label="Conditions you're managing"
              variant="conditions"
              placeholder="Type here"
              addButtonText="+ Add"
              labelStyle={styles.cardLabel}
            />
          </View>

          {/* Tooltip Modal */}
          <ModalDialog
            visible={showPrefTooltip}
            onClose={() => setShowPrefTooltip(false)}
            title="What are Tracking Preferences?"
          >
            <Text style={styles.tooltipText}>
              Tracking Preferences are dietary, lifestyle, or health-related
              choices you want to keep an eye on. They help personalize your
              experience and make it easier to log and review things that matter
              to you. {"\n\n"}
              Examples:
            </Text>
            <Text style={styles.tooltipList}>
              • Avoid dairy{"\n"}• Vegan{"\n"}• Gluten-free{"\n"}• Low FODMAP
              {"\n"}• No caffeine
            </Text>
          </ModalDialog>

          {/* Language Picker Modal */}
          <Modal
            visible={showLanguagePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowLanguagePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.languagePickerModal}>
                <View style={styles.languagePickerHeader}>
                  <Text style={styles.languagePickerTitle}>
                    Select Preferred Language
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowLanguagePicker(false)}
                    style={styles.closeButton}
                  >
                    <Feather name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.languagePickerList}>
                  {loadingLanguages ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>
                        Loading supported languages...
                      </Text>
                    </View>
                  ) : languageOptions.length > 0 ? (
                    languageOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.languageOption,
                          language === option.value &&
                            styles.languageOptionSelected,
                        ]}
                        onPress={() => {
                          setLanguage(option.value);
                          setShowLanguagePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.languageOptionText,
                            language === option.value &&
                              styles.languageOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {language === option.value && (
                          <Feather name="check" size={20} color="#4CAF50" />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>
                        No languages available
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFAF3",
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: {
    fontFamily: "serif",
    fontSize: 20,
    color: "#22372B",
    marginBottom: 14,
  },
  tooltipText: {
    color: "#22372B",
    fontSize: 16,
    marginBottom: 8,
    fontFamily: "serif",
  },
  tooltipList: {
    color: "#275B44",
    fontSize: 16,
    marginBottom: 12,
    fontFamily: "serif",
  },

  // Compact language selector styles
  compactLanguageSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignSelf: "center",
  },
  compactLanguageText: {
    fontSize: 13,
    color: "#666",
    marginRight: 6,
  },
  compactLanguageSelectorDisabled: {
    opacity: 0.6,
    backgroundColor: "#f5f5f5",
  },
  compactLanguageTextDisabled: {
    color: "#999",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  languagePickerModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  languagePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  languagePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  languagePickerList: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  languageOptionSelected: {
    backgroundColor: "#F0F8F0",
  },
  languageOptionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  languageOptionTextSelected: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
