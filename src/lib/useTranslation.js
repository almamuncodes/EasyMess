import { translations } from "./translations";

export function useTranslation() {
  // Read dynamically from localStorage or cookies synchronously
  let lang = "en";
  if (typeof window !== "undefined") {
    lang = localStorage.getItem("lang") || "en";
  }

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  // Return a mock mounted status for compatibility
  return { t, lang, mounted: true };
}
