#!/usr/bin/env node
/* Requêt'R — l'Autotest (lot 5 ; DECISIONS.md D051). Hors livrable : il n'entre pas dans requeter.html.
   Usage : node verifier-autotest.mjs [--palier=P1]
   Contrôle LE CONTENU (exercice par exercice, étape de mission par étape, chapitre par chapitre), pas le moteur :
   verifier-seed.mjs gèle les données, verifier-comparateur.mjs et verifier-progression.mjs exercent le moteur sur des
   cas isolés. Charge les VRAIS fichiers de src/ (comparateur.js, moteur.js, contenu.js, exercices.js) dans Node, sans
   navigateur ; rejoue chaque solution de référence contre le seed gelé (D025) et vérifie ce qu'une relecture humaine
   ne devrait plus avoir à contrôler : identifiants, métadonnées, déterminisme (D001), règles d'auteur sur le tri
   (D029/D030), couverture par compétence et par piège.
   Ce que l'Autotest NE PEUT PAS juger (affiché en pied de rapport) : la clarté d'un énoncé, l'ambiguïté d'une consigne,
   la justesse d'une explication, le dosage de la difficulté, la progression d'un palier. Aucune heuristique n'y est
   tentée : une métrique approximative sur ces points donnerait une fausse sécurité.
   Code retour 1 si un exercice/étape/chapitre est en échec, ou si un contrôle de couverture BLOQUANT (palier déclaré
   `termine`) échoue. Un contrôle de couverture d'un palier non terminé n'est qu'un avertissement : il ne fait pas
   échouer le script.
   À relancer après TOUTE modification de src/contenu.js (exercices, missions, chapitres, PALIERS). */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const source = f => readFileSync(join(RACINE, "src", f), "utf8").replace(/\r\n/g, "\n");

/* Les fichiers de src/ sont des scripts classiques qui partagent leur portée globale dans le navigateur : on les
   concatène dans UNE évaluation indirecte (même technique que les trois autres vérificateurs). */
function charger(fichiers, exports) {
  return (0, eval)(fichiers.map(source).join("\n") + `\n;({ ${exports.join(", ")} })`);
}

globalThis.initSqlJs = require("./vendor/sql-wasm.js");
globalThis.WASM_B64 = readFileSync(join(RACINE, "vendor", "sql-wasm.wasm")).toString("base64");
globalThis.SEED_SQL = source("seed.sql");
globalThis.SEED_SALE_SQL = source("seed-sale.sql");          // le second jeu de données du palier 5 (D027, D068)

const { Comparateur, Moteur, nouvelleBase, seedDe, jeuDe, JEUX, CONTENU, CLAUSES, TYPES_EXERCICE, Indices, PALIERS, CHAPITRES } = charger(
  ["comparateur.js", "moteur.js", "contenu.js", "exercices.js"],
  ["Comparateur", "Moteur", "nouvelleBase", "seedDe", "jeuDe", "JEUX", "CONTENU", "CLAUSES", "TYPES_EXERCICE", "Indices", "PALIERS", "CHAPITRES"]
);
await Moteur.initialiser();     // construit déjà une première base vivante (seed principal, gelé)

/* ── Filtre --palier=Px (facultatif, pour travailler sur un palier en cours) ───────────────── */
const argPalier = process.argv.find(a => a.startsWith("--palier="));
const PALIER_FILTRE = argPalier ? argPalier.slice("--palier=".length) : null;
if (PALIER_FILTRE && !PALIERS.some(p => p.id === PALIER_FILTRE)) {
  console.error(`Palier inconnu : ${PALIER_FILTRE}`);
  process.exit(1);
}

/* ── Base vivante unique, réutilisée pour tout le rejeu (D051) ───────────────────────────────
   Le contenu est toujours en lecture seule (D032 refuse les écritures) : une écriture détectée reconstruit la base
   avant de continuer, pour qu'elle ne contamine jamais le reste du rejeu. */
