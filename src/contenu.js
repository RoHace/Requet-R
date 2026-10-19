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
    },

    /* ── Palier 2 (lot 7) : COUNT/SUM/AVG/MIN/MAX, GROUP BY, HAVING, CASE WHEN, fonctions de date ──────────── */
    {
      id: "p2-01", type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 1,
      titre: "Ce que change GROUP BY",
      question: "Une requête calcule une moyenne pour toute la table, en une seule ligne de résultat. Vous ajoutez GROUP BY ville. Qu'est-ce qui change ?",
      options: [
        "Le résultat contient désormais une ligne par ville, chacune avec sa propre moyenne",
        "Le résultat reste une seule ligne, mais ne porte plus que sur la première ville trouvée",
        "GROUP BY trie le résultat par ville, sans changer le nombre de lignes",
        "GROUP BY renvoie une erreur si la colonne ville contient des valeurs NULL"
      ],
      reponse: 0,
      piste: "Repensez à la leçon : une fonction d'agrégat renvoie une ligne par groupe, pas une ligne par table.",
      clause: "GROUP BY",
      exemple: "SELECT statut, COUNT(*) FROM commandes GROUP BY statut; renvoie une ligne par statut, chacune avec son propre compte.",
      explication: "GROUP BY ville sépare les lignes en autant de groupes que de villes différentes (NULL compris, qui forme son propre groupe) ; la moyenne — ou toute autre fonction d'agrégat du SELECT — est alors recalculée séparément pour chaque groupe, qui devient une ligne du résultat. Sans GROUP BY, il n'existait qu'un seul groupe : la table entière.",
      retenir: "GROUP BY colonne transforme un seul résumé global en un résumé par groupe : une ligne de résultat par valeur différente de la colonne."
    },
    {
      id: "p2-02", type: "predire",
      niveau: "P2", competence: "agreger", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Une seule ligne, quoi qu'il arrive",
      question: "Sans l'exécuter : combien de LIGNES cette requête renvoie-t-elle ?",
      requete: "SELECT COUNT(*) FROM clients;",
      predit: "nbLignes",
      piste: "COUNT(*) est une fonction d'agrégat ; sans GROUP BY, combien de groupes existe-t-il dans toute la table ?",
      clause: "COUNT",
      exemple: "SELECT AVG(prix) FROM produits; renvoie elle aussi une seule ligne, quel que soit le nombre de produits dans la table.",
      explication: "Une fonction d'agrégat sans GROUP BY résume TOUTE la table en un seul groupe : quel que soit le nombre de lignes de clients (ici 40), le résultat tient toujours sur une seule ligne, celle du résumé. Le nombre affiché par COUNT(*) (40) n'est pas le nombre de lignes du RÉSULTAT : c'est la valeur qu'il contient.",
      retenir: "Sans GROUP BY, une fonction d'agrégat renvoie toujours exactement une ligne, quelle que soit la taille de la table résumée."
    },
    {
      id: "p2-03", type: "requete",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le nombre total de commandes",
      question: "Combien de commandes la boutique a-t-elle enregistrées, en tout ?",
      consigne: "Une seule valeur : le nombre total de commandes.",
      solution: "SELECT COUNT(*) FROM commandes",
      comparer: {},
      piste: "COUNT(*) compte les lignes d'une table, sans se soucier de leur contenu.",
      clause: "COUNT",
      exemple: "SELECT COUNT(*) FROM produits; compte les 30 produits du catalogue.",
      explication: "COUNT(*) compte toutes les lignes de la table commandes, quelle que soit la valeur de leurs colonnes : 70.",
      retenir: "COUNT(*) compte les lignes d'une table (ou d'un résultat filtré par WHERE), sans regarder leur contenu."
    },
    {
      id: "p2-04", type: "corriger",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Combien de clients ont renseigné leur ville ?",
      question: "Combien de clients ont une ville renseignée ?",
      consigne: "Une seule valeur : le nombre de clients dont la ville n'est pas manquante.",
      depart: "SELECT COUNT(*) FROM clients",
      solution: "SELECT COUNT(ville) FROM clients",
      comparer: {},
      pieges: ["P3"],
      piste: "COUNT(*) compte les lignes, pas les valeurs d'une colonne précise : il compte aussi les clients dont la ville est manquante.",
      clause: "COUNT",
      exemple: "SELECT COUNT(note) FROM commandes; compte les commandes qui ont une note, pas toutes les commandes.",
      explication: "COUNT(*) compte les lignes de la table, quelle que soit leur contenu : il renvoie 40, le nombre total de clients, NULL compris. COUNT(ville) ne compte que les lignes où ville n'est pas NULL : il ignore les 4 clients (205, 211, 223, 230) dont la ville est manquante, et renvoie 36. Mettre une colonne précise entre les parenthèses change ce qui est compté.",
      retenir: "COUNT(*) compte les lignes ; COUNT(colonne) ne compte que les lignes où cette colonne n'est pas NULL. Les deux peuvent donner des résultats différents, et c'est souvent voulu de les comparer."
    },
    {
      id: "p2-05", type: "corriger",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Combien de clients ont une ville, peu importe laquelle",
      question: "Combien de clients ont une ville renseignée, peu importe laquelle ?",
      consigne: "Une seule valeur : le nombre de clients dont la ville n'est pas manquante.",
      depart: "SELECT COUNT(DISTINCT ville) FROM clients",
      solution: "SELECT COUNT(ville) FROM clients",
      comparer: {},
      pieges: ["P3"],
      piste: "COUNT(DISTINCT colonne) compte des VALEURS différentes, pas des LIGNES : deux clients de la même ville ne comptent qu'une fois.",
      clause: "COUNT",
      exemple: "SELECT COUNT(DISTINCT statut) FROM commandes; renvoie 5 : le nombre de statuts différents, pas le nombre de commandes.",
      explication: "COUNT(DISTINCT ville) ne compte que les villes DIFFÉRENTES, NULL ignoré comme toujours avec COUNT(colonne) : il y a 11 villes différentes dans la table, donc 11 — bien moins que les 36 clients qui ont réellement une ville renseignée. COUNT(ville), sans DISTINCT, compte chaque ligne non NULL une fois, même si plusieurs clients partagent la même ville : 36.",
      retenir: "COUNT(colonne) compte des lignes non NULL ; COUNT(DISTINCT colonne) compte des valeurs différentes. Les deux ignorent NULL, mais ne répondent pas à la même question."
    },
    {
      id: "p2-06", type: "predire",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Combien de clients ont un parrain",
      question: "Sans l'exécuter : quelle VALEUR renvoie cette requête ?",
      requete: "SELECT COUNT(parrain_id) FROM clients;",
      predit: "valeur",
      piste: "parrain_id est vide pour un client venu seul, sans parrain.",
      clause: "COUNT",
      exemple: "Dans la table clients, 40 lignes au total ; certaines colonnes ont des valeurs manquantes pour certains clients.",
      explication: "COUNT(parrain_id) ne compte que les clients dont parrain_id n'est pas NULL, c'est-à-dire ceux qui ont effectivement été parrainés : 9 sur 40. Les 31 autres sont venus seuls, parrain_id vide pour eux.",
      retenir: "COUNT(colonne) répond à « combien de lignes ont une valeur ici », pas à « combien de lignes au total »."
    },
    {
      id: "p2-07", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le nombre d'unités en stock, toutes références confondues",
      question: "Combien d'unités de produits reste-t-il en stock, en additionnant toutes les références du catalogue ?",
      consigne: "Une seule valeur : la somme du stock de tous les produits.",
      solution: "SELECT SUM(stock) FROM produits",
      comparer: {},
      piste: "SUM additionne une colonne numérique sur toutes les lignes concernées.",
      clause: "SUM",
      exemple: "SELECT SUM(prix) FROM produits; additionnerait les prix de tous les produits — un total qui n'a pas vraiment de sens commercial, mais qui montre comment SUM fonctionne.",
      explication: "SUM(stock) additionne la colonne stock de toutes les lignes de produits : 1 199 unités, tous produits confondus. Un seul produit (le tapis de bain, stock 0) n'y contribue pour rien, mais aucune ligne n'est ignorée pour autant — SUM(stock) les additionne toutes, y compris celles qui valent 0.",
      retenir: "SUM(colonne) additionne une colonne numérique sur toutes les lignes ; une valeur à 0 participe normalement à la somme, seul NULL serait ignoré."
    },
    {
      id: "p2-08", type: "corriger",
      niveau: "P2", competence: "agreger", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Le total de la commande 1038, et seulement elle",
      question: "Quel est le total des lignes de la commande 1038 (quantité × prix unitaire) ?",
      consigne: "Une seule valeur : le total de cette commande, avant frais de port.",
      depart: "SELECT SUM(quantite * prix_unitaire) FROM lignes_commande",
      solution: "SELECT SUM(quantite * prix_unitaire) FROM lignes_commande WHERE commande_id = 1038",
      comparer: {},
      piste: "Exécutez la requête de départ : le nombre obtenu est-il plausible pour UNE SEULE commande ?",
      clause: "WHERE",
      exemple: "SUM additionne TOUTES les lignes qu'on lui donne : sans filtre, c'est tout lignes_commande, pas une commande en particulier.",
      explication: "La requête de départ oublie le WHERE : SUM additionne les 142 lignes de TOUTES les commandes de la boutique, et renvoie 16 233,50 — un chiffre qui n'a plus rien à voir avec la commande 1038. SQLite ne signale aucune erreur, puisque la requête est parfaitement valide : elle calcule juste autre chose que ce qui est demandé. WHERE commande_id = 1038 restreint l'addition aux 4 lignes de cette seule commande, pour un total de 102,00 €.",
      retenir: "SUM (comme toute fonction d'agrégat) additionne exactement les lignes qu'on lui présente : un WHERE oublié ne provoque pas d'erreur, juste un résultat calculé sur le mauvais ensemble de lignes."
    },
    {
      id: "p2-09", type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 2,
      titre: "SUM et les valeurs manquantes",
      question: "La colonne note de commandes contient 38 valeurs NULL sur 70. Que fait SUM(note) de ces 38 lignes ?",
      options: [
        "Il les ignore complètement, comme s'il ne restait que les 32 lignes notées",
        "Il les compte comme des zéros dans la somme",
        "Il provoque une erreur dès qu'une seule valeur NULL est rencontrée",
        "Il arrête le calcul à la première valeur NULL rencontrée"
      ],
      reponse: 0,
      piste: "C'est le même comportement que COUNT(colonne) : une ligne NULL n'existe tout simplement pas pour la fonction.",
      clause: "SUM",
      exemple: "AVG(note) vaut 3,75 : si les NULL comptaient comme des zéros, la moyenne serait beaucoup plus basse.",
      explication: "SUM, comme COUNT(colonne), AVG, MIN et MAX, ignore purement et simplement les lignes NULL : elles ne participent pas au calcul, exactement comme si elles n'existaient pas. SUM(note) additionne uniquement les 32 notes réellement données (total 120), sans qu'aucun des 38 NULL ne compte pour 0.",
      retenir: "Toutes les fonctions d'agrégat (COUNT(colonne), SUM, AVG, MIN, MAX) ignorent les NULL ; aucune ne les traite comme des zéros."
    },
    {
      id: "p2-10", type: "requete",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Mise en pratique", difficulte: 1,
      titre: "La note moyenne des commandes notées",
      question: "Quelle est la note moyenne des commandes qui ont été notées ?",
      consigne: "Une seule valeur : la note moyenne.",
      solution: "SELECT AVG(note) FROM commandes",
      comparer: {},
      piste: "AVG calcule une moyenne ; demandez-vous sur combien de lignes elle porte vraiment.",
      clause: "AVG",
      exemple: "SELECT AVG(prix) FROM produits; donne le prix moyen du catalogue, 165,31 €.",
      explication: "AVG(note) ignore les 38 commandes sans note et calcule la moyenne des 32 notes restantes : 3,75. Le résultat ne dépend que des lignes effectivement notées, pas des 70 commandes de la table.",
      retenir: "AVG(colonne) fait la moyenne des valeurs non NULL seulement ; elle divise par le nombre de valeurs présentes, pas par le nombre total de lignes."
    },
    {
      id: "p2-11", type: "corriger",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Détection d'erreur", difficulte: 2,
      titre: "La même moyenne, calculée à la main",
      question: "Quelle est la note moyenne des commandes qui ont été notées ?",
      consigne: "Une seule valeur : la note moyenne.",
      depart: "SELECT SUM(note) / COUNT(*) FROM commandes",
      solution: "SELECT AVG(note) FROM commandes",
      comparer: {},
      pieges: ["P3"],
      piste: "COUNT(*) compte TOUTES les commandes, notées ou pas ; SUM(note), lui, n'additionne que les notes présentes. Diviser l'un par l'autre revient-il à faire une moyenne ?",
      clause: "AVG",
      exemple: "SUM(note) vaut 120 ; COUNT(*) vaut 70 ; 120 divisé par 70 ne fait pas 3,75.",
      explication: "SUM(note) additionne les 32 notes présentes (120), mais COUNT(*) compte les 70 commandes, notées ou non : diviser l'un par l'autre revient à répartir la somme des notes sur un nombre de lignes bien plus grand que celui qui a vraiment été noté, d'où un résultat écrasé (1, une fois la division entière de SQLite prise en compte) au lieu de 3,75. AVG(note) évite ce piège : elle divise par le nombre de notes réellement présentes (32), pas par le nombre total de lignes.",
      retenir: "AVG(colonne) n'est pas SUM(colonne) / COUNT(*) : AVG divise par le nombre de valeurs non NULL, COUNT(*) compte toutes les lignes sans distinction."
    },
    {
      id: "p2-12", type: "qcm",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Comprendre", difficulte: 2,
      titre: "Pourquoi AVG et SUM/COUNT(*) divergent",
      question: "Pourquoi AVG(note) (3,75) et SUM(note) divisé par COUNT(*) ne donnent-ils pas le même résultat sur la table commandes ?",
      options: [
        "Parce que COUNT(*) compte les 70 commandes, notées ou non, alors qu'AVG ne divise que par les 32 notes présentes",
        "Parce que SUM(note) commet une erreur d'arrondi que AVG évite",
        "Parce que COUNT(*) et SUM(note) ne portent pas sur la même table",
        "Parce qu'AVG trie les lignes avant de calculer la moyenne"
      ],
      reponse: 0,
      piste: "Combien de lignes COUNT(*) compte-t-il, et combien de notes SUM(note) additionne-t-il réellement ?",
      clause: "AVG",
      exemple: "70 commandes au total, mais seulement 32 notées : deux nombres différents, pour deux rôles différents.",
      explication: "COUNT(*) compte les 70 lignes de la table, notées ou pas ; SUM(note) n'additionne que les 32 notes réellement présentes (120). AVG(note), elle, calcule exactement 120 ÷ 32 = 3,75 : elle divise par le nombre de valeurs qu'elle a additionnées, pas par le nombre de lignes de la table. SUM(note) / COUNT(*) divise par le mauvais nombre.",
      retenir: "AVG(colonne) = SUM(colonne) / COUNT(colonne), jamais / COUNT(*), dès qu'il existe des NULL dans la colonne."
    },
    {
      id: "p2-13", type: "predire",
      niveau: "P2", competence: "valeurs-manquantes", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Combien de commandes n'ont pas été notées",
      question: "Sans l'exécuter : quelle VALEUR renvoie cette requête ?",
      requete: "SELECT COUNT(*) - COUNT(note) FROM commandes;",
      predit: "valeur",
      piste: "COUNT(*) compte tout ; COUNT(note) ne compte que les notes présentes. La différence, c'est ce qui manque.",
      clause: "COUNT",
      exemple: "70 commandes en tout, 32 notées : il en manque le reste.",
      explication: "COUNT(*) vaut 70 (toutes les commandes) ; COUNT(note) vaut 32 (seulement celles qui ont une note) ; leur différence, 38, est le nombre de commandes sans note — exactement l'inverse de ce que compte COUNT(note).",
      retenir: "COUNT(*) - COUNT(colonne) donne le nombre de lignes où cette colonne est NULL."
    },
    {
      id: "p2-14", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le prix le plus bas et le plus haut du catalogue",
      question: "Quel est le prix du produit le moins cher, et celui du produit le plus cher ?",
      consigne: "Deux colonnes, dans cet ordre : le prix minimum, puis le prix maximum.",
      solution: "SELECT MIN(prix), MAX(prix) FROM produits",
      comparer: {},
      piste: "MIN et MAX s'utilisent exactement comme SUM ou AVG, chacune dans sa propre colonne du SELECT.",
      clause: "MIN",
      exemple: "SELECT MIN(stock), MAX(stock) FROM produits; donnerait le stock le plus bas et le plus haut du catalogue.",
      explication: "MIN(prix) et MAX(prix) parcourent chacune toute la colonne prix et renvoient respectivement la plus petite (3,50 €) et la plus grande (1 299,00 €) valeur trouvée, dans une seule ligne de résultat à deux colonnes.",
      retenir: "MIN(colonne) et MAX(colonne) renvoient la plus petite et la plus grande valeur d'une colonne ; on peut demander les deux dans le même SELECT."
    },
    {
      id: "p2-15", type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 1,
      titre: "MIN, MAX et les valeurs manquantes",
      question: "La colonne date_livraison est NULL pour les commandes pas encore livrées. MIN(date_livraison) tient-il compte de ces lignes ?",
      options: [
        "Non : comme toutes les fonctions d'agrégat, MIN ignore les NULL et ne regarde que les dates réellement renseignées",
        "Oui : NULL est considéré comme la date la plus ancienne possible",
        "Non : MIN provoque une erreur si la colonne contient un NULL",
        "Oui : NULL est ignoré uniquement si on utilise MAX, pas MIN"
      ],
      reponse: 0,
      piste: "C'est la même règle que pour COUNT(colonne), SUM et AVG.",
      clause: "MIN",
      exemple: "MIN(date_livraison) ne regarde que les commandes livrées ou retournées : les 19 autres, sans date, n'y participent pas.",
      explication: "MIN et MAX suivent la même règle que les autres fonctions d'agrégat : une ligne NULL est purement ignorée, jamais traitée comme une valeur extrême. MIN(date_livraison) ne considère que les commandes qui ont réellement une date de livraison.",
      retenir: "MIN et MAX ignorent les NULL exactement comme COUNT(colonne), SUM et AVG : aucune fonction d'agrégat ne les traite comme une valeur."
    },
    {
      id: "p2-16", type: "predire",
      niveau: "P2", competence: "agreger", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Un produit à stock zéro",
      question: "Sans l'exécuter : quelle VALEUR renvoie cette requête ?",
      requete: "SELECT COUNT(*) FROM produits WHERE stock = 0;",
      predit: "valeur",
      piste: "Au moins un produit du catalogue est en rupture totale ; combien exactement ?",
      clause: "MIN",
      exemple: "Les stocks du catalogue vont de 0 à plusieurs dizaines d'unités selon le produit.",
      explication: "Un seul produit du catalogue (un tapis de bain) a un stock de 0, donc COUNT(*) FROM produits WHERE stock = 0 renvoie 1. C'est ce même 0 que MIN(stock) trouverait comme plus petite valeur de toute la colonne : 0 est une valeur numérique comme une autre, jamais confondue avec un NULL — un NULL aurait été ignoré, par MIN comme par COUNT(colonne).",
      retenir: "0 est une valeur comme une autre pour MIN, MAX ou une comparaison WHERE = 0 ; elle n'est jamais traitée comme une absence de valeur, contrairement à NULL."
    },
    {
      id: "p2-17", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 2,
      titre: "Le nombre de clients par ville",
      question: "Combien de clients habitent dans chaque ville ?",
      consigne: "Deux colonnes, dans cet ordre : la ville, puis le nombre de clients ; triées par ville.",
      solution: "SELECT ville, COUNT(*) FROM clients GROUP BY ville ORDER BY ville",
      comparer: { ordonne: { cles: [0] } },
      piste: "GROUP BY sépare les lignes par valeur de la colonne choisie ; COUNT(*) est alors recalculé pour chaque groupe.",
      clause: "GROUP BY",
      exemple: "SELECT statut, COUNT(*) FROM commandes GROUP BY statut; donne une ligne par statut de commande.",
      explication: "GROUP BY ville forme un groupe par valeur différente de ville — NULL compris, qui forme son propre groupe pour les 4 clients sans ville connue — et COUNT(*) compte les lignes de chaque groupe séparément : 12 lignes de résultat en tout (11 villes + le groupe NULL).",
      retenir: "GROUP BY colonne forme un groupe par valeur différente, NULL compris : une fonction d'agrégat du SELECT est alors recalculée séparément pour chaque groupe."
    },
    {
      id: "p2-18", type: "corriger",
      niveau: "P2", competence: "agreger", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Le nombre de commandes par statut",
      question: "Combien de commandes y a-t-il, pour chacun des statuts possibles ?",
      consigne: "Deux colonnes, dans cet ordre : le statut, puis le nombre de commandes ; triées par statut.",
      depart: "SELECT statut, COUNT(*) FROM commandes",
      solution: "SELECT statut, COUNT(*) FROM commandes GROUP BY statut ORDER BY statut",
      comparer: { ordonne: { cles: [0] } },
      piste: "Exécutez la requête de départ : combien de lignes renvoie-t-elle ? Est-ce cohérent avec « pour chacun des statuts » ?",
      clause: "GROUP BY",
      exemple: "Sans GROUP BY, un SELECT qui mélange une colonne ordinaire et une fonction d'agrégat ne fabrique qu'un seul groupe : toute la table.",
      explication: "La requête de départ est acceptée par SQLite SANS ERREUR : elle renvoie une seule ligne, avec le COUNT(*) correct (70) mais un statut choisi arbitrairement parmi toutes les lignes de la table — ici livree, parce que c'est la première valeur que rencontre SQLite, sans que cela ait de sens. C'est plus trompeur qu'une erreur : le résultat a l'air valide. GROUP BY statut sépare réellement les commandes en 5 groupes, un par statut, chacun avec son propre compte.",
      retenir: "Mélanger une colonne ordinaire et une fonction d'agrégat sans GROUP BY ne provoque pas d'erreur dans SQLite : la colonne ordinaire affiche une valeur arbitraire d'une ligne quelconque, à côté d'un agrégat qui, lui, porte sur toute la table."
    },
    {
      id: "p2-19", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 2,
      titre: "Combien de commandes de chaque statut ont une date de livraison",
      question: "Pour chaque statut, combien de commandes ont une date de livraison renseignée ?",
      consigne: "Deux colonnes, dans cet ordre : le statut, puis le nombre de commandes avec une date de livraison ; triées par statut.",
      solution: "SELECT statut, COUNT(date_livraison) FROM commandes GROUP BY statut ORDER BY statut",
      comparer: { ordonne: { cles: [0] } },
      piste: "COUNT(colonne) à l'intérieur d'un GROUP BY compte, pour chaque groupe séparément, les valeurs non NULL de cette colonne.",
      clause: "GROUP BY",
      exemple: "GROUP BY peut combiner n'importe quelle fonction d'agrégat déjà vue : COUNT(*), COUNT(colonne), SUM, AVG, MIN, MAX se recalculent toutes par groupe.",
      explication: "COUNT(date_livraison), recalculé pour chaque statut, montre que seules les commandes livree (46) et retournee (5) ont une date de livraison ; les trois autres statuts (annulee, en_preparation, expediee) affichent 0, puisqu'aucune de leurs commandes n'a encore été livrée.",
      retenir: "N'importe quelle fonction d'agrégat déjà connue (COUNT(colonne), SUM, AVG, MIN, MAX) se combine avec GROUP BY : elle se recalcule simplement pour chaque groupe séparément."
    },
    {
      id: "p2-20", type: "predire",
      niveau: "P2", competence: "agreger", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Une ligne par statut",
      question: "Sans l'exécuter : combien de LIGNES renvoie cette requête ?",
      requete: "SELECT statut, COUNT(*) FROM commandes GROUP BY statut;",
      predit: "nbLignes",
      piste: "Combien de statuts différents existent dans la table commandes ?",
      clause: "GROUP BY",
      exemple: "5 statuts possibles : en_preparation, expediee, livree, annulee, retournee.",
      explication: "GROUP BY statut forme un groupe par valeur différente de statut : il y en a exactement 5 dans la table commandes, donc 5 lignes de résultat — quel que soit le nombre de commandes (70) réparties entre elles.",
      retenir: "Le nombre de lignes d'un résultat GROUP BY est le nombre de valeurs différentes de la colonne groupée, pas le nombre de lignes de la table de départ."
    },
    {
      id: "p2-21", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 3,
      titre: "Les frais de port perçus, statut par statut",
      question: "Pour chaque statut, quel est le total des frais de port des commandes correspondantes ?",
      consigne: "Deux colonnes, dans cet ordre : le statut, puis la somme des frais de port ; triées par statut.",
      solution: "SELECT statut, SUM(frais_port) FROM commandes GROUP BY statut ORDER BY statut",
      comparer: { ordonne: { cles: [0] } },
      piste: "C'est la même construction que pour COUNT(date_livraison) : seule la fonction d'agrégat change.",
      clause: "GROUP BY",
      exemple: "SUM(frais_port) seule, sans GROUP BY, donnerait un seul total pour toute la boutique : 306,50 €.",
      explication: "SUM(frais_port), recalculé par statut, montre que même les 11 commandes annulées ont déjà généré 44,00 € de frais de port (ils ont été facturés avant l'annulation) : annulee 44,00, en_preparation 19,50, expediee 24,00, livree 188,50, retournee 30,50 — un total qui retombe bien sur la somme globale de 306,50 €.",
      retenir: "GROUP BY ne limite pas les fonctions d'agrégat à COUNT : SUM, AVG, MIN, MAX se recalculent toutes aussi bien par groupe, sur n'importe quelle colonne numérique."
    },
    {
      id: "p2-22", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 2,
      titre: "Les commandes dont les lignes dépassent 1 000 €",
      question: "Quelles commandes totalisent plus de 1 000 € sur l'ensemble de leurs lignes (quantité × prix unitaire) ?",
      consigne: "Deux colonnes, dans cet ordre : l'identifiant de la commande, puis le total de ses lignes ; triées par identifiant.",
      solution: "SELECT commande_id, SUM(quantite * prix_unitaire) AS total FROM lignes_commande GROUP BY commande_id HAVING total > 1000 ORDER BY commande_id",
      comparer: { ordonne: { cles: [0] } },
      piste: "HAVING s'écrit après GROUP BY, et porte sur le résultat de la fonction d'agrégat — pas sur une colonne de la table.",
      clause: "HAVING",
      exemple: "HAVING COUNT(*) > 3 garderait les groupes d'au moins 4 lignes ; ici, HAVING total > 1000 garde les groupes dont la somme dépasse 1000.",
      explication: "GROUP BY commande_id forme un groupe par commande et calcule son total ; HAVING total > 1000 ne garde ensuite que les groupes dont CE TOTAL dépasse 1000 — six commandes sur 70, chacune avec un total par commande bien supérieur à ce que n'importe quelle ligne isolée pourrait atteindre.",
      retenir: "HAVING filtre des GROUPES, après le calcul de la fonction d'agrégat ; il peut porter sur le résultat de SUM, COUNT, AVG… pas seulement sur une colonne brute de la table."
    },
    {
      id: "p2-23", type: "corriger",
      niveau: "P2", competence: "agreger", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Les commandes dont le total dépasse 1 000 €, vraiment",
      question: "Quelles commandes totalisent plus de 1 000 € sur l'ensemble de leurs lignes (quantité × prix unitaire) ?",
      consigne: "Deux colonnes, dans cet ordre : l'identifiant de la commande, puis le total de ses lignes ; triées par identifiant.",
      depart: "SELECT commande_id, SUM(quantite * prix_unitaire) AS total FROM lignes_commande WHERE quantite * prix_unitaire > 1000 GROUP BY commande_id ORDER BY commande_id",
      solution: "SELECT commande_id, SUM(quantite * prix_unitaire) AS total FROM lignes_commande GROUP BY commande_id HAVING total > 1000 ORDER BY commande_id",
      comparer: { ordonne: { cles: [0] } },
      pieges: ["P8"],
      piste: "WHERE s'applique ligne par ligne, AVANT le regroupement. Une commande peut dépasser 1000 € au total sans qu'aucune de ses lignes, prise seule, ne dépasse 1000 €.",
      clause: "HAVING",
      exemple: "La commande 1001 a plusieurs lignes dont aucune ne dépasse 1000 € prise isolément, mais dont le total, lui, dépasse 1000 €.",
      explication: "La requête de départ filtre avec WHERE quantite * prix_unitaire > 1000 : cette condition s'applique à CHAQUE LIGNE, avant tout regroupement, et élimine les petites lignes avant même de les additionner. Pour la commande 1001, elle ne garde que sa ligne la plus chère (1 249 €) et ignore ses autres lignes, pour un total tronqué à 1 249 — alors que la commande entière, toutes lignes comptées, totalise 1 284 €. Pour la commande 1016, l'écart est similaire : 1 299 € au lieu de 1 306 €. HAVING total > 1000, lui, s'applique APRÈS le calcul du total par commande : il compare le bon nombre, celui qui représente vraiment la commande entière.",
      retenir: "WHERE filtre des lignes avant le regroupement ; HAVING filtre des groupes après le calcul de l'agrégat. Utiliser WHERE pour une condition qui devrait porter sur le total d'un groupe tronque silencieusement ce total."
    },
    {
      id: "p2-24", type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 2,
      titre: "WHERE et HAVING, dans quel ordre ?",
      question: "Dans une requête avec GROUP BY, WHERE et HAVING agissent-ils au même moment ?",
      options: [
        "Non : WHERE filtre les lignes avant le regroupement, HAVING filtre les groupes après",
        "Non : HAVING filtre les lignes avant le regroupement, WHERE filtre les groupes après",
        "Oui : les deux filtrent exactement les mêmes lignes, au même moment",
        "Oui, mais HAVING ne fonctionne qu'avec COUNT, jamais avec SUM ou AVG"
      ],
      reponse: 0,
      piste: "L'une des deux clauses s'applique forcément avant que les groupes n'existent encore.",
      clause: "HAVING",
      exemple: "WHERE statut <> 'annulee' GROUP BY client_id HAVING COUNT(*) > 3 : d'abord on retire les commandes annulées, ensuite on regroupe par client, enfin on garde les clients d'au moins 4 commandes.",
      explication: "WHERE s'exécute avant le regroupement : il décide quelles LIGNES entrent dans le calcul. HAVING s'exécute après : il décide quels GROUPES, une fois leur agrégat calculé, sont gardés dans le résultat. Un HAVING peut filtrer sur SUM, AVG, MIN, MAX tout autant que sur COUNT.",
      retenir: "WHERE avant le regroupement (sur des lignes), HAVING après (sur des groupes déjà calculés)."
    },
    {
      id: "p2-25", type: "predire",
      niveau: "P2", competence: "agreger", categorie: "Prédire le résultat", difficulte: 3,
      titre: "Une moyenne qui ne tombe pas juste",
      question: "Sans l'exécuter : quelle VALEUR renvoie cette requête, pour la commande 1023 (3 lignes, 4 articles en tout) ?",
      requete: "SELECT SUM(quantite) / COUNT(*) FROM lignes_commande WHERE commande_id = 1023;",
      predit: "valeur",
      pieges: ["P8"],
      piste: "4 divisé par 3 ne fait pas un nombre entier. SQLite divise-t-il toujours exactement, comme une calculatrice ?",
      clause: "HAVING",
      exemple: "SUM(quantite)/COUNT(*) sur une commande de 2 lignes totalisant 3 articles donnerait 3/2 : affiché 1, pas 1,5.",
      explication: "SUM(quantite) vaut 4, COUNT(*) vaut 3 : 4 ÷ 3 fait 1,333… en arithmétique réelle, mais SQLite effectue ici une DIVISION ENTIÈRE, parce que SUM(quantite) et COUNT(*) sont tous les deux des entiers. Le résultat affiché est 1, tronqué, pas arrondi : la partie décimale est purement coupée, pas la valeur la plus proche.",
      retenir: "En SQLite, diviser un entier par un entier tronque le résultat à l'entier inférieur ; pour une vraie division, au moins l'un des deux doit être un nombre à virgule (par exemple CAST(… AS REAL))."
    },
    {
      id: "p2-26", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 2,
      titre: "Trois familles de statuts",
      question: "Regroupez les commandes en trois familles : « livree » pour les commandes livrées, « perdue » pour celles annulées ou retournées, « en_cours » pour toutes les autres. Combien de commandes dans chaque famille ?",
      consigne: "Deux colonnes, dans cet ordre : le nom de la famille, puis le nombre de commandes ; triées par nom de famille.",
      solution: "SELECT CASE WHEN statut = 'livree' THEN 'livree' WHEN statut IN ('annulee', 'retournee') THEN 'perdue' ELSE 'en_cours' END AS famille, COUNT(*) FROM commandes GROUP BY famille ORDER BY famille",
      comparer: { ordonne: { cles: [0] } },
      pieges: ["P7"],
      piste: "CASE WHEN … THEN … WHEN … THEN … ELSE … END se comporte comme une colonne ordinaire : on peut la nommer avec AS, et la GROUP BY.",
      clause: "CASE WHEN",
      exemple: "CASE WHEN prix > 100 THEN 'cher' ELSE 'abordable' END classerait chaque produit en deux familles de prix.",
      explication: "CASE WHEN teste les conditions dans l'ordre et s'arrête à la première qui est vraie : chaque commande livree tombe dans 'livree' (46), chaque annulee ou retournee dans 'perdue' (16), et tout le reste — en_preparation et expediee — dans 'en_cours' via ELSE (8). Une fois nommée par AS, cette colonne calculée se GROUP BY comme n'importe quelle autre.",
      retenir: "CASE WHEN condition1 THEN valeur1 WHEN condition2 THEN valeur2 ELSE valeur3 END fabrique une colonne calculée, évaluée ligne par ligne, qui peut ensuite servir de clé à un GROUP BY."
    },
    {
      id: "p2-27", type: "corriger",
      niveau: "P2", competence: "agreger", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Trois familles de statuts, sans en oublier aucune",
      question: "Regroupez les commandes en trois familles : « livree », « perdue » (annulee ou retournee), « en_cours » (tout le reste). Combien de commandes dans chaque famille ?",
      consigne: "Deux colonnes, dans cet ordre : le nom de la famille, puis le nombre de commandes ; triées par nom de famille.",
      depart: "SELECT CASE WHEN statut = 'livree' THEN 'livree' WHEN statut IN ('annulee', 'retournee') THEN 'perdue' END AS famille, COUNT(*) FROM commandes GROUP BY famille ORDER BY famille",
      solution: "SELECT CASE WHEN statut = 'livree' THEN 'livree' WHEN statut IN ('annulee', 'retournee') THEN 'perdue' ELSE 'en_cours' END AS famille, COUNT(*) FROM commandes GROUP BY famille ORDER BY famille",
      comparer: { ordonne: { cles: [0] } },
      piste: "Que vaut CASE WHEN quand AUCUNE des conditions n'est vraie, et qu'il n'y a pas de ELSE pour rattraper le coup ?",
      clause: "CASE WHEN",
      exemple: "Une commande en_preparation ne vérifie ni statut = 'livree' ni statut IN ('annulee', 'retournee') : sans ELSE, elle ne reçoit aucune des valeurs prévues.",
      explication: "Sans ELSE, une ligne qui ne correspond à AUCUN WHEN reçoit NULL — pas d'erreur, juste une valeur manquante. Les 8 commandes en_preparation et expediee tombent toutes dans ce cas, et GROUP BY les réunit dans un groupe NULL au lieu du groupe 'en_cours' attendu : le compte (8) est le même, mais son étiquette ne l'est pas. ELSE 'en_cours' couvre ce cas en donnant une valeur explicite à tout ce qui n'est ni livree, ni annulee, ni retournee.",
      retenir: "CASE WHEN sans ELSE renvoie NULL pour toute ligne qui ne vérifie aucune condition — un NULL silencieux, qui forme son propre groupe NULL avec GROUP BY, pas une erreur."
    },
    {
      id: "p2-28", type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 1,
      titre: "CASE WHEN sans ELSE",
      question: "Dans CASE WHEN condition THEN valeur END (sans ELSE), que vaut l'expression pour une ligne qui ne vérifie pas la condition ?",
      options: [
        "NULL",
        "0",
        "Une chaîne de caractères vide",
        "SQLite refuse d'exécuter la requête"
      ],
      reponse: 0,
      piste: "ELSE sert justement à remplacer cette valeur par défaut par quelque chose de plus utile.",
      clause: "CASE WHEN",
      exemple: "CASE WHEN prix > 1000 THEN 'cher' END vaut NULL pour un produit à 50 €, faute de ELSE.",
      explication: "Sans ELSE, CASE WHEN se comporte comme un WHEN implicite « sinon, NULL » : toute ligne qui ne vérifie aucune des conditions reçoit NULL, sans qu'aucune erreur ne soit signalée.",
      retenir: "CASE WHEN … END sans ELSE renvoie NULL par défaut ; ajouter ELSE permet de choisir une valeur explicite à la place."
    },
    {
      id: "p2-29", type: "requete",
      niveau: "P2", competence: "dates", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le nombre de commandes par année",
      question: "Combien de commandes ont été passées en 2025, et combien en 2026 ?",
      consigne: "Deux colonnes, dans cet ordre : l'année, puis le nombre de commandes ; triées par année.",
      solution: "SELECT strftime('%Y', date_commande) AS annee, COUNT(*) FROM commandes GROUP BY annee ORDER BY annee",
      comparer: { ordonne: { cles: [0] } },
      piste: "strftime('%Y', colonne) extrait l'année d'une date écrite au format AAAA-MM-JJ, sous forme de texte.",
      clause: "strftime",
      exemple: "strftime('%m', date_commande) extrairait le mois ; strftime('%Y-%m', date_commande) l'année et le mois ensemble.",
      explication: "strftime('%Y', date_commande) extrait les 4 premiers caractères de chaque date (l'année), sous forme de texte ; GROUP BY regroupe ensuite par cette valeur extraite. 44 commandes tombent en 2025, 26 en 2026 — un total de 70, cohérent avec le nombre de commandes de la table.",
      retenir: "strftime('%Y', colonne) extrait l'année d'une date AAAA-MM-JJ ; GROUP BY peut porter directement sur une expression calculée, pas seulement sur une colonne de la table."
    },
    {
      id: "p2-30", type: "corriger",
      niveau: "P2", competence: "dates", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Combien de commandes en 2025",
      question: "Combien de commandes ont été passées en 2025 ?",
      consigne: "Une seule valeur : le nombre de commandes de l'année 2025.",
      depart: "SELECT COUNT(*) FROM commandes WHERE strftime('%Y', date_commande) = 2025",
      solution: "SELECT COUNT(*) FROM commandes WHERE strftime('%Y', date_commande) = '2025'",
      comparer: {},
      pieges: ["P6"],
      piste: "strftime renvoie toujours du TEXTE, jamais un nombre. Comparez-vous ce texte à un texte, ou à un nombre ?",
      clause: "strftime",
      exemple: "'2025' (texte) et 2025 (nombre) se ressemblent à l'écriture, mais SQLite ne les confond pas forcément dans une comparaison.",
      explication: "strftime('%Y', date_commande) renvoie toujours une chaîne de texte, comme '2025' — jamais un nombre entier. La comparer à l'entier 2025 (sans apostrophes) ne déclenche aucune erreur, mais ne trouve non plus AUCUNE ligne : SQLite ne convertit pas automatiquement un texte en nombre dans ce genre de comparaison, le résultat est silencieusement 0. Comparer le texte renvoyé par strftime à un AUTRE texte, '2025' entre apostrophes, fonctionne : 44 commandes.",
      retenir: "strftime renvoie du texte : comparez toujours son résultat à une valeur entre apostrophes ('2025'), jamais à un nombre nu, sous peine d'un résultat vide et silencieux."
    },
    {
      id: "p2-31", type: "corriger",
      niveau: "P2", competence: "dates", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Combien de commandes chaque mois, sur toute la période",
      question: "Combien de commandes ont été passées chaque mois, sur toute la période couverte par la boutique (de janvier 2025 à juin 2026) ?",
      consigne: "Deux colonnes, dans cet ordre : le mois, puis le nombre de commandes ; triées par mois.",
      depart: "SELECT strftime('%m', date_commande) AS mois, COUNT(*) FROM commandes GROUP BY mois ORDER BY mois",
      solution: "SELECT strftime('%Y-%m', date_commande) AS mois, COUNT(*) FROM commandes GROUP BY mois ORDER BY mois",
      comparer: { ordonne: { cles: [0] } },
      pieges: ["P6"],
      piste: "strftime('%m', …) extrait un mois SANS l'année : janvier 2025 et janvier 2026 portent-ils la même valeur '01' ?",
      clause: "strftime",
      exemple: "strftime('%Y-%m', …) distingue 2025-01 de 2026-01 ; strftime('%m', …) les confond tous les deux sous '01'.",
      explication: "La requête de départ extrait le mois SEUL ('01' à '12') : elle ne renvoie que 12 lignes, mais chacune mélange les commandes de janvier 2025 ET de janvier 2026 (et ainsi de suite), puisque la boutique couvre 18 mois sur deux années civiles. strftime('%Y-%m', …) garde l'année ET le mois ensemble ('2025-01', '2026-01', …) : chaque mois de chaque année reste distinct, pour 17 lignes bien séparées — pas 12, et pas 18 non plus (voir le chapitre suivant).",
      retenir: "Dès que des données couvrent plusieurs années, regrouper par strftime('%m', …) seul mélange silencieusement les mêmes mois d'années différentes : il faut garder l'année dans la clé de regroupement, avec strftime('%Y-%m', …)."
    },
    {
      id: "p2-32", type: "predire",
      niveau: "P2", competence: "dates", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Deux années, deux lignes",
      question: "Sans l'exécuter : combien de LIGNES renvoie cette requête ?",
      requete: "SELECT strftime('%Y', date_commande) AS annee, COUNT(*) FROM commandes GROUP BY annee;",
      predit: "nbLignes",
      piste: "Sur combien d'années civiles différentes la boutique a-t-elle enregistré des commandes ?",
      clause: "strftime",
      exemple: "Toutes les dates de commande sont comprises entre janvier 2025 et juin 2026.",
      explication: "Les commandes couvrent exactement deux années civiles, 2025 et 2026 : GROUP BY sur l'année extraite ne peut donc produire que 2 lignes, quel que soit le nombre de commandes (70) réparties entre elles.",
      retenir: "Le nombre de lignes d'un résultat GROUP BY dépend du nombre de valeurs différentes de la clé de regroupement — ici deux années — jamais du nombre de lignes de départ."
    },
    {
      id: "p2-33", type: "qcm",
      niveau: "P2", competence: "dates", categorie: "Comprendre", difficulte: 1,
      titre: "17 lignes, ou 18 ?",
      question: "La boutique a enregistré des commandes entre janvier 2025 et juin 2026 : 18 mois civils différents sur cette période. Une requête GROUP BY sur l'année et le mois ne renvoie que 17 lignes. Pourquoi ?",
      options: [
        "Un de ces 18 mois n'a vu passer aucune commande, et GROUP BY ne fabrique jamais de ligne pour un groupe vide",
        "La requête contient une erreur qui en a fait disparaître un",
        "Deux mois ont été fusionnés par erreur dans le même groupe",
        "SQLite limite GROUP BY à 17 groupes au maximum"
      ],
      reponse: 0,
      piste: "GROUP BY ne regroupe que les lignes QUI EXISTENT dans la table : il ne peut rien dire sur un mois qui n'a aucune ligne du tout.",
      clause: "GROUP BY",
      exemple: "Une table sans aucune commande en août 2025 ne peut pas faire apparaître '2025-08' dans un résultat GROUP BY : ce groupe n'existe tout simplement pas.",
      explication: "Aucune commande n'a été passée en août 2025 : ce mois n'a donc aucune ligne dans la table, et GROUP BY ne peut regrouper que des lignes existantes — il ne fabrique jamais un groupe vide pour un mois sans commande, même si ce mois existe bien dans le calendrier. 17 mois apparaissent, pas 18 : l'absence d'un groupe EST l'information, pas une erreur de calcul.",
      retenir: "GROUP BY ne peut révéler que des groupes qui ont au moins une ligne : un mois, un statut ou une catégorie sans aucune ligne correspondante n'apparaîtra jamais dans le résultat, même s'il existe dans la réalité."
    },
    {
      id: "p2-34", type: "requete",
      niveau: "P2", competence: "dates", categorie: "Mise en pratique", difficulte: 1,
      titre: "Les commandes à cheval sur le nouvel an",
      question: "Quelles commandes ont été passées le 31 décembre 2025 ou le 1er janvier 2026 ?",
      consigne: "Deux colonnes, dans cet ordre : l'identifiant de la commande, puis sa date ; triées par date.",
      solution: "SELECT id, date_commande FROM commandes WHERE date_commande IN ('2025-12-31', '2026-01-01') ORDER BY date_commande",
      comparer: { ordonne: { cles: [1] } },
      pieges: ["P6"],
      piste: "Une date au format AAAA-MM-JJ se compare comme n'importe quel texte, avec IN ou avec =.",
      clause: "IN",
      exemple: "WHERE date_commande = '2025-12-31' trouverait la commande du dernier jour de 2025, seule.",
      explication: "IN ('2025-12-31', '2026-01-01') garde les commandes passées à l'une de ces deux dates précises, à un jour d'écart l'une de l'autre mais de part et d'autre de la frontière entre deux années civiles : la commande 1044 (2025-12-31) et la commande 1045 (2026-01-01), qui se suivent directement dans l'ordre chronologique bien qu'elles n'appartiennent pas à la même année.",
      retenir: "Deux lignes consécutives dans le temps peuvent appartenir à deux groupes différents (deux années, deux mois) dès que leur date franchit une frontière de calendrier."
    },
    {
      id: "p2-35", type: "predire",
      niveau: "P2", competence: "dates", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Le mois sans aucune commande",
      question: "Sans l'exécuter : combien de LIGNES renvoie cette requête ?",
      requete: "SELECT strftime('%Y-%m', date_commande) AS mois, COUNT(*) FROM commandes WHERE date_commande LIKE '2025-08%' GROUP BY mois;",
      predit: "nbLignes",
      zeroLigneAttendu: "Le but de l'exercice est de faire constater qu'août 2025 n'a vu passer aucune commande : WHERE ne garde alors aucune ligne, et GROUP BY n'a rien à regrouper.",
      pieges: ["P6"],
      piste: "WHERE filtre d'abord sur août 2025. Reste-t-il une seule commande de ce mois-là pour que GROUP BY ait quelque chose à regrouper ?",
      clause: "GROUP BY",
      exemple: "LIKE '2025-08%' garde les dates qui commencent par 2025-08, quel que soit le jour.",
      explication: "Aucune commande de la boutique n'a été passée en août 2025 : WHERE date_commande LIKE '2025-08%' ne garde donc aucune ligne, et GROUP BY, qui ne peut regrouper que des lignes présentes, ne produit lui non plus aucune ligne de résultat. Zéro n'est pas une erreur ici : c'est exactement ce que révèle le trou d'août, déjà rencontré dans la leçon.",
      retenir: "Un résultat à zéro ligne n'est pas forcément un signe d'erreur : il peut révéler une vraie absence de données, comme un mois entier sans la moindre commande."
    },
    {
      id: "p2-36", type: "corriger",
      niveau: "P2", competence: "dates", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Un regroupement par mois, pas par jour",
      question: "Combien de commandes ont été passées chaque mois, sur toute la période couverte par la boutique ?",
      consigne: "Deux colonnes, dans cet ordre : le mois, puis le nombre de commandes ; triées par mois.",
      depart: "SELECT date_commande, COUNT(*) FROM commandes GROUP BY date_commande ORDER BY date_commande",
      solution: "SELECT strftime('%Y-%m', date_commande) AS mois, COUNT(*) FROM commandes GROUP BY mois ORDER BY mois",
      comparer: { ordonne: { cles: [0] } },
      piste: "GROUP BY date_commande regroupe par JOUR exact, pas par mois : deux commandes du même mois mais de jours différents tombent-elles dans le même groupe ?",
      clause: "GROUP BY",
      exemple: "GROUP BY date_commande sépare le 2025-01-06 du 2025-01-14 : deux groupes, même s'ils sont tous les deux en janvier 2025.",
      explication: "GROUP BY date_commande regroupe par date COMPLÈTE, jour compris : il produit 69 lignes, presque une par commande (un seul jour, par exception, porte deux commandes), ce qui n'a plus rien d'un regroupement par mois. strftime('%Y-%m', date_commande) tronque chaque date à l'année et au mois avant de regrouper : toutes les commandes d'un même mois, quel que soit leur jour exact, tombent alors dans le même groupe — 17 lignes, une par mois réellement représenté.",
      retenir: "GROUP BY regroupe sur la valeur EXACTE d'une expression : pour regrouper par mois plutôt que par jour, il faut d'abord réduire la date au mois (strftime('%Y-%m', …)), pas regrouper sur la date complète."
    },
    {
      id: "p2-37", type: "requete",
      niveau: "P2", competence: "agreger", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le total des lignes de la commande 1038",
      question: "Quel est le total des lignes de la commande 1038 (quantité × prix unitaire) ?",
      consigne: "Une seule valeur : ce total, avant tout frais de port.",
      solution: "SELECT SUM(quantite * prix_unitaire) FROM lignes_commande WHERE commande_id = 1038",
      comparer: {},
      piste: "C'est exactement la construction du chapitre sur SUM, appliquée à une commande précise.",
      clause: "SUM",
      exemple: "La commande 1038 a 4 lignes, de 34, 29, 25 et 14 euros chacune.",
      explication: "Les 4 lignes de la commande 1038 totalisent 34 + 29 + 25 + 14 = 102,00 €. C'est ce que SCHEMA.md appelle le « chiffre d'affaires produits » de cette commande : la valeur des articles vendus, sans rien d'autre.",
      retenir: "Le total des lignes d'une commande (quantité × prix unitaire, additionné) correspond à ce qu'on appelle son chiffre d'affaires PRODUITS : la valeur des articles seuls."
    },
    {
      id: "p2-38", type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 2,
      titre: "102,00 €, est-ce ce que le client a payé ?",
      question: "Le total des lignes de la commande 1038 est de 102,00 €. Cette commande a des frais de port de 6,50 €. Combien le client a-t-il payé en tout ?",
      options: [
        "108,50 € : 102,00 € de produits, plus 6,50 € de frais de port",
        "102,00 € : les frais de port ne sont jamais facturés au client",
        "95,50 € : les frais de port sont déduits du total des produits",
        "Impossible à savoir sans connaître le mode de livraison"
      ],
      reponse: 0,
      piste: "« Chiffre d'affaires produits » et « chiffre d'affaires total », dans SCHEMA.md, ne désignent pas la même chose — c'est précisément pour ça que les deux ont un nom différent.",
      clause: "SUM",
      exemple: "Une commande à 50,00 € de produits avec 4,50 € de frais de port revient à 54,50 € payés par le client.",
      explication: "102,00 € est le chiffre d'affaires PRODUITS de la commande 1038 : la valeur de ses articles, frais de port exclu. Le client paie ce montant ET les frais de port de la commande (6,50 €, facturés une seule fois, pas ligne par ligne) : 108,50 € au total, ce que SCHEMA.md appelle le chiffre d'affaires TOTAL. Une consigne qui demande « le chiffre d'affaires » sans préciser lequel des deux est ambiguë — et dans ce cours, chaque consigne sur un montant précise toujours lequel des deux elle attend.",
      retenir: "Chiffre d'affaires PRODUITS (les articles seuls) et chiffre d'affaires TOTAL (articles + frais de port) sont deux nombres différents : une consigne sur un montant doit toujours préciser lequel des deux elle demande."
    },
    {
      id: "p2-39", type: "qcm",
      niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 3,
      titre: "Et pour TOUTES les commandes à la fois ?",
      question: "Pour calculer le chiffre d'affaires TOTAL de TOUTES les commandes de la boutique (pas une seule), il faudra un jour additionner le total des lignes de chaque commande à ses frais de port, commande par commande — ce qui demande de relier lignes_commande et commandes (une jointure, palier 3). À quoi faudra-t-il faire attention pour ne pas fausser ce calcul ?",
      options: [
        "Ne compter les frais de port d'une commande qu'une seule fois, même si cette commande a plusieurs lignes",
        "Ne compter que les commandes qui ont exactement une seule ligne",
        "Ignorer les frais de port de toutes les commandes à plusieurs lignes",
        "Multiplier les frais de port par le nombre de lignes de chaque commande"
      ],
      reponse: 0,
      piste: "Une commande a UN SEUL montant de frais de port, quel que soit son nombre de lignes de produits.",
      clause: "SUM",
      exemple: "La commande 1038 a 4 lignes mais un seul frais de port (6,50 €) : si on le comptait une fois par ligne, on obtiendrait 26,00 € de frais de port au lieu de 6,50 €.",
      explication: "Une fois les deux tables reliées (palier 3), chaque commande à plusieurs lignes apparaîtra plusieurs fois dans le résultat joint — une fois par ligne. Additionner frais_port directement sur ce résultat joint compterait alors les frais de port de cette commande une fois PAR LIGNE, au lieu d'une fois par commande : exactement le piège que SCHEMA.md signale (12 911,50 € au lieu de 12 619,00 € sur l'ensemble de la boutique). Il faudra additionner les frais de port à part, une fois par commande, avant de les ajouter au total des produits.",
      retenir: "Relier deux tables où l'une a plusieurs lignes pour une de l'autre (ici, plusieurs lignes de commande pour une commande) répète cette ligne unique autant de fois qu'il y a de lignes liées : une colonne de la table « une seule ligne » comptée directement sur ce résultat joint sera gonflée d'autant."
    },

    /* ── Palier 3 (lot 8) : JOIN, LEFT JOIN, anti-jointure, auto-jointure, trois tables ──────────────────── */
    {
      id: "p3-01", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 1,
      titre: "Ce qu'une commande ne contient pas",
      question: "Dans l'explorateur, la table commandes a bien une colonne client_id, mais aucune colonne qui porte le nom du client. Pourquoi ?",
      options: [
        "Le nom n'est écrit qu'une fois, dans clients ; client_id dit de quelle ligne de clients il s'agit",
        "Le nom du client a été oublié quand la table commandes a été créée",
        "SQLite interdit de stocker du texte dans une table qui contient déjà des dates",
        "Le nom est recopié dans commandes, mais l'explorateur ne l'affiche pas"
      ],
      reponse: 0,
      piste: "Que faudrait-il corriger, et à combien d'endroits, si un client changeait de nom ?",
      clause: "JOIN",
      exemple: "La commande 1001 porte client_id = 201 : le nom correspondant se lit dans la table clients, à la ligne dont l'id vaut 201.",
      explication: "C'est le rôle d'une clé étrangère : client_id contient l'identifiant d'une ligne de clients, et rien d'autre. Le nom n'est donc écrit qu'à un seul endroit — si un client change de nom, une seule ligne est à corriger, et les 70 commandes suivent. Le prix à payer est qu'aucune des deux tables ne répond seule à « le nom du client et la date de sa commande » : il faut les relier, et c'est ce que fait une jointure.",
      retenir: "Une clé étrangère remplace la copie d'une information : le nom n'existe qu'une fois, dans sa table, et les autres tables s'y réfèrent par un identifiant. Relier les deux au moment de lire, c'est le travail d'une jointure."
    },
    {
      id: "p3-02", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Relier sans dédoubler",
      question: "Sans l'exécuter : combien de LIGNES cette requête renvoie-t-elle ? (la table commandes en compte 70, la table clients 40)",
      requete: "SELECT c.nom, o.date_commande FROM commandes o JOIN clients c ON c.id = o.client_id;",
      predit: "nbLignes",
      piste: "Chaque commande a exactement un client. Combien de lignes de clients viennent donc se coller à une ligne de commandes ?",
      clause: "JOIN",
      exemple: "La carte des relations de l'explorateur se lit ici « N commandes pour 1 client » : c'est le côté « N » qui donne le nombre de lignes du résultat.",
      explication: "Chaque commande pointe vers exactement un client, jamais zéro ni deux : la jointure retrouve donc une seule ligne de clients pour chacune des 70 commandes, et le résultat en compte 70. Les 40 lignes de clients n'ajoutent rien au compte — elles apportent des COLONNES (le nom), pas des lignes. Les 6 clients qui n'ont jamais commandé, eux, n'apparaissent nulle part dans ce résultat : aucune commande ne les réclame.",
      retenir: "Joindre une table à celle qu'elle pointe (une commande → son client) ne change pas le nombre de lignes : on gagne des colonnes, pas des lignes."
    },
    {
      id: "p3-03", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 1,
      titre: "Le nom du client sur chaque commande",
      question: "Pour chaque commande, affichez le nom du client qui l'a passée et la date de cette commande.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client, puis la date de la commande. Une ligne par commande.",
      solution: "SELECT c.nom, o.date_commande FROM commandes o JOIN clients c ON c.id = o.client_id",
      comparer: {},
      piste: "FROM commandes o JOIN clients c ON c.id = o.client_id : le ON dit quelle colonne de l'une correspond à quelle colonne de l'autre.",
      clause: "JOIN",
      exemple: "SELECT p.nom, l.quantite FROM lignes_commande l JOIN produits p ON p.id = l.produit_id; relie de la même façon chaque ligne de commande au produit qu'elle désigne.",
      explication: "FROM commandes o JOIN clients c ON c.id = o.client_id lit les deux tables ensemble : pour chaque commande, SQLite va chercher la ligne de clients dont l'id vaut le client_id de cette commande. Les lettres o et c sont des alias : elles évitent de réécrire le nom entier des tables, et rendent lisible de quelle table vient chaque colonne. Le résultat compte 70 lignes, une par commande.",
      retenir: "Une jointure s'écrit FROM table1 JOIN table2 ON correspondance. Préfixer les colonnes par l'alias de leur table (c.nom, o.date_commande) évite toute ambiguïté dès que deux tables ont des colonnes du même nom."
    },
    {
      id: "p3-04", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Deux tables côte à côte, mais rien de relié",
      question: "Pour chaque commande, affichez le nom du client et la date de la commande.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client, puis la date de la commande. Une ligne par commande.",
      depart: "SELECT c.nom, o.date_commande FROM commandes o, clients c",
      solution: "SELECT c.nom, o.date_commande FROM commandes o JOIN clients c ON c.id = o.client_id",
      comparer: {},
      piste: "Cette requête ne dit nulle part quel client correspond à quelle commande : que peut faire SQLite d'autre que de les essayer tous ?",
      clause: "ON",
      exemple: "SELECT COUNT(*) FROM commandes, clients; renvoie 2 800 : 70 × 40, toutes les combinaisons possibles.",
      explication: "Lister deux tables séparées par une virgule, sans condition de correspondance, associe CHAQUE commande à CHAQUE client : 70 × 40 = 2 800 lignes, dont 2 730 n'ont aucun sens — la commande d'un client y est affichée au nom de quelqu'un d'autre. Rien ne signale l'erreur : la requête s'exécute et renvoie un tableau d'apparence normale. C'est le ON qui manque, et lui seul : il réduit ces 2 800 combinaisons aux 70 qui sont vraies.",
      retenir: "Sans condition de correspondance, deux tables produisent toutes leurs combinaisons. Une jointure sans ON n'est pas une erreur de syntaxe mais une erreur de sens, bien plus difficile à repérer."
    },
    {
      id: "p3-05", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Chaque ligne avec chaque ligne",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (commandes : 70 lignes ; clients : 40 lignes)",
      requete: "SELECT COUNT(*) FROM commandes, clients;",
      predit: "valeur",
      piste: "Aucune correspondance n'est demandée : chaque ligne de la première table est associée à chacune des lignes de la seconde.",
      clause: "ON",
      exemple: "Deux tables de 3 et 4 lignes, listées sans condition, donneraient 12 lignes : 3 × 4.",
      explication: "Sans ON, SQLite forme toutes les paires possibles : la première commande avec chacun des 40 clients, puis la deuxième avec chacun des 40, et ainsi de suite. Cela fait 70 × 40 = 2 800 lignes. Ce nombre est le signe le plus reconnaissable de l'erreur : un résultat bien plus gros que n'importe laquelle des deux tables, et dont la taille est exactement leur produit.",
      retenir: "Deux tables lues sans condition de correspondance renvoient autant de lignes que le PRODUIT de leurs tailles. Un résultat anormalement gros est presque toujours une jointure dont le ON manque."
    },
    {
      id: "p3-06", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 2,
      titre: "L'identifiant de qui ?",
      question: "Pour chaque commande, affichez l'identifiant du CLIENT et la date de la commande.",
      consigne: "Deux colonnes, dans cet ordre : l'identifiant du client, puis la date de la commande.",
      depart: "SELECT o.id, o.date_commande FROM commandes o JOIN clients c ON c.id = o.client_id",
      solution: "SELECT c.id, o.date_commande FROM commandes o JOIN clients c ON c.id = o.client_id",
      comparer: {},
      piste: "Les deux tables ont une colonne id. Le préfixe (c. ou o.) décide de laquelle on parle.",
      clause: "JOIN",
      exemple: "Dans une jointure entre produits p et lignes_commande l, p.id est l'identifiant du produit et l.id celui de la ligne de commande : deux colonnes différentes, du même nom.",
      explication: "La jointure est juste, la colonne ne l'est pas : o.id est l'identifiant de la COMMANDE (1001, 1002…), pas celui du client (201, 202…). Les deux colonnes s'appellent id, s'affichent sous le même titre et contiennent des nombres : rien ne distingue le bon résultat du mauvais, sinon les valeurs elles-mêmes. Écrire c.id répond à la question posée.",
      retenir: "Après une jointure, le nom d'une colonne ne suffit plus à l'identifier : seul son préfixe de table dit de laquelle il s'agit. Deux colonnes id dans un résultat n'ont aucune raison de se ressembler."
    },
    {
      id: "p3-07", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Une ligne par ligne de produit",
      question: "Sans l'exécuter : combien de LIGNES cette requête renvoie-t-elle ? (commandes : 70 lignes ; lignes_commande : 142 lignes)",
      requete: "SELECT o.id, l.produit_id, l.quantite FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id;",
      predit: "nbLignes",
      pieges: ["P4"],
      piste: "Chaque ligne de lignes_commande appartient à une seule commande — mais une commande peut en avoir plusieurs.",
      clause: "JOIN",
      exemple: "La commande 1038 a 4 lignes de produits : à elle seule, elle occupe 4 lignes du résultat, ses colonnes (date, statut, frais de port) étant recopiées à l'identique sur chacune.",
      explication: "Chaque ligne de lignes_commande retrouve une seule commande, donc chacune des 142 produit exactement une ligne de résultat : 142. C'est l'inverse de la jointure précédente, et pour la même raison — le compte vient toujours du côté « plusieurs ». Ici, chaque commande à plusieurs lignes est répétée autant de fois qu'elle a de produits ; les 70 commandes sont bien toutes présentes, mais elles occupent 142 lignes.",
      retenir: "En joignant une table à celle qui la pointe (une commande ← ses lignes de produits), le résultat prend le nombre de lignes du côté « plusieurs ». Une commande à 4 lignes y apparaît 4 fois."
    },
    {
      id: "p3-08", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Ce que deviennent les commandes à plusieurs lignes",
      question: "La jointure entre commandes (70 lignes) et lignes_commande (142 lignes) renvoie 142 lignes. Qu'est-il arrivé à une commande qui compte 4 lignes de produits ?",
      options: [
        "Elle occupe 4 lignes du résultat, ses propres colonnes étant répétées à l'identique sur chacune",
        "Seule sa première ligne de produit a été gardée",
        "Ses 4 lignes ont été fusionnées en une seule, les quantités additionnées",
        "Elle a été écartée : le résultat ne garde que les commandes à une seule ligne"
      ],
      reponse: 0,
      pieges: ["P4"],
      piste: "Une jointure n'additionne ni ne résume rien : elle met côte à côte des lignes qui se correspondent.",
      clause: "JOIN",
      exemple: "Pour la commande 1038 (4 lignes), sa date et ses frais de port apparaissent 4 fois dans le résultat, une fois par produit commandé.",
      explication: "Une jointure ne fait que rapprocher des lignes : elle ne regroupe pas, ne résume pas, n'additionne rien. Une commande qui a 4 lignes de produits se retrouve donc recopiée 4 fois, avec sa date, son statut et ses frais de port identiques sur chacune. Tant qu'on se contente de lire, cette répétition est inoffensive et même attendue. Elle devient un piège dès qu'on additionne : c'est l'objet du chapitre suivant.",
      retenir: "Une jointure rapproche, elle ne résume pas. La répétition des colonnes du côté « une seule ligne » est normale — et c'est elle qui fausse tout total calculé ensuite sur ces colonnes."
    },
    {
      id: "p3-09", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 2,
      titre: "Le détail d'une commande, avec le nom des produits",
      question: "Affichez le détail de la commande 1038 : le nom du produit et la quantité, pour chacune de ses lignes.",
      consigne: "Deux colonnes, dans cet ordre : le nom du produit, puis la quantité. Une ligne par ligne de la commande 1038.",
      solution: "SELECT p.nom, l.quantite FROM lignes_commande l JOIN produits p ON p.id = l.produit_id WHERE l.commande_id = 1038",
      comparer: {},
      piste: "La table lignes_commande ne contient que produit_id : le nom se lit dans produits, à la ligne dont l'id vaut ce produit_id.",
      clause: "JOIN",
      exemple: "SELECT c.nom, o.date_commande FROM commandes o JOIN clients c ON c.id = o.client_id WHERE o.statut = 'livree'; filtre de la même façon, après avoir relié les deux tables.",
      explication: "La jointure relie chaque ligne de commande au produit qu'elle désigne, et le WHERE ne garde que les lignes de la commande 1038 : 4 lignes. Le WHERE porte ici sur lignes_commande, mais il aurait pu porter sur produits — une fois les tables reliées, les colonnes des deux sont disponibles pour filtrer comme pour afficher.",
      retenir: "Une fois deux tables jointes, WHERE filtre le résultat de la jointure : il peut porter indifféremment sur une colonne de l'une ou de l'autre."
    },
    {
      id: "p3-10", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Des frais de port qui doublent",
      question: "Quel est le total des frais de port de toutes les commandes de la boutique ?",
      consigne: "Une seule valeur : la somme des frais de port, chaque commande comptant une seule fois.",
      depart: "SELECT SUM(o.frais_port) FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id",
      solution: "SELECT SUM(frais_port) FROM commandes",
      comparer: {},
      pieges: ["P4"],
      piste: "Après la jointure, une commande à plusieurs lignes apparaît plusieurs fois — et ses frais de port avec elle. La question porte-t-elle sur les lignes de produits ?",
      clause: "SUM",
      exemple: "La commande 1038 a 4 lignes et 6,50 € de frais de port : après la jointure, ces 6,50 € sont comptés 4 fois, soit 26,00 €.",
      explication: "La requête de départ additionne frais_port sur les 142 lignes du résultat joint, au lieu des 70 commandes : chaque commande à plusieurs lignes y voit ses frais comptés autant de fois qu'elle a de produits. Le total passe ainsi de 306,50 € à 636,00 € — plus du double, sans la moindre erreur affichée. La correction n'est pas d'ajuster le calcul mais de retirer la jointure : la question ne porte que sur commandes, aucune autre table n'a à intervenir.",
      retenir: "Ne joignez que les tables dont la question a besoin. Additionner une colonne de la table « une seule ligne » après une jointure la compte une fois par ligne liée, et gonfle le total sans rien signaler."
    },
    {
      id: "p3-11", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Dans quel sens se trompe-t-on ?",
      question: "Un total calculé sur une colonne de commandes APRÈS une jointure avec lignes_commande est faux. Dans quel sens, et pourquoi ?",
      options: [
        "Trop grand : la valeur de chaque commande est comptée autant de fois qu'elle a de lignes de produits",
        "Trop petit : seules les commandes à une seule ligne de produit sont comptées",
        "Trop grand ou trop petit, selon l'ordre dans lequel les deux tables sont écrites",
        "Juste, mais arrondi différemment parce que le résultat contient plus de lignes"
      ],
      reponse: 0,
      pieges: ["P4"],
      piste: "Une commande à une seule ligne de produit est comptée une fois, une commande à quatre lignes l'est quatre fois : le total peut-il être trop petit ?",
      clause: "SUM",
      exemple: "Sur la boutique entière, le total des frais de port passe de 306,50 € à 636,00 € une fois la jointure posée.",
      explication: "Chaque commande est comptée autant de fois qu'elle a de lignes liées — soit une fois au minimum. Aucune ne peut donc être sous-comptée, et toute commande à plusieurs lignes est sur-comptée : le total est toujours trop grand, jamais trop petit. L'ordre des tables dans le FROM n'y change rien, une jointure est symétrique. Et l'écart n'a rien d'un arrondi : il se chiffre ici à plus du double.",
      retenir: "Le gonflement par jointure ne va que dans un sens : vers le haut. Un total qui augmente après l'ajout d'une jointure n'est jamais une coïncidence."
    },
    {
      id: "p3-12", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Combien de commandes, vraiment ?",
      question: "Dans le résultat qui relie commandes et lignes_commande, combien de commandes DIFFÉRENTES apparaissent ?",
      consigne: "Une seule valeur : le nombre de commandes différentes présentes dans ce résultat. La jointure doit figurer dans votre requête.",
      solution: "SELECT COUNT(DISTINCT o.id) FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id",
      comparer: {},
      pieges: ["P4"],
      piste: "COUNT(*) compterait les 142 lignes du résultat. Ce qu'on veut, c'est le nombre d'identifiants de commande DIFFÉRENTS.",
      clause: "COUNT",
      exemple: "SELECT COUNT(DISTINCT produit_id) FROM lignes_commande; compte les produits différents qui ont été commandés, pas les lignes de commande.",
      explication: "COUNT(*) renvoie ici 142 : le nombre de lignes du résultat joint, où les commandes à plusieurs produits sont répétées. COUNT(DISTINCT o.id) ne compte chaque identifiant de commande qu'une fois, et renvoie 70 — le nombre réel de commandes concernées. C'est le même piège que le total gonflé, sur un compte plutôt que sur une somme, et DISTINCT est l'outil qui le neutralise quand la jointure, elle, est nécessaire.",
      retenir: "Après une jointure, COUNT(*) compte des lignes de résultat, pas des objets du monde réel. Pour compter des commandes, des clients ou des produits, c'est COUNT(DISTINCT identifiant) qu'il faut."
    },
    {
      id: "p3-13", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Tout le monde, même sans commande",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (la table clients compte 40 lignes)",
      requete: "SELECT COUNT(DISTINCT c.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id;",
      predit: "valeur",
      pieges: ["P1"],
      piste: "LEFT JOIN garde toutes les lignes de la table de GAUCHE, celle écrite avant lui. Laquelle est-ce ici ?",
      clause: "LEFT JOIN",
      exemple: "FROM clients c LEFT JOIN commandes o : clients est à gauche, donc aucun client ne peut disparaître du résultat.",
      explication: "LEFT JOIN garde chaque ligne de la table de gauche, qu'elle ait ou non une correspondance à droite : les 40 clients sont donc tous présents, et COUNT(DISTINCT c.id) en compte 40. Un client qui a commandé plusieurs fois occupe plusieurs lignes, mais DISTINCT ne le compte qu'une ; un client sans aucune commande occupe une ligne où toutes les colonnes de commandes valent NULL, et il compte lui aussi pour un.",
      retenir: "LEFT JOIN garantit que la table de gauche est intégralement conservée : son nombre de lignes distinctes ne peut pas diminuer, quoi qu'il y ait à droite."
    },
    {
      id: "p3-14", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 2,
      titre: "Chaque client, avec ses commandes s'il en a",
      question: "Affichez le nom de chaque client et l'identifiant de ses commandes, en gardant aussi les clients qui n'ont jamais commandé.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client, puis l'identifiant de la commande. Les clients sans commande doivent apparaître, avec un identifiant vide.",
      solution: "SELECT c.nom, o.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id",
      comparer: {},
      pieges: ["P1"],
      piste: "Une jointure ordinaire écarterait les clients sans correspondance. Laquelle les garde ?",
      clause: "LEFT JOIN",
      exemple: "SELECT p.nom, l.quantite FROM produits p LEFT JOIN lignes_commande l ON l.produit_id = p.id; garde de même les produits jamais commandés.",
      explication: "Le résultat compte 76 lignes : les 70 commandes, chacune à côté du nom de son client, plus 6 lignes pour les clients qui n'ont jamais commandé — avec un identifiant de commande vide. Une jointure ordinaire n'en aurait renvoyé que 70, et ces 6 clients auraient disparu sans que rien ne le signale. L'ordre des tables compte : c'est clients, écrite à gauche, qui est intégralement conservée.",
      retenir: "LEFT JOIN sert dès que la question inclut les cas vides : « tous les clients, même ceux qui… ». La table à conserver s'écrit à gauche."
    },
    {
      id: "p3-15", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Ce qu'il y a dans les colonnes de droite",
      question: "Dans un LEFT JOIN, que contiennent les colonnes de la table de DROITE, sur une ligne de gauche qui n'a aucune correspondance ?",
      options: [
        "NULL : la ligne de gauche est gardée, et les colonnes de droite restent vides",
        "Zéro pour les colonnes numériques, et un texte vide pour les autres",
        "Les valeurs de la ligne précédente du résultat",
        "Rien du tout : cette ligne n'apparaît pas dans le résultat"
      ],
      reponse: 0,
      pieges: ["P1", "P3"],
      piste: "Que vaut une information qui n'existe pas ? C'est le même mot que pour une ville non renseignée.",
      clause: "LEFT JOIN",
      exemple: "Pour un client sans commande, o.id, o.date_commande et o.statut valent tous NULL sur la ligne qui lui correspond.",
      explication: "La ligne existe bel et bien dans le résultat — c'est tout l'intérêt du LEFT JOIN — mais il n'y a rien à mettre dans les colonnes de droite : elles valent NULL, l'absence de valeur déjà rencontrée au palier 2. Ce n'est ni zéro ni un texte vide, et la distinction est décisive : c'est ce NULL qui permet, juste après, de retrouver précisément les lignes sans correspondance, et c'est lui aussi qui piège COUNT(*) et les conditions écrites dans un WHERE.",
      retenir: "Une ligne sans correspondance est conservée avec toutes les colonnes de droite à NULL. Ce NULL est la trace de l'absence — et le moyen de la retrouver."
    },
    {
      id: "p3-16", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Les clients qui n'ont jamais commandé",
      question: "Quels clients n'ont jamais passé la moindre commande ?",
      consigne: "Une colonne : le nom de ces clients. Une ligne par client concerné.",
      solution: "SELECT c.nom FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE o.id IS NULL",
      comparer: {},
      pieges: ["P1"],
      piste: "Gardez d'abord tous les clients avec un LEFT JOIN, puis ne conservez que ceux dont la commande est restée vide.",
      clause: "IS NULL",
      exemple: "SELECT p.nom FROM produits p LEFT JOIN lignes_commande l ON l.produit_id = p.id WHERE l.produit_id IS NULL; retrouve de la même façon les produits jamais commandés.",
      explication: "C'est une anti-jointure : on relie les deux tables en gardant tout à gauche, puis on ne retient QUE les lignes où la droite est restée vide. Le WHERE o.id IS NULL ne parle donc pas d'un identifiant manquant dans la base — il désigne les lignes pour lesquelles la jointure n'a rien trouvé. Six clients répondent à la question. Retenez ce nombre : le prochain exercice en dépend.",
      retenir: "Chercher ce qui n'existe pas s'écrit en deux temps : LEFT JOIN pour tout garder, puis WHERE colonne_de_droite IS NULL pour ne retenir que les absences."
    },
    {
      id: "p3-17", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Ceux qui restent",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (la table clients compte 40 lignes, et l'exercice précédent a établi que 6 d'entre eux n'ont jamais commandé)",
      requete: "SELECT COUNT(DISTINCT c.id) FROM clients c JOIN commandes o ON o.client_id = c.id;",
      predit: "valeur",
      pieges: ["P1"],
      piste: "Une jointure ordinaire ne garde que les lignes qui ont une correspondance des DEUX côtés. Qui perd sa place ?",
      clause: "JOIN",
      exemple: "Le même calcul avec LEFT JOIN renvoie 40 : c'est le seul mot qui change entre les deux requêtes, et il vaut 6 clients.",
      explication: "Une jointure ordinaire écarte toute ligne de gauche sans correspondance à droite : les 6 clients sans commande disparaissent, et il reste 40 − 6 = 34 clients distincts. Le résultat ne contient aucun signe de cette disparition — ni message, ni ligne vide. C'est la différence la plus importante du palier : le même calcul, sur la même base, renvoie 34 ou 40 selon un seul mot.",
      retenir: "JOIN et LEFT JOIN ne comptent pas la même population : la jointure ordinaire perd silencieusement les lignes sans correspondance. Choisir entre les deux, c'est répondre à « les cas vides font-ils partie de la question ? »."
    },
    {
      id: "p3-18", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 2,
      titre: "Six clients ont disparu",
      question: "Pour chaque client, affichez son nom et l'identifiant de ses commandes — y compris les clients qui n'en ont aucune.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client, puis l'identifiant de la commande. Les clients sans commande doivent apparaître, avec un identifiant vide.",
      depart: "SELECT c.nom, o.id FROM clients c JOIN commandes o ON o.client_id = c.id",
      solution: "SELECT c.nom, o.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id",
      comparer: {},
      pieges: ["P1"],
      piste: "La consigne demande explicitement les clients sans commande. Une jointure ordinaire peut-elle les renvoyer ?",
      clause: "LEFT JOIN",
      exemple: "70 lignes avec JOIN, 76 avec LEFT JOIN : les 6 lignes d'écart sont exactement les clients qui n'ont jamais commandé.",
      explication: "La requête de départ renvoie 70 lignes au lieu de 76, et rien ne dit lesquelles manquent : les 6 clients sans commande sont écartés par la jointure elle-même, avant même qu'on puisse les voir. Un seul mot sépare les deux requêtes. C'est le genre d'erreur qui ne se remarque qu'en recomptant, et qui fausse ensuite tout chiffre tiré de ce résultat — une moyenne par client, par exemple, serait calculée sur 34 clients au lieu de 40.",
      retenir: "Quand une consigne contient « y compris ceux qui n'ont pas… », la jointure ordinaire est forcément fausse : c'est LEFT JOIN qu'elle demande."
    },
    {
      id: "p3-19", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 3,
      titre: "Une ligne, même sans commande",
      question: "Le client 215 n'a jamais passé de commande. Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ?",
      requete: "SELECT COUNT(*) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE c.id = 215;",
      predit: "valeur",
      pieges: ["P1"],
      piste: "COUNT(*) compte des LIGNES de résultat. Le LEFT JOIN a-t-il produit une ligne pour ce client ?",
      clause: "COUNT",
      exemple: "Cette ligne existe avec o.id, o.statut et o.date_commande tous à NULL : elle est vide à droite, mais elle est bien là.",
      explication: "Le LEFT JOIN garde le client 215 et lui donne une ligne, dont toutes les colonnes de commandes valent NULL. COUNT(*) compte les lignes sans regarder leur contenu : il en trouve une, et renvoie 1. Un client sans aucune commande est donc crédité d'une commande par ce calcul — l'erreur la plus courante après un LEFT JOIN, et elle se propage silencieusement dans toute moyenne ou tout classement fondé dessus.",
      retenir: "Après un LEFT JOIN, COUNT(*) renvoie 1 et non 0 pour une ligne sans correspondance : la ligne existe, même vide à droite."
    },
    {
      id: "p3-20", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 3,
      titre: "L'écart entre les deux comptes",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (ce LEFT JOIN produit 76 lignes, pour 70 commandes au total)",
      requete: "SELECT COUNT(*) - COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id;",
      predit: "valeur",
      pieges: ["P1", "P3"],
      piste: "COUNT(*) compte les 76 lignes du résultat. COUNT(o.id) ne compte que celles où une commande a vraiment été trouvée. Combien de lignes séparent les deux ?",
      clause: "COUNT",
      exemple: "La règle vient du palier 2 : COUNT(ville) ignore les clients sans ville. Ici, COUNT(o.id) ignore les lignes où la jointure n'a rien trouvé.",
      explication: "COUNT(*) compte les 76 lignes du résultat, sans regarder leur contenu. COUNT(o.id) ne compte que les lignes où l'identifiant de commande est renseigné, soit les 70 vraies commandes : les lignes créées par le LEFT JOIN pour les clients sans commande y valent NULL et ne sont pas comptées. L'écart, 76 − 70 = 6, est exactement le nombre de clients qui n'ont jamais commandé. Pour un seul de ces clients pris isolément, le même contraste donnerait 1 et 0.",
      retenir: "Après un LEFT JOIN, COUNT(*) et COUNT(colonne_de_droite) diffèrent précisément du nombre de lignes sans correspondance. C'est pourquoi un comptage doit toujours porter sur une colonne de la table de droite."
    },
    {
      id: "p3-21", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Zéro commande, ou une ?",
      question: "Pour chaque client, affichez son nom et son nombre de commandes. Les clients qui n'ont jamais commandé doivent afficher 0.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client, puis son nombre de commandes. Une ligne par client, les 40 clients compris.",
      depart: "SELECT c.nom, COUNT(*) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id",
      solution: "SELECT c.nom, COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id",
      comparer: {},
      pieges: ["P1", "P3"],
      piste: "Le LEFT JOIN est juste, le regroupement aussi. Ce qui est compté ne l'est pas : que compte COUNT(*) pour un client sans commande ?",
      clause: "COUNT",
      exemple: "Le client 215 n'a aucune commande : COUNT(*) le crédite de 1, COUNT(o.id) renvoie bien 0.",
      explication: "Les 40 clients sont bien là et le regroupement est correct, mais les 6 clients sans commande affichent 1 au lieu de 0 : COUNT(*) compte la ligne que le LEFT JOIN a créée pour eux, alors qu'elle ne représente aucune commande. COUNT(o.id) ne compte que les commandes réellement trouvées. C'est une erreur particulièrement traître : le tableau a le bon nombre de lignes, les bons noms, et seuls six chiffres sur quarante sont faux.",
      retenir: "LEFT JOIN et COUNT(*) ne vont jamais ensemble. Dès qu'un comptage suit un LEFT JOIN, comptez une colonne de la table de droite."
    },
    {
      id: "p3-22", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 3,
      titre: "La condition qui ne chasse personne",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (la table clients compte 40 lignes ; 13 clients n'ont aucune commande livrée)",
      requete: "SELECT COUNT(DISTINCT c.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id AND o.statut = 'livree';",
      predit: "valeur",
      pieges: ["P1"],
      piste: "La condition sur le statut est écrite dans le ON, pas dans un WHERE : elle décide de ce qui se RELIE, pas de ce qui est GARDÉ.",
      clause: "ON",
      exemple: "Un client sans commande livrée reste présent, avec toutes ses colonnes de commandes à NULL : la condition l'a privé de correspondance, pas de ligne.",
      explication: "Une condition placée dans le ON fait partie de la définition de la correspondance : elle détermine quelles commandes viennent se relier à chaque client, et rien de plus. Le LEFT JOIN continue, lui, de garantir que tout client figure dans le résultat — les 13 qui n'ont aucune commande livrée y apparaissent simplement avec des colonnes vides. COUNT(DISTINCT c.id) renvoie donc 40, et non 27.",
      retenir: "Une condition dans le ON restreint ce qui se relie ; elle ne retire jamais une ligne de la table de gauche d'un LEFT JOIN."
    },
    {
      id: "p3-23", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Le filtre qui annule le LEFT JOIN",
      question: "Affichez le nom de chaque client et l'identifiant de ses commandes LIVRÉES, en gardant tous les clients — même ceux qui n'ont aucune commande livrée.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client, puis l'identifiant de la commande livrée. Les 40 clients doivent apparaître ; ceux sans commande livrée auront un identifiant vide.",
      depart: "SELECT c.nom, o.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE o.statut = 'livree'",
      solution: "SELECT c.nom, o.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id AND o.statut = 'livree'",
      comparer: {},
      pieges: ["P1", "P3"],
      piste: "Sur la ligne d'un client sans commande livrée, o.statut vaut NULL. Que lui fait un WHERE o.statut = 'livree' ?",
      clause: "ON",
      exemple: "46 lignes avec le WHERE, 59 avec la condition dans le ON : les 13 lignes d'écart sont les clients sans commande livrée.",
      explication: "Le LEFT JOIN garde bien tous les clients, mais le WHERE s'applique APRÈS, sur le résultat de la jointure : pour un client sans commande livrée, o.statut vaut NULL, la condition NULL = 'livree' n'est jamais vraie, et la ligne est éliminée. Le LEFT JOIN est ainsi annulé sans que rien ne le signale — il ne reste que 46 lignes, exactement ce qu'une jointure ordinaire aurait donné. Déplacer la condition dans le ON la fait participer à la correspondance au lieu de filtrer après coup.",
      retenir: "Une condition sur la table de droite d'un LEFT JOIN se met dans le ON. Dans un WHERE, elle élimine les lignes sans correspondance et transforme le LEFT JOIN en jointure ordinaire."
    },
    {
      id: "p3-24", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 3,
      titre: "Pourquoi le WHERE efface les lignes gardées",
      question: "Après un LEFT JOIN, une ligne sans correspondance a toutes ses colonnes de droite à NULL. Que lui fait un WHERE o.statut = 'livree' ?",
      options: [
        "Il l'élimine : NULL = 'livree' n'est jamais vrai, et le LEFT JOIN se trouve annulé",
        "Il la garde : un WHERE ne s'applique qu'aux lignes qui ont trouvé une correspondance",
        "Il la garde et remplace le NULL par la valeur testée",
        "Il provoque une erreur : une colonne NULL ne peut pas être comparée à un texte"
      ],
      reponse: 0,
      pieges: ["P1", "P3"],
      piste: "La règle du palier 2 sur NULL n'a pas changé : une comparaison avec NULL n'est jamais vraie, et un WHERE ne garde que ce qui est vrai.",
      clause: "WHERE",
      exemple: "C'est la même raison qui fait que WHERE ville <> 'Lyon' ne ramène pas les clients dont la ville est vide.",
      explication: "Un WHERE ne garde que les lignes pour lesquelles sa condition est VRAIE. Une comparaison avec NULL n'est ni vraie ni fausse : elle est inconnue, donc la ligne est écartée — exactement comme au palier 2, où ville <> 'Lyon' laissait de côté les clients sans ville. Aucune erreur n'est levée, et le résultat ressemble à s'y méprendre à celui d'une jointure ordinaire. C'est pourquoi la condition doit être écrite dans le ON, où elle n'a pas à être vraie pour que la ligne de gauche subsiste.",
      retenir: "Un WHERE sur une colonne de la table de droite élimine les lignes sans correspondance, puisque leur NULL ne satisfait aucune condition. La place de la condition — ON ou WHERE — change le sens de la requête."
    },
    {
      id: "p3-25", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Les produits que personne n'a jamais commandés",
      question: "Quels produits du catalogue n'ont jamais été commandés, pas même une fois ?",
      consigne: "Une colonne : le nom de ces produits. Une ligne par produit concerné.",
      solution: "SELECT p.nom FROM produits p LEFT JOIN lignes_commande l ON l.produit_id = p.id WHERE l.produit_id IS NULL",
      comparer: {},
      pieges: ["P2"],
      piste: "Même forme que pour les clients sans commande : tout garder à gauche, puis ne retenir que les lignes restées vides à droite.",
      clause: "IS NULL",
      exemple: "SELECT c.nom FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE o.id IS NULL; applique la même anti-jointure aux clients.",
      explication: "Cinq produits sur trente n'apparaissent dans aucune ligne de commande. L'anti-jointure est la seule façon simple de les trouver : la table produits ne contient aucune colonne qui dirait « jamais vendu », et la table lignes_commande ne peut pas, par construction, contenir la trace d'une vente qui n'a pas eu lieu. On cherche donc une absence, et une absence ne se lit que dans le vide laissé par la jointure.",
      retenir: "L'anti-jointure répond aux questions en « jamais », « aucun », « sans » : ce sont les seules que les données ne contiennent pas directement, et qu'il faut déduire d'une correspondance manquante."
    },
    {
      id: "p3-26", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Un rayon vide",
      question: "Y a-t-il une catégorie du catalogue qui ne contient aucun produit ? Laquelle ?",
      consigne: "Une colonne : le nom de la ou des catégories concernées.",
      solution: "SELECT c.nom FROM categories c LEFT JOIN produits p ON p.categorie_id = c.id WHERE p.id IS NULL",
      comparer: {},
      pieges: ["P2"],
      piste: "La même anti-jointure, un cran plus haut : les catégories sont pointées par les produits, comme les clients le sont par les commandes.",
      clause: "IS NULL",
      exemple: "Les 7 catégories sont visibles dans l'explorateur ; une seule n'est citée par aucun produit.",
      explication: "La catégorie Jardin existe dans le catalogue mais aucun produit ne la désigne : la jointure ne lui trouve aucune correspondance, et c'est le NULL laissé à droite qui la révèle. Cette question se pose exactement comme celle des clients sans commande — seules changent les deux tables et la colonne qui les relie. C'est la forme à reconnaître plutôt qu'à réapprendre.",
      retenir: "L'anti-jointure ne dépend pas des tables : dès qu'une table en pointe une autre, elle répond à « lesquelles ne sont jamais pointées ? »."
    },
    {
      id: "p3-27", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Une anti-jointure qui ne renvoie rien",
      question: "Quels clients n'ont jamais passé de commande ?",
      consigne: "Une colonne : le nom de ces clients. Une ligne par client concerné.",
      depart: "SELECT c.nom FROM clients c JOIN commandes o ON o.client_id = c.id WHERE o.id IS NULL",
      solution: "SELECT c.nom FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE o.id IS NULL",
      comparer: {},
      pieges: ["P1"],
      piste: "Cette requête ne renvoie aucune ligne. Dans une jointure ordinaire, une ligne peut-elle avoir une colonne de droite à NULL ?",
      clause: "LEFT JOIN",
      exemple: "Remplacer JOIN par LEFT JOIN suffit : le reste de la requête est déjà juste.",
      explication: "Le résultat est vide, et c'est logique : une jointure ordinaire ne conserve que les lignes qui ONT une correspondance, donc o.id y a toujours une valeur. Chercher o.id IS NULL dans ce résultat, c'est chercher ce que la jointure vient d'éliminer — la condition ne peut jamais être vraie. L'anti-jointure a besoin du LEFT JOIN pour que les lignes sans correspondance soient présentes ; c'est seulement à cette condition que le IS NULL a quelque chose à trouver.",
      retenir: "Un résultat vide alors qu'on attendait des lignes est le symptôme d'une anti-jointure écrite avec JOIN : sans LEFT, les lignes qu'on cherche ont déjà été écartées."
    },
    {
      id: "p3-28", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Ce que le IS NULL désigne vraiment",
      question: "Dans une anti-jointure (LEFT JOIN, puis WHERE o.id IS NULL), que signifie exactement une ligne où o.id vaut NULL ?",
      options: [
        "Aucune ligne de la table de droite ne correspondait à cette ligne de gauche",
        "La commande existe, mais son identifiant n'a pas été renseigné dans la base",
        "La commande a été supprimée de la base après avoir été passée",
        "La jointure a échoué pour cette ligne, et SQLite le signale par un NULL"
      ],
      reponse: 0,
      pieges: ["P1", "P3"],
      piste: "Ce NULL était-il dans la base avant la requête, ou est-il apparu pendant ?",
      clause: "IS NULL",
      exemple: "La colonne commandes.id est une clé primaire : elle ne peut jamais être vide dans la table. Le NULL observé ici n'existe que dans le résultat.",
      explication: "Ce NULL n'est pas une donnée manquante de la base : c'est le LEFT JOIN qui l'a fabriqué, pour remplir des colonnes qui n'avaient aucune ligne à recevoir. La distinction est essentielle — une clé primaire comme commandes.id ne peut pas être vide dans la table, donc un o.id à NULL ne peut venir que d'une correspondance introuvable. C'est ce qui rend l'anti-jointure fiable : tester ce NULL revient exactement à tester l'absence de correspondance.",
      retenir: "Le NULL d'une anti-jointure est produit par la jointure elle-même, pas lu dans la base. Testez-le de préférence sur une colonne qui ne peut jamais être vide (la clé primaire), pour qu'il ne signifie rien d'autre qu'une absence de correspondance."
    },
    {
      id: "p3-29", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Le client et ses produits, en une seule requête",
      question: "Pour la commande 1038, affichez le nom du client qui l'a passée et le nom de chaque produit qu'elle contient.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client (nommé client), puis le nom du produit (nommé produit). Une ligne par produit de la commande 1038.",
      solution: "SELECT c.nom AS client, p.nom AS produit FROM commandes o JOIN clients c ON c.id = o.client_id JOIN lignes_commande l ON l.commande_id = o.id JOIN produits p ON p.id = l.produit_id WHERE o.id = 1038",
      comparer: {},
      piste: "Enchaînez les jointures : commandes mène à clients d'un côté, à lignes_commande puis produits de l'autre. Chaque JOIN a son propre ON.",
      clause: "JOIN",
      exemple: "AS sert ici à distinguer deux colonnes qui s'appelleraient toutes deux nom : c.nom AS client, p.nom AS produit.",
      explication: "Une requête peut enchaîner autant de jointures que nécessaire, chacune avec son ON : on part de commandes, on remonte vers clients par client_id, on descend vers lignes_commande par commande_id, puis vers produits par produit_id. Le chemin suit les flèches de la carte des relations. Les deux tables clients et produits ont une colonne nom : sans les alias de colonne posés par AS, le résultat afficherait deux colonnes du même titre.",
      retenir: "Les jointures s'enchaînent, chacune avec son propre ON. Le chemin à suivre est celui des clés étrangères, lisible sur la carte des relations."
    },
    {
      id: "p3-30", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 3,
      titre: "Trois tables, combien de lignes ?",
      question: "Sans l'exécuter : combien de LIGNES cette requête renvoie-t-elle ? (commandes : 70 lignes ; lignes_commande : 142 ; produits : 30)",
      requete: "SELECT o.id, p.nom, l.quantite FROM lignes_commande l JOIN produits p ON p.id = l.produit_id JOIN commandes o ON o.id = l.commande_id;",
      predit: "nbLignes",
      pieges: ["P4"],
      piste: "Chaque ligne de lignes_commande désigne un seul produit et une seule commande. Combien de correspondances chacune trouve-t-elle donc ?",
      clause: "JOIN",
      exemple: "Les deux jointures partent de lignes_commande vers les tables qu'elle pointe : ni l'une ni l'autre ne peut la dédoubler.",
      explication: "Les deux jointures partent de lignes_commande et vont vers les tables qu'elle POINTE : chacune de ses 142 lignes trouve exactement un produit et exactement une commande. Le nombre de lignes reste donc 142, quel que soit le nombre de jointures ajoutées dans ce sens. Enchaîner des jointures ne multiplie pas mécaniquement les lignes : seul compte, à chaque étape, le sens dans lequel le fil est tendu.",
      retenir: "Ajouter une jointure vers une table pointée n'ajoute jamais de lignes. Le nombre de lignes n'augmente qu'en allant vers une table qui pointe, du côté « plusieurs »."
    },
    {
      id: "p3-31", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "La quantité vendue de chaque produit",
      question: "Pour chaque produit commandé au moins une fois, quelle quantité totale en a été vendue ? Les commandes annulées ne comptent pas ; les retours, si.",
      consigne: "Deux colonnes, dans cet ordre : le nom du produit, puis la quantité totale vendue. Une ligne par produit concerné.",
      solution: "SELECT p.nom, SUM(l.quantite) FROM lignes_commande l JOIN produits p ON p.id = l.produit_id JOIN commandes o ON o.id = l.commande_id WHERE o.statut <> 'annulee' GROUP BY p.id",
      comparer: {},
      pieges: ["P7"],
      piste: "La quantité est dans lignes_commande, le nom dans produits, le statut dans commandes : les trois tables sont nécessaires. Regroupez ensuite par produit.",
      clause: "GROUP BY",
      exemple: "SELECT p.nom, SUM(l.quantite) … GROUP BY p.id : regrouper par l'identifiant plutôt que par le nom évite de confondre deux produits qui porteraient le même nom.",
      explication: "C'est la première requête du palier qui joint ET regroupe. Les trois tables sont indispensables : la quantité vient de lignes_commande, le nom de produits, et le statut — qui décide ce qui compte comme vendu — de commandes. Ici la jointure est légitime et le SUM porte bien sur une colonne de lignes_commande, du côté « plusieurs » : aucun gonflement. La définition de « vendu » vient de la consigne, qui dit explicitement que les annulées sortent et que les retours restent.",
      retenir: "Jointure et regroupement se combinent sans difficulté tant que la colonne additionnée appartient à la table du côté « plusieurs »."
    },
    {
      id: "p3-32", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Un ON recopié trop vite",
      question: "Pour la commande 1038, affichez le nom du client et le nom de chaque produit commandé.",
      consigne: "Deux colonnes, dans cet ordre : le nom du client (nommé client), puis le nom du produit (nommé produit). Une ligne par produit de la commande 1038.",
      depart: "SELECT c.nom AS client, p.nom AS produit FROM commandes o JOIN clients c ON c.id = o.client_id JOIN lignes_commande l ON l.commande_id = o.id JOIN produits p ON p.id = l.commande_id WHERE o.id = 1038",
      solution: "SELECT c.nom AS client, p.nom AS produit FROM commandes o JOIN clients c ON c.id = o.client_id JOIN lignes_commande l ON l.commande_id = o.id JOIN produits p ON p.id = l.produit_id WHERE o.id = 1038",
      comparer: {},
      piste: "Cette requête ne renvoie aucune ligne. Regardez le dernier ON : à quoi compare-t-on l'identifiant d'un produit ?",
      clause: "ON",
      exemple: "Les identifiants de produits vont de 101 à 130 ; ceux des commandes commencent à 1001. Aucun ne peut correspondre à l'autre.",
      explication: "Le dernier ON compare p.id à l.commande_id au lieu de l.produit_id : il demande le produit dont l'identifiant vaut 1038, qui n'existe pas. Aucune correspondance, donc aucune ligne. C'est l'erreur type du ON recopié d'une jointure à l'autre sans changer la colonne. Elle se repère ici au résultat vide — mais si les identifiants des deux tables s'étaient recouverts, la requête aurait renvoyé des lignes, toutes fausses, et le résultat aurait eu l'air normal.",
      retenir: "Chaque jointure a son propre ON, et chaque ON sa propre colonne. Un résultat vide sur une requête à plusieurs jointures désigne presque toujours le ON recopié sans être adapté."
    },
    {
      id: "p3-33", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Payé hier, affiché aujourd'hui",
      question: "Combien de lignes de commande ont été facturées à un prix différent du prix actuel du produit ?",
      consigne: "Une seule valeur : le nombre de lignes de commande dont le prix facturé diffère du prix affiché aujourd'hui dans le catalogue.",
      solution: "SELECT COUNT(*) FROM lignes_commande l JOIN produits p ON p.id = l.produit_id WHERE l.prix_unitaire <> p.prix",
      comparer: {},
      pieges: ["P10"],
      piste: "Deux prix existent : celui figé sur la ligne de commande (prix_unitaire) et celui du catalogue (prix). La jointure permet de les comparer.",
      clause: "JOIN",
      exemple: "La commande 1004 contient une tablette facturée 479,00 €, alors que le catalogue l'affiche aujourd'hui à 449,00 €.",
      explication: "La table lignes_commande conserve le prix FACTURÉ au moment de la commande ; la table produits porte le prix ACTUEL. Les deux cohabitent volontairement, et la jointure est le seul moyen de les confronter : 22 lignes sur 142 ont été facturées à un autre prix que celui affiché aujourd'hui. Toutes sont antérieures à octobre 2025 — ce sont les prix qui ont changé depuis, pas les commandes qui ont été mal saisies.",
      retenir: "Un prix facturé n'est pas un prix actuel : une commande garde la trace de ce qui a été payé, pas de ce que coûte l'article aujourd'hui."
    },
    {
      id: "p3-34", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Pourquoi le prix est écrit deux fois",
      question: "La table produits contient déjà le prix de chaque article. Pourquoi lignes_commande porte-t-elle en plus une colonne prix_unitaire ?",
      options: [
        "Pour figer le prix payé : il ne doit pas changer quand le catalogue est mis à jour",
        "Par erreur de conception : cette colonne fait double emploi avec produits.prix",
        "Pour accélérer les requêtes, en évitant d'avoir à joindre les deux tables",
        "Parce que SQLite interdit de lire le prix d'une autre table dans un calcul"
      ],
      reponse: 0,
      pieges: ["P10"],
      piste: "Que deviendrait le montant d'une commande de l'an dernier si le prix du produit changeait demain ?",
      clause: "JOIN",
      exemple: "La tablette vaut 449,00 € aujourd'hui, mais la commande 1004 a bien été payée 479,00 € : son montant ne doit pas bouger.",
      explication: "C'est l'exception qui confirme la règle du chapitre 1 : une information n'est écrite qu'une fois, SAUF quand elle doit être figée. Le prix du catalogue change avec le temps ; le prix payé, lui, appartient à l'histoire de la commande et ne doit jamais bouger. Recopier le prix sur la ligne de commande n'est donc pas une redondance mais une conservation — sans elle, le montant de toutes les commandes passées se recalculerait à chaque changement de tarif.",
      retenir: "Une valeur recopiée dans une table n'est pas toujours une faute : quand elle doit témoigner d'un moment précis (un prix payé), la figer est la bonne conception."
    },
    {
      id: "p3-35", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Le montant recalculé au prix d'aujourd'hui",
      question: "Quel montant de produits la commande 1004 a-t-elle représenté ?",
      consigne: "Une seule valeur : le montant des produits réellement facturés sur cette commande, frais de port exclus.",
      depart: "SELECT SUM(l.quantite * p.prix) FROM lignes_commande l JOIN produits p ON p.id = l.produit_id WHERE l.commande_id = 1004",
      solution: "SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l WHERE l.commande_id = 1004",
      comparer: {},
      pieges: ["P10"],
      piste: "Deux prix sont disponibles après cette jointure. Lequel la commande a-t-elle réellement facturé ?",
      clause: "SUM",
      exemple: "498,50 € avec le prix facturé, 468,50 € avec le prix d'aujourd'hui : 30,00 € d'écart, dus à la seule tablette.",
      explication: "La requête de départ multiplie les quantités par le prix ACTUEL du catalogue : elle recalcule la commande aux tarifs d'aujourd'hui et renvoie 468,50 € au lieu des 498,50 € réellement facturés. L'écart vient de la tablette, passée de 479,00 € à 449,00 €. Une fois la bonne colonne choisie, la jointure elle-même devient inutile : prix_unitaire est déjà dans lignes_commande, et la question ne demande rien d'autre.",
      retenir: "Tout montant historique se calcule avec prix_unitaire, jamais avec le prix du catalogue. Et si la colonne voulue est déjà dans la table de départ, la jointure est superflue."
    },
    {
      id: "p3-36", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Le chiffre d'affaires produits de la boutique",
      question: "Quel est le chiffre d'affaires PRODUITS de toute la boutique ? Les commandes annulées et retournées en sont exclues.",
      consigne: "Une seule valeur : la somme des quantités multipliées par les prix facturés, pour les commandes qui ne sont ni annulées ni retournées. Les frais de port sont exclus.",
      solution: "SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut NOT IN ('annulee','retournee')",
      comparer: {},
      pieges: ["P7"],
      piste: "Le montant est dans lignes_commande, le statut dans commandes : c'est la jointure qui permet de filtrer l'un par l'autre.",
      clause: "JOIN",
      exemple: "Au palier 2, cette question ne pouvait porter que sur une seule commande à la fois : il manquait la jointure pour atteindre le statut.",
      explication: "Le calcul attendu depuis le palier 2 est enfin possible : 12 387,00 €. La jointure sert ici uniquement à filtrer — aucune colonne de commandes n'est affichée, mais c'est elle qui porte le statut. Le SUM reste sur lignes_commande, du côté « plusieurs », donc rien n'est gonflé. Les frais de port sont volontairement hors du compte : c'est ce que « produits » signifie, et c'est pourquoi la consigne le dit.",
      retenir: "Une jointure peut ne servir qu'à filtrer : la table jointe n'apparaît pas dans le résultat, mais c'est elle qui porte la condition."
    },
    {
      id: "p3-37", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Un chiffre d'affaires qui compte les annulées",
      question: "Quel est le chiffre d'affaires PRODUITS de toute la boutique ? Les commandes annulées et retournées en sont exclues.",
      consigne: "Une seule valeur : la somme des quantités multipliées par les prix facturés, pour les commandes qui ne sont ni annulées ni retournées. Les frais de port sont exclus.",
      depart: "SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id",
      solution: "SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut NOT IN ('annulee','retournee')",
      comparer: {},
      pieges: ["P7"],
      piste: "La jointure donne accès au statut, mais aucune condition ne s'en sert : quelles commandes sont comptées ?",
      clause: "WHERE",
      exemple: "16 233,50 € tous statuts confondus, contre 12 387,00 € une fois les annulées et les retournées écartées.",
      explication: "La jointure est posée, le calcul est juste, mais rien ne filtre : les 11 commandes annulées et les 5 retournées sont comptées comme les autres, et le total passe de 12 387,00 € à 16 233,50 € — près de 4 000 € d'écart. Joindre commandes sans utiliser son statut ne sert à rien ici : la table n'est là que pour permettre ce filtre. Un chiffre d'affaires qui ne dit pas quels statuts il retient n'a pas de sens, et c'est pourquoi la consigne le précise toujours.",
      retenir: "Un chiffre d'affaires se définit autant par ce qu'il exclut que par ce qu'il additionne. Si une jointure n'apporte ni colonne affichée ni condition, c'est qu'il manque la condition."
    },
    {
      id: "p3-38", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Quel chiffre d'affaires demande-t-on ?",
      question: "Un responsable demande « le chiffre d'affaires de la boutique » sans autre précision. Quelle est la bonne réaction ?",
      options: [
        "Demander lesquels des statuts il retient et si les frais de port sont inclus : les réponses vont de 11 490,00 € à 16 233,50 €",
        "Donner le total toutes commandes confondues, puisque aucune exclusion n'a été demandée",
        "Donner le total des seules commandes livrées, la seule définition rigoureuse",
        "Donner le total frais de port inclus : c'est la somme que la boutique a réellement encaissée"
      ],
      reponse: 0,
      pieges: ["P7"],
      piste: "Combien de nombres différents cette même question peut-elle produire sur cette base ?",
      clause: "SUM",
      exemple: "Livrées seules : 11 490,00 €. Ni annulées ni retournées : 12 387,00 €. Hors annulées : 12 724,50 €. Tous statuts : 16 233,50 €.",
      explication: "Sur cette base, la même question admet au moins quatre réponses défendables, séparées par près de 5 000 €. Aucune n'est fausse en soi : elles répondent à des questions différentes que le mot « chiffre d'affaires » ne distingue pas. Choisir seul une définition sans le dire, c'est produire un chiffre que personne ne peut vérifier. La compétence attendue n'est pas de connaître la bonne formule, mais de refuser l'ambiguïté avant de calculer.",
      retenir: "Une question métier mal définie ne se répare pas en SQL. Avant d'écrire la requête, il faut faire préciser ce que le mot recouvre — statuts inclus, frais de port comptés ou non."
    },
    {
      id: "p3-39", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 2,
      titre: "Les frais de port des commandes retenues",
      question: "Quel est le total des frais de port des commandes qui ne sont ni annulées ni retournées ?",
      consigne: "Une seule valeur : la somme des frais de port de ces commandes, chacune comptée une seule fois.",
      solution: "SELECT SUM(frais_port) FROM commandes WHERE statut NOT IN ('annulee','retournee')",
      comparer: {},
      pieges: ["P4", "P7"],
      piste: "Les frais de port appartiennent à la commande. Une autre table est-elle nécessaire pour les additionner ?",
      clause: "SUM",
      exemple: "232,00 € : c'est ce qu'il faut ajouter aux 12 387,00 € de produits pour obtenir le chiffre d'affaires TOTAL, 12 619,00 €.",
      explication: "La réponse est 232,00 €, et la bonne requête ne joint rien : frais_port et statut sont tous deux dans commandes. C'est le réflexe à acquérir après ce palier — la jointure n'est pas une amélioration, c'est un outil qui a un coût. Ajouter ici lignes_commande ne donnerait pas une information de plus, seulement des frais comptés une fois par ligne de produit.",
      retenir: "Avant de joindre, vérifiez que la table de départ ne contient pas déjà tout ce dont la question a besoin. La jointure inutile n'est pas neutre : elle fausse les totaux."
    },
    {
      id: "p3-40", type: "corriger",
      niveau: "P3", competence: "joindre", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Des frais de port ajoutés ligne par ligne",
      question: "Quel est le chiffre d'affaires PRODUITS de toute la boutique ? Les commandes annulées et retournées en sont exclues.",
      consigne: "Une seule valeur : la somme des quantités multipliées par les prix facturés, pour les commandes qui ne sont ni annulées ni retournées. Les frais de port sont exclus.",
      depart: "SELECT SUM(l.quantite * l.prix_unitaire + o.frais_port) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut NOT IN ('annulee','retournee')",
      solution: "SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut NOT IN ('annulee','retournee')",
      comparer: {},
      pieges: ["P4", "P7"],
      piste: "La consigne exclut les frais de port. Et si on les voulait, les ajouter DANS la somme les compterait-il une fois par commande ?",
      clause: "SUM",
      exemple: "12 911,50 € au lieu de 12 387,00 € : l'écart n'est pas les 232,00 € de frais réels, mais bien davantage.",
      explication: "Deux fautes se cumulent. La consigne demande le chiffre d'affaires PRODUITS, qui exclut les frais de port : les ajouter est hors sujet. Et la façon de les ajouter est elle-même fausse — écrits à l'intérieur du SUM, ils sont comptés une fois par ligne de produit, et non une fois par commande : le total atteint 12 911,50 €, alors que le chiffre d'affaires TOTAL correct vaut 12 619,00 €. Obtenir ce total exact en une seule requête demande un outil du palier 4 ; pour l'instant, on additionne les produits d'un côté et les frais de port de l'autre.",
      retenir: "Une colonne de la commande ajoutée à l'intérieur d'un SUM calculé sur ses lignes est comptée autant de fois qu'elle a de lignes. Les deux totaux se calculent séparément, puis s'additionnent."
    },
    {
      id: "p3-41", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 3,
      titre: "Pourquoi 12 911,50 € plutôt que 12 619,00 €",
      question: "Les frais de port des commandes retenues valent 232,00 € au total, et le chiffre d'affaires produits 12 387,00 € — soit 12 619,00 € en tout. Pourquoi les ajouter à l'intérieur du SUM après la jointure donne-t-il 12 911,50 € ?",
      options: [
        "Les frais d'une commande sont ajoutés une fois par ligne de produit : les commandes à plusieurs lignes les paient plusieurs fois",
        "Les frais de port des commandes annulées sont réintégrés par la jointure",
        "SQLite arrondit différemment quand une addition est placée à l'intérieur d'un SUM",
        "Les frais de port de certaines commandes sont comptés en double dans la table commandes"
      ],
      reponse: 0,
      pieges: ["P4"],
      piste: "Combien de fois une commande à 4 lignes de produits apparaît-elle dans le résultat joint ?",
      clause: "SUM",
      exemple: "Les 6,50 € de la commande 1038, qui a 4 lignes, sont comptés 26,00 € dans ce total.",
      explication: "C'est le gonflement par jointure du chapitre 4, appliqué à l'argent. Après la jointure, une commande occupe autant de lignes qu'elle a de produits, et frais_port y est recopié sur chacune : l'addition le reprend à chaque fois. L'écart entre 12 911,50 € et 12 619,00 € — 292,50 € — correspond exactement aux frais surcomptés des commandes à plusieurs lignes. Aucun arrondi, aucune commande en trop : seulement une valeur unique additionnée plusieurs fois.",
      retenir: "Le gonflement par jointure se reconnaît à ceci : le résultat dépasse le total attendu d'un montant qui correspond aux lignes surnuméraires. Il ne se corrige pas en ajustant le calcul, mais en calculant chaque total sur sa propre table."
    },
    {
      id: "p3-42", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 1,
      titre: "Combien de clients ont été parrainés",
      question: "Combien de clients ont été parrainés par un autre client ?",
      consigne: "Une seule valeur : le nombre de clients dont le parrain est renseigné.",
      solution: "SELECT COUNT(parrain_id) FROM clients",
      comparer: {},
      pieges: ["P9"],
      piste: "La colonne parrain_id est vide pour les clients sans parrain. Quelle écriture de COUNT ignore les valeurs vides ?",
      clause: "COUNT",
      exemple: "La règle vient du palier 2 : COUNT(colonne) ne compte que les lignes où cette colonne a une valeur.",
      explication: "Neuf clients sur quarante ont un parrain : leur colonne parrain_id contient l'identifiant d'un autre client de la même table. Les 31 autres l'ont vide. Aucune jointure n'est nécessaire pour les compter — COUNT(parrain_id) suffit. Retenez ce 9 : le chapitre s'en sert pour prévoir ce que donnera la jointure de la table avec elle-même.",
      retenir: "Une table peut se pointer elle-même : clients.parrain_id contient l'identifiant d'un autre client. C'est une clé étrangère comme une autre, dont la cible se trouve dans la même table."
    },
    {
      id: "p3-43", type: "requete",
      niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 3,
      titre: "Chaque filleul et son parrain",
      question: "Affichez le nom de chaque client parrainé, et le nom du client qui l'a parrainé.",
      consigne: "Deux colonnes, dans cet ordre : le nom du filleul (nommé filleul), puis le nom de son parrain (nommé parrain). Une ligne par client parrainé.",
      solution: "SELECT c.nom AS filleul, p.nom AS parrain FROM clients c JOIN clients p ON p.id = c.parrain_id",
      comparer: {},
      pieges: ["P9"],
      piste: "La même table joue deux rôles. Donnez-lui deux alias différents, et traitez-la comme deux tables distinctes.",
      clause: "JOIN",
      exemple: "FROM clients c JOIN clients p : c désigne le filleul, p le parrain — deux lectures de la même table, sous deux noms.",
      explication: "Rien de nouveau dans la syntaxe : c'est un JOIN ordinaire, dont les deux côtés se trouvent être la même table. Les alias deviennent alors indispensables, et ils cessent d'être un simple confort d'écriture : sans eux, impossible de dire si nom désigne le filleul ou le parrain. Le résultat compte 9 lignes — une par client parrainé. Les 31 clients sans parrain n'apparaissent pas, la jointure étant ordinaire.",
      retenir: "Une auto-jointure relie une table à elle-même : deux alias différents la transforment en deux tables, l'une jouant un rôle, l'autre l'autre."
    },
    {
      id: "p3-44", type: "predire",
      niveau: "P3", competence: "joindre", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Combien de lignes pour une auto-jointure",
      question: "Sans l'exécuter : combien de LIGNES cette requête renvoie-t-elle ? (la table clients compte 40 lignes, dont 9 ont un parrain renseigné)",
      requete: "SELECT c.nom AS filleul, p.nom AS parrain FROM clients c JOIN clients p ON p.id = c.parrain_id;",
      predit: "nbLignes",
      pieges: ["P9", "P3"],
      piste: "Une jointure ordinaire ne garde que les lignes qui trouvent une correspondance. Que trouve un client dont le parrain_id est vide ?",
      clause: "JOIN",
      exemple: "Avec LEFT JOIN à la place de JOIN, le résultat compterait 40 lignes : les 31 clients sans parrain y figureraient avec un parrain vide.",
      explication: "Chaque client dont le parrain_id est renseigné trouve exactement un parrain : 9 lignes. Les 31 autres ont parrain_id à NULL, et NULL ne correspond à aucun identifiant — pas même à un autre NULL. La jointure ordinaire les écarte donc tous. Le nombre de lignes n'est ni 40 ni 31, mais bien le nombre de valeurs renseignées dans la colonne qui relie : c'est le même raisonnement que pour les clients sans commande, appliqué à une table qui se pointe elle-même.",
      retenir: "Une clé étrangère vide ne trouve jamais de correspondance : dans une jointure ordinaire, les lignes dont la colonne de liaison est NULL disparaissent toujours."
    },
    {
      id: "p3-45", type: "qcm",
      niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
      titre: "Pourquoi deux alias sont obligatoires",
      question: "Dans une auto-jointure, pourquoi faut-il donner deux alias différents à la même table ?",
      options: [
        "Parce que la table joue deux rôles : sans deux noms, rien ne dit de quel exemplaire vient chaque colonne",
        "Parce que SQLite refuse qu'une table soit citée deux fois dans un même FROM",
        "Pour que la requête s'exécute plus vite, en ne lisant la table qu'une seule fois",
        "Parce que les alias remplacent le ON quand les deux tables sont identiques"
      ],
      reponse: 0,
      pieges: ["P9"],
      piste: "Si les deux exemplaires s'appelaient tous deux clients, comment écririez-vous « le nom du parrain » ?",
      clause: "AS",
      exemple: "FROM clients c JOIN clients p ON p.id = c.parrain_id : c.nom est le filleul, p.nom le parrain.",
      explication: "Les deux exemplaires de la table sont indiscernables tant qu'on ne les nomme pas : écrire nom ne voudrait rien dire, et ON id = parrain_id serait ambigu des deux côtés. Les alias créent la distinction qui manque — c est le filleul, p le parrain — et c'est elle, pas la syntaxe, qui porte le sens de la requête. Les alias ne changent rien à la façon dont SQLite lit la table, et ne remplacent jamais le ON : la condition de correspondance reste indispensable.",
      retenir: "Dans une auto-jointure, les alias ne sont plus un confort mais la seule chose qui distingue les deux rôles joués par la même table."
    },
    /* ── Palier 4 : raisonner — sous-requêtes (dont corrélées), CTE, fonctions de fenêtre, top-N par groupe, cumuls (lot 9) ── */
    {
      id: "p4-01", type: "qcm",
      niveau: "P4", competence: "sous-requetes", categorie: "Comprendre", difficulte: 1,
      titre: "Une requête à l'intérieur d'une autre",
      question: "Dans WHERE prix > (SELECT AVG(prix) FROM produits), que fait SQLite avec la partie entre parenthèses ?",
      options: [
        "Il l'exécute d'abord, obtient une seule valeur, puis compare chaque prix à cette valeur",
        "Il l'ignore : seule la comparaison prix > ... compte",
        "Il exécute les deux requêtes en même temps et fusionne leurs résultats",
        "Il refuse : une sous-requête n'est autorisée qu'après FROM"
      ],
      reponse: 0,
      piste: "Une sous-requête entre parenthèses se comporte, pour le reste de la ligne, comme si elle avait déjà été remplacée par le nombre qu'elle renvoie.",
      clause: "WHERE",
      exemple: "(SELECT COUNT(*) FROM clients) renvoie un seul nombre, 40 : WHERE ... > (SELECT COUNT(*) FROM clients) le compare donc à 40, comme on écrirait > 40 à la main.",
      explication: "SQLite exécute d'abord la sous-requête, entièrement, et obtient ici une seule valeur (le prix moyen des produits). Cette valeur remplace ensuite la sous-requête dans la ligne principale, exactement comme si elle avait été écrite en dur. Deux temps, toujours dans cet ordre : d'abord la sous-requête, ensuite la requête qui l'utilise — jamais l'inverse, et jamais en même temps.",
      retenir: "Une sous-requête qui renvoie une seule valeur peut être utilisée partout où une valeur simple serait acceptée : SQLite l'exécute d'abord, puis s'en sert comme d'un nombre ordinaire."
    },
    {
      id: "p4-02", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 2,
      titre: "Plus cher que la moyenne",
      question: "Affichez les produits dont le prix dépasse le prix moyen de TOUS les produits.",
      consigne: "Trois colonnes, dans cet ordre : id, nom, prix. Triés par prix décroissant.",
      solution: "SELECT id, nom, prix FROM produits WHERE prix > (SELECT AVG(prix) FROM produits) ORDER BY prix DESC",
      comparer: { ordonne: { cles: [2] } },
      piste: "(SELECT AVG(prix) FROM produits) renvoie un seul nombre : comparez prix à ce nombre comme vous le feriez avec une valeur écrite en dur.",
      clause: "WHERE",
      exemple: "WHERE note > (SELECT AVG(note) FROM commandes) garderait les commandes dont la note dépasse la note moyenne.",
      explication: "La sous-requête (SELECT AVG(prix) FROM produits) calcule 165,31 € sur les 30 produits, une seule fois. Le WHERE compare ensuite chaque prix à cette valeur unique. Six produits la dépassent : les deux à 1 299,00 € (101, 109), les deux à 449,00 € (102, 103), puis 120 (429,00 €) et 115 (349,00 €).",
      retenir: "Une sous-requête qui renvoie une seule valeur peut servir de borne dans un WHERE, exactement comme un nombre écrit en dur — sauf qu'elle reste juste si les données changent."
    },
    {
      id: "p4-03", type: "predire",
      niveau: "P4", competence: "sous-requetes", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Le reste de la liste",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (30 produits en tout, 6 dépassent la moyenne)",
      requete: "SELECT COUNT(*) FROM produits WHERE prix <= (SELECT AVG(prix) FROM produits);",
      predit: "valeur",
      piste: "Combien de produits dépassaient la moyenne à l'exercice précédent ? Les autres sont forcément ici.",
      clause: "WHERE",
      exemple: "Sur 10 lignes, si 3 vérifient une condition, les 7 autres vérifient forcément son contraire.",
      explication: "30 produits en tout, 6 dépassent la moyenne (exercice précédent) : les 24 restants sont à la moyenne ou en dessous. <= inclut l'égalité, mais aucun produit ne vaut exactement 165,31 €, donc ce sont bien les 24 produits strictement sous la moyenne.",
      retenir: "Une condition et son contraire se partagent toujours le total des lignes : connaître l'un des deux comptes donne l'autre par simple soustraction."
    },
    {
      id: "p4-04", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 2,
      titre: "Les clients qui ont acheté un jouet",
      question: "Affichez les clients qui ont commandé au moins un produit de la catégorie Jouets (categorie_id = 6).",
      consigne: "Trois colonnes, dans cet ordre : id, prenom, nom. Triés par id croissant.",
      solution: "SELECT c.id, c.prenom, c.nom FROM clients c WHERE c.id IN (SELECT o.client_id FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE l.produit_id IN (SELECT id FROM produits WHERE categorie_id = 6)) ORDER BY c.id",
      comparer: { ordonne: true },
      piste: "La sous-requête la plus intérieure donne les id des produits Jouets ; la suivante, les client_id qui en ont commandé un ; IN garde alors les clients dont l'id est dans cette liste.",
      clause: "IN",
      exemple: "WHERE id IN (SELECT client_id FROM commandes) garderait les clients qui ont passé au moins une commande, quelle qu'elle soit.",
      explication: "Trois sous-requêtes s'enchaînent, chacune donnant une liste à la suivante : les deux produits de la catégorie Jouets (129, 130), puis les commandes qui en contiennent un, puis leurs clients. IN garde alors, dans la table clients, les lignes dont l'id figure dans cette dernière liste : 220, 230, 234, 237.",
      retenir: "IN accepte une sous-requête qui renvoie PLUSIEURS valeurs, contrairement à =, qui n'en accepte qu'une seule à la fois."
    },
    {
      id: "p4-05", type: "predire",
      niveau: "P4", competence: "sous-requetes", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Les clients qui n'ont pas acheté CE produit",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (40 clients en tout, 3 ont commandé le produit 101)",
      requete: "SELECT COUNT(*) FROM clients WHERE id NOT IN (SELECT o.client_id FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE l.produit_id = 101);",
      predit: "valeur",
      piste: "Si 3 clients l'ont commandé, les autres ne l'ont pas.",
      clause: "NOT IN",
      exemple: "Sur les 40 clients, si 4 ont acheté un Jouet (exercice précédent), les 36 autres n'en ont acheté aucun.",
      explication: "La sous-requête donne les client_id ayant commandé le produit 101 : 3 clients. NOT IN garde alors tous les AUTRES clients, soit 40 − 3 = 37. Cette sous-requête ne contient ici aucun NULL (client_id n'est jamais vide dans commandes) : NOT IN se comporte normalement. Le chapitre suivant montre ce qui se passe quand ce n'est plus le cas.",
      retenir: "NOT IN fonctionne sans surprise tant que la sous-requête ne peut renvoyer aucun NULL. Vérifier cela avant de l'utiliser évite le piège du chapitre suivant."
    },
    {
      id: "p4-06", type: "qcm",
      niveau: "P4", competence: "sous-requetes", categorie: "Comprendre", difficulte: 2,
      titre: "Pourquoi IN accepte plusieurs valeurs",
      question: "produit_id = 129 fonctionne pour UN produit. Pourquoi produit_id IN (129, 130) fonctionne-t-il pour deux produits, alors que produit_id = (129, 130) serait refusé ?",
      options: [
        "IN compare la colonne à CHAQUE valeur de la liste et garde la ligne si l'une d'elles correspond ; = ne compare qu'à une seule valeur à la fois",
        "IN est réservé aux sous-requêtes, = aux valeurs écrites à la main",
        "= fonctionnerait aussi, mais serait plus lent",
        "IN renvoie la ligne qui correspond à la MOYENNE des valeurs de la liste"
      ],
      reponse: 0,
      piste: "= attend une seule valeur de chaque côté ; une liste entre parenthèses n'est pas une valeur, elle en contient plusieurs.",
      clause: "IN",
      exemple: "statut IN ('livree', 'expediee') garde les commandes dont le statut vaut l'un OU l'autre, ce qu'un seul = ne pourrait pas exprimer.",
      explication: "= teste une égalité entre deux valeurs uniques : il ne sait rien faire d'une liste. IN, lui, est conçu pour une liste — écrite à la main entre parenthèses ou renvoyée par une sous-requête — et garde la ligne dès que la colonne correspond à L'UNE de ces valeurs. C'est pour cela qu'une sous-requête utilisée avec IN peut renvoyer plusieurs lignes sans problème, alors qu'une sous-requête utilisée avec = ne doit jamais en renvoyer plus d'une.",
      retenir: "IN teste une appartenance à une liste ; = teste une égalité entre deux valeurs uniques. C'est pour cela qu'une sous-requête utilisée avec IN peut renvoyer plusieurs lignes."
    },
    {
      id: "p4-07", type: "predire",
      niveau: "P4", competence: "sous-requetes", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Zéro ligne, et ce n'est pas une erreur de votre part",
      question: "Sans l'exécuter : combien de LIGNES cette requête renvoie-t-elle ?",
      requete: "SELECT id FROM clients WHERE id NOT IN (SELECT parrain_id FROM clients);",
      predit: "nbLignes",
      zeroLigneAttendu: "Le piège enseigné par cet exercice est justement que cette requête, pourtant syntaxiquement correcte, renvoie 0 ligne — alors que 31 clients n'ont jamais parrainé personne.",
      pieges: ["P9"],
      piste: "parrain_id est vide pour 31 clients sur 40. Que devient une sous-requête qui renvoie, parmi ses valeurs, un seul NULL ?",
      clause: "NOT IN",
      exemple: "1 NOT IN (2, NULL, 4) ne renvoie ni vrai ni faux : SQLite ne peut pas garantir que 1 soit absent d'une liste dont une valeur est inconnue, et traite tout le test comme inconnu — donc jamais vrai.",
      explication: "La sous-requête (SELECT parrain_id FROM clients) renvoie 40 valeurs : 9 identifiants, et 31 NULL (les clients venus sans parrain). Dès qu'UN SEUL NULL se trouve dans cette liste, NOT IN ne peut plus répondre « vrai » pour AUCUNE ligne : comparer un identifiant à un NULL ne donne jamais ni vrai ni faux, seulement « inconnu », et SQL traite un résultat inconnu comme s'il n'était pas vrai. Le résultat est donc 0, pour toutes les lignes, sans le moindre message d'erreur.",
      retenir: "NOT IN (SELECT ...) renvoie 0 ligne dès que la sous-requête contient un seul NULL, quelles que soient les autres valeurs. C'est l'erreur de sous-requête la plus coûteuse en entreprise, justement parce qu'elle ne plante jamais."
    },
    {
      id: "p4-08", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 2,
      titre: "Qui n'a jamais parrainé personne, sans ce piège",
      question: "Affichez les clients qui n'ont jamais parrainé personne.",
      consigne: "Une colonne : id. Triés par id croissant.",
      solution: "SELECT id FROM clients c WHERE NOT EXISTS (SELECT 1 FROM clients f WHERE f.parrain_id = c.id) ORDER BY id",
      comparer: { ordonne: true },
      pieges: ["P9"],
      piste: "NOT EXISTS (SELECT 1 FROM clients f WHERE f.parrain_id = c.id) teste : existe-t-il un filleul dont le parrain est c ? NOT EXISTS garde les clients pour qui la réponse est non.",
      clause: "EXISTS",
      exemple: "EXISTS (SELECT 1 FROM commandes o WHERE o.client_id = c.id) teste si un client a au moins une commande, sans jamais regarder combien ni lesquelles.",
      explication: "NOT EXISTS ne construit aucune liste de valeurs à comparer : pour chaque client c, il teste directement s'il existe une ligne de clients dont parrain_id vaut l'id de c. Cette question a toujours une réponse, oui ou non, même quand parrain_id est NULL ailleurs dans la table — NULL n'intervient ici que comme une valeur de filleul PARMI D'AUTRES, jamais comme la réponse elle-même. Le résultat retrouve les 31 clients attendus.",
      retenir: "NOT EXISTS répond à la même question que NOT IN, mais en testant une existence plutôt qu'une appartenance à une liste : un NULL ailleurs dans la table ne peut jamais fausser ce test."
    },
    {
      id: "p4-09", type: "corriger",
      niveau: "P4", competence: "sous-requetes", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Le correctif qui ne corrige rien",
      question: "Affichez les clients qui n'ont jamais parrainé personne.",
      consigne: "Une colonne : id. Triés par id croissant.",
      depart: "SELECT id FROM clients WHERE id NOT IN (SELECT parrain_id FROM clients) ORDER BY id",
      solution: "SELECT id FROM clients c WHERE NOT EXISTS (SELECT 1 FROM clients f WHERE f.parrain_id = c.id) ORDER BY id",
      comparer: { ordonne: true },
      pieges: ["P9"],
      piste: "Le NOT IN n'est pas en panne : il répond correctement à une question étrange, « existe-t-il un NULL dans la liste ? », pas à celle qu'on lui pose. Changez d'outil plutôt que de réparer celui-ci.",
      clause: "EXISTS",
      exemple: "Remplacer NOT IN par NOT EXISTS change la question posée : non plus « l'id est-il absent de cette liste de valeurs ? » mais « existe-t-il une ligne qui correspond ? » — cette seconde question n'a jamais besoin d'écarter un NULL, elle n'en contient simplement pas.",
      explication: "Le départ s'exécute sans erreur et renvoie 0 ligne : rien ne signale qu'il est faux, puisque 0 est un résultat parfaitement valide pour une requête SQL. Le problème n'est pas une faute de syntaxe mais un choix d'outil : NOT IN construit une liste de valeurs et doit s'assurer qu'aucune n'y figure, ce qu'un seul NULL rend impossible à garantir. NOT EXISTS pose une question différente — une ligne correspondante existe-t-elle ? — qui a toujours une réponse, retrouvant les 31 clients attendus.",
      retenir: "Un départ qui renvoie 0 ligne SANS message d'erreur n'est pas forcément vide pour une bonne raison : vérifiez toujours si NOT IN porte sur une colonne qui peut contenir NULL avant de lui faire confiance."
    },
    {
      id: "p4-10", type: "predire",
      niveau: "P4", competence: "sous-requetes", categorie: "Prédire le résultat", difficulte: 2,
      titre: "IN n'a pas le même problème",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (parrain_id contient 9 identifiants et 31 NULL)",
      requete: "SELECT COUNT(*) FROM clients WHERE id IN (SELECT parrain_id FROM clients);",
      predit: "valeur",
      piste: "IN cherche une correspondance ; un NULL dans la liste ne peut pas en être une, mais il n'empêche pas non plus les vraies correspondances d'être trouvées.",
      clause: "IN",
      exemple: "Parmi (2, NULL, 4), chercher 2 avec IN trouve une correspondance franche, sans se soucier du NULL présent ailleurs dans la liste.",
      explication: "La sous-requête renvoie 9 identifiants et 31 NULL. IN compare chaque id de clients à cette liste et garde la ligne dès qu'UNE correspondance EXACTE est trouvée : les 31 NULL ne gênent jamais une correspondance qui existe réellement ailleurs dans la liste. Le résultat est donc bien 9, les 9 clients qui ont au moins un filleul. NOT IN, lui, a besoin de garantir qu'AUCUNE valeur de la liste ne correspond — et un NULL rend cette garantie impossible, exactement le résultat vide obtenu juste avant avec NOT IN.",
      retenir: "Un NULL dans une sous-requête gêne NOT IN, qui doit écarter TOUTES les valeurs, mais jamais IN, qui n'a besoin d'en trouver qu'UNE."
    },
    {
      id: "p4-11", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 2,
      titre: "Au-dessus de sa propre moyenne",
      question: "Pour le client 201, affichez les commandes dont le montant des produits dépasse la moyenne des commandes DE CE CLIENT.",
      consigne: "Une colonne : id de la commande. Triés par id croissant.",
      solution: "SELECT o.id FROM commandes o WHERE o.client_id = 201 AND (SELECT SUM(l.quantite*l.prix_unitaire) FROM lignes_commande l WHERE l.commande_id = o.id) > (SELECT AVG(m.total) FROM (SELECT SUM(l2.quantite*l2.prix_unitaire) AS total FROM commandes o2 JOIN lignes_commande l2 ON l2.commande_id = o2.id WHERE o2.client_id = o.client_id GROUP BY o2.id) AS m) ORDER BY o.id",
      comparer: { ordonne: true },
      piste: "La seconde sous-requête recalcule la moyenne des commandes DU MÊME client (o.client_id) : elle ne regarde jamais les commandes des 39 autres clients.",
      clause: "WHERE",
      exemple: "Toujours pour le client 201 : la moyenne de ses 5 commandes vaut 781,50 € — un chiffre recalculé spécifiquement pour lui, pas pour toute la boutique.",
      explication: "Le client 201 a 5 commandes, pour 1 284,00 €, 542,50 €, 1 299,00 €, 206,50 € et 575,50 € de produits. Leur moyenne vaut 781,50 €. Deux commandes la dépassent : 1001 (1 284,00 €) et 1019 (1 299,00 €). La sous-requête qui calcule cette moyenne contient o.client_id : elle recalcule donc une moyenne DIFFÉRENTE pour chaque client, alors qu'une sous-requête ordinaire ne s'exécute qu'une seule fois. C'est ce qu'on appelle une sous-requête corrélée : elle se réexécute pour chaque ligne de la requête extérieure, en fonction de cette ligne.",
      retenir: "Une sous-requête corrélée contient une référence à la ligne de la requête extérieure (ici o.client_id) : elle ne calcule plus UNE valeur pour toute la table, mais une valeur DIFFÉRENTE pour chaque ligne."
    },
    {
      id: "p4-12", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 3,
      titre: "La même comparaison, pour chaque client",
      question: "Pour CHAQUE client, affichez les commandes dont le montant des produits dépasse la moyenne des commandes de ce client.",
      consigne: "Une colonne : id de la commande. Triés par id croissant.",
      solution: "SELECT o.id FROM commandes o WHERE (SELECT SUM(l.quantite*l.prix_unitaire) FROM lignes_commande l WHERE l.commande_id = o.id) > (SELECT AVG(m.total) FROM (SELECT SUM(l2.quantite*l2.prix_unitaire) AS total FROM commandes o2 JOIN lignes_commande l2 ON l2.commande_id = o2.id WHERE o2.client_id = o.client_id GROUP BY o2.id) AS m) ORDER BY o.id",
      comparer: { ordonne: true },
      piste: "Reprenez l'exercice précédent et retirez simplement la condition qui limitait au client 201 : la corrélation o.client_id fait le reste, pour chacun des clients.",
      clause: "WHERE",
      exemple: "La même requête, exécutée pour le client 202, recalculerait sa propre moyenne — différente de celle de 201 — sans qu'il soit nécessaire de rien changer à l'écriture de la requête.",
      explication: "Rien ne change dans la logique : SQLite réexécute la sous-requête corrélée pour chaque commande, en recalculant à chaque fois la moyenne du client concerné. Sur les 70 commandes de la boutique, 28 dépassent ainsi la moyenne de LEUR PROPRE client — un nombre bien différent de celui qu'on obtiendrait en les comparant tous à une seule moyenne globale, ce que montre l'exercice suivant.",
      retenir: "Une sous-requête corrélée, une fois écrite pour un cas particulier, se généralise à toute la table sans rien changer d'autre que la condition qui limitait ce cas : c'est elle qui fait tout le travail, ligne par ligne."
    },
    {
      id: "p4-13", type: "corriger",
      niveau: "P4", competence: "sous-requetes", categorie: "Détection d'erreur", difficulte: 3,
      titre: "La moyenne de qui ?",
      question: "Pour chaque client, affichez les commandes dont le montant des produits dépasse la moyenne des commandes de ce client.",
      consigne: "Une colonne : id de la commande. Triés par id croissant.",
      depart: "SELECT o.id FROM commandes o WHERE (SELECT SUM(l.quantite*l.prix_unitaire) FROM lignes_commande l WHERE l.commande_id = o.id) > (SELECT AVG(m.total) FROM (SELECT SUM(l2.quantite*l2.prix_unitaire) AS total FROM commandes o2 JOIN lignes_commande l2 ON l2.commande_id = o2.id GROUP BY o2.id) AS m) ORDER BY o.id",
      solution: "SELECT o.id FROM commandes o WHERE (SELECT SUM(l.quantite*l.prix_unitaire) FROM lignes_commande l WHERE l.commande_id = o.id) > (SELECT AVG(m.total) FROM (SELECT SUM(l2.quantite*l2.prix_unitaire) AS total FROM commandes o2 JOIN lignes_commande l2 ON l2.commande_id = o2.id WHERE o2.client_id = o.client_id GROUP BY o2.id) AS m) ORDER BY o.id",
      comparer: { ordonne: true },
      piste: "La sous-requête qui calcule la moyenne ne contient aucune référence à o : elle calcule donc la MÊME moyenne, une seule fois, pour toutes les commandes de la boutique.",
      clause: "WHERE",
      exemple: "231,91 € est la moyenne de TOUTES les commandes de la boutique ; 781,50 € est celle des seules commandes du client 201. Comparer une commande à l'une ou à l'autre ne donne pas la même réponse.",
      explication: "Le départ ressemble exactement à la bonne requête, à une différence près : la sous-requête qui calcule la moyenne (le WHERE o2.client_id = o.client_id manquant) n'est plus corrélée. Elle calcule UNE SEULE moyenne, pour TOUTES les commandes de la boutique (231,91 €), et compare chaque commande à ce chiffre unique plutôt qu'à la moyenne de son propre client. Le résultat passe de 28 commandes (au-dessus de la moyenne de leur client) à 16 (au-dessus de la moyenne de la boutique entière) — un nombre tout aussi plausible, qui ne signale rien de faux.",
      retenir: "Oublier la condition qui corrèle une sous-requête à la ligne extérieure ne provoque aucune erreur : la sous-requête s'exécute, renvoie une valeur plausible, et répond simplement à une AUTRE question que celle posée."
    },
    {
      id: "p4-14", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 3,
      titre: "La dernière commande de chaque client",
      question: "Pour chaque client qui a commandé, affichez sa commande la plus récente.",
      consigne: "Deux colonnes, dans cet ordre : id du client, date de la commande. Triées par id du client croissant.",
      solution: "SELECT o.client_id, o.date_commande FROM commandes o WHERE o.date_commande = (SELECT MAX(o2.date_commande) FROM commandes o2 WHERE o2.client_id = o.client_id) ORDER BY o.client_id",
      comparer: { ordonne: true },
      piste: "(SELECT MAX(o2.date_commande) FROM commandes o2 WHERE o2.client_id = o.client_id) recalcule, pour CHAQUE commande, la date la plus récente DE SON CLIENT. La ligne extérieure est gardée quand sa propre date atteint ce maximum.",
      clause: "WHERE",
      exemple: "Pour le client 201, cette sous-requête renvoie 2025-12-24 : la commande 1043, qui porte cette date, est donc la seule gardée pour lui.",
      explication: "La sous-requête est corrélée par o2.client_id = o.client_id : elle calcule, pour chaque commande, la date maximale parmi les commandes DU MÊME client. La condition du WHERE compare ensuite la date de CETTE commande à ce maximum : elle n'est vraie que pour la commande la plus récente de chaque client. Le résultat compte 34 lignes, une par client qui a déjà commandé — aucun des 40 clients n'a deux commandes passées exactement le même jour, donc aucune ambiguïté ne se glisse ici.",
      retenir: "MAX(colonne) dans une sous-requête corrélée, comparé à la colonne elle-même, retrouve la ligne qui porte ce maximum : une façon courante d'obtenir « le plus récent », « le plus grand » ou « le dernier » PAR groupe, sans GROUP BY ni fonction de fenêtre."
    },
    {
      id: "p4-15", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 2,
      titre: "Nommer une étape : le chiffre d'affaires produits",
      question: "Calculez le chiffre d'affaires PRODUITS de la boutique (hors frais de port), en excluant les commandes annulées ou retournées.",
      consigne: "Une seule valeur.",
      solution: "WITH par_commande AS (SELECT l.commande_id, SUM(l.quantite*l.prix_unitaire) AS montant FROM lignes_commande l GROUP BY l.commande_id) SELECT SUM(c.montant) FROM par_commande c JOIN commandes o ON o.id = c.commande_id WHERE o.statut NOT IN ('annulee', 'retournee')",
      comparer: {},
      piste: "WITH par_commande AS (...) calcule, une fois pour toutes, le montant de chaque commande avant de la joindre : la jointure qui suit ne voit plus qu'UNE ligne par commande, jamais une par produit.",
      clause: "WITH",
      exemple: "WITH ca_client AS (SELECT client_id, SUM(...) AS total FROM ... GROUP BY client_id) SELECT * FROM ca_client WHERE total > 1000; nomme un calcul intermédiaire pour pouvoir le filtrer ensuite, comme une table ordinaire.",
      explication: "La CTE par_commande calcule d'abord, pour chaque commande, la somme de ses lignes de produits — exactement comme au palier 3, mais nommée et réutilisable. La requête principale la joint ensuite à commandes pour exclure les statuts annulee et retournee, puis additionne : 12 387,00 €. Aucune ligne de lignes_commande n'est jointe directement à commandes dans la requête principale : la jointure qui pourrait gonfler un total a déjà eu lieu, une fois, À L'INTÉRIEUR de la CTE.",
      retenir: "Une CTE peut porter une agrégation ENTIÈRE avant qu'une jointure n'ait lieu : le reste de la requête ne voit plus que son résultat déjà résumé, une ligne par groupe."
    },
    {
      id: "p4-16", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 2,
      titre: "La même étape, augmentée des frais de port",
      question: "Calculez le chiffre d'affaires TOTAL de la boutique (produits ET frais de port), en excluant les commandes annulées ou retournées — en une seule requête.",
      consigne: "Une seule valeur.",
      solution: "WITH par_commande AS (SELECT l.commande_id, SUM(l.quantite*l.prix_unitaire) AS montant FROM lignes_commande l GROUP BY l.commande_id) SELECT SUM(c.montant + o.frais_port) FROM par_commande c JOIN commandes o ON o.id = c.commande_id WHERE o.statut NOT IN ('annulee', 'retournee')",
      comparer: {},
      piste: "o.frais_port vient directement de commandes, une seule fois par ligne jointe — et la CTE garantit qu'il y a exactement une ligne par commande, jamais une par produit.",
      clause: "WITH",
      exemple: "Sans la CTE, joindre lignes_commande à commandes puis sommer frais_port compterait ces frais une fois PAR LIGNE DE PRODUIT, pas une fois par commande.",
      explication: "Le palier précédent avait dû calculer séparément les 12 387,00 € de produits et les 232,00 € de frais de port, faute de pouvoir les additionner sans gonfler ce second total par une jointure directe. La CTE résout exactement ce problème : par_commande ne contient qu'UNE ligne par commande, donc la joindre à commandes et y ajouter frais_port ne répète ce montant qu'une seule fois par commande, jamais par ligne de produit. Le résultat, 12 619,00 €, est le chiffre d'affaires total en une seule requête.",
      retenir: "Agréger AVANT de joindre, grâce à une CTE, évite le gonflement d'une colonne qui appartient à la table « une seule ligne » : c'est la même précaution qu'au palier 3, rendue possible ici par une étape nommée plutôt que par l'absence de jointure."
    },
    {
      id: "p4-17", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 3,
      titre: "Le même calcul, sans la CTE",
      question: "Calculez le chiffre d'affaires total en joignant directement lignes_commande à commandes et en sommant quantite*prix_unitaire + frais_port, SANS passer par une étape intermédiaire.",
      consigne: "Une seule valeur.",
      solution: "SELECT SUM(l.quantite*l.prix_unitaire + o.frais_port) FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee')",
      comparer: {},
      piste: "Chaque commande à plusieurs lignes de produits va faire réapparaître frais_port plusieurs fois dans cette somme.",
      clause: "JOIN",
      exemple: "La commande 1038 a 4 lignes : ses frais de port, 6,50 €, seront additionnés 4 fois dans cette version, au lieu d'une seule.",
      explication: "Cette requête est la version la plus directe qu'on puisse écrire, et elle s'exécute sans la moindre erreur : 12 911,50 €. C'est pourtant un résultat gonflé — 292,50 € de trop par rapport aux 12 619,00 € de l'exercice précédent — exactement le piège du palier 3 : frais_port appartient à la commande entière, mais la jointure le recopie sur chacune de ses lignes, et SUM l'additionne alors une fois par ligne plutôt qu'une fois par commande. La CTE des deux exercices précédents n'ajoutait donc pas seulement de la lisibilité : elle évitait structurellement ce gonflement, en agrégeant avant de joindre.",
      retenir: "Le gonflement d'un SUM après une jointure n'est pas propre aux jointures ordinaires : il réapparaît à l'identique dès qu'une CTE qui agrège avant de joindre est retirée. C'est la raison structurelle, pas seulement stylistique, d'écrire cette étape à part."
    },
    {
      id: "p4-18", type: "requete",
      niveau: "P4", competence: "sous-requetes", categorie: "Mise en pratique", difficulte: 3,
      titre: "Le chiffre d'affaires, mais par client",
      question: "Affichez les clients dont le chiffre d'affaires produits (hors commandes annulées ou retournées) dépasse 1 000 €.",
      consigne: "Deux colonnes, dans cet ordre : id du client, chiffre d'affaires. Triés par chiffre d'affaires décroissant.",
      solution: "WITH par_client AS (SELECT o.client_id, SUM(l.quantite*l.prix_unitaire) AS ca FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY o.client_id) SELECT client_id, ca FROM par_client WHERE ca > 1000 ORDER BY ca DESC",
      comparer: { ordonne: { cles: [1] } },
      piste: "La CTE regroupe déjà par client avant le filtre : le WHERE de la requête principale porte alors sur une colonne ordinaire, ca, pas sur un agrégat qu'il faudrait écrire dans un HAVING.",
      clause: "WITH",
      exemple: "Une fois nommée par_client, cette étape se filtre, se trie ou se rejoint comme n'importe quelle table : WHERE ca > 1000 plutôt que HAVING SUM(...) > 1000.",
      explication: "La CTE par_client calcule le chiffre d'affaires produits de chaque client, en excluant les commandes annulées ou retournées. La requête principale n'a plus qu'à filtrer cette colonne déjà calculée : quatre clients dépassent 1 000 € — 201 (3 907,50 €), 202 (1 604,00 €), et 220 et 229, à égalité à 1 357,00 €. Cette égalité n'est pas un accident de cet exercice : le chapitre suivant montre ce qu'elle devient dès qu'on lui donne un rang.",
      retenir: "Une fois qu'une CTE a nommé une agrégation, la requête principale peut la filtrer avec un WHERE ordinaire : plus besoin du HAVING réservé aux agrégats non nommés."
    },
    {
      id: "p4-19", type: "requete",
      niveau: "P4", competence: "classer-cumuler", categorie: "Mise en pratique", difficulte: 1,
      titre: "Garder la ligne, et ajouter une colonne",
      question: "Pour chaque commande, affichez son identifiant, l'identifiant du client, et le nombre total de commandes de ce client — sans regrouper les lignes.",
      consigne: "Trois colonnes, dans cet ordre : id de la commande, client_id, nombre de commandes du client. Triées par id de commande croissant.",
      solution: "SELECT id, client_id, COUNT(*) OVER (PARTITION BY client_id) AS nb FROM commandes ORDER BY id",
      comparer: { ordonne: true },
      piste: "COUNT(*) OVER (PARTITION BY client_id) compte les commandes DE CHAQUE CLIENT, mais sans fusionner les lignes : chaque commande garde sa propre place.",
      clause: "OVER",
      exemple: "SUM(quantite) OVER (PARTITION BY commande_id) ajouterait, sur chaque ligne de lignes_commande, la quantité totale de SA commande — sans réduire le nombre de lignes de lignes_commande.",
      explication: "Le résultat compte 70 lignes, une par commande — exactement comme la table commandes elle-même. OVER (PARTITION BY client_id) n'a rien réduit : il a seulement ajouté, sur chaque ligne, le nombre de commandes du client à qui elle appartient. La commande 1001 du client 201 affiche donc 5 (le nombre total de commandes de 201), et les quatre autres commandes de 201 affichent le même 5.",
      retenir: "Une fonction de fenêtre garde toutes les lignes de départ ; elle ne fait qu'y ajouter une colonne calculée sur le groupe de chacune."
    },
    {
      id: "p4-20", type: "predire",
      niveau: "P4", competence: "classer-cumuler", categorie: "Prédire le résultat", difficulte: 1,
      titre: "Et si on groupait vraiment ?",
      question: "Sans l'exécuter : combien de LIGNES cette requête renvoie-t-elle ?",
      requete: "SELECT client_id, COUNT(*) FROM commandes GROUP BY client_id;",
      predit: "nbLignes",
      piste: "Cette fois, c'est un GROUP BY, pas un OVER : relisez ce que le chapitre vient de montrer sur la différence entre les deux.",
      clause: "GROUP BY",
      exemple: "L'exercice précédent, avec OVER (PARTITION BY client_id), gardait les 70 lignes de commandes.",
      explication: "GROUP BY fusionne les lignes qui partagent le même client_id : une seule ligne subsiste par client. Sur les 40 clients de la boutique, seuls ceux qui ont déjà commandé apparaissent dans commandes : 34 d'entre eux. Le résultat compte donc 34 lignes, bien loin des 70 de la version OVER de l'exercice précédent, pour un calcul pourtant très proche.",
      retenir: "GROUP BY et OVER (PARTITION BY ...) peuvent calculer le même agrégat, mais jamais sur le même nombre de lignes : l'un réduit, l'autre jamais."
    },
    {
      id: "p4-21", type: "qcm",
      niveau: "P4", competence: "classer-cumuler", categorie: "Comprendre", difficulte: 2,
      titre: "Reconnaître une fonction de fenêtre",
      question: "Laquelle de ces affirmations décrit correctement une fonction de fenêtre (OVER) ?",
      options: [
        "Elle calcule un agrégat par groupe, comme GROUP BY, mais sans réduire le nombre de lignes du résultat",
        "Elle remplace GROUP BY dans toutes les situations, en étant simplement plus rapide",
        "Elle ne peut s'utiliser que sur des colonnes de type date",
        "Elle regroupe les lignes comme GROUP BY, mais seulement si elles sont déjà triées"
      ],
      reponse: 0,
      piste: "Le nombre de lignes du résultat est le test le plus sûr : cherchez ce qui distingue vraiment les deux, pas ce qui les rapproche.",
      clause: "PARTITION BY",
      exemple: "Sur les 70 lignes de commandes, GROUP BY client_id en donne 34 ; OVER (PARTITION BY client_id) en garde 70.",
      explication: "Une fonction de fenêtre et GROUP BY peuvent calculer exactement le même agrégat (un compte, une somme, une moyenne), par le même découpage en groupes (PARTITION BY jouant le rôle de GROUP BY). Leur seule différence, mais elle est totale, porte sur ce qu'il advient des lignes : GROUP BY les fusionne, une fonction de fenêtre les garde toutes et leur ajoute simplement la valeur calculée.",
      retenir: "Ni la vitesse, ni le type de colonne, ni un tri préalable ne distinguent GROUP BY d'une fonction de fenêtre : seul le nombre de lignes du résultat le fait."
    },
    {
      id: "p4-22", type: "requete",
      niveau: "P4", competence: "classer-cumuler", categorie: "Mise en pratique", difficulte: 2,
      titre: "Classer sans égalité, pour commencer",
      question: "Pour le client 201, classez ses commandes par montant de produits décroissant, avec leur rang.",
      consigne: "Deux colonnes, dans cet ordre : id de la commande, rang (RANK). Triées par rang croissant.",
      solution: "SELECT o.id, RANK() OVER (ORDER BY (SELECT SUM(l.quantite*l.prix_unitaire) FROM lignes_commande l WHERE l.commande_id = o.id) DESC) AS rang FROM commandes o WHERE o.client_id = 201 ORDER BY rang",
      comparer: { ordonne: true },
      piste: "RANK() OVER (ORDER BY ...) s'écrit après le SELECT, comme un agrégat ordinaire — mais l'ORDER BY, ici, est à L'INTÉRIEUR des parenthèses de OVER, pas à la fin de la requête.",
      clause: "RANK",
      exemple: "RANK() OVER (ORDER BY note DESC) donnerait un rang à chaque commande selon sa note, la meilleure recevant le rang 1.",
      explication: "Les 5 commandes du client 201 ont des montants tous différents (1 299,00 €, 1 284,00 €, 575,50 €, 542,50 €, 206,50 €) : aucune égalité ne se présente encore. RANK() OVER (ORDER BY ... DESC) attribue donc simplement 1, 2, 3, 4, 5, dans l'ordre décroissant du montant — exactement ce qu'un ROW_NUMBER aurait donné aussi. La différence entre les deux n'apparaît que devant une égalité, ce que l'exercice suivant va provoquer.",
      retenir: "RANK() OVER (ORDER BY ...) s'écrit une fois pour toutes ; c'est l'ORDER BY À L'INTÉRIEUR des parenthèses qui décide du classement, pas celui de la fin de la requête."
    },
    {
      id: "p4-23", type: "requete",
      niveau: "P4", competence: "classer-cumuler", categorie: "Mise en pratique", difficulte: 2,
      titre: "Un rang, trois façons de le compter",
      question: "Pour les produits de la catégorie Informatique (categorie_id = 1), affichez l'identifiant et le prix, puis trois rangs calculés sur ce même prix décroissant : avec ROW_NUMBER, avec RANK, et avec DENSE_RANK.",
      consigne: "Cinq colonnes, dans cet ordre : id, prix, le rang ROW_NUMBER, le rang RANK, le rang DENSE_RANK. Triées par prix décroissant, puis par id croissant. Pour ROW_NUMBER, départagez les prix égaux par id croissant ; RANK et DENSE_RANK, eux, se basent sur le prix seul, sans cette clé de départage.",
      solution: "SELECT id, prix, ROW_NUMBER() OVER (ORDER BY prix DESC, id) AS rang_ligne, RANK() OVER (ORDER BY prix DESC) AS rang, DENSE_RANK() OVER (ORDER BY prix DESC) AS rang_dense FROM produits WHERE categorie_id = 1 ORDER BY prix DESC, id",
      comparer: { ordonne: true },
      pieges: ["P5"],
      piste: "Les trois fonctions s'écrivent de la même façon (nomFonction() OVER (ORDER BY ...)) mais ne traitent pas pareil un prix égal : comparez leurs trois colonnes sur les lignes 102 et 103.",
      clause: "RANK",
      exemple: "RANK() OVER (ORDER BY note DESC) classerait les clients par note décroissante, en donnant le même rang à deux notes égales.",
      explication: "101 (1 299,00 €) reçoit le rang 1 partout : aucune égalité ne le concerne. 102 et 103 sont à égalité à 449,00 € : ROW_NUMBER, qui n'admet aucune égalité, les numérote 2 et 3 (départagés par l'id, comme demandé) ; RANK et DENSE_RANK, eux, leur donnent le MÊME rang 2 — c'est tout l'intérêt d'un rang face à un simple numéro de ligne. La différence entre RANK et DENSE_RANK se voit ensuite, sur 104 (79,00 €) : RANK compte les LIGNES déjà classées avant lui (101, 102, 103, soit 3) et passe donc à 4 ; DENSE_RANK compte les VALEURS de prix distinctes déjà vues (1 299,00 € et 449,00 €, soit 2) et passe à 3, sans jamais sauter de numéro.",
      retenir: "ROW_NUMBER numérote sans jamais d'égalité, au prix d'un choix arbitraire sur les prix égaux. RANK et DENSE_RANK respectent l'égalité, mais pas de la même façon : RANK laisse un trou après un ex æquo (1, 2, 2, 4), DENSE_RANK n'en laisse jamais (1, 2, 2, 3)."
    },
    {
      id: "p4-24", type: "predire",
      niveau: "P4", competence: "classer-cumuler", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Le rang après une égalité, chez les clients",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (le classement des clients par chiffre d'affaires produits place 201 au rang 1, 202 au rang 2, puis 220 et 229 à égalité au rang 3)",
      requete: "WITH par_client AS (SELECT o.client_id, SUM(l.quantite*l.prix_unitaire) AS ca FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY o.client_id) SELECT RANK() OVER (ORDER BY ca DESC) AS rang FROM par_client WHERE client_id = 205;",
      predit: "valeur",
      pieges: ["P5"],
      piste: "201, 202, 220 et 229 occupent déjà 4 rangs (1, 2, 3 et 3). Combien de lignes RANK a-t-il dû compter avant celle de 205 ?",
      clause: "RANK",
      exemple: "Exercice précédent : après 101 (rang 1) et 102/103 (rang 2 à deux), le produit suivant reçoit le rang 4 — RANK compte les LIGNES déjà classées, pas les valeurs distinctes.",
      explication: "201 occupe seul le rang 1, 202 seul le rang 2, puis 220 et 229 se partagent le rang 3 : quatre clients sont déjà classés avant que 205 n'arrive. RANK attribue au client suivant un rang égal au nombre de lignes qui le précèdent, plus un : 4 + 1 = 5. Comme à l'exercice précédent, ce rang 5 marque que deux places (3 et 4) ont été consommées par l'égalité.",
      retenir: "Après un groupe de n lignes à égalité sur un même rang, RANK attribue au suivant un rang égal au nombre total de lignes déjà vues, plus un — jamais le rang qui suit immédiatement dans la numérotation naturelle."
    },
    {
      id: "p4-25", type: "corriger",
      niveau: "P4", competence: "classer-cumuler", categorie: "Détection d'erreur", difficulte: 3,
      titre: "LIMIT 4, et pourtant 5 lignes qui comptent",
      question: "Affichez les 4 produits les plus vendus en quantité (hors commandes annulées), avec leur quantité.",
      consigne: "Deux colonnes, dans cet ordre : id du produit, quantité vendue. Triées par quantité décroissante.",
      depart: "SELECT l.produit_id, SUM(l.quantite) AS qte FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut <> 'annulee' GROUP BY l.produit_id ORDER BY qte DESC LIMIT 4",
      solution: "WITH v AS (SELECT l.produit_id, SUM(l.quantite) AS qte FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut <> 'annulee' GROUP BY l.produit_id) SELECT produit_id, qte FROM (SELECT produit_id, qte, RANK() OVER (ORDER BY qte DESC) AS rg FROM v) WHERE rg <= 4 ORDER BY qte DESC",
      comparer: { ordonne: { cles: [1] } },
      pieges: ["P5"],
      piste: "LIMIT coupe après exactement 4 lignes, quel que soit ce qui se passe au 4e rang. RANK, lui, peut répondre : « rang 4 » peut être partagé par plus d'une ligne.",
      clause: "RANK",
      exemple: "Exercice précédent : le rang 2 des prix de la catégorie Informatique est partagé par 102 et 103 — un LIMIT 2 sur ce même classement en couperait un des deux au hasard.",
      explication: "Le départ trie par quantité décroissante et s'arrête après 4 lignes : 113 (21), 107 (14), 108 (12), puis UN SEUL des deux produits à égalité à 10 (126 et 128) — lequel, cela dépend de l'ordre dans lequel SQLite les a rencontrés, pas d'un mérite réel. La solution remplace ce LIMIT par un rang : RANK() OVER (ORDER BY qte DESC) donne 1, 2, 3, 4, 4 à ces cinq produits, et WHERE rg <= 4 les garde TOUS LES CINQ, parce que 126 et 128 partagent vraiment le 4e rang. « Les 4 produits les plus vendus » renvoie alors 5 lignes — et c'est la bonne réponse.",
      retenir: "Un LIMIT fixe peut couper au milieu d'une égalité sans le signaler ; un rang filtré par WHERE rang <= n la respecte, même si cela veut dire renvoyer plus de n lignes."
    },
    {
      id: "p4-26", type: "qcm",
      niveau: "P4", competence: "classer-cumuler", categorie: "Comprendre", difficulte: 1,
      titre: "PARTITION BY, en une phrase",
      question: "Dans ROW_NUMBER() OVER (PARTITION BY categorie_id ORDER BY prix DESC), à quoi sert PARTITION BY ?",
      options: [
        "Il redémarre le classement à 1 pour chaque catégorie, au lieu de classer tous les produits ensemble",
        "Il trie les catégories par ordre alphabétique avant de les afficher",
        "Il limite le résultat à une seule catégorie",
        "Il regroupe les catégories en une seule ligne, comme GROUP BY"
      ],
      reponse: 0,
      piste: "Sans PARTITION BY, ROW_NUMBER classerait les 30 produits ensemble, toutes catégories confondues.",
      clause: "PARTITION BY",
      exemple: "ROW_NUMBER() OVER (PARTITION BY client_id ORDER BY date_commande) numéroterait les commandes de CHAQUE client à partir de 1, sans mélanger les numéros d'un client à l'autre.",
      explication: "PARTITION BY découpe les lignes en groupes, exactement comme GROUP BY le ferait — mais au lieu de fusionner chaque groupe en une seule ligne, il laisse la fonction de fenêtre (ici ROW_NUMBER) repartir de 1 à chaque nouveau groupe. Les produits de la catégorie 2 sont ainsi classés entre eux, indépendamment de ceux de la catégorie 1.",
      retenir: "PARTITION BY délimite les groupes à l'intérieur d'un OVER ; il ne trie rien lui-même et ne réduit jamais le nombre de lignes — c'est le rôle d'ORDER BY et celui, absent ici, d'un GROUP BY."
    },
    {
      id: "p4-27", type: "requete",
      niveau: "P4", competence: "classer-cumuler", categorie: "Mise en pratique", difficulte: 2,
      titre: "Le produit le plus cher de chaque catégorie",
      question: "Pour chaque catégorie qui a des produits, affichez son produit le plus cher.",
      consigne: "Trois colonnes, dans cet ordre : categorie_id, id du produit, prix. Triées par categorie_id croissant.",
      solution: "SELECT categorie_id, id, prix FROM (SELECT id, categorie_id, prix, RANK() OVER (PARTITION BY categorie_id ORDER BY prix DESC) AS rg FROM produits) WHERE rg = 1 ORDER BY categorie_id",
      comparer: { ordonne: true },
      pieges: ["P5"],
      piste: "PARTITION BY categorie_id redémarre le rang à 1 pour chaque catégorie ; WHERE rg = 1 ne garde ensuite que le sommet de chacune.",
      clause: "PARTITION BY",
      exemple: "La catégorie Jardin n'a aucun produit : elle ne peut donc fournir aucune ligne à ce classement, PARTITION BY ou pas.",
      explication: "RANK() OVER (PARTITION BY categorie_id ORDER BY prix DESC) classe les produits par prix décroissant, séparément pour chaque catégorie. Filtrer sur rg = 1 garde le plus cher de chacune : 101 (Informatique, 1 299,00 €), 109 (Maison, 1 299,00 €), 115 (Cuisine, 349,00 €), 120 (Sport, 429,00 €), 125 (Livres, 35,00 €), 129 (Jouets, 29,00 €) — six lignes, une par catégorie qui a au moins un produit. Jardin, qui n'en a aucun, n'apparaît naturellement pas : PARTITION BY ne peut former un groupe à partir de rien.",
      retenir: "PARTITION BY ... ORDER BY ... suivi d'un filtre sur le rang est la façon générale d'obtenir « le meilleur de chaque groupe » : aucune catégorie ne peut fournir une ligne qu'elle ne possède pas."
    },
    {
      id: "p4-28", type: "requete",
      niveau: "P4", competence: "classer-cumuler", categorie: "Mise en pratique", difficulte: 3,
      titre: "Le top 2 de chaque catégorie, et une surprise",
      question: "Pour chaque catégorie qui a des produits, affichez ses deux produits les plus chers.",
      consigne: "Trois colonnes, dans cet ordre : categorie_id, id du produit, prix. Triées par categorie_id croissant, puis par prix décroissant, puis par id croissant.",
      solution: "SELECT categorie_id, id, prix FROM (SELECT id, categorie_id, prix, RANK() OVER (PARTITION BY categorie_id ORDER BY prix DESC) AS rg FROM produits) WHERE rg <= 2 ORDER BY categorie_id, prix DESC, id",
      comparer: { ordonne: true },
      pieges: ["P5"],
      piste: "RANK, pas ROW_NUMBER : si deux produits d'une même catégorie partagent le prix du rang 2, ils doivent rester tous les deux.",
      clause: "RANK",
      exemple: "L'exercice sur les quantités vendues l'a déjà montré : filtrer sur un rang peut renvoyer plus de lignes que prévu, dès qu'une égalité touche la frontière.",
      explication: "Six catégories ont des produits : on pourrait attendre 6 × 2 = 12 lignes. Le résultat en compte 13. La catégorie Informatique est seule à avoir DEUX produits à égalité au rang 2 — 102 et 103, tous deux à 449,00 € — et RANK leur donne le même rang : les deux sont donc gardés par WHERE rg <= 2, ce qu'un simple LIMIT 2 (PARTITION BY ou pas) n'aurait pas pu garantir.",
      retenir: "Un « top N par groupe » écrit avec RANK peut légitimement renvoyer plus de N lignes dans un groupe où une égalité touche la frontière : ce n'est pas une erreur, c'est ce que demande vraiment la question."
    },
    {
      id: "p4-29", type: "predire",
      niveau: "P4", competence: "classer-cumuler", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Compter les lignes avant de les voir",
      question: "Sans l'exécuter : combien de LIGNES la requête de l'exercice précédent renvoie-t-elle au total ? (6 catégories ont des produits, et Informatique a deux produits à égalité au rang 2)",
      requete: "SELECT categorie_id, id, prix FROM (SELECT id, categorie_id, prix, RANK() OVER (PARTITION BY categorie_id ORDER BY prix DESC) AS rg FROM produits) WHERE rg <= 2 ORDER BY categorie_id, prix DESC, id;",
      predit: "nbLignes",
      pieges: ["P5"],
      piste: "Sans aucune égalité, ce serait 2 lignes par catégorie. Une seule catégorie déborde de ce compte, et de combien ?",
      clause: "RANK",
      exemple: "6 catégories, 2 produits chacune en temps normal : 6 × 2 = 12.",
      explication: "Cinq catégories (Maison, Cuisine, Sport, Livres, Jouets) fournissent chacune exactement 2 lignes, sans égalité à leur rang 2 : 5 × 2 = 10. Informatique, elle, en fournit 3 (101, 102, 103) parce que 102 et 103 partagent le rang 2. Le total est donc 10 + 3 = 13, et non 6 × 2 = 12.",
      retenir: "Compter un « top N par groupe » à l'avance suppose de répartir : (nombre de groupes − 1) × N pour les groupes sans égalité à la frontière, plus le nombre réel de lignes du groupe qui en a une."
    },
    {
      id: "p4-30", type: "requete",
      niveau: "P4", competence: "classer-cumuler", categorie: "Mise en pratique", difficulte: 2,
      titre: "Comparer chaque mois au précédent",
      question: "Pour chaque mois, affichez le nombre de commandes et sa variation par rapport au mois précédent DANS LE RÉSULTAT.",
      consigne: "Trois colonnes, dans cet ordre : mois (AAAA-MM), nombre de commandes, variation. Triées par mois croissant.",
      solution: "WITH m AS (SELECT strftime('%Y-%m', date_commande) AS mois, COUNT(*) AS nb FROM commandes GROUP BY mois) SELECT mois, nb, nb - LAG(nb) OVER (ORDER BY mois) AS variation FROM m ORDER BY mois",
      comparer: { ordonne: true },
      pieges: ["P6"],
      piste: "LAG(nb) OVER (ORDER BY mois) ramène le nb de LA LIGNE PRÉCÉDENTE de ce résultat — pas forcément du mois calendaire précédent.",
      clause: "LAG",
      exemple: "Sur un relevé de température quotidien, LAG(temperature) OVER (ORDER BY jour) donnerait la température du jour précédent, pour calculer un écart jour après jour.",
      explication: "GROUP BY mois ne produit une ligne QUE pour les mois où au moins une commande existe : 17 lignes sur les 18 mois de la boutique. LAG(nb) OVER (ORDER BY mois) compare chaque mois à la LIGNE précédente de ce résultat à 17 lignes, et non au mois calendaire précédent. La première ligne (2025-01) n'a pas de ligne avant elle : sa variation vaut NULL, LAG n'ayant rien à ramener.",
      retenir: "LAG(colonne) OVER (ORDER BY ...) compare une ligne à celle qui la précède DANS LE RÉSULTAT affiché, jamais à une période calendaire qui pourrait manquer."
    },
    {
      id: "p4-31", type: "predire",
      niveau: "P4", competence: "classer-cumuler", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Le mois qui suit un mois absent",
      question: "Sans l'exécuter : quelle VALEUR la colonne variation affiche-t-elle pour septembre 2025, sachant que juillet 2025 compte 4 commandes, qu'aucune commande n'existe en août 2025, et que septembre 2025 en compte aussi 4 ?",
      requete: "WITH m AS (SELECT strftime('%Y-%m', date_commande) AS mois, COUNT(*) AS nb FROM commandes GROUP BY mois) SELECT nb - LAG(nb) OVER (ORDER BY mois) AS variation FROM m WHERE mois = '2025-09';",
      predit: "valeur",
      pieges: ["P6"],
      piste: "Août n'a aucune ligne dans ce résultat : LAG ne peut pas s'y arrêter, il va directement chercher la ligne qui précède VRAIMENT septembre dans le tableau, celle de juillet.",
      clause: "LAG",
      exemple: "Dans l'exercice précédent, le résultat de GROUP BY saute directement de 2025-07 à 2025-09, sans aucune ligne pour 2025-08.",
      explication: "La ligne de septembre 2025 (4 commandes) suit directement celle de juillet 2025 (4 commandes aussi) dans ce résultat à 17 lignes : août n'y figure pas. LAG ramène donc 4 (juillet), et la variation affichée est 4 − 4 = 0. Ce 0 ne veut pas dire « rien n'a changé entre août et septembre » : il dit « septembre a autant de commandes que le dernier mois qui en a eu », ce qui cache entièrement le mois sans aucune commande.",
      retenir: "Une variation de 0 calculée avec LAG peut cacher un mois entier sans aucune donnée : elle compare toujours à la DERNIÈRE LIGNE PRÉSENTE, jamais à une période qui pourrait être vide."
    },
    {
      id: "p4-32", type: "qcm",
      niveau: "P4", competence: "classer-cumuler", categorie: "Comprendre", difficulte: 2,
      titre: "Pourquoi ce 0 ne rassure pas",
      question: "La variation de septembre 2025, calculée avec LAG, affiche 0. Que peut-on en conclure sur le mois d'août 2025 ?",
      options: [
        "Rien de fiable : LAG a comparé septembre au dernier mois présent dans le résultat, qui se trouve être juillet, pas forcément août",
        "Qu'août a eu exactement le même nombre de commandes que septembre",
        "Qu'août a eu zéro commande, puisque la variation est nulle",
        "Que LAG a rencontré une erreur silencieuse et a renvoyé 0 par défaut"
      ],
      reponse: 0,
      pieges: ["P6"],
      piste: "La requête qui alimente LAG ne contient aucune ligne pour août : LAG ne peut comparer qu'à ce qui existe réellement dans le résultat.",
      clause: "LAG",
      exemple: "Si décembre avait aussi 0 commande, LAG comparerait janvier suivant au dernier mois non vide avant lui, quel qu'il soit — pas forcément à décembre.",
      explication: "LAG n'a aucune connaissance du calendrier : il travaille uniquement sur les lignes du résultat qui lui est donné, dans l'ordre de cet ORDER BY. Puisque GROUP BY n'a produit aucune ligne pour août (aucune commande ce mois-là), LAG, en septembre, se tourne vers la ligne précédente qui EXISTE : juillet. Le 0 affiché ne décrit donc pas une absence de changement entre deux mois consécutifs du calendrier, mais une égalité entre deux mois qui ne sont pas vraiment adjacents.",
      retenir: "Un 0 calculé par LAG n'est une information sûre que si on a déjà vérifié qu'aucune ligne n'est absente entre les deux mois comparés."
    },
    {
      id: "p4-33", type: "requete",
      niveau: "P4", competence: "classer-cumuler", categorie: "Mise en pratique", difficulte: 2,
      titre: "Le chiffre d'affaires, mois après mois, cumulé",
      question: "Pour chaque mois, affichez le chiffre d'affaires produits de ce mois et le cumul depuis le début (hors commandes annulées ou retournées).",
      consigne: "Trois colonnes, dans cet ordre : mois (AAAA-MM), chiffre d'affaires du mois, cumul. Triées par mois croissant.",
      solution: "WITH m AS (SELECT strftime('%Y-%m', o.date_commande) AS mois, SUM(l.quantite*l.prix_unitaire) AS ca FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY mois) SELECT mois, ca, SUM(ca) OVER (ORDER BY mois) AS cumul FROM m ORDER BY mois",
      comparer: { ordonne: true },
      piste: "SUM(ca) OVER (ORDER BY mois) additionne le ca de la ligne courante à tous ceux des mois QUI LA PRÉCÈDENT dans cet ordre : c'est l'ORDER BY À L'INTÉRIEUR de OVER qui décide de ce qui est « déjà cumulé ».",
      clause: "OVER",
      exemple: "SUM(montant) OVER (ORDER BY date) sur un relevé de compte donnerait, ligne après ligne, le solde cumulé après chaque opération.",
      explication: "La CTE calcule d'abord le chiffre d'affaires de chaque mois, 17 valeurs. SUM(ca) OVER (ORDER BY mois), sans PARTITION BY, additionne ensuite chaque ligne à TOUTES celles qui la précèdent dans l'ordre chronologique : janvier 2025 cumule son propre montant, février ajoute le sien à celui de janvier, et ainsi de suite jusqu'à juin 2026, où le cumul atteint 12 387,00 € — exactement le chiffre d'affaires produits sur toute la période.",
      retenir: "SUM(colonne) OVER (ORDER BY ...), sans PARTITION BY, donne un cumul qui grandit ligne après ligne dans l'ordre choisi ; le dernier cumul est toujours égal au total de toute la colonne."
    },
    {
      id: "p4-34", type: "predire",
      niveau: "P4", competence: "classer-cumuler", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Le dernier cumul, déjà connu",
      question: "Sans l'exécuter : quelle VALEUR le cumul affiche-t-il pour le dernier mois, 2026-06 ?",
      requete: "WITH m AS (SELECT strftime('%Y-%m', o.date_commande) AS mois, SUM(l.quantite*l.prix_unitaire) AS ca FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY mois) SELECT SUM(ca) OVER (ORDER BY mois) AS cumul FROM m ORDER BY mois DESC LIMIT 1;",
      predit: "valeur",
      piste: "Le cumul du DERNIER mois additionne tous les mois, sans exception : c'est donc une valeur que vous connaissez déjà sous un autre nom.",
      clause: "OVER",
      exemple: "Le chiffre d'affaires produits de toute la boutique, défini au palier 3 et repris au chapitre sur les CTE, vaut 12 387,00 €.",
      explication: "Le cumul du dernier mois additionne le chiffre d'affaires de TOUS les mois, du premier au dernier : c'est, par définition, le chiffre d'affaires produits de toute la période — la même valeur que celle calculée par une simple SUM sans aucun OVER. Un cumul mensuel qui ne retrouve pas ce total à sa dernière ligne signale une erreur dans son calcul.",
      retenir: "Le dernier cumul d'une somme courante est toujours égal à la somme totale, calculée sans aucun OVER : une bonne façon de vérifier qu'un cumul est juste."
    },
    {
      id: "p4-35", type: "corriger",
      niveau: "P4", competence: "classer-cumuler", categorie: "Détection d'erreur", difficulte: 3,
      titre: "Un cumul qui ne cumule pas dans le temps",
      question: "Pour chaque mois, affichez le chiffre d'affaires produits de ce mois et le cumul depuis le début.",
      consigne: "Trois colonnes, dans cet ordre : mois, chiffre d'affaires du mois, cumul. Triées par mois croissant.",
      depart: "WITH m AS (SELECT strftime('%Y-%m', o.date_commande) AS mois, SUM(l.quantite*l.prix_unitaire) AS ca FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY mois) SELECT mois, ca, SUM(ca) OVER (ORDER BY ca) AS cumul FROM m ORDER BY mois",
      solution: "WITH m AS (SELECT strftime('%Y-%m', o.date_commande) AS mois, SUM(l.quantite*l.prix_unitaire) AS ca FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY mois) SELECT mois, ca, SUM(ca) OVER (ORDER BY mois) AS cumul FROM m ORDER BY mois",
      comparer: { ordonne: true },
      piste: "Comparez les deux ORDER BY À L'INTÉRIEUR des parenthèses de OVER : l'un trie les mois, l'autre trie une colonne qui n'a rien à voir avec le temps.",
      clause: "OVER",
      exemple: "Un relevé de compte cumulé par montant d'opération plutôt que par date ne raconterait plus l'histoire du solde au fil du temps, même s'il reste, techniquement, une somme qui augmente.",
      explication: "Le départ s'exécute sans erreur et produit bien une colonne qui augmente : rien, à l'affichage, ne crie que le calcul est faux. Mais OVER (ORDER BY ca) cumule les mois dans l'ordre de LEUR CHIFFRE D'AFFAIRES, du plus petit au plus grand, pas dans l'ordre chronologique. Le cumul affiché à décembre 2025, par exemple, ne correspond à aucun total réel à cette date : SUM(ca) OVER (ORDER BY mois) de la solution, lui, cumule dans l'ordre du temps, et retrouve 9 022,50 € à cette même ligne.",
      retenir: "L'ORDER BY À L'INTÉRIEUR d'un OVER décide de l'ordre dans lequel une somme courante s'accumule : il doit toujours porter sur la dimension qu'on parcourt (ici, le temps), jamais sur la valeur qu'on additionne."
    },
    {
      id: "p4-36", type: "requete",
      niveau: "P4", competence: "dates", categorie: "Mise en pratique", difficulte: 2,
      titre: "Les commandes expédiées depuis trop longtemps",
      question: "Au 30 juin 2026, affichez les commandes au statut expediee dont l'expédition remonte à plus de 10 jours.",
      consigne: "Deux colonnes, dans cet ordre : id de la commande, nombre de jours écoulés depuis la commande. Triées par id croissant.",
      solution: "SELECT id, julianday('2026-06-30') - julianday(date_commande) AS jours FROM commandes WHERE statut = 'expediee' AND julianday('2026-06-30') - julianday(date_commande) > 10 ORDER BY id",
      comparer: { ordonne: true },
      pieges: ["P11"],
      piste: "julianday('2026-06-30') - julianday(date_commande) donne directement un nombre de jours : comparez-le à 10 comme vous le feriez avec n'importe quel nombre.",
      clause: "julianday",
      exemple: "julianday('2026-06-30') - julianday('2026-06-27') vaut 3 : trois jours séparent les deux dates.",
      explication: "Cinq commandes sont encore au statut expediee au 30 juin 2026 : 1062 (commandée le 2026-05-27, 34 jours), 1064 (2026-06-12, 18 jours), 1065, 1066 et 1067 (2026-06-24 à 2026-06-27, 3 à 6 jours). Seules les deux premières dépassent 10 jours d'attente : 1062 et 1064.",
      retenir: "julianday('2026-06-30') - julianday(colonne) donne un nombre de jours directement comparable : pas besoin de passer par strftime, qui ne ferait qu'extraire une partie de la date, jamais une durée."
    },
    {
      id: "p4-37", type: "predire",
      niveau: "P4", competence: "dates", categorie: "Prédire le résultat", difficulte: 2,
      titre: "Au-delà de 5 jours, sans tout recalculer",
      question: "Sans l'exécuter : quelle VALEUR cette requête affiche-t-elle ? (les 5 commandes expediee ont 34, 18, 6, 4 et 3 jours d'attente)",
      requete: "SELECT COUNT(*) FROM commandes WHERE statut = 'expediee' AND julianday('2026-06-30') - julianday(date_commande) > 5;",
      predit: "valeur",
      pieges: ["P11"],
      piste: "Parmi 34, 18, 6, 4 et 3, combien dépassent 5 ?",
      clause: "julianday",
      exemple: "L'exercice précédent listait déjà ces cinq délais.",
      explication: "Sur les cinq commandes expediee et leurs délais (34, 18, 6, 4, 3 jours), trois dépassent 5 jours : 1062 (34), 1064 (18) et 1065 (6). Les deux autres, à 4 et 3 jours, restent sous ce seuil.",
      retenir: "Une fois les délais d'un petit groupe de lignes connus, changer le seuil d'un filtre se déduit par simple comparaison, sans ré-exécuter la requête."
    },
    {
      id: "p4-38", type: "qcm",
      niveau: "P4", competence: "dates", categorie: "Comprendre", difficulte: 1,
      titre: "Pourquoi pas les commandes en_preparation ?",
      question: "Trois commandes sont encore au statut en_preparation au 30 juin 2026. Pourquoi julianday('2026-06-30') - julianday(date_commande) ne mesure-t-il pas, pour elles, un « retard de livraison » ?",
      options: [
        "Parce que cette différence mesure le temps depuis la COMMANDE, pas depuis une expédition ou une livraison qui n'a pas encore eu lieu : ce n'est pas la même question",
        "Parce que julianday ne fonctionne pas sur les commandes en_preparation",
        "Parce que ces commandes n'ont pas de date_commande renseignée",
        "Parce que le résultat serait toujours négatif pour ce statut"
      ],
      reponse: 0,
      pieges: ["P11"],
      piste: "La colonne comparée est toujours date_commande, quel que soit le statut : ce que change le statut, c'est le SENS qu'il faut donner au nombre de jours obtenu.",
      clause: "julianday",
      exemple: "Pour une commande expediee, le même calcul mesure depuis combien de temps elle a quitté l'entrepôt sans encore être arrivée — déjà une question différente d'un « retard de livraison ».",
      explication: "julianday('2026-06-30') - julianday(date_commande) calcule toujours la même chose : le nombre de jours depuis que la commande a été PASSÉE. Pour une commande en_preparation, ce nombre dit depuis combien de temps elle attend d'être préparée — une information utile, mais pas un retard de livraison, puisqu'aucune expédition n'a encore eu lieu. Mesurer un véritable retard de livraison demanderait une date d'expédition, que cette base ne contient pas.",
      retenir: "Un calcul de délai ne vaut que par les deux dates qu'il compare : changer le statut d'une commande ne change rien à la formule, mais change entièrement le sens de son résultat."
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
  },
  {
    id: "ch-p2-1", niveau: "P2", titre: "Changer de point de vue : regrouper plutôt que lister", duree: "6 min",
    resume: "Agréger, ce n'est plus lire des lignes une par une : c'est résumer des groupes de lignes en un seul chiffre.",
    lecon: {
      intro: "Jusqu'ici, chaque requête renvoyait une ligne par ligne de la table : filtrer, trier, limiter ne changeaient jamais ce qu'était une ligne du résultat. À partir de maintenant, une ligne du résultat peut représenter tout un groupe de lignes de la table, résumé en un seul chiffre : un nombre de commandes, une somme, une moyenne. C'est le même SQL, mais on ne lit plus les données, on les résume.",
      points: [
        "Une fonction d'agrégat (COUNT, SUM, AVG, MIN, MAX) ne renvoie jamais une valeur par ligne de la table : elle prend plusieurs lignes en entrée et n'en renvoie qu'une seule en sortie, le résumé de tout ce qu'elle a reçu.",
        "Sans GROUP BY, une fonction d'agrégat résume TOUTE la table en une seule ligne de résultat : impossible de distinguer un groupe d'un autre tant qu'on n'a pas dit comment les séparer.",
        "GROUP BY sépare les lignes en plusieurs groupes selon une colonne (un groupe par ville, par statut, par mois…) : la fonction d'agrégat est alors recalculée une fois par groupe, et chaque groupe devient une ligne du résultat.",
        "La question change de nature : on ne demande plus « quelles sont les lignes qui… » mais « combien, quelle somme, quelle moyenne, pour chaque… ». C'est ce saut qui est difficile, pas la syntaxe qui vient après."
      ],
      exemple: {
        titre: "Résumer toute la table en une seule ligne",
        code: "SELECT COUNT(*) FROM commandes;",
        resultat: "1 ligne, 1 colonne : 70.",
        commentaire: "COUNT(*) a reçu les 70 lignes de la table commandes et n'en a renvoyé qu'une : leur nombre. Aucune colonne, aucun WHERE n'a changé cette logique — ce que fait COUNT(*) ici, c'est déjà agréger, même sans GROUP BY. Les prochains chapitres montrent comment obtenir ce chiffre par ville, par statut ou par mois plutôt que pour toute la boutique à la fois."
      },
      astuce: "Si une requête contenant une fonction d'agrégat renvoie autant de lignes que la table de départ (ou une par ligne, au lieu d'une par groupe), c'est presque toujours qu'il manque un GROUP BY : gardez ce réflexe pour les prochains chapitres, SQLite ne vous préviendra pas de l'oubli."
    },
    exercices: ["p2-01", "p2-02"]
  },
  {
    id: "ch-p2-2", niveau: "P2", titre: "Compter avec COUNT", duree: "6 min",
    resume: "COUNT(*) compte des lignes ; COUNT(colonne) ne compte que les valeurs présentes — ce n'est pas la même question.",
    lecon: {
      intro: "COUNT est la première fonction d'agrégat à manier, et la plus trompeuse : elle existe sous deux écritures qui se ressemblent, COUNT(*) et COUNT(colonne), et qui ne comptent pourtant pas la même chose dès qu'une colonne contient des valeurs manquantes.",
      points: [
        "COUNT(*) compte toutes les lignes, sans regarder leur contenu : NULL ou pas, chaque ligne compte pour une.",
        "COUNT(colonne) ne compte que les lignes où CETTE colonne précise a une valeur : une ligne NULL sur cette colonne n'est pas comptée.",
        "COUNT(DISTINCT colonne) compte des VALEURS différentes, pas des lignes : deux lignes avec la même valeur ne comptent qu'une fois, et NULL reste ignoré.",
        "Ouvrez l'explorateur sur la table clients : quatre lignes ont une ville vide. C'est exactement la différence que COUNT(*) et COUNT(ville) vont révéler."
      ],
      exemple: {
        titre: "COUNT(*) contre COUNT(colonne)",
        code: "SELECT COUNT(*), COUNT(ville) FROM clients;",
        resultat: "40 et 36 : deux nombres différents, sur la même table.",
        commentaire: "COUNT(*) compte les 40 clients, tous confondus. COUNT(ville) n'en compte que 36 : les 4 clients sans ville connue ne participent pas au second nombre."
      },
      astuce: "Dès qu'une question porte sur une colonne qui peut être vide, demandez-vous laquelle des deux écritures elle demande vraiment : « combien de lignes » (COUNT(*)) ou « combien ont une valeur ici » (COUNT(colonne)) ne sont pas la même question."
    },
    exercices: ["p2-03", "p2-04", "p2-05", "p2-06"]
  },
  {
    id: "ch-p2-3", niveau: "P2", titre: "Sommer : SUM", duree: "5 min",
    resume: "Additionner une colonne numérique sur toutes les lignes d'un groupe — et seulement celles qu'on voulait.",
    lecon: {
      intro: "SUM additionne une colonne numérique sur toutes les lignes qu'on lui présente. C'est la plus simple des fonctions d'agrégat à calculer, et la plus facile à faire porter sur le mauvais ensemble de lignes si un filtre manque.",
      points: [
        "SUM(colonne) additionne toutes les valeurs non NULL de cette colonne, sur les lignes qui lui sont données.",
        "Comme toute fonction d'agrégat, SUM ignore les NULL : ils ne comptent ni pour 0, ni pour rien du tout, ils sont simplement absents du calcul.",
        "SUM porte sur exactement les lignes que WHERE lui laisse : un WHERE oublié ne provoque aucune erreur, juste une somme calculée sur un ensemble de lignes plus large que prévu."
      ],
      exemple: {
        titre: "Le total d'une commande",
        code: "SELECT SUM(quantite * prix_unitaire) FROM lignes_commande WHERE commande_id = 1038;",
        resultat: "102 : la somme des 4 lignes de cette commande, avant frais de port.",
        commentaire: "Sans le WHERE, cette même requête additionnerait les lignes de TOUTES les commandes de la boutique, pas seulement celle-ci — un résultat toujours valide, mais qui ne répond plus à la question posée."
      },
      astuce: "Avant de lire le résultat d'un SUM, vérifiez toujours le WHERE qui le précède : c'est lui qui décide du périmètre exact de l'addition, et son absence ne provoque jamais d'erreur visible."
    },
    exercices: ["p2-07", "p2-08", "p2-09"]
  },
  {
    id: "ch-p2-4", niveau: "P2", titre: "La moyenne et les valeurs manquantes : AVG", duree: "6 min",
    resume: "AVG divise par le nombre de valeurs présentes, pas par le nombre total de lignes — tout l'écart avec SUM/COUNT(*) vient de là.",
    lecon: {
      intro: "AVG calcule une moyenne, mais pas n'importe comment dès qu'une colonne contient des valeurs manquantes : elle ne divise que par le nombre de valeurs réellement présentes, jamais par le nombre total de lignes de la table.",
      points: [
        "AVG(colonne) ignore les lignes NULL avant de calculer : elle ne fait la moyenne que des valeurs présentes.",
        "AVG(colonne) équivaut exactement à SUM(colonne) / COUNT(colonne) — jamais à SUM(colonne) / COUNT(*) dès qu'il existe des NULL.",
        "38 des 70 commandes n'ont pas de note : une moyenne qui diviserait par 70 au lieu de 32 serait mécaniquement bien plus basse que la vraie moyenne des commandes notées."
      ],
      exemple: {
        titre: "Deux divisions, deux résultats",
        code: "SELECT AVG(note), SUM(note) * 1.0 / COUNT(*) FROM commandes;",
        resultat: "3,75 et environ 1,71 : deux nombres très différents, sur la même colonne.",
        commentaire: "AVG(note) divise 120 (la somme des notes présentes) par 32 (le nombre de notes présentes) : 3,75. SUM(note) / COUNT(*) divise les mêmes 120 par 70 (le nombre TOTAL de commandes, notées ou pas) : un résultat bien plus bas, qui ne représente plus la satisfaction moyenne de personne en particulier."
      },
      astuce: "Si une moyenne vous paraît anormalement basse sur une colonne qui peut être vide, vérifiez que vous avez bien utilisé AVG, et pas une division manuelle par COUNT(*) : l'explorateur vous montre en un coup d'œil combien de lignes de la colonne sont réellement renseignées."
    },
    exercices: ["p2-10", "p2-11", "p2-12", "p2-13"]
  },
  {
    id: "ch-p2-5", niveau: "P2", titre: "Le plus petit, le plus grand : MIN, MAX", duree: "5 min",
    resume: "MIN et MAX trouvent une valeur extrême sur une colonne, en ignorant les valeurs manquantes exactement comme les autres fonctions d'agrégat.",
    lecon: {
      intro: "MIN et MAX cherchent respectivement la plus petite et la plus grande valeur d'une colonne. Rien de nouveau dans leur façon de traiter les NULL : elles suivent exactement la même règle que COUNT(colonne), SUM et AVG.",
      points: [
        "MIN(colonne) et MAX(colonne) parcourent toutes les lignes et renvoient la valeur la plus petite, respectivement la plus grande, trouvée.",
        "Comme les autres fonctions d'agrégat, MIN et MAX ignorent les NULL : une ligne sans valeur n'est jamais candidate au minimum ou au maximum.",
        "0 est une valeur comme une autre pour MIN et MAX ; elle n'est jamais confondue avec une absence de valeur."
      ],
      exemple: {
        titre: "Les deux bornes du catalogue",
        code: "SELECT MIN(prix), MAX(prix) FROM produits;",
        resultat: "3,50 et 1 299,00 : les deux prix extrêmes du catalogue, dans la même ligne de résultat.",
        commentaire: "MIN et MAX peuvent figurer côte à côte dans le même SELECT, chacune dans sa colonne : rien n'empêche de demander plusieurs résumés à la fois."
      },
      astuce: "MIN(colonne) et MAX(colonne) ne renvoient jamais une LIGNE entière de la table, seulement la VALEUR trouvée : pour connaître aussi, par exemple, le nom du produit le moins cher, il faudra un outil que ce cours n'a pas encore vu (une sous-requête, au palier 4)."
    },
    exercices: ["p2-14", "p2-15", "p2-16"]
  },
  {
    id: "ch-p2-6", niveau: "P2", titre: "Regrouper les lignes : GROUP BY", duree: "7 min",
    resume: "GROUP BY sépare les lignes en groupes selon une colonne : une fonction d'agrégat du SELECT se recalcule alors pour chacun.",
    lecon: {
      intro: "GROUP BY est la clause qui rend les fonctions d'agrégat vraiment utiles : au lieu de résumer toute la table en une seule ligne, elle la sépare d'abord en plusieurs groupes, un résumé par groupe.",
      points: [
        "GROUP BY colonne forme un groupe par valeur différente de cette colonne, NULL compris : il forme son propre groupe, comme n'importe quelle autre valeur.",
        "Toute fonction d'agrégat du SELECT (COUNT, SUM, AVG, MIN, MAX) se recalcule alors séparément pour chaque groupe, et devient une ligne du résultat.",
        "Mélanger une colonne ordinaire et une fonction d'agrégat SANS GROUP BY ne provoque AUCUNE erreur dans SQLite : la colonne ordinaire affiche une valeur arbitraire, à côté d'un agrégat qui porte sur toute la table. C'est un résultat qui a l'air valide, et qui ne l'est pas.",
        "Le nombre de lignes d'un résultat GROUP BY dépend uniquement du nombre de valeurs différentes de la clé de regroupement, jamais du nombre de lignes de départ."
      ],
      exemple: {
        titre: "Une ligne par statut",
        code: "SELECT statut, COUNT(*) FROM commandes GROUP BY statut;",
        resultat: "5 lignes, une par statut : annulee, en_preparation, expediee, livree, retournee, chacune avec son propre compte.",
        commentaire: "Sans GROUP BY statut, cette même requête (SELECT statut, COUNT(*) FROM commandes) serait acceptée par SQLite, mais renverrait une seule ligne trompeuse : un statut choisi arbitrairement, et un compte qui porte en réalité sur toute la table."
      },
      astuce: "Avant d'exécuter une requête qui mélange une colonne et une fonction d'agrégat, demandez-vous toujours : ai-je bien ajouté GROUP BY sur cette colonne ? Si le nombre de lignes du résultat vous surprend, c'est le premier réflexe à avoir — SQLite ne vous préviendra jamais de l'oubli."
    },
    exercices: ["p2-17", "p2-18", "p2-19", "p2-20", "p2-21"]
  },
  {
    id: "ch-p2-7", niveau: "P2", titre: "Filtrer des groupes : HAVING", duree: "6 min",
    resume: "HAVING filtre des groupes après le calcul de l'agrégat ; WHERE filtre des lignes avant — confondre les deux tronque silencieusement un total.",
    lecon: {
      intro: "WHERE et GROUP BY ne suffisent pas toujours : parfois, la condition qui intéresse porte sur le RÉSULTAT d'un agrégat (un total, une moyenne, un compte), pas sur une colonne brute de la table. C'est le rôle de HAVING.",
      points: [
        "HAVING s'écrit après GROUP BY, et filtre les GROUPES déjà formés, selon le résultat d'une fonction d'agrégat.",
        "WHERE filtre des LIGNES, avant que les groupes n'existent ; HAVING filtre des GROUPES, après que leur agrégat a été calculé — ce n'est jamais le même moment.",
        "Utiliser WHERE pour une condition qui devrait porter sur un total tronque ce total : il ne reste alors que les lignes qui, à elles seules, dépassent déjà le seuil, pas les groupes dont la SOMME le dépasse.",
        "SQLite effectue une division ENTIÈRE entre deux nombres entiers : le résultat est tronqué, pas arrondi, ce qui peut rendre un HAVING sur une moyenne calculée à la main (SUM / COUNT) trompeur."
      ],
      exemple: {
        titre: "Les commandes qui dépassent 1 000 €",
        code: "SELECT commande_id, SUM(quantite * prix_unitaire) AS total FROM lignes_commande GROUP BY commande_id HAVING total > 1000;",
        resultat: "6 commandes sur 70, chacune avec un total par commande supérieur à 1 000 €.",
        commentaire: "HAVING total > 1000 ne regarde le total de chaque commande qu'UNE FOIS qu'il a été calculé par GROUP BY et SUM. Écrire ce même seuil dans un WHERE comparerait chaque LIGNE isolément, avant toute addition — un résultat différent, et plus petit."
      },
      astuce: "Une règle simple pour ne jamais confondre WHERE et HAVING : si la condition cite directement une colonne de la table, c'est WHERE ; si elle cite le résultat d'une fonction d'agrégat (SUM(...), COUNT(...), AVG(...)), c'est HAVING."
    },
    exercices: ["p2-22", "p2-23", "p2-24", "p2-25"]
  },
  {
    id: "ch-p2-8", niveau: "P2", titre: "Classer avec CASE WHEN", duree: "6 min",
    resume: "CASE WHEN fabrique une colonne calculée selon des conditions, ligne par ligne — utile pour regrouper des catégories à sa façon, pas seulement celles qui existent déjà dans la table.",
    lecon: {
      intro: "CASE WHEN construit une valeur différente selon une ou plusieurs conditions, ligne par ligne. Combinée à GROUP BY, elle permet de regrouper les lignes selon des catégories qu'on invente soi-même, pas seulement celles déjà présentes dans une colonne de la table.",
      points: [
        "CASE WHEN condition1 THEN valeur1 WHEN condition2 THEN valeur2 ELSE valeur3 END teste les conditions dans l'ordre, et s'arrête à la première qui est vraie.",
        "Sans ELSE, une ligne qui ne vérifie AUCUNE condition reçoit NULL — silencieusement, sans erreur.",
        "Une fois nommée par AS, une colonne CASE WHEN se GROUP BY exactement comme une colonne ordinaire de la table.",
        "C'est l'un des outils qui permettent de traduire une question métier floue (« les commandes qui ont bien abouti », « les commandes perdues ») en catégories SQL précises."
      ],
      exemple: {
        titre: "Deux familles de statuts",
        code: "SELECT CASE WHEN statut IN ('annulee', 'retournee') THEN 'perdue' ELSE 'aboutie' END AS famille, COUNT(*) FROM commandes GROUP BY famille;",
        resultat: "2 lignes : perdue (16 commandes) et aboutie (54 commandes).",
        commentaire: "CASE WHEN a transformé les 5 statuts d'origine en seulement 2 familles, choisies par l'auteur de la requête — pas par la structure de la table."
      },
      astuce: "Si un groupe NULL apparaît dans un résultat GROUP BY alors que vous ne l'attendiez pas, vérifiez d'abord un CASE WHEN voisin sans ELSE : c'est la cause la plus fréquente d'un NULL qui n'était pas déjà dans la table."
    },
    exercices: ["p2-26", "p2-27", "p2-28"]
  },
  {
    id: "ch-p2-9", niveau: "P2", titre: "Extraire une date", duree: "6 min",
    resume: "strftime extrait une partie d'une date écrite en AAAA-MM-JJ — toujours sous forme de texte, jamais de nombre.",
    lecon: {
      intro: "Les dates de Requêt'R sont du texte au format AAAA-MM-JJ : strftime en extrait une partie — l'année, le mois, ou les deux ensemble — toujours sous forme de texte, elle aussi.",
      points: [
        "strftime('%Y', colonne) extrait l'année (4 chiffres) ; strftime('%m', colonne) le mois (2 chiffres) ; strftime('%Y-%m', colonne) les deux ensemble, dans cet ordre.",
        "strftime renvoie toujours du TEXTE, jamais un nombre entier : le comparer à un nombre nu (= 2025, sans apostrophes) ne trouve silencieusement aucune ligne.",
        "Extraire le mois SEUL (%m) confond les mêmes mois d'années différentes : janvier 2025 et janvier 2026 portent tous les deux '01'. Dès que les données couvrent plusieurs années, %Y-%m garde la distinction.",
        "Ouvrez l'explorateur sur la table commandes : la colonne date_commande s'étend de janvier 2025 à juin 2026, sur deux années civiles."
      ],
      exemple: {
        titre: "L'année de chaque commande",
        code: "SELECT strftime('%Y', date_commande) AS annee, COUNT(*) FROM commandes GROUP BY annee;",
        resultat: "2025 (44 commandes) et 2026 (26 commandes).",
        commentaire: "strftime('%Y', date_commande) réduit chaque date à son année, sous forme de texte ('2025', pas 2025) ; GROUP BY regroupe ensuite sur cette valeur réduite, exactement comme sur une colonne ordinaire."
      },
      astuce: "Si une condition WHERE sur une date extraite par strftime ne trouve jamais rien alors que vous êtes sûr qu'elle devrait, vérifiez en premier que vous comparez bien à une valeur ENTRE APOSTROPHES : strftime ne renvoie jamais de nombre."
    },
    exercices: ["p2-29", "p2-30", "p2-31", "p2-32"]
  },
  {
    id: "ch-p2-10", niveau: "P2", titre: "Regrouper par date : le trou et la frontière", duree: "6 min",
    resume: "GROUP BY ne peut révéler que des groupes qui existent : un mois entier sans commande disparaît du résultat, il n'y apparaît jamais à zéro.",
    lecon: {
      intro: "Regrouper par mois réserve une surprise dès que les données ont un trou : GROUP BY ne fabrique jamais de ligne pour un groupe vide, même si ce groupe existe bien dans le calendrier.",
      points: [
        "La boutique a enregistré des commandes sur 18 mois civils, de janvier 2025 à juin 2026 — mais aucune en août 2025 : un trou d'un mois entier.",
        "GROUP BY ne peut regrouper que des lignes qui EXISTENT : un mois sans la moindre commande n'apparaît jamais dans le résultat, ni à zéro, ni autrement — il est simplement absent.",
        "Deux dates consécutives au jour près peuvent appartenir à deux groupes différents dès qu'elles franchissent une frontière de calendrier : la commande 1044 (31 décembre 2025) et la commande 1045 (1er janvier 2026) se suivent directement, mais tombent dans deux années différentes.",
        "Un résultat à zéro ligne n'est pas toujours une erreur : il peut révéler une vraie absence de données, comme ce mois d'août sans la moindre commande."
      ],
      exemple: {
        titre: "Dix-huit mois possibles, dix-sept présents",
        code: "SELECT COUNT(DISTINCT strftime('%Y-%m', date_commande)) FROM commandes;",
        resultat: "17, alors que janvier 2025 à juin 2026 compte 18 mois civils.",
        commentaire: "Le compte distinct des mois présents dans les données (17) est inférieur au nombre de mois qui existent dans le calendrier sur cette période (18) : la différence, c'est le mois sans aucune commande, invisible pour GROUP BY."
      },
      astuce: "Si vous deviez un jour comparer un mois à « celui d'avant » plutôt qu'à sa seule position dans un résultat trié, méfiez-vous : un outil comme LAG (vu bien plus tard, au palier 4) compare une ligne à la ligne juste au-dessus dans le résultat, pas au mois calendaire précédent — un trou comme celui d'août le ferait sauter sans prévenir."
    },
    exercices: ["p2-33", "p2-34", "p2-35", "p2-36"]
  },
  {
    id: "ch-p2-11", niveau: "P2", titre: "Chiffre d'affaires : lequel des deux ?", duree: "5 min",
    resume: "« Chiffre d'affaires » seul ne veut rien dire de précis : il faut toujours savoir si les frais de port sont comptés ou non.",
    lecon: {
      intro: "Dès qu'une question porte sur de l'argent, un mot aussi courant que « chiffre d'affaires » cache une ambiguïté : compte-t-il les frais de port, ou seulement la valeur des produits vendus ? Les deux réponses sont légitimes, et donnent deux nombres différents.",
      points: [
        "Le chiffre d'affaires PRODUITS d'une commande est le total de ses lignes (quantité × prix unitaire) : il exclut les frais de port.",
        "Le chiffre d'affaires TOTAL ajoute les frais de port de la commande — comptés UNE SEULE FOIS par commande, pas une fois par ligne.",
        "Une consigne qui demande « le chiffre d'affaires » sans préciser lequel des deux est ambiguë : à partir de ce palier, toute consigne sur un montant précise toujours lequel des deux elle attend.",
        "Le jour où il faudra calculer ce total sur TOUTES les commandes à la fois (une jointure, palier 3), il faudra veiller à ne compter les frais de port qu'une fois par commande, pas une fois par ligne de produit."
      ],
      exemple: {
        titre: "Produits, puis total",
        code: "SELECT SUM(quantite * prix_unitaire) FROM lignes_commande WHERE commande_id = 1038;",
        resultat: "102,00 € : le chiffre d'affaires PRODUITS de cette seule commande.",
        commentaire: "Cette commande a aussi 6,50 € de frais de port (visibles dans l'explorateur, table commandes, colonne frais_port) : son chiffre d'affaires TOTAL est donc 108,50 €, pas 102,00 €."
      },
      astuce: "Chaque fois qu'une consigne de ce cours parle d'argent, relisez-la en vous demandant : parle-t-elle des produits seuls, ou du total payé ? Le mot qu'elle choisit (« produits » ou « total ») répond toujours à cette question — sans exception à partir de maintenant."
    },
    exercices: ["p2-37", "p2-38", "p2-39"]
  },
  {
    id: "ch-p3-1", niveau: "P3", titre: "Pourquoi relier deux tables", duree: "5 min",
    resume: "Une information n'est écrite qu'à un seul endroit : pour la lire avec une autre, il faut relier les deux tables qui la portent.",
    lecon: {
      intro: "Jusqu'ici, chaque requête lisait une seule table. Mais la boutique n'écrit jamais deux fois la même information : le nom d'un client vit dans clients, et nulle part ailleurs. La table commandes ne contient donc pas ce nom — seulement un client_id qui dit de quelle ligne de clients il s'agit. Répondre à « le nom du client et la date de sa commande » demande de lire les deux tables ensemble.",
      points: [
        "Une clé étrangère (commandes.client_id) contient l'identifiant d'une ligne d'une autre table : c'est le fil qui relie les deux, et la carte des relations de l'explorateur montre tous ces fils.",
        "Écrire l'information une seule fois est une qualité, pas un défaut : un client qui change de nom se corrige à un seul endroit, et ses commandes suivent automatiquement.",
        "La contrepartie, c'est qu'aucune table ne répond plus seule aux questions qui mêlent deux sujets : il faut les relier au moment de lire.",
        "Relier deux tables par le fil qui les unit ne crée pas de lignes nouvelles : à chaque commande correspond un seul client, donc le résultat garde une ligne par commande et gagne des colonnes."
      ],
      exemple: {
        titre: "Le fil entre deux tables",
        code: "SELECT client_id, date_commande FROM commandes LIMIT 3;",
        resultat: "Trois lignes, dont des identifiants (201, 202…) à la place des noms.",
        commentaire: "Ces nombres ne sont pas des noms, mais ils y mènent : 201 désigne la ligne de clients dont l'id vaut 201. Ouvrez l'explorateur sur les deux tables pour suivre le fil à la main — c'est exactement ce travail qu'une jointure va faire pour vous, sur les 70 commandes à la fois."
      },
      astuce: "Avant d'écrire une jointure, repérez son fil sur la carte des relations de l'explorateur : elle indique quelle colonne pointe vers quelle autre, et donne ainsi la condition à écrire après le ON, sans avoir à la deviner."
    },
    exercices: ["p3-01", "p3-02"]
  },
  {
    id: "ch-p3-2", niveau: "P3", titre: "La première jointure : JOIN … ON", duree: "7 min",
    resume: "JOIN dit quelles tables lire ensemble, ON dit comment elles se correspondent — et sans ON, tout se mélange.",
    lecon: {
      intro: "Une jointure s'écrit en deux temps : JOIN nomme la seconde table, ON donne la condition qui met ses lignes en correspondance avec celles de la première. Ces deux mots vont toujours ensemble. Oublier le ON ne provoque aucune erreur : SQLite associe alors chaque ligne de l'une à chaque ligne de l'autre, et renvoie un résultat énorme et faux.",
      points: [
        "FROM commandes o JOIN clients c ON c.id = o.client_id se lit : lis commandes, et pour chaque commande va chercher la ligne de clients dont l'id vaut son client_id.",
        "Les lettres o et c sont des alias : un nom court donné à une table pour la durée de la requête. Ils ne changent rien au résultat, ils rendent les colonnes lisibles.",
        "Dès que deux tables sont en jeu, préfixez les colonnes : c.nom, o.date_commande. Les deux tables ont une colonne id, et rien d'autre que le préfixe ne dit de laquelle on parle.",
        "La condition du ON est presque toujours la même : la clé étrangère d'une table contre la clé primaire de l'autre. La carte des relations de l'explorateur la donne telle quelle."
      ],
      exemple: {
        titre: "Deux tables, un seul résultat",
        code: "SELECT c.nom, o.date_commande FROM commandes o JOIN clients c ON c.id = o.client_id;",
        resultat: "70 lignes : le nom du client en clair, à côté de la date de sa commande.",
        commentaire: "Le nom vient de clients, la date de commandes, et le ON garantit que les deux appartiennent bien à la même commande. Sans ce ON, le même SELECT renverrait 2 800 lignes — chaque commande au nom de chacun des 40 clients."
      },
      astuce: "Si un résultat est bien plus gros que la plus grande des deux tables, et que sa taille ressemble au produit de leurs tailles, cherchez le ON manquant avant toute autre chose."
    },
    exercices: ["p3-03", "p3-04", "p3-05", "p3-06"]
  },
  {
    id: "ch-p3-3", niveau: "P3", titre: "Combien de lignes une jointure renvoie-t-elle ?", duree: "6 min",
    resume: "Le compte vient toujours du côté « plusieurs » : relier commandes à ses lignes de produits fait passer de 70 à 142.",
    lecon: {
      intro: "Une jointure correcte ne garantit pas que le nombre de lignes reste le même. Tout dépend du sens dans lequel le fil est tendu : vers la table qu'on pointe, ou vers celle qui nous pointe. C'est la question la plus utile à se poser avant d'exécuter, parce qu'elle décide de tout ce qu'on calculera ensuite.",
      points: [
        "Vers la table pointée (une commande → son client) : chaque ligne trouve une seule correspondance, le nombre de lignes ne change pas. 70 commandes donnent 70 lignes.",
        "Vers la table qui pointe (une commande ← ses lignes de produits) : chaque ligne du côté « plusieurs » donne une ligne de résultat. 70 commandes et 142 lignes de produits donnent 142 lignes.",
        "Dans ce second cas, les colonnes de la commande (date, statut, frais de port) sont recopiées à l'identique sur chacune de ses lignes : la répétition est normale, c'est ainsi qu'une jointure fonctionne.",
        "Une jointure ne résume rien et n'additionne rien : elle met des lignes côte à côte. Tant qu'on lit, cette répétition est inoffensive ; dès qu'on additionne, elle fausse tout — le chapitre suivant le montre."
      ],
      exemple: {
        titre: "De 70 à 142",
        code: "SELECT o.id, l.produit_id, l.quantite FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id;",
        resultat: "142 lignes, alors que la table commandes n'en compte que 70.",
        commentaire: "Les 70 commandes sont toutes présentes, mais celles qui ont plusieurs produits occupent plusieurs lignes : la commande 1038, qui en a 4, apparaît 4 fois. Le nombre de lignes du résultat est celui de lignes_commande, pas celui de commandes."
      },
      astuce: "Avant d'exécuter une jointure, demandez-vous de quel côté est le « plusieurs ». La carte des relations l'indique par ses 1 et ses N : le résultat aura le nombre de lignes du côté N."
    },
    exercices: ["p3-07", "p3-08", "p3-09"]
  },
  {
    id: "ch-p3-4", niveau: "P3", titre: "Le total gonflé par la jointure", duree: "7 min",
    resume: "Additionner une colonne de la table « une seule ligne » après une jointure la compte une fois par ligne liée — et le total est toujours trop grand.",
    lecon: {
      intro: "C'est le piège le plus coûteux de tout le palier, et le plus discret : la requête s'exécute, renvoie un nombre d'apparence normale, et ce nombre est faux. Il naît de ce que le chapitre précédent a montré — une commande à plusieurs lignes de produits est répétée autant de fois — et il frappe dès qu'on additionne une colonne qui appartient à la commande elle-même.",
      points: [
        "Une colonne comme frais_port appartient à la commande, pas à ses lignes de produits : elle vaut une seule fois par commande, quel que soit le nombre d'articles.",
        "Après la jointure, cette valeur unique est recopiée sur chaque ligne liée : SUM l'additionne alors une fois par ligne de produit, et non une fois par commande.",
        "L'erreur ne va que dans un sens, vers le haut : aucune commande ne peut être comptée moins d'une fois, et toute commande à plusieurs lignes est comptée plusieurs fois.",
        "La bonne réaction est presque toujours de retirer la jointure : si la question ne porte que sur commandes, aucune autre table n'a à intervenir. Quand la jointure est vraiment nécessaire, c'est COUNT(DISTINCT identifiant) qui permet de compter juste."
      ],
      exemple: {
        titre: "306,50 € ou 636,00 € ?",
        code: "SELECT SUM(frais_port) FROM commandes;",
        resultat: "306,50 € — le vrai total, chaque commande comptée une fois.",
        commentaire: "La même somme calculée après une jointure avec lignes_commande renvoie 636,00 €, soit plus du double : les frais de la commande 1038, 6,50 €, y sont comptés 4 fois parce qu'elle a 4 lignes de produits. Les deux requêtes s'exécutent sans la moindre erreur ; seule la question « sur quoi est-ce que j'additionne ? » les sépare."
      },
      astuce: "Après avoir écrit un SUM ou un COUNT dans une requête qui contient une jointure, demandez-vous toujours : cette colonne appartient-elle à la table du côté « plusieurs » ? Si non, le total est gonflé."
    },
    exercices: ["p3-10", "p3-11", "p3-12"]
  },
  {
    id: "ch-p3-5", niveau: "P3", titre: "LEFT JOIN : garder ceux qui n'ont rien", duree: "6 min",
    resume: "Une jointure ordinaire écarte sans rien dire les lignes sans correspondance ; LEFT JOIN les garde, avec des colonnes vides.",
    lecon: {
      intro: "Une jointure ordinaire ne garde que les lignes qui se correspondent des deux côtés. C'est souvent ce qu'on veut — mais pas toujours : « tous les clients, même ceux qui n'ont jamais commandé » est une question parfaitement légitime, à laquelle JOIN répond faux sans prévenir. LEFT JOIN existe pour ces cas-là.",
      points: [
        "LEFT JOIN garde toutes les lignes de la table de GAUCHE, celle écrite juste avant lui, qu'elles aient ou non une correspondance à droite.",
        "Pour une ligne de gauche sans correspondance, les colonnes de droite valent NULL : la ligne existe, mais elle est vide de ce côté.",
        "Ce NULL n'est pas une donnée manquante de la base : c'est la jointure qui le fabrique, et il est la trace exploitable de l'absence.",
        "L'ordre des tables cesse d'être indifférent : dans un LEFT JOIN, c'est celle de gauche qui est protégée. Écrivez en premier la table dont aucune ligne ne doit disparaître."
      ],
      exemple: {
        titre: "70 commandes, 76 lignes",
        code: "SELECT c.nom, o.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id;",
        resultat: "76 lignes : les 70 commandes, plus 6 clients à l'identifiant vide.",
        commentaire: "Les 6 lignes supplémentaires sont les clients qui n'ont jamais commandé : ils apparaissent avec leur nom, et un identifiant de commande à NULL. Avec JOIN au lieu de LEFT JOIN, ces 6 lignes disparaîtraient — sans message, sans trace."
      },
      astuce: "Relisez la consigne en cherchant les mots « tous », « chaque », « même ceux qui n'ont pas ». Ils signalent presque toujours un LEFT JOIN, et une jointure ordinaire y répondrait faux."
    },
    exercices: ["p3-13", "p3-14", "p3-15"]
  },
  {
    id: "ch-p3-6", niveau: "P3", titre: "Trouver ce qui n'existe pas : l'anti-jointure", duree: "6 min",
    resume: "LEFT JOIN pour tout garder, puis IS NULL pour ne retenir que les lignes sans correspondance : c'est ainsi qu'on répond aux questions en « jamais ».",
    lecon: {
      intro: "« Quels clients n'ont jamais commandé ? » est une question que les données ne contiennent pas : aucune table ne porte la trace d'une commande qui n'a pas eu lieu. Il faut la déduire, et la déduction tient en deux temps — garder tout le monde, puis ne retenir que ceux pour qui la jointure n'a rien trouvé.",
      points: [
        "Premier temps : LEFT JOIN, pour que les lignes sans correspondance soient présentes dans le résultat.",
        "Second temps : WHERE colonne_de_droite IS NULL, pour ne garder que celles-là.",
        "Testez ce IS NULL sur une colonne qui ne peut jamais être vide dans la table — la clé primaire. Son NULL ne peut alors signifier qu'une seule chose : aucune correspondance.",
        "Avec JOIN au lieu de LEFT JOIN, cette requête renvoie toujours zéro ligne : les lignes recherchées ont été éliminées avant d'être testées."
      ],
      exemple: {
        titre: "Chercher une absence",
        code: "SELECT c.nom FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE o.id IS NULL;",
        resultat: "6 lignes : les clients qui n'ont jamais rien commandé.",
        commentaire: "La même forme répond à « quels produits n'ont jamais été commandés ? » (5 produits) ou « quelle catégorie ne contient aucun produit ? » (Jardin). Seules changent les deux tables et la colonne du ON : c'est une forme à reconnaître, pas trois requêtes à apprendre."
      },
      astuce: "Un résultat vide là où vous attendiez des lignes, sur une requête qui cherche une absence : vérifiez d'abord que la jointure est bien un LEFT JOIN. C'est l'erreur la plus fréquente, et la plus silencieuse."
    },
    exercices: ["p3-16", "p3-17", "p3-18"]
  },
  {
    id: "ch-p3-7", niveau: "P3", titre: "Compter après un LEFT JOIN", duree: "6 min",
    resume: "COUNT(*) compte la ligne que le LEFT JOIN a créée, et crédite d'une commande un client qui n'en a aucune.",
    lecon: {
      intro: "Le LEFT JOIN crée une ligne pour chaque élément sans correspondance. Cette ligne existe, elle est donc comptée — et c'est exactement ce qu'il ne faut pas. L'erreur donne un tableau d'apparence impeccable, avec le bon nombre de lignes et les bons noms, où seuls quelques chiffres sont faux.",
      points: [
        "COUNT(*) compte des lignes de résultat : pour un client sans commande, il trouve la ligne créée par le LEFT JOIN et renvoie 1.",
        "COUNT(colonne_de_droite) ne compte que les valeurs présentes : sur cette même ligne, la colonne vaut NULL, et le compte renvoie bien 0.",
        "C'est la règle du palier 2 sur COUNT(*) et COUNT(colonne), appliquée à un NULL que la jointure a fabriqué plutôt qu'à un NULL présent dans la base.",
        "Dès qu'un comptage suit un LEFT JOIN, comptez une colonne de la table de droite. Les deux écritures ne diffèrent que par ce qui est entre parenthèses, et pourtant elles répondent à deux questions distinctes."
      ],
      exemple: {
        titre: "1 ou 0, pour le même client",
        code: "SELECT COUNT(*), COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE c.id = 215;",
        resultat: "1 et 0 : deux nombres différents, pour un client qui n'a aucune commande.",
        commentaire: "COUNT(*) voit une ligne et la compte. COUNT(o.id) regarde l'identifiant de commande sur cette ligne, le trouve vide, et ne compte rien. Seul le second répond à « combien de commandes a ce client »."
      },
      astuce: "Après avoir écrit COUNT(*) dans une requête qui contient un LEFT JOIN, arrêtez-vous : il y a de fortes chances qu'il faille compter une colonne précise de la table de droite à la place."
    },
    exercices: ["p3-19", "p3-20", "p3-21"]
  },
  {
    id: "ch-p3-8", niveau: "P3", titre: "ON ou WHERE : le filtre qui annule le LEFT JOIN", duree: "7 min",
    resume: "Une condition sur la table de droite change de sens selon sa place : dans le ON elle restreint la correspondance, dans le WHERE elle supprime les lignes gardées.",
    lecon: {
      intro: "Voici le piège le plus subtil du palier, parce qu'il ne porte ni sur un mot-clé ni sur une colonne, mais sur une PLACE. La même condition, écrite dans le ON ou dans le WHERE, donne deux résultats différents — et celui du WHERE ressemble à s'y méprendre à ce qu'aurait donné une jointure ordinaire.",
      points: [
        "Le ON définit ce qui se RELIE : une condition qu'il porte décide quelles lignes de droite viennent se coller à chaque ligne de gauche. Celles de gauche restent toutes là.",
        "Le WHERE décide ce qui est GARDÉ, et s'applique APRÈS la jointure, sur son résultat.",
        "Une ligne sans correspondance a ses colonnes de droite à NULL : toute condition du WHERE portant sur ces colonnes est alors non vraie, et la ligne est éliminée.",
        "Résultat : un WHERE sur la table de droite annule le LEFT JOIN. Pour filtrer sans perdre les lignes de gauche, la condition doit rejoindre le ON."
      ],
      exemple: {
        titre: "46 ou 59 lignes, pour une seule différence",
        code: "SELECT c.nom, o.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id AND o.statut = 'livree';",
        resultat: "59 lignes : 46 commandes livrées, plus 13 clients sans aucune commande livrée.",
        commentaire: "La même condition déplacée dans un WHERE ne renvoie que 46 lignes : les 13 clients sans commande livrée ont été éliminés, parce que leur statut valait NULL. Le LEFT JOIN était pourtant bien écrit — c'est le WHERE qui l'a défait."
      },
      astuce: "Règle simple : une condition qui porte sur la table de droite d'un LEFT JOIN va dans le ON. Une condition qui porte sur la table de gauche va dans le WHERE, où elle ne pose aucun problème."
    },
    exercices: ["p3-22", "p3-23", "p3-24"]
  },
  {
    id: "ch-p3-9", niveau: "P3", titre: "L'anti-jointure sur tout le catalogue", duree: "5 min",
    resume: "La même forme répond partout : produits jamais commandés, rayon vide, client sans commande — seules les tables changent.",
    lecon: {
      intro: "L'anti-jointure a été vue sur les clients ; elle vaut partout où une table en pointe une autre. Ce chapitre la rejoue sur le catalogue, pour qu'elle devienne une forme reconnue plutôt qu'une requête à redécouvrir à chaque fois.",
      points: [
        "Un produit jamais commandé n'est cité par aucune ligne de lignes_commande : LEFT JOIN depuis produits, puis WHERE l.produit_id IS NULL.",
        "Une catégorie vide n'est désignée par aucun produit : LEFT JOIN depuis categories, puis WHERE p.id IS NULL. Le sens de lecture est le même, un cran plus haut.",
        "Dans les deux cas, la table à préserver — celle dont on cherche les éléments orphelins — s'écrit à gauche.",
        "« Jamais commandé » et « jamais vendu » ne sont pas la même question : un produit peut figurer dans une commande qui a été annulée. La première se lit par l'anti-jointure, la seconde demanderait en plus de regarder le statut de la commande."
      ],
      exemple: {
        titre: "Cinq produits sur trente",
        code: "SELECT p.nom FROM produits p LEFT JOIN lignes_commande l ON l.produit_id = p.id WHERE l.produit_id IS NULL;",
        resultat: "5 lignes : Tapis de bain, Robot pâtissier, Vélo d'appartement, Atlas du monde, Puzzle 1000 pièces.",
        commentaire: "Aucune colonne de la table produits ne dit « jamais vendu » : l'information n'existe nulle part, elle se déduit du vide laissé par la jointure. C'est ce qui rend cette forme irremplaçable."
      },
      astuce: "Devant une question en « jamais », « aucun » ou « sans », demandez-vous quelle table pointe quelle autre : la table à préserver va à gauche, et le IS NULL se teste sur la clé primaire de celle de droite."
    },
    exercices: ["p3-25", "p3-26", "p3-27", "p3-28"]
  },
  {
    id: "ch-p3-10", niveau: "P3", titre: "Enchaîner trois tables", duree: "6 min",
    resume: "Les jointures s'enchaînent en suivant les clés étrangères ; aller vers une table pointée n'ajoute jamais de lignes.",
    lecon: {
      intro: "Rien de nouveau pour relier trois tables : on ajoute un JOIN et son ON, et on recommence. Le chemin à suivre est celui des flèches de la carte des relations. La seule chose à surveiller reste la même qu'avec deux tables — le sens dans lequel chaque fil est tendu, parce que lui seul décide du nombre de lignes.",
      points: [
        "Chaque JOIN a son propre ON : une jointure ne se devine jamais, même quand les précédentes sont écrites.",
        "Aller vers une table POINTÉE (une ligne de commande → son produit) n'ajoute pas de lignes : chaque ligne trouve une seule correspondance.",
        "Aller vers une table qui POINTE (une commande ← ses lignes) multiplie les lignes : c'est là, et seulement là, que le compte change.",
        "Dès que deux tables du chemin ont une colonne de même nom — nom, id —, nommez les colonnes du résultat avec AS : sinon, deux colonnes homonymes se succèdent sans qu'on puisse les distinguer."
      ],
      exemple: {
        titre: "De la commande au produit, en passant par le client",
        code: "SELECT c.nom AS client, p.nom AS produit FROM commandes o JOIN clients c ON c.id = o.client_id JOIN lignes_commande l ON l.commande_id = o.id JOIN produits p ON p.id = l.produit_id WHERE o.id = 1038;",
        resultat: "4 lignes : le nom du client, répété, à côté de chacun des 4 produits de sa commande.",
        commentaire: "Trois jointures, trois ON, chacun avec sa propre colonne. Le client apparaît quatre fois : c'est le passage par lignes_commande, du côté « plusieurs », qui a multiplié les lignes — pas le nombre de tables."
      },
      astuce: "Écrivez une jointure à la fois et exécutez : si le nombre de lignes bondit à l'ajout d'un JOIN, vous venez de passer du côté « plusieurs », et tout total calculé ensuite sur les tables précédentes sera gonflé."
    },
    exercices: ["p3-29", "p3-30", "p3-31", "p3-32"]
  },
  {
    id: "ch-p3-11", niveau: "P3", titre: "Le prix facturé n'est pas le prix d'aujourd'hui", duree: "5 min",
    resume: "Une ligne de commande garde le prix payé ; le catalogue porte le prix actuel. Les confondre réécrit l'histoire.",
    lecon: {
      intro: "Les deux tables contiennent un prix, et ce n'est pas une erreur de conception : lignes_commande.prix_unitaire est le prix FACTURÉ au moment de la commande, produits.prix est le prix AFFICHÉ aujourd'hui. Une fois les tables jointes, les deux colonnes sont disponibles côte à côte — et choisir la mauvaise recalcule le passé aux tarifs du jour.",
      points: [
        "Un prix figé sur la ligne de commande n'est pas une redondance : c'est la trace de ce qui a réellement été payé, et il ne doit jamais changer.",
        "Tout montant historique — le total d'une commande, un chiffre d'affaires — se calcule avec prix_unitaire.",
        "Le prix du catalogue ne sert qu'aux questions sur le présent : ce que coûte un article aujourd'hui, la valeur du stock actuel.",
        "Sur cette base, 22 lignes de commande sur 142 ont été facturées à un autre prix que celui affiché aujourd'hui : l'écart est réel, et toutes sont antérieures à octobre 2025."
      ],
      exemple: {
        titre: "479,00 € hier, 449,00 € aujourd'hui",
        code: "SELECT l.prix_unitaire, p.prix, p.nom FROM lignes_commande l JOIN produits p ON p.id = l.produit_id WHERE l.commande_id = 1004;",
        resultat: "Une tablette facturée 479,00 € alors que le catalogue affiche 449,00 €.",
        commentaire: "Le montant de cette commande vaut 498,50 € avec les prix facturés, 468,50 € avec ceux d'aujourd'hui. Les deux requêtes s'exécutent sans erreur ; une seule dit la vérité sur ce que le client a payé."
      },
      astuce: "Quand deux tables jointes offrent deux colonnes au nom voisin, demandez-vous laquelle témoigne d'un moment passé. C'est presque toujours celle qui est stockée au plus près de l'événement."
    },
    exercices: ["p3-33", "p3-34", "p3-35"]
  },
  {
    id: "ch-p3-12", niveau: "P3", titre: "Le chiffre d'affaires, enfin calculable", duree: "6 min",
    resume: "La jointure donne accès au statut : le chiffre d'affaires produits de toute la boutique devient calculable — à condition de dire lequel on veut.",
    lecon: {
      intro: "Au palier 2, cette question ne pouvait porter que sur une commande à la fois : le montant est dans lignes_commande, le statut dans commandes, et rien ne permettait de les réunir. La jointure lève cet obstacle. Elle ne lève pas l'ambiguïté du mot « chiffre d'affaires », qui reste entière — et qui vaut ici près de 5 000 € d'écart selon la définition retenue.",
      points: [
        "Le chiffre d'affaires PRODUITS additionne quantite × prix_unitaire pour les commandes qui ne sont ni annulées ni retournées : 12 387,00 €.",
        "La jointure ne sert ici qu'à filtrer : aucune colonne de commandes n'est affichée, mais c'est elle qui porte le statut.",
        "Le SUM porte sur une colonne de lignes_commande, du côté « plusieurs » : rien n'est gonflé, le calcul est juste.",
        "Sans filtre sur le statut, le même calcul renvoie 16 233,50 € : les commandes annulées et retournées sont alors comptées comme les autres."
      ],
      exemple: {
        titre: "Quatre réponses pour une seule question",
        code: "SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut NOT IN ('annulee','retournee');",
        resultat: "12 387,00 € : le chiffre d'affaires produits de la boutique.",
        commentaire: "Livrées seules, le total tombe à 11 490,00 € ; hors annulées, il monte à 12 724,50 € ; tous statuts confondus, à 16 233,50 €. Aucune de ces réponses n'est fausse : elles répondent à des questions différentes, que le mot seul ne distingue pas."
      },
      astuce: "Avant de calculer un montant, écrivez noir sur blanc les statuts retenus et le sort des frais de port. Un chiffre d'affaires dont la définition n'est pas énoncée ne peut être vérifié par personne."
    },
    exercices: ["p3-36", "p3-37", "p3-38"]
  },
  {
    id: "ch-p3-13", niveau: "P3", titre: "Les frais de port, une seule fois par commande", duree: "6 min",
    resume: "Ajouter les frais de port dans un SUM calculé sur les lignes les compte une fois par produit : 12 911,50 € au lieu de 12 619,00 €.",
    lecon: {
      intro: "Le chiffre d'affaires TOTAL ajoute les frais de port au chiffre d'affaires produits. L'opération a l'air anodine, et c'est le dernier piège du palier : les frais appartiennent à la commande, pas à ses lignes, et toute addition faite après la jointure les compte une fois par produit.",
      points: [
        "frais_port vaut une seule fois par commande, quel que soit son nombre d'articles : c'est une colonne de commandes.",
        "Écrits à l'intérieur d'un SUM calculé sur les lignes, les frais sont recopiés sur chaque ligne et additionnés autant de fois : 12 911,50 € au lieu de 12 619,00 €.",
        "La bonne méthode, à ce stade, est de calculer les deux totaux séparément — 12 387,00 € de produits d'un côté, 232,00 € de frais de l'autre — puis de les additionner.",
        "Les obtenir en une seule requête demande d'agréger avant de joindre, ce qui suppose les sous-requêtes du palier 4. Ce n'est pas une limite de SQL, seulement du chemin parcouru."
      ],
      exemple: {
        titre: "232,00 €, sans aucune jointure",
        code: "SELECT SUM(frais_port) FROM commandes WHERE statut NOT IN ('annulee','retournee');",
        resultat: "232,00 € : les frais de port des commandes retenues, chacune comptée une fois.",
        commentaire: "Aucune jointure ici, et c'est précisément ce qui rend le calcul juste : frais_port et statut sont tous deux dans commandes. Ajouté aux 12 387,00 € de produits, ce total donne le chiffre d'affaires TOTAL, 12 619,00 €."
      },
      astuce: "Le réflexe à garder de tout ce palier tient en une question : cette colonne appartient-elle à la table que je suis en train de parcourir ? Si non, elle sera comptée plusieurs fois."
    },
    exercices: ["p3-39", "p3-40", "p3-41"]
  },
  {
    id: "ch-p3-14", niveau: "P3", titre: "Une table jointe à elle-même : le parrainage", duree: "6 min",
    resume: "clients.parrain_id pointe vers clients : deux alias suffisent à faire jouer à la même table deux rôles différents.",
    lecon: {
      intro: "Une clé étrangère ne désigne pas toujours une autre table. Dans clients, la colonne parrain_id contient l'identifiant d'un autre client : la table se pointe elle-même. Relier un filleul à son parrain demande alors de lire clients deux fois dans la même requête — une fois dans chaque rôle.",
      points: [
        "La syntaxe ne change pas : c'est un JOIN ordinaire, avec son ON. Seul le nom de la table de droite est identique à celui de gauche.",
        "Les deux alias deviennent obligatoires, et ils portent le sens : c pour le filleul, p pour le parrain. Sans eux, nom ne désignerait rien de précis.",
        "Neuf clients sur quarante ont un parrain. Une jointure ordinaire renvoie donc 9 lignes : les 31 dont parrain_id est vide n'ont aucune correspondance.",
        "Un parrain_id vide ne correspond à rien, pas même à un autre parrain_id vide : NULL n'est jamais égal à quoi que ce soit, y compris à lui-même."
      ],
      exemple: {
        titre: "Deux lectures de la même table",
        code: "SELECT c.nom AS filleul, p.nom AS parrain FROM clients c JOIN clients p ON p.id = c.parrain_id;",
        resultat: "9 lignes : chaque client parrainé, en face du nom de son parrain.",
        commentaire: "c et p désignent la même table, lue dans deux rôles distincts. Avec LEFT JOIN, le résultat compterait 40 lignes, les 31 clients sans parrain apparaissant avec un parrain vide."
      },
      astuce: "Devant une colonne qui pointe vers sa propre table — un parrain, un responsable, une catégorie parente —, nommez les deux rôles avant d'écrire la requête : la nommer correctement, c'est déjà l'avoir résolue."
    },
    exercices: ["p3-42", "p3-43", "p3-44", "p3-45"]
  },
  /* ── Palier 4 : raisonner (lot 9) ──────────────────────────────────────────────────────────────────────── */
  {
    id: "ch-p4-1", niveau: "P4", titre: "Le résultat d'une requête, dans une autre", duree: "6 min",
    resume: "Une sous-requête entre parenthèses s'exécute d'abord, à part ; sa valeur remplace ensuite la sous-requête dans la requête qui l'utilise.",
    lecon: {
      intro: "Jusqu'ici, un WHERE comparait toujours une colonne à une valeur écrite en dur : prix > 100, statut = 'livree'. Rien n'empêche d'écrire, à la place de cette valeur, une requête SQL complète entre parenthèses — une sous-requête. SQLite l'exécute d'abord, entièrement et séparément, puis se sert de ce qu'elle renvoie comme s'il s'agissait d'une valeur ordinaire.",
      points: [
        "Une sous-requête qui renvoie UNE seule valeur (une seule ligne, une seule colonne) peut remplacer un nombre ou un texte partout où un WHERE en attendrait un.",
        "L'exécution se fait en deux temps, toujours dans le même ordre : la sous-requête d'abord, entièrement ; la requête principale ensuite, qui se sert de ce résultat comme d'une constante.",
        "Une sous-requête qui renvoie PLUSIEURS valeurs ne peut pas servir avec = (qui n'accepte qu'une seule valeur) ; le chapitre suivant montre l'outil fait pour ce cas, IN.",
        "Écrire une sous-requête revient à nommer, provisoirement, un calcul qu'on aurait pu faire à part et noter avant de continuer : exactement l'esprit que la CTE, plus loin dans ce palier, rendra explicite."
      ],
      exemple: {
        titre: "Une valeur calculée, utilisée tout de suite",
        code: "SELECT COUNT(*) FROM produits WHERE prix > (SELECT AVG(prix) FROM produits);",
        resultat: "6 — le nombre de produits dont le prix dépasse la moyenne de tous les produits, 165,31 €.",
        commentaire: "(SELECT AVG(prix) FROM produits) s'exécute d'abord et renvoie un seul nombre : 165,31. La requête principale compare ensuite chaque prix à CE nombre, exactement comme si WHERE prix > 165.31 avait été écrit directement."
      },
      astuce: "Pour vérifier qu'une sous-requête est bien utilisable telle quelle dans un WHERE, exécutez-la SEULE d'abord : si elle renvoie une seule ligne et une seule colonne, elle peut remplacer une valeur simple. Si elle en renvoie plusieurs, il faudra IN, pas =."
    },
    exercices: ["p4-01", "p4-02", "p4-03"]
  },
  {
    id: "ch-p4-2", niveau: "P4", titre: "IN et NOT IN avec une sous-requête", duree: "6 min",
    resume: "IN accepte une sous-requête qui renvoie plusieurs valeurs ; NOT IN en est le contraire — tant qu'aucun NULL ne s'en mêle.",
    lecon: {
      intro: "Une sous-requête qui renvoie plusieurs lignes ne peut pas se comparer avec =, réservé à une valeur unique. IN, lui, est conçu pour une liste : écrite à la main entre parenthèses, ou renvoyée par une sous-requête qui produit plusieurs lignes d'une seule colonne. NOT IN en est le contraire logique — sauf dans un cas, que ce chapitre prépare sans encore le montrer.",
      points: [
        "colonne IN (SELECT ...) garde les lignes dont la colonne correspond à AU MOINS UNE des valeurs renvoyées par la sous-requête.",
        "colonne NOT IN (SELECT ...) garde, en apparence, les lignes dont la colonne ne correspond à AUCUNE de ces valeurs.",
        "La sous-requête d'un IN ou d'un NOT IN ne renvoie qu'UNE colonne, mais autant de lignes qu'elle veut : c'est elle qui fait toute la différence avec = ou <>, limités à une seule valeur.",
        "Tant que cette colonne ne contient aucun NULL, IN et NOT IN se comportent exactement comme on l'attend. Le chapitre suivant montre ce qui se passe dès qu'un NULL s'y glisse."
      ],
      exemple: {
        titre: "Une liste de produits, une liste de clients",
        code: "SELECT c.id, c.prenom, c.nom FROM clients c WHERE c.id IN (SELECT o.client_id FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE l.produit_id IN (SELECT id FROM produits WHERE categorie_id = 6));",
        resultat: "4 lignes : les seuls clients à avoir commandé un produit de la catégorie Jouets.",
        commentaire: "Trois sous-requêtes s'enchaînent, chacune donnant sa liste à la suivante : les produits Jouets, puis les commandes qui en contiennent un, puis les clients de ces commandes. Chaque IN accepte sans difficulté une liste de plusieurs valeurs."
      },
      astuce: "Avant d'utiliser NOT IN, demandez-vous toujours si la colonne renvoyée par la sous-requête peut contenir NULL (une colonne facultative, en particulier). Si oui, le chapitre suivant s'applique à vous."
    },
    exercices: ["p4-04", "p4-05", "p4-06"]
  },
  {
    id: "ch-p4-3", niveau: "P4", titre: "NOT IN face à NULL : le piège du parrainage", duree: "8 min",
    resume: "NOT IN (SELECT ...) renvoie 0 ligne dès qu'un seul NULL se trouve dans la sous-requête — sans la moindre erreur visible.",
    lecon: {
      intro: "parrain_id vaut NULL pour 31 des 40 clients de la boutique : ils sont venus sans être parrainés. Cette colonne, prise comme sous-requête d'un NOT IN, produit le piège le plus coûteux de ce palier — et l'un des plus fréquents en entreprise, précisément parce qu'il ne provoque jamais d'erreur.",
      points: [
        "1 NOT IN (2, NULL, 4) ne vaut ni vrai ni faux : SQL ne peut pas garantir que 1 soit absent d'une liste dont une valeur reste inconnue, et traite cette incertitude comme s'il n'était pas vrai.",
        "Dès qu'UNE SEULE valeur de la sous-requête d'un NOT IN est NULL, ce raisonnement s'applique à TOUTES les lignes testées : le résultat devient 0, pour tout le monde, sans message d'erreur.",
        "NOT EXISTS (SELECT 1 FROM ... WHERE condition_de_correspondance) pose une question différente — une ligne correspondante existe-t-elle ? — qui a toujours une réponse franche, même quand la table contient des NULL ailleurs.",
        "IN, lui, n'a besoin de trouver qu'UNE correspondance : un NULL dans sa liste ne l'empêche jamais de la trouver si elle existe. Seul NOT IN est vulnérable à ce piège."
      ],
      exemple: {
        titre: "0 ligne, et pourtant 31 clients concernés",
        code: "SELECT id FROM clients WHERE id NOT IN (SELECT parrain_id FROM clients);",
        resultat: "0 ligne — alors que 31 clients n'ont jamais parrainé personne.",
        commentaire: "La sous-requête renvoie 9 identifiants et 31 NULL. Ce seul fait suffit à rendre NOT IN incapable de répondre « vrai » pour qui que ce soit : le résultat tombe à 0, sans qu'aucun message ne le signale."
      },
      astuce: "Devant un NOT IN (SELECT ...) qui renvoie 0 ligne de façon suspecte, vérifiez en premier si la colonne de la sous-requête peut contenir NULL. Si oui, remplacez-le par NOT EXISTS plutôt que de chercher une erreur ailleurs."
    },
    exercices: ["p4-07", "p4-08", "p4-09", "p4-10"]
  },
  {
    id: "ch-p4-4", niveau: "P4", titre: "La sous-requête corrélée : se comparer à soi-même", duree: "8 min",
    resume: "Une sous-requête corrélée se réexécute pour chaque ligne de la requête extérieure, en fonction de cette ligne — jamais une seule fois pour toute la table.",
    lecon: {
      intro: "Toutes les sous-requêtes vues jusqu'ici s'exécutaient UNE SEULE FOIS, indépendamment du reste de la requête. Une sous-requête corrélée fait l'inverse : elle contient une référence à la ligne de la requête extérieure, et se réexécute donc pour CHAQUE ligne, avec un résultat potentiellement différent à chaque fois. C'est contre-intuitif — on a l'habitude qu'une requête s'exécute une fois — et c'est exactement là qu'on perd le fil la première fois qu'on la rencontre.",
      points: [
        "Une sous-requête corrélée contient, dans sa clause WHERE, une référence à une colonne de la requête extérieure (par exemple o.client_id) : c'est cette référence qui la rend corrélée.",
        "SQLite réexécute cette sous-requête pour chaque ligne de la requête extérieure, en substituant la valeur de cette ligne à chaque fois : la moyenne calculée pour le client 201 n'est pas celle calculée pour le client 202.",
        "Oublier cette référence ne provoque aucune erreur : la sous-requête devient alors ordinaire, calcule une seule valeur pour TOUTE la table, et répond silencieusement à une autre question que celle posée.",
        "C'est la façon la plus courante de répondre à « au-dessus de SA PROPRE moyenne », « le plus récent DE CHAQUE client » ou « plus que la moyenne DE SON GROUPE » — des questions qu'un agrégat ordinaire, calculé une seule fois, ne peut pas poser."
      ],
      exemple: {
        titre: "Une moyenne différente pour chaque client",
        code: "SELECT o.id FROM commandes o WHERE o.client_id = 201 AND (SELECT SUM(l.quantite*l.prix_unitaire) FROM lignes_commande l WHERE l.commande_id = o.id) > (SELECT AVG(m.total) FROM (SELECT SUM(l2.quantite*l2.prix_unitaire) AS total FROM commandes o2 JOIN lignes_commande l2 ON l2.commande_id = o2.id WHERE o2.client_id = o.client_id GROUP BY o2.id) AS m);",
        resultat: "2 lignes : les commandes 1001 et 1019, les deux seules du client 201 à dépasser SA moyenne de 781,50 €.",
        commentaire: "o2.client_id = o.client_id est la référence qui corrèle la sous-requête : retirée, elle calculerait la moyenne de TOUTES les commandes de la boutique, pas seulement celles de 201, et répondrait à une question différente."
      },
      astuce: "Pour repérer une sous-requête corrélée, cherchez si elle contient une colonne de la table extérieure (comme o.client_id). Si oui, elle se réexécute ligne par ligne ; si non, elle ne s'exécute qu'une seule fois, pour toute la requête."
    },
    exercices: ["p4-11", "p4-12", "p4-13", "p4-14"]
  },
  {
    id: "ch-p4-5", niveau: "P4", titre: "La CTE : nommer une étape", duree: "7 min",
    resume: "WITH nom AS (...) donne un nom au résultat d'une sous-requête, pour le réutiliser comme une table — d'abord pour la lisibilité, puis parce que cela évite un gonflement.",
    lecon: {
      intro: "Tout ce que fait une CTE, une sous-requête ordinaire pouvait déjà le faire : WITH n'ajoute aucune capacité de calcul nouvelle. Ce qu'elle ajoute, c'est un nom — la possibilité d'écrire une étape intermédiaire à part, de lui donner un nom clair, puis de continuer la requête comme si ce nom désignait une table ordinaire. Une requête longue devient une suite d'étapes qu'on peut lire une par une, au lieu d'une seule phrase emboîtée.",
      points: [
        "WITH nom AS (SELECT ...) SELECT ... FROM nom : la partie entre parenthèses s'exécute d'abord, son résultat porte le nom choisi, et le reste de la requête le lit comme une table.",
        "Une CTE peut porter une agrégation ENTIÈRE (un GROUP BY complet) avant qu'une jointure n'ait lieu : le reste de la requête ne voit alors qu'une ligne par groupe, jamais une par ligne détaillée.",
        "C'est exactement le moyen d'éviter le gonflement d'un SUM après une jointure, vu au palier précédent : agréger AVANT de joindre, plutôt qu'après, grâce à une étape nommée.",
        "Une fois nommée, une CTE se filtre avec un WHERE ordinaire sur ses propres colonnes, même si ces colonnes viennent d'un agrégat — plus besoin du HAVING réservé aux agrégats non nommés."
      ],
      exemple: {
        titre: "Une étape, puis la suite",
        code: "WITH par_commande AS (SELECT l.commande_id, SUM(l.quantite*l.prix_unitaire) AS montant FROM lignes_commande l GROUP BY l.commande_id) SELECT SUM(c.montant) FROM par_commande c JOIN commandes o ON o.id = c.commande_id WHERE o.statut NOT IN ('annulee', 'retournee');",
        resultat: "12 387,00 € — le chiffre d'affaires produits de toute la boutique.",
        commentaire: "par_commande calcule d'abord, une fois pour toutes, le montant de chaque commande. La jointure qui suit ne voit plus qu'UNE ligne par commande : aucun montant ne peut y être compté deux fois."
      },
      astuce: "Dès qu'une requête mêle un agrégat ET une jointure, demandez-vous si l'agrégat peut être calculé À L'INTÉRIEUR d'une CTE, avant la jointure, plutôt qu'après elle : c'est souvent la façon d'éviter un total gonflé."
    },
    exercices: ["p4-15", "p4-16", "p4-17", "p4-18"]
  },
  {
    id: "ch-p4-6", niveau: "P4", titre: "GROUP BY et fonction de fenêtre : deux manières de compter", duree: "7 min",
    resume: "GROUP BY réduit les lignes à une par groupe ; une fonction de fenêtre garde toutes les lignes et leur ajoute une colonne calculée sur leur groupe.",
    lecon: {
      intro: "Depuis le palier 2, GROUP BY répond à une question précise : une ligne par groupe, le détail disparaît. Les 70 commandes groupées par client ne laissent que les clients, et ce choix est voulu — on ne lit plus les commandes elles-mêmes, seulement ce qu'elles donnent une fois réunies. Une fonction de fenêtre part du même calcul (compter, sommer, classer) mais refuse ce choix : elle garde CHAQUE ligne de départ, et lui ajoute simplement une colonne qui regarde son groupe. Les 70 commandes restent 70, et portent en plus le nombre de commandes de leur client.",
      points: [
        "GROUP BY client_id réduit : une ligne par groupe, et le SELECT ne peut plus lire que les colonnes groupées ou des agrégats.",
        "nomFonction() OVER (PARTITION BY client_id) ne réduit rien : il calcule un agrégat « par groupe », mais l'écrit sur chaque ligne d'origine. Le nombre de lignes du résultat reste celui de la table de départ, jamais celui des groupes.",
        "PARTITION BY, dans OVER, joue le même rôle que GROUP BY : il délimite les groupes. Mais là où GROUP BY fusionne les lignes d'un groupe en une seule, PARTITION BY les laisse toutes à leur place.",
        "La différence se voit tout de suite au nombre de lignes du résultat : plus petit que la table de départ, c'est un GROUP BY ; égal, c'est une fonction de fenêtre. Les chapitres qui suivent (rang, LAG, cumul) utilisent tous OVER, et jamais pour réduire des lignes."
      ],
      exemple: {
        titre: "70 lignes, ou 34 ?",
        code: "SELECT client_id, COUNT(*) AS nb FROM commandes GROUP BY client_id;\nSELECT id, client_id, COUNT(*) OVER (PARTITION BY client_id) AS nb_commandes_du_client FROM commandes;",
        resultat: "Le premier renvoie 34 lignes (un par client qui a commandé). Le second en renvoie 70, chacune portant en plus le nombre total de commandes de son client.",
        commentaire: "Le second résultat ne cache rien : la commande 1001 du client 201 s'affiche avec sa propre ligne, ET avec le nombre de commandes de 201 recopié à côté. GROUP BY aurait perdu la commande elle-même pour ne garder que ce total ; OVER (PARTITION BY ...) garde les deux informations à la fois, prêtes à être comparées sur une même ligne — exactement ce qu'il faudra au chapitre suivant pour repérer un rang."
      },
      astuce: "Avant d'écrire OVER, demandez-vous : la question veut-elle UNE ligne par groupe (le détail disparaît) ou veut-elle garder le détail en le comparant à son groupe ? La première réponse est un GROUP BY, déjà connu depuis le palier 2. La seconde est une fonction de fenêtre, le sujet de ce chapitre et des quatre suivants."
    },
    exercices: ["p4-19", "p4-20", "p4-21"]
  },
  {
    id: "ch-p4-7", niveau: "P4", titre: "Le rang et les ex æquo : ROW_NUMBER, RANK, DENSE_RANK", duree: "9 min",
    resume: "Trois fonctions s'écrivent de la même façon, mais traitent différemment une égalité : c'est elle qui les distingue, jamais le reste.",
    lecon: {
      intro: "ROW_NUMBER, RANK et DENSE_RANK numérotent toutes les trois un classement, avec la même écriture : nomFonction() OVER (ORDER BY ...). Tant qu'aucune valeur n'est à égalité, les trois donnent exactement le même résultat, et rien ne les distingue. C'est devant une égalité — deux produits au même prix, deux clients au même total — que chacune révèle sa propre règle, et c'est là tout l'enjeu de ce chapitre, le cœur de ce palier.",
      points: [
        "ROW_NUMBER() numérote 1, 2, 3… sans jamais attribuer deux fois le même numéro : devant une égalité, il choisit arbitrairement qui reçoit le plus petit numéro, à moins qu'une clé secondaire ne le départage.",
        "RANK() donne le MÊME rang à des valeurs égales, puis SAUTE les rangs que cette égalité a consommés : après deux ex æquo au rang 2, la ligne suivante reçoit le rang 4, pas 3.",
        "DENSE_RANK() donne aussi le même rang à des valeurs égales, mais ne saute JAMAIS de rang : après deux ex æquo au rang 2, la ligne suivante reçoit le rang 3 — il compte les valeurs DISTINCTES déjà vues, pas les lignes.",
        "Un LIMIT fixe coupe un classement à un nombre de LIGNES précis, sans savoir si une égalité se trouve juste à cette frontière : RANK, filtré par WHERE rang <= n, respecte cette égalité, même si cela veut dire renvoyer plus de n lignes."
      ],
      exemple: {
        titre: "Une égalité à 1 299 €, deux façons différentes de la traiter",
        code: "SELECT id, prix, RANK() OVER (ORDER BY prix DESC) AS rang, DENSE_RANK() OVER (ORDER BY prix DESC) AS rang_dense FROM produits WHERE id IN (101, 109, 110) ORDER BY prix DESC;",
        resultat: "101 et 109, tous deux à 1 299,00 €, reçoivent le rang 1 ; 110, à 34,00 €, reçoit le rang 3 avec RANK, mais le rang 2 avec DENSE_RANK.",
        commentaire: "RANK compte les deux lignes déjà classées (101 et 109) avant d'attribuer le rang 3 à 110. DENSE_RANK, lui, ne compte qu'UNE valeur distincte déjà vue (1 299,00 €) et attribue le rang 2."
      },
      astuce: "Devant une égalité, posez-vous la question dans cet ordre : voulez-vous un numéro unique à tout prix (ROW_NUMBER) ? un rang qui reflète le nombre de lignes devant (RANK) ? ou un rang qui ne compte que les valeurs différentes (DENSE_RANK) ?"
    },
    exercices: ["p4-22", "p4-23", "p4-24", "p4-25", "p4-26"]
  },
  {
    id: "ch-p4-8", niveau: "P4", titre: "Le meilleur de chaque catégorie : le top-N par groupe", duree: "7 min",
    resume: "PARTITION BY ... ORDER BY ... suivi d'un filtre sur le rang donne le meilleur de chaque groupe — et peut légitimement renvoyer plus de lignes qu'attendu si un ex æquo touche la frontière.",
    lecon: {
      intro: "Trouver le produit le plus cher de CHAQUE catégorie, ou les deux plus vendus de chaque rayon, est une question de rang PAR GROUPE : PARTITION BY redémarre le classement à 1 pour chaque groupe, exactement comme GROUP BY délimiterait ces mêmes groupes pour un agrégat ordinaire — sans jamais en fusionner les lignes.",
      points: [
        "RANK() OVER (PARTITION BY categorie_id ORDER BY prix DESC) classe les produits par prix décroissant SÉPARÉMENT pour chaque catégorie : le classement d'Informatique ne mélange jamais ses rangs avec celui de Maison.",
        "Filtrer ensuite sur WHERE rang <= n garde le haut de CHAQUE groupe : n par catégorie, en temps normal.",
        "Si deux lignes d'un même groupe partagent exactement le rang n (une égalité à la frontière), RANK les garde toutes les deux : le résultat compte alors plus de n lignes pour ce groupe-là, et c'est la bonne réponse, pas une erreur.",
        "Une catégorie sans aucun produit ne peut fournir aucune ligne à ce classement : PARTITION BY ne peut pas former un groupe à partir de rien."
      ],
      exemple: {
        titre: "Deux par catégorie, sauf une qui en donne trois",
        code: "SELECT categorie_id, id, prix FROM (SELECT id, categorie_id, prix, RANK() OVER (PARTITION BY categorie_id ORDER BY prix DESC) AS rg FROM produits) WHERE rg <= 2;",
        resultat: "13 lignes, et non 12 : la catégorie Informatique en fournit 3 (101, 102, 103), les deux derniers à égalité au rang 2.",
        commentaire: "Cinq catégories fournissent exactement 2 lignes chacune. Informatique en fournit 3, parce que 102 et 103 (449,00 € chacun) se partagent vraiment le rang 2 : RANK <= 2 les garde l'un ET l'autre."
      },
      astuce: "Pour un « top N par groupe », ne filtrez jamais sur un simple LIMIT : filtrez sur WHERE rang <= n, écrit avec RANK ou DENSE_RANK selon que vous voulez compter les lignes ou les valeurs distinctes consommées par une éventuelle égalité."
    },
    exercices: ["p4-27", "p4-28", "p4-29"]
  },
  {
    id: "ch-p4-9", niveau: "P4", titre: "LAG : comparer à la ligne précédente", duree: "7 min",
    resume: "LAG ramène la valeur de la ligne précédente DU RÉSULTAT, pas de la période calendaire précédente — un mois absent du résultat ne compte jamais comme une ligne à comparer.",
    lecon: {
      intro: "LAG(colonne) OVER (ORDER BY ...) ramène, sur chaque ligne, la valeur de la colonne prise sur la ligne qui la précède dans ce même résultat trié. C'est utile pour comparer un mois au précédent, un jour au précédent, une commande à celle d'avant du même client. Mais LAG ne connaît que les lignes qu'on lui donne : s'il en manque une, il compare simplement à la DERNIÈRE qui existe, sans jamais signaler l'absence.",
      points: [
        "GROUP BY strftime('%Y-%m', date_commande) ne produit une ligne QUE pour les mois où au moins une commande existe : un mois sans aucune commande n'apparaît tout simplement pas, comme déjà vu au palier 2.",
        "LAG(nb) OVER (ORDER BY mois), sur ce résultat à 17 lignes (un mois, août 2025, en manque), compare chaque mois à la LIGNE précédente DE CE RÉSULTAT — qui peut être le mois d'avant, ou un mois plus ancien si une ligne manque entre les deux.",
        "Une variation de 0 calculée ainsi ne veut pas dire « rien n'a changé entre les deux mois civils » : elle peut cacher entièrement un mois sans aucune donnée.",
        "Vérifier qu'aucune ligne ne manque entre deux mois comparés est la seule façon de faire confiance à une variation calculée par LAG."
      ],
      exemple: {
        titre: "Juillet, puis directement septembre",
        code: "WITH m AS (SELECT strftime('%Y-%m', date_commande) AS mois, COUNT(*) AS nb FROM commandes GROUP BY mois) SELECT mois, nb, LAG(nb) OVER (ORDER BY mois) AS mois_precedent FROM m WHERE mois IN ('2025-07', '2025-09');",
        resultat: "Juillet affiche 4 commandes ; septembre, aussi 4, avec mois_precedent valant 4 — la valeur de juillet, pas celle d'un mois d'août qui n'existe pas dans ce résultat.",
        commentaire: "Aucune commande n'a été passée en août 2025 : GROUP BY ne produit donc aucune ligne pour ce mois. LAG, en septembre, se tourne vers la dernière ligne qui existe réellement avant elle : juillet."
      },
      astuce: "Avant de faire confiance à une variation calculée par LAG sur des données groupées par mois, vérifiez d'abord si CHAQUE mois de la période a bien produit une ligne — sinon, une absence totale peut se cacher derrière une variation de 0."
    },
    exercices: ["p4-30", "p4-31", "p4-32"]
  },
  {
    id: "ch-p4-10", niveau: "P4", titre: "Cumuler : SUM() OVER", duree: "6 min",
    resume: "SUM(colonne) OVER (ORDER BY ...), sans PARTITION BY, additionne chaque ligne à toutes celles qui la précèdent dans l'ordre choisi — un cumul qui grandit ligne après ligne.",
    lecon: {
      intro: "Une fonction de fenêtre ne sert pas qu'à classer : SUM() OVER (ORDER BY ...) calcule, sur chaque ligne, la somme de cette ligne et de TOUTES CELLES QUI LA PRÉCÈDENT dans l'ordre choisi — un cumul, comme un solde de compte qui grandit opération après opération.",
      points: [
        "SUM(colonne) OVER (ORDER BY cle) additionne la ligne courante à toutes celles dont la clé de tri est plus petite (ou égale, selon les égalités) : c'est l'ORDER BY À L'INTÉRIEUR de OVER qui décide de ce qui est « déjà cumulé ».",
        "Le dernier cumul d'une liste complète est toujours égal à la somme totale de la colonne, calculée sans aucun OVER : une bonne façon de vérifier qu'un cumul est juste.",
        "L'ORDER BY d'un cumul doit toujours porter sur la DIMENSION qu'on parcourt (le temps, le plus souvent), jamais sur la valeur qu'on additionne : trier par la valeur elle-même donnerait un nombre qui augmente, mais qui ne représenterait plus rien de réel.",
        "PARTITION BY peut s'ajouter pour cumuler séparément par groupe (un cumul par client, par exemple) : le cumul repart alors de zéro à chaque nouveau groupe, exactement comme LAG le ferait."
      ],
      exemple: {
        titre: "Un total qui grandit mois après mois",
        code: "WITH m AS (SELECT strftime('%Y-%m', o.date_commande) AS mois, SUM(l.quantite*l.prix_unitaire) AS ca FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY mois) SELECT mois, ca, SUM(ca) OVER (ORDER BY mois) AS cumul FROM m WHERE mois IN ('2025-01', '2025-02', '2025-03');",
        resultat: "1 377,75 € en janvier (cumul : 1 377,75 €), 553,50 € en février (cumul : 1 931,25 €), 626,50 € en mars (cumul : 2 557,75 €).",
        commentaire: "Chaque cumul additionne le chiffre d'affaires du mois à celui de TOUS les mois précédents. Le dernier mois de la boutique, juin 2026, afficherait un cumul de 12 387,00 € — le chiffre d'affaires produits de toute la période."
      },
      astuce: "Pour vérifier un cumul, comparez toujours sa DERNIÈRE ligne à une somme ordinaire, sans aucun OVER, sur la même colonne : les deux doivent être strictement égales."
    },
    exercices: ["p4-33", "p4-34", "p4-35"]
  },
  {
    id: "ch-p4-11", niveau: "P4", titre: "Les retards : julianday face à la date de référence", duree: "6 min",
    resume: "julianday(date) convertit une date en nombre de jours : soustraire deux julianday donne directement une durée, sans passer par strftime.",
    lecon: {
      intro: "strftime extrait une PARTIE d'une date (l'année, le mois) : il ne mesure jamais une DURÉE entre deux dates. julianday fait l'inverse : il convertit une date entière en un nombre (le compte de jours depuis une origine fixe), et la différence de deux julianday donne directement un nombre de jours — exactement ce qu'il faut pour mesurer un retard par rapport au 30 juin 2026, la date de référence de toute la boutique.",
      points: [
        "julianday('2026-06-30') - julianday(date_commande) donne un nombre de jours, directement comparable à un seuil (> 10, par exemple) comme n'importe quel nombre.",
        "La date de référence, '2026-06-30', est TOUJOURS écrite en littéral dans la requête, jamais lue dans la base ni remplacée par date('now') : la boutique n'a aucune notion d'« aujourd'hui » qui lui soit propre.",
        "Le même calcul, appliqué à des commandes de statuts différents, ne mesure pas la même chose : un délai depuis la commande n'est un « retard de livraison » que si la commande a effectivement été expédiée sans encore être arrivée.",
        "Pour un délai entre deux dates DE LA BASE (commande et livraison, par exemple), la même soustraction s'applique : julianday(date_livraison) - julianday(date_commande)."
      ],
      exemple: {
        titre: "34 jours d'attente, au 30 juin 2026",
        code: "SELECT id, date_commande, julianday('2026-06-30') - julianday(date_commande) AS jours FROM commandes WHERE statut = 'expediee' ORDER BY jours DESC;",
        resultat: "5 lignes, de 34 jours (commande 1062, du 27 mai 2026) à 3 jours (commande 1067, du 27 juin 2026).",
        commentaire: "Chaque ligne obtient un nombre de jours directement comparable : pas besoin d'extraire l'année ou le mois, julianday mesure une durée complète, jours compris."
      },
      astuce: "Dès qu'une question porte sur une DURÉE entre deux dates (un délai, un retard, une ancienneté), pensez julianday. Dès qu'elle porte sur une PARTIE d'une date (l'année, le mois, pour regrouper ou filtrer), pensez strftime — les deux ne se remplacent jamais l'un l'autre."
    },
    exercices: ["p4-36", "p4-37", "p4-38"]
  }
];

