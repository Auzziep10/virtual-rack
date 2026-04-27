import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OCCASIONS = [
  'Casual',
  'Corporate',
  'Wedding',
  'Night Out',
  'Gym',
  'Mixer',
  'Lounge',
];

export default function OccasionScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: '#fafafa' }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { top: insets.top + 20 }]}>
        <Text style={styles.logo}>WOVN</Text>
        <Text style={styles.logoSub}>STUDIO</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 120 }]}
      >
        <Text style={styles.promptTitle}>Select an Occasion</Text>
        
        <View style={styles.listContainer}>
          {OCCASIONS.map((occasion) => (
            <TouchableOpacity 
              key={occasion} 
              style={styles.itemButton}
              activeOpacity={0.6}
              onPress={() => router.push({ pathname: '/scan/try-on', params: { occasion } })}
            >
              <Text style={styles.itemText}>{occasion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  promptTitle: {
    fontSize: 16,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 40,
    alignSelf: 'center',
  },
  listContainer: {
    alignItems: 'center',
    gap: 32,
  },
  itemButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  itemText: {
    fontFamily: 'Times New Roman',
    fontSize: 42,
    color: '#111',
    fontStyle: 'italic',
  },
});
