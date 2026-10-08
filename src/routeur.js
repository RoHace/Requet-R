"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — Routeur, Vues, Session, Parcours, Mission, Affichage, onboarding (lot 4)
   DECISIONS.md : D047 (Routeur/Vues), D048 (Session/Parcours/Mission), D049 (onboarding/Packs).
   Porté de Classe'R, adapté au SQL : la validation de Mission perd ses six formes (cellule, plage, colonne, tri,
   filtre, conditionnel — toutes liées à une feuille de calcul) au profit d'une seule, « requête ↔ Comparateur »,
   identique à celle d'un exercice `requete` (D048).
   Dernier fichier chargé : il utilise tout ce qui précède (CONTENU, Moteur, Comparateur, TYPES_EXERCICE, Indices,
   Attendus, les primitives d'interface de app.js, Store, Progression) et démarre l'application.
   ═══════════════════════════════════════════════════════════ */

/* ── Bus et Modale (portés de Classe'R) ──────────────────────────────────────────────────────── */
/* Bus : voir src/app.js (chargé avant ce fichier, avec les autres primitives d'interface). */

/** Boîte de dialogue accessible générique : voile, piège de focus, fermeture optionnelle par Échap/clic extérieur.
 *  `actions(fermer)` renvoie les boutons du pied, chacun libre d'appeler `fermer()` lui-même. */
const Modale = {
  ouvrir({ titre, corps, actions, fermable = true }) {
    let voile;
    function fermer() { voile.remove(); }
    const boite = el("div.modale", {}, el("h2", {}, titre), corps, el("div.modale__actions", {}, actions(fermer)));
    voile = el("div.voile", { onclick: fermable ? ev => { if (ev.target === voile) fermer(); } : null }, boite);
    document.body.append(voile);
    piegeFocus(voile, { fermer: fermable ? fermer : null });
    return fermer;
  }
};

/* ── Packs (D049) : un seul pack pour l'instant, toujours proposé actif par défaut ─────────────── */
const Packs = {
  actif(id) { return !Store.etat.reglages.packsDesactives.includes(id); },
  basculer(id) {
    Store.modifier(e => {
      const i = e.reglages.packsDesactives.indexOf(id);
      if (i === -1) e.reglages.packsDesactives.push(id); else e.reglages.packsDesactives.splice(i, 1);
    });
  },
  /** Nombre d'exercices et de missions d'un pack (porté de Classe'R, pour la carte « Contenus installés »).
   *  Le contenu livré sans `pack` déclaré est rattaché au premier pack de CONTENU.packs ci-dessous. */
  compter(id) {
    return {
      exercices: CONTENU.exercices.filter(e => e.pack === id).length,
      missions: CONTENU.missions.filter(m => m.pack === id).length
    };
  },
  normaliser() {
    const defaut = CONTENU.packs[0] && CONTENU.packs[0].id;
    if (defaut) {
      CONTENU.exercices.forEach(e => { if (!e.pack) e.pack = defaut; });
      CONTENU.missions.forEach(m => { if (!m.pack) m.pack = defaut; });
    }
    /* aucun pack n'est désactivé par défaut (packsDesactives commence vide) : rien d'autre à faire */
  }
};

/* ── Contenu : filtrage par palier (D047), remplace le sélecteur inerte du lot 3 (D042) ────────── */
const Contenu = {
  accessible(item) {
    const niv = Store.etat.reglages.niveauContenu;
    const niveauOk = !niv || niv === "tout" || !item.niveau || item.niveau === niv;
    const packOk = !item.pack || Packs.actif(item.pack);
    return niveauOk && packOk;
  },
  /** Segment « Tous / P1 / P2 / … », branché sur Store.etat.reglages.niveauContenu (remplace le sélecteur inerte de D042). */
  selecteur(surChangement) {
    const niv = Store.etat.reglages.niveauContenu || "tout";
    const choisir = v => { Store.modifier(e => { e.reglages.niveauContenu = v; }); surChangement(); };
    return el("div.segment", { role: "group", "aria-label": "Filtrer par palier" },
      el("button", { type: "button", "aria-pressed": String(niv === "tout"), onclick: () => choisir("tout") }, "Tous"),
      PALIERS.map(p => el("button", { type: "button", "aria-pressed": String(niv === p.id), onclick: () => choisir(p.id) }, p.titre)));
  }
};

/* ── Illustrations (Illus, portées de Classe'R : paysage d'accueil, vignettes de chapitre) ─────── */
const Illus = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}, ...enfants) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    enfants.forEach(c => n.append(c));
    return n;
  };
  return {
    paysage() {
      const L = 400, H = 118;
      const colline = (base, decal, teinte) => {
        const g = svg("g", {});
        for (let x = -20; x < L; x += 22) {
          const h = Math.max(10, base + Math.round(Math.sin((x + decal) / 46) * 10));
          g.append(svg("rect", { x, y: H - h, width: 24, height: h + 12, fill: teinte }));
        }
        return g;
      };
      return svg("svg", { class: "paysage", viewBox: `0 0 ${L} ${H}`, "aria-hidden": "true", focusable: "false" },
        svg("rect", { x: 0, y: 0, width: L, height: H, fill: "var(--ciel)" }),
        svg("rect", { x: L - 90, y: 16, width: 26, height: 26, fill: "var(--accent)" }),
        colline(70, 0, "var(--violet)"),
        colline(40, 120, "var(--prairie)"));
    },
    vignette(i) {
      const t = ["var(--g1)", "var(--g2)", "var(--g3)", "var(--g4)"][i % 4];
      const motifs = [
        () => [svg("rect", { x: 1, y: 1, width: 10, height: 3, fill: t }), svg("rect", { x: 1, y: 6, width: 10, height: 3, fill: t })],
        () => [[1, 1], [7, 1], [1, 7], [7, 7]].map(([x, y]) => svg("rect", { x, y, width: 4, height: 4, fill: t })),
        () => [svg("rect", { x: 4.5, y: 1, width: 3, height: 10, fill: t }), svg("rect", { x: 1, y: 4.5, width: 10, height: 3, fill: t })],
        () => [3, 6, 9].map((h, idx) => svg("rect", { x: 1 + idx * 4, y: 12 - h, width: 3, height: h, fill: t }))
      ];
      return svg("svg", { class: "vignette", viewBox: "0 0 12 12", "aria-hidden": "true", focusable: "false" }, ...motifs[i % motifs.length]());
    }
  };
})();

/* ── Affichage : constat + XP + progression par compétence, carteRetour fond carteVerdict (lot 3) dedans ──── */

/** `clausesDe(ex)` remplace `fonctionsDe` de Classe'R : les exercices SQL portent déjà leur clause principale
 *  (`ex.clause`, utilisée par Indices.pour) — pas besoin de la retrouver par une expression régulière dans le texte. */
function clausesDe(ex) { return ex && ex.clause ? [ex.clause] : []; }

/** Pastilles « série sans indice » : CONFIG.serieConsolidation points, pleins pour la série en cours. */
function pips(n, total) {
  return el("span.pips", {}, Array.from({ length: total }, (_, i) => el("span" + (i < n ? ".plein" : ""))));
}

