import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, storage } from "../../service/firebase";

type Props = {
  size?: number;
  iconColor?: string;
};

export default function CameraCapture({
  size = 48,
  iconColor = "#111",
}: Props) {
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  // Use `any` for the ref to avoid type conflicts across TS setups
  const cameraRef = useRef<any | null>(null);

  // Some TS configs don't recognise Camera as a JSX component type; cast for JSX use
  const ExpoCamera: any = Camera;

  useEffect(() => {
    (async () => {
      const cam = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cam.status === "granted");
      const media = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(media.status === "granted");
    })();
  }, []);

  const openCamera = async () => {
    if (hasCameraPermission !== true) {
      const cam = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cam.status === "granted");
    }
    if (hasMediaPermission !== true) {
      const media = await MediaLibrary.requestPermissionsAsync();
      setHasMediaPermission(media.status === "granted");
    }
    setCaptured(null);
    setOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      // Save to device library
      try {
        await MediaLibrary.saveToLibraryAsync(photo.uri);
      } catch (e) {
        // fallback: create asset then add to album
        try {
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          await MediaLibrary.createAlbumAsync("Study-Zone", asset, false);
        } catch (err) {
          // ignore saving error
        }
      }
      setCaptured(photo.uri);

      // Upload photo to Firebase Storage and save download URL to Firestore
      (async () => {
        try {
          const uid = auth.currentUser?.uid ?? "anonymous";
          // fetch local file as blob and upload
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          const path = `photos/${uid}/${Date.now()}.jpg`;
          const storageReference = storageRef(storage, path);
          await uploadBytes(storageReference, blob as any);
          const downloadUrl = await getDownloadURL(storageReference);
          await addDoc(collection(db, "photos"), {
            downloadUrl,
            storagePath: path,
            userId: uid,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.warn("Upload to Firebase Storage failed:", e);
        }
      })();
    } catch (err) {
      // noop
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={openCamera} accessibilityLabel="Open camera">
        <Ionicons name="camera" size={size} color={iconColor} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide">
        <View style={styles.container}>
          <ExpoCamera
            style={styles.camera}
            ref={(r: any) => (cameraRef.current = r)}
            ratio="16:9"
          />

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhoto}
              style={styles.captureButton}
              accessibilityLabel="Capture photo"
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>

          {captured ? (
            <View style={styles.preview}>
              <Text style={styles.savedText}>Saved to device</Text>
              <Image source={{ uri: captured }} style={styles.previewImage} />
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  controls: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  closeButton: { position: "absolute", left: 16, top: 48, padding: 8 },
  closeText: { color: "#fff", fontSize: 16 },
  preview: { position: "absolute", top: 48, right: 16, alignItems: "center" },
  previewImage: { width: 96, height: 96, borderRadius: 8, marginTop: 8 },
  savedText: { color: "#fff", fontSize: 12 },
});
