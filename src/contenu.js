"use strict";
/* Requêt'R — contenu pédagogique. VIDE au lot 1.
   Chargé avant app.js. Les compétences et niveaux SQL naissent au lot 4 (portage du socle) ;
   les exercices, chapitres et missions arrivent à partir du lot 6.
   Déterminisme (D001) : aucune solution ni donnée ne peut dépendre de date('now'), random(),
   CURRENT_TIMESTAMP ni de l'ordre naturel des lignes. */
const CONTENU = { competences: [], certifications: [], exercices: [], missions: [] };
const CHAPITRES = [];
