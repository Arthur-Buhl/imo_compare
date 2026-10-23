import type { Tri } from '../types';

/** Parse tous les blocs JSON-LD de la page. */
export function readJsonLd(doc: Document): unknown[] {
  const out: unknown[] = [];
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const data = JSON.parse(s.textContent ?? '');
      Array.isArray(data) ? out.push(...data) : out.push(data);
    } catch {
      /* JSON invalide: ignore */
    }
  });
  return out;
}

export function readNextData(doc: Document): any | null {
  const el = doc.getElementById('__NEXT_DATA__');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

export function text(doc: Document, selector: string): string | undefined {
  const t = doc.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  return t || undefined;
}

export function parseNumber(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const m = s.replace(/ | /g, ' ').match(/\d[\d\s]*(?:[.,]\d+)?/);
  if (!m) return undefined;
  const n = parseFloat(m[0].replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

export function parseSurface(s: string): number | undefined {
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)/i);
  return m ? parseFloat(m[1]!.replace(',', '.')) : undefined;
}

export function parseBedrooms(s: string): number | undefined {
  const m = s.match(/(\d+)\s*chambres?/i);
  return m ? parseInt(m[1]!, 10) : undefined;
}

/** "T3", "F3", "3 pieces" -> nombre de pieces. */
export function parseRooms(s: string): number | undefined {
  const m = s.match(/(\d+)\s*pi[eè]ces?/i) ?? s.match(/\b[TF](\d)\b/);
  return m ? parseInt(m[1]!, 10) : undefined;
}

/** Heuristique charges comprises. "unknown" en cas de doute. */
export function parseChargesIncluded(s: string): Tri {
  const t = s.toLowerCase();
  if (/hors\s+charges|\bhc\b|charges\s+en\s+sus/.test(t)) return 'no';
  if (/charges\s+comprises|\bcc\b|tout\s+compris/.test(t)) return 'yes';
  return 'unknown';
}

export function parseChargesAmount(s: string): number | undefined {
  // "charges comprises 2250 €" = loyer CC, pas un montant de charges
  const t = s.replace(/hors\s+charges|charges\s+(?:comprises|incluses)/gi, ' ');
  const m = t.match(/charges?[^\d]{0,30}(\d[\d\s]*(?:[.,]\d+)?)\s*€/i);
  return m ? parseNumber(m[1]) : undefined;
}

export function parseDeposit(s: string): number | undefined {
  const m = s.match(/d[ée]p[ôo]t\s+de\s+garantie\D{0,20}?(\d[\d\s]*(?:[.,]\d+)?)\s*€/i);
  return m ? parseNumber(m[1]) : undefined;
}

export function parseFurnished(s: string): Tri {
  if (/non[\s-]*meubl/i.test(s)) return 'no';
  if (/meubl/i.test(s)) return 'yes';
  return 'unknown';
}

export function parseFloor(s: string): string | undefined {
  const m = s.match(/[ÉE]tage\s*(\d+\s*\/\s*\d+|\d+)/i);
  return m?.[1]?.replace(/\s/g, '');
}

export function findEmail(s: string): string | undefined {
  return s.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0];
}

export function findPhone(s: string): string | undefined {
  const m = s.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/);
  return m?.[0];
}

export function canonicalId(source: string, url: URL): string {
  return `${source}:${url.pathname.replace(/\/+$/, '')}`;
}
