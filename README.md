# Midgar — Fiche de personnage pour Owlbear Rodeo

Une fiche de personnage pour **Midgar — Le Royaume des Intrigues**, à utiliser directement dans votre table Owlbear Rodeo. Elle s'ouvre à côté de la carte, suit le token que vous sélectionnez, et enregistre tout sur le personnage. Rien à installer à part l'extension.

> Version de test. Les armures et l'équipement ne sont pas encore calculés automatiquement, voir la section « Ce qui n'est pas encore là ».

## Installation

1. Dans Owlbear Rodeo, ouvre le menu des extensions (icône en forme de puzzle).
2. Choisis **Ajouter une extension**.
3. Colle cette adresse et valide :

   ```
   https://kasilt.github.io/midgar-owl/manifest.json
   ```

Le bouton **Fiche Midgar** apparaît dans la barre d'outils.

## Prérequis pour le MJ

Pour que chaque joueur ne puisse modifier que ses propres personnages :

1. Ouvre le menu **Players**, puis **Player Permissions**.
2. Dans la catégorie **Character**, active **Owner Only** et **Update**.
3. Enregistre avec **Save**.

Ensuite, pour chaque personnage, clique sur le token, puis sur l'icône profil du menu contextuel, et choisis le joueur propriétaire.

## Utilisation de base

1. Sélectionne un token sur la table : ton personnage, ou un PNJ si tu es MJ.
2. Clique sur **Fiche Midgar** dans la barre d'outils.
3. La fiche s'ouvre à côté de la carte. Tu peux continuer à bouger la carte et les tokens pendant qu'elle est ouverte.
4. Pour changer de personnage, sélectionne un autre token : la fiche se met à jour.

**Qui voit quoi :** les joueurs ne peuvent ouvrir que les fiches des tokens qu'ils ont créés. Le MJ voit toutes les fiches. Si tu sélectionnes un token auquel tu n'as pas accès, la fiche reste sur le personnage précédent.

Chaque modification est enregistrée immédiatement sur le token. Si le MJ modifie une fiche, le joueur la voit se mettre à jour sans recharger.

## Les onglets

### Infos