function executer(sql) {
  const r = Moteur.executer(sql);
  if (r.ecritures) nouvelleBase(seedDe({ jeu: Moteur.etat.jeu }));   // on reconstruit LE MÊME jeu, pas la boutique
  return r;
}

/** Une base vivante par jeu de données (D068) : on ne reconstruit que quand le jeu demandé change, ce qui coûte
 *  quelques millisecondes (D023). Le contenu des paliers 1 à 4 ne déclare aucun `jeu` : rien n'est reconstruit. */
function surLeJeuDe(porteur) {
  if (Moteur.etat.jeu !== jeuDe(porteur)) nouvelleBase(seedDe(porteur));
}
const dernierJeu = r => (r.jeux.length ? r.jeux[r.jeux.length - 1] : null);

/** Égalité d'une seule valeur, tolérante (réutilise la tolérance numérique/NULL de Comparateur, sans la réécrire). */
const celluleEgale = (a, b) => Comparateur.comparer({ colonnes: ["x"], lignes: [[a]] }, { colonnes: ["x"], lignes: [[b]] }, {}).egal;

/** Exécute `fn()` ; une exception devient un problème lisible au lieu d'interrompre tout le rejeu. */
function proteger(fn, probleme) {
  try { fn(); } catch (e) { probleme.push(`exception : ${e && e.message}`); }
}

const rapport = [];       // { categorie: "exercice" | "mission" | "chapitre", id, niveau, titre, probleme: [] }
const couvertureRapport = []; // { id, titre, ok, bloquant, detail }
const enregistrer = (categorie, id, niveau, titre, probleme) => rapport.push({ categorie, id, niveau, titre, probleme });
const couverture = (id, titre, ok, bloquant, detail = "") => couvertureRapport.push({ id, titre, ok, bloquant, detail });

const PIEGES = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11"];
/* Les anomalies VOULUES du jeu sale (SCHEMA-EXPORT.md, vérifiées par verifier-seed-sale.mjs). Même mécanique
   déclarative que `pieges` : un champ `anomalies` sur l'exercice, aucune détection automatique (D051). */
const ANOMALIES = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12", "A13", "A14", "A15"];
const idsConnus = new Set();
const tentativeSciemmentFausse = "SELECT -999999 AS jamais_la_bonne_reponse";

/* ══════════════════════════════════════════════════════════════
   CONTRÔLES SQL COMMUNS (D051)
   ══════════════════════════════════════════════════════════════ */

/** Rejoue une requête de référence (solution d'un exercice/étape, ou requête montrée d'un `predire`).
 *  Renvoie le jeu obtenu, ou null si inexploitable (les problèmes rencontrés sont poussés dans `probleme`). */
function verifierSQLReference(sql, porteur, probleme) {
  const r = executer(sql);
  if (r.erreur) { probleme.push(`la requête de référence ne s'exécute pas : ${r.erreur}`); return null; }
  if (r.ecritures) { probleme.push("la requête de référence écrit dans la base : hors programme (D032)"); return null; }
  const jeu = dernierJeu(r);
  if (!jeu) { probleme.push("la requête de référence ne renvoie aucun jeu de résultats (ce n'est pas un SELECT)"); return null; }
  if (jeu.lignes.length === 0) {
    const justif = porteur.zeroLigneAttendu;
    if (!(typeof justif === "string" && justif.trim()))
      probleme.push("la requête de référence ne renvoie aucune ligne (presque toujours un exercice mal posé ; si c'est voulu, déclarer zeroLigneAttendu: \"raison\")");
  } else if (jeu.lignes.length === 1 && jeu.colonnes.length === 1 && celluleEgale(jeu.lignes[0][0], 0)) {
    probleme.push("résultat trivial : une seule cellule, qui vaut 0");
  }
  if (jeu.lignes.length > 10000) probleme.push(`la référence renvoie plus de 10 000 lignes (${jeu.lignes.length}) : D036`);
  const temporels = Comparateur.construitsTemporels(sql);
  if (temporels.length) probleme.push(`construction non déterministe (D001) : ${temporels.map(t => t.libelle).join(", ")}`);
  return jeu;
}

