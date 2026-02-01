import React from 'react';
import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { uploadPaperFile, getAllPapers, Paper } from '../../service/paperService';
import { auth } from '../../service/firebase';
import { signInWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';
import Toast from 'react-native-toast-message';


export default function AdminPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [tokenClaims, setTokenClaims] = React.useState<Record<string, any> | null>(null);
  const [title, setTitle] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [driveUrl, setDriveUrl] = React.useState('');

  const [grade, setGrade] = React.useState('');
  const [province, setProvince] = React.useState('');
  const [term, setTerm] = React.useState('');
  const [examType, setExamType] = React.useState('');
  const [textbook, setTextbook] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [medium, setMedium] = React.useState('');

  // Papers list
  const [papers, setPapers] = React.useState<Paper[]>([]);
  const [loadingPapers, setLoadingPapers] = React.useState(false);

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
      loadPapers();
    }
  }, [isAdmin]);

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

  const submit = async () => {
    setLoading(true);
    try {
      const res = await uploadPaperFile(
        {
          title: title || 'Untitled',
          grade: grade || '',
          province: province || '',
          term: term || '',
          examType: examType || '',
          textbook: textbook || '',
          subject: subject || '',
          medium: medium || '',
        },
        driveUrl || ''
      );
      Toast.show({
        type: "success",
        text1: "Upload Successful",
        text2: `Paper saved: ${res.id}`,
      });
      setTitle('');
      setDriveUrl('');
      setGrade('');
      setProvince('');
      setTerm('');
      setExamType('');
      setTextbook('');
      setSubject('');
      setMedium('');
      loadPapers();
    } catch (err) {
      console.error('Upload failed', err);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: "Failed to upload paper. Please try again.",
      });
    }
    setLoading(false);
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
        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Upload Paper</Text>
        <Text style={{ marginBottom: 8 }}>Signed in as: {auth.currentUser?.email}</Text>
        <Pressable onPress={doSignOut} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#16A34A' }}>Sign out</Text>
        </Pressable>
        <Pressable onPress={refreshClaims} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#16A34A' }}>Refresh claims</Text>
        </Pressable>

        <TextInput
          placeholder='Title'
          value={title}
          onChangeText={setTitle}
          style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 12 }}
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

        {/* Textbook Dropdown */}
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
            value={subject}
            onChange={(e: any) => setSubject(e.target.value)}
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
            value={medium}
            onChange={(e: any) => setMedium(e.target.value)}
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
            placeholder='Paste Google Drive URL here (optional)'
            value={driveUrl}
            onChangeText={setDriveUrl}
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
            <Text style={{ fontSize: 11, color: '#856404', fontWeight: '600', marginTop: 4 }}>
              Note: Students will see a download page from Google Drive
            </Text>
          </View>
        </View>

        <Pressable onPress={submit} style={{ backgroundColor: '#16A34A', padding: 12, borderRadius: 8, marginBottom: 24 }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>{loading ? 'Uploading...' : 'Save Paper'}</Text>
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
    </ScrollView>
  );
}

