import React, { useEffect } from "react";
import { FlatList, Text, View, Pressable, ScrollView, Linking, Modal, RefreshControl, Switch, TextInput, StyleSheet } from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Paper, Textbook } from "@/service/paperService";
import { getUserBookmarks, removeBookmark as removeBookmarkFromDb, getUserTextbookBookmarks, removeTextbookBookmark } from "@/service/bookmarkService";
import { logoutUser, deleteAccount, loginUser } from "@/service/authService";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as SecureStore from 'expo-secure-store';

export default function Profile() {
  const { user, enableBiometrics, disableBiometrics, requireBiometric } = useAuth();
  const [passwordPromptVisible, setPasswordPromptVisible] = React.useState(false);
  const [biometricPassword, setBiometricPassword] = React.useState('');
  const [savingBiometric, setSavingBiometric] = React.useState(false);
  const router = useRouter();
  const [bookmarks, setBookmarks] = React.useState<Paper[]>([]);
  const [textbookBookmarks, setTextbookBookmarks] = React.useState<Textbook[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = React.useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = React.useState(false);

  const loadBookmarks = React.useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const userBookmarks = await getUserBookmarks();
      const userTextbookBookmarks = await getUserTextbookBookmarks();
      console.log("Loaded bookmarks:", userBookmarks);
      console.log("Loaded textbook bookmarks:", userTextbookBookmarks);
      setBookmarks(userBookmarks);
      setTextbookBookmarks(userTextbookBookmarks);
    } catch (err) {
      console.error("Error loading bookmarks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadBookmarks();
  }, [loadBookmarks]);

  useFocusEffect(
      React.useCallback(() => {
        loadBookmarks();
      }, [loadBookmarks])
  );

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const removeBookmark = async (paperId: string) => {
    try {
      await removeBookmarkFromDb(paperId);
      setBookmarks(bookmarks.filter((p) => p.id !== paperId));
      Toast.show({
        type: "success",
        text1: "Bookmark Removed",
        text2: "Paper removed from your bookmarks",
      });
    } catch (err) {
      console.error('removeBookmark error', err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to remove bookmark",
      });
    }
  };

  const removeTextbookBookmarkHandler = async (textbookId: string) => {
    try {
      await removeTextbookBookmark(textbookId);
      setTextbookBookmarks(textbookBookmarks.filter((t) => t.id !== textbookId));
      Toast.show({
        type: "success",
        text1: "Bookmark Removed",
        text2: "Textbook removed from your bookmarks",
      });
    } catch (err) {
      console.error('removeTextbookBookmarkHandler error', err);
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
    } catch (err) {
      console.error('confirmLogout error', err);
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
    } catch (err) {
      console.error('confirmDeleteAccount error', err);
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: "Failed to delete account. Please try again.",
      });
    }
  };

  return (
      <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#16A34A']}
                tintColor="#16A34A"
            />
          }
      >
        <View style={styles.mainContent}>
          {/* Header with Settings Icon */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              👤 Profile
            </Text>
            <Pressable
                onPress={() => setSettingsVisible(true)}
                style={styles.settingsButton}
            >
              <MaterialIcons name="settings" size={24} color="#16A34A" />
            </Pressable>
          </View>

          {/* User Info Card */}
          <View style={styles.userInfoCard}>
            <View style={styles.userInfoHeader}>
              <View style={styles.avatarContainer}>
                <MaterialIcons name="person" size={32} color="#16A34A" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user?.displayName || user?.email?.split('@')[0] || 'Student'}
                </Text>
                <View style={styles.emailContainer}>
                  <MaterialIcons name="email" size={16} color="#6B7280" />
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user?.email || 'Not available'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {bookmarks.length}
                </Text>
                <Text style={styles.statLabel}>
                  Papers
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#2563EB' }]}>
                  {textbookBookmarks.length}
                </Text>
                <Text style={styles.statLabel}>
                  Textbooks
                </Text>
              </View>
            </View>
          </View>

          {/* Bookmarked Papers Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="bookmark" size={24} color="#16A34A" />
              <Text style={styles.sectionTitle}>
                Bookmarked Papers
              </Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                  <MaterialIcons name="hourglass-empty" size={48} color="#16A34A" />
                  <Text style={styles.loadingText}>
                    Loading bookmarks...
                  </Text>
                </View>
            ) : bookmarks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="bookmark-border" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>
                    No bookmarked papers yet
                  </Text>
                  <Text style={styles.emptySubtext}>
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
                          <View style={styles.paperCard}>
                            {/* Paper Title */}
                            <View style={styles.paperHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.paperTitle}>
                                  {paper.title}
                                </Text>
                              </View>
                              <Pressable onPress={() => removeBookmark(paper.id)} style={styles.paperBookmarkBtn}>
                                <MaterialIcons name="bookmark" size={24} color="#16A34A" />
                              </Pressable>
                            </View>

                            {/* Paper Details */}
                            <View style={styles.paperDetails}>
                              {paper.grade && (
                                  <View style={styles.paperDetailItem}>
                                    <MaterialIcons name="school" size={14} color="#6B7280" />
                                    <Text style={styles.paperDetailText}>
                                      {paper.grade}
                                    </Text>
                                  </View>
                              )}
                              {paper.subject && (
                                  <View style={styles.paperDetailItem}>
                                    <MaterialIcons name="menu-book" size={14} color="#6B7280" />
                                    <Text style={styles.paperDetailText}>
                                      {paper.subject}
                                    </Text>
                                  </View>
                              )}
                              {paper.medium && (
                                  <View style={styles.paperDetailItem}>
                                    <MaterialIcons name="language" size={14} color="#6B7280" />
                                    <Text style={styles.paperDetailText}>
                                      {paper.medium}
                                    </Text>
                                  </View>
                              )}
                            </View>

                            {/* Action Button */}
                            <Pressable
                                onPress={() => openPaper(paper.url)}
                                style={styles.viewPaperBtn}
                            >
                              <MaterialIcons name="visibility" size={18} color="#FFFFFF" />
                              <Text style={styles.viewPaperBtnText}>
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

          {/* Bookmarked Textbooks Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="book" size={24} color="#2563EB" />
              <Text style={styles.sectionTitle}>
                Bookmarked Textbooks
              </Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                  <MaterialIcons name="hourglass-empty" size={48} color="#2563EB" />
                  <Text style={styles.loadingText}>
                    Loading textbooks...
                  </Text>
                </View>
            ) : textbookBookmarks.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="book" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>
                    No bookmarked textbooks yet
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Bookmark textbooks to access them quickly
                  </Text>
                </View>
            ) : (
                <View style={styles.textbooksGrid}>
                  {textbookBookmarks.map((textbook) => {
                    if (!textbook || !textbook.id) return null;

                    const cardColor = textbook.coverColor || '#4CAF50';
                    const isSinhala = textbook.medium?.toLowerCase() === 'sinhala';
                    const isEnglish = textbook.medium?.toLowerCase() === 'english';

                    return (
                        <View key={textbook.id} style={[styles.textbookGridCard, { backgroundColor: cardColor }]}>
                          {/* Medium Badge */}
                          {(isSinhala || isEnglish) && (
                              <View style={styles.mediumBadgeContainer}>
                                <View style={[
                                  styles.mediumBadge,
                                  isSinhala ? styles.sinhalaBadge : styles.englishBadge
                                ]}>
                                  <Text style={styles.mediumBadgeText}>
                                    {isSinhala ? '📗 සිංහල' : '📘 English'}
                                  </Text>
                                </View>
                              </View>
                          )}

                          {/* Cover */}
                          <View style={styles.textbookCover}>
                            <FontAwesome name="book" size={36} color="#ffffff" style={{ opacity: 0.9 }} />
                          </View>

                          {/* Info */}
                          <View style={styles.textbookInfo}>
                            <Text style={styles.textbookSubjectLabel} numberOfLines={2}>
                              {textbook.title}
                            </Text>
                            <View style={styles.textbookMetadata}>
                              <View style={styles.textbookGradeBadge}>
                                <Text style={styles.textbookGradeBadgeText}>Grade {textbook.grade}</Text>
                              </View>
                            </View>
                            {textbook.description && (
                                <Text style={styles.textbookDescription} numberOfLines={2}>
                                  {textbook.description}
                                </Text>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.textbookActions}>
                              <Pressable
                                  style={styles.previewBtn}
                                  onPress={() => textbook.url && Linking.openURL(textbook.url)}
                              >
                                <FontAwesome name="eye" size={12} color="#ffffff" />
                                <Text style={styles.previewBtnText}>Preview</Text>
                              </Pressable>
                              <Pressable
                                  style={styles.bookmarkBtn}
                                  onPress={() => removeTextbookBookmarkHandler(textbook.id)}
                              >
                                <FontAwesome
                                    name="bookmark"
                                    size={12}
                                    color="#ffffff"
                                />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                    );
                  })}
                </View>
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
              style={styles.modalOverlay}
              onPress={() => setSettingsVisible(false)}
          >
            <Pressable
                onPress={(e) => e.stopPropagation()}
                style={styles.settingsModal}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  ⚙️ Settings
                </Text>
                <Pressable
                    onPress={() => setSettingsVisible(false)}
                    style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>

              {/* Settings Options */}
              <View style={styles.settingsOptions}>
                {/* Biometric Toggle Option */}
                <View style={styles.settingsOption}>
                  <View style={styles.settingsOptionIcon}>
                    <MaterialIcons name="fingerprint" size={22} color="#F59E0B" />
                  </View>
                  <View style={styles.settingsOptionContent}>
                    <Text style={styles.settingsOptionTitle}>
                      Use Fingerprint
                    </Text>
                    <Text style={styles.settingsOptionSubtitle}>
                      Unlock app with biometrics instead of logging in every time
                    </Text>
                  </View>
                  <Switch
                      value={requireBiometric}
                      onValueChange={async (val) => {
                        if (val) {
                          const ok = await enableBiometrics();
                          if (!ok) {
                            Toast.show({ type: 'error', text1: 'Biometrics', text2: 'Your device does not support biometrics or none are enrolled.' });
                            return;
                          }

                          // If credentials aren't stored yet, ask the user for their password so we can save them securely
                          try {
                            const existing = await SecureStore.getItemAsync('biometric_credentials');
                            if (!existing && user?.email) {
                              // prompt user to enter password to save securely
                              setPasswordPromptVisible(true);
                            } else {
                              Toast.show({ type: 'success', text1: 'Biometrics enabled', text2: 'You can unlock with fingerprint from the Welcome/Login screen.' });
                            }
                          } catch (e) {
                            console.error('Error checking biometric credentials', e);
                          }
                        } else {
                          await disableBiometrics();
                          Toast.show({ type: 'success', text1: 'Biometrics disabled' });
                        }
                      }}
                  />
                </View>

                {/* Logout Option */}
                <Pressable
                    onPress={handleLogout}
                    style={styles.settingsOption}
                >
                  <View style={styles.settingsOptionIconGreen}>
                    <MaterialIcons name="logout" size={22} color="#16A34A" />
                  </View>
                  <View style={styles.settingsOptionContent}>
                    <Text style={styles.settingsOptionTitle}>
                      Logout
                    </Text>
                    <Text style={styles.settingsOptionSubtitle}>
                      Sign out of your account
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                </Pressable>

                {/* Delete Account Option */}
                <Pressable
                    onPress={handleDeleteAccount}
                    style={styles.settingsOptionDanger}
                >
                  <View style={styles.settingsOptionIconRed}>
                    <MaterialIcons name="delete-forever" size={22} color="#DC2626" />
                  </View>
                  <View style={styles.settingsOptionContent}>
                    <Text style={styles.settingsOptionTitleDanger}>
                      Delete Account
                    </Text>
                    <Text style={styles.settingsOptionSubtitleDanger}>
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
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModal}>
              <View style={styles.confirmModalContent}>
                <View style={styles.confirmModalIcon}>
                  <MaterialIcons name="logout" size={30} color="#16A34A" />
                </View>
                <Text style={styles.confirmModalTitle}>
                  Logout
                </Text>
                <Text style={styles.confirmModalMessage}>
                  Are you sure you want to logout?
                </Text>
              </View>

              <View style={styles.confirmModalButtons}>
                <Pressable
                    onPress={() => setLogoutConfirmVisible(false)}
                    style={styles.confirmCancelBtn}
                >
                  <Text style={styles.confirmCancelBtnText}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                    onPress={confirmLogout}
                    style={styles.confirmConfirmBtn}
                >
                  <Text style={styles.confirmConfirmBtnText}>
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
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModal}>
              <View style={styles.confirmModalContent}>
                <View style={styles.confirmModalIconDanger}>
                  <MaterialIcons name="delete-forever" size={30} color="#DC2626" />
                </View>
                <Text style={styles.confirmModalTitleDanger}>
                  Delete Account
                </Text>
                <Text style={styles.confirmModalMessageDanger}>
                  Are you sure you want to delete your account? This action cannot be undone and will delete all your data.
                </Text>
              </View>

              <View style={styles.confirmModalButtons}>
                <Pressable
                    onPress={() => setDeleteConfirmVisible(false)}
                    style={styles.confirmCancelBtn}
                >
                  <Text style={styles.confirmCancelBtnText}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                    onPress={confirmDeleteAccount}
                    style={styles.confirmDeleteBtn}
                >
                  <Text style={styles.confirmConfirmBtnText}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Password prompt modal to save biometric credentials */}
        <Modal visible={passwordPromptVisible} transparent animationType="slide" onRequestClose={() => setPasswordPromptVisible(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setPasswordPromptVisible(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Enable Biometric Login</Text>
              <Text style={{ color: '#6b7280', marginBottom: 12 }}>Enter your account password to securely save it for future fingerprint sign-in.</Text>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={biometricPassword}
                onChangeText={setBiometricPassword}
                style={{ borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginBottom: 12 }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => setPasswordPromptVisible(false)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', color: '#374151' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (!user?.email) {
                      Toast.show({ type: 'error', text1: 'No email', text2: 'Unable to store credentials: missing email.' });
                      return;
                    }
                    if (!biometricPassword) {
                      Toast.show({ type: 'info', text1: 'Enter password', text2: 'Please enter your account password to enable biometric login.' });
                      return;
                    }
                    setSavingBiometric(true);
                    try {
                      // verify credentials by attempting login (this helps avoid storing wrong pw)
                      await loginUser(user.email, biometricPassword);
                      await SecureStore.setItemAsync('biometric_credentials', JSON.stringify({ email: user.email, password: biometricPassword }));
                      Toast.show({ type: 'success', text1: 'Biometrics ready', text2: 'You can now unlock the app with fingerprint.' });
                      setPasswordPromptVisible(false);
                      setBiometricPassword('');
                    } catch (err) {
                      console.error('Failed to verify/store biometric credentials', err);
                      Toast.show({ type: 'error', text1: 'Failed to save', text2: 'Password incorrect or unable to store credentials.' });
                    } finally {
                      setSavingBiometric(false);
                    }
                  }}
                  style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#16A34A', alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{savingBiometric ? 'Saving...' : 'Save'}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#16A34A',
  },
  settingsButton: {
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
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  paperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  paperBookmarkBtn: {
    padding: 4,
  },
  paperDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  paperDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
  },
  paperDetailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  viewPaperBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPaperBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  textbooksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  textbookGridCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mediumBadgeContainer: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  mediumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  sinhalaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  englishBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  mediumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1f2937',
  },
  textbookCover: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textbookInfo: {
    padding: 10,
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  textbookSubjectLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    letterSpacing: -0.2,
    minHeight: 36,
    lineHeight: 18,
  },
  textbookMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  textbookGradeBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  textbookGradeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  textbookDescription: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 14,
  },
  textbookActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  previewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.1,
  },
  bookmarkBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsOptions: {
    gap: 12,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingsOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsOptionIconGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsOptionIconRed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsOptionContent: {
    flex: 1,
  },
  settingsOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingsOptionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  settingsOptionTitleDanger: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  settingsOptionSubtitleDanger: {
    fontSize: 13,
    color: '#991B1B',
  },
  settingsOptionDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  confirmModalContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalIconDanger: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  confirmModalTitleDanger: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  confirmModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  confirmModalMessageDanger: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmConfirmBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmConfirmBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
