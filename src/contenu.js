"use strict";
/* Requêt'R — contenu pédagogique. Chargé avant app.js.
   `base` décrit la base de démonstration (src/seed.sql, documentée dans SCHEMA.md) : l'explorateur de schéma s'en sert.
   Compétences (D043) et certifications (D044) : lot 4. Les exercices, chapitres et missions pédagogiques
   arrivent à partir du lot 6 ; les 4 exercices `demo: true` ci-dessous sont jetables (lot 3, jusqu'au lot 6).
   Déterminisme (D001) : aucune solution ni donnée ne peut dépendre de date('now'), random(),
   CURRENT_TIMESTAMP ni de l'ordre naturel des lignes. */
const CONTENU = {
  base: {
    /* « Aujourd'hui » pour tous les exercices (délais, retards). Jamais lu dans la base : les consignes l'écrivent en littéral. */
    dateReference: "2026-06-30",
    dateReferenceTexte: "30 juin 2026",
    tables: {
      categories: {
        role: "Les rayons du catalogue. Un produit appartient à une seule catégorie."
      },
      produits: {
        role: "Les articles en vente, avec leur prix actuel et leur stock.",
        colonnes: { prix: "prix actuel, en euros" }
      },
      clients: {
        role: "Les personnes qui ont un compte. Un client peut en avoir parrainé d'autres.",
        colonnes: {
          ville: "pas renseignée pour certains clients",
          date_inscription: "texte AAAA-MM-JJ",
          parrain_id: "le client qui a parrainé celui-ci ; vide s'il est venu seul"
        }
      },
      commandes: {
        role: "Un panier validé par un client. Le détail des articles est dans lignes_commande.",
        colonnes: {
          date_commande: "texte AAAA-MM-JJ",
          statut: "en_preparation, expediee, livree, annulee ou retournee",
          frais_port: "frais de port de la commande entière, comptés une seule fois",
          date_livraison: "vide tant que la commande n'est pas livrée",
          note: "satisfaction de 1 à 5 ; vide si le client n'a pas noté"
        }
      },
      lignes_commande: {
        role: "Le détail d'une commande : une ligne par produit commandé. C'est elle qui relie commandes et produits.",
        colonnes: { prix_unitaire: "prix facturé à ce moment-là, qui peut différer de produits.prix" }
      }
    }
  },
  /* Compétences SQL (DECISIONS.md D043) : 9, chacune rattachée à un seul palier de PALIERS, couvrant ensemble
     les pièges P1 à P11 de SCHEMA.md. `actif` permet d'en retirer une sans la supprimer (comme Classe'R). */
  competences: [
    { id: "lire-filtrer", nom: "Lire et filtrer une table", desc: "Choisir les bonnes colonnes et les bonnes lignes, les trier, les limiter.", niveau: "P1", actif: true },
    { id: "valeurs-manquantes", nom: "Repérer les valeurs manquantes", desc: "Reconnaître un NULL, et ce qu'il change dans un calcul ou une comparaison.", niveau: "P2", actif: true },
    { id: "agreger", nom: "Compter, sommer, regrouper", desc: "Calculer une valeur par groupe de lignes, et séparer vraiment les groupes avec HAVING.", niveau: "P2", actif: true },
    { id: "joindre", nom: "Joindre des tables", desc: "Relier deux tables ou plus, sans perdre ni dédoubler des lignes.", niveau: "P3", actif: true },
    { id: "dates", nom: "Travailler avec les dates", desc: "Comparer des dates, calculer une durée, regrouper par mois ou par année.", niveau: "P2", actif: true },
    { id: "sous-requetes", nom: "Raisonner avec des sous-requêtes", desc: "Utiliser le résultat d'une requête à l'intérieur d'une autre, y compris pour se comparer à soi-même.", niveau: "P4", actif: true },
    { id: "classer-cumuler", nom: "Classer et cumuler", desc: "Donner un rang, repérer les meilleurs par groupe, cumuler une valeur ligne après ligne.", niveau: "P4", actif: true },
    { id: "vocabulaire-metier", nom: "Traduire une question métier", desc: "Passer d'une question floue (« le chiffre d'affaires », « un client actif ») à une requête précise, en choisissant la bonne définition.", niveau: "P5", actif: true },
    { id: "nettoyer-donnees", nom: "Nettoyer et vérifier des données", desc: "Repérer une donnée suspecte dans un export brut, avant de l'utiliser dans un calcul.", niveau: "P5", actif: true }
  ],

  /* Certifications (D044) : repères personnels de progression, jamais sur minuterie — vérifiées après chaque
     résultat (Progression.verifierCertifications). `condition(etat, api)` reçoit Store.etat et l'API Progression. */
  certifications: [
    { id: "premier-pas", nom: "Premier pas", ico: "◔", desc: "Réussir un premier exercice",
      condition: e => Object.values(e.exercices).some(h => h.reussites > 0) },
    { id: "chasseur-de-null", nom: "Chasseur de NULL", ico: "⌕", desc: "60 % en « Repérer les valeurs manquantes »",
      condition: (e, p) => p.maitrise("valeurs-manquantes").effective >= 60 },
    { id: "agregateur", nom: "Agrégateur", ico: "∑", desc: "60 % en « Compter, sommer, regrouper »",
      condition: (e, p) => p.maitrise("agreger").effective >= 60 },
    { id: "jointeur", nom: "Jointeur", ico: "⋈", desc: "60 % en « Joindre des tables »",
      condition: (e, p) => p.maitrise("joindre").effective >= 60 },
    { id: "horloger", nom: "Horloger", ico: "◷", desc: "60 % en « Travailler avec les dates »",
      condition: (e, p) => p.maitrise("dates").effective >= 60 },
    { id: "strategiste", nom: "Stratège", ico: "⌥", desc: "60 % en « Raisonner avec des sous-requêtes »",
      condition: (e, p) => p.maitrise("sous-requetes").effective >= 60 },
    { id: "chef-de-rang", nom: "Chef de rang", ico: "▲", desc: "60 % en « Classer et cumuler »",
      condition: (e, p) => p.maitrise("classer-cumuler").effective >= 60 },
    { id: "traducteur", nom: "Traducteur métier", ico: "⊞", desc: "60 % en « Traduire une question métier »",
      condition: (e, p) => p.maitrise("vocabulaire-metier").effective >= 60 },
    { id: "assidu", nom: "Assidu", ico: "◈", desc: "7 jours de pratique d'affilée",
      condition: e => e.serie.jours >= 7 },
    { id: "marathonien", nom: "Marathonien", ico: "◆", desc: "30 jours de pratique d'affilée",
      condition: e => e.serie.jours >= 30 },
    { id: "sans-faute", nom: "Sans faute", ico: "◉", desc: "Une série d'exercices sans aucune erreur",
      condition: e => e.stats.seriesParfaites >= 1 },
    { id: "sans-faute-x5", nom: "Régulier au but", ico: "◍", desc: "Cinq séries sans aucune erreur",
      condition: e => e.stats.seriesParfaites >= 5 },
    { id: "centurion", nom: "Cent fois sur le métier", ico: "◎", desc: "100 exercices réussis",
      condition: e => Object.values(e.exercices).reduce((n, h) => n + h.reussites, 0) >= 100 },
    { id: "praticien", nom: "Praticien", ico: "⬟", desc: "Atteindre le niveau 5",
      condition: (e, p) => p.niveau().niveau >= 5 },
    { id: "confirme", nom: "Confirmé", ico: "⬢", desc: "Atteindre le niveau 8",
      condition: (e, p) => p.niveau().niveau >= 8 },
    { id: "polyvalent", nom: "Polyvalent", ico: "✦", desc: "Toutes les compétences actives au-dessus de 50 %",
      condition: (e, p) => CONTENU.competences.filter(c => c.actif !== false).every(c => p.maitrise(c.id).effective >= 50) },
    { id: "premiere-mission", nom: "Première mission", ico: "◱", desc: "Terminer une mission complète",
      condition: e => Object.values(e.missions).some(m => m.statut === "terminee") },
    { id: "sans-indice", nom: "Sans filet", ico: "◇", desc: "Terminer une mission sans aucun indice",
      condition: e => Object.values(e.missions).some(m => m.etoiles === 3) },
    { id: "trois-etoiles", nom: "Trois étoiles", ico: "★", desc: "Trois missions réussies sans indice",
      condition: e => Object.values(e.missions).filter(m => m.etoiles === 3).length >= 3 },
    { id: "maitre-d-oeuvre", nom: "Maître d'œuvre", ico: "⬣", desc: "Toutes les missions disponibles terminées",
      condition: e => CONTENU.missions.length > 0 && CONTENU.missions.every(m => e.missions[m.id] && e.missions[m.id].statut === "terminee") }
  ],

  missions: [],

  /* Contenus installés (Packs, D048) : un seul pack pour l'instant, le contenu principal — toujours proposé actif
     par défaut. Le second pack (jeu sale du palier 5, D027) s'y ajoutera sans rien changer à la mécanique. */
  packs: [
    { id: "boutique", nom: "Boutique", desc: "Le contenu principal : la base de données boutique en ligne." }
  ],

  /* Exercices. Les quatre ci-dessous (`demo: true`) sont JETABLES : ils prouvent la mécanique du lot 3 (un par type) et
     disparaîtront au lot 6, quand le contenu pédagogique arrivera. Forme d'un exercice :
       id, type, titre, question, consigne
       niveau (un id de PALIERS), competence (un id de CONTENU.competences, D043),
       categorie ("Comprendre", "Mise en pratique", "Détection d'erreur"…), difficulte (1 à 3)
       requete / corriger : solution (SQL de référence, JAMAIS comparée au texte : on compare les résultats), comparer, depart (corriger)
       predire            : requete (montrée à l'apprenant), predit: "nbLignes" | "valeur" (la bonne réponse est CALCULÉE)
       qcm                : options (bonne réponse en tête, mélangées à l'affichage), reponse (indice de la bonne)
       indices graduels   : piste, clause (clé de CLAUSES), exemple ; la solution ferme la liste
       retour             : explication, retenir
     comparer = { ordonne: false | true | { cles: [indices de colonnes] }, colonnes: false | true, texte: "strict" | "souple" } (D029 à D031).
     Règles d'auteur (D029, D030) : la consigne énumère les colonnes dans l'ordre attendu ; la clé de tri figure dans le SELECT ;
     jamais `cles` quand un LIMIT peut couper un groupe d'ex æquo (ordre total en consigne, ou un rang).
     Métadonnées optionnelles pour l'Autotest (lot 5, D051) : pieges (tableau d'identifiants P1 à P11 de SCHEMA.md, déclaré
     par l'auteur, sert la couverture) ; zeroLigneAttendu (chaîne non vide justifiant qu'une solution renvoie 0 ligne
     volontairement — jamais un booléen, pour qu'il ne devienne pas un interrupteur de confort). */
  exercices: [
    {
      id: "demo-qcm", demo: true, type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 1,
      titre: "COUNT(*) ou COUNT(ville) ?",
      question: "Dans la table clients, certains clients n'ont pas de ville renseignée (la valeur est NULL). Que donne SELECT COUNT(ville) FROM clients, comparé à SELECT COUNT(*) FROM clients ?",
      options: [
        "Un nombre plus petit : COUNT(ville) ne compte que les villes renseignées",
        "Le même nombre : COUNT compte toujours toutes les lignes",
        "Une erreur : COUNT n'accepte pas de nom de colonne",
        "NULL, parce qu'au moins une ville manque"
      ],
      reponse: 0,
      piste: "COUNT(*) compte des lignes ; COUNT(ville) compte des valeurs. Une ville vide est-elle une valeur ?",
      clause: "COUNT",
      exemple: "SELECT COUNT(*), COUNT(note) FROM commandes; renvoie 70 puis 32, parce que 38 commandes n'ont pas de note.",
      explication: "COUNT(*) compte toutes les lignes ; COUNT(ville) saute celles où la ville est NULL. Ici : 40 clients, mais 36 villes renseignées.",
      retenir: "COUNT(*) compte les lignes ; COUNT(colonne) ignore les NULL."
    },
    {
      id: "demo-requete", demo: true, type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 2,
      titre: "Les commandes de chaque client",
      question: "Pour chaque client, affiche son identifiant et son nombre de commandes. Les clients qui n'ont jamais commandé doivent apparaître, avec 0.",
      consigne: "Deux colonnes, dans cet ordre : l'identifiant du client, puis le nombre de commandes.",
      solution: "SELECT c.id, COUNT(o.id) AS nb_commandes\nFROM clients AS c\nLEFT JOIN commandes AS o ON o.client_id = c.id\nGROUP BY c.id",
      comparer: {},
      piste: "Une jointure ordinaire écarte les clients qui n'ont aucune commande. Laquelle les garde ?",
      clause: "LEFT JOIN",
      exemple: "SELECT p.nom, c.nom FROM produits AS p LEFT JOIN categories AS c ON c.id = p.categorie_id;",
      explication: "LEFT JOIN garde tous les clients, même ceux sans commande : leurs colonnes de commandes valent alors NULL. COUNT(o.id) ne compte que les identifiants de commande renseignés : un client sans commande obtient 0. Le nom de la colonne du résultat n'a pas d'importance, ni l'ordre des lignes.",
      retenir: "Après un LEFT JOIN, COUNT(colonne) ne compte pas les lignes sans correspondance, COUNT(*) les compte."
    },
    {
      id: "demo-corriger", demo: true, type: "corriger",
      niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 1,
      titre: "Du plus cher au moins cher",
      question: "Cette requête devrait afficher les produits à plus de 100 €, du plus cher au moins cher. Elle ne le fait pas : répare-la.",
      consigne: "Deux colonnes, dans cet ordre : le nom, puis le prix.",
      depart: "SELECT nom, prix\nFROM produits\nWHERE prix > 100\nORDER BY prix",
      solution: "SELECT nom, prix\nFROM produits\nWHERE prix > 100\nORDER BY prix DESC, id",
      comparer: { ordonne: { cles: [1] } },
      piste: "Exécute la requête : les bonnes lignes sortent-elles dans le bon sens ?",
      clause: "ORDER BY",
      exemple: "SELECT nom FROM clients ORDER BY nom DESC;",
      explication: "ORDER BY trie par défaut du plus petit au plus grand ; DESC inverse le tri. Deux produits ont le même prix (1 299 € pour deux d'entre eux, 449 € pour deux autres) : la consigne ne demande pas de les départager, leur ordre relatif n'a donc pas d'importance.",
      retenir: "ORDER BY colonne trie du plus petit au plus grand ; ajoute DESC pour l'inverse."
    },
    {
      id: "demo-predire", demo: true, type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Combien de lignes ?",
      question: "Sans l'exécuter : combien de lignes cette requête renvoie-t-elle ?",
      requete: "SELECT c.id, o.id AS commande\nFROM clients AS c\nLEFT JOIN commandes AS o ON o.client_id = c.id",
      predit: "nbLignes",
      piste: "Chaque commande donne une ligne. Un client qui n'a aucune commande disparaît-il, avec un LEFT JOIN ?",
      clause: "LEFT JOIN",
      exemple: "Avec 3 articles dont un jamais commandé, articles LEFT JOIN commandes renvoie une ligne par commande, plus une ligne (avec NULL) pour l'article jamais commandé.",
      explication: "Les 70 commandes donnent chacune une ligne ; le LEFT JOIN ajoute une ligne, avec NULL, pour chacun des 6 clients sans commande : 76 lignes. Un JOIN ordinaire n'en aurait renvoyé que 70.",
      retenir: "LEFT JOIN renvoie au moins une ligne par ligne de la table de gauche."
    }
  ]
};
/* Chapitres (Parcours, D050) : une leçon courte suivie des exercices qui l'appliquent, repris de CHAPITRES de Classe'R
   (Reference/classer-v2.html). Les exercices ne sont pas dupliqués : `exercices` cite leurs identifiants.
     { id, niveau (un id de PALIERS), titre, duree, resume,
       lecon: { intro, points: [...], exemple: { titre, code, resultat, commentaire }, astuce },
       exercices: [ids de CONTENU.exercices] }
   Vide jusqu'au lot 6+ (D047/D048). */
