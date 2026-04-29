import { requireNativeViewManager, requireNativeModule } from 'expo-modules-core';
import * as React from 'react';
import { findNodeHandle } from 'react-native';

import { BodyScannerViewProps } from './BodyScanner.types';

const NativeEnvironmentView: React.ComponentType<BodyScannerViewProps> =
  requireNativeViewManager('BodyScanner', 'BodyScannerNativeView');

const BodyScannerModule = requireNativeModule('BodyScanner');

export interface BodyScannerViewRef {
  startSession: () => Promise<void>;
  startCapturing: () => Promise<void>;
  stopSession: () => Promise<void>;
};

export const BodyScannerNativeView = React.forwardRef<BodyScannerViewRef, BodyScannerViewProps>(
  function BodyScannerNativeView(props, ref) {
    const nativeRef = React.useRef(null);

    React.useImperativeHandle(ref, () => ({
      async startSession() {
        const tag = findNodeHandle(nativeRef.current);
        if (tag) {
          await BodyScannerModule.startSession(tag);
        }
      },
      async startCapturing() {
        const tag = findNodeHandle(nativeRef.current);
        if (tag) {
          await BodyScannerModule.startCapturing(tag);
        }
      },
      async stopSession() {
        const tag = findNodeHandle(nativeRef.current);
        if (tag) {
          await BodyScannerModule.stopSession(tag);
        }
      }
    }));

    return <NativeEnvironmentView {...props} ref={nativeRef} />;
  }
);
