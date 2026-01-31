import { useLoader } from "@/hooks/useLoader";
import { loginUser } from "@/service/authService";
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
} from "react-native";

import LoadingDots from "@/components/ui/loading-dots";
import { auth } from "@/service/firebase";
import { FontAwesome } from "@expo/vector-icons";
import {
  AuthRequestPromptOptions,
  AuthSessionRedirectUriOptions,
  makeRedirectUri,
} from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import Toast from "react-native-toast-message";

const Login = () => {
  const router = useRouter();
  const { showLoader, hideLoader, isLoading, loadingMessage } = useLoader();
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  type ExtendedAuthRequestPromptOptions = AuthRequestPromptOptions & {
    useProxy?: boolean;
  };
  const handleLogin = async () => {
    if (!email || !password || isLoading) {
      Toast.show({ type: "info", text1: "Please enter email and password" });
      return;
    }
    showLoader("Logging in...");
    try {
      await loginUser(email.trim(), password);
      router.replace("/(dashboard)/home");
    } catch (error) {
      console.log(error);
      const code = (error as any)?.code;
      let message = "Please check your credentials and try again.";
      if (code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (code === "auth/user-not-found") {
        message = "No account found with this email.";
      } else if (code === "auth/wrong-password") {
        message = "Incorrect password.";
      }
      Toast.show({ type: "error", text1: "Login failed", text2: message });
    } finally {
      hideLoader();
    }
  };

  WebBrowser.maybeCompleteAuthSession();

  const clientId =
    "348651320035-l3h3h6j4je5g1ukbkgf73100prqrjjru.apps.googleusercontent.com";
  const PROXY_REDIRECT_URI = "https://auth.expo.io/@nethushi/study-zone";
  const redirectUri = __DEV__
    ? PROXY_REDIRECT_URI
    : makeRedirectUri({
        useProxy: true,
        projectNameForProxy: "nethushi/study-zone",
      } as AuthSessionRedirectUriOptions);

  console.log("Google redirectUri:", redirectUri);

  const iosClientId = "";
  const androidClientId = "";

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    redirectUri,
  });

  React.useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success") {
        const idToken = (response.params as any).id_token;
        if (idToken) {
          showLoader("Signing in with Google...");
          try {
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
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
  }, [response]);

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
                Login here
              </Text>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back you've
              </Text>
              <Text className="text-2xl font-bold text-gray-900">
                been missed!
              </Text>
            </View>

            {/* Email Input */}
            <View className="mb-8">
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
                style={{
                  borderColor: focusedField === "email" ? "#16A34A" : "#D1D5DB",
                }}
              />
            </View>

            {/* Password Input */}
            <View className="mb-8">
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
                  style={{
                    borderColor:
                      focusedField === "password" ? "#16A34A" : "#D1D5DB",
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 p-1"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  <FontAwesome
                    name={showPassword ? "eye-slash" : "eye"}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <View className="flex-row justify-end mb-10">
              <TouchableOpacity>
                <Text className="text-green-600 font-semibold text-sm">
                  Forgot your password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <Pressable
              className="bg-green-600 py-6 rounded-2xl active:bg-green-700 mb-8 shadow-lg"
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              style={{ opacity: isLoading || !email || !password ? 0.6 : 1 }}
            >
              <View className="flex-row items-center justify-center">
                {isLoading && <LoadingDots size={8} />}
                <Text className="text-white text-lg font-bold text-center">
                  {isLoading ? (loadingMessage ?? "Signing in...") : "Sign in"}
                </Text>
              </View>
            </Pressable>

            {/* Create Account */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              className="items-center mb-8"
            >
              <Text className="text-blue-800 text-base font-semibold">
                Create new account
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
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