const CHAPITRES = [];

/* Paliers du programme (D021) : la liste et l'ordre ne bougent pas, elle sert à grouper et filtrer l'écran « Exercices »
   et à rattacher chaque compétence de CONTENU.competences (D043) à un seul palier.
   `termine` (D051) : posé à la main par l'auteur quand le palier est déclaré fini — l'Autotest (lot 5) fait alors passer
   ses deux contrôles de couverture d'un avertissement à un échec bloquant pour ce palier. */
const PALIERS = [
  { id: "P1", titre: "Lire", termine: false },
  { id: "P2", titre: "Agréger", termine: false },
  { id: "P3", titre: "Croiser", termine: false },
  { id: "P4", titre: "Raisonner", termine: false },
  { id: "P5", titre: "Métier", termine: false }
];

/* Clauses SQL : structure du futur lexique (lot 4). Le niveau « Clause » des indices en est tiré, comme le niveau « Fonction »
   l'était de FONCTIONS dans Classe'R. Cinq entrées suffisent aux exercices de démonstration ; le lexique complet viendra avec le contenu. */
const CLAUSES = {
  "WHERE": { syntaxe: "SELECT … FROM table WHERE condition", aide: "garde seulement les lignes pour lesquelles la condition est vraie" },
  "ORDER BY": { syntaxe: "SELECT … FROM table ORDER BY colonne [ASC | DESC]", aide: "trie le résultat : ASC du plus petit au plus grand (par défaut), DESC du plus grand au plus petit" },
  "GROUP BY": { syntaxe: "SELECT colonne, COUNT(*) FROM table GROUP BY colonne", aide: "regroupe les lignes qui ont la même valeur, pour calculer une valeur par groupe" },
  "LEFT JOIN": { syntaxe: "… FROM a LEFT JOIN b ON b.cle = a.id", aide: "garde toutes les lignes de a, même sans correspondance dans b (les colonnes de b valent alors NULL)" },
  "COUNT": { syntaxe: "COUNT(*) ou COUNT(colonne)", aide: "COUNT(*) compte les lignes ; COUNT(colonne) ne compte que les valeurs renseignées (non NULL)" }
};
