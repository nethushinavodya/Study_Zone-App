import { useLoader } from "@/hooks/useLoader";
import { registerUser, signInWithGoogle } from "@/service/authService";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";

import LoadingDots from "@/components/ui/loading-dots";
import * as WebBrowser from "expo-web-browser";
import {AuthRequestPromptOptions, AuthSessionRedirectUriOptions, makeRedirectUri} from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from '@/hooks/useAuth';
import * as SecureStore from 'expo-secure-store';
import Toast from "react-native-toast-message";
import {FontAwesome, MaterialIcons} from "@expo/vector-icons";

const Register = () => {
  type ExtendedAuthRequestPromptOptions = AuthRequestPromptOptions & {
    useProxy?: boolean;
  };
  const router = useRouter();
  const { enableBiometrics, disableBiometrics } = useAuth();
  const [useBiometrics, setUseBiometrics] = React.useState<boolean>(false);

  const [name, setName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    React.useState<boolean>(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const { showLoader, hideLoader, isLoading } = useLoader();

  WebBrowser.maybeCompleteAuthSession();

  // Google OAuth (Expo proxy) - replace clientId with your Web OAuth client ID
  const clientId =
    "348651320035-l3h3h6j4je5g1ukbkgf73100prqrjjru.apps.googleusercontent.com";
  const PROXY_REDIRECT_URI = "https://auth.expo.io/@nethushi/study-zone";
  const redirectUri = __DEV__
    ? PROXY_REDIRECT_URI
    : makeRedirectUri({
        useProxy: true,
        projectNameForProxy: "nethushi/study-zone",
      } as AuthSessionRedirectUriOptions);
  console.log("Register Google redirectUri:", redirectUri);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    redirectUri,
  });

  React.useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success") {
        const idToken = (response.params as any).id_token;
        if (idToken) {
          showLoader("Signing in with Google...");
          try {
            await signInWithGoogle(idToken);
            router.replace("/(dashboard)/home");
          } catch (err) {
            console.log("Google sign-in error:", err);
            const code = (err as any)?.code || (err as any)?.message || "";
            Toast.show({
              type: "error",
              text1: "Google sign-in failed",
              text2: String(code),
            });
          } finally {
            hideLoader();
          }
        }
      }
    };
    handleGoogleResponse();
  }, [response, showLoader, hideLoader, router]);

  const onToggleBiometrics = async (val: boolean) => {
    if (val) {
      try {
        const ok = await enableBiometrics();
        if (ok) {
          setUseBiometrics(true);
          Toast.show({ type: 'success', text1: 'Biometrics ready', text2: 'Biometric unlock will be enabled after you register.' });
        } else {
          setUseBiometrics(false);
          Toast.show({ type: 'error', text1: 'Biometrics not available', text2: 'Device does not support biometrics or none are enrolled.' });
        }
      } catch (e) {
        setUseBiometrics(false);
        Toast.show({ type: 'error', text1: 'Biometrics error' });
      }
    } else {
      try {
        await disableBiometrics();
      } catch (e) {
        // ignore
      }
      setUseBiometrics(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || isLoading) {
      Toast.show({ type: "info", text1: "Please fill all fields" });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    showLoader("Creating account...");
    try {
      await registerUser(name.trim(), email.trim(), password);
      Toast.show({ type: "success", text1: "Registration Successful" });

      // If user chose biometric during registration, ensure it's enabled and store credentials
      if (useBiometrics) {
        try {
          const enabled = await enableBiometrics();
          if (enabled) {
            try {
              await SecureStore.setItemAsync(
                'biometric_credentials',
                JSON.stringify({ email: email.trim(), password }),
              );
              Toast.show({ type: 'success', text1: 'Biometrics enabled', text2: 'You can now unlock the app with your fingerprint' });
            } catch (e) {
              console.log('Failed to store biometric credentials', e);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      router.replace("/(auth)/login");
    } catch (error) {
      console.log(error);
      const code = (error as any)?.code;
      let message = "Please try again.";
      if (code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (code === "auth/email-already-in-use") {
        message = "Email already in use.";
      } else if (code === "auth/weak-password") {
        message = "Password is too weak. Use at least 6 characters.";
      }
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: message,
      });
    } finally {
      hideLoader();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-green-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
          <View className="flex-1 px-10 py-20 justify-center">
            {/* Back Button */}
            <View className="mb-8 absolute top-8 left-6">
              <TouchableOpacity
                onPress={() => router.push("/(auth)/welcome")}
                className="flex-row items-center"
                accessibilityLabel="Go back"
              >
                <FontAwesome name="arrow-left" size={22} color="#16A34A" />
              </TouchableOpacity>
            </View>

            {/* Header Section */}
            <View className="items-center mb-16">
              <Image
                source={require("@/assets/images/icon.png")}
                style={{ width: 170, height: 140 }}
              />
              <Text className="text-6xl font-bold text-green-600 mb-8">
                Register here
              </Text>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                Join us today
              </Text>
              <Text className="text-2xl font-bold text-gray-900">
                and start learning!
              </Text>

              {/* Biometric opt-in (during registration) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <MaterialIcons name="fingerprint" size={22} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>
                    Use Fingerprint
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    Unlock app with biometrics instead of typing password
                  </Text>
                </View>
                <Switch value={useBiometrics} onValueChange={onToggleBiometrics} />
              </View>
            </View>

            {/* Name Input */}
            <View className="mb-6">
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#999999"
                className="bg-gray-50 text-gray-900 px-6 py-5 rounded-2xl text-base border-2"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                editable={!isLoading}
                autoCapitalize="words"
                style={{
                  borderColor: focusedField === "name" ? "#16A34A" : "#D1D5DB",
                }}
              />
            </View>

            {/* Email Input */}
            <View className="mb-6">
              <TextInput
                placeholder="Email"
                placeholderTextColor="#999999"
                className="bg-gray-50 text-gray-900 px-6 py-5 rounded-2xl text-base border-2"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                editable={!isLoading}
                style={{
                  borderColor: focusedField === "email" ? "#16A34A" : "#D1D5DB",
                }}
              />
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <View className="relative">
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999999"
                  className="bg-gray-50 text-gray-900 px-6 py-5 rounded-2xl text-base border-2"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  editable={!isLoading}
                  style={{
                    borderColor:
                      focusedField === "password" ? "#16A34A" : "#D1D5DB",
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 p-1"
                >
                  <FontAwesome
                    name={showPassword ? "eye-slash" : "eye"}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-8">
              <View className="relative">
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#999999"
                  className="bg-gray-50 text-gray-900 px-6 py-5 rounded-2xl text-base border-2"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  editable={!isLoading}
                  style={{
                    borderColor:
                      focusedField === "confirmPassword"
                        ? "#16A34A"
                        : "#D1D5DB",
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-4 p-1"
                >
                  <FontAwesome
                    name={showConfirmPassword ? "eye-slash" : "eye"}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              className="bg-green-600 py-6 rounded-2xl active:bg-green-700 mb-8 shadow-lg"
              onPress={handleRegister}
              disabled={
                isLoading || !name || !email || !password || !confirmPassword
              }
              style={{
                opacity:
                  isLoading || !name || !email || !password || !confirmPassword
                    ? 0.6
                    : 1,
              }}
            >
              <View className="flex-row items-center justify-center">
                {isLoading && <LoadingDots size={8} />}
                <Text className="text-white text-lg font-bold text-center">
                  {isLoading ? "Creating account..." : "Create account"}
                </Text>
              </View>
            </Pressable>

            {/* Already have account */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              className="items-center mb-8"
            >
              <Text className="text-blue-800 text-base font-semibold">
                Already have an account? Login
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-8">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-600 text-sm">
                Or continue with
              </Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Social Login Buttons (icons) */}
            <View className="flex-row justify-center gap-6">
              <Pressable
                onPress={async () => {
                  if (!request) {
                    Toast.show({
                      type: "info",
                      text1: "Google sign-in not configured",
                      text2: "Set your Web client ID in the code.",
                    });
                    return;
                  }
                  try {
                    await promptAsync({
                      useProxy: true,
                    } as ExtendedAuthRequestPromptOptions);
                  } catch (err) {
                    console.log(err);
                    Toast.show({
                      type: "error",
                      text1: "Unable to start Google sign-in",
                    });
                  }
                }}
                className="w-12 h-12 rounded-full bg-white items-center justify-center shadow"
                accessibilityLabel="Continue with Google"
              >
                <FontAwesome name="google" size={22} color="#DB4437" />
              </Pressable>

              <Pressable
                onPress={() => {
                  /* handle Facebook login */
                }}
                className="w-12 h-12 rounded-full bg-white items-center justify-center shadow"
                accessibilityLabel="Continue with Facebook"
              >
                <FontAwesome name="facebook" size={22} color="#1877F2" />
              </Pressable>
            </View>

            {/* Footer */}
            <View className="mt-8 items-center">
              <Text className="text-xs text-gray-400">
                © 2024 Study Zone. All rights reserved.
              </Text>
            </View>

            {isLoading && (
              <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/30">
                <View className="bg-white p-6 rounded-2xl shadow-lg">
                  <LoadingDots size={12} />
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
