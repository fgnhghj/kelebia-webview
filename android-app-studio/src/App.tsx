import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import Index from "./pages/Index";

const App = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Force show the status bar
      StatusBar.show();
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: "#2C2925" });
      StatusBar.setOverlaysWebView({ overlay: false });
    }
  }, []);

  return <Index />;
};

export default App;
