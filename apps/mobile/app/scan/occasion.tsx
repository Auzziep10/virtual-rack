import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
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

const { height } = Dimensions.get('window');
const ITEM_HEIGHT = 60;

export default function OccasionScreen() {
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string | undefined;

  const [selectedIndex, setSelectedIndex] = useState(3); // Night Out
  const insets = useSafeAreaInsets();

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    if (index !== selectedIndex && index >= 0 && index < OCCASIONS.length) {
      setSelectedIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Simulated Camera Background / Photo */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e8d8c8' }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
      </View>
      
      {/* Heavy Blur Overlay */}
      <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill}>
        
        {/* Top Bar */}
        <View style={[styles.topBar, { top: insets.top + 20 }]}>
          <Text style={styles.logo}>WOVN</Text>
          <Text style={styles.logoSub}>STUDIO</Text>
        </View>

        {/* Picker Container */}
        <View style={styles.pickerContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingVertical: (height / 2) - (ITEM_HEIGHT / 2),
            }}
          >
            {OCCASIONS.map((occasion, index) => {
              const isSelected = index === selectedIndex;
              return (
                <TouchableOpacity 
                  key={occasion} 
                  style={styles.itemContainer}
                  onPress={() => router.push({ pathname: '/scan/try-on', params: { occasion, imageUri } })}
                >
                  <Text 
                    style={[
                      styles.itemText, 
                      isSelected && styles.itemTextSelected
                    ]}
                  >
                    {occasion}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </BlurView>
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
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -height / 4, // Shift the whole wheel up so it doesn't overlap the bottom
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Times New Roman', // Mocking serif font
    fontSize: 36,
    color: 'rgba(100, 90, 80, 0.4)',
  },
  itemTextSelected: {
    fontSize: 42,
    color: '#000',
    fontStyle: 'italic',
  },
});