/** Ligne de progression après une réponse COMPTÉE : « cette question reviendra » à l'échec, avant→après et
 *  pastilles de série à la réussite, ou la mention de consolidation si la compétence vient d'être validée à 100 %. */
function ligneProgres(ex, v, maj) {
  if (!v.compte) return null;
  if (!v.reussi) return el("p.retour__note", {}, "Cette question reviendra : rien n'est acquis après un seul échec.");
  if (!maj || !maj.apres.length) return null;
  return el("div", {}, maj.apres.map(apres => {
    const avant = maj.avant.find(a => a.id === apres.id) || { brute: 0 };
    const comp = CONTENU.competences.find(c => c.id === apres.id);
    const delta = apres.brute - avant.brute;
    const consolidee = apres.brute === 100 && avant.brute < 100;
    const serieActuelle = (Store.etat.competences[apres.id] && Store.etat.competences[apres.id].serie) || 0;
    return el("div.retour__ligne", {},
      el("span", {}, comp ? comp.nom : apres.id),
      consolidee
        ? el("span.retour__valide", {}, "✓ compétence validée à 100 %")
        : el("span", {}, el("span.mono", {}, `${avant.brute} → ${apres.brute}`), delta > 0 ? el("span.delta", {}, ` +${delta}`) : null,
            pips(serieActuelle, PROGRESSION_CONFIG.serieConsolidation)));
  }));
}

/** Carte de retour commune (fond carteVerdict du lot 3 + badge XP + ligne de progression, D047).
 *  `ex` : l'exercice (ou un objet minimal `{type:"requete"}` pour une étape de Mission). `v` : le verdict,
 *  avec `tentatives`/`indices` déjà fusionnés par l'appelant. `meta.xp`, `meta.progres` : facultatifs. */
function carteRetour(ex, v, meta = {}) {
  const juste = v.statut === "reussi", neutre = v.statut === "non-evalue";
  const termine = juste || ex.type === "qcm" || ex.type === "predire";
  const titre = juste ? ({ qcm: "Bonne réponse", predire: "Bien vu" }[ex.type] || "Résultat correct")
    : neutre ? (TITRE_NON_EVALUE[v.code] || "Pas évalué") : "Pas tout à fait";
  const corps = [];
  if (v.code === "erreur-sql") corps.push(el("div.erreur-sql", { role: "alert" }, el("b", {}, "Erreur SQLite"), el("pre", {}, v.constat)));
  else if (v.constat) corps.push(el("p.retour__constat", {}, v.constat));
  if (v.details) corps.push(el("p.retour__note", {}, `Écart observé : ${v.details}`));
  if (v.pistes && v.pistes.length) corps.push(el("div.retour__pistes", {}, el("b", {}, "Où regarder"), el("ul", {}, v.pistes.map(p => el("li", {}, p)))));
  (v.notes || []).forEach(n => corps.push(el("p.retour__note", {}, n.texte)));
  if (!juste && !neutre && v.ecart && v.obtenu && ex.type !== "qcm" && ex.type !== "predire") corps.push(comparaisonResultats(v, { ordreCompte: !!(ex.comparer && ex.comparer.ordonne) }), blocEcart(v));
  if (termine && ex.explication) corps.push(el("p", {}, ex.explication));
  if (termine && ex.retenir) corps.push(el("div.retour__usage", {}, el("b", {}, "À retenir"), ex.retenir));
  if (meta.progres) corps.push(el("div.retour__progres", {}, meta.progres));
  if (v.compte) corps.push(el("p.retour__note", {}, `Tentative ${v.tentatives || 1}${v.indices ? ` · ${v.indices} indice${v.indices > 1 ? "s" : ""} vu${v.indices > 1 ? "s" : ""}` : ""}.`));
  return el("div.retour" + (juste ? ".retour--juste" : neutre ? ".retour--neutre" : ".retour--faux"), { role: "status", "data-frais": "1" },
    el("div.retour__tete", {},
      el("span.retour__icone", { "aria-hidden": "true" }, juste ? "✓" : neutre ? "i" : "✕"),
      el("span.retour__titre", {}, titre),
      meta.xp > 0 ? el("span.retour__xp", {}, `+${meta.xp} XP`) : null),
    el("div.retour__corps", {}, corps));
}

/** Essai libre, sans effet sur la progression : pour les types à réponse unique (qcm, predire), qui se
 *  verrouillent après la première réponse comptée (D037) — les types SQL (requete, corriger) restent déjà
 *  librement itératifs dans leur éditeur, ils n'ont pas besoin de cette zone. */
function carteEssai(res) {
  const juste = res.reussi;
  return el("div.retour" + (juste ? ".retour--juste" : ".retour--faux") + ".retour--essai", { role: "status" },
    el("div.retour__tete", {}, el("span.retour__icone", { "aria-hidden": "true" }, juste ? "✓" : "✕"), el("span.retour__titre", {}, juste ? "Correct" : "Pas encore")),
    el("div.retour__corps", {}, el("p.essai__note", {}, "Essai libre : seule la première réponse compte pour la progression.")));
}

function zoneEssai(ex, apiBase) {
  const zoneRendu = el("div");
  function relancer() {
    const sousApi = {
      ...apiBase, reponsePrecedente: null,
      repondre(r) {
        const v = TYPES_EXERCICE[ex.type].valider(ex, r);
        const corps = el("div", {}, carteEssai(v));
        if (!v.reussi) {
          const bouton = el("button.btn", { type: "button" }, "Réessayer encore");
          bouton.addEventListener("click", relancer);
          corps.append(bouton);
        }
        zoneRendu.append(corps);
        return v;
      }
    };
    zoneRendu.replaceChildren(TYPES_EXERCICE[ex.type].rendre(ex, sousApi));
  }
  const lancement = el("button.btn.btn--nu", { type: "button" }, "Essayer encore, sans effet sur la progression");
  lancement.addEventListener("click", () => { lancement.remove(); relancer(); });
  return el("div.essai", {}, el("div.essai__titre", {}, "Essai libre"), lancement, zoneRendu);
}

/** Point d'entrée unique d'une réponse COMPTÉE (res.compte === true), partagé par le parcours standalone, Session
 *  et Parcours : calcule l'XP, le facteur de maîtrise, snapshotte avant/après, et persiste via Progression. */
function noteReponse(ex, verdict, indicesUtilises) {
  const liste = Indices.pour(ex);
  const xp = verdict.reussi ? Math.round(10 * (ex.difficulte || 1) * Indices.multiplicateurXp(indicesUtilises, liste)) : 0;
  const facteur = Indices.facteurMaitrise(indicesUtilises, liste);
  const competences = ex.competence ? [ex.competence] : [];
  const avant = competences.map(id => ({ id, ...Progression.maitrise(id) }));
  const certifs = Progression.enregistrerResultat({ competences, reussi: verdict.reussi, difficulte: ex.difficulte || 1, xp, facteur, idExercice: ex.id });
  const apres = competences.map(id => ({ id, ...Progression.maitrise(id) }));
  return { xp, avant, apres, certifs };
}

