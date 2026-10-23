import type { Extractor, Listing } from '../types';
import {
  canonicalId, findEmail, findPhone, parseBedrooms, parseChargesAmount, parseChargesIncluded,
  parseDeposit, parseFloor, parseFurnished, parseRooms, parseSurface, readNextData,
} from './common';

// Leboncoin: donnees dans __NEXT_DATA__ (props.pageProps.ad). Structure a valider sur vraie page.
function attr(ad: any, key: string): string | undefined {
  const a = (ad?.attributes ?? []).find((x: any) => x.key === key);
  return a?.value_label ?? a?.value;
}

export const leboncoin: Extractor = {
  source: 'leboncoin',
  isListingPage: (url) => /^\/ad\/locations\/\d+/.test(url.pathname),
  extract(doc, url): Listing | null {
    const ad = readNextData(doc)?.props?.pageProps?.ad;
    if (!ad) return null;
    const body: string = `${ad.subject ?? ''} ${ad.body ?? ''}`;
    const owner = ad.owner;
    const isPro = owner?.type === 'pro' || ad.owner?.no_salesmen === false;
    const loc = ad.location;
    const bedrooms = Number(attr(ad, 'bedrooms')) || parseBedrooms(body);
    const phone = findPhone(body);
    return {
      id: canonicalId('leboncoin', url),
      source: 'leboncoin',
      url: url.href,
      title: ad.subject,
      rentAmount: Array.isArray(ad.price) ? ad.price[0] : ad.price,
      chargesIncluded: attr(ad, 'charges_included') === '1' || attr(ad, 'charges_included') === 'Oui'
        ? 'yes'
        : parseChargesIncluded(body),
      chargesAmount: parseChargesAmount(body),
      bedrooms: bedrooms || undefined,
      rooms: Number(attr(ad, 'rooms')) || parseRooms(body),
      surfaceM2: Number(attr(ad, 'square')) || parseSurface(body),
      depositAmount: parseDeposit(body),
      furnished: attr(ad, 'furnished') === '1' || attr(ad, 'furnished') === 'Meublé' ? 'yes' : parseFurnished(body),
      floor: attr(ad, 'floor_number') ?? parseFloor(body),
      address: [loc?.address, loc?.zipcode, loc?.city].filter(Boolean).join(' ') || undefined,
      contact: {
        kind: isPro ? 'agency' : 'private',
        name: owner?.name ?? owner?.store_name,
        email: findEmail(body),
        phone,
        phoneHidden: !phone,
      },
    };
  },
};
