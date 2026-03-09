import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.isetclassroom',
  appName: 'Kelebia Classroom',
  webDir: 'dist',
  server: {
    cleartext: false,
    allowNavigation: ['isetkl-classroom.gleeze.com', '*.gleeze.com']
  },
  android: {
    backgroundColor: '#2C2925',
    allowMixedContent: true,
    overrideUserAgent: 'KelebiaClassroom Android App',
    webContentsDebuggingEnabled: false
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2C2925',
      overlaysWebView: false
    }
  }
};

export default config;
