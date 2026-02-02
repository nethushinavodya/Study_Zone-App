import React from 'react';
import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { uploadPaperFile, getAllPapers, Paper, uploadTextbook, getAllTextbooks, Textbook } from '../../service/paperService';
import { auth } from '../../service/firebase';
import { signInWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';
import Toast from 'react-native-toast-message';


export default function AdminPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [tokenClaims, setTokenClaims] = React.useState<Record<string, any> | null>(null);

  // Active tab: 'papers' or 'textbooks'
  const [activeTab, setActiveTab] = React.useState<'papers' | 'textbooks'>('papers');

  // Paper form fields
  const [paperTitle, setPaperTitle] = React.useState('');
  const [paperLoading, setPaperLoading] = React.useState(false);
  const [paperDriveUrl, setPaperDriveUrl] = React.useState('');
  const [grade, setGrade] = React.useState('');
  const [province, setProvince] = React.useState('');
  const [term, setTerm] = React.useState('');
  const [examType, setExamType] = React.useState('');
  const [textbook, setTextbook] = React.useState('');
  const [paperSubject, setPaperSubject] = React.useState('');
  const [paperMedium, setPaperMedium] = React.useState('');

  // Textbook form fields
  const [textbookTitle, setTextbookTitle] = React.useState('');
  const [textbookSubject, setTextbookSubject] = React.useState('');
  const [textbookGrade, setTextbookGrade] = React.useState('');
  const [textbookMedium, setTextbookMedium] = React.useState('');
  const [textbookDescription, setTextbookDescription] = React.useState('');
  const [textbookDriveUrl, setTextbookDriveUrl] = React.useState('');
  const [textbookCoverColor, setTextbookCoverColor] = React.useState('#4CAF50');
  const [textbookLoading, setTextbookLoading] = React.useState(false);

  // Papers list
  const [papers, setPapers] = React.useState<Paper[]>([]);
  const [loadingPapers, setLoadingPapers] = React.useState(false);

  // Textbooks list
  const [textbooks, setTextbooks] = React.useState<Textbook[]>([]);
  const [loadingTextbooks, setLoadingTextbooks] = React.useState(false);

  React.useEffect(() => {
    const sub = auth.onAuthStateChanged(async (u) => {
      if (!u) { setIsAdmin(false); return; }
      try {
        const token = await getIdTokenResult(u, /* forceRefresh */ true);
        console.debug('[admin] onAuthStateChanged token.claims=', token?.claims);
        setTokenClaims(token?.claims ?? null);
        setStatusMessage(null);
        const isAdminClaim = !!(token?.claims && (token.claims as any).admin);
        setIsAdmin(isAdminClaim);
        if (!isAdminClaim) setStatusMessage('Signed in but admin claim not found. Click Refresh claims after running the admin script.');
      } catch {
        setIsAdmin(false);
      }
    });
    return () => sub();
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'papers') {
        loadPapers();
      } else {
        loadTextbooks();
      }
    }
  }, [isAdmin, activeTab]);

  if (Platform.OS !== 'web') {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Admin (web-only)</Text>
        <Text style={{ marginBottom: 8 }}>The admin dashboard is available on the web only.</Text>
        <Text>Open this app in your browser (Expo web) to sign in as an admin and upload papers.</Text>
      </View>
    );
  }

  const tryLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "info",
        text1: "Missing Information",
        text2: "Please provide email and password",
      });
      return;
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const u = cred.user;
      if (!u) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "No user returned",
        });
        return;
      }
      try {
        const token = await getIdTokenResult(u, true);
        console.debug('[admin] signIn fresh token.claims=', token?.claims);
        setTokenClaims(token?.claims ?? null);
        const isAdminClaim = !!(token?.claims && (token.claims as any).admin);
        if (!isAdminClaim) {
          setStatusMessage('Signed in but admin role not present. Run the admin-claim script and then click Refresh claims.');
          return;
        }
      } catch {
        setStatusMessage('Unable to verify admin role. Try Refresh claims.');
        return;
      }
      setEmail(''); setPassword('');
    } catch (e: any) {
      console.error('Login failed', e);
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: e?.message || "Check credentials",
      });
    }
  };

  const doSignOut = async () => {
    try { await signOut(auth); setIsAdmin(false); } catch { /* ignore */ }
  };


  const loadPapers = async () => {
    setLoadingPapers(true);
    try {
      const fetchedPapers = await getAllPapers();
      setPapers(fetchedPapers);
    } catch (err) {
      console.error('Failed to load papers', err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load papers",
      });
    }
    setLoadingPapers(false);
  };

  const loadTextbooks = async () => {
    setLoadingTextbooks(true);
    try {
      const fetchedTextbooks = await getAllTextbooks();
      setTextbooks(fetchedTextbooks);
    } catch (err) {
      console.error('Failed to load textbooks', err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load textbooks",
      });
    }
    setLoadingTextbooks(false);
  };

  const submitPaper = async () => {
    setPaperLoading(true);
    try {
      const res = await uploadPaperFile(
        {
          title: paperTitle || 'Untitled',
          grade: grade || '',
          province: province || '',
          term: term || '',
          examType: examType || '',
          textbook: textbook || '',
          subject: paperSubject || '',
          medium: paperMedium || '',
        },
        paperDriveUrl || ''
      );
      Toast.show({
        type: "success",
        text1: "Upload Successful",
        text2: `Paper saved: ${res.id}`,
      });
      setPaperTitle('');
      setPaperDriveUrl('');
      setGrade('');
      setProvince('');
      setTerm('');
      setExamType('');
      setTextbook('');
      setPaperSubject('');
      setPaperMedium('');
      loadPapers();
    } catch (err) {
      console.error('Upload failed', err);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: "Failed to upload paper. Please try again.",
      });
    }
    setPaperLoading(false);
  };

  const submitTextbook = async () => {
    if (!textbookTitle || !textbookSubject || !textbookGrade || !textbookMedium || !textbookDriveUrl) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in all required fields",
      });
      return;
    }

    setTextbookLoading(true);
    try {
      const res = await uploadTextbook(
        textbookTitle,
        textbookSubject,
        textbookGrade,
        textbookMedium,
        textbookDriveUrl,
        textbookDescription,
        textbookCoverColor
      );
      Toast.show({
        type: "success",
        text1: "Upload Successful",
        text2: `Textbook saved: ${res.id}`,
      });
      setTextbookTitle('');
      setTextbookSubject('');
      setTextbookGrade('');
      setTextbookMedium('');
      setTextbookDescription('');
      setTextbookDriveUrl('');
      setTextbookCoverColor('#4CAF50');
      loadTextbooks();
    } catch (err) {
      console.error('Upload failed', err);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: "Failed to upload textbook. Please try again.",
      });
    }
    setTextbookLoading(false);
  };

  const refreshClaims = async () => {
    const u = auth.currentUser;
    if (!u) return setStatusMessage('Not signed in');
    try {
      const token = await getIdTokenResult(u, true);
      console.debug('[admin] refreshClaims token.claims=', token?.claims);
      setTokenClaims(token?.claims ?? null);
      const isAdminClaim = !!(token?.claims && (token.claims as any).admin);
      setIsAdmin(isAdminClaim);
      if (isAdminClaim) setStatusMessage('Admin claim found — upload UI enabled.');
      else setStatusMessage('Admin claim still not present. Ensure you ran the server script and re-signed in if needed.');
    } catch (err) {
      console.error('refreshClaims error', err);
      setStatusMessage('Failed to refresh token claims');
    }
  };

  if (!isAdmin) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Admin login</Text>
        <TextInput placeholder='Email' value={email} onChangeText={setEmail} keyboardType='email-address' autoCapitalize='none' style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 12 }} />
        <TextInput placeholder='Password' value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 12 }} />
        <Pressable onPress={tryLogin} style={{ backgroundColor: '#16A34A', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>Sign in</Text>
        </Pressable>
        <View style={{ marginTop: 12 }}>
          <Pressable onPress={refreshClaims} style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' }}>
            <Text style={{ textAlign: 'center' }}>Refresh claims</Text>
          </Pressable>
        </View>
        {statusMessage ? <Text style={{ marginTop: 12, color: '#444' }}>{statusMessage}</Text> : null}
        {tokenClaims ? (
          <View style={{ marginTop: 12, backgroundColor: '#fff', padding: 8, borderRadius: 6 }}>
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>Token claims (debug)</Text>
            <Text selectable>{JSON.stringify(tokenClaims, null, 2)}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Admin Dashboard</Text>
        <Text style={{ marginBottom: 12, color: '#666' }}>Signed in as: {auth.currentUser?.email}</Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Pressable onPress={doSignOut} style={{ backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>Sign out</Text>
          </Pressable>
          <Pressable onPress={refreshClaims} style={{ backgroundColor: '#6B7280', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }}>
            <Text style={{ color: 'white', fontWeight: '600' }}>Refresh claims</Text>
          </Pressable>
        </View>

        {/* Tab Navigation */}
        <View style={{ flexDirection: 'row', marginBottom: 24, borderBottomWidth: 2, borderBottomColor: '#E5E7EB' }}>
          <Pressable
            onPress={() => setActiveTab('papers')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === 'papers' ? 3 : 0,
              borderBottomColor: '#16A34A',
              marginBottom: -2,
            }}
          >
            <Text style={{
              textAlign: 'center',
              fontWeight: activeTab === 'papers' ? '700' : '500',
              color: activeTab === 'papers' ? '#16A34A' : '#6B7280',
              fontSize: 16,
            }}>
              📄 Add Papers
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('textbooks')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === 'textbooks' ? 3 : 0,
              borderBottomColor: '#16A34A',
              marginBottom: -2,
            }}
          >
            <Text style={{
              textAlign: 'center',
              fontWeight: activeTab === 'textbooks' ? '700' : '500',
              color: activeTab === 'textbooks' ? '#16A34A' : '#6B7280',
              fontSize: 16,
            }}>
              📚 Add Textbooks
            </Text>
          </Pressable>
        </View>

        {/* Papers Tab Content */}
        {activeTab === 'papers' ? (
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Upload Paper</Text>

            <TextInput
              placeholder='Title'
              value={paperTitle}
              onChangeText={setPaperTitle}
              style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 12, borderColor: '#ccc' }}
            />

            {/* Exam Type Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Exam Type</Text>
              <select
                value={examType}
                onChange={(e: any) => setExamType(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Exam Type</option>
                <option value="AL">A/L (Advanced Level)</option>
                <option value="OL">O/L (Ordinary Level)</option>
              </select>
            </View>

            {/* Grade Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Grade</Text>
              <select
                value={grade}
                onChange={(e: any) => setGrade(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Grade</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="13">Grade 13</option>
              </select>
            </View>

            {/* Province Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Province</Text>
              <select
                value={province}
                onChange={(e: any) => setProvince(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Province</option>
                <option value="Western">Western Province</option>
                <option value="Central">Central Province</option>
                <option value="Southern">Southern Province</option>
                <option value="Northern">Northern Province</option>
                <option value="Eastern">Eastern Province</option>
                <option value="North Western">North Western Province</option>
                <option value="North Central">North Central Province</option>
                <option value="Uva">Uva Province</option>
                <option value="Sabaragamuwa">Sabaragamuwa Province</option>
              </select>
            </View>

            {/* Term Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Term</Text>
              <select
                value={term}
                onChange={(e: any) => setTerm(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Annual">Annual Exam</option>
              </select>
            </View>

            {/* Textbook Input */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Textbook</Text>
              <TextInput
                placeholder='Enter textbook name (optional)'
                value={textbook}
                onChangeText={setTextbook}
                style={{ borderWidth: 1, padding: 8, borderRadius: 8, borderColor: '#ccc' }}
              />
            </View>

            {/* Subject Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Subject</Text>
              <select
                value={paperSubject}
                onChange={(e: any) => setPaperSubject(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Sinhala">Sinhala</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Buddhism">Buddhism</option>
                <option value="Christianity">Christianity</option>
                <option value="Islam">Islam</option>
                <option value="Hinduism">Hinduism</option>
                <option value="ICT">ICT</option>
                <option value="Commerce">Commerce</option>
                <option value="Business Studies">Business Studies</option>
                <option value="Accounting">Accounting</option>
                <option value="Economics">Economics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Combined Mathematics">Combined Mathematics</option>
                <option value="Art">Art</option>
                <option value="Dancing">Dancing</option>
                <option value="Music">Music</option>
                <option value="Drama">Drama</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Health Science">Health Science</option>
                <option value="Home Economics">Home Economics</option>
                <option value="Engineering Technology">Engineering Technology</option>
                <option value="Other">Other</option>
              </select>
            </View>

            {/* Medium Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Medium</Text>
              <select
                value={paperMedium}
                onChange={(e: any) => setPaperMedium(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Medium</option>
                <option value="Sinhala">Sinhala</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
              </select>
            </View>

            {/* Drive URL Input */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Google Drive URL</Text>
              <TextInput
                placeholder='Paste Google Drive URL here'
                value={paperDriveUrl}
                onChangeText={setPaperDriveUrl}
                style={{ borderWidth: 1, padding: 8, borderRadius: 8, borderColor: '#ccc' }}
              />
              <View style={{ backgroundColor: '#fff3cd', padding: 8, borderRadius: 6, marginTop: 4, borderWidth: 1, borderColor: '#ffc107' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#856404', marginBottom: 4 }}>
                  📌 How to get proper download link:
                </Text>
                <Text style={{ fontSize: 11, color: '#856404', marginBottom: 2 }}>
                  1. Upload PDF to Google Drive
                </Text>
                <Text style={{ fontSize: 11, color: '#856404', marginBottom: 2 }}>
                  2. Right-click → Share → Change to &quot;Anyone with the link&quot;
                </Text>
                <Text style={{ fontSize: 11, color: '#856404', marginBottom: 2 }}>
                  3. Copy the link and paste here
                </Text>
              </View>
            </View>

            <Pressable onPress={submitPaper} style={{ backgroundColor: '#16A34A', padding: 12, borderRadius: 8, marginBottom: 24 }}>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                {paperLoading ? 'Uploading...' : 'Save Paper'}
              </Text>
            </Pressable>

            {/* Uploaded Papers List */}
            <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>Uploaded Papers</Text>
                <Pressable onPress={loadPapers} style={{ backgroundColor: '#e0e0e0', padding: 8, borderRadius: 6 }}>
                  <Text>{loadingPapers ? 'Loading...' : 'Refresh'}</Text>
                </Pressable>
              </View>

              {loadingPapers ? (
                <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading papers...</Text>
              ) : papers.length === 0 ? (
                <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>No papers uploaded yet</Text>
              ) : (
                <View>
                  {papers.map((paper) => (
                    <View
                      key={paper.id}
                      style={{
                        backgroundColor: '#f9f9f9',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#e0e0e0'
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{paper.title}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, backgroundColor: '#e3f2fd', padding: 4, borderRadius: 4 }}>
                          {paper.examType}
                        </Text>
                        <Text style={{ fontSize: 12, backgroundColor: '#f3e5f5', padding: 4, borderRadius: 4 }}>
                          Grade {paper.grade}
                        </Text>
                        <Text style={{ fontSize: 12, backgroundColor: '#e8f5e9', padding: 4, borderRadius: 4 }}>
                          {paper.province}
                        </Text>
                        <Text style={{ fontSize: 12, backgroundColor: '#fff3e0', padding: 4, borderRadius: 4 }}>
                          {paper.term}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => window.open(paper.url, '_blank')}
                        style={{ backgroundColor: '#2196F3', padding: 8, borderRadius: 6, marginTop: 4 }}
                      >
                        <Text style={{ color: 'white', textAlign: 'center', fontSize: 14 }}>View PDF</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Textbooks Tab Content */
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Upload Textbook</Text>

            <TextInput
              placeholder='Textbook Title *'
              value={textbookTitle}
              onChangeText={setTextbookTitle}
              style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 12, borderColor: '#ccc' }}
            />

            {/* Subject Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Subject *</Text>
              <select
                value={textbookSubject}
                onChange={(e: any) => setTextbookSubject(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Sinhala">Sinhala</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Buddhism">Buddhism</option>
                <option value="Christianity">Christianity</option>
                <option value="Islam">Islam</option>
                <option value="Hinduism">Hinduism</option>
                <option value="ICT">ICT</option>
                <option value="Commerce">Commerce</option>
                <option value="Business Studies">Business Studies</option>
                <option value="Accounting">Accounting</option>
                <option value="Economics">Economics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Combined Mathematics">Combined Mathematics</option>
                <option value="Art">Art</option>
                <option value="Dancing">Dancing</option>
                <option value="Music">Music</option>
                <option value="Drama">Drama</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Health Science">Health Science</option>
                <option value="Home Economics">Home Economics</option>
                <option value="Engineering Technology">Engineering Technology</option>
                <option value="Other">Other</option>
              </select>
            </View>

            {/* Grade Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Grade *</Text>
              <select
                value={textbookGrade}
                onChange={(e: any) => setTextbookGrade(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Grade</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="13">Grade 13</option>
              </select>
            </View>

            {/* Medium Dropdown */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Medium *</Text>
              <select
                value={textbookMedium}
                onChange={(e: any) => setTextbookMedium(e.target.value)}
                style={{ width: '100%', padding: 8, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' }}
              >
                <option value="">Select Medium</option>
                <option value="Sinhala">Sinhala</option>
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
              </select>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Description (optional)</Text>
              <TextInput
                placeholder='Enter textbook description'
                value={textbookDescription}
                onChangeText={setTextbookDescription}
                multiline
                numberOfLines={3}
                style={{ borderWidth: 1, padding: 8, borderRadius: 8, borderColor: '#ccc', textAlignVertical: 'top' }}
              />
            </View>

            {/* Cover Color */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Cover Color</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <input
                  type="color"
                  value={textbookCoverColor}
                  onChange={(e: any) => setTextbookCoverColor(e.target.value)}
                  style={{ width: 60, height: 40, borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer' }}
                />
                <Text style={{ color: '#666' }}>{textbookCoverColor}</Text>
              </View>
            </View>

            {/* Drive URL Input */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 4, fontWeight: '500' }}>Google Drive URL *</Text>
              <TextInput
                placeholder='Paste Google Drive URL here'
                value={textbookDriveUrl}
                onChangeText={setTextbookDriveUrl}
                style={{ borderWidth: 1, padding: 8, borderRadius: 8, borderColor: '#ccc' }}
              />
              <View style={{ backgroundColor: '#fff3cd', padding: 8, borderRadius: 6, marginTop: 4, borderWidth: 1, borderColor: '#ffc107' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#856404', marginBottom: 4 }}>
                  📌 How to get proper download link:
                </Text>
                <Text style={{ fontSize: 11, color: '#856404', marginBottom: 2 }}>
                  1. Upload textbook PDF to Google Drive
                </Text>
                <Text style={{ fontSize: 11, color: '#856404', marginBottom: 2 }}>
                  2. Right-click → Share → Change to &quot;Anyone with the link&quot;
                </Text>
                <Text style={{ fontSize: 11, color: '#856404', marginBottom: 2 }}>
                  3. Copy the link and paste here
                </Text>
              </View>
            </View>

            <Pressable onPress={submitTextbook} style={{ backgroundColor: '#16A34A', padding: 12, borderRadius: 8, marginBottom: 24 }}>
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                {textbookLoading ? 'Uploading...' : 'Save Textbook'}
              </Text>
            </Pressable>

            {/* Uploaded Textbooks List */}
            <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>Uploaded Textbooks</Text>
                <Pressable onPress={loadTextbooks} style={{ backgroundColor: '#e0e0e0', padding: 8, borderRadius: 6 }}>
                  <Text>{loadingTextbooks ? 'Loading...' : 'Refresh'}</Text>
                </Pressable>
              </View>

              {loadingTextbooks ? (
                <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading textbooks...</Text>
              ) : textbooks.length === 0 ? (
                <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>No textbooks uploaded yet</Text>
              ) : (
                <View>
                  {textbooks.map((textbook) => (
                    <View
                      key={textbook.id}
                      style={{
                        backgroundColor: '#f9f9f9',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: '#e0e0e0'
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View
                          style={{
                            width: 40,
                            height: 50,
                            backgroundColor: textbook.coverColor || '#4CAF50',
                            borderRadius: 4,
                            marginRight: 12
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{textbook.title}</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            <Text style={{ fontSize: 12, backgroundColor: '#e3f2fd', padding: 4, borderRadius: 4 }}>
                              {textbook.subject}
                            </Text>
                            <Text style={{ fontSize: 12, backgroundColor: '#f3e5f5', padding: 4, borderRadius: 4 }}>
                              Grade {textbook.grade}
                            </Text>
                            <Text style={{ fontSize: 12, backgroundColor: '#e8f5e9', padding: 4, borderRadius: 4 }}>
                              {textbook.medium}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {textbook.description ? (
                        <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{textbook.description}</Text>
                      ) : null}
                      <Pressable
                        onPress={() => window.open(textbook.url, '_blank')}
                        style={{ backgroundColor: '#2196F3', padding: 8, borderRadius: 6, marginTop: 4 }}
                      >
                        <Text style={{ color: 'white', textAlign: 'center', fontSize: 14 }}>View PDF</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

