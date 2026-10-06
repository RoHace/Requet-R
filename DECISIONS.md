# Requêt'R — Journal des décisions

Format : `D00n — titre`, puis **Contexte / Décision / Conséquences / Statut**.
Une décision n'est jamais réécrite : si elle change, on ajoute une décision qui la remplace et on passe l'ancienne en « Remplacée par D0xx ».
Référence de portage : `Reference/classer-v2.html` (Classe'R), lecture seule, jamais modifiée.

## Découpage en lots

| Lot | Contenu |
|-----|---------|
| 1 | Build + sql.js embarqué |
| 2 | Base de démo + explorateur de schéma |
| 3 | Éditeur + comparateur + types d'exercices |
| 4 | Portage du socle (Store, Progression, Routeur, Vues) |
| 5 | Autotest adapté |
| 6+ | Contenu, un palier par lot |

Les compétences et niveaux SQL naissent au lot 4. Le schéma et le jeu de données du seed naissent au lot 2.

## Suivi du poids de `requeter.html`

Affiché en fin de `node build.mjs`. À reporter ici à la fin de chaque lot.

| Lot | Octets | Ko | SHA-256 |
|-----|-------:|---:|---------|
| 1 | 976 550 | 953,7 | `a45b34883e5f3676270c6e07d3a5177f8e72bd7f805164a8fea6550d3a635f80` |

Répartition au lot 1 : WASM en base64 ≈ 877 880 o (90 %), sql.js 46 535 o, CSS ≈ 37 Ko, app ≈ 11 Ko.

---

## D001 — Déterminisme : règle permanente pour tout le projet

**Contexte.** L'Autotest rejoue chaque requête de référence contre le seed. Un résultat qui varie d'une exécution à l'autre le rend non reproductible et annule tout le bénéfice de la vérification automatique.
**Décision.** Aucune solution de référence, aucun jeu de données, aucun exercice ne peut dépendre de `date('now')`, `random()`, `CURRENT_TIMESTAMP`, ni de l'ordre naturel des lignes (donc : pas de résultat comparé sans `ORDER BY` total, sauf comparaison non ordonnée déclarée par l'exercice). Toute date est une constante littérale.
**Conséquences.** L'Autotest (lot 5) doit rejeter toute requête de référence contenant ces constructions et tout exercice dont le résultat change entre deux exécutions successives. Le seed (lot 2) n'utilise que des constantes littérales.
**Statut.** Permanente.

## D002 — Découpage du projet en six lots

**Contexte.** Le brief initial listait ce qui était repris, supprimé ou remplacé, sans ordre de livraison.
**Décision.** Voir le tableau « Découpage en lots » ci-dessus. Compétences et niveaux SQL : lot 4. Schéma et données du seed : lot 2.
**Conséquences.** Le lot 1 ne contient ni contenu pédagogique, ni vue définitive ; `src/contenu.js` et `src/seed.sql` sont des squelettes.
**Statut.** Acceptée.

## D003 — Le build est `build.mjs` (Node), pas `build.py`

