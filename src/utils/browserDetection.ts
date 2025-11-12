export const isFirefox = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return navigator.userAgent.toLowerCase().includes("firefox");
};