/** D029/D030 : quand `comparer.ordonne` porte des `cles` et que la solution a un LIMIT final, rejoue sans ce LIMIT et
 *  vérifie que la coupe ne tombe pas au milieu d'un groupe d'ex æquo sur ces clés (sans analyse syntaxique : on rejoue). */
function verifierCoupeLimit(sql, ordonne, probleme) {
  if (!ordonne || typeof ordonne !== "object" || !Array.isArray(ordonne.cles)) return;
  const m = /\bLIMIT\s+(\d+)\s*;?\s*$/i.exec(sql.trim());
  if (!m) return;
  const n = Number(m[1]);
  const r = executer(sql.trim().replace(/\bLIMIT\s+\d+\s*;?\s*$/i, ""));
  if (r.erreur || r.ecritures) return;     // déjà signalé par ailleurs sur la solution elle-même
  const jeu = dernierJeu(r);
  if (!jeu || jeu.lignes.length <= n) return;    // la LIMIT ne coupe rien de réel
  const retenue = jeu.lignes[n - 1], exclue = jeu.lignes[n];
  if (ordonne.cles.every(i => celluleEgale(retenue[i], exclue[i])))
    probleme.push(`le LIMIT coupe un groupe d'ex æquo sur la clé de tri (ligne ${n} et ${n + 1} à égalité) : D029`);
}

/** Rien n'est jamais validé d'avance (parité Classe'R) : une tentative sciemment fausse doit être refusée. */
function verifierRienValideAvance(attendu, options, probleme) {
  const r = executer(tentativeSciemmentFausse);
  const v = Comparateur.evaluer({ attendu, rapport: r, options: options || {}, sql: tentativeSciemmentFausse, base: CONTENU.base });
  if (v.statut === "reussi") probleme.push("une tentative sciemment fausse est acceptée : rien ne devrait être validé d'avance");
}

/* ══════════════════════════════════════════════════════════════
   EXERCICES
   ══════════════════════════════════════════════════════════════ */

