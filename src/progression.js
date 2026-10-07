"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — Progression (lot 4 ; DECISIONS.md D045, D043-D044 pour les catalogues)
   XP, niveaux, maîtrise par compétence, décroissance d'oubli, consolidation, certifications, pointsFaibles.
   Porté de Classe'R : mêmes constantes et formules (alphaMaitrise, alphaEchec, perteMax, serieConsolidation,
   seuilConsolidation, jouisAvantOubli, vitesseOubli, seuilRevision, seuilCumul, titres).
   Écart voulu (D045, point H de l'arbitrage) : l'horloge n'est PAS un Date.now() en dur ni un champ mutable du
   module — c'est un PARAMÈTRE de `maitrise(id, maintenant)`, pour rester une fonction pure testable sans
   dépendre de l'horloge réelle (D001). `maintenant` est en millisecondes epoch ; par défaut Date.now().
   Pur, sans DOM : chargeable sous Node (verifier-progression.mjs). Globaux : Store, CONTENU.
   ═══════════════════════════════════════════════════════════ */

const PROGRESSION_CONFIG = {
  objectifQuotidien: 60,
  alphaMaitrise: 0.25,
  alphaEchec: 0.15,
  perteMax: 15,
  serieConsolidation: 3,
  seuilConsolidation: 80,
  jouisAvantOubli: 7,
  vitesseOubli: 1.2,
  seuilRevision: 55,
  titres: [
    { min: 1, nom: "Novice" }, { min: 3, nom: "Apprenti" },
    { min: 5, nom: "Praticien" }, { min: 8, nom: "Confirmé" },
    { min: 12, nom: "Chevronné" }, { min: 16, nom: "Maître" }
  ],
  seuilCumul: n => 50 * n * n + 50 * n
};

function borne(v, min, max) { return Math.max(min, Math.min(max, v)); }

const Progression = (() => {

  function niveau() {
    const xp = Store.etat.xp;
    let n = 1;
    while (xp >= PROGRESSION_CONFIG.seuilCumul(n)) n++;
    const bas = n > 1 ? PROGRESSION_CONFIG.seuilCumul(n - 1) : 0;
    const haut = PROGRESSION_CONFIG.seuilCumul(n);
    const titre = [...PROGRESSION_CONFIG.titres].reverse().find(t => n >= t.min)?.nom || "Novice";
    return { niveau: n, titre, xpDansNiveau: xp - bas, xpRequis: haut - bas, pourcent: Math.round(100 * (xp - bas) / (haut - bas)) };
  }

  function xpDuJour(jour = Store.aujourdhui()) { return Store.etat.xpParJour[jour] || 0; }

  function ajouterXp(montant, jour = Store.aujourdhui()) {
    Store.etat.xp += montant;
    Store.etat.xpParJour[jour] = (Store.etat.xpParJour[jour] || 0) + montant;
  }

  function majSerie() {
    const e = Store.etat, aj = Store.aujourdhui();
    if (e.serie.dernierJour === aj) return;
    const hierTexte = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    e.serie.jours = e.serie.dernierJour === hierTexte ? e.serie.jours + 1 : 1;
    e.serie.dernierJour = aj;
  }

  /** Maîtrise d'une compétence, brute (mémorisée) et effective (avec décroissance d'oubli).
   *  `maintenant` : horodatage en ms (paramètre, jamais Date.now() en dur dans la formule — D001, D045.H). */
  function maitrise(idComp, maintenant = Date.now()) {
    const c = Store.etat.competences[idComp];
    if (!c) return { brute: 0, effective: 0, jamaisTravaillee: true };
    const jours = c.derniereActivite === null ? Infinity : Math.floor((maintenant - new Date(c.derniereActivite).getTime()) / 86400000);
    const perte = jours === Infinity ? 0 : Math.max(0, jours - PROGRESSION_CONFIG.jouisAvantOubli) * PROGRESSION_CONFIG.vitesseOubli;
    const brute = Math.round(c.maitrise);
    const effective = Math.max(0, borne(brute - perte, Math.round(brute * 0.5), 100));
    return { brute, effective, jamaisTravaillee: c.tentatives === 0 };
  }

  /** Point d'entrée unique, appelé par Session, Parcours et Mission après chaque résultat.
   *  `competences` : un ou plusieurs identifiants de CONTENU.competences. `facteur` : multiplicateur lié aux
   *  indices utilisés (Indices.facteurMaitrise) ; 1 = aucun indice. Renvoie les certifications nouvellement obtenues. */
  function enregistrerResultat({ competences = [], reussi, difficulte = 1, xp = 0, facteur = 1, idExercice, idMission, maintenant = Date.now() } = {}) {
    const poids = ([0.8, 1, 1.2][difficulte - 1] ?? 1) * facteur;
    Store.modifier(e => {
      competences.forEach(id => {
        const c = e.competences[id];
        if (!c) return;
        if (reussi) {
          c.maitrise = borne(c.maitrise + PROGRESSION_CONFIG.alphaMaitrise * poids * (100 - c.maitrise), 0, 100);
          c.serie = facteur >= 0.99 ? (c.serie || 0) + 1 : 0;
          if (c.serie >= PROGRESSION_CONFIG.serieConsolidation && c.maitrise >= PROGRESSION_CONFIG.seuilConsolidation) c.maitrise = 100;
        } else {
          c.maitrise = borne(c.maitrise - Math.min(PROGRESSION_CONFIG.perteMax, PROGRESSION_CONFIG.alphaEchec * poids * c.maitrise), 0, 100);
          c.serie = 0;
        }
        c.tentatives++;
        if (reussi) c.reussites++;
        c.derniereActivite = new Date(maintenant).toISOString();
      });
      if (idExercice) {
        const h = e.exercices[idExercice] || (e.exercices[idExercice] = { tentatives: 0, reussites: 0, derniereReussite: null });
        h.tentatives++;
        if (reussi) { h.reussites++; h.derniereReussite = new Date(maintenant).toISOString(); }
      }
    });
    if (xp > 0 && reussi) ajouterXp(xp);
    majSerie();
    return verifierCertifications();
  }

  /** Compétences visibles : celles du palier actif (ou toutes si « tout »), plus celles déjà pratiquées même
   *  au-delà du palier actif, pour ne jamais faire disparaître une compétence déjà entamée (D042/D047). */
  function competencesVisibles() {
    const niv = Store.etat.reglages.niveauContenu;
    return (CONTENU.competences || []).filter(c =>
      c.actif !== false && (!niv || niv === "tout" || c.niveau === niv || (Store.etat.competences[c.id] && Store.etat.competences[c.id].tentatives > 0)));
  }

  /** Compétences prioritaires : jamais travaillées ou sous le seuil de révision, triées par maîtrise effective croissante. */
  function pointsFaibles(nb = 3, maintenant = Date.now()) {
    return competencesVisibles()
      .map(c => ({ ...c, ...maitrise(c.id, maintenant) }))
      .sort((a, b) => a.effective - b.effective)
      .slice(0, nb);
  }

  /** Vérifie chaque certification non encore obtenue ; enregistre et renvoie celles qui viennent de se déclencher.
   *  Jamais sur minuterie : seulement après un résultat (D044). Idempotent : ignore celles déjà obtenues. */
  function verifierCertifications() {
    const nouvelles = [];
    (CONTENU.certifications || []).forEach(cert => {
      if (Store.etat.certifications[cert.id]) return;
      let ok = false;
      try { ok = cert.condition(Store.etat, API); } catch (err) { ok = false; }
      if (ok) {
        Store.modifier(e => { e.certifications[cert.id] = { obtenueLe: new Date().toISOString() }; });
        nouvelles.push(cert);
      }
    });
    return nouvelles;
  }

  const API = { niveau, xpDuJour, ajouterXp, majSerie, maitrise, enregistrerResultat, competencesVisibles, pointsFaibles, verifierCertifications };
  return API;
})();

/** Coût des indices sur l'XP et sur la maîtrise, selon le nombre d'indices utilisés : ajoutés à l'objet `Indices`
 *  de src/exercices.js (porté de Classe'R sans changement — aucune référence à Excel dans ces deux formules), pour
 *  que Piste/Clause/Exemple/Solution et leur coût restent un seul objet, comme chez Classe'R (D045). */
Object.assign(Indices, {
  multiplicateurXp(utilises, liste) {
    if (utilises > 0 && liste[utilises - 1]?.revele) return 0;
    return Math.max(0.25, 1 - 0.25 * utilises);
  },
  facteurMaitrise(utilises, liste) {
    if (utilises > 0 && liste[utilises - 1]?.revele) return 0.2;
    return Math.max(0.35, 1 - 0.2 * utilises);
  }
});