/* ── Session : série pondérée d'exercices (D048) — branche les deux emplacements inertes de D042 ──────────── */
const Session = {
  courante: null,

  choisir(competence, nb) {
    const vivier = CONTENU.exercices.filter(ex => (!competence || ex.competence === competence) && Contenu.accessible(ex));
    const notes = vivier.map(ex => {
      const h = Store.etat.exercices[ex.id];
      const m = ex.competence ? Progression.maitrise(ex.competence) : { effective: 100 };
      let score = Math.random();
      if (!h || h.tentatives === 0) score += 3;
      else if (h.reussites === 0) score += 2.5;
      else if (h.tentatives > h.reussites) score += 1.5;
      else score -= 1;
      if (m.effective < PROGRESSION_CONFIG.seuilRevision) score += 1.5;
      return { ex, score };
    });
    return notes.sort((a, b) => b.score - a.score).slice(0, nb).map(x => x.ex);
  },

  demarrer(competence = null, nb = 5) {
    const liste = Session.choisir(competence, nb);
    if (!liste.length) return false;
    const avantSession = {};
    [...new Set(liste.map(e => e.competence).filter(Boolean))].forEach(id => { avantSession[id] = Progression.maitrise(id).brute; });
    Session.courante = { liste, index: 0, reussites: 0, xp: 0, certifs: [], indices: 0, aidesUtilisees: 0, etat: "question", dernier: null, competence, avantSession };
    return true;
  },

  repondre(reponse) {
    const s = Session.courante, ex = s.liste[s.index];
    const res = TYPES_EXERCICE[ex.type].valider(ex, reponse);
    const h = () => (Store.etat.exercices[ex.id] || { tentatives: 0 }).tentatives;
    if (res.compte) {
      const maj = noteReponse(ex, res, s.indices);
      s.xp += maj.xp;
      if (res.reussi) s.reussites++;
      if (s.indices > 0) s.aidesUtilisees++;
      s.certifs.push(...maj.certifs);
      s.dernier = { ...res, tentatives: h(), indices: s.indices, xp: maj.xp, progres: ligneProgres(ex, res, maj) };
    } else {
      s.dernier = { ...res, tentatives: h(), indices: s.indices };
    }
    s.etat = "retour";
    return s.dernier;
  },

  suivant() {
    const s = Session.courante;
    if (s.index < s.liste.length - 1) { s.index++; s.etat = "question"; s.dernier = null; s.indices = 0; }
    else {
      s.etat = "bilan";
      if (s.liste.length && s.reussites === s.liste.length) Store.modifier(e => { e.stats.seriesParfaites++; });
    }
  },

  quitter() { Session.courante = null; }
};

/* ── Parcours : chapitres (leçon puis exercices) — structure seule, CHAPITRES reste vide jusqu'au lot 6+ ──── */
const Parcours = {
  courant: null,
  chapitre(id) { return CHAPITRES.find(c => c.id === id) || null; },
  exercicesDe(ch) { return ch.exercices.map(id => CONTENU.exercices.find(e => e.id === id)).filter(Boolean); },
  avancement(ch) {
    const liste = Parcours.exercicesDe(ch);
    const faits = liste.filter(ex => (Store.etat.exercices[ex.id] || {}).reussites > 0).length;
    return { faits, total: liste.length, part: liste.length ? faits / liste.length : 0 };
  },
  termine(ch) { const a = Parcours.avancement(ch); return a.total > 0 && a.faits === a.total; },
  suivantConseille() { return CHAPITRES.find(c => !Parcours.termine(c)) || null; },
  ouvrir(id) {
    const ch = Parcours.chapitre(id);
    if (!ch) return false;
    Parcours.courant = { ch, etape: "lecon", index: 0, liste: Parcours.exercicesDe(ch), reussites: 0, indices: 0, etat: "question", dernier: null };
    return true;
  },
  commencer() { const p = Parcours.courant; if (!p || !p.liste.length) return; p.etape = "exercices"; p.index = 0; p.etat = "question"; p.dernier = null; p.indices = 0; },
  suivant() {
    const p = Parcours.courant;
    if (p.index < p.liste.length - 1) { p.index++; p.etat = "question"; p.dernier = null; p.indices = 0; }
    else p.etape = "bilan";
  },
  quitter() { Parcours.courant = null; }
};

/* ── Mission (D048) : la mécanique (étapes, étoiles selon les indices, brouillon et reprise), une seule forme de
   validation — chaque étape se vérifie comme un exercice `requete` (Comparateur), jamais par un validateur de
   feuille de calcul. Aucune mission n'existe encore (CONTENU.missions est vide) : testée en lot 4 avec une
   définition de test (verifier-progression.mjs), jouée pour de vrai à partir du lot où son contenu arrive. ──── */
const Mission = (() => {
  const cache = new Map();
  function resultatEtape(def, etape) {
    const cle = `${def.id}:${def.etapes.indexOf(etape)}`;
    if (!cache.has(cle)) {
      const r = Moteur.executerIsole(etape.solution, { plafond: false });
      if (r.erreur) throw new Error(`l'étape de la mission ${def.id} est mal écrite : ${r.erreur}`);
      cache.set(cle, r.jeux[r.jeux.length - 1]);
    }
    return cache.get(cle);
  }

  const API = {
    courante: null,

    demarrer(id) {
      const def = CONTENU.missions.find(m => m.id === id);
      if (!def) return false;
      const sauvegarde = Store.etat.missions[id];
      API.courante = {
        def, etape: Math.min((sauvegarde && sauvegarde.etape) || 0, def.etapes.length - 1),
        indices: 0, indicesTotal: 0, etoiles: 0, certifs: [], etat: "encours", retour: null,
        brouillon: (sauvegarde && sauvegarde.brouillon) || ""
      };
      return true;
    },

    etapeCourante() { const m = API.courante; return m ? m.def.etapes[m.etape] : null; },

    sauvegarderBrouillon(texte) {
      const m = API.courante; if (!m) return;
      m.brouillon = texte;
      Store.modifier(e => {
        const precedent = e.missions[m.def.id] || {};
        e.missions[m.def.id] = { ...precedent, etape: m.etape, brouillon: texte, statut: precedent.statut || "encours" };
      });
    },

    /** Une seule forme de validation, quelle que soit l'étape : la requête de l'apprenant contre celle de
     *  référence de l'étape, par le même Comparateur qu'un exercice `requete` (D048). */
    verifier(sql) {
      const m = API.courante, etape = API.etapeCourante();
      const res = Comparateur.evaluer({ attendu: resultatEtape(m.def, etape), rapport: Moteur.executerIsole(sql), options: etape.comparer || {}, sql, base: CONTENU.base });
      m.retour = res;
      if (!res.reussi) return res;
      m.indices = 0;
      if (m.etape < m.def.etapes.length - 1) { m.etape++; API.sauvegarderBrouillon(""); }
      else API.terminer();
      return res;
    },

    indice() { if (API.courante) { API.courante.indices++; API.courante.indicesTotal++; } },

    terminer() {
      const m = API.courante, def = m.def;
      m.etoiles = m.indicesTotal === 0 ? 3 : m.indicesTotal <= 2 ? 2 : 1;
      const facteur = Math.max(0.3, 1 - 0.1 * m.indicesTotal);
      m.xp = Math.round(30 * (def.difficulte || 1) * facteur);
      m.certifs = Progression.enregistrerResultat({ competences: def.competences || [], reussi: true, difficulte: def.difficulte || 1, xp: m.xp, facteur, idMission: def.id });
      Store.modifier(e => { e.missions[def.id] = { statut: "terminee", etoiles: m.etoiles, indicesUtilises: m.indicesTotal, meilleurScore: m.etoiles }; });
      m.etat = "bilan";
    },

    recommencer(id) { Store.modifier(e => { delete e.missions[id]; }); cache.clear(); return API.demarrer(id); },
    quitter() { if (API.courante) API.sauvegarderBrouillon(API.courante.brouillon); API.courante = null; }
  };
  return API;
})();

