import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3";
import { FACTEUR, IDENTITE, ATTRIBUTS, ABREV, COMPS, GROUPES, CARRIERES, SPECS, BLESSURES, ZONES } from "./data.js";

const CLE = "fr.midgar.fiche";
const CLE_DERNIER = "midgar-dernier-token";
const CLES_INTERDITES = new Set(["__proto__", "constructor", "prototype"]);

// ---------- État ----------

let tokenId = null;
let etat = defaut();
let uiOuvert = null;   // clé de la compétence dont le panneau ⚙ est ouvert
let jetUnique = null;  // { i, key } : spécialisation ajoutée à un seul jet
let formAjout = null;  // caractéristique dont le formulaire d'ajout de compétence est ouvert
let formSpec = null;   // groupe dont le formulaire d'ajout de spécialisation est ouvert
const brouillon = {};  // texte saisi dans les formulaires d'ajout, conservé entre deux rendus

document.addEventListener("input", enregistrerBrouillon);
document.addEventListener("change", enregistrerBrouillon);

function enregistrerBrouillon(e) {
    const id = e.target.id;
    if (id && id.startsWith("ajout-")) brouillon[id] = e.target.value;
}

function viderBrouillon() {
    for (const k of Object.keys(brouillon)) delete brouillon[k];
}

function defaut() {
    return {
        identite: {}, attributs: {}, carrieres: {}, specs: {}, comps: {},
        perso: [], specPerso: [], armure: {}, armes: [],
        pa: 0, blessures: 0, maj: 0
    };
}

// ---------- Utilitaires ----------

