"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — Store (lot 4 ; DECISIONS.md D045)
   Persistance de la progression : porté de Classe'R, seule la clé change (CONFIG.cle, « requeter.etat »,
   réservée depuis le lot 1 : D009). Pur, sans DOM, chargeable sous Node (verifier-progression.mjs) à l'exception
   de `charger`/`sauver`/`exporter`/`importer`, qui ont besoin de `localStorage` (navigateur) ou d'un équivalent
   fourni par le test.
   Globaux utilisés : CONFIG (app.js), CONTENU (contenu.js, pour la réconciliation des compétences).
   ═══════════════════════════════════════════════════════════ */

const Store = (() => {
  let etat = null;
  let delaiSauvegarde = null;

  function etatInitial() {
    const competences = {};
    (CONTENU.competences || []).forEach(c => {
      competences[c.id] = { maitrise: 0, tentatives: 0, reussites: 0, derniereActivite: null };
    });
    return {
      schema: CONFIG.schema,
      creeLe: new Date().toISOString(),
      profil: { prenom: "", experienceSql: null, onboardingFait: false },
      xp: 0,
      xpParJour: {},
      serie: { jours: 0, dernierJour: null },
      competences,
      exercices: {},
      /* Par chapitre : seulement `leconVue` pour l'instant (une leçon sans exercice, D068/arbitrage A du lot 10).
         L'avancement d'un chapitre ordinaire reste déduit de `exercices`, il n'est pas dupliqué ici. */
      chapitres: {},
      missions: {},
      certifications: {},
      dernierExport: null,
      fiches: {},
      stats: { seriesParfaites: 0 },
      reglages: { theme: "clair", niveauContenu: null, packsDesactives: [] }
    };
  }

  /* Migrations futures : { 2: etat => {...} }. Aucune n'existe encore (schema reste à 1). */
  const MIGRATIONS = {};

  /** Rejoue les migrations une à une, puis réconcilie : une compétence ajoutée après coup (dans CONTENU.competences)
   *  apparaît dans un état ancien avec des compteurs à zéro, sans que l'utilisateur perde le reste de sa progression. */
  function migrer(e) {
    while (e.schema < CONFIG.schema) {
      const suivante = e.schema + 1;
      if (MIGRATIONS[suivante]) MIGRATIONS[suivante](e);
      e.schema = suivante;
    }
    (CONTENU.competences || []).forEach(c => {
      if (!e.competences[c.id]) e.competences[c.id] = { maitrise: 0, tentatives: 0, reussites: 0, derniereActivite: null };
    });
    /* Même esprit que la réconciliation ci-dessus : une carte ajoutée après coup apparaît vide dans un état
       ancien, sans migration de schéma et sans que l'utilisateur perde quoi que ce soit. */
    if (!e.chapitres) e.chapitres = {};
    return e;
  }

  function aujourdhui() { return new Date().toISOString().slice(0, 10); }

  function charger() {
    try {
      const brut = localStorage.getItem(CONFIG.cle);
      if (brut) etat = migrer({ ...etatInitial(), ...JSON.parse(brut) });
    } catch (err) {
      console.warn("Progression illisible, réinitialisation.", err);
    }
    API.etat = etat;
    return etat;
  }

  function sauver() {
    clearTimeout(delaiSauvegarde);
    delaiSauvegarde = setTimeout(() => {
      try { localStorage.setItem(CONFIG.cle, JSON.stringify(etat)); }
      catch (err) { if (typeof Toast !== "undefined") Toast.afficher("Sauvegarde impossible : espace de stockage plein."); }
    }, 180);
  }

  const API = {
    etat: null,
    aujourdhui,
    charger,
    sauver,

    /** Unique porte d'écriture : `fn(etat)` mute en place, puis Store sauve et annonce le changement. */
    modifier(fn) {
      fn(etat);
      sauver();
      if (typeof Bus !== "undefined") Bus.emettre("etat:change");
      return etat;
    },

    reinitialiser() {
      etat = etatInitial();
      API.etat = etat;
      try { localStorage.removeItem(CONFIG.cle); } catch (err) { /* indisponible : rien à retirer */ }
      if (typeof Bus !== "undefined") Bus.emettre("etat:change");
      return etat;
    },

    /** Téléchargement du fichier JSON (navigateur) ; sous Node, renvoie juste le texte produit (pas de téléchargement). */
    exporter() {
      etat.dernierExport = new Date().toISOString();
      sauver();
      const texte = JSON.stringify(etat, null, 2);
      if (typeof document !== "undefined" && typeof Blob !== "undefined" && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        const blob = new Blob([texte], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `requeter-progression-${aujourdhui()}.json`;
        document.body.append(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      }
      return texte;
    },

    /** Restaure un état exporté. Validation minimale (D037 de Classe'R) : xp numérique, competences présent. */
    importer(texte) {
      const donnees = JSON.parse(texte);
      if (typeof donnees.xp !== "number" || !donnees.competences) throw new Error("format");
      etat = migrer({ ...etatInitial(), ...donnees });
      API.etat = etat;
      sauver();
      if (typeof Bus !== "undefined") Bus.emettre("etat:change");
      return etat;
    }
  };

  etat = etatInitial();
  API.etat = etat;
  return API;
})();
