import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { previewModel } from '../../modules/room-scanner';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [tryOns, setTryOns] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

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
      async function fetchProfile() {
        try {
          const docRef = doc(db, 'users', 'prototype_user');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
      
      fetchTryOns();
      fetchScans();
      fetchProfile();
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

  const handleDeleteScan = (scanId: string) => {
    Alert.alert(
      "Delete Scan",
      "Are you sure you want to delete this 3D Body Scan? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'scans', scanId));
              setScans(prev => prev.filter(s => s.id !== scanId));
            } catch (error) {
              console.error("Error deleting scan:", error);
              Alert.alert("Error", "Failed to delete scan.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteTryOn = (tryOnId: string) => {
    Alert.alert(
      "Delete Try-On",
      "Are you sure you want to delete this virtual try-on image?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'tryOns', tryOnId));
              setTryOns(prev => prev.filter(t => t.id !== tryOnId));
            } catch (error) {
              console.error("Error deleting try-on:", error);
              Alert.alert("Error", "Failed to delete try-on.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Premium Light Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#ffffff', '#f4f4f8']}
          style={StyleSheet.absoluteFill}
        />
        {/* Ambient Glows */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowBottom} />
      </View>
      
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Image 
              source={require('../../assets/images/wovn-logo.png')} 
              style={styles.logoImage} 
              contentFit="contain" 
              tintColor="#000000"
            />
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
            <BlurView intensity={20} tint="light" style={styles.avatarContainer}>
              <Image 
                source={{ uri: userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' }} 
                style={styles.avatarImage} 
                contentFit="cover"
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Hero Actions */}
        <View style={styles.actionRow}>
          {/* Virtual Try-On - Primary Action */}
          <TouchableOpacity 
            style={styles.primaryActionWrapper}
            activeOpacity={0.8}
            onPress={() => router.push('/scan/camera')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            />
            <BlurView intensity={40} tint="light" style={styles.actionCardInner}>
              <View style={styles.iconWrapper}>
                <IconSymbol name="camera.viewfinder" size={32} color="#111" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionButtonTitle}>Virtual Try-On</Text>
                <Text style={styles.actionButtonSubtitle}>Snap a photo to try on clothes</Text>
              </View>
            </BlurView>
          </TouchableOpacity>

          {/* 3D Body Scan - Secondary Action */}
          <TouchableOpacity 
            style={styles.secondaryActionWrapper}
            activeOpacity={0.8}
            onPress={() => router.push('/scan')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            />
            <BlurView intensity={40} tint="light" style={styles.actionCardInnerSecondary}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0,0,0,0.05)', shadowOpacity: 0 }]}>
                <IconSymbol name="person.crop.circle.badge.plus" size={24} color="#555" />
              </View>
              <View style={styles.actionTextContainerSecondary}>
                <Text style={styles.actionButtonTitleSecondary}>3D Body Scan</Text>
              </View>
            </BlurView>
          </TouchableOpacity>

          {/* Live Brand Catalog Sandbox */}
          <TouchableOpacity 
            style={styles.secondaryActionWrapper}
            activeOpacity={0.8}
            onPress={() => router.push('/catalog')}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            />
            <BlurView intensity={40} tint="light" style={styles.actionCardInnerSecondary}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0,0,0,0.05)', shadowOpacity: 0 }]}>
                <IconSymbol name="cube.box" size={24} color="#555" />
              </View>
              <View style={styles.actionTextContainerSecondary}>
                <Text style={styles.actionButtonTitleSecondary}>Live Brand Catalog</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* My Try-Ons (Showcase Section) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Try-Ons</Text>
          <TouchableOpacity onPress={() => tryOns.length > 0 && router.push({ pathname: '/view-tryon', params: { tryOnId: tryOns[0].id } })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {tryOns.length > 0 ? (
            tryOns.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.tryOnCard}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/view-tryon', params: { tryOnId: item.id } })}
                onLongPress={() => handleDeleteTryOn(item.id)}
              >
                <Image 
                  source={item.imageUrl} 
                  style={styles.tryOnImage} 
                  contentFit="cover" 
                  transition={200}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.tryOnOverlay}
                >
                  <Text style={styles.tryOnTitle} numberOfLines={1}>{item.garmentName || 'New Look'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.tryOnCardEmpty}>
              <IconSymbol name="photo.on.rectangle.angled" size={40} color="rgba(0,0,0,0.15)" />
              <Text style={styles.emptyText}>No try-ons yet</Text>
            </View>
          )}
        </ScrollView>

        {/* My Scans (Technical Data) */}
        <View style={[styles.sectionHeader, { marginTop: 40 }]}>
          <Text style={styles.sectionTitle}>Body Scans</Text>
          <TouchableOpacity hitSlop={{top: 15, bottom: 15, left: 15, right: 15}} onPress={() => Alert.alert("Manage Scans", "To delete a 3D scan, simply long-press on it.")}>
            <Text style={styles.seeAll}>Manage</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.grid}>
          {scans.length > 0 ? (
            scans.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.scanCardWrapper}
                activeOpacity={0.8}
                onPress={() => handleScanPress(item)}
                onLongPress={() => handleDeleteScan(item.id)}
              >
                <BlurView intensity={40} tint="light" style={styles.scanCardInner}>
                  <View style={styles.scanIconContainer}>
                    {downloadingScan === item.id ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <IconSymbol name="cube.transparent" size={28} color="#111" />
                    )}
                  </View>
                  <View style={styles.scanTextContainer}>
                    <Text style={styles.scanCardTitle}>Scan {scans.length - index}</Text>
                    <Text style={styles.scanCardDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.scanCardWrapper, { width: '100%' }]}>
              <BlurView intensity={40} tint="light" style={[styles.scanCardInner, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
                <IconSymbol name="cube.transparent" size={24} color="rgba(0,0,0,0.3)" style={{ marginRight: 12 }} />
                <Text style={styles.emptyText}>No scans yet</Text>
              </BlurView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    transform: [{ scale: 1.5 }],
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    transform: [{ scale: 2 }],
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  greeting: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logoImage: {
    width: 130,
    height: 36,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  actionRow: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 40,
  },
  primaryActionWrapper: {
    width: '100%',
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  actionCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  actionCardInner: {
    flex: 1,
    padding: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionTextContainer: {
    marginTop: 12,
  },
  actionButtonTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  secondaryActionWrapper: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  actionCardInnerSecondary: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionTextContainerSecondary: {
    flex: 1,
  },
  actionButtonTitleSecondary: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingRight: 24,
    gap: 16,
  },
  tryOnCard: {
    width: 160,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tryOnImage: {
    width: '100%',
    height: '100%',
  },
  tryOnOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 16,
  },
  tryOnTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tryOnCardEmpty: {
    width: 160,
    height: 220,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
  },
  scanCardWrapper: {
    width: '100%',
    height: 72,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scanCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  scanIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  scanTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scanCardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    marginBottom: 4,
  },
  scanCardDate: {
    fontSize: 13,
    color: '#888',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
});