function esc(texte) {
    return String(texte ?? "")
        .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function trier(a, b) {
    return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
}

function genererCle(base, existantes) {
    if (!existantes.has(base)) return base;
    let n = 2;
    while (existantes.has(`${base} #${n}`)) n++;
    return `${base} #${n}`;
}

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function valeurDe(id) {
    return document.getElementById(id)?.value ?? "";
}

// Nombre entier borné, ou null si le champ est vide
function nombreOuNull(v, min = -999, max = 99999) {
    if (v === "" || v == null) return null;
    const n = Math.trunc(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
}

function montrer(nom) {
    document.querySelectorAll(".onglet").forEach(s => s.classList.toggle("actif", s.id === nom));
    document.querySelectorAll("nav.onglets button").forEach(b => b.classList.toggle("actif", b.dataset.onglet === nom));
}

// ---------- Compétences ----------

function listeComps() {
    return [...COMPS, ...etat.perso.map(p => ({ key: p.key, attr: p.attr, nom: p.nom }))];
}

function compDe(key) {
    return listeComps().find(c => c.key === key);
}

function niveauComp(key) {
    const d = etat.comps[key] || {};
    const perso = etat.perso.find(p => p.key === key);
    return {
        sym: d.sym ?? (perso ? perso.type : ""),
        niveau: d.niveau ?? 0,
        specs: d.specs ?? []
    };
}

// ---------- Spécialisations ----------

function specKey(s) {
    return s.key ?? `${s.groupe}:${s.nom}`;
}

function listeSpecs() {
    return [...SPECS, ...etat.specPerso];
}

function specDe(k) {
    return listeSpecs().find(s => specKey(s) === k);
}

function bonusSpec(s) {
    const points = etat.specs[specKey(s)] || 0;
    const seuil = s.seuil || 1;
    const max = s.max ?? s.cases;
    return Math.min(Math.floor(points / seuil), max);
}

function pointsUtilises(groupe) {
    return listeSpecs().filter(s => s.groupe === groupe)
        .reduce((total, s) => total + (etat.specs[specKey(s)] || 0), 0);
}

// ---------- Règles ----------

function coutProchainNiveau(comp) {
    const facteur = FACTEUR[comp.sym] ?? 3;
    if (comp.niveau === 0) return { cout: 3 * facteur, accordMJ: true };
    return { cout: (comp.niveau + 1) * facteur, accordMJ: false };
}

function penaliteBlessures() {
    const n = etat.blessures || 0;
    return n === 0 ? 0 : -Math.floor((n - 1) / 4);
}

// ---------- Rendu des zones ----------

function rendreIdentite() {
    return IDENTITE.map(([cle, libelle]) =>
        `<label>${libelle} <input type="text" data-type="identite" data-id="${esc(cle)}" value="${esc(etat.identite[cle])}"></label>`
    ).join("");
}

function rendreAttributs() {
    return ATTRIBUTS.map(attr =>
        `<label title="${esc(attr)}">${ABREV[attr]} <input type="number" min="0" data-type="attr" data-id="${esc(attr)}" value="${etat.attributs[attr] || 0}"></label>`
    ).join("");
}

function rendreBlessures() {
    const n = etat.blessures || 0;
    let html = "";
    for (let rangee = 0; rangee < 2; rangee++) {
        html += `<div class="rangee">`;
        for (let g = rangee * 5; g < rangee * 5 + 5; g++) {
            const b = BLESSURES[g];
            html += `<div class="groupe${g >= 6 ? " mortelle" : ""}">
        <div class="gtitre">${esc(b.nom)} <span>${-g}</span></div>
        <div class="cases">`;
            for (let k = 1; k <= 4; k++) {
                const num = 4 * g + k;
                html += `<input type="checkbox" data-type="blessure" data-id="${num}" ${num <= n ? "checked" : ""}>`;
            }
            html += `</div></div>`;
        }
        html += `</div>`;
    }
    html += `<p class="resume">Blessures : ${n} / 40 · pénalité aux jets de compétence : ${penaliteBlessures()}</p>`;
    return html;
}

function rendreCarrieres() {
    return `<div class="cartes-carriere">` + CARRIERES.map(c => {
        const rang = etat.carrieres[c.nom] || 0;
        let info;
        if (!c.groupe) {
            info = `<span class="resume">à venir</span>`;
        } else {
            const reste = rang - pointsUtilises(c.groupe);
            info = reste < 0
                ? `<span class="alerte">dépassement de ${-reste}</span>`
                : `<span class="${reste === 0 ? "ok" : ""}">${reste}</span>`;
        }
        return `<div class="carte">
      <div class="carte-nom">${esc(c.nom)}</div>
      <label>Rang <input type="number" min="0" data-type="carriere" data-id="${esc(c.nom)}" value="${rang}"></label>
      <div class="resume">Points à répartir : ${info}</div>
    </div>`;
    }).join("") + `</div>`;
}

function formulaireSpec(groupe) {
    const b = brouillon;
    return `<div class="panneau panneau-compact">
    <div class="form-ajout">
      <input type="text" id="ajout-spec-nom" placeholder="Nom de la spécialisation" value="${esc(b["ajout-spec-nom"] ?? "")}">
      <label class="resume">Cases <input type="number" id="ajout-spec-cases" min="1" max="8" value="${esc(b["ajout-spec-cases"] ?? 4)}"></label>
      <label class="resume">Seuil <input type="number" id="ajout-spec-seuil" min="1" value="${esc(b["ajout-spec-seuil"] ?? 1)}"></label>
      <label class="resume">Max <input type="number" id="ajout-spec-max" min="1" placeholder="= cases" value="${esc(b["ajout-spec-max"] ?? "")}"></label>
      <input type="text" id="ajout-spec-effet" placeholder="Effet (ex. +1 Toucher)" value="${esc(b["ajout-spec-effet"] ?? "")}">
      <button data-spec-ajout="${esc(groupe)}">Ajouter</button>
      <button data-spec-ajout-annuler="1">Annuler</button>
    </div>
  </div>`;
}

function rendreSpecs() {
    return GROUPES.map(g => {
        const carriere = CARRIERES.find(c => c.groupe === g);
        const rang = etat.carrieres[carriere.nom] || 0;
        const utilises = pointsUtilises(g);
        const reste = rang - utilises;
        const alerte = reste < 0 ? ` <span class="alerte">— dépassement de ${-reste}</span>` : "";

        const lignes = listeSpecs().filter(s => s.groupe === g).sort(trier).map(s => {
            const k = specKey(s);
            const points = etat.specs[k] || 0;
            const max = s.max ?? s.cases;
            const info = (s.seuil > 1 || s.max) ? ` (${s.seuil || 1} pts par +1, max +${max})` : "";
            return `<tr>
        <td>${esc(s.nom)}</td>
        <td><input type="number" min="0" max="${s.cases}" data-type="spec" data-id="${esc(k)}" value="${points}"> / ${s.cases}</td>
        <td>+${bonusSpec(s)}${info}</td>
        <td class="resume">${esc(s.effet)}</td>
      </tr>`;
        }).join("");

        return `<div class="titre-groupe">
        <h3>Spécialisations de ${esc(g)}</h3>
        <button class="bouton-jet" data-gear-groupe="${esc(g)}" title="Ajouter une spécialisation">⚙</button>
      </div>
      ${formSpec === g ? formulaireSpec(g) : ""}
      <div class="resume">Rang ${rang} · points utilisés ${utilises}${alerte}</div>
      <table><tr><th>Spécialisation</th><th>Points</th><th>Bonus</th><th>Effet</th></tr>${lignes}</table>`;
    }).join("");
}

function formulaireAjout(attr) {
    const b = brouillon;
    const type = b["ajout-type"] ?? "";
    const option = (v, libelle) => `<option value="${v}" ${type === v ? "selected" : ""}>${libelle}</option>`;
    return `<tr><td colspan="5" class="panneau">
    <div class="form-ajout">
      <input type="text" id="ajout-nom" placeholder="Libellé de la compétence" value="${esc(b["ajout-nom"] ?? "")}">
      <select id="ajout-type">${option("", "-")}${option("/", "/")}${option("o", "o")}</select>
      <button data-ajout="${esc(attr)}">Ajouter</button>
      <button data-ajout-annuler="1">Annuler</button>
    </div>
  </td></tr>`;
}

function panneauSpecs(key, d) {
    const specs = listeSpecs().slice().sort(trier);
    const k = esc(key);
    const cases = specs.map(s => {
        const sk = specKey(s);
        const coche = d.specs.includes(sk) ? "checked" : "";
        return `<label><input type="checkbox" data-type="compspec" data-comp="${k}" data-key="${esc(sk)}" ${coche}> ${esc(s.groupe)} — ${esc(s.nom)} (+${bonusSpec(s)})</label>`;
    }).join("");

    const options = `<option value="">aucune</option>` + specs.map(s => {
        const sk = specKey(s);
        const sel = jetUnique && jetUnique.i === key && jetUnique.key === sk ? "selected" : "";
        return `<option value="${esc(sk)}" ${sel}>${esc(s.groupe)} — ${esc(s.nom)}</option>`;
    }).join("");

    return `<tr><td colspan="5" class="panneau">
    <div><b>Spécialisations associées (toujours actives)</b></div>
    <div class="liste-specs">${cases}</div>
    <label>Pour ce jet uniquement : <select data-type="jetunique" data-comp="${k}">${options}</select></label>
  </td></tr>`;
}

function rendreCompetences() {
    const toutes = listeComps();
    let html = `<table><tr><th>Compétence</th><th></th><th>Niveau</th><th>Achat</th><th></th></tr>`;

    for (const attr of ATTRIBUTS) {
        html += `<tr class="attr-titre">
      <td colspan="4">${esc(attr)} (${etat.attributs[attr] || 0})</td>
      <td><button class="bouton-jet" data-gear-attr="${esc(attr)}" title="Ajouter une compétence">⚙</button></td>
    </tr>`;
        if (formAjout === attr) html += formulaireAjout(attr);

        for (const c of toutes.filter(x => x.attr === attr).sort(trier)) {
            const d = niveauComp(c.key);
            const k = esc(c.key);
            const option = (v, libelle) => `<option value="${v}" ${d.sym === v ? "selected" : ""}>${libelle}</option>`;
            const { cout, accordMJ } = coutProchainNiveau(d);
            const indice = d.specs.length ? ` <span class="resume">(${d.specs.length} spé.)</span>` : "";

            html += `<tr>
        <td>${esc(c.nom)}${indice}</td>
        <td><select data-type="compsym" data-id="${k}">${option("", "-")}${option("/", "/")}${option("o", "o")}</select></td>
        <td><input type="number" min="0" data-type="compniv" data-id="${k}" value="${d.niveau}"></td>
        <td><button data-achat="${k}" title="Acheter le niveau suivant"><span class="material-symbols-outlined">stat_3</span></button> ${cout} PA${accordMJ ? "*" : ""}</td>
        <td>
          <button class="bouton-jet" data-jet="${k}">Jet</button>
          <button class="bouton-jet" data-gear="${k}" title="Spécialisations associées">⚙</button>
        </td>
      </tr>`;
            if (uiOuvert === c.key) html += panneauSpecs(c.key, d);
        }
    }
    return html + `</table>`;
}

function rendreSelects() {
    const selComp = document.getElementById("sel-comp");
    const selSpec = document.getElementById("sel-spec");
    const vc = selComp.value, vs = selSpec.value;

    selComp.innerHTML = listeComps().slice()
        .sort((a, b) => ATTRIBUTS.indexOf(a.attr) - ATTRIBUTS.indexOf(b.attr) || trier(a, b))
        .map(c => `<option value="${esc(c.key)}">${esc(c.attr)} — ${esc(c.nom)}</option>`).join("");
    selComp.value = vc;
    if (!selComp.value && selComp.options.length) selComp.selectedIndex = 0;

    selSpec.innerHTML = `<option value="">Aucune spécialisation</option>` +
        listeSpecs().filter(s => bonusSpec(s) > 0).sort(trier)
            .map(s => `<option value="${esc(specKey(s))}">${esc(s.groupe)} — ${esc(s.nom)} (+${bonusSpec(s)})</option>`).join("");
    selSpec.value = vs;
}

// ---------- Combat : armures ----------

function rendreArmures() {
    return `<div class="cartes-carriere">` + ZONES.map(z => {
        const a = etat.armure[z.cle] || { val: 0, etoile: false, desc: "" };
        const k = esc(z.cle);
        return `<div class="carte">
      <div class="carte-nom">${esc(z.nom)}</div>
      <label>Protection <input type="number" min="0" data-type="armure" data-zone="${k}" data-champ="val" value="${a.val}"></label>
      <label>Propriété spéciale (*) <input type="checkbox" data-type="armure" data-zone="${k}" data-champ="etoile" ${a.etoile ? "checked" : ""}></label>
      <input type="text" class="champ-large" data-type="armure" data-zone="${k}" data-champ="desc" placeholder="Pièce d'armure (ex. gambison)" value="${esc(a.desc)}">
    </div>`;
    }).join("") + `</div>`;
}

// ---------- Combat : dégâts ----------

const MAX_TERMES = 10;

// Lit une formule du type « 1d4+1d3+2 ». Renvoie { des: [{ n, f }], bonus } ou null si invalide ou vide
function lireDegats(brut) {
    const texte = String(brut ?? "").replace(/\s+/g, "").toLowerCase();
    if (!texte) return null;

    const termes = texte.match(/[+-]?[^+-]+/g);
    if (!termes || termes.length > MAX_TERMES || termes.join("") !== texte) return null;

    const des = [];
    let bonus = 0;
    for (const terme of termes) {
        const signe = terme.startsWith("-") ? -1 : 1;
        const corps = terme.replace(/^[+-]/, "");
        const de = corps.match(/^(\d*)d(\d+)$/);
        if (de) {
            if (signe < 0) return null;   // pas de dé négatif
            const n = de[1] === "" ? 1 : Number(de[1]);
            const f = Number(de[2]);
            if (n < 1 || n > 20 || f < 2 || f > 100) return null;
            des.push({ n, f });
        } else if (/^\d+$/.test(corps)) {
            const v = Number(corps);
            if (v > 99) return null;
            bonus += signe * v;
        } else {
            return null;
        }
    }
    if (des.length === 0 && bonus === 0) return null;
    return { des, bonus };
}

// Affichage reformaté de la formule, ou message d'erreur
function apercuDegats(brut) {
    if (!brut) return `<span class="resume">—</span>`;
    const d = lireDegats(brut);
    if (!d) return `<span class="alerte">formule invalide (ex. 1d4+1d3+2)</span>`;
    let txt = d.des.map(x => `${x.n}d${x.f}`).join(" + ");
    if (d.bonus > 0) txt += ` + ${d.bonus}`;
    if (d.bonus < 0) txt += ` - ${-d.bonus}`;
    return `<span class="resume">→ ${esc(txt)}</span>`;
}

const NOM_CHAMP = { degats: "Dégâts", lp: "LP", mp: "MP", cp: "CP" };

// Tirage d'un dé à n faces, sans biais
function aleaFace(faces) {
    const b = new Uint32Array(1);
    const limite = Math.floor(4294967296 / faces) * faces;
    do {
        crypto.getRandomValues(b);
    } while (b[0] >= limite);
    return 1 + (b[0] % faces);
}

function lancerDegats(id, champ = "degats") {
    const arme = etat.armes.find(a => a.id === id);
    if (!arme) return;

    const nomChamp = NOM_CHAMP[champ] ?? champ;
    const formule = arme[champ];
    const parsed = lireDegats(formule);
    if (!parsed) return afficher(`${arme.nom} : ${nomChamp}`, [], ["Formule invalide"]);

    let total = parsed.bonus;
    const lignes = [];
    for (const { n, f: faces } of parsed.des) {
        const jets = [];
        for (let i = 0; i < n; i++) jets.push(aleaFace(faces));
        const somme = jets.reduce((a, b) => a + b, 0);
        total += somme;
        lignes.push(`${n}d${faces} : ${jets.join(" + ")} = ${somme}`);
    }
    if (parsed.bonus) lignes.push(`Bonus ${parsed.bonus > 0 ? "+" : ""}${parsed.bonus}`);

    afficher(`${arme.nom} (${nomChamp}) : ${total}`, [formule], lignes);
}

// ---------- Combat : armes ----------

function carteArme(a) {
    const k = esc(a.id);
    const champTexte = (c, libelle, val, placeholder = "") =>
        `<label>${libelle} <input type="text" data-type="arme" data-id="${k}" data-champ="${c}" placeholder="${esc(placeholder)}" value="${esc(val ?? "")}"></label>`;
    const champNum = (c, libelle, val, min) =>
        `<label>${libelle} <input type="number" ${min !== undefined ? `min="${min}"` : ""} data-type="arme" data-id="${k}" data-champ="${c}" value="${val ?? ""}"></label>`;

    const boutons = ["degats", "lp", "mp", "cp"]
        .filter(c => a[c])
        .map(c => `<button class="bouton-jet" data-lancer-degats="${k}" data-champ="${c}">${NOM_CHAMP[c]}</button>`)
        .join("");

    return `<div class="carte">
    <div class="ligne-arme">
      <input type="text" class="champ-large" data-type="arme" data-id="${k}" data-champ="nom" value="${esc(a.nom)}">
      <button class="bouton-jet" data-arme-suppr="${k}" title="Supprimer l'arme">✕</button>
    </div>
    <div class="grille-arme">
      ${champNum("pr", "Pr", a.pr)}
      ${champNum("portee", "Portée (m)", a.portee, 0)}
      <label>Rech. <input type="text" data-type="arme" data-id="${k}" data-champ="rech" placeholder="ex. 2rd" value="${esc(a.rech)}"></label>
    </div>
    <div class="ligne-degats">
      ${champTexte("degats", "Dégâts", a.degats, "ex. 1d4+1d3+2")}
      ${apercuDegats(a.degats)}
    </div>
    <div class="actions-arme">${boutons}</div>
    <div class="grille-arme">
      ${champTexte("lp", "LP", a.lp, "ex. 2d6")}
      ${champTexte("mp", "MP", a.mp, "ex. 2d6-1")}
      ${champTexte("cp", "CP", a.cp, "ex. 1d6")}
    </div>
    <input type="text" class="champ-large" data-type="arme" data-id="${k}" data-champ="notes" placeholder="Propriétés, équipement magique…" value="${esc(a.notes)}">
  </div>`;
}

function formulaireArme() {
    const b = brouillon;
    const v = k => esc(b["ajout-arme-" + k] ?? "");
    return `<div class="panneau panneau-compact">
    <div class="form-ajout">
      <input type="text" id="ajout-arme-nom" placeholder="Nom de l'arme" value="${v("nom")}">
      <label class="resume">Pr <input type="number" id="ajout-arme-pr" value="${v("pr")}"></label>
      <label class="resume">Portée <input type="number" id="ajout-arme-portee" min="0" value="${v("portee")}"></label>
      <label class="resume">Rech. <input type="text" id="ajout-arme-rech" placeholder="ex. 2rd" value="${v("rech")}"></label>
      <input type="text" id="ajout-arme-degats" placeholder="Dégâts, ex. 1d4+1d3+2" value="${v("degats")}">
      <input type="text" id="ajout-arme-lp" placeholder="LP (facultatif)" value="${v("lp")}">
      <input type="text" id="ajout-arme-mp" placeholder="MP (facultatif)" value="${v("mp")}">
      <input type="text" id="ajout-arme-cp" placeholder="CP (facultatif)" value="${v("cp")}">
      <input type="text" id="ajout-arme-notes" placeholder="Propriétés, équipement magique…" value="${v("notes")}">
      <button data-arme-ajout="1">Ajouter l'arme</button>
    </div>
  </div>`;
}

function rendreArmes() {
    const cartes = etat.armes.map(carteArme).join("");
    return `<div class="liste-armes">${cartes || `<p class="resume">Aucune arme pour l'instant.</p>`}</div>${formulaireArme()}`;
}

// ---------- Rendu ciblé : garde le focus et les défilements ----------

function fidDe(el) {
    return Array.from(el.attributes)
        .filter(a => a.name === "id" || a.name.startsWith("data-"))
        .map(a => `${a.name}=${a.value}`).join("|");
}

function remplacer(id, html) {
    const zone = document.getElementById(id);
    if (!zone) return;

    const actif = document.activeElement;
    const focus = zone.contains(actif)
        ? { fid: fidDe(actif), debut: actif.selectionStart, fin: actif.selectionEnd }
        : null;
    const defilements = Array.from(zone.querySelectorAll(".liste-specs")).map(e => e.scrollTop);

    zone.innerHTML = html;

    zone.querySelectorAll(".liste-specs").forEach((e, i) => { e.scrollTop = defilements[i] ?? 0; });

    if (focus) {
        const cible = Array.from(zone.querySelectorAll("input, select, button"))
            .find(e => fidDe(e) === focus.fid);
        if (cible) {
            cible.focus();
            if (focus.debut != null && cible.setSelectionRange) {
                try { cible.setSelectionRange(focus.debut, focus.fin); } catch { /* type sans sélection */ }
            }
        }
    }
}

const RENDUS = {
    identite: () => remplacer("identite", rendreIdentite()),
    attributs: () => remplacer("attributs", rendreAttributs()),
    blessures: () => remplacer("blessures", rendreBlessures()),
    carrieres: () => remplacer("carrieres", rendreCarrieres()),
    competences: () => remplacer("competences", rendreCompetences()),
    specs: () => remplacer("specs-contenu", rendreSpecs()),
    armures: () => remplacer("armures", rendreArmures()),
    armes: () => remplacer("armes", rendreArmes()),
    selects: () => rendreSelects(),
    pa: () => {
        const el = document.querySelector('[data-type="pa"]');
        if (el && el !== document.activeElement) el.value = etat.pa;
    }
};

const TOUTES = Object.keys(RENDUS);

function rendre(zones = TOUTES) {
    for (const z of zones) RENDUS[z]();
}

let zonesEnAttente = new Set();
let minuterie = null;

function planifier(...zones) {
    zones.forEach(z => zonesEnAttente.add(z));
    if (minuterie) return;
    minuterie = setTimeout(() => {
        const liste = [...zonesEnAttente];
        zonesEnAttente = new Set();
        minuterie = null;
        rendre(liste);
    }, 0);
}

// ---------- Sauvegarde et chargement ----------

async function sauver() {
    if (!tokenId) return;
    etat.maj = Date.now();
    const copie = JSON.parse(JSON.stringify(etat));
    try {
        await OBR.scene.items.updateItems([tokenId], (items) => {
            for (const item of items) item.metadata[CLE] = copie;
        });
    } catch (err) {
        alert("Impossible d'enregistrer la fiche : tu n'as sans doute pas les droits sur ce token.");
        console.error(err);
    }
}

function modifier(zones) {
    sauver();
    if (zones.length) planifier(...zones);
}

// Un MJ voit toutes les fiches ; un joueur seulement celles des tokens qu'il a créés
async function peutOuvrir(item) {
    if (!item) return false;
    const role = await OBR.player.getRole();
    if (role === "GM") return true;
    const monId = await OBR.player.getId();
    return item.createdUserId === monId;
}

function lireDernier() {
    try { return localStorage.getItem(CLE_DERNIER); } catch { return null; }
}

function memoriserDernier(id) {
    try { localStorage.setItem(CLE_DERNIER, id); } catch { /* stockage bloqué par le navigateur */ }
}

// Valide toutes les données venant du token ou d'un fichier importé
function nettoyerFiche(brut) {
    const src = brut && typeof brut === "object" && !Array.isArray(brut) ? brut : {};
    const entier = (v, max = 9999) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.min(Math.max(0, Math.floor(n)), max) : 0;
    };
    const texte = (v, max = 200) => (typeof v === "string" ? v.slice(0, max) : "");
    const dict = (obj, valeur, cles = null) => {
        const sortie = {};
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) return sortie;
        for (const k of Object.keys(obj).slice(0, 500)) {
            if (k.length > 200 || CLES_INTERDITES.has(k)) continue;
            if (cles && !cles.has(k)) continue;
            sortie[k] = valeur(obj[k]);
        }
        return sortie;
    };

    const perso = (Array.isArray(src.perso) ? src.perso : []).slice(0, 200)
        .filter(p => p && typeof p.key === "string" && p.key.length <= 200 && ATTRIBUTS.includes(p.attr)
            && typeof p.nom === "string" && ["", "/", "o"].includes(p.type))
        .map(p => ({ key: p.key, attr: p.attr, nom: texte(p.nom, 100), type: p.type }));

    const specPerso = (Array.isArray(src.specPerso) ? src.specPerso : []).slice(0, 200)
        .filter(p => p && typeof p.key === "string" && p.key.length <= 200
            && GROUPES.includes(p.groupe) && typeof p.nom === "string")
        .map(p => ({
            key: p.key, groupe: p.groupe, nom: texte(p.nom, 100),
            cases: entier(p.cases, 8) || 1, seuil: entier(p.seuil, 99) || 1,
            max: p.max ? entier(p.max, 99) : null, effet: texte(p.effet)
        }));

    const armes = (Array.isArray(src.armes) ? src.armes : []).slice(0, 100)
        .filter(a => a && typeof a.id === "string")
        .map(a => ({
            id: a.id.slice(0, 40),
            nom: texte(a.nom, 100),
            pr: nombreOuNull(a.pr, -99, 99),
            portee: nombreOuNull(a.portee, 0, 99999),
            rech: texte(a.rech, 20),
            degats: texte(a.degats, 40),
            lp: texte(a.lp, 40),
            mp: texte(a.mp, 40),
            cp: texte(a.cp, 40),
            notes: texte(a.notes, 300)
        }));

    const armure = {};
    for (const z of ZONES) {
        const s = src.armure?.[z.cle] || {};
        armure[z.cle] = { val: entier(s.val, 999), etoile: s.etoile === true, desc: texte(s.desc) };
    }

    const clesComps = new Set([...COMPS.map(c => c.key), ...perso.map(p => p.key)]);
    const clesSpecs = new Set([...SPECS.map(s => `${s.groupe}:${s.nom}`), ...specPerso.map(s => s.key)]);

    return {
        identite: dict(src.identite, v => texte(v)),
        attributs: dict(src.attributs, v => entier(v), new Set(ATTRIBUTS)),
        carrieres: dict(src.carrieres, v => entier(v), new Set(CARRIERES.map(c => c.nom))),
        specs: dict(src.specs, v => entier(v, 8), clesSpecs),
        comps: dict(src.comps, c => ({
            sym: ["", "/", "o"].includes(c?.sym) ? c.sym : "",
            niveau: entier(c?.niveau),
            specs: Array.isArray(c?.specs) ? c.specs.filter(k => typeof k === "string" && clesSpecs.has(k)).slice(0, 50) : []
        }), clesComps),
        perso,
        specPerso,
        armure,
        armes,
        pa: entier(src.pa),
        blessures: entier(src.blessures, 40),
        maj: entier(src.maj, Number.MAX_SAFE_INTEGER)
    };
}

