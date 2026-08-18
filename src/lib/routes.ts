import type { Locale } from "./content";

export const routes: Record<Locale, { cv: string; annexes: string; pdf: string }> = {
  it: { cv: "/", annexes: "/annessi/", pdf: "/downloads/Paolo-Rossi-CV-it.pdf" },
  en: { cv: "/en/", annexes: "/en/appendices/", pdf: "/downloads/Paolo-Rossi-CV-en.pdf" },
  de: { cv: "/de/", annexes: "/de/anhaenge/", pdf: "/downloads/Paolo-Rossi-CV-de.pdf" }
};

