import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ViewTryOnScreen() {
  const params = useLocalSearchParams();
  const uri = params.uri as string;
  const garmentName = params.garmentName as string || 'Try-On Result';
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
      ) : null}

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
