import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, TouchableOpacity, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../supabaseClient";
import PersonaManager from "../../components/ui/PersonaManager";
import PersonaProfile from "../../components/ui/PersonaProfile";
import DefaultPersonaEditor from "../../components/ui/DefaultPersonaEditor";

const PersonaManagementScreen = ({ navigation, route }) => {
  const [currentView, setCurrentView] = useState("list"); // 'list', 'create', 'edit'
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUser();

    // Check if we should start in create mode
    if (route?.params?.mode === "create") {
      setCurrentView("create");
    }
  }, [route?.params?.mode]);

  const loadUser = async () => {
    try {
      const user = supabase.auth.user();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleCreatePersona = () => {
    setSelectedPersona(null);
    setCurrentView("create");
  };

  const handleEditPersona = (persona) => {
    setSelectedPersona(persona);
    setCurrentView("edit");
  };

  const handleSavePersona = () => {
    setCurrentView("list");
    setSelectedPersona(null);
  };

  const handlePersonaCreated = (newPersona) => {
    // Persona was created successfully, show success and guide back to chat
    Alert.alert(
      "Persona Created! 🎉",
      `Your "${newPersona.name}" persona is ready! You can now have personalized conversations with AI based on their characteristics.`,
      [
        {
          text: "Start Chatting",
          onPress: () => {
            // Navigate back to the chat screen
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDeletePersona = () => {
    setCurrentView("list");
    setSelectedPersona(null);
  };

  const handleCancel = () => {
    setCurrentView("list");
    setSelectedPersona(null);
  };

  // const renderHeader = () => (
  //   <View style={styles.header}>
  //     {/* <Text style={styles.headerTitle}>
  //       {currentView === "list"
  //         ? "Your Personas"
  //         : currentView === "create"
  //         ? "Customize Personas"
  //         : "Edit Persona"}
  //     </Text> */}
  //     {currentView === "list" && (
  //       <TouchableOpacity
  //         onPress={handleCreatePersona}
  //         style={styles.addButton}
  //       >
  //         <Feather name="plus" size={24} color="#D36B37" />
  //       </TouchableOpacity>
  //     )}
  //   </View>
  // );

  if (!userId) {
    return (
      <View style={styles.container}>
        {/* {renderHeader()} */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* {renderHeader()} */}

      {currentView === "list" && (
        <PersonaManager
          userId={userId}
          onEditPersona={handleEditPersona}
          onCreatePersona={handleCreatePersona}
        />
      )}

      {currentView === "create" && (
        <DefaultPersonaEditor
          userId={userId}
          onSave={handleSavePersona}
          onCancel={handleCancel}
        />
      )}

      {currentView === "edit" && (
        <PersonaProfile
          persona={selectedPersona}
          userId={userId}
          onSave={handleSavePersona}
          onDelete={handleDeletePersona}
          onCancel={handleCancel}
          onPersonaCreated={handlePersonaCreated}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6c757d",
  },
});

export default PersonaManagementScreen;
