// Règles de Midgar : données uniquement, sans logique d'affichage ni accès à Owlbear

export const FACTEUR = { "o": 1, "/": 2, "": 3 };

export const IDENTITE = [
  ["nom", "Nom"], ["age", "Âge"], ["taille_p", "Taille"], ["poids", "Poids"],
  ["cheveux", "Cheveux"], ["yeux", "Yeux"], ["metier", "Métier"],
  ["humanite", "Humanité"], ["reputation", "Réputation"], ["niveau_social", "Niveau social"]
];

export const ATTRIBUTS = ["Intelligence", "Dextérité", "Arts", "Empathie", "Force", "Constitution",
  "Chance", "Agilité", "Volonté", "Pouvoir", "Beauté", "Taille"];

export const ABREV = {
  "Intelligence": "Int", "Dextérité": "Dex", "Arts": "Art", "Volonté": "Vol",
  "Force": "For", "Chance": "Ch", "Agilité": "Ag", "Constitution": "Con",
  "Empathie": "Emp", "Pouvoir": "Pou", "Taille": "Tai", "Beauté": "Bt"
};

const COMPETENCES = {
  Intelligence: ["Alchimie", "Astrologie", "Bibliothèque", "Biologie / Zoologie", "Botanique", "Chimie",
    "Coder / Décoder", "Droit", "Écouter", "Enseigner", "Évaluer", "Expert", "Expert", "Histoire / Géo",
    "Lire / Écrire", "Lire / Écrire", "Maths", "Minéraux", "Orientation", "Parler", "Parler", "Parler",
    "Physique", "Pièges / Serrures", "Poisons", "Sentir / Goûter", "Théologie", "Us & Coutumes", "Voir"],
  Dextérité: ["Arbalètes", "Arcs", "Armes à feu", "Armes de jet", "Bâtons", "Bouclier", "Conduite attelage",
    "Dague", "Escamoter", "Jonglerie", "Lancer", "Lutte", "Manip. poisons"],
  Arts: ["Art", "Artisanat", "Bricolage", "Cartographie", "Contrefaçon", "Crocheter", "Cuisine", "Déguisement",
    "Désamorcer / Piéger", "Dessin", "Musique", "Navigation", "Pickpocket", "Potions", "Premiers soins"],
  Force: ["Armes articulées", "Armes d'hast", "Contondantes", "Piques", "Tranchantes"],
  Constitution: ["Endurance", "Natation"],
  Chance: ["Jeux de hasard"],
  Empathie: ["Baratin / Persuasion", "Comédie", "Commandement", "Dressage", "Étiquette / Social",
    "Marchandage", "Perception humaine", "Séduction"],
  Volonté: ["Code moral", "Code moral", "Code moral", "Connaissance de la rue", "Corruption", "Éloquence",
    "Interrogation", "Pistage", "Résistance à la torture"],
  Agilité: ["Acrobatie", "Danse", "Discrétion", "Équitation", "Esquive", "Grimper", "Se cacher / Semer"],
  Pouvoir: ["Sixième sens"],
  Beauté: [],
  Taille: []
};

// Clé stable : "Caractéristique:Nom". Un doublon reçoit " #2", " #3", etc.
function construireComps() {
  const compteur = {};
  const sortie = [];
  for (const attr of ATTRIBUTS) {
    for (const nom of (COMPETENCES[attr] || [])) {
      const base = `${attr}:${nom}`;
      compteur[base] = (compteur[base] || 0) + 1;
      const key = compteur[base] === 1 ? base : `${base} #${compteur[base]}`;
      sortie.push({ key, attr, nom });
    }
  }
  return sortie;
}

export const COMPS = construireComps();

export const GROUPES = ["Générale", "Guerrier", "Erudit", "Voleur"];

export const CARRIERES = [
  { nom: "Générale", groupe: "Générale" },
  { nom: "Guerrier", groupe: "Guerrier" },
  { nom: "Erudit", groupe: "Erudit" },
  { nom: "Voleur", groupe: "Voleur" },
  { nom: "Mystique", groupe: null }
];

