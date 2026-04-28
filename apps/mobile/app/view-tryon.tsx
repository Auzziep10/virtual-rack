import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const { width, height } = Dimensions.get('window');

interface TryOnItem {
  id: string;
  imageUrl: string;
  garmentName: string;
}

export default function ViewTryOnScreen() {
  const params = useLocalSearchParams();
  const initialUri = decodeURIComponent(params.uri as string || '');
  const initialGarmentName = params.garmentName as string || 'Try-On Result';
  const insets = useSafeAreaInsets();
  
  const [data, setData] = useState<TryOnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialIndex, setInitialIndex] = useState(0);

  useEffect(() => {
    async function fetchTryOns() {
      try {
        const q = query(collection(db, 'tryOns'), orderBy('createdAt', 'desc'), limit(15));
        const querySnapshot = await getDocs(q);
        let fetched: TryOnItem[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          imageUrl: doc.data().imageUrl,
          garmentName: doc.data().garmentName || 'Try-On Result'
        }));

        // If the clicked image isn't in the list (e.g. it's older), add it to the front
        const foundIndex = fetched.findIndex(item => item.imageUrl === initialUri);
        
        if (foundIndex === -1 && initialUri) {
          fetched = [
            { id: 'initial', imageUrl: initialUri, garmentName: initialGarmentName },
            ...fetched
          ];
          setInitialIndex(0);
        } else if (foundIndex !== -1) {
          setInitialIndex(foundIndex);
        }

        setData(fetched);
      } catch (error) {
        console.error("Error fetching try-ons:", error);
        // Fallback to just showing the initial image
        if (initialUri) {
          setData([{ id: 'initial', imageUrl: initialUri, garmentName: initialGarmentName }]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTryOns();
  }, [initialUri, initialGarmentName]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Image 
              source={{ uri: item.imageUrl }} 
              style={StyleSheet.absoluteFill} 
              contentFit="cover" 
            />
            
            {/* Bottom Info Area Per Image */}
            <View style={[styles.bottomInfoContainer, { paddingBottom: insets.bottom + 20 }]}>
              <BlurView intensity={60} tint="extraLight" style={styles.bottomBlur}>
                <Text style={styles.garmentName} numberOfLines={1}>{item.garmentName}</Text>
                <TouchableOpacity 
                  style={styles.tryMoreButton}
                  onPress={() => router.push({ pathname: '/scan/occasion', params: { imageUri: item.imageUrl } })}
                >
                  <Text style={styles.tryMoreText}>Try More on this Photo</Text>
                </TouchableOpacity>
              </BlurView>
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
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  bottomBlur: {
    borderRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  garmentName: {
    color: '#111',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  tryMoreButton: {
    backgroundColor: '#111',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tryMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
