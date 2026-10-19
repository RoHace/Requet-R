"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — primitives d'interface (el, icônes, toasts, bus, cellules, tableau, éditeur, piège de focus)
   1. CONFIG     2. UI     3. (moteur : voir src/moteur.js)
   4. EXPLORATEUR DE SCHÉMA     5. EXERCICES (aides de rendu) ET BAC À SABLE     6. (socle : voir src/store.js,
   src/progression.js, src/routeur.js, qui définissent Store, Progression, Routeur, Vues et demarrer())
   Globaux fournis par le build, avant ce fichier : initSqlJs (vendor), WASM_B64, SEED_SQL, CONTENU, CLAUSES, PALIERS (contenu.js),
   Moteur et nouvelleBase (moteur.js), Comparateur (comparateur.js), TYPES_EXERCICE, Indices, Attendus (exercices.js).
   Globaux qui dépendent de CE fichier, chargés après : Store, Progression (purs), puis Routeur/Vues (src/routeur.js).
   ═══════════════════════════════════════════════════════════ */

/* ══ 1. CONFIG ══════════════════════════════════════════════ */
const CONFIG = {
  version: "0.4.0-lot4",
  schema: 1,
  cle: "requeter.etat"          // clé de stockage (Store, src/store.js)
};

/* ══ 2. UI (repris de Classe'R) ═════════════════════════════ */
/** Fabrique d'éléments : el("div.carte", {onclick}, "texte", elEnfant) */
function el(selecteur, attrs = {}, ...enfants) {
  const [tag, ...classes] = selecteur.split(".");
  const n = document.createElement(tag || "div");
  if (classes.length) n.className = classes.join(" ");
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "html") n.innerHTML = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "class") n.className += " " + v;
    else n.setAttribute(k, v);
  }
  enfants.flat().forEach(c => {
    if (c === null || c === undefined || c === false) return;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return n;
}

/** Garde-fou pour un `replaceChildren` natif appelé HORS de `el()` (qui, lui, filtre déjà ses enfants ci-dessus) :
 *  passer `null` directement au `replaceChildren` natif du DOM ne le filtre pas, il l'affiche comme le TEXTE
 *  "null" — bug récurrent (lot 3, puis lot 6 dans `rendreQuestion`) chaque fois qu'un ternaire conditionnel
 *  (`condition ? el(...) : null`) est passé tel quel. À utiliser pour tout `replaceChildren` natif dont les
 *  enfants peuvent être conditionnels, plutôt que de refiltrer au cas par cas à chaque nouvel appel. */
function remplacerEnfants(noeud, ...enfants) {
  noeud.replaceChildren(...enfants.flat().filter(c => c !== null && c !== undefined && c !== false));
}

const ICONES = {
  exercices: '<rect x="3.5" y="3" width="13" height="14" rx="1.5"/><path d="M7 7.5h6M7 10.5h6M7 13.5h3.5"/>',
  bacasable: '<rect x="3" y="4" width="14" height="12" rx="1.5"/><path d="M6.5 8.5 9 10.5l-2.5 2M11 13h3"/>',
  schema: '<rect x="2.5" y="3" width="6" height="5" rx="1"/><rect x="11.5" y="3" width="6" height="5" rx="1"/><rect x="7" y="12.5" width="6" height="5" rx="1"/><path d="M5.5 8v2.5h4.5v2M14.5 8v2.5H10"/>',
  accueil: '<path d="M3 10.5 10 4l7 6.5M5 9.5V17h4v-4h2v4h4V9.5"/>',
  lecons: '<rect x="4" y="3.5" width="12" height="13" rx="1.5"/><path d="M4 7.5h12M8 11h5M8 14h5"/>',
  missions: '<path d="M5 3v14M5 3h9l-2 3 2 3H5"/>',
  progression: '<path d="M4 16V9M9 16V5M14 16v-7M4 16h12"/>',
  reglages: '<circle cx="10" cy="10" r="2.6"/><path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2M5.4 5.4l1.4 1.4M13.2 13.2l1.4 1.4M5.4 14.6l1.4-1.4M13.2 6.8l1.4-1.4"/>',
  lexique: '<path d="M4 4.5h5a2 2 0 0 1 2 2v9a1.5 1.5 0 0 0-1.5-1.5H4Z"/><path d="M16 4.5h-5a2 2 0 0 0-2 2v9a1.5 1.5 0 0 1 1.5-1.5H16Z"/>'
};
function icone(nom) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 20 20"); s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.6");
  s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
  s.innerHTML = ICONES[nom] || "";
  return s;
}

