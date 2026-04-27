import * as React from 'react';

import { RoomScannerViewProps } from './RoomScanner.types';

export default function RoomScannerView(props: RoomScannerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
