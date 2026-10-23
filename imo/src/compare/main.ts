import { getAll, getRoommates, remove, setRoommates } from '../storage';
import type { Listing } from '../types';

type Col = { label: string; key: string; val: (l: Listing) => string | number | undefined; best?: 'min' | 'max' };

let roommates = 1;
const total = (l: Listing) =>
  l.rentAmount === undefined ? undefined : l.chargesIncluded === 'no' && l.chargesAmount ? l.rentAmount + l.chargesAmount : l.rentAmount;
const perM2 = (l: Listing) => (l.rentAmount && l.surfaceM2 ? +(l.rentAmount / l.surfaceM2).toFixed(2) : undefined);
const tri = { yes: 'Oui', no: 'Non', unknown: '?' };

const COLS: Col[] = [
  { label: 'Titre', key: 'title', val: (l) => l.title },
  { label: 'Source', key: 'source', val: (l) => l.source },
  { label: 'Loyer €', key: 'rent', val: (l) => l.rentAmount, best: 'min' },
  { label: 'CC', key: 'cc', val: (l) => tri[l.chargesIncluded] },
  { label: 'Charges €', key: 'chg', val: (l) => l.chargesAmount },
  { label: 'Total/mois €', key: 'tot', val: total, best: 'min' },
  { label: 'Loyer/pers €', key: 'pp', val: (l) => { const t = total(l); return t ? +(t / roommates).toFixed(2) : undefined; }, best: 'min' },
  { label: 'Dépôt €', key: 'dep', val: (l) => l.depositAmount },
  { label: 'Meublé', key: 'furn', val: (l) => tri[l.furnished] },
  { label: 'Étage', key: 'floor', val: (l) => l.floor },
  { label: 'Chambres', key: 'bed', val: (l) => l.bedrooms, best: 'max' },
  { label: 'Surface m²', key: 'm2', val: (l) => l.surfaceM2, best: 'max' },
  { label: '€/m²', key: 'pm2', val: perM2, best: 'min' },
  { label: 'Adresse', key: 'addr', val: (l) => l.address },
  { label: 'Contact', key: 'kind', val: (l) => `${l.contact.kind === 'agency' ? 'Agence' : l.contact.kind === 'private' ? 'Particulier' : '?'}${l.contact.name ? ' · ' + l.contact.name : ''}` },
  { label: 'Adresse agence', key: 'aaddr', val: (l) => l.contact.agencyAddress },
  { label: 'Email', key: 'mail', val: (l) => l.contact.email },
  { label: 'Tél', key: 'tel', val: (l) => l.contact.phone ?? (l.contact.phoneHidden ? '(masqué)' : undefined) },
];

let rows: Listing[] = [];
let sortKey = '';
let sortDir = 1;

const table = document.getElementById('t') as HTMLTableElement;

function bestOf(col: Col): number | undefined {
  if (!col.best) return undefined;
  const nums = rows.map(col.val).filter((v): v is number => typeof v === 'number');
  if (nums.length < 2) return undefined;
  return col.best === 'min' ? Math.min(...nums) : Math.max(...nums);
}

function render(): void {
  document.getElementById('empty')!.hidden = rows.length > 0;
  table.hidden = rows.length === 0;
  table.replaceChildren();
  const head = table.createTHead().insertRow();
  for (const c of COLS) {
    const th = document.createElement('th');
    th.textContent = c.label + (sortKey === c.key ? (sortDir > 0 ? ' ▲' : ' ▼') : '');
    th.onclick = () => { sortDir = sortKey === c.key ? -sortDir : 1; sortKey = c.key; sort(); render(); };
    head.appendChild(th);
  }
  head.appendChild(document.createElement('th'));
  const bests = COLS.map(bestOf);
  const body = table.createTBody();
  for (const l of rows) {
    const tr = body.insertRow();
    COLS.forEach((c, i) => {
      const td = tr.insertCell();
      const v = c.val(l);
      if (c.key === 'title') {
        const a = document.createElement('a');
        a.href = l.url; a.target = '_blank'; a.textContent = String(v ?? l.url);
        td.appendChild(a);
      } else td.textContent = v === undefined ? '—' : String(v);
      if (bests[i] !== undefined && v === bests[i]) td.classList.add('best');
    });
    const del = tr.insertCell();
    const b = document.createElement('button');
    b.textContent = 'Supprimer';
    b.onclick = async () => { await remove(l.id); await load(); chrome.runtime.sendMessage({ type: 'badge' }); };
    del.appendChild(b);
  }
}

function sort(): void {
  const col = COLS.find((c) => c.key === sortKey);
  if (!col) return;
  rows.sort((a, b) => {
    const x = col.val(a), y = col.val(b);
    if (x === undefined) return 1;
    if (y === undefined) return -1;
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sortDir;
  });
}

function csv(): string {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [COLS.map((c) => q(c.label)).join(';'), ...rows.map((l) => COLS.map((c) => q(c.val(l))).join(';'))].join('\n');
}

document.getElementById('csv')!.onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv()], { type: 'text/csv;charset=utf-8' }));
  a.download = 'annonces.csv';
  a.click();
};

const roomInput = document.getElementById('rm') as HTMLInputElement;
roomInput.onchange = async () => { await setRoommates(Number(roomInput.value)); roommates = await getRoommates(); roomInput.value = String(roommates); sort(); render(); };

async function load(): Promise<void> {
  roommates = await getRoommates();
  roomInput.value = String(roommates);
  rows = await getAll();
  sort();
  render();
}

void load();
