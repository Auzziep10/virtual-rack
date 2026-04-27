import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ViewTryOnScreen() {
  const params = useLocalSearchParams();
  const uri = params.uri ? decodeURIComponent(params.uri as string) : null;
  const garmentName = params.garmentName as string || 'Try-On Result';
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
      ) : (
        <Text style={{ color: 'red', marginTop: 100, textAlign: 'center' }}>No URI provided</Text>
      )}
      
      {/* DEBUG TEXT - REMOVE LATER */}
      <View style={{ position: 'absolute', top: 100, left: 20, right: 20, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 }}>
        <Text style={{ color: 'yellow', fontSize: 10 }}>URI: {uri}</Text>
        <Text style={{ color: 'yellow', fontSize: 10 }}>Raw Param: {params.uri}</Text>
      </View>

      {/* Top Bar Area */}
      <View style={[styles.topBar, { top: insets.top + 20 }]}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="xmark" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info Area */}
      <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.garmentName}>{garmentName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  garmentName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  }
});