const Toast = {
  afficher(message, type = "") {
    const t = el("div.toast" + (type === "accent" ? ".toast--accent" : ""), {}, message);
    document.getElementById("toasts").append(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 200ms"; }, 2600);
    setTimeout(() => t.remove(), 2900);
  }
};

/** Bus minimal (porté de Classe'R, D045) : personne ne s'y abonne encore (demarrer() s'y abonne par habitude,
 *  comme chez Classe'R) ; posé pour que Store.modifier puisse annoncer un changement sans dépendre de qui écoute. */
const Bus = {
  ecouteurs: {},
  sur(evt, fn) { (Bus.ecouteurs[evt] ||= []).push(fn); },
  emettre(evt, donnee) { (Bus.ecouteurs[evt] || []).forEach(fn => fn(donnee)); }
};

/** Barre de progression en cellules, signature visuelle de la maîtrise (Classe'R, D045) : `pourcent` plein, une
 *  cellule partielle pour le reste, et jusqu'à `opts.fantome` (pourcentage déjà atteint puis érodé par l'oubli)
 *  affiché en pointillés. `opts.ok` marque une compétence consolidée à 100 %. */
function cellules(pourcent, nb = 10, fine = false, opts = {}) {
  const pleines = Math.floor(pourcent / 100 * nb);
  const partielle = pourcent / 100 * nb - pleines > 0.001;
  const fantomeJusque = opts.fantome ? Math.floor(opts.fantome / 100 * nb) : 0;
  const cases = Array.from({ length: nb }, (_, i) => {
    if (i < pleines) return el("span.pleine" + (opts.gagne && i >= Math.floor((opts.depuis ?? pourcent) / 100 * nb) ? ".gagne" : ""));
    if (i === pleines && partielle) return el("span.partielle");
    if (i < fantomeJusque) return el("span.erodee");
    return el("span");
  });
  return el("div.cellules" + (fine ? ".cellules--fine" : "") + (opts.ok ? ".cellules--ok" : ""),
    { role: "img", "aria-label": `${Math.round(pourcent)} %` }, cases);
}

/** Modale accessible : le focus reste dans la boîte, Échap ferme si c'est permis, et le focus revient
 *  à l'élément qui l'avait ouverte — quelle que soit la façon dont elle se referme.
 *  Portée telle quelle de Classe'R (prévue au lot 4, nécessaire dès l'explorateur). */
function piegeFocus(voile, { fermer = null } = {}) {
  const declencheur = document.activeElement;
  const focalisables = () => [...voile.querySelectorAll("button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex='-1'])")]
    .filter(e => e.offsetParent !== null || e === document.activeElement);
  voile.addEventListener("keydown", ev => {
    if (ev.key === "Escape" && fermer) { ev.preventDefault(); ev.stopPropagation(); fermer(); return; }
    if (ev.key !== "Tab") return;
    const l = focalisables(); if (!l.length) return;
    const premier = l[0], dernier = l[l.length - 1];
    if (!voile.contains(document.activeElement)) { ev.preventDefault(); premier.focus(); }
    else if (ev.shiftKey && document.activeElement === premier) { ev.preventDefault(); dernier.focus(); }
    else if (!ev.shiftKey && document.activeElement === dernier) { ev.preventDefault(); premier.focus(); }
  });
  const retirer = voile.remove.bind(voile);
  voile.remove = () => { retirer(); if (declencheur && declencheur.isConnected && declencheur !== document.body) declencheur.focus(); };
}

/** Valeur de cellule : NULL se voit (italique grisé), les nombres s'alignent à droite. */
function formaterCellule(v) {
  if (v === null) return { texte: "NULL", classe: "nul" };
  if (v instanceof Uint8Array) return { texte: `BLOB (${v.length} o)`, classe: "nul" };
  if (typeof v === "number") return { texte: String(v), classe: "nombre" };
  return { texte: String(v), classe: "" };
}

/** Table de résultats en lecture seule (à placer dans un conteneur .resultat).
 *  `absents` : indices des lignes à surligner (celles qui n'existent pas dans l'autre résultat, pour la comparaison). */
function tableResultat(jeu, limite, { absents = [] } = {}) {
  const marques = new Set(absents);
  const affichees = jeu.lignes.slice(0, limite);
  const corps = affichees.length
    ? affichees.map((l, i) => el("tr" + (marques.has(i) ? ".ecart" : ""), {}, l.map(v => { const f = formaterCellule(v); return el("td" + (f.classe ? "." + f.classe : ""), {}, f.texte); })))
    : [el("tr", {}, el("td.aucune", { colspan: jeu.colonnes.length }, "Aucune ligne."))];
  return el("div.resultat__zone", {},
    el("table", {},
      el("thead", {}, el("tr", {}, jeu.colonnes.map(c => el("th", { scope: "col" }, c)))),
      el("tbody", {}, corps)));
}

const milliers = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const nbLignes = n => `${n} ligne${n > 1 ? "s" : ""}`;

/** Éditeur SQL : un <textarea> à chasse fixe, sans coloration ni autocomplétion (lot 3, volontairement sobre).
 *  Ctrl/Cmd + Entrée exécute ; avec Maj, vérifie (si `surVerifier` est fourni). Tab reste le changement de focus (accessibilité).
 *  Le composant ne se reconstruit jamais : le verdict met à jour d'autres zones, jamais ce <textarea>. */
function editeurSQL({ valeur = "", etiquette = "Requête SQL", surExecuter, surVerifier = null, surChange = null }) {
  const zone = el("textarea.editeur-sql", { spellcheck: "false", autocomplete: "off", autocapitalize: "off", "aria-label": etiquette }, valeur);
  zone.addEventListener("keydown", ev => {
    if (ev.key !== "Enter" || !(ev.ctrlKey || ev.metaKey)) return;
    ev.preventDefault();
    if (ev.shiftKey && surVerifier) surVerifier(); else surExecuter();
  });
  zone.addEventListener("input", () => { if (surChange) surChange(zone.value); });
  return {
    element: zone,
    valeur: () => zone.value,
    definir(v) { zone.value = v; if (surChange) surChange(v); },
    focus: () => zone.focus()
  };
}

/** Ce que « Exécuter » affiche : un tableau par jeu de résultats, l'erreur SQLite BRUTE telle quelle (lire
 *  « near "SELEC": syntax error » fait partie du métier), et les remarques utiles (écriture, plafond, délai). */
function blocsExecution(res) {
  const blocs = [];
  res.jeux.forEach((jeu, i) => {
    const n = jeu.lignes.length;
    const total = jeu.tronque ? `Plus de ${milliers(res.limiteLecture)} lignes` : nbLignes(n);
    blocs.push(el("h3.resultat__titre", {}, (res.jeux.length > 1 ? `Résultat ${i + 1} — ` : "") + total));
    blocs.push(tableResultat(jeu, res.limite));
    if (n > res.limite) blocs.push(el("p.resultat__note", {}, `Affichage limité aux ${res.limite} premières lignes.`));
    if (jeu.tronque) blocs.push(el("p.resultat__note", {}, `Lecture arrêtée à ${milliers(res.limiteLecture)} lignes : la requête en renvoie davantage.`));
  });
  if (res.interrompu) blocs.push(el("p.resultat__note", {}, `Lecture interrompue au bout de ${res.delaiMs / 1000} s : la requête est trop longue.`));
  if (res.erreur) {
    blocs.push(el("div.erreur-sql", { role: "alert" }, el("b", {}, "Erreur SQLite"), el("pre", {}, res.erreur)));
  } else if (!res.instructions) {
    blocs.push(el("p.muet", { style: "margin-top:12px" }, "Rien à exécuter."));
  } else if (!res.jeux.length) {
    blocs.push(el("p.muet", { style: "margin-top:12px" }, "Exécuté sans erreur. Cette requête ne renvoie aucune ligne."));
  }
  if (res.ecritures) blocs.push(el("p.resultat__note", {}, "La base a été modifiée : « Réinitialiser la base » la remet à neuf. Vérifier travaille toujours sur la base d'origine."));
  return blocs;
}

/* ══ 3. MOTEUR SQL ══════════════════════════════════════════ */
/* Sorti de ce fichier au lot 3 : voir src/moteur.js (Moteur, nouvelleBase). */

/* ══ 4. EXPLORATEUR DE SCHÉMA ═══════════════════════════════ */
/** Carte des relations : une boîte par table, un trait par clé étrangère (« 1 » côté table pointée, « N » côté table
 *  qui pointe). Mise en page déduite des clés lues : une table se place à droite de celles vers lesquelles elle pointe.
 *  Purement visuelle (aria-hidden) : la liste textuelle des relations et les onglets sont l'équivalent accessible. */
function carteRelations(tables, choisir) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}, ...enfants) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    enfants.forEach(c => n.append(c));
    return n;
  };
  const texte = (attrs, contenu) => { const n = svg("text", attrs); n.textContent = contenu; return n; };
  const noms = new Set(tables.map(t => t.nom));
  const parents = t => [...new Set(t.cles.map(c => c.table).filter(p => p !== t.nom && noms.has(p)))];

  // colonne de la carte = profondeur dans le graphe des clés (plafonnée, pour qu'un cycle ne boucle pas)
  const col = Object.fromEntries(tables.map(t => [t.nom, 0]));
  for (let i = 0; i < tables.length; i++) {
    for (const t of tables) for (const p of parents(t)) col[t.nom] = Math.min(Math.max(col[t.nom], col[p] + 1), tables.length - 1);
  }
  // rang vertical : en première colonne l'ordre de création, ensuite la moyenne des rangs des tables parentes
  const rang = {};
  const colonnes = [];
  tables.forEach(t => (colonnes[col[t.nom]] = colonnes[col[t.nom]] || []).push(t));
  colonnes.forEach((groupe, c) => {
    if (!groupe) return;
    groupe.forEach((t, i) => {
      const ps = parents(t).filter(p => rang[p] !== undefined);
      rang[t.nom] = c && ps.length ? ps.reduce((s, p) => s + rang[p], 0) / ps.length : i;
    });
    groupe.sort((a, b) => rang[a.nom] - rang[b.nom]);
    groupe.forEach((t, i) => { if (i && rang[t.nom] < rang[groupe[i - 1].nom] + 1) rang[t.nom] = rang[groupe[i - 1].nom] + 1; });
  });

  const L = 150, H = 40, ECART = 70, PAS = 62, MARGE = 14;
  const autoRef = tables.some(t => t.cles.some(c => c.table === t.nom));
  const gauche = autoRef ? 120 : MARGE;
  const largeur = gauche + colonnes.length * L + (colonnes.length - 1) * ECART + MARGE;
  const hauteur = MARGE * 2 + Math.max(...Object.values(rang)) * PAS + H;
  const x = t => gauche + col[t.nom] * (L + ECART);
  const y = t => MARGE + rang[t.nom] * PAS;

  // les traits arrivant sur (ou partant de) une même boîte se répartissent le long de son bord
  const traits = tables.flatMap(t => t.cles.map(c => ({ fils: t, parent: tables.find(o => o.nom === c.table), colonne: c.de }))).filter(e => e.parent);
  traits.sort((a, b) => rang[a.parent.nom] - rang[b.parent.nom] || rang[a.fils.nom] - rang[b.fils.nom]);   // pas de croisement à l'arrivée
  const total = { sortie: {}, entree: {} }, vus = { sortie: {}, entree: {} };
  traits.filter(e => e.parent !== e.fils).forEach(e => {
    total.sortie[e.parent.nom] = (total.sortie[e.parent.nom] || 0) + 1;
    total.entree[e.fils.nom] = (total.entree[e.fils.nom] || 0) + 1;
  });
  const position = (sens, t) => { vus[sens][t.nom] = (vus[sens][t.nom] || 0) + 1; return H * vus[sens][t.nom] / (total[sens][t.nom] + 1); };

  const dessin = [];
  traits.forEach(({ fils, parent, colonne }) => {
    if (fils === parent) {                          // auto-référence : boucle à gauche, nommée par sa colonne
      const x0 = x(fils), y0 = y(fils);
      dessin.push(svg("path", { class: "sv-lien", d: `M ${x0} ${y0 + 9} C ${x0 - 50} ${y0 + 2} ${x0 - 50} ${y0 + H - 2} ${x0} ${y0 + H - 9}` }));
      dessin.push(texte({ class: "sv-colonne", x: x0 - 44, y: y0 + H / 2 + 4, "text-anchor": "end" }, colonne));
      return;
    }
    const x1 = x(parent) + L, y1 = y(parent) + position("sortie", parent), x2 = x(fils), y2 = y(fils) + position("entree", fils), xm = (x1 + x2) / 2;
    dessin.push(svg("path", { class: "sv-lien", d: `M ${x1} ${y1} C ${xm} ${y1} ${xm} ${y2} ${x2} ${y2}` }));
    dessin.push(texte({ class: "sv-card", x: x1 + 6, y: y1 - 5 }, "1"));
    dessin.push(texte({ class: "sv-card", x: x2 - 6, y: y2 - 5, "text-anchor": "end" }, "N"));
  });
  tables.forEach(t => {
    const g = svg("g", { class: "sv-boite", "data-table": t.nom, "data-actif": "0", transform: `translate(${x(t)} ${y(t)})` },
      svg("rect", { width: L, height: H, rx: 8 }),
      texte({ class: "sv-nom", x: L / 2, y: 17, "text-anchor": "middle" }, t.nom),
      texte({ class: "sv-nb", x: L / 2, y: 32, "text-anchor": "middle" }, `${t.lignes} ligne${t.lignes > 1 ? "s" : ""}`));
    g.addEventListener("click", () => choisir(t.nom));
    dessin.push(g);
  });

  const racine = svg("svg", { class: "sv", viewBox: `0 0 ${largeur} ${hauteur}`, width: largeur, height: hauteur, "aria-hidden": "true", focusable: "false" }, ...dessin);
  const conteneur = el("div.schema-carte", {}, racine);
  conteneur.majActif = nom => racine.querySelectorAll(".sv-boite").forEach(g => { g.dataset.actif = g.dataset.table === nom ? "1" : "0"; });
  return conteneur;
}