function verifierExercice(ex) {
  const probleme = [];
  proteger(() => {
    if (idsConnus.has(ex.id)) probleme.push("identifiant en double (exercice, mission ou chapitre)");
    idsConnus.add(ex.id);

    if (!PALIERS.some(p => p.id === ex.niveau)) probleme.push(`palier inconnu : ${ex.niveau}`);
    if (!CONTENU.competences.some(c => c.id === ex.competence)) probleme.push(`compétence inconnue : ${ex.competence}`);
    if (!ex.retenir || !String(ex.retenir).trim()) probleme.push("« retenir » manquant");
    if (!ex.explication || !String(ex.explication).trim()) probleme.push("« explication » manquante");
    if (ex.clause && !CLAUSES[ex.clause]) probleme.push(`clause inconnue de CLAUSES : ${ex.clause}`);
    if (ex.pieges !== undefined && (!Array.isArray(ex.pieges) || ex.pieges.some(p => !PIEGES.includes(p))))
      probleme.push(`« pieges » doit être un tableau d'identifiants parmi ${PIEGES.join(", ")}`);
    if (ex.anomalies !== undefined && (!Array.isArray(ex.anomalies) || ex.anomalies.some(a => !ANOMALIES.includes(a))))
      probleme.push(`« anomalies » doit être un tableau d'identifiants parmi ${ANOMALIES.join(", ")}`);
    if (ex.jeu !== undefined && !JEUX.some(j => j.id === ex.jeu)) probleme.push(`jeu de données inconnu : ${ex.jeu}`);
    if (ex.jeu !== "export" && Array.isArray(ex.anomalies) && ex.anomalies.length)
      probleme.push("« anomalies » cité par un exercice qui ne travaille pas sur l'export brut");
    if (ex.jeu === "export" && Array.isArray(ex.pieges) && ex.pieges.length)
      probleme.push("« pieges » cité par un exercice qui travaille sur l'export brut : les pièges P1 à P11 sont ceux du seed principal");

    const indices = Indices.pour(ex);
    if (ex.type === "predire") {
      if (indices.some(i => i.revele)) probleme.push("un exercice « predire » ne doit jamais révéler de solution");
    } else if (indices.length < 2) {
      probleme.push("indices incomplets : au moins un indice est attendu avant la solution révélée");
    } else if (!indices[indices.length - 1].revele) {
      probleme.push("les indices ne se terminent pas par la solution révélée");
    }

    if (ex.type === "corriger") {
      const normaliser = s => String(s).replace(/\s+/g, " ").trim();
      if (normaliser(ex.solution) === normaliser(ex.depart))
        probleme.push("« solution » et « depart » sont identiques : l'exercice n'a rien à corriger");
    }

    if (ex.type === "qcm") {
      if (!Number.isInteger(ex.reponse) || ex.reponse < 0 || ex.reponse >= ex.options.length)
        probleme.push("« reponse » ne désigne pas une option valide");
      const vues = new Set();
      ex.options.forEach(o => {
        const n = String(o).normalize("NFC").trim().toLowerCase();
        if (vues.has(n)) probleme.push(`options dupliquées : « ${o} »`);
        vues.add(n);
      });
      return;    // le reste (exécution SQL) ne concerne que requete/corriger/predire
    }

    surLeJeuDe(ex);                        // la base vivante doit porter le jeu de données de l'exercice
    const sql = ex.type === "predire" ? ex.requete : ex.solution;
    const jeu = verifierSQLReference(sql, ex, probleme);
    if (!jeu) return;

    if (ex.type === "predire") {
      if (ex.predit !== "nbLignes" && ex.predit !== "valeur") probleme.push(`« predit » invalide : ${ex.predit}`);
      return;
    }

    verifierCoupeLimit(sql, ex.comparer && ex.comparer.ordonne, probleme);

    if (ex.type === "corriger") {
      const rDepart = executer(ex.depart);
      if (rDepart.erreur) probleme.push(`« depart » ne s'exécute pas (ce n'est pas une faute pédagogique) : ${rDepart.erreur}`);
      else if (rDepart.ecritures) probleme.push("« depart » écrit dans la base : hors programme");
      else {
        const v = Comparateur.evaluer({ attendu: jeu, rapport: rDepart, options: ex.comparer || {}, sql: ex.depart, base: CONTENU.base });
        if (v.statut === "reussi") probleme.push("« depart » est accepté par le comparateur : l'exercice n'a rien à corriger");
      }
    } else {
      verifierRienValideAvance(jeu, ex.comparer, probleme);
    }
  }, probleme);
  enregistrer("exercice", ex.id, ex.niveau, ex.titre || ex.id, probleme);
}

CONTENU.exercices.filter(ex => !PALIER_FILTRE || ex.niveau === PALIER_FILTRE).forEach(verifierExercice);

/* ══════════════════════════════════════════════════════════════
   MISSIONS (D048 : une seule forme de validation, le Comparateur ; D069 : forme et portée d'une mission)
   Le lot 11 a montré qu'une étape passait ici des contrôles que l'application ne tenait pas (`jeu: "export"`
   validé vert et injouable) et en évitait d'autres qu'un exercice subit (la coupe d'un LIMIT sur des ex æquo).
   Les deux écarts sont fermés : une étape est soumise aux MÊMES contrôles SQL qu'un exercice `requete`.
   ══════════════════════════════════════════════════════════════ */

/** Les solutions des exercices, à l'espace près : une étape de mission ne doit jamais redemander MOT POUR MOT
 *  ce qu'un exercice demande déjà (D069). Une étape peut légitimement remettre en situation une notion déjà
 *  exercée — c'est le propre d'une mise en situation —, mais pas en recopier la requête. */
const normaliserSQL = s => String(s).replace(/\s+/g, " ").trim().toLowerCase();
const solutionsExercices = new Map();
CONTENU.exercices.forEach(ex => {
  const sql = ex.solution || ex.requete;
  if (sql) solutionsExercices.set(normaliserSQL(sql), ex.id);
});

