// Reexport the native module. On web, it will be resolved to BodyScannerModule.web.ts
// and on native platforms to BodyScannerModule.ts
export { default, previewModel } from './src/BodyScannerModule';
export { BodyScannerNativeView } from './src/BodyScannerView';
export * from  './src/BodyScanner.types';
