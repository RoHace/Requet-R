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
    return el("div.segment.segment--libre", { role: "group", "aria-label": "Filtrer par palier" },
      el("button", { type: "button", "aria-pressed": String(niv === "tout"), onclick: () => choisir("tout") }, "Tous"),
      PALIERS.map(p => el("button", { type: "button", "aria-pressed": String(niv === p.id), onclick: () => choisir(p.id) }, p.titre)));
  }
};

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
  if (!juste && !neutre && (ex.type === "requete" || ex.type === "corriger") && (v.tentatives || 0) >= 2 && meta.reveler)
    corps.push(el("div.retour__reveler", {},
      el("p", {}, "Vous n'avez pas trouvé après plusieurs essais : vous pouvez voir la requête attendue."),
      el("button.btn.btn--fort", { type: "button", onclick: meta.reveler }, "Voir la requête attendue")));
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

/* ── Parcours : chapitres (leçon puis exercices) — câblé au lot 6 (D050/D047 n'en posaient que la structure).
   `repondre` reprend exactement la mécanique de Session.repondre (XP, maîtrise, certifications, D046) ; les deux
   partagent ensuite le même écran de question, `rendreQuestion` ci-dessous. ──────────────────────────────────── */
const Parcours = {
  courant: null,
  chapitre(id) { return CHAPITRES.find(c => c.id === id) || null; },
  exercicesDe(ch) { return ch.exercices.map(id => CONTENU.exercices.find(e => e.id === id)).filter(Boolean); },
  avancement(ch) {
    const liste = Parcours.exercicesDe(ch);
    const faits = liste.filter(ex => (Store.etat.exercices[ex.id] || {}).reussites > 0).length;
    return { faits, total: liste.length, part: liste.length ? faits / liste.length : 0 };
  },
  /* Un chapitre qui porte des exercices est terminé quand ils sont tous réussis. Un chapitre de culture générale
     n'en a aucun (l'index, l'écriture, la CTE récursive du palier 5) : il est terminé dès que sa leçon a été
     ouverte, sinon il resterait « en cours » pour toujours et « Reprendre » n'avancerait plus (arbitrage A). */
  termine(ch) {
    const a = Parcours.avancement(ch);
    if (a.total > 0) return a.faits === a.total;
    return !!(Store.etat.chapitres[ch.id] || {}).leconVue;
  },
  suivantConseille() { return CHAPITRES.find(c => !Parcours.termine(c)) || null; },
  ouvrir(id) {
    const ch = Parcours.chapitre(id);
    if (!ch) return false;
    const liste = Parcours.exercicesDe(ch);
    const avantChapitre = {};
    [...new Set(liste.map(e => e.competence).filter(Boolean))].forEach(c => { avantChapitre[c] = Progression.maitrise(c).brute; });
    Parcours.courant = {
      ch, etape: "lecon", index: 0, liste, reussites: 0, xp: 0, certifs: [], indices: 0, aidesUtilisees: 0,
      etat: "question", dernier: null, avantChapitre
    };
    return true;
  },
  commencer() { const p = Parcours.courant; if (!p || !p.liste.length) return; p.etape = "exercices"; p.index = 0; p.etat = "question"; p.dernier = null; p.indices = 0; },

  repondre(reponse) {
    const p = Parcours.courant, ex = p.liste[p.index];
    const res = TYPES_EXERCICE[ex.type].valider(ex, reponse);
    const h = () => (Store.etat.exercices[ex.id] || { tentatives: 0 }).tentatives;
    if (res.compte) {
      const maj = noteReponse(ex, res, p.indices);
      p.xp += maj.xp;
      if (res.reussi) p.reussites++;
      if (p.indices > 0) p.aidesUtilisees++;
      p.certifs.push(...maj.certifs);
      if (maj.certifs.length) maj.certifs.forEach(c => Toast.afficher(`Certification obtenue : ${c.nom}`, "accent"));
      p.dernier = { ...res, tentatives: h(), indices: p.indices, xp: maj.xp, progres: ligneProgres(ex, res, maj) };
    } else {
      p.dernier = { ...res, tentatives: h(), indices: p.indices };
    }
    p.etat = "retour";
    return p.dernier;
  },

  suivant() {
    const p = Parcours.courant;
    if (p.index < p.liste.length - 1) { p.index++; p.etat = "question"; p.dernier = null; p.indices = 0; }
    else p.etape = "bilan";
  },
  quitter() { Parcours.courant = null; }
};

/* ── Mission (D048, corrigée au lot 11 par D069) : la mécanique (étapes, étoiles selon les indices, brouillon et
   reprise), une seule forme de validation — chaque étape se vérifie comme un exercice `requete` (Comparateur),
   jamais par un validateur de feuille de calcul. Le lot 11 a exercé cette mécanique avec des missions factices
   AVANT d'écrire la moindre mission (règle de D068) : sept défauts en sont sortis, tous corrigés ici, chacun
   couvert par un critère de verifier-progression.mjs (MI-08 à MI-14). ──────────────────────────────────────── */
