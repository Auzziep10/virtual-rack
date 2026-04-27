import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

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

  const handleGarmentSelect = (garment: Garment) => {
    setSelectedGarment(garment);
  };

  return (
    <View style={styles.container}>
      {/* Background (User Scan) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e8d8c8' }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}

        {/* Paper Doll Try-On Overlay Effect */}
        {selectedGarment && selectedGarment.image ? (
          <Image 
            source={{ uri: selectedGarment.image }} 
            style={styles.paperDollOverlay} 
            resizeMode="contain" 
          />
        ) : null}

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

      {/* Save Button */}
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={() => {
          Alert.alert("Saved!", "Outfit saved to your virtual closet.");
          router.navigate('/(tabs)');
        }}
      >
        <Text style={styles.saveButtonText}>Save to Closet</Text>
      </TouchableOpacity>
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  paperDollOverlay: {
    position: 'absolute',
    width: '80%',
    height: '60%',
    top: '25%',
    alignSelf: 'center',
    zIndex: 2,
    opacity: 0.95,
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
  saveButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    zIndex: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
