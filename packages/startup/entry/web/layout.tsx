import React from 'react';

import { DefaultLayout as RawDefaultLayout } from '@Nuvio-MCP/ide-core-browser/lib/components';

export function DefaultLayout() {
  return <RawDefaultLayout topSlotDefaultSize={35} topSlotZIndex={2} />;
}
