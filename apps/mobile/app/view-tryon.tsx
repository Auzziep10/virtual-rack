import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, FlatList, Dimensions, ActivityIndicator, PanResponder, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const { width, height } = Dimensions.get('window');

interface TryOnItem {
  id: string;
  imageUrl: string;
  garmentName: string;
}

export default function ViewTryOnScreen() {
  const params = useLocalSearchParams();
  const tryOnId = params.tryOnId as string;
  const insets = useSafeAreaInsets();
  
  const [data, setData] = useState<TryOnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialIndex, setInitialIndex] = useState(0);

  // Swipe to dismiss logic
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only claim the gesture if the user is swiping vertically more than horizontally
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          // Swipe down threshold met
          router.back();
        }
      },
    })
  ).current;

  useEffect(() => {
    async function fetchTryOns() {
      try {
        const q = query(collection(db, 'tryOns'), orderBy('createdAt', 'desc'), limit(15));
        const querySnapshot = await getDocs(q);
        let fetched: TryOnItem[] = querySnapshot.docs.map(document => ({
          id: document.id,
          imageUrl: document.data().imageUrl,
          garmentName: document.data().garmentName || 'Try-On Result'
        }));

        // If the clicked image isn't in the list (e.g. it's older), add it to the front
        const foundIndex = fetched.findIndex(item => item.id === tryOnId);
        
        if (foundIndex === -1 && tryOnId) {
          const docRef = doc(db, 'tryOns', tryOnId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            fetched = [
              { id: docSnap.id, imageUrl: docSnap.data().imageUrl, garmentName: docSnap.data().garmentName || 'Try-On Result' },
              ...fetched
            ];
            setInitialIndex(0);
          }
        } else if (foundIndex !== -1) {
          setInitialIndex(foundIndex);
        }

        setData(fetched);
      } catch (error) {
        console.error("Error fetching try-ons:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTryOns();
  }, [tryOnId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <FlatList
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={data.length > 0 ? initialIndex : 0}
        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={{ width, height: '100%' }}>
            {/* Blurred background to fill empty space */}
            <Image 
              source={{ uri: item.imageUrl }} 
              style={StyleSheet.absoluteFill} 
              contentFit="cover" 
              blurRadius={40}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            
            {/* The actual image, perfectly contained so no cropping occurs */}
            <Image 
              source={{ uri: item.imageUrl }} 
              style={StyleSheet.absoluteFill} 
              contentFit="contain" 
            />
            
            {/* Minimal Bottom Controls */}
            <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity 
                style={styles.circleButton}
                onPress={() => Alert.alert("Garment Info", item.garmentName)}
              >
                <BlurView intensity={60} tint="light" style={styles.circleBlur}>
                  <IconSymbol name="info.circle" size={22} color="#111" />
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.pillButton}
                onPress={() => router.push({ pathname: '/scan/occasion', params: { imageUri: encodeURIComponent(item.imageUrl) } })}
              >
                <BlurView intensity={60} tint="light" style={styles.pillBlur}>
                  <IconSymbol name="sparkles" size={18} color="#111" />
                  <Text style={styles.pillText}>Try More</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Top Bar Area */}
      <View style={[styles.topBar, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <BlurView intensity={40} tint="light" style={styles.closeBlur}>
            <IconSymbol name="xmark" size={20} color="#000" />
          </BlurView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 10,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  circleBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  pillButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pillBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    gap: 8,
  },
  pillText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
  }
});
