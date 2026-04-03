import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.masar.app",
  appName: "Masar",
  // Remote URL — the app loads the production web app inside a native WebView.
  // No static export needed; all server features (auth, API, SSR) work as-is.
  server: {
    url: "https://app-masar.com",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#09090b", // zinc-950 — matches app dark background
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashImmersive: true,
    },
    StatusBar: {
      // Style is controlled at runtime via @capacitor/status-bar plugin
      // to match the app's current theme (light/dark)
      overlaysWebView: false,
    },
    Keyboard: {
      // Resize the WebView when the keyboard appears (important for forms)
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  // Android-specific overrides
  android: {
    // Allow mixed content for dev (disabled in prod by cleartext: false above)
    allowMixedContent: false,
    backgroundColor: "#09090b",
  },
  // iOS-specific overrides
  ios: {
    contentInset: "automatic",
    backgroundColor: "#09090b",
    preferredContentMode: "mobile",
    scrollEnabled: true,
  },
};

export default config;
