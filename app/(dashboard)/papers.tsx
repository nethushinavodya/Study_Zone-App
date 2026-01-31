import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { FlatList, Image, Linking, Pressable, Text, View } from "react-native";

const SAMPLE_PAPERS = [
  {
    id: "1",
    title: "Math Paper - 2023 (Official)",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: "2",
    title: "Physics Paper - Teacher-made",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
];

export default function Papers() {
  const [bookmarks, setBookmarks] = React.useState<string[]>([]);

  React.useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("bookmarkedPapers");
      if (raw) setBookmarks(JSON.parse(raw));
    })();
  }, []);

  const toggleBookmark = async (id: string) => {
    const next = bookmarks.includes(id)
      ? bookmarks.filter((b) => b !== id)
      : [...bookmarks, id];
    setBookmarks(next);
    await AsyncStorage.setItem("bookmarkedPapers", JSON.stringify(next));
  };

  const openPaper = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 px-6 py-8 bg-green-50">
      <Text className="text-3xl font-bold text-green-600 mb-6">Papers</Text>
      <FlatList
        data={SAMPLE_PAPERS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-4 flex-row items-center">
            <Image
              source={require("../../assets/images/icon.png")}
              style={{ width: 48, height: 40, marginRight: 12 }}
            />
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {item.title}
              </Text>
              <View className="flex-row mt-3">
                <Pressable
                  onPress={() => openPaper(item.url)}
                  className="bg-green-600 px-3 py-2 rounded-full mr-3"
                >
                  <Text className="text-white">Preview</Text>
                </Pressable>
                <Pressable
                  onPress={() => toggleBookmark(item.id)}
                  className="bg-white px-3 py-2 rounded-full border"
                >
                  <FontAwesome
                    name={
                      bookmarks.includes(item.id) ? "bookmark" : "bookmark-o"
                    }
                    size={16}
                    color="#16A34A"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}
