import React, { useEffect, useState, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Linking,
  Modal,
  Platform,
  Animated,
  Easing,
  Image,
  TextInput,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from 'expo-linear-gradient';
import {
  listenQuestions,
} from "@/service/questions";
import { onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/service/firebase";
import { addTextbookBookmark, removeTextbookBookmark, isTextbookBookmarked } from "@/service/bookmarkService";
import Toast from 'react-native-toast-message';
import { useLoader } from "@/hooks/useLoader";

const Home = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Array<any>>([]);
  const [papers, setPapers] = useState<Array<any>>([]);
  const [textbooks, setTextbooks] = useState<Array<any>>([]);
  const [filteredTextbooks, setFilteredTextbooks] = useState<Array<any>>([]);
  const [bookmarkedTextbooks, setBookmarkedTextbooks] = useState<Set<string>>(new Set());
  const { showLoader, hideLoader } = useLoader();

  // Sidebar and filter states
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({
    textbooks: [],
    papers: [],
    questions: [],
  });
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Animation refs for textbook slide-in
  const textbookAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Animation refs for interactive header
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const educationRotateAnim = useRef(new Animated.Value(0)).current;
  const educationBounceAnim = useRef(new Animated.Value(0)).current;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", emoji: "🌅" };
    if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
    if (hour < 21) return { text: "Good Evening", emoji: "🌆" };
    return { text: "Good Night", emoji: "🌙" };
  };

  const greeting = getGreeting();

  // Start animations when component mounts
  useEffect(() => {
    // Header fade and slide in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for emoji
    Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
    ).start();

    // Education image floating/bounce animation
    Animated.loop(
        Animated.sequence([
          Animated.timing(educationBounceAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(educationBounceAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
    ).start();

    // Education image gentle rotation
    Animated.loop(
        Animated.sequence([
          Animated.timing(educationRotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(educationRotateAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
    ).start();
  }, []);


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

    // Load recent textbooks
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

  // Trigger slide-in animations when textbooks are loaded or filtered
  useEffect(() => {
    if (filteredTextbooks.length > 0) {
      // Reset all animations first
      Object.keys(textbookAnimations).forEach(key => {
        textbookAnimations[key].setValue(0);
      });

      // Calculate total number of rows
      const totalRows = Math.ceil(filteredTextbooks.length / 3);

      // Trigger animations for each row with staggered delay
      for (let i = 0; i < totalRows; i++) {
        setTimeout(() => {
          animateRow(i, 0);
        }, i * 100); // 100ms delay between each row
      }
    }
  }, [filteredTextbooks]);

  // Load bookmark status for all textbooks
  useEffect(() => {
    const loadBookmarks = async () => {
      const bookmarkedSet = new Set<string>();
      for (const textbook of textbooks) {
        const isBookmarked = await isTextbookBookmarked(textbook.id);
        if (isBookmarked) {
          bookmarkedSet.add(textbook.id);
        }
      }
      setBookmarkedTextbooks(bookmarkedSet);
    };

    if (textbooks.length > 0) {
      loadBookmarks();
    }
  }, [textbooks]);

  const handleBookmark = async (textbook: any) => {
    try {
      if (bookmarkedTextbooks.has(textbook.id)) {
        await removeTextbookBookmark(textbook.id);
        setBookmarkedTextbooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(textbook.id);
          return newSet;
        });
        Toast.show({
          type: "success",
          text1: "Removed from bookmarks",
          text2: "Textbook removed from your collection",
        });
      } else {
        await addTextbookBookmark(textbook);
        setBookmarkedTextbooks(prev => new Set(prev).add(textbook.id));
        Toast.show({
          type: "success",
          text1: "Bookmarked!",
          text2: "Textbook saved to your collection",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update bookmark",
      });
    }
  };

  const clearFilters = () => {
    setFilterGrade('');
    setFilterSubject('');
    setFilterMedium('');
  };

  // Search functionality
  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (text.trim() === '') {
      setShowSearchResults(false);
      return;
    }

    const query = text.toLowerCase();

    const filteredTextbooks = textbooks.filter(t =>
        t.subject?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.grade?.toString().includes(query)
    );

    const filteredPapers = papers.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.examType?.toLowerCase().includes(query) ||
        p.grade?.toString().includes(query)
    );

    const filteredQuestions = questions.filter(q =>
        q.question?.toLowerCase().includes(query) ||
        q.userName?.toLowerCase().includes(query)
    );

    setSearchResults({
      textbooks: filteredTextbooks,
      papers: filteredPapers,
      questions: filteredQuestions,
    });

    setShowSearchResults(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const formatQuestionTime = (createdAt: any) => {
    const toDate = (v: any): Date | null => {
      if (!v) return null;
      if (v?.toDate) return v.toDate();
      if (v instanceof Date) return v;
      if (typeof v === 'number') return new Date(v);
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const d = toDate(createdAt);
    if (!d) return '';

    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return d.toLocaleDateString();

    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (sec < 15) return 'Just now';
    if (min < 1) return `${sec}s ago`;
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day < 7) return `${day}d ago`;

    return d.toLocaleDateString();
  };

  // Helper function to get animation value for each row
  const getRowAnimation = (rowIndex: number) => {
    const key = `row-${rowIndex}`;
    if (!textbookAnimations[key]) {
      textbookAnimations[key] = new Animated.Value(0);
    }
    return textbookAnimations[key];
  };

  // Trigger slide-in animation for a row
  const animateRow = (rowIndex: number, delay: number = 0) => {
    const animation = getRowAnimation(rowIndex);
    animation.setValue(0); // Reset to start position

    Animated.timing(animation, {
      toValue: 1,
      duration: 600,
      delay: delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  return (
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Top Banner Section */}
          <LinearGradient
              colors={['#16A34A', '#15803d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerSection}
          >
            <View style={styles.bannerContent}>
              <View>
                <Text style={styles.bannerGreeting}>{greeting.text}! 👋</Text>
                <Text style={styles.bannerSubtitle}>Ready to learn something new?</Text>
              </View>
            </View>

            {/* Search Bar in Banner */}
            <View style={styles.bannerSearchContainer}>
              <FontAwesome name="search" size={16} color="#dcfce7" />
              <TextInput
                  style={styles.bannerSearchInputField}
                  placeholder="Search textbooks, papers..."
                  placeholderTextColor="#dcfce7"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              {searchQuery && (
                  <Pressable onPress={clearSearch}>
                    <FontAwesome name="times" size={14} color="#dcfce7" />
                  </Pressable>
              )}
            </View>
          </LinearGradient>

          {/* ===== HERO SECTION: Education GIF ===== */}
          <View style={styles.heroSection}>
            <Image
                source={require("@/assets/images/Education1.gif")}
                style={[styles.heroImage, { transform: [{ scale: 1 }] }]}
                resizeMode="cover"
                fadeDuration={1000}
            />
          </View>

          {/* ===== TEXTBOOKS SECTION ===== */}
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

            {/* Textbooks Grid */}
            {(() => {
              const englishBooks = filteredTextbooks.filter((book: any) =>
                  book.medium?.toLowerCase().trim() === 'english'
              );
              const sinhalaBooks = filteredTextbooks.filter((book: any) =>
                  book.medium?.toLowerCase().trim() === 'sinhala'
              );
              const otherBooks = filteredTextbooks.filter((book: any) => {
                const medium = book.medium?.toLowerCase().trim();
                return medium && medium !== 'english' && medium !== 'sinhala';
              });

              const renderTextbookGrid = (books: any[], mediumLabel: string, mediumEmoji: string) => {
                if (books.length === 0) return null;

                return (
                    <View key={mediumLabel} style={{ marginBottom: 24 }}>
                      <View style={styles.mediumSectionHeader}>
                        <Text style={styles.mediumSectionTitle}>
                          {mediumEmoji} {mediumLabel} Medium
                        </Text>
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.textbooksHorizontalScroll}
                        contentContainerStyle={styles.textbooksHorizontalContent}
                      >
                        {books.map((item, index) => {
                          const cardColor = item.coverColor || '#4CAF50';
                          const isSinhala = item.medium?.toLowerCase() === 'sinhala';
                          const isEnglish = item.medium?.toLowerCase() === 'english';

                          return (
                            <View
                              key={item.id}
                              style={[
                                styles.textbookGridCard,
                                { backgroundColor: cardColor }
                              ]}
                            >
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

                                          <View style={styles.textbookCover}>
                                            <FontAwesome name="book" size={36} color="#ffffff" style={{ opacity: 0.9 }} />
                                          </View>
                                          <View style={styles.textbookInfo}>
                                            <Text style={styles.textbookSubjectLabel} numberOfLines={2}>{item.title}</Text>
                                            <View style={styles.textbookMetadata}>
                                              <View style={styles.textbookGradeBadge}>
                                                <Text style={styles.textbookGradeBadgeText}>Grade {item.grade}</Text>
                                              </View>
                                            </View>
                                            {item.description && (
                                                <Text style={styles.textbookDescription} numberOfLines={2}>
                                                  {item.description}
                                                </Text>
                                            )}

                                            {/* Action Buttons */}
                                            <View style={styles.textbookActions}>
                                              <Pressable
                                                  style={styles.previewBtn}
                                                  onPress={() => item.url && Linking.openURL(item.url)}
                                              >
                                                <FontAwesome name="eye" size={12} color="#ffffff" />
                                                <Text style={styles.previewBtnText}>Preview</Text>
                                              </Pressable>
                                              <Pressable
                                                  style={[
                                                    styles.bookmarkBtn,
                                                    bookmarkedTextbooks.has(item.id) && styles.bookmarkedBtn
                                                  ]}
                                                  onPress={() => handleBookmark(item)}
                                              >
                                                <FontAwesome
                                                    name={bookmarkedTextbooks.has(item.id) ? "bookmark" : "bookmark-o"}
                                                    size={12}
                                                    color={bookmarkedTextbooks.has(item.id) ? "#ffffff" : "#6b7280"}
                                                />
                                              </Pressable>
                                            </View>
                                          </View>
                                        </View>
                                    );
                        })}
                      </ScrollView>
                    </View>
                );
              };

              return (
                  <>
                    {/* English Medium Section */}
                    {renderTextbookGrid(englishBooks, 'English', '📘')}

                    {/* Sinhala Medium Section */}
                    {renderTextbookGrid(sinhalaBooks, 'Sinhala', '📗')}

                    {/* Other Medium Section */}
                    {otherBooks.length > 0 && renderTextbookGrid(otherBooks, 'Other', '📚')}

                    {/* No textbooks message */}
                    {filteredTextbooks.length === 0 && (
                        <View style={styles.emptyTextbooksContainer}>
                          <FontAwesome name="book" size={48} color="#d1d5db" />
                          <Text style={styles.emptyTextbooksText}>No textbooks found</Text>
                          <Text style={styles.emptyTextbooksSubtext}>Try adjusting your filters</Text>
                        </View>
                    )}
                  </>
              );
            })()}
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

          {/* Q&A Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>❓ Questions & Answers</Text>
              <Pressable onPress={() => router.push('/qna')}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>
            {questions.slice(0, 3).map((question) => (
                <View key={question.id} style={styles.card}>
                  <View style={styles.questionHeader}>
                    <View style={styles.avatarCircle}>
                      <FontAwesome name="user" size={18} color="#16A34A" />
                    </View>
                    <View style={styles.questionMeta}>
                      <Text style={styles.questionAuthor}>{question.userName || 'Anonymous'}</Text>
                      <Text style={styles.questionTime}>
                        {formatQuestionTime(question.createdAt) || ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.qText}>{question.question}</Text>
                  {question.image && (
                      <Image
                          source={{ uri: question.image }}
                          style={styles.qImage}
                      />
                  )}
                  <Pressable
                      onPress={() => router.push(`/qna?id=${question.id}`)}
                      style={styles.viewRepliesBtn}
                  >
                    <FontAwesome name="comments" size={14} color="#2563eb" />
                    <Text style={styles.viewRepliesText}>
                      {question.replyCount ? `${question.replyCount} replies` : 'View Replies'}
                    </Text>
                  </Pressable>
                </View>
            ))}
          </View>
        </ScrollView>

        {/* Search Results Modal */}
        <Modal
            visible={showSearchResults}
            transparent={true}
            animationType="fade"
            onRequestClose={clearSearch}
        >
          <Pressable
              style={styles.searchResultsOverlay}
              onPress={clearSearch}
          >
            <View style={styles.searchResultsContainer}>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsTitle}>Search Results</Text>
                <Pressable onPress={clearSearch}>
                  <FontAwesome name="times" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <ScrollView style={styles.searchResultsContent} showsVerticalScrollIndicator={true}>
                {/* Textbooks Results */}
                {searchResults.textbooks.length > 0 && (
                    <>
                      <Text style={styles.searchResultsCategory}>📖 Textbooks</Text>
                      {searchResults.textbooks.map((book: any) => {
                        const cardColor = book.coverColor || '#4CAF50';
                        const isSinhala = book.medium?.toLowerCase() === 'sinhala';
                        const isEnglish = book.medium?.toLowerCase() === 'english';

                        return (
                          <Pressable
                            key={book.id}
                            style={{ backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f4f8' }}
                            onPress={() => {
                              if (book.url) Linking.openURL(book.url);
                              clearSearch();
                            }}
                          >
                            {/* Medium Badge */}
                            {(isSinhala || isEnglish) && (
                              <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.95)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 }}>
                                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#1f2937' }}>{isSinhala ? '📗 සිංහල' : '📘 English'}</Text>
                                </View>
                              </View>
                            )}

                            {/* Cover */}
                            <View style={{ height: 100, backgroundColor: book.coverColor || cardColor, justifyContent: 'center', alignItems: 'center' }}>
                              <MaterialIcons name="book" size={44} color="#FFFFFF" />
                            </View>

                            {/* Info */}
                            <View style={{ padding: 14, backgroundColor: '#ffffff' }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 6 }}>{book.subject || book.title}</Text>

                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                                {book.grade && (
                                  <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginBottom: 6 }}>
                                    <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '600' }}>Grade {book.grade}</Text>
                                  </View>
                                )}
                                {book.medium && (
                                  <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 6 }}>
                                    <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>{book.medium}</Text>
                                  </View>
                                )}
                              </View>

                              {book.description && (
                                <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }} numberOfLines={2}>{book.description}</Text>
                              )}

                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                  <Pressable onPress={() => { if (book.url) Linking.openURL(book.url); clearSearch(); }} style={{ backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}>
                                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>View Textbook</Text>
                                  </Pressable>
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </>
                )}

                {/* Papers Results */}
                {searchResults.papers.length > 0 && (
                    <>
                      <Text style={styles.searchResultsCategory}>📄 Papers</Text>
                      {searchResults.papers.map((paper: any) => (
                          <Pressable
                              key={paper.id}
                              style={styles.searchResultItem}
                              onPress={() => {
                                Linking.openURL(paper.url);
                                clearSearch();
                              }}
                          >
                            <View style={styles.searchResultIcon}>
                              <FontAwesome name="file-pdf-o" size={16} color="#0284C7" />
                            </View>
                            <View style={styles.searchResultInfo}>
                              <Text style={styles.searchResultTitle}>{paper.title}</Text>
                              <Text style={styles.searchResultSubtitle}>{paper.examType} • Grade {paper.grade}</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                          </Pressable>
                      ))}
                    </>
                )}

                {/* Questions Results */}
                {searchResults.questions.length > 0 && (
                    <>
                      <Text style={styles.searchResultsCategory}>❓ Questions</Text>
                      {searchResults.questions.map((question: any) => (
                          <Pressable
                              key={question.id}
                              style={styles.searchResultItem}
                              onPress={() => {
                                router.push(`/qna?id=${question.id}`);
                                clearSearch();
                              }}
                          >
                            <View style={styles.searchResultIcon}>
                              <FontAwesome name="question-circle" size={16} color="#D97706" />
                            </View>
                            <View style={styles.searchResultInfo}>
                              <Text style={styles.searchResultTitle} numberOfLines={1}>{question.question}</Text>
                              <Text style={styles.searchResultSubtitle}>by {question.userName || 'Anonymous'}</Text>
                            </View>
                            <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                          </Pressable>
                      ))}
                    </>
                )}

                {/* No Results */}
                {searchResults.textbooks.length === 0 &&
                    searchResults.papers.length === 0 &&
                    searchResults.questions.length === 0 && (
                        <View style={styles.noSearchResults}>
                          <FontAwesome name="search" size={48} color="#d1d5db" />
                          <Text style={styles.noSearchResultsText}>No results found</Text>
                          <Text style={styles.noSearchResultsSubtext}>Try a different search term</Text>
                        </View>
                    )}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

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

  // Banner Section - Green Gradient
  bannerSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#dcfce7',
    fontWeight: '500',
  },
  bannerEmoji: {
    fontSize: 40,
  },
  bannerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bannerSearchInputField: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    padding: 0,
  },

  // ===== HERO SECTION STYLES =====
  heroSection: {
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#bffbd0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    height: 320,
    backgroundColor: '#bffbd0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#bffbd0',
  },
  // Section Styles
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
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  mediumSectionHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  mediumSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '700',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '700',
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

  // Textbooks Horizontal Scroll
  textbooksHorizontalScroll: {
    marginBottom: 8,
  },
  textbooksHorizontalContent: {
    paddingRight: 16,
    gap: 12,
  },
  textbookGridCard: {
    width: 160,
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
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  bookmarkedBtn: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
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

  // Search Results Modal
  searchResultsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  searchResultsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  searchResultsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchResultsCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f0f4f8',
  },
  searchResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  searchResultSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  noSearchResults: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noSearchResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  noSearchResultsSubtext: {
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
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f4f8',
  },
  paperIcon: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 12,
    marginRight: 14,
  },
  paperContent: {
    flex: 1,
  },
  paperTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  paperBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  miniPaperBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniPaperBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  paperViewBtn: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
  },

  // Q&A
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