const ETAPES_MINIMUM = 3;

for (const mission of CONTENU.missions) {
  const probleme = [];
  proteger(() => {
    if (idsConnus.has(mission.id)) probleme.push("identifiant en double (exercice, mission ou chapitre)");
    idsConnus.add(mission.id);

    /* ── Forme de la mission (D069) ── */
    if (!Array.isArray(mission.etapes) || mission.etapes.length === 0) {
      probleme.push("aucune étape");
    } else if (mission.etapes.length < ETAPES_MINIMUM) {
      /* Deux raisons qui se rejoignent : le critère de conception demande au moins une étape qui requalifie un
         résultat précédent (donc deux pour établir, une pour requalifier), et en dessous de trois étapes la
         formule d'XP de Classe'R, versée une fois, dépasserait une série de même longueur (D069). */
      probleme.push(`${mission.etapes.length} étape(s) : une mission en porte au moins ${ETAPES_MINIMUM} (D069)`);
    }
    if (!Array.isArray(mission.competences) || !mission.competences.length)
      probleme.push("« competences » manquant : une mission traverse des compétences, c'est sa raison d'être");
    (mission.competences || []).forEach(c => {
      if (!CONTENU.competences.some(k => k.id === c)) probleme.push(`compétence inconnue : ${c}`);
    });
    if (![1, 2, 3].includes(mission.difficulte))
      probleme.push(`« difficulte » doit valoir 1, 2 ou 3 (reçu ${JSON.stringify(mission.difficulte)})`);
    if (!mission.resume || !String(mission.resume).trim())
      probleme.push("« resume » manquant : c'est lui qui annonce ce que la mission suppose acquis (D069)");
    if (!mission.duree || !String(mission.duree).trim())
      probleme.push("« duree » manquante : la carte l'affiche, et savoir si on en a pour 10 ou 30 minutes décide de commencer");
    if (!mission.contexte || !String(mission.contexte).trim())
      probleme.push("« contexte » manquant : une mission sans situation d'entreprise n'est qu'une série d'exercices");
    if (!mission.retenir || !String(mission.retenir).trim())
      probleme.push("« retenir » manquant : sans lui la mission n'a aucun endroit pour dire ce qu'elle a enseigné (D069)");
    if (mission.jeu !== undefined && !JEUX.some(j => j.id === mission.jeu))
      probleme.push(`jeu de données inconnu : ${mission.jeu}`);

    /* ── Chaque étape, aux mêmes contrôles SQL qu'un exercice `requete` ── */
    (mission.etapes || []).forEach((etape, i) => {
      const p = [];
      if (etape.jeu !== undefined && !JEUX.some(j => j.id === etape.jeu)) {
        /* Contrôlé AVANT d'appeler seedDe, qui jetterait : un jeu mal orthographié doit donner un message,
           pas une exception (défaut relevé au lot 11). */
        p.push(`jeu de données inconnu : ${etape.jeu}`);
        probleme.push(`étape ${i + 1} — ${p.join(" ; ")}`);
        return;
      }
      if (!etape.consigne || !String(etape.consigne).trim()) p.push("« consigne » manquante");
      if (!etape.solution || !String(etape.solution).trim()) p.push("« solution » manquante");
      (etape.competences || []).forEach(c => {
        if (!CONTENU.competences.some(k => k.id === c)) p.push(`compétence inconnue : ${c}`);
      });

      /* Indices gradués, comme pour un exercice : au moins un indice avant la solution révélée. Sans cela le
         seul indice d'une étape EST sa solution, et le bouton l'offre d'emblée — l'échelle n'existe pas. */
      const indices = Indices.pour(etape);
      if (indices.length < 2) p.push("indices incomplets : au moins un indice est attendu avant la solution révélée");
      else if (!indices[indices.length - 1].revele) p.push("les indices ne se terminent pas par la solution révélée");
      if (etape.clause && !CLAUSES[etape.clause]) p.push(`clause inconnue de CLAUSES : ${etape.clause}`);

      if (etape.solution) {
        const jumeau = solutionsExercices.get(normaliserSQL(etape.solution));
        if (jumeau) p.push(`solution identique à celle de l'exercice ${jumeau} : une mission remet en situation, elle ne recopie pas (D069)`);

        surLeJeuDe({ jeu: etape.jeu || mission.jeu });
        const jeu = verifierSQLReference(etape.solution, etape, p);
        /* D029 : la coupe d'un LIMIT final ne doit pas tomber au milieu d'un groupe d'ex æquo. Appliqué aux
           exercices depuis le lot 5, il manquait aux étapes — alors qu'une mission finit souvent par un
           classement et que le seed porte des ex æquo partout (P5). */
        verifierCoupeLimit(etape.solution, etape.comparer && etape.comparer.ordonne, p);
        if (jeu) verifierRienValideAvance(jeu, etape.comparer, p);
      }
      if (p.length) probleme.push(`étape ${i + 1} — ${p.join(" ; ")}`);
    });
  }, probleme);
  enregistrer("mission", mission.id, null, mission.titre || mission.id, probleme);
}