/** Panneau consultable par-dessus l'écran en cours, sans jamais l'interrompre : même mécanique que le Lexique de Classe'R
 *  (voile, rôle dialog, Échap, piège de focus, retour du focus au bouton du rail).
 *  Il lit la base VIVANTE : ce que l'apprenant vient de faire (DELETE, DROP…) s'y voit. */
const Explorateur = (() => {
  let voile = null, btn = null;
  const cible = (table, colonne) => colonne ? `${table}.${colonne}` : table;

  /** Documentation du jeu de données actuellement chargé dans la base vivante (D068). */
  function docDuJeu() {
    const jeux = CONTENU.jeux || {};
    return jeux[Moteur.etat.jeu] || CONTENU.base || {};
  }

  /** Le segment « Boutique / Export brut » n'est offert que HORS exercice : pendant un exercice, changer la base
   *  d'« Exécuter » sans changer celle de « Vérifier » (base jetable, seed de l'exercice, D032) recréerait
   *  l'ambiguïté que le lot 3 avait supprimée. L'exercice désigne son jeu ; le bac à sable sert à explorer. */
  function horsExercice() {
    if (typeof Parcours !== "undefined" && Parcours && Parcours.courant) return false;
    if (typeof Session !== "undefined" && Session && Session.courante) return false;
    return !/^#\/exercice\//.test(location.hash);
  }

  function detailTable(t, tables, choisir) {
    const doc = (docDuJeu().tables && docDuJeu().tables[t.nom]) || {};
    const cle = t.colonnes.filter(c => c.pk).sort((a, b) => a.pk - b.pk).map(c => c.nom);
    const fk = Object.fromEntries(t.cles.map(c => [c.de, c]));
    const refs = tables.flatMap(o => o.cles.filter(c => c.table === t.nom).map(c => ({ table: o.nom, colonne: c.de })));
    const saut = (nom, libelle) => el("button.puce.puce--ambre.schema-saut", { type: "button", title: `Voir la table ${nom}`, onclick: () => choisir(nom) }, libelle);

    const code = el("pre.schema-sql", { hidden: true }, t.sql);
    const bascule = el("button.btn.btn--nu", { type: "button", "aria-expanded": "false", onclick: () => {
      const ouvrir = code.hidden;
      code.hidden = !ouvrir;
      bascule.setAttribute("aria-expanded", String(ouvrir));
      bascule.textContent = ouvrir ? "Masquer l'instruction CREATE TABLE" : "Voir l'instruction CREATE TABLE";
    } }, "Voir l'instruction CREATE TABLE");

    /* Aperçu limité à 5 lignes par défaut (Moteur.schema()) ; « Voir les N lignes » charge la table ENTIÈRE à la
       demande (une seule fois, mise en cache dans `toutesLesLignes`) — certains exercices (prédire un nombre de
       lignes sur toute une table) ne se vérifient pas avec 5 lignes seulement. */
    const nomsColonnes = t.colonnes.map(c => c.nom);
    const titreApercu = el("h4.schema-sous", {}, t.lignes > 5 ? "Les 5 premières lignes" : "Toutes les lignes");
    const zoneApercu = el("div.resultat", {}, tableResultat({ colonnes: nomsColonnes, lignes: t.apercu }, 5));
    let toutesLesLignes = null, deplie = false;
    const boutonTout = t.lignes > 5 ? el("button.btn.btn--nu", { type: "button" }, `Voir les ${t.lignes} lignes`) : null;
    if (boutonTout) boutonTout.addEventListener("click", () => {
      deplie = !deplie;
      if (deplie) {
        if (!toutesLesLignes) {
          const r = Moteur.executer(`SELECT * FROM "${t.nom}"`);
          toutesLesLignes = r.jeux.length ? r.jeux[r.jeux.length - 1].lignes : [];
        }
        titreApercu.textContent = `Toutes les ${t.lignes} lignes`;
        zoneApercu.replaceChildren(tableResultat({ colonnes: nomsColonnes, lignes: toutesLesLignes }, t.lignes));
        boutonTout.textContent = "Réduire aux 5 premières lignes";
      } else {
        titreApercu.textContent = "Les 5 premières lignes";
        zoneApercu.replaceChildren(tableResultat({ colonnes: nomsColonnes, lignes: t.apercu }, 5));
        boutonTout.textContent = `Voir les ${t.lignes} lignes`;
      }
    });

    return el("div.schema-detail", {},
      el("div.schema-detail__tete", {},
        el("h3.mono", {}, t.nom),
        el("span.puce", {}, `${t.lignes} ligne${t.lignes > 1 ? "s" : ""}`)),
      doc.role ? el("p.muet", {}, doc.role) : null,
      el("p.schema-cle", {}, el("b", {}, "Clé primaire : "),
        cle.length ? el("span.mono", {}, cle.length > 1 ? `(${cle.join(", ")}) — clé composée` : cle[0]) : "aucune"),
      el("div.resultat", {}, el("div.resultat__zone", {}, el("table.schema-colonnes", {},
        el("thead", {}, el("tr", {}, ["Colonne", "Type", "Rôle", "Remarque"].map(h => el("th", { scope: "col" }, h)))),
        el("tbody", {}, t.colonnes.map(c => el("tr", {},
          el("td", {}, el("b", {}, c.nom)),
          el("td", {}, c.type || "—"),
          el("td", {}, el("div.schema-tags", {},
            c.pk ? el("span.puce.puce--accent", {}, "clé primaire") : null,
            fk[c.nom] ? saut(fk[c.nom].table, `clé étrangère → ${cible(fk[c.nom].table, fk[c.nom].vers)}`) : null,
            !c.obligatoire && !c.pk ? el("span.puce", {}, "peut être vide") : null)),
          el("td.schema-note", {}, (doc.colonnes && doc.colonnes[c.nom]) || ""))))))),
      el("p.schema-cle", {}, el("b", {}, "Référencée par : "),
        refs.length ? el("span.schema-tags", {}, refs.map(r => saut(r.table, cible(r.table, r.colonne)))) : "aucune autre table"),
      titreApercu, zoneApercu, boutonTout,
      el("div.schema-sql-bloc", {}, bascule, code));
  }

  function construire() {
    const tables = Moteur.schema();
    const corps = el("div.lexique__liste", {});

    if (!tables.length) {
      corps.append(el("p.muet", { style: "padding:14px 0" }, "La base ne contient aucune table pour le moment. « Réinitialiser la base » la reconstruit."));
    } else {
      const zone = el("div", {});
      const carte = carteRelations(tables, nom => choisir(nom));
      const onglets = el("div.segment.schema-onglets", { role: "group", "aria-label": "Tables de la base" },
        tables.map(t => el("button", { type: "button", "aria-pressed": "false", "data-table": t.nom, onclick: () => choisir(t.nom) }, t.nom)));
      const choisir = nom => {
        const t = tables.find(o => o.nom === nom);
        onglets.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.table === nom)));
        carte.majActif(nom);
        zone.replaceChildren(detailTable(t, tables, choisir));
        onglets.querySelector(`[data-table="${nom}"]`).focus();     // le bouton cliqué dans le détail disparaît : le focus reste dans le panneau
      };

      const relations = tables.flatMap(t => t.cles.map(c => ({ de: t.nom, colonne: c.de, vers: c.table, cible: c.vers })));
      corps.append(
        el("h3.schema-sous", {}, relations.length ? "Carte des relations" : "Les fichiers"),
        /* Sans aucune clé étrangère (un export brut, D068), la leçon sur « 1 » et « N » n'a rien à désigner :
           on dit à la place ce que l'absence de relation signifie. */
        el("p.muet.schema-lecture", {}, relations.length
          ? "Une clé étrangère est une colonne qui contient l'identifiant d'une ligne d'une autre table : c'est ainsi que les tables se relient. Sur la carte, « 1 » marque la table pointée (une seule ligne) et « N » la table qui pointe (plusieurs lignes possibles). Cliquez une table pour voir son détail."
          : "Aucune clé étrangère n'est déclarée : rien, dans la base, ne dit comment ces fichiers se rattachent les uns aux autres. C'est à la requête de le faire, et rien ne la préviendra si elle se trompe de colonne. Cliquez un fichier pour voir son détail."),
        carte,
        relations.length
          ? el("ul.schema-rel", {}, relations.map(r => el("li", {},
              el("span.mono", {}, `${r.de}.${r.colonne} → ${cible(r.vers, r.cible)}`),
              r.de === r.vers ? el("span.tres-muet", {}, " — la table se réfère à elle-même") : null)))
          : null,
        el("h3.schema-sous", {}, relations.length ? "Les tables" : "Le détail de chaque fichier"),
        onglets, zone);
      choisir(tables[0].nom);
      // focus sur l'onglet actif, sans faire défiler : la carte (en haut) doit rester visible à l'ouverture
      setTimeout(() => { const actif = onglets.querySelector('[aria-pressed="true"]'); if (actif) actif.focus({ preventScroll: true }); }, 60);
    }

    const base = docDuJeu();
    const jeuActuel = JEUX.find(j => j.id === Moteur.etat.jeu) || null;
    /* Bascule entre les deux jeux : la base vivante est reconstruite, puis le panneau rouvert sur elle. */
    const bascule = horsExercice() && JEUX.length > 1
      ? el("div.segment", { role: "group", "aria-label": "Jeu de données" },
          JEUX.map(j => el("button", {
            type: "button", "aria-pressed": String(j.id === Moteur.etat.jeu), title: j.desc,
            onclick: () => { if (j.id !== Moteur.etat.jeu) { nouvelleBase(j.seed()); API.fermer(); API.ouvrir(); } }
          }, j.nom)))
      : null;
    const boite = el("div.lexique.lexique--large", { role: "dialog", "aria-modal": "true", "aria-label": "Schéma de la base" },
      el("div.lexique__tete", {},
        el("h2", {}, "Schéma de la base"),
        el("span.tres-muet", { style: "font-size:13px" }, `${tables.length} table${tables.length > 1 ? "s" : ""}`),
        el("button.btn.btn--nu", { type: "button", onclick: () => API.fermer(), "aria-label": "Fermer le schéma" }, "✕")),
      bascule,
      bascule && base.resume ? el("p.muet.schema-lecture", {}, base.resume) : null,
      corps,
      el("p.tres-muet.lexique__pied", {},
        base.dateReferenceTexte ? `Date de référence : ${base.dateReferenceTexte}. C'est « aujourd'hui » dans tous les exercices. ` : "",
        jeuActuel && !bascule ? `Jeu de données affiché : ${jeuActuel.nom}. ` : "",
        "Cette fenêtre montre la base telle qu'elle est maintenant."));
    voile = el("div.voile.voile--lexique", { onclick: ev => { if (ev.target === voile) API.fermer(); } }, boite);
    document.body.append(voile);
    piegeFocus(voile, { fermer: () => API.fermer() });
  }

  const API = {
    estOuvert: () => !!voile,
    ouvrir() { if (!voile) { construire(); API.majBouton(); } },
    fermer() { if (voile) { voile.remove(); voile = null; API.majBouton(); } },
    basculer() { API.estOuvert() ? API.fermer() : API.ouvrir(); },
    majBouton() { if (btn) btn.dataset.actif = API.estOuvert() ? "1" : "0"; },
    bouton() {
      btn = el("button.rail__lien.rail__lien--outil", { "data-actif": "0", type: "button",
        title: "Schéma de la base", onclick: () => API.basculer() },
        icone("schema"), el("span", {}, "Schéma"));
      return btn;
    }
  };
  return API;
})();

