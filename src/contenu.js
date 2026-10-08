"use strict";
/* Requêt'R — contenu pédagogique. Chargé avant app.js.
   `base` décrit la base de démonstration (src/seed.sql, documentée dans SCHEMA.md) : l'explorateur de schéma s'en sert.
   Compétences (D043) et certifications (D044) : lot 4. Chapitre 0 et palier 1 (lire-filtrer) : lot 6.
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

  /* Exercices. Chapitre 0 (ch0-*) et palier 1 (p1-*, lot 6) : le reste arrive un palier par lot (D002). Forme d'un
     exercice :
       id, type, titre, question, consigne
       niveau (un id de PALIERS), competence (un id de CONTENU.competences, D043),
       categorie ("Comprendre", "Mise en pratique", "Détection d'erreur", "Prédire le résultat"…), difficulte (1 à 3)
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
    /* ── Chapitre 0 : comprendre une base, sans une ligne de SQL — QCM uniquement ─────────────────────────── */
    {
      id: "ch0-01", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Une base, pas un tableur",
      question: "Dans un tableur, une colonne peut contenir tout et n'importe quoi : du texte une ligne, un nombre la suivante. Qu'en est-il dans une base de données ?",
      options: [
        "Chaque colonne a un type fixé une fois pour toutes : toutes ses valeurs sont du même genre (un nombre, un texte, une date…)",
        "C'est pareil : une colonne accepte n'importe quel type de valeur, ligne par ligne",
        "Une base interdit les colonnes de texte",
        "Le type d'une colonne change selon ce que l'utilisateur tape"
      ],
      reponse: 0,
      piste: "Repensez à une colonne « prix » d'un tableur, où une ligne a glissé un texte par erreur : une base de données ne laisse jamais ça arriver.",
      exemple: "La colonne prix de la table produits ne contient que des nombres, jamais de texte comme « gratuit » : c'est son type qui l'impose.",
      explication: "Une base de données fixe le type de chaque colonne à sa création (nombre, texte, date…) et refuse toute valeur d'un autre type. C'est ce qui rend les calculs et les comparaisons fiables, contrairement à un tableur où une colonne « nombre » peut cacher un texte.",
      retenir: "Dans une base, chaque colonne a un type fixé pour toujours : pas de mise en forme libre, pas de cellule qui change de nature."
    },
    {
      id: "ch0-02", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Une ligne, une colonne",
      question: "La table clients contient une ligne par client. Qu'est-ce qui change d'une ligne à l'autre de cette table ?",
      options: [
        "Rien : toutes les lignes d'une table sont identiques",
        "Les colonnes elles-mêmes : chaque client peut avoir des informations différentes",
        "Les valeurs des colonnes (le prénom, la ville…) ; les colonnes elles-mêmes restent les mêmes pour toutes les lignes",
        "Le nombre de colonnes, selon ce qu'on sait du client"
      ],
      reponse: 2,
      piste: "Ouvrez « Schéma » et regardez la table clients : combien de colonnes a-t-elle, et est-ce que ça change d'une ligne à l'autre ?",
      exemple: "Chaque ligne de clients a les mêmes colonnes (id, prenom, nom, email, ville, date_inscription, parrain_id) ; seules leurs valeurs changent d'un client à l'autre.",
      explication: "Une table a une structure fixe : les mêmes colonnes pour toutes ses lignes. Ce qui distingue une ligne (un enregistrement) d'une autre, c'est la valeur de chaque colonne (un champ), pas la liste des colonnes elle-même.",
      retenir: "Une table a les mêmes colonnes pour toutes ses lignes ; seules les valeurs changent d'une ligne à l'autre."
    },
    {
      id: "ch0-03", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Identifier une ligne sans ambiguïté",
      question: "La table clients compte deux clients nommés Martin (Nolan et Eva). Comment la base les distingue-t-elle sans jamais les confondre ?",
      options: [
        "Par leur identifiant (id) : une valeur unique, jamais partagée par deux lignes de la table",
        "Par leur prénom, qui suffit toujours à distinguer deux personnes",
        "Par l'ordre dans lequel ils ont été ajoutés à la table",
        "Elle ne les distingue pas : les deux lignes sont fusionnées"
      ],
      reponse: 0,
      piste: "Dans l'explorateur de schéma, la colonne id de clients est marquée « clé primaire » : cherchez ce que ça signifie.",
      exemple: "Nolan Martin porte l'identifiant 202, Eva Martin l'identifiant 226 : deux lignes, deux valeurs d'id, aucune confusion possible malgré le nom commun.",
      explication: "La clé primaire d'une table (ici id) est une colonne dont la valeur est unique pour chaque ligne : elle identifie une ligne sans ambiguïté, même quand deux lignes se ressemblent sur tout le reste (même nom, même ville…).",
      retenir: "La clé primaire d'une table identifie chaque ligne de façon unique, indépendamment de ce que ses autres colonnes contiennent."
    },
    {
      id: "ch0-04", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Comment une commande retrouve son client",
      question: "La table commandes ne contient ni le prénom ni le nom du client qui l'a passée : seulement une colonne client_id. À quoi sert-elle ?",
      options: [
        "Elle ne sert à rien : chaque commande garde sa propre copie du prénom et du nom",
        "C'est un numéro sans rapport avec la table clients, juste pour le classement",
        "Elle contient le nom du client, codé sous forme de nombre",
        "Elle contient l'identifiant du client, dans la table clients : c'est ainsi que la commande est reliée à lui"
      ],
      reponse: 3,
      piste: "client_id de commandes et id de clients contiennent les mêmes valeurs (201 à 240) : regardez l'explorateur de schéma, la flèche entre les deux tables.",
      exemple: "La commande 1001 porte client_id = 201 : c'est la commande de Camille Durand, le client dont l'id vaut 201 dans la table clients.",
      explication: "client_id est une clé étrangère : une colonne qui contient l'identifiant d'une ligne d'une autre table (ici, clients). C'est ce qui relie une commande à son client, sans jamais recopier son prénom ou son nom.",
      retenir: "Une clé étrangère contient l'identifiant d'une ligne d'une autre table : c'est ainsi que deux tables se relient."
    },
    {
      id: "ch0-05", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Pourquoi pas un grand tableau ?",
      question: "Dans un tableur, on aurait pu mettre le prénom et le nom du client directement dans chaque ligne de commande, répétés autant de fois que ses commandes. Pourquoi une base ne fait pas ça ?",
      options: [
        "Parce qu'un nom recopié peut finir par être mal orthographié une fois, et rien n'empêche alors deux commandes du même client de ne plus se ressembler",
        "Parce que c'est interdit par le langage SQL",
        "Parce que ça prendrait trop de place sur le disque",
        "Parce qu'un tableur ne sait pas répéter une valeur sur plusieurs lignes"
      ],
      reponse: 0,
      piste: "Pensez à une colonne « Client » recopiée dans 400 lignes d'un tableur : combien de chances qu'elle finisse avec trois orthographes différentes pour la même personne ?",
      exemple: "Avec une seule table clients, « Camille Durand » n'est écrit qu'une fois. Avec une colonne recopiée dans commandes, il faudrait l'écrire à l'identique à chacune de ses commandes — une seule faute de frappe romprait le lien, sans que rien ne le signale.",
      explication: "Séparer les informations en plusieurs tables évite de répéter la même donnée (le nom d'un client) à chaque ligne qui la concerne. Une seule table clients porte l'information une fois ; les commandes se contentent d'y pointer par client_id. Si le nom change, il change à un seul endroit — et aucune faute de recopie n'est possible.",
      retenir: "Plusieurs tables plutôt qu'un grand tableau : chaque information n'est écrite qu'une fois, jamais recopiée."
    },
    {
      id: "ch0-06", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Reconnaître une table de la boutique",
      question: "Dans l'explorateur de schéma, la table produits a une colonne categorie_id. Qu'est-ce que c'est ?",
      options: [
        "Une clé étrangère vers la table categories : elle indique à quel rayon appartient le produit",
        "Le nom de la catégorie, écrit sous forme de nombre",
        "Un numéro de produit, sans rapport avec les catégories",
        "Une colonne qui ne sert à rien dans cette table"
      ],
      reponse: 0,
      piste: "Ouvrez « Schéma », cliquez sur produits, et regardez vers quelle table la flèche de categorie_id pointe.",
      exemple: "Le produit 101 (Ordinateur portable) a categorie_id = 1, qui correspond à « Informatique » dans la table categories.",
      explication: "categorie_id est une clé étrangère, exactement comme client_id dans commandes : elle contient l'identifiant d'une ligne de categories, et c'est ce qui rattache chaque produit à son rayon. Vous retrouverez ce même principe dans toute la boutique : clients, commandes, lignes_commande et produits se relient tous par ce mécanisme.",
      retenir: "Une clé étrangère porte toujours l'identifiant d'une autre table — jamais la donnée elle-même."
    },

    /* ── Palier 1, chapitre 1 : SELECT et FROM ───────────────────────────────────────────────────────────── */
    {
      id: "p1-01", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le nom et le prix de chaque produit",
      question: "Affichez le nom et le prix de chaque produit.",
      consigne: "Deux colonnes, dans cet ordre : le nom du produit, puis son prix.",
      solution: "SELECT nom, prix FROM produits",
      comparer: {},
      piste: "La leçon vient de vous montrer comment demander des colonnes d'une table : une seule table ici, deux colonnes à nommer après SELECT.",
      clause: "SELECT",
      exemple: "SELECT nom FROM categories; affiche le nom des 7 rayons de la boutique.",
      explication: "SELECT nom, prix FROM produits lit la table produits et n'en garde que les colonnes nom et prix, dans l'ordre demandé. Sans condition WHERE, toutes les lignes de la table sont renvoyées : les 30 produits. L'ordre des lignes n'a pas d'importance ici, seul l'ordre des colonnes compte.",
      retenir: "SELECT colonne1, colonne2 FROM table renvoie ces colonnes, dans cet ordre, pour toutes les lignes de la table."
    },
    {
      id: "p1-02", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Lire un message d'erreur SQLite",
      question: "Vous tapez SELEC nom FROM categories; (sans le dernier T de SELECT) et cliquez sur Exécuter. Que se passe-t-il ?",
      options: [
        "SQLite refuse la requête et affiche une erreur de syntaxe, qui pointe sur le mot mal écrit",
        "SQLite corrige l'orthographe tout seul et exécute la requête normalement",
        "SQLite affiche un tableau vide, sans message",
        "SQLite affiche les 7 catégories, comme si de rien n'était"
      ],
      reponse: 0,
      piste: "Essayez-la pour de vrai dans le bac à sable si vous n'êtes pas sûr : SQLite ne devine jamais un mot-clé mal écrit.",
      clause: "SELECT",
      exemple: "SELECT 1; fonctionne ; SELEC 1; renvoie near \"SELEC\": syntax error — le message brut de SQLite, pas une traduction.",
      explication: "SQLite ne reconnaît SELECT, FROM, WHERE… que correctement écrits : un mot-clé mal orthographié n'est pas un mot-clé, et la requête entière est refusée avant même d'être exécutée. Le message near \"SELEC\": syntax error désigne l'endroit où SQLite a cessé de comprendre. Savoir le lire fait partie du métier : ces erreurs restent toujours affichées telles que SQLite les donne, jamais traduites ni adoucies.",
      retenir: "Un mot-clé mal écrit n'est pas exécuté : SQLite affiche une erreur de syntaxe qui pointe sur l'endroit où il a cessé de comprendre."
    },
    {
      id: "p1-03", type: "predire",
      niveau: "P1", competence: "lire-filtrer", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Toute la table, sans exception",
      question: "Sans l'exécuter : combien de lignes cette requête renvoie-t-elle ?",
      requete: "SELECT * FROM categories;",
      predit: "nbLignes",
      piste: "FROM categories sans aucune condition WHERE : combien de rayons compte la boutique ?",
      clause: "FROM",
      exemple: "SELECT * FROM table renvoie toutes les colonnes et, sans WHERE, toutes les lignes de la table.",
      explication: "Sans condition WHERE, une requête renvoie toutes les lignes de la table nommée après FROM. La table categories compte 7 rayons : la requête renvoie donc 7 lignes, chacune avec toutes ses colonnes (* les demande toutes).",
      retenir: "Sans WHERE, une requête renvoie toutes les lignes de la table : aucune n'est mise de côté."
    },

    /* ── Palier 1, chapitre 2 : filtrer avec WHERE (texte et nombres) ───────────────────────────────────────── */
    {
      id: "p1-04", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Les clients de Lyon",
      question: "Affichez le prénom et le nom des clients habitant à Lyon.",
      consigne: "Deux colonnes, dans cet ordre : le prénom, puis le nom.",
      solution: "SELECT prenom, nom FROM clients WHERE ville = 'Lyon'",
      comparer: {},
      piste: "Un texte comparé avec = s'entoure d'apostrophes : WHERE colonne = 'valeur'.",
      clause: "WHERE",
      exemple: "SELECT nom, prix FROM produits WHERE prix > 100; ne garde que les produits à plus de 100 €.",
      explication: "WHERE ville = 'Lyon' ne garde que les lignes de clients où la colonne ville vaut exactement Lyon : les autres clients disparaissent du résultat, ils ne sont pas simplement masqués.",
      retenir: "Un texte comparé avec = s'écrit entre apostrophes : WHERE colonne = 'valeur'."
    },
    {
      id: "p1-05", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Un stock presque épuisé",
      question: "Affichez le nom et le stock des produits dont le stock est inférieur à 10.",
      consigne: "Deux colonnes, dans cet ordre : le nom, puis le stock.",
      solution: "SELECT nom, stock FROM produits WHERE stock < 10",
      comparer: {},
      piste: "Un nombre comparé ne s'entoure de rien : WHERE colonne < 10, sans apostrophes.",
      clause: "WHERE",
      exemple: "WHERE prix > 100 garde les lignes où prix dépasse 100 ; WHERE stock < 10 garde celles où stock est inférieur à 10.",
      explication: "stock < 10 garde les lignes dont la colonne stock est strictement inférieure à 10. Contrairement à un texte, un nombre ne s'entoure jamais d'apostrophes dans la condition.",
      retenir: "Un nombre comparé s'écrit sans apostrophes : WHERE colonne < 10."
    },
    {
      id: "p1-06", type: "corriger",
      niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Les jouets, prix d'abord",
      question: "Affichez le prix et le nom des produits de la catégorie Jouets (categorie_id = 6).",
      consigne: "Deux colonnes, dans cet ordre : le prix, puis le nom.",
      depart: "SELECT nom, prix FROM produits WHERE categorie_id = 6",
      solution: "SELECT prix, nom FROM produits WHERE categorie_id = 6",
      comparer: {},
      piste: "La requête de départ renvoie les deux bonnes colonnes, mais pas dans l'ordre que la consigne demande : relisez-la.",
      clause: "SELECT",
      exemple: "SELECT prix, nom FROM produits ne renvoie pas la même chose que SELECT nom, prix FROM produits : l'ordre d'écriture décide de l'ordre des colonnes.",
      explication: "La requête de départ affiche nom puis prix, alors que la consigne demande le prix d'abord : les deux colonnes sont les bonnes, mais inversées. L'ordre dans lequel les colonnes sont écrites après SELECT est celui dans lequel elles apparaissent dans le résultat.",
      retenir: "L'ordre des colonnes après SELECT est celui du résultat : il compte, même quand les colonnes demandées sont les bonnes."
    },
    {
      id: "p1-07", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 2,
      titre: "Différent de Lyon",
      question: "Laquelle de ces conditions WHERE sélectionne les clients qui n'habitent pas à Lyon ?",
      options: [
        "WHERE ville <> 'Lyon'",
        "WHERE ville = 'lyon'",
        "WHERE ville = Lyon",
        "WHERE ville < 'Lyon'"
      ],
      reponse: 0,
      piste: "Les deux derniers choix ont un problème avant même de parler du sens de la condition : relisez-les.",
      clause: "WHERE",
      exemple: "WHERE statut <> 'annulee' garde toutes les commandes sauf celles qui sont annulées.",
      explication: "<> signifie « différent de » : WHERE ville <> 'Lyon' garde les lignes où la ville n'est pas Lyon. WHERE ville = 'lyon' compare à une chaîne en minuscules, qui ne correspond à aucune ville de la base (SQLite distingue la casse dans une comparaison de texte avec =). WHERE ville = Lyon, sans apostrophes, tente de comparer à une colonne nommée Lyon, qui n'existe pas : erreur. WHERE ville < 'Lyon' compare alphabétiquement, ce qui n'a rien à voir avec « différent de ».",
      retenir: "<> signifie « différent de » ; un texte comparé s'écrit toujours entre apostrophes, et la casse compte."
    },

    /* ── Palier 1, chapitre 3 : élargir le filtre (IN, BETWEEN, LIKE) ────────────────────────────────────────── */
    {
      id: "p1-08", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Marseille ou Nice",
      question: "Affichez le prénom et la ville des clients de Marseille ou de Nice.",
      consigne: "Deux colonnes, dans cet ordre : le prénom, puis la ville.",
      solution: "SELECT prenom, ville FROM clients WHERE ville IN ('Marseille', 'Nice')",
      comparer: {},
      piste: "IN (valeur1, valeur2) remplace une suite de OR : pas besoin d'écrire la condition deux fois.",
      clause: "IN",
      exemple: "SELECT prenom, ville FROM clients WHERE ville IN ('Nice', 'Montpellier'); renvoie les clients de l'une ou l'autre ville.",
      explication: "WHERE ville IN ('Marseille', 'Nice') garde les lignes dont la ville est Marseille OU Nice, en une seule condition. C'est équivalent à WHERE ville = 'Marseille' OR ville = 'Nice', mais plus court et plus facile à relire, surtout avec davantage de valeurs.",
      retenir: "IN (valeur1, valeur2, …) garde les lignes qui valent l'une des valeurs listées."
    },
    {
      id: "p1-09", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Des prix encadrés",
      question: "Affichez le nom et le prix des produits dont le prix est compris entre 20 et 50 euros, bornes incluses.",
      consigne: "Deux colonnes, dans cet ordre : le nom, puis le prix.",
      solution: "SELECT nom, prix FROM produits WHERE prix BETWEEN 20 AND 50",
      comparer: {},
      piste: "BETWEEN a AND b encadre une valeur entre deux bornes, les deux bornes étant elles-mêmes incluses.",
      clause: "BETWEEN",
      exemple: "WHERE note BETWEEN 1 AND 3 garderait les notes de satisfaction faibles à moyennes, 1 et 3 compris.",
      explication: "prix BETWEEN 20 AND 50 garde les lignes dont le prix est compris entre 20 et 50, les deux bornes étant incluses : un produit à exactement 20 € ou à exactement 50 € compte. C'est équivalent à prix >= 20 AND prix <= 50.",
      retenir: "BETWEEN a AND b garde les valeurs comprises entre a et b, bornes incluses."
    },
    {
      id: "p1-10", type: "corriger",
      niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Tous les tapis du catalogue",
      question: "Affichez le nom des produits dont le nom commence par « Tapis ».",
      consigne: "Une colonne : le nom du produit.",
      depart: "SELECT nom FROM produits WHERE nom LIKE 'Tapis'",
      solution: "SELECT nom FROM produits WHERE nom LIKE 'Tapis%'",
      comparer: {},
      piste: "LIKE sans % ne cherche qu'une correspondance exacte. Que faut-il ajouter pour dire « commence par Tapis, suivi de n'importe quoi » ?",
      clause: "LIKE",
      exemple: "WHERE nom LIKE 'Canapé%' trouverait tous les produits dont le nom commence par Canapé.",
      explication: "LIKE 'Tapis' (sans %) ne reconnaît que le texte exactement égal à Tapis : aucun produit ne s'appelle ainsi, le résultat est vide. LIKE 'Tapis%' reconnaît tout texte qui commence par Tapis, suivi de n'importe quoi (y compris rien) : Tapis de bain et Tapis de yoga correspondent tous les deux.",
      retenir: "LIKE sans % ne trouve qu'une correspondance exacte ; % remplace n'importe quelle suite de caractères, y compris aucune."
    },
    {
      id: "p1-11", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 2,
      titre: "LIKE et les accents",
      question: "Vous voulez retrouver tous les produits dont le nom contient un accent circonflexe, comme « Poêle antiadhésive ». Que peut-on dire de LIKE dans SQLite ?",
      options: [
        "LIKE ne reconnaît de façon fiable que les lettres sans accent : mieux vaut comparer le texte complet avec = pour un mot accentué",
        "LIKE fonctionne parfaitement avec tous les accents, sans exception",
        "LIKE refuse toute requête contenant un caractère accentué",
        "Les accents n'existent pas dans une base de données"
      ],
      reponse: 0,
      piste: "L'astuce de la leçon vous prévenait déjà sur ce point.",
      clause: "LIKE",
      exemple: "WHERE nom = 'Poêle antiadhésive' fonctionne très bien : c'est une comparaison exacte, pas un motif LIKE.",
      explication: "SQLite ne gère que l'ASCII pour LIKE (comme pour UPPER et LOWER) : un motif avec ou sans accent peut ne pas reconnaître un texte accentué de façon fiable. Pour chercher un mot précis contenant un accent, une comparaison exacte (=) reste plus sûre qu'un motif LIKE.",
      retenir: "LIKE (comme UPPER et LOWER) n'est fiable qu'avec des lettres sans accent dans SQLite."
    },

    /* ── Palier 1, chapitre 4 : les valeurs manquantes (NULL) — piège P3 ────────────────────────────────────── */
    {
      id: "p1-12", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Ce que NULL n'est pas",
      question: "La colonne ville de la table clients vaut NULL pour 4 clients. Que représente cette valeur ?",
      options: [
        "Aucune valeur du tout : ni zéro, ni texte vide, ni un mot particulier",
        "Le texte « NULL », comme n'importe quel autre texte",
        "Le nombre zéro",
        "Une chaîne vide ''"
      ],
      reponse: 0,
      piste: "NULL n'est comparable à rien d'autre, pas même à lui-même avec = : c'est le signe qu'il ne représente aucune valeur.",
      clause: "IS NULL",
      exemple: "WHERE ville = '' ne trouverait aucun de ces 4 clients : leur ville n'est pas une chaîne vide, elle est absente.",
      explication: "NULL est l'absence de valeur, une notion différente de zéro, de texte vide ou de n'importe quel mot. C'est pour cette raison qu'on ne peut pas le tester avec = : il faut IS NULL (ou IS NOT NULL).",
      retenir: "NULL veut dire « aucune valeur » : ni zéro, ni texte vide, ni un mot comparable avec =."
    },
    {
      id: "p1-13", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Les clients sans ville connue",
      question: "Affichez le prénom et le nom des clients dont la ville n'est pas renseignée.",
      consigne: "Deux colonnes, dans cet ordre : le prénom, puis le nom.",
      solution: "SELECT prenom, nom FROM clients WHERE ville IS NULL",
      comparer: {},
      pieges: ["P3"],
      piste: "Une valeur absente se teste avec IS NULL, jamais avec = NULL.",
      clause: "IS NULL",
      exemple: "SELECT prenom FROM clients WHERE ville IS NULL; affiche les clients sans ville connue.",
      explication: "ville IS NULL garde les lignes où la colonne ville n'a aucune valeur. = NULL, lui, ne renverrait jamais aucune ligne, même sur ces clients-là : une comparaison avec NULL via = n'est jamais vraie.",
      retenir: "On teste une valeur manquante avec IS NULL (ou IS NOT NULL), jamais avec = NULL."
    },
    {
      id: "p1-14", type: "corriger",
      niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Tous les clients, sauf ceux de Lyon",
      question: "Affichez le prénom et la ville des clients qui n'habitent pas à Lyon.",
      consigne: "Deux colonnes, dans cet ordre : le prénom, puis la ville.",
      depart: "SELECT prenom, ville FROM clients WHERE ville <> 'Lyon'",
      solution: "SELECT prenom, ville FROM clients WHERE ville IS NULL OR ville <> 'Lyon'",
      comparer: {},
      pieges: ["P3"],
      piste: "Essayez la requête de départ : combien de lignes donne-t-elle ? Les clients sans ville connue n'habitent pas à Lyon non plus — comptent-ils ?",
      clause: "IS NULL",
      exemple: "WHERE ville IS NULL OR ville <> 'Lyon' garde aussi les clients dont la ville n'est pas renseignée.",
      explication: "<> 'Lyon' exclut non seulement les clients de Lyon, mais aussi, sans le dire, les clients dont la ville est NULL : une comparaison avec une valeur manquante n'est ni vraie ni fausse, SQLite ne la retient jamais. Les clients sans ville connue disparaissent du résultat alors qu'ils n'habitent pas à Lyon non plus. Il faut les réintégrer explicitement avec OR ville IS NULL.",
      retenir: "<> exclut silencieusement les lignes où la colonne vaut NULL : ajoutez OR colonne IS NULL si elles doivent compter."
    },
    {
      id: "p1-15", type: "predire",
      niveau: "P1", competence: "lire-filtrer", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Lyon, ou pas de ville du tout",
      question: "Sans l'exécuter : combien de lignes cette requête renvoie-t-elle ?",
      requete: "SELECT prenom FROM clients WHERE ville = 'Lyon' OR ville IS NULL;",
      predit: "nbLignes",
      piste: "Comptez les clients de Lyon, puis ceux sans ville connue : OR réunit les deux groupes.",
      clause: "IS NULL",
      exemple: "OR réunit deux conditions : une ligne qui vérifie l'une, l'autre, ou les deux, est gardée.",
      explication: "6 clients habitent à Lyon, 4 n'ont pas de ville renseignée : OR réunit les deux groupes, soit 10 lignes. Aucune ligne n'est comptée deux fois, puisqu'un client ne peut pas être à la fois à Lyon et sans ville.",
      retenir: "OR réunit deux conditions : une ligne qui vérifie l'une ou l'autre (ou les deux) est gardée."
    },

    /* ── Palier 1, chapitre 5 : trier avec ORDER BY ──────────────────────────────────────────────────────────── */
    {
      id: "p1-16", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Les clients, du plus ancien au plus récent",
      question: "Affichez le prénom et la date d'inscription de chaque client, du plus ancien inscrit au plus récent.",
      consigne: "Deux colonnes, dans cet ordre : le prénom, puis la date d'inscription.",
      solution: "SELECT prenom, date_inscription FROM clients ORDER BY date_inscription",
      comparer: { ordonne: { cles: [1] } },
      piste: "La leçon vient d'expliquer comment trier du plus petit au plus grand : pensez à la colonne qui contient la date.",
      clause: "ORDER BY",
      exemple: "SELECT nom, prix FROM produits ORDER BY prix; trie les produits du moins cher au plus cher.",
      explication: "ORDER BY date_inscription trie les clients du plus ancien (la date la plus petite) au plus récent, puisqu'une date écrite en AAAA-MM-JJ se compare correctement comme du texte. Sans ORDER BY, les lignes seraient renvoyées dans un ordre qui ne dépend que de la base, pas de la date.",
      retenir: "ORDER BY colonne trie du plus petit au plus grand ; les dates au format AAAA-MM-JJ se trient correctement comme du texte."
    },
    {
      id: "p1-17", type: "corriger",
      niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 2,
      titre: "L'informatique, du plus cher au moins cher",
      question: "Affichez le nom et le prix des produits de la catégorie Informatique (categorie_id = 1), du plus cher au moins cher.",
      consigne: "Deux colonnes, dans cet ordre : le nom, puis le prix.",
      depart: "SELECT nom, prix FROM produits WHERE categorie_id = 1 ORDER BY prix",
      solution: "SELECT nom, prix FROM produits WHERE categorie_id = 1 ORDER BY prix DESC, id",
      comparer: { ordonne: { cles: [1] } },
      piste: "Exécutez la requête de départ : les bons produits sortent-ils, mais dans le bon sens ?",
      clause: "ORDER BY",
      exemple: "ORDER BY prix trie en ordre croissant ; ORDER BY prix DESC inverse ce sens.",
      explication: "ORDER BY prix (sans DESC) trie du moins cher au plus cher : l'inverse de ce que demande la consigne. Ajouter DESC inverse le sens du tri. Deux produits de cette catégorie partagent le même prix (449 €, le moniteur et la tablette) : la consigne ne demande pas de les départager, leur ordre relatif entre eux n'a donc pas d'importance.",
      retenir: "ORDER BY trie du plus petit au plus grand par défaut ; DESC inverse le sens du tri."
    },
    {
      id: "p1-18", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 2,
      titre: "Départager un ex æquo",
      question: "Deux produits coûtent exactement le même prix (449 €). Une requête les trie avec ORDER BY prix DESC. Que peut-on dire de leur ordre, entre eux, dans le résultat ?",
      options: [
        "Rien n'est garanti entre eux, sauf à ajouter une seconde colonne au tri (par exemple ORDER BY prix DESC, id)",
        "Ils sont toujours triés par ordre alphabétique de leur nom automatiquement",
        "SQLite refuse de trier une colonne qui contient des doublons",
        "Le plus récemment ajouté à la table passe toujours en premier"
      ],
      reponse: 0,
      piste: "ORDER BY prix ne connaît que le prix : il n'a aucune raison de préférer un produit à l'autre entre deux prix identiques.",
      clause: "ORDER BY",
      exemple: "ORDER BY prix DESC, id trie par prix, et départage les prix identiques par l'identifiant du produit.",
      explication: "ORDER BY prix DESC ne trie que sur le prix : entre deux lignes à égalité, aucun ordre n'est garanti. Pour un ordre garanti entre elles, il faut ajouter une seconde colonne de tri, qui ne compte que pour départager les égalités de la première.",
      retenir: "Sans seconde colonne de tri, l'ordre entre deux lignes à égalité n'est jamais garanti."
    },

    /* ── Palier 1, chapitre 6 : LIMIT et le piège des ex æquo ────────────────────────────────────────────────── */
    {
      id: "p1-19", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 2,
      titre: "Un podium à un seul ex æquo",
      question: "SELECT nom, prix FROM produits ORDER BY prix DESC LIMIT 1; doit afficher le produit le plus cher. Deux produits partagent pourtant le prix le plus élevé (1 299 €). Que se passe-t-il ?",
      options: [
        "La requête n'en affiche qu'un des deux, sans qu'on puisse garantir lequel : le tri ne les départage pas",
        "SQLite refuse d'exécuter la requête tant qu'il y a un ex æquo",
        "Les deux produits sont fusionnés en une seule ligne",
        "SQLite choisit toujours celui dont l'identifiant est le plus petit"
      ],
      reponse: 0,
      piste: "ORDER BY prix DESC trie seulement sur le prix : entre les deux produits à 1 299 €, rien ne les départage.",
      clause: "LIMIT",
      exemple: "ORDER BY prix DESC, id LIMIT 1 départagerait les deux produits par leur identifiant, et garantirait toujours le même résultat.",
      explication: "Le tri ORDER BY prix DESC ne départage pas les deux produits à 1 299 €. LIMIT 1 coupe pile entre eux : l'un des deux sort, l'autre non, sans qu'aucune règle du tri ne décide lequel. Le résultat n'est donc pas garanti d'une exécution à l'autre.",
      retenir: "LIMIT qui coupe un groupe de lignes à égalité sur le tri ne garantit pas laquelle sort : il faut un tri qui les départage toutes."
    },
    {
      id: "p1-20", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Les trois produits les moins chers",
      question: "Affichez le nom et le prix des trois produits les moins chers de la boutique.",
      consigne: "Deux colonnes, dans cet ordre : le nom, puis le prix.",
      solution: "SELECT nom, prix FROM produits ORDER BY prix LIMIT 3",
      comparer: { ordonne: { cles: [1] } },
      piste: "ORDER BY trie, LIMIT coupe après : combinez les deux, dans cet ordre.",
      clause: "LIMIT",
      exemple: "ORDER BY prix DESC LIMIT 1 afficherait le produit le plus cher (ambigu ici, voir la leçon) ; sans DESC, c'est le moins cher.",
      explication: "ORDER BY prix trie du moins cher au plus cher ; LIMIT 3 garde les trois premières lignes de ce tri, donc les trois moins chers. Ici, aucun ex æquo ne tombe entre le troisième et le quatrième moins cher (9,50 € puis 9,75 €) : le résultat est sans ambiguïté.",
      retenir: "LIMIT n garde les n premières lignes après le tri : vérifiez toujours qu'aucun ex æquo ne tombe juste à la coupure."
    },
    {
      id: "p1-21", type: "corriger",
      niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Les moins chers, mais seulement en cuisine",
      question: "Affichez le nom et le prix des deux produits les moins chers de la catégorie Cuisine (categorie_id = 3).",
      consigne: "Deux colonnes, dans cet ordre : le nom, puis le prix.",
      depart: "SELECT nom, prix FROM produits ORDER BY prix LIMIT 2",
      solution: "SELECT nom, prix FROM produits WHERE categorie_id = 3 ORDER BY prix LIMIT 2",
      comparer: { ordonne: { cles: [1] } },
      piste: "Combien de produits la requête de départ trie-t-elle : seulement ceux de la catégorie Cuisine, ou tous les produits de la boutique ?",
      clause: "LIMIT",
      exemple: "WHERE categorie_id = 3 doit venir avant ORDER BY et LIMIT, pour qu'ils ne travaillent que sur les produits de cette catégorie.",
      explication: "La requête de départ trie et limite TOUS les produits de la boutique, sans jamais les restreindre à la catégorie Cuisine : elle renvoie les deux produits les moins chers de toute la boutique, pas de cette catégorie. Il manque le filtre WHERE categorie_id = 3, qui doit s'appliquer avant que le tri et le LIMIT n'aient leur mot à dire.",
      retenir: "LIMIT ne garde que le début du résultat déjà filtré et trié : un filtre manquant se répercute silencieusement sur ce qui sort en tête."
    },
    {
      id: "p1-22", type: "predire",
      niveau: "P1", competence: "lire-filtrer", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Une catégorie sans aucun produit",
      question: "Sans l'exécuter : combien de lignes cette requête renvoie-t-elle ?",
      requete: "SELECT nom FROM produits WHERE categorie_id = 7 LIMIT 5;",
      predit: "nbLignes",
      zeroLigneAttendu: "La catégorie Jardin (id 7) n'a aucun produit dans le seed : l'exercice enseigne que LIMIT sur un résultat déjà vide reste vide, ce n'est pas une erreur.",
      piste: "Combien de produits appartiennent à la catégorie 7 (Jardin) ?",
      clause: "LIMIT",
      exemple: "LIMIT ne peut jamais ajouter de lignes : il ne fait que couper un résultat qui existe déjà.",
      explication: "Aucun produit n'appartient à la catégorie Jardin (categorie_id = 7) : le résultat, avant même le LIMIT, est déjà vide. LIMIT 5 demande au plus 5 lignes, mais ne peut pas en inventer : le résultat reste à 0 ligne.",
      retenir: "LIMIT ne fait que couper un résultat déjà là : il ne peut jamais produire plus de lignes qu'il n'en existait avant lui."
    },

    /* ── Palier 1, chapitre 7 : DISTINCT ──────────────────────────────────────────────────────────────────────── */
    {
      id: "p1-23", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Les statuts de commande, sans répétition",
      question: "Affichez, sans répétition, les différents statuts de commande utilisés dans la boutique.",
      consigne: "Une colonne : le statut.",
      solution: "SELECT DISTINCT statut FROM commandes",
      comparer: {},
      piste: "DISTINCT, appliqué à une seule colonne, retire les doublons de valeur.",
      clause: "DISTINCT",
      exemple: "SELECT DISTINCT ville FROM clients; affiche chaque ville une seule fois, même si plusieurs clients y habitent.",
      explication: "SELECT DISTINCT statut FROM commandes lit les 70 commandes mais ne garde qu'un exemplaire de chaque statut différent : en_preparation, expediee, livree, annulee et retournee, soit 5 lignes.",
      retenir: "SELECT DISTINCT colonne ne garde qu'un exemplaire de chaque valeur différente."
    },
    {
      id: "p1-24", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "DISTINCT et les valeurs manquantes",
      question: "Quatre clients n'ont pas de ville connue (NULL). Que fait SELECT DISTINCT ville FROM clients; avec ces quatre lignes ?",
      options: [
        "Il les regroupe en une seule ligne NULL, comme pour toute autre valeur répétée",
        "Il les ignore complètement : elles n'apparaissent jamais dans le résultat",
        "Il affiche les quatre lignes NULL séparément",
        "Il provoque une erreur, NULL n'étant pas une valeur"
      ],
      reponse: 0,
      piste: "DISTINCT traite NULL comme n'importe quelle autre valeur répétée : il la fusionne, il ne la supprime pas.",
      clause: "DISTINCT",
      exemple: "SELECT DISTINCT ville FROM clients; renvoie une ligne NULL en plus des villes, une seule fois, même si 4 clients n'ont pas de ville.",
      explication: "DISTINCT regroupe les lignes qui ont la même valeur, NULL compris : les clients sans ville connue forment un seul groupe NULL, qui apparaît comme une seule ligne dans le résultat, exactement comme Lyon ou Nantes n'apparaissent qu'une fois chacune.",
      retenir: "DISTINCT regroupe aussi les NULL entre eux, comme n'importe quelle autre valeur répétée."
    },
    {
      id: "p1-25", type: "predire",
      niveau: "P1", competence: "lire-filtrer", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Les catégories réellement utilisées",
      question: "Sans l'exécuter : combien de lignes renvoie cette requête ?",
      requete: "SELECT DISTINCT categorie_id FROM produits;",
      predit: "nbLignes",
      piste: "Combien de catégories différentes ont au moins un produit ? (La catégorie Jardin n'en a aucun.)",
      clause: "DISTINCT",
      exemple: "7 catégories existent dans la table categories, mais DISTINCT categorie_id porte sur produits, qui n'utilise pas forcément toutes les catégories.",
      explication: "Les produits couvrent les catégories 1 à 6 (Informatique à Jouets) ; aucun produit n'appartient à la catégorie 7 (Jardin). DISTINCT categorie_id FROM produits ne renvoie donc que 6 valeurs différentes, pas 7.",
      retenir: "DISTINCT porte sur les valeurs réellement présentes dans la table interrogée, pas sur toutes les valeurs possibles ailleurs."
    },

    /* ── Palier 1, chapitre 8 : alias et colonnes calculées — piège P8 effleuré ──────────────────────────────── */
    {
      id: "p1-26", type: "requete",
      niveau: "P1", competence: "lire-filtrer", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le montant de chaque ligne de la commande 1038",
      question: "Pour chaque ligne de la commande 1038, affichez l'identifiant du produit et le montant de la ligne (quantité multipliée par le prix unitaire).",
      consigne: "Deux colonnes, dans cet ordre : l'identifiant du produit, puis le montant de la ligne (nommé comme vous voulez).",
      solution: "SELECT produit_id, quantite * prix_unitaire AS montant FROM lignes_commande WHERE commande_id = 1038",
      comparer: {},
      pieges: ["P8"],
      piste: "Une expression comme quantite * prix_unitaire peut s'écrire directement après SELECT, comme une colonne.",
      clause: "AS",
      exemple: "SELECT produit_id, quantite * prix_unitaire AS total_ligne FROM lignes_commande WHERE commande_id = 1038;",
      explication: "quantite * prix_unitaire calcule le montant de chaque ligne ; AS montant lui donne un nom pour l'affichage. Le nom choisi n'a aucune importance pour la correction : seule la valeur compte.",
      retenir: "Une expression calculée peut figurer dans un SELECT comme une colonne ordinaire ; AS lui donne un nom lisible."
    },
    {
      id: "p1-27", type: "corriger",
      niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Le détail de la commande 1043, du plus gros montant au plus petit",
      question: "Pour chaque ligne de la commande 1043, affichez l'identifiant du produit et le montant de la ligne (quantité multipliée par le prix unitaire), du montant le plus élevé au plus faible.",
      consigne: "Deux colonnes, dans cet ordre : l'identifiant du produit, puis le montant de la ligne.",
      depart: "SELECT produit_id, quantite * prix_unitaire AS montant FROM lignes_commande WHERE commande_id = 1043 ORDER BY montant",
      solution: "SELECT produit_id, quantite * prix_unitaire AS montant FROM lignes_commande WHERE commande_id = 1043 ORDER BY montant DESC",
      comparer: { ordonne: { cles: [1] } },
      piste: "Exécutez la requête de départ : les bonnes lignes sortent-elles, mais dans le bon sens ?",
      clause: "ORDER BY",
      exemple: "ORDER BY peut trier directement sur le nom donné par AS, pas seulement sur une colonne de la table.",
      explication: "La requête de départ trie montant du plus petit au plus grand : l'inverse de ce que demande la consigne. ORDER BY montant DESC inverse le sens du tri, et fonctionne très bien sur une colonne calculée nommée par AS, exactement comme sur une colonne ordinaire.",
      retenir: "ORDER BY peut trier sur une colonne calculée nommée par AS, pas seulement sur une colonne de la table."
    },
    {
      id: "p1-28", type: "qcm",
      niveau: "P1", competence: "lire-filtrer", categorie: "Comprendre", difficulte: 1,
      titre: "Le nom donné par AS compte-t-il ?",
      question: "Vous écrivez SELECT quantite * prix_unitaire AS cout alors que la correction attend AS montant. Votre requête est-elle refusée pour ça ?",
      options: [
        "Non : le nom d'une colonne n'est jamais vérifié par défaut, seule sa valeur et sa position comptent",
        "Oui : le nom de chaque colonne doit correspondre exactement à celui de la solution",
        "Oui, mais seulement pour les colonnes calculées avec AS",
        "Non, mais la requête s'exécute plus lentement avec un autre nom"
      ],
      reponse: 0,
      piste: "Repensez au tout premier exercice du palier : l'ordre des colonnes comptait, mais rien n'était dit sur leur nom.",
      clause: "AS",
      exemple: "AS cout, AS montant ou l'absence d'alias donnent trois requêtes différentes à l'écriture, mais acceptées de la même façon si leurs valeurs sont justes.",
      explication: "Le nom d'une colonne (donné par AS, ou par défaut) n'est vérifié que si l'exercice l'exige explicitement — ce qui n'est jamais le cas dans ce palier. AS sert à rendre une colonne calculée lisible pour vous, pas à satisfaire la correction.",
      retenir: "Le nom d'une colonne n'est vérifié que si l'exercice le demande explicitement ; par défaut, seules la position et la valeur comptent."
    }
  ]
};
/* Chapitres (Parcours, D050) : une leçon courte suivie des exercices qui l'appliquent, repris de CHAPITRES de Classe'R
   (Reference/classer-v2.html). Les exercices ne sont pas dupliqués : `exercices` cite leurs identifiants.
     { id, niveau (un id de PALIERS), titre, duree, resume,
       lecon: { intro, points: [...], exemple: { titre, code, resultat, commentaire }, astuce },
       exercices: [ids de CONTENU.exercices] }
   Chapitre 0 et palier 1 : lot 6. Le reste arrive un palier par lot (D002). */