/* ══════════════════════════════════════════════════════════════
   CHAPITRES (D050)
   ══════════════════════════════════════════════════════════════ */

for (const chap of CHAPITRES.filter(c => !PALIER_FILTRE || c.niveau === PALIER_FILTRE)) {
  const probleme = [];
  proteger(() => {
    if (idsConnus.has(chap.id)) probleme.push("identifiant en double (exercice, mission ou chapitre)");
    idsConnus.add(chap.id);
    if (!PALIERS.some(p => p.id === chap.niveau)) probleme.push(`palier inconnu : ${chap.niveau}`);
    if (chap.jeu !== undefined && !JEUX.some(j => j.id === chap.jeu)) probleme.push(`jeu de données inconnu : ${chap.jeu}`);

    const cites = chap.exercices || [];
    const vus = new Set();
    cites.forEach(id => {
      if (!CONTENU.exercices.some(e => e.id === id)) probleme.push(`exercice cité inexistant : ${id}`);
      if (vus.has(id)) probleme.push(`exercice cité deux fois : ${id}`);
      vus.add(id);
    });

    const l = chap.lecon || {};
    if (!l.intro || !String(l.intro).trim()) probleme.push("leçon sans intro");
    if (!Array.isArray(l.points) || !l.points.length) probleme.push("leçon sans points à retenir");
    if (!l.exemple || !l.exemple.code) probleme.push("leçon sans exemple de code");
    else {
      surLeJeuDe(chap);                    // l'exemple « testable » s'exécute sur le jeu du chapitre
      const r = executer(l.exemple.code);
      if (r.erreur) probleme.push(`l'exemple de la leçon ne s'exécute pas sur le seed : ${r.erreur}`);
      else if (r.ecritures) probleme.push("l'exemple de la leçon écrit dans la base : hors programme");
      else {
        /* Ce que l'exemple RENVOIE, pas seulement le fait qu'il s'exécute (D068). L'auteur déclare le nombre de
           lignes de chaque jeu de résultats ; on le compare à ce qui sort vraiment. Aucune analyse du texte de
           `resultat` n'est tentée : la prose annonce aussi des VALEURS, et la lire demanderait une heuristique
           qui se tromperait (mesuré : une expression régulière sur « N lignes » donne 6 faux positifs sur 61,
           parce qu'une leçon cite couramment le nombre de lignes d'une TABLE). La justesse des valeurs et de la
           prose reste donc un point de relecture humaine, rappelé en pied de rapport. */
        const obtenues = r.jeux.map(j => j.lignes.length);
        const declarees = l.exemple.lignes;
        if (!Array.isArray(declarees) || declarees.some(n => !Number.isInteger(n) || n < 0))
          probleme.push(`l'exemple doit déclarer « lignes », un tableau du nombre de lignes de chaque jeu de résultats (obtenu : [${obtenues.join(", ")}])`);
        else if (declarees.length !== obtenues.length)
          probleme.push(`l'exemple renvoie ${obtenues.length} jeu(x) de résultats, « lignes » en déclare ${declarees.length} ([${obtenues.join(", ")}] contre [${declarees.join(", ")}])`);
        else if (declarees.some((n, i) => n !== obtenues[i]))
          probleme.push(`l'exemple ne renvoie pas ce que la leçon déclare : [${obtenues.join(", ")}] au lieu de [${declarees.join(", ")}]`);
      }
    }
  }, probleme);
  enregistrer("chapitre", chap.id, chap.niveau, chap.titre || chap.id, probleme);
}

