/* Requêt'R — scénario navigateur, exécuté DANS la page par outils/cdp.cjs (hors livrable). Lot 4 : reprend
   les vérifications du lot 3 (formulations acceptées C1, refus différenciés, non évalué, date du jour D033,
   C7, C8, C14, corriger, predire, qcm, masquage 1×1 D034, bac à sable, hors ligne) et ajoute l'onboarding,
   la navigation sur toutes les routes, la Série recommandée (Session), le thème persisté et une certification.
   Lot 6 : les 4 exercices de démonstration (demo-*) ont disparu avec le contenu réel du chapitre 0 et du
   palier 1 ; les scènes ci-dessous s'appuient maintenant sur p1-01 (requete), p1-17 (corriger, même forme que
   l'ancien demo-corriger : « … ORDER BY prix », réparé en ajoutant DESC), p1-15 (predire, nbLignes) et p1-02
   (qcm). Un nouveau bloc (« Parcours guidé ») parcourt pour de vrai le chapitre 0 puis le début du palier 1
   via l'écran Leçons câblé au lot 6 (D047/D050). */
(async () => {
  const attendre = ms => new Promise(r => setTimeout(r, ms));
  const R = [];
  const ok = (libelle, condition, detail) => R.push([libelle, !!condition, condition ? "" : detail === undefined ? "" : JSON.stringify(detail)]);
  const zone = () => document.querySelector("textarea.editeur-sql");
  const saisir = v => { const z = zone(); z.value = v; z.dispatchEvent(new Event("input", { bubbles: true })); };
  const bouton = t => [...document.querySelectorAll("button, a.btn")].find(b => b.textContent.trim() === t);
  const retour = () => document.querySelector("#zone-retour .retour");
  const aller = async h => { location.hash = h; await attendre(350); };
  const verifier = async sql => { saisir(sql); bouton("Vérifier").click(); await attendre(250); return retour(); };
  await attendre(500);

  // ── Onboarding : modale non-fermable au premier démarrage (D049) ──
  ok("onboarding : modale affichée au premier démarrage", !!document.querySelector(".modale"), document.body.innerText.slice(0, 120));
  document.querySelector('input[name="experience-sql"][value="jamais"]').click();
  // Scopé à la modale : depuis D057, l'accueil affiche aussi des boutons « Commencer » (ligneCompetence, compétences
  // jamais travaillées), qui apparaissent avant la modale dans le DOM — bouton("Commencer") générique cliquerait le mauvais.
  document.querySelector(".modale button.btn--fort").click();
  await attendre(250);
  ok("onboarding : fermée, profil marqué onboardingFait", !document.querySelector(".modale") && Store.etat.profil.onboardingFait === true);

  // ── Route par défaut : #/accueil (D047) ──
  ok("démarrage : écran d'accueil par défaut", location.hash === "" || location.hash === "#/accueil", location.hash);
  ok("accueil : bannière et niveau affichés", !!document.querySelector(".accueil__banniere") && /Niveau 1/.test(document.body.innerText));

  // ── Navigation sur toutes les routes du rail (D047) ──
  for (const [chemin, attendu] of [
    ["#/exercices", "Exercices"], ["#/lecons", "Parcours guidé"], ["#/missions", "Aucune mission pour l'instant"],
    ["#/bac-a-sable", "Bac à sable SQL"], ["#/progression", "Compétences"], ["#/reglages", "Réglages"]
  ]) {
    await aller(chemin);
    ok(`navigation ${chemin} : rendu sans erreur`, document.body.innerText.toLowerCase().includes(attendu.toLowerCase()) && !document.querySelector(".erreur-sql"), document.body.innerText.slice(0, 150));
  }
  await aller("#/fiche");
  ok("navigation #/fiche (hors rail) : coquille vide, accessible", /Aucune fiche pour l'instant/.test(document.body.innerText));

  // ── Progression : 9 compétences et 20 certifications affichées ──
  await aller("#/progression");
  ok("progression : 9 compétences listées", document.querySelectorAll(".competence").length === 9, document.querySelectorAll(".competence").length);
  ok("progression : 20 certifications listées", document.querySelectorAll(".certif").length === 20, document.querySelectorAll(".certif").length);

  // ── Session : « Série recommandée » (branche l'emplacement inerte de D042) ──
  await aller("#/exercices");
  ok("exercices : sélecteur de palier actif (D047, remplace le sélecteur inerte de D042)", !document.querySelector(".segment button[disabled]"));
  [...document.querySelectorAll(".carte--action")].find(b => /Série recommandée/.test(b.textContent)).click();
  await attendre(250);
  ok("Session démarrée : une question s'affiche, compteur de série visible", !!document.querySelector(".serie__compte"), document.body.innerText.slice(0, 150));
  // Répond correctement à chaque question de la série, quel que soit son type, pour atteindre le bilan.
  for (let i = 0; i < 10 && document.querySelector(".serie__compte"); i++) {
    const t = document.querySelector("h1").textContent;
    if (zone()) {
      const ex = CONTENU.exercices.find(x => x.titre === t);
      saisir(ex.solution); bouton("Vérifier").click(); await attendre(250);
    } else if (document.querySelector("input.saisie-reponse")) {
      const champ = document.querySelector("input.saisie-reponse");
      const ex = CONTENU.exercices.find(x => x.titre === t);
      champ.value = String(Attendus.predire(ex).nbLignes); bouton("Répondre").click(); await attendre(250);
    } else if (document.querySelector(".choix")) {
      const t2 = document.querySelector("h1").textContent;
      const ex = CONTENU.exercices.find(x => x.titre === t2);
      const texteBon = ex.options[ex.reponse];
      [...document.querySelectorAll(".choix button")].find(b => b.textContent.includes(texteBon)).click(); await attendre(250);
    }
    const suite = bouton("Question suivante →") || bouton("Voir le bilan →");
    if (suite) { suite.click(); await attendre(250); }
  }
  ok("Session : bilan de fin de série affiché", /bonne\(s\) réponse\(s\)|Sans faute/.test(document.body.innerText), document.body.innerText.slice(0, 200));
  bouton("Retour à l'accueil").click();
  await attendre(250);

  // ── Certification : « Premier pas » obtenue après une première réussite ──
  ok("certification : « Premier pas » obtenue pendant la série", !!Store.etat.certifications["premier-pas"], Store.etat.certifications);

  // ── Thème : bascule et persiste dans Store (localStorage) ──
  await aller("#/reglages");
  bouton("Nuit").click();
  await attendre(250);
  ok("thème : data-theme sombre appliqué", document.documentElement.dataset.theme === "sombre");
  await attendre(250);
  ok("thème : persisté dans localStorage (requeter.etat)", JSON.parse(localStorage.getItem(CONFIG.cle)).reglages.theme === "sombre");
  bouton("Jour").click();
  await attendre(250);

  // ── Export puis import : restaure un état identique (D047, critère d'acceptation) ──
  const texteExport = Store.exporter();           // exporter() horodate etat.dernierExport AVANT de le sérialiser
  const avantExport = JSON.stringify(Store.etat);  // capturé APRÈS, pour inclure ce même horodatage
  Store.reinitialiser();
  ok("export puis import : l'état change bien après réinitialisation", JSON.stringify(Store.etat) !== avantExport);
  Store.importer(texteExport);
  ok("export puis import : l'état est restauré à l'identique", JSON.stringify(Store.etat) === avantExport, JSON.stringify(Store.etat).slice(0, 200));

  // ── Parcours guidé (lot 6, D047/D050) : chapitre 0 en entier, puis le début du palier 1, via l'écran Leçons ──
  const repondreQuestionCourante = async () => {
    const t = document.querySelector("h1").textContent;
    const ex = CONTENU.exercices.find(x => x.titre === t);
    if (zone()) { saisir(ex.solution); bouton("Vérifier").click(); }
    else if (document.querySelector("input.saisie-reponse")) {
      document.querySelector("input.saisie-reponse").value = String(Attendus.predire(ex).nbLignes); bouton("Répondre").click();
    } else if (document.querySelector(".choix")) {
      const texteBon = ex.options[ex.reponse];
      [...document.querySelectorAll(".choix button")].find(b => b.textContent.includes(texteBon)).click();
    }
    await attendre(250);
    const suite = bouton("Question suivante →") || bouton("Voir le bilan →");
    if (suite) { suite.click(); await attendre(250); }
  };
  const aVous = () => [...document.querySelectorAll("button")].find(b => /^À vous/.test(b.textContent.trim()));

  await aller("#/lecons");
  [...document.querySelectorAll(".chapitre")].find(b => /Comprendre une base/.test(b.textContent)).click();
  await attendre(250);
  ok("chapitre 0 : leçon affichée, sans exercice SQL", !!document.querySelector(".lecon__intro") && !zone());
  bouton("Tester cet exemple").click();
  await attendre(200);
  ok("chapitre 0 : exemple testé en vrai, 7 catégories affichées", document.querySelectorAll(".resultat tbody tr").length === 7, document.querySelectorAll(".resultat tbody tr").length);
  aVous().click();
  await attendre(250);
  ok("chapitre 0, première question : pas de « null » parasite avant « Quitter le chapitre » (bug du lot 6, 3ᵉ occurrence du motif replaceChildren)",
    !/\bnull\b/.test(document.querySelector(".exo__pied").textContent), document.querySelector(".exo__pied").textContent);
  for (let i = 0; i < 6 && !/Chapitre terminé/i.test(document.body.innerText); i++) await repondreQuestionCourante();
  ok("chapitre 0 : bilan affiché, 6 bonnes réponses sur 6", /Chapitre terminé/i.test(document.body.innerText) && /6 bonne\(s\) réponse\(s\) sur 6/.test(document.body.innerText), document.body.innerText.slice(0, 150));
  [...document.querySelectorAll("button")].find(b => /Chapitre suivant/.test(b.textContent)).click();
  await attendre(250);
  ok("chapitre suivant ouvert : « Choisir ses colonnes »", /Choisir ses colonnes/.test(document.body.innerText));
  aVous().click();
  await attendre(250);
  for (let i = 0; i < 3 && !/Chapitre terminé/i.test(document.body.innerText); i++) await repondreQuestionCourante();
  ok("palier 1, chapitre 1 : bilan affiché, 3 bonnes réponses sur 3 (p1-01 inclus)", /Chapitre terminé/i.test(document.body.innerText) && /3 bonne\(s\) réponse\(s\) sur 3/.test(document.body.innerText), document.body.innerText.slice(0, 150));
  bouton("Retour au sommaire").click();
  await attendre(250);
  ok("retour au sommaire : chapitres 0 et 1 marqués terminés", document.querySelectorAll(".chapitre--fini").length >= 2, document.querySelectorAll(".chapitre--fini").length);

  // ── Liste « Tous les exercices » groupée par CHAPITRE, cartes compactes (lot 6) ──
  Session.quitter();   // sinon #/exercices réaffiche encore le bilan de la série jouée plus haut (Session.courante)
  await aller("#/exercices");
  ok("liste des exercices : groupée par chapitre, pas par palier", /Tous les exercices, par chapitre/.test(document.body.innerText) && /Comprendre une base, avant d'écrire une requête/.test(document.body.innerText));
  ok("liste des exercices : cartes compactes, sans l'énoncé complet", ![...document.querySelectorAll(".liste-exos .carte")].some(c => c.textContent.includes("Affichez le nom et le prix de chaque produit")));
  ok("liste des exercices : plus de puce de compétence, une seule ligne (type + difficulté) par carte (D056)",
    ![...document.querySelectorAll(".liste-exos .carte")].some(c => c.textContent.includes("lire-filtrer") || /Lire et filtrer une table/.test(c.textContent))
    && [...document.querySelectorAll(".liste-exos .exo__meta")].every(m => m.querySelectorAll(".puce").length <= 2));

  // ── C1 : formulations alternatives toutes acceptées, via l'écran ──
  await aller("#/exercice/p1-01");
  const formulations = [
    "SELECT produits.nom, produits.prix FROM produits",
    "select nom,   prix   from   produits",
    "SELECT nom, prix FROM produits WHERE 1 = 1",
    "SELECT nom, prix FROM produits ORDER BY id"
  ];
  for (const f of formulations) { await aller("#/exercices"); await aller("#/exercice/p1-01"); ok("C1 acceptée : " + f.slice(0, 40), (await verifier(f)).className.includes("retour--juste")); }

  // refus différenciés
  await aller("#/exercices"); await aller("#/exercice/p1-01");
  let r = await verifier("SELECT nom, prix + 1 FROM produits");
  ok("prix décalé de 1 : refusé, les 30 lignes diffèrent, deux colonnes de comparaison affichées", r.className.includes("--faux") && /30 lignes diffèrent/.test(r.textContent) && r.querySelectorAll(".comparaison__col").length === 2, r.textContent.slice(0, 200));
  r = await verifier("SELECT nom, prix FROM produits WHERE prix > 10");
  ok("filtre trop restrictif : 4 lignes manquantes", /4 lignes manquantes/.test(r.textContent) && !!r.querySelector(".ecart-bloc"), r.textContent.slice(0, 200));
  r = await verifier("SELEC 1");
  ok("erreur SQLite brute, non évaluée, sans tentative", r.className.includes("--neutre") && r.querySelector(".erreur-sql pre").textContent === 'near "SELEC": syntax error' && ![...r.querySelectorAll(".retour__note")].some(n => n.textContent.startsWith("Tentative")), r.textContent);
  r = await verifier("");
  ok("requête vide : non évaluée", r.className.includes("--neutre") && /Requête vide/.test(r.textContent), r.textContent);
  r = await verifier("INSERT INTO categories(id, nom) VALUES (99, 'Test') RETURNING id");
  ok("écriture : non évaluée", r.className.includes("--neutre") && /hors programme/.test(r.textContent), r.textContent);
  r = await verifier("SELECT date('now') AS d");
  ok("date('now') : message dédié, date de référence", /date du jour/.test(r.textContent) && /30 juin 2026/.test(r.textContent), r.textContent.slice(0, 250));

  // ── Réussite comptée : XP affiché, maîtrise mise à jour (lot 4) ──
  await aller("#/exercices"); await aller("#/exercice/p1-01");
  r = await verifier("SELECT nom, prix FROM produits");
  ok("réussite comptée : badge XP affiché, ligne de progression présente", r.className.includes("--juste") && !!r.querySelector(".retour__xp") && !!r.querySelector(".retour__progres"), r.textContent.slice(0, 200));

  // C7 (UPDATE plutôt que DELETE : un DELETE FROM produits violerait la clé étrangère de lignes_commande ;
  // prix = 1 plutôt que 0, qui violerait la contrainte CHECK (prix > 0))
  saisir("UPDATE produits SET prix = 1;"); bouton("Exécuter").click(); await attendre(150);
  ok("C7 note : la base a été modifiée", [...document.querySelectorAll(".resultat__note")].some(n => /modifiée/.test(n.textContent)));
  r = await verifier("SELECT nom, prix FROM produits");
  ok("C7 : Vérifier accepte malgré la base vivante modifiée", r.className.includes("--juste"), r.textContent.slice(0, 200));

  // C8
  bouton("Réinitialiser la base").click(); await attendre(150);
  saisir("SELECT * FROM clients, commandes, lignes_commande, produits");
  const t0 = performance.now(); bouton("Exécuter").click(); const ms = Math.round(performance.now() - t0); await attendre(100);
  ok("C8 Exécuter : pas de gel (< 2 s), plafond annoncé", ms < 2000 && /Plus de 10.000 lignes/.test(document.querySelector(".resultat__titre").textContent), { ms });
  r = await verifier("SELECT * FROM clients, commandes, lignes_commande, produits");
  ok("C8 Vérifier : trop de lignes", /Plus de 10.000 lignes obtenues/.test(r.textContent), r.textContent.slice(0, 200));

  // C14
  await aller("#/exercices"); await aller("#/exercice/p1-01");
  const brouillon = "SELECT 1 -- brouillon"; saisir(brouillon);
  const noeud = zone(); const schema = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Schéma"); schema.focus(); schema.click(); await attendre(250);
  ok("C14 : explorateur ouvert (dialogue, 5 tables)", !!document.querySelector('[role="dialog"]') && document.querySelectorAll(".schema-onglets button").length === 5);
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await attendre(250);
  ok("C14 : fermé par Échap, même textarea, texte intact, focus rendu", !document.querySelector('[role="dialog"]') && zone() === noeud && zone().value === brouillon && document.activeElement === schema, { actif: document.activeElement.tagName });
  await aller("#/exercices"); await aller("#/exercice/p1-01");
  ok("C14 : brouillon retrouvé après être sorti de l'exercice", zone().value === brouillon, zone().value);

  // ── Explorateur : voir une table ENTIÈRE, pas seulement son aperçu à 5 lignes (lot 6) ──
  // (le compte est scopé à .schema-detail et exclut .schema-colonnes, le tableau des colonnes de la table,
  //  lui-même dans un .resultat : sans ce filtre, ses lignes s'ajoutent à celles de l'aperçu des données)
  const lignesApercu = () => document.querySelectorAll(".schema-detail .resultat table:not(.schema-colonnes) tbody tr").length;
  bouton("Schéma").click(); await attendre(250);
  [...document.querySelectorAll(".schema-onglets button")].find(b => b.textContent.trim() === "clients").click(); await attendre(150);
  ok("explorateur : aperçu à 5 lignes par défaut sur la table clients (40 lignes)", lignesApercu() === 5, lignesApercu());
  bouton("Voir les 40 lignes").click(); await attendre(150);
  ok("explorateur : les 40 lignes de clients affichées sur demande", lignesApercu() === 40, lignesApercu());
  bouton("Réduire aux 5 premières lignes").click(); await attendre(150);
  ok("explorateur : réduit de nouveau à 5 lignes", lignesApercu() === 5, lignesApercu());
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await attendre(250);
  ok("explorateur : refermé", !document.querySelector('[role="dialog"]'));

  // ── Lexique : vocabulaire ET clauses SQL, recherche, Échap (lot 6) ──
  // (.lexique__groupe met son contenu en capitales par CSS, comme .entete__sur ailleurs : innerText le reflète,
  //  d'où les vérifications insensibles à la casse, déjà nécessaires pour « Parcours guidé »/« Chapitre terminé »)
  bouton("Lexique").click(); await attendre(250);
  ok("lexique : ouvert, vocabulaire et clauses affichés", /lexique/i.test(document.body.innerText) && /clé étrangère/i.test(document.body.innerText) && /left join/i.test(document.body.innerText));
  ok("lexique : les bandeaux de groupe sont des frères plats de leurs lignes, pas des conteneurs (D056, bug de défilement)",
    [...document.querySelectorAll(".lexique__groupe")].every(g => !g.querySelector(".fn-ligne")));
  const rechercheLexique = document.querySelector('.lexique input[type="search"]');
  rechercheLexique.value = "limit"; rechercheLexique.dispatchEvent(new Event("input", { bubbles: true })); await attendre(150);
  ok("lexique : la recherche filtre sur les clauses (LIMIT trouvé, arrête le résultat)", /limit/i.test(document.body.innerText) && /arrête le résultat/i.test(document.body.innerText));

  // ── Fiche de clause, ouverte depuis le Lexique (lot 6, D056) ──
  [...document.querySelectorAll(".lexique .fn-ligne--lien")].find(b => b.textContent.startsWith("LIMIT")).click(); await attendre(250);
  // (.fiche__label est mis en capitales par CSS, comme .entete__sur/.lexique__groupe ailleurs : insensible à la casse)
  ok("fiche LIMIT : ouverte (hash dynamique), but/syntaxe/erreur affichés, Lexique refermé",
    location.hash === "#/fiche/LIMIT" && !document.querySelector('[role="dialog"]')
    && /à quoi ça sert/i.test(document.body.innerText) && /SELECT … FROM table LIMIT n/.test(document.body.innerText)
    && /égalité pile à la coupure/i.test(document.body.innerText) && /erreur fréquente/i.test(document.body.innerText));
  bouton("ORDER BY").click(); await attendre(250);
  ok("fiche LIMIT → « voir aussi » ORDER BY : navigue vers sa propre fiche", decodeURIComponent(location.hash) === "#/fiche/ORDER BY" && /Trier les lignes/.test(document.body.innerText));
  bouton("Autre clause").click(); await attendre(250);
  ok("« Autre clause » rouvre le Lexique", !!document.querySelector('.lexique input[type="search"]'));
  const rechercheLexique2 = document.querySelector('.lexique input[type="search"]');
  rechercheLexique2.value = "doublon"; rechercheLexique2.dispatchEvent(new Event("input", { bubbles: true })); await attendre(150);
  ok("lexique : la recherche filtre aussi le vocabulaire (doublon trouvé, LIMIT plus affiché)", /doublon/i.test(document.body.innerText) && !/\blimit\b/i.test(document.querySelector(".lexique__liste").textContent));
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await attendre(250);
  ok("lexique : refermé par Échap", !document.querySelector('[role="dialog"]'));

  // ── Après deux tentatives ratées, proposer explicitement de révéler la requête attendue (lot 6) ──
  await aller("#/exercice/p1-05");
  r = await verifier("SELECT nom FROM produits");
  ok("1ʳᵉ tentative ratée : pas encore de bouton de révélation", r.className.includes("--faux") && !bouton("Voir la requête attendue"));
  r = await verifier("SELECT nom FROM produits WHERE stock < 5");
  await attendre(100);   // Edge, parfois plus lent à re-rendre après coup : marge supplémentaire avant de relire le bouton
  ok("2ᵉ tentative ratée : le bouton de révélation apparaît", r.className.includes("--faux") && !!bouton("Voir la requête attendue"));
  bouton("Voir la requête attendue")?.click(); await attendre(150);
  ok("révélation : la solution apparaît dans les indices, le bouton disparaît", !!document.querySelector(".indice--solution") && !bouton("Voir la requête attendue"));

  // corriger, predire, qcm, masquage 1×1
  await aller("#/exercice/p1-17");
  ok("corriger : requête de départ préchargée", /ORDER BY prix$/.test(zone().value));
  bouton("Vérifier").click(); await attendre(250);
  ok("corriger : départ refusé pour l'ordre", /pas dans l'ordre demandé/.test(retour().textContent));
  r = await verifier("SELECT nom, prix FROM produits WHERE categorie_id = 1 ORDER BY prix DESC");
  ok("corriger : réparation acceptée (ex æquo libres)", r.className.includes("--juste"));
  await aller("#/exercice/p1-15");
  ok("predire : pas d'éditeur", !zone());
  ok("predire : rien révélé avant la réponse (pas de ligne, pas de « Voici »)",
    document.querySelectorAll(".resultat tbody tr").length === 0
    && ![...document.querySelectorAll(".resultat__titre")].some(h => /Voici ce que SQLite renvoie/.test(h.textContent)));
  const champ = document.querySelector("input.saisie-reponse"); champ.value = "10"; bouton("Répondre").click(); await attendre(250);
  ok("predire : 10 accepté, résultat révélé (tronqué à 8), champ verrouillé", retour().className.includes("--juste") && champ.disabled && document.querySelectorAll(".resultat tbody tr").length === 8);
  ok("predire : essai libre proposé après verrouillage (D037, qcm/predire)", !!document.querySelector(".essai"));
  await aller("#/exercices"); await aller("#/exercice/p1-15");
  ok("predire : retour sur l'exercice déjà répondu, le verdict et le résultat sont retrouvés (pas rejoués avant une réponse)",
    retour().className.includes("--juste") && document.querySelector("input.saisie-reponse").disabled && document.querySelectorAll(".resultat tbody tr").length === 8);
  await aller("#/exercice/p1-02");
  [...document.querySelectorAll(".choix button")].find(b => /erreur de syntaxe/.test(b.textContent)).click(); await attendre(200);
  ok("qcm : bonne réponse", retour().className.includes("--juste") && document.querySelectorAll('.choix button[data-etat="juste"]').length === 1);
  CONTENU.exercices.push({ id: "t-masque", type: "requete", titre: "t", question: "t", solution: "SELECT ROUND(AVG(prix), 2) FROM produits", comparer: {} });
  await aller("#/exercice/t-masque");
  r = await verifier("SELECT AVG(prix) FROM produits");
  ok("1×1 : valeur attendue jamais affichée, arrondi nommé", !!r.querySelector(".comparaison__masque") && !/165[.,]31(?!\d)/.test(r.textContent) && /arrondie à 2 décimales/.test(r.textContent), r.textContent.slice(0, 300));

  // bac à sable et hors ligne
  await aller("#/bac-a-sable");
  ok("bac à sable : aperçu exécuté (5 lignes)", document.querySelectorAll(".resultat tbody tr").length === 5);
  ok("hors ligne : aucune ressource externe", performance.getEntriesByType("resource").length === 0 && document.querySelectorAll("link[href], script[src], img[src], iframe[src]").length === 0, performance.getEntriesByType("resource").map(x => x.name));
  return R;
})()
