import React, { useEffect } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  likeQuestion,
  listenQuestions,
  listenAnswers,
  postAnswer,
} from "../../service/questions";

let ImagePicker: any = null;
if (Platform.OS !== "web") {
  // lazy require
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ImagePicker = require("expo-image-picker");
}

export default function QnA() {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [replyingId, setReplyingId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [replyImage, setReplyImage] = React.useState<string | undefined>(
    undefined,
  );
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>(
    {},
  );

  const answersRef = React.useRef<Record<string, () => void>>({});

  useEffect(() => {
    const unsub = listenQuestions((items) => {
      setPosts(items);
      // attach answer listeners for each item
      items.forEach((it: any) => {
        if (answersRef.current[it.id]) return;
        const unsubAns = listenAnswers(it.id, (answers) => {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === it.id ? { ...p, replies: answers } : p,
            ),
          );
        });
        answersRef.current[it.id] = unsubAns;
      });
    });
    return () => {
      try {
        unsub();
      } catch (e) {
        // ignore
      }
      Object.values(answersRef.current).forEach((u) => {
        try {
          u();
        } catch (e) {
          // ignore
        }
      });
    };
  }, []);

  // reload handled by focus effect and explicit loadPosts calls

  const like = async (id: string) => {
    try {
      await likeQuestion(id);
    } catch (e) {
      // ignore
    }
  };

  const submitReply = async (postId: string) => {
    if (!replyText.trim() && !replyImage) return;
    try {
      await postAnswer(postId, replyText.trim(), replyImage);
    } catch (e) {
      // ignore
    }
    setReplyingId(null);
    setReplyText("");
    setReplyImage(undefined);
  };

  const pickReplyImageWeb = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {};
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) setReplyImage(result);
    };
    reader.readAsDataURL(file);
  };

  const pickReplyImageNative = async () => {
    if (!ImagePicker) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.7,
        base64: false,
      });
      // support both legacy result and new `assets` shape
      const uri = (result as any).uri ?? (result as any).assets?.[0]?.uri;
      if (uri) setReplyImage(uri);
    } catch (err) {
      // ignore
    }
  };

  const takeReplyPhotoNative = async () => {
    if (!ImagePicker) return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      const uri = (result as any).uri ?? (result as any).assets?.[0]?.uri;
      if (uri) setReplyImage(uri);
    } catch (err) {
      // ignore
    }
  };

  return (
    <View className="flex-1 px-6 py-8 bg-green-50">
      <Text className="text-3xl font-bold text-green-600 mb-6">Q&amp;A</Text>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={
          <Text className="text-gray-600">No questions yet. Tap + to ask.</Text>
        }
        renderItem={({ item }) => {
          const imgUri =
            item.imageUrl ||
            item.image ||
            item.imageBase64 ||
            item.dataUrl ||
            null;
          return (
            <View className="bg-white rounded-2xl p-4 mb-4">
              {imgUri ? (
                <Image
                  source={{ uri: imgUri }}
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                />
              ) : null}
              <Text className="text-base text-gray-900 mb-2">{item.text}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-500">
                  {item.likes || 0} likes
                </Text>
                <View className="flex-row items-center">
                  <Pressable onPress={() => like(item.id)} className="mr-3">
                    <Text className="text-green-600 font-semibold">Like</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setReplyingId(replyingId === item.id ? null : item.id)
                    }
                  >
                    <Text className="text-gray-600">Reply</Text>
                  </Pressable>
                </View>
              </View>

              {/* Replies list (show only first 2 unless expanded) */}
              {item.replies && item.replies.length ? (
                <View className="mt-3">
                  {(() => {
                    const replies = item.replies || [];
                    const isExpanded = !!expandedIds[item.id];
                    const shown = isExpanded ? replies : replies.slice(0, 2);
                    return (
                      <>
                        {shown.map((r: any) => (
                          <View
                            key={r.id}
                            className="bg-green-50 p-3 rounded-lg mb-2"
                          >
                            {(() => {
                              const replyImg =
                                r.imageUrl ||
                                r.image ||
                                r.imageBase64 ||
                                r.dataUrl ||
                                null;
                              return replyImg ? (
                                <Image
                                  source={{ uri: replyImg }}
                                  style={{
                                    width: "100%",
                                    height: 140,
                                    borderRadius: 8,
                                    marginBottom: 8,
                                  }}
                                />
                              ) : null;
                            })()}
                            {r.text ? (
                              <Text className="text-sm text-gray-800">
                                {r.text}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                        {replies.length > 2 ? (
                          <Pressable
                            onPress={() =>
                              setExpandedIds((s) => ({
                                ...s,
                                [item.id]: !s[item.id],
                              }))
                            }
                          >
                            <Text className="text-green-600">
                              {expandedIds[item.id]
                                ? "Show less"
                                : `Show more (${replies.length - shown.length})`}
                            </Text>
                          </Pressable>
                        ) : null}
                      </>
                    );
                  })()}
                </View>
              ) : null}

              {replyingId === item.id ? (
                <View className="mt-2">
                  <TextInput
                    placeholder="Write a reply"
                    value={replyText}
                    onChangeText={setReplyText}
                    className="bg-white p-3 rounded-2xl mb-2"
                  />

                  {replyImage ? (
                    <Image
                      source={{ uri: replyImage }}
                      style={{
                        width: "100%",
                        height: 140,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    />
                  ) : null}

                  <View className="flex-row items-center mb-2">
                    {Platform.OS === "web" ? (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          style={{ display: "none" }}
                          id={`reply-file-${item.id}`}
                          onChange={(e: any) => pickReplyImageWeb(e)}
                        />
                        <label htmlFor={`reply-file-${item.id}`} className="mr-3">
                          <MaterialIcons name="camera-alt" size={22} color="#16A34A" />
                        </label>
                      </>
                    ) : (
                      <>
                        <Pressable onPress={takeReplyPhotoNative} className="mr-3">
                          <MaterialIcons name="camera-alt" size={22} color="#16A34A" />
                        </Pressable>
                        <Pressable onPress={pickReplyImageNative} className="mr-3">
                          <Text className="text-green-600">Add photo</Text>
                        </Pressable>
                      </>
                    )}
                  </View>

                  <View className="flex-row">
                    <Pressable
                      onPress={() => submitReply(item.id)}
                      className="bg-green-600 px-4 py-2 rounded-2xl mr-3"
                    >
                      <Text className="text-white">Submit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setReplyingId(null);
                        setReplyText("");
                        setReplyImage(undefined);
                      }}
                      className="bg-gray-200 px-4 py-2 rounded-2xl"
                    >
                      <Text>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}
