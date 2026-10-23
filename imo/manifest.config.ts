import { defineManifest } from '@crxjs/vite-plugin';

const HOSTS = [
  'https://www.leboncoin.fr/*',
  'https://www.seloger.com/*',
  'https://www.pap.fr/*',
];

export default defineManifest({
  manifest_version: 3,
  name: 'Imo Compare',
  version: '0.1.0',
  description: 'Affiche les infos cles des annonces de location et compare celles sauvegardees.',
  permissions: ['storage'],
  host_permissions: HOSTS,
  background: { service_worker: 'src/background/sw.ts', type: 'module' },
  content_scripts: [{ matches: HOSTS, js: ['src/content/main.ts'], run_at: 'document_idle' }],
  action: { default_title: 'Comparer les annonces' },
});
