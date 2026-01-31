import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider } from "@/context/LoaderContext";
import { Slot } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";

// App.tsx ->
const RootLayout = () => {
  const insets = useSafeAreaInsets();

  console.log(insets);

  return (
    // <SafeAreaView className="flex-1">
    <LoaderProvider>
      <AuthProvider>
        <View style={{ marginTop: insets.top, flex: 1 }}>
          <Slot />
        </View>
      </AuthProvider>
      <Toast />
    </LoaderProvider>
    // </SafeAreaView>
  );
};

export default RootLayout;