const CHAPITRES = [
  {
    id: "ch-00", niveau: "P1", titre: "Comprendre une base, avant d'écrire une requête", duree: "6 min",
    resume: "Table, ligne, colonne, clé primaire, clé étrangère : le vocabulaire qui rend tout le reste compréhensible.",
    lecon: {
      intro: "Avant d'écrire la moindre requête, il faut comprendre à quoi ressemble une base de données. C'est le but de ce chapitre : aucune syntaxe SQL à retenir ici, seulement le vocabulaire et les quelques idées qui rendent tout le reste compréhensible.",
      points: [
        "Dans une base, chaque colonne a un type fixé pour toujours (un nombre, un texte, une date…) : il n'y a pas de mise en forme libre ni de cellule qui change de nature d'une ligne à l'autre, comme dans un tableur.",
        "Une table rassemble des enregistrements qui se ressemblent (les clients, les commandes…) : chaque ligne est un enregistrement, chaque colonne est un champ de cet enregistrement.",
        "La clé primaire identifie une ligne sans ambiguïté, même quand deux lignes se ressemblent : deux clients peuvent s'appeler Martin, ils n'ont jamais le même identifiant.",
        "Une clé étrangère est une colonne qui contient l'identifiant d'une ligne d'une autre table : c'est ce qui relie une commande à son client, par exemple.",
        "Une base sépare ses informations en plusieurs tables plutôt qu'un grand tableau : le nom d'un client n'est écrit qu'une fois, dans la table clients, jamais recopié dans chacune de ses commandes."
      ],
      exemple: {
        titre: "À quoi ressemble une table", code: "SELECT nom FROM categories;",
        resultat: "Informatique, Maison, Cuisine, Sport, Livres, Jouets, Jardin — sept lignes, une colonne.",
        commentaire: "La table categories n'a besoin de rien de plus pour exister. Vous écrirez vous-même une requête comme celle-ci très bientôt : ceci n'est qu'un aperçu, inutile de la retenir."
      },
      astuce: "Ouvrez « Schéma » dans le menu de gauche : vous y verrez les 5 tables de la boutique, leurs colonnes et comment elles se relient. Gardez-le ouvert pendant que vous lisez ce chapitre, et revenez-y chaque fois qu'un nom de table ou de colonne vous échappe."
    },
    exercices: ["ch0-01", "ch0-02", "ch0-03", "ch0-04", "ch0-05", "ch0-06"]
  },
  {
    id: "ch-p1-1", niveau: "P1", titre: "Choisir ses colonnes", duree: "5 min",
    resume: "SELECT et FROM : la requête la plus simple, celle qui lit une table en entier.",
    lecon: {
      intro: "Une requête SQL commence presque toujours par les mêmes deux mots : SELECT, pour dire quelles colonnes on veut, et FROM, pour dire dans quelle table les trouver.",
      points: [
        "SELECT colonne1, colonne2 choisit les colonnes à afficher, dans l'ordre où vous les écrivez.",
        "FROM table indique la table à lire : sans condition, toutes ses lignes sont renvoyées.",
        "SELECT * FROM table affiche toutes les colonnes, sans avoir à les nommer.",
        "Une requête se termine par un point-virgule, par habitude plus que par obligation : Requêt'R l'accepte avec ou sans pour une requête seule. Il devient obligatoire dès que vous en enchaînez plusieurs, et tous les outils SQL professionnels l'attendent — prenez l'habitude dès maintenant."
      ],
      exemple: {
        titre: "La requête la plus simple", code: "SELECT nom FROM categories;",
        resultat: "Informatique, Maison, Cuisine, Sport, Livres, Jouets, Jardin.",
        commentaire: "Une colonne, sept lignes : toutes les catégories de la boutique, dans l'ordre où elles sont rangées dans la table."
      },
      astuce: "SQL accepte aussi bien des minuscules que des majuscules pour SELECT et FROM. Ce cours les écrit en majuscules pour qu'elles se distinguent des noms de tables et de colonnes, pas parce que SQLite l'exige."
    },
    exercices: ["p1-01", "p1-02", "p1-03"]
  },
  {
    id: "ch-p1-2", niveau: "P1", titre: "Filtrer avec WHERE", duree: "6 min",
    resume: "Texte, nombres : garder seulement les lignes qui vérifient une condition.",
    lecon: {
      intro: "WHERE ajoute une condition : seules les lignes qui la vérifient sont gardées. Les autres disparaissent du résultat, elles ne sont pas juste masquées.",
      points: [
        "Un texte se compare entouré d'apostrophes : WHERE ville = 'Lyon'. Un nombre se compare sans rien autour : WHERE prix > 100.",
        "Les opérateurs de comparaison sont =, <>, <, >, <=, >= ; <> veut dire « différent de ».",
        "SQLite distingue les majuscules des minuscules dans un texte comparé avec = : 'Lyon' et 'lyon' ne sont pas égaux."
      ],
      exemple: {
        titre: "Filtrer sur un nombre", code: "SELECT nom, prix FROM produits WHERE prix > 100;",
        resultat: "6 lignes : les produits à plus de 100 €.",
        commentaire: "WHERE prix > 100 ne garde que les lignes où la colonne prix dépasse 100 ; les 24 autres produits disparaissent du résultat."
      },
      astuce: "Une virgule oubliée entre deux colonnes du SELECT produit presque toujours une erreur de syntaxe. Si un message d'erreur vous surprend, comptez vos virgules."
    },
    exercices: ["p1-04", "p1-05", "p1-06", "p1-07"]
  },
  {
    id: "ch-p1-3", niveau: "P1", titre: "Élargir le filtre", duree: "6 min",
    resume: "IN, BETWEEN, LIKE : trois façons d'élargir une condition WHERE au-delà d'une seule valeur.",
    lecon: {
      intro: "Trois façons d'élargir une condition WHERE : choisir parmi plusieurs valeurs, encadrer un nombre entre deux bornes, ou reconnaître un motif dans un texte.",
      points: [
        "IN (valeur1, valeur2, …) remplace une longue suite de OR : WHERE ville IN ('Lyon', 'Nantes') garde les deux villes en une seule condition.",
        "BETWEEN a AND b garde les valeurs comprises entre a et b, bornes incluses : WHERE prix BETWEEN 20 AND 50.",
        "LIKE compare un texte à un motif : % remplace n'importe quelle suite de caractères, y compris aucune. LIKE ne reconnaît de façon fiable que les lettres sans accent."
      ],
      exemple: {
        titre: "Plusieurs villes à la fois", code: "SELECT prenom, ville FROM clients WHERE ville IN ('Nice', 'Montpellier');",
        resultat: "3 lignes : deux clients de Nice, un de Montpellier.",
        commentaire: "IN (...) remplace ville = 'Nice' OR ville = 'Montpellier' : plus court, et plus facile à relire avec davantage de valeurs."
      },
      astuce: "LIKE 'A%' trouve un texte qui commence par A ; LIKE '%e' un texte qui finit par e ; LIKE '%an%' un texte qui contient an n'importe où."
    },
    exercices: ["p1-08", "p1-09", "p1-10", "p1-11"]
  },
  {
    id: "ch-p1-4", niveau: "P1", titre: "Les valeurs manquantes", duree: "6 min",
    resume: "NULL : ce que c'est, comment le tester, et le piège de <> qui l'oublie.",
    lecon: {
      intro: "Certaines informations ne sont pas renseignées : quatre clients n'ont pas de ville connue, par exemple. La base ne met pas un zéro ou un texte vide à la place — elle note qu'il n'y a rien du tout, avec NULL.",
      points: [
        "NULL signifie « aucune valeur » : ni zéro, ni texte vide, ni un mot qu'on pourrait comparer.",
        "On teste NULL avec IS NULL ou IS NOT NULL — jamais avec = NULL, qui ne renvoie jamais rien, même sur une ligne qui vaut NULL.",
        "<> (différent de) ignore silencieusement les lignes où la colonne comparée est NULL : elles ne sont ni égales ni différentes, SQLite ne les retient pas."
      ],
      exemple: {
        titre: "Trouver ce qui manque", code: "SELECT prenom FROM clients WHERE ville IS NULL;",
        resultat: "4 lignes : les clients dont la ville n'est pas renseignée.",
        commentaire: "ville IS NULL repère les lignes sans valeur ; ville = NULL, lui, ne renverrait jamais rien, même sur ces 4 lignes."
      },
      astuce: "Si une requête censée trouver des lignes manquantes renvoie toujours zéro résultat, vérifiez que vous n'avez pas écrit = NULL par réflexe : c'est l'erreur la plus fréquente sur ce piège."
    },
    exercices: ["p1-12", "p1-13", "p1-14", "p1-15"]
  },
  {
    id: "ch-p1-5", niveau: "P1", titre: "Trier avec ORDER BY", duree: "5 min",
    resume: "ASC, DESC, tri sur plusieurs colonnes : ranger les lignes du résultat.",
    lecon: {
      intro: "ORDER BY range les lignes du résultat selon une colonne, du plus petit au plus grand par défaut.",
      points: [
        "ORDER BY colonne trie du plus petit au plus grand (ordre croissant) ; ORDER BY colonne DESC trie à l'envers (ordre décroissant).",
        "On peut trier sur plusieurs colonnes à la fois, séparées par une virgule : la seconde ne décide que des lignes à égalité sur la première.",
        "ORDER BY ne change jamais les lignes elles-mêmes, seulement leur ordre d'affichage."
      ],
      exemple: {
        titre: "Du moins cher au plus cher", code: "SELECT nom, prix FROM produits WHERE categorie_id = 6 ORDER BY prix;",
        resultat: "Puzzle 1000 pièces (14,50), puis Jeu de société (29,00).",
        commentaire: "Deux jouets, triés du moins cher au plus cher. ORDER BY prix DESC inverserait l'ordre."
      },
      astuce: "Deux produits coûtent exactement 1 299 € (101 et 109) : un tri par seul prix ne dit pas lequel vient en premier entre les deux. Si l'ordre entre eux doit être garanti, ajoutez une seconde colonne au tri, comme l'identifiant."
    },
    exercices: ["p1-16", "p1-17", "p1-18"]
  },
  {
    id: "ch-p1-6", niveau: "P1", titre: "LIMIT et le piège des ex æquo", duree: "6 min",
    resume: "Couper un résultat après l'avoir trié — et pourquoi un tri incomplet rend LIMIT imprévisible.",
    lecon: {
      intro: "LIMIT n arrête le résultat aux n premières lignes — mais « premières » ne veut dire quelque chose que si le tri qui précède est total. Un tri incomplet rend LIMIT imprévisible.",
      points: [
        "LIMIT n garde seulement les n premières lignes du résultat, après le tri s'il y en a un.",
        "Si LIMIT coupe au milieu d'un groupe de lignes à égalité sur le tri, laquelle sort et laquelle reste n'est pas garanti.",
        "LIMIT sans ORDER BY n'a aucun sens fiable : « les 3 premières lignes » de quoi, si rien ne dit dans quel ordre elles arrivent ?"
      ],
      exemple: {
        titre: "Le produit le plus cher", code: "SELECT nom, prix FROM produits ORDER BY prix DESC LIMIT 1;",
        resultat: "Un seul produit — mais deux produits partagent le prix le plus élevé (1 299 €) !",
        commentaire: "ORDER BY prix DESC LIMIT 1 renvoie l'un des deux : rien dans le tri ne garantit lequel."
      },
      astuce: "Si votre requête utilise LIMIT, demandez-vous toujours : le tri qui précède départage-t-il bien toutes les lignes, ou reste-t-il un ex æquo pile à la coupure ?"
    },
    exercices: ["p1-19", "p1-20", "p1-21", "p1-22"]
  },
  {
    id: "ch-p1-7", niveau: "P1", titre: "DISTINCT", duree: "5 min",
    resume: "Retirer les doublons d'un résultat, NULL compris.",
    lecon: {
      intro: "DISTINCT retire les doublons d'un résultat : si plusieurs lignes donnent la même valeur, une seule apparaît.",
      points: [
        "SELECT DISTINCT colonne ne garde qu'un exemplaire de chaque valeur différente.",
        "DISTINCT peut porter sur plusieurs colonnes à la fois : seules les combinaisons de valeurs identiques sur toutes sont fusionnées.",
        "Si la colonne contient NULL, DISTINCT le regroupe lui aussi en un seul exemplaire, comme n'importe quelle autre valeur."
      ],
      exemple: {
        titre: "Les villes représentées", code: "SELECT DISTINCT ville FROM clients;",
        resultat: "Une ligne par ville différente, NULL comprise une seule fois.",
        commentaire: "40 clients, mais bien moins de villes différentes : DISTINCT retire les répétitions."
      },
      astuce: "DISTINCT colonne1, colonne2 ne fusionne que les lignes identiques sur LES DEUX colonnes à la fois : ce n'est pas deux DISTINCT indépendants."
    },
    exercices: ["p1-23", "p1-24", "p1-25"]
  },
  {
    id: "ch-p1-8", niveau: "P1", titre: "Alias et colonnes calculées", duree: "6 min",
    resume: "Une expression calculée dans un SELECT, nommée avec AS — et tout le palier mis ensemble.",
    lecon: {
      intro: "Une colonne peut être le résultat d'un calcul, pas seulement une colonne de la table : AS lui donne alors un nom lisible.",
      points: [
        "Une expression comme quantite * prix_unitaire peut figurer dans un SELECT, comme une colonne ordinaire.",
        "AS alias donne un nom à cette colonne calculée : sans lui, SQLite en invente un, souvent peu lisible.",
        "Le nom donné par AS n'est qu'un habillage : la correction ne regarde jamais le nom d'une colonne, sauf si l'exercice le demande explicitement — seulement sa position et sa valeur."
      ],
      exemple: {
        titre: "Une colonne calculée", code: "SELECT produit_id, quantite, prix_unitaire, quantite * prix_unitaire AS total_ligne FROM lignes_commande WHERE commande_id = 1038;",
        resultat: "4 lignes ; total_ligne vaut 34, 29, 25 puis 14.",
        commentaire: "total_ligne n'existe dans aucune table : c'est le résultat d'un calcul, affiché comme une colonne ordinaire grâce à AS. Le total de cette commande (102 €, avant frais de port) est la somme de ces quatre lignes."
      },
      astuce: "AS est facultatif, mais vivement conseillé dès qu'une colonne est calculée : sans lui, SQLite invente un nom de colonne souvent peu lisible."
    },
    exercices: ["p1-26", "p1-27", "p1-28"]
  }
];

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
  "SELECT": { syntaxe: "SELECT colonne1, colonne2 FROM table", aide: "choisit les colonnes à afficher, dans l'ordre demandé" },
  "FROM": { syntaxe: "SELECT … FROM table", aide: "indique la table à lire" },
  "WHERE": { syntaxe: "SELECT … FROM table WHERE condition", aide: "garde seulement les lignes pour lesquelles la condition est vraie" },
  "IN": { syntaxe: "… WHERE colonne IN (valeur1, valeur2, …)", aide: "garde les lignes dont la colonne vaut l'une des valeurs listées" },
  "BETWEEN": { syntaxe: "… WHERE colonne BETWEEN a AND b", aide: "garde les lignes dont la colonne est comprise entre a et b, bornes incluses" },
  "LIKE": { syntaxe: "… WHERE colonne LIKE 'motif%'", aide: "garde les lignes dont le texte correspond au motif (% remplace n'importe quelle suite de caractères) ; limité aux lettres sans accent" },
  "IS NULL": { syntaxe: "… WHERE colonne IS NULL", aide: "garde les lignes où la colonne n'a aucune valeur ; = ne fonctionne jamais avec NULL" },
  "ORDER BY": { syntaxe: "SELECT … FROM table ORDER BY colonne [ASC | DESC]", aide: "trie le résultat : ASC du plus petit au plus grand (par défaut), DESC du plus grand au plus petit" },
  "LIMIT": { syntaxe: "SELECT … FROM table LIMIT n", aide: "arrête le résultat aux n premières lignes, après le tri s'il y en a un" },
  "DISTINCT": { syntaxe: "SELECT DISTINCT colonne FROM table", aide: "ne garde qu'un exemplaire de chaque valeur : les doublons sont retirés" },
  "AS": { syntaxe: "SELECT expression AS alias", aide: "donne un nom à une colonne calculée ou renommée, pour la lire plus facilement" },
  "GROUP BY": { syntaxe: "SELECT colonne, COUNT(*) FROM table GROUP BY colonne", aide: "regroupe les lignes qui ont la même valeur, pour calculer une valeur par groupe" },
  "LEFT JOIN": { syntaxe: "… FROM a LEFT JOIN b ON b.cle = a.id", aide: "garde toutes les lignes de a, même sans correspondance dans b (les colonnes de b valent alors NULL)" },
  "COUNT": { syntaxe: "COUNT(*) ou COUNT(colonne)", aide: "COUNT(*) compte les lignes ; COUNT(colonne) ne compte que les valeurs renseignées (non NULL)" }
};

