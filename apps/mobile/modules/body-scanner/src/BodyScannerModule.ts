import { requireNativeModule } from 'expo-modules-core';

const NativeModule = requireNativeModule('BodyScanner');

export default NativeModule;

export const previewModel = async (url: string) => {
  return await NativeModule.previewModel(url);
};