const Mission = (() => {
  const cache = new Map();

  /** Le jeu de données d'une étape : le sien, sinon celui de la mission, sinon la boutique (D068).
   *  Même convention que l'Autotest (`etape.jeu || mission.jeu`), pour qu'un contenu validé vert soit jouable. */
  const porteurJeu = (def, etape) => ({ jeu: (etape && etape.jeu) || (def && def.jeu) });

  /** Les compétences créditées par une étape : les siennes, sinon celles de la mission (D069).
   *  Une étape est un exercice du point de vue de la progression, comme elle l'est déjà de sa validation. */
  const competencesDe = (def, etape) =>
    (etape && Array.isArray(etape.competences) && etape.competences.length) ? etape.competences : (def.competences || []);

  function resultatEtape(def, etape) {
    const cle = `${def.id}:${def.etapes.indexOf(etape)}`;
    if (!cache.has(cle)) {
      /* Le jeu de l'étape, pas le seed principal en dur : sans cela une étape « jeu: export » calculait sa
         référence sur la boutique et partait en exception non rattrapée (défaut relevé au lot 11). */
      const r = Moteur.executerIsole(etape.solution, { seed: seedDe(porteurJeu(def, etape)), plafond: false });
      if (r.erreur) throw new Error(`l'étape de la mission ${def.id} est mal écrite : ${r.erreur}`);
      cache.set(cle, r.jeux[r.jeux.length - 1]);
    }
    return cache.get(cle);
  }

  /** Avancement d'une mission EN COURS : étape, brouillon, indices consommés, solution éventuellement révélée.
   *  Les indices sont persistés (D069) : sans eux, quitter puis reprendre remettait le compteur à zéro et les
   *  trois étoiles se regagnaient après avoir affiché toutes les solutions.
   *  Une mission déjà `terminee` n'est JAMAIS réécrite : sinon quitter son bilan y reposait une `etape`, et la
   *  relancer repartait de sa dernière étape — une seule requête suffisait à la « refaire ». */
  function enregistrerAvancement(m) {
    Store.modifier(e => {
      const precedent = e.missions[m.def.id] || {};
      if (precedent.statut === "terminee") return;
      e.missions[m.def.id] = {
        ...precedent, statut: "encours",
        etape: m.etape, brouillon: m.brouillon,
        indicesTotal: m.indicesTotal, solutionRevelee: !!m.solutionRevelee
      };
    });
  }

  const API = {
    courante: null,
    porteurJeu,
    competencesDe,

    demarrer(id) {
      const def = CONTENU.missions.find(m => m.id === id);
      if (!def) return false;
      /* Une mission sans étape ne doit pas partir en exception dans Indices.pour (étape `undefined`) :
         l'écran restait figé sans rien dire. C'est une erreur d'auteur, et c'est l'Autotest qui la refuse
         (une mission en porte au moins trois, D069) : ce garde-fou n'existe que pour qu'une définition
         malformée dégrade en silence au lieu de jeter. `console.warn` et non un Toast, pour la même raison
         que `Store.charger` : le message s'adresse à l'auteur, pas à l'apprenant, qui n'en peut rien. */
      if (!Array.isArray(def.etapes) || !def.etapes.length) {
        console.warn(`Mission ${def.id} : aucune étape, impossible de la démarrer.`);
        return false;
      }
      const sauvegarde = Store.etat.missions[id];
      /* Seule une mission EN COURS reprend où elle en était ; une mission terminée qu'on relance repart de
         l'étape 1, sans indice, et garde son palmarès (D069). */
      const reprise = sauvegarde && sauvegarde.statut === "encours" ? sauvegarde : null;
      API.courante = {
        def, etape: Math.min((reprise && reprise.etape) || 0, def.etapes.length - 1),
        indices: 0, indicesTotal: (reprise && reprise.indicesTotal) || 0,
        solutionRevelee: !!(reprise && reprise.solutionRevelee),
        etoiles: 0, certifs: [], etat: "encours", retour: null,
        brouillon: (reprise && reprise.brouillon) || ""
      };
      return true;
    },

    etapeCourante() { const m = API.courante; return m ? m.def.etapes[m.etape] : null; },

    sauvegarderBrouillon(texte) {
      const m = API.courante; if (!m) return;
      m.brouillon = texte;
      enregistrerAvancement(m);
    },

    /** Une seule forme de validation, quelle que soit l'étape : la requête de l'apprenant contre celle de
     *  référence de l'étape, par le même Comparateur qu'un exercice `requete` (D048) — et sur le jeu de données
     *  de l'étape (D068). Une étape réussie crédite ses compétences comme un exercice (D069) ; l'XP et les
     *  étoiles restent portées par la fin de mission. */
    verifier(sql) {
      const m = API.courante, etape = API.etapeCourante();
      const res = Comparateur.evaluer({
        attendu: resultatEtape(m.def, etape),
        rapport: Moteur.executerIsole(sql, { seed: seedDe(porteurJeu(m.def, etape)) }),
        options: etape.comparer || {}, sql, base: CONTENU.base
      });
      m.retour = res;
      if (!res.reussi) return res;
      /* Crédit de maîtrise de l'étape : mêmes formules qu'un exercice (Indices.facteurMaitrise, D046), et AUCUNE
         XP ici — elle est versée une seule fois, au bilan, pour qu'une mission ne vaille jamais plus qu'une
         série de même longueur (D069). Les certifications déclenchées en route sont gardées pour le bilan. */
      const liste = Indices.pour(etape);
      m.certifs = m.certifs.concat(Progression.enregistrerResultat({
        competences: competencesDe(m.def, etape), reussi: true,
        difficulte: m.def.difficulte || 1, xp: 0,
        facteur: Indices.facteurMaitrise(m.indices, liste)
      }));
      m.indices = 0;
      if (m.etape < m.def.etapes.length - 1) { m.etape++; API.sauvegarderBrouillon(""); }
      else API.terminer();
      return res;
    },

    /** Un indice de plus sur l'étape courante. `liste` (le `Indices.pour` de l'étape) sert à reconnaître la
     *  solution révélée, qui coûte comme pour un exercice (D046) : XP annulée, facteur de maîtrise plafonné. */
    indice(liste) {
      const m = API.courante; if (!m) return;
      if (Array.isArray(liste) && liste[m.indices] && liste[m.indices].revele) m.solutionRevelee = true;
      m.indices++; m.indicesTotal++;
      enregistrerAvancement(m);
    },

    terminer() {
      const m = API.courante, def = m.def;
      m.etoiles = m.indicesTotal === 0 ? 3 : m.indicesTotal <= 2 ? 2 : 1;
      /* Formule de Classe'R sur le nombre d'indices (D048), avec le durcissement de D069 : une solution révélée
         sur une seule étape annule l'XP et plafonne le facteur, comme D046 le fait pour un exercice — sinon
         afficher la solution de chaque étape laissait encore 2 étoiles et une maîtrise créditée à 0,9. */
      const facteur = m.solutionRevelee ? 0.2 : Math.max(0.3, 1 - 0.1 * m.indicesTotal);
      m.xp = m.solutionRevelee ? 0 : Math.round(30 * (def.difficulte || 1) * facteur);
      /* L'ORDRE COMPTE : les quatre certifications de mission (D044) lisent Store.etat.missions. Le statut
         « terminee » doit donc être écrit AVANT verifierCertifications, sinon elles ne tombent jamais au bilan
         et arrivent plus tard, sur un exercice sans rapport. Le défaut est HÉRITÉ de Classe'R, qui appelle
         lui aussi `enregistrerResultat` avant son `Store.modifier` (`Reference/classer-v2.html:8543-8556`)
         pour les mêmes quatre conditions : le portage fidèle l'a recopié, et seul du contenu réel l'a montré.
         `etoiles` est le MEILLEUR passage, comme chez Classe'R (`Math.max(enr.etoiles || 0, m.etoiles)`,
         ligne 8553) — le portage en avait fait le dernier passage, si bien qu'un second essai moins bon
         dégradait le palmarès. `meilleurScore` (champ propre à Requêt'R) est tenu à la même valeur. */
      Store.modifier(e => {
        const precedent = e.missions[def.id] || {};
        const meilleur = Math.max(m.etoiles, precedent.etoiles || 0, precedent.meilleurScore || 0);
        e.missions[def.id] = {
          statut: "terminee", etoiles: meilleur, indicesUtilises: m.indicesTotal,
          meilleurScore: meilleur, termineeLe: new Date().toISOString()
        };
      });
      /* `competences: []` : la maîtrise a déjà été créditée étape par étape (D069) ; ce dernier appel ne porte
         que l'XP, la série du jour et les certifications. */
      m.certifs = m.certifs.concat(Progression.enregistrerResultat({
        competences: [], reussi: true, difficulte: def.difficulte || 1, xp: m.xp, facteur, idMission: def.id
      }));
      m.etat = "bilan";
    },

    /** Refaire une mission : on repart de l'étape 1 sans indice, SANS effacer le palmarès — le `delete` d'avant
     *  faisait perdre les étoiles déjà gagnées dès qu'on abandonnait la reprise, et laissait un état incohérent
     *  avec la certification « Maître d'œuvre », déjà obtenue et jamais retirée (D044).
     *  Conséquence assumée (D069) : une mission terminée qu'on refait n'est pas reprenable — son avancement
     *  n'est pas sauvé, pour ne pas écraser à moitié le palmarès qu'on vient justement de conserver. */
    recommencer(id) {
      Store.modifier(e => {
        const precedent = e.missions[id];
        if (precedent && precedent.statut === "terminee")
          e.missions[id] = {
            statut: "terminee", etoiles: precedent.etoiles, indicesUtilises: precedent.indicesUtilises,
            meilleurScore: precedent.meilleurScore || precedent.etoiles
          };
        else delete e.missions[id];
      });
      cache.clear();
      return API.demarrer(id);
    },

    quitter() { if (API.courante) enregistrerAvancement(API.courante); API.courante = null; }
  };
  return API;
})();

