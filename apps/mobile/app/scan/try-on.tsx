import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { useTasks } from '../context/TaskContext';

interface Garment {
  id: string;
  name: string;
  type: string;
  occasion: string;
  color: string;
  image: string;
}

export default function TryOnScreen() {
  const params = useLocalSearchParams();
  const occasion = params.occasion || 'Casual';
  const imageUri = params.imageUri as string | undefined;
  const insets = useSafeAreaInsets();

  const [currentImageUri, setCurrentImageUri] = useState<string | undefined>(imageUri);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  
  const { activeTasks, cachedResults, dispatchTryOnTask, clearCache } = useTasks();

  useEffect(() => {
    async function fetchGarments() {
      try {
        const q = query(collection(db, 'garments'), where('occasion', '==', occasion));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Garment[];
        setGarments(fetched);
      } catch (error) {
        console.error("Error fetching garments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGarments();
  }, [occasion]);

  const handleGarmentSelect = async (garment: Garment) => {
    if (!currentImageUri || !garment.image) {
      Alert.alert("Missing Media", "Make sure you took a photo and selected a garment.");
      return;
    }

    setSelectedGarment(garment);

    // If already cached or currently processing, do nothing
    if (cachedResults[garment.id] || activeTasks.some(t => t.garmentId === garment.id)) {
      return;
    }

    dispatchTryOnTask(currentImageUri, garment);
  };

  const handleRegenerate = () => {
    if (selectedGarment && currentImageUri) {
      clearCache(selectedGarment.id);
      dispatchTryOnTask(currentImageUri, selectedGarment);
    }
  };

  // Determine what image to show
  let displayImage = currentImageUri;
  let isGenerating = false;

  if (selectedGarment) {
    if (cachedResults[selectedGarment.id]) {
      displayImage = cachedResults[selectedGarment.id];
    } else if (activeTasks.some(t => t.garmentId === selectedGarment.id)) {
      isGenerating = true;
    }
  }

  return (
    <View style={styles.container}>
      {/* Background (User Scan or Final AI Output) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e8d8c8' }]}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.photoPickerContainer}>
            <TouchableOpacity 
              style={styles.photoPickerButton}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert("You've refused to allow this app to access your photos!");
                  return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  quality: 1,
                });
                if (!result.canceled) {
                  setCurrentImageUri(result.assets[0].uri);
                }
              }}
            >
              <IconSymbol name="photo.on.rectangle" size={40} color="#000" />
              <Text style={styles.photoPickerText}>Choose from Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.photoPickerButton, { marginTop: 20 }]}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert("You've refused to allow this app to access your camera!");
                  return;
                }
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ['images'],
                  quality: 1,
                });
                if (!result.canceled) {
                  setCurrentImageUri(result.assets[0].uri);
                }
              }}
            >
              <IconSymbol name="camera" size={40} color="#000" />
              <Text style={styles.photoPickerText}>Take a Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Overlays */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading wardrobe...</Text>
          </View>
        )}
      </View>

      {/* Top Bar */}
      <View style={[styles.topBar, { top: insets.top + 20 }]}>
        <Text style={styles.logo}>WOVN</Text>
        <Text style={styles.logoSub}>STUDIO</Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 20 }]}
        onPress={() => router.back()}
      >
        <IconSymbol name="chevron.left" size={24} color="#000" />
      </TouchableOpacity>

      {/* Close Button */}
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 20 }]}
        onPress={() => router.navigate('/(tabs)')}
      >
        <IconSymbol name="xmark" size={24} color="#000" />
      </TouchableOpacity>

      {/* Garment Bubbles */}
      <View style={[styles.bubblesContainer, { marginTop: insets.top + 100 }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {garments.map((garment) => {
            const isSelected = selectedGarment?.id === garment.id;
            return (
              <TouchableOpacity
                key={garment.id}
                style={[
                  styles.bubble,
                  isSelected && styles.bubbleSelected,
                  { backgroundColor: '#f0f0f0' } // use a solid background for the image to sit on
                ]}
                onPress={() => handleGarmentSelect(garment)}
                disabled={isGenerating}
              >
                {garment.image ? (
                  <Image 
                    source={{ uri: garment.image }} 
                    style={styles.bubbleImage} 
                    resizeMode="cover" 
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: garment.color || '#ccc', borderRadius: 28 }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Redo Button */}
      {selectedGarment && cachedResults[selectedGarment.id] && (
        <TouchableOpacity 
          style={styles.redoButton}
          onPress={handleRegenerate}
        >
          <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
          <Text style={styles.redoButtonText}>Regenerate</Text>
        </TouchableOpacity>
      )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: 30,
    zIndex: 10,
  },
  logo: {
    color: '#000',
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 3,
  },
  logoSub: {
    color: '#000',
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
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bubblesContainer: {
    position: 'absolute',
    left: 20,
    bottom: 120, // Adjusted to make room for save button
    width: 70,
    zIndex: 10,
  },
  bubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  bubbleSelected: {
    borderWidth: 4,
    borderColor: '#8a2be2',
    transform: [{ scale: 1.1 }],
  },
  redoButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  photoPickerButton: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  photoPickerText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
