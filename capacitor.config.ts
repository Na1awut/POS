import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antigravity.posplus',
  appName: 'POSplus',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['pos-production-17a6.up.railway.app'],
  },
};

export default config;
