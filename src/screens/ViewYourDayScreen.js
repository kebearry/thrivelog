import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  TextInput,
  Modal,
  Pressable,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { getFoodLogs } from "../api/foodlogs";
import { getSymptomLogs } from "../api/symptomlogs";
import { getProductLogs } from "../api/productlogs";
import { getDay, setDay } from "../api/day";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { addAfterEffect, getAfterEffectsForDay } from "../api/aftereffects";
import { supabase } from "../supabaseClient";
import { getProfile } from "../api/profiles";
import { getCanonEventsForDay, closeCanonEvent } from "../api/canonevents";

const ICONS = {
  food: (
    <MaterialCommunityIcons
      name="silverware-fork-knife"
      size={22}
      color="#22372B"
    />
  ),
  symptom: <Feather name="check-circle" size={22} color="#FF7A00" />, // Standard symptom icon
  product: <MaterialCommunityIcons name="cup" size={22} color="#1E88E5" />, // Standard product icon
  canon: (
    <MaterialCommunityIcons
      name="alert-decagram-outline"
      size={22}
      color="#C2185B"
    />
  ),
};

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ViewYourDayScreen() {
  const route = useRoute();
  const passedDate = route.params?.date;
  const [fontsLoaded] = useFonts({
    "PlayfairDisplay-BoldItalic": require("../../assets/fonts/PlayfairDisplay-BoldItalic.ttf"),
  });
  const [foodLogs, setFoodLogs] = useState([]);
  const [symptomLogs, setSymptomLogs] = useState([]);
  const [productLogs, setProductLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPeriod, setIsPeriod] = useState(false);
  const [isPooped, setIsPooped] = useState(false);
  const [isHousekeepingDay, setIsHousekeepingDay] = useState(false);
  const [weatherTip, setWeatherTip] = useState("");
  const [temperature, setTemperature] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState(null); // 'success' | 'fail' | null
  const navigation = useNavigation();
  const [periodAnim] = useState(new Animated.Value(1));
  const [poopAnim] = useState(new Animated.Value(1));
  const [houseAnim] = useState(new Animated.Value(1));
  const [reflection, setReflection] = useState("");
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);
  const [afterEffects, setAfterEffects] = useState([]);
  const user = supabase.auth.user();
  const [allowNotifications, setAllowNotifications] = useState(false);
  const [gender, setGender] = useState("");
  const [error, setError] = useState(null);
  const [canonEvents, setCanonEvents] = useState([]);

  const dateObj = passedDate ? new Date(passedDate) : new Date();
  const dateStr = dateObj.toISOString().slice(0, 10);
  const isToday = dateStr === new Date().toISOString().slice(0, 10);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateObj = passedDate ? new Date(passedDate) : new Date();
      const dateStr = dateObj.toISOString().slice(0, 10);
      const [foods, symptoms, products, day, canon] = await Promise.all([
        getFoodLogs(dateStr).catch((err) => {
          return [];
        }),
        getSymptomLogs(dateStr).catch((err) => {
          return [];
        }),
        getProductLogs(dateStr).catch((err) => {
          return [];
        }),
        getDay(dateStr).catch((err) => {
          return {
            is_period: false,
            is_pooped: false,
            is_housekeeping_day: false,
            reflection: "",
          };
        }),
        user
          ? getCanonEventsForDay(user.id, dateObj).catch((err) => {
              return [];
            })
          : [],
      ]);
      setFoodLogs(foods || []);
      setSymptomLogs(symptoms || []);
      setProductLogs(products || []);
      setIsPeriod(day?.is_period || false);
      setIsPooped(day?.is_pooped || false);
      setIsHousekeepingDay(day?.is_housekeeping_day || false);
      setReflection(day?.reflection || "");
      setTemperature(day?.temperature ?? null);
      if (!isToday) {
        if (day?.temperature != null && !isNaN(Number(day.temperature))) {
          let conciseTip = "";
          const temp = Number(day.temperature);
          if (temp > 30) {
            conciseTip = `☀️ ${Math.round(temp)}°C. Hot outside — drink up!`;
          } else if (temp < 18) {
            conciseTip = `❄️ ${Math.round(temp)}°C. Chilly — keep warm!`;
          } else {
            conciseTip = `🌤️ ${Math.round(temp)}°C. Have a great day!`;
          }
          setWeatherTip(conciseTip);
        } else {
          setWeatherTip("No temperature recorded for this day.");
        }
      }
      setCanonEvents(canon || []);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [passedDate]);

  useEffect(() => {
    if (!isToday || temperature !== null) {
      return;
    }
    const fetchWeather = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setWeatherTip("🌤️ Have a great day!");
          setWeatherStatus("fail");
          return;
        }
        let location;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000,
          });
        } catch (locationError) {
          setWeatherTip("🌤️ Have a great day!");
          setWeatherStatus("fail");
          return;
        }
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        const apiKey = "d5093a27a104bcd9ac3a478364e5fd6c";
        const dateObj = passedDate ? new Date(passedDate) : new Date();
        const dateStr = dateObj.toISOString().slice(0, 10);
        try {
          const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`Weather API error: ${res.status}`);
          }
          const data = await res.json();
          if (!data || !data.list) {
            throw new Error("Invalid weather data format");
          }
          const forecast = data.list.find((item) =>
            item.dt_txt.startsWith(dateStr)
          );
          const temp = forecast?.main?.temp;
          if (typeof temp === "number") {
            setTemperature(temp);
            let conciseTip = "";
            if (temp > 30) {
              conciseTip = `☀️ ${Math.round(temp)}°C. Hot outside — drink up!`;
            } else if (temp < 18) {
              conciseTip = `❄️ ${Math.round(temp)}°C. Chilly — keep warm!`;
            } else {
              conciseTip = `🌤️ ${Math.round(temp)}°C. Have a great day!`;
            }
            setWeatherTip(conciseTip);
            setWeatherStatus("success");
            await setDay({ temperature: temp }, dateStr);
          } else {
            throw new Error("Invalid temperature data");
          }
        } catch (weatherError) {
          setWeatherTip("🌤️ Have a great day!");
          setWeatherStatus("fail");
        }
      } catch (e) {
        setWeatherTip("🌤️ Have a great day!");
        setWeatherStatus("fail");
      }
    };
    fetchWeather();
  }, [passedDate, isToday, temperature]);

  useEffect(() => {
    if (user) {
      getAfterEffectsForDay(user.id, dateStr)
        .then(setAfterEffects)
        .catch(() => setAfterEffects([]));
    }
  }, [passedDate, user]);

  useEffect(() => {
    if (user) {
      getProfile(user.id).then((profile) => {
        setAllowNotifications(profile.allow_notifications ?? false);
        setGender(profile.gender || "");
      });
    }
  }, [user]);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#275B44" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#275B44" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchData();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTogglePeriod = async () => {
    const newValue = !isPeriod;
    setIsPeriod(newValue);
    const dateObj = passedDate ? new Date(passedDate) : new Date();
    const dateStr = dateObj.toISOString().slice(0, 10);
    await setDay({ is_period: newValue }, dateStr);
  };

  const handleTogglePooped = async () => {
    const newValue = !isPooped;
    setIsPooped(newValue);
    const dateObj = passedDate ? new Date(passedDate) : new Date();
    const dateStr = dateObj.toISOString().slice(0, 10);
    await setDay({ is_pooped: newValue }, dateStr);
  };

  const handleToggleHousekeeping = async () => {
    const newValue = !isHousekeepingDay;
    setIsHousekeepingDay(newValue);
    const dateObj = passedDate ? new Date(passedDate) : new Date();
    const dateStr = dateObj.toISOString().slice(0, 10);
    await setDay({ is_housekeeping_day: newValue }, dateStr);
  };

  const animateToggle = (anim) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();
  };

  // Merge and sort logs by time
  const timeline = [
    ...foodLogs.map((f) => ({
      id: f.id,
      type: "food",
      time: f.time,
      title: f.food,
      details: f.notes,
      photo_url: f.photo_url,
    })),
    ...symptomLogs.map((s) => ({
      id: s.id,
      type: "symptom",
      time: s.time,
      title: s.symptom ? s.symptom.toLowerCase() : "",
      details: s.notes,
      intensity: s.intensity,
    })),
    ...productLogs.map((p) => ({
      id: p.id,
      type: "product",
      time: p.time,
      title: p.product,
      details: p.notes,
      photo_url: p.photo_url,
      category: p.category,
    })),
    ...canonEvents.map((e) => ({
      id: e.id,
      type: "canon",
      time: e.event_time,
      title: e.title,
      details: e.notes,
      intensity: e.intensity,
      closed_time: e.closed_time,
    })),
  ].sort((a, b) => new Date(a.time) - new Date(b.time));

  // Summary
  const mealsLogged = foodLogs.length;
  const symptomsLogged = symptomLogs.length;

  const handleReflectionSave = async () => {
    setReflectionSaving(true);
    try {
      const dateObj = passedDate ? new Date(passedDate) : new Date();
      const dateStr = dateObj.toISOString().slice(0, 10);
      await setDay({ reflection }, dateStr);
    } finally {
      setReflectionSaving(false);
    }
  };

  // Helper to check if a log has an after-effect
  function hasAfterEffect(logType, logId) {
    return afterEffects.some(
      (ae) => ae.log_type === logType && ae.log_id === logId
    );
  }

  // Handler for answering after-effect
  async function handleAfterEffect(logType, logId, response, logName) {
    if (!user) return;
    await addAfterEffect({
      user_id: user.id,
      log_type: logType,
      log_id: logId,
      response,
      log_name: logName,
    });
    setAfterEffects([
      ...afterEffects,
      { log_type: logType, log_id: logId, response, log_name: logName },
    ]);
  }

  function hasAfterEffectForFoodName(logType, logName) {
    return afterEffects.some(
      (ae) => ae.log_type === logType && ae.log_name === logName
    );
  }

  function goToDay(offset) {
    const baseDate = passedDate ? new Date(passedDate) : new Date();
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + offset);
    navigation.replace("ViewYourDay", {
      date: newDate.toISOString().slice(0, 10),
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const isNextDayDisabled = dateStr >= todayStr;

  // Helper to get the last aftereffect response for a canon event
  function getLastCanonAfterEffectResponse(logId) {
    // Find the last aftereffect for this canon event by log_id
    const canonEffects = afterEffects.filter(
      (ae) => ae.log_type === 'canon' && ae.log_id === logId
    );
    if (canonEffects.length === 0) return null;
    // Sort by created_at if available, else just use last
    const sorted = canonEffects.sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });
    return sorted[0].response;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "position" : "height"}
      keyboardVerticalOffset={64}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={{ backgroundColor: "#FFFF" }}
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* <Text style={styles.header}>View Your Day</Text> */}
          <Text style={styles.label}>In a nutshell</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => goToDay(-1)}
              style={{ padding: 8 }}
            >
              <Feather name="chevron-left" size={28} color="#22372B" />
            </TouchableOpacity>
            <Text style={styles.todayDateText}>
              {(passedDate
                ? new Date(passedDate)
                : new Date()
              ).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <TouchableOpacity
              onPress={() => goToDay(1)}
              style={{ padding: 8 }}
              disabled={isNextDayDisabled}
            >
              <Feather
                name="chevron-right"
                size={28}
                color={isNextDayDisabled ? "#ccc" : "#22372B"}
              />
            </TouchableOpacity>
          </View>
          {!!weatherTip && (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>{weatherTip}</Text>
            </View>
          )}
          <View style={styles.togglesRow}>
            {gender === "female" ? (
              <>
                <View style={styles.toggleItem}>
                  <Animated.View style={{ transform: [{ scale: periodAnim }] }}>
                    <MaterialCommunityIcons
                      name="water"
                      size={20}
                      color="#555"
                      style={{ marginRight: 4 }}
                    />
                  </Animated.View>
                  <Text style={styles.toggleLabel}>Period Day</Text>
                  <Switch
                    value={isPeriod}
                    onValueChange={(val) => {
                      animateToggle(periodAnim);
                      handleTogglePeriod();
                    }}
                    thumbColor={isPeriod ? "#fff" : "#fff"}
                    trackColor={{ true: "#FF7A00", false: "#E0E0D1" }}
                    ios_backgroundColor="#E0E0D1"
                    style={styles.smallSwitch}
                    accessibilityLabel="Toggle Period Day"
                    accessible={true}
                  />
                </View>
                <View style={styles.toggleItem}>
                  <MaterialCommunityIcons
                    name="toilet"
                    size={20}
                    color="#555"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.toggleLabel}>Pooped?</Text>
                  <Switch
                    value={isPooped}
                    onValueChange={handleTogglePooped}
                    thumbColor={isPooped ? "#fff" : "#fff"}
                    trackColor={{ true: "#FF7A00", false: "#E0E0D1" }}
                    ios_backgroundColor="#E0E0D1"
                    style={styles.smallSwitch}
                    accessibilityLabel="Toggle Pooped"
                    accessible={true}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.toggleItem}>
                  <MaterialCommunityIcons
                    name="broom"
                    size={20}
                    color="#555"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.toggleLabel}>Housekeeping Day?</Text>
                  <Switch
                    value={isHousekeepingDay}
                    onValueChange={handleToggleHousekeeping}
                    thumbColor={isHousekeepingDay ? "#fff" : "#fff"}
                    trackColor={{ true: "#FF7A00", false: "#E0E0D1" }}
                    ios_backgroundColor="#E0E0D1"
                    style={styles.smallSwitch}
                    accessibilityLabel="Toggle Housekeeping Day"
                    accessible={true}
                  />
                </View>
                <View style={styles.toggleItem}>
                  <MaterialCommunityIcons
                    name="toilet"
                    size={20}
                    color="#555"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.toggleLabel}>Pooped?</Text>
                  <Switch
                    value={isPooped}
                    onValueChange={handleTogglePooped}
                    thumbColor={isPooped ? "#fff" : "#fff"}
                    trackColor={{ true: "#FF7A00", false: "#E0E0D1" }}
                    ios_backgroundColor="#E0E0D1"
                    style={styles.smallSwitch}
                    accessibilityLabel="Toggle Pooped"
                    accessible={true}
                  />
                </View>
              </>
            )}
          </View>
          {gender === "female" && (
            <View style={styles.togglesRow}>
              <View style={styles.toggleItem}>
                <MaterialCommunityIcons
                  name="broom"
                  size={20}
                  color="#555"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.toggleLabel}>Housekeeping Day?</Text>
                <Switch
                  value={isHousekeepingDay}
                  onValueChange={handleToggleHousekeeping}
                  thumbColor={isHousekeepingDay ? "#fff" : "#fff"}
                  trackColor={{ true: "#FF7A00", false: "#E0E0D1" }}
                  ios_backgroundColor="#E0E0D1"
                  style={styles.smallSwitch}
                  accessibilityLabel="Toggle Housekeeping Day"
                  accessible={true}
                />
              </View>
            </View>
          )}
          <View style={styles.timelineContainer}>
            {timeline.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons
                  name="calendar-blank"
                  size={48}
                  color="#000"
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.emptyStateText}>
                  No logs for this day yet!
                </Text>
              </View>
            ) : (
              timeline.map((item, idx) => {
                const isSymptom = item.type === "symptom";
                const isFoodWithImage = item.type === "food" && item.photo_url;
                return (
                  <View key={idx} style={styles.timelineRow}>
                    <Text style={styles.timeText} numberOfLines={1}>
                      {formatTime(item.time)}
                    </Text>
                    <View style={styles.dotAndLineCol}>
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              item.type === "symptom"
                                ? "#FF7A00"
                                : item.type === "canon"
                                ? "#C2185B"
                                : "#B0B0B0",
                          },
                        ]}
                      />
                      {idx !== timeline.length - 1 && (
                        <View style={styles.verticalLine} />
                      )}
                    </View>
                    <View style={styles.iconCol}>{ICONS[item.type]}</View>
                    <View style={styles.eventCol}>
                      {item.type === "symptom" ? (
                        <Text
                          style={[
                            styles.eventTitle,
                            { color: "#FF7A00", fontWeight: "bold" },
                          ]}
                        >
                          {item.title}
                          {!!item.intensity && (
                            <Text
                              style={{ color: "#FF7A00", fontWeight: "bold" }}
                            >
                              {" "}
                              ({item.intensity}/5)
                            </Text>
                          )}
                        </Text>
                      ) : item.type === "canon" ? (
                        <Text
                          style={[
                            styles.eventTitle,
                            { color: "#C2185B", fontWeight: "bold" },
                          ]}
                        >
                          {item.title}
                          {!!item.intensity && (
                            <Text
                              style={{ color: "#C2185B", fontWeight: "bold" }}
                            >
                              {" "}
                              ({item.intensity}/5)
                            </Text>
                          )}
                        </Text>
                      ) : item.type === "food" && item.photo_url ? (
                        <Pressable
                          onPress={() => {
                            setModalImageUri(item.photo_url);
                            setImageModalVisible(true);
                          }}
                        >
                          <Text
                            style={[
                              styles.eventTitle,
                              {
                                textDecorationLine: "underline",
                                color: "#22372B",
                              },
                            ]}
                          >
                            {item.title}
                          </Text>
                        </Pressable>
                      ) : item.type === "product" && item.photo_url ? (
                        <Pressable
                          onPress={() => {
                            setModalImageUri(item.photo_url);
                            setImageModalVisible(true);
                          }}
                        >
                          <Text
                            style={[
                              styles.eventTitle,
                              {
                                textDecorationLine: "underline",
                                color: "#1E88E5",
                              },
                            ]}
                          >
                            {item.title}
                            {item.category ? (
                              <Text style={{ color: "#888", fontSize: 14 }}>
                                {" "}
                                ({item.category})
                              </Text>
                            ) : null}
                          </Text>
                        </Pressable>
                      ) : item.type === "product" ? (
                        <Text style={[styles.eventTitle, { color: "#1E88E5" }]}>
                          {item.title}
                          {item.category ? (
                            <Text style={{ color: "#888", fontSize: 14 }}>
                              {" "}
                              ({item.category})
                            </Text>
                          ) : null}
                        </Text>
                      ) : (
                        <Text style={styles.eventTitle}>{item.title}</Text>
                      )}
                      {!!item.details && (
                        <Text
                          style={styles.eventDetails}
                          numberOfLines={3}
                          ellipsizeMode="tail"
                        >
                          {item.details}
                        </Text>
                      )}
                      {isToday &&
                        ((item.type === "food" ||
                          item.type === "product") &&
                          !hasAfterEffectForFoodName(item.type, item.title) &&
                          ((item.type === "food" &&
                            new Date() - new Date(item.time) > 60 * 60 * 1000) ||
                            (item.type === "product" &&
                              new Date() - new Date(item.time) >
                                30 * 60 * 1000))) && (
                          <View
                            style={{
                              backgroundColor: "#F5F5F5",
                              borderRadius: 12,
                              padding: 8,
                              marginTop: 8,
                              marginBottom: 4,
                              alignSelf: "stretch",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#22372B",
                                marginBottom: 4,
                                marginRight: 0,
                              }}
                            >
                              {item.type === "canon"
                                ? "Is this event still affecting you?"
                                : "How did you feel after?"}
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "flex-start",
                              }}
                            >
                              {item.type === "canon" ? (
                                <>
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "yes",
                                        item.title
                                      );
                                    }}
                                    style={{
                                      borderColor: "#275B44",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#275B44",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Yes
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "no",
                                        item.title
                                      );
                                      await closeCanonEvent(item.id);
                                      if (user) {
                                        const updatedCanon =
                                          await getCanonEventsForDay(
                                            user.id,
                                            dateObj
                                          );
                                        setCanonEvents(updatedCanon || []);
                                      }
                                    }}
                                    style={{
                                      borderColor: "#d56c3e",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#d56c3e",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      No
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "not_sure",
                                        item.title
                                      );
                                    }}
                                    style={{
                                      borderColor: "#888",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#888",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Not sure
                                    </Text>
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "fine",
                                        item.title
                                      )
                                    }
                                    style={{
                                      borderColor: "#275B44",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#275B44",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Fine
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "worse",
                                        item.title
                                      )
                                    }
                                    style={{
                                      borderColor: "#d56c3e",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#d56c3e",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Worse
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "not_sure",
                                        item.title
                                      )
                                    }
                                    style={{
                                      borderColor: "#888",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#888",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Not sure
                                    </Text>
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>
                        )}
                      {isToday &&
                        item.type === "canon" &&
                        !item.closed_time &&
                        ((getLastCanonAfterEffectResponse(item.id) === null ||
                          getLastCanonAfterEffectResponse(item.id) === 'yes' ||
                          getLastCanonAfterEffectResponse(item.id) === 'not_sure') &&
                          new Date() - new Date(item.time) > 30 * 60 * 1000) && (
                          <View
                            style={{
                              backgroundColor: "#F5F5F5",
                              borderRadius: 12,
                              padding: 8,
                              marginTop: 8,
                              marginBottom: 4,
                              alignSelf: "stretch",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#22372B",
                                marginBottom: 4,
                                marginRight: 0,
                              }}
                            >
                              {item.type === "canon"
                                ? "Is this event still affecting you?"
                                : "How did you feel after?"}
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "flex-start",
                              }}
                            >
                              {item.type === "canon" ? (
                                <>
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "yes",
                                        item.title
                                      );
                                    }}
                                    style={{
                                      borderColor: "#275B44",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#275B44",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Yes
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "no",
                                        item.title
                                      );
                                      await closeCanonEvent(item.id);
                                      if (user) {
                                        const updatedCanon =
                                          await getCanonEventsForDay(
                                            user.id,
                                            dateObj
                                          );
                                        setCanonEvents(updatedCanon || []);
                                      }
                                    }}
                                    style={{
                                      borderColor: "#d56c3e",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#d56c3e",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      No
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={async () => {
                                      await handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "not_sure",
                                        item.title
                                      );
                                    }}
                                    style={{
                                      borderColor: "#888",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#888",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Not sure
                                    </Text>
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "fine",
                                        item.title
                                      )
                                    }
                                    style={{
                                      borderColor: "#275B44",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#275B44",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Fine
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "worse",
                                        item.title
                                      )
                                    }
                                    style={{
                                      borderColor: "#d56c3e",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                      marginRight: 4,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#d56c3e",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Worse
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAfterEffect(
                                        item.type,
                                        item.id,
                                        "not_sure",
                                        item.title
                                      )
                                    }
                                    style={{
                                      borderColor: "#888",
                                      borderWidth: 1,
                                      borderRadius: 12,
                                      paddingVertical: 2,
                                      paddingHorizontal: 8,
                                      backgroundColor: "#fff",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#888",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Not sure
                                    </Text>
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>
                        )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Food Logged: {mealsLogged}</Text>
            <Text style={styles.summaryText}> | </Text>
            <Text style={styles.summaryText}>
              Symptoms Logged: {symptomsLogged}
            </Text>
          </View>
          <View style={styles.reflectionBox}>
            <Text style={styles.reflectionLabel}>
              Day Reflection (optional)
            </Text>
            <TextInput
              style={styles.reflectionInput}
              placeholder="What did you notice today?"
              placeholderTextColor="#B0B0B0"
              value={reflection}
              onChangeText={setReflection}
              onBlur={handleReflectionSave}
              multiline
              numberOfLines={3}
              editable={!reflectionSaving}
              accessibilityLabel="Reflection Input"
              accessible={true}
            />
            {reflectionSaving && (
              <Text style={styles.reflectionSaving}>Saving...</Text>
            )}
          </View>
          <Modal
            visible={imageModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setImageModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setImageModalVisible(false)}
            >
              <View style={styles.modalContent}>
                {modalImageUri && (
                  <Image
                    source={{ uri: modalImageUri }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </Pressable>
          </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#22372B",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 8,
  },
  togglesRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    gap: 16,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#888",
    marginRight: 8,
    fontWeight: "400",
  },
  todayBadge: {
    alignSelf: "center",
    backgroundColor: "#F3F3F3", // light gray, neutral
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 28,
    marginBottom: 8,
    marginTop: 2,
  },
  todayBadgeText: {
    fontSize: 18,
    color: "#22372B", // dark neutral
    fontWeight: "bold",
    letterSpacing: 1,
  },
  timelineContainer: {
    marginTop: 8,
    marginBottom: 18,
    position: "relative",
    paddingLeft: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    minHeight: 36,
  },
  timeText: {
    width: 90,
    fontSize: 18,
    color: "#22372B",
    fontWeight: "500",
    textAlign: "right",
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  dotAndLineCol: {
    width: 32,
    alignItems: "center",
    position: "relative",
    marginRight: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#B0B0B0",
    marginTop: 4,
    marginBottom: 2,
    zIndex: 2,
  },
  verticalLine: {
    position: "absolute",
    top: 16,
    left: 15,
    width: 2,
    height: 36,
    backgroundColor: "#E0E0D1",
    zIndex: 1,
  },
  iconCol: {
    width: 32,
    alignItems: "center",
    position: "relative",
    marginRight: 8,
  },
  eventCol: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#22372B",
    marginBottom: 2,
  },
  eventDetails: {
    fontSize: 16,
    color: "#22372B",
    marginBottom: 2,
    marginLeft: 0,
    marginTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0D1",
    marginVertical: 18,
    width: "100%",
    alignSelf: "center",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 4,
  },
  summaryText: {
    fontSize: 15,
    color: "#22372B",
    fontWeight: "500",
  },
  label: {
    fontSize: 32,
    color: "#22372B",
    textAlign: "center",
    fontFamily: "PlayfairDisplay-BoldItalic",
    fontStyle: "italic",
    marginBottom: 12,
    marginTop: 8,
  },
  smallSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginLeft: 2, // optional, for spacing
  },
  tipBox: {
    backgroundColor: "rgba(255, 228, 236, 0.6)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F8BBD0",
    borderStyle: "dotted",
  },
  tipText: {
    color: "#C2185B",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  weatherStatusSuccess: {
    color: "#388E3C",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  weatherStatusFail: {
    color: "#D32F2F",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  todayDateTransparent: {
    alignSelf: "center",
    backgroundColor: "transparent",
    marginBottom: 2,
    marginTop: -4,
  },
  todayDateText: {
    fontSize: 18,
    color: "#22372B",
    fontStyle: "italic",
    fontWeight: "600",
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  reflectionBox: {
    marginTop: 18,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2, // Android shadow
  },
  reflectionLabel: {
    fontSize: 16,
    color: "#22372B",
    fontWeight: "bold",
    marginBottom: 6,
  },
  reflectionInput: {
    borderBottomWidth: 1,
    borderColor: "#D6D6C2",
    borderRadius: 0,
    padding: 0,
    fontSize: 16,
    color: "#22372B",
    backgroundColor: "transparent",
    minHeight: 36,
    textAlignVertical: "top",
  },
  reflectionSaving: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    maxWidth: "90%",
    maxHeight: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImage: {
    width: 280,
    height: 220,
    borderRadius: 12,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "500",
    marginTop: 4,
    opacity: 0.85,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FF7A00",
    padding: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22372B",
    marginBottom: 8,
  },
});
