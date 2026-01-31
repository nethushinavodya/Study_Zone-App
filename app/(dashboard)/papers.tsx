import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { FlatList, Linking, Pressable, Text, View, Platform, Alert, Modal, ScrollView } from "react-native";
import { onSnapshot, collection, query, orderBy, doc, setDoc, deleteDoc, getDocs, where } from "firebase/firestore";
import { db , auth} from "../../service/firebase";
import { Picker } from "@react-native-picker/picker";

export default function Papers() {
  const [papers, setPapers] = React.useState<any[]>([]);
  const [filteredPapers, setFilteredPapers] = React.useState<any[]>([]);
  const [bookmarkedPapers, setBookmarkedPapers] = React.useState<string[]>([]);
  const [sidebarVisible, setSidebarVisible] = React.useState(false);

  // Filter states
  const [filterExamType, setFilterExamType] = React.useState('');
  const [filterGrade, setFilterGrade] = React.useState('');
  const [filterProvince, setFilterProvince] = React.useState('');
  const [filterTerm, setFilterTerm] = React.useState('');
  const [filterSubject, setFilterSubject] = React.useState('');
  const [filterMedium, setFilterMedium] = React.useState('');

  React.useEffect(() => {
    const q = query(collection(db, "papers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const papersData = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setPapers(papersData);
      setFilteredPapers(papersData);
    });
    return () => unsub();
  }, []);

  // Load bookmarks for current user
  React.useEffect(() => {
    const loadBookmarks = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const bookmarksQuery = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(bookmarksQuery);
        const bookmarkIds = snapshot.docs.map(doc => doc.data().paperId);
        setBookmarkedPapers(bookmarkIds);
      } catch (error) {
        console.error("Error loading bookmarks:", error);
      }
    };

    loadBookmarks();
  }, []);

  // Apply filters whenever filter values or papers change
  React.useEffect(() => {
    let filtered = papers;

    if (filterExamType) {
      filtered = filtered.filter(p => p.examType === filterExamType);
    }
    if (filterGrade) {
      filtered = filtered.filter(p => p.grade === filterGrade);
    }
    if (filterProvince) {
      filtered = filtered.filter(p => p.province === filterProvince);
    }
    if (filterTerm) {
      filtered = filtered.filter(p => p.term === filterTerm);
    }
    if (filterSubject) {
      filtered = filtered.filter(p => p.subject === filterSubject);
    }
    if (filterMedium) {
      filtered = filtered.filter(p => p.medium === filterMedium);
    }

    setFilteredPapers(filtered);
  }, [papers, filterExamType, filterGrade, filterProvince, filterTerm, filterSubject, filterMedium]);

  const clearFilters = () => {
    setFilterExamType('');
    setFilterGrade('');
    setFilterProvince('');
    setFilterTerm('');
    setFilterSubject('');
    setFilterMedium('');
  };

  const openPaper = (url: string) => Linking.openURL(url);

  // Toggle bookmark
  const toggleBookmark = async (paperId: string) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not logged in", "Please log in to bookmark papers");
      return;
    }

    try {
      const bookmarkId = `${user.uid}_${paperId}`;
      const bookmarkRef = doc(db, "bookmarks", bookmarkId);

      if (bookmarkedPapers.includes(paperId)) {
        // Remove bookmark
        await deleteDoc(bookmarkRef);
        setBookmarkedPapers(prev => prev.filter(id => id !== paperId));
        Alert.alert("Removed", "Paper removed from bookmarks");
      } else {
        // Add bookmark
        await setDoc(bookmarkRef, {
          userId: user.uid,
          paperId: paperId,
          createdAt: new Date(),
        });
        setBookmarkedPapers(prev => [...prev, paperId]);
        Alert.alert("Bookmarked", "Paper added to bookmarks");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark");
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Header with Filter Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#16A34A' }}>📄 Papers</Text>
        <Pressable
          onPress={() => setSidebarVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#dcfce7',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            gap: 6,
          }}
        >
          <FontAwesome name="filter" size={16} color="#16A34A" />
          <Text style={{ fontSize: 14, color: '#16A34A', fontWeight: '600' }}>Filter</Text>
        </Pressable>
      </View>

      {/* Active Filter Badges */}
      {(filterExamType || filterGrade || filterProvince || filterTerm || filterSubject || filterMedium) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '600' }}>
            Showing {filteredPapers.length} of {papers.length} papers
          </Text>
          {filterExamType && (
            <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600' }}>{filterExamType}</Text>
            </View>
          )}
          {filterGrade && (
            <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600' }}>Grade {filterGrade}</Text>
            </View>
          )}
          {filterSubject && (
            <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600' }}>{filterSubject}</Text>
            </View>
          )}
          {filterMedium && (
            <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600' }}>{filterMedium}</Text>
            </View>
          )}
          {filterProvince && (
            <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600' }}>{filterProvince}</Text>
            </View>
          )}
          {filterTerm && (
            <View style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '600' }}>{filterTerm}</Text>
            </View>
          )}
        </View>
      )}

      {/* Papers List */}
      <FlatList
        data={filteredPapers}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            borderWidth: 1,
            borderColor: '#f0f0f0',
          }}>
            {/* Title with Icon */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                backgroundColor: '#dcfce7',
                padding: 8,
                borderRadius: 10,
                marginRight: 10
              }}>
                <FontAwesome name="file-pdf-o" size={20} color="#16A34A" />
              </View>
              <Text style={{
                flex: 1,
                fontSize: 16,
                fontWeight: '700',
                color: '#1f2937',
                lineHeight: 22,
              }} numberOfLines={2}>
                {item.title}
              </Text>
            </View>

            {/* Metadata badges with better spacing */}
            {(item.examType || item.grade || item.subject || item.province || item.term || item.medium || item.textbook) && (
              <View style={{
                backgroundColor: '#f9fafb',
                padding: 10,
                borderRadius: 10,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}>
                <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                  {item.examType && (
                    <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#1e40af', fontWeight: '600' }}>{item.examType}</Text>
                    </View>
                  )}
                  {item.grade && (
                    <View style={{ backgroundColor: '#e9d5ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#6b21a8', fontWeight: '600' }}>Grade {item.grade}</Text>
                    </View>
                  )}
                  {item.subject && (
                    <View style={{ backgroundColor: '#fce7f3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#9f1239', fontWeight: '600' }}>{item.subject}</Text>
                    </View>
                  )}
                  {item.province && (
                    <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#065f46', fontWeight: '600' }}>{item.province}</Text>
                    </View>
                  )}
                  {item.term && (
                    <View style={{ backgroundColor: '#fed7aa', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#9a3412', fontWeight: '600' }}>{item.term}</Text>
                    </View>
                  )}
                  {item.medium && (
                    <View style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#3730a3', fontWeight: '600' }}>{item.medium}</Text>
                    </View>
                  )}
                  {item.textbook && (
                    <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: '#92400e', fontWeight: '600' }}>📚 {item.textbook}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons with better styling */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => openPaper(item.url)}
                style={{
                  flex: 1,
                  backgroundColor: '#16A34A',
                  paddingVertical: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#16A34A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <FontAwesome name="eye" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Preview</Text>
              </Pressable>
              <Pressable
                onPress={() => toggleBookmark(item.id)}
                style={{
                  backgroundColor: bookmarkedPapers.includes(item.id) ? '#16A34A' : '#ffffff',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: bookmarkedPapers.includes(item.id) ? '#16A34A' : '#e5e7eb',
                  shadowColor: bookmarkedPapers.includes(item.id) ? '#16A34A' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: bookmarkedPapers.includes(item.id) ? 0.3 : 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <FontAwesome
                  name={bookmarkedPapers.includes(item.id) ? "bookmark" : "bookmark-o"}
                  size={20}
                  color={bookmarkedPapers.includes(item.id) ? "#ffffff" : "#16A34A"}
                />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Sidebar Filter Modal */}
      <Modal
        visible={sidebarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setSidebarVisible(false)}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: 40,
              maxHeight: '85%',
              height: '85%'
            }}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb'
            }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937' }}>🔍 Filter Papers</Text>
              <Pressable onPress={() => setSidebarVisible(false)}>
                <FontAwesome name="times" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Grade Filter */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Grade</Text>
                <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', overflow: 'hidden' }}>
                  <Picker
                    selectedValue={filterGrade}
                    onValueChange={(value: string) => setFilterGrade(value)}
                    style={{ height: Platform.OS === 'ios' ? 120 : 50 }}
                  >
                    <Picker.Item label="All Grades" value="" />
                    <Picker.Item label="Grade 6" value="6" />
                    <Picker.Item label="Grade 7" value="7" />
                    <Picker.Item label="Grade 8" value="8" />
                    <Picker.Item label="Grade 9" value="9" />
                    <Picker.Item label="Grade 10" value="10" />
                    <Picker.Item label="Grade 11" value="11" />
                    <Picker.Item label="Grade 12" value="12" />
                    <Picker.Item label="Grade 13" value="13" />
                  </Picker>
                </View>
              </View>

              {/* Subject Filter */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Subject</Text>
                <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', overflow: 'hidden' }}>
                  <Picker
                    selectedValue={filterSubject}
                    onValueChange={(value: string) => setFilterSubject(value)}
                    style={{ height: Platform.OS === 'ios' ? 120 : 50 }}
                  >
                    <Picker.Item label="All Subjects" value="" />
                    <Picker.Item label="Mathematics" value="Mathematics" />
                    <Picker.Item label="Science" value="Science" />
                    <Picker.Item label="Physics" value="Physics" />
                    <Picker.Item label="Chemistry" value="Chemistry" />
                    <Picker.Item label="Biology" value="Biology" />
                    <Picker.Item label="English" value="English" />
                    <Picker.Item label="Sinhala" value="Sinhala" />
                    <Picker.Item label="Tamil" value="Tamil" />
                    <Picker.Item label="History" value="History" />
                    <Picker.Item label="Geography" value="Geography" />
                    <Picker.Item label="ICT" value="ICT" />
                    <Picker.Item label="Combined Mathematics" value="Combined Mathematics" />
                  </Picker>
                </View>
              </View>

              {/* Medium Filter */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Medium</Text>
                <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', overflow: 'hidden' }}>
                  <Picker
                    selectedValue={filterMedium}
                    onValueChange={(value: string) => setFilterMedium(value)}
                    style={{ height: Platform.OS === 'ios' ? 120 : 50 }}
                  >
                    <Picker.Item label="All Mediums" value="" />
                    <Picker.Item label="Sinhala" value="Sinhala" />
                    <Picker.Item label="English" value="English" />
                    <Picker.Item label="Tamil" value="Tamil" />
                  </Picker>
                </View>
              </View>

              {/* Exam Type Filter */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Exam Type</Text>
                <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', overflow: 'hidden' }}>
                  <Picker
                    selectedValue={filterExamType}
                    onValueChange={(value: string) => setFilterExamType(value)}
                    style={{ height: Platform.OS === 'ios' ? 120 : 50 }}
                  >
                    <Picker.Item label="All Types" value="" />
                    <Picker.Item label="A/L" value="AL" />
                    <Picker.Item label="O/L" value="OL" />
                  </Picker>
                </View>
              </View>

              {/* Province Filter */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Province</Text>
                <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', overflow: 'hidden' }}>
                  <Picker
                    selectedValue={filterProvince}
                    onValueChange={(value: string) => setFilterProvince(value)}
                    style={{ height: Platform.OS === 'ios' ? 120 : 50 }}
                  >
                    <Picker.Item label="All Provinces" value="" />
                    <Picker.Item label="Western Province" value="Western" />
                    <Picker.Item label="Central Province" value="Central" />
                    <Picker.Item label="Southern Province" value="Southern" />
                    <Picker.Item label="Northern Province" value="Northern" />
                    <Picker.Item label="Eastern Province" value="Eastern" />
                    <Picker.Item label="North Western Province" value="North Western" />
                    <Picker.Item label="North Central Province" value="North Central" />
                    <Picker.Item label="Uva Province" value="Uva" />
                    <Picker.Item label="Sabaragamuwa Province" value="Sabaragamuwa" />
                  </Picker>
                </View>
              </View>

              {/* Term Filter */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Term</Text>
                <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#f9fafb', overflow: 'hidden' }}>
                  <Picker
                    selectedValue={filterTerm}
                    onValueChange={(value: string) => setFilterTerm(value)}
                    style={{ height: Platform.OS === 'ios' ? 120 : 50 }}
                  >
                    <Picker.Item label="All Terms" value="" />
                    <Picker.Item label="Term 1" value="Term 1" />
                    <Picker.Item label="Term 2" value="Term 2" />
                    <Picker.Item label="Term 3" value="Term 3" />
                    <Picker.Item label="Annual Exam" value="Annual" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
              <Pressable
                onPress={clearFilters}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  padding: 14,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280' }}>Clear All</Text>
              </Pressable>
              <Pressable
                onPress={() => setSidebarVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#16A34A',
                  padding: 14,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
