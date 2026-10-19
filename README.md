# Requêt'R

Requêt'R apprend le SQL en le pratiquant : on écrit des requêtes contre une vraie base de
données, et chaque réponse est vérifiée en exécutant la requête. Le parcours va du niveau zéro —
comprendre ce qu'est une table — au niveau attendu d'un data analyst junior, entièrement en
français.

## Essayer

Ouvrir `requeter.html` dans un navigateur. C'est tout.

Un seul fichier, aucune installation, aucun compte, aucune requête réseau : la base de données
tourne dans la page. Le fichier n'est pas versionné (voir « Développer ») ; pour l'obtenir :

```bash
node build.mjs
```

Navigateurs vérifiés : Chrome et Edge récents, à chaque lot. Firefox et Safari ne sont pas testés
— rien ne devrait s'y opposer, mais ce n'est pas vérifié, donc ce n'est pas promis.

## Ce qu'il y a dedans

- **5 paliers** — Lire, Agréger, Croiser, Raisonner, Métier.
- **61 chapitres**, chacun une leçon courte, un exemple exécutable, puis les exercices qui
  l'appliquent.
- **194 exercices** de quatre sortes : écrire une requête (73), corriger une requête fautive (41),
  prédire ce qu'une requête va renvoyer (36), et des questions à choix multiple (44).
- **4 missions transversales**, 20 étapes : une situation d'entreprise, une suite de requêtes, et
  une question métier qui n'est pas tranchée d'avance.
- **9 compétences** suivies séparément, avec décroissance d'oubli, et 20 certifications qui se
  déclenchent sur des preuves — jamais sur du temps passé.
