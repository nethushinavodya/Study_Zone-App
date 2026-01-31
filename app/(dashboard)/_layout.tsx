import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs, useRouter, useSegments } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddQuestionModal from "../../components/ui/AddQuestionModal";
import { postQuestion } from "../../service/questions";

const ACTIVE_COLOR = "#16A34A";

export default function DashboardLayout() {
  const [showAddModal, setShowAddModal] = useState(false);
  const segments = useSegments() as string[];
  const showFab = segments.includes("qna");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // place FAB higher inside the page, above the tab bar
  const fabBottom = (insets.bottom || 16) + 88;

  const handleSubmit = async (payload: {
    question: string;
    image?: string;
  }) => {
    try {
      await postQuestion(payload.question, payload.image);
      setShowAddModal(false);
      router.push(`/qna`);
    } catch (err) {

      console.error("Failed to save question", err);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACTIVE_COLOR,
          tabBarStyle: { backgroundColor: "#ffffff" },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="papers"
          options={{
            title: "Papers",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="menu-book" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="qna"
          options={{
            title: "Q&A",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      <AddQuestionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleSubmit}
      />

      {showFab ? (
        <>
          <View style={[styles.fabLabel, { bottom: fabBottom + 6 }]}>
            <Text style={styles.fabLabelText}>Ask question</Text>
          </View>
          <Pressable
            style={[styles.fab, { bottom: fabBottom }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    bottom: 78,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACTIVE_COLOR,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
  fabLabel: {
    position: "absolute",
    right: 86,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
  },
  fabLabelText: { color: "#111", fontWeight: "600" },
});