/* ── Onboarding (D049) : question factuelle (« as-tu déjà écrit une requête SQL ? »), pas une auto-évaluation
   de niveau — D012 pose que tout le monde démarre au palier 0, mais un reconverti peut avoir déjà pratiqué SQL
   ailleurs ; lui demander de s'auto-évaluer le ferait répondre au hasard, une question factuelle non. ──────── */
function onboarding() {
  const options = [
    { id: "jamais", label: "Jamais, je découvre", desc: "Aucune maîtrise de départ : tout reste à construire.", depart: 0 },
    { id: "ancien", label: "Quelques-unes, il y a longtemps", desc: "Un peu d'expérience ancienne.", depart: 20 },
    { id: "regulier", label: "Oui, régulièrement", desc: "Une pratique SQL récente ou régulière.", depart: 40 }
  ];
  let choix = options[0];
  const champPrenom = el("input.saisie", { type: "text", "aria-label": "Prénom (facultatif)", placeholder: "Prénom (facultatif)" });
  const lignes = options.map(o => {
    const radio = el("input", { type: "radio", name: "experience-sql", value: o.id });
    const ligne = el("label.option", {}, radio, el("div", {}, el("b", {}, o.label), el("span", {}, o.desc)));
    radio.addEventListener("change", () => { choix = o; lignes0.forEach(l => { l.dataset.choisi = String(l === ligne ? 1 : 0); }); });
    return ligne;
  });
  const lignes0 = lignes;
  lignes[0].querySelector("input").checked = true;
  lignes[0].dataset.choisi = "1";
  const boiteOptions = el("div.options", {}, lignes);

  Modale.ouvrir({
    titre: "Bienvenue dans Requêt'R",
    fermable: false,
    corps: el("div", {},
      el("p", {}, "Quelques mots pour commencer."),
      el("div.champ", {}, el("label.champ__lib", {}, "Comment vous appeler ?"), champPrenom),
      el("div.champ", {}, el("label.champ__lib", {}, "As-tu déjà écrit une requête SQL ?"), boiteOptions)),
    actions: fermer => [el("button.btn.btn--fort", { type: "button", onclick: () => {
      Store.modifier(e => {
        e.profil.prenom = champPrenom.value.trim();
        e.profil.experienceSql = choix.id;
        e.profil.onboardingFait = true;
        Object.values(e.competences).forEach(c => { c.maitrise = choix.depart; });
      });
      fermer();
      Routeur.rendre();
      Toast.afficher(`Bienvenue${Store.etat.profil.prenom ? ", " + Store.etat.profil.prenom : ""} !`, "accent");
    } }, "Commencer")]
  });
}

function appliquerTheme() {
  document.documentElement.dataset.theme = Store.etat.reglages.theme || "clair";
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--fond").trim());
}

/* ── Vues : écrans de l'application ──────────────────────────────────────────────────────────── */
const Vues = {};

function carteAcces(titre, desc, href, desactive = false) {
  if (desactive) return el("button.carte.carte--action", { type: "button", disabled: true }, el("h3", {}, titre), el("p.muet", {}, desc));
  return el("a.carte.carte--action", { href }, el("h3", {}, titre), el("p.muet", {}, desc));
}

Vues.accueil = () => {
  const niv = Progression.niveau();
  const pf = Progression.pointsFaibles(3);
  const prochain = Parcours.suivantConseille();
  const exporteDepuis = Store.etat.dernierExport ? (Date.now() - new Date(Store.etat.dernierExport).getTime()) / 86400000 : Infinity;
  return el("div.vue", {},
    el("div.accueil__banniere", {},
      Illus.paysage(),
      el("div.accueil__mot", {},
        el("h1", {}, `Bonjour${Store.etat.profil.prenom ? ", " + Store.etat.profil.prenom : ""}`),
        el("p.muet", { style: "font-size:14px;margin-top:5px" }, "On apprend le SQL en écrivant des requêtes, pas en lisant des cours."),
        prochain ? el("a.btn.btn--fort", { style: "margin-top:14px", href: "#/lecons" }, `Continuer : ${prochain.titre}`) : null)),
    el("div.grille.grille--2", {},
      el("div.carte.stat", {}, el("div.stat__val", {}, `Niveau ${niv.niveau}`), el("div.stat__lib", {}, `${niv.titre} · ${niv.xpDansNiveau}/${niv.xpRequis} XP`)),
      el("div.carte.stat", {}, el("div.stat__val", {}, Progression.xpDuJour()), el("div.stat__lib", {}, `XP aujourd'hui (objectif ${PROGRESSION_CONFIG.objectifQuotidien})`))),
    el("div.grille.grille--2", {},
      el("div.carte.stat", {}, el("div.stat__val", {}, Store.etat.serie.jours), el("div.stat__lib", {}, "jour(s) de pratique d'affilée")),
      el("div.carte.stat", {}, el("div.stat__val", {}, Object.values(Store.etat.exercices).reduce((n, h) => n + h.reussites, 0)), el("div.stat__lib", {}, "exercices réussis"))),
    Store.etat.xp >= 100 && exporteDepuis > 7
      ? el("div.note", {}, "Vous n'avez pas exporté votre progression depuis plus de 7 jours : elle ne vit que sur cet appareil (Réglages → Exporter).")
      : null,
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Continuer")),
      el("div.grille.grille--3", {},
        carteAcces("Exercice rapide", "2 minutes, une notion à la fois.", "#/exercices"),
        carteAcces("Mission pratique", CONTENU.missions.length ? "Un scénario pas à pas." : "Arrive avec le contenu.", "#/missions", CONTENU.missions.length === 0),
        carteAcces("Essayer librement", "Une base vierge, sans consigne ni correction.", "#/bac-a-sable"))),
    pf.length ? el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "À retravailler")),
      el("div.pile", {}, pf.map(c => el("div.competence", {},
        el("div.competence__tete", {}, el("span.competence__nom", {}, c.nom), el("span.competence__val", {}, c.jamaisTravaillee ? "jamais travaillée" : `${c.effective} %`)),
        cellules(c.effective))))) : null);
};