/** Lexique : vocabulaire de base (VOCABULAIRE) et clauses SQL (CLAUSES), consultable par-dessus n'importe quel
 *  écran — même mécanique que l'Explorateur ci-dessus (voile, piège de focus, Échap), sur le modèle du Lexique
 *  de Classe'R (`Reference/classer-v2.html:5513`). Deux groupes plutôt qu'un seul : le vocabulaire se lit une
 *  fois pour comprendre une base, les clauses se consultent sans cesse en écrivant une requête. Une recherche
 *  filtre les deux groupes à la fois, sur le terme et sur la définition. */
const Lexique = (() => {
  let voile = null, btn = null;

  function entrees(filtre) {
    const f = filtre.trim().toLowerCase();
    const garder = (terme, texte) => !f || terme.toLowerCase().includes(f) || texte.toLowerCase().includes(f);
    return {
      vocabulaire: Object.entries(VOCABULAIRE).filter(([terme, texte]) => garder(terme, texte)),
      clauses: Object.entries(CLAUSES).filter(([terme, c]) => garder(terme, `${c.syntaxe} ${c.aide}`))
    };
  }

  /** Un groupe = un bandeau collant (`.lexique__groupe`) suivi à PLAT de ses lignes, jamais un conteneur unique
   *  qui engloberait le bandeau ET les lignes : sticky ne fonctionne proprement qu'entre frères (motif exact de
   *  Classe'R, `Reference/classer-v2.html:5552`). Les envelopper ensemble fait du bloc entier un pavé sticky qui
   *  se superpose au groupe suivant au lieu d'être remplacé par son bandeau — bug trouvé après le lot 6. */
  function groupe(titre, items, rendreUn) {
    return items.length ? [el("div.lexique__groupe", {}, titre), ...items.map(rendreUn)] : [];
  }

  function construire() {
    const liste = el("div.lexique__liste", {});
    const champ = el("input.saisie", { type: "search", "aria-label": "Rechercher dans le lexique", placeholder: "Rechercher un mot ou une clause…" });
    const versFiche = terme => { API.fermer(); Routeur.aller(`/fiche/${encodeURIComponent(terme)}`); };
    const dessiner = () => {
      const { vocabulaire, clauses } = entrees(champ.value);
      const corps = [
        ...groupe("Vocabulaire", vocabulaire, ([terme, texte]) => el("p.fn-ligne", {}, el("span.fn-ligne__sig.mono", {}, terme), el("span.tres-muet", {}, texte))),
        ...groupe("Clauses SQL", clauses, ([terme, c]) => el("button.fn-ligne.fn-ligne--lien", { type: "button", title: `Voir la fiche de ${terme}`, onclick: () => versFiche(terme) },
          el("span.fn-ligne__sig.mono", {}, terme), el("span.tres-muet", {}, `${c.syntaxe} — ${c.aide}.`), el("span.fn-ligne__fleche", {}, "›")))
      ];
      remplacerEnfants(liste, ...corps, corps.length ? null : el("p.muet", { style: "padding:14px 0" }, "Aucune entrée ne correspond à cette recherche."));
    };
    champ.addEventListener("input", dessiner);
    dessiner();

    const boite = el("div.lexique", { role: "dialog", "aria-modal": "true", "aria-label": "Lexique" },
      el("div.lexique__tete", {},
        el("h2", {}, "Lexique"),
        el("button.btn.btn--nu", { type: "button", onclick: () => API.fermer(), "aria-label": "Fermer le lexique" }, "✕")),
      champ, liste,
      el("p.tres-muet.lexique__pied", {}, "Le vocabulaire d'une base de données, et les clauses SQL rencontrées dans les exercices."));
    voile = el("div.voile.voile--lexique", { onclick: ev => { if (ev.target === voile) API.fermer(); } }, boite);
    document.body.append(voile);
    piegeFocus(voile, { fermer: () => API.fermer() });
    setTimeout(() => champ.focus(), 60);
  }

  const API = {
    estOuvert: () => !!voile,
    ouvrir() { if (!voile) { construire(); API.majBouton(); } },
    fermer() { if (voile) { voile.remove(); voile = null; API.majBouton(); } },
    basculer() { API.estOuvert() ? API.fermer() : API.ouvrir(); },
    majBouton() { if (btn) btn.dataset.actif = API.estOuvert() ? "1" : "0"; },
    bouton() {
      btn = el("button.rail__lien.rail__lien--outil", { "data-actif": "0", type: "button",
        title: "Lexique : vocabulaire et clauses SQL", onclick: () => API.basculer() },
        icone("lexique"), el("span", {}, "Lexique"));
      return btn;
    }
  };
  return API;
})();

