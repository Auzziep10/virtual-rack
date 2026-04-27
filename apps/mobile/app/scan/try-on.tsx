import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Mock Garments for the selected occasion
const MOCK_GARMENTS = [
  { id: '1', type: 'top', color: '#f5f5dc', name: 'Beige Sweater', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=200&q=80' },
  { id: '2', type: 'bottom', color: '#1a1a24', name: 'Dark Denim', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=200&q=80' },
  { id: '3', type: 'top', color: '#ffffff', name: 'White Blouse', image: 'https://images.unsplash.com/photo-1564222256577-45e728f2c611?auto=format&fit=crop&w=200&q=80' },
  { id: '4', type: 'bottom', color: '#a8b5c8', name: 'Light Trousers', image: '' },
  { id: '5', type: 'dress', color: '#000000', name: 'Black Dress', image: '' },
];

export default function TryOnScreen() {
  const params = useLocalSearchParams();
  const occasion = params.occasion || 'Casual';
  const imageUri = params.imageUri as string | undefined;
  const insets = useSafeAreaInsets();

  const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleGarmentSelect = async (garmentId: string) => {
    setSelectedGarment(garmentId);
    
    // --- AI API Integration Stub ---
    // The user will provide the API endpoint for the image-to-image pipeline.
    // Example Payload expected:
    // {
    //   "user_image": "base64_string_or_url",
    //   "garment_image": "garment_url_or_id",
    //   "category": "upper_body" // or lower_body, dress
    // }
    
    setIsGenerating(true);
    try {
      // Simulating network delay for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Fake success
      Alert.alert("AI Generation Simulated", `Applied ${MOCK_GARMENTS.find(g => g.id === garmentId)?.name} to avatar!`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate try-on image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background (User Scan) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e8d8c8' }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        {isGenerating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Generating fit...</Text>
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
          {MOCK_GARMENTS.map((garment) => {
            const isSelected = selectedGarment === garment.id;
            return (
              <TouchableOpacity
                key={garment.id}
                style={[
                  styles.bubble,
                  isSelected && styles.bubbleSelected,
                  { backgroundColor: '#f0f0f0' } // use a solid background for the image to sit on
                ]}
                onPress={() => handleGarmentSelect(garment.id)}
              >
                {garment.image ? (
                  <Image 
                    source={{ uri: garment.image }} 
                    style={styles.bubbleImage} 
                    resizeMode="cover" 
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: garment.color, borderRadius: 28 }]} />
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
