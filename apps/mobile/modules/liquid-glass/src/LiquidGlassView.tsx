import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

export type LiquidGlassViewProps = {
  cornerRadius?: number;
  tint?: 'light' | 'dark' | 'orange' | string;
  interactive?: boolean;
} & ViewProps;

const NativeView: React.ComponentType<LiquidGlassViewProps> = requireNativeViewManager('LiquidGlass');

export default function LiquidGlassView(props: LiquidGlassViewProps) {
  return <NativeView {...props} />;
}