async function charger(nouveauToken = false) {
    const statut = document.getElementById("statut");
    const fiche = document.getElementById("fiche");
    const entete = document.getElementById("entete");

    const afficherVide = (message, titre) => {
        entete.textContent = titre;
        statut.textContent = message;
        statut.hidden = false;
        fiche.hidden = true;
    };

    if (!tokenId) return afficherVide("Sélectionne un token pour voir sa fiche.", "Aucun token sélectionné");

    const [item] = await OBR.scene.items.getItems([tokenId]);
    if (!item) return afficherVide("Ce token n'est plus sur la table.", "Token introuvable sur la table");

    if (!(await peutOuvrir(item))) {
        tokenId = null;
        return afficherVide("Aucun personnage autorisé sélectionné. Sélectionne un de tes personnages.", "Accès refusé à ce token");
    }

    entete.textContent = `Token : ${item.name}`;

    if (nouveauToken) {
        uiOuvert = null;
        jetUnique = null;
        formAjout = null;
        formSpec = null;
        montrer("infos");
        window.scrollTo(0, 0);
    }

    etat = nettoyerFiche(item.metadata[CLE]);
    statut.hidden = true;
    fiche.hidden = false;
    rendre();
}

// ---------- Actions : saisie ----------

async function onChange(e) {
    const t = e.target;

    if (t.id === "fichier-import") {
        const fichier = t.files[0];
        t.value = "";
        if (fichier) await importerFichier(fichier);
        return;
    }

    const type = t.dataset.type;
    if (!type) return;
    const id = t.dataset.id;
    const v = t.value;

    switch (type) {
        case "jetunique":
            jetUnique = v ? { i: t.dataset.comp, key: v } : null;
            return;

        case "blessure": {
            const ancien = etat.blessures || 0;
            etat.blessures = t.checked ? Number(id) : Number(id) - 1;
            modifier(["blessures"]);
            if (etat.blessures > ancien) verifierEntrees(ancien, etat.blessures);
            return;
        }

        case "identite":
            etat.identite[id] = v;
            return sauver();

        case "attr":
            etat.attributs[id] = Math.max(0, Number(v) || 0);
            return modifier(["competences"]);

        case "carriere":
            etat.carrieres[id] = Math.max(0, Number(v) || 0);
            return modifier(["carrieres", "specs"]);

        case "spec": {
            const s = specDe(id);
            if (!s) return;
            etat.specs[id] = Math.max(0, Math.min(Number(v) || 0, s.cases));
            return modifier(["specs", "carrieres", "selects"]);
        }

        case "compsym":
            etat.comps[id] = { ...niveauComp(id), sym: v };
            return modifier(["competences"]);

        case "compniv":
            etat.comps[id] = { ...niveauComp(id), niveau: Math.max(0, Number(v) || 0) };
            return modifier(["competences"]);

        case "compspec": {
            const key = t.dataset.comp;
            const cle = t.dataset.key;
            const d = niveauComp(key);
            const liste = t.checked
                ? [...new Set([...d.specs, cle])]
                : d.specs.filter(k => k !== cle);
            etat.comps[key] = { ...d, specs: liste };
            return modifier(["competences"]);
        }

        case "armure": {
            const zone = t.dataset.zone;
            const champ = t.dataset.champ;
            const cur = { val: 0, etoile: false, desc: "", ...(etat.armure[zone] || {}) };
            if (champ === "etoile") cur.etoile = t.checked;
            else if (champ === "val") cur.val = Math.max(0, Number(v) || 0);
            else cur.desc = v.slice(0, 200);
            etat.armure = { ...etat.armure, [zone]: cur };
            return modifier(["armures"]);
        }

        case "arme": {
            const a = etat.armes.find(x => x.id === t.dataset.id);
            if (!a) return;
            const champ = t.dataset.champ;
            if (["nom", "rech", "notes", "degats", "lp", "mp", "cp"].includes(champ)) {
                const max = champ === "notes" ? 300 : champ === "nom" ? 100 : champ === "rech" ? 20 : 40;
                a[champ] = v.trim().slice(0, max);
            } else {
                a[champ] = nombreOuNull(v, champ === "pr" ? -99 : 0, champ === "portee" ? 99999 : 99);
            }
            return modifier(["armes"]);
        }

        case "pa":
            etat.pa = Math.max(0, Number(v) || 0);
            return modifier(["pa"]);
    }
}

