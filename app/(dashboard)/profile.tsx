import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { FlatList, Text, View } from "react-native";

export default function Profile() {
  const [bookmarks, setBookmarks] = React.useState<string[]>([]);
  const [downloads, setDownloads] = React.useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const b = await AsyncStorage.getItem("bookmarkedPapers");
      const d = await AsyncStorage.getItem("downloadedPapers");
      if (b) setBookmarks(JSON.parse(b));
      if (d) setDownloads(JSON.parse(d));
    })();
  }, []);

  return (
    <View className="flex-1 px-6 py-8 bg-green-50">
      <Text className="text-3xl font-bold text-green-600 mb-6">Profile</Text>
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        Bookmarked Papers
      </Text>
      <FlatList
        data={bookmarks}
        renderItem={({ item }) => (
          <Text className="bg-white p-3 rounded-2xl mb-2">{item}</Text>
        )}
        keyExtractor={(i) => i}
        ListEmptyComponent={<Text className="text-gray-500">No bookmarks</Text>}
      />

      <Text className="text-lg font-semibold text-gray-900 mt-6 mb-2">
        Downloads
      </Text>
      <FlatList
        data={downloads}
        renderItem={({ item }) => (
          <Text className="bg-white p-3 rounded-2xl mb-2">{item}</Text>
        )}
        keyExtractor={(i) => i}
        ListEmptyComponent={<Text className="text-gray-500">No downloads</Text>}
      />
    </View>
  );
}
