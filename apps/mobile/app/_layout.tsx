import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <TaskProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="view-tryon" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        </Stack>
        <TaskOverlay />
      </TaskProvider>
      <StatusBar style="auto" />
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
