import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(dashboard)/home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
};

export default Index;
