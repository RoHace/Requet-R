"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — types d'exercices (lot 3 ; DECISIONS.md D028 à D035)
   Chaque type sait se rendre et se valider : ajouter un type = ajouter une entrée de TYPES_EXERCICE.
   Les `valider` sont PURS (aucun DOM) et se chargent sous Node ; seuls les `rendre` touchent au DOM, par des fonctions
   (el, editeurSQL, blocsExecution, tableResultat…) que app.js définit et qui ne sont appelées qu'à l'exécution.
   Globaux : Moteur (moteur.js), Comparateur (comparateur.js), CONTENU et CLAUSES (contenu.js).

   Contrat de `api`, fourni à `rendre` par l'écran d'exercice (app.js) :
     api.repondre(r)       valide la réponse r et affiche le retour ; renvoie le verdict
     api.surRetour(fn)     fn(verdict) est appelée après chaque réponse
     api.brouillon         dernier texte tapé dans l'éditeur (en mémoire seulement), ou null
     api.surBrouillon(v)   à appeler à chaque frappe
     api.reponsePrecedente réponse déjà donnée à cet exercice, ou null
   Verdict commun : { statut: "reussi" | "incorrect" | "non-evalue", reussi, compte, code, constat, pistes, notes, details, … }
   ═══════════════════════════════════════════════════════════ */

/* ── Résultats attendus : calculés en exécutant la référence, jamais saisis (D032, D035) ── */
const Attendus = (() => {
  const cache = new Map();
  const executer = (sql, porteur) => {
    /* Le jeu de données de l'exercice (D027/D068, `jeu: "export"` au palier 5) ; la boutique par défaut. */
    const r = Moteur.executerIsole(sql, { seed: seedDe(porteur), plafond: false });   // une solution de référence n'est jamais plafonnée (D036)
    if (r.erreur) throw new Error(`la requête de référence plante : ${r.erreur}`);
    if (!r.jeux.length) throw new Error("la requête de référence ne renvoie aucun jeu de résultats");
    return r.jeux[r.jeux.length - 1];
  };
  const memo = (cle, produire) => { if (!cache.has(cle)) cache.set(cle, produire()); return cache.get(cle); };
  return {
    /** Résultat attendu d'un exercice `requete` ou `corriger` : celui de sa solution, sur une base propre. Calculé une fois. */
    de: ex => memo(`sol:${ex.id}`, () => executer(ex.solution, ex)),
    /** Vraie réponse d'un exercice `predire` : le résultat de la requête montrée, son nombre de lignes, sa cellule. */
    predire: ex => memo(`pre:${ex.id}`, () => {
      const jeu = executer(ex.requete, ex);
      if (ex.predit === "valeur" && !(jeu.colonnes.length === 1 && jeu.lignes.length === 1))
        throw new Error(`predire « valeur » : la requête de ${ex.id} doit renvoyer une seule cellule (reçu ${jeu.lignes.length} ligne(s) et ${jeu.colonnes.length} colonne(s))`);
      return { jeu, nbLignes: jeu.lignes.length, valeur: ex.predit === "valeur" ? jeu.lignes[0][0] : null };
    })
  };
})();

/** Verdict d'un exercice SQL (requete, corriger) : la requête de l'apprenant est exécutée sur une base jetable, neuve, et son
 *  résultat comparé à celui de la solution. Le texte de la requête n'entre jamais en jeu (D028), sauf D033. */
function validerRequete(ex, sql) {
  return Comparateur.evaluer({ attendu: Attendus.de(ex), rapport: Moteur.executerIsole(sql, { seed: seedDe(ex) }),
    options: ex.comparer || {}, sql, base: CONTENU.base });
}

