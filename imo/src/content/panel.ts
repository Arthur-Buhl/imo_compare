import type { Listing, Tri } from '../types';
import { getRoommates, has, remove, save, setRoommates } from '../storage';

const CSS = `
:host{all:initial}
*{box-sizing:border-box}
.p{position:fixed;top:72px;right:16px;z-index:2147483647;width:400px;max-height:calc(100vh - 96px);overflow:auto;
font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a;background:#fff;border:1px solid #e2e8f0;
border-radius:16px;box-shadow:0 12px 40px #0f172a33}
.hd{display:flex;align-items:flex-start;gap:10px;padding:16px 16px 12px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;border-radius:16px 16px 0 0}
.hd h3{margin:0;font-size:15px;font-weight:600;flex:1;line-height:1.3}
.hd .src{font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.8}
.x{cursor:pointer;opacity:.8;font-size:18px;line-height:1;background:none;border:0;color:#fff;padding:0}
.x:hover{opacity:1}
.price{padding:14px 16px 4px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.price b{font-size:28px;letter-spacing:-.02em}
.price span{color:#64748b}
.chips{display:flex;flex-wrap:wrap;gap:6px;padding:6px 16px 10px}
.chip{font-size:12px;padding:3px 10px;border-radius:999px;background:#eef2ff;color:#3730a3;font-weight:500}
.chip.ok{background:#dcfce7;color:#166534}.chip.no{background:#fee2e2;color:#991b1b}.chip.na{background:#f1f5f9;color:#475569}
.sec{margin:0 16px 12px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}
.sec h4{margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#64748b;font-weight:600}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}
.k{display:block;font-size:12px;color:#64748b}
.v{font-weight:600;word-break:break-word}
.full{grid-column:1/-1}
.coloc{background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-color:#c7d2fe}
.step{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.step button{width:32px;height:32px;border-radius:50%;border:1px solid #c7d2fe;background:#fff;font-size:18px;cursor:pointer;color:#3730a3}
.step button:hover{background:#eef2ff}
.step .n{font-size:20px;font-weight:700;min-width:28px;text-align:center}
.big{font-size:22px;font-weight:700;color:#3730a3}
.muted{color:#94a3b8;font-weight:400}
.ct .name{font-weight:600}
.warn{color:#b45309;font-size:12px}
a.l{color:#2563eb;text-decoration:none}
.row{display:flex;gap:8px;padding:0 16px 16px}
.row button{flex:1;padding:10px;border:0;border-radius:10px;background:#2563eb;color:#fff;cursor:pointer;font:inherit;font-weight:600}
.row button:hover{background:#1d4ed8}
.row button.sec2{background:#e2e8f0;color:#0f172a}.row button.sec2:hover{background:#cbd5e1}
.row button.del{background:#fee2e2;color:#991b1b}
`;

const kind = { agency: 'Agence', private: 'Particulier', unknown: 'Contact' } as const;

