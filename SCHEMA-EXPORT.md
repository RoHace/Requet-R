# Requêt'R — le second jeu de données : « l'export brut »

Document de référence du palier 5 : c'est ici qu'on lit **quelle ligne porte quelle anomalie** avant d'écrire un exercice de nettoyage.
Les données sont dans `src/seed-sale.sql` ; `node verifier-seed-sale.mjs` rejoue tous les contrôles ci-dessous (55 critères).
Ce jeu est **séparé du seed principal** (DECISIONS.md D027) et ne le remplace jamais : il se charge à sa place, le temps d'un exercice, par `nouvelleBase(SEED_SALE_SQL)`.

> **Le document du seed principal est `SCHEMA.md`.** Son §11 dit, et continue de dire, qu'il ne contient **aucune donnée sale** : les deux documents ne se mélangent pas, et c'est cette séparation qui fait toute la valeur de D027. Le vérificateur du seed principal reste sans aucune exception ; celui-ci est son inverse.

## 1. Vue d'ensemble

Quatre fichiers plats sortis d'un ancien système, **68 lignes** (20 + 18 + 14 + 16), 8,1 Ko. Même univers que la boutique de `SCHEMA.md`, vue par un autre logiciel : l'apprenant n'a pas un métier de plus à apprendre au moment où il apprend à nettoyer.

Toutes les tables portent le préfixe `export_` : dans les onglets de l'explorateur de schéma, on voit immédiatement qu'on n'est pas dans la base propre, et aucune consigne ne peut être ambiguë sur la table visée.

**Volume volontairement petit** : aucun fichier ne dépasse 20 lignes. L'explorateur affiche « Voir les N lignes » ; l'apprenant inspecte un fichier **entier** à l'œil et peut donc vérifier lui-même ce qu'une requête lui répond — ce qui rend légitimes des exercices `predire` qui seraient de la devinette sur les 289 lignes du seed principal.

Toutes les données sont **fictives** (adresses en `@exemple.test`, domaine réservé). Identifiants en ASCII (D017), constantes littérales uniquement (D001) : aucune fonction d'horloge, aucun tirage aléatoire.

## 2. Aucune contrainte, et c'est la première leçon

| Ce qu'un export brut n'a pas | Vérifié par |
|---|---|
| aucune clé primaire | `pk = 0` sur les 24 colonnes |
| aucune clé étrangère | `PRAGMA foreign_key_list` vide sur les 4 tables |
| aucun `NOT NULL`, aucun `CHECK` | `notnull = 0` partout ; le DDL ne contient aucun de ces mots |
| **toutes les colonnes en `TEXT`** | les 24 colonnes sont déclarées `TEXT` |
| `PRAGMA foreign_keys` à **0** | le fichier ne l'active pas, contrairement au seed principal (D019) |

Conséquence visible par l'apprenant, et symétrique du critère C3e du seed principal : **insérer une ligne incohérente est accepté** ici, alors qu'elle est refusée là-bas. L'absence de contrainte est exactement ce qui a laissé entrer tout ce qui suit.

L'explorateur de schéma affiche donc « aucune clé primaire » sur chaque table et « Aucune clé étrangère : ces tables ne sont pas reliées entre elles » à la place de la carte des relations. C'est voulu : les quatre fichiers ne savent rien les uns des autres.

## 3. Les quatre fichiers

### `export_clients` — 20 lignes
| Colonne | Ce qu'on y trouve vraiment |
|---|---|
| `id` | du texte ; **non unique** (`204` deux fois) ; l'un porte un espace de tête (`' 208'`) |
| `nom_complet` | prénom et nom dans **une seule** colonne, casse libre (`Camille DURAND`, `nolan martin`), un entouré d'espaces |
| `email` | deux doublons à la casse près ; un vaut `'N/A'` |
| `ville` | 6 villes réelles écrites de **17** façons, plus les 4 manières de ne rien dire |
| `date_inscription` | 4 formats (`2024-03-12`, `12/04/2024`, `2024/06/18`, `14 mars 2025`), une date impossible, un texte libre |
| `points_fidelite` | des nombres en texte : `'1 200'`, `'-50'`, `''`, `'N/A'`, `'--'` |

### `export_commandes_2025` — 18 lignes · `export_commandes_2026` — 14 lignes
Mêmes colonnes (`id`, `client_id`, `date_commande`, `date_livraison`, `montant`, `statut`) : l'export a été **découpé par période**, et les deux fichiers **se recouvrent** à la frontière d'année (les commandes `5017` et `5018` sont dans les deux). C'est ce qui rend `UNION` nécessaire pour de vrai.

