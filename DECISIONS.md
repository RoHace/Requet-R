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

Répartition au lot 1 : WASM en base64 ≈ 877 880 o (90 %), sql.js 46 535 o, CSS ≈ 37 Ko, app ≈ 11 Ko.
Répartition au lot 2 (sources, en octets UTF-8) : `app.js` 28 558, `template.html` 42 639 (CSS comprise), `seed.sql` 13 261, `contenu.js` 2 244. Écart avec le lot 1 : + 34 782 o. Le poids n'est plus un critère de lot (voir D024) ; il reste consigné.
*(Première livraison du lot 2 : 1 010 876 o, `e13f0af9…` ; la ligne ci-dessus est celle d'après D027, qui ajoute le paramètre `seed` de `nouvelleBase()`.)*

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

---

## Questions ouvertes

- **Q1 — Comparateur de résultats (à trancher au LOT 3, pas avant).** Décision structurante : comment comparer le jeu de résultats d'un élève à celui de la solution ? Points à décider : `NULL`, `1` contre `1.0`, tolérance sur les flottants, noms d'alias de colonnes, casse du texte, ordre des colonnes, ligne ordonnée ou non selon l'exercice.
- **Q2 — Entiers au-delà de 2^53.** sql.js rend les entiers SQLite en nombres JavaScript : `9007199254740993` revient `9007199254740992`. Sans effet sur le contenu prévu, à garder en tête pour le comparateur.
- **Q3 — Firefox.** Le chargement WASM par `wasmBinary` n'a pas été vérifié sur Firefox (non installé). ~~À contrôler à la main avant la fin du lot 2.~~ **Mise à jour (lot 2) : reportée au lot 3, non bloquante.** Chrome et Edge suffisent à valider `file://` + WASM embarqué. Contrôle manuel à prévoir : ouvrir `requeter.html` dans Firefox, vérifier que `SELECT count(*) FROM clients;` renvoie 40 et que le panneau « Schéma » s'ouvre.
- **Q4 — Données sales (palier 5). RÉSOLUE : option (b), voir D027.** Le programme du palier 5 (D021) annonce « données sales » et « contrôles de cohérence » ; le seed principal est propre par construction (aucun doublon, aucune casse ou espace incohérent, aucune violation d'invariant) et l'Autotest du lot 5 rejette une requête de référence qui renvoie 0 ligne. Les trois options étaient : (a) anomalies délibérées dans le seed principal avec une liste d'« anomalies connues » ; **(b) un jeu de données sales distinct réservé au palier 5 — retenue** ; (c) renoncer. Le seed principal reste intact et gelé (D025) ; le jeu sale naîtra au lot du palier 5.

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
