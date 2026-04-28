import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';

// Prevent native splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

import { useColorScheme } from '@/hooks/use-color-scheme';
import { TaskProvider, useTasks } from './context/TaskContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function TaskOverlay() {
  const { activeTasks } = useTasks();
  const insets = useSafeAreaInsets();

  if (activeTasks.length === 0) return null;

  return (
    <View style={[styles.overlayContainer, { top: insets.top + 10 }]} pointerEvents="none">
      {activeTasks.map(task => (
        <View key={task.id} style={styles.taskPill}>
          {task.status === 'processing' && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
          <Text style={styles.taskText}>
            {task.status === 'processing' && `Synthesizing ${task.garmentName}...`}
            {task.status === 'done' && `Successfully saved ${task.garmentName}!`}
            {task.status === 'error' && `Failed to process ${task.garmentName}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AnimatedSplashScreen({ children }: { children: React.ReactNode }) {
  const [isAppReady, setAppReady] = useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simulate app loading/ready state
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAppReady) {
      // Hide native splash, our RN view takes over seamlessly
      SplashScreen.hideAsync();

      Animated.sequence([
        // 1. Shrink slightly (wind up)
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        // 2. Zoom aggressively and fade out
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 30, // Massive zoom
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            delay: 150, // wait slightly before fading
            useNativeDriver: true,
          })
        ])
      ]).start(() => {
        setAnimationComplete(true);
      });
    }
  }, [isAppReady]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {!isSplashAnimationComplete && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: opacity,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
            }
          ]}
          pointerEvents="none"
        >
          <Animated.Image
            source={require('../assets/images/wovn-logo-white.png')}
            style={{
              width: 200,
              height: 200,
              resizeMode: 'contain',
              transform: [{ scale: scale }],
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashScreen>
        <TaskProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scan" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="view-tryon" options={{ presentation: 'fullScreenModal', headerShown: false }} />
          </Stack>
        </TaskProvider>
        <StatusBar style="auto" />
      </AnimatedSplashScreen>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  taskText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  }
});