- **Identité** : nom, âge, taille, poids, cheveux, yeux, métier, humanité, réputation, niveau social.
- **Caractéristiques** : Int, Dex, Art, Vol, For, Ch, Ag, Con, Emp, Pou, Tai, Bt. Survole une abréviation pour voir son nom complet.
- **Blessures** : la piste de 40 cases, par groupes de 4. Coche une case pour enregistrer une blessure, décoche pour la retirer. La pénalité appliquée aux jets s'affiche sous la piste.
- **Carrières** : le rang de chaque carrière, et les points de spécialisation encore à répartir.
- **PA** (points d'aventure) : le solde affiché en haut à droite. Le MJ peut le modifier quand il en donne.

### Compétences

Les compétences sont regroupées par caractéristique, triées par ordre alphabétique.

- **Symbole** : `-`, `/` ou `o`. Il détermine le coût d'achat et la façon de lancer le dé.
- **Niv** : le niveau, modifiable directement.
- **Achat** (icône) : achète le niveau suivant. Le coût s'affiche à côté. Une `*` indique qu'il faut l'accord du MJ.
- **Jet** : lance la compétence, avec ses spécialisations associées.
- **⚙** sur une compétence : associe des spécialisations, qui s'ajoutent alors à chaque jet, ou en choisit une pour un seul jet.
- **⚙** sur le titre d'une caractéristique : ajoute une nouvelle compétence (libellé et symbole).

### Spécialisations

Elles sont regroupées par carrière : Générale, Guerrier, Erudit, Voleur.

- Chaque point investi augmente le bonus. Le **seuil** indique combien de points il faut pour +1 (par exemple 4 pour Invention).
- Le total de points ne peut pas dépasser le rang de la carrière. Un dépassement s'affiche en rouge.
- **⚙** sur le titre d'un groupe : ajoute une spécialisation, avec son nom, son nombre de cases, son seuil, son maximum et son effet.

### Combat

- **Armures** : la protection de chaque zone (tête, torse, bras, jambes), la présence d'une propriété spéciale, et la description de la pièce. Ces valeurs sont saisies à la main pour l'instant.
- **Armes** : chaque arme a un nom, une précision (Pr) et des dégâts.
  - Une arme de **mêlée** a un champ **Dégâts**, par exemple `1d4+1d3+2`.
  - Une arme **à distance** (case à cocher) a trois formules : **CP**, **MP** et **LP**, ainsi que la portée en mètres et le temps de rechargement (par exemple `2rd`).
  - Les formules sont reformatées automatiquement. Une formule invalide reste en rouge.
  - Le bouton de l'arme lance les dégâts. Le détail des dés s'affiche en haut, par exemple : `1d4+1d10+1d12+5 = 1 + 3 + 10 + 5`.

### Jets

- **Lancer un test** : choisis une compétence et, si tu veux, une spécialisation.
- **Initiative** : Agilité + 1D10, un 10 explose. Le score donne les rangs d'action : un tous les 10 points, jusqu'à 1. Coche « Embuscade réussie » si elle l'est.
- **Embuscade** : jet de Se cacher / Semer. Les adversaires font leur jet de Voir ou Perception contre le résultat.

Le résultat s'affiche en haut de la fiche, au-dessus des onglets, et reste visible quel que soit l'onglet. Il affiche le total et le détail des dés, **sans réussite ni marge** : le MJ compare avec les autres jets de la table.

## Règles appliquées

- **Jet de compétence** : attribut + compétence + spécialisations + pénalité de blessures + 1D10. Un 10 relance le dé.
- **Compétence à 0** : sans symbole, le jet est impossible. Avec `/`, on prend la moitié de l'attribut, sans relance. Avec `o`, on lance normalement.
- **Coût d'achat** : le niveau suivant multiplié par le facteur du symbole (`o` ×1, `/` ×2, `-` ×3). Acquérir une compétence à 0 coûte 3 fois le facteur, et demande l'accord du MJ.
- **Blessures** : la pénalité augmente d'un point tous les 4 groupes. Entrer dans un groupe Mortelle demande un jet de Constitution, 1D10 sous la Constitution réduite selon le groupe. Le résultat s'affiche, c'est le MJ qui décide de la suite.

## Export et import

Pour garder ton personnage d'une session à l'autre :

- **Exporter** télécharge un fichier `.json` avec toute la fiche.
- **Importer** remplace la fiche du token sélectionné par celle du fichier, après confirmation.

Le fichier ne dépend ni de la table ni du token. Garde-le en sauvegarde.

## Ce qui n'est pas encore là

- **Calcul de l'armure** : les protections sont saisies, mais elles ne sont pas encore déduites des dégâts reçus.
- **Bonus aux dégâts** (liés à la Force) et bonus des spécialisations comme Assommer ou Coup puissant : pas encore inclus dans les lancers de dégâts.
- **Équipement et possessions** : pas encore de liste dédiée.
- **Message privé au MJ** : les jets s'affichent dans le panneau du joueur, et le MJ doit les demander. Owlbear ne propose pas de message réellement privé pour ce type d'extension.

## Confidentialité

Les fiches sont enregistrées sur les tokens, et la carte est partagée avec toute la table. Les joueurs ne peuvent pas ouvrir les fiches des autres personnages, mais ces informations restent techniquement accessibles à quelqu'un qui cherche à les lire (console du navigateur). Pour une table entre amis de confiance, c'est sans gravité. Ne mets pas d'informations que tu veux garder absolument secrètes.

## Retours

Signale tout ce qui semble faux, manque ou gêne, en précisant la règle concernée et ce que tu attendais. Les retours sur les règles sont les plus utiles.

Dépôt : https://github.com/Kasilt/midgar-owl