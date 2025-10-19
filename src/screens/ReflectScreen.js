import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
// Translation simplified - no complex hooks needed
import {
  createReflection,
  uploadReflectionFile,
  getAdaptivePrompts,
  createAdaptivePrompts,
  getUserContextForPrompts,
} from "../api/reflections";
import { Button, Card, MoodSelector, EmptyState, Input } from "../../components/ui";
import { analyzeImage } from "../services/geminiService";
import { analyzeMoodWithGroq } from "../services/groqMoodRatingService";
import { supabase } from "../supabaseClient";

export default function ReflectScreen({ navigation }) {
  console.log("🔍 ReflectScreen: Component initializing");

  // State management
  const [reflection, setReflection] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [moodRating, setMoodRating] = useState(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [selectedMoodTags, setSelectedMoodTags] = useState([]);
  const [moodTagSources, setMoodTagSources] = useState({}); // Track source of each tag
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [groqMoodAnalysis, setGroqMoodAnalysis] = useState(null);
  const [isAnalyzingMood, setIsAnalyzingMood] = useState(false);

  // Simple state - no complex translation logic

  // Removed all translation logic - using English only

  // Dynamic prompt questions (will be loaded from API)
  const [promptQuestions, setPromptQuestions] = useState([]);

  console.log("🔍 ReflectScreen: State initialized");

  // Media handlers
  const handleImageSelect = async (imageUri) => {
    setSelectedImage(imageUri);

    // Analyze image with Gemini Vision
    try {
      const analysis = await analyzeImage(imageUri);

      // Auto-populate reflection text with caption
      if (analysis.caption) {
        setReflection((prev) => {
          const newText = prev
            ? `${prev}\n\n${analysis.caption}`
            : analysis.caption;
          return newText;
        });
      }

      // Auto-select Gemini mood tags and merge with existing Groq tags
      if (analysis.moodTags && analysis.moodTags.length > 0) {
        setSelectedMoodTags((prev) => {
          // Merge Gemini tags with existing tags, avoiding duplicates
          const mergedTags = [...new Set([...prev, ...analysis.moodTags])];
          return mergedTags;
        });

        // Track source of each tag, preserving existing sources
        setMoodTagSources((prev) => {
          const newSources = { ...prev };
          analysis.moodTags.forEach((tag) => {
            newSources[tag] = "gemini";
          });
          return newSources;
        });
      } else {
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Show user-friendly error message for image analysis
      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        Alert.alert(
          'Image Analysis Temporarily Unavailable',
          'Our AI is processing many requests right now. Your image has been saved and will be analyzed shortly. You can continue writing your reflection.',
          [{ text: 'OK' }]
        );
        
        // Still set the image even if analysis fails
        setSelectedImage(imageUri);
      } else if (error.message.includes('Please wait')) {
        Alert.alert(
          'Please Wait',
          error.message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Image Analysis Error',
          'Could not analyze the image. You can still use it in your reflection.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    // Clear only Gemini mood tags when image is removed, keep Groq tags
    setSelectedMoodTags((prev) => {
      return prev.filter((tag) => moodTagSources[tag] !== "gemini");
    });
    setMoodTagSources((prev) => {
      const newSources = { ...prev };
      Object.keys(newSources).forEach((tag) => {
        if (newSources[tag] === "gemini") {
          delete newSources[tag];
        }
      });
      return newSources;
    });
  };

  const handleAudioRecord = async (action, audioUri = null) => {
    console.log('🎤 ReflectScreen: handleAudioRecord called with:', { action, audioUri });
    
    if (action === "start") {
      setIsRecording(true);
      setRecordedAudio(null);
    } else if (action === "stop") {
      setIsRecording(false);
      if (audioUri) {
        setRecordedAudio(audioUri);
        // Start transcription
        handleTranscriptionStart();
        await transcribeAudio(audioUri);
      }
    }
  };

  const transcribeAudio = async (audioUri) => {
    try {
      console.log('🎤 ReflectScreen: Starting transcription for:', audioUri);
      
      // Get user's preferred language
      let targetLanguage = 'en'; // Default to English
      try {
        const user = supabase.auth.user();
        if (user) {
          const { getProfile } = await import('../api/profiles');
          const profile = await getProfile(user.id);
          targetLanguage = profile?.language || 'en';
          console.log('🎤 ReflectScreen: User ID:', user.id);
          console.log('🎤 ReflectScreen: Profile:', profile);
          console.log('🎤 ReflectScreen: User preferred language:', targetLanguage);
        } else {
          console.log('🎤 ReflectScreen: No user found');
        }
      } catch (profileError) {
        console.log('🎤 ReflectScreen: Could not get user language, using default (en)');
        console.log('🎤 ReflectScreen: Profile error:', profileError);
      }
      
      // Import whisperService dynamically
      const { whisperService } = await import('../services/whisperService');
      
      const transcribedText = await whisperService.transcribeAndTranslate(audioUri, targetLanguage);
      console.log('🎤 ReflectScreen: Transcription and translation result:', transcribedText);
      
      handleTranscriptionComplete(transcribedText);
    } catch (error) {
      console.error('🎤 ReflectScreen: Transcription error:', error);
      setIsTranscribing(false);
      Alert.alert('Transcription Error', 'Failed to transcribe audio. Please try again.');
    }
  };

  const handleRemoveAudio = () => {
    setRecordedAudio(null);
  };

  const handleTranscriptionStart = () => {
    setIsTranscribing(true);
  };

  const handleTranscriptionComplete = (transcribedText) => {
    // Append the transcribed text to the existing reflection
    setReflection((prev) => {
      const newText = prev ? `${prev}\n\n${transcribedText}` : transcribedText;
      return newText;
    });
    setIsTranscribing(false);
  };

  const handleClearReflection = () => {
    // Clear all reflection content
    setReflection("");
    setSelectedImage(null);
    setRecordedAudio(null);
    setIsRecording(false);
    setSelectedMoodTags([]);
    setMoodTagSources({});
    setGroqMoodAnalysis(null);
  };

  const handleMoodTagSelect = useCallback((tag) => {
    setSelectedMoodTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        const newTags = [...prev, tag];
        return newTags;
      }
    });
  }, []);

  const handleClearSelectedTags = useCallback(() => {
    setSelectedMoodTags([]);
  }, []);

  const handleMoodTagSourcesUpdate = useCallback((sources) => {
    setMoodTagSources((prev) => ({ ...prev, ...sources }));
  }, []);

  // Analyze mood with Groq when reflection text changes
  const analyzeMoodWithGroqDebounced = useCallback(async (text) => {
    if (!text || text.trim().length < 20) {
      setGroqMoodAnalysis(null);
      return;
    }

    try {
      setIsAnalyzingMood(true);
      const analysis = await analyzeMoodWithGroq(text);
      setGroqMoodAnalysis(analysis);
    } catch (_error) {
      // Silently fail - don't show error to user
      setGroqMoodAnalysis(null);
    } finally {
      setIsAnalyzingMood(false);
    }
  }, []);

  // Removed all complex translation logic - just using simple title translation

  // Load adaptive prompts - Check for answered questions and replace them
  const loadAdaptivePrompts = useCallback(async () => {
    console.log("🔍 ReflectScreen: loadAdaptivePrompts called");
    try {
      console.log("🔍 ReflectScreen: Setting isLoadingPrompts to true");
      setIsLoadingPrompts(true);

      console.log("🔍 ReflectScreen: Getting user from auth");
      const user = supabase.auth.user();
      console.log(
        "🔍 ReflectScreen: User object:",
        user ? "User found" : "No user"
      );

      if (!user) {
        console.log("🔍 ReflectScreen: No user found, returning early");
        return;
      }

      console.log(
        "🔍 ReflectScreen: Calling getAdaptivePrompts with user ID:",
        user.id
      );
      const existingPrompts = await getAdaptivePrompts(user.id);
      console.log(
        "🔍 ReflectScreen: getAdaptivePrompts result:",
        existingPrompts
      );

      if (existingPrompts && existingPrompts.prompts) {
        console.log("🔍 ReflectScreen: Existing prompts found");
        const questions =
          existingPrompts.prompts.questions || existingPrompts.prompts;
        console.log("🔍 ReflectScreen: Questions array:", questions);

        if (Array.isArray(questions) && questions.length > 0) {
          console.log(
            "🔍 ReflectScreen: Questions array is valid, checking answered questions..."
          );

          // Check which questions have been answered
          console.log(
            "🔍 ReflectScreen: Querying reflections for answered questions..."
          );
          const { data: answeredReflections } = await supabase
            .from("reflections")
            .select("prompt_question")
            .eq("user_id", user.id);

          console.log(
            "🔍 ReflectScreen: Answered reflections query result:",
            answeredReflections
          );

          const answeredQuestions =
            answeredReflections?.map((r) => r.prompt_question) || [];
          console.log(
            "🔍 ReflectScreen: Answered questions:",
            answeredQuestions
          );

          // Find the next unanswered question
          let nextQuestionIndex = 0;
          for (let i = 0; i < questions.length; i++) {
            if (!answeredQuestions.includes(questions[i])) {
              nextQuestionIndex = i;
              break;
            }
          }

          console.log(
            "🔍 ReflectScreen: Next unanswered question index:",
            nextQuestionIndex
          );

          // Set the current prompt index to the next unanswered question
          setCurrentPromptIndex(nextQuestionIndex);
          setPromptQuestions(questions);
          console.log(
            "🔍 ReflectScreen: Set prompt questions and current index, returning"
          );
          return;
        } else {
          console.log(
            "🔍 ReflectScreen: Questions array is invalid, generating new prompts..."
          );
          await generateNewPrompts();
        }
      } else {
        console.log(
          "🔍 ReflectScreen: No existing prompts found, generating new prompts..."
        );
        await generateNewPrompts();
      }
    } catch (error) {
      console.error("🔍 ReflectScreen: Error in loadAdaptivePrompts:", error);
      console.log("🔍 ReflectScreen: Falling back to generateNewPrompts...");
      await generateNewPrompts();
    } finally {
      console.log("🔍 ReflectScreen: Setting isLoadingPrompts to false");
      setIsLoadingPrompts(false);
    }
  }, []);

  // Generate new adaptive prompts
  const generateNewPrompts = async () => {
    console.log("🔍 ReflectScreen: generateNewPrompts called");
    try {
      console.log("🔍 ReflectScreen: Getting user for generateNewPrompts");
      const user = supabase.auth.user();
      console.log(
        "🔍 ReflectScreen: User for generateNewPrompts:",
        user ? "User found" : "No user"
      );

      if (!user) {
        console.log(
          "🔍 ReflectScreen: No user found in generateNewPrompts, returning"
        );
        return;
      }

      console.log("🔍 ReflectScreen: Getting user context for prompts...");
      const userContext = await getUserContextForPrompts(user.id);
      console.log("🔍 ReflectScreen: User context result:", userContext);

      console.log("🔍 ReflectScreen: Calling createAdaptivePrompts...");
      const newPrompts = await createAdaptivePrompts({
        user_id: user.id,
        userContext: userContext,
        questionCount: 7, // Always generate 7 questions initially
      });
      console.log(
        "🔍 ReflectScreen: createAdaptivePrompts result:",
        newPrompts
      );

      if (newPrompts && newPrompts.prompts) {
        const questions = newPrompts.prompts.questions || newPrompts.prompts;
        console.log("🔍 ReflectScreen: Questions from newPrompts:", questions);

        if (Array.isArray(questions)) {
          console.log(
            "🔍 ReflectScreen: Setting new prompt questions:",
            questions
          );
          setPromptQuestions(questions);
          setCurrentPromptIndex(0);
          console.log(
            "🔍 ReflectScreen: Set prompt questions and current index to 0"
          );
        } else {
          console.log(
            "🔍 ReflectScreen: Questions is not an array:",
            typeof questions
          );
        }
      } else {
        console.log(
          "🔍 ReflectScreen: No prompts returned from createAdaptivePrompts"
        );
      }
    } catch (error) {
      console.error("🔍 ReflectScreen: Error generating new prompts:", error);

      // Show user-friendly error message for prompt generation
      if (
        error.message.includes("temporarily unavailable") ||
        error.message.includes("high usage")
      ) {
        Alert.alert(
          "Personalized Questions Unavailable",
          "Personalized question generation is temporarily unavailable due to high usage. Using default questions for now.",
          [{ text: "OK" }]
        );
      } else if (error.message.includes("service is currently unavailable")) {
        Alert.alert(
          "Personalized Questions Unavailable",
          "Personalized question generation service is currently unavailable. Using default questions for now.",
          [{ text: "OK" }]
        );
      } else if (error.message.includes("quota exceeded")) {
        Alert.alert(
          "Personalized Questions Unavailable",
          "Personalized question generation quota exceeded. Using default questions for now.",
          [{ text: "OK" }]
        );
      } else {
        // Generic fallback - use default prompts silently
      }

      // Set default prompts as fallback
      setPromptQuestions([
        "How are you feeling right now?",
        "What's one thing you're grateful for today?",
        "What was the highlight of your day?",
        "How would you rate your energy level?",
        "What's on your mind?",
        "How did you handle stress today?",
        "What are you looking forward to?",
      ]);
    }
  };

  // Regenerate function removed - not needed

  // Removed checkAndRefreshPrompts - no automatic regeneration

  // Refresh just the current prompt
  const refreshCurrentPrompt = async () => {
    try {
      setIsLoadingPrompts(true);
      const user = supabase.auth.user();
      if (!user) return;

      // Check if current question has been answered
      const currentQuestion = promptQuestions[currentPromptIndex];
      if (currentQuestion) {
        const { data: existingReflection } = await supabase
          .from("reflections")
          .select("id")
          .eq("user_id", user.id)
          .eq("prompt_question", currentQuestion)
          .single();

        if (existingReflection) {
          Alert.alert(
            "Question Already Answered",
            "You've already answered this question. Please complete your current reflection first."
          );
          return;
        }
      }

      const userContext = await getUserContextForPrompts(user.id);
      const newPrompts = await createAdaptivePrompts({
        user_id: user.id,
        userContext: userContext,
      });

      if (newPrompts && newPrompts.prompts) {
        const questions = newPrompts.prompts.questions || newPrompts.prompts;
        if (Array.isArray(questions) && questions.length > 0) {
          // Find a different question that's not the same as current
          const currentQuestion = promptQuestions[currentPromptIndex];
          let newPrompt = questions[0];

          // Try to find a different question
          for (let i = 0; i < questions.length; i++) {
            if (
              questions[i] !== currentQuestion &&
              !questions[i]
                .toLowerCase()
                .includes(currentQuestion.toLowerCase().split(" ")[1])
            ) {
              newPrompt = questions[i];
              break;
            }
          }

          const updatedQuestions = [...promptQuestions];
          updatedQuestions[currentPromptIndex] = newPrompt;
          setPromptQuestions(updatedQuestions);
        }
      }
    } catch (_error) {
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // Load user's language preference
  useEffect(() => {
    console.log("🔍 ReflectScreen: Starting language loading useEffect");
    const loadUserLanguage = async () => {
      try {
        console.log("🔍 ReflectScreen: Getting user from auth");
        const user = supabase.auth.user();
        console.log(
          "🔍 ReflectScreen: User object:",
          user ? "User found" : "No user"
        );

        if (user) {
          console.log("🔍 ReflectScreen: User ID:", user.id);
          console.log("🔍 ReflectScreen: Querying profiles table...");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("language")
            .eq("id", user.id)
            .single();

          console.log("🔍 ReflectScreen: Profile query result:", {
            profile,
            profileError,
          });

          if (profileError) {
            console.error("🔍 ReflectScreen: Profile error:", profileError);
            return;
          }

          if (profile?.language) {
            console.log(
              "🔍 ReflectScreen: User language is:",
              profile.language
            );
          } else {
            console.log("🔍 ReflectScreen: No language found in profile");
          }
        } else {
          console.log(
            "🔍 ReflectScreen: No user found, using default language"
          );
        }
      } catch (error) {
        console.error("🔍 ReflectScreen: Error loading user language:", error);
      }
    };

    loadUserLanguage();
  }, []);

  // Load prompts on component mount
  useEffect(() => {
    console.log("🔍 ReflectScreen: Starting loadAdaptivePrompts useEffect");
    loadAdaptivePrompts();
  }, [loadAdaptivePrompts]);

  // Analyze mood with Groq when reflection text changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (reflection.trim().length >= 20) {
        analyzeMoodWithGroqDebounced(reflection);
      } else {
        setGroqMoodAnalysis(null);
      }
    }, 2000); // 2 second delay to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [reflection, analyzeMoodWithGroqDebounced]);

  // No automatic prompt refresh - only load existing prompts

  // Navigation functions
  const nextPrompt = async () => {
    const nextIndex = (currentPromptIndex + 1) % promptQuestions.length;
    const nextQuestion = promptQuestions[nextIndex];

    // Check if next question has already been answered
    if (nextQuestion) {
      const user = supabase.auth.user();
      if (user) {
        const { data: existingReflection } = await supabase
          .from("reflections")
          .select("id")
          .eq("user_id", user.id)
          .eq("prompt_question", nextQuestion)
          .single();

        if (existingReflection) {
          Alert.alert(
            "Question Already Answered",
            "You've already answered this question. Please complete your current reflection first."
          );
          return;
        }
      }
    }

    setCurrentPromptIndex(nextIndex);
  };

  const previousPrompt = async () => {
    const prevIndex =
      (currentPromptIndex - 1 + promptQuestions.length) %
      promptQuestions.length;
    const prevQuestion = promptQuestions[prevIndex];

    // Check if previous question has already been answered
    if (prevQuestion) {
      const user = supabase.auth.user();
      if (user) {
        const { data: existingReflection } = await supabase
          .from("reflections")
          .select("id")
          .eq("user_id", user.id)
          .eq("prompt_question", prevQuestion)
          .single();

        if (existingReflection) {
          Alert.alert(
            "Question Already Answered",
            "You've already answered this question. Please complete your current reflection first."
          );
          return;
        }
      }
    }

    setCurrentPromptIndex(prevIndex);
  };

  // Save reflection
  const handleSaveReflection = async () => {
    console.log("🔄 ReflectScreen: Starting save reflection process");
    console.log(
      "📝 ReflectScreen: Reflection text:",
      reflection?.substring(0, 100) + "..."
    );
    console.log("🖼️ ReflectScreen: Selected image:", selectedImage);
    console.log("🎵 ReflectScreen: Recorded audio:", recordedAudio);
    console.log("😊 ReflectScreen: Mood rating:", moodRating);
    console.log("🏷️ ReflectScreen: Selected mood tags:", selectedMoodTags);
    console.log("🧠 ReflectScreen: Groq mood analysis:", groqMoodAnalysis);
    console.log(
      "❓ ReflectScreen: Current prompt:",
      promptQuestions[currentPromptIndex]
    );

    if (!reflection.trim() && !selectedImage && !recordedAudio) {
      console.log("❌ ReflectScreen: Empty reflection, showing alert");
      Alert.alert("Empty Reflection", "Please add some content before saving.");
      return;
    }

    console.log("⏳ ReflectScreen: Setting loading state to true");
    setIsLoading(true);
    try {
      let photoUrl = null;
      let voiceUrl = null;
      let voiceDuration = null;

      // Upload image if selected
      if (selectedImage) {
        console.log(
          "📤 ReflectScreen: Starting image upload for:",
          selectedImage
        );
        try {
          const file = {
            uri: selectedImage,
            type: "image/jpeg",
            name: "reflection-image.jpg",
          };
          console.log("📤 ReflectScreen: Image file object:", file);
          photoUrl = await uploadReflectionFile(file, "reflection-image.jpg");
          console.log(
            "✅ ReflectScreen: Image upload successful, URL:",
            photoUrl
          );
        } catch (error) {
          console.error("❌ ReflectScreen: Image upload failed:", error);
          Alert.alert(
            "Upload Error",
            "Failed to upload image: " + error.message
          );
          return; // Stop the save process if image upload fails
        }
      } else {
        console.log("⏭️ ReflectScreen: No image to upload");
      }

      // Upload audio if recorded
      if (recordedAudio) {
        console.log(
          "🎵 ReflectScreen: Starting audio upload for:",
          recordedAudio
        );
        try {
          const file = {
            uri: recordedAudio,
            type: "audio/m4a",
            name: "reflection-audio.m4a",
          };
          console.log("🎵 ReflectScreen: Audio file object:", file);
          voiceUrl = await uploadReflectionFile(file, "reflection-audio.m4a");
          console.log(
            "✅ ReflectScreen: Audio upload successful, URL:",
            voiceUrl
          );
        } catch (error) {
          console.error("❌ ReflectScreen: Audio upload failed:", error);
          Alert.alert(
            "Upload Error",
            "Failed to upload audio: " + error.message
          );
          return; // Stop the save process if audio upload fails
        }
      } else {
        console.log("⏭️ ReflectScreen: No audio to upload");
      }

      // Create reflection entry
      const reflectionData = {
        text: reflection.trim() || null,
        photo_url: photoUrl,
        voice_url: voiceUrl,
        voice_duration: voiceDuration,
        prompt_question: promptQuestions[currentPromptIndex],
        mood_rating: moodRating,
        tags: selectedMoodTags,
        // Include Groq mood analysis data
        groq_mood_label: groqMoodAnalysis?.groq_mood_label,
        groq_mood_score: groqMoodAnalysis?.groq_mood_score,
        groq_confidence: groqMoodAnalysis?.groq_confidence,
        groq_analysis_timestamp: groqMoodAnalysis?.groq_analysis_timestamp,
      };

      console.log(
        "💾 ReflectScreen: Creating reflection with data:",
        reflectionData
      );
      const savedReflection = await createReflection(reflectionData);
      console.log(
        "✅ ReflectScreen: Reflection saved successfully:",
        savedReflection
      );

      // Don't regenerate questions automatically - let user manually refresh if needed

      // Move to next question or finish
      if (currentPromptIndex < promptQuestions.length - 1) {
        // Move to next question
        setCurrentPromptIndex((prev) => prev + 1);
        setReflection("");
        setSelectedImage(null);
        setRecordedAudio(null);
        setMoodRating(null);
        setSelectedMoodTags([]);
        setGroqMoodAnalysis(null);
        // No alert - just silently move to next question
      } else {
        // All questions completed
        Alert.alert(
          "Reflection Complete",
          "Thank you for taking the time to reflect. Your thoughts have been saved.",
          [
            {
              text: "Done",
              onPress: () => {
                // Reset form and go back
                setReflection("");
                setSelectedImage(null);
                setRecordedAudio(null);
                setMoodRating(null);
                setSelectedMoodTags([]);
                setCurrentPromptIndex(0);
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("❌ ReflectScreen: Error saving reflection:", error);
      console.error("❌ ReflectScreen: Error message:", error.message);
      console.error("❌ ReflectScreen: Error stack:", error.stack);

      // Show user-friendly error message for save failures
      if (
        error.message.includes("network") ||
        error.message.includes("timeout")
      ) {
        console.log("🌐 ReflectScreen: Network error detected");
        Alert.alert(
          "Connection Error",
          "Unable to save your reflection due to a network issue. Please check your connection and try again.",
          [{ text: "OK" }]
        );
      } else if (
        error.message.includes("unauthorized") ||
        error.message.includes("401")
      ) {
        console.log("🔐 ReflectScreen: Authentication error detected");
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
          [{ text: "OK" }]
        );
      } else if (
        error.message.includes("quota") ||
        error.message.includes("limit")
      ) {
        console.log("💾 ReflectScreen: Storage limit error detected");
        Alert.alert(
          "Storage Limit",
          "Unable to save your reflection due to storage limits. Please contact support.",
          [{ text: "OK" }]
        );
      } else {
        console.log("❓ ReflectScreen: Generic error detected");
        Alert.alert(
          "Save Error",
          "Failed to save your reflection. Please try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      console.log("🏁 ReflectScreen: Setting loading state to false");
      setIsLoading(false);
    }
  };

  // Load prompts on component mount
  useEffect(() => {
    console.log('🔍 ReflectScreen: Starting loadAdaptivePrompts useEffect');
    loadAdaptivePrompts();
  }, [loadAdaptivePrompts]);

  // Analyze mood with Groq when reflection text changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (reflection.trim().length >= 20) {
        analyzeMoodWithGroqDebounced(reflection);
      } else {
        setGroqMoodAnalysis(null);
      }
    }, 2000); // 2 second delay to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [reflection, analyzeMoodWithGroqDebounced]);

  console.log("🔍 ReflectScreen: Rendering component");
  console.log(
    "🔍 ReflectScreen: promptQuestions.length:",
    promptQuestions.length
  );
  console.log("🔍 ReflectScreen: currentPromptIndex:", currentPromptIndex);
  console.log("🔍 ReflectScreen: isLoadingPrompts:", isLoadingPrompts);
  console.log("🔍 ReflectScreen: Using English only - no translation");

  try {
    console.log("🔍 ReflectScreen: Starting render return");

    // Simple rendering - no complex loading states

    return (
      <View style={styles.container}>
        {/* Navigation Header */}

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Progress Bar */}
            {console.log("🔍 ReflectScreen: Rendering progress bar")}
            {console.log(
              "🔍 ReflectScreen: About to render progress bar container"
            )}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        ((currentPromptIndex + 1) / promptQuestions.length) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Main Card */}
            {console.log("🔍 ReflectScreen: Rendering main card")}
            <Card style={styles.mainCard}>
              {/* Mood Question - Only show when questions are loaded */}
              {promptQuestions.length > 0 ? (
                <>
                  {console.log(
                    "🔍 ReflectScreen: Rendering mood question:",
                    promptQuestions[currentPromptIndex]
                  )}
                  <Text style={styles.moodQuestion}>
                    {promptQuestions[currentPromptIndex]}
                  </Text>
                </>
              ) : (
                <>
                  {console.log(
                    "🔍 ReflectScreen: Rendering loading state, isLoadingPrompts:",
                    isLoadingPrompts
                  )}
                  {console.log("🔍 ReflectScreen: Rendering EmptyState")}
                  {console.log(
                    "🔍 ReflectScreen: About to render EmptyState component"
                  )}
                  <EmptyState
                    title={
                      <Text style={styles.loadingTitle}>
                        Preparing Your Reflection
                      </Text>
                    }
                    message={
                      isLoadingPrompts ? (
                        <Text style={styles.loadingMessage}>
                          Generating personalized questions just for you...
                        </Text>
                      ) : (
                        <Text style={styles.loadingMessage}>
                          Loading your reflection questions...
                        </Text>
                      )
                    }
                    centered={true}
                    showIcon={false}
                    containerStyle={styles.loadingContainer}
                    titleStyle={styles.loadingTitle}
                    messageStyle={styles.loadingMessage}
                  />
                </>
              )}

              {/* Navigation Arrows - Only show when questions are loaded */}
              {promptQuestions.length > 0 && (
                <>
                  {console.log("🔍 ReflectScreen: Rendering navigation arrows")}
                  <View style={styles.promptNavigation}>
                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={previousPrompt}
                    >
                      <Feather name="chevron-left" size={24} color="#D36B37" />
                    </TouchableOpacity>

                    <Text style={styles.promptCounter}>
                      {currentPromptIndex + 1} of {promptQuestions.length}
                    </Text>

                    <TouchableOpacity
                      style={styles.navButton}
                      onPress={nextPrompt}
                    >
                      <Feather name="chevron-right" size={24} color="#D36B37" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Refresh Current Prompt Button - Only show when questions are loaded */}
              {promptQuestions.length > 0 && (
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={refreshCurrentPrompt}
                  disabled={isLoadingPrompts}
                >
                  <Feather
                    name={isLoadingPrompts ? "loader" : "refresh-cw"}
                    size={16}
                    color="#D36B37"
                  />
                  <Text style={styles.refreshButtonText}>
                    {isLoadingPrompts ? "Generating..." : "Refresh This Prompt"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Mood Rating - Only show when questions are loaded */}
              {promptQuestions.length > 0 && (
                <MoodSelector
                  selectedMood={moodRating}
                  onMoodSelect={setMoodRating}
                  promptQuestion=""
                  style={styles.moodSelector}
                />
              )}

              {/* Groq Mood Analysis Indicator */}
              {promptQuestions.length > 0 &&
                (isAnalyzingMood || groqMoodAnalysis) && (
                  <View style={styles.groqMoodAnalysis}>
                    <View style={styles.groqMoodHeader}>
                      <Feather name="brain" size={16} color="#D36B37" />
                      <Text style={styles.groqMoodTitle}>
                        {isAnalyzingMood
                          ? "Analyzing mood..."
                          : "AI Mood Analysis"}
                      </Text>
                    </View>
                    {groqMoodAnalysis && !isAnalyzingMood && (
                      <View style={styles.groqMoodContent}>
                        <Text style={styles.groqMoodLabel}>
                          Mood: {groqMoodAnalysis.groq_mood_label}
                        </Text>
                        <Text style={styles.groqMoodScore}>
                          Score: {groqMoodAnalysis.groq_mood_score}/10
                        </Text>
                        <Text style={styles.groqMoodConfidence}>
                          Confidence:{" "}
                          {Math.round(groqMoodAnalysis.groq_confidence)}%
                        </Text>
                      </View>
                    )}
                  </View>
                )}

              {/* Text Input with Media Buttons - Only show when questions are loaded */}
              {promptQuestions.length > 0 && (
                <>
                  {console.log("🔍 ReflectScreen: Rendering Input component")}
                  {console.log("🔍 ReflectScreen: Input props:", {
                    reflection,
                    selectedImage,
                    recordedAudio,
                    isTranscribing,
                    moodTagSources,
                    selectedMoodTags,
                  })}
                  <Input
                    label={
                      <Text style={styles.inputLabel}>⚡ Your Reflection</Text>
                    }
                    value={reflection}
                    onChangeText={setReflection}
                    placeholder="Take a moment to reflect on your day..."
                    multiline
                    numberOfLines={6}
                    maxLength={1000}
                    onImageSelect={handleImageSelect}
                    onAudioRecord={handleAudioRecord}
                    onTranscriptionStart={handleTranscriptionStart}
                    onTranscriptionComplete={handleTranscriptionComplete}
                    selectedImage={selectedImage}
                    recordedAudio={recordedAudio}
                    isRecording={isRecording}
                    isTranscribing={isTranscribing}
                    onRemoveImage={handleRemoveImage}
                    onRemoveAudio={handleRemoveAudio}
                    onClear={handleClearReflection}
                    style={styles.reflectionInput}
                    showMoodTags={true}
                    onMoodTagSelect={handleMoodTagSelect}
                    selectedTags={selectedMoodTags}
                    moodTagSources={moodTagSources}
                    onMoodTagSourcesUpdate={handleMoodTagSourcesUpdate}
                    onClearSelectedTags={handleClearSelectedTags}
                  />
                </>
              )}
            </Card>

            {/* Save Button - Only show when questions are loaded */}
            {promptQuestions.length > 0 && (
              <>
                {console.log(
                  "🔍 ReflectScreen: Rendering save button, isLoading:",
                  isLoading
                )}
                <Button
                  title={isLoading ? "Saving..." : "Save and Continue"}
                  onPress={handleSaveReflection}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.saveButton}
                />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  } catch (error) {
    console.error("🔍 ReflectScreen: CRASH during render:", error);
    console.error("🔍 ReflectScreen: Error stack:", error.stack);
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EBE4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#F5EBE4",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 16,
    color: "#1F513F",
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F513F",
  },
  headerSpacer: {
    width: 60, // Same width as back button to center title
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  progressBarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3A4D39",
    borderRadius: 3,
  },
  mainCard: {
    backgroundColor: "#FCFAF3",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  moodQuestion: {
    fontSize: 20,
    color: "#D36B37",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "600",
    marginBottom: 20,
  },
  promptNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F8F3F0",
  },
  promptCounter: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F3F0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: "center",
  },
  refreshButtonText: {
    fontSize: 12,
    color: "#D36B37",
    fontWeight: "500",
    marginLeft: 6,
  },
  moodSelector: {
    marginBottom: 20,
  },
  reflectionInput: {
    marginBottom: 0,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingTitle: {
    fontSize: 24,
    color: "#D36B37",
    fontWeight: "600",
    marginBottom: 16,
  },
  loadingMessage: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputPlaceholder: {
    fontSize: 16,
    color: "#999",
  },
  // Groq mood analysis styles
  groqMoodAnalysis: {
    backgroundColor: "#F8F3F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#D36B37",
  },
  groqMoodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  groqMoodTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D36B37",
    marginLeft: 8,
  },
  groqMoodContent: {
    marginTop: 8,
  },
  groqMoodLabel: {
    fontSize: 14,
    color: "#3A4D39",
    fontWeight: "500",
    marginBottom: 4,
  },
  groqMoodScore: {
    fontSize: 14,
    color: "#3A4D39",
    marginBottom: 4,
  },
  groqMoodConfidence: {
    fontSize: 12,
    color: "#666",
  },
});
