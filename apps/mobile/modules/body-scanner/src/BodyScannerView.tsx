import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { BodyScannerViewProps } from './BodyScanner.types';

const NativeView: React.ComponentType<BodyScannerViewProps> =
  requireNativeViewManager('BodyScannerRoomView');

const NativeEnvironmentView: React.ComponentType<BodyScannerViewProps> =
  requireNativeViewManager('BodyScannerNativeView');

export interface BodyScannerViewRef {
  startSession: () => Promise<void>;
  startCapturing: () => Promise<void>;
  stopSession: () => Promise<void>;
};

export const BodyScannerView = React.forwardRef<BodyScannerViewRef, BodyScannerViewProps>(
  function BodyScannerView(props, ref) {
    const nativeRef = React.useRef(null);

    React.useImperativeHandle(ref, () => ({
      async startSession() {
        if (nativeRef.current) {
          await (nativeRef.current as any).startSession();
        }
      },
      async startCapturing() {
        // Not implemented for Blueprint mode
      },
      async stopSession() {
        if (nativeRef.current) {
          await (nativeRef.current as any).stopSession();
        }
      }
    }));

    return <NativeView {...props} ref={nativeRef} />;
  }
);

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
