import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export default function CustomCameraScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [timer, setTimer] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function toggleTimer() {
    setTimer(current => {
      if (current === 0) return 3;
      if (current === 3) return 10;
      return 0;
    });
  }

  const pickFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      router.replace({ 
        pathname: '/scan/occasion', 
        params: { imageUri: result.assets[0].uri } 
      });
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    if (timer > 0) {
      for (let i = timer; i > 0; i--) {
        setCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      // Clear countdown and wait for UI to fully render before hitting the camera hardware
      setCountdown(null);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    try {
      let photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        exif: true,
      });
      
      setCountdown(null); // Clear countdown AFTER taking the picture to prevent re-render crash
      
      if (photo && photo.uri) {
        // Go back to occasion screen with the new photo URI
        router.replace({ 
          pathname: '/scan/occasion', 
          params: { imageUri: photo.uri } 
        });
      }
    } catch (error) {
      console.error('Failed to take photo', error);
      setIsCapturing(false);
      setCountdown(null);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        
        {/* Top Controls Overlay */}
        <BlurView 
          intensity={80} 
          tint="systemUltraThinMaterialDark" 
          style={[styles.topControls, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <IconSymbol name="xmark" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.timerButton} onPress={toggleTimer}>
            <IconSymbol 
              name={timer === 0 ? "timer" : timer === 3 ? "timer" : "timer"} 
              size={20} 
              color={timer > 0 ? "#FFD700" : "#fff"} 
            />
            {timer > 0 && <Text style={styles.timerText}>{timer}s</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
            <IconSymbol name="camera.rotate" size={24} color="#fff" />
          </TouchableOpacity>
        </BlurView>

        {/* Huge Countdown Display */}
        <View style={[styles.countdownContainer, { opacity: countdown !== null ? 1 : 0 }]}>
          <Text style={styles.countdownText}>{countdown || ''}</Text>
        </View>

        {/* Bottom Controls Overlay */}
        <BlurView 
          intensity={80} 
          tint="systemUltraThinMaterialDark" 
          style={[styles.bottomControls, { paddingBottom: insets.bottom + 30 }]}
        >
          <TouchableOpacity style={styles.libraryButton} onPress={pickFromLibrary}>
            <IconSymbol name="photo.on.rectangle" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.captureButtonContainer} 
            onPress={takePicture}
            disabled={isCapturing || countdown !== null}
          >
            <View style={styles.captureButton}>
              {isCapturing && <ActivityIndicator color="#000" />}
            </View>
          </TouchableOpacity>
          
          {/* Empty view for flex balance */}
          <View style={{ width: 44 }} />
        </BlurView>
        
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  grantButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  grantButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  timerText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  captureButtonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
});
