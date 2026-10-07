#!/usr/bin/env node
/* Requêt'R — test navigateur de requeter.html sur Chrome et Edge (hors livrable : `outils/` n'entre jamais dans requeter.html).
   Usage :  node build.mjs && node outils/cdp.cjs [chrome | edge | tous]      (défaut : tous)
   Variables facultatives : CHROME_PATH, EDGE_PATH (chemin de l'exécutable si le navigateur n'est pas à l'emplacement habituel).

   RÈGLE (DECISIONS.md D041, vaut pour tous les lots) : un test navigateur passe TOUJOURS par une instance neuve, en mode headless, avec un
   PROFIL TEMPORAIRE ISOLÉ. Jamais par une instance déjà ouverte du navigateur de l'utilisateur : lancer `chrome.exe` sans profil dédié
   (même juste `--version`, sous Windows) transmet la commande à la session ouverte et y ouvre une fenêtre. Ce script ne lance rien
   sans `--user-data-dir` dédié, ne demande jamais la version, et lit le port de débogage (éphémère) dans le profil temporaire.

   Il pilote le navigateur par le protocole DevTools (CDP, WebSocket natif de Node 22+), ouvre requeter.html en file://, exécute
   outils/scenario.js dans la page (un scénario qui s'auto-contrôle), compte les requêtes réseau (attendu : 1, le document) et les erreurs
   console, puis supprime le profil. Code retour 1 au moindre échec. */

const { spawn } = require("child_process"), fs = require("fs"), os = require("os"), path = require("path");
const { pathToFileURL } = require("url");

const RACINE = path.resolve(__dirname, "..");
const PAGE = path.join(RACINE, "requeter.html");
const SCENARIO = path.join(__dirname, "scenario.js");

const CANDIDATS = {
  chrome: [process.env.CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"],
  edge: [process.env.EDGE_PATH, "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"]
};
const trouver = nom => (CANDIDATS[nom] || []).find(p => p && fs.existsSync(p));
const attendre = ms => new Promise(r => setTimeout(r, ms));

async function tester(nom, exe) {
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), `requetr-${nom}-`));       // profil temporaire isolé : jamais la session de l'utilisateur
  const proc = spawn(exe, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", `--user-data-dir=${profil}`, "about:blank"], { stdio: "ignore" });
  let echecs = 1;
  try {
    // le navigateur écrit son port de débogage dans le profil
    let port = null;
    for (let i = 0; i < 80 && !port; i++) {
      await attendre(250);
      try { port = Number(fs.readFileSync(path.join(profil, "DevToolsActivePort"), "utf8").split("\n")[0]); } catch (e) { /* pas encore écrit */ }
    }
    if (!port) throw new Error("le navigateur n'a pas publié son port de débogage");
    let cibles = null;
    for (let i = 0; i < 40 && !cibles; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (l.some(c => c.type === "page")) cibles = l; } catch (e) { /* idem */ } if (!cibles) await attendre(250); }
    if (!cibles) throw new Error("aucune page à piloter");
    const version = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).Browser;
    const ws = new WebSocket(cibles.find(c => c.type === "page").webSocketDebuggerUrl);
    await new Promise((ok, ko) => { ws.addEventListener("open", ok); ws.addEventListener("error", ko); });
    let id = 0; const attente = new Map(), evenements = [];
    ws.addEventListener("message", m => { const d = JSON.parse(m.data); if (d.id && attente.has(d.id)) { attente.get(d.id)(d); attente.delete(d.id); } else evenements.push(d); });
    const cmd = (method, params = {}) => new Promise(r => { const i = ++id; attente.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    await cmd("Page.enable"); await cmd("Runtime.enable"); await cmd("Network.enable");
    const url = pathToFileURL(PAGE).href;
    await cmd("Page.navigate", { url });
    await attendre(3500);
    const res = await cmd("Runtime.evaluate", { expression: fs.readFileSync(SCENARIO, "utf8"), awaitPromise: true, returnByValue: true, timeout: 120000 });
    const requetes = evenements.filter(e => e.method === "Network.requestWillBeSent").map(e => e.params.request.url.slice(0, 90));
    const erreurs = evenements.filter(e => e.method === "Runtime.exceptionThrown" || (e.method === "Runtime.consoleAPICalled" && e.params.type === "error")).map(e => JSON.stringify(e.params).slice(0, 200));
    console.log(`\n=== ${nom} — ${version} — ${url}`);
    if (res.result.exceptionDetails) console.log("EXCEPTION DU SCÉNARIO :", JSON.stringify(res.result.exceptionDetails).slice(0, 600));
    else {
      const R = res.result.result.value;
      echecs = 0;
      for (const [libelle, ok, detail] of R) { if (!ok) echecs++; console.log(`${ok ? "✔" : "✘"} ${libelle}${ok ? "" : "  → " + detail}`); }
      console.log(`\n${echecs ? "✘ " + echecs + " échec(s) sur " + R.length : "✔ " + R.length + " vérifications, toutes vertes"}`);
    }
    console.log(`requêtes réseau : ${requetes.length} ${JSON.stringify(requetes)} | erreurs console : ${erreurs.length} ${erreurs.join(" ; ")}`);
    if (requetes.length !== 1 || erreurs.length) echecs++;
    ws.close();
  } finally {
    await terminer(proc, profil);
  }
  return echecs;
}

/** Termine TOUT l'arbre de processus du navigateur de test, puis supprime son profil. Edge relance son propre arbre : tuer le lanceur
 *  ne suffit pas. Seuls sont visés les processus dont la ligne de commande contient le chemin du profil temporaire, qui est unique à
 *  ce test : jamais une session de l'utilisateur. */
async function terminer(proc, profil) {
  try { proc.kill(); } catch (e) { /* déjà terminé */ }
  if (process.platform === "win32") {
    const motif = profil.replace(/'/g, "''");
    try { require("child_process").execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command",
      `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${motif}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: "ignore", timeout: 30000 }); }
    catch (e) { /* au pire, le système nettoiera */ }
  }
  for (let i = 0; i < 10; i++) {
    await attendre(500);
    try { fs.rmSync(profil, { recursive: true, force: true }); return; } catch (e) { /* un fichier est encore tenu : on réessaie */ }
  }
}

(async () => {
  if (!fs.existsSync(PAGE)) { console.error("requeter.html est absent : lancez d'abord `node build.mjs`."); process.exit(2); }
  const demande = process.argv[2] || "tous";
  const noms = demande === "tous" ? ["chrome", "edge"] : [demande];
  let total = 0;
  for (const nom of noms) {
    const exe = trouver(nom);
    if (!exe) { console.error(`${nom} : exécutable introuvable (définir ${nom === "chrome" ? "CHROME_PATH" : "EDGE_PATH"}).`); total++; continue; }
    try { total += await tester(nom, exe); } catch (e) { console.error(`${nom} : ${e.message}`); total++; }
  }
  process.exit(total ? 1 : 0);
})();
