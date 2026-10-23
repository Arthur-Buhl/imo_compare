export type Source = 'leboncoin' | 'seloger' | 'pap';
export type Tri = 'yes' | 'no' | 'unknown';

export interface Contact {
  kind: 'agency' | 'private' | 'unknown';
  name?: string;
  agencyAddress?: string;
  email?: string;
  phone?: string;
  /** true si un bouton "voir le numero" existe mais numero non affiche */
  phoneHidden?: boolean;
}

export interface Listing {
  id: string;
  source: Source;
  url: string;
  title: string;
  rentAmount?: number;
  chargesIncluded: Tri;
  chargesAmount?: number;
  bedrooms?: number;
  rooms?: number;
  surfaceM2?: number;
  depositAmount?: number;
  furnished: Tri;
  floor?: string;
  address?: string;
  contact: Contact;
  savedAt?: number;
}

export interface Extractor {
  source: Source;
  isListingPage(url: URL): boolean;
  extract(doc: Document, url: URL): Listing | null;
}
