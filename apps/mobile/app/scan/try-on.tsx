import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Animated, Dimensions } from 'react-native';
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
  const gender = params.gender || 'Men';
  const imageUri = params.imageUri as string | undefined;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const ITEM_HEIGHT = 80;
  
  // Calculate padding to perfectly center the first and last items in the available scroll view
  const listHeight = SCREEN_HEIGHT - insets.top - 100 - 120;
  const listPadding = Math.max(0, (listHeight - ITEM_HEIGHT) / 2);

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
        
        // Filter in JS to handle case-insensitivity and older garments without gender
        const filtered = fetched.filter(g => {
          const garmentGender = (g as any).gender?.toLowerCase() || 'men';
          return garmentGender === gender.toLowerCase();
        });
        
        setGarments(filtered);
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
            <ActivityIndicator size="large" color="#000" />
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
        <Image 
          source={require('../../assets/images/wovn-logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
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
      <View style={[styles.bubblesContainer, { top: insets.top + 100, zIndex: 5 }]}>
        <Animated.FlatList
          data={garments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={{ width: '100%' }}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: listPadding, paddingBottom: listPadding, alignItems: 'center' }}
          renderItem={({ item: garment, index }) => {
            const itemPosition = index * ITEM_HEIGHT;
            
            // Smoother rolodex fade and scale
            const opacity = scrollY.interpolate({
              inputRange: [
                itemPosition - ITEM_HEIGHT * 2,
                itemPosition - ITEM_HEIGHT,
                itemPosition,
                itemPosition + ITEM_HEIGHT,
                itemPosition + ITEM_HEIGHT * 2
              ],
              outputRange: [0, 0.4, 1, 0.4, 0],
              extrapolate: 'clamp',
            });

            const scale = scrollY.interpolate({
              inputRange: [
                itemPosition - ITEM_HEIGHT * 2,
                itemPosition - ITEM_HEIGHT,
                itemPosition,
                itemPosition + ITEM_HEIGHT,
                itemPosition + ITEM_HEIGHT * 2
              ],
              outputRange: [0.6, 0.8, 1, 0.8, 0.6],
              extrapolate: 'clamp',
            });
            
            const translateX = scrollY.interpolate({
              inputRange: [
                itemPosition - ITEM_HEIGHT * 2,
                itemPosition - ITEM_HEIGHT,
                itemPosition,
                itemPosition + ITEM_HEIGHT,
                itemPosition + ITEM_HEIGHT * 2
              ],
              outputRange: [30, 15, 0, 15, 30],
              extrapolate: 'clamp',
            });

            const isSelected = selectedGarment?.id === garment.id;
            return (
              <Animated.View style={{ opacity, transform: [{ scale }, { translateX }] }}>
                <TouchableOpacity
                  style={[
                    styles.bubble,
                    isSelected && styles.bubbleSelected,
                    { backgroundColor: '#f0f0f0' }
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
              </Animated.View>
            );
          }}
        />
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
  );
}

const styles = StyleSheet.create({
  container: {
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
    left: -5,
    bottom: 120, // Adjusted to make room for save button
    width: 120,
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
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  bubbleSelected: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
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
