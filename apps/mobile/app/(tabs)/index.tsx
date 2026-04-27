import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

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
            <Text style={styles.title}>WOVN</Text>
          </View>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.fill" size={24} color="#000" />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.scanButtonContainer}
          activeOpacity={0.8}
          onPress={() => router.push('/scan')}
        >
          <View style={styles.scanButtonInner}>
            <IconSymbol name="viewfinder" size={32} color="#fff" style={styles.scanIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scanButtonTitle}>New Body Scan</Text>
              <Text style={styles.scanButtonSubtitle}>Digitize your exact measurements</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#fff" style={styles.chevron} />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Scans</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>
        
        <View style={styles.grid}>
          {[1, 2].map((item) => (
            <View key={`scan-${item}`} style={styles.card}>
              <View style={styles.cardImagePlaceholder}>
                <IconSymbol name="figure.stand" size={40} color="#ccc" />
              </View>
              <Text style={styles.cardTitle}>Body Scan {item}</Text>
              <Text style={styles.cardDate}>Today</Text>
            </View>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>My Try-Ons</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {[1, 2, 3].map((item) => (
            <View key={`tryon-${item}`} style={styles.horizontalCard}>
              <View style={styles.horizontalCardPlaceholder}>
                <IconSymbol name="tshirt" size={32} color="#ddd" />
              </View>
              <Text style={styles.cardTitle}>Look {item}</Text>
            </View>
          ))}
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
  scanButtonContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 40,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  scanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  scanIcon: {
    marginRight: 16,
  },
  scanButtonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  scanButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  chevron: {
    marginLeft: 10,
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
