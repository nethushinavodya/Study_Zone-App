import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { FlatList, Linking, Pressable, Text, View, Platform, Alert } from "react-native";
import { onSnapshot, collection, query, orderBy, doc, setDoc, deleteDoc, getDocs, where } from "firebase/firestore";
import { db , auth} from "../../service/firebase";
import { Picker } from "@react-native-picker/picker";

export default function Papers() {
  const [papers, setPapers] = React.useState<any[]>([]);
  const [filteredPapers, setFilteredPapers] = React.useState<any[]>([]);
  const [bookmarkedPapers, setBookmarkedPapers] = React.useState<string[]>([]);

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
    <View className="flex-1 px-6 py-8 bg-green-50">
      <Text className="text-3xl font-bold text-green-600 mb-6">Papers</Text>

      {/* Filter Bar */}
      <View className="bg-white rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-gray-800">🔍 Filter Papers</Text>
          <Pressable onPress={clearFilters} className="bg-gray-200 px-3 py-1 rounded-full">
            <Text className="text-xs text-gray-700">Clear All</Text>
          </Pressable>
        </View>

        {/* Two Column Layout */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {/* Exam Type Filter */}
          <View style={{ flex: 1, minWidth: '45%', marginBottom: 8 }}>
            <Text className="text-xs text-gray-600 mb-1">Exam Type</Text>
            <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' }}>
              <Picker
                selectedValue={filterExamType}
                onValueChange={(value: string) => setFilterExamType(value)}
                style={{ height: Platform.OS === 'ios' ? 150 : 50 }}
              >
                <Picker.Item label="All Types" value="" />
                <Picker.Item label="A/L" value="AL" />
                <Picker.Item label="O/L" value="OL" />
              </Picker>
            </View>
          </View>

          {/* Grade Filter */}
          <View style={{ flex: 1, minWidth: '45%', marginBottom: 8 }}>
            <Text className="text-xs text-gray-600 mb-1">Grade</Text>
            <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' }}>
              <Picker
                selectedValue={filterGrade}
                onValueChange={(value: string) => setFilterGrade(value)}
                style={{ height: Platform.OS === 'ios' ? 150 : 50 }}
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

          {/* Province Filter */}
          <View style={{ flex: 1, minWidth: '45%', marginBottom: 8 }}>
            <Text className="text-xs text-gray-600 mb-1">Province</Text>
            <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' }}>
              <Picker
                selectedValue={filterProvince}
                onValueChange={(value: string) => setFilterProvince(value)}
                style={{ height: Platform.OS === 'ios' ? 150 : 50 }}
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
          <View style={{ flex: 1, minWidth: '45%', marginBottom: 8 }}>
            <Text className="text-xs text-gray-600 mb-1">Term</Text>
            <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' }}>
              <Picker
                selectedValue={filterTerm}
                onValueChange={(value: string) => setFilterTerm(value)}
                style={{ height: Platform.OS === 'ios' ? 150 : 50 }}
              >
                <Picker.Item label="All Terms" value="" />
                <Picker.Item label="Term 1" value="Term 1" />
                <Picker.Item label="Term 2" value="Term 2" />
                <Picker.Item label="Term 3" value="Term 3" />
                <Picker.Item label="Annual Exam" value="Annual" />
              </Picker>
            </View>
          </View>

          {/* Subject Filter */}
          <View style={{ flex: 1, minWidth: '45%', marginBottom: 8 }}>
            <Text className="text-xs text-gray-600 mb-1">Subject</Text>
            <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' }}>
              <Picker
                selectedValue={filterSubject}
                onValueChange={(value: string) => setFilterSubject(value)}
                style={{ height: Platform.OS === 'ios' ? 150 : 50 }}
              >
                <Picker.Item label="All Subjects" value="" />
                <Picker.Item label="Mathematics" value="Mathematics" />
                <Picker.Item label="Science" value="Science" />
                <Picker.Item label="Sinhala" value="Sinhala" />
                <Picker.Item label="English" value="English" />
                <Picker.Item label="Tamil" value="Tamil" />
                <Picker.Item label="History" value="History" />
                <Picker.Item label="Geography" value="Geography" />
                <Picker.Item label="Buddhism" value="Buddhism" />
                <Picker.Item label="Christianity" value="Christianity" />
                <Picker.Item label="Islam" value="Islam" />
                <Picker.Item label="Hinduism" value="Hinduism" />
                <Picker.Item label="ICT" value="ICT" />
                <Picker.Item label="Commerce" value="Commerce" />
                <Picker.Item label="Business Studies" value="Business Studies" />
                <Picker.Item label="Accounting" value="Accounting" />
                <Picker.Item label="Economics" value="Economics" />
                <Picker.Item label="Physics" value="Physics" />
                <Picker.Item label="Chemistry" value="Chemistry" />
                <Picker.Item label="Biology" value="Biology" />
                <Picker.Item label="Combined Mathematics" value="Combined Mathematics" />
                <Picker.Item label="Art" value="Art" />
                <Picker.Item label="Dancing" value="Dancing" />
                <Picker.Item label="Music" value="Music" />
                <Picker.Item label="Drama" value="Drama" />
                <Picker.Item label="Agriculture" value="Agriculture" />
                <Picker.Item label="Health Science" value="Health Science" />
                <Picker.Item label="Home Economics" value="Home Economics" />
                <Picker.Item label="Engineering Technology" value="Engineering Technology" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          {/* Medium Filter */}
          <View style={{ flex: 1, minWidth: '45%', marginBottom: 8 }}>
            <Text className="text-xs text-gray-600 mb-1">Medium</Text>
            <View style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' }}>
              <Picker
                selectedValue={filterMedium}
                onValueChange={(value: string) => setFilterMedium(value)}
                style={{ height: Platform.OS === 'ios' ? 150 : 50 }}
              >
                <Picker.Item label="All Mediums" value="" />
                <Picker.Item label="Sinhala" value="Sinhala" />
                <Picker.Item label="English" value="English" />
                <Picker.Item label="Tamil" value="Tamil" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Active Filters Count */}
        {(filterExamType || filterGrade || filterProvince || filterTerm || filterSubject || filterMedium) && (
          <Text className="text-xs text-green-600 mt-2">
            Showing {filteredPapers.length} of {papers.length} papers
          </Text>
        )}
      </View>

      <FlatList
        data={filteredPapers}
        keyExtractor={(i) => i.id}
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
    </View>
  );
}