/** Bloc commun à `requete` et `corriger` : éditeur, Exécuter (base vivante), Vérifier (base jetable), Réinitialiser. */
function rendreSQL(ex, api, { depart = null } = {}) {
  const sortie = el("div.resultat", { "aria-live": "polite" });
  const editeur = editeurSQL({
    valeur: typeof api.brouillon === "string" ? api.brouillon : (depart || ""),
    etiquette: "Requête SQL",
    surChange: v => api.surBrouillon(v),
    surExecuter: () => lancer(),
    surVerifier: () => api.repondre(editeur.valeur())
  });
  function lancer() { sortie.replaceChildren(...blocsExecution(Moteur.executer(editeur.valeur()))); }
  const barre = el("div.sql-barre", {},
    el("button.btn", { type: "button", onclick: lancer }, "Exécuter"),
    el("button.btn.btn--fort", { type: "button", onclick: () => api.repondre(editeur.valeur()) }, "Vérifier"),
    el("span.tres-muet.sql-aide", {}, "Ctrl + Entrée exécute · Ctrl + Maj + Entrée vérifie"),
    el("span.sql-barre__espace"),
    depart ? el("button.btn.btn--nu", { type: "button", onclick: () => { editeur.definir(depart); editeur.focus(); } }, "Remettre la requête de départ") : null,
    el("button.btn.btn--nu", { type: "button", onclick: () => { const ms = nouvelleBase(seedDe(ex)); sortie.replaceChildren(); Toast.afficher(`Base reconstruite en ${ms} ms.`, "accent"); } }, "Réinitialiser la base"));
  if (!api.reponsePrecedente) setTimeout(() => editeur.focus(), 60);
  return el("div", {},
    depart ? el("p.muet.exo__depart", {}, "Requête fautive de départ : modifie-la, exécute-la pour voir ce qu'elle donne, puis vérifie.") : null,
    editeur.element, barre, sortie);
}

/** Lit ce que l'apprenant annonce pour un résultat d'une cellule : NULL, un nombre (virgule ou point), sinon un texte. */
function lireValeurAnnoncee(texte) {
  if (/^null$/i.test(texte)) return null;
  const nombre = texte.replace(/ /g, "").replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(nombre) ? Number(nombre) : texte;
}

