import React from "react";
import { View, StyleSheet } from "react-native";
import { EmptyState } from "../../components/ui";

export default function ViewInsightsScreen() {
  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      <EmptyState
        title="Your Insights"
        message="Coming soon..."
        centered={true}
        showIcon={false}
        containerStyle={styles.emptyStateContainer}
        messageStyle={styles.emptyMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  emptyStateContainer: {
    flex: 1,
  },
  emptyMessage: {
    fontSize: 18,
    color: "#666",
    fontStyle: "italic",
  },
});