/* Vocabulaire du Lexique (lot 6) : les mots qu'il faut comprendre avant de lire CLAUSES. Le chapitre 0 les
   enseigne un par un ; le Lexique les regroupe pour qu'on puisse les retrouver sans rouvrir la leçon. */
const VOCABULAIRE = {
  "table": "Une collection de lignes qui partagent les mêmes colonnes : clients, produits, commandes… Chaque table a un nom et une structure fixe.",
  "ligne": "Une entrée d'une table : un client, une commande, un produit. On dit aussi « enregistrement ».",
  "colonne": "Une information que porte chaque ligne d'une table, toujours du même type (un nombre, un texte, une date…). On dit aussi « champ ».",
  "clé primaire": "La colonne (ou la combinaison de colonnes) qui identifie une ligne sans ambiguïté : deux lignes d'une table n'ont jamais la même clé primaire.",
  "clé étrangère": "Une colonne qui contient l'identifiant d'une ligne d'une autre table : c'est ce qui relie deux tables entre elles (par exemple, client_id dans commandes).",
  "NULL": "L'absence de valeur : ni zéro, ni texte vide, ni un mot. Se teste avec IS NULL ou IS NOT NULL, jamais avec =.",
  "doublon": "Deux lignes identiques dans un résultat. DISTINCT les retire ; sans lui, elles sont toutes comptées.",
  "requête": "Une instruction écrite en SQL qui décrit le résultat voulu (quelles colonnes, quelles lignes, dans quel ordre…), sans dire comment l'obtenir : c'est SQLite qui s'en charge.",
  "résultat": "Le tableau que renvoie une requête : des colonnes, et une ligne par enregistrement qui correspond à la demande."
};

