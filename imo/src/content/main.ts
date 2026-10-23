import { extractorFor } from '../extractors';
import { mount, unmount } from './panel';

let lastUrl = '';
let timer: number | undefined;

async function run(): Promise<void> {
  const url = new URL(location.href);
  const ex = extractorFor(url);
  if (!ex || !ex.isListingPage(url)) return unmount();
  const listing = ex.extract(document, url);
  if (listing) await mount(listing);
}

// Sites SPA: re-evaluer quand l'URL ou le DOM change (debounce).
function schedule(): void {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    void run();
  }, 600);
}

new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
schedule();