/* ══════════════════════════════════════════════════════════════
   QCM — DISTRIBUTION BILATÉRALE (D040), SUR TOUT LE CONTENU RÉEL
   (les exercices demo: true sont exclus : ils disparaîtront au lot 6 et ne sont pas du contenu réel)
   ══════════════════════════════════════════════════════════════ */

if (!PALIER_FILTRE) {
  const reels = CONTENU.exercices.filter(e => !e.demo && e.type === "qcm");
  const parTaille = new Map();
  reels.forEach(ex => {
    const position = TYPES_EXERCICE.qcm.ordreAffichage(ex).indexOf(ex.reponse);
    if (position < 0) return;    // reponse déjà signalée invalide plus haut
    const k = ex.options.length;
    if (!parTaille.has(k)) parTaille.set(k, []);
    parTaille.get(k).push(position);
  });
  for (const [k, positions] of parTaille) {
    const c = TYPES_EXERCICE.qcm.controleDistribution(positions, k);
    couverture(`qcm-distribution-${k}`, `Distribution des bonnes réponses — ${positions.length} QCM à ${k} options`, c.ok, true, c.raison || `${positions.length} QCM`);
  }
}

/* ══════════════════════════════════════════════════════════════
   COUVERTURE (D051) — avertissement tant que le palier concerné n'est pas « termine », bloquant ensuite
   ══════════════════════════════════════════════════════════════ */

if (!PALIER_FILTRE) {
  const N_MIN_PAR_COMPETENCE = 6;
  const reels = CONTENU.exercices.filter(e => !e.demo);

  for (const comp of CONTENU.competences.filter(c => c.actif !== false)) {
    const n = reels.filter(e => e.competence === comp.id).length;
    const palier = PALIERS.find(p => p.id === comp.niveau);
    couverture(`competence-${comp.id}`, `Compétence « ${comp.nom} » : au moins ${N_MIN_PAR_COMPETENCE} exercices`,
      n >= N_MIN_PAR_COMPETENCE, !!(palier && palier.termine), `${n} exercice(s)`);
  }

  const tousLesPaliersTermines = PALIERS.every(p => p.termine);
  for (const piege of PIEGES) {
    const exos = reels.filter(e => Array.isArray(e.pieges) && e.pieges.includes(piege)).map(e => e.id);
    couverture(`piege-${piege}`, `Piège ${piege} exercé par au moins un exercice`, exos.length > 0, tousLesPaliersTermines, exos.join(", "));
  }

  /* Les anomalies de l'export brut, jumelles des pièges — mais elles n'appartiennent qu'au palier 5 : le contrôle
     devient bloquant dès que CE palier est déclaré terminé, pas quand tous le sont. Une anomalie qu'aucun exercice
     n'exerce est une anomalie entretenue pour rien, et le jeu est gelé : autant le savoir avant de le geler. */
  const palierP5 = PALIERS.find(p => p.id === "P5");
  for (const anomalie of ANOMALIES) {
    const exos = reels.filter(e => Array.isArray(e.anomalies) && e.anomalies.includes(anomalie)).map(e => e.id);
    couverture(`anomalie-${anomalie}`, `Anomalie ${anomalie} de l'export brut exercée par au moins un exercice`,
      exos.length > 0, !!(palierP5 && palierP5.termine), exos.join(", "));
  }

  const citesParChapitre = new Set();
  CHAPITRES.forEach(c => (c.exercices || []).forEach(id => citesParChapitre.add(id)));
  for (const ex of reels) {
    const palier = PALIERS.find(p => p.id === ex.niveau);
    couverture(`chapitre-pour-${ex.id}`, `« ${ex.id} » accessible depuis au moins un chapitre`, citesParChapitre.has(ex.id), !!(palier && palier.termine));
  }
}