/* ══ 5. EXERCICES ET BAC À SABLE ═════════════════════════════ */
/* Mémoire (brouillons/tentatives/indices en mémoire seulement) retirée au lot 4 : les tentatives et réussites
 *  sont désormais dans Store.etat.exercices (src/store.js) ; le brouillon courant et le dernier verdict restent
 *  éphémères (EnCours, src/routeur.js), comme chez Classe'R. */

const LIBELLE_TYPE = { qcm: "Question à choix", requete: "Écrire une requête", corriger: "Corriger une requête", predire: "Prédire le résultat" };
const TITRE_NON_EVALUE = {
  "vide": "Requête vide", "erreur-sql": "Erreur SQLite", "ecriture": "Écriture non évaluée", "aucun-jeu": "Rien à comparer",
  "interrompu": "Requête interrompue", "saisie-invalide": "Réponse illisible", "trop-volumineux": "Résultat trop volumineux"
};

/** Deux résultats côte à côte, tronqués aux premières lignes ; les lignes sans équivalent de l'autre côté sont surlignées.
 *  Un résultat attendu d'UNE cellule n'est jamais affiché (D034) : on ne dit que sa forme. */
const LIGNES_COMPARAISON = 8;
function comparaisonResultats(v, { ordreCompte = false } = {}) {
  const e = v.ecart;
  const titreObtenu = v.obtenu.tronque ? `plus de ${milliers(e.lignes.obtenues)} lignes` : nbLignes(e.lignes.obtenues);
  /** Quand l'ordre des lignes ne compte pas, les lignes sans équivalent passent en premier : l'écart se voit tout de suite,
   *  même s'il est à la 15e ligne d'un résultat tronqué à 8. Quand il compte, l'ordre d'origine est conservé. */
  const miseEnAvant = (jeu, absents) => {
    if (ordreCompte || !absents.length) return { jeu, absents };
    const marque = new Set(absents), premiers = [], autres = [];
    jeu.lignes.forEach((l, i) => (marque.has(i) ? premiers : autres).push(l));
    return { jeu: { colonnes: jeu.colonnes, lignes: [...premiers, ...autres], tronque: jeu.tronque }, absents: premiers.map((_, i) => i) };
  };
  const colonne = (titre, jeu, absents) => {
    const m = miseEnAvant(jeu, absents);
    return el("div.comparaison__col", {},
      el("h4", {}, titre),
      el("div.resultat", {}, tableResultat(m.jeu, LIGNES_COMPARAISON, { absents: m.absents }),
        jeu.lignes.length > LIGNES_COMPARAISON ? el("p.resultat__note", {}, `… ${jeu.lignes.length - LIGNES_COMPARAISON} lignes de plus.`) : null));
  };
  const gauche = colonne(`Votre résultat (${titreObtenu})`, v.obtenu, e.absentsObtenus || []);
  const droite = v.masque || !v.attendu
    ? el("div.comparaison__col", {}, el("h4", {}, `Résultat attendu (${nbLignes(e.lignes.attendues)}, ${e.colonnes.attendues} colonne${e.colonnes.attendues > 1 ? "s" : ""})`),
        el("p.comparaison__masque", {}, "La valeur attendue n'est pas affichée : elle reviendrait à donner la réponse. Le constat ci-dessus décrit l'écart."))
    : colonne(`Résultat attendu (${nbLignes(e.lignes.attendues)})`, v.attendu, e.absentsAttendus || []);
  const surligne = (e.absentsObtenus && e.absentsObtenus.length) || (e.absentsAttendus && e.absentsAttendus.length);
  return el("div", {}, el("div.comparaison", {}, gauche, droite),
    surligne ? el("p.resultat__note", {}, "Les lignes surlignées n'ont pas d'équivalent exact dans l'autre résultat"
      + (ordreCompte ? "." : " ; elles sont placées en premier, car l'ordre des lignes ne compte pas ici.")) : null);
}

