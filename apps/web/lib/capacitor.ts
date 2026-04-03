/**
 * Capacitor platform detection and native API bridge.
 *
 * All functions are safe to call on the web — they return sensible defaults
 * (false / "web") when Capacitor is not present. No Capacitor packages are
 * imported at the top level, so tree-shaking removes everything in a
 * standard web build.
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => "ios" | "android" | "web";
    };
  }
}

/** Returns `true` when running inside a Capacitor native shell. */
export function isCapacitor(): boolean {
  return (
    typeof window !== "undefined" &&
    window.Capacitor !== undefined &&
    window.Capacitor.isNativePlatform()
  );
}

/** Returns the current platform: `"ios"`, `"android"`, or `"web"`. */
export function getNativePlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined" || !window.Capacitor) {
    return "web";
  }
  return window.Capacitor.getPlatform();
}

/** Returns `true` when running on iOS inside Capacitor. */
export function isIOS(): boolean {
  return getNativePlatform() === "ios";
}

/** Returns `true` when running on Android inside Capacitor. */
export function isAndroid(): boolean {
  return getNativePlatform() === "android";
}