/* Fiches de clause (remplace les fiches de fonction Excel de Classe'R, DECISIONS.md « Remplacé »), ouvertes
   depuis le Lexique (#/fiche/<clause>) : à quoi ça sert, dans quel contexte y penser, l'erreur fréquente, les
   clauses liées. Un palier à la fois (D002) : seules les 11 clauses du palier 1 ont leur fiche pour l'instant ;
   `voirAussi` ne cite donc jamais une clause qui n'en a pas encore. `entrainements` est posé vide : la
   structure existe (reprise de Classe'R, Reference/classer-v2.html:4427), son contenu est délibérément
   différé après le palier 2 (DECISIONS.md D055) pour juger s'il apporte quelque chose que les exercices
   n'apportent pas déjà. */
const FICHES = {
  "SELECT": {
    but: "Choisir les colonnes à afficher dans le résultat, et dans quel ordre.",
    contexte: "C'est le premier mot de toute requête : vous l'écrivez avant même de savoir sur quelle table vous allez lire. SELECT * affiche toutes les colonnes sans avoir à les nommer, utile pour une première exploration.",
    erreur: "Oublier une virgule entre deux colonnes : SQLite comprend alors la seconde comme un second nom donné à la première (un alias), ce qui produit une erreur de syntaxe ou un résultat inattendu selon ce qui suit.",
    voirAussi: ["FROM", "AS", "DISTINCT"],
    entrainements: []
  },
  "FROM": {
    but: "Indiquer la table que la requête va lire.",
    contexte: "FROM suit toujours SELECT : sans lui, SQLite ne sait pas où chercher les colonnes demandées. Une requête peut lire plusieurs tables à la fois (vous le verrez au palier 3, avec JOIN), mais au palier 1 une seule table suffit.",
    erreur: "Écrire le nom d'une table qui n'existe pas, ou mal orthographié : SQLite répond « no such table », pas une liste vide.",
    voirAussi: ["SELECT", "WHERE"],
    entrainements: []
  },
  "WHERE": {
    but: "Garder seulement les lignes qui vérifient une condition ; les autres disparaissent du résultat.",
    contexte: "Dès que vous ne voulez pas TOUTES les lignes d'une table, WHERE s'impose : un client d'une ville précise, un produit au-dessus d'un certain prix, une commande à un statut donné.",
    erreur: "Comparer une valeur manquante avec = : WHERE colonne = NULL ne renvoie jamais rien, même sur les lignes qui valent NULL. Il faut IS NULL.",
    voirAussi: ["IS NULL", "IN", "BETWEEN", "LIKE"],
    entrainements: []
  },
  "ORDER BY": {
    but: "Trier les lignes du résultat selon une ou plusieurs colonnes.",
    contexte: "Sans ORDER BY, l'ordre des lignes n'est garanti par rien : il peut changer d'une requête à l'autre. Dès qu'un classement a un sens (du plus récent au plus ancien, du moins cher au plus cher), ORDER BY le rend explicite.",
    erreur: "Oublier qu'ORDER BY trie du plus petit au plus grand par défaut : sans DESC, un classement « du plus cher au moins cher » sort à l'envers.",
    voirAussi: ["LIMIT"],
    entrainements: []
  },
  "LIMIT": {
    but: "Arrêter le résultat aux n premières lignes, après le tri s'il y en a un.",
    contexte: "Utile pour un classement (le produit le plus cher, les trois derniers clients inscrits) une fois le tri posé par ORDER BY.",
    erreur: "Utiliser LIMIT sans un tri qui départage totalement les lignes : si plusieurs lignes sont à égalité pile à la coupure, laquelle sort n'est pas garanti.",
    voirAussi: ["ORDER BY"],
    entrainements: []
  },
  "DISTINCT": {
    but: "Ne garder qu'un exemplaire de chaque valeur différente ; les doublons sont retirés.",
    contexte: "Utile pour répondre à « quelles villes, quels statuts, quelles catégories apparaissent », sans se soucier de combien de lignes portent chaque valeur.",
    erreur: "Croire que DISTINCT ignore les NULL : il les regroupe au contraire en un seul exemplaire, comme n'importe quelle autre valeur répétée.",
    voirAussi: ["SELECT"],
    entrainements: []
  },
  "AS": {
    but: "Donner un nom à une colonne calculée ou renommée, pour la lire plus facilement.",
    contexte: "Dès qu'une colonne du résultat n'est pas directement une colonne de la table — un calcul comme quantite * prix_unitaire — SQLite lui invente un nom souvent peu lisible : AS en choisit un vous-même.",
    erreur: "Croire que le nom choisi par AS compte pour la correction d'un exercice : par défaut, seule la valeur et la position d'une colonne sont vérifiées, jamais son nom.",
    voirAussi: ["SELECT", "ORDER BY"],
    entrainements: []
  },
  "IN": {
    but: "Garder les lignes dont une colonne vaut l'une des valeurs listées.",
    contexte: "Remplace une longue suite de conditions séparées par OR : WHERE ville IN ('Lyon', 'Nantes') plutôt que ville = 'Lyon' OR ville = 'Nantes'.",
    erreur: "Oublier les parenthèses autour de la liste de valeurs : IN 'Lyon', 'Nantes' (sans parenthèses) est une erreur de syntaxe.",
    voirAussi: ["WHERE", "BETWEEN"],
    entrainements: []
  },
  "BETWEEN": {
    but: "Garder les lignes dont une colonne est comprise entre deux bornes, les deux bornes incluses.",
    contexte: "Pratique pour un prix, une date ou une note : BETWEEN 20 AND 50, BETWEEN '2026-01-01' AND '2026-03-31'.",
    erreur: "Oublier que les deux bornes sont incluses : BETWEEN 20 AND 50 garde aussi une ligne qui vaut exactement 20 ou exactement 50.",
    voirAussi: ["WHERE", "IN"],
    entrainements: []
  },
  "LIKE": {
    but: "Comparer un texte à un motif, où % remplace n'importe quelle suite de caractères (y compris aucune).",
    contexte: "Utile pour chercher un début, une fin ou un fragment de texte : LIKE 'A%' commence par A, LIKE '%e' finit par e.",
    erreur: "Compter sur LIKE pour reconnaître un texte accentué : SQLite ne gère que l'ASCII pour LIKE, comme pour UPPER et LOWER. Une comparaison exacte (=) reste plus sûre pour un mot accentué.",
    voirAussi: ["WHERE", "IN"],
    entrainements: []
  },
  "IS NULL": {
    but: "Repérer les lignes où une colonne n'a aucune valeur.",
    contexte: "NULL n'est ni zéro, ni texte vide, ni un mot : aucune comparaison avec = ne le trouve, pas même = NULL. IS NULL (et IS NOT NULL) sont les seules façons correctes de le tester.",
    erreur: "Utiliser <> pour exclure une valeur en pensant que les lignes NULL seront exclues aussi : <> ignore silencieusement les lignes NULL, qui ne sont alors ni gardées ni explicitement écartées.",
    voirAussi: ["WHERE"],
    entrainements: []
  }
};