const TYPES_EXERCICE = {

  qcm: {
    /** Graine d'un identifiant : FNV-1a 32 bits sur ses octets UTF-8 (D040). Elle disperse correctement des identifiants
     *  séquentiels (qcm-01, qcm-02…), ce que la somme de caractères de Classe'R ne faisait pas. */
    graine(id) {
      let h = 0x811c9dc5;
      for (const octet of new TextEncoder().encode(String(id))) { h ^= octet; h = Math.imul(h, 0x01000193); }
      return h >>> 0;
    },

    /** Les options sont écrites avec la bonne réponse en tête : elles sont mélangées à l'affichage, sinon la position suffirait
     *  à répondre. Le mélange est déterministe — la graine ne dépend que de l'identifiant — pour rester stable entre le rendu et
     *  la correction, tout en différant d'un exercice à l'autre. Mélange de Fisher-Yates ; flux pseudo-aléatoire mulberry32 amorcé
     *  par la graine FNV-1a (entiers 32 bits sûrs : le congruentiel de Classe'R sortait des entiers exacts de JavaScript). */
    ordreAffichage(ex) {
      let a = TYPES_EXERCICE.qcm.graine(ex.id);
      const suivant = () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const ordre = ex.options.map((_, i) => i);
      for (let i = ordre.length - 1; i > 0; i--) {
        const j = Math.floor(suivant() * (i + 1));
        [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
      }
      return ordre;
    },

    /** Contrôle de distribution des bonnes réponses, BILATÉRAL (D040) : sur l'ensemble des QCM, aucune position ne doit être
     *  sur-représentée (plafond 45 %, dès 10 QCM) ni sous-représentée (plancher, dès 20 QCM). Le plancher dépend de la taille de
     *  l'échantillon — 1/k − 2,5 écarts-types d'un tirage uniforme — et ne dépasse jamais 15 % : un plancher fixe à 15 % se
     *  déclencherait sur 16 à 38 % des lots parfaitement aléatoires de 30 à 40 QCM. Un lot aléatoire déclenche encore ≈ 3 % du temps :
     *  en cas d'alerte, changer un identifiant (le mélange en dépend), ce n'est pas un défaut du contenu.
     *  `positions` : la position affichée de la bonne réponse de chaque QCM (0 pour A) ; `nbOptions` : le nombre de positions. */
    controleDistribution(positions, nbOptions = 4) {
      const n = positions.length, k = nbOptions;
      const comptes = Array.from({ length: k }, () => 0);
      positions.forEach(p => { comptes[p]++; });
      const PLAFOND = 0.45;
      const plancher = n >= 20 ? Math.min(0.15, 1 / k - 2.5 * Math.sqrt((1 / k) * (1 - 1 / k) / n)) : null;
      const pct = x => `${(x * 100).toFixed(1).replace(".", ",")} %`;
      const lettre = i => String.fromCharCode(65 + i);
      let raison = null;
      if (n >= 10) {
        const i = comptes.indexOf(Math.max(...comptes));
        if (comptes[i] / n > PLAFOND) raison = `la bonne réponse tombe trop souvent en position ${lettre(i)} : ${comptes[i]} fois sur ${n} (${pct(comptes[i] / n)} ; plafond ${pct(PLAFOND)})`;
      }
      if (!raison && plancher !== null) {
        const j = comptes.indexOf(Math.min(...comptes));
        if (comptes[j] / n < plancher) raison = `la bonne réponse tombe rarement en position ${lettre(j)} : ${comptes[j]} fois sur ${n} (${pct(comptes[j] / n)} ; plancher ${pct(plancher)})`;
      }
      return { ok: !raison, raison, n, comptes, plafond: PLAFOND, plancher };
    },

    rendre(ex, api) {
      const boite = el("div.choix");
      const ordre = TYPES_EXERCICE.qcm.ordreAffichage(ex);
      ordre.forEach((source, position) => {
        boite.append(el("button", { type: "button", onclick: () => api.repondre(source) },
          el("span.lettre", {}, String.fromCharCode(65 + position)),
          el("span", {}, ex.options[source])));
      });
      api.surRetour(res => {
        [...boite.children].forEach((b, position) => {
          const source = ordre[position];
          b.disabled = true;
          if (source === ex.reponse) b.dataset.etat = "juste";
          else if (source === res.reponse) b.dataset.etat = "faux";
        });
      });
      return boite;
    },

    valider(ex, r) {
      const reussi = r === ex.reponse;
      return { statut: reussi ? "reussi" : "incorrect", reussi, compte: true, code: reussi ? "ok" : "mauvais-choix",
        constat: reussi ? "" : `La bonne réponse était : ${ex.options[ex.reponse]}`, pistes: [], notes: [], details: "", reponse: r };
    }
  },

  requete: {
    rendre(ex, api) { return rendreSQL(ex, api); },

    valider(ex, sql) { return validerRequete(ex, sql); }
  },

  corriger: {
    rendre(ex, api) { return rendreSQL(ex, api, { depart: ex.depart }); },

    valider(ex, sql) { return validerRequete(ex, sql); }
  },

  /** Annoncer le résultat AVANT d'exécuter : un nombre de lignes (`nbLignes`) ou la valeur d'un résultat d'une cellule (`valeur`).
   *  La bonne réponse est calculée en exécutant la requête, donc ne peut jamais diverger du seed (D035). */
  predire: {
    rendre(ex, api) {
      const nombre = ex.predit === "nbLignes";
      const champ = el("input.saisie-reponse", {
        type: "text", inputmode: nombre ? "numeric" : "text", spellcheck: "false", autocomplete: "off",
        "aria-label": nombre ? "Nombre de lignes" : "Valeur renvoyée",
        placeholder: nombre ? "Un nombre entier" : "Une valeur (NULL si rien)", value: api.reponsePrecedente || ""
      });
      const valider = () => api.repondre(champ.value);
      champ.addEventListener("keydown", e => { if (e.key === "Enter") valider(); });
      const bouton = el("button.btn.btn--fort", { type: "button", onclick: valider }, "Répondre");
      const revele = el("div.resultat", { "aria-live": "polite" });
      api.surRetour(res => {
        if (res.statut === "non-evalue") return;                  // saisie illisible : on peut réessayer
        champ.disabled = true; bouton.disabled = true;
        revele.replaceChildren(el("h3.resultat__titre", {}, "Voici ce que SQLite renvoie"), tableResultat(res.resultat, 8));
        if (res.resultat.lignes.length > 8) revele.append(el("p.resultat__note", {}, `… ${res.resultat.lignes.length - 8} lignes de plus.`));
      });
      if (!api.reponsePrecedente) setTimeout(() => champ.focus(), 60);
      return el("div", {},
        el("pre.sql-lecture", { "aria-label": "Requête à analyser" }, ex.requete),
        el("div.predire__saisie", {}, champ, bouton),
        revele);
    },

    valider(ex, saisie) {
      const vrai = Attendus.predire(ex);
      const texte = String(saisie === null || saisie === undefined ? "" : saisie).normalize("NFC").replace(/[\s  ]+/g, " ").trim();
      const verdict = (reussi, constat) => ({ statut: reussi ? "reussi" : "incorrect", reussi, compte: true, code: reussi ? "ok" : "mauvaise-prevision",
        constat, pistes: [], notes: [], details: "", resultat: vrai.jeu });
      const illisible = constat => ({ statut: "non-evalue", reussi: false, compte: false, code: "saisie-invalide", constat, pistes: [], notes: [], details: "", resultat: vrai.jeu });
      if (ex.predit === "nbLignes") {
        const m = /^(\d+)(?: lignes?)?$/i.exec(texte);
        if (!m) return illisible("Répondez par un nombre entier de lignes (par exemple 12).");
        const annonce = Number(m[1]);
        return verdict(annonce === vrai.nbLignes, annonce === vrai.nbLignes ? ""
          : `Vous avez annoncé ${annonce} ${annonce > 1 ? "lignes" : "ligne"} ; la requête en renvoie ${vrai.nbLignes}.`);
      }
      if (!texte) return illisible("Répondez par la valeur que la requête renvoie (NULL si elle ne renvoie rien).");
      const annonce = lireValeurAnnoncee(texte);
      const juste = Comparateur.comparer({ colonnes: ["v"], lignes: [[vrai.valeur]] }, { colonnes: ["v"], lignes: [[annonce]] }, { texte: ex.texte || "strict" }).egal;
      return verdict(juste, juste ? "" : `Vous avez annoncé ${Comparateur.formater(annonce)} ; la requête renvoie ${Comparateur.formater(vrai.valeur)}.`);
    }
  }
};

/* ── Indices progressifs : Piste → Clause → Exemple → Solution ─────────────────────────────
   Le niveau « Clause » remplace le niveau « Fonction » de Classe'R : il est tiré de CLAUSES, le futur lexique SQL. */
const Indices = {
  pour(ex) {
    const liste = [];
    if (ex.piste) liste.push({ titre: "Piste", texte: ex.piste });
    const clause = ex.clause && CLAUSES[ex.clause];
    if (clause) liste.push({ titre: "Clause", texte: `${clause.syntaxe} — ${clause.aide}.` });
    if (ex.exemple) liste.push({ titre: "Exemple", texte: ex.exemple });
    if (ex.type === "qcm" && ex.options && ex.options[ex.reponse] !== undefined) liste.push({ titre: "Solution", texte: ex.options[ex.reponse], revele: true });
    else if (ex.solution) liste.push({ titre: "Une solution possible", texte: ex.solution, revele: true });   // `predire` n'en révèle aucune : sa solution, c'est le résultat montré après la réponse
    return liste;
  }
};
