# Requêt'R — Système de design

Document de référence de l'apparence : c'est ici qu'on lit **quelle règle s'applique** avant de toucher à un écran ou d'en ajouter un.
Les valeurs, elles, sont dans `src/template.html` §1 (les deux blocs de jetons, `:root` et `[data-theme="sombre"]`) : **elles ne sont pas recopiées ici**, pour qu'il n'existe jamais deux versions de la même couleur. La décision qui a posé le système est DECISIONS.md D063.

## 1. La règle qui prime sur toutes les autres

Le système vient d'un document fourni par l'utilisateur. Ses valeurs se copient **littéralement** : aucune couleur, rayon, ombre, espacement ou typographie ne se décide « à l'œil ». Une valeur dont le système ne parle pas se **décline** depuis un jeton existant, jamais inventée en dur.

## 2. Relief : ce qui porte un contour encre, et ce qui reste sobre

Le système distingue deux familles par ses valeurs ; c'est une hiérarchie, pas une coquetterie.

| Famille | Traitement | Qui en relève |
|---|---|---|
| Ce qui agit ou annonce un résultat | contour encre franc `var(--encre)` (2px, 1,5px sur les petits éléments : `.puce`, `.etape__marque`), ombre dure (`--ombre` 2px, `--ombre-l` 4px pour le CTA principal et l'« en cours / terminé ») | `.carte` (et `.carte--action`), `.btn`, `.puce`, `.cellules`, `.choix button`, `.option`, `.segment`, `.modale`, `.retour`, `.chapitre__num`, `.bilan-hero` |
| Ce qui se lit | bordure fine `1px var(--bord)`, aucune ombre | `.lecon`, `.vide__boite`, `.atelier`, les tables de résultats (`.resultat`, `.apercu`), l'éditeur SQL |

Aucune ombre floue nulle part. Pas de relief animé au survol : le seul retour de geste au clic est l'enfoncement (`:active{transform:translateY(2px); box-shadow:none}`).

## 3. Règles de composition

- **Un seul bouton `--fort` / `--plein` par écran** : l'action prioritaire. Tout le reste en `.btn` ou `.btn--nu`.
- **Le vert (`--ok`) est réservé à la réussite.** Jamais décoratif. Chaque état de correction est doublé d'un symbole (✓ / ✕), jamais la couleur seule.
- **La progression se lit en cellules** (`.cellules`), pas en barre continue : un segment = une unité de progrès. Vaut pour la maîtrise d'une compétence, un niveau, une série.
- **`.retour` est le composant unique du verdict**, réutilisé partout (exercice, chapitre, mission, fiche) : il ne se réinvente pas par écran. Son animation d'entrée n'est posée par le JS (`data-frais="1"`) qu'au rendu qui suit une réponse, jamais au montage.
- **Les cartes de chiffres** sont en libellé-puis-valeur : `.stat__sur` (libellé), `.stat__val` (valeur, en police de titre), `.stat__lib` (précision sous la valeur), puis les cellules s'il y a une proportion à montrer. Accueil et Progression partagent la même carte de niveau.
- **Un segment épouse ses boutons** dès qu'il n'est pas dans une ligne de réglage (`.segment--libre`, `.schema-onglets`) : barré sur toute la largeur, son contour encre se lit comme un conteneur et non comme une commande.
- **Aucune illustration décorative.** Le pixel art porté de Classe'R (paysage d'accueil, vignettes de chapitre) a été retiré au lot 7 ; ne pas en réintroduire.
- **Rédaction des tuiles et des cartes d'accès** : une description répond à « qu'est-ce que ça me coûte ? » ou « qu'est-ce que ça me permet ? », jamais à « comment c'est fait ? ».

## 4. Accessibilité — non négociable

- `:focus-visible` toujours visible (anneau `--focus`), jamais supprimé ; lien d'évitement (`.saut`) hors écran, visible au focus clavier.
- `aria-current="page"` sur le lien de nav actif, `aria-pressed` sur les bascules ; les états pilotés par le JS passent par des attributs (`data-etat`, `data-choisi`), pas par des classes.
- `@media (prefers-reduced-motion:reduce)` coupe toutes les animations et transitions.
- Contrastes : 4,5:1 pour le texte courant, 3:1 pour les bordures et les anneaux de focus.
- Toute modale piège le focus, le restitue à la fermeture, et se ferme au clic hors zone comme à Échap.

## 5. Thème

Deux thèmes, un seul mécanisme : l'attribut `data-theme` sur `<html>` (`"clair"` par défaut, `"sombre"`). Le choix est un réglage persistant (`Store.etat.reglages.theme`) ; `appliquerTheme()` pose l'attribut et resynchronise `<meta name="theme-color">` depuis `--fond`. Aucune règle ne doit tester le thème autrement que par ce sélecteur.

## 6. Jetons définis mais inutilisés

`--selection` et `--selection-ligne` viennent du tableur de Classe'R, qui n'a pas d'équivalent ici. Ils restent définis pour que les deux feuilles de style restent comparables : à n'employer que si une vraie sélection de cellules apparaît, jamais détournés vers un autre usage.