/* ── Onboarding (D049) : question factuelle (« avez-vous déjà écrit une requête SQL ? »), pas une auto-évaluation
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
      el("div.champ", {}, el("label.champ__lib", {}, "Avez-vous déjà écrit une requête SQL ?"), boiteOptions)),
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

/** Tuile d'accès (D057 : fidélité à Classe'R) — toujours une puce : « Ouvrir » (accent) si activée, « Bientôt »
 *  sinon. Même problème que la liste d'exercices (D056) : sans cette puce, rien n'indique qu'on peut cliquer. */
function carteAcces(titre, desc, href, desactive = false) {
  const tete = el("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:10px" },
    el("h3", {}, titre),
    desactive ? el("span.puce", {}, "Bientôt") : el("span.puce.puce--accent", {}, "Ouvrir"));
  const corps = el("p.muet", { style: "font-size:13px;margin-top:6px" }, desc);
  if (desactive) return el("button.carte.carte--action", { type: "button", disabled: true }, tete, corps);
  return el("a.carte.carte--action", { href }, tete, corps);
}

/** Ligne détaillée d'une compétence (D057, repris de Classe'R `ligneCompetence`) : puce « Validée », série sans
 *  indice (pips), érosion en cours, bouton de reprise, et le compte d'exercices réussis — utilisée par l'accueil
 *  (« À retravailler ») et par l'écran Progression. */
function ligneCompetence(c) {
  const m = c.effective !== undefined ? c : { ...c, ...Progression.maitrise(c.id) };
  const exos = CONTENU.exercices.filter(x => x.competence === c.id && Contenu.accessible(x));
  const reussis = exos.filter(x => ((Store.etat.exercices[x.id] || {}).reussites || 0) > 0).length;
  const restants = exos.length - reussis;
  const etat = Store.etat.competences[c.id] || {};
  const eff = Math.round(m.effective);
  const efface = m.jamaisTravaillee ? 0 : Math.max(0, (m.brute || 0) - eff);
  const valide = !m.jamaisTravaillee && eff >= 100;
  const serie = Math.min(etat.serie || 0, PROGRESSION_CONFIG.serieConsolidation);
  const jours = etat.derniereActivite ? Math.floor((Date.now() - new Date(etat.derniereActivite).getTime()) / 86400000) : null;
  const aReprendre = m.jamaisTravaillee || efface > 0 || m.effective < PROGRESSION_CONFIG.seuilRevision;

  const meta = [];
  if (valide) meta.push(el("span.puce.puce--ok", {}, "Validée"));
  else if (!m.jamaisTravaillee) meta.push(el("span.competence__serie", {}, "Sans indice d'affilée", pips(serie, PROGRESSION_CONFIG.serieConsolidation)));
  if (efface > 0) meta.push(el("span.puce.puce--erosion", {}, `S'efface : −${efface} pts` + (jours !== null ? ` après ${jours} jours sans pratique` : "")));
  if (aReprendre) meta.push(el("button.btn.btn--nu.competence__reprise", { type: "button", onclick: () => {
    if (!Session.courante && !Session.demarrer(c.id, 5)) { Toast.afficher("Aucun exercice disponible pour cette compétence."); return; }
    Routeur.aller("/exercices");
  } }, m.jamaisTravaillee ? "Commencer" : "S'entraîner"));

  return el("div.competence", {},
    el("div.competence__tete", {},
      el("div.competence__nom", {}, m.nom),
      el("div.competence__val", {}, m.jamaisTravaillee ? "non travaillée" : `${eff} %`)),
    cellules(eff, 10, false, { fantome: efface > 0 ? m.brute : undefined, ok: valide }),
    meta.length ? el("div.competence__meta", {}, meta) : null,
    el("div.competence__desc", {},
      exos.length ? `${m.desc} · ${reussis} exercice(s) réussi(s) sur ${exos.length}` + (restants ? ` — ${restants} jamais réussi(s)` : "") : m.desc));
}

