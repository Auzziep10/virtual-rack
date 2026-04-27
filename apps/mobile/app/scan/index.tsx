import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { EnvironmentScannerView, RoomScannerViewRef } from '../../modules/room-scanner';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Alert } from 'react-native';

export default function ScanningScreen() {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scannerRef = useRef<RoomScannerViewRef>(null);

  useEffect(() => {
    // Start the object capture session shortly after mount to ensure native view is ready
    const timer = setTimeout(() => {
      if (scannerRef.current) {
        scannerRef.current.startSession();
      }
    }, 500);

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      clearTimeout(timer);
      // Stop the session on unmount to save battery
      if (scannerRef.current) {
        scannerRef.current.stopSession();
      }
    };
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 600],
  });

  const handleCapture = () => {
    if (scannerRef.current) {
      scannerRef.current.startCapturing();
    }
  };

  const handleModelReady = async (event: any) => {
    const objUri = event.nativeEvent.uri;
    console.log("Model ready at", objUri);
    
    try {
      Alert.alert("Uploading", "Saving your 3D body scan...");
      
      // Fetch the local .obj file as a Blob
      const response = await fetch(objUri);
      const blob = await response.blob();
      
      const fileName = `scans/body_${Date.now()}_${Math.random().toString(36).substring(7)}.obj`;
      const storageRef = ref(storage, fileName);
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      Alert.alert("Success", "3D Scan saved successfully!");
      console.log("Uploaded obj URL:", downloadUrl);
      
      // Return to dashboard after saving
      router.navigate('/(tabs)');
    } catch (error) {
      console.error("Failed to upload .obj:", error);
      Alert.alert("Error", "Could not save the 3D scan.");
      router.navigate('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <EnvironmentScannerView 
        ref={scannerRef} 
        style={styles.scanner} 
        onModelReady={handleModelReady}
      />
      
      {/* Animated Scan Line */}
      <Animated.View style={[styles.scanLineContainer, { transform: [{ translateY }] }]} pointerEvents="none">
        <View style={styles.scanLine} />
        <View style={styles.scanGlow} />
      </Animated.View>

      {/* Grid Overlay Rings (Simulated Cylinder) */}
      <View style={styles.gridContainer} pointerEvents="none">
        {[100, 200, 300, 400, 500, 600, 700].map((y) => (
          <View key={y} style={[styles.gridRing, { top: y }]} />
        ))}
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>WOVN</Text>
        <Text style={styles.logoSub}>STUDIO</Text>
      </View>

      {/* Controls Container */}
      <View style={styles.controlsContainer}>
        <View style={{ width: 80 }} />

        <TouchableOpacity 
          style={styles.captureButton}
          onPress={handleCapture}
        >
          <IconSymbol name="camera.viewfinder" size={32} color="#fff" />
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
    top: 60,
    left: 30,
    zIndex: 10,
  },
  logo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 3,
  },
  logoSub: {
    color: '#fff',
    fontSize: 12,
    letterSpacing: 5,
    opacity: 0.8,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    opacity: 0.3,
  },
  gridRing: {
    position: 'absolute',
    width: '70%',
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#fff',
    transform: [{ scaleY: 0.3 }], // Make it look like an ellipse
  },
  scanLineContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  scanLine: {
    width: '75%',
    height: 2,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  scanGlow: {
    position: 'absolute',
    width: '70%',
    height: 40,
    top: -20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
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
});
