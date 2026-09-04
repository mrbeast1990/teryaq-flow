import { useEffect, useState } from "react";

export type PrintSettings = {
  pharmacyName: string;
  logoDataUrl: string;
  address: string;
  phone: string;
  secondaryLine: string;
  commercialText: string;
  footerNote: string;
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  pharmacyName: "صيدلية الترياق الشافي",
  logoDataUrl: "",
  address: "",
  phone: "",
  secondaryLine: "",
  commercialText: "",
  footerNote: "",
};

const STORAGE_KEY = "teryaq-flow-print-settings-v1";

export function readPrintSettings(): PrintSettings {
  if (typeof window === "undefined") return DEFAULT_PRINT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRINT_SETTINGS;
    return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PRINT_SETTINGS;
  }
}

export function savePrintSettings(settings: PrintSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("teryaq-print-settings-changed"));
}

export function usePrintSettings() {
  const [settings, setSettings] = useState<PrintSettings>(() => readPrintSettings());

  useEffect(() => {
    const refresh = () => setSettings(readPrintSettings());
    window.addEventListener("storage", refresh);
    window.addEventListener("teryaq-print-settings-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("teryaq-print-settings-changed", refresh);
    };
  }, []);

  return settings;
}
