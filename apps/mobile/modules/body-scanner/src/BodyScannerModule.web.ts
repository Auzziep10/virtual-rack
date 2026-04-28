import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './BodyScanner.types';

type BodyScannerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class BodyScannerModule extends NativeModule<BodyScannerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(BodyScannerModule, 'BodyScannerModule');