export function esc(s: string | number | undefined | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
const val = (s: string | number | undefined | null) => (s === undefined || s === null || s === '' ? '<span class="muted">—</span>' : esc(s));
const eur = (n: number | undefined, d = 0) =>
  n === undefined ? undefined : `${n.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d })} €`;

function chip(label: string, t: Tri, yes: string, no: string): string {
  if (t === 'yes') return `<span class="chip ok">${esc(yes)}</span>`;
  if (t === 'no') return `<span class="chip no">${esc(no)}</span>`;
  return `<span class="chip na">${esc(label)} ?</span>`;
}

/** Cout mensuel total: loyer + charges si "hors charges" et montant connu. */
export function monthlyTotal(l: Listing): number | undefined {
  if (l.rentAmount === undefined) return undefined;
  return l.chargesIncluded === 'no' && l.chargesAmount ? l.rentAmount + l.chargesAmount : l.rentAmount;
}

let host: HTMLElement | null = null;

export function unmount(): void {
  host?.remove();
  host = null;
}

export async function mount(l: Listing): Promise<void> {
  unmount();
  host = document.createElement('div');
  const root = host.attachShadow({ mode: 'closed' });
  const saved = await has(l.id);
  let n = await getRoommates();
  const c = l.contact;
  const total = monthlyTotal(l);
  const phone = c.phone ?? (c.phoneHidden ? '<span class="warn">à révéler sur la page</span>' : undefined);
  const perM2 = total && l.surfaceM2 ? total / l.surfaceM2 : undefined;
  const perBedroom = total && l.bedrooms ? total / l.bedrooms : undefined;

  root.innerHTML = `<style>${CSS}</style><div class="p">
<div class="hd"><div style="flex:1"><div class="src">${esc(l.source)}</div><h3>${esc(l.title)}</h3></div><button class="x" id="x" aria-label="Fermer">✕</button></div>
<div class="price"><b>${eur(l.rentAmount) ?? '—'}</b><span>/mois${l.chargesIncluded === 'yes' ? ' charges comprises' : l.chargesIncluded === 'no' ? ' hors charges' : ''}</span></div>
<div class="chips">
${chip('Charges', l.chargesIncluded, 'Charges comprises', 'Hors charges')}
${chip('Meublé', l.furnished, 'Meublé', 'Non meublé')}
${l.floor ? `<span class="chip">Étage ${esc(l.floor)}</span>` : ''}
</div>
<div class="sec"><h4>Le bien</h4><div class="grid">
<div><span class="k">Chambres</span><span class="v">${val(l.bedrooms)}</span></div>
<div><span class="k">Pièces</span><span class="v">${val(l.rooms)}</span></div>
<div><span class="k">Surface</span><span class="v">${l.surfaceM2 ? esc(l.surfaceM2) + ' m²' : val(undefined)}</span></div>
<div><span class="k">Prix au m²</span><span class="v">${val(eur(perM2, 2))}</span></div>
<div><span class="k">Charges</span><span class="v">${l.chargesAmount ? eur(l.chargesAmount) : val(undefined)}</span></div>
<div><span class="k">Dépôt de garantie</span><span class="v">${val(eur(l.depositAmount))}</span></div>
<div class="full"><span class="k">Adresse</span><span class="v">${val(l.address)}</span></div>
</div></div>
<div class="sec coloc"><h4>Colocation</h4>
<div class="step"><span class="k" style="flex:1">Nombre de colocataires</span>
<button id="m" aria-label="Moins">−</button><span class="n" id="n">${n}</span><button id="pl" aria-label="Plus">+</button></div>
<div class="grid"><div><span class="k">Loyer par personne</span><span class="big" id="pp"></span></div>
<div><span class="k">Loyer par chambre</span><span class="v">${val(eur(perBedroom))}</span></div></div>
<div class="warn" id="w"></div></div>
<div class="sec ct"><h4>${kind[c.kind]}</h4><div class="grid">
<div class="full"><span class="k">Nom</span><span class="name v">${val(c.name)}</span></div>
${c.agencyAddress ? `<div class="full"><span class="k">Adresse de l'agence</span><span class="v">${esc(c.agencyAddress)}</span></div>` : ''}
<div><span class="k">Téléphone</span><span class="v">${phone ?? val(undefined)}</span></div>
<div><span class="k">Email</span><span class="v">${c.email ? `<a class="l" href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : val(undefined)}</span></div>
</div></div>
<div class="row"><button id="s" class="${saved ? 'del' : ''}">${saved ? 'Retirer' : 'Sauvegarder'}</button><button id="c" class="sec2">Comparer</button></div>
</div>`;

  const $ = (id: string) => root.getElementById(id)!;
  const refresh = () => {
    $('n').textContent = String(n);
    $('pp').textContent = total ? eur(total / n, 2)! : '—';
    $('w').textContent = l.bedrooms && n > l.bedrooms ? `Plus de colocataires (${n}) que de chambres (${l.bedrooms}).` : '';
  };
  const setN = async (v: number) => { n = Math.max(1, Math.min(20, v)); await setRoommates(n); refresh(); };
  $('m').addEventListener('click', () => void setN(n - 1));
  $('pl').addEventListener('click', () => void setN(n + 1));
  $('x').addEventListener('click', unmount);
  $('s').addEventListener('click', async () => {
    (await has(l.id)) ? await remove(l.id) : await save(l);
    chrome.runtime.sendMessage({ type: 'badge' });
    await mount(l);
  });
  $('c').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'open-compare' }));
  refresh();
  document.documentElement.appendChild(host);
}
