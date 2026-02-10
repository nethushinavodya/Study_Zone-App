import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Image, Pressable, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';
import * as SecureStore from 'expo-secure-store';
import { useLoader } from "@/hooks/useLoader";
import { loginUser } from '@/service/authService';
import { MaterialIcons } from '@expo/vector-icons';

const Welcome = () => {
  const router = useRouter();
  const { user, requireBiometric, promptBiometrics } = useAuth();
  const { showLoader, hideLoader, isLoading } = useLoader();
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const [storedCreds, setStoredCreds] = useState<{email:string; password:string} | null>(null);
  const autoTriedRef = useRef(false);

  useEffect(() => {
    (async () => {
      // read stored biometric credentials (if set during registration)
      try {
        const v = await SecureStore.getItemAsync('biometric_credentials');
        if (v) {
          const parsed = JSON.parse(v);
          if (parsed?.email && parsed?.password) {
            setHasBiometricCredentials(true);
            setStoredCreds(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to read biometric credentials on Welcome', err);
      }

      // If there's already an authenticated user and biometrics are required, prompt briefly
      if (requireBiometric && user && !isLoading) {
        Toast.show({ type: 'info', text1: 'Quick Unlock available', text2: 'Use your fingerprint / FaceID to unlock the app' });
        try {
          await promptBiometrics();
        } catch (e) {
          console.error('promptBiometrics error on welcome', e);
        }
      }
    })();
  }, [requireBiometric, user]);

  const biometricUnlock = useCallback(async () => {
    if (!hasBiometricCredentials || !storedCreds) return;
    try {
      const ok = await promptBiometrics();
      if (!ok) {
        Toast.show({ type: 'info', text1: 'Authentication cancelled' });
        return;
      }
      showLoader('Unlocking...');
      try {
        await loginUser(storedCreds.email, storedCreds.password);
        router.replace('/(dashboard)/home');
      } catch (err) {
        console.error('Welcome biometric login failed', err);
        Toast.show({ type: 'error', text1: 'Login failed', text2: 'Biometric login failed. Please sign in with email and password.' });
      } finally {
        hideLoader();
      }
    } catch (e) {
      console.error('biometricUnlock error', e);
      Toast.show({ type: 'error', text1: 'Biometrics', text2: 'Biometric authentication failed.' });
    }
  }, [hasBiometricCredentials, storedCreds, promptBiometrics, showLoader, hideLoader, router]);

  // Auto-attempt biometric unlock once (if enabled and credentials stored)
  useEffect(() => {
    if (isLoading) return; // don't auto-attempt while loading
    if (requireBiometric && hasBiometricCredentials && storedCreds && !autoTriedRef.current) {
      autoTriedRef.current = true;
      setTimeout(() => {
        biometricUnlock();
      }, 250);
    }
  }, [requireBiometric, hasBiometricCredentials, storedCreds, biometricUnlock, isLoading]);

  return (
    <SafeAreaView className="flex-1 bg-green-50">
      <View className="flex-1 px-8 py-6 justify-between">
        {/* Illustration Section (student illustration) */}
        <View className="flex-1 justify-center items-center">
          <Image
            source={require("@/assets/images/welcome.png")}
            style={{ width: 500, height: 500 }}
            resizeMode="contain"
          />
        </View>

        {/* Content Section */}
        <View className="mb-12">
          <View className="items-center mb-5">
            <Text className="text-6xl font-bold text-green-600 text-center leading-tight">
              Discover Your
            </Text>
            <Text className="text-6xl font-bold text-gray-900 text-center leading-tight mt-1">
              Study Zone here
            </Text>

            <Text className="text-gray-500 text-center mt-6 px-4 leading-6 font-medium">
              Explore all the existing resources based on your interest and
              study major
            </Text>
          </View>

          {/* Action Area - Matches screenshot layout: [Login Button] [Register Text] */}
          <View className="flex-row items-center justify-between px-2 mt-4">
            <Pressable
              className="bg-green-600 py-4 rounded-xl shadow-md active:bg-green-700 flex-1 mr-4"
              onPress={() => {
                router.push("/(auth)/login");
              }}
            >
              <Text className="text-white text-lg font-bold text-center">
                Login
              </Text>
            </Pressable>

            <Pressable
              className="py-4 flex-1 ml-4 bg-gray-300 rounded-xl shadow-md active:bg-gray-400"
              onPress={() => {
                router.push("/(auth)/register");
              }}
            >
              <Text className="text-gray-900 text-lg font-bold text-center">
                Register
              </Text>
            </Pressable>
          </View>

          {/* Fingerprint CTA (visible when biometrics enabled and creds stored) */}
          {requireBiometric && hasBiometricCredentials && !isLoading ? (
            <View style={{ alignItems: 'center', marginTop: 18 }}>
              <TouchableOpacity onPress={biometricUnlock} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}>
                <MaterialIcons name="fingerprint" size={32} color="#16A34A" />
              </TouchableOpacity>
              <Text style={{ marginTop: 8, color: '#6B7280' }}>Unlock with fingerprint</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;
