import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Image, Dimensions, Platform } from 'react-native';
import { EnvironmentScannerView, RoomScannerViewRef } from '../../modules/room-scanner';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ScanningScreen() {
  const insets = useSafeAreaInsets();
  const scannerRef = useRef<RoomScannerViewRef>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    // Start the object capture session shortly after mount to ensure native view is ready
    const timer = setTimeout(() => {
      if (scannerRef.current) {
        scannerRef.current.startSession();
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      // Stop the session on unmount to save battery
      if (scannerRef.current) {
        scannerRef.current.stopSession();
      }
    };
  }, []);

  const handleCaptureToggle = () => {
    if (!scannerRef.current) return;
    
    if (!isCapturing) {
      // Start taking photos
      scannerRef.current.startCapturing();
      setIsCapturing(true);
    } else {
      // Finish capturing and trigger photogrammetry
      setIsCapturing(false);
      setIsProcessing(true);
      setProcessingProgress(0);
      scannerRef.current.stopSession();
    }
  };

  const handleProgress = (event: any) => {
    // Progress comes in as a fraction 0.0 to 1.0 from iOS PhotogrammetrySession
    setProcessingProgress(event.nativeEvent.progress);
  };

  const handleModelReady = async (event: any) => {
    const objUri = event.nativeEvent.uri || event.nativeEvent.path;
    console.log("Model ready at", objUri);
    
    try {
      Alert.alert("Uploading", "Saving your 3D body scan to the cloud...");
      
      // Fetch the local .obj file as a Blob
      const response = await fetch(objUri);
      const blob = await response.blob();
      
      const fileName = `scans/body_${Date.now()}_${Math.random().toString(36).substring(7)}.obj`;
      const storageRef = ref(storage, fileName);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      await addDoc(collection(db, 'scans'), {
        objUrl: downloadUrl,
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert("Success", "3D Scan saved successfully!");
      console.log("Uploaded obj URL:", downloadUrl);
      
      // Return to dashboard after saving
      setIsProcessing(false);
      router.navigate('/(tabs)');
    } catch (error) {
      console.error("Failed to upload .obj:", error);
      Alert.alert("Error", "Could not save the 3D scan.");
      setIsProcessing(false);
      router.navigate('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <EnvironmentScannerView 
        ref={scannerRef} 
        style={styles.scanner} 
        onModelReady={handleModelReady}
        onProgress={handleProgress}
      />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { top: insets.top + 20 }]}>
        <Image 
          source={require('../../assets/images/wovn-logo.png')} 
          style={[styles.logoImage, { tintColor: '#fff' }]} 
          resizeMode="contain" 
        />
      </View>

      {/* Back Button */}
      {!isProcessing && (
        <TouchableOpacity 
          style={[styles.backButton, { top: insets?.top ? insets.top + 20 : 40 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          {processingProgress > 0 ? (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${Math.max(5, processingProgress * 100)}%` }]} />
            </View>
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )}
          <Text style={styles.processingText}>
            {processingProgress > 0 
              ? `Processing 3D Model... ${Math.round(processingProgress * 100)}%` 
              : "Preparing Photogrammetry..."}
          </Text>
          <Text style={styles.processingSub}>This may take a few minutes depending on the device.</Text>
        </View>
      )}

      {/* Controls Container */}
      <View style={styles.controlsContainer}>
        <View style={{ width: 80 }} />

        <TouchableOpacity 
          style={[styles.captureButton, isCapturing && { backgroundColor: '#ff3b30' }]}
          onPress={handleCaptureToggle}
          disabled={isProcessing}
        >
          {isCapturing ? (
            <IconSymbol name="checkmark" size={32} color="#fff" />
          ) : (
            <IconSymbol name="camera.viewfinder" size={32} color="#fff" />
          )}
        </TouchableOpacity>
        
        <View style={{ width: 80 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanner: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    color: '#000',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 3,
  },
  logoImage: {
    width: 120,
    height: 34,
    marginBottom: 4,
  },
  logoSub: {
    color: '#fff',
    fontSize: 12,
    letterSpacing: 5,
    opacity: 0.8,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  secondaryButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 1,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  processingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
  },
  processingSub: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  progressBarContainer: {
    width: '70%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});