/* ══════════════════════════════════════════════════════════════
   RAPPORT — groupé par palier ; vert en une ligne, rouge détaillé ; couverture ; limites en PIED de rapport
   ══════════════════════════════════════════════════════════════ */

console.log(`\nAutotest du contenu${PALIER_FILTRE ? ` — palier ${PALIER_FILTRE} seulement` : ""}\n`);

const section = titre => console.log(`── ${titre} ──`);
const ligne = it => {
  if (!it.probleme.length) { console.log(`  ✔ ${it.id} — ${it.titre}`); return; }
  console.log(`  ✘ ${it.id} — ${it.titre}`);
  it.probleme.forEach(p => console.log(`      · ${p}`));
};

for (const palier of PALIERS.filter(p => !PALIER_FILTRE || p.id === PALIER_FILTRE)) {
  const items = rapport.filter(it => it.categorie === "exercice" && it.niveau === palier.id);
  if (!items.length) continue;
  section(`Palier ${palier.id} · ${palier.titre} (${palier.termine ? "terminé" : "en cours"})`);
  items.forEach(ligne);
  console.log("");
}
const sansExercices = rapport.every(it => it.categorie !== "exercice");
if (sansExercices) console.log("Exercices : aucun pour l'instant.\n");

const chapitres = rapport.filter(it => it.categorie === "chapitre");
if (chapitres.length) { section("Chapitres"); chapitres.forEach(ligne); console.log(""); }

const missions = rapport.filter(it => it.categorie === "mission");
if (missions.length) { section("Missions"); missions.forEach(ligne); console.log(""); }
else console.log("Missions : aucune pour l'instant.\n");

if (!PALIER_FILTRE) {
  section("Couverture");
  couvertureRapport.forEach(c => {
    const etat = c.ok ? "✔" : c.bloquant ? "✘" : "·";
    console.log(`  ${etat} ${c.titre}${c.detail ? ` (${c.detail})` : ""}`);
  });
  console.log("");
} else {
  console.log("(Couverture non évaluée : --palier restreint le rejeu à un seul palier.)\n");
}

const enEchec = rapport.filter(it => it.probleme.length);
const couvertureBloquante = couvertureRapport.filter(c => !c.ok && c.bloquant);
const couvertureAvertissement = couvertureRapport.filter(c => !c.ok && !c.bloquant);

if (!enEchec.length && !couvertureBloquante.length) console.log("Tout est vert.");
else console.log(`${enEchec.length} exercice(s)/mission(s)/chapitre(s) en échec ; ${couvertureBloquante.length} contrôle(s) de couverture bloquant(s).`);
if (couvertureAvertissement.length) console.log(`${couvertureAvertissement.length} avertissement(s) de couverture (palier non encore déclaré « termine »).`);

console.log("\nCe que l'Autotest NE PEUT PAS juger : la clarté d'un énoncé, l'ambiguïté d'une consigne, la justesse d'une\nexplication, le dosage de la difficulté, la progression d'un palier. Aucune heuristique n'est tentée sur ces\npoints — une métrique approximative y donnerait une fausse sécurité. « Tout est vert » ne porte que sur ce que\nce script sait mesurer : la relecture humaine reste nécessaire sur le reste.\n\nEn particulier, sur les LEÇONS : le nombre de lignes de chaque exemple est désormais contrôlé (champ « lignes »),\nmais les VALEURS que la prose annonce — « 735 d'un côté, 1934 de l'autre » — ne le sont pas, faute de pouvoir les\nlire sans heuristique. Point de relecture permanent : rejouer les exemples et comparer leur résultat à ce que la\nleçon en dit, en particulier après toute évolution d'un seed.\n");

process.exit(enEchec.length || couvertureBloquante.length ? 1 : 0);
