import * as React from 'react';

import { BodyScannerViewProps } from './BodyScanner.types';

export default function BodyScannerView(props: BodyScannerViewProps) {
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