Identifiants `5001` à `5030`, **disjoints** de toutes les plages du seed principal (D013) : une confusion entre les deux jeux donne un résultat vide, donc détectable.

### `export_livraisons` — 16 lignes
`id` (`L-001` à `L-016`), `commande_id`, `transporteur`, `date_expedition`, `date_reception`, `poids_kg`. Le fichier du transporteur, produit par un troisième système : ses `commande_id` ne retombent pas tous sur une commande, et la livraison de la commande `5019` y figure deux fois.

## 4. Recensement des anomalies voulues

Chaque anomalie est **réellement présente** : `verifier-seed-sale.mjs` rejoue la requête de contrôle. Une anomalie qui disparaîtrait par mégarde rendrait des exercices **insolubles**, et aucune relecture humaine ne le verrait — d'où ce vérificateur, qui est l'inverse de celui du seed principal.

Dans les contrôles ci-dessous, **`COMMANDES`** désigne les deux fichiers empilés (`export_commandes_2025 UNION ALL export_commandes_2026`), c'est-à-dire 32 lignes.

| # | Anomalie | Portée par | Contrôle → résultat | Enseigne |
|---|---|---|---|---|
| **A1** | Aucune contrainte (§2) | les 4 tables | 24 colonnes `TEXT`, 0 `NOT NULL`, 0 clé primaire, 0 clé étrangère, `foreign_keys` = 0, une ligne incohérente **acceptée** | pourquoi les saletés sont entrées |
| **A2** | La même entité deux fois, à des différences mineures près | client `204` (deux e-mails, deux formats de date) ; livraisons `L-011` et `L-012` pour la commande `5019` | `GROUP BY id HAVING COUNT(*) > 1` → `204` ; idem sur `commande_id` → `5019` | un doublon ne se voit pas sur une clé : il n'y en a pas |
| **A3** | La même personne sous deux identifiants | `205` et `206` (Hugo Robert) | `GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1` → **2** e-mails (`hugo.robert`, `lise.petit`) | dédoublonner sur une valeur métier normalisée |
| **A4** | Casse incohérente | `ville`, `statut`, `transporteur` | villes distinctes **17** → **9** après `UPPER(TRIM(…))` ; statuts **11** → **7** ; transporteurs **6** → **3** | normaliser avant de regrouper |
| **A5** | Espaces parasites | `' lyon '`, `'Lyon '`, `' Paris'`, `'MARSEILLE '`, `'Nantes '` ; `' 208'` ; `' Ines BERNARD '` ; `'COLISSIMO '` ; `'livree '` | `ville <> TRIM(ville)` → **5** ; `id <> TRIM(id)` → `' 208'` | un espace invisible fait un groupe de plus, et rate une jointure |
| **A6** | Dates en plusieurs formats | `12/04/2024`, `2024/06/18`, `14 mars 2025`, `inconnue` ; `11/03/2026` côté commandes | `date(date_inscription) IS NULL` → **5** sur 20 ; `date(date_commande) IS NULL` → 1 | un format non ISO n'est pas une date pour SQLite |
| **A7** | Date impossible | `31/02/2025` (client `211`) | la réparation par `substr` donne `2025-02-31`, que `date()` décale **silencieusement** au **`2025-03-03`** | une date réparée n'est pas une date valide |
| **A8** | Nombres stockés en texte | `points_fidelite`, `montant` (`'149,50'`, `'1 250'`, `'1,20'`), `poids_kg` (`'1,2'`, `'6,0'`) | points : `SUM` brut **735** contre **1934** réparé ; montants : **5042** contre **6291,7** ; `'1 200'+0` → **1**, `'149,50'+0` → **149**, `'N/A'+0` → **0** | la coercition silencieuse ; `CAST`, `REPLACE` |
| **A9** | Trier du texte n'est pas trier des nombres | `points_fidelite` | premier en tri de texte : client `205` (`'N/A'`) ; en tri de nombre : `203` (`'1 200'`) ; `'9' > '100'` vaut **1** | pourquoi `9` passe avant `100` |
| **A10** | Quatre façons d'exprimer « rien » | `NULL`, `''`, `'N/A'`, `'--'` sur `ville`, `email`, `montant`, `date_livraison` | ville : 1 + 1 + 1 + 1 ; `WHERE ville IS NOT NULL` laisse passer **19** lignes sur 20, et il en reste **16** une fois les quatre formes écartées | `IS NOT NULL` ne suffit jamais sur un export |
| **A11** | Livraison antérieure à la commande | commandes `5009`, `5025` ; livraisons `L-006`, `L-015` | `date_livraison < date_commande` → **2** ; `date_reception < date_expedition` → **2** | un contrôle de cohérence porte sur deux colonnes à la fois |
| **A12** | Valeur négative | commande `5010` (`-30.00`), client `208` (`-50`), livraison `L-013` (`-1.0`) | une ligne chacun | une valeur aberrante qu'aucun `CHECK` n'a bloquée |
| **A13** | Clé étrangère dans le vide | `client_id` `'999'` (`5003`), `''` (`5013`), `'888'` (`5024`) ; `commande_id` `'7777'` (`L-014`), `''` (`L-016`) | jointure **brute** → **5** commandes perdues, jointure sur `TRIM(…)` → **3** réellement orphelines ; les 2 autres sont celles du client `' 208'` | une jointure perd des lignes sans rien dire, et une clé sale en perd davantage |
| **A14** | Statut hors liste | `'en cours'` (`5008`), `''` (`5016`) | `LOWER(TRIM(statut)) NOT IN` les 5 statuts attendus → **2** | aucune valeur énumérée n'est garantie sans `CHECK` |
| **A15** | Les deux fichiers se recouvrent | `5017` **identique à l'octet près** dans les deux ; `5018` ne diffère que par un espace final sur le statut | `UNION ALL` → **32** · `UNION` → **31** · identifiants distincts → **30** ; le statut nettoyé, `UNION` → **30** | `UNION` ne dédoublonne que les lignes **identiques** : on normalise *avant* d'empiler |

