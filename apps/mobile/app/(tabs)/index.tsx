import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { previewModel } from '../../modules/room-scanner';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [tryOns, setTryOns] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchTryOns() {
        try {
          const q = query(collection(db, 'tryOns'), orderBy('createdAt', 'desc'), limit(10));
          const querySnapshot = await getDocs(q);
          const fetched = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTryOns(fetched);
        } catch (error) {
          console.error("Error fetching try-ons:", error);
        }
      }

      async function fetchScans() {
        try {
          const q = query(collection(db, 'scans'), orderBy('createdAt', 'desc'), limit(4));
          const querySnapshot = await getDocs(q);
          const fetched = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setScans(fetched);
        } catch (error) {
          console.error("Error fetching scans:", error);
        }
      }
      
      fetchTryOns();
      fetchScans();
    }, [])
  );

  const [downloadingScan, setDownloadingScan] = useState<string | null>(null);

  const handleScanPress = async (scan: any) => {
    if (!scan.objUrl) return;
    
    setDownloadingScan(scan.id);
    try {
      await previewModel(scan.objUrl);
    } catch (error) {
      console.error('Error previewing scan:', error);
      alert('Failed to load 3D scan. Please try again.');
    } finally {
      setDownloadingScan(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fafafa', '#f0f0f5']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Image 
              source={require('../../assets/images/wovn-logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
          </View>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.fill" size={24} color="#000" />
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#8a2be2' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/scan/occasion')}
          >
            <IconSymbol name="tshirt.fill" size={28} color="#fff" style={{ marginBottom: 12 }} />
            <Text style={styles.actionButtonTitle}>Virtual Try-On</Text>
            <Text style={styles.actionButtonSubtitle}>Select Occasion</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#000' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/scan')}
          >
            <IconSymbol name="viewfinder" size={28} color="#fff" style={{ marginBottom: 12 }} />
            <Text style={styles.actionButtonTitle}>3D Body Scan</Text>
            <Text style={styles.actionButtonSubtitle}>Get sizing .obj</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Scans</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>
        
        <View style={styles.grid}>
          {scans.length > 0 ? (
            scans.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handleScanPress(item)}
              >
                <View style={styles.cardImagePlaceholder}>
                  {downloadingScan === item.id ? (
                    <ActivityIndicator size="small" color="#8a2be2" />
                  ) : (
                    <IconSymbol name="cube.transparent" size={40} color="#8a2be2" />
                  )}
                </View>
                <Text style={styles.cardTitle}>Body Scan {scans.length - index}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.card, { width: '100%' }]}>
              <View style={styles.cardImagePlaceholder}>
                <IconSymbol name="cube.transparent" size={40} color="#ccc" />
              </View>
              <Text style={styles.cardTitle}>No Scans Yet</Text>
              <Text style={styles.cardDate}>Tap 3D Body Scan to start</Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>My Try-Ons</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {tryOns.length > 0 ? (
            tryOns.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.horizontalCard}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/view-tryon', params: { uri: encodeURIComponent(item.imageUrl), garmentName: item.garmentName } })}
              >
                <Image 
                  source={{ uri: item.imageUrl }} 
                  style={styles.horizontalCardImage} 
                  resizeMode="cover" 
                />
                <Text style={styles.cardTitle}>{item.garmentName || 'New Look'}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.horizontalCard}>
              <View style={styles.horizontalCardPlaceholder}>
                <IconSymbol name="tshirt" size={32} color="#ddd" />
              </View>
              <Text style={styles.cardTitle}>No Try-Ons yet</Text>
            </View>
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -1,
  },
  logoImage: {
    width: 140,
    height: 40,
    marginTop: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 48 - 16) / 2, // Half width minus padding and gap
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImagePlaceholder: {
    height: 140,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingRight: 24, // extra padding at end
    gap: 16,
  },
  horizontalCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  horizontalCardPlaceholder: {
    height: 160,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalCardImage: {
    height: 160,
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardDate: {
    fontSize: 13,
    color: '#888',
  },
});
