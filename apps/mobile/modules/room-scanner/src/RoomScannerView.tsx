import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { RoomScannerViewProps } from './RoomScanner.types';

const NativeView: React.ComponentType<RoomScannerViewProps> =
  requireNativeViewManager('RoomScanner');

const NativeEnvironmentView: React.ComponentType<RoomScannerViewProps> =
  requireNativeViewManager('RoomScanner', 'EnvironmentScannerView');

export interface RoomScannerViewRef {
  startSession: () => Promise<void>;
  startCapturing: () => Promise<void>;
  stopSession: () => Promise<void>;
};

export const RoomScannerView = React.forwardRef<RoomScannerViewRef, RoomScannerViewProps>(
  function RoomScannerView(props, ref) {
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

export const EnvironmentScannerView = React.forwardRef<RoomScannerViewRef, RoomScannerViewProps>(
  function EnvironmentScannerView(props, ref) {
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