Vues.accueil = () => {
  const niv = Progression.niveau();
  const pf = Progression.pointsFaibles(3);
  const prochain = Parcours.suivantConseille();
  const xpJour = Progression.xpDuJour();
  const exporteDepuis = Store.etat.dernierExport ? (Date.now() - new Date(Store.etat.dernierExport).getTime()) / 86400000 : Infinity;
  const reprendre = () => { Parcours.ouvrir(prochain.id); Routeur.aller("/lecons"); };
  const jours = Store.etat.serie.jours;
  const libSerie = jours <= 1 ? "jour de pratique" : "jours d'affilée";
  return el("div.vue", {},
    el("header.accueil", {},
      el("span.puce.puce--serie", {}, `${jours} ${libSerie}`),
      el("div.accueil__tete", {},
        el("div.accueil__mot", {},
          el("h1", {}, `Bonjour${Store.etat.profil.prenom ? ", " + Store.etat.profil.prenom : ""} !`),
          el("p.muet", {}, prochain
            ? `Prochain arrêt : ${prochain.titre}.`
            : "Tous les chapitres sont terminés. Les exercices et les missions vous attendent pour approfondir.")),
        prochain
          ? el("button.btn.btn--fort", { type: "button", onclick: reprendre }, `Continuer : ${prochain.titre}`)
          : null)),
    el("div.grille.grille--3", {},
      el("div.carte.stat", {},
        el("div.stat__sur", {}, "Niveau"),
        el("div.stat__val", {}, niv.niveau),
        el("div.stat__lib", {}, niv.titre),
        cellules(niv.pourcent, 10)),
      el("div.carte.stat", {},
        el("div.stat__sur", {}, "XP aujourd'hui"),
        el("div.stat__val", {}, `${xpJour} / ${PROGRESSION_CONFIG.objectifQuotidien}`),
        cellules(Math.min(100, xpJour / PROGRESSION_CONFIG.objectifQuotidien * 100), 10)),
      el("div.carte.stat", {},
        el("div.stat__sur", {}, libSerie),
        el("div.stat__val", {}, jours))),
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
      el("div.section__titre", {},
        el("h2", {}, "À retravailler"),
        el("div.accueil__revision", {},
          pf[0] && pf[0].effective < 100
            ? el("button.btn.btn--fort", { type: "button", onclick: () => {
                if (!Session.courante && !Session.demarrer(pf[0].id, 5)) { Toast.afficher("Aucun exercice disponible pour cette compétence."); return; }
                Routeur.aller("/exercices");
              } }, `Réviser · ${pf[0].nom}`)
            : null,
          el("a", { href: "#/progression", style: "font-size:13px" }, "Tout voir"))),
      el("div.carte", {}, pf.map(c => ligneCompetence(c)))) : null);
};

function ecranChoix(rafraichir) {
  const exosAccessibles = CONTENU.exercices.filter(Contenu.accessible);
  const parCompetence = new Map();
  exosAccessibles.forEach(ex => { if (!ex.competence) return; (parCompetence.get(ex.competence) || parCompetence.set(ex.competence, []).get(ex.competence)).push(ex); });
  const total = exosAccessibles.length;
  const lancer = competence => { if (Session.demarrer(competence, 5)) rafraichir(); else Toast.afficher("Aucun exercice disponible pour l'instant."); };
  const citesParChapitre = new Set(CHAPITRES.flatMap(ch => ch.exercices));
  const orphelins = exosAccessibles.filter(ex => !citesParChapitre.has(ex.id));
  return el("div", {},
    el("header.entete", {},
      el("div.entete__sur", {}, "Exercices"),
      el("h1", {}, "Exercices"),
      el("p", {}, "Tous les exercices, regroupés par compétence ou par palier. Pour un parcours guidé, leçon par leçon, voir « Leçons ».")),
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
      el("div.section__titre", {}, el("h2", {}, "Tous les exercices, par chapitre")),
      CHAPITRES.map(ch => {
        const exos = Parcours.exercicesDe(ch).filter(Contenu.accessible);
        return exos.length ? el("div.section", {}, el("div.section__titre", {}, el("h2", {}, ch.titre)), el("div.liste-exos", {}, exos.map(carteExercice))) : null;
      }),
      orphelins.length ? el("div.section", {}, el("div.section__titre", {}, el("h2", {}, "Autres exercices")), el("div.liste-exos", {}, orphelins.map(carteExercice))) : null));
}

/** Écran de question commun à une série libre (Session) et à un chapitre (Parcours) : les deux exposent le même
 *  état (`liste`, `index`, `indices`, `dernier`) et les mêmes trois actions (répondre, passer à la suite, quitter) —
 *  seuls le libellé du bouton de sortie et les trois callbacks diffèrent (`ctrl`). */
function rendreQuestion(etat, ctrl, rafraichir) {
  const ex = etat.liste[etat.index];
  /* La base vivante doit porter le jeu de données de l'exercice, sinon « Exécuter » travaillerait sur l'autre jeu
     (D068). On ne reconstruit que si le jeu change : une série libre sur la boutique garde la base telle quelle,
     exactement comme avant ce lot. */
  if (Moteur.etat.jeu !== jeuDe(ex)) nouvelleBase(seedDe(ex));
  const zoneRetour = el("div", { id: "zone-retour" });
  const zoneEssaiConteneur = el("div");
  const suite = el("div.exo__pied", {});
  const rappels = [];
  const majSuite = () => {
    remplacerEnfants(suite,
      etat.dernier && etat.dernier.statut !== "non-evalue"
        ? el("button.btn.btn--fort", { type: "button", onclick: () => { ctrl.suivant(); rafraichir(); } },
            etat.index < etat.liste.length - 1 ? "Question suivante →" : "Voir le bilan →")
        : null,
      el("button.btn.btn--nu", { type: "button", onclick: () => { ctrl.quitter(); rafraichir(); } }, ctrl.libelleQuitter));
  };
  const afficherRetour = retour => {
    const reveler = panneau && etat.indices < panneau.totalIndices ? () => { panneau.reveler(); afficherRetour(retour); } : null;
    zoneRetour.replaceChildren(carteRetour(ex, retour, { xp: retour.xp, progres: retour.progres, reveler }));
    zoneEssaiConteneur.replaceChildren();
    if (retour.statut !== "non-evalue" && (ex.type === "qcm" || ex.type === "predire")) zoneEssaiConteneur.append(zoneEssai(ex, api));
    if (panneau && retour.reussi) panneau.remove();
    majSuite();
  };
  const api = {
    brouillon: null, surBrouillon() {}, reponsePrecedente: null,
    surRetour: fn => rappels.push(fn),
    repondre(r) {
      const retour = ctrl.repondre(r);
      rappels.forEach(fn => fn(retour));
      afficherRetour(retour);
      return retour;
    }
  };
  const bloc = TYPES_EXERCICE[ex.type].rendre(ex, api);
  let panneau = etat.dernier ? null : panneauIndices(ex, etat);
  if (etat.dernier) afficherRetour(etat.dernier); else majSuite();

  return el("div", {},
    el("div.serie", {}, el("div.serie__cellules", {}, cellules(Math.round(100 * etat.index / etat.liste.length))), el("div.serie__compte", {}, `${etat.index + 1} / ${etat.liste.length}`)),
    el("header.entete", {}, el("h1", {}, ex.titre)),
    el("div.exo__question", {}, ex.question),
    ex.consigne ? el("div.exo__consigne", {}, ex.consigne) : null,
    bloc, panneau, zoneRetour, zoneEssaiConteneur, suite);
}

