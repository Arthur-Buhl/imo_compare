import { getAll } from '../storage';

const openCompare = () => chrome.tabs.create({ url: chrome.runtime.getURL('src/compare/index.html') });

async function updateBadge(): Promise<void> {
  const n = (await getAll()).length;
  await chrome.action.setBadgeText({ text: n ? String(n) : '' });
}

chrome.action.onClicked.addListener(openCompare);
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'open-compare') void openCompare();
  if (msg?.type === 'badge') void updateBadge();
});
chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
