import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './RoomScanner.types';

type RoomScannerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class RoomScannerModule extends NativeModule<RoomScannerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(RoomScannerModule, 'RoomScannerModule');
