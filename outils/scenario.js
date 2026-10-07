/* Requêt'R — scénario navigateur, exécuté DANS la page par outils/cdp.cjs (hors livrable). Lot 4 : reprend
   les vérifications du lot 3 (formulations acceptées C1, refus différenciés, non évalué, date du jour D033,
   C7, C8, C14, corriger, predire, qcm, masquage 1×1 D034, bac à sable, hors ligne) et ajoute l'onboarding,
   la navigation sur toutes les routes, la Série recommandée (Session), le thème persisté et une certification.
   ATTENTION : s'appuie sur les 4 exercices de DÉMONSTRATION (demo-requete, demo-corriger, demo-predire,
   demo-qcm), jetables : au lot 6, les remplacer par des exercices réels ou adapter les identifiants. */
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
  bouton("Commencer").click();
  await attendre(250);
  ok("onboarding : fermée, profil marqué onboardingFait", !document.querySelector(".modale") && Store.etat.profil.onboardingFait === true);

  // ── Route par défaut : #/accueil (D047) ──
  ok("démarrage : écran d'accueil par défaut", location.hash === "" || location.hash === "#/accueil", location.hash);
  ok("accueil : bannière et niveau affichés", !!document.querySelector(".accueil__banniere") && /Niveau 1/.test(document.body.innerText));

  // ── Navigation sur toutes les routes du rail (D047) ──
  for (const [chemin, attendu] of [
    ["#/exercices", "Exercices"], ["#/lecons", "Aucune leçon pour l'instant"], ["#/missions", "Aucune mission pour l'instant"],
    ["#/bac-a-sable", "Bac à sable SQL"], ["#/progression", "Compétences"], ["#/reglages", "Réglages"]
  ]) {
    await aller(chemin);
    ok(`navigation ${chemin} : rendu sans erreur`, document.body.innerText.includes(attendu) && !document.querySelector(".erreur-sql"), document.body.innerText.slice(0, 150));
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

  // ── C1 : formulations alternatives toutes acceptées, via l'écran ──
  await aller("#/exercice/demo-requete");
  const formulations = [
    "SELECT c.id, COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id",
    "SELECT id, (SELECT COUNT(*) FROM commandes o WHERE o.client_id = c.id) AS total FROM clients c",
    "WITH n AS (SELECT client_id, COUNT(*) AS k FROM commandes GROUP BY client_id) SELECT c.id, COALESCE(n.k, 0) FROM clients c LEFT JOIN n ON n.client_id = c.id",
    "select c.id, count(o.statut) as NB from clients as c left join commandes as o on o.client_id=c.id group by 1"
  ];
  for (const f of formulations) { await aller("#/exercices"); await aller("#/exercice/demo-requete"); ok("C1 acceptée : " + f.slice(0, 40), (await verifier(f)).className.includes("retour--juste")); }

  // refus différenciés
  await aller("#/exercices"); await aller("#/exercice/demo-requete");
  let r = await verifier("SELECT c.id, COUNT(*) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id");
  ok("COUNT(*) : refusé, 6 lignes en écart, les lignes en écart sont surlignées en tête", r.className.includes("--faux") && /6 lignes diffèrent/.test(r.textContent) && r.querySelectorAll("tr.ecart").length >= 6 && r.querySelectorAll(".comparaison__col").length === 2, r.textContent.slice(0, 200));
  r = await verifier("SELECT c.id, COUNT(o.id) FROM clients c INNER JOIN commandes o ON o.client_id = c.id GROUP BY c.id");
  ok("INNER JOIN : 6 lignes manquantes", /6 lignes manquantes/.test(r.textContent) && !!r.querySelector(".ecart-bloc"), r.textContent.slice(0, 200));
  r = await verifier("SELEC 1");
  ok("erreur SQLite brute, non évaluée, sans tentative", r.className.includes("--neutre") && r.querySelector(".erreur-sql pre").textContent === 'near "SELEC": syntax error' && ![...r.querySelectorAll(".retour__note")].some(n => n.textContent.startsWith("Tentative")), r.textContent);
  r = await verifier("");
  ok("requête vide : non évaluée", r.className.includes("--neutre") && /Requête vide/.test(r.textContent), r.textContent);
  r = await verifier("INSERT INTO categories(id, nom) VALUES (99, 'Test') RETURNING id");
  ok("écriture : non évaluée", r.className.includes("--neutre") && /hors programme/.test(r.textContent), r.textContent);
  r = await verifier("SELECT date('now') AS d");
  ok("date('now') : message dédié, date de référence", /date du jour/.test(r.textContent) && /30 juin 2026/.test(r.textContent), r.textContent.slice(0, 250));

  // ── Réussite comptée : XP affiché, maîtrise mise à jour (lot 4) ──
  await aller("#/exercices"); await aller("#/exercice/demo-requete");
  r = await verifier("SELECT c.id, COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id");
  ok("réussite comptée : badge XP affiché, ligne de progression présente", r.className.includes("--juste") && !!r.querySelector(".retour__xp") && !!r.querySelector(".retour__progres"), r.textContent.slice(0, 200));

  // C7
  saisir("DELETE FROM lignes_commande;"); bouton("Exécuter").click(); await attendre(150);
  ok("C7 note : la base a été modifiée", [...document.querySelectorAll(".resultat__note")].some(n => /modifiée/.test(n.textContent)));
  r = await verifier("SELECT c.id, COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id");
  ok("C7 : Vérifier accepte malgré la base amputée", r.className.includes("--juste"), r.textContent.slice(0, 200));

  // C8
  bouton("Réinitialiser la base").click(); await attendre(150);
  saisir("SELECT * FROM clients, commandes, lignes_commande, produits");
  const t0 = performance.now(); bouton("Exécuter").click(); const ms = Math.round(performance.now() - t0); await attendre(100);
  ok("C8 Exécuter : pas de gel (< 2 s), plafond annoncé", ms < 2000 && /Plus de 10.000 lignes/.test(document.querySelector(".resultat__titre").textContent), { ms });
  r = await verifier("SELECT * FROM clients, commandes, lignes_commande, produits");
  ok("C8 Vérifier : trop de lignes", /Plus de 10.000 lignes obtenues/.test(r.textContent), r.textContent.slice(0, 200));

  // C14
  await aller("#/exercices"); await aller("#/exercice/demo-requete");
  const brouillon = "SELECT 1 -- brouillon"; saisir(brouillon);
  const noeud = zone(); const schema = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Schéma"); schema.focus(); schema.click(); await attendre(250);
  ok("C14 : explorateur ouvert (dialogue, 5 tables)", !!document.querySelector('[role="dialog"]') && document.querySelectorAll(".schema-onglets button").length === 5);
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await attendre(250);
  ok("C14 : fermé par Échap, même textarea, texte intact, focus rendu", !document.querySelector('[role="dialog"]') && zone() === noeud && zone().value === brouillon && document.activeElement === schema, { actif: document.activeElement.tagName });
  await aller("#/exercices"); await aller("#/exercice/demo-requete");
  ok("C14 : brouillon retrouvé après être sorti de l'exercice", zone().value === brouillon, zone().value);

  // corriger, predire, qcm, masquage 1×1
  await aller("#/exercice/demo-corriger");
  ok("corriger : requête de départ préchargée", /ORDER BY prix$/.test(zone().value));
  bouton("Vérifier").click(); await attendre(250);
  ok("corriger : départ refusé pour l'ordre", /pas dans l'ordre demandé/.test(retour().textContent));
  r = await verifier("SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC");
  ok("corriger : réparation acceptée (ex æquo libres)", r.className.includes("--juste"));
  await aller("#/exercice/demo-predire");
  ok("predire : pas d'éditeur", !zone());
  ok("predire : rien révélé avant la réponse (pas de ligne, pas de « Voici »)",
    document.querySelectorAll(".resultat tbody tr").length === 0
    && ![...document.querySelectorAll(".resultat__titre")].some(h => /Voici ce que SQLite renvoie/.test(h.textContent)));
  const champ = document.querySelector("input.saisie-reponse"); champ.value = "76"; bouton("Répondre").click(); await attendre(250);
  ok("predire : 76 accepté, résultat révélé, champ verrouillé", retour().className.includes("--juste") && champ.disabled && document.querySelectorAll(".resultat tbody tr").length === 8);
  ok("predire : essai libre proposé après verrouillage (D037, qcm/predire)", !!document.querySelector(".essai"));
  await aller("#/exercices"); await aller("#/exercice/demo-predire");
  ok("predire : retour sur l'exercice déjà répondu, le verdict et le résultat sont retrouvés (pas rejoués avant une réponse)",
    retour().className.includes("--juste") && document.querySelector("input.saisie-reponse").disabled && document.querySelectorAll(".resultat tbody tr").length === 8);
  await aller("#/exercice/demo-qcm");
  [...document.querySelectorAll(".choix button")].find(b => /ne compte que les villes/.test(b.textContent)).click(); await attendre(200);
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