- **Deux jeux de données**. Une boutique en ligne de 5 tables et 289 lignes, propre et contrainte,
  qui porte onze pièges pédagogiques choisis (`NULL` dans les agrégats, `LEFT JOIN` contre `INNER`,
  ex æquo dans un classement, gonflement d'un `SUM` après jointure…). Et un export brut jamais
  nettoyé, sans la moindre contrainte, qui porte quinze anomalies voulues : un statut écrit de
  onze façons pour sept valeurs réelles, des nombres stockés en texte, une date impossible, deux
  fichiers annuels qui se recouvrent.

Les deux jeux sont documentés table par table et piège par piège dans `SCHEMA.md` et
`SCHEMA-EXPORT.md`.

## Comment ça marche

**SQLite, pour de vrai.** La page embarque SQLite 3.49.1, compilé en WebAssembly
(sql.js 1.14.2), encodé en base64 dans le fichier. Il n'y a pas de simulation ni de serveur : les
requêtes de l'apprenant sont exécutées par SQLite, et les messages d'erreur affichés sont ceux de
SQLite, tels quels. C'est aussi ce qui permet le mode hors ligne complet — rien n'est téléchargé,
y compris le moteur.

**Le comparateur juge le résultat, jamais le texte.** C'est le parti pris central du projet. Une
réponse est acceptée si elle renvoie le même résultat que la solution de référence, quelle que
soit la façon dont elle est écrite : `BETWEEN` ou deux comparaisons, `NOT IN` ou deux `<>`, une
sous-requête ou une CTE, `RANK()` ou `DENSE_RANK()` quand les deux donnent la même chose. Aucune
analyse du texte de la requête, donc aucune façon correcte d'arriver au résultat n'est refusée.

Les règles de comparaison sont explicites et par défaut permissives :

- les lignes sont comparées en multi-ensemble — l'ordre est ignoré sauf si l'exercice exige un
  tri, et il peut alors n'exiger l'ordre que sur les colonnes triées, en laissant les ex æquo
  libres entre eux ;
- les **noms** de colonnes sont ignorés (`AS total` pour `AS chiffre_affaires` est juste sur le
  fond) ; leur **ordre** compte, parce que la consigne les énumère ;
- les nombres sont comparés avec une tolérance, `NULL` est distingué de `0` et de la chaîne vide.

Quand une réponse est refusée, le retour énonce un **constat** — un fait sur l'écart, « 4 lignes
de trop », « un `NULL` est en jeu » — et jamais une hypothèse sur ce que l'apprenant a cru. Un
résultat attendu d'une seule cellule n'est pas affiché : ce serait donner la réponse.

Une exception assumée à « on ne lit jamais le texte » : une requête contenant `date('now')` est
refusée avec un message dédié, parce qu'un résultat qui dépend de l'horloge ne serait pas
reproductible. La base a une date de référence fixe, le 30 juin 2026.

## Développer

Les sources vivent dans `src/`, un fichier par rôle, et `node build.mjs` les assemble avec le
WebAssembly de `vendor/` en un `requeter.html` autonome de 1,7 Mo. Le build est idempotent : ni
date ni horodatage, la même entrée donne exactement le même fichier, et il en affiche la taille et
l'empreinte SHA-256.

`requeter.html` **n'est pas versionné** : c'est un artefact reconstructible depuis n'importe quel
commit, qui changerait à chaque build.

```
src/template.html     la page et toute la feuille de style
src/app.js            rendu, éditeur SQL, explorateur de schéma, lexique
src/moteur.js         SQLite : exécution, plafonds de lecture, bases jetables
src/comparateur.js    la comparaison de résultats et ses diagnostics
src/exercices.js      les types d'exercice et leur validation
src/routeur.js        routes, écrans, séries, chapitres, missions
src/store.js          persistance dans le navigateur
src/progression.js    XP, niveaux, maîtrise, décroissance d'oubli, certifications
src/contenu.js        tout le contenu : exercices, chapitres, missions, lexique
src/seed.sql          la boutique (gelée)
src/seed-sale.sql     l'export brut (gelé)
```

### Vérifier

Cinq vérificateurs en Node, sans aucune dépendance, qui chargent les vrais fichiers de `src/`
plutôt que des copies :

```bash
node verifier-seed.mjs          # les 289 lignes de la boutique et ses onze pièges sont bien là
node verifier-seed-sale.mjs     # l'inverse : les quinze anomalies de l'export sont bien là
node verifier-comparateur.mjs   # le comparateur, cas par cas : ce qu'il accepte et ce qu'il refuse
node verifier-progression.mjs   # persistance, XP, maîtrise, séries, missions
node verifier-autotest.mjs      # rejoue tout le CONTENU contre les bases
```

Le dernier est le garde-fou du contenu. Il rejoue chaque exercice, chaque étape de mission et
chaque chapitre : la solution s'exécute sans erreur, ne renvoie pas zéro ligne par accident, est
déterministe, et une tentative sciemment fausse est refusée **avant** que la solution annoncée ne
soit vérifiée — rien n'est validé d'avance. Il contrôle aussi la couverture : au moins six
exercices par compétence, chaque piège et chaque anomalie cités par au moins un exercice, aucun
exercice inaccessible depuis le parcours.

Il dit aussi, en pied de rapport, ce qu'il ne sait **pas** juger : la clarté d'un énoncé,
l'ambiguïté d'une consigne, le dosage de la difficulté. Aucune heuristique n'y est tentée, et
cette relecture reste humaine.

Enfin, un scénario navigateur pilote l'application pour de vrai, sur Chrome puis Edge, en profil
temporaire isolé — 126 vérifications, dont le compte des requêtes réseau :

```bash
node outils/cdp.cjs
```

Les deux seeds sont gelés par empreinte : les modifier fait échouer leur vérificateur, exprès.
Des centaines d'exercices en dépendent.

## DECISIONS.md

Toute décision de conception est consignée dans `DECISIONS.md`, numérotée `D001` à `D069`, avec
son contexte, ce qui a été tranché et les conséquences. **Une décision n'est jamais réécrite** :
si elle change, une nouvelle décision la remplace et l'ancienne est marquée comme telle.

C'est le document à lire pour comprendre pourquoi le projet est fait ainsi — pourquoi la base
tient en mémoire, pourquoi on ne compare jamais le texte d'une requête, pourquoi un refus à tort
est traité comme beaucoup plus grave qu'une acceptation à tort, ou pourquoi les données sales
viennent d'un second jeu plutôt que d'avoir sali le premier.

## Ce que Requêt'R n'est pas

- **Ce n'est pas un cours de SQL d'entreprise.** Le moteur est SQLite. Ce qui s'apprend ici — lire
  une base, filtrer, agréger, joindre, raisonner par sous-requêtes, classer avec des fonctions de
  fenêtre — se transpose à PostgreSQL ou SQL Server, mais la syntaxe des dates, le typage et les
  fonctions de texte diffèrent, parfois beaucoup. SQLite est aussi plus permissif que la plupart
  des moteurs : il accepte des choses qu'un serveur refuserait.
- **Il n'y a ni compte ni synchronisation.** La progression est stockée par le navigateur de
  celui qui l'utilise, et nulle part ailleurs. Changer de navigateur ou de machine, ou vider les
  données du site, c'est repartir de zéro — l'écran Réglages permet d'exporter et de réimporter sa
  progression dans un fichier, et c'est le seul moyen de la déplacer.
- **Ce n'est pas un outil pour interroger ses propres données.** Les deux jeux sont fixes et
  gelés ; rien ne permet de charger un fichier à soi. Le bac à sable sert à explorer librement ces
  deux bases, pas à en importer une troisième.
- **Ce n'est pas une application installable.** Pas de service worker, pas de manifeste, pas de
  mise en cache : c'est un fichier qu'on ouvre.

## Licence

sql.js est redistribué sous sa licence d'origine, conservée dans `vendor/LICENSE-sql.js`.