function ecranSerie(rafraichir) {
  const s = Session.courante;
  if (s.etat === "bilan") return ecranBilan(rafraichir);
  return rendreQuestion(s, { repondre: r => Session.repondre(r), suivant: Session.suivant, quitter: Session.quitter, libelleQuitter: "Abandonner la série" }, rafraichir);
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
      el("div.carte.stat", {}, el("div.stat__sur", {}, "XP total"), el("div.stat__val", {}, Store.etat.xp)),
      el("div.carte.stat", {},
        el("div.stat__sur", {}, "Niveau"),
        el("div.stat__val", {}, niv.niveau),
        el("div.stat__lib", {}, niv.titre),
        cellules(niv.pourcent, 10)),
      el("div.carte.stat", {},
        el("div.stat__sur", {}, "Exercices réussis"),
        el("div.stat__val", {}, Object.values(Store.etat.exercices).reduce((n, h) => n + h.reussites, 0)))),
    el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Compétences")),
      el("div.carte", {}, comps.map(c => ligneCompetence(c)))),
    el("div.section", {},
      el("div.section__titre", {},
        el("h2", {}, "Certifications"),
        el("span.tres-muet", { style: "font-size:13px" }, `${Object.keys(Store.etat.certifications).length} / ${CONTENU.certifications.length}`)),
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

/** Sommaire des chapitres (D047/D050), sur le modèle de Classe'R : chapitres terminés, chapitre conseillé, puis
 *  la liste complète avec son avancement. Inerte jusqu'au lot 6 ; câblé avec l'arrivée du contenu. */
function ecranListeChapitres(rafraichir) {
  const faits = CHAPITRES.filter(Parcours.termine).length;
  const conseille = Parcours.suivantConseille();
  return el("div", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Parcours guidé"), el("h1", {}, "Leçons"),
      el("p", {}, "Chaque chapitre présente une notion, puis les exercices qui l'appliquent. Les réussites comptent pour votre progression, comme partout ailleurs.")),
    CHAPITRES.length ? el("div.carte", {},
      el("div.bilan__ligne", {}, el("span", {}, "Chapitres terminés"), el("span.mono", {}, `${faits} sur ${CHAPITRES.length}`)),
      el("div", { style: "margin-top:10px" }, cellules(faits / CHAPITRES.length * 100, CHAPITRES.length)),
      conseille
        ? el("button.btn.btn--fort", { type: "button", style: "margin-top:16px", onclick: () => { Parcours.ouvrir(conseille.id); rafraichir(); } },
            faits ? `Reprendre : ${conseille.titre}` : `Commencer : ${conseille.titre}`)
        : el("p.muet", { style: "font-size:13.5px;margin-top:12px" }, "Tous les chapitres sont terminés. Les exercices et les missions vous attendent pour approfondir.")) : null,
    CHAPITRES.length
      ? el("div.pile", { style: "margin-top:16px" }, CHAPITRES.map((ch, i) => {
          const a = Parcours.avancement(ch), fini = Parcours.termine(ch);
          return el("button.carte.chapitre" + (fini ? ".chapitre--fini" : ""), { type: "button", onclick: () => { Parcours.ouvrir(ch.id); rafraichir(); } },
            el("div.chapitre__tete", {},
              el("span.chapitre__num", {}, String(i + 1).padStart(2, "0")),
              el("div", { style: "flex:1" }, el("h3", {}, ch.titre), el("p.chapitre__resume", {}, ch.resume)),
              fini ? el("span.chapitre__coche", {}, "✓") : null),
            el("div.chapitre__pied", {},
              el("span.tres-muet", {}, a.total ? `${ch.exercices.length} exercice${ch.exercices.length > 1 ? "s" : ""} · ${ch.duree}` : `Lecture · ${ch.duree}`),
              a.total ? el("span.tres-muet.mono", {}, `${a.faits}/${a.total}`) : null));
        }))
      : el("div.vide", {}, el("div.vide__boite", {},
          el("h3", {}, "Aucune leçon pour l'instant"),
          el("p", {}, "Les leçons guidées (une leçon, puis des exercices) arrivent avec le contenu, à partir du lot 6."))));
}

/** Écran de leçon : intro, points à retenir, un exemple qu'on peut exécuter pour de vrai (« tester cet exemple »,
 *  D050), une astuce, puis le bouton qui lance les exercices du chapitre. */
