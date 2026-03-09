import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.isetclassroom',
  appName: 'ISET Classroom',
  webDir: 'dist',
  server: {
    cleartext: false,
    allowNavigation: ['isetkl-classroom.gleeze.com', '*.gleeze.com']
  },
  android: {
    backgroundColor: '#1a1714',
    allowMixedContent: true,
    overrideUserAgent: 'ISETClassroom Android App',
    // Explicitly disable edge-to-edge / fullscreen
    webContentsDebuggingEnabled: false
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1714',
      overlaysWebView: false
    }
  }
};

export default config;
