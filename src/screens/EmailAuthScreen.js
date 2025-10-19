import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../supabaseClient";
import { Feather } from "@expo/vector-icons";
import { useFonts } from 'expo-font';

export default function EmailAuthScreen({ navigation, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    "PlayfairDisplay-Bold": require("../../assets/fonts/PlayfairDisplay-Bold.ttf"),
  });

  const handleAuth = async () => {
    setLoading(true);
    setError("");
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) {
          setError(error.message);
        } else {
          Alert.alert(
            "Sign up successful! Please check your email to confirm your account."
          );
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signIn({
          email,
          password,
        });
        setLoading(false);
        if (error) {
          setError(error.message);
        } else if (!data || !data.user) {
          setError("Unknown error occurred. Please try again.");
        } else {
          onAuth && onAuth(data.user);
          navigation.goBack && navigation.goBack();
        }
      }
    } catch (err) {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Please enter your email address first.");
      return;
    }
    try {
      const { data, error } = await supabase.auth.api.resetPasswordForEmail(email);
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Password reset email sent!", "Check your inbox for instructions to reset your password.");
      }
    } catch (err) {
      Alert.alert("Network error. Please try again.");
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.outerContainer}>
        {/* Logo and tagline */}
        <Image
          source={require("../../assets/images/thrivelog-long-logo.png")}
          style={{ width: 320, height: 96, resizeMode: "contain", marginBottom: 12 }}
        />
        <Text style={styles.tagline}>Your body&apos;s data, decoded.</Text>

        {/* Email input */}
        <View style={styles.inputWrapper}>
          <Feather name="mail" size={20} color="#22372B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#b0b0b0"
          />
        </View>

        {/* Password input */}
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={20} color="#22372B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#b0b0b0"
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeIcon}
            hitSlop={10}
          >
            <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#22372B" />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.link}>
            {isSignUp
              ? "Already have an account? "
              : "Don't have an account? "}
            <Text style={styles.linkAction}>
              {isSignUp ? "Sign In" : "Sign Up"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5EBE4",
    padding: 24,
  },
  tagline: {
    fontSize: 20,
    color: '#275B44',
    marginBottom: 30,
    marginTop: -20,
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 18,
    paddingHorizontal: 12,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: "#22372B",
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  inputIcon: {
    marginRight: 8,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  forgot: {
    color: "#22372B",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
    fontSize: 15,
    textDecorationLine: "underline",
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#275b44',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    shadowColor: '#275b44',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  link: {
    color: "#22372B",
    marginTop: 18,
    textAlign: "center",
    fontSize: 15,
  },
  linkAction: {
    color: "#d56c3e",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  error: { color: "red", marginBottom: 12, textAlign: "center" },
});
