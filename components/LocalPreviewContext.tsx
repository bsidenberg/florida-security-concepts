'use client';
import { createContext } from 'react';
export const LocalPreviewContext = createContext(false);
export function LocalPreviewProvider({ local, children }: { local: boolean; children: React.ReactNode }) {
  return <LocalPreviewContext.Provider value={local}>{children}</LocalPreviewContext.Provider>;
}
