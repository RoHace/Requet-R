"use strict";
/* Requêt'R — contenu pédagogique. Chargé avant app.js.
   `base` décrit la base de démonstration (src/seed.sql, documentée dans SCHEMA.md) : l'explorateur de schéma s'en sert.
   Les compétences et niveaux SQL naissent au lot 4 (portage du socle) ; les exercices, chapitres et missions
   arrivent à partir du lot 6.
   Déterminisme (D001) : aucune solution ni donnée ne peut dépendre de date('now'), random(),
   CURRENT_TIMESTAMP ni de l'ordre naturel des lignes. */
const CONTENU = {
  base: {
    /* « Aujourd'hui » pour tous les exercices (délais, retards). Jamais lu dans la base : les consignes l'écrivent en littéral. */
    dateReference: "2026-06-30",
    dateReferenceTexte: "30 juin 2026",
    tables: {
      categories: {
        role: "Les rayons du catalogue. Un produit appartient à une seule catégorie."
      },
      produits: {
        role: "Les articles en vente, avec leur prix actuel et leur stock.",
        colonnes: { prix: "prix actuel, en euros" }
      },
      clients: {
        role: "Les personnes qui ont un compte. Un client peut en avoir parrainé d'autres.",
        colonnes: {
          ville: "pas renseignée pour certains clients",
          date_inscription: "texte AAAA-MM-JJ",
          parrain_id: "le client qui a parrainé celui-ci ; vide s'il est venu seul"
        }
      },
      commandes: {
        role: "Un panier validé par un client. Le détail des articles est dans lignes_commande.",
        colonnes: {
          date_commande: "texte AAAA-MM-JJ",
          statut: "en_preparation, expediee, livree, annulee ou retournee",
          frais_port: "frais de port de la commande entière, comptés une seule fois",
          date_livraison: "vide tant que la commande n'est pas livrée",
          note: "satisfaction de 1 à 5 ; vide si le client n'a pas noté"
        }
      },
      lignes_commande: {
        role: "Le détail d'une commande : une ligne par produit commandé. C'est elle qui relie commandes et produits.",
        colonnes: { prix_unitaire: "prix facturé à ce moment-là, qui peut différer de produits.prix" }
      }
    }
  },
  competences: [], certifications: [], exercices: [], missions: []
};
const CHAPITRES = [];
