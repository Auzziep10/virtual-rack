import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { BodyScannerViewProps } from './BodyScanner.types';

const NativeEnvironmentView: React.ComponentType<BodyScannerViewProps> =
  requireNativeViewManager('BodyScanner', 'BodyScannerNativeView');

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
        if (nativeRef.current) {
          await (nativeRef.current as any).startSession();
        }
      },
      async startCapturing() {
        if (nativeRef.current) {
          await (nativeRef.current as any).startCapturing();
        }
      },
      async stopSession() {
        if (nativeRef.current) {
          await (nativeRef.current as any).stopSession();
        }
      }
    }));

    return <NativeEnvironmentView {...props} ref={nativeRef} />;
  }
);