**A15 est l'anomalie la plus instructive du jeu** : `UNION` retire la ligne strictement identique et garde celle qui diffère d'un espace. Les trois nombres (32, 31, 30) se déduisent l'un de l'autre, ce qui en fait une matière d'exercice `predire` légitime (D065).

## 5. Valeurs de référence

Imprimées par `node verifier-seed-sale.mjs` à chaque exécution, à reporter ici en cas d'évolution.

- Lignes : **68** (20 + 18 + 14 + 16) · poids **8 137 o**
- Villes réelles après `UPPER(TRIM(…))`, non-valeurs écartées : **LYON 5 · MARSEILLE 3 · PARIS 3 · BORDEAUX 2 · LILLE 2 · NANTES 1** (16 lignes sur 20)
- Villes distinctes : **17** brutes → **9** normalisées (6 villes + `''` + `'N/A'` + `'--'` ; `NULL` n'est pas compté par `COUNT(DISTINCT)`)
- Points de fidélité : somme brute **735**, somme réparée **1934**
- Montants (32 lignes) : somme brute **5042**, somme réparée **6291,7**
- Commandes empilées : `UNION ALL` **32** · `UNION` **31** · identifiants distincts **30**
- Dates d'inscription illisibles par `date()` : **5** sur 20
- Statuts distincts : **11** bruts → **7** normalisés

## 6. Ce que ce jeu ne permet pas d'enseigner

- **Les pièges P1 à P11 de `SCHEMA.md`** : ils appartiennent au seed principal. Un exercice sur l'export brut déclare des `anomalies`, jamais des `pieges` — l'Autotest le refuse dans les deux sens.
- **Les relations** : aucune clé étrangère n'est déclarée, donc aucune carte de relations à lire. Les jointures de ce jeu se font sur des clés **nettoyées** (`TRIM`), ce qui est précisément la leçon.
- **Les montants exacts** : les sommes de ce jeu ne sont pas des multiples de 0,25 (le seed principal, lui, le garantit, D016). Les totaux du jeu sale servent à **comparer** une somme brute à une somme réparée, jamais à être le résultat d'un calcul de chiffre d'affaires.
- **Le vocabulaire métier** : les définitions du §7 de `SCHEMA.md` (chiffre d'affaires produits, quantité vendue…) ne s'appliquent pas ici. La compétence `vocabulaire-metier` travaille sur le seed principal, `nettoyer-donnees` sur ce jeu.

## 7. Modifier ce jeu

Il est **gelé** à la validation du lot 10 (D068), par la même mécanique que le seed principal (D025) : la constante `GEL_SHA256` de `verifier-seed-sale.mjs` contient son empreinte SHA-256, et toute modification fait échouer le vérificateur. 38 exercices du palier 5 dépendent de ses valeurs exactes.

Toute évolution : une nouvelle décision dans `DECISIONS.md`, la modification de `src/seed-sale.sql`, `node verifier-seed-sale.mjs` au vert, la mise à jour de ce document (valeurs de référence, recensement), puis le rejeu de l'Autotest sur tous les exercices existants.
