import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth } from "@/service/firebase";
import { signInAnonymously } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";

let ImagePicker: any = null;
if (Platform.OS !== "web") {
  // lazy-require expo-image-picker on native so web bundle doesn't include it
  // user must have expo-image-picker installed for native builds
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ImagePicker = require("expo-image-picker");
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    question: string;
    image?: string;
  }) => void | Promise<any>;
};

export default function AddQuestionModal({
  visible,
  onClose,
  onSubmit,
}: Props) {
  const [question, setQuestion] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const authorLabel = user ? 'You' : 'Anonymous';

  const pickImageWeb = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {};
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) setImageUri(result);
    };
    reader.readAsDataURL(file);
  };

  const takePhotoNative = async () => {
    if (!ImagePicker) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      const uri = (result as any).uri ?? (result as any).assets?.[0]?.uri;
      if (uri) setImageUri(uri);
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = () => {
    if (!question.trim() || loading) return;
    const doSubmit = async () => {
      try {
        setLoading(true);
        // ensure there's an authenticated user (anonymous if needed) so the question is associated
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (e) {
            // ignore; proceeding without auth may still work in your backend but prefer anon
            console.warn('Anonymous sign-in failed', e);
          }
        }
        console.log('Submitting question payload', { question: question.trim(), image: imageUri });
        const result = onSubmit({ question: question.trim(), image: imageUri });
        // await whether onSubmit returns a promise or plain value
        await Promise.resolve(result);
        setQuestion("");
        setImageUri(undefined);
        onClose();
      } finally {
        setLoading(false);
      }
    };
    void doSubmit();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Ask a Question</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color="#333" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <MaterialIcons name="person" size={18} color="#16A34A" />
            )}
            <Text style={{ marginLeft: 8, fontWeight: '600', color: '#065f46' }}>{authorLabel}</Text>
          </View>

          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Platform.OS === 'web' ? (
                <>
                  <input
                    id="add-photo-input"
                    style={{ display: 'none' }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={pickImageWeb}
                  />
                  <label htmlFor="add-photo-input" style={{ marginRight: 10, cursor: 'pointer' }}>
                    <View style={styles.iconBtn as any}>
                      <MaterialIcons name="camera-alt" size={20} color="#16A34A" />
                    </View>
                  </label>
                </>
              ) : (
                <Pressable style={{ marginRight: 10 }} onPress={takePhotoNative}>
                  <View style={styles.iconBtn as any}>
                    <MaterialIcons name="camera-alt" size={20} color="#16A34A" />
                  </View>
                </Pressable>
              )}

              <TextInput
                placeholder="Type your question here..."
                value={question}
                onChangeText={setQuestion}
                style={{  flex: 1,
                  height: 44,
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                  textAlignVertical: 'center',
                  textAlign: 'left', }}
                multiline
              />
            </View>
          </View>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : null}

          <View style={styles.row}>
            <Pressable
              style={[
                styles.submitBtn,
                { opacity: question.trim() && !loading ? 1 : 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={!question.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Ask</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 760,
    minHeight: 320,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "600" },
  closeBtn: { padding: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 14,
    marginTop: 12,
    minHeight: 44,
    textAlignVertical: "top",
  },
  preview: { width: "100%", height: 180, marginTop: 12, borderRadius: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    alignItems: "center",
  },
  iconsContainer: { flexDirection: "row", alignItems: "center" },
  iconSpacing: { marginRight: 8 },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#16A34A",
    borderRadius: 8,
  },
  submitText: { color: "#fff", fontWeight: "600" },
  avatar: { width: 32, height: 32, borderRadius: 16 },
});
