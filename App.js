import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

// Import screens
import HomeScreen from "./src/screens/HomeScreen";
import FoodLogScreen from "./src/screens/FoodLogScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import EmailAuthScreen from "./src/screens/EmailAuthScreen";
import LogSymptomScreen from "./src/screens/LogSymptomScreen";
import ViewYourDayScreen from "./src/screens/ViewYourDayScreen";
import CalendarViewScreen from "./src/screens/CalendarViewScreen";
import ProductLogScreen from "./src/screens/ProductLogScreen";
import ViewInsightsScreen from "./src/screens/ViewInsightsScreen";
import ReflectScreen from "./src/screens/ReflectScreen";
import ReflectionsFeedScreen from "./src/screens/ReflectionsFeedScreen";
import PersonaManagementScreen from "./src/screens/PersonaManagementScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator Component
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#F5EBE4",
          borderTopColor: "#E5E5E5",
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 35,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#D36B37",
        tabBarInactiveTintColor: "#1F513F",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarViewScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Feather name="calendar" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={ViewInsightsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Feather name="bar-chart-2" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <EmailAuthScreen onAuth={setUser} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <Stack.Navigator
            initialRouteName="Back"
            screenOptions={{
              headerStyle: {
                backgroundColor: "#F5EBE4",
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: "#22372B",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          >
            <Stack.Screen
              name="Back"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FoodLog"
              component={FoodLogScreen}
              options={{ title: "Add Food Entry" }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: "My Profile" }}
            />
            <Stack.Screen
              name="LogSymptom"
              component={LogSymptomScreen}
              options={{ title: "Log Symptom" }}
            />
            <Stack.Screen
              name="ViewYourDay"
              component={ViewYourDayScreen}
              options={{ title: "View Your Day" }}
            />
            <Stack.Screen
              name="CalendarView"
              component={CalendarViewScreen}
              options={{ title: "Calendar" }}
            />
            <Stack.Screen
              name="ProductLog"
              component={ProductLogScreen}
              options={{ title: "Add Product Log" }}
            />
            <Stack.Screen
              name="ViewInsights"
              component={ViewInsightsScreen}
              options={{ title: "Insights" }}
            />
            <Stack.Screen
              name="Reflect"
              component={ReflectScreen}
              options={{ title: "Reflect" }}
            />
            <Stack.Screen
              name="ReflectionsFeed"
              component={ReflectionsFeedScreen}
              options={{ title: "Reflection Mode" }}
            />
            <Stack.Screen
              name="PersonaManagement"
              component={PersonaManagementScreen}
              options={{ title: "Customize Personas" }}
            />
          </Stack.Navigator>
          <StatusBar style="light" />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EBE4",
  },
});
