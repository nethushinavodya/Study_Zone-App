import { useLoader } from "@/hooks/useLoader";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AddQuestionModal from "../../components/ui/AddQuestionModal";
import {
  listenAnswers,
  listenQuestions,
  postAnswer,
  postQuestion,
} from "../../service/questions";

const Home = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [questions, setQuestions] = useState<Array<any>>([]);
  const { showLoader, hideLoader } = useLoader();
  const answersRef = useRef<Record<string, any>>({});
  const [answersState, setAnswersState] = useState<Record<string, any[]>>({});
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  useEffect(() => {
    let first = true;
    showLoader("Loading data");
    const unsub = listenQuestions((items) => {
      setQuestions(items);
      if (first) {
        hideLoader();
        first = false;
      }
    });
    return () => {
      try {
        unsub();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const toggleAnswers = (questionId: string) => {
    if (answersRef.current[questionId]) {
      answersRef.current[questionId]();
      delete answersRef.current[questionId];
      setAnswersState((s) => {
        const next = { ...s };
        delete next[questionId];
        return next;
      });
    } else {
      const unsub = listenAnswers(questionId, (items) =>
        setAnswersState((s) => ({ ...s, [questionId]: items })),
      );
      answersRef.current[questionId] = unsub;
    }
  };

  const handleSubmitQuestion = async (payload: {
    question: string;
    image?: string;
  }) => {
    await postQuestion(payload.question, payload.image);
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const txt = answerText[questionId]?.trim();
    if (!txt) return;
    await postAnswer(questionId, txt);
    setAnswerText((s) => ({ ...s, [questionId]: "" }));
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.askBtn} onPress={() => setModalOpen(true)}>
        <Text style={styles.askText}>Ask a Question</Text>
      </Pressable>

      <FlatList
        data={questions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.qText}>{item.text}</Text>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.qImage} />
            ) : null}

            <Pressable
              onPress={() => toggleAnswers(item.id)}
              style={styles.showAnswersBtn}
            >
              <Text style={styles.showAnswersText}>
                {answersState[item.id] ? "Hide Answers" : "Show Answers"}
              </Text>
            </Pressable>

            {answersState[item.id]
              ? answersState[item.id].map((a) => (
                  <View key={a.id} style={styles.answerRow}>
                    <Text style={styles.answerText}>{a.text}</Text>
                  </View>
                ))
              : null}

            <View style={styles.answerInputRow}>
              <TextInput
                value={answerText[item.id] ?? ""}
                onChangeText={(t) =>
                  setAnswerText((s) => ({ ...s, [item.id]: t }))
                }
                placeholder="Write an answer..."
                style={styles.answerInput}
              />
              <Pressable
                onPress={() => handleSubmitAnswer(item.id)}
                style={styles.answerBtn}
              >
                <Text style={styles.answerBtnText}>Send</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <AddQuestionModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitQuestion}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  askBtn: {
    padding: 12,
    backgroundColor: "#06b6d4",
    borderRadius: 8,
    marginBottom: 12,
  },
  askText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  card: {
    marginBottom: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  qText: { fontSize: 16, marginBottom: 8 },
  qImage: { width: "100%", height: 180, borderRadius: 8, marginBottom: 8 },
  showAnswersBtn: { marginBottom: 8 },
  showAnswersText: { color: "#2563eb" },
  answerRow: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#eee" },
  answerText: { color: "#374151" },
  answerInputRow: { flexDirection: "row", marginTop: 8, alignItems: "center" },
  answerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
  },
  answerBtn: {
    marginLeft: 8,
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  answerBtnText: { color: "#fff", fontWeight: "600" },
});

export default Home;
