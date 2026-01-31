import { useLoader } from "@/hooks/useLoader";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Linking,
  Modal,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import AddQuestionModal from "../../components/ui/AddQuestionModal";
import {
  listenQuestions,
  postQuestion,
} from "../../service/questions";
import { onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../service/firebase";

const Home = () => {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [questions, setQuestions] = useState<Array<any>>([]);
  const [papers, setPapers] = useState<Array<any>>([]);
  const [textbooks, setTextbooks] = useState<Array<any>>([]);
  const [filteredTextbooks, setFilteredTextbooks] = useState<Array<any>>([]);
  const { showLoader, hideLoader } = useLoader();

  // Sidebar and filter states
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterMedium, setFilterMedium] = useState('');

  useEffect(() => {
    let first = true;
    showLoader("Loading data");

    // Load questions
    const unsubQuestions = listenQuestions((items) => {
      setQuestions(items);
      if (first) {
        hideLoader();
        first = false;
      }
    });

    // Load recent papers (limit to 4)
    const papersQuery = query(collection(db, "papers"), orderBy("createdAt", "desc"), limit(4));
    const unsubPapers = onSnapshot(papersQuery, (snap) => {
      setPapers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    // Load recent textbooks (limit to 4)
    const textbooksQuery = query(collection(db, "textbooks"), orderBy("createdAt", "desc"));
    const unsubTextbooks = onSnapshot(textbooksQuery, (snap) => {
      const textbooksData = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setTextbooks(textbooksData);
      setFilteredTextbooks(textbooksData);
    });

    return () => {
      try {
        unsubQuestions();
        unsubPapers();
        unsubTextbooks();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Apply textbook filters
  useEffect(() => {
    let filtered = textbooks;

    if (filterGrade) {
      filtered = filtered.filter(t => t.grade === filterGrade);
    }
    if (filterSubject) {
      filtered = filtered.filter(t => t.subject === filterSubject);
    }
    if (filterMedium) {
      filtered = filtered.filter(t => t.medium === filterMedium);
    }

    setFilteredTextbooks(filtered);
  }, [textbooks, filterGrade, filterSubject, filterMedium]);

  const clearFilters = () => {
    setFilterGrade('');
    setFilterSubject('');
    setFilterMedium('');
  };

  const getColorForSubject = (subject: string) => {
    const colors: any = {
      Mathematics: '#dbeafe',
      Science: '#d1fae5',
      Physics: '#fce7f3',
      Chemistry: '#e9d5ff',
      Biology: '#fed7aa',
      English: '#e0e7ff',
      Sinhala: '#fef3c7',
      Tamil: '#fce7f3',
      History: '#ddd6fe',
      Geography: '#d1fae5',
    };
    return colors[subject] || '#f3f4f6';
  };


  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Welcome to Study Zone 📚</Text>
            <Text style={styles.heroSubtitle}>Your learning companion for success</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <FontAwesome name="file-pdf-o" size={24} color="#16A34A" />
              <Text style={styles.statNumber}>{papers.length}</Text>
              <Text style={styles.statLabel}>Papers</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome name="book" size={24} color="#2563eb" />
              <Text style={styles.statNumber}>{textbooks.length}</Text>
              <Text style={styles.statLabel}>Textbooks</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome name="question-circle" size={24} color="#dc2626" />
              <Text style={styles.statNumber}>{questions.length}</Text>
              <Text style={styles.statLabel}>Q&A</Text>
            </View>
          </View>
        </View>

        {/* Textbooks Section with 3 Columns */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📖 Textbooks</Text>
            <Pressable onPress={() => setSidebarVisible(true)} style={styles.filterButton}>
              <FontAwesome name="filter" size={16} color="#16A34A" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </Pressable>
          </View>

          {/* Filter badges */}
          {(filterGrade || filterSubject || filterMedium) && (
            <View style={styles.activeFilters}>
              <Text style={styles.activeFiltersText}>
                Showing {filteredTextbooks.length} of {textbooks.length} textbooks
              </Text>
              {filterGrade && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>Grade {filterGrade}</Text></View>}
              {filterSubject && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{filterSubject}</Text></View>}
              {filterMedium && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{filterMedium}</Text></View>}
            </View>
          )}

          <View style={styles.textbooksGrid}>
            {filteredTextbooks.length > 0 ? (
              filteredTextbooks.map((book, index) => {
                if (index % 3 === 0) {
                  const row = filteredTextbooks.slice(index, index + 3);
                  return (
                    <View key={`row-${index}`} style={styles.textbooksRow}>
                      {row.map((item) => (
                        <Pressable
                          key={item.id}
                          style={[styles.textbookGridCard, { backgroundColor: getColorForSubject(item.subject) }]}
                          onPress={() => item.url && Linking.openURL(item.url)}
                        >
                          <View style={styles.textbookIcon}>
                            <FontAwesome name="book" size={28} color="#1f2937" />
                          </View>
                          <Text style={styles.textbookGridTitle} numberOfLines={2}>{item.title}</Text>
                          <View style={styles.textbookBadge}>
                            <Text style={styles.textbookBadgeText}>Grade {item.grade}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  );
                }
                return null;
              })
            ) : (
              <View style={styles.emptyTextbooksContainer}>
                <FontAwesome name="book" size={48} color="#d1d5db" />
                <Text style={styles.emptyTextbooksText}>No textbooks found</Text>
                <Text style={styles.emptyTextbooksSubtext}>Try adjusting your filters</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Papers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📄 Recent Papers</Text>
            <Pressable onPress={() => router.push('/papers')}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          {papers.slice(0, 4).map((paper) => (
            <View key={paper.id} style={styles.paperCard}>
              <View style={styles.paperIcon}>
                <FontAwesome name="file-pdf-o" size={20} color="#16A34A" />
              </View>
              <View style={styles.paperContent}>
                <Text style={styles.paperTitle} numberOfLines={1}>{paper.title}</Text>
                <View style={styles.paperBadges}>
                  {paper.examType && (
                    <View style={styles.miniPaperBadge}>
                      <Text style={styles.miniPaperBadgeText}>{paper.examType}</Text>
                    </View>
                  )}
                  {paper.grade && (
                    <View style={styles.miniPaperBadge}>
                      <Text style={styles.miniPaperBadgeText}>Grade {paper.grade}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => Linking.openURL(paper.url)}
                style={styles.paperViewBtn}
              >
                <FontAwesome name="eye" size={16} color="#16A34A" />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sidebar Filter Modal */}
      <Modal
        visible={sidebarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <Pressable
          style={styles.sidebarOverlay}
          onPress={() => setSidebarVisible(false)}
        >
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>🔍 Filter Textbooks</Text>
              <Pressable onPress={() => setSidebarVisible(false)}>
                <FontAwesome name="times" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.sidebarContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Grade Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Grade</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={filterGrade}
                    onValueChange={(value: string) => setFilterGrade(value)}
                    style={styles.picker}
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
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Subject</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={filterSubject}
                    onValueChange={(value: string) => setFilterSubject(value)}
                    style={styles.picker}
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
                  </Picker>
                </View>
              </View>

              {/* Medium Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Medium</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={filterMedium}
                    onValueChange={(value: string) => setFilterMedium(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="All Mediums" value="" />
                    <Picker.Item label="Sinhala" value="Sinhala" />
                    <Picker.Item label="English" value="English" />
                    <Picker.Item label="Tamil" value="Tamil" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <Pressable onPress={clearFilters} style={styles.clearFiltersBtn}>
                <Text style={styles.clearFiltersBtnText}>Clear All Filters</Text>
              </Pressable>
              <Pressable onPress={() => setSidebarVisible(false)} style={styles.applyFiltersBtn}>
                <Text style={styles.applyFiltersBtnText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  // Hero Section
  heroSection: {
    backgroundColor: '#16A34A',
    padding: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  heroContent: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#dcfce7',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterBadgeText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Textbooks Grid
  textbooksGrid: {
    marginBottom: 8,
  },
  textbooksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textbookGridCard: {
    width: '32%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  textbookGridTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 32,
  },

  // Textbooks (old horizontal scroll - keep for backwards compatibility)
  horizontalScroll: {
    marginBottom: 8,
  },
  textbookCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textbookIcon: {
    marginBottom: 12,
  },
  textbookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  textbookBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textbookBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyTextbooksContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTextbooksText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 12,
  },
  emptyTextbooksSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },

  // Sidebar
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sidebar: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
    height: '85%'
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  sidebarContent: {
    flex: 1,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
  },
  sidebarFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearFiltersBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFiltersBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyFiltersBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Papers
  paperCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paperIcon: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    marginRight: 12,
  },
  paperContent: {
    flex: 1,
  },
  paperTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  paperBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  miniPaperBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniPaperBadgeText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  paperViewBtn: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 8,
  },

  // Q&A Section
  askQuestionBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  askQuestionText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  questionMeta: {
    flex: 1,
  },
  questionAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  questionTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  qText: {
    fontSize: 15,
    marginBottom: 12,
    color: '#374151',
    lineHeight: 22,
  },
  qImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  viewRepliesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  viewRepliesText: {
    color: "#2563eb",
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Home;

