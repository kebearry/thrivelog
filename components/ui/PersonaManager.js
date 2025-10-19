import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Card from "./Card";
import Button from "./Button";
import { getPersonas } from "../../src/api/personas";

const PersonaManager = ({
  userId,
  onSelectPersona,
  onEditPersona,
  onCreatePersona,
  selectedPersonaId,
}) => {
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPersonas();
  }, [userId]);

  const loadPersonas = async () => {
    try {
      setIsLoading(true);
      const data = await getPersonas(userId);
      setPersonas(data || []);
    } catch (error) {
      // This should rarely happen now since getPersonas handles table not found
      console.error("Unexpected error loading personas:", error);
      setPersonas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersona = ({ item }) => (
    <Card
      style={[
        styles.personaCard,
        selectedPersonaId === item.id && styles.selectedCard,
      ]}
    >
      <TouchableOpacity
        onPress={() => onSelectPersona?.(item)}
        style={styles.personaContent}
      >
        <View style={styles.personaHeader}>
          <Text style={styles.personaName}>{item.name}</Text>
          {selectedPersonaId === item.id && (
            <Feather name="check-circle" size={20} color="#D36B37" />
          )}
        </View>

        {item.relationship && (
          <Text style={styles.relationship}>{item.relationship}</Text>
        )}

        {item.personality && (
          <Text style={styles.personality} numberOfLines={2}>
            {item.personality}
          </Text>
        )}

        <View style={styles.personaActions}>
          <TouchableOpacity
            onPress={() => onEditPersona?.(item)}
            style={styles.actionButton}
          >
            <Feather name="edit-2" size={16} color="#6c757d" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D36B37" />
        <Text style={styles.loadingText}>Loading your personas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {personas.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Feather name="users" size={48} color="#dee2e6" />
            <Text style={styles.emptyTitle}>No personas yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first persona to start having personalized
              conversations
            </Text>
            <Button
              title="Create Your First Persona"
              onPress={onCreatePersona}
              style={styles.createButton}
            />
          </View>
        </Card>
      ) : (
        <FlatList
          data={personas}
          renderItem={renderPersona}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {personas.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Create New Persona"
            onPress={onCreatePersona}
            style={styles.createButton}
            textStyle={styles.createButtonText}
          />
        </View>
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
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6c757d",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  personaCard: {
    marginBottom: 0,
  },
  selectedCard: {
    borderColor: "#D36B37",
    borderWidth: 2,
    backgroundColor: "#fff5f0",
  },
  personaContent: {
    padding: 0,
  },
  personaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  personaName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  relationship: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  personality: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
    marginBottom: 12,
  },
  personaActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#6c757d",
  },
  emptyCard: {
    margin: 16,
    padding: 32,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#D36B37",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
});

export default PersonaManager;