function ecranLecon(ch, rafraichir) {
  const l = ch.lecon;
  /* Même règle que pour un exercice : l'exemple « testable » doit s'exécuter sur le jeu du chapitre (D068). */
  if (Moteur.etat.jeu !== jeuDe(ch)) nouvelleBase(seedDe(ch));
  /* Une leçon sans exercice ne pourrait jamais être « terminée » (Parcours.termine exige des exercices réussis) :
     l'avoir ouverte suffit (arbitrage A du lot 10). Les chapitres qui ont des exercices ne s'en servent pas. */
  if (!ch.exercices.length) Store.modifier(e => { e.chapitres[ch.id] = { ...(e.chapitres[ch.id] || {}), leconVue: true }; });
  const zoneTest = el("div.resultat", { "aria-live": "polite" });
  return el("div", {},
    el("header.entete", {}, el("div.entete__sur", {}, `Palier ${ch.niveau}`), el("h1", {}, ch.titre)),
    el("div.lecon", {},
      el("p.lecon__intro", {}, l.intro),
      el("ul.lecon__points", {}, l.points.map(pt => el("li", {}, pt))),
      el("div.lecon__exemple", {},
        el("div.lecon__label", {}, l.exemple.titre),
        el("div.lecon__code", {}, l.exemple.code),
        el("div.lecon__fleche", {}, "▼"),
        el("div.lecon__resultat", {}, l.exemple.resultat),
        l.exemple.commentaire ? el("p.lecon__commentaire", {}, l.exemple.commentaire) : null,
        el("button.btn.btn--nu", { type: "button", style: "margin-top:10px",
          onclick: () => zoneTest.replaceChildren(...blocsExecution(Moteur.executer(l.exemple.code))) }, "Tester cet exemple"),
        zoneTest),
      l.astuce ? el("div.lecon__astuce", {}, el("b", {}, "Astuce. "), l.astuce) : null),
    el("div", { style: "margin-top:20px;display:flex;gap:10px;flex-wrap:wrap" },
      /* Un chapitre de culture générale n'a pas d'exercice : le bouton d'entrée en série n'aurait rien à ouvrir
         (Parcours.commencer sort aussitôt). Il est remplacé par le retour, et la leçon est déjà marquée lue. */
      ch.exercices.length
        ? el("button.btn.btn--fort", { type: "button", onclick: () => { Parcours.commencer(); rafraichir(); } },
            `À vous — ${ch.exercices.length} exercice${ch.exercices.length > 1 ? "s" : ""}`)
        : el("button.btn.btn--fort", { type: "button", onclick: () => { Parcours.quitter(); rafraichir(); } }, "Retour au sommaire"),
      ch.exercices.length
        ? el("button.btn.btn--nu", { type: "button", onclick: () => { Parcours.quitter(); rafraichir(); } }, "Quitter le chapitre")
        : null));
}

/** Bilan de fin de chapitre, sur le modèle de Classe'R (bilanChapitre) : plus sobre que le bilan de série libre
 *  (pas de détail par compétence ni de certifications ici, déjà annoncées en cours de route par un Toast). */
function ecranLeconBilan(rafraichir) {
  const p = Parcours.courant, ch = p.ch;
  const suivant = CHAPITRES[CHAPITRES.indexOf(ch) + 1] || null;
  const retenirUniques = [...new Set(p.liste.map(e => e.retenir).filter(Boolean))];
  return el("div", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Chapitre terminé"), el("h1", {}, ch.titre),
      el("p", {}, `${p.reussites} bonne(s) réponse(s) sur ${p.liste.length}.`)),
    retenirUniques.length ? el("div.carte", {},
      el("div.lecon__label", {}, "Ce qu'il faut retenir"),
      el("ul.lecon__points", {}, retenirUniques.map(x => el("li", {}, x)))) : null,
    el("div", { style: "margin-top:20px;display:flex;gap:10px;flex-wrap:wrap" },
      suivant ? el("button.btn.btn--fort", { type: "button", onclick: () => { Parcours.ouvrir(suivant.id); rafraichir(); } }, `Chapitre suivant : ${suivant.titre}`) : null,
      el("button.btn", { type: "button", onclick: () => { Parcours.quitter(); rafraichir(); } }, "Retour au sommaire"),
      el("a.btn.btn--nu", { href: "#/accueil" }, "Accueil")));
}

Vues.lecons = () => {
  const v = el("div.vue");
  const zone = el("div");
  const rafraichir = () => {
    const p = Parcours.courant;
    zone.replaceChildren(
      !p ? ecranListeChapitres(rafraichir)
      : p.etape === "lecon" ? ecranLecon(p.ch, rafraichir)
      : p.etape === "exercices"
        ? rendreQuestion(p, { repondre: r => Parcours.repondre(r), suivant: Parcours.suivant, quitter: Parcours.quitter, libelleQuitter: "Quitter le chapitre" }, rafraichir)
        : ecranLeconBilan(rafraichir));
  };
  rafraichir();
  v.append(zone);
  return v;
};

/** Fiche d'une clause (D055) : à quoi elle sert, quand y penser, comment elle s'écrit, l'erreur fréquente, les
 *  clauses liées — sur le modèle exact de Classe'R (`Vues.fiche`, `Reference/classer-v2.html:9751`), sans
 *  l'étape d'entraînement (`entrainements` est posé vide dans FICHES, délibérément, D055). Ouverte depuis le
 *  Lexique par `#/fiche/<clause>` (identifiant dans le hash, comme `#/exercice/<id>`) : aucun état en mémoire
 *  n'est nécessaire tant qu'il n'y a pas d'entraînement à reprendre là où on l'a laissé. */
