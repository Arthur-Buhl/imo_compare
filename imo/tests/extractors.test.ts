import { describe, expect, it } from 'vitest';
import {
  parseBedrooms, parseChargesAmount, parseChargesIncluded, parseNumber, parseRooms, parseSurface,
} from '../src/extractors/common';
import { pap } from '../src/extractors/pap';
import { leboncoin } from '../src/extractors/leboncoin';
import { seloger } from '../src/extractors/seloger';

function page(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('common', () => {
  it('parse nombres FR', () => {
    expect(parseNumber('1 250 €')).toBe(1250);
    expect(parseNumber('12,5 m²')).toBe(12.5);
    expect(parseNumber('abc')).toBeUndefined();
  });
  it('surface, chambres, pieces', () => {
    expect(parseSurface('Appartement 45 m²')).toBe(45);
    expect(parseBedrooms('2 chambres')).toBe(2);
    expect(parseRooms('T3 lumineux')).toBe(3);
    expect(parseRooms('4 pièces')).toBe(4);
  });
  it('charges comprises', () => {
    expect(parseChargesIncluded('800 € CC')).toBe('yes');
    expect(parseChargesIncluded('Loyer 700 € hors charges')).toBe('no');
    expect(parseChargesIncluded('bel appartement')).toBe('unknown');
    expect(parseChargesAmount('Charges : 50 €')).toBe(50);
  });
});

describe('pap', () => {
  it('extrait une annonce', () => {
    const doc = page(`<h1>Appartement 3 pièces</h1><div class="item-price">950 €</div>
      <p>2 chambres, 55 m², charges comprises</p><div class="item-geoloc">Lyon 3e</div>`);
    const url = new URL('https://www.pap.fr/annonces/appartement-lyon-3e-r123456');
    expect(pap.isListingPage(url)).toBe(true);
    const l = pap.extract(doc, url)!;
    expect(l.rentAmount).toBe(950);
    expect(l.bedrooms).toBe(2);
    expect(l.surfaceM2).toBe(55);
    expect(l.chargesIncluded).toBe('yes');
    expect(l.contact.kind).toBe('private');
  });
});

describe('leboncoin', () => {
  it('lit __NEXT_DATA__', () => {
    const data = { props: { pageProps: { ad: {
      subject: 'T2 centre', body: 'Loyer 600 € charges comprises. Tel 06 12 34 56 78',
      price: [600], owner: { type: 'private', name: 'Paul' },
      location: { city: 'Nantes', zipcode: '44000' },
      attributes: [{ key: 'square', value: '40' }, { key: 'rooms', value: '2' }],
    } } } };
    const doc = page(`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`);
    const url = new URL('https://www.leboncoin.fr/ad/locations/123456');
    expect(leboncoin.isListingPage(url)).toBe(true);
    const l = leboncoin.extract(doc, url)!;
    expect(l.rentAmount).toBe(600);
    expect(l.chargesIncluded).toBe('yes');
    expect(l.surfaceM2).toBe(40);
    expect(l.contact.kind).toBe('private');
    expect(l.contact.phone).toBe('06 12 34 56 78');
  });
});

describe('seloger', () => {
  // Structure reduite d'une vraie annonce (Vitry-sur-Seine, agence)
  const html = `<script type="application/ld+json">${JSON.stringify({ '@type': 'RealEstateListing', name: 'Duplex T6 142 m² 2250 €', itemOffered: { numberOfRooms: '6', floorSize: { value: '142' } }, offers: { price: '' } })}</script>
    <div data-testid="cdp-hardfacts-title">Duplex à louer</div>
    <div data-testid="cdp-hardfacts-keyfacts">6 pièces  •  5 chambres  •  142 m²  •  Étage 5/5</div>
    <div data-testid="cdp-price">Détails des coûts<div>Loyer charges comprises</div><div>2250 €</div></div>
    <div data-testid="cdp-location-address">Vitry-sur-Seine (94400)</div>
    <div data-testid="cdp-contact-card-mobile-agency-logo"><img alt="CATTALAN JOHNSON IMMOBILIER CJI"></div>
    <section><h2>Découvrez l’agence</h2><span>CATTALAN JOHNSON IMMOBILIER CJI</span><span>Agence</span><button>Envoyer un message</button><div>67 rue Saint Honore, 75001 Paris 1er</div><button>Envoyer un message</button><button>Appeler</button></section>
    <button data-testid="cdp-contacting-call-button">Appeler</button>`;
  it('extrait une annonce agence', () => {
    const url = new URL('https://www.seloger.com/annonce/location/ile-de-france/val-de-marne-94/vitry-sur-seine-94400/25P46TP2P48F');
    expect(seloger.isListingPage(url)).toBe(true);
    const l = seloger.extract(page(html), url)!;
    expect(l).toMatchObject({ rentAmount: 2250, chargesIncluded: 'yes', bedrooms: 5, rooms: 6, surfaceM2: 142, address: 'Vitry-sur-Seine (94400)' });
    expect(l.chargesAmount).toBeUndefined();
    expect(l.floor).toBe('5/5');
    expect(l.contact).toMatchObject({ kind: 'agency', name: 'CATTALAN JOHNSON IMMOBILIER CJI', agencyAddress: '67 rue Saint Honore, 75001 Paris 1er', phoneHidden: true });
  });
});
