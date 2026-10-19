# Requêt'R — Journal des décisions

Format : `D00n — titre`, puis **Contexte / Décision / Conséquences / Statut**.
Une décision n'est jamais réécrite : si elle change, on ajoute une décision qui la remplace et on passe l'ancienne en « Remplacée par D0xx ».
Référence de portage : `Reference/classer-v2.html` (Classe'R), lecture seule, jamais modifiée.
Documents de référence : `SCHEMA.md` (la base de démonstration et ses pièges), `DESIGN.md` (le système de design et ses règles).

## Reprise (à lire en premier dans une nouvelle session)

**État au 2026-10-19, fin du lot 9.** Écrit : le chapitre 0, les 8 chapitres du palier 1 (lot 6), les 11 du palier 2 (`ch-p2-1` à `ch-p2-11`, lot 7), les 14 du palier 3 (`ch-p3-1` à `ch-p3-14`, lot 8) et les 11 du palier 4 (`ch-p4-1` à `ch-p4-11`, lot 9), dans `src/contenu.js` ; 156 exercices en tout (34 du palier 1, `p2-01` à `p2-39`, `p3-01` à `p3-45`, `p4-01` à `p4-38`) ; 9 compétences, dont `joindre` (P3), `sous-requetes` et `classer-cumuler` (P4) actives ; le lexique complet (`CLAUSES` + `VOCABULAIRE`), 33 fiches de clause (11 du palier 1, 9 du palier 2, JOIN/ON/LEFT JOIN au palier 3, 10 nouvelles au palier 4).

**Où en est chaque palier.** Depuis D067, un palier passe à `termine: true` dès que son contenu est écrit et vert (Autotest), sans attendre qu'il ait été joué — la distinction « vert mais pas encore joué », qui a longtemps figuré ici pour P1 à P4, n'a donc plus cours.

| Palier | `termine` | État |
|---|---|---|
| P1 — Lire | `true` | Écrit, vert, et rejoué par l'utilisateur (D059). |
| P2 — Agréger | `true` | Écrit, vert, et confirmé par l'utilisateur (D064). |
| P3 — Croiser | `true` | Écrit, vert. Basculé par D067 (lot 9), sans attendre d'être joué. |
| P4 — Raisonner | `true` | Écrit, vert. Basculé par D067 (lot 9), sans attendre d'être joué. |
| P5 | `false` | Rien d'écrit. |

L'Autotest garantit que chaque requête s'exécute, qu'aucun départ de `corriger` n'est accepté et qu'aucune référence n'est triviale — il ne dit rien de la clarté d'un énoncé, du dosage de la difficulté ni de la progression d'ensemble (D051, pied de rapport). Cette limite reste entière même pour un palier `termine` : `termine: true` ne certifie plus qu'un retour d'usage a eu lieu, seulement que le contenu est écrit et que l'Autotest est vert pour lui.

**La suite est le lot 10 (palier 5, D021 — vocabulaire métier, nettoyage, données sales sur un second jeu de données, `UNION`)**, le dernier palier de contenu. Il ouvre les deux compétences encore vides (`vocabulaire-metier`, `nettoyer-donnees`), construit le second jeu de données (D027, Q4) et est, d'après D048, le moment naturel pour écrire les premières missions transversales — matière suffisante désormais sur quatre paliers. Une fois P5 écrit et basculé par D067, le contrôle de couverture des pièges (D051) devient à son tour bloquant pour TOUS les paliers à la fois : à vérifier avant d'écrire ce lot. Notes laissées pour plus tard (D057/D058, toujours sans correctif) : sur Missions, filtre par palier, distinction Commencer/Reprendre, vue d'ensemble des étapes ; sur Leçons, regroupement du sommaire par palier.

**Décisions récentes à connaître** : D062 (correctif du test SE-04, qui ignorait `predit: "valeur"`) ; D063 (système de design copié littéralement, illustrations en blocs retirées, accueil remanié — trois écarts assumés y sont listés) ; D064 (palier 2 déclaré terminé sans relecture, pour ouvrir le lot 8) ; D065 (palier 3 — portée, découpage en 14 chapitres/45 exercices, et la règle qui réserve le `predire` aux nombres déductibles) ; D066 (palier 4 — portée, découpage en 11 chapitres/38 exercices, rattachement volontairement hors-palier du piège P11 à la compétence `dates`, et la règle d'auteur sur les ex æquo dans les fonctions de fenêtre, au même titre que D029) ; D067 (un palier passe `termine: true` dès qu'il est écrit et vert, sans attendre d'être joué — remplace sur ce point D059/D064/D065/D066 ; P3 et P4 basculés en conséquence).

**Vérifications à rejouer après toute modification** : `node build.mjs`, puis les quatre vérificateurs Node (`verifier-seed.mjs`, `verifier-comparateur.mjs`, `verifier-progression.mjs`, `verifier-autotest.mjs`), puis le scénario navigateur `node outils/cdp.cjs` (Chrome) et `node outils/cdp.cjs edge`, toujours en profil isolé temporaire, jamais `chrome.exe` tel quel. Les quatre et les 2 × 76 vérifications navigateur sont vertes depuis le lot 9 (rejoué après la bascule de D067, aucun contrôle bloquant n'a rien fait apparaître).

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
| 2 | 1 011 332 | 987,6 | `cda275c6e68f0c921513e17284ff6243ff07f0bfde89a7df8c64637c57507145` |
| 3 | 1 092 307 | 1066,7 | `38cf18340c9496aceeb932908121ceb89e08ab95f689217592c4d88421388829` |
| 4 | 1 154 092 | 1127,0 | `22e6167f54f78401f53bb9e783d8352035689db72db428e0eb4807994af3eceb` |
| 6 | 1 243 112 | 1214,0 | `8f68855e92c49c8cbdb2a6df70409e1b25ec32e55536bcd99ec8afc203594b59` |

Lot 5 (Autotest, `verifier-autotest.mjs`) n'a rien ajouté à `requeter.html` : le script est hors livrable (D051), le poids n'a pas été reconsigné séparément.
Répartition au lot 6 (sources, en octets, fins de ligne non normalisées) : `contenu.js` 74 194 (chapitre 0, palier 1, lexique `CLAUSES` complété et `VOCABULAIRE`, D051/D053/D055), `routeur.js` 60 971 (écran Leçons câblé D054, puis corrections D055), `app.js` 40 698 (`Lexique`, garde-fou `remplacerEnfants`, explorateur « voir toutes les lignes », D055), `template.html` 46 201 (`.retour__reveler`, D055), `comparateur.js` 34 254 (inchangé), `exercices.js` 14 478 (inchangé), `seed.sql` 13 261 (gelé, inchangé), `progression.js` 7 859, `moteur.js` 7 830, `store.js` 5 021. Écart avec le lot 4 : + 75 232 o.
*(Première livraison du lot 6, avant l'évaluation du palier 1 par l'utilisateur et les corrections D055 : 1 220 032 o, `1a2bd439…`, `contenu.js` 72 313, `routeur.js` 59 983, `app.js`/`template.html` inchangés depuis le lot 4 ; la ligne ci-dessus est celle d'après D055.)*

Répartition au lot 1 : WASM en base64 ≈ 877 880 o (90 %), sql.js 46 535 o, CSS ≈ 37 Ko, app ≈ 11 Ko.
Répartition au lot 2 (sources, en octets UTF-8) : `app.js` 28 558, `template.html` 42 639 (CSS comprise), `seed.sql` 13 261, `contenu.js` 2 244. Écart avec le lot 1 : + 34 782 o. Le poids n'est plus un critère de lot (voir D024) ; il reste consigné.
*(Première livraison du lot 2 : 1 010 876 o, `e13f0af9…` ; la ligne ci-dessus est celle d'après D027, qui ajoute le paramètre `seed` de `nouvelleBase()`.)*
Répartition au lot 3 (sources, en octets UTF-8) : `app.js` 41 960, `template.html` 45 838 (CSS comprise), `comparateur.js` 34 254, `exercices.js` 14 478, `contenu.js` 10 094, `moteur.js` 7 830, `seed.sql` 13 261. Écart avec le lot 2 : + 80 783 o. Rien ne dépasse ce que D024 tolère.
*(Première livraison du lot 3, avant les corrections de la vérification utilisateur : 1 088 580 o, `9f3caea0…`, `app.js` 39 486, `contenu.js` 8 960 ; la ligne ci-dessus est celle d'après les quatre corrections ci-dessous.)*
Répartition au lot 4 (sources, en octets UTF-8) : `routeur.js` 50 265 (neuf : Routeur, Vues, Session, Parcours, Mission, Affichage, onboarding), `app.js` 34 468, `template.html` 46 008 (CSS comprise, **inchangée** : §8/§9/§11 du lot 1 couvraient déjà carteRetour/Progression/audit), `comparateur.js` 34 254, `contenu.js` 16 091 (9 compétences + 20 certifications), `exercices.js` 14 478, `seed.sql` 13 261, `progression.js` 7 859 (neuf), `moteur.js` 7 830, `store.js` 5 021 (neuf). Écart avec le lot 3 : + 61 785 o. Rien ne dépasse ce que D024 tolère (aucun budget, seul le seed est plafonné et il n'a pas bougé).

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

## D012 — Domaine « boutique en ligne » et schéma à cinq tables, en français

**Contexte.** Le schéma et le jeu de données porteront les ~120 exercices des 5 paliers ; une erreur de conception se paie sur tout le contenu. L'application démarre au niveau 0, pour un public francophone qui n'a jamais vu de base de données : traduire mentalement les noms de colonnes ajouterait une charge cognitive inutile au moment où l'on découvre `SELECT` et `FROM`.
**Décision.** Domaine e-commerce (neutre, c'est le domaine de référence de la plupart des cours SQL). Cinq tables : `categories`, `produits`, `clients`, `commandes`, `lignes_commande`, **noms de tables et de colonnes en français**. Chaque table existe parce qu'un piège pédagogique l'exige ; rejetés : 3 tables à lignes aplaties (plus de relation N–N ni de gonflement du `SUM`), 7 à 8 tables façon Northwind (charge cognitive sans piège de plus), hiérarchie de catégories (la récursion est portée par le parrainage). Aucun total stocké dans `commandes` (redondant, divergeable).
**Conséquences.** Documenté dans `SCHEMA.md` (rôle des tables, carte des relations, recensement des pièges, matrice de couverture). 289 lignes (7 + 30 + 40 + 70 + 142). Un pack en anglais pourra venir plus tard (les bases d'entreprise le sont souvent), de même qu'un pack « assurance » pour les missions : **rien n'est préparé pour cela** (`SEED_SQL` reste une constante unique).
**Statut.** Acceptée. Voir D013 à D015 pour les trois choix qui dépassent le brief initial.

## D013 — Plages d'identifiants disjointes par table

**Contexte.** Avec des identifiants 1..N partout, une jointure sur les mauvaises colonnes (`clients.id = commandes.id`) renvoie un résultat plausible mais faux, que le débutant ne détecte pas.
**Décision.** Catégories 1–7, produits 101–130, clients 201–240, commandes 1001–1070 ; identifiants écrits en dur dans le seed, jamais auto-générés. Une jointure fausse donne un résultat **vide**, donc visible, et un identifiant se reconnaît d'un coup d'œil (1042 est une commande).
**Conséquences.** Vérifié par `verifier-seed.mjs` (C2-id). Décision au-delà du brief initial.
**Statut.** Acceptée.

## D014 — `frais_port` est porté par la commande (pas par la ligne)

**Contexte.** Le piège n°1 des débutants, le gonflement d'un `SUM` après jointure, exige un montant **porté par le parent** et répété par chaque ligne enfant. Si seules les lignes portent des montants, joindre puis sommer est *correct* et le piège n'a rien à montrer.
**Décision.** `commandes.frais_port` : frais de la commande **entière**, comptés une seule fois. Valeurs 0 / 4,50 / 6,50 selon le total des produits de la commande (règle dans `SCHEMA.md` §5).
**Conséquences.** `SUM(frais_port)` vaut 306,50 sur `commandes` et 636,00 après jointure avec `lignes_commande`. Rend aussi nécessaire la distinction « chiffre d'affaires produits » / « total » (D020). Décision au-delà du brief initial.
**Statut.** Acceptée.

## D015 — `parrain_id` : auto-jointure et piège `NOT IN` + NULL

**Contexte.** `NOT IN` avec un NULL dans la sous-requête renvoie zéro ligne, quelles que soient les données : piège classique que seule une colonne auto-référencée à majorité de NULL permet de montrer naturellement.
**Décision.** `clients.parrain_id` référence `clients.id` (9 parrainages, 31 NULL, chaîne de 4 niveaux 201 → 203 → 206 → 214). L'auto-jointure et le piège `NOT IN` + NULL sont **au programme** ; la CTE récursive est un **bonus du palier 5, jamais exigée**.
**Conséquences.** `id NOT IN (SELECT parrain_id FROM clients)` → 0 ligne contre 31 avec `NOT EXISTS`. L'explorateur doit représenter une auto-référence (boucle sur la carte). Décision au-delà du brief initial.
**Statut.** Acceptée.

## D016 — Montants en multiples de 0,25 : écart assumé au réel

**Contexte.** Les flottants binaires ne représentent pas exactement 9,99 ; une somme de prix en `,99` s'affiche `59.97000000000001`, ce qui trouble un débutant et obligerait le comparateur (Q1) à une tolérance sur les `SUM`.
**Décision.** `prix`, `frais_port` et `prix_unitaire` sont des `REAL` **multiples de 0,25**. C'est un **écart assumé au réel** (il n'existe aucun prix en `,99` dans cette base) au profit de sommes exactes et d'un comparateur sans tolérance sur les `SUM`. Les `AVG` restent le lieu où les décimales apparaissent, donc où `ROUND` s'enseigne. Rejetés : entiers en centimes (`1999` illisible au niveau 0) et `REAL` libre.
**Conséquences.** Vérifié par `verifier-seed.mjs` (C12e, 0 violation). Le comparateur du lot 3 garde une tolérance à décider pour les `AVG` (Q1).
**Statut.** Acceptée.

## D017 — Identifiants et valeurs énumérées en ASCII ; règle d'ordre des accents

**Contexte.** SQLite ne replie la casse que sur l'ASCII, et un accent à saisir bloque un débutant (`'annulée'` contre `'annulee'`). Par ailleurs `ORDER BY` trie en binaire : « Élodie » passerait après « Zoé », et « Léa » après « Lucas ».
**Décision.** Noms de tables et de colonnes en snake_case ASCII. Valeurs énumérées en ASCII : statuts `en_preparation`, `expediee`, `livree`, `annulee`, `retournee` (« annulée » dans le brief initial relevait de la prose, pas d'une spécification). Les noms, prénoms, villes, produits gardent leurs accents **à condition que `ORDER BY` donne l'ordre alphabétique attendu** : pas d'accent en initiale ni en deuxième position (« Cordon HDMI », « Lise », « Thomas »).
**Conséquences.** Contrôles C14j, C14k, C14l. Limite connue et documentée : `UPPER`, `LOWER`, `LIKE` ne gèrent que l'ASCII dans SQLite.
**Statut.** Acceptée.

## D018 — Date de référence : 2026-06-30

**Contexte.** « Aujourd'hui » ne peut pas être `date('now')` (D001). C'est le même principe que la « date de contrôle en B8 » de la mission mis-05 de Classe'R : l'apprenant calcule par rapport à une date fixe.
**Décision.** Le **30 juin 2026** (`'2026-06-30'`) tient lieu d'« aujourd'hui » dans tous les exercices sur les délais, retards, ancienneté. Elle n'est **pas dans la base** : les consignes l'écrivent en littéral ; l'explorateur l'affiche (`CONTENU.base.dateReference`). La dernière commande date du 2026-06-29.
**Conséquences.** Aucune date de la base n'est postérieure à cette date (contrôle C14d). Voir D022 pour le cas de l'apprenant qui écrit `date('now')`.
**Statut.** Acceptée.

## D019 — Clés étrangères déclarées et appliquées

**Contexte.** Les clés étrangères enseignent la structure et l'explorateur les lit. Dans ce sql.js (SQLite 3.49.1), `PRAGMA foreign_keys` vaut **0 par défaut** (relevé à l'exécution) : déclarées mais non appliquées.
**Décision.** `PRAGMA foreign_keys = ON;` en tête de `src/seed.sql` (rejoué à chaque base neuve). Cinq clés étrangères déclarées au niveau table (`FOREIGN KEY (…) REFERENCES …`), dont une auto-référence. Le seed s'auto-vérifie au chargement ; un `INSERT` hors relation échoue avec `FOREIGN KEY constraint failed` ; `DROP TABLE` d'une table référencée est refusé.
**Conséquences.** `INSERT` / `UPDATE` / `DELETE` / `CREATE` sont hors programme principal (D021) : les FK servent ici à enseigner la structure et à l'auto-contrôle du seed.
**Statut.** Acceptée.

## D020 — Deux définitions du chiffre d'affaires, jamais « le chiffre d'affaires » seul

**Contexte.** Le mot « chiffre d'affaires » cache le fait qu'on exclut les frais de port, et ne dit pas quels statuts sont inclus. Sur 120 exercices, une ambiguïté de vocabulaire coûte cher.
**Décision.** **Chiffre d'affaires produits** = somme de `quantite × prix_unitaire` des lignes dont la commande n'est ni `annulee` ni `retournee` (exclut `frais_port`). **Chiffre d'affaires total** = chiffre d'affaires produits + `frais_port` des mêmes commandes, comptés une fois par commande. **Toute consigne d'exercice qui parle d'argent dit explicitement lequel des deux elle demande.** Un exercice « réfléchir à ce qu'on inclut » demande explicitement une autre définition.
**Conséquences.** Valeurs de référence : 12 387,00 et 12 619,00 (voir `SCHEMA.md` §7). À reprendre mot pour mot par les lots de contenu et par l'Autotest du lot 5.
**Statut.** Permanente.

## D021 — Programme des cinq paliers

**Contexte.** Le programme n'était nulle part dans le dépôt ; la matrice de couverture de `SCHEMA.md` en dépend.
**Décision.**

| Palier | Titre | Contenu |
|---|---|---|
| P1 | Lire | `SELECT`, `FROM`, `WHERE`, `ORDER BY`, `LIMIT`, `DISTINCT`, alias |
| P2 | Agréger | `COUNT` / `SUM` / `AVG` / `MIN` / `MAX`, `GROUP BY`, `HAVING`, `CASE WHEN`, fonctions de date |
| P3 | Croiser | `INNER` et `LEFT JOIN`, jointures multiples, anti-jointure, et surtout les pièges : gonflement du `SUM`, NULL après jointure, filtre en `WHERE` contre en `ON` |
| P4 | Raisonner | sous-requêtes (dont corrélées), CTE, fonctions de fenêtre (`ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `SUM OVER`), top-N par groupe, cumuls |
| P5 | Métier | données sales **issues d'un second jeu de données, séparé du seed principal (D027)**, contrôles de cohérence (sur ce même jeu), traduire une question métier floue, `UNION`, notion d'index en culture générale |

`INSERT` / `UPDATE` / `DELETE` / `CREATE` : **hors programme principal** (un data analyst junior lit, il n'écrit presque jamais) ; une leçon de culture générale au palier 5, pas d'exercices. **`FULL JOIN` : hors programme.** CTE récursive : bonus du palier 5, jamais exigée.
**Conséquences.** Pas de « commandes invité » (`client_id` NULL) : elles compliqueraient tous les calculs par client pour un gain nul. *Mise à jour au lot 2 validé :* les « données sales » et les « contrôles de cohérence » du palier 5 supposent des anomalies que le seed principal, propre et gelé, ne contient pas ; elles viennent donc d'un **second jeu de données** séparé (D027, option (b) de Q4). Le palier 5 ci-dessus a été mis à jour en conséquence.
**Statut.** Acceptée.

## D022 — Requête d'apprenant contenant `date('now')` : message dédié (exécution au lot 3)

**Contexte.** D001 ne couvre que les solutions de référence. Une requête d'apprenant qui écrit `date('now')` donne un résultat différent de la solution, et un simple « résultat incorrect » le laisserait sans piste.
**Décision.** Le comparateur (lot 3) **détecte** `date('now')`, `datetime('now')`, `CURRENT_TIMESTAMP` et `random()` dans la requête de l'apprenant et affiche un **message dédié** renvoyant à la date de référence (D018) au lieu d'un simple « résultat incorrect ». Décidé maintenant, **implémenté au lot 3**.
**Statut.** Acceptée.

## D023 — `nouvelleBase()` ; explorateur sur la base vivante ; `piegeFocus` porté

**Contexte.** D008 nomme `Moteur.reinitialiser()` comme la primitive ; le brief du lot 2 demande une fonction `nouvelleBase()` appelée à chaque exercice, qui mesure son temps. Le Lexique de Classe'R s'appuie sur `piegeFocus`, prévu au lot 4.
**Décision.** `Moteur.reinitialiser()` reste la primitive (D008 n'est pas réécrite). **`nouvelleBase()`** (`app.js`) est la fonction appelée à l'entrée de chaque exercice : elle rejoue le seed, **mesure** (`performance.now()`) et consigne le temps dans `Moteur.etat.msBase`. L'**explorateur de schéma** lit la base **vivante** (`Moteur.schema()`, lecture seule) : qu'un `DROP TABLE` ou un `DELETE` se voie est pédagogique, pas gênant. `piegeFocus` et le handler Échap global sont **portés tels quels** de Classe'R dès ce lot (comme `el()` et `Toast` en D009) ; le lot 4 ne les reportera pas.
**Conséquences.** Reconstruction mesurée sur 7 exécutions de 50 reconstructions (Chrome et Edge 154, `file://`) : **médiane 3,4 à 7,9 ms**, maximum 19,3 ms (les valeurs hautes datent des exécutions où deux navigateurs tournaient en même temps) ; la **toute première** construction, à froid, prend ≈ 60 à 74 ms. Replay du seed (aucun instantané à optimiser). Seuil proposé : médiane ≤ 50 ms, tenu avec un facteur ≥ 6. La signature de `nouvelleBase()` accepte un seed en paramètre depuis D027.
**Statut.** Acceptée.

## D024 — Poids : plus de budget global ; plafond du seed à 40 Ko, pour la vitesse

**Contexte.** Le brief du lot 2 estimait un budget d'environ 100 Ko pour le code et le contenu ; il a été retiré (« le fichier fera 1,2 ou 1,4 Mo, personne ne le remarquera pour un fichier local »).
**Décision.** Plus de budget de poids pour `requeter.html`. Le **seul plafond qui tient** est celui du seed : **40 Ko**, cible 18 Ko, **pour la vitesse de reconstruction** (il est rejoué à chaque `nouvelleBase()`, donc à chaque exercice), non pour les octets. Le poids et l'empreinte restent consignés en tête de ce journal.
**Conséquences.** Seed du lot 2 : 13 261 o. `verifier-seed.mjs` contrôle le plafond (C1).
**Statut.** Acceptée.

## D025 — Le seed est gelé à la validation du lot 2

**Contexte.** ~120 exercices dépendront des valeurs exactes du seed, et l'Autotest du lot 5 rejoue leurs solutions contre lui.
**Décision.** **`src/seed.sql` est gelé à la validation du lot 2.** Toute évolution : nouvelle décision dans ce journal, modification du seed, `node verifier-seed.mjs` au vert, mise à jour de `SCHEMA.md` (valeurs de référence, recensement), puis, à partir du lot 5, rejeu de l'Autotest sur tous les exercices existants.
**Conséquences.** Le gel est **mécanique** : `verifier-seed.mjs` contient un critère « GEL » qui compare l'empreinte du seed à la constante `GEL_SHA256` ; toute modification du seed le fait échouer, et la constante ne se met à jour qu'avec la nouvelle décision. Les anomalies délibérées sont exclues du seed principal (D027).
**Empreinte du seed gelé** (SHA-256, 13 261 o, fins de ligne normalisées en `\n` comme le fait `build.mjs`, donc indépendante de la conversion CRLF de Git) : `04c2308d1ae580da94274b190e2a5124720e00eaa89f6c2670102af1d806d9c6`.
**Statut.** Permanente. **En vigueur : seed gelé le 2026-10-06, à la validation du lot 2.**

## D026 — `verifier-seed.mjs` est dans le dépôt, hors livrable

**Contexte.** Le recensement des pièges de `SCHEMA.md` ne vaut que si les données le confirment encore après chaque modification.
**Décision.** `verifier-seed.mjs` (racine du dépôt, aucune dépendance, jamais inliné dans `requeter.html`) charge `vendor/sql-wasm.js` et `src/seed.sql` dans Node et rejoue **71 critères** (volumes, intégrité, chaque piège P1 à P11, invariants, déterminisme, exemple à refaire à la main, et depuis le gel le critère « GEL » de D025 ; 70 avant) ; code retour 1 au moindre écart. Il imprime aussi les valeurs de référence à reporter dans `SCHEMA.md`.
**Conséquences.** Le futur Autotest du lot 5 le complète (solutions des exercices) sans le remplacer. Seule hypothèse vérifiée : sql.js se charge sous Node sans modification (Node 24).
**Statut.** Acceptée.

## D027 — Les « données sales » viennent d'un second jeu de données, pas du seed principal

**Contexte.** Le programme du palier 5 (D021) annonce « données sales » et « contrôles de cohérence », alors que le seed principal est propre par construction, gelé (D025), avec des invariants vérifiés : la contradiction venait du brief, pas du travail (voir Q4). Des anomalies délibérées *dans* le seed obligeraient les consignes à écrire « sauf la ligne 217 » et rendraient le vérificateur ambigu : il ne saurait plus distinguer une anomalie voulue d'une régression. Sur le fond pédagogique : en entreprise on ne reçoit pas une base propre avec trois saletés dedans, on reçoit un **export brut**, et le nettoyage est une étape à part entière avant l'analyse. Deux bases séparées enseignent cette séparation ; une base hybride la brouille.
**Décision.** Option (b) de Q4 : un **second jeu de données, séparé du seed principal**, réservé au palier 5. Le seed principal n'est pas touché. **Le jeu sale n'est pas construit** : il naîtra au lot du palier 5, quand les exercices qui le consomment seront écrits. Il devra être **chargeable à la place du seed principal** ; pour cela `nouvelleBase()` accepte un seed en paramètre, **à partir de maintenant** : `nouvelleBase(seed = SEED_SQL)`, de même que `Moteur.reinitialiser(seed = SEED_SQL)`. Seule la signature est livrée ; aucun second jeu n'existe.
**Conséquences.** Pour le lot du palier 5 (rien de tout cela n'est fait) : un fichier source et un marqueur dans `build.mjs`, une constante globale (par exemple `SEED_SALE_SQL`) que les exercices passent à `nouvelleBase(...)` ; tous les autres exercices appellent `nouvelleBase()` sans argument. La liste des **anomalies connues** vit avec ce jeu et son propre vérificateur : celui du seed principal reste **sans aucune exception**. Chaque seed est responsable de ses propres `PRAGMA` : le seed principal active `foreign_keys` ; un seed passé sans `PRAGMA` donne `foreign_keys = 0` (vérifié), ce qui convient à un export brut. Rien n'est mémorisé : l'appel suivant sans argument revient au seed principal. L'explorateur lit la base chargée et suit sans modification (vérifié : une base à une table, sans relation, s'affiche avec un message dédié). D001 s'applique au jeu sale (constantes littérales uniquement).
**Vérifié au lot 2** (Chrome et Edge, `file://`) : `nouvelleBase()`, `nouvelleBase(undefined)` et le retour au seed principal donnent 5 tables, clés étrangères actives ; `nouvelleBase(autreSeed)` remplace le seed principal.
**Statut.** Acceptée. Code : signature seulement.

## D028 — On compare le résultat, jamais le texte de la requête ; un refus à tort est bien pire qu'une acceptation à tort

**Contexte.** Q1 : comment comparer le jeu de résultats d'un apprenant à celui de la solution. Le danger est asymétrique : un comparateur trop strict qui refuse une réponse correcte fait perdre confiance dans l'outil et pousse à l'abandon ; un comparateur trop laxiste laisse l'apprenant apprendre quand même.
**Décision.** (1) Toute requête qui produit le bon jeu de résultats est acceptée, quelle que soit sa forme (alias ou non, `JOIN` explicite ou `WHERE`, sous-requête ou CTE, casse et espacement). (2) En cas de doute sur un cas limite, on tranche vers l'**acceptation**. (3) Le comparateur est **pur** (ni DOM, ni date, ni hasard : D001) ; il vit dans `src/comparateur.js` et se teste sans navigateur. Conséquence assumée, inhérente à la comparaison par résultat : `SELECT 36;` passe si 36 est la bonne valeur (voir D034 pour ce qu'on fait pour ne pas la tendre à l'apprenant).
**Conséquences.** Les cas limites sont tranchés par D029 à D033 ; chacun a sa paire (attendu, obtenu) dans `verifier-comparateur.mjs`. Exemple parlant, relevé aux tests : `prix > 200` est **accepté** pour « prix supérieur à 100 » car aucun produit du seed ne coûte entre 100 et 200 € : même résultat.
**Statut.** Permanente.

## D029 — Lignes : multi-ensemble par défaut ; `ordonne` ; ex æquo libres ; précision de D001

**Contexte.** « Trie par prix décroissant » est vérifiable malgré les ex æquo du seed (SCHEMA.md P5 : 1 299 ×2, 449 ×2, 29 ×2) à condition de ne pas exiger un départage que la consigne ne demande pas. D001 écrit « pas de résultat comparé sans `ORDER BY` total, sauf comparaison non ordonnée déclarée par l'exercice ».
**Décision.** Par défaut, **comparaison en multi-ensemble** : l'ordre des lignes est ignoré, les doublons comptent (un `DISTINCT` en trop ou en moins change le résultat). Un exercice déclare `comparer.ordonne` : `true` (ordre exact sur toutes les colonnes ; la consigne donne alors un ordre total) ou **`{ cles: [indices de colonnes] }`, la forme normale** : l'ordre n'est exigé que sur ces colonnes, les lignes de même clé (ex æquo) peuvent arriver dans n'importe quel ordre entre elles. Algorithme : le résultat attendu est découpé en séquences de clé identique ; la ligne du même rang du résultat obtenu doit appartenir à la même séquence. Message dédié quand les lignes sont les bonnes et l'ordre non.
**Précision de D001 (D001 n'est pas réécrite).** Une comparaison à ex æquo libres est **déterministe** : le verdict ne dépend pas de l'ordre arbitraire des ex æquo. Elle relève de l'esprit de D001, bien qu'elle ne soit littéralement ni « `ORDER BY` total » ni « non ordonnée ». La solution de référence, elle, garde un `ORDER BY` total (`ORDER BY prix DESC, id`).
**Règles d'auteur** (à contrôler par l'Autotest du lot 5) : (a) la clé de tri figure dans le `SELECT`, sinon la consigne exige un ordre total ; (b) jamais `cles` quand un `LIMIT` peut couper un groupe d'ex æquo (`ORDER BY prix DESC LIMIT 3` coupe 102/103) : ordre total en consigne, ou un rang (`DENSE_RANK`), ce qui est la leçon de P5 ; (c) la consigne énumère les colonnes dans l'ordre attendu (D030).
**Statut.** Acceptée.

## D030 — Colonnes : noms ignorés par défaut ; ordre positionnel

**Décision.** Les **noms** de colonnes sont ignorés (`AS total_ventes` pour `AS total` est juste sur le fond). `comparer.colonnes: true` les impose, **sans casse ni espaces de bord** (les identifiants SQL sont insensibles à la casse). L'**ordre des colonnes** est significatif : comparaison positionnelle. Diagnostics dédiés : « les bonnes colonnes dans un autre ordre » (une permutation redonne les mêmes lignes), « une colonne en trop » / « il manque une colonne » (une injection des colonnes de l'un dans l'autre redonne les mêmes lignes), « valeurs justes, mais la consigne impose le nom X ».
**Statut.** Acceptée.

## D031 — Valeurs : nombres, NULL, texte, types mixtes, blobs

**Décision.**
- **Nombres** : tolérance relative `|a − b| ≤ 1e-9 · max(1, |a|, |b|)`. Le bruit des doubles est ≈ 1e-16 (≤ 1e-13 après des sommes de quelques centaines de termes) ; le plus fin arrondi qu'une consigne puisse demander, `ROUND(x, 2)`, a une résolution de 1e-2, sept ordres de grandeur plus haut : une solution qui arrondit et une qui n'arrondit pas ne sont **jamais confondues** (`AVG(prix)` = 165,30833… contre `ROUND(…, 2)` = 165,31), sauf si la valeur non arrondie *est* déjà arrondie (même résultat, donc acceptées). `1` et `1.0` sont le même résultat (sql.js rend un seul type nombre). L'appariement trie avec un comparateur tolérant (pas de clé arrondie : un arrondi crée des frontières où deux valeurs quasi égales tombent de part et d'autre).
- **NULL** : égal à NULL seulement ; distinct de `0`, de `''` et de la chaîne `'NULL'`.
- **Texte** : strict (normalisation Unicode NFC, invisible). Option d'exercice **`texte: "souple"`** (bords et casse ignorés) pour les exercices dont le résultat contient du texte que l'**apprenant saisit lui-même** (libellés d'un `CASE WHEN`, séparateurs d'une concaténation) : `'Haut'` contre `'haut'` y est une faute de frappe, pas une erreur de SQL. Quand le mode strict refuse des valeurs justes à la casse ou aux espaces de bord près, le message le dit. Le palier 5 (casse à nettoyer) reste strict : c'est ce qu'il enseigne.
- **Types mixtes** : un texte qui est **exactement l'affichage d'un nombre** (`String(Number(s)) === s`) est ce nombre : `"2025"` (`strftime`) = `2025` (`CAST`). `"007"` (`String(7)` = « 7 »), `"3.50"` (mise en forme `printf`) et `"1e3"` restent du texte : l'affichage diffère. *(Écart de rédaction avec le plan, même intention : une regex de nombre aurait confondu `"3.50"` et `3.5`.)*
- **Blobs** : comparés octet par octet.
**Conséquences.** **Q2 close** : au-delà de 2^53 deux entiers distincts se confondent ; cela ne produit qu'une acceptation à tort, dans le sens voulu (D028).
**Statut.** Acceptée.

## D032 — Deux exécutions : « Exécuter » sur la base vivante, « Vérifier » sur une base jetable

**Contexte.** D008 : chaque exercice repart d'une base propre. Mais rien n'empêche techniquement l'apprenant d'écrire un `DELETE` dans l'éditeur, et `INSERT … RETURNING` **renvoie des colonnes ET écrit**, donc « a des colonnes » (D010) ne suffit pas à repérer une écriture.
**Décision.** **Exécuter** (Ctrl/Cmd + Entrée) tourne sur la base **vivante**, celle que l'explorateur affiche ; les écritures y restent possibles (D023), « Réinitialiser la base » remet à neuf, une note dit quand la base a été modifiée. **Vérifier** (Ctrl/Cmd + Maj + Entrée) exécute la requête sur une **base jetable reconstruite à neuf** (`Moteur.executerIsole`, ≈ 4 à 8 ms par D023) ; le résultat attendu est calculé **une fois à l'entrée de l'exercice**, sur une base propre, et mis en cache. Un `DELETE` lancé plus tôt ne peut donc pas fausser le verdict. Écriture détectée par `total_changes()` et `PRAGMA schema_version` avant / après. Verdicts **« non évalué »** (ni réussite ni « résultat incorrect », ne comptent pas comme une tentative) : requête **vide** (commentaires seuls compris), **erreur SQLite** (message brut, tel quel), **écriture** (« hors programme », D021), **aucun jeu de résultats** (`PRAGMA` seul), **délai dépassé**. **Plusieurs instructions** : le dernier jeu de résultats est évalué, avec une note visible (D028 : un refus ne gagne rien, une acceptation ne coûte rien).
**Statut.** Acceptée.

## D033 — Déterminisme côté apprenant (met en œuvre D022)

**Décision.** Le comparateur détecte, **commentaires retirés** et par un petit lexeur (un littéral ou un commentaire n'est pas du code), les constructions qui rendent un résultat dépendant du jour ou du hasard : `'now'` passé à `date`, `time`, `datetime`, `julianday`, `strftime`, `unixepoch` ou `timediff` ; `CURRENT_DATE`, `CURRENT_TIME`, `CURRENT_TIMESTAMP` ; `random()`, `randomblob()` ; et — **découvert à l'implémentation** — les appels **sans date**, qui lisent eux aussi l'horloge : `date()`, `time()`, `datetime()`, `julianday()`, `unixepoch()` et `strftime(format)` à un seul argument. La liste de D022 (`date('now')`, `datetime('now')`, `CURRENT_TIMESTAMP`, `random()`) est étendue, D022 non réécrite ; `julianday('now')` et `strftime(…, 'now')` sont les formes que P11 (retards) appelle naturellement. **Si le résultat est incorrect** : message dédié (« votre requête utilise la date du jour… ici “aujourd'hui” vaut le 30 juin 2026 ('2026-06-30') », ou sur le hasard) ; l'écart observé est conservé à part. **Si le résultat est correct malgré tout** : accepté, avec une note (« ça marche aujourd'hui, pas demain »).
**Statut.** Acceptée.

## D034 — Message d'écart : un constat (fait) et des pistes (faits ou lieux, jamais une hypothèse) ; un attendu 1×1 n'est jamais affiché

**Contexte.** « Résultat incorrect » n'apprend rien ; la nature de l'écart désigne un endroit où chercher. Mais une piste précise et incertaine qui s'affiche au mauvais moment envoie l'apprenant chercher au mauvais endroit, ce qui est pire que pas de piste.
**Décision.** Le comparateur **décrit l'écart observé** (le *constat*, toujours vrai) puis n'offre une *piste* que si c'est un fait ou un lieu où regarder. **Entre une piste précise mais incertaine et le seul constat, il donne le constat.** Il ne lit jamais le texte de la requête (sauf D033). Catalogue, première règle qui s'applique : aucune ligne ; colonne en trop / manquante ; nombre de colonnes différent ; mêmes lignes dans un autre ordre ; noms de colonnes ; colonnes dans un autre ordre ; justes à la casse près ; une seule ligne (et l'inverse) ; doublons ; lignes en trop ; lignes manquantes ; mêmes forme et cellules différentes (NULL d'un seul côté, partie entière, arrondi, valeurs proches) ; recouvrement partiel ; plus, hors comparateur : plafond de lecture (`trop-de-lignes`). Le seuil de 10 % de « valeurs proches » ne choisit que le libellé, jamais le verdict. **Arbitrage de l'utilisateur** : le résultat attendu est affiché côte à côte (8 premières lignes de chaque côté) dès qu'il a **plus d'une cellule** ; pour **une seule cellule**, ni sa valeur ni rien qui la devine (écart relatif, inclusion) n'est dit : constat et diagnostics (arrondi, partie entière, NULL, proches), qui instruisent sans livrer la réponse. Quand l'ordre des lignes ne compte pas, les lignes sans équivalent de l'autre côté sont **placées en premier** et surlignées, pour que l'écart se voie même à la 15e ligne. Une section « Écart » liste jusqu'à 3 lignes manquantes et 3 en trop.
**Statut.** Acceptée.

## D035 — `predire` : annoncer un nombre de lignes ou une valeur, réponse calculée

**Contexte.** Annoncer un tableau entier de résultats est fastidieux et sensible au format. Tous les pièges de SCHEMA.md se prédisent par un nombre (P1 34 contre 40, P4 70 contre 142, P9 0 contre 31…), et un nombre libre se devine mal.
**Décision.** Deux questions possibles, champ `predit` de l'exercice : `"nbLignes"` (un entier, « 76 » ou « 76 lignes ») et `"valeur"` (résultat d'**une seule** cellule : nombre avec virgule ou point, `NULL` en toutes lettres, ou texte). La **bonne réponse est calculée** en exécutant la requête sur une base propre, jamais saisie : elle ne peut pas diverger du seed (D025). La valeur se compare par le même test de cellule que le comparateur. Saisie illisible : non évalué, ne compte pas, on peut réessayer. Après une réponse, bonne ou fausse, le **vrai résultat est montré**. L'écran n'affiche pas d'éditeur ; « avant d'exécuter » n'est pas imposable (l'apprenant peut recopier la requête dans le bac à sable) et on ne cherche pas à l'imposer.
**Statut.** Acceptée.

## D036 — Plafond de lecture (10 000 lignes) et délai (3 s) ; pas de Worker

**Contexte.** `Moteur.executer` (lot 2) lisait **toutes** les lignes dans des tableaux JS. `FROM clients, commandes, lignes_commande, produits` en produit 11,9 millions ; un débutant qui oublie le `ON` gèle l'onglet.
**Décision.** La lecture s'arrête à **10 000 lignes** par jeu de résultats (marqueur `tronque`) et abandonne au-delà de **3 s** (contrôle toutes les 256 lignes, jeu partiel conservé). L'affichage reste limité à 500 lignes. Au comparateur, un résultat tronqué face à un attendu plus petit est forcément faux (« plus de 10 000 lignes obtenues »). Le plafond ne vaut que pour la requête de l'**apprenant** : les solutions de référence ne sont pas plafonnées (`plafond: false`) ; l'Autotest du lot 5 signalera tout résultat de référence de plus de 10 000 lignes. Le plus grand résultat légitime du seed fait 142 lignes.
**Limite assumée, consignée.** Un `step()` n'est pas interruptible : un `COUNT(*)` sur le produit cartésien des 5 tables (83,5 millions de lignes) prend **2,7 s** en un seul `step()` (mesuré), un calcul plus lourd serait plus long. **Pas de Worker** (changement d'architecture, décidé par l'utilisateur).
**Statut.** Acceptée.

## D037 — Tentatives : interface itérative ; le comptage est décidé au lot 4

**Contexte.** Classe'R n'a qu'une réponse « officielle » puis un « essai libre » sans effet. En SQL on exécute, on regarde, on corrige ; une faute de frappe punie à vie découragerait exactement ce qu'on veut encourager.
**Décision.** L'interface est **itérative** : l'apprenant corrige et revérifie librement. Chaque retour expose `{ reussi, tentatives, indices }` ; les verdicts « non évalué » **ne comptent pas** comme une tentative. **La politique de comptage** (maîtrise, XP, consolidation) **est décidée au lot 4, avec Progression.** Brouillons et état d'exercice : en mémoire seulement (jamais persistés : Store, lot 4). Les types à réponse unique (`qcm`, `predire`) se verrouillent après la première réponse comptée et montrent aussitôt l'explication.
**Statut.** Acceptée (comptage : à décider au lot 4).

## D038 — Structure des sources du lot 3 ; `Moteur` sorti de `app.js` ; la suite de tests charge les vrais fichiers

**Décision.** `src/moteur.js` (le `Moteur` du lot 2, sans DOM, plus `executerIsole`, le rapport d'exécution, le plafond et le délai ; et `nouvelleBase`), `src/comparateur.js` (pur), `src/exercices.js` (`TYPES_EXERCICE` : une entrée par type, `Indices`, `Attendus` ; `valider` pur, `rendre` seul à toucher le DOM), `src/contenu.js` (`CLAUSES`, exercices de démonstration), chargés dans cet ordre avant `app.js`. `verifier-comparateur.mjs` (hors livrable, aucune dépendance) charge ces **vrais fichiers** sous Node par une évaluation indirecte et rejoue la suite : comparateur, moteur, diagnostics sur du SQL réel du seed, garde-fous, familles de formulations, exercices de démonstration, contrôles QCM, pureté. `node verifier-comparateur.mjs --messages` imprime les textes tels que l'apprenant les lit. `Indices.pour` : Piste → **Clause** (tirée de `CLAUSES`, le futur lexique SQL) → Exemple → solution révélée en dernier (« Une solution possible » ; `predire` n'en révèle aucune).
**Statut.** Acceptée.

## D039 — Q3 (Firefox) close, définitivement

**Décision.** Le test sur Firefox n'est plus une question ouverte du projet. Chrome et Edge valident ce qui était fragile (`file://` + WASM embarqué) ; l'utilisateur le fera lui-même un jour s'il en a l'envie. Aucun correctif ni vérification n'est attendu à ce sujet.
**Statut.** Acceptée.

## D040 — Q5 : mélange des QCM par FNV-1a ; contrôle de distribution bilatéral (plafond et plancher)

**Contexte.** `ordreAffichage`, repris de Classe'R, dérivait sa graine d'une somme de caractères (modulo 100 000) puis tirait par un congruentiel dont les produits dépassent 2^53 (précision perdue en JavaScript). Mesuré sur 350 familles d'identifiants séquentiels : **au cumul, l'ancien mélange était uniforme** (χ² sous le seuil à 1 %) ; son défaut est un **regroupement à l'intérieur d'une famille d'identifiants consécutifs** : à 30 identifiants, 71 % des familles avaient une position sous 15 % de bonnes réponses, contre 38 % pour un tirage parfaitement uniforme (cas qui a donné l'alerte : `ex-001…040` → 8, 15, 14, 3, la position D n'ayant que 3 bonnes réponses). Le contrôle de l'Autotest (≤ 45 % à une même position) ne voit que la sur-représentation, jamais la sous-représentation.
**Décision.** (1) La graine est le **FNV-1a 32 bits des octets UTF-8 de l'identifiant** ; le flux pseudo-aléatoire est mulberry32 (entiers 32 bits sûrs) ; le tirage reste un Fisher-Yates. Le mélange reste **déterministe et ne dépend que de l'identifiant**. (2) Le contrôle de distribution est **bilatéral** : `TYPES_EXERCICE.qcm.controleDistribution(positions, nbOptions)` applique un **plafond de 45 %** dès 10 QCM et un **plancher dès 20 QCM**. Le plancher dépend de la taille de l'échantillon : `min(15 %, 1/k − 2,5 écarts-types d'un tirage uniforme)`, soit 0,8 % à 20 QCM, 7,9 % à 40, 14,2 % à 100, 15 % au-delà (pour 4 options ; il suit 1/k pour 3 ou 5). **Un plancher fixe à 15 % a été écarté** : sur un tirage parfaitement aléatoire il se déclencherait pour 38 % des lots de 30 QCM et 18 % des lots de 40 (mesuré), ce qui n'a rien d'un défaut du contenu. Avec le plancher variable, un lot aléatoire déclenche encore ≈ 3 % du temps : **en cas d'alerte, changer un identifiant** (le mélange en dépend).
**Vérifié** (`verifier-comparateur.mjs`, QC-05 à QC-12) : `qcm-01…qcm-40` → [10, 11, 9, 10] ; 60 familles × 40 identifiants : cumul [614, 572, 618, 596], χ² = 2,2, **3 alertes sur 60 contre 7 sur 60 pour l'ancien mélange** ; le témoin `ex-001…040` de l'ancien mélange (8, 15, 14, 3) est refusé par le nouveau contrôle ; vecteurs de référence FNV-1a (`""`, `"a"`, `"foobar"`).
**Conséquences.** L'ordre d'affichage de tout QCM change (celui de démonstration compris) : sans effet, aucun contenu n'existe encore. L'Autotest du lot 5 appelle `controleDistribution`. Cette décision remplace, pour le mélange seulement, le « repris tel quel de Classe'R » (D038, portage).
**Statut.** Acceptée.

## D041 — Tests navigateur : toujours un profil temporaire isolé, jamais une instance déjà ouverte de l'utilisateur

**Contexte.** Au lot 3, un sondage `chrome.exe --version` a transmis la commande à la session Chrome déjà ouverte de l'utilisateur (« Ouverture dans une session de navigateur existante ») et a pu y ouvrir une fenêtre. Sans gravité, corrigé aussitôt, mais à ne pas reproduire.
**Décision.** **Règle permanente, pour tous les lots :** un test navigateur lance une **instance neuve, en mode headless, avec un profil temporaire isolé** (`--user-data-dir` dédié, port de débogage éphémère lu dans le profil), et ne touche **jamais** une instance déjà ouverte. On ne lance jamais l'exécutable d'un navigateur « pour voir », pas même avec `--version` (sous Windows, les versions se lisent dans les propriétés du fichier). Les outils sont versionnés dans **`outils/`**, dossier **hors livrable** (`build.mjs` n'inline que les sources qu'il nomme) : `outils/cdp.cjs` (client DevTools, Chrome et Edge, `node outils/cdp.cjs [chrome | edge | tous]`) et `outils/scenario.js` (scénario qui s'auto-contrôle, exécuté dans la page ; il s'appuie sur les exercices de démonstration, à adapter au lot 6). À la fin du test, `cdp.cjs` termine **tout l'arbre de processus** du navigateur (Edge relance le sien : tuer le lanceur ne suffit pas), en ne visant que les processus dont la ligne de commande contient son profil temporaire unique, puis supprime le profil.
**Statut.** Permanente.

## D042 — Métadonnées d'exercice (niveau, compétence, catégorie, difficulté) ; liste groupée par palier ; deux emplacements réservés inertes

**Contexte.** À la vérification du lot 3, l'écran `#/exercices` listait les quatre exercices de démonstration à plat, sans rien dire de ce qu'ils travaillent ni par où commencer : un débutant n'a aucun repère avant de cliquer. Classe'R résout ce problème (`Contenu.selecteur`, le regroupement par compétence de `ecranChoix`, la carte « Série recommandée »), mais tout ce qui « choisit ce qui est adapté » dépend de Progression, portée au lot 4 seulement. Il fallait poser l'ossature maintenant, sans l'anticiper.
**Décision.** Quatre champs sur chaque exercice (`src/contenu.js`) : `niveau` (un id de **`PALIERS`**, nouvelle constante qui reprend les cinq paliers de D021 : P1 Lire … P5 Métier), `competence` (texte libre, **provisoire** : reprend pour l'instant la `clause` de l'exercice faute de taxonomie arrêtée), `categorie` (« Comprendre », « Mise en pratique », « Détection d'erreur »… — liste ouverte, non fermée par cette décision), `difficulte` (1 à 3). Renseignés sur les 4 exercices de démonstration. L'écran `#/exercices` (`src/app.js`) groupe désormais la liste par palier (une section, un titre, dans l'ordre de `PALIERS`) et affiche ces quatre informations en puces sur chaque carte. Deux emplacements sont réservés et **inertes** (boutons `disabled`, sans effet au clic) : une carte « Série recommandée » en tête de liste, et un sélecteur de palier (`.segment`, sur le modèle de `Contenu.selecteur`) qui ne filtre encore rien — le regroupement ci-dessus n'est pas conditionné par lui. **Hors de cette décision, explicitement :** filtres, recherche, tri dynamique, calcul de ce qui est « adapté » — tout cela attend Progression (lot 4).
**Conséquences.** Question ouverte, à trancher au lot 4 avec Progression : la liste des compétences SQL et leur rattachement aux paliers (`competence` reste donc un champ provisoire, pas une taxonomie). Le lot 4 n'aura qu'à brancher les deux emplacements réservés (retirer `disabled`, câbler `onclick`) et, le cas échéant, à remplacer `competence` par le futur identifiant de compétence.
**Statut.** Acceptée.

## D043 — Neuf compétences SQL, une par capacité séparément maîtrisable, chacune rattachée à un seul palier

**Contexte.** D042 posait `competence` comme un champ provisoire (la clause de l'exercice), faute de taxonomie arrêtée, et renvoyait la décision au lot 4 : la maîtrise, les points faibles, la décroissance d'oubli et les certifications se calculent toutes sur les compétences, et le changer une fois 120 exercices rattachés coûterait cher.
**Décision.** `CONTENU.competences` (9, `src/contenu.js`) : `lire-filtrer` (P1), `valeurs-manquantes` (P2), `agreger` (P2), `joindre` (P3), `dates` (P2), `sous-requetes` (P4), `classer-cumuler` (P4), `vocabulaire-metier` (P5), `nettoyer-donnees` (P5). Chacune est une capacité (lire, repérer un NULL, joindre, dater, sous-requêter, classer, traduire, nettoyer), jamais un intitulé de cours : « LEFT JOIN » reste une notion à l'intérieur de `joindre`. Couverture des pièges P1 à P11 de `SCHEMA.md` : P1/P2/P4 → `joindre` ; P3 → `valeurs-manquantes` ; P5 (primaire) et P6 (secondaire) → `classer-cumuler` ; P6 (primaire) et P11 → `dates` ; P7 (primaire) → `vocabulaire-metier`, (secondaire, `CASE WHEN`) → `agreger` ; P8 → `agreger` ; P9 → `sous-requetes` ; P10 → `vocabulaire-metier`. `nettoyer-donnees` ne couvre aucun piège du seed principal (ils viennent tous du jeu sale du palier 5, D027, pas encore construit) et `lire-filtrer` est la fondation (aucun piège dédié). Chaque compétence a un seul palier, même quand un piège est enseigné à deux endroits du programme (P6, P7 : c'est la matrice de `SCHEMA.md` qui les attache déjà à deux endroits, pas une incohérence à corriger). Les 4 exercices de démonstration (`demo: true`) sont remappés vers ces identifiants (D042 autorisait ce remappage : métadonnée structurelle, pas du contenu).
**Conséquences.** `Store.etat.competences` (D045) a une entrée par compétence. `nettoyer-donnees` restera à 0 exercice et « jamais travaillée » jusqu'au lot du palier 5 : affichée quand même (pas masquée), pour dire à l'apprenant ce qui reste à venir plutôt que de donner l'illusion d'un parcours complet.
**Statut.** Acceptée.

## D044 — Vingt certifications, repères sur des preuves, jamais sur du temps passé (sauf deux séries de jours, reprises de Classe'R)

**Contexte.** Classe'R a ~20 certifications (`CONTENU.certifications`, objets à condition, vérifiés après chaque résultat). Même mécanique à porter, même esprit pour le contenu : des preuves (« 60 % en jointures », « une série sans erreur »), jamais du temps passé.
**Décision.** 20 certifications (`src/contenu.js`) : `premier-pas` (une réussite) ; une par compétence sauf `lire-filtrer` et `nettoyer-donnees` (7 certifications à 60 % de maîtrise, comme Classe'R n'en dédie pas à sa compétence la plus basique ni à la plus avancée) ; `assidu`/`marathonien` (7/30 jours de pratique d'affilée, reprises telles quelles de Classe'R malgré la formulation « jamais sur du temps passé » : ce sont des preuves d'une habitude de pratique, pas d'un temps simplement écoulé) ; `sans-faute`/`sans-faute-x5` (séries parfaites) ; `centurion` (100 réussites) ; `praticien`/`confirme` (niveaux 5/8) ; `polyvalent` (les 9 compétences actives ≥ 50 %) ; 4 certifications de mission (`premiere-mission`, `sans-indice`, `trois-etoiles`, `maitre-d-oeuvre`), inertes tant qu'aucune mission n'existe (D048).
**Conséquences.** `Progression.verifierCertifications()` (D045) les évalue après chaque résultat, jamais sur minuterie ; idempotent (une certification déjà obtenue n'est jamais réannoncée).
**Statut.** Acceptée.

## D045 — Store et Progression portés ; horloge de la décroissance d'oubli en PARAMÈTRE, jamais en dur ni en champ mutable

**Contexte.** Store (persistance, clé, migrations, export/import) et Progression (XP, niveaux, maîtrise, décroissance d'oubli, consolidation, certifications, `pointsFaibles`) sont repris de Classe'R quasiment tels quels (liste de portage de `DECISIONS.md`). Seul point qui ne se porte pas à l'identique : `joursDepuis` de Classe'R appelle `Date.now()` en dur, sans point d'injection pour un test qui fige « maintenant » (contrainte D001 : aucune construction ne peut dépendre de l'horloge réelle d'une façon qui casse la reproductibilité).
**Décision.** `src/store.js` : clé `requeter.etat` (réservée depuis le lot 1, D009), `schema: 1`, `MIGRATIONS` vide (scaffold), `migrer()` réconcilie les compétences ajoutées après coup, `modifier(fn)` unique porte d'écriture, `exporter()`/`importer()` identiques à Classe'R (préfixe `requeter-progression-`). `src/progression.js` : mêmes constantes et formules que Classe'R (`alphaMaitrise` 0,25, `alphaEchec` 0,15, `perteMax` 15, `serieConsolidation` 3, `seuilConsolidation` 80, `jouisAvantOubli` 7, `vitesseOubli` 1,2, `seuilRevision` 55, `seuilCumul(n) = 50n²+50n`, titres Novice à Maître). Écart voulu : `maitrise(idComp, maintenant = Date.now())` reçoit l'horodatage en **paramètre**, jamais lu directement dans la fonction ni posé comme champ mutable du module (un champ mutable est un état global qu'un test peut oublier de restaurer, et qui fuirait entre deux cas) — la fonction reste pure, ce qui est la règle appliquée depuis le lot 3. `Indices.multiplicateurXp`/`facteurMaitrise` (différés du lot 3, D037) sont ajoutés à l'objet `Indices` existant (`src/exercices.js`), tels quels : aucune référence à Excel dans ces deux formules.
**Conséquences.** `verifier-progression.mjs` teste la décroissance en figeant `maintenant` (ex. `Progression.maitrise(id, t0 + 10*86400000)`), sans jamais dépendre de l'horloge d'exécution. Store/Progression sont chargeables sous Node (comme `moteur.js`/`comparateur.js`, D038) ; seuls `charger`/`sauver`/`exporter` ont besoin de `localStorage` (fourni par le test).
**Statut.** Acceptée.

## D046 — Politique de comptage des tentatives et indices (ferme D037)

**Contexte.** D037 renvoyait explicitement cette politique au lot 4, avec Progression : « chaque retour expose `{reussi, tentatives, indices}` ; les verdicts "non évalué" ne comptent pas ».
**Décision.** Un verdict `compte: true` (qu'il soit réussi ou non) déclenche toujours `Progression.enregistrerResultat` : la maîtrise bouge, `tentatives` s'incrémente, l'XP se calcule (réussite seulement). Un verdict `non-evalue` ne touche à rien (ni Store, ni compteur), exactement comme D037 le posait. Le nombre d'indices utilisés au moment de la réponse pondère l'XP (`Indices.multiplicateurXp`) et le facteur de maîtrise (`Indices.facteurMaitrise`), repris tels quels de Classe'R (D045). Le dernier indice (« Une solution possible »/« Solution », `revele: true`) annule l'XP et plafonne le facteur de maîtrise à 0,2.
**Conséquences.** Aucun nouveau mécanisme : simple branchement de l'existant (indices gradués du lot 3) sur Progression (lot 4).
**Statut.** Acceptée.

## D047 — Routeur, Vues et écrans : table de routes à la Classe'R, Parcours/Fiche/Missions visibles avec un état vide

**Contexte.** Le `route()` ad hoc du lot 3 (trois cas, `if`/`else if` sur `location.hash`) était explicitement provisoire. Par ailleurs, Parcours (leçons) et Fiche (lexique SQL) n'ont aucun contenu avant le lot 6+, et Mission (D048) non plus : fallait-il les cacher du rail jusque-là, ou les montrer avec un état vide ?
**Décision.** `Routeur` (`src/routeur.js`) : table de routes `{chemin, titre, vue, icone, nav, court}`, dispatch par correspondance exacte sur `location.hash`, plus un cas spécial pour `/exercice/<id>` (identifiant dynamique, absent chez Classe'R qui n'adresse jamais un exercice directement par URL — ajout de Requêt'R, conservé). Rail construit une fois (`construireRail()`), seul `aria-current` change par rendu. Sept routes dans le rail (Accueil, Exercices, Leçons, Missions, Bac à sable, Progression, Réglages) plus `/fiche` hors rail (programmatique seulement, comme chez Classe'R). **Écrans sans contenu encore visibles avec un état vide** (`.vide`/`.vide__boite`, déjà dans la feuille de style depuis D006) plutôt que masqués : une entrée de rail qui apparaît plus tard serait plus déroutante qu'un écran qui annonce ce qui vient, et la classe `.vide` gère déjà bien ce cas chez Classe'R. S'applique à Leçons, Missions et Fiche.
**Conséquences.** `pageExercices`/`pageExercice`/`coquille`/`route`/`demarrer`/`appliquerTheme` du lot 3 (`src/app.js`) sont remplacés ; `carteExercice` reste (section « Tous les exercices, par palier »). `appliquerTheme()` (sans argument) lit désormais `Store.etat.reglages.theme`, persisté.
**Statut.** Acceptée.

## D048 — Session, Parcours et Mission portés ; Mission perd ses six formes de validation au profit d'une seule

**Contexte.** Signalé au lot 4 plutôt qu'adapté en silence (comme demandé) : les VALIDATEURS de Mission chez Classe'R (`cellule`/`plage`/`colonne`/`tri`/`filtre`/`conditionnel`) sont entièrement liés à une feuille de calcul (`Feuille.creer`, cellules, plages) ; aucun ne s'applique à SQL. L'utilisateur a arbitré : porter Mission maintenant (option a), parce qu'en SQL une mission n'a besoin d'aucune validation d'un autre type — c'est une suite d'étapes dont chacune est un exercice « requete » déjà validé par le Comparateur.
**Décision.** `Session` (`src/routeur.js`) : choix pondéré identique à Classe'R (`Math.random()` + primes empilées : +3 jamais tentée, +2,5 jamais réussie, +1,5 plus d'échecs que de réussites, +1,5 si la compétence est sous `seuilRevision`, −1 si déjà maîtrisée), branché sur les deux emplacements inertes de D042 (carte « Série recommandée » → `Session.demarrer(null, 5)`, sélecteur de palier → `Contenu.selecteur` réel). `Parcours` : structure seule (`CHAPITRES` reste vide, D002/D021 : le contenu attend le lot 6+). `Mission` : état `courante` (étape, indices, étoiles, brouillon), étoiles selon les indices totaux (0 → 3, ≤ 2 → 2, sinon → 1, formule XP `30 × difficulté × max(0,3 ; 1 − 0,1 × indicesTotal)`, identiques à Classe'R), **une seule forme de validation par étape** : la requête de l'apprenant contre la solution de référence de l'étape, par le même `Comparateur` qu'un exercice `requete`. Aucune mission n'existe encore (`CONTENU.missions` vide) : testé en lot 4 avec une définition de test locale à `verifier-progression.mjs` (jamais ajoutée à `CONTENU.missions`), jouable pour de vrai dès que son contenu arrivera.
**Conséquences.** `fonctionsDe` (scan du texte contre `FONCTIONS`, supprimé lots 1-3) devient `clausesDe(ex) = ex.clause ? [ex.clause] : []` : les exercices portent déjà leur clause principale (`ex.clause`, utilisée par `Indices.pour`), pas besoin d'une expression régulière. Les types à réponse unique (qcm, predire) gardent un « essai libre » après verrouillage (`zoneEssai`/`carteEssai`, D037) ; `requete`/`corriger` n'en ont pas besoin, leur éditeur étant déjà librement itératif.
**Statut.** Acceptée.

## D049 — Onboarding : question factuelle sur l'expérience SQL (pas une auto-évaluation de niveau) ; Packs : un pack unique, toujours actif par défaut

**Contexte.** L'onboarding de Classe'R demande de s'auto-évaluer (« débutant/intermédiaire/avancé »), pour un public déjà familier d'un tableur. D012 pose que Requêt'R démarre au palier 0 pour un public qui n'a jamais vu de base de données — mais pas que tout le monde découvre SQL pour la première fois : un reconverti peut en avoir déjà pratiqué ailleurs. Lui demander de s'auto-évaluer le ferait répondre au hasard ; une question factuelle, à laquelle on peut répondre sans se juger, non.
**Décision.** L'onboarding (`src/routeur.js`) pose « As-tu déjà écrit une requête SQL ? » à trois réponses factuelles : « Jamais, je découvre » (maîtrise de départ 0), « Quelques-unes, il y a longtemps » (20), « Oui, régulièrement » (40) — au lieu d'une auto-évaluation de niveau. Le reste (prénom, première victoire/Toast de bienvenue) est porté tel quel. `Packs` : un seul pack (`CONTENU.packs`, `"boutique"`), actif par défaut (`Store.etat.reglages.packsDesactives` commence vide), mais réellement basculable (`Packs.basculer`) : une liste vide dans les réglages ne prouverait rien, un pack unique prouve que la mécanique de bascule fonctionne, et le second pack (jeu sale du palier 5, D027) s'y branchera sans rien changer.
**Conséquences.** `Store.etat.profil.experienceSql` remplace le `niveauDeclare` de Classe'R. Les titres de niveau (Novice à Maître, D045) sont repris tels quels : aucune référence à Excel.
**Statut.** Acceptée.

## D050 — Structure des chapitres (Parcours) : leçon courte + exercices cités, reprise de CHAPITRES de Classe'R

**Contexte.** `CONTENU` porte `CHAPITRES` depuis le lot 3 (vide, D047/D048 renvoyaient son contenu au lot 6+), mais sa structure n'avait jamais été définie pour Requêt'R : ni le brief du lot 5, ni ce journal, ni SCHEMA.md ne précisaient ce qu'est, structurellement, un chapitre.
**Décision.** Un chapitre est une leçon courte suivie des exercices qui l'appliquent, reprise de la structure `CHAPITRES` de Classe'R (`Reference/classer-v2.html`) :
```
{ id, niveau, titre, duree, resume,
  lecon: { intro, points: [...], exemple: { titre, code, resultat, commentaire }, astuce },
  exercices: [ids] }
```
Les exercices ne sont pas dupliqués : le chapitre cite leurs identifiants (`CONTENU.exercices`). Une réussite compte pour la maîtrise exactement comme dans une série libre (aucun mécanisme de progression séparé).
**Conséquences.** L'Autotest (D051) vérifie : identifiant de chapitre unique (même espace de noms que les exercices et les missions), palier connu, tous les identifiants cités existent dans `CONTENU.exercices`, aucun exercice cité deux fois dans le même chapitre, la leçon a son `intro`, ses `points` et son `exemple`, et l'exemple est du SQL qui s'exécute sans erreur sur le seed (le « bouton tester cet exemple » de Classe'R : un exemple qui plante devant l'apprenant rend la leçon inutilisable). Couverture : tout exercice d'un palier déclaré `termine` (D051) doit être cité par au moins un chapitre, sinon il reste inaccessible depuis le parcours guidé.
**Statut.** Acceptée.

## D051 — L'Autotest (lot 5) : rejeu mécanique de chaque exercice, étape de mission et chapitre contre le seed gelé

**Contexte.** À partir du lot 6, une centaine d'exercices, des chapitres et des missions seront écrits à la main : les relire un par un serait le goulot qui a fait échouer un projet précédent. L'Autotest généralise ce que `verifier-comparateur.mjs` posait déjà pour les 4 exercices de démonstration (D038 : identifiants uniques, métadonnées connues, indices complets, solution acceptée), en y ajoutant tout ce que le SQL permet de vérifier en plus d'un tableur (l'Autotest de Classe'R) : exécution réelle contre le seed gelé (D025), déterminisme (D001), règles d'auteur sur le tri (D029/D030), couverture par compétence et par piège.
**Décision.** `verifier-autotest.mjs`, à la racine, mêmes conventions que les trois vérificateurs existants (ESM, zéro dépendance, sql.js vendorisé, chargement des vrais fichiers de `src/`). Ne réimplémente rien de `Comparateur`/`Moteur`/`TYPES_EXERCICE`/`Indices` : les réutilise tels quels. Une seule base vivante est construite au départ et réutilisée pour tout le rejeu (D032 : les requêtes de contenu sont toujours en lecture seule ; une écriture détectée reconstruit la base avant de continuer, pour qu'elle ne contamine jamais la suite du rejeu).
Pour chaque exercice : identifiant unique (espace de noms partagé avec les missions et les chapitres), palier et compétence connus, `retenir`/`explication` non vides (le champ `usage` de Classe'R n'est pas repris : le lot 3 ne le prévoit plus), indices progressifs se terminant par la solution révélée (sauf `predire`, qui n'en révèle jamais), clause citée existante dans `CLAUSES`, sans plafond de taille (le plafond à 6 entrées du lot 3 n'était qu'une borne de démonstration, retiré). Pour un exercice SQL (`requete`/`corriger`/`predire`) : la solution (ou la requête, pour `predire`) s'exécute sans erreur, sans écriture, renvoie au moins une ligne — sauf échappement explicite `zeroLigneAttendu: "raison"` (une chaîne non vide qui sert de justification, jamais un simple booléen, pour qu'il ne devienne pas un interrupteur de confort) —, est déterministe (`Comparateur.construitsTemporels`), et ne dépasse pas 10 000 lignes (D036). Quand `comparer.ordonne` est `{ cles }` et que la solution porte un `LIMIT` final, la coupe est rejouée sans ce `LIMIT` : si la dernière ligne retenue et la première exclue sont à égalité sur les clés de tri, le critère échoue — ambiguïté réelle, détectée en rejouant la requête, sans analyse syntaxique. Pour `corriger` : `solution` et `depart` ne sont jamais textuellement identiques, `depart` s'exécute sans erreur SQL (sinon le piège pédagogique n'a aucune substance), et son résultat est refusé par `Comparateur.evaluer` avec les options de l'exercice. Pour `requete` et chaque étape de mission : une tentative sciemment fausse (`SELECT -999999 …`) doit être refusée avant que la solution annoncée ne soit vérifiée — rien n'est jamais validé d'avance (parité avec l'Autotest de Classe'R). Pour les QCM : pas de doublon d'options, réponse valide, et contrôle de distribution bilatérale (D040) sur l'ENSEMBLE des QCM réellement écrits, groupés par nombre d'options (pas sur les identifiants synthétiques de `verifier-comparateur.mjs`, qui ne testent que l'algorithme). Pour une mission (D048) : chaque compétence citée connue, chaque étape soumise aux mêmes contrôles SQL qu'un exercice `requete`, sans passer par `Mission`/`Store`/`Routeur` (déjà exercés par `verifier-progression.mjs`, qui teste le mécanisme, pas le contenu).
Deux contrôles de couverture, en avertissement tant que le palier concerné ne porte pas `termine: true`, bloquants ensuite — champ posé directement sur chaque entrée de `PALIERS` (pas une liste séparée à synchroniser, qui finirait par diverger) : au moins 6 exercices par compétence active (2 par niveau de difficulté, assez pour que la consolidation à 3 réussites d'affilée ne rejoue pas toujours le même item) ; chaque piège P1 à P11 cité par au moins un exercice, via un champ déclaratif `pieges: ["P4", …]` — pas de détection automatique, pour ne pas donner une fausse sécurité sur certains pièges seulement — bloquant dès que TOUS les paliers sont déclarés terminés (un piège n'appartient pas à un seul palier) ; et, dérivé de D050, tout exercice d'un palier terminé cité par au moins un chapitre. Le contrôle par mutation reste fait à la main, hors du script, comme aux lots 3 et 4 (un testeur qui s'auto-teste avec la même règle cassée ne prouve rien).
Volontairement hors de portée, affiché en PIED de rapport (pas en tête, pour rester lu au moment où « tout est vert » doit encore vouloir dire quelque chose) : la clarté d'un énoncé, l'ambiguïté d'une consigne, la justesse d'une explication, le dosage de la difficulté, la progression d'un palier — aucune heuristique n'y est tentée.
**Conséquences.** Les 4 exercices `demo: true` (lot 3) restent soumis aux contrôles par exercice (preuve que l'outil fonctionne avant que le vrai contenu n'arrive) mais sont exclus des deux contrôles de couverture et du contrôle de distribution QCM (ils disparaîtront au lot 6, D038, et ne représentent pas du contenu réel).
**Statut.** Acceptée.

## D052 — Fidélité visuelle à Classe'R : un écart assumé (titre d'exercice en série)

**Contexte.** Une revue de fidélité visuelle, menée après le lot 5, a comparé les écrans portés au lot 4 (D047/D048) à leurs équivalents dans `Reference/classer-v2.html`. Plusieurs oublis ont été corrigés (sur-titre `.entete__sur` manquant sur Progression, Leçons, Missions et le Bilan de série ; carte Réglages reconstruite à l'identique — largeur du champ Prénom, libellés en `<h3>`, textes, bloc `.note` avec la date du dernier export, qui avait disparu pendant le portage ; carte « Contenus installés » avec `Packs.compter`, bouton d'état, note de bas de carte). Un point a été signalé puis explicitement tranché comme un écart volontaire, pas un oubli : l'écran de question en série (`ecranSerie`, `src/routeur.js`) affiche un `header.entete` avec le titre de l'exercice (`ex.titre`) ; Classe'R (`ecranQuestion`, `Reference/classer-v2.html:9284`) n'affiche aucun titre à cet endroit, seulement des puces compétence/catégorie/difficulté (`.exo__meta`).
**Décision.** Cet écart est assumé, pas corrigé. En tableur, la question de Classe'R tient en une phrase courte et se suffit à elle-même. En SQL, une consigne fait souvent deux ou trois lignes : un titre court donne un repère avant de la lire. `ecranSerie` garde donc son `header.entete > h1` avec `ex.titre` ; Classe'R n'est pas la référence sur ce point précis.
**Conséquences.** Une future revue de fidélité ne doit pas signaler cet écart à nouveau : il est consigné ici, pas oublié.
**Statut.** Acceptée.

## D053 — Chapitre 0 rattaché au palier P1 / à la compétence « lire-filtrer » ; pas de palier P0

**Contexte.** Le lot 6 introduit un « chapitre 0 » (comprendre une base, sans une ligne de SQL), demandé par le brief avant le palier 1 proprement dit. D021 ne définit que cinq paliers (P1 à P5) ; D043 exige que toute compétence (et par construction tout exercice, via `ex.competence`, vérifié par l'Autotest D051) soit rattachée à l'un d'eux. Deux options : créer un palier `P0` dédié, ou rattacher le chapitre 0 à `P1`.
**Décision.** Le chapitre 0 porte `niveau: "P1"` et ses six QCM portent `competence: "lire-filtrer"` (seule compétence active sur P1). Aucun palier `P0` n'est créé : un palier supplémentaire pour un seul chapitre, jamais réutilisé, ajouterait une décision structurante pour un gain nul. Conséquence assumée : ces six QCM comptent dans le total « lire-filtrer » de la couverture de l'Autotest, alors qu'ils ne sont pas du SQL — sans gravité ici, le palier dépassant largement le minimum de 6 exercices par compétence (D051).
**Conséquences.** Si un futur palier introduisait à son tour un chapitre « sans SQL » de ce genre, la même règle s'applique : rattachement au premier palier concerné, pas de palier dédié.
**Statut.** Acceptée.

## D054 — Écran Leçons câblé au lot 6 : lecture de la leçon, exemple testable, exercices du chapitre, bilan

**Contexte.** D047/D050 posaient `Parcours` (`ouvrir`, `commencer`, `suivant`, `quitter`) et la structure `CHAPITRES` comme de la mécanique seule, jamais branchée à un écran : `Vues.lecons` n'affichait qu'une liste de titres, sans clic. Écrire le contenu du chapitre 0 et du palier 1 sans câbler cet écran aurait laissé les leçons illisibles dans l'application (seuls les exercices, pris isolément via `#/exercices` ou `#/exercice/<id>`, auraient été accessibles) — contraire à l'usage du projet, qui vérifie chaque lot « en situation » avant de le considérer terminé.
**Décision.** `Parcours` reçoit un `repondre(reponse)` qui reprend exactement la mécanique de `Session.repondre` (XP, maîtrise, certifications, D046), et `Parcours.ouvrir` capture un instantané « avant » par compétence comme `Session.demarrer`. L'écran de question (autrefois `ecranSerie`, propre à Session) est généralisé en `rendreQuestion(etat, ctrl, rafraichir)`, partagé par la série libre et par un chapitre : les deux exposent la même forme d'état (`liste`, `index`, `indices`, `dernier`) et les mêmes trois actions (répondre, suivant, quitter), seuls le libellé du bouton de sortie et les callbacks différant. `Vues.lecons` devient un dispatcheur sur `Parcours.courant` et son `etape` (`ecranListeChapitres` / `ecranLecon` / `rendreQuestion` / `ecranLeconBilan`), repris du modèle de Classe'R (`ecranChapitre`/`ecranLecon`/`questionChapitre`/`bilanChapitre`, `Reference/classer-v2.html:9074` et suivantes) et adapté au contrat `TYPES_EXERCICE`/`api` de Requêt'R (différent de celui de Classe'R). La leçon affiche son exemple (D050) avec un bouton « Tester cet exemple » qui l'exécute pour de vrai sur le seed (`Moteur.executer`), plutôt que de se contenter du résultat écrit en dur comme chez Classe'R — cohérent avec « un exemple exécutable sur le seed » du brief du lot 6.
**Conséquences.** `outils/scenario.js` (D041) vérifie désormais ce parcours en situation (chapitre 0 complet, puis le premier chapitre du palier 1) sur Chrome et Edge, profil isolé.
**Statut.** Acceptée.

## D055 — Corrections demandées après l'évaluation du palier 1 (outils autour du contenu, pas le contenu lui-même)

**Contexte.** L'utilisateur a fait les 9 leçons du lot 6 en entier et rapporté huit retours, par ordre d'importance : un « null » parasite affiché avant « Quitter le chapitre » (3ᵉ occurrence du même motif depuis le lot 3) ; l'explorateur de schéma limité à 5 lignes, qui rend l'exercice `p1-15` (« Lyon, ou pas de ville du tout ») invérifiable autrement qu'en devinant ; le point-virgule jamais expliqué ; l'absence d'un lexique (Classe'R en a un) ; une liste d'exercices trop longue, groupée par palier avec des cartes trop chargées ; aucune proposition de révéler la requête attendue après plusieurs échecs ; une question (faut-il un bouton qui pré-remplit `SELECT … FROM`, tranchée par l'utilisateur lui-même : non) ; une impression de clarté insuffisante sur l'explorateur (question ouverte, pas un défaut précis).
**Décision.**
1. **Garde-fou contre le bug du « null »**, posé une fois pour toutes plutôt que corrigé au cas par cas (D033 bis) : `remplacerEnfants(noeud, ...enfants)` (`src/app.js`, près de `el()`) filtre les enfants `null`/`undefined`/`false` avant un `replaceChildren` natif — `el()` le fait déjà pour ses propres enfants, mais tout `replaceChildren` natif appelé en dehors de `el()` (ici, le pied de `rendreQuestion`, `src/routeur.js`) ne filtrait rien, et le DOM natif convertit `null` en le texte littéral « null ». Seul site réellement fautif à ce jour (vérifié exhaustivement, aucun autre appel natif ne reçoit de `null` conditionnel).
2. **Explorateur : voir une table entière.** Un bouton « Voir les N lignes » (`detailTable`, `src/app.js`) charge la table entière à la demande (`SELECT * FROM "table"`, mise en cache, jamais recalculée au premier chargement du schéma pour rester rapide) et peut la réduire de nouveau à l'aperçu de 5 lignes. Nécessaire : certains exercices (`p1-15`, le chapitre DISTINCT) ne se vérifient pas avec 5 lignes sur 40.
3. **Point-virgule enseigné** dans la leçon du chapitre `ch-p1-1` (`src/contenu.js`) : facultatif pour une requête seule (Requêt'R l'accepte dans les deux cas, et ça ne change pas à la correction), obligatoire dès qu'on en enchaîne plusieurs, attendu par tous les outils professionnels.
4. **Lexique** (`src/app.js`, `Lexique`), sur le modèle exact de celui de Classe'R (`Reference/classer-v2.html:5513`) et de l'Explorateur déjà porté (voile, piège de focus, Échap, bouton du rail) : deux groupes, le vocabulaire (`VOCABULAIRE`, neuf entrées, `src/contenu.js`) et les clauses SQL (`CLAUSES`, déjà écrites), une recherche qui filtre les deux à la fois sur le terme et la définition. Nouvelle icône `lexique` (`ICONES`, `src/app.js`).
5. **Liste d'exercices regroupée par CHAPITRE, pas par palier** (`ecranChoix`, `src/routeur.js`) — les chapitres sont maintenant la bonne maille, D054 les rend navigables — et **cartes compactes** (`carteExercice`, `src/app.js`) : titre, puces de compétence/difficulté, puce d'action ; l'énoncé complet, retiré, n'a sa place que sur l'écran de l'exercice.
6. **Révélation explicite après deux tentatives ratées, jamais à la première.** `panneauIndices` (`src/app.js`) expose `panneau.reveler()` (sautant directement à la solution, sans forcer à cliquer chaque indice intermédiaire) et `panneau.totalIndices` ; `carteRetour` (`src/routeur.js`) affiche un bouton « Voir la requête attendue », visible seulement pour `requete`/`corriger` (qcm/predire se verrouillent dès la première réponse comptée, D037, et montrent déjà la bonne réponse autrement) et seulement quand `v.tentatives >= 2` sur une réponse encore fausse. Un bouton à part, jamais un indice de plus à découvrir.
7. **Pas de bouton qui pré-remplit `SELECT … FROM`, décision explicitement rejetée** par l'utilisateur : taper les mots-clés à la main, trente fois, est ce qui produit l'automatisme : le confort achèterait du temps contre de la mémoire musculaire, mauvais échange au palier 1. La seule pré-saisie légitime reste celle d'un exercice `corriger`, où la requête de départ *est* le sujet de l'exercice.
8. **Clarté de l'explorateur : pas de refonte.** L'utilisateur demandait un avis, pas un défaut précis. Le contenu structurel (relations, colonnes, clés, CREATE TABLE) est déjà complet ; le vrai manque identifié était l'impossibilité de voir une table entière (point 2, maintenant résolu). Le reste relève surtout de l'habitude à construire sur la durée (un seul palier ne suffit pas à ancrer un réflexe), pas d'un défaut de l'outil lui-même — rien d'autre n'a été changé.
**Conséquences.** `outils/scenario.js` vérifie chacun des points 1, 2, 4, 5 et 6 en situation (profils isolés, Chrome et Edge).
**Statut.** Acceptée.

## D056 — Trois correctifs après une seconde relecture (Lexique collant, fiches de clause, cartes encore trop grosses)

**Contexte.** Après D055, l'utilisateur a rejoué le Lexique et la liste d'exercices et signalé trois points.
**Décision.**
1. **Lexique : bug de défilement corrigé.** La cause n'était pas le CSS (`.lexique__groupe` est identique, caractère pour caractère, à celui de Classe'R) mais la structure DOM : `groupe()` (`src/app.js`) enveloppait le bandeau collant ET toutes les lignes du groupe dans un seul `div.lexique__groupe`, rendant tout le bloc sticky au lieu du seul bandeau. Classe'R pousse le bandeau et ses lignes à plat, en frères (`Reference/classer-v2.html:5552`) : `groupe()` fait maintenant pareil (renvoie un tableau plat plutôt qu'un conteneur unique).
2. **Fiches de clause**, sur le modèle exact de `Vues.fiche`/`FICHES` de Classe'R (`Reference/classer-v2.html:9751`, `:4427`) : objet `FICHES` (`src/contenu.js`, `{but, contexte, erreur, voirAussi, entrainements:[]}`) pour les 11 clauses du palier 1 seulement (SELECT, FROM, WHERE, ORDER BY, LIMIT, DISTINCT, AS, IN, BETWEEN, LIKE, IS NULL) — les autres paliers ajouteront les leurs. `entrainements` reste vide : structure posée, contenu délibérément différé après le palier 2 (l'utilisateur jugera alors s'il apporte quelque chose que les exercices n'apportent pas déjà). Route dynamique `#/fiche/<clause>` ajoutée au Routeur sur le même motif que `#/exercice/<id>` (`PREFIXE_FICHE`, `pageFicheDepuisHash`) : aucun état en mémoire n'est nécessaire sans entraînement à reprendre. Les clauses du Lexique deviennent des boutons (`.fn-ligne--lien`, repris de Classe'R) qui ferment le Lexique et ouvrent la fiche ; le vocabulaire reste non cliquable (il n'a pas de fiche).
3. **Cartes d'exercice encore trop grosses : la compétence retirée.** Les 34 exercices du palier portent tous la même compétence (« lire-filtrer ») : la puce la répétait 34 fois sans rien distinguer, et forçait une seconde ligne de puces. Retirée de `carteExercice` (`src/app.js`) ; elle reste sur l'écran de l'exercice et sur les cartes « Travailler une compétence », qui l'affichent une fois chacune. Titre et puces réduits d'un cran dans la liste (`--fs-3`, `font-size:11px`), padding resserré, grille à colonnes plus étroites (`230px` au lieu de `260px`) — tout scopé sous `.liste-exos` pour ne pas changer l'écran de l'exercice individuel ni les autres cartes, qui réutilisent `.exo__meta`/`.puce`/`.carte__entete`.
**Conséquences.** Build et les quatre vérificateurs Node (`seed`/`comparateur`/`progression`/`autotest`) relancés, tous verts. `outils/scenario.js` étendu de cinq vérifications dédiées à ces trois points : les bandeaux `.lexique__groupe` sont bien des frères plats de leurs lignes (pas des conteneurs) ; un clic sur LIMIT dans le Lexique ouvre `#/fiche/LIMIT` et referme le Lexique, avec but/syntaxe/erreur affichés ; son « voir aussi » ORDER BY navigue vers sa propre fiche ; « Autre clause » rouvre le Lexique ; la liste d'exercices n'a plus de puce de compétence et au plus deux puces par carte. **76 vérifications sur `node outils/cdp.cjs tous`, toutes vertes sur Chrome et Edge** (profils isolés, D041), 0 régression sur les 71 précédentes. Piège rencontré en les écrivant : `.fiche__label` (comme `.lexique__groupe` et `.entete__sur` déjà rencontrés) met son contenu en capitales par CSS — vérifications passées en insensibles à la casse ; le lien « voir aussi » d'une fiche (`boutonLie`, `src/routeur.js`) n'encodait pas le nom de la clause dans le hash (`ORDER BY` contient un espace) : `encodeURIComponent` ajouté, par cohérence avec `versFiche` du Lexique qui l'avait déjà.
**Statut.** Acceptée.

## D057 — Accueil : six écarts fonctionnels avec Classe'R corrigés ; audit (sans correctif) de Progrès/Missions/Leçons

**Contexte.** Comparaison de `Vues.accueil` à son équivalent Classe'R (`Reference/classer-v2.html:8871-8955`) : six écarts, deux fonctionnels (un bouton disparu, un calcul qui n'était pas celui qu'on croyait lire), quatre de mise en page. Même consigne qu'au lot 5 pour Réglages : fidélité, pas réinterprétation.
**Décision.**
1. **Bouton « Continuer » rétabli dans la bannière**, bouton plein (pas un simple lien) qui ouvre directement le chapitre conseillé (`Parcours.ouvrir(prochain.id)` puis `Routeur.aller("/lecons")`), comme Classe'R (8885-8889) — pas juste un lien vers la liste des chapitres, qui obligeait à rechercher où on en était.
2. **« XP aujourd'hui » : pas un bug de calcul, vérifié.** `Progression.xpDuJour()` (`src/progression.js:45`) lit déjà `Store.etat.xpParJour[jour]`, distinct de `Store.etat.xp` (le total) ; `ajouterXp` (ligne 47-50, appelée par `enregistrerResultat`) alimente les deux séparément, exactement comme Classe'R (`xpDuJour`/`ajouterXp`, classer-v2.html:5351-5358, 5427). Le nombre élevé rapporté par l'utilisateur est réel : tout son XP a été gagné le même jour (il a fait les 9 leçons d'une traite). Reprise malgré tout de la forme de Classe'R (`${xpJour} / ${objectifQuotidien}` plus une barre fine plafonnée à 100 %, `cellules(..., 12, true)`), plus parlante que le chiffre nu entre parenthèses de l'ancienne forme — et qui aurait évité la confusion.
3. **Carte de niveau pleine largeur**, avec sa barre de cellules (`cellules(niv.pourcent, 20)`), plutôt que compressée dans une demi-tuile sans barre.
4. **Barre de progression du jour** ajoutée sous « XP aujourd'hui » (incluse au point 2).
5. **Puce d'action sur les tuiles « Continuer »** : `carteAcces` (`src/routeur.js`) affiche désormais toujours une puce, « Ouvrir » (accent) ou « Bientôt » si désactivée — même motif que D056 pour la liste d'exercices.
6. **Section « À retravailler » rétablie** avec `ligneCompetence` (nouvelle fonction, reprise de Classe'R `ligneCompetence`, 8970-9012) : puce « Validée », série sans indice en pips, érosion en cours, bouton de reprise, compte d'exercices réussis ; bouton « Réviser · <compétence la plus faible> » et lien « Tout voir » vers `#/progression` dans l'en-tête de section, comme Classe'R (8938-8952). `Progression.pointsFaibles()`, porté depuis le lot 4, enfin utilisé. Écart volontaire : pas de reprise de l'effet « gagné à l'instant » (`Affichage.vu`/`depuis` de Classe'R) — animation cosmétique, pas une fonction, et l'infrastructure de suivi n'existe pas côté Requêt'R ; `ligneCompetence` n'est câblée qu'à l'accueil, pas (encore) à l'écran Progression, qui reste dans l'audit ci-dessous.
**Conséquences.** `outils/scenario.js` : le clic générique sur « Commencer » de l'onboarding devait être scopé à `.modale` — `ligneCompetence` affiche aussi des boutons « Commencer » sur l'accueil (compétences jamais travaillées), apparus plus tôt dans le DOM que la modale, collision de texte. Build et les quatre vérificateurs Node relancés, tous verts ; **76 vérifications navigateur, toutes vertes sur Chrome et Edge**, 0 régression.
**Statut.** Acceptée.

### Audit (sans correctif) des écrans Progrès, Missions, Leçons — fonctions de Classe'R disparues au portage

Demandé par l'utilisateur en marge de D057, à trancher par lui, **rien n'a été corrigé** :
- **Progression** (`Vues.progression`, `src/routeur.js:696-715`) : chaque compétence s'affiche sans aucun bouton (Classe'R : `ligneCompetence`, bouton « Commencer »/« S'entraîner ») ; aucune des puces « Validée » / série sans indice / érosion ; pas de compte d'exercices réussis dans la description ; pas de compteur `obtenues / total` sur le titre « Certifications » (Classe'R : classer-v2.html:9732-9736) ; pas de texte expliquant les règles de maîtrise.
- **Missions** (`listeMissions`/`ecranMission`, `src/routeur.js`) : pas de sélecteur de palier (`Contenu.selecteur`) ni de filtrage (`Contenu.accessible`) sur la liste ; pas de distinction « Commencer » / « Reprendre » (une mission en cours se réaffiche comme neuve) ; pas de puces de compétences ni de durée sur la carte d'une mission ; pas de liste des étapes (vue d'ensemble) dans l'écran de mission, seule l'étape courante est visible ; pas de bandeau de sortie (✕) ni de barre de progression en tête d'écran de mission ; **le système d'indices n'est pas câblé** (`Mission.indice()` existe, D-lot4, mais n'est appelé nulle part) ; **aucun écran de bilan de mission** — `Mission.terminer()` calcule bien étoiles/XP/certifications et positionne `etat: "bilan"`, mais `Vues.missions` ne teste jamais cet état : c'est toujours `ecranMission` qui s'affiche, sans étoiles, XP de fin, certifications ni bouton « Refaire sans indice » — même profil d'écart que `pointsFaibles` avant D057.
- **Leçons** (`ecranListeChapitres`/`ecranLecon`, `src/routeur.js`) : les chapitres ne sont pas regroupés par palier dans le sommaire (Classe'R insère un titre de section à chaque changement de `ch.niveau`) — sans gravité tant qu'un seul palier existe ; l'étape « leçon » (avant de démarrer les exercices d'un chapitre) n'a aucun bandeau de sortie ni barre de progression — contrairement à Classe'R, qui enveloppe les trois étapes (leçon/exercices/bilan) dans le même bandeau `.serie` avec un ✕ « Quitter le chapitre » : à cette étape précise, rien ne permet de quitter le chapitre autrement qu'en démarrant les exercices.
**Statut.** Signalé, aucune décision prise — en attente de l'arbitrage de l'utilisateur.

## D058 — Tri de l'audit D057 : cinq oublis de portage corrigés ; le reste du confort différé

**Contexte.** L'utilisateur a trié l'audit de D057 en deux : des fonctions qui existent dans le code et que rien n'appelle (oublis de portage, même profil que `pointsFaibles` avant D057), à corriger tout de suite ; des différences de confort, qui peuvent attendre un palier 2 et de vraies missions pour être jugées sur du contenu réel plutôt que sur des listes vides.
**Décision.**
1. **Bannière d'accueil : état vide.** Quand `Parcours.suivantConseille()` ne renvoie rien (tous les chapitres terminés), la bannière affichait un simple paysage sans rien d'autre à la place du bouton « Continuer ». `Vues.accueil` (`src/routeur.js`) reprend le message déjà écrit pour le même cas sur `#/lecons` (`ecranListeChapitres`) : « Tous les chapitres sont terminés. Les exercices et les missions vous attendent pour approfondir. » Une bannière vide n'est jamais un état acceptable.
2. **Écran de bilan de mission.** `Mission.terminer()` calcule étoiles/XP/certifications et pose `etat: "bilan"` depuis le lot 4, mais `Vues.missions` ne testait jamais cet état : `ecranMission` continuait de s'afficher. Nouvelle fonction `ecranMissionBilan` (`src/routeur.js`), sur le modèle d'`ecranBilan` (série libre) pour les certifications et de `listeMissions` pour les étoiles (`★`/`☆`, déjà en usage) : XP gagnés, étapes franchies, indices utilisés, certifications obtenues, puis « Autres missions » / « Refaire sans indice » / « Retour à l'accueil ». Écart volontaire face à `bilanMission` de Classe'R : pas de détail de maîtrise avant/après par compétence, faute d'un équivalent de `avantSession`/`avantChapitre` côté Mission — à ajouter avec la première mission réelle, si elle le justifie, pas dans ce correctif à vide.
3. **Indices de mission câblés.** `Mission.indice()` existait sans jamais être appelé. `panneauIndices` (`src/app.js`) reçoit un troisième paramètre facultatif, `avancer` : un clic passe par lui plutôt que par l'incrémentation directe de `e.indices` quand il est fourni — nécessaire à Mission, où `indicesTotal` (lu par `terminer()` pour les étoiles) ne doit pas seulement suivre l'étape en cours. Sans lui, Session et Parcours gardent exactement leur comportement d'avant. `ecranMission` l'utilise : `panneauIndices(etape, m, () => Mission.indice())`.
4. **Sortie du chapitre depuis l'étape « leçon ».** Cul-de-sac corrigé : un bouton « Quitter le chapitre » (`Parcours.quitter()`) rejoint le bouton « À vous » dans `ecranLecon` (`src/routeur.js`), sur le même modèle que celui déjà présent à l'étape « exercices » (`rendreQuestion`, `ctrl.libelleQuitter`).
5. **Compétences de l'écran Progrès.** `Vues.progression` affichait chaque compétence sans bouton ni puce d'état, dans un bloc dupliquant en plus sobre ce que `ligneCompetence` (D057) fait déjà pour l'accueil. Remplacé par `comps.map(c => ligneCompetence(c))`, même composant que « À retravailler ».
6. **Compteur sur « Certifications ».** Titre de section complété par `${obtenues} / ${total}` (`Object.keys(Store.etat.certifications).length` sur `CONTENU.certifications.length`), sur le modèle de Classe'R (`classer-v2.html:9732-9736`).
**Conséquences.** Build et les quatre vérificateurs Node relancés, tous verts ; scénario navigateur (`outils/cdp.cjs`, profils isolés) 76/76 sur Chrome et Edge, 0 régression — il n'exerce ni le bilan ni les indices de mission, faute de contenu de mission ; les deux ont été vérifiés manuellement en injectant une mission factice en mémoire (jamais écrite sur disque), qui sera retirée d'elle-même : `outils/scenario.js` les couvrira dès la première vraie mission. `requeter.html` : 1 246 217 octets (1217,0 Ko), SHA-256 `db1a0b090872a8a43d218a33ee0bcc48ae7dae57f7803ebca78cfcd648f0fd06`.
**Différé, noté pour plus tard** (D057, items restants, pas de correctif) : sur Missions, filtre par palier et distinction Commencer/Reprendre et vue d'ensemble des étapes ; sur Leçons, regroupement du sommaire par palier. Sans gravité tant qu'il n'existe qu'un seul palier et aucune mission ; à rejuger avec le palier 2 et du contenu réel plutôt que sur des listes vides.
**Statut.** Acceptée.

### Audit (sans correctif) : fonctions exportées jamais appelées par un écran

Demandé par l'utilisateur en marge de D058, avant le palier 2 : les trois oublis corrigés ci-dessus partageaient un même symptôme — une fonction écrite, testée, que rien n'appelle depuis l'application. Recensement sur `store.js`, `progression.js`, `exercices.js`, `moteur.js`, `comparateur.js` ; **rien n'a été corrigé**, à trancher par l'utilisateur :
- `Store.sauver` — exportée, mais seule la fermeture interne `sauver()` est utilisée par `modifier`/`reinitialiser`/`exporter`/`importer` ; `Store.sauver()` lui-même n'est appelé par aucun écran.
- `Progression.ajouterXp` — même profil : appelée en interne (`ajouterXp(xp)`, sans le prefixe `Progression.`, dans `enregistrerResultat`), jamais `Progression.ajouterXp(...)` depuis un écran.
- `Progression.verifierCertifications` — même profil : appelée en interne par `enregistrerResultat` ; seule mention externe, un commentaire dans `contenu.js:59` qui ne fait que la citer.
- `Moteur.reinitialiser` — exportée, mais tous les écrans passent par le wrapper qui mesure, `nouvelleBase()` (D023 le recommande explicitement) ; `Moteur.reinitialiser` n'est appelée directement par aucun écran, ni par aucun vérificateur.
- `TYPES_EXERCICE.qcm.graine` — appelée uniquement en interne par `ordreAffichage`, dans le même fichier ; aucun écran, aucun vérificateur ne l'appelle directement.
- `TYPES_EXERCICE.qcm.controleDistribution` — appelée seulement par `verifier-autotest.mjs` et `verifier-comparateur.mjs` (contrôle de distribution des QCM, D040) ; jamais par un écran — attendu, c'est un contrôle de qualité de contenu, pas une fonctionnalité d'exécution, à garder tel quel plutôt qu'à « corriger ».
- `Comparateur.construitsTemporels` — la détection D022 (`date('now')` etc. dans la requête de l'apprenant) est bien câblée en production, mais via l'appel interne dans `evaluer` (`construitsTemporels(sql)`, même fichier) ; l'export public n'est appelé que par `verifier-autotest.mjs`/`verifier-comparateur.mjs`.

Les deux derniers cas (contrôles de qualité de contenu) sont d'une autre nature que les cinq premiers : ils ne sont pas des oublis de portage, juste des fonctions dont le seul client légitime est un vérificateur Node, jamais un écran. À part : la constante `Comparateur.TOLERANCE` (pas une fonction) n'est lue ni par un écran ni par un vérificateur — mentionnée pour mémoire, hors du périmètre demandé.
**Statut. RÉSOLU, négatif : rien à corriger.** Les six cas sont du code vivant (fermeture interne déjà utilisée, ou outil que seuls les vérificateurs appellent), pas des oublis de portage — à ne pas rouvrir sans fait nouveau. Critère retenu pour la suite : une fonction qu'aucun écran n'appelle n'est un oubli que si elle produit un résultat destiné à être vu (ex. les étoiles de `Mission.terminer()`, avant correction) ; `Store.sauver` et les autres cas ci-dessus ne produisent rien à montrer.

## D059 — Palier 2 : découpage et bascule de P1 en terminé

**Contexte.** Lot 7 : le palier 2 (D021 — COUNT/SUM/AVG/MIN/MAX, GROUP BY, HAVING, CASE WHEN, fonctions de date), avec trois compétences actives simultanément pour la première fois (`agreger`, `valeurs-manquantes`, `dates`, D043), et trois pièges de `SCHEMA.md` à rendre centraux plutôt qu'en marge : P3 (NULL), P6 (dates sur deux années civiles, trou d'août), P8 (montants, division entière) ; P7 effleuré via CASE WHEN. L'utilisateur a déclaré le palier 1 terminé (« J'ai fait le palier, je le déclare terminé »), levant lui-même la réserve posée en Reprise au lot 6.
**Décision.** `PALIERS[0].termine` passe à `true` — vérifié au préalable par `node verifier-autotest.mjs` : les deux contrôles de couverture qui deviennent bloquants pour un palier terminé (compétence active ≥ 6 exercices, chaque exercice cité par un chapitre) passaient déjà pour P1 avant la bascule (34 exercices sur `lire-filtrer`, 0 orphelin). Le palier 2 : 11 chapitres (`ch-p2-1` à `ch-p2-11`), 39 exercices (`p2-01` à `p2-39`), répartis `agreger` 23 / `valeurs-manquantes` 8 / `dates` 8 — tous au-dessus du minimum de 6 (D051), avec au moins un exercice de difficulté 3 par compétence et davantage sur `agreger`, la plus riche en syntaxe. Ratio des types volontairement différent du palier 1 (demande explicite de l'utilisateur, ce palier étant plus orienté pièges) : 12 `requete`, 10 `corriger`, 9 `qcm`, 8 `predire` (contre 14/10/6/4 au palier 1) — un `corriger` fait mieux comprendre un piège qui s'exécute sans erreur et renvoie un résultat faux qu'un QCM sur le même sujet.
**Conséquences.** 9 nouvelles entrées dans `CLAUSES` et `FICHES` (SUM, AVG, MIN, MAX, HAVING, CASE WHEN, strftime ; COUNT et GROUP BY avaient déjà leur entrée `CLAUSES`, posée au lot 4 pour des exercices de démonstration depuis remappés, mais pas encore de fiche). `PALIERS[1].termine` reste `false` : même logique qu'au lot 6 pour P1, l'utilisateur rejouera le palier avant de le déclarer terminé.
**Statut.** Acceptée. *La règle de la dernière phrase (un palier terminé seulement après que l'utilisateur l'a joué) est remplacée par D067 à partir du lot 10 : un palier passe à `termine: true` dès que son contenu est écrit et vert.*

## D060 — Palier 2 : aucune jointure, même pour le chiffre d'affaires

**Contexte.** D021 réserve `JOIN` au palier 3. Mais le chiffre d'affaires réel (SCHEMA.md §7) — qu'il s'agisse d'exclure les commandes `annulee`/`retournee`, ou de calculer un total « tous statuts » commande par commande — suppose de connaître `commandes.statut` au niveau de chaque ligne de `lignes_commande`, ce qui demande normalement de relier les deux tables.
**Décision.** Aucun exercice du palier 2 ne joint deux tables. Les exercices qui portent sur l'argent restent chacun sur une seule table : `lignes_commande` seule (`SUM(quantite*prix_unitaire) GROUP BY commande_id`, piège P8 — HAVING, division entière) ou `commandes` seule (`SUM(frais_port) GROUP BY statut`). Le chapitre « Chiffre d'affaires : lequel des deux ? » (`ch-p2-11`) enseigne la distinction produits/total sur UNE seule commande (1038, SCHEMA.md §10) : le total de ses lignes vient de `lignes_commande` seule, ses frais de port de `commandes` seule — additionnés dans l'énoncé, jamais par une requête qui relierait les deux tables. La version complète du chiffre d'affaires (exclusion des commandes annulées/retournées sur l'ensemble de la boutique) attend le palier 3 ; un exercice de `ch-p2-11` (`p2-39`, QCM) prépare seulement le piège du gonflement par jointure (SCHEMA.md §7 : 12 911,50 € au lieu de 12 619,00 €) que le palier 3 développera.
**Conséquences.** La partie primaire du piège P7 (quelle définition du chiffre d'affaires retenir selon les statuts inclus) reste rattachée à la compétence `vocabulaire-metier` (palier 5, D043) et n'est pas couverte par ce lot ; seule sa partie secondaire (CASE WHEN sur des familles de statuts) l'est, par `p2-26`.
**Statut.** Acceptée.

## D061 — Palier 2 : fonctions de date limitées à strftime

**Contexte.** D021 mentionne génériquement des « fonctions de date » pour le palier 2. SCHEMA.md documente aussi un délai moyen de livraison (une différence entre `date_livraison` et `date_commande`), qui suppose de comprendre qu'une date AAAA-MM-JJ se soustrait comme un nombre — une idée distincte de l'extraction et du regroupement par `strftime`.
**Décision.** Le palier 2 se limite à `strftime` (année, mois, année-mois) : extraction et regroupement par date. Le calcul de durée entre deux dates (`julianday`, soustraction de dates, piège P11 — retards de livraison) est explicitement repoussé au palier 4, avec les sous-requêtes et les fonctions de fenêtre, où il trouve sa vraie place conceptuelle.
**Conséquences.** Le piège P11 n'est pas couvert par le palier 2 (seuls P3, P6, P7, P8 le sont, comme prévu) ; le contrôle de couverture par piège (D051) le confirme en avertissement, pas en blocage, tant que tous les paliers ne sont pas déclarés terminés.
**Statut.** Acceptée.

## D062 — Correctif du test SE-04 de verifier-progression.mjs

**Contexte.** `SE-04` rejoue toute une session d'exercices en soumettant la bonne réponse de chacun ; pour un exercice `predire`, il substituait systématiquement `Attendus.predire(ex).nbLignes`, quelle que soit la valeur de `ex.predit`. Le palier 1 n'avait jamais utilisé `predit: "valeur"` : la branche était déjà codée et correcte (`exercices.js`, `Attendus.predire`, `TYPES_EXERCICE.predire.valider`), mais jamais exercée par ce test. Le palier 2 l'utilise (`p2-06`, `p2-13`, `p2-16`, `p2-25`), ce qui a fait échouer `SE-04` — une lacune du test, pas du contenu ni du moteur réel.
**Décision.** `verifier-progression.mjs`, `SE-04` : la réponse simulée suit désormais `ex.predit` (`"nbLignes"` → `Attendus.predire(ex).nbLignes`, sinon → `.valeur`), au lieu de toujours lire `.nbLignes`.
**Conséquences.** Aucune hors du test lui-même ; `node verifier-progression.mjs` repasse à 37/37.
**Statut.** Acceptée.

## D063 — Système de design appliqué à l'identique, et accueil sans illustration

**Contexte.** L'utilisateur a fourni un système de design complet (jetons, base, mise en page, composants génériques, composants d'exercice et de parcours) avec la consigne de le copier littéralement : aucune valeur de couleur, de rayon, d'ombre, d'espacement ou de typographie réinventée « à l'œil ». La feuille de style héritée de Classe'R en était proche de structure, mais pas de valeurs : palette plus chaude et moins contrastée, contour de relief tiré de `--bord-fort` faute d'un jeton d'encre, pas de police de titre.
**Décision.** Les deux blocs de jetons (clair et `[data-theme="sombre"]`) sont remplacés mot pour mot, ce qui introduit `--encre`, `--titre` (serif pour `h1` et `.stat__val`), `--rose`/`--rose-doux` et `--selection`/`--selection-ligne`. Les composants que le système décrit explicitement prennent ses valeurs littérales ; les définitions dupliquées (le bloc « Formes généreuses » qui surchargeait `.btn`, `.puce` et les cartes) sont fusionnées dans la définition unique de chaque composant. Hiérarchie retenue, telle que le système la dicte par ses valeurs : contour encre franc (2px `--encre`) et ombre dure pour ce qui agit ou annonce un résultat (carte d'action, bouton, puce, cellules, choix de QCM, option, segment, modale, carte de retour) ; bordure fine `--bord` sans ombre pour les surfaces de lecture (leçon, boîte d'état vide, atelier) et pour les tables de résultats, où la densité prime. Les illustrations en blocs (paysage d'accueil, vignettes de chapitre, module `Illus`) sont retirées, et l'accueil reprend la maquette fournie : puce de série en tête, titre et action prioritaire sur une même ligne, puis trois cartes de chiffres en libellé-puis-valeur (`.stat__sur`).
**Conséquences.** Trois écarts assumés. (1) `--selection` et `--selection-ligne` sont définis mais inutilisés : ils viennent du tableur de Classe'R, qui n'a pas d'équivalent ici — à n'employer que si une sélection de cellules apparaît, jamais détournés. (2) L'accueil n'affiche plus le rapport d'XP dans le niveau (`x / y XP`) : la maquette ne le montre pas, les cellules portent la proportion, et le total reste sur Progression. (3) Seule la maquette de l'accueil a été fournie ; l'utilisateur a demandé dans la foulée d'aligner Progression dessus, si bien que les deux écrans partagent l'ordre libellé-puis-valeur (`.stat__sur`) et la même carte de niveau (valeur, titre du niveau, cellules). Là où le système est muet sur un composant propre à Requêt'R, la règle appliquée est la dérivation : le Lexique suit le traitement de `.modale`, la pastille d'étape et la pastille de chapitre prennent le contour encre, l'éditeur SQL et les tables de résultats restent sobres.
**Statut.** Acceptée.

## D064 — Palier 2 déclaré terminé sans la relecture, pour ouvrir le lot 8

**Contexte.** Depuis le lot 6, un palier n'est déclaré `termine: true` qu'après que l'utilisateur a rejoué le parcours complet, et le lot suivant attendait ce retour. L'utilisateur a demandé de lever cette attente (« enlève ce verrou, je souhaite avancer sur le projet »).
**Décision.** `PALIERS[1].termine` passe à `true`, et le lot 8 s'ouvre sans attendre la relecture du palier 2. Vérifié avant la bascule, comme pour P1 : les deux contrôles de couverture qui deviennent bloquants passaient déjà (`agreger` 23, `valeurs-manquantes` 8, `dates` 8 exercices, tous au-dessus du minimum de 6 ; aucun exercice orphelin de chapitre). `node verifier-autotest.mjs` reste vert après la bascule, les contrôles de P2 étant désormais bloquants.
**Conséquences.** Ce qu'une relecture aurait attrapé reste non couvert : la qualité d'une explication, le dosage de la difficulté, la progression d'un palier — l'Autotest le dit lui-même en pied de rapport, il ne mesure pas cela. Le palier 2 reste relisible à tout moment, et un correctif de contenu ne demandera pas de rouvrir cette décision. La règle de D059 vaut toujours pour les paliers 3 à 5 : `termine` ne bascule que sur demande explicite de l'utilisateur.
**Statut.** Acceptée.

## D065 — Palier 3 (lot 8) : portée, découpage, et la règle du « predire »

**Contexte.** Lot 8 : le palier 3 (D002/D021 — les jointures), seul palier à n'avoir qu'une compétence active (`joindre`, D043). SCHEMA.md le documente abondamment : P1 (clients sans commande, `LEFT` contre `INNER`, filtre en `ON` contre `WHERE`, `COUNT(*)` contre `COUNT(colonne)`), P2 (produits jamais commandés, catégorie vide), P4 (gonflement du `SUM` après jointure), P7 (définition du chiffre d'affaires), P9 (auto-jointure du parrainage), P10 (prix facturé contre prix actuel) — tous vérifiés par le seed gelé.
**Décision.** Portée complète, arbitrée par l'utilisateur : `JOIN`, `LEFT JOIN`, anti-jointure, auto-jointure, jusqu'à trois tables, et le chiffre d'affaires produits que D060 avait repoussé. 14 chapitres (`ch-p3-1` à `ch-p3-14`), 45 exercices (`p3-01` à `p3-45`) : 14 `requete`, 11 `corriger`, 10 `predire`, 10 `qcm` ; difficultés 1/2/3 réparties 4/18/23. Trois clauses nouvelles (`JOIN`, `ON`) ou enfin dotées d'une fiche (`LEFT JOIN`).
**La règle du `predire`, posée par l'utilisateur et appliquée à la lettre.** Un `predire` n'est retenu que lorsque le NOMBRE EST la leçon et qu'il se DÉDUIT : 70 contre 142, 2 800 pour une jointure sans `ON`, 40 contre 34, l'écart 76 − 70 = 6, les 9 lignes de l'auto-jointure. Chaque réponse se dérive soit des nombres de lignes affichés par la carte du Schéma (7, 30, 40, 70, 142), soit d'un fait établi juste avant dans le même chapitre, soit d'une règle de structure. Un nombre qu'on ne pourrait que relever ou deviner — les 636,00 € du total gonflé, les 5 produits jamais commandés, les 27 clients du filtre en `WHERE` — devient un `corriger` ou un `requete`. Conséquence assumée : la part de `predire` suit la matière (10 sur 45) au lieu d'un quota. Un cas a résisté au vérificateur, qui refuse une référence valant 0 (« résultat trivial ») alors que 0 était justement la leçon : il a été reformulé en écart entre les deux comptes (`COUNT(*) - COUNT(o.id)` = 6), ce qui conserve l'enseignement et donne un nombre déductible.
**Frontière avec le palier 4.** Aucune sous-requête, comme aux paliers précédents : l'anti-jointure s'écrit `LEFT JOIN … WHERE clé IS NULL`, jamais `NOT IN (SELECT …)`. Le piège P9 des `NOT IN` face à `NULL` reste donc hors programme ici ; seule son autre face, la disparition des lignes dont la clé de liaison est `NULL`, est exercée (`p3-44`). Le chiffre d'affaires TOTAL (12 619,00 €) ne se calcule pas en une requête à ce stade : `ch-p3-13` fait additionner séparément les 12 387,00 € de produits et les 232,00 € de frais de port, et dit explicitement que l'agrégation avant jointure attend le palier 4 — même traitement que D060 au palier 2.
**Conséquences.** Les pièges P1, P2, P4, P7, P9 et P10 sont désormais exercés ; les avertissements de couverture tombent de 12 à 6 (les quatre compétences vides des paliers 4 et 5, plus les pièges P5 et P11, non encore abordés). `PALIERS[2].termine` reste `false` : la règle de D059 s'applique, l'utilisateur seul le déclare terminé. La relecture humaine du contenu reste entière — l'Autotest vérifie que chaque requête s'exécute, qu'aucun départ de `corriger` n'est accepté et qu'aucune référence n'est triviale, pas la clarté d'un énoncé ni le dosage d'une progression.
**Statut.** Acceptée.

## D066 — Palier 4 (lot 9) : portée, découpage, rattachement du piège P11, et la règle du `predire` étendue aux fonctions de fenêtre

**Contexte.** Lot 9 : le palier 4 (D002/D021 — sous-requêtes dont corrélées, CTE, fonctions de fenêtre, top-N par groupe, cumuls), deux compétences actives pour la première fois en même temps sans qu'aucune n'ait encore d'exercice (`sous-requetes`, `classer-cumuler`, D043). Le lot reprend aussi deux dettes explicitement laissées par les paliers précédents : le calcul de délai par `julianday` (piège P11, repoussé par D061) et le chiffre d'affaires total en une seule requête (agréger avant de joindre, repoussé par D065). Un avertissement du brief : le palier 3 est écrit mais pas encore joué par l'utilisateur ; aucun exercice de ce lot ne dépend de sa formulation exacte, seulement des notions du programme et du seed.
**Décision — découpage.** 11 chapitres (`ch-p4-1` à `ch-p4-11`), 38 exercices (`p4-01` à `p4-38`) : 18 `requete`, 4 `corriger`, 10 `predire`, 6 `qcm` ; difficultés 1/2/3 réparties 5/24/9. Compétence `sous-requetes` : 5 chapitres, 18 exercices (sous-requête scalaire, `IN`/`NOT IN`, le piège `NOT IN` + `NULL` du parrainage — P9 —, la sous-requête corrélée, la CTE). Compétence `classer-cumuler` : 6 chapitres, 20 exercices dont 3 pour le piège P11 (GROUP BY contre fonction de fenêtre, `ROW_NUMBER`/`RANK`/`DENSE_RANK` — P5, cœur du palier —, le top-N par groupe, `LAG` — P6 secondaire —, `SUM() OVER`, les retards par `julianday`). Dix entrées nouvelles dans `CLAUSES` et `FICHES` : `WITH`, `OVER`, `PARTITION BY`, `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `NOT IN`, `EXISTS`, `julianday`.
**Décision — le piège P11 reste rattaché à la compétence `dates`, pas à `classer-cumuler`.** D043 attache P11 à `dates`, dont le palier déclaré est P2 ; ses trois exercices (`p4-36` à `p4-38`) portent pourtant `niveau: "P4"`. Arbitrage explicite de l'utilisateur, qui corrige la recommandation inverse proposée en plan : une compétence mesure une CAPACITÉ (ici, calculer un délai entre deux dates), un palier dit seulement QUAND elle est enseignée. Les ranger dans `classer-cumuler` pour préserver une symétrie palier/compétence aurait rendu la carte de maîtrise inexacte sur ce qu'elle mesure. C'est le premier cas du projet où une compétence porte des exercices hors du palier auquel `CONTENU.competences` la rattache. Vérifié avant d'écrire : aucun code ne suppose l'inverse — `Progression.competencesVisibles(niv)` accepte un filtre par palier, mais n'est appelée nulle part avec cet argument (`routeur.js`), donc rien n'aurait pu filtrer `dates` hors de l'écran P4 de toute façon.
**Décision — règle d'auteur sur les fonctions de fenêtre et les ex æquo, au même titre que D029.** Pour qu'un exercice de rang reste déterministe (D001) ET montre réellement une égalité : `ROW_NUMBER() OVER (ORDER BY ...)` reçoit toujours une clé secondaire unique (l'id, par exemple) dans son PROPRE `OVER`, pour que le départage d'un ex æquo ne dépende jamais d'un ordre de balayage non garanti ; `RANK()`/`DENSE_RANK() OVER (ORDER BY ...)`, sur le même classement, n'en reçoivent JAMAIS, sous peine de faire disparaître l'égalité qu'ils doivent précisément montrer. Les trois fonctions, dans un même exercice, ont donc des `OVER` différents malgré une base commune. Comme pour D029(b), aucun contrôle mécanique n'est ajouté à l'Autotest : le vérifier demanderait d'analyser le texte SQL, ce que le projet évite depuis le lot 3.
**Décision — la règle du `predire` (D065) reconduite à l'identique.** Retenu seulement si le nombre se déduit d'un fait déjà établi ou d'une règle de structure : le rang qui suit un ex æquo (`p4-24`, `p4-29`), le complément d'un compte déjà connu (`p4-03`, `p4-05`), le dernier cumul déjà identique à un total connu (`p4-34`). Un nombre qui ne pourrait que se calculer en exécutant — le total gonflé à 12 911,50 €, les délais exacts en jours — devient un `requete`.
**Conséquences.** Les pièges P5, P6 (secondaire) et P11 sont désormais exercés ; P9 l'est une seconde fois, cette fois comme piège de sous-requête plutôt que d'auto-jointure. Les avertissements de couverture tombent de 6 à 2 (les deux compétences du palier 5, toujours vides). `PALIERS[3].termine` reste `false` : la règle de D059 s'applique, l'utilisateur seul le déclare terminé, après avoir joué le palier. `node build.mjs`, les quatre vérificateurs Node et les 2 × 76 vérifications navigateur (Chrome, Edge, profil isolé) sont verts.
**Statut.** Acceptée. *La phrase sur `PALIERS[3].termine` est remplacée par D067, juste après : P3 et P4 passent à `termine: true` le jour même de D067, sans attendre que l'utilisateur les ait joués.*

## D067 — Un palier passe à `termine: true` dès que son contenu est écrit et vert, sans attendre qu'il soit joué

**Contexte.** Depuis le lot 6 (D059, reconduite en substance par D064, D065, D066), la règle était : un palier écrit reste `termine: false` jusqu'à ce que l'utilisateur l'ait rejoué et l'ait déclaré terminé explicitement — l'Autotest garantissant seulement qu'un palier est vert, jamais qu'il est bon (clarté, dosage, progression). L'utilisateur change cette règle : il ne veut plus attendre d'avoir joué un palier pour que les contrôles de couverture qui lui sont propres (D051 : compétence active ≥ 6 exercices, aucun exercice orphelin de chapitre) deviennent bloquants pour lui.
**Décision.** Un palier passe à `termine: true` dès que son contenu est écrit et que `node verifier-autotest.mjs` est vert pour lui, sans attendre une relecture humaine ni une demande explicite séparée. Les deux contrôles de couverture par palier (D051) deviennent donc bloquants au moment même où le palier est écrit, pas après coup. `PALIERS[2].termine` (P3) et `PALIERS[3].termine` (P4) passent à `true` dès ce lot, par application immédiate de cette règle à ce qui était déjà écrit. Relecture faite avant la bascule : `node build.mjs`, les quatre vérificateurs Node (71, 235, 37 et l'Autotest, ce dernier rejoué après la bascule) et les 2 × 76 vérifications navigateur (Chrome, Edge) restent verts ; aucun contrôle de couverture devenu bloquant pour P3 ou P4 n'a rien fait apparaître (`joindre` à 45 exercices, `sous-requetes` à 18, `classer-cumuler` à 17, aucun exercice orphelin).
**Conséquences.** La distinction « vert » / « joué et validé », posée en Reprise depuis le lot 6, disparaît du document : elle décrivait une attente qui n'existe plus. L'Autotest continue néanmoins à ne rien dire de la clarté d'un énoncé, du dosage de la difficulté ni de la progression d'un palier (D051, pied de rapport) — seule la condition qui faisait dépendre `termine` d'un retour d'usage est retirée, pas la limite de ce que l'Autotest mesure. Le contrôle de couverture des pièges (bloquant quand TOUS les paliers sont `termine: true`) ne se déclenche pas encore : P5 reste à écrire.
**Statut.** Acceptée. Remplace, sur ce point précis, la règle posée par D059 et reconduite par D064, D065 et D066 — ces décisions ne sont pas réécrites, seule la règle qu'elles appliquaient change.

---

## Questions ouvertes

- **Q1 — RÉSOLUE au lot 3 : D028 à D034.** *(Énoncé d'origine, conservé :)* Comparateur de résultats (à trancher au LOT 3, pas avant). Décision structurante : comment comparer le jeu de résultats d'un élève à celui de la solution ? Points à décider : `NULL`, `1` contre `1.0`, tolérance sur les flottants, noms d'alias de colonnes, casse du texte, ordre des colonnes, ligne ordonnée ou non selon l'exercice.
- **Q2 — CLOSE au lot 3 (D031) : deux entiers distincts au-delà de 2^53 se confondent, ce qui ne produit qu'une acceptation à tort, dans le sens voulu.** *(Énoncé d'origine :)* Entiers au-delà de 2^53. sql.js rend les entiers SQLite en nombres JavaScript : `9007199254740993` revient `9007199254740992`. Sans effet sur le contenu prévu, à garder en tête pour le comparateur.
- **Q3 — CLOSE définitivement au lot 3 (D039) : plus une question ouverte du projet.** *(Historique :)* Firefox. Le chargement WASM par `wasmBinary` n'a pas été vérifié sur Firefox (non installé). ~~À contrôler à la main avant la fin du lot 2.~~ **Mise à jour (lot 2) : reportée au lot 3, non bloquante.** Chrome et Edge suffisent à valider `file://` + WASM embarqué. Contrôle manuel à prévoir : ouvrir `requeter.html` dans Firefox, vérifier que `SELECT count(*) FROM clients;` renvoie 40 et que le panneau « Schéma » s'ouvre.
- **Q4 — Données sales (palier 5). RÉSOLUE : option (b), voir D027.** Le programme du palier 5 (D021) annonce « données sales » et « contrôles de cohérence » ; le seed principal est propre par construction (aucun doublon, aucune casse ou espace incohérent, aucune violation d'invariant) et l'Autotest du lot 5 rejette une requête de référence qui renvoie 0 ligne. Les trois options étaient : (a) anomalies délibérées dans le seed principal avec une liste d'« anomalies connues » ; **(b) un jeu de données sales distinct réservé au palier 5 — retenue** ; (c) renoncer. Le seed principal reste intact et gelé (D025) ; le jeu sale naîtra au lot du palier 5.
- **Q5 — RÉSOLUE au lot 3 : D040.** *(Énoncé d'origine :)* Mélange des options de QCM : `ordreAffichage`, repris tel quel de Classe'R, regroupait les bonnes réponses à l'intérieur d'une famille d'identifiants consécutifs (`ex-001…040` → positions A, B, C, D : 8, 15, 14, 3), et le contrôle de distribution ne voyait que la sur-représentation.

---

## Portage depuis Classe'R

### Repris quasiment tel quel (lots 3-4)
- **Store** *(fait, lot 4, D045)* (persistance, schéma, migrations, export/import JSON) — seule la clé change : `requeter.etat` ; l'export `classer-progression-…` devient `requeter-progression-…`.
- **Progression** *(fait, lot 4, D045)* (XP, niveaux, maîtrise, décroissance d'oubli, consolidation à 3 réussites sans indice, certifications, `pointsFaibles`).
- **Bus** *(fait, lot 4)*, `el()` *(fait, D009)*, `cellules()` *(fait, lot 4)*, `icone()` *(fait)*, **Toast** *(fait)*, **Modale** *(fait, lot 4)*, `piegeFocus`.
- **Routeur** *(fait, lot 4, D047)* et la coquille des **Vues** *(fait)*, le rail de navigation *(fait)*.
- **Contenu** (filtrage par niveau) *(fait, lot 4)* et **Packs** *(fait, lot 4, D049 : un seul pack)*.
- **Session**, **Parcours**, **Mission** *(faits, lot 4, D048 ; la validation de Mission change, voir D048)*.
- **Indices** : 3 niveaux + solution verrouillée (voir « Réécrit ») — `multiplicateurXp`/`facteurMaitrise` ajoutés en lot 4 (D045).
- **Affichage**, `carteRetour`, `ligneProgres`, `carteEssai`, `zoneEssai` *(faits, lot 4 : `carteVerdict` du lot 3 fondue dans `carteRetour`)*.
- **Illus** (paysage, vignettes) *(fait, lot 4)*, onboarding *(fait, lot 4, D049 : question factuelle)*, `appliquerTheme` *(fait, lot 4 : lit Store)*, `demarrer` *(fait, lot 4)*.
- **Autotest** — repris **et renforcé** (lot 5). Garde-fou central : chaque requête de référence est exécutée contre le seed et rejetée si elle plante, renvoie 0 ligne, renvoie un résultat trivial, ou viole D001. Omis du brief initial.

### Supprimé, sans remplacement
`Ref`, `Formules`, `FONCTIONS`, `ErreurCalcul`, `Feuille`, `Formatage`, `MFC`, `TCD`, `Graphique`, `svg()`, `creerTableur`, `ATELIERS`, `CONTENU.bacASable`, `FICHES` *(remplacé, voir ci-dessous)*.

### Remplacé
- Les 12 **VALIDATEURS** → un seul comparateur de jeu de résultats (comparaison ligne à ligne, ordonnée ou non selon l'exercice) — lot 3, voir Q1. *(Fait au lot 3 : `src/comparateur.js`, D028 à D034.)*
- `creerTableur` → un éditeur SQL + une table de résultats en lecture seule (la page de démo du lot 1 en est l'ébauche jetable).
- **Lexique** des fonctions Excel → lexique des clauses SQL.
- `TYPES_EXERCICE` : `"qcm"` conservé ; `"formule"` et `"grille"` remplacés par `"requete"`, `"corriger"` (réparer une requête fautive) et `"predire"` (annoncer le résultat avant exécution). *(Fait au lot 3 : `src/exercices.js`, D035 pour `predire`.)*
- **Fiche** + `FICHES` → fiches par clause SQL (JOIN, GROUP BY, CTE, fonctions fenêtre…). Omis du brief initial.
- `fonctionsDe` → détecteur de clauses, pour le résumé de fin de série. Omis du brief initial.

### Réécrit
- `Indices.pour` : le niveau « Fonction », tiré de `FONCTIONS`, devient un niveau « Clause » tiré du lexique SQL. *(Fait au lot 3 : `Indices.pour`, tiré de `CLAUSES` ; le lexique complet reste à écrire.)*

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

---

## Vérifications du lot 2 (2026-10-06)

Seed : `node verifier-seed.mjs` → **70 critères satisfaits**, code retour 0. Navigateur : scénario DevTools sur `file://` (Chrome 154 et Edge 154), **26 vérifications chacun, toutes vertes** ; le volet intégré de l'application (Chromium 152) a servi aux contrôles visuels.

| Critère | Résultat |
|---------|----------|
| C1 Build sans erreur ; relancé, même SHA-256 ; poids du seed | oui (builds répétés, empreinte identique : `e13f0af9…`) ; 1 010 876 o ; seed 13 261 o (plafond 40 Ko, cible 18 Ko) |
| C2 Volume | 289 lignes (7 + 30 + 40 + 70 + 142) ; plages d'identifiants disjointes |
| C3 Intégrité et clés étrangères | `foreign_key_check` vide, `integrity_check` ok, 5 clés étrangères dont 1 auto-référence, `PRAGMA foreign_keys` = 1 sur base neuve, `INSERT` hors relation → `FOREIGN KEY constraint failed` (aussi dans l'application) |
| C4 à C13 Pièges P1 à P11 | tous présents (requêtes de contrôle et résultats dans `SCHEMA.md` §8) : 6 clients sans commande (34 contre 40 en `INNER`/`LEFT`), 5 produits jamais commandés + 1 catégorie vide, NULL dans 4 colonnes, gonflement de `SUM(frais_port)` 306,50 → 636,00, ex æquo de rang (prix, client rang 3, quantité), 17 mois sur 18, 5 statuts, `NOT IN` + NULL → 0 contre 31, 2 retards sur 5 expédiées |
| C4c — **cible ajustée** | **2** clients dont toutes les commandes sont annulées (219 : deux ; 232 : une), et non 1 comme prévu au plan : le client 232 n'a qu'une commande, annulée. Cible corrigée plutôt que les données tordues (consigne d'exécution A) |
| C14 Cohérence, accents, ordre alphabétique | 0 violation ; `ORDER BY` binaire = ordre alphabétique sur nom, prénom, ville, produit, catégorie |
| C15 Déterminisme | aucune construction interdite dans le seed ; deux constructions → contenus identiques |
| C16 Lisibilité à la main | commande 1038 : 34 + 29 + 2 × 12,50 + 4 × 3,50 = **102,00**, port 6,50, total 108,50 — concorde avec la requête (voir `SCHEMA.md` §10) |
| C17 `nouvelleBase()` | 50 reconstructions : **médiane 3,4 à 5,8 ms** (3,85 / 4,35 / 4,75 / 5,75 en Chrome sur quatre exécutions, 3,4 en Edge), p90 6,6 à 9,3 ms, max 13,8 ms ; première construction à froid ≈ 60 à 67 ms ; après `DROP TABLE` + `DELETE`, l'appel rétablit 5 tables, 70 commandes, FK actives |
| C18 Explorateur : contenu | sur les 5 tables : nom, colonnes et types, clé primaire (composée pour `lignes_commande`), clés étrangères avec cible cliquable, « Référencée par », nombre de lignes identique à `count(*)`, 5 lignes d'aperçu avec NULL visibles ; carte à 5 boîtes et 5 traits (dont la boucle `parrain_id`) ; `CREATE TABLE` en repli |
| C19 Explorateur : comportement | ouverture par le bouton du rail, `role="dialog"` + `aria-modal`, focus sur l'onglet actif sans défiler ; Tab ×40 et Maj+Tab ×15 : le focus ne sort jamais ; Échap ferme (focus rendu au bouton, y compris quand le focus est hors du panneau) ; clic sur le voile ferme ; texte de l'éditeur intact ; `total_changes()` inchangé (aucune écriture) ; base vivante : après `DROP` de 2 tables, 3 tables et 2 relations ; base vide : message explicite ; thème sombre ; < 820 px : plein écran, la carte défile horizontalement |
| C20 Démo | exemples sur le seed (aperçu, jointure, agrégat), « Réinitialiser » appelle `nouvelleBase()` ; plus aucun `CREATE TABLE clients` dans le code source |
| C21 Hors ligne | `file://` : une seule requête (le document), 0 ressource ; aucun `locateFile` dans nos sources (les 2 occurrences du livrable sont dans `vendor/sql-wasm.js`), aucune `<link>`, aucun `src="http`, aucune police externe |
| C22 Hygiène | `Reference/` identique à `HEAD` ; D012 à D026 et Q3/Q4 inscrites ; poids et SHA-256 reportés |
| Défauts trouvés et corrigés pendant la vérification | (1) le focus initial sur l'onglet faisait défiler la liste et cachait la carte → `focus({ preventScroll: true })` ; (2) < 820 px, la carte (724 px) élargissait la boîte à 786 px → `min-width: 0` sur l'élément de grille ; (3) la colonne « Remarque » forçait un défilement horizontal → tableau des colonnes à 100 % |
| Second navigateur | Edge (Chromium) ; **Firefox non testé, reporté au lot 3** (Q3, non bloquante) |

### Suite de la validation du lot 2 (2026-10-06)

Après validation du lot : arbitrage de Q4 (D027), gel du seed (D025), signature `nouvelleBase(seed = SEED_SQL)`.

| Vérification | Résultat |
|---|---|
| `src/seed.sql` intact depuis la validation | oui : empreinte `04c2308d…` ; le critère « GEL » échoue bien si une ligne est ajoutée au seed (essayé sur le fichier, restauré aussitôt, empreinte identique) |
| `node verifier-seed.mjs` | **71 critères satisfaits** (70 + « GEL »), code retour 0 |
| Régression du scénario complet du lot 2 après modification de `app.js` | Chrome 154 : 26/26 ; Edge 154 : 26/26 |
| `nouvelleBase()`, `nouvelleBase(undefined)`, `nouvelleBase(autreSeed)`, retour au seed principal | 5 vérifications, toutes vertes, Chrome et Edge |
| Build | `requeter.html` 1 011 332 o, SHA-256 `cda275c6…` |
| Médiane de reconstruction sur ces deux dernières exécutions | 6,2 ms (Chrome), 7,85 ms (Edge) : plus haut que les 3,4 à 5,8 ms de la première livraison parce que deux navigateurs tournaient en parallèle ; fourchette de D023 corrigée en conséquence |

---

## Vérifications du lot 3 (2026-10-07)

Première passe, avant la vérification de l'utilisateur (voir « Corrections demandées par l'utilisateur » plus bas pour la suite et l'état final avant commit).

| Critère | Résultat |
|---|---|
| `node verifier-seed.mjs` | **71 critères satisfaits** (le critère GEL est intact : `src/seed.sql` n'a pas bougé, `git diff` vide) |
| `node verifier-comparateur.mjs` | **235 critères satisfaits**, code retour 0 : comparateur (nombres, NULL, texte, types mixtes, blobs, lignes, ordre, colonnes), moteur, 13 codes de diagnostic sur du SQL réel du seed, garde-fous, détection D033, 3 familles de formulations (C1), exercices de démonstration, `predire`, `qcm` (mélange FNV-1a, contrôle de distribution bilatéral : D040), `Indices`, pureté |
| La suite sait échouer | **12 mutants** du code (tolérance nulle, NFC retiré, ordre jamais vérifié, masque 1×1 désactivé, strict devenu souple, « 007 » = 7, écritures acceptées, `random()` non détecté, NULL = 0, plafond supprimé, écritures non détectées, exécution isolée sur la base vivante) : **12 tués** ; le contrôle de distribution (D040) a ses propres mutants (plancher supprimé, plafond supprimé, plancher fixe à 15 %, ancien hachage) : **4 tués**. Un 13e « NULL égal à 0 » avait survécu à une mutation inopérante (`Number.isFinite(null)` ne contraint pas) ; rejoué avec une vraie mutation, il est tué |
| C1 Formulations alternatives | 3 familles (commandes par client, produit et catégorie, produits > 100 €) : avec/sans alias, `JOIN` explicite ou jointure par `WHERE`, `RIGHT JOIN`, sous-requête corrélée, CTE, `GROUP BY 1`, casse et espacement libres : **toutes acceptées** ; aussi dans l'application, par l'écran |
| C7 Un `DELETE` lancé dans l'éditeur | `DELETE FROM lignes_commande;` avec Exécuter (la base vivante est amputée, une note le dit), puis une bonne requête : **Vérifier l'accepte** (Node et navigateur) |
| C8 Produit cartésien | 4 tables : arrêt à 10 000 lignes, **126 ms** dans le navigateur (au lieu d'un gel), « Plus de 10 000 lignes », affichage limité à 500 ; Vérifier : « Plus de 10 000 lignes obtenues » |
| Chaque message différencié sur un cas réel | `DG-01` à `DG-28` (`--messages` les imprime) ; messages relus un à un ; aucun résultat attendu 1×1 ne fuit (valeur absente du constat, des pistes, de l'écart et de la page) |
| Navigateur | **Chrome 154.0.8037.93 et Edge 154.0.4258.62**, `file://`, headless, profils temporaires isolés, par `node outils/cdp.cjs` (D041) : **27 vérifications chacune, toutes vertes**, rejouées après D040 ; **1 seule requête réseau** (le document), **0 erreur console**. Pane intégré (Chromium) : contrôles visuels (thème sombre, 375 px : colonnes empilées, aucun défilement horizontal), focus rendu au bouton Schéma après Échap, `piegeFocus` |
| C14 Éditeur et explorateur | même nœud `<textarea>` et texte intact : après ouverture/fermeture de l'explorateur, après un verdict, après être sorti de l'exercice puis revenu (brouillon et verdict retrouvés) |
| C13 Un type = une entrée | un type `factice` ajouté à chaud dans `TYPES_EXERCICE` est rendu et validé par l'écran sans autre modification (navigateur ; pas de test Node) |
| Build | idempotent (même SHA-256 sur deux builds : `9f3caea0…`) ; 1 088 580 o ; aucun `locateFile`, aucune `<link>`, aucun `src="http`, aucune ressource externe |
| Hygiène | `Reference/` identique à `HEAD` ; D028 à D042 inscrites ; Q1 et Q5 résolues, Q2 et Q3 closes |
| Non vérifié | Firefox (Q3 close) ; Tab quittant le `<textarea>` (comportement natif, non intercepté ; non testable par événement synthétique) ; lecteur d'écran |

### Corrections demandées par l'utilisateur après la première livraison (2026-10-07)

Quatre points relevés à la vérification de l'utilisateur, traités avant le commit.

| Point | Constat | Traitement |
|---|---|---|
| 1. Un « null » s'affichait à l'écran | `Node.replaceChildren(...)` et `Node.append(...)` convertissent un argument `null` en la chaîne `"null"` (ce ne sont pas des enfants ignorés comme dans `el()`) ; deux appels directs au DOM en construisaient un avec un ternaire sans branche `null` filtrée : le pied de l'écran d'exercice (à côté de « Tous les exercices ») et la ligne d'état du bac à sable (après « Réinitialiser la base » et à l'ouverture, quand `majEtat()` est appelée sans argument) | `src/app.js` : les deux `replaceChildren` construisent désormais leur liste d'enfants puis la filtrent (`...(x ? [x] : [])`), jamais de `null` littéral passé au DOM. Revérifié à l'écran (volet intégré, serveur local) : plus de « null » dans les deux cas |
| 2. Le type `predire` montrerait le résultat avant la réponse | Relecture du code et nouvel essai : `revele` (la zone qui affiche « Voici ce que SQLite renvoie ») n'est remplie que dans le rappel `surRetour`, qui ne s'exécute qu'après `repondre()`, ou rejoué si l'exercice a déjà une réponse enregistrée en mémoire de session (`e.dernier`, D037 : les types à réponse unique se verrouillent après la première réponse et montrent aussitôt l'explication). **Ce n'est pas un défaut de l'écran** : le constat de l'utilisateur correspond au cas où l'exercice avait déjà été répondu plus tôt dans la même session, puis revisité — le comportement voulu par D035/D037. Confirmé par deux nouvelles vérifications ajoutées à `outils/scenario.js` : aucune ligne ni le titre « Voici ce que SQLite renvoie » avant une première réponse ; après une réponse puis un aller-retour par la liste, le verdict et le résultat sont retrouvés (pas rejoués avant une réponse sur un exercice neuf) | Aucun changement de code ; deux vérifications ajoutées à `outils/scenario.js` (29 vérifications au lieu de 27) |
| 3. La liste n'indique pas où cliquer | Les cartes de `#/exercices` étaient des `<a href>` sans aucune affordance de clic (pas de verbe, pas de flèche) : un verdict correct sur le fond (un lien est nativement accessible au clavier), mais qui ne se lisait pas comme une action pour un débutant | Reprise du modèle `carteAcces` de Classe'R (`Reference/classer-v2.html`) : les cartes sont des `<button type="button">` (`onclick` → `location.hash`), avec une puce d'action en tête de carte dont le libellé dépend de l'état (« Commencer » / « Reprendre » / « Refaire », cf. D037 pour `tentatives`/`reussi`) ; `.carte--action` (déjà dans le CSS porté de Classe'R, D006) donne le survol et le `:focus-visible` global donne le focus clavier. Vérifié : navigation Tab + Entrée sur une carte ouvre bien l'exercice |
| 4. La liste ne guide pas | Aucune structure ne permettait de savoir, avant le lot 4 (Progression), ce qu'un exercice travaille ni par où commencer | Voir **D042** : métadonnées d'exercice (`niveau`, `competence`, `categorie`, `difficulte`), regroupement de la liste par palier (`PALIERS`, `src/contenu.js`), puces visibles sur chaque carte, et deux emplacements réservés et inertes (carte « Série recommandée », sélecteur de palier `disabled`) que le lot 4 branchera |

Revérifié après corrections : `node verifier-seed.mjs` (71 critères), `node verifier-comparateur.mjs` (235 critères), `node outils/cdp.cjs tous` (**29 vérifications, Chrome et Edge, toutes vertes** ; 1 requête réseau, 0 erreur console), build idempotent (1 092 307 o, `38cf1834…`). Revue à l'œil (volet intégré, `requeter.html` servi en local sur `127.0.0.1`, D041 pour le rappel de ne jamais ouvrir un navigateur « pour voir ») : écran de liste groupé par palier, thème sombre, largeur 375 px sans défilement horizontal, plus de « null » nulle part.

---

## Repères techniques (lot 3, validé et commité)

*Section écrite à l'arrêt de la session du 2026-10-07, complétée après la vérification de l'utilisateur et les quatre corrections qui ont suivi (voir plus haut), pour qu'une nouvelle session (lot 4) reprenne sans relire tout le code. Le lot 3 est commité : les points propres à la reprise d'un lot interrompu (état des fichiers avant commit, parcours de vérification) sont retirés ; ce qui reste est de la connaissance durable.*

### 1. Points à arbitrer plus tard

**Inscrites au lot 3 :** D028 (principe, asymétrie), D029 (lignes, `ordonne`, précision de D001), D030 (colonnes), D031 (valeurs), D032 (Exécuter / Vérifier), D033 (déterminisme côté apprenant), D034 (constat et pistes, 1×1), D035 (`predire`), D036 (plafond et délai), D037 (tentatives), D038 (structure des sources, tests), D039 (Q3 close), D040 (mélange FNV-1a, contrôle bilatéral), D041 (tests navigateur isolés), D042 (métadonnées d'exercice, liste groupée par palier). Q1 et Q5 résolues ; Q2 et Q3 closes.

**À arbitrer par l'utilisateur :**
- **Lot 4** : la **politique de comptage** des tentatives et des indices (D037) ; faire compter « résultat vu » comme un niveau d'indice (le côte-à-côte donne beaucoup) ; portage de `Indices.multiplicateurXp` et `facteurMaitrise` (non portés au lot 3, ils vont avec `Progression`) ; brancher les deux emplacements inertes de D042 (carte « Série recommandée », sélecteur de palier) ; la liste des compétences SQL et leur rattachement aux paliers (`competence` de D042 reste provisoire).
- **Lot 5** : l'Autotest doit **généraliser** ce que `verifier-comparateur.mjs` pose déjà (réponse de référence acceptée, `corriger` : départ refusé, contrôle QCM, distribution, `D001` sur les requêtes d'exercice) et ajouter les **règles d'auteur** de D029/D030 (clé de tri visible, pas de `cles` avec un `LIMIT` qui coupe un ex æquo, colonnes énumérées dans l'ordre) et « référence de plus de 10 000 lignes » (D036).
- **Palier 5** : un second jeu de données (D027) : `Moteur.executerIsole` accepte déjà un paramètre `seed`, mais `Attendus` et `validerRequete` ne le transmettent pas encore (champ `ex.seed` à prévoir).

### 2. Ce qu'une nouvelle session devrait savoir

**Commandes.** `node build.mjs` (reconstruit `requeter.html`, affiche taille et SHA-256) ; `node verifier-seed.mjs` (71 critères) ; `node verifier-comparateur.mjs` (235 critères, code retour 1 au moindre écart) ; `node outils/cdp.cjs` (Chrome et Edge, après `node build.mjs`) ; `node verifier-comparateur.mjs --messages` (imprime les textes tels que l'apprenant les lit : à relire à chaque changement de rédaction).

**Principes arbitrés par l'utilisateur (à ne pas rediscuter).** (1) Un refus à tort est bien pire qu'une acceptation à tort : en cas de doute, accepter. (2) Le constat est toujours vrai, la piste est une hypothèse : entre une piste précise mais incertaine et le seul constat, donner le constat. (3) Un résultat attendu **d'une seule cellule** n'est jamais affiché, ni rien qui le devine (écart relatif, inclusion) ; plus d'une cellule : côte à côte. (4) Pas de Worker. (5) Firefox : clos. (6) Test navigateur : toujours un profil temporaire isolé (D041). (7) `D001` précisée, jamais réécrite ; une décision n'est jamais réécrite, on en ajoute une qui la remplace.

**Modèle de données d'un exercice** (commentaire en tête de `exercices` dans `src/contenu.js`) : `id, type, titre, question, consigne` ; `niveau` (id de `PALIERS`), `competence` (provisoire, D042), `categorie`, `difficulte` (1 à 3) ; `requete` / `corriger` : `solution` (SQL de référence, jamais comparée au texte), `comparer: { ordonne, colonnes, texte }`, `depart` (corriger) ; `predire` : `requete` et `predit: "nbLignes" | "valeur"` (champ nommé `predit` et non `question`, pour ne pas entrer en collision avec l'énoncé) ; `qcm` : `options` (bonne réponse en tête) et `reponse` ; indices : `piste`, `clause` (clé de `CLAUSES`), `exemple` ; retour : `explication`, `retenir`.

**Contrat entre l'écran et un type** (commentaire en tête de `src/exercices.js`) : `rendre(ex, api)` et `valider(ex, reponse)` ; `api = { repondre, surRetour, brouillon, surBrouillon, reponsePrecedente }`. Verdict commun : `{ statut: "reussi" | "incorrect" | "non-evalue", reussi, compte, code, constat, pistes, notes, details, … }`. Ajouter un type = ajouter une entrée de `TYPES_EXERCICE` (plus un libellé dans `LIBELLE_TYPE` de `app.js`).

**Pièges déjà rencontrés.**
- Le comparateur et le moteur se chargent **sous Node** dans la suite par une évaluation indirecte de la concaténation des fichiers (même royaume : pas de piège `instanceof` entre contextes) ; les globaux `initSqlJs`, `WASM_B64`, `SEED_SQL` sont posés avant. Tout fichier de `src/` chargé là doit rester sans DOM au niveau supérieur.
- `ArrayBuffer.isView` (et non `instanceof Uint8Array`) pour reconnaître un blob.
- `INSERT … RETURNING` renvoie des colonnes ET écrit ; `date()`, `datetime()`, `time()`, `julianday()`, `unixepoch()` et `strftime('%Y')` **sans argument** lisent la date du jour (D033).
- `DELETE FROM commandes` échoue sur la clé étrangère (rien n'est écrit) ; pour tester une écriture réussie, viser `lignes_commande`.
- Aucun produit du seed ne coûte entre 100 et 200 € : `prix > 200` donne le même résultat que `prix > 100`.
- Réécrire le **même** `location.hash` ne déclenche pas `hashchange` : la page n'est pas reconstruite et la base vivante n'est pas réinitialisée (piège de scénario de test, pas un défaut).
- Chaque écran reconstruit le rail (`coquille`), d'où `Explorateur.majBouton()` ; l'explorateur n'est pas une route mais un voile : il ne détruit jamais l'éditeur.
- Les positions de `ecart.absentsAttendus` / `absentsObtenus` sont des indices dans les lignes d'origine ; `manquantes` et `enTrop` ne gardent que 3 exemples (`nbManquantes`, `nbEnTrop` donnent le total).
- `Node.replaceChildren(...)` et `Node.append(...)` ne sont **pas** comme `el()` : un argument `null` ou `undefined` passé tel quel devient la chaîne `"null"`/`"undefined"` affichée à l'écran, au lieu d'être ignoré. `el()` filtre ses enfants (c'est son rôle) ; un appel DOM direct avec un ternaire doit filtrer lui-même (`...(x ? [x] : [])`) avant de passer la liste.

**Vérifier dans un navigateur.** `node build.mjs` puis `node outils/cdp.cjs` (D041) : Chrome et Edge, instance neuve en headless, **profil temporaire isolé**, `file://`, scénario `outils/scenario.js` qui s'auto-contrôle, comptage des requêtes réseau (attendu : 1, le document) et des erreurs console, arbre de processus terminé et profil supprimé à la fin. **Ne jamais lancer l'exécutable d'un navigateur « pour voir » (`chrome.exe --version` compris)** : sous Windows cela ouvre une fenêtre dans la session déjà ouverte de l'utilisateur (c'est arrivé une fois, au lot 3). Le volet intégré de l'application refuse `file://` : pour y regarder la page, servir `requeter.html` seul par un petit serveur `node` sur `127.0.0.1`. Le scénario dépend des 4 exercices de démonstration : à adapter au lot 6.

**Contrôle par mutation.** Pour vérifier qu'un test protège vraiment : copier `src/`, `vendor/` et `verifier-comparateur.mjs` dans un dossier jetable, y casser une règle, relancer, constater des échecs. Attention aux mutations inopérantes (un mutant qui survit n'est pas forcément un trou).

**Intégration prévue au lot 4.** `carteVerdict` (app.js) sera fondue dans le `carteRetour` porté de Classe'R ; `Memoire` (brouillons, tentatives, indices) disparaîtra au profit du Store ; la navigation par `#/…` cédera au Routeur ; `CLAUSES` deviendra le lexique des clauses ; `LIBELLE_TYPE` et la page « Exercices » (liste de démonstration) seront remplacées par les vraies vues ; les 4 exercices `demo: true` seront jetés au lot 6. Le lot 4 branchera aussi les deux emplacements inertes de D042 (carte « Série recommandée », sélecteur de palier `disabled`) et décidera du sort de `competence` (provisoire depuis D042).

**Écarts par rapport au plan validé (à connaître).** (a) Les 4 exercices de démonstration sont : un `qcm` (COUNT), un `requete` (commandes par client, famille de formulations), un `corriger` **sur l'ordre** (`ORDER BY prix` sans `DESC`, avec ex æquo : c'est lui qui montre `ordonne: { cles }`), un `predire` (76) ; le plan avait mis l'ordre dans un `requete` et le piège `COUNT(*)` dans le `corriger`. (b) CSS : la section est la « 14 » (la « 13 » est l'explorateur du lot 2). (c) Titre du dernier indice SQL : « Une solution possible ». (d) D037 à D041 s'ajoutent aux D028 à D036 prévus. (e) Types mixtes : `String(Number(s)) === s` plutôt qu'une regex (D031).

**Mesures utiles (seed gelé, sql.js 1.14.2, SQLite 3.49.1).** Produit cartésien de 4 tables : 11,9 M lignes (`COUNT` 385 ms) ; de 5 tables : 83,5 M lignes, 2,7 s en un `step()`. `clients LEFT JOIN commandes` : 76 lignes (70 + 6 clients sans commande). Chiffre d'affaires produits au prix facturé 12 387,00, au prix actuel 12 445,00 (écart 0,47 %). Reconstruction de la base : 7 à 12 ms dans le navigateur. Mélange des QCM : voir D040 (`qcm-01…40` → [10, 11, 9, 10]).

---

## Vérifications du lot 4 (2026-10-07)

| Critère | Résultat |
|---|---|
| `node verifier-seed.mjs` | **71 critères satisfaits** (le critère GEL est intact : `src/seed.sql` n'a pas bougé) |
| `node verifier-comparateur.mjs` | **235 critères satisfaits**, inchangé depuis le lot 3 (aucune régression sur Moteur/Comparateur/types d'exercices malgré le remappage de `competence`, D043) |
| `node verifier-progression.mjs` (neuf, D047) | **37 critères satisfaits** : Store (persistance, migration/réconciliation, export↔import identique, refus d'un fichier invalide, réinitialisation), Progression (niveaux, maîtrise succès/échec dans les proportions exactes de Classe'R, plafond de perte à 15, consolidation à 3 réussites sans indice ≥ 80 %, une série cassée par un indice), décroissance d'oubli **sans horloge réelle** (D045 : `maintenant` en paramètre — aucune perte avant 7 jours, 1,2 point/jour ensuite, plancher à 50 % du brut, fonction pure), `pointsFaibles`, 20 certifications (déclenchement exact au seuil, idempotence, `assidu`, `polyvalent` qui exige les 9 compétences et non 8), Session (choix pondéré, filtrage par compétence, bilan avec série parfaite), Mission (étapes, refus/acceptation par Comparateur, étoiles selon les indices, XP, brouillon et reprise après abandon) |
| Contrôle par mutation (D038) | **6 mutants** du code (plafond de perte désactivé, gain de réussite doublé, décroissance d'oubli désactivée, consolidation dès 1 réussite, certification « polyvalent » assouplie à 5 compétences sur 9, horloge de la décroissance lue en dur au lieu du paramètre) : **6 tués**, dans une copie jetable de `src/`/`vendor/`/`verifier-progression.mjs`, source originale vérifiée intacte après (`git status` propre) |
| Navigateur (`node outils/cdp.cjs`, D041, profils temporaires isolés) | **Chrome 154.0.8037.93 et Edge 154.0.4258.62**, `file://`, headless : **51 vérifications chacune, toutes vertes** — onboarding (modale au premier démarrage, question factuelle, fermeture), route par défaut `#/accueil`, navigation sur les 7 routes du rail + `/fiche` (hors rail), Leçons/Missions/Fiche en état vide, 9 compétences et 20 certifications affichées, sélecteur de palier réellement actif (D047), Série recommandée (D042 branché), bilan de fin de série, certification « Premier pas » déclenchée pendant la série, thème basculé et persisté dans `localStorage`, export↔import identique, puis l'intégralité des vérifications du lot 3 (C1, refus différenciés, non-évalué, `date('now')`, C7, C8, C14, corriger, predire, qcm, masquage 1×1, bac à sable, hors ligne) inchangées ; badge XP et ligne de progression affichés sur une réussite comptée ; essai libre proposé après verrouillage d'un `predire` ; **1 seule requête réseau** (le document), **0 erreur console** |
| Contrôle visuel (volet intégré, `requeter.html` servi en local sur `127.0.0.1`, D041) | Écran d'accueil (bannière, niveau, cartes d'accès, « À retravailler »), Progression (9 compétences avec cellules, 20 certifications), Réglages en thème sombre, rail en barre basse à 375 px (7 entrées, aucun débordement) |
| Build | idempotent (même SHA-256 sur deux builds consécutifs) : 1 154 092 o, `22e6167f…` |
| Hygiène | `Reference/` non touchée ; D043 à D049 inscrites ; poids et SHA-256 reportés |
| Non vérifié | Firefox (Q3 close, D039) ; lecteur d'écran ; Mission et Parcours en situation réelle (aucun contenu n'existe encore — testés avec une définition synthétique sous Node et par la coquille d'écran en navigateur, pas par un vrai scénario à plusieurs étapes jusqu'au bout) ; export/import réel par téléchargement de fichier (testé directement via `Store.exporter()`/`Store.importer()`, pas par le clic utilisateur sur un fichier téléchargé, pour rester dans un scénario automatisable) |

### Repères techniques (lot 4)

**Ordre de chargement** (`template.html`, `build.mjs`) : `VENDOR_SQLJS`, `WASM_B64`/`SEED_SQL`, `CONTENU`, `MOTEUR`, `COMPARATEUR`, `EXERCICES`, `APP`, `STORE`, `PROGRESSION`, `ROUTEUR`. `APP` doit précéder `STORE` (déclare `CONFIG`) ; `ROUTEUR` ferme la liste et enregistre `DOMContentLoaded` (gardé par `typeof document`, pour rester chargeable sous Node comme les autres fichiers de `src/`, D038).

**Piège rencontré : deux évaluations indirectes séparées ne partagent pas leurs `const` de haut niveau.** `verifier-progression.mjs` charge tout en **un seul** appel `charger(fichiers, exports)` (une seule évaluation indirecte) : appeler `charger()` plusieurs fois avec des listes de fichiers qui se recouvrent (comme le fait `verifier-comparateur.mjs` pour `Comparateur` puis `Moteur`, sans conséquence car ce sont des modules sans état partagé entre les deux) aurait donné, pour `Store`, une instance différente à chaque appel : `Session`/`Mission` extraits d'un appel plus tardif référenceraient alors un `Store` distinct de celui que le script de test manipule, même après une affectation sur `globalThis`. Un seul chargement, un seul `Store`.

**DOM minimal sous Node.** `el()` (app.js) vérifie `c instanceof Node` pour ses enfants : sous Node, `Node` n'existe pas globalement et l'opérateur lève une exception si on ne le définit pas (`globalThis.Node = function Node(){}`, un simple stub). Un faux `document.createElement` qui accepte `className`/`setAttribute`/`append`/`replaceChildren`/`dataset`/`classList`/`remove`/`focus`/`click`/`scrollIntoView` (tous en no-op) suffit à faire tourner Session/Mission/`ligneProgres`/`carteRetour` sous Node sans planter, sans qu'il soit nécessaire de vérifier la forme du DOM produit (ce n'est pas ce que ces critères testent).

**`Store.exporter()` sous Node.** `URL.createObjectURL` n'existe pas sous Node (contrairement à `Blob`, disponible depuis Node 18) : `exporter()` vérifie désormais aussi `typeof URL.createObjectURL === "function"` avant de déclencher un téléchargement, en plus de `document`/`Blob` — sans quoi l'export plantait sous Node bien que `document` et `Blob` existent tous les deux.

**Piège rencontré : le pied de `ecranSerie` était figé au premier rendu.** La première version calculait le bouton « Question suivante » une seule fois, à la construction de l'écran, avant toute réponse (`s.dernier` valait alors `null`) : répondre ne le faisait jamais apparaître, la série restait bloquée sur la première question. Corrigé comme `pageExercice`/`majPied` au lot 3 : une fonction `majSuite()` recalculée à chaque retour (`afficherRetour`), pas un calcul figé à l'ouverture.

**Piège rencontré : cliquer une option de QCM par position plutôt que par texte.** Le scénario de test cliquait `.choix button` à l'indice `ex.reponse` — mais cet indice désigne la position de la bonne réponse **dans `ex.options`** (avant mélange), pas sa position affichée après `ordreAffichage` (D040). Comme pour la bonne réponse du lot 3, retrouver le bouton par le **texte** de l'option (`ex.options[ex.reponse]`), jamais par sa position dans le DOM.

**`Store.exporter()`/`dernierExport` et une comparaison d'identité.** `exporter()` horodate `etat.dernierExport` **avant** de sérialiser : un « avant » capturé avant l'appel à `exporter()` ne contient pas encore cet horodatage, et une comparaison stricte avec l'« après » (post-import) échoue à tort. Capturer l'« avant » **après** `exporter()` (ou retirer `dernierExport` des deux côtés) pour comparer un export↔import à l'identique.

**Compétences et certifications : identifiants à retenir.** 9 compétences : `lire-filtrer`, `valeurs-manquantes`, `agreger`, `joindre`, `dates`, `sous-requetes`, `classer-cumuler`, `vocabulaire-metier`, `nettoyer-donnees` (D043). 20 certifications, voir D044 pour la liste complète des identifiants et conditions.

**Intégration prévue au lot 5 (Autotest) et au-delà.** Rien de spécifique à ce lot n'a été identifié au-delà de ce que D029/D030/D036 demandaient déjà. **Au lot du palier 5** (D027) : le second jeu de données alimentera aussi `nettoyer-donnees`, la seule compétence sans exercice pour l'instant. **Au lot où le contenu Mission arrive** : remplacer la définition de test de `verifier-progression.mjs` par de vraies missions dans `CONTENU.missions`, et écrire un scénario `outils/scenario.js` qui joue une mission jusqu'au bout dans le navigateur (non fait au lot 4, faute de contenu réel à jouer).

---

## Vérifications du lot 6 (2026-10-08)

Premier lot de contenu réel : chapitre 0 (6 QCM) et palier 1 complet (28 exercices, 8 chapitres), `PALIERS[0].termine` laissé à `false` (c'est à l'utilisateur de le basculer, après avoir fait le palier lui-même — D025 en donne le précédent). Les 4 exercices `demo: true` du lot 3 sont retirés de `src/contenu.js`.

| Critère | Résultat |
|---|---|
| `node verifier-seed.mjs` | **71 critères satisfaits**, seed intact (le lot ne touche jamais au seed gelé, D025) |
| `node verifier-autotest.mjs` (D051) | **Tout est vert** : 34 exercices et 9 chapitres sans échec ; déterminisme, non-écriture, résultat non trivial, coupe de `LIMIT` sans ex æquo ambigu (D029), `depart` refusé pour chaque `corriger`, aucune tentative sciemment fausse acceptée d'avance. Distribution des 14 QCM à 4 options : rééquilibrée après un premier échec (position D à 50 %, deux QCM de `ch-00` réordonnés pour retomber à 35,7 %, sous le plafond de 45 %, D040). Couverture : `lire-filtrer` largement au-dessus du minimum (34 exercices pour 6 exigés), P3 et P8 chacun cité (effleurés, comme le brief l'autorisait) ; 17 avertissements de couverture, tous attendus (palier non `termine`, 8 compétences encore sans contenu) |
| `node verifier-comparateur.mjs` | **235 critères satisfaits** — section « exercices de démonstration » réécrite sur quatre fixtures locales au fichier de test (`FIXTURE_QCM`/`REQUETE`/`CORRIGER`/`PREDIRE`, copie exacte des anciens `demo-*`), découplées de `src/contenu.js` (D038/D051 : les tests du moteur ne dépendent plus jamais du contenu pédagogique) |
| `node verifier-progression.mjs` | **37 critères satisfaits**, inchangé (le câblage de `Parcours`, D054, n'affecte aucun des critères existants) |
| `node build.mjs` | sans erreur, relancé deux fois, même SHA-256 ; 1 220 032 o (poids en tête de ce journal) |
| Navigateur (`node outils/cdp.cjs tous`, D041, profils temporaires isolés) | **Chrome 154.0.8037.93 et Edge 154.0.4258.62**, `file://`, headless : **57 vérifications chacune, toutes vertes**. Reprend l'intégralité du scénario du lot 4 (onboarding, routes, Session, thème, export/import, C1, refus différenciés, non-évalué, `date('now')`, C7, C8, C14, `corriger`/`predire`/`qcm`, masquage 1×1, bac à sable, hors ligne), adaptée à `p1-01` (requete), `p1-17` (corriger), `p1-15` (predire) et `p1-02` (qcm) à la place des `demo-*` disparus. **Nouveau** : un parcours complet du chapitre 0 (leçon lue, exemple testé pour de vrai — 7 catégories affichées —, 6 QCM répondus, bilan « 6 bonne(s) réponse(s) sur 6 »), puis du premier chapitre du palier 1 (3 exercices, bilan « 3 bonne(s) réponse(s) sur 3 »), retour au sommaire avec les deux chapitres marqués terminés ; **1 seule requête réseau** (le document), **0 erreur console** |
| `outils/scenario.js` (D041) | adapté : les 4 identifiants `demo-*` codés en dur remplacés par `p1-01`/`p1-17`/`p1-02`/`p1-15` ; deux scènes de refus redéfinies pour `p1-01` (`prix + 1` → « 30 lignes diffèrent » ; `WHERE prix > 10` → « 4 lignes manquantes ») ; C7 passé d'un `DELETE` (qui aurait violé une clé étrangère sur `produits`) à `UPDATE produits SET prix = 1` |
| Hygiène | `Reference/` non touchée ; D053/D054 inscrites ; poids et SHA-256 reportés ; plus aucune occurrence de `demo-qcm`/`demo-requete`/`demo-corriger`/`demo-predire` hors de ce journal |

**Défauts trouvés et corrigés pendant la vérification navigateur.** (1) la boucle de navigation générique du scénario comparait `document.body.innerText` à un texte attendu de casse normale (« Parcours guidé »), alors que `.entete__sur` est mis en capitales par CSS et que `innerText` (contrairement à `textContent`) reflète cette transformation : comparaison passée en insensible à la casse ; (2) même cause sur les deux attentes « Chapitre terminé » (ajout du drapeau `i`) ; (3) `DELETE FROM produits` échouait silencieusement (`FOREIGN KEY constraint failed`, `lignes_commande` y référant) puis `UPDATE produits SET prix = 0` échouait aussi (`CHECK (prix > 0)`) : la scène C7 retenue est `UPDATE produits SET prix = 1`.

**Repères de contenu à retenir.** Chapitre 0 : `ch-00`, 6 QCM (`ch0-01`…`ch0-06`), aucune ligne de SQL à écrire — seul l'exemple de la leçon (`SELECT nom FROM categories;`) s'exécute, comme illustration montrée et non comme exercice (résout la tension apparente entre le brief et D050, voir D053). Palier 1 : 8 chapitres (`ch-p1-1`…`ch-p1-8`), 28 exercices (`p1-01`…`p1-28`), tous `competence: "lire-filtrer"`. `CLAUSES` passe de 5 à 14 entrées (`SELECT`, `FROM`, `IN`, `BETWEEN`, `LIKE`, `IS NULL`, `LIMIT`, `DISTINCT`, `AS` ajoutées). Les trois erreurs de `corriger` suggérées par le brief (point-virgule oublié, chaîne non guillemetée, `SELEC`) ne respectent pas la règle D051 (`depart` doit s'exécuter sans erreur) : remplacées par des erreurs silencieuses (ordre des colonnes, `DESC` manquant, `<>` qui exclut les NULL, filtre `WHERE` oublié avant un `LIMIT`) ; la faute de syntaxe `SELEC` reste enseignée, mais comme QCM (`p1-02`), conformément à l'arbitrage de l'utilisateur.

### Corrections demandées par l'utilisateur après avoir fait les 9 leçons (D055)

| Critère | Résultat |
|---|---|
| `node verifier-seed.mjs` / `verifier-comparateur.mjs` / `verifier-progression.mjs` | inchangés, **71 / 235 / 37 critères satisfaits** : aucune des huit corrections ne touche au seed, au comparateur ni à Store/Progression |
| `node verifier-autotest.mjs` | **Tout est vert**, inchangé (le point-virgule ajouté à la leçon `ch-p1-1` ne change rien à son `exemple.code`, toujours exécuté sans erreur) |
| `node build.mjs` | sans erreur ; 1 229 324 o, `da024f30…` (poids en tête de ce journal) |
| Navigateur (`node outils/cdp.cjs tous`, D041) | **Chrome 154.0.8037.93 et Edge 154.0.4258.62 : 71 vérifications chacune, toutes vertes**, 1 seule requête réseau, 0 erreur console. Quatorze nouvelles vérifications : le « null » ne s'affiche plus avant « Quitter le chapitre » ; l'explorateur affiche l'aperçu à 5 lignes par défaut sur `clients`, bascule sur les 40 lignes puis revient à 5 ; le Lexique s'ouvre (vocabulaire et clauses visibles), sa recherche filtre les deux groupes (« limit » isole la clause LIMIT, « doublon » le terme de vocabulaire), se ferme par Échap ; la liste `#/exercices` est groupée par chapitre et ses cartes n'affichent plus l'énoncé complet ; sur un exercice `requete` neuf (`p1-05`), aucun bouton de révélation après une 1ʳᵉ tentative ratée, le bouton apparaît après la 2ᵉ, et le cliquer révèle la solution dans le panneau d'indices puis fait disparaître le bouton |
| Hygiène | `Reference/` non touchée ; D055 inscrite ; poids et SHA-256 reportés (deux lignes : avant/après ces corrections, comme au lot 3) |

**Défauts trouvés et corrigés pendant l'écriture de ces vérifications (tous dans `outils/scenario.js`, hors livrable — aucun dans le code applicatif).** (1) Le compte de lignes de l'aperçu de l'explorateur comptait aussi les lignes du tableau des colonnes (`.schema-colonnes`, lui-même dans un `.resultat`) : sélecteur restreint à `.schema-detail .resultat table:not(.schema-colonnes)`. (2) Le Lexique met son contenu en capitales par CSS (`.lexique__groupe{text-transform:uppercase}`, même motif que `.entete__sur` déjà rencontré) : vérifications passées en insensibles à la casse. (3) La liste « Tous les exercices » réaffichait encore le bilan de la série libre jouée plus haut dans le scénario (`Session.courante` jamais explicitement quitté par le bouton « Retour à l'accueil », qui ne fait que naviguer) : ajout d'un `Session.quitter()` avant d'aller vérifier `#/exercices`. (4) Sur Edge, un clic sur le bouton de révélation sans garde (`bouton(...).click()`) a fait planter le scénario une fois quand le re-rendu n'était pas encore là : passé en `bouton(...)?.click()`, défensif comme le reste du fichier.