function ecranChoix(rafraichir) {
  const exosAccessibles = CONTENU.exercices.filter(Contenu.accessible);
  const parCompetence = new Map();
  exosAccessibles.forEach(ex => { if (!ex.competence) return; (parCompetence.get(ex.competence) || parCompetence.set(ex.competence, []).get(ex.competence)).push(ex); });
  const total = exosAccessibles.length;
  const lancer = competence => { if (Session.demarrer(competence, 5)) rafraichir(); else Toast.afficher("Aucun exercice disponible pour l'instant."); };
  const parPalier = new Map();
  exosAccessibles.forEach(ex => { const cle = ex.niveau || "?"; (parPalier.get(cle) || parPalier.set(cle, []).get(cle)).push(ex); });
  return el("div", {},
    el("header.entete", {},
      el("div.entete__sur", {}, "Lot 3 — exercices de démonstration"),
      el("h1", {}, "Exercices"),
      el("p", {}, "Quatre exercices jetables, un par type, pour éprouver la mécanique. Le contenu pédagogique arrive à partir du lot 6.")),
    Contenu.selecteur(rafraichir),
    el("button.carte.carte--action", { type: "button", onclick: () => lancer(null), disabled: total === 0 },
      el("div.carte__entete", {}, el("h3", {}, "Série recommandée"), el("span.puce.puce--accent", {}, "Démarrer")),
      el("p.muet", { style: "font-size:13px;margin-top:6px" }, `5 exercices adaptés à votre progression, parmi les ${total} disponibles.`)),
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Travailler une compétence")),
      el("div.pile", {}, CONTENU.competences.filter(c => parCompetence.has(c.id)).map(c => {
        const m = Progression.maitrise(c.id);
        return el("button.carte.carte--action", { type: "button", onclick: () => lancer(c.id) },
          el("div.carte__entete", {}, el("h3", {}, c.nom), el("span.puce", {}, `${parCompetence.get(c.id).length} exercice(s)`)),
          el("p.muet", { style: "font-size:13px;margin:6px 0 8px" }, c.desc),
          cellules(m.effective));
      }))),
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Tous les exercices, par palier")),
      PALIERS.filter(p => parPalier.has(p.id)).map(p => el("div.section", {},
        el("div.section__titre", {}, el("h2", {}, `${p.id} — ${p.titre}`)),
        el("div.liste-exos", {}, parPalier.get(p.id).map(carteExercice))))));
}

function ecranSerie(rafraichir) {
  const s = Session.courante;
  if (s.etat === "bilan") return ecranBilan(rafraichir);
  const ex = s.liste[s.index];
  const zoneRetour = el("div", { id: "zone-retour" });
  const zoneEssaiConteneur = el("div");
  const suite = el("div.exo__pied", {});
  const rappels = [];
  const majSuite = () => {
    suite.replaceChildren(
      s.dernier && s.dernier.statut !== "non-evalue"
        ? el("button.btn.btn--fort", { type: "button", onclick: () => { Session.suivant(); rafraichir(); } },
            s.index < s.liste.length - 1 ? "Question suivante →" : "Voir le bilan →")
        : null,
      el("button.btn.btn--nu", { type: "button", onclick: () => { Session.quitter(); rafraichir(); } }, "Abandonner la série"));
  };
  const afficherRetour = retour => {
    zoneRetour.replaceChildren(carteRetour(ex, retour, { xp: retour.xp, progres: retour.progres }));
    zoneEssaiConteneur.replaceChildren();
    if (retour.statut !== "non-evalue" && (ex.type === "qcm" || ex.type === "predire")) zoneEssaiConteneur.append(zoneEssai(ex, api));
    if (panneau && retour.reussi) panneau.remove();
    majSuite();
  };
  const api = {
    brouillon: null, surBrouillon() {}, reponsePrecedente: null,
    surRetour: fn => rappels.push(fn),
    repondre(r) {
      const retour = Session.repondre(r);
      rappels.forEach(fn => fn(retour));
      afficherRetour(retour);
      return retour;
    }
  };
  const bloc = TYPES_EXERCICE[ex.type].rendre(ex, api);
  let panneau = s.dernier ? null : panneauIndices(ex, s);
  if (s.dernier) afficherRetour(s.dernier); else majSuite();

  return el("div", {},
    el("div.serie", {}, el("div.serie__cellules", {}, cellules(Math.round(100 * s.index / s.liste.length))), el("div.serie__compte", {}, `${s.index + 1} / ${s.liste.length}`)),
    el("header.entete", {}, el("h1", {}, ex.titre)),
    el("div.exo__question", {}, ex.question),
    ex.consigne ? el("div.exo__consigne", {}, ex.consigne) : null,
    bloc, panneau, zoneRetour, zoneEssaiConteneur, suite);
}

function ecranBilan(rafraichir) {
  const s = Session.courante, total = s.liste.length, parfait = s.reussites === total;
  const competencesVues = [...new Set(s.liste.map(e => e.competence).filter(Boolean))];
  const clausesVues = [...new Set(s.liste.flatMap(clausesDe))];
  const retenirVus = [...new Set(s.liste.map(e => e.retenir).filter(Boolean))];
  return el("div", {},
    el("div.bilan-hero", {},
      el("div.entete__sur", {}, "Bilan"),
      el("h1", {}, parfait ? "Sans faute !" : `${s.reussites} bonne(s) réponse(s) sur ${total}`),
      el("p", {}, parfait ? "Toutes les réponses étaient justes." : "Chaque passage rapproche de la maîtrise."),
      el("div.bilan-hero__chiffres", {},
        el("div.bilan-hero__chiffre", {}, el("b", {}, `+${s.xp}`), el("span", {}, "XP gagnés")),
        el("div.bilan-hero__chiffre", {}, el("b", {}, `${s.reussites}/${total}`), el("span", {}, "bonnes réponses")),
        s.aidesUtilisees ? el("div.bilan-hero__chiffre", {}, el("b", {}, s.aidesUtilisees), el("span", {}, "question(s) aidée(s)")) : null)),
    competencesVues.length ? el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Compétences travaillées")),
      el("div.pile", {}, competencesVues.map(id => {
        const c = CONTENU.competences.find(x => x.id === id), m = Progression.maitrise(id), avant = s.avantSession[id] || 0;
        return el("div.bilan__ligne", {}, el("span", {}, c ? c.nom : id),
          el("span", {}, el("span.mono", {}, `${avant} → ${m.brute}`), m.brute > avant ? el("span.bilan__delta", {}, ` +${m.brute - avant}`) : null),
          cellules(m.effective));
      }))) : null,
    s.certifs.length ? el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Certifications obtenues")),
      el("div.certifs", {}, s.certifs.map(c => el("div.certif", { "data-obtenue": "1" }, el("span.certif__ico", {}, c.ico), el("b", {}, c.nom), el("span", {}, c.desc))))) : null,
    clausesVues.length ? el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Clauses rencontrées")),
      el("div.pile", {}, clausesVues.map(cl => el("p.resume__point", {}, el("b", {}, cl), " — ", (CLAUSES[cl] || {}).aide || "")))) : null,
    retenirVus.length ? el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "À retenir")),
      el("div.pile", {}, retenirVus.map(r => el("p.resume__ligne", {}, r)))) : null,
    el("div.exo__pied", {},
      el("button.btn.btn--fort", { type: "button", onclick: () => { Session.demarrer(s.competence, 5); rafraichir(); } }, "Nouvelle série"),
      el("button.btn", { type: "button", onclick: () => { Session.quitter(); rafraichir(); } }, "Choisir une compétence"),
      el("a.btn.btn--nu", { href: "#/accueil" }, "Retour à l'accueil")));
}

