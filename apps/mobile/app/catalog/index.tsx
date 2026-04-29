import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { techPackDb, techPackAuth } from '../../lib/techPackFirebase';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

export default function BrandCatalogScreen() {
  const router = useRouter();
  const [techPacks, setTechPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechPacks = async () => {
      try {
        await signInAnonymously(techPackAuth);
        
        const q = query(
          collection(techPackDb, 'techPacks'),
          orderBy('updatedAt', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const packs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTechPacks(packs);
      } catch (error) {
        console.error("Error fetching tech packs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechPacks();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f4f4f8']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Brand Catalog</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>
        Real-time pipeline from the B2B Tech Pack Creator database.
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {techPacks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="cube.box" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No garments published yet.</Text>
            </View>
          ) : (
            techPacks.map((pack) => (
              <TouchableOpacity 
                key={pack.id} 
                style={styles.card}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: pack.imageUrl || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop' }} 
                  style={styles.cardImage} 
                  contentFit="cover" 
                />
                <BlurView intensity={60} tint="light" style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{pack.name || pack.packName || 'Untitled Garment'}</Text>
                  <Text style={styles.cardCompany}>{pack.companyId || pack.companyName || 'Unknown Brand'}</Text>
                  {pack.scannedModelUrl && (
                    <View style={styles.badge}>
                      <IconSymbol name="arkit" size={12} color="#000" />
                      <Text style={styles.badgeText}>3D Scan Available</Text>
                    </View>
                  )}
                </BlurView>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  subtitle: {
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    width: '100%',
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f4f4f4',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  cardCompany: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  }
});
