import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getGenerativeModel } from 'firebase/ai';
import { db, ai, storage } from '@/lib/firebase';

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
  
  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

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

  async function uriToBase64(uri: string): Promise<{ data: string; mimeType: string }> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const mimeType = blob.type || 'image/jpeg';
        resolve({
          data: base64data.split(',')[1],
          mimeType
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function uploadImageToFirebase(base64Str: string): Promise<string> {
    const match = base64Str.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return base64Str;
    const ext = match[1].split('/')[1] || 'png';
    const fileName = `tryons/img_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    const storageRef = ref(storage, fileName);
    await uploadString(storageRef, base64Str, 'data_url');
    return await getDownloadURL(storageRef);
  }

  const handleGarmentSelect = async (garment: Garment) => {
    setSelectedGarment(garment);
    
    if (!imageUri || !garment.image) {
      Alert.alert("Missing Media", "Make sure you took a photo and selected a garment.");
      return;
    }

    setIsGenerating(true);
    setResultImage(null); // Clear previous result

    try {
      // 1. Prepare Images
      const baseResult = await uriToBase64(imageUri);
      const garmentResult = await uriToBase64(garment.image);

      // 2. Call Gemini
      const model = getGenerativeModel(ai, { model: "gemini-2.5-flash-image" });
      
      const parts: any[] = [
        { text: "TASK: Virtual Try-On.\nCRITICAL CONSTRAINTS:\n1. Apply the garment in the SECOND image to the person in the FIRST image realistically.\n2. Keep the exact background, face, and pose of the person in the FIRST image perfectly intact.\n3. Ensure the lighting and fabric textures match the environment." },
        { inlineData: { data: baseResult.data, mimeType: baseResult.mimeType } },
        { inlineData: { data: garmentResult.data, mimeType: garmentResult.mimeType } }
      ];

      const result = await model.generateContent(parts);
      const response = result.response;
      const candidates = response.candidates;
      
      let base64Output = null;
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content?.parts || []) {
          if (part.inlineData) {
            base64Output = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
          }
        }
      }

      if (!base64Output) {
        throw new Error("No image generated from Gemini.");
      }

      // 3. Save to Firebase Storage
      const finalUrl = await uploadImageToFirebase(base64Output);
      
      // 4. Display result
      setResultImage(finalUrl);

    } catch (error) {
      console.error("AI Try-On Error:", error);
      Alert.alert("Try-On Failed", "Could not generate the image right now. Please try again.");
      setSelectedGarment(null); // Revert selection on failure
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background (User Scan or Final AI Output) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e8d8c8' }]}>
        {resultImage ? (
          <Image source={{ uri: resultImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}

        {/* Loading Overlays */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Loading wardrobe...</Text>
          </View>
        )}
        {isGenerating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8a2be2" />
            <Text style={styles.loadingText}>Synthesizing Try-On...</Text>
            <Text style={styles.loadingSubtext}>Gemini 2.5 Flash Image Model</Text>
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
