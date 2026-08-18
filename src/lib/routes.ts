import type { Locale } from "./content";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function withBase(pathname: string): string {
  const absolutePath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath}${absolutePath}`;
}

export const routes: Record<Locale, { cv: string; annexes: string; pdf: string }> = {
  it: { cv: withBase("/"), annexes: withBase("/annessi/"), pdf: withBase("/downloads/Paolo-Rossi-CV-it.pdf") },
  en: { cv: withBase("/en/"), annexes: withBase("/en/appendices/"), pdf: withBase("/downloads/Paolo-Rossi-CV-en.pdf") },
  de: { cv: withBase("/de/"), annexes: withBase("/de/anhaenge/"), pdf: withBase("/downloads/Paolo-Rossi-CV-de.pdf") }
};
