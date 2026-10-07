/* Requêt'R — scénario navigateur, exécuté DANS la page par outils/cdp.cjs (hors livrable).
   Il s'auto-contrôle : il renvoie une liste de [libellé, réussi, détail]. Il pilote le vrai DOM de requeter.html : formulations acceptées
   (C1), refus différenciés, non évalué, date du jour (D033), C7 (un DELETE ne fausse pas Vérifier), C8 (produit cartésien), C14 (l'éditeur
   survit à l'explorateur et à la navigation), corriger, predire, qcm, masquage d'un attendu 1×1 (D034), bac à sable, hors ligne.
   ATTENTION : il s'appuie sur les 4 exercices de DÉMONSTRATION (demo-requete, demo-corriger, demo-predire, demo-qcm), jetables : au lot 6,
   les remplacer par des exercices réels ou adapter les identifiants. */
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

  ok("démarrage : la liste des 4 exercices s'affiche", document.querySelectorAll(".liste-exos .carte").length === 4, document.body.innerText.slice(0, 200));

  // C1 : formulations alternatives toutes acceptées, via l'écran
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
