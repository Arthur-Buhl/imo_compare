# Imo Compare

Extension Chrome (MV3) : affiche les infos clés d'une annonce de location (Leboncoin, SeLoger, PAP) et compare les annonces sauvegardées.

## Installation
```
npm install
npm run build
```
Chrome → `chrome://extensions` → mode développeur → "Charger l'extension non empaquetée" → dossier `dist/`.

## Utilisation
- Ouvrir une annonce : un panneau apparaît (loyer, charges comprises, chambres, surface, adresse, contact).
- "Sauvegarder" ajoute l'annonce ; clic sur l'icône de l'extension ou "Comparer" ouvre le tableau (tri, meilleur prix en vert, export CSV).

## Ajouter un site
Créer `src/extractors/<site>.ts` (interface `Extractor`), l'enregistrer dans `src/extractors/index.ts` et dans `manifest.config.ts` (hosts).

## Limites
- Les sélecteurs de SeLoger/Leboncoin/PAP sont à valider sur de vraies pages (fixtures dans `tests/`).
- Les numéros masqués derrière "Voir le numéro" sont signalés, jamais cliqués automatiquement.
- "Charges comprises" repose sur une heuristique ; "Inconnu" en cas de doute.
