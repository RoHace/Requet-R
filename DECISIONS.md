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
| 2 | 1 011 332 | 987,6 | `cda275c6e68f0c921513e17284ff6243ff07f0bfde89a7df8c64637c57507145` |
| 3 | 1 092 307 | 1066,7 | `38cf18340c9496aceeb932908121ceb89e08ab95f689217592c4d88421388829` |

Répartition au lot 1 : WASM en base64 ≈ 877 880 o (90 %), sql.js 46 535 o, CSS ≈ 37 Ko, app ≈ 11 Ko.
Répartition au lot 2 (sources, en octets UTF-8) : `app.js` 28 558, `template.html` 42 639 (CSS comprise), `seed.sql` 13 261, `contenu.js` 2 244. Écart avec le lot 1 : + 34 782 o. Le poids n'est plus un critère de lot (voir D024) ; il reste consigné.
*(Première livraison du lot 2 : 1 010 876 o, `e13f0af9…` ; la ligne ci-dessus est celle d'après D027, qui ajoute le paramètre `seed` de `nouvelleBase()`.)*
Répartition au lot 3 (sources, en octets UTF-8) : `app.js` 41 960, `template.html` 45 838 (CSS comprise), `comparateur.js` 34 254, `exercices.js` 14 478, `contenu.js` 10 094, `moteur.js` 7 830, `seed.sql` 13 261. Écart avec le lot 2 : + 80 783 o. Rien ne dépasse ce que D024 tolère.
*(Première livraison du lot 3, avant les corrections de la vérification utilisateur : 1 088 580 o, `9f3caea0…`, `app.js` 39 486, `contenu.js` 8 960 ; la ligne ci-dessus est celle d'après les quatre corrections ci-dessous.)*

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