function pageFiche(nom) {
  const f = FICHES[nom], c = CLAUSES[nom];
  if (!f || !c) return el("div.vue", {},
    el("header.entete", {}, el("h1", {}, "Fiche")),
    el("div.vide", {}, el("div.vide__boite", {},
      el("h3", {}, "Aucune fiche pour l'instant"),
      el("p", {}, nom ? `« ${nom} » n'a pas encore sa fiche détaillée : elle arrivera avec son palier.` : "Ouvrez le lexique et choisissez une clause pour voir sa fiche."),
      el("button.btn.btn--fort", { type: "button", style: "margin-top:14px", onclick: () => Lexique.ouvrir() }, "Ouvrir le lexique"))));

  const bloc = (label, contenu) => el("div.fiche__bloc", {}, el("div.fiche__label", {}, label), contenu);
  const boutonLie = n => el("button.btn.btn--nu.mono", { type: "button", style: "font-size:12.5px;padding:5px 10px",
    onclick: () => FICHES[n] ? Routeur.aller(`/fiche/${encodeURIComponent(n)}`) : Toast.afficher(`Fiche détaillée pas encore disponible pour ${n}.`) },
    n + (FICHES[n] ? "" : " ·"));
  return el("div.vue", {},
    el("div.section__titre", { style: "margin-bottom:14px" },
      el("h1.mono", { style: "font-size:22px;color:var(--accent-fort)" }, nom),
      el("button.btn.btn--nu", { type: "button", onclick: () => Lexique.ouvrir() }, "Autre clause")),
    el("div.carte", {},
      bloc("À quoi ça sert", el("p.fiche__texte", {}, f.but)),
      bloc("Quand on y pense", el("p.fiche__texte", {}, f.contexte)),
      bloc("Comment ça s'écrit", el("div.fiche__syntaxe", {}, c.syntaxe)),
      bloc("Erreur fréquente", el("p.fiche__texte", {}, f.erreur)),
      f.voirAussi && f.voirAussi.length
        ? bloc("Voir aussi", el("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, f.voirAussi.map(boutonLie)))
        : null));
}

Vues.fiche = () => pageFiche(null);

/** Étoiles d'une mission, portées de Classe'R (`Reference/classer-v2.html:9459`) : trois `★` dont les `n`
 *  premières portent `.pleine`. Le portage du lot 4 écrivait `"★".repeat(n) + "☆".repeat(3 - n)` en texte brut,
 *  qui n'active jamais `.etoiles .pleine` — les étoiles gagnées restaient grises au lieu de prendre `--etoile`
 *  (D063 : la feuille de style est reprise telle quelle, ses crochets doivent donc être utilisés). */
function etoiles(n) {
  return el("span.etoiles", { title: `${n} étoile(s) sur 3` },
    [1, 2, 3].map(i => el("span", { class: i <= n ? "pleine" : "" }, "★")));
}

function listeMissions(rafraichir) {
  return el("div", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Missions"), el("h1", {}, "Missions"),
      /* Pourquoi aucune mission n'est jouable au palier 1 (D069) : une mission traverse plusieurs compétences,
         elle ne peut donc pas se bâtir sur une seule table. Le dire vaut mieux que quatre cartes muettes.
         Classe'R a la même phrase d'accueil à cet endroit (`classer-v2.html:9470`), adaptée au SQL. */
      CONTENU.missions.length
        ? el("p", {}, "Un contexte d'entreprise, une suite d'étapes, et une question qui n'est pas encore tranchée : ce qu'une étape révèle change parfois le sens de la précédente. Chaque étape se vérifie comme un exercice. Les missions traversent plusieurs compétences et supposent les jointures acquises.")
        : null),
    CONTENU.missions.length
      ? el("div.pile", {}, CONTENU.missions.map(m => {
          const p = Store.etat.missions[m.id] || null;
          const termine = p && p.statut === "terminee";
          const noms = (m.competences || []).map(id => {
            const c = CONTENU.competences.find(k => k.id === id);
            return c && c.nom;
          }).filter(Boolean);
          const etapes = (m.etapes || []).length;
          return el("button.carte.carte--action", { type: "button", onclick: () => { if (Mission.demarrer(m.id)) rafraichir(); } },
            el("div.carte__entete", {}, el("h3", {}, m.titre),
              /* Distinction Commencer / Reprendre (dette D057/D058, levée au lot 11) : portée telle quelle de
                 Classe'R (`classer-v2.html:9490`), mêmes classes — `.puce--ambre` pour une reprise. */
              termine ? etoiles(p.etoiles || p.meilleurScore || 0)
                      : el("span.puce" + (p ? ".puce--ambre" : ".puce--accent"), {}, p ? "Reprendre" : "Commencer")),
            el("p.muet", {}, m.resume || ""),
            el("div.exo__meta", { style: "margin-top:11px;margin-bottom:0" },
              noms.map(n => el("span.puce", {}, n)),
              puceDifficulte(m.difficulte || 1),
              el("span.tres-muet.mono", { style: "font-size:11.5px" },
                `${etapes} étape${etapes > 1 ? "s" : ""}${m.duree ? " · " + m.duree : ""}`
                + (p && p.statut === "encours" ? ` · reprise à l'étape ${(p.etape || 0) + 1}` : ""))));
        }))
      : el("div.vide", {}, el("div.vide__boite", {},
          el("h3", {}, "Aucune mission pour l'instant"),
          el("p", {}, "Des scénarios pas à pas (une suite de requêtes à écrire) arriveront avec le contenu."))));
}

function ecranMission(rafraichir) {
  const m = Mission.courante, etape = Mission.etapeCourante();
  /* La base VIVANTE doit porter le jeu de données de l'étape, sinon « Exécuter » travaillerait sur l'autre jeu
     et « Vérifier » partait en exception non rattrapée (D068, défaut relevé au lot 11). Même forme que
     `rendreQuestion` : on ne reconstruit que si le jeu change, donc rien ne bouge sur la boutique. */
  const porteur = Mission.porteurJeu(m.def, etape);
  if (Moteur.etat.jeu !== jeuDe(porteur)) nouvelleBase(seedDe(porteur));
  const sortie = el("div.resultat", { "aria-live": "polite" });
  const retourZone = el("div");
  const editeur = editeurSQL({
    valeur: m.brouillon || "", etiquette: "Requête de l'étape",
    surChange: v => Mission.sauvegarderBrouillon(v),
    surExecuter: () => lancer(),
    surVerifier: () => verifier()
  });
  function lancer() { sortie.replaceChildren(...blocsExecution(Moteur.executer(editeur.valeur()))); }
  // D057 (audit) : les indices existaient côté Mission (`indice()`, `terminer()` compte `indicesTotal` pour les
  // étoiles) sans jamais être affichés. `avancer` fait passer chaque clic par `Mission.indice()` plutôt que par
  // l'incrémentation directe que fait panneauIndices pour un exercice (Session/Parcours), afin que indicesTotal suive.
  // D069 : la liste est passée à `indice()`, qui doit reconnaître la solution révélée pour en faire payer le prix.
  const liste = Indices.pour(etape);
  const panneau = panneauIndices(etape, m, () => Mission.indice(liste));
  function verifier() {
    const res = Mission.verifier(editeur.valeur());
    retourZone.replaceChildren(carteRetour({ type: "requete" }, res, {}));
    if (m.etat === "bilan") rafraichir();
    else if (res.reussi) { editeur.definir(""); rafraichir(); }
  }
  return el("div", {},
    el("header.entete", {}, el("div.entete__sur", {}, "Mission"), el("h1", {}, m.def.titre)),
    /* Le contexte d'entreprise est rendu à CHAQUE étape (D069) : une mission dont les étapes se tiennent est
       justement celle où perdre le brief après l'étape 1 coûte le plus cher. */
    m.def.contexte ? el("div.contexte.contexte--brief", {}, el("b", {}, "La situation"), el("p", {}, m.def.contexte)) : null,
    el("div.contexte", {}, el("b", {}, `Étape ${m.etape + 1} / ${m.def.etapes.length}`), el("p", {}, etape.consigne)),
    editeur.element,
    el("div.sql-barre", {},
      el("button.btn", { type: "button", onclick: lancer }, "Exécuter"),
      el("button.btn.btn--fort", { type: "button", onclick: verifier }, "Vérifier"),
      el("span.tres-muet.sql-aide", {}, "Ctrl + Entrée exécute · Ctrl + Maj + Entrée vérifie"),
      el("span.sql-barre__espace"),
      /* Une étape peut écrire sur la base vivante par « Exécuter » (le verdict, lui, reste isolé — D032) :
         sans ce bouton, rien ne permettait de réparer la base sans quitter la mission. Même libellé et même
         place que sur un exercice (`rendreSQL`, src/exercices.js). */
      el("button.btn.btn--nu", { type: "button", onclick: () => { const ms = nouvelleBase(seedDe(porteur)); sortie.replaceChildren(); Toast.afficher(`Base reconstruite en ${ms} ms.`, "accent"); } }, "Réinitialiser la base")),
    sortie, retourZone, panneau,
    el("button.btn.btn--nu", { type: "button", onclick: () => { Mission.quitter(); rafraichir(); } }, "Quitter la mission"));
}

/** Bilan de fin de mission (D057, audit) : `Mission.terminer()` calcule étoiles/XP/certifications depuis le lot 4
 *  et pose `etat: "bilan"`, mais rien ne le lisait — `ecranMission` continuait de s'afficher, sans rien de tout
 *  cela. Modèle : `ecranBilan` (série libre) pour les certifications, `etoiles()` pour les étoiles ; pas de
 *  détail par compétence avant/après comme Classe'R (`bilanMission`), faute d'un équivalent de
 *  `avantSession`/`avantChapitre` côté Mission — à ajouter si besoin, pas dans ce correctif.
 *  D069 : `retenir` y est rendu, sur le modèle du « À retenir » d'une série (`ecranBilan`). Sans lui, une
 *  mission n'avait aucun endroit pour dire ce qu'elle venait d'enseigner, et c'est là qu'elle l'enseigne.
 *  Les étoiles montrées sont celles du passage qui vient d'avoir lieu ; la liste, elle, montre le meilleur. */
function ecranMissionBilan(rafraichir) {
  const m = Mission.courante, def = m.def;
  return el("div", {},
    el("div.bilan-hero", {},
      el("div.entete__sur", {}, "Mission terminée"),
      el("span.etoiles.etoiles--grandes", { role: "img", "data-frais": "1", "aria-label": `${m.etoiles} étoile(s) sur 3` },
        [1, 2, 3].map(i => el("span", { class: i <= m.etoiles ? "pleine" : "", style: `--i:${i - 1}` }, "★"))),
      el("h1", {}, def.titre),
      el("div.bilan-hero__chiffres", {},
        el("div.bilan-hero__chiffre", {}, el("b", {}, `+${m.xp}`), el("span", {}, "XP gagnés")),
        el("div.bilan-hero__chiffre", {}, el("b", {}, `${def.etapes.length}`), el("span", {}, def.etapes.length > 1 ? "étapes franchies" : "étape franchie")),
        m.indicesTotal ? el("div.bilan-hero__chiffre", {}, el("b", {}, String(m.indicesTotal)), el("span", {}, m.indicesTotal > 1 ? "indices utilisés" : "indice utilisé")) : null)),
    def.retenir ? el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "À retenir")),
      el("div.carte", {}, el("p.resume__ligne", {}, def.retenir))) : null,
    m.certifs.length ? el("div.section", {},
      el("div.section__titre", {}, el("h2", {}, "Certifications obtenues")),
      el("div.certifs", {}, m.certifs.map(c => el("div.certif", { "data-obtenue": "1" }, el("span.certif__ico", {}, c.ico), el("b", {}, c.nom), el("span", {}, c.desc))))) : null,
    el("div.exo__pied", {},
      el("button.btn.btn--fort", { type: "button", onclick: () => { Mission.quitter(); rafraichir(); } }, "Autres missions"),
      el("button.btn", { type: "button", onclick: () => { Mission.courante = null; Mission.recommencer(def.id); rafraichir(); } }, "Refaire sans indice"),
      el("a.btn.btn--nu", { href: "#/accueil", onclick: () => { Mission.courante = null; } }, "Retour à l'accueil")));
}

