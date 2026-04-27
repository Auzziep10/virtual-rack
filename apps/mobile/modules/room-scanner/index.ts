// Reexport the native module. On web, it will be resolved to RoomScannerModule.web.ts
// and on native platforms to RoomScannerModule.ts
export { default } from './src/RoomScannerModule';
export { RoomScannerView, EnvironmentScannerView } from './src/RoomScannerView';
export * from  './src/RoomScanner.types';