// Spécialisations de base. Clé : "groupe:nom"
export const SPECS = [
  { groupe: "Générale", nom: "Apparence", cases: 5, effet: "+1 en Beauté" },
  { groupe: "Générale", nom: "Armurerie", cases: 4, effet: "+1 Armurerie" },
  { groupe: "Générale", nom: "Assommer", cases: 4, effet: "+1 Dégâts" },
  { groupe: "Générale", nom: "Embuscade", cases: 1, effet: "Initiative auto" },
  { groupe: "Générale", nom: "Empathie animale", cases: 4, effet: "+1 Dressage" },
  { groupe: "Générale", nom: "Faire des nœuds", cases: 1, effet: "-" },
  { groupe: "Générale", nom: "Galanterie", cases: 4, effet: "+1 Séduction" },
  { groupe: "Générale", nom: "Influence", cases: 4, effet: "+1 Corruption" },
  { groupe: "Générale", nom: "Négociation", cases: 4, effet: "+1 Marchandage" },
  { groupe: "Générale", nom: "Pourparlers", cases: 4, effet: "+1 Baratin / Pers." },
  { groupe: "Guerrier", nom: "Bouclier - Attaque", cases: 4, effet: "+1 bouclier" },
  { groupe: "Guerrier", nom: "Combat monté", cases: 4, effet: "+1 sinon -5" },
  { groupe: "Guerrier", nom: "Coup précis au contact", cases: 3, effet: "+1 Toucher" },
  { groupe: "Guerrier", nom: "Coup puissant", cases: 4, effet: "+1 Dégâts" },
  { groupe: "Guerrier", nom: "Culbutes", cases: 4, effet: "+1 Acro / Esquive" },
  { groupe: "Guerrier", nom: "Parades", cases: 4, effet: "+1 Parade" },
  { groupe: "Guerrier", nom: "Précision au tir", cases: 2, effet: "+1 Toucher" },
  { groupe: "Guerrier", nom: "Tranchantes à 2 mains", cases: 1, effet: "0 sinon -5" },
  { groupe: "Erudit", nom: "Apothicaire", cases: 4, effet: "+1 Chimie" },
  { groupe: "Erudit", nom: "Astronomie", cases: 4, effet: "+1 Astrologie" },
  { groupe: "Erudit", nom: "Biologie végétale", cases: 4, effet: "+1 Botanique" },
  { groupe: "Erudit", nom: "Ethnologie", cases: 4, effet: "+1 Us & Coût." },
  { groupe: "Erudit", nom: "Invention", cases: 8, seuil: 4, max: 2, effet: "Min / Maj" },
  { groupe: "Erudit", nom: "Médecine", cases: 4, effet: "+1 1ers Soins" },
  { groupe: "Erudit", nom: "Mémorisation", cases: 1, effet: "-" },
  { groupe: "Erudit", nom: "Théologie", cases: 4, effet: "+1 Théologie" },
  { groupe: "Voleur", nom: "Coup précis à distance", cases: 4, effet: "+1 Toucher" },
  { groupe: "Voleur", nom: "Discrétion", cases: 4, effet: "+1 Discrétion" },
  { groupe: "Voleur", nom: "Dissimulation dans l'ombre", cases: 4, effet: "+1 Disc. / Se cacher" },
  { groupe: "Voleur", nom: "Économie locale", cases: 4, effet: "+1 Conn. de la rue" },
  { groupe: "Voleur", nom: "Filature", cases: 4, effet: "+1 Pistage" },
  { groupe: "Voleur", nom: "Grimer", cases: 4, effet: "+1 Déguisement" },
  { groupe: "Voleur", nom: "Investigation", cases: 4, effet: "+1 Voir" },
  { groupe: "Voleur", nom: "Poisons", cases: 4, effet: "+1 Poisons" },
  { groupe: "Voleur", nom: "Précision au tir", cases: 4, effet: "+1 Toucher" },
  { groupe: "Voleur", nom: "Prestidigitation", cases: 1, effet: "-" }
];

// 10 groupes de 4 cases (40 au total). Le groupe d'indice g inflige un malus de -g.
// cons : modificateur du jet de Constitution pour les groupes Mortelle (indices 6 à 9).
export const BLESSURES = [
  { nom: "Légère" }, { nom: "Moyenne" }, { nom: "Sérieuse" }, { nom: "Critique" },
  { nom: "Handicap" }, { nom: "Invalidité" },
  { nom: "Mortelle", cons: 0 }, { nom: "Mortelle (1)", cons: -1 },
  { nom: "Mortelle (2)", cons: -2 }, { nom: "Mortelle (3)", cons: -3 }
];

// Zones du corps pour les armures
export const ZONES = [
  { cle: "tete", nom: "Tête" },
  { cle: "torse", nom: "Torse" },
  { cle: "bras_d", nom: "Bras Droit", abrev: "Bras D" },
  { cle: "bras_g", nom: "Bras Gauche", abrev: "Bras G" },
  { cle: "jambe_d", nom: "Jambe Droite", abrev: "Jambe D" },
  { cle: "jambe_g", nom: "Jambe Gauche", abrev: "Jambe G" }
];