/* Paliers du programme (D021) : la liste et l'ordre ne bougent pas, elle sert à grouper et filtrer l'écran « Exercices »
   et à rattacher chaque compétence de CONTENU.competences (D043) à un seul palier.
   `termine` (D051) : posé à la main par l'auteur quand le palier est déclaré fini — l'Autotest (lot 5) fait alors passer
   ses deux contrôles de couverture d'un avertissement à un échec bloquant pour ce palier. */
const PALIERS = [
  { id: "P1", titre: "Lire", termine: true },
  { id: "P2", titre: "Agréger", termine: true },
  { id: "P3", titre: "Croiser", termine: true },
  { id: "P4", titre: "Raisonner", termine: true },
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
  "JOIN": { syntaxe: "… FROM a JOIN b ON b.cle = a.id", aide: "relie deux tables et ne garde que les lignes qui ont une correspondance des deux côtés" },
  "ON": { syntaxe: "… FROM a JOIN b ON b.cle = a.id", aide: "dit comment les deux tables se correspondent ; sans lui, chaque ligne de a est associée à chacune de b" },
  "LEFT JOIN": { syntaxe: "… FROM a LEFT JOIN b ON b.cle = a.id", aide: "garde toutes les lignes de a, même sans correspondance dans b (les colonnes de b valent alors NULL)" },
  "COUNT": { syntaxe: "COUNT(*) ou COUNT(colonne)", aide: "COUNT(*) compte les lignes ; COUNT(colonne) ne compte que les valeurs renseignées (non NULL)" },
  "SUM": { syntaxe: "SUM(colonne)", aide: "additionne les valeurs non NULL d'une colonne numérique, sur les lignes concernées" },
  "AVG": { syntaxe: "AVG(colonne)", aide: "fait la moyenne des valeurs non NULL d'une colonne ; divise par le nombre de valeurs présentes, pas par le nombre total de lignes" },
  "MIN": { syntaxe: "MIN(colonne)", aide: "renvoie la plus petite valeur non NULL d'une colonne" },
  "MAX": { syntaxe: "MAX(colonne)", aide: "renvoie la plus grande valeur non NULL d'une colonne" },
  "HAVING": { syntaxe: "SELECT colonne, agrégat FROM table GROUP BY colonne HAVING condition", aide: "filtre les groupes déjà formés par GROUP BY, selon le résultat d'une fonction d'agrégat — jamais avant le regroupement" },
  "CASE WHEN": { syntaxe: "CASE WHEN condition1 THEN valeur1 WHEN condition2 THEN valeur2 ELSE valeur3 END", aide: "construit une valeur selon des conditions testées dans l'ordre ; sans ELSE, une ligne qui ne vérifie rien reçoit NULL" },
  "strftime": { syntaxe: "strftime('%Y', colonne) ou strftime('%Y-%m', colonne)", aide: "extrait une partie d'une date (année, mois…), toujours sous forme de texte — jamais un nombre" },
  "NOT IN": { syntaxe: "… WHERE colonne NOT IN (SELECT …)", aide: "garde les lignes dont la colonne n'apparaît dans aucune valeur renvoyée par la sous-requête ; si cette sous-requête renvoie un seul NULL, NOT IN ne renvoie plus aucune ligne, quelles que soient les autres valeurs" },
  "EXISTS": { syntaxe: "… WHERE EXISTS (SELECT 1 FROM … WHERE …) ou NOT EXISTS (…)", aide: "teste seulement si la sous-requête renvoie au moins une ligne, sans regarder sa valeur ; contrairement à NOT IN, un NULL dans la sous-requête ne le perturbe jamais" },
  "WITH": { syntaxe: "WITH nom AS (SELECT …) SELECT … FROM nom", aide: "nomme le résultat d'une sous-requête pour le réutiliser comme une table, le temps d'une seule requête (CTE, « common table expression »)" },
  "OVER": { syntaxe: "fonction() OVER (PARTITION BY … ORDER BY …)", aide: "calcule une fonction sur un groupe de lignes sans les réduire à une seule : chaque ligne de départ garde sa place et reçoit le résultat" },
  "PARTITION BY": { syntaxe: "… OVER (PARTITION BY colonne ORDER BY …)", aide: "délimite les groupes à l'intérieur d'un OVER, comme GROUP BY le fait pour un agrégat ordinaire — mais sans jamais fusionner les lignes du groupe" },
  "ROW_NUMBER": { syntaxe: "ROW_NUMBER() OVER (ORDER BY …)", aide: "numérote les lignes 1, 2, 3… sans jamais d'égalité ; sur des valeurs à égalité, le départage est arbitraire sauf si l'ORDER BY contient une clé qui le rend unique" },
  "RANK": { syntaxe: "RANK() OVER (ORDER BY …)", aide: "donne le même rang à des valeurs égales, puis saute les rangs consommés par cette égalité (1, 2, 2, 4…)" },
  "DENSE_RANK": { syntaxe: "DENSE_RANK() OVER (ORDER BY …)", aide: "donne le même rang à des valeurs égales, mais ne saute jamais de rang (1, 2, 2, 3…) : le rang suivant compte les valeurs distinctes déjà vues, pas les lignes" },
  "LAG": { syntaxe: "LAG(colonne) OVER (ORDER BY …)", aide: "ramène la valeur de la ligne précédente DU RÉSULTAT, pas de la période précédente du calendrier : une période absente du résultat ne compte pas comme une ligne à comparer" },
  "julianday": { syntaxe: "julianday(date1) - julianday(date2)", aide: "convertit une date en nombre de jours depuis une origine fixe ; la différence de deux julianday donne directement un nombre de jours entre deux dates" }
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
   clauses liées. Un palier à la fois (D002) : les 11 clauses du palier 1 et les 9 du palier 2 ont leur fiche ;
   `voirAussi` ne cite donc jamais une clause qui n'en a pas encore (LEFT JOIN, palier 3, n'en a toujours pas).
   `entrainements` est posé vide : la structure existe (reprise de Classe'R, Reference/classer-v2.html:4427),
   son contenu reste délibérément différé (DECISIONS.md D055) pour juger s'il apporte quelque chose que les
   exercices n'apportent pas déjà — décision à reprendre une fois le palier 2 terminé. */
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
  },
  "COUNT": {
    but: "Compter des lignes (COUNT(*)) ou des valeurs non NULL d'une colonne (COUNT(colonne)).",
    contexte: "La première fonction d'agrégat à utiliser dès qu'une question commence par « combien » : combien de commandes, combien de clients ont renseigné telle information…",
    erreur: "Confondre COUNT(*) et COUNT(colonne) : le premier compte toutes les lignes, le second ignore les lignes où cette colonne précise est NULL. Les deux peuvent donner des résultats très différents sur la même table.",
    voirAussi: ["GROUP BY", "IS NULL", "SUM"],
    entrainements: []
  },
  "GROUP BY": {
    but: "Séparer les lignes en groupes selon une colonne, pour calculer une valeur par groupe plutôt que pour toute la table.",
    contexte: "Dès qu'une fonction d'agrégat (COUNT, SUM, AVG, MIN, MAX) doit être calculée séparément pour chaque ville, chaque statut, chaque mois… GROUP BY sépare d'abord les lignes, avant que l'agrégat ne les résume.",
    erreur: "Mélanger une colonne ordinaire et une fonction d'agrégat sans GROUP BY : SQLite l'accepte sans erreur, et renvoie une seule ligne trompeuse, avec une valeur arbitraire pour la colonne ordinaire.",
    voirAussi: ["COUNT", "HAVING", "CASE WHEN"],
    entrainements: []
  },
  "SUM": {
    but: "Additionner les valeurs non NULL d'une colonne numérique.",
    contexte: "Utile pour un total : la quantité vendue, le montant d'une commande, les frais de port perçus sur une période.",
    erreur: "Oublier le WHERE qui restreint la somme au bon ensemble de lignes : SUM additionne alors davantage de lignes que prévu, sans qu'aucune erreur ne le signale.",
    voirAussi: ["AVG", "GROUP BY", "HAVING"],
    entrainements: []
  },
  "AVG": {
    but: "Calculer la moyenne des valeurs non NULL d'une colonne.",
    contexte: "Dès qu'une colonne peut être vide pour certaines lignes (une note, un délai…), AVG est le bon outil : elle ne divise que par le nombre de valeurs réellement présentes.",
    erreur: "Remplacer AVG par SUM(colonne) / COUNT(*) : cette division utilise le nombre TOTAL de lignes au dénominateur, pas le nombre de valeurs présentes, ce qui écrase le résultat dès qu'il y a des NULL.",
    voirAussi: ["SUM", "COUNT", "IS NULL"],
    entrainements: []
  },
  "MIN": {
    but: "Trouver la plus petite valeur non NULL d'une colonne.",
    contexte: "Utile pour une borne basse : le prix le plus bas, la date la plus ancienne, le stock le plus faible.",
    erreur: "Oublier que MIN ne renvoie que la VALEUR trouvée, pas la ligne entière qui la porte : pour connaître aussi, par exemple, le nom du produit le moins cher, MIN seul ne suffit pas.",
    voirAussi: ["MAX", "GROUP BY"],
    entrainements: []
  },
  "MAX": {
    but: "Trouver la plus grande valeur non NULL d'une colonne.",
    contexte: "Utile pour une borne haute : le prix le plus élevé, la date la plus récente, le plus gros total.",
    erreur: "Oublier que MAX ne renvoie que la VALEUR trouvée, pas la ligne entière qui la porte.",
    voirAussi: ["MIN", "GROUP BY"],
    entrainements: []
  },
  "HAVING": {
    but: "Filtrer des groupes déjà formés par GROUP BY, selon le résultat d'une fonction d'agrégat.",
    contexte: "Dès qu'une condition porte sur un TOTAL, une MOYENNE ou un COMPTE par groupe — « les clients qui ont commandé pour plus de 500 € », « les statuts avec au moins 10 commandes » — c'est HAVING qu'il faut, pas WHERE.",
    erreur: "Écrire cette condition dans un WHERE : WHERE filtre des lignes AVANT le regroupement, et tronque silencieusement le total au lieu de le comparer une fois complet.",
    voirAussi: ["GROUP BY", "SUM", "COUNT"],
    entrainements: []
  },
  "CASE WHEN": {
    but: "Construire une valeur différente selon une ou plusieurs conditions, testées dans l'ordre, ligne par ligne.",
    contexte: "Utile pour regrouper des catégories qu'on choisit soi-même (par exemple, des statuts en « aboutie »/« perdue ») plutôt que celles déjà présentes dans une colonne.",
    erreur: "Oublier le ELSE final : une ligne qui ne vérifie aucune condition reçoit alors NULL, sans erreur visible — un groupe NULL inattendu dans un GROUP BY qui suit.",
    voirAussi: ["GROUP BY", "WHERE"],
    entrainements: []
  },
  "strftime": {
    but: "Extraire une partie d'une date écrite en AAAA-MM-JJ (l'année, le mois, ou les deux), sous forme de texte.",
    contexte: "Indispensable pour regrouper ou filtrer par année ou par mois : strftime('%Y', colonne), strftime('%Y-%m', colonne).",
    erreur: "Comparer son résultat à un nombre sans apostrophes (= 2025 au lieu de = '2025') : strftime renvoie toujours du texte, la comparaison à un nombre ne trouve silencieusement rien.",
    voirAussi: ["GROUP BY", "WHERE"],
    entrainements: []
  },
  "JOIN": {
    but: "Lire deux tables à la fois en les reliant par la colonne qui les met en correspondance, pour afficher ensemble des informations qui vivent dans des tables différentes.",
    contexte: "Dès qu'une question mêle deux sujets — le NOM du client (table clients) et la DATE de sa commande (table commandes) —, aucune table ne suffit seule : c'est le moment de joindre.",
    erreur: "Oublier le ON : les deux tables sont alors associées ligne à ligne dans toutes les combinaisons possibles, ce qui produit un résultat énorme et faux, sans aucun message d'erreur.",
    voirAussi: ["ON", "LEFT JOIN", "COUNT"],
    entrainements: []
  },
  "ON": {
    but: "Déclarer la condition qui met en correspondance les lignes de deux tables jointes : presque toujours la clé étrangère de l'une contre la clé primaire de l'autre.",
    contexte: "S'écrit juste après JOIN. La carte des relations de l'explorateur donne le ON à écrire : elle montre quelle colonne pointe vers quelle autre.",
    erreur: "Déplacer dans le WHERE une condition qui limite la table de droite d'un LEFT JOIN : le filtre s'applique alors APRÈS la jointure et élimine les lignes sans correspondance, ce qui transforme silencieusement le LEFT JOIN en jointure ordinaire.",
    voirAussi: ["JOIN", "LEFT JOIN", "WHERE"],
    entrainements: []
  },
  "LEFT JOIN": {
    but: "Relier deux tables en gardant TOUTES les lignes de la table de gauche, y compris celles qui n'ont aucune correspondance à droite.",
    contexte: "La bonne clause dès que la question inclut les cas vides : « tous les clients, même ceux qui n'ont jamais commandé », « chaque produit, avec ses ventes s'il en a ». C'est aussi la façon d'aller chercher ce qui n'existe pas, en gardant ensuite les lignes où la table de droite est restée NULL.",
    erreur: "Compter avec COUNT(*) après un LEFT JOIN : une ligne sans correspondance existe quand même dans le résultat, et compte donc pour une. COUNT(colonne de la table de droite) renvoie bien 0 pour ces lignes-là.",
    voirAussi: ["JOIN", "ON", "IS NULL", "COUNT"],
    entrainements: []
  },
  "NOT IN": {
    but: "Garder les lignes dont une colonne n'apparaît dans aucune des valeurs renvoyées par une sous-requête.",
    contexte: "S'écrit comme son contraire, IN, mais ne s'y comporte pas de la même façon dès qu'un NULL se glisse dans la sous-requête — c'est tout l'objet de ce chapitre.",
    erreur: "Utiliser NOT IN avec une sous-requête dont la colonne peut contenir NULL (une auto-référence facultative, par exemple) : le résultat devient 0 ligne, sans aucune erreur, quelles que soient les autres valeurs. EXISTS/NOT EXISTS ne connaissent pas ce piège.",
    voirAussi: ["EXISTS", "IN", "IS NULL"],
    entrainements: []
  },
  "EXISTS": {
    but: "Tester si une sous-requête renvoie au moins une ligne, sans jamais regarder la valeur de cette ligne.",
    contexte: "Le correctif de NOT IN face à un NULL : NOT EXISTS (SELECT 1 FROM … WHERE condition_de_correspondance) répond à la même question que NOT IN, sans jamais se laisser piéger par une valeur absente.",
    erreur: "Oublier la condition de correspondance à l'intérieur du EXISTS : sans elle, la sous-requête ne teste plus rien de spécifique à la ligne extérieure, et répond la même chose pour toutes les lignes.",
    voirAussi: ["NOT IN", "JOIN"],
    entrainements: []
  },
  "WITH": {
    but: "Donner un nom au résultat d'une sous-requête, pour le réutiliser comme une table ordinaire dans le reste de la requête.",
    contexte: "Utile dès qu'une sous-requête devient longue, ou qu'on en a besoin à plusieurs endroits : la nommer une fois avec WITH évite de la répéter, et rend la requête lisible étape par étape.",
    erreur: "Croire qu'une CTE introduit une nouvelle capacité de calcul : elle ne fait que nommer une sous-requête déjà possible sans elle. Le gain est la lisibilité, pas la puissance.",
    voirAussi: ["GROUP BY", "JOIN"],
    entrainements: []
  },
  "OVER": {
    but: "Calculer une fonction (compter, sommer, classer, comparer à la ligne précédente…) sur un groupe de lignes, sans réduire ces lignes à une seule.",
    contexte: "Dès que la question demande de GARDER chaque ligne de départ tout en la comparant à son groupe — son rang, le total de son client, la ligne précédente — c'est OVER qu'il faut, et jamais GROUP BY, qui fusionnerait les lignes.",
    erreur: "Confondre OVER avec GROUP BY parce que les deux parlent de « groupes » : GROUP BY réduit le nombre de lignes du résultat, OVER ne le change jamais.",
    voirAussi: ["PARTITION BY", "GROUP BY", "ROW_NUMBER"],
    entrainements: []
  },
  "PARTITION BY": {
    but: "Délimiter les groupes à l'intérieur d'un OVER, comme GROUP BY le fait pour un agrégat ordinaire.",
    contexte: "S'écrit à l'intérieur des parenthèses d'un OVER : fonction() OVER (PARTITION BY client_id …) calcule une valeur séparée pour chaque client, mais garde toutes les lignes de commandes.",
    erreur: "Oublier le PARTITION BY quand il en faudrait un : la fonction de fenêtre considère alors TOUTES les lignes comme un seul et même groupe.",
    voirAussi: ["OVER", "GROUP BY"],
    entrainements: []
  },
  "ROW_NUMBER": {
    but: "Numéroter les lignes d'un classement 1, 2, 3… sans jamais attribuer deux fois le même numéro.",
    contexte: "Utile pour garantir un numéro unique par ligne, par exemple pour n'en garder qu'une par groupe. Dès que deux lignes peuvent être à égalité sur le critère de tri, ROW_NUMBER masque cette égalité.",
    erreur: "Utiliser ROW_NUMBER pour montrer un classement à l'apprenant quand des valeurs sont à égalité : il numérotera 2 et 3 deux produits au même prix, suggérant à tort qu'un est « meilleur » que l'autre. RANK ou DENSE_RANK respectent l'égalité, ROW_NUMBER ne le peut pas.",
    voirAussi: ["RANK", "DENSE_RANK", "OVER"],
    entrainements: []
  },
  "RANK": {
    but: "Classer des lignes en donnant le même rang à des valeurs égales, puis en sautant les rangs que cette égalité a consommés.",
    contexte: "La bonne fonction dès qu'une égalité doit rester visible dans le classement : deux produits au même prix reçoivent le même rang, et le produit suivant reçoit un rang qui tient compte des deux ex æquo (1, 2, 2, 4).",
    erreur: "Couper un classement RANK avec un LIMIT fixe : un LIMIT 3 sur un classement 1, 2, 2, 4 ne garantit pas de s'arrêter à une frontière nette — mieux vaut filtrer sur le rang lui-même (WHERE rang <= 3), qui peut légitimement renvoyer plus de 3 lignes.",
    voirAussi: ["DENSE_RANK", "ROW_NUMBER", "PARTITION BY"],
    entrainements: []
  },
  "DENSE_RANK": {
    but: "Classer des lignes en donnant le même rang à des valeurs égales, sans jamais sauter de rang ensuite.",
    contexte: "À choisir plutôt que RANK quand la question porte sur le nombre de valeurs DISTINCTES plutôt que sur le nombre de lignes : « en combientième position de prix, tous les produits confondus ? »",
    erreur: "Confondre DENSE_RANK et RANK sur un classement sans aucune égalité : les deux donnent alors exactement le même résultat, et la différence ne se voit que le jour où une égalité apparaît.",
    voirAussi: ["RANK", "ROW_NUMBER"],
    entrainements: []
  },
  "LAG": {
    but: "Ramener, sur la ligne courante, la valeur d'une colonne prise sur la ligne précédente DU RÉSULTAT.",
    contexte: "Utile pour comparer un mois à celui qui le précède dans un tableau de bord, ou une commande à la précédente du même client (avec PARTITION BY).",
    erreur: "Croire que LAG compare à la période précédente du calendrier : s'il manque une ligne (un mois sans aucune commande, par exemple), LAG saute directement à la ligne d'avant celle-là, sans jamais signaler l'absence.",
    voirAussi: ["OVER", "PARTITION BY", "strftime"],
    entrainements: []
  },
  "julianday": {
    but: "Convertir une date en un nombre (le nombre de jours écoulés depuis une origine fixe), pour pouvoir soustraire deux dates et obtenir une durée en jours.",
    contexte: "Indispensable pour tout calcul de délai : julianday(date_livraison) - julianday(date_commande) donne directement le nombre de jours entre les deux.",
    erreur: "Soustraire deux dates écrites en texte sans passer par julianday : SQLite compare alors du texte sans en faire une opération numérique correcte, ou renvoie une erreur selon l'opération tentée.",
    voirAussi: ["strftime"],
    entrainements: []
  }
};
