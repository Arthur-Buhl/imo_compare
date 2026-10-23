import type { Extractor } from '../types';
import { leboncoin } from './leboncoin';
import { pap } from './pap';
import { seloger } from './seloger';

const BY_HOST: Record<string, Extractor> = {
  'www.leboncoin.fr': leboncoin,
  'www.seloger.com': seloger,
  'www.pap.fr': pap,
};

export function extractorFor(url: URL): Extractor | undefined {
  return BY_HOST[url.hostname];
}
