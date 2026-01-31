import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AddQuestionModal2 from "./AddQuestionModal";

type Props = {
  onSubmit?: (payload: { question: string; image?: string }) => void;
};

export default function AskQuestionButton({ onSubmit }: Props) {
  const [visible, setVisible] = useState(false);

  const handleSubmit = (payload: { question: string; image?: string }) => {
    setVisible(false);
    if (onSubmit) onSubmit(payload);
    else console.log("Question submitted:", payload);
  };

  return (
    <>
      <AddQuestionModal2
        visible={visible}
        onClose={() => setVisible(false)}
        onSubmit={handleSubmit}
      />

      <View style={styles.container} pointerEvents="box-none">
        <Pressable style={styles.fab} onPress={() => setVisible(true)}>
          <MaterialIcons name="add-circle-outline" size={28} color="#fff" />
          <Text style={styles.fabText}>Ask</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    bottom: 24,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  fabText: { color: "#fff", marginLeft: 8, fontWeight: "600" },
});
