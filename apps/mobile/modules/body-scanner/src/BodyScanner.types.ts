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

export type OnStateChangeEventPayload = {
  state: string;
};

export type BodyScannerViewProps = {
  onModelReady?: (event: { nativeEvent: OnModelReadyEventPayload }) => void;
  onError?: (event: { nativeEvent: OnErrorEventPayload }) => void;
  onProgress?: (event: { nativeEvent: OnProgressEventPayload }) => void;
  onStateChange?: (event: { nativeEvent: OnStateChangeEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
