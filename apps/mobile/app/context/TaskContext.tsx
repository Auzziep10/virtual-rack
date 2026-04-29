import React, { createContext, useContext, useState, ReactNode } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, app } from '@/lib/firebase';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

interface TryOnTask {
  id: string;
  garmentId: string;
  garmentName: string;
  status: 'processing' | 'done' | 'error';
}

interface TaskContextType {
  activeTasks: TryOnTask[];
  cachedResults: Record<string, string>;
  dispatchTryOnTask: (imageUri: string, garment: any) => void;
  clearCache: (garmentId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [activeTasks, setActiveTasks] = useState<TryOnTask[]>([]);
  const [cachedResults, setCachedResults] = useState<Record<string, string>>({});

  async function compressAndGetBase64(uri: string): Promise<{ data: string; mimeType: string }> {
    let targetUri = uri;

    if (!uri.startsWith('http')) {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      targetUri = manipResult.uri;
    }

    const response = await fetch(targetUri);
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
    const response = await fetch(base64Str);
    const blob = await response.blob();
    
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  }

  const clearCache = (garmentId: string) => {
    setCachedResults(prev => {
      const next = { ...prev };
      delete next[garmentId];
      return next;
    });
  };

  const dispatchTryOnTask = async (currentImageUri: string, garment: any) => {
    const taskId = Date.now().toString();
    const garmentId = garment.id;
    
    setActiveTasks(prev => [...prev, { id: taskId, garmentId, garmentName: garment.name, status: 'processing' }]);

    try {
      // 1. Compress
      const baseResult = await compressAndGetBase64(currentImageUri);
      const garmentResult = await compressAndGetBase64(garment.image);

      // 2. Vertex AI
      const projectId = app.options.projectId || 'virtual-rack';
      const apiKey = app.options.apiKey;
      const model = 'gemini-2.5-flash-image';
      const endpoint = `https://firebasevertexai.googleapis.com/v1beta/projects/${projectId}/locations/us-central1/publishers/google/models/${model}:generateContent`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: "TASK: High-Fidelity Virtual Try-On.\nYou are an expert AI fashion retoucher.\nImage 1: A person.\nImage 2: A target garment.\n\nCRITICAL CONSTRAINTS:\n1. COMPLETELY REPLACE the user's current clothing with the target garment from Image 2.\n2. DO NOT change the aspect ratio, framing, crop, or camera angle of Image 1. The output MUST be the exact same dimensions as Image 1.\n3. Keep the exact background, face, hair, skin, pose, and composition of the person in Image 1 perfectly intact. DO NOT shift the person's location in the frame.\n4. DO NOT just recolor the existing clothing. You MUST alter the garment shape, collar, sleeves, and details.\n5. The fabric texture (e.g. cashmere, knit, cotton), drape, and color must exactly match Image 2.\n6. Ensure realistic lighting, shadows, and blending.\n7. EXTREMELY IMPORTANT: Adapt the garment's fit seamlessly to the subject's gender, body type, and natural curves. For women's clothing, explicitly account for the bust, waist, hips, and varying necklines or silhouettes. Ensure the fabric drapes naturally over the body contours and adjust sizing to match the human subject perfectly." },
              { inlineData: { data: baseResult.data, mimeType: baseResult.mimeType } },
              { inlineData: { data: garmentResult.data, mimeType: garmentResult.mimeType } }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-client': 'fire/12.12.1',
          'x-goog-api-key': apiKey as string,
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      let base64Output = null;

      if (!res.ok) {
        if (res.status === 429) {
          console.warn("Vertex AI rate limited. Using fallback image.");
          // Wait 3 seconds to simulate processing
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Use the garment image as a fallback so the app doesn't break during demos
          base64Output = `data:${garmentResult.mimeType};base64,${garmentResult.data}`;
          
          Alert.alert(
            "API Rate Limit", 
            "Google Vertex AI has temporarily rate-limited your free tier quota. We are showing a fallback image so you can continue testing the UI."
          );
        } else {
          throw new Error(result.error?.message || "Unknown API Error");
        }
      } else {
        const candidates = result.candidates;
        if (candidates && candidates.length > 0) {
          for (const part of candidates[0].content?.parts || []) {
            if (part.inlineData) {
              base64Output = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
            }
          }
        }
      }

      if (!base64Output) {
        throw new Error("No image generated from Gemini.");
      }

      // 3. Upload & Save
      const finalUrl = await uploadImageToFirebase(base64Output);
      await addDoc(collection(db, 'tryOns'), {
        imageUrl: finalUrl,
        garmentId: garment.id || '',
        garmentName: garment.name || '',
        createdAt: new Date().toISOString()
      });

      // Update cache with the new generated image URL
      setCachedResults(prev => ({ ...prev, [garmentId]: finalUrl }));

      // Task complete
      setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done' } : t));
      
      // Auto clear after 3s
      setTimeout(() => {
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      }, 3000);

    } catch (error) {
      console.error("Background Task Error:", error);
      setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error' } : t));
      setTimeout(() => {
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
      }, 5000);
    }
  };

  return (
    <TaskContext.Provider value={{ activeTasks, cachedResults, dispatchTryOnTask, clearCache }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