Vues.exercices = () => {
  const v = el("div.vue");
  const zone = el("div");
  const rafraichir = () => zone.replaceChildren(Session.courante ? ecranSerie(rafraichir) : ecranChoix(rafraichir));
  rafraichir();
  v.append(zone);
  return v;
};

Vues.progression = () => {
  const niv = Progression.niveau();
  const comps = Progression.competencesVisibles().map(c => ({ ...c, ...Progression.maitrise(c.id) }));
  return el("div.vue", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Progression"), el("h1", {}, "Progression")),
    el("div.grille.grille--3", {},
      el("div.carte.stat", {}, el("div.stat__val", {}, Store.etat.xp), el("div.stat__lib", {}, "XP total")),
      el("div.carte.stat", {}, el("div.stat__val", {}, niv.niveau), el("div.stat__lib", {}, niv.titre)),
      el("div.carte.stat", {}, el("div.stat__val", {}, Object.values(Store.etat.exercices).reduce((n, h) => n + h.reussites, 0)), el("div.stat__lib", {}, "exercices réussis"))),
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Compétences")),
      el("div.pile", {}, comps.map(c => el("div.competence", {},
        el("div.competence__tete", {}, el("span.competence__nom", {}, c.nom), el("span.competence__val", {}, c.jamaisTravaillee ? "jamais travaillée" : `${c.effective} %`)),
        cellules(c.effective, 10, false, { fantome: c.brute > c.effective ? c.brute : 0, ok: c.brute === 100 }),
        el("p.competence__desc", {}, c.desc))))),
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Certifications")),
      el("div.certifs", {}, CONTENU.certifications.map(c => el("div.certif", { "data-obtenue": Store.etat.certifications[c.id] ? "1" : "0" },
        el("span.certif__ico", {}, c.ico), el("b", {}, c.nom), el("span", {}, c.desc))))));
};

Vues.reglages = () => {
  const theme = Store.etat.reglages.theme;
  const champPrenom = el("input.saisie", { type: "text", value: Store.etat.profil.prenom, placeholder: "Votre prénom", "aria-label": "Votre prénom" });
  champPrenom.addEventListener("change", () => Store.modifier(e => { e.profil.prenom = champPrenom.value; }));
  const fichier = el("input", { type: "file", accept: "application/json", hidden: true });
  fichier.addEventListener("change", () => {
    const f = fichier.files[0]; if (!f) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      try { Store.importer(lecteur.result); Toast.afficher("Progression importée.", "accent"); Routeur.rendre(); }
      catch (err) { Toast.afficher("Ce fichier n'est pas une progression Requêt'R."); }
    };
    lecteur.readAsText(f);
  });
  return el("div.vue", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Réglages"), el("h1", {}, "Réglages")),
    el("div.carte", {},
      el("div.ligne-reglage", {}, el("div", {}, el("h3", {}, "Thème"), el("p", {}, "L'application s'ouvre toujours avec ce réglage.")),
        el("div.segment", { role: "group", "aria-label": "Thème" },
          el("button", { type: "button", "aria-pressed": String(theme === "clair"), onclick: () => { Store.modifier(e => { e.reglages.theme = "clair"; }); appliquerTheme(); Routeur.rendre(); } }, "Jour"),
          el("button", { type: "button", "aria-pressed": String(theme === "sombre"), onclick: () => { Store.modifier(e => { e.reglages.theme = "sombre"; }); appliquerTheme(); Routeur.rendre(); } }, "Nuit"))),
      el("div.ligne-reglage", {}, el("div", { style: "flex:1" }, el("h3", {}, "Prénom"), el("p", {}, "Utilisé uniquement pour vous accueillir.")),
        el("div", { style: "width:180px" }, champPrenom))),
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Vos données")),
      el("div.carte", {},
        el("div.ligne-reglage", {}, el("div", {}, el("h3", {}, "Exporter la progression"), el("p", {}, "Un fichier JSON à conserver ou à transférer sur un autre poste.")),
          el("button.btn", { type: "button", onclick: () => { Store.exporter(); Toast.afficher("Progression exportée.", "accent"); Routeur.rendre(); } }, "Exporter")),
        el("div.ligne-reglage", {}, el("div", {}, el("h3", {}, "Importer une progression"), el("p", {}, "Remplace la progression actuelle par celle du fichier.")),
          el("div", {}, fichier, el("button.btn", { type: "button", onclick: () => fichier.click() }, "Importer"))),
        el("div.ligne-reglage", {}, el("div", {}, el("h3", {}, "Tout effacer"), el("p", {}, "Supprime XP, compétences et certifications. Sans retour possible.")),
          el("button.btn.btn--danger", { type: "button", onclick: () => {
            Modale.ouvrir({
              titre: "Effacer toute la progression ?",
              corps: el("p", {}, "XP, compétences et certifications seront supprimés. Exportez d'abord si vous souhaitez les conserver."),
              actions: fermer => [
                el("button.btn", { type: "button", onclick: fermer }, "Annuler"),
                el("button.btn.btn--danger", { type: "button", onclick: () => { Store.reinitialiser(); appliquerTheme(); fermer(); Routeur.rendre(); } }, "Effacer")
              ]
            });
          } }, "Effacer")),
        el("div.note", {}, el("b", {}, "Exportez votre progression régulièrement. "),
          "Tout est stocké dans ce navigateur, sur cet appareil uniquement. Vider l'historique, changer de navigateur ou passer en navigation privée efface définitivement votre progression. Un export par semaine suffit à ne jamais rien perdre.",
          el("div", { style: "margin-top:8px;font-size:12.5px;opacity:.8" },
            Store.etat.dernierExport
              ? `Dernier export : ${new Date(Store.etat.dernierExport).toLocaleDateString("fr-FR")}`
              : "Aucun export effectué pour l'instant.")))),
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Contenus installés"),
        el("span.tres-muet", { style: "font-size:13px" }, `${CONTENU.packs.length} pack(s)`)),
      el("div.carte", {}, CONTENU.packs.map(pk => {
        const n = Packs.compter(pk.id);
        const actif = Packs.actif(pk.id);
        return el("div.ligne-reglage", {},
          el("div", { style: "flex:1" }, el("h3", {}, pk.nom),
            el("p", {}, `${pk.desc} ${n.exercices} exercices, ${n.missions} missions.`)),
          el("button.btn" + (actif ? "" : ".btn--nu"), {
            type: "button", onclick: () => { Packs.basculer(pk.id); Routeur.rendre(); }
          }, actif ? "Actif" : "Désactivé"));
      })),
      el("p.tres-muet", { style: "font-size:12.5px;margin-top:10px" },
        "Désactiver un contenu le met de côté sans rien effacer de votre progression.")),
    el("p.tres-muet", { style: "font-size:12px;margin-top:24px" }, `Requêt'R ${CONFIG.version} · ${CONTENU.exercices.length} exercice(s) · ${CONTENU.missions.length} mission(s)`));
};