async function acheter(key) {
    const c = niveauComp(key);
    const { cout, accordMJ } = coutProchainNiveau(c);

    if (etat.pa < cout) {
        return alert(`Pas assez de points d'aventure (il faut ${cout}, il reste ${etat.pa}).`);
    }
    if (accordMJ && !confirm("L'accord du MJ a-t-il été donné ?")) return;

    etat.pa -= cout;
    etat.comps[key] = { ...c, niveau: c.niveau + 1 };
    modifier(["competences", "pa"]);
}

async function ajouterCompetence(attr, nom, type) {
    const key = genererCle(`${attr}:${nom}`, new Set(listeComps().map(c => c.key)));
    etat.perso = [...etat.perso, { key, attr, nom, type }];
    formAjout = null;
    viderBrouillon();
    modifier(["competences", "selects"]);
}

async function ajouterSpecialisation(groupe, nom, cases, seuil, max, effet) {
    const key = genererCle(`${groupe}:${nom}`, new Set(listeSpecs().map(specKey)));
    etat.specPerso = [...etat.specPerso, { key, groupe, nom, cases, seuil, max, effet }];
    formSpec = null;
    viderBrouillon();
    modifier(["specs", "carrieres", "selects"]);
}

function ajouterArme() {
    const nom = valeurDe("ajout-arme-nom").trim();
    if (!nom) return alert("Indique un nom pour l'arme.");

    const arme = {
        id: genId(),
        nom: nom.slice(0, 100),
        pr: nombreOuNull(valeurDe("ajout-arme-pr"), -99, 99),
        portee: nombreOuNull(valeurDe("ajout-arme-portee"), 0, 99999),
        rech: valeurDe("ajout-arme-rech").trim().slice(0, 20),
        degats: valeurDe("ajout-arme-degats").trim().slice(0, 40),
        lp: valeurDe("ajout-arme-lp").trim().slice(0, 40),
        mp: valeurDe("ajout-arme-mp").trim().slice(0, 40),
        cp: valeurDe("ajout-arme-cp").trim().slice(0, 40),
        notes: valeurDe("ajout-arme-notes").trim().slice(0, 300)
    };
    etat.armes = [...etat.armes, arme];
    viderBrouillon();
    modifier(["armes"]);
}