/** La section « Écart » : jusqu'à 3 lignes attendues sans équivalent, jusqu'à 3 lignes obtenues sans équivalent. */
function blocEcart(v) {
  const e = v.ecart;
  if (v.masque || !v.attendu || !(e.nbManquantes || e.nbEnTrop)) return null;
  const partie = (titre, nb, jeu, lignes) => nb ? [
    el("h3.resultat__titre", {}, `${titre} (${nb}${nb > 3 ? ", 3 premières" : ""})`),
    el("div.resultat", {}, tableResultat({ colonnes: jeu.colonnes, lignes }, 3))] : null;
  return el("div.ecart-bloc", {}, el("b", {}, "Écart"),
    partie("Lignes attendues sans équivalent dans votre résultat", e.nbManquantes, v.attendu, e.manquantes),
    partie("Lignes de votre résultat sans équivalent dans l'attendu", e.nbEnTrop, v.obtenu, e.enTrop));
}

/* carteVerdict a été fondue dans carteRetour (src/routeur.js, D045) : même logique de rendu, avec en plus le
 *  badge d'XP et la ligne de progression par compétence. */

/** Indices gradués : Piste → Clause → Exemple → Solution (verrouillée, révélée en dernier).
 *  `avancer`, facultatif, remplace l'incrémentation directe de `e.indices` — nécessaire à Mission (D057, audit),
 *  dont chaque indice doit aussi compter dans `indicesTotal` (étoiles de fin de mission), pas seulement dans le
 *  compteur de l'étape en cours. Sans lui (Session/Parcours), le comportement est inchangé. */
function panneauIndices(ex, e, avancer) {
  const liste = Indices.pour(ex);
  if (!liste.length) return null;
  const panneau = el("div.indices");
  const bouton = el("button.btn.btn--nu.indices__btn", { type: "button" });
  const dessiner = () => {
    const restants = liste.length - e.indices, suivant = liste[e.indices];
    bouton.textContent = restants === 0 ? "Tout est affiché" : suivant.revele ? "Afficher la solution" : e.indices === 0 ? "Besoin d'un indice ?" : "Indice suivant";
    bouton.disabled = restants === 0;
    bouton.classList.toggle("indices__btn--solution", !!(suivant && suivant.revele));
    panneau.replaceChildren(bouton, ...liste.slice(0, e.indices).map(i =>
      el("div.indice" + (i.revele ? ".indice--solution" : ""), {}, el("b", {}, i.titre), i.revele && ex.type !== "qcm" ? el("pre", {}, i.texte) : el("div", {}, i.texte))));
  };
  bouton.addEventListener("click", () => { if (e.indices < liste.length) { avancer ? avancer() : e.indices++; dessiner(); } });
  dessiner();
  /* Révélation directe (sans passer par chaque indice intermédiaire) : propose explicite après deux tentatives
   * ratées (carteRetour, D-lot 6), jamais la seule façon d'y arriver — la chaîne d'indices reste disponible. */
  panneau.reveler = () => { if (e.indices < liste.length) { e.indices = liste.length; dessiner(); } };
  panneau.totalIndices = liste.length;
  return panneau;
}

/** Puce d'action d'une carte d'exercice : le libellé dépend de ce que l'apprenant a déjà fait, lu dans Store
 *  (Classe'R : carteAcces). Avant le lot 4, c'était la mémoire en page ; c'est maintenant persisté. */
function puceEtatExercice(ex) {
  const h = Store.etat.exercices[ex.id];
  if (h && h.reussites > 0) return el("span.puce.puce--ok", {}, "Refaire");
  if (h && h.tentatives > 0) return el("span.puce.puce--accent", {}, "Reprendre");
  return el("span.puce.puce--accent", {}, "Commencer");
}

