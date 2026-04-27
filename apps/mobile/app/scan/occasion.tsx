import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';

const OCCASIONS = [
  'Casual',
  'Corporate',
  'Athleisure',
  'Night Out',
  'Formal',
  'Lounge',
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 80;

export default function OccasionScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [gender, setGender] = useState<'Men' | 'Women'>('Men');

  // Calculate padding so first and last items can be centered
  const halfScreen = SCREEN_HEIGHT / 2;
  const listPadding = halfScreen - (ITEM_HEIGHT / 2) - 40; // 40 is a slight offset for visual balance

  return (
    <View style={[styles.container, { backgroundColor: '#fafafa' }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { top: insets.top + 20 }]}>
        <Image 
          source={require('../../assets/images/wovn-logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
        <Text style={styles.logoSub}>STUDIO</Text>
      </View>

      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 20 }]}
        onPress={() => router.back()}
      >
        <IconSymbol name="chevron.left" size={24} color="#000" />
      </TouchableOpacity>

      {/* Gender Toggle */}
      <View style={[styles.genderToggle, { top: insets.top + 70 }]}>
        <TouchableOpacity 
          style={[styles.genderOption, gender === 'Men' && styles.genderOptionActive]}
          onPress={() => setGender('Men')}
        >
          <Text style={[styles.genderText, gender === 'Men' && styles.genderTextActive]}>Men</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.genderOption, gender === 'Women' && styles.genderOptionActive]}
          onPress={() => setGender('Women')}
        >
          <Text style={[styles.genderText, gender === 'Women' && styles.genderTextActive]}>Women</Text>
        </TouchableOpacity>
      </View>

      <Animated.Text 
        style={[
          styles.promptTitle, 
          { 
            top: insets.top + 130,
            opacity: scrollY.interpolate({
              inputRange: [0, ITEM_HEIGHT / 2],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            })
          }
        ]}
      >
        Select an Occasion
      </Animated.Text>

      <Animated.FlatList
        data={OCCASIONS}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: listPadding,
          paddingBottom: listPadding,
        }}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 2) * ITEM_HEIGHT,
            (index - 1) * ITEM_HEIGHT,
            index * ITEM_HEIGHT,
            (index + 1) * ITEM_HEIGHT,
            (index + 2) * ITEM_HEIGHT,
          ];

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.6, 0.8, 1.15, 0.8, 0.6],
            extrapolate: 'clamp',
          });

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0, 0.25, 1, 0.25, 0],
            extrapolate: 'clamp',
          });

          const translateY = scrollY.interpolate({
            inputRange,
            outputRange: [30, 15, 0, -15, -30],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.itemContainer,
                {
                  transform: [{ scale }, { translateY }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/scan/try-on', params: { occasion: item, gender } })}
              >
                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
      
      {/* Selection Indicator (Subtle Center Highlight) */}
      <View style={styles.selectionIndicator} pointerEvents="none" />
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
  logoImage: {
    width: 120,
    height: 34,
    marginBottom: 4,
  },
  logoSub: {
    color: '#000',
    fontSize: 12,
    letterSpacing: 5,
    opacity: 0.8,
  },
  backButton: {
    position: 'absolute',
    right: 30, // Aligning to the right to balance the WOVN logo on the left
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptTitle: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 2,
    zIndex: 5,
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Times New Roman',
    fontSize: 42,
    color: '#111',
    fontStyle: 'italic',
  },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    marginTop: -40,
    width: '100%',
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: -1,
  },
  genderToggle: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    zIndex: 10,
  },
  genderOption: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genderOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#fff',
  },
});