Vues.lecons = () => el("div.vue", {},
  el("header.entete", {}, el("div.entete__sur", {}, "Leçons"), el("h1", {}, "Leçons")),
  CHAPITRES.length
    ? el("div.pile", {}, CHAPITRES.map(ch => el("div.chapitre", {}, ch.titre)))
    : el("div.vide", {}, el("div.vide__boite", {},
        el("h3", {}, "Aucune leçon pour l'instant"),
        el("p", {}, "Les leçons guidées (une leçon, puis des exercices) arrivent avec le contenu, à partir du lot 6."))));

Vues.fiche = () => el("div.vue", {},
  el("header.entete", {}, el("h1", {}, "Fiches SQL")),
  el("div.vide", {}, el("div.vide__boite", {},
    el("h3", {}, "Aucune fiche pour l'instant"),
    el("p", {}, "Une fiche par clause (JOIN, GROUP BY, CTE, fonctions de fenêtre…) arrivera avec le lexique SQL complet."))));

function listeMissions(rafraichir) {
  return el("div", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Missions"), el("h1", {}, "Missions")),
    CONTENU.missions.length
      ? el("div.pile", {}, CONTENU.missions.map(m => {
          const enr = Store.etat.missions[m.id];
          return el("button.carte.carte--action", { type: "button", onclick: () => { if (Mission.demarrer(m.id)) rafraichir(); } },
            el("div.carte__entete", {}, el("h3", {}, m.titre), enr && enr.statut === "terminee" ? el("span.etoiles", {}, "★".repeat(enr.etoiles) + "☆".repeat(3 - enr.etoiles)) : el("span.puce.puce--accent", {}, "Démarrer")),
            el("p.muet", {}, m.resume || ""));
        }))
      : el("div.vide", {}, el("div.vide__boite", {},
          el("h3", {}, "Aucune mission pour l'instant"),
          el("p", {}, "Des scénarios pas à pas (une suite de requêtes à écrire) arriveront avec le contenu."))));
}

function ecranMission(rafraichir) {
  const m = Mission.courante, etape = Mission.etapeCourante();
  const sortie = el("div.resultat", { "aria-live": "polite" });
  const retourZone = el("div");
  const editeur = editeurSQL({
    valeur: m.brouillon || "", etiquette: "Requête de l'étape",
    surChange: v => Mission.sauvegarderBrouillon(v),
    surExecuter: () => { sortie.replaceChildren(...blocsExecution(Moteur.executer(editeur.valeur()))); },
    surVerifier: () => verifier()
  });
  function verifier() {
    const res = Mission.verifier(editeur.valeur());
    retourZone.replaceChildren(carteRetour({ type: "requete" }, res, {}));
    if (m.etat === "bilan") rafraichir();
    else if (res.reussi) { editeur.definir(""); rafraichir(); }
  }
  return el("div", {},
    el("header.entete", {}, el("h1", {}, m.def.titre)),
    el("div.contexte", {}, el("b", {}, `Étape ${m.etape + 1} / ${m.def.etapes.length}`), el("p", {}, etape.consigne)),
    editeur.element,
    el("div.sql-barre", {},
      el("button.btn", { type: "button", onclick: () => { sortie.replaceChildren(...blocsExecution(Moteur.executer(editeur.valeur()))); } }, "Exécuter"),
      el("button.btn.btn--fort", { type: "button", onclick: verifier }, "Vérifier")),
    sortie, retourZone,
    el("button.btn.btn--nu", { type: "button", onclick: () => { Mission.quitter(); rafraichir(); } }, "Quitter la mission"));
}

Vues.missions = () => {
  const v = el("div.vue");
  const zone = el("div");
  const rafraichir = () => zone.replaceChildren(Mission.courante ? ecranMission(rafraichir) : listeMissions(rafraichir));
  rafraichir();
  v.append(zone);
  return v;
};

Vues.bacasable = () => pageBacASable();

/* ── Exercice standalone (#/exercice/<id>), hors Session — même mécanique, en dehors d'une série ─────────── */
const EnCours = new Map();
function etatEnCours(ex) {
  if (!EnCours.has(ex.id)) EnCours.set(ex.id, { brouillon: null, indices: 0, dernier: null, reponse: null });
  return EnCours.get(ex.id);
}

function pageExercice(ex) {
  nouvelleBase();
  const e = etatEnCours(ex);
  const type = TYPES_EXERCICE[ex.type];
  const rappels = [];
  const zoneRetour = el("div", { id: "zone-retour" });
  const zoneEssaiConteneur = el("div");
  const pied = el("div.exo__pied");
  const suivantEx = CONTENU.exercices[CONTENU.exercices.findIndex(x => x.id === ex.id) + 1] || null;

  let erreurAuteur = null;
  try { if (ex.type === "predire") Attendus.predire(ex); else if (ex.solution) Attendus.de(ex); } catch (err) { erreurAuteur = err.message; }

  const hStore = () => Store.etat.exercices[ex.id] || { tentatives: 0, reussites: 0 };
  const reussi = () => hStore().reussites > 0;
  let panneau = null;

  const majPied = () => {
    const boutonSuivant = e.dernier && e.dernier.statut !== "non-evalue" && (reussi() || ex.type === "qcm" || ex.type === "predire") && suivantEx
      ? el("a.btn.btn--fort", { href: `#/exercice/${suivantEx.id}`, id: "exo-suivant" }, "Exercice suivant →") : null;
    pied.replaceChildren(el("a.btn", { href: "#/exercices" }, "← Tous les exercices"), ...(boutonSuivant ? [boutonSuivant] : []));
  };
  const afficherRetour = retour => {
    zoneRetour.replaceChildren(carteRetour(ex, retour, { xp: retour.xp, progres: retour.progres }));
    zoneEssaiConteneur.replaceChildren();
    if (retour.statut !== "non-evalue" && (ex.type === "qcm" || ex.type === "predire")) zoneEssaiConteneur.append(zoneEssai(ex, api));
    if (retour.reussi && panneau) panneau.remove();
    majPied();
  };

  const api = {
    get brouillon() { return e.brouillon; },
    surBrouillon: v => { e.brouillon = v; },
    reponsePrecedente: e.reponse,
    surRetour: fn => rappels.push(fn),
    repondre(r) {
      const res = type.valider(ex, r);
      let retour;
      if (res.compte) {
        e.reponse = r;
        const maj = noteReponse(ex, res, e.indices);
        if (maj.certifs.length) maj.certifs.forEach(c => Toast.afficher(`Certification obtenue : ${c.nom}`, "accent"));
        retour = { ...res, tentatives: hStore().tentatives, indices: e.indices, xp: maj.xp, progres: ligneProgres(ex, res, maj) };
      } else {
        retour = { ...res, tentatives: hStore().tentatives, indices: e.indices };
      }
      e.dernier = retour;
      rappels.forEach(fn => fn(retour));
      afficherRetour(retour);
      const boutonSuite = retour.reussi ? document.getElementById("exo-suivant") : null;
      if (boutonSuite) boutonSuite.focus(); else zoneRetour.scrollIntoView({ block: "nearest" });
      return retour;
    }
  };

  const bloc = erreurAuteur
    ? el("div.erreur-sql", { role: "alert" }, el("b", {}, "Exercice mal écrit"), el("pre", {}, erreurAuteur))
    : type.rendre(ex, api);
  if (!reussi()) panneau = panneauIndices(ex, e);
  if (e.dernier) { rappels.forEach(fn => fn(e.dernier)); afficherRetour(e.dernier); }
  majPied();

  return el("div.vue", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Exercice de démonstration"), el("h1", {}, ex.titre)),
    el("div.exo__meta", {}, el("span.puce", {}, LIBELLE_TYPE[ex.type]),
      ex.niveau ? el("span.puce", {}, ex.niveau) : null,
      ex.competence ? el("span.puce", {}, (CONTENU.competences.find(c => c.id === ex.competence) || {}).nom || ex.competence) : null),
    el("div.exo__question", {}, ex.question),
    ex.consigne ? el("div.exo__consigne", {}, ex.consigne) : null,
    bloc, panneau, zoneRetour, zoneEssaiConteneur, pied);
}

