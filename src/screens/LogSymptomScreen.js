import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { addSymptomLog } from "../api/symptomlogs";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts } from "../theme";
import {
  Button,
  Input,
  TimePicker,
  SymptomSelector,
  IntensitySlider,
} from "../../components/ui";

const SYMPTOMS = [
  {
    key: "itchy",
    label: "Itchy",
    icon: <Feather name="hand" size={24} color="#22372B" />,
  },
  {
    key: "redness",
    label: "Redness",
    icon: <Feather name="circle" size={24} color="#22372B" />,
  },
  {
    key: "bloating",
    label: "Bloating",
    icon: <MaterialCommunityIcons name="stomach" size={24} color="#22372B" />,
  },
  {
    key: "headache",
    label: "Headache",
    icon: <Feather name="frown" size={24} color="#22372B" />,
  },
  {
    key: "constipation",
    label: "Constipation",
    icon: (
      <MaterialCommunityIcons
        name="emoticon-neutral-outline"
        size={24}
        color="#22372B"
      />
    ),
  },
  {
    key: "other",
    label: "Other",
    icon: <Feather name="more-horizontal" size={24} color="#22372B" />,
  },
];

const INTENSITY_LABELS = [
  "Mild",
  "Moderate",
  "Strong",
  "Very Strong",
  "Severe",
];

const LABEL_WIDTH = 120;
const SLIDER_PADDING = 16;

export default function LogSymptomScreen() {
  const navigation = useNavigation();
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [customSymptom, setCustomSymptom] = useState("");
  const [intensity, setIntensity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedTime, setSelectedTime] = useState(new Date());

  const handleSave = async () => {
    Keyboard.dismiss();
    setTimeout(async () => {
      try {
        const symptom =
          selectedSymptom === "other" ? customSymptom : selectedSymptom;
        await addSymptomLog({
          symptom,
          intensity,
          time: selectedTime
            ? selectedTime.toISOString()
            : new Date().toISOString(),
          notes,
        });
        alert("Symptom logged successfully!");
        navigation.navigate("Home");
      } catch (error) {
        alert("Error logging symptom: " + error.message);
      }
    }, 50);
  };

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
        <ScrollView
          style={{ flex: 1, backgroundColor: "#FFF" }}
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Not feeling 100%?</Text>
          <Text style={styles.subtitle}>
            Tell us what your body is telling you.
          </Text>

          {/* Symptom Selector */}
          <SymptomSelector
            symptoms={SYMPTOMS}
            selectedSymptom={selectedSymptom}
            onSymptomSelect={setSelectedSymptom}
            variant="pill"
          />
          {selectedSymptom === "other" && (
            <Input
              label="Enter symptom"
              value={customSymptom}
              onChangeText={setCustomSymptom}
              placeholder="Enter symptom"
            />
          )}

          {/* Intensity Selector */}
          <IntensitySlider
            value={intensity}
            onValueChange={setIntensity}
            labels={INTENSITY_LABELS}
            label="How intense was it?"
          />

          {/* Time */}
          <TimePicker
            value={selectedTime}
            onTimeChange={setSelectedTime}
            label="Time"
          />

          {/* Notes */}
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any details? (e.g. what triggered it, where on body, what helped)"
            multiline
            numberOfLines={4}
          />

          {/* Save Button */}
          <Button
            title="Save Symptom"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </ScrollView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.boldItalic,
    fontSize: 32,
    color: colors.text,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 20,
    color: colors.text,
    textAlign: "center",
    marginBottom: 28,
    fontFamily: fonts.serif,
  },
  pillGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 28,
    gap: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 4,
    marginBottom: 8,
  },
  pillSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FBE9D0",
  },
  pillText: {
    fontSize: 18,
    color: colors.text,
    marginLeft: 8,
    fontFamily: Platform.OS === "ios" ? fonts.serif : undefined,
  },
  sectionLabel: {
    fontSize: 20,
    color: colors.text,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? fonts.serif : undefined,
  },
  intensityNumbersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 12,
  },
  intensityNumberPressable: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  intensityNumberSelected: {
    backgroundColor: "#F3F3F3",
    borderColor: "#22372B",
    borderWidth: 2,
  },
  intensityNumber: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
  },
  intensityNumberTextSelected: {
    color: "#22372B",
    fontWeight: "bold",
  },
  intensityLabel: {
    backgroundColor: "transparent",
    color: colors.text,
    fontSize: 18,
    width: LABEL_WIDTH,
    textAlign: "center",
    paddingHorizontal: 0,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: "hidden",
  },
  intensityCaret: {
    width: 12,
    height: 12,
    backgroundColor: "transparent",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: -2,
    transform: [{ rotate: "45deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  slider: {
    width: "100%",
    height: 60,
  },
  row: {
    flexDirection: "row",
    marginBottom: 18,
    marginTop: 2,
  },
  timeInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 2,
    minHeight: 48,
  },
  timeInputPressed: {
    backgroundColor: "#f3f0e8",
    borderColor: colors.primary,
  },
  dropdownText: {
    fontSize: 18,
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? fonts.serif : undefined,
  },
  notesInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 16,
    fontSize: 17,
    color: colors.text,
    marginBottom: 24,
    minHeight: 80,
    fontFamily: Platform.OS === "ios" ? fonts.serif : undefined,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? fonts.serif : undefined,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#ffff",
    padding: 16,
    fontSize: 17,
    color: colors.text,
    marginBottom: 24,
    minHeight: 48,
    fontFamily: Platform.OS === "ios" ? fonts.serif : undefined,
  },
});