**Contexte.** Le brief demandait `build.py`. Python n'est pas installé sur la machine (seuls les raccourcis du Microsoft Store existent) ; Node 24 et npm 11 le sont.
**Décision.** `build.mjs`, en Node, sans dépendance : `node build.mjs`. Pas d'installation de Python.
**Conséquences.** Lecture en UTF-8 explicite et fins de ligne normalisées (`\n`) ; remplacement en un seul passage par fonction (jamais par chaîne de remplacement, car le JS de sql.js contient des `$` et `\`) ; refus si une source inlinée contient `</script` ou `<!--` ; écriture atomique (fichier temporaire puis renommage) ; sortie sans date ni horodatage, donc idempotente ; échec avec message français et code retour 1 si une source ou un marqueur manque. Le build affiche la taille et le SHA-256 du fichier produit.
**Statut.** Acceptée.

## D004 — sql.js 1.14.2 vendorisé dans `vendor/`

**Contexte.** Il faut un SQLite exécutable dans le navigateur, sans réseau.
**Décision.** sql.js **1.14.2** (npm `latest`, publié le 2026-08-14), récupéré par `npm pack` dans un dossier temporaire (aucun `package.json` ni `node_modules` dans le dépôt). Fichiers retenus : `dist/sql-wasm.js`, `dist/sql-wasm.wasm`, `LICENSE` → `vendor/LICENSE-sql.js`. Le `.wasm` n'est jamais ouvert ni modifié : le build l'encode sans le lire autrement que comme octets.
**Empreintes (à comparer en cas de doute) :**
- `vendor/sql-wasm.wasm` — 658 410 o — SHA-256 `38c14f6e379210bc942bdc4ebca44e7bfdb4318ecc1c72ca666a28fdce96670a`
- `vendor/sql-wasm.js` — 46 535 o — SHA-256 `f1c84000dbc856c9d87f4f3aabc4d3654bd436165db4be3da13751db3a9c20d7`

**Version de SQLite embarquée :** **3.49.1** (relevée à l'exécution par `SELECT sqlite_version()`, dans Chrome et Edge).
**Licences.** sql.js : MIT (fichier conservé dans `vendor/LICENSE-sql.js`). SQLite : domaine public.
**Conséquences.** Mettre à jour sql.js = remplacer ces deux fichiers, relever les nouvelles empreintes et la version SQLite ici, relancer l'Autotest.
**Statut.** Acceptée.

## D005 — Le WASM est embarqué en base64 ; jamais d'option de localisation du fichier

**Contexte.** Par défaut, sql-wasm.js va chercher son `.wasm` par le réseau (`fetch`). Le livrable doit fonctionner hors ligne dans un fichier unique.
**Décision.** Le build injecte le WASM en base64 dans une constante `WASM_B64` ; au démarrage, `atob` puis boucle sur `charCodeAt` donne un `Uint8Array`, passé à `initSqlJs({ wasmBinary: octets.buffer })`. L'option `locateFile` n'est jamais utilisée (elle déclencherait une requête réseau). sql-wasm.js est inliné dans sa propre balise `<script>`.
**Conséquences.** Vérifié (voir « Vérifications du lot 1 ») : une seule requête, celle du document ; `performance.getEntriesByType("resource")` est vide. Le coût est ×1,33 sur le poids du binaire (base64).
**Statut.** Acceptée.

## D006 — CSS : reprise de Classe'R, jetons fusionnés, tableur retiré

**Contexte.** Dans Classe'R, les jetons de design sont dispersés dans cinq blocs (`:root` aux lignes 16, 646, 679, 806, 822 ; `[data-theme="sombre"]` de même). Copier seulement le premier bloc casserait le focus, les champs, les textes d'erreur et la réussite (`--focus`, `--champ-bord`, `--rouge-texte`, `--ok*`, `--fs-*`, `--sp-*`… ne sont définis que dans le bloc « Fondations »).
**Décision.** Un seul `:root` et un seul `[data-theme="sombre"]`, valeurs inchangées (`color-scheme` inclus). Retirés sans remplacement : section 5b « Tableur » (`.tableur .feuille .cellule .enTete .editeur .poignee .mfc-barre .regle .tcd .graph .aide-fonction`), les règles `.graph*` du §10, `.tableur__zone` et `.tableur__ref` du responsive, et les jetons `--selection*` (réservés aux cellules). Conservés : `.cellules` (barre de progression, élément signature), `.apercu`, `.fn-ligne`/`.fiche__*` (lexique et fiches), `.paysage`/`.vignette`.
**Conséquences.** Seule section nouvelle : « 12. Éditeur SQL et table de résultats » (`.editeur-sql`, `.resultat`, `.erreur-sql`, `.sql-*`), qui n'utilise que des jetons existants. Piège rencontré : `.vide` de Classe'R est le grand encart pointillé ; la cellule « Aucune ligne » s'appelle donc `.aucune`.
**Statut.** Acceptée.

## D007 — `requeter.html` n'est pas versionné ; branche `main`

**Contexte.** Le fichier fait ≈ 1 Mo et change à chaque build ; il se reconstruit depuis n'importe quel commit.
**Décision.** `requeter.html` est dans `.gitignore`. La branche locale est `main` (renommée depuis `master` ; aucun commit n'existait encore). `Reference/` (majuscule, telle qu'elle existe) fait foi et n'est jamais touchée.
**Conséquences.** Le livrable se régénère avec `node build.mjs` ; son poids et son empreinte sont suivis dans ce journal.
**Statut.** Acceptée.

## D008 — La base est en mémoire, et c'est définitif

**Contexte.** Une requête de l'exercice précédent ne doit pas fausser le suivant.
**Décision.** Pas de persistance de la base utilisateur, jamais. Chaque exercice repart d'une base propre (seed rejoué : `Moteur.reinitialiser()`). La page de démo du lot 1 garde la même base entre deux exécutions de la même session (un `CREATE TABLE` lancé seul, puis un `SELECT` séparé, fonctionnent) ; l'application des lots suivants réinitialisera la base à l'entrée de chaque exercice.
**Conséquences.** Seule la progression (Store, lot 4) est persistée, sous la clé `requeter.etat`.
**Statut.** Permanente.

## D009 — `el()`, `icone()` et `Toast` portés dès le lot 1

**Contexte.** La page de démo en a besoin ; ils sont minuscules et inchangés.
**Décision.** Repris tels quels de Classe'R dans `src/app.js` (clé de stockage `requeter.etat` déclarée dans `CONFIG`, utilisée au lot 4). Le reste du socle attend le lot 4.
**Statut.** Acceptée.

## D010 — Exécution par `iterateStatements`, pas par `db.exec`

**Contexte.** `db.exec` n'émet aucun jeu de résultats pour un `SELECT` qui ne renvoie aucune ligne : on ne peut alors pas distinguer ce `SELECT` d'un `INSERT`, ni connaître ses colonnes.
**Décision.** `Moteur.executer` parcourt les instructions avec `iterateStatements` : `getColumnNames()` non vide = instruction qui renvoie des lignes (même 0) ; sinon l'instruction est exécutée par `step()` (obligatoire, sinon un `CREATE` suivi d'un `INSERT` échoue : l'`INSERT` serait préparé avant que la table existe). L'erreur est le message SQLite brut ; les jeux produits avant l'erreur sont conservés.
**Conséquences.** Le comparateur du lot 3 disposera des colonnes même pour un résultat vide.
**Statut.** Acceptée.

## D011 — Navigateurs

**Décision.** Chrome est la cible principale ; un second navigateur sert de vérification. Le responsive de Classe'R est conservé pour un usage mobile éventuel ; iOS Safari n'est pas une contrainte du lot 1.
**Statut.** Acceptée. Au lot 1, le second navigateur vérifié est Edge (Chromium) : Firefox n'est pas installé sur la machine de développement, donc **non testé** (voir « Questions ouvertes »).

---

## Questions ouvertes

- **Q1 — Comparateur de résultats (à trancher au LOT 3, pas avant).** Décision structurante : comment comparer le jeu de résultats d'un élève à celui de la solution ? Points à décider : `NULL`, `1` contre `1.0`, tolérance sur les flottants, noms d'alias de colonnes, casse du texte, ordre des colonnes, ligne ordonnée ou non selon l'exercice.
- **Q2 — Entiers au-delà de 2^53.** sql.js rend les entiers SQLite en nombres JavaScript : `9007199254740993` revient `9007199254740992`. Sans effet sur le contenu prévu, à garder en tête pour le comparateur.
- **Q3 — Firefox.** Le chargement WASM par `wasmBinary` n'a pas été vérifié sur Firefox (non installé). À contrôler à la main avant la fin du lot 2.

---

## Portage depuis Classe'R

### Repris quasiment tel quel (lots 3-4)
- **Store** (persistance, schéma, migrations, export/import JSON) — seule la clé change : `requeter.etat` ; l'export `classer-progression-…` devient `requeter-progression-…`.
- **Progression** (XP, niveaux, maîtrise, décroissance d'oubli, consolidation à 3 réussites sans indice, certifications, `pointsFaibles`).
- **Bus**, `el()` *(fait, D009)*, `cellules()`, `icone()` *(fait)*, **Toast** *(fait)*, **Modale**, `piegeFocus`.
- **Routeur** et la coquille des **Vues**, le rail de navigation.
- **Contenu** (filtrage par niveau) et **Packs**.
- **Session**, **Parcours**, **Mission** (la mécanique ; la validation change).
- **Indices** : 3 niveaux + solution verrouillée (voir « Réécrit »).
- **Affichage**, `carteRetour`, `ligneProgres`, `carteEssai`, `zoneEssai`.
- **Illus** (paysage, vignettes), onboarding, `appliquerTheme` *(une version simplifiée existe dans la démo)*, `demarrer`.
- **Autotest** — repris **et renforcé** (lot 5). Garde-fou central : chaque requête de référence est exécutée contre le seed et rejetée si elle plante, renvoie 0 ligne, renvoie un résultat trivial, ou viole D001. Omis du brief initial.

### Supprimé, sans remplacement
`Ref`, `Formules`, `FONCTIONS`, `ErreurCalcul`, `Feuille`, `Formatage`, `MFC`, `TCD`, `Graphique`, `svg()`, `creerTableur`, `ATELIERS`, `CONTENU.bacASable`, `FICHES` *(remplacé, voir ci-dessous)*.

### Remplacé
- Les 12 **VALIDATEURS** → un seul comparateur de jeu de résultats (comparaison ligne à ligne, ordonnée ou non selon l'exercice) — lot 3, voir Q1.
- `creerTableur` → un éditeur SQL + une table de résultats en lecture seule (la page de démo du lot 1 en est l'ébauche jetable).
- **Lexique** des fonctions Excel → lexique des clauses SQL.
- `TYPES_EXERCICE` : `"qcm"` conservé ; `"formule"` et `"grille"` remplacés par `"requete"`, `"corriger"` (réparer une requête fautive) et `"predire"` (annoncer le résultat avant exécution).
- **Fiche** + `FICHES` → fiches par clause SQL (JOIN, GROUP BY, CTE, fonctions fenêtre…). Omis du brief initial.
- `fonctionsDe` → détecteur de clauses, pour le résumé de fin de série. Omis du brief initial.

### Réécrit
- `Indices.pour` : le niveau « Fonction », tiré de `FONCTIONS`, devient un niveau « Clause » tiré du lexique SQL.

### Neuf (n'existe pas dans Classe'R)
Chaîne de build (`build.mjs`), moteur SQL (`Moteur`), éditeur SQL et table de résultats, seed et explorateur de schéma (lot 2), comparateur (lot 3), règle de déterminisme (D001).

---

## Vérifications du lot 1 (2026-10-06)

| Critère | Résultat |
|---------|----------|
| Build sans erreur ; relancé, même SHA-256 | oui (3 builds, empreinte identique) |
| Source ou marqueur manquant → message clair, code 1, `requeter.html` intact | oui (`src/app.js`, `vendor/sql-wasm.wasm`, marqueur `@@APP@@`) |
| Fichier unique, ≈ 1 Mo | 976 550 o, aucun fichier voisin requis |
| Hors ligne : une requête (le document), 0 ressource, `SELECT 1 AS test;` → `test = 1` | oui en `file://`, réseau émulé hors ligne + proxy mort, Chrome 154 et Edge 154 (protocole DevTools) ; et en `http://localhost` sur un serveur qui ne sert que le document |
| Aucun `locateFile` dans notre code, aucune `<link>`, aucun `src="http`, aucune police externe | oui |
| Table créée à la volée, NULL visible, 0 ligne → « Aucune ligne. » | oui |
| `SELEC 1;` → `near "SELEC": syntax error` ; `SELECT * FROM inconnue;` → `no such table: inconnue` ; la base survit | oui |
| La base survit entre deux exécutions (`CREATE` seul, puis `SELECT` séparé) | oui, avec les vrais boutons |
| Thème sombre ; < 820 px (rail en barre basse) | oui |
| `Reference/` inchangée | oui |
| Second navigateur | Edge (Chromium) ; Firefox non testé (Q3) |
