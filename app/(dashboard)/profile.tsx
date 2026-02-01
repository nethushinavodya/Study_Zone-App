import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { FlatList, Text, View, Pressable, ScrollView, Linking, Modal, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { Paper } from "../../service/paperService";
import { getUserBookmarks, removeBookmark as removeBookmarkFromDb } from "../../service/bookmarkService";
import { logoutUser, deleteAccount } from "../../service/authService";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = React.useState<Paper[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = React.useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState(false);

  const loadBookmarks = async () => {
    if (!refreshing) setLoading(true);
    try {
      const userBookmarks = await getUserBookmarks();
      console.log("Loaded bookmarks:", userBookmarks);
      setBookmarks(userBookmarks);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadBookmarks();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadBookmarks();
    }, [])
  );

  useEffect(() => {
    loadBookmarks();
  }, []);

  const removeBookmark = async (paperId: string) => {
    try {
      await removeBookmarkFromDb(paperId);
      setBookmarks(bookmarks.filter((p) => p.id !== paperId));
      Toast.show({
        type: "success",
        text1: "Bookmark Removed",
        text2: "Paper removed from your bookmarks",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove bookmark",
      });
    }
  };

  const openPaper = (url: string) => {
    Linking.openURL(url);
  };

  const handleLogout = () => {
    setSettingsVisible(false);
    setLogoutConfirmVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutConfirmVisible(false);
    try {
      await logoutUser();
      Toast.show({
        type: "success",
        text1: "Logged Out",
        text2: "You have been logged out successfully",
      });
      router.replace("/(auth)/welcome");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: "Failed to logout. Please try again.",
      });
    }
  };

  const handleDeleteAccount = () => {
    setSettingsVisible(false);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteConfirmVisible(false);
    try {
      await deleteAccount();
      Toast.show({
        type: "success",
        text1: "Account Deleted",
        text2: "Your account has been permanently deleted",
      });
      router.replace("/(auth)/welcome");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: "Failed to delete account. Please try again.",
      });
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-green-50"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#16A34A']}
          tintColor="#16A34A"
        />
      }
    >
      <View className="px-6 py-8">
        {/* Header with Settings Icon */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#16A34A' }}>
            👤 Profile
          </Text>
          <Pressable
            onPress={() => setSettingsVisible(true)}
            style={{
              backgroundColor: '#FFFFFF',
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <MaterialIcons name="settings" size={24} color="#16A34A" />
          </Pressable>
        </View>

        {/* User Info Card */}
        <View className="bg-white rounded-2xl p-5 mb-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="person" size={32} color="#16A34A" />
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
                {user?.displayName || user?.email?.split('@')[0] || 'Student'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="email" size={16} color="#6B7280" />
                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 6 }} numberOfLines={1}>
                  {user?.email || 'Not available'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#16A34A' }}>
                {bookmarks.length}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Bookmarks
              </Text>
            </View>
          </View>
        </View>

        {/* Bookmarked Papers Section */}
        <View className="mb-4">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialIcons name="bookmark" size={24} color="#16A34A" />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginLeft: 8 }}>
              Bookmarked Papers
            </Text>
          </View>

          {loading && !refreshing ? (
            <View className="bg-white rounded-2xl p-8" style={{ alignItems: 'center' }}>
              <MaterialIcons name="hourglass-empty" size={48} color="#16A34A" />
              <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 12, textAlign: 'center' }}>
                Loading bookmarks...
              </Text>
            </View>
          ) : bookmarks.length === 0 ? (
            <View className="bg-white rounded-2xl p-8" style={{ alignItems: 'center' }}>
              <MaterialIcons name="bookmark-border" size={48} color="#D1D5DB" />
              <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 12, textAlign: 'center' }}>
                No bookmarked papers yet
              </Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                Bookmark papers to access them quickly
              </Text>
            </View>
          ) : (
            <FlatList
              data={bookmarks}
              keyExtractor={(item, index) => item?.id || `bookmark-${index}`}
              renderItem={({ item: paper }) => {
                if (!paper || !paper.id) return null;

                return (
                <View className="bg-white rounded-2xl p-4 mb-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
                  {/* Paper Title */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>
                        {paper.title}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeBookmark(paper.id)} style={{ padding: 4 }}>
                      <MaterialIcons name="bookmark" size={24} color="#16A34A" />
                    </Pressable>
                  </View>

                  {/* Paper Details */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                    {paper.grade && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 6 }}>
                        <MaterialIcons name="school" size={14} color="#6B7280" />
                        <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>
                          {paper.grade}
                        </Text>
                      </View>
                    )}
                    {paper.subject && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 6 }}>
                        <MaterialIcons name="menu-book" size={14} color="#6B7280" />
                        <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>
                          {paper.subject}
                        </Text>
                      </View>
                    )}
                    {paper.medium && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 6 }}>
                        <MaterialIcons name="language" size={14} color="#6B7280" />
                        <Text style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>
                          {paper.medium}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Button */}
                  <Pressable
                    onPress={() => openPaper(paper.url)}
                    style={{
                      backgroundColor: '#16A34A',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MaterialIcons name="visibility" size={18} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 6, fontSize: 14 }}>
                      View Paper
                    </Text>
                  </Pressable>
                </View>
                );
              }}
              scrollEnabled={false}
            />
          )}
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setSettingsVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: 40,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#1F2937' }}>
                ⚙️ Settings
              </Text>
              <Pressable
                onPress={() => setSettingsVisible(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Settings Options */}
            <View style={{ gap: 12 }}>
              {/* Logout Option */}
              <Pressable
                onPress={handleLogout}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#DCFCE7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <MaterialIcons name="logout" size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}>
                    Logout
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    Sign out of your account
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
              </Pressable>

              {/* Delete Account Option */}
              <Pressable
                onPress={handleDeleteAccount}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF2F2',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#FEE2E2',
                }}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#FEE2E2',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <MaterialIcons name="delete-forever" size={22} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#DC2626', marginBottom: 2 }}>
                    Delete Account
                  </Text>
                  <Text style={{ fontSize: 13, color: '#991B1B' }}>
                    Permanently delete your account
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#FCA5A5" />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutConfirmVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '85%', maxWidth: 400 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#DCFCE7',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <MaterialIcons name="logout" size={30} color="#16A34A" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 }}>
                Logout
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                Are you sure you want to logout?
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setLogoutConfirmVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563' }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmLogout}
                style={{
                  flex: 1,
                  backgroundColor: '#16A34A',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                  Logout
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '85%', maxWidth: 400 }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FEE2E2',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <MaterialIcons name="delete-forever" size={30} color="#DC2626" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#DC2626', marginBottom: 8 }}>
                Delete Account
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                Are you sure you want to delete your account? This action cannot be undone and will delete all your data.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setDeleteConfirmVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563' }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteAccount}
                style={{
                  flex: 1,
                  backgroundColor: '#DC2626',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