Vues.missions = () => {
  const v = el("div.vue");
  const zone = el("div");
  const rafraichir = () => zone.replaceChildren(
    !Mission.courante ? listeMissions(rafraichir)
    : Mission.courante.etat === "bilan" ? ecranMissionBilan(rafraichir)
    : ecranMission(rafraichir));
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
  nouvelleBase(seedDe(ex));
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
    const reveler = panneau && e.indices < panneau.totalIndices ? () => { panneau.reveler(); afficherRetour(retour); } : null;
    zoneRetour.replaceChildren(carteRetour(ex, retour, { xp: retour.xp, progres: retour.progres, reveler }));
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
    el("header.entete", {}, el("div.entete__sur", {}, "Exercice"), el("h1", {}, ex.titre)),
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

function pageFicheDepuisHash(chemin) {
  return pageFiche(decodeURIComponent(chemin.slice("/fiche/".length)));
}

/* ── Routeur : table de routes à la Classe'R, plus deux cas spéciaux à identifiant dynamique dans le hash :
   /exercice/<id> et /fiche/<clause>, sur le même motif. ──────────────────────────────────────────────────── */
const Routeur = (() => {
  const routes = [];
  const PREFIXE_EXERCICE = "/exercice/";
  const PREFIXE_FICHE = "/fiche/";

  function enregistrer(r) { routes.push(r); }

  function courante() {
    const h = (location.hash || "").slice(1) || "/accueil";
    if (h.startsWith(PREFIXE_EXERCICE)) return { chemin: h, titre: "Exercice", vue: "__exercice__", nav: false };
    if (h.startsWith(PREFIXE_FICHE)) return { chemin: h, titre: "Fiche", vue: "__fiche__", nav: false };
    return routes.find(r => r.chemin === h) || routes.find(r => r.chemin === "/accueil");
  }

  function rendre() {
    const route = courante();
    document.title = `${route.titre} — Requêt'R`;
    let page;
    try {
      page = route.vue === "__exercice__" ? pageExerciceDepuisHash(route.chemin)
        : route.vue === "__fiche__" ? pageFicheDepuisHash(route.chemin)
        : Vues[route.vue]();
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
    Lexique.majBouton();
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
      el("nav.rail__nav", { "aria-label": "Navigation principale" }, liens, el("div.rail__sep"), Explorateur.bouton(), Lexique.bouton()),
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
  document.addEventListener("keydown", ev => {
    if (ev.key !== "Escape") return;
    if (Explorateur.estOuvert()) Explorateur.fermer();
    else if (Lexique.estOuvert()) Lexique.fermer();
  });

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
