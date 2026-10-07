"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — comparateur de résultats (lot 3 ; DECISIONS.md D028 à D034)
   On compare le RÉSULTAT, jamais le texte de la requête. Un refus à tort coûte bien plus qu'une acceptation à tort :
   en cas de doute, on accepte (D028).
   Ce fichier est PUR : ni DOM, ni date, ni hasard (D001). Il est chargé tel quel par le navigateur et par
   verifier-comparateur.mjs (Node). Un « jeu » est { colonnes: [noms], lignes: [[cellules]] } ; une cellule vaut
   null, un nombre, un texte ou un Uint8Array (blob).
   Message d'écart (D034) : le CONSTAT est un fait, toujours vrai. Une PISTE n'est donnée que si c'est un fait ou un lieu
   où regarder, jamais une hypothèse sur l'intention ; entre une piste précise mais incertaine et le seul constat, on donne
   le constat. Un résultat attendu d'UNE seule cellule n'est jamais exposé : constat et diagnostics, pas la valeur.
   ═══════════════════════════════════════════════════════════ */
const Comparateur = (() => {

  /* ── Cellules (D031) ───────────────────────────────────── */
  /** Tolérance relative sur les nombres : |a − b| ≤ 1e-9 · max(1, |a|, |b|). Le bruit des doubles est ≈ 1e-16 (≤ 1e-13 après
   *  des sommes de quelques centaines de termes) ; le plus fin arrondi qu'une consigne puisse demander, ROUND(x, 2),
   *  a une résolution de 1e-2 : sept ordres de grandeur plus haut, donc jamais confondu avec un résultat non arrondi. */
  const TOLERANCE = 1e-9;
  /** Écart relatif en deçà duquel deux valeurs sont dites « proches ». Il ne choisit que le LIBELLÉ du constat, jamais le verdict. */
  const SEUIL_PROCHES = 0.1;

  const hexa = octets => Array.from(octets, o => o.toString(16).padStart(2, "0")).join("");

  /** Forme canonique d'une cellule : celle qui sert à comparer ET à trier.
   *  - texte normalisé en NFC (invisible) ; en mode « souple » : bords retirés et minuscules ;
   *  - un texte qui est EXACTEMENT l'affichage d'un nombre est ce nombre (« 2025 » = 2025) ; « 007 » ou « 3.50 » restent du texte ;
   *  - un blob devient un texte préfixé (comparaison octet par octet). */
  function canonique(v, souple) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return v;
    if (typeof v === "bigint") return Number(v);
    if (typeof v === "string") {
      let s = v.normalize("NFC");
      if (souple) s = s.trim().toLowerCase();
      const n = Number(s);
      return s !== "" && Number.isFinite(n) && String(n) === s ? n : s;
    }
    if (ArrayBuffer.isView(v)) return "\u0000blob:" + hexa(v);
    return String(v);
  }

  const rang = v => (v === null ? 0 : typeof v === "number" ? 1 : 2);        // NULL < nombre < texte

  function procheNombre(a, b) {
    if (a === b) return true;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.isNaN(a) && Number.isNaN(b);
    return Math.abs(a - b) <= TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b));
  }

  /** Ordre total sur les cellules, tolérant : deux nombres « proches » sont à égalité (0). Sert au tri ET à l'égalité,
   *  d'où un appariement sans clé arrondie (un arrondi crée des frontières où deux valeurs quasi égales tombent de part
   *  et d'autre). La non-transitivité théorique de la tolérance est sans effet ici : l'écart minimal entre deux valeurs
   *  distinctes du jeu (0,25 sur les montants) dépasse 1e-9 de huit ordres de grandeur. */
  function cmpCellule(a, b) {
    const ra = rang(a), rb = rang(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return 0;
    if (ra === 1) return procheNombre(a, b) ? 0 : (a < b ? -1 : 1);
    return a < b ? -1 : a > b ? 1 : 0;
  }

  function cmpLigne(a, b) {
    for (let i = 0; i < a.length; i++) { const c = cmpCellule(a[i], b[i]); if (c) return c; }
    return 0;
  }

  const cmpSur = (cles, a, b) => { for (const i of cles) { const c = cmpCellule(a[i], b[i]); if (c) return c; } return 0; };

  const canoniserJeu = (jeu, souple) => jeu.lignes.map(l => Array.from(l, v => canonique(v, souple)));

  /* ── Lignes : multi-ensemble (D029) ────────────────────── */
  /** Différence de deux multi-ensembles de lignes canoniques, par tri puis fusion. Renvoie les indices (dans l'ordre d'origine)
   *  des lignes attendues sans correspondance (manquantes) et des lignes obtenues sans correspondance (en trop). */
  function diffMulti(E, O) {
    const trier = L => L.map((r, i) => ({ r, i })).sort((x, y) => cmpLigne(x.r, y.r) || x.i - y.i);
    const e = trier(E), o = trier(O);
    const manquantes = [], enTrop = [];
    let i = 0, j = 0, communes = 0;
    while (i < e.length && j < o.length) {
      const c = cmpLigne(e[i].r, o[j].r);
      if (c === 0) { communes++; i++; j++; }
      else if (c < 0) manquantes.push(e[i++].i);
      else enTrop.push(o[j++].i);
    }
    while (i < e.length) manquantes.push(e[i++].i);
    while (j < o.length) enTrop.push(o[j++].i);
    return { communes, manquantes, enTrop, egal: !manquantes.length && !enTrop.length };
  }

  /** Les lignes distinctes (doublons retirés, comparaison tolérante). */
  function distinctes(L) {
    const t = [...L].sort(cmpLigne);
    return t.filter((r, i) => i === 0 || cmpLigne(t[i - 1], r) !== 0);
  }

  /** L'ordre attendu est-il respecté ? Précondition : mêmes lignes en multi-ensemble. Le résultat attendu est découpé en
   *  séquences de clé identique (les ex æquo) ; la ligne du même rang dans le résultat obtenu doit appartenir à la même
   *  séquence, dans n'importe quel ordre à l'intérieur (D029). */
  function ordreRespecte(E, O, cles) {
    let debut = 0;
    while (debut < E.length) {
      let fin = debut + 1;
      while (fin < E.length && cmpSur(cles, E[fin], E[debut]) === 0) fin++;
      if (!diffMulti(E.slice(debut, fin), O.slice(debut, fin)).egal) return false;
      debut = fin;
    }
    return true;
  }

  function clesDe(ordonne, nbColonnes) {
    if (ordonne === true) return Array.from({ length: nbColonnes }, (_, i) => i);
    const cles = ordonne.cles;
    if (!Array.isArray(cles) || !cles.length || cles.some(i => !Number.isInteger(i) || i < 0 || i >= nbColonnes))
      throw new Error(`ordonne.cles : indices de colonnes attendus entre 0 et ${nbColonnes - 1} (reçu ${JSON.stringify(cles)})`);
    return cles;
  }

  /* ── Colonnes (D030) ───────────────────────────────────── */
  const nomNormalise = n => String(n).normalize("NFC").trim().toLowerCase();

  const colonneTriee = (lignes, k) => lignes.map(l => l[k]).sort(cmpCellule);
  const memesCellules = (x, y) => x.length === y.length && x.every((v, i) => cmpCellule(v, y[i]) === 0);

  /** Cherche une injection f des colonnes de A dans celles de B telle que B projeté sur f redonne A (en multi-ensemble).
   *  Même nombre de lignes exigé. `croissant` impose de conserver l'ordre des colonnes. Renvoie f, ou null. */
  function chercherProjection(A, nbA, B, nbB, croissant) {
    const colsA = Array.from({ length: nbA }, (_, j) => colonneTriee(A, j));
    const colsB = Array.from({ length: nbB }, (_, k) => colonneTriee(B, k));
    const candidats = colsA.map(ca => colsB.map((cb, k) => (memesCellules(ca, cb) ? k : -1)).filter(k => k >= 0));
    if (candidats.some(c => !c.length)) return null;
    const f = [], pris = new Set();
    let essais = 0;
    const projeter = () => B.map(l => f.map(k => l[k]));
    function placer(j, dernier) {
      if (j === nbA) return ++essais <= 5000 && diffMulti(A, projeter()).egal;
      for (const k of candidats[j]) {
        if (pris.has(k) || (croissant && k < dernier)) continue;
        pris.add(k); f.push(k);
        if (placer(j + 1, k)) return true;
        f.pop(); pris.delete(k);
        if (essais > 5000) return false;
      }
      return false;
    }
    return placer(0, -1) ? f.slice() : null;
  }
  const projection = (A, nbA, B, nbB) => chercherProjection(A, nbA, B, nbB, true) || chercherProjection(A, nbA, B, nbB, false);

  /* ── Rédaction des constats ────────────────────────────── */
  const pl = (n, mot, plusieurs = mot + "s") => `${n} ${n > 1 ? plusieurs : mot}`;
  const accord = (n, mot) => (n > 1 ? mot + "s" : mot);

  /** Une cellule telle qu'on la dit : NULL, nombre à la française (virgule), texte entre guillemets. */
  function fmt(v) {
    if (v === null || v === undefined) return "NULL";
    if (typeof v === "number") return (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(10)))).replace(".", ",");
    if (typeof v === "string") return `« ${v} »`;
    if (ArrayBuffer.isView(v)) return `un blob de ${v.length} octet${v.length > 1 ? "s" : ""}`;
    return String(v);
  }

  const decimales = x => {
    if (!Number.isFinite(x) || Number.isInteger(x)) return 0;
    const s = String(x);
    return s.includes("e") ? 99 : (s.split(".")[1] || "").length;
  };
  const arrondir = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
  const ecartRelatif = (e, o) => Math.abs(o - e) / Math.max(Math.abs(e), Math.abs(o));
  const croissants = f => f.every((k, i) => !i || k > f[i - 1]);
  const ascendant = a => [...a].sort((x, y) => x - y);

  const PISTES = {
    aucuneLigne: "Cela vient souvent d'une condition (dans WHERE, ou dans le ON d'une jointure) qui n'est jamais vraie : une valeur mal écrite, ou deux colonnes comparées qui n'ont rien à voir.",
    select: "Les colonnes d'un résultat sont celles de la liste écrite après SELECT.",
    ordre: "L'ordre se règle avec ORDER BY : la colonne de tri, puis le sens (ASC croissant, DESC décroissant).",
    alias: "Un alias se donne avec AS : SELECT colonne AS nom.",
    ordreColonnes: "L'ordre des colonnes est celui de la liste écrite après SELECT.",
    uneLigne: "Une requête ne renvoie qu'une ligne quand elle agrège sans GROUP BY (COUNT, SUM…), quand elle a un LIMIT, ou quand son filtre ne retient qu'une ligne.",
    doublons: "Des lignes répétées viennent d'une jointure qui répète une ligne pour chaque ligne liée, ou d'un DISTINCT absent.",
    lignesRetenues: "Les lignes retenues dépendent de WHERE, des conditions ON des jointures, de HAVING et de LIMIT : comparez avec les lignes de la section « Écart ».",
    distinct: "DISTINCT et GROUP BY suppriment les lignes répétées.",
    nul: "NULL signifie « pas de valeur » : ce n'est ni 0 ni une chaîne vide.",
    division: "En SQLite, la division de deux entiers donne un entier (7 / 2 vaut 3) ; 7 / 2.0 vaut 3,5.",
    proches: "Le résultat dépend des lignes prises en compte et de la colonne utilisée : vérifiez les deux."
  };

  /* ── Comparaison ───────────────────────────────────────── */
  /** Compare le résultat obtenu au résultat attendu.
   *  options (déclarées par l'exercice) :
   *    ordonne  : false (défaut) | true (ordre exact) | { cles: [indices de colonnes] } (ordre exigé sur ces colonnes, ex æquo libres)
   *    colonnes : false (défaut : les noms sont ignorés) | true (les noms comptent, sans casse ni espaces de bord)
   *    texte    : "strict" (défaut) | "souple" (bords et casse ignorés)
   *  Renvoie { egal, code, constat, pistes, ecart, masque, attendu, obtenu } :
   *    code    : "ok" ou l'un des codes du catalogue (D034) ;
   *    masque  : vrai quand l'attendu n'a qu'UNE cellule — `attendu` vaut alors null et rien de sa valeur n'est écrit ;
   *    ecart   : mesures de l'écart (null si égal), dont les lignes manquantes / en trop pour l'affichage. */
  function comparer(attendu, obtenu, options = {}) {
    const souple = options.texte === "souple";
    const nE = attendu.colonnes.length, nO = obtenu.colonnes.length;
    const cles = options.ordonne ? clesDe(options.ordonne, nE) : null;
    const E = canoniserJeu(attendu, souple), O = canoniserJeu(obtenu, souple);
    const rE = E.length, rO = O.length;
    const masque = nE * rE === 1;

    const dimensions = () => ({ lignes: { obtenues: rO, attendues: rE }, colonnes: { obtenues: nO, attendues: nE } });
    const verdict = (code, constat, pistes = [], detail = {}) =>
      ({ egal: false, code, constat, pistes, ecart: { ...dimensions(), ...detail }, masque, attendu: masque ? null : attendu, obtenu });
    const lignesObtenues = `${pl(rO, "ligne")} ${accord(rO, "obtenue")}, ${rE} ${accord(rE, "attendue")}`;
    const detailLignes = d => masque ? {} : {
      communes: d.communes, nbManquantes: d.manquantes.length, nbEnTrop: d.enTrop.length,
      manquantes: ascendant(d.manquantes).slice(0, 3).map(i => attendu.lignes[i]),
      enTrop: ascendant(d.enTrop).slice(0, 3).map(i => obtenu.lignes[i]),
      absentsAttendus: ascendant(d.manquantes), absentsObtenus: ascendant(d.enTrop)
    };

    /* 1. Aucune ligne alors que des lignes sont attendues. */
    if (!rO && rE) return verdict("aucune-ligne", `Aucune ligne obtenue, ${rE} ${accord(rE, "attendue")}.`, [PISTES.aucuneLigne]);

    /* 2 et 3. Nombre de colonnes différent. Une injection des colonnes de l'un dans l'autre qui redonne les mêmes lignes
       désigne la colonne en trop ou manquante ; ce renseignement dirait pourtant quelle colonne est la bonne : jamais pour un 1×1. */
    if (nE !== nO) {
      if (!masque && rE === rO) {
        if (nO > nE) {
          const f = projection(E, nE, O, nO);
          if (f) {
            const extras = Array.from({ length: nO }, (_, k) => k).filter(k => !f.includes(k)).map(k => ({ position: k + 1, nom: obtenu.colonnes[k] }));
            const n = extras.length;
            return verdict("colonne-en-trop",
              `Les lignes sont les bonnes, mais votre résultat a ${n === 1 ? "une colonne" : n + " colonnes"} de trop : ${extras.map(c => `« ${c.nom} » (colonne n° ${c.position})`).join(", ")}.`
                + (croissants(f) ? "" : " Les autres colonnes ne sont pas dans l'ordre attendu."),
              [PISTES.select], { colonnesEnTrop: extras });
          }
        } else {
          const f = projection(O, nO, E, nE);
          if (f) {
            const absentes = Array.from({ length: nE }, (_, k) => k).filter(k => !f.includes(k)).map(k => ({ position: k + 1, nom: attendu.colonnes[k] }));
            const n = absentes.length;
            return verdict("colonne-manquante",
              `Les colonnes que vous donnez sont justes, mais il en manque ${n === 1 ? "une" : n} : ${absentes.map(c => `« ${c.nom} » (colonne n° ${c.position})`).join(", ")}.`
                + (croissants(f) ? "" : " Les colonnes présentes ne sont pas dans l'ordre attendu."),
              [PISTES.select], { colonnesManquantes: absentes });
          }
        }
      }
      return verdict("colonnes-nombre",
        `${nO} ${accord(nO, "colonne")} ${accord(nO, "obtenue")}, ${nE} ${accord(nE, "attendue")}. `
          + (rO === rE ? `Le nombre de lignes est le bon (${rE}).` : `${lignesObtenues}.`),
        [PISTES.select]);
    }

    /* 4. Mêmes colonnes en nombre : les lignes se comparent en multi-ensemble. */
    const d = diffMulti(E, O);
    if (d.egal) {
      if (cles && !ordreRespecte(E, O, cles))
        return verdict("ordre-lignes", "Les lignes sont les bonnes, mais pas dans l'ordre demandé.", [PISTES.ordre]);
      if (options.colonnes) {
        const diffs = attendu.colonnes.map((n, i) => ({ position: i + 1, attendu: n, obtenu: obtenu.colonnes[i] })).filter(c => nomNormalise(c.attendu) !== nomNormalise(c.obtenu));
        if (diffs.length)
          return verdict("noms-colonnes",
            `Les valeurs sont justes, mais la consigne impose ${diffs.map(c => `le nom « ${c.attendu} » à la colonne ${c.position} (${nO > 1 ? "la vôtre" : "votre colonne"} s'appelle « ${c.obtenu} »)`).join(" ; ")}.`,
            [PISTES.alias], { noms: diffs });
      }
      return { egal: true, code: "ok", constat: "", pistes: [], ecart: null, masque, attendu: masque ? null : attendu, obtenu };
    }

    /* 5. Les bonnes colonnes dans un autre ordre (jamais pour une seule colonne). */
    if (!masque && rE === rO && nE > 1 && chercherProjection(E, nE, O, nO, false))
      return verdict("colonnes-ordre",
        `Vous avez les bonnes colonnes, dans un autre ordre : la consigne demande ${attendu.colonnes.map(n => `« ${n} »`).join(" puis ")}.`,
        [PISTES.ordreColonnes]);

    /* 6. Les valeurs sont justes à la casse ou aux espaces de bord près (le mode strict les refuse, mais le dit). */
    const apparies = apparier(E, O, d);
    if (!souple && diffMulti(canoniserJeu(attendu, true), canoniserJeu(obtenu, true)).egal) {
      const diff = premiereDifference(attendu, obtenu, E, O, apparies);
      return verdict("casse-espaces",
        "Les valeurs sont justes, à la casse ou aux espaces de début et de fin près." + (masque || !diff ? "" : ` ${diff.phrase}`),
        [], masque ? {} : { ...detailLignes(d), difference: diff && diff.mesure });
    }

    /* Un attendu d'une seule cellule : dimensions et diagnostics numériques seulement, jamais la valeur ni ce qui la devine. */
    if (masque) {
      if (rO > 1) return verdict("plusieurs-lignes", `${rO} lignes obtenues ; une seule attendue.`);
      return constatValeurs();
    }

    /* 7 à 13. Les lignes diffèrent : on décrit l'écart. */
    if (rO > rE && diffMulti(distinctes(E), distinctes(O)).egal) {
      const sansDoublon = distinctes(E).length === rE;
      return verdict("doublons",
        `${lignesObtenues}. ` + (sansDoublon
          ? "Si vous supprimez les doublons de votre résultat, vous retrouvez exactement les lignes attendues."
          : "Les lignes distinctes de votre résultat sont bien celles attendues, mais certaines sont répétées plus souvent que prévu."),
        [PISTES.doublons], detailLignes(d));
    }
    if (rO === 1 && rE > 1)
      return verdict("une-seule-ligne", `Une seule ligne obtenue, ${rE} attendues.`, [PISTES.uneLigne], detailLignes(d));
    if (!d.manquantes.length && d.enTrop.length) {
      const n = d.enTrop.length;
      return verdict("lignes-en-trop",
        `${pl(n, "ligne")} en trop : toutes les lignes attendues sont présentes, mais votre résultat en contient ${n > 1 ? "d'autres" : "une autre"} (${rO} obtenues, ${rE} attendues).`,
        [PISTES.lignesRetenues], detailLignes(d));
    }
    if (!d.enTrop.length && d.manquantes.length) {
      const n = d.manquantes.length;
      if (diffMulti(distinctes(E), distinctes(O)).egal)
        return verdict("lignes-manquantes",
          `Les lignes distinctes attendues sont toutes présentes, mais le résultat attendu en répète certaines (${rO} obtenues, ${rE} attendues).`,
          [PISTES.distinct], detailLignes(d));
      return verdict("lignes-manquantes",
        `${pl(n, "ligne")} ${accord(n, "manquante")} : toutes vos lignes sont des lignes attendues, mais il en manque (${rO} obtenues, ${rE} attendues).`,
        [PISTES.lignesRetenues], detailLignes(d));
    }
    if (rE === 1 && rO > 1) return verdict("plusieurs-lignes", `${rO} lignes obtenues ; une seule attendue.`, [], detailLignes(d));
    if (rE === rO) return constatValeurs();
    const m = d.manquantes.length, t = d.enTrop.length;
    return verdict("partiel",
      `${pl(d.communes, "ligne")} en commun avec le résultat attendu ; ${m} ${accord(m, "ligne")} ${accord(m, "attendue")} ${m > 1 ? "manquent" : "manque"} et ${t} ${t > 1 ? "lignes sont" : "ligne est"} en trop (${rO} obtenues, ${rE} attendues).`,
      [PISTES.lignesRetenues], detailLignes(d));

    /* Même forme, cellules différentes (code 12) : on désigne la première cellule en écart, puis ce que les chiffres établissent. */
    function constatValeurs() {
      const diff = premiereDifference(attendu, obtenu, E, O, apparies);
      const k = d.manquantes.length;
      let constat = `Même forme que le résultat attendu (${pl(rE, "ligne")}, ${pl(nE, "colonne")}), mais ` + (masque ? "la valeur est différente." : k > 1 ? `${k} lignes diffèrent.` : "1 ligne diffère.");
      const pistes = [];
      if (diff && !masque) constat += ` ${diff.phrase}`;
      const faits = diagnosticsNumeriques(E, O, apparies, d, diff, masque);
      constat += faits.constat; pistes.push(...faits.pistes);
      return verdict("valeurs", constat, pistes, { ...detailLignes(d), ...(masque || !diff ? {} : { difference: diff.mesure }) });
    }
  }

  /* ── Appariement des lignes en écart ───────────────────── */
  /** Associe chaque ligne attendue sans correspondance à la ligne obtenue sans correspondance qui lui ressemble le plus
   *  (nombre de cellules égales). Ne sert qu'à DÉCRIRE l'écart, jamais à décider du verdict. Plafonné à 200 paires. */
  function apparier(E, O, d) {
    const libres = ascendant(d.enTrop);
    const paires = [];
    for (const i of ascendant(d.manquantes).slice(0, 200)) {
      let meilleur = -1, score = -1;
      for (let t = 0; t < libres.length; t++) {
        let s = 0;
        for (let c = 0; c < E[i].length; c++) if (cmpCellule(E[i][c], O[libres[t]][c]) === 0) s++;
        if (s > score) { score = s; meilleur = t; }
      }
      if (meilleur < 0) break;
      paires.push({ e: i, o: libres.splice(meilleur, 1)[0] });
    }
    return paires;
  }

  /** La première cellule en écart : phrase (à dire seulement si l'attendu n'est pas masqué) et mesure. */
  function premiereDifference(attendu, obtenu, E, O, paires) {
    for (const p of paires) {
      for (let c = 0; c < E[p.e].length; c++) {
        if (cmpCellule(E[p.e][c], O[p.o][c]) === 0) continue;
        const a = attendu.lignes[p.e][c], o = obtenu.lignes[p.o][c];
        let relatif = null, pourcent = "";
        if (typeof a === "number" && typeof o === "number" && a !== 0) {
          relatif = (o - a) / Math.abs(a);
          const pc = Math.abs(relatif) * 100;
          pourcent = ` (écart de ${relatif < 0 ? "−" : "+"}${pc < 0.1 ? "moins de 0,1" : pc.toFixed(1).replace(".", ",")} %)`;
        }
        return {
          phrase: `Première différence : ligne ${p.e + 1}, colonne « ${attendu.colonnes[c]} » : ${fmt(o)} obtenu, ${fmt(a)} attendu${pourcent}.`,
          mesure: { ligne: p.e + 1, colonne: attendu.colonnes[c], position: c + 1, obtenu: o, attendu: a, relatif }
        };
      }
    }
    return null;
  }

  /** Ce que les nombres établissent, sans lire la requête : NULL d'un seul côté, partie entière, arrondi, valeurs proches.
   *  Ce sont des faits sur les valeurs ; les rappels (pistes) sont des faits sur SQLite, jamais une accusation. */
  function diagnosticsNumeriques(E, O, paires, d, diff, masque) {
    let constat = "";
    const pistes = [];
    let nul = false, toutesNumeriques = true, toutesProches = true, nbEcarts = 0;
    for (const p of paires) {
      for (let c = 0; c < E[p.e].length; c++) {
        const e = E[p.e][c], o = O[p.o][c];
        if (cmpCellule(e, o) === 0) continue;
        nbEcarts++;
        if ((e === null) !== (o === null)) nul = true;
        if (typeof e === "number" && typeof o === "number") { if (ecartRelatif(e, o) >= SEUIL_PROCHES) toutesProches = false; }
        else toutesNumeriques = false;
      }
    }
    const toutesVues = paires.length === d.manquantes.length;

    if (nul) {
      constat += " Un NULL est en jeu" + (masque ? "." : " dans au moins une cellule en écart.");
      pistes.push(PISTES.nul);
    }
    // faits sur la première cellule en écart, nombres seulement
    const a = diff && diff.mesure.attendu, o = diff && diff.mesure.obtenu;
    let precis = false;
    if (typeof a === "number" && typeof o === "number") {
      if (Number.isInteger(o) && !Number.isInteger(a) && Math.trunc(a) === o) {
        constat += " Votre valeur est la partie entière de la valeur attendue.";
        pistes.push(PISTES.division);
        precis = true;
      } else {
        const da = decimales(a), dobt = decimales(o);
        if (dobt > da && da <= 6 && procheNombre(arrondir(o, da), a)) {
          constat += ` Votre valeur, arrondie à ${pl(da, "décimale")}, donne exactement la valeur attendue.`;
          pistes.push(`ROUND(valeur, ${da}) arrondit à ${pl(da, "décimale")}.`);
          precis = true;
        } else if (da > dobt && dobt <= 6 && procheNombre(arrondir(a, dobt), o)) {
          constat += " Vous avez arrondi votre valeur, mais la valeur attendue n'est pas arrondie.";
          precis = true;
        }
      }
    }
    if (!precis && !nul && nbEcarts > 0 && toutesVues && toutesNumeriques && toutesProches) {
      constat += ` Les valeurs sont proches (moins de ${Math.round(SEUIL_PROCHES * 100)} %) mais pas égales.`;
      pistes.push(PISTES.proches);
    }
    return { constat, pistes };
  }

  /* ── Déterminisme côté apprenant (D033, qui met en œuvre D022) ── */
  /** Découpe une requête en jetons : littéraux « 'texte' », identifiants (cités ou non) et ponctuation. Les commentaires et
   *  les espaces disparaissent. Ne sert qu'à lire ce que D033 désigne : jamais à juger la requête. */
  function lexer(sql) {
    const T = [];
    const n = sql.length;
    let i = 0;
    const cite = (q, ferme) => {
      let v = "";
      i++;
      while (i < n) {
        if (sql[i] === ferme) { if (sql[i + 1] === ferme) { v += ferme; i += 2; continue; } i++; break; }
        v += sql[i++];
      }
      return v;
    };
    while (i < n) {
      const c = sql[i], d = sql[i + 1];
      if (/\s/.test(c)) { i++; continue; }
      if (c === "-" && d === "-") { while (i < n && sql[i] !== "\n") i++; continue; }
      if (c === "/" && d === "*") { const fin = sql.indexOf("*/", i + 2); i = fin < 0 ? n : fin + 2; continue; }
      if (c === "'") { T.push({ t: "str", v: cite(c, "'") }); continue; }
      if (c === '"' || c === "`") { T.push({ t: "id", v: cite(c, c), cite: true }); continue; }
      if (c === "[") { const fin = sql.indexOf("]", i + 1); T.push({ t: "id", v: sql.slice(i + 1, fin < 0 ? n : fin), cite: true }); i = fin < 0 ? n : fin + 1; continue; }
      if (/[A-Za-z_]/.test(c)) { let j = i + 1; while (j < n && /[A-Za-z0-9_$]/.test(sql[j])) j++; T.push({ t: "id", v: sql.slice(i, j) }); i = j; continue; }
      T.push({ t: "p", v: c });
      i++;
    }
    return T;
  }

  const estPonct = (tk, v) => tk && tk.t === "p" && tk.v === v;

  /** Nombre d'arguments de l'appel dont la parenthèse ouvrante est T[ouvre]. */
  function nbArguments(T, ouvre) {
    if (estPonct(T[ouvre + 1], ")")) return 0;
    let profondeur = 0, n = 1;
    for (let k = ouvre + 1; k < T.length; k++) {
      if (estPonct(T[k], "(")) profondeur++;
      else if (estPonct(T[k], ")")) { if (!profondeur) return n; profondeur--; }
      else if (estPonct(T[k], ",") && !profondeur) n++;
    }
    return n;
  }

  /** Nom de la fonction dans les parenthèses de laquelle se trouve le jeton T[i] (null s'il n'est dans aucun appel). */
  function appelEnglobant(T, i) {
    let profondeur = 0;
    for (let k = i - 1; k >= 0; k--) {
      if (estPonct(T[k], ")")) profondeur++;
      else if (estPonct(T[k], "(")) {
        if (!profondeur) return T[k - 1] && T[k - 1].t === "id" && !T[k - 1].cite ? T[k - 1].v.toLowerCase() : null;
        profondeur--;
      }
    }
    return null;
  }

  const FONCTIONS_DATE = new Set(["date", "time", "datetime", "julianday", "unixepoch", "strftime", "timediff"]);

  /** Les constructions qui rendent un résultat dépendant du jour ou du hasard : 'now' passé à une fonction de date,
   *  CURRENT_DATE / CURRENT_TIME / CURRENT_TIMESTAMP, random(), randomblob(), et — découvert à l'implémentation — les appels
   *  SANS date, qui lisent eux aussi l'horloge : date(), time(), datetime(), julianday(), unixepoch(), strftime(format).
   *  Renvoie [{ type: "date" | "hasard", libelle }], sans doublon, dans l'ordre de rencontre. */
  function construitsTemporels(sql) {
    const T = lexer(String(sql));
    const trouves = [];
    const ajouter = (type, libelle) => { if (!trouves.some(x => x.libelle === libelle)) trouves.push({ type, libelle }); };
    T.forEach((tk, i) => {
      if (tk.t === "id" && !tk.cite) {
        const nom = tk.v.toLowerCase();
        if (/^current_(date|time|timestamp)$/.test(nom)) ajouter("date", nom.toUpperCase());
        if (estPonct(T[i + 1], "(")) {
          if (nom === "random" || nom === "randomblob") ajouter("hasard", `${nom}()`);
          if (FONCTIONS_DATE.has(nom)) {
            const n = nbArguments(T, i + 1);
            if (nom === "strftime" ? n === 1 : n === 0 && nom !== "timediff") ajouter("date", nom === "strftime" ? "strftime(format) sans date" : `${nom}()`);
          }
        }
      } else if (tk.t === "str" && tk.v.toLowerCase() === "now") {
        const nom = appelEnglobant(T, i);
        if (nom && FONCTIONS_DATE.has(nom)) ajouter("date", `${nom}('now')`);
      }
    });
    return trouves;
  }

  /* ── Évaluation d'une tentative (D032) ─────────────────── */
  const milliers = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const duree = ms => (ms < 1000 ? `${ms} ms` : `${String(ms / 1000).replace(".", ",")} s`);

  function phraseTemporelle(trouves, base, conditionnel) {
    const dates = trouves.filter(t => t.type === "date").map(t => t.libelle);
    const hasard = trouves.filter(t => t.type === "hasard").map(t => t.libelle);
    const phrases = [];
    if (dates.length) {
      const reference = base && base.dateReferenceTexte
        ? `« aujourd'hui » vaut toujours le ${base.dateReferenceTexte}${base.dateReference ? ` ('${base.dateReference}')` : ""}`
        : "« aujourd'hui » est une date de référence fixe, donnée par la consigne";
      phrases.push(conditionnel
        ? `Cette requête utilise la date du jour (${dates.join(", ")}) : elle donne le bon résultat aujourd'hui, mais pas demain. Dans les exercices, ${reference}.`
        : `Votre requête utilise la date du jour (${dates.join(", ")}) : son résultat change d'un jour à l'autre. Dans les exercices, ${reference} : écrivez cette date dans la requête, en littéral.`);
    }
    if (hasard.length) {
      phrases.push(conditionnel
        ? `Cette requête utilise le hasard (${hasard.join(", ")}) : son résultat peut changer d'une exécution à l'autre.`
        : `Votre requête utilise le hasard (${hasard.join(", ")}) : son résultat change à chaque exécution, il ne peut donc pas être vérifié.`);
    }
    return phrases.join(" ");
  }

  /** Juge une tentative d'apprenant.
   *  entrée : { attendu (jeu de référence), rapport (Moteur.executerIsole), options (de l'exercice), sql (texte, pour D033), base (CONTENU.base) }
   *  sortie : { statut: "reussi" | "incorrect" | "non-evalue", reussi, compte, code, constat, pistes, notes, details, ecart, masque, attendu, obtenu }
   *    « non-evalue » : la requête n'a pas pu être jugée (vide, erreur SQLite, écriture, aucun jeu, délai) — ni réussite ni échec,
   *    donc `compte` est faux : ce n'est pas une tentative ratée. */
  function evaluer({ attendu, rapport, options = {}, sql = "", base }) {
    const jeu = rapport.jeux.length ? rapport.jeux[rapport.jeux.length - 1] : null;
    const nonEvalue = (code, constat) => ({ statut: "non-evalue", reussi: false, compte: false, code, constat, pistes: [], notes: [], details: "", ecart: null, masque: false, attendu: null, obtenu: jeu });

    if (rapport.erreur) return nonEvalue("erreur-sql", rapport.erreur);                 // le message SQLite, tel quel
    if (!rapport.instructions) return nonEvalue("vide", "Requête vide.");
    if (rapport.ecritures) return nonEvalue("ecriture", "Les écritures (INSERT, UPDATE, DELETE, CREATE, DROP…) sont hors programme : l'exercice juge un SELECT sur la base d'origine.");
    if (rapport.interrompu) return nonEvalue("interrompu", `La requête a été interrompue au bout de ${duree(rapport.delaiMs)} : elle est trop longue à s'exécuter.`);
    if (!jeu) return nonEvalue("aucun-jeu", `${rapport.instructions > 1 ? "Ce script" : "Cette instruction"} ne renvoie aucune ligne : l'exercice attend un SELECT.`);

    const notes = [];
    if (rapport.instructions > 1)
      notes.push({ code: "instructions", texte: `Votre script contient ${rapport.instructions} instructions : c'est le résultat de la dernière qui renvoie des lignes qui est corrigé.` });
    const temporels = construitsTemporels(sql);

    let v;
    if (jeu.tronque) {
      if (attendu.lignes.length >= rapport.limiteLecture) return nonEvalue("trop-volumineux", "Le résultat est trop volumineux pour être vérifié.");
      const masque = attendu.colonnes.length * attendu.lignes.length === 1;
      const rE = attendu.lignes.length;
      v = { egal: false, code: "trop-de-lignes", pistes: [], masque, attendu: masque ? null : attendu, obtenu: jeu,
        constat: `Plus de ${milliers(rapport.limiteLecture)} lignes obtenues, ${rE === 1 ? "une seule attendue" : `${rE} attendues`}.`,
        ecart: { lignes: { obtenues: jeu.lignes.length, attendues: rE }, colonnes: { obtenues: jeu.colonnes.length, attendues: attendu.colonnes.length } } };
    } else {
      v = comparer(attendu, jeu, options);
    }

    let { code, constat } = v, details = "", pistes = v.pistes;
    if (temporels.length) {
      if (v.egal) notes.push({ code: "temporel", texte: phraseTemporelle(temporels, base, true) });
      else { details = constat; constat = phraseTemporelle(temporels, base, false); code = "temporel"; pistes = []; }
    }
    return { statut: v.egal ? "reussi" : "incorrect", reussi: v.egal, compte: true, code, constat, pistes, notes, details, ecart: v.ecart, masque: v.masque, attendu: v.attendu, obtenu: v.obtenu };
  }

  return { comparer, evaluer, construitsTemporels, formater: fmt, TOLERANCE };
})();
