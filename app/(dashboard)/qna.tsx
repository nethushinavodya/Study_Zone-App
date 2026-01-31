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
  fetchAnswersOnce,
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
  const [likedMap, setLikedMap] = React.useState<Record<string, boolean>>({});
  // keep a ref to the current posts so we can merge replies when questions update
  const postsRef = React.useRef<any[]>([]);
  const updatePosts = (nextOrUpdater: any) => {
    setPosts((prev) => {
      const next = typeof nextOrUpdater === "function" ? nextOrUpdater(prev) : nextOrUpdater;
      postsRef.current = next;
      return next;
    });
  };

  const answersRef = React.useRef<Record<string, () => void>>({});
  // keep replies separately so they never get lost when questions re-sync
  const repliesRefMap = React.useRef<Record<string, any[]>>({});

  useEffect(() => {
    const unsub = listenQuestions((items) => {
      // merge any existing replies from local state so transient updates (likes) don't remove replies
      const merged = items.map((it: any) => {
        const stored = repliesRefMap.current[it.id];
        const prev = postsRef.current.find((p) => p.id === it.id);
        return { ...it, replies: stored ?? prev?.replies ?? it.replies ?? [] };
      });
      updatePosts(merged);
       // attach answer listeners for each item
       items.forEach((it: any) => {
         if (answersRef.current[it.id]) return;
         const unsubAns = listenAnswers(it.id, (answers) => {
          // persist answers in repliesRefMap first
          console.debug('[listenAnswers] got', answers?.length, 'answers for', it.id);
           repliesRefMap.current[it.id] = answers;
           updatePosts((prev: any[]) =>
             prev.map((p) => (p.id === it.id ? { ...p, replies: answers } : p)),
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
    if (likedMap[id]) return; // already liked locally
    // optimistic update
    setLikedMap((s) => ({ ...s, [id]: true }));
    updatePosts((prev: any[]) => prev.map((p) => (p.id === id ? { ...p, likes: (p.likes || 0) + 1 } : p)));
    try {
      await likeQuestion(id);
    } catch (e) {
      // rollback on error
      setLikedMap((s) => ({ ...s, [id]: false }));
      updatePosts((prev: any[]) => prev.map((p) => (p.id === id ? { ...p, likes: Math.max(0, (p.likes || 1) - 1) } : p)));
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
                <View />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPress={() => like(item.id)}
                    className="mr-3"
                    disabled={!!likedMap[item.id]}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
                  >
                    {likedMap[item.id] ? (
                      // liked: filled green thumb
                      <MaterialIcons name="thumb-up" size={20} color="#16A34A" />
                    ) : (
                      // not liked: outlined green thumb
                      <MaterialIcons name="thumb-up-off-alt" size={20} color="#16A34A" />
                    )}
                    <Text style={{ color: '#16A34A', marginLeft: 8, fontWeight: '600' }}>{item.likes || 0}</Text>
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
              {Array.isArray(item.replies) && item.replies.length ? (
                <View className="mt-3">
                  {(() => {
                    // normalize replies array and sort by createdAt (oldest first)
                    const storedReplies = repliesRefMap.current[item.id];
                    const repliesRaw = storedReplies ?? (item.replies || []);
                    const getTime = (t: any) => {
                      if (!t) return 0;
                      if (typeof t === 'number') return t;
                      if (t.toDate) return t.toDate().getTime();
                      const parsed = Date.parse(String(t));
                      return Number.isNaN(parsed) ? 0 : parsed;
                    };
                    const replies = repliesRaw.slice().sort((a: any, b: any) => getTime(a.createdAt) - getTime(b.createdAt));
                    const isExpanded = !!expandedIds[item.id];
                    const shown = isExpanded ? replies : replies.slice(0, 2);

                    return (
                      <>
                        {shown.map((r: any) => (
                          <View key={String(r.id)} className="bg-green-50 p-3 rounded-lg mb-2">
                            {r.imageUrl || r.image || r.imageBase64 || r.dataUrl ? (
                              <Image
                                source={{ uri: r.imageUrl || r.image || r.imageBase64 || r.dataUrl }}
                                style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 8 }}
                              />
                            ) : null}
                            {r.text ? (
                              <Text className="text-sm text-gray-800">{r.text}</Text>
                            ) : null}
                          </View>
                        ))}

                        {replies.length > 2 ? (
                          <Pressable onPress={async () => {
                            const willExpand = !expandedIds[item.id];
                            console.debug('[ShowMore] clicked', item.id, 'willExpand=', willExpand);
                            // expand immediately so UI shows the intent
                            setExpandedIds((s) => ({ ...s, [item.id]: willExpand }));
                            if (willExpand) {
                              try {
                                const all = await fetchAnswersOnce(item.id);
                                console.debug('[fetchAnswersOnce] got', all?.length, 'answers for', item.id);
                                repliesRefMap.current[item.id] = all;
                                updatePosts((prev: any[]) => prev.map((p) => p.id === item.id ? { ...p, replies: all } : p));
                              } catch (err) {
                                console.warn('fetchAnswersOnce failed', err);
                              }
                            }
                          }}>
                            <Text className="text-green-600">
                              {isExpanded ? 'Show less' : `Show more (${replies.length - 2})`}
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
                  {/* Reply input: bordered container with inline camera icon */}
                  <View style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    {/* camera on the left */}
                    {Platform.OS === 'web' ? (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          style={{ display: 'none' }}
                          id={`reply-file-inline-${item.id}`}
                          onChange={(e: any) => pickReplyImageWeb(e)}
                        />
                        <label htmlFor={`reply-file-inline-${item.id}`} style={{ marginRight: 10, cursor: 'pointer' }}>
                          <MaterialIcons name="camera-alt" size={22} color="#16A34A" />
                        </label>
                      </>
                    ) : (
                      <Pressable onPress={takeReplyPhotoNative} style={{ marginRight: 10 }}>
                        <MaterialIcons name="camera-alt" size={22} color="#16A34A" />
                      </Pressable>
                    )}

                    <TextInput
                      placeholder="Write a reply"
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline={false}
                      style={{
                        flex: 1,
                        height: 40, // fixed height to ensure vertical centering
                        paddingVertical: 0,
                        paddingHorizontal: 0,
                        textAlignVertical: 'center',
                        textAlign: 'left',
                      }}
                    />
                  </View>

                  {replyImage ? (
                    <Image
                      source={{ uri: replyImage }}
                      style={{
                        width: '100%',
                        height: 140,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    />
                  ) : null}

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
