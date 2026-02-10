import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider } from "@/context/LoaderContext";
import { Slot } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";
import { useAuth } from '@/hooks/useAuth';
import LockScreen from '@/components/LockScreen';

// App.tsx ->
const RootLayoutInner = () => {
  const insets = useSafeAreaInsets();
  const { locked } = useAuth();

  return (
    <View style={{ marginTop: insets.top, flex: 1 }}>
      <Slot />
      {locked ? <LockScreen /> : null}
    </View>
  );
};

const RootLayout = () => {
  return (
    // <SafeAreaView className="flex-1">
    <LoaderProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
      <Toast />
    </LoaderProvider>
    // </SafeAreaView>
  );
};

export default RootLayout;
