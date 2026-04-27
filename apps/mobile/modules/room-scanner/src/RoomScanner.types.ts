import type { StyleProp, ViewStyle } from 'react-native';

export type OnModelReadyEventPayload = {
  uri: string;
  path: string;
};

export type OnErrorEventPayload = {
  message: string;
};

export type OnProgressEventPayload = {
  progress: number;
};

export type RoomScannerViewProps = {
  onModelReady?: (event: { nativeEvent: OnModelReadyEventPayload }) => void;
  onError?: (event: { nativeEvent: OnErrorEventPayload }) => void;
  onProgress?: (event: { nativeEvent: OnProgressEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
