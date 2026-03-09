import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.aymen.isetclassroom',
  appName: 'ISET Classroom',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: ['isetkl-classroom.gleeze.com', '*.gleeze.com']
  },
  android: {
    backgroundColor: '#1A1714',
    allowMixedContent: true,
    overrideUserAgent: 'ISETClassroom Android App v2',
    webContentsDebuggingEnabled: false
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1A1714',
      overlaysWebView: false
    }
  }
};

export default config;