/** Puce « difficulté » : des points pleins sur fond de points vides, 1 à 3. */
function puceDifficulte(n) {
  return el("span.puce", { "aria-label": `Difficulté ${n} sur 3` }, "●".repeat(n) + "○".repeat(3 - n));
}

/** Carte compacte (D055) : titre, type et difficulté, puce d'action — une seule ligne de puces. La compétence
 *  est retirée : regroupée par chapitre (D055), la liste répète la même compétence sur tous ses exercices sans
 *  rien distinguer ; elle reste affichée sur l'écran de l'exercice et sur les cartes de « Travailler une
 *  compétence », qui la montrent une fois chacune. */
function carteExercice(ex) {
  return el("button.carte.carte--action", { type: "button", onclick: () => { location.hash = `#/exercice/${ex.id}`; } },
    el("div.carte__entete", {}, el("h3.liste-exos__titre", {}, ex.titre), puceEtatExercice(ex)),
    el("div.exo__meta", {},
      el("span.puce", {}, LIBELLE_TYPE[ex.type]),
      ex.difficulte ? puceDifficulte(ex.difficulte) : null));
}

/* pageExercices/pageExercice, les deux emplacements inertes et carteVerdict sont remplacés au lot 4 par
 *  Vues.exercices, Session et carteRetour (src/routeur.js) ; carteExercice ci-dessus reste utilisé par la
 *  section « Tous les exercices, par palier » de cet écran. */

/* Bac à sable : le même éditeur, sans exercice. Ctrl + Entrée exécute sur la base vivante. */
const EXEMPLES = {
  test: "SELECT 1 AS test;",
  apercu:
`SELECT id, prenom, nom, ville
FROM clients
ORDER BY id
LIMIT 5;`,
  jointure:
`SELECT c.prenom, c.nom, o.id AS commande, o.date_commande, o.statut
FROM commandes AS o
JOIN clients AS c ON c.id = o.client_id
ORDER BY o.date_commande DESC, o.id DESC
LIMIT 5;`,
  agregat:
`SELECT statut, COUNT(*) AS nb
FROM commandes
GROUP BY statut
ORDER BY statut;`
};

let brouillonBac = null;      // dernier texte du bac à sable, en mémoire seulement (perdu au rechargement, comme au lot 3)
function pageBacASable() {
  const sortie = el("div.resultat", { "aria-live": "polite" });
  const etat = el("div.sql-etat", {});
  const puceTables = el("span.puce", {});
  const editeur = editeurSQL({
    valeur: brouillonBac === null ? EXEMPLES.apercu : brouillonBac, etiquette: "Requête SQL",
    surExecuter: () => lancer(), surChange: v => { brouillonBac = v; }
  });

  function majEtat(extra) {
    puceTables.textContent = `${Moteur.nbTables()} table(s) en mémoire`;
    etat.replaceChildren(
      el("span", {}, `SQLite ${Moteur.etat.version}`),
      el("span", {}, `prêt en ${Moteur.etat.msInit} ms`),
      el("span", {}, `base reconstruite en ${Moteur.etat.msBase} ms`),
      puceTables,
      ...(extra ? [el("span", {}, extra)] : []));
  }
  function lancer() {
    const res = Moteur.executer(editeur.valeur());
    sortie.replaceChildren(...blocsExecution(res));
    majEtat(`${res.ms} ms`);
  }
  function exemple(cle) { editeur.definir(EXEMPLES[cle]); lancer(); editeur.focus(); }

  const page = el("div.vue", {},
    el("header.entete", {},
      el("div.entete__sur", {}, "Bac à sable"),
      el("h1", {}, "Bac à sable SQL"),
      el("p", {}, "Un vrai SQLite, dans ce seul fichier, sans réseau, avec la base d'une boutique en ligne. Ouvrez le « Schéma » (rail de navigation) pour voir ses tables et leurs relations, sans quitter cette page.")),
    el("section.carte", {},
      editeur.element,
      el("div.sql-barre", {},
        el("button.btn.btn--fort", { type: "button", onclick: lancer }, "Exécuter"),
        el("span.tres-muet", { style: "font-size:12.5px" }, "Ctrl + Entrée"),
        el("span.sql-barre__espace"),
        el("button.btn", { type: "button", onclick: () => {
          /* Reconstruit le jeu ACTUELLEMENT chargé (D068) : au bac à sable, on peut avoir basculé sur l'export
             brut depuis le panneau « Schéma » — « Réinitialiser » ne doit pas ramener la boutique en traître. */
          const ms = nouvelleBase(seedDe({ jeu: Moteur.etat.jeu })); sortie.replaceChildren(); majEtat();
          Toast.afficher(`Base reconstruite en ${ms} ms.`, "accent");
        } }, "Réinitialiser la base")),
      el("div.sql-exemples", {},
        el("span.tres-muet", { style: "font-size:12.5px" }, "Exemples :"),
        el("button.btn", { type: "button", onclick: () => exemple("test") }, "SELECT 1"),
        el("button.btn", { type: "button", onclick: () => exemple("apercu") }, "Aperçu des clients"),
        el("button.btn", { type: "button", onclick: () => exemple("jointure") }, "Une jointure"),
        el("button.btn", { type: "button", onclick: () => exemple("agregat") }, "Commandes par statut"),
        el("span.sql-barre__espace"),
        el("button.btn.btn--nu", { type: "button", onclick: () => {
          Store.modifier(e => { e.reglages.theme = e.reglages.theme === "sombre" ? "clair" : "sombre"; });
          appliquerTheme();
        } }, "Thème clair / sombre")),
      etat),
    sortie);
  majEtat();
  lancer();                         // la requête d'aperçu s'exécute dès l'ouverture
  return page;
}

/* ══ 6. APP ═════════════════════════════════════════════════
   coquille()/route()/demarrer()/appliquerTheme() sont remplacées au lot 4 par Routeur, Vues et demarrer()
   (src/routeur.js), qui pilote aussi l'onboarding et le thème persisté (Store). */