function pageExerciceDepuisHash(chemin) {
  const id = decodeURIComponent(chemin.slice("/exercice/".length));
  const ex = CONTENU.exercices.find(x => x.id === id);
  return ex ? pageExercice(ex) : Vues.exercices();
}

/* ── Routeur : table de routes à la Classe'R, plus le cas spécial /exercice/<id> (identifiant dynamique) ───── */
const Routeur = (() => {
  const routes = [];
  const PREFIXE_EXERCICE = "/exercice/";

  function enregistrer(r) { routes.push(r); }

  function courante() {
    const h = (location.hash || "").slice(1) || "/accueil";
    if (h.startsWith(PREFIXE_EXERCICE)) return { chemin: h, titre: "Exercice", vue: "__exercice__", nav: false };
    return routes.find(r => r.chemin === h) || routes.find(r => r.chemin === "/accueil");
  }

  function rendre() {
    const route = courante();
    document.title = `${route.titre} — Requêt'R`;
    let page;
    try {
      page = route.vue === "__exercice__" ? pageExerciceDepuisHash(route.chemin) : Vues[route.vue]();
    } catch (err) {
      console.error(err);
      page = el("div.erreur-sql", { role: "alert" }, el("b", {}, "Cet écran n'a pas pu s'afficher"), el("pre", {}, String(err && err.message || err)));
    }
    const zone = document.getElementById("zone-contenu");
    zone.replaceChildren(page);
    document.querySelectorAll(".rail__lien[data-route]").forEach(a => {
      if (a.dataset.route === route.chemin) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    Explorateur.majBouton();
    window.scrollTo(0, 0);
    zone.focus({ preventScroll: true });
  }

  function aller(chemin) {
    if (location.hash === "#" + chemin) rendre(); else location.hash = chemin;
  }

  function construireRail() {
    const liens = routes.filter(r => r.nav).map(r =>
      el("a.rail__lien", { href: "#" + r.chemin, "data-route": r.chemin }, icone(r.icone), el("span", {}, r.court || r.titre)));
    return el("aside.rail", {},
      el("div.rail__marque", {}, el("div.logo", {}, "R"), el("div.rail__nom", {}, "Requêt'R")),
      el("nav.rail__nav", { "aria-label": "Navigation principale" }, liens, el("div.rail__sep"), Explorateur.bouton()),
      el("div.rail__bas", {}, el("div.tres-muet", { style: "font-size:11.5px" }, "Apprendre le SQL en pratiquant")));
  }

  return { enregistrer, courante, rendre, aller, construireRail };
})();

Routeur.enregistrer({ chemin: "/accueil", titre: "Accueil", vue: "accueil", icone: "accueil", nav: true });
Routeur.enregistrer({ chemin: "/exercices", titre: "Exercices", vue: "exercices", icone: "exercices", nav: true });
Routeur.enregistrer({ chemin: "/lecons", titre: "Leçons", vue: "lecons", icone: "lecons", nav: true });
Routeur.enregistrer({ chemin: "/missions", titre: "Missions", vue: "missions", icone: "missions", nav: true });
Routeur.enregistrer({ chemin: "/bac-a-sable", titre: "Bac à sable", vue: "bacasable", icone: "bacasable", nav: true, court: "Essais" });
Routeur.enregistrer({ chemin: "/progression", titre: "Progression", vue: "progression", icone: "progression", nav: true, court: "Progrès" });
Routeur.enregistrer({ chemin: "/reglages", titre: "Réglages", vue: "reglages", icone: "reglages", nav: true });
Routeur.enregistrer({ chemin: "/fiche", titre: "Fiche", vue: "fiche", icone: "lecons", nav: false });

/* ── Démarrage (D047) : ordre de Classe'R — charger, normaliser, thème, série du jour, coquille, écouteurs,
   premier rendu, onboarding si besoin. ─────────────────────────────────────────────────────────────────── */
async function demarrer() {
  Store.charger();
  Packs.normaliser();
  appliquerTheme();
  Progression.majSerie();

  document.getElementById("app").replaceChildren(
    el("a.saut", { href: "#", onclick: ev => { ev.preventDefault(); document.getElementById("zone-contenu").focus(); } }, "Aller au contenu"),
    Routeur.construireRail(),
    el("main.principal", {}, el("div.contenu", { id: "zone-contenu", tabindex: "-1" })));
  document.addEventListener("keydown", ev => { if (ev.key === "Escape" && Explorateur.estOuvert()) Explorateur.fermer(); });

  try {
    await Moteur.initialiser();
    window.addEventListener("hashchange", Routeur.rendre);
    Routeur.rendre();
    if (!Store.etat.profil.onboardingFait) onboarding();
  } catch (err) {
    console.error(err);
    document.getElementById("zone-contenu").replaceChildren(
      el("div.erreur-sql", { role: "alert" }, el("b", {}, "SQLite n'a pas pu démarrer"), el("pre", {}, String(err && err.message || err))));
  }
}

/* Garde Node (verifier-progression.mjs charge ce fichier sans navigateur, pour Mission/Session en isolation,
 *  comme D038 le fait déjà pour exercices.js : aucun fichier de src/ ne doit planter au chargement sous Node). */
if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", demarrer);
