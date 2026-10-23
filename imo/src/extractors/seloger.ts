import type { Extractor, Listing } from '../types';
import {
  canonicalId, findEmail, findPhone, parseBedrooms, parseChargesAmount, parseChargesIncluded,
  parseDeposit, parseFloor, parseFurnished, parseNumber, parseRooms, parseSurface, readJsonLd, text,
} from './common';

const tid = (doc: Document, id: string) => text(doc, `[data-testid="${id}"]`);

// Valide sur une vraie annonce (location, agence). Prix/agence absents du JSON-LD: lecture DOM via data-testid.
export const seloger: Extractor = {
  source: 'seloger',
  isListingPage: (url) => /^\/annonces?\/(location|achat)\/.+\/[0-9A-Z]{8,}\/?$/i.test(url.pathname),
  extract(doc, url): Listing | null {
    const ld = readJsonLd(doc).find((d: any) => d?.['@type'] === 'RealEstateListing') as any;
    const title = tid(doc, 'cdp-hardfacts-title') ?? ld?.name ?? text(doc, 'h1');
    if (!title) return null;
    const body = doc.body.textContent?.replace(/\s+/g, ' ') ?? '';
    const keyfacts = tid(doc, 'cdp-hardfacts-keyfacts') ?? '';
    const priceBlock = tid(doc, 'cdp-price') ?? '';
    const item = ld?.itemOffered;

    const rawText = doc.body.textContent ?? '';
    const agencyName = doc.querySelector('[data-testid="cdp-contact-card-mobile-agency-logo"] img')?.getAttribute('alt')?.trim()
      || rawText.match(/Découvrez l.agence(.+?)Agence/)?.[1]?.trim()
      || undefined;
    // textContent colle les blocs: "Découvrez l'agenceNOMAgenceEnvoyer un messageADRESSEEnvoyer un message"
    const agencyAddress = (doc.body.textContent ?? '')
      .match(/Découvrez l.agence.*?Agence(?:Envoyer un message)?(\d[^\n]*?)Envoyer un message/)?.[1]?.trim();
    const phone = findPhone(body);

    return {
      id: canonicalId('seloger', url),
      source: 'seloger',
      url: url.href,
      title,
      rentAmount: parseNumber(priceBlock.match(/(\d[\d\s]*)\s*€/)?.[1]) ?? parseNumber(title.match(/(\d[\d\s]*)\s*€/)?.[1]),
      chargesIncluded: parseChargesIncluded(priceBlock || body),
      chargesAmount: parseChargesAmount(body),
      bedrooms: parseBedrooms(keyfacts) ?? parseBedrooms(body),
      rooms: parseRooms(keyfacts) ?? parseNumber(item?.numberOfRooms) ?? parseRooms(body),
      surfaceM2: parseSurface(keyfacts) ?? parseNumber(item?.floorSize?.value) ?? parseSurface(body),
      depositAmount: parseDeposit(priceBlock),
      furnished: parseFurnished(`${title} ${ld?.description ?? ''} ${body.slice(0, 1500)}`),
      floor: parseFloor(keyfacts),
      // SeLoger ne donne que la ville ("adresse exacte non communiquee")
      address: tid(doc, 'cdp-location-address'),
      contact: {
        kind: agencyName ? 'agency' : 'unknown',
        name: agencyName,
        agencyAddress,
        email: findEmail(body),
        phone,
        phoneHidden: !phone && !!doc.querySelector('[data-testid="cdp-contacting-call-button"]'),
      },
    };
  },
};