function supprimerArme(id) {
    if (!confirm("Supprimer cette arme ?")) return;
    etat.armes = etat.armes.filter(a => a.id !== id);
    modifier(["armes"]);
}

async function importerFichier(fichier) {
    if (!tokenId) return alert("Sélectionne un token avant d'importer.");

    let donnees;
    try {
        donnees = JSON.parse(await fichier.text());
    } catch {
        return alert("Fichier illisible : ce n'est pas un JSON valide.");
    }
    if (donnees?.format !== "midgar-fiche" || !donnees.fiche) {
        return alert("Ce fichier n'est pas une fiche Midgar.");
    }
    if (!confirm("Remplacer la fiche de ce token par celle du fichier ?")) return;

    etat = nettoyerFiche(donnees.fiche);
    uiOuvert = null;
    jetUnique = null;
    formAjout = null;
    formSpec = null;
    viderBrouillon();
    await sauver();
    rendre();
}

function exporter() {
    const nom = (etat.identite.nom || "personnage").replace(/[^a-z0-9_-]+/gi, "_");
    const donnees = { format: "midgar-fiche", version: 3, date: new Date().toISOString(), fiche: etat };
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `midgar-${nom}.json`;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Jets ----------

// Tirage cryptographique sans biais : on rejette les valeurs qui ne tombent pas juste
function aleaDe() {
    const b = new Uint32Array(1);
    const limite = 4294967290; // multiple de 10
    do {
        crypto.getRandomValues(b);
    } while (b[0] >= limite);
    return 1 + (b[0] % 10);
}

function jetDes(relancer) {
    const jets = [];
    let d;
    do {
        d = aleaDe();
        jets.push(d);
    } while (relancer && d === 10 && jets.length < 20);
    return { jets, somme: jets.reduce((a, b) => a + b, 0) };
}

function calculerJet(key, clesSpec = []) {
    const comp = compDe(key);
    if (!comp) return null;
    const c = niveauComp(key);
    if (c.sym === "" && c.niveau === 0) return null;

    const attr = etat.attributs[comp.attr] || 0;
    const demi = c.niveau === 0 && c.sym === "/";
    const bonusAttr = demi ? Math.floor(attr / 2) : attr;
    const specs = [...new Set(clesSpec)].map(k => specDe(k)).filter(Boolean);
    const bonusS = specs.reduce((somme, s) => somme + bonusSpec(s), 0);
    const pen = penaliteBlessures();
    const { jets, somme } = jetDes(!demi);

    return {
        comp, jets, des: somme, bonusAttr, demi,
        niveau: c.niveau, specs, bonusS, pen,
        total: somme + bonusAttr + c.niveau + bonusS + pen
    };
}

function afficher(titre, detail, lignes = []) {
    document.getElementById("jet").innerHTML =
        `<div class="titre-jet">${esc(titre)}</div>` +
        (detail.length ? `<div class="detail">${detail.map(esc).join(" · ")}</div>` : "") +
        lignes.map(l => `<div class="detail">${esc(l)}</div>`).join("");
}

function detailJet(r) {
    const parties = [
        `Dés ${r.jets.join(" + ")} = ${r.des}`,
        `${r.comp.attr} ${r.bonusAttr}${r.demi ? " (moitié)" : ""}`,
        `compétence ${r.niveau}`
    ];
    for (const s of r.specs) parties.push(`${s.nom} +${bonusSpec(s)}`);
    if (r.pen) parties.push(`blessures ${r.pen}`);
    return parties;
}

function lancer(key, clesSpec = []) {
    const r = calculerJet(key, clesSpec);
    if (!r) return afficher(`${compDe(key)?.nom ?? "Test"} : jet impossible`, ["Compétence à 0 sans symbole"]);
    afficher(`${r.comp.nom} : ${r.total}`, detailJet(r));
}

function lancerEmbuscade() {
    const key = "Agilité:Se cacher / Semer";
    const r = calculerJet(key, niveauComp(key).specs);
    if (!r) return afficher("Embuscade : jet impossible", ["Se cacher / Semer à 0 sans symbole"]);
    afficher(`Embuscade : ${r.total}`, detailJet(r), [
        "Les adversaires font leur jet de Voir ou Perception contre ce total.",
        "Si personne ne te voit, l'embuscade réussit."
    ]);
}

// Rangs d'action : le score, puis tous les 10 points en dessous, tant que le rang est positif
function rangsAction(score) {
    const rangs = [];
    let r = score;
    do {
        rangs.push(r);
        r -= 10;
    } while (r > 0);
    return rangs;
}

function lancerInitiative() {
    const agi = etat.attributs["Agilité"] || 0;
    const { jets, somme } = jetDes(true);
    const score = agi + somme;
    const rangs = rangsAction(score);

    const lignes = [`Rangs d'action : ${rangs.join(", ")}`];
    if (document.getElementById("embuscade-ok").checked) {
        const suite = rangs.slice(1).join(", ") || "aucun";
        lignes.push(`Embuscade réussie : action 1 avant tout le monde, puis rangs ${suite}`);
    }
    afficher(`Initiative : ${score}`, [`Agilité ${agi}`, `Dés ${jets.join(" + ")} = ${somme}`], lignes);
}

// Blessures : jet de Constitution à l'entrée d'un groupe Mortelle
function verifierEntrees(ancien, nouveau) {
    const con = etat.attributs["Constitution"] || 0;
    const lignes = [];
    for (let g = 6; g < BLESSURES.length; g++) {
        const debut = 4 * g + 1;
        if (ancien >= debut || nouveau < debut) continue;
        const b = BLESSURES[g];
        const cible = con + b.cons;
        lignes.push(`${b.nom} : dé ${aleaDe()} · cible ${cible} (Constitution ${con}${b.cons ? " " + b.cons : ""})`);
    }
    if (lignes.length) afficher("Jet de Constitution (1d10 sous la cible)", [], lignes);
}

// ---------- Événements ----------

function onClick(e) {
    const t = e.target.closest("button") ?? e.target;

    if (t.id === "btn-initiative") return lancerInitiative();
    if (t.id === "btn-embuscade") return lancerEmbuscade();
    if (t.id === "btn-recharger") return charger();
    if (t.id === "btn-exporter") return exporter();
    if (t.id === "btn-importer") return document.getElementById("fichier-import").click();
    if (t.id === "btn-lancer") {
        const cle = document.getElementById("sel-spec").value;
        return lancer(document.getElementById("sel-comp").value, cle ? [cle] : []);
    }
    if (t.dataset.onglet) return montrer(t.dataset.onglet);

    if (t.dataset.lancerDegats !== undefined) return lancerDegats(t.dataset.lancerDegats, t.dataset.champ);

    if (t.dataset.armeAjout !== undefined) return ajouterArme();
    if (t.dataset.armeSuppr !== undefined) return supprimerArme(t.dataset.armeSuppr);

    if (t.dataset.gearAttr !== undefined) {
        const attr = t.dataset.gearAttr;
        formAjout = formAjout === attr ? null : attr;
        return planifier("competences");
    }
    if (t.dataset.ajout !== undefined) {
        const nom = valeurDe("ajout-nom").trim();
        if (!nom) return alert("Indique un libellé pour la compétence.");
        return ajouterCompetence(t.dataset.ajout, nom, valeurDe("ajout-type"));
    }
    if (t.dataset.ajoutAnnuler !== undefined) {
        formAjout = null;
        viderBrouillon();
        return planifier("competences");
    }

    if (t.dataset.gearGroupe !== undefined) {
        const g = t.dataset.gearGroupe;
        formSpec = formSpec === g ? null : g;
        return planifier("specs");
    }
    if (t.dataset.specAjout !== undefined) {
        const nom = valeurDe("ajout-spec-nom").trim();
        if (!nom) return alert("Indique un nom pour la spécialisation.");
        const cases = Math.min(8, Math.max(1, Number(valeurDe("ajout-spec-cases")) || 4));
        const seuil = Math.max(1, Number(valeurDe("ajout-spec-seuil")) || 1);
        const maxSaisi = Number(valeurDe("ajout-spec-max"));
        const max = maxSaisi > 0 ? maxSaisi : null;
        const effet = valeurDe("ajout-spec-effet").trim() || "-";
        return ajouterSpecialisation(t.dataset.specAjout, nom, cases, seuil, max, effet);
    }
    if (t.dataset.specAjoutAnnuler !== undefined) {
        formSpec = null;
        viderBrouillon();
        return planifier("specs");
    }

    if (t.dataset.gear !== undefined) {
        const key = t.dataset.gear;
        uiOuvert = uiOuvert === key ? null : key;
        return planifier("competences");
    }

    if (t.dataset.achat !== undefined) return acheter(t.dataset.achat);

    if (t.dataset.jet !== undefined) {
        const key = t.dataset.jet;
        const extra = jetUnique && jetUnique.i === key ? [jetUnique.key] : [];
        jetUnique = null;
        lancer(key, [...niveauComp(key).specs, ...extra]);
        if (uiOuvert === key) planifier("competences");
    }
}

// ---------- Démarrage ----------

OBR.onReady(async () => {
    document.addEventListener("change", onChange);
    document.addEventListener("click", onClick);

    OBR.player.onChange(async (joueur) => {
        const id = joueur.selection?.[0];
        if (!id || id === tokenId) return;

        const [item] = await OBR.scene.items.getItems([id]);
        if (!(await peutOuvrir(item))) {
            if (tokenId) await charger();
            return;
        }

        tokenId = id;
        memoriserDernier(id);
        await charger(true);
    });

    // Mise à jour quand le MJ ou un autre client modifie le token affiché
    OBR.scene.items.onChange(async (items) => {
        if (!tokenId) return;
        const item = items.find(i => i.id === tokenId);
        if (!item || !item.metadata[CLE]) return;

        const distant = nettoyerFiche(item.metadata[CLE]);
        if (distant.maj <= etat.maj) return;

        etat = distant;
        planifier(...TOUTES);
    });

    const selection = await OBR.player.getSelection();
    const candidat = selection?.[0] ?? lireDernier();
    tokenId = null;
    if (candidat) {
        const [item] = await OBR.scene.items.getItems([candidat]);
        if (await peutOuvrir(item)) {
            tokenId = candidat;
            memoriserDernier(candidat);
        }
    }
    await charger(true);
});