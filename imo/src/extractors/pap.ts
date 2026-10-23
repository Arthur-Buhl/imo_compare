import type { Extractor, Listing } from '../types';
import {
  canonicalId, findEmail, findPhone, parseBedrooms, parseChargesAmount, parseChargesIncluded,
  parseDeposit, parseFloor, parseFurnished, parseNumber, parseRooms, parseSurface, text,
} from './common';

// PAP = particuliers: contact toujours "private".
export const pap: Extractor = {
  source: 'pap',
  isListingPage: (url) => /^\/annonces\/.*-r\d+/.test(url.pathname),
  extract(doc, url): Listing | null {
    const title = text(doc, 'h1');
    if (!title) return null;
    const body = doc.body.textContent?.replace(/\s+/g, ' ') ?? '';
    const priceText = text(doc, '.item-price') ?? text(doc, '[class*="price"]');
    const phone = findPhone(text(doc, '.contact-bloc') ?? '') ?? undefined;
    return {
      id: canonicalId('pap', url),
      source: 'pap',
      url: url.href,
      title,
      rentAmount: parseNumber(priceText),
      chargesIncluded: parseChargesIncluded(`${priceText ?? ''} ${body}`),
      chargesAmount: parseChargesAmount(body),
      bedrooms: parseBedrooms(body),
      rooms: parseRooms(body),
      surfaceM2: parseSurface(body),
      depositAmount: parseDeposit(body),
      furnished: parseFurnished(body),
      floor: parseFloor(body),
      address: text(doc, '.item-geoloc') ?? text(doc, 'h2'),
      contact: {
        kind: 'private',
        name: text(doc, '.contact-bloc .name') ,
        email: findEmail(body),
        phone,
        phoneHidden: !phone && /voir le num[eé]ro|afficher le t[eé]l/i.test(body),
      },
    };
  },
};
