import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Welcome = () => {
  const router = useRouter();

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
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;
