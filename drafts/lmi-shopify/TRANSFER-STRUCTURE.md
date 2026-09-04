# SHOPIFY 1/6 — STRUCTURE — Note de transfert

## Livré
Architecture d’information, navigation principale à six entrées, sous-menus Boutique/Éditions/Collections, footer Maison/Service client/Légal, accueil en huit sections, trois familles phase 1, recherche structurelle, pages de confiance/légales et comportement mobile.

## Source
Base historique Shopify : `codex/lmi-shopify-boutique-v1` — SHA `c060c35706389296124e07f9e9198e87a9896de7`.

## Branche
Travail : `shopify/structure-final`.
Intégration cible : `codex/shopify-finalisation-produit` (aucune fusion effectuée).

## Nettoyage
Les prix, produits lifestyle et promesse de livraison du prototype historique, non étayés par les sources de cadrage, ont été retirés de ce lot.

## Hors lot / données absentes
Produits, prix, stocks, variantes, médias, logistique, retours, paiement, fiscalité, consentement newsletter, contenu juridique final et publication Shopify native restent à alimenter par les lots compétents avec données validées.

## Contrôle
`scripts/validate-lmi-shopify.mjs` contrôle l’arborescence, les routes, le responsive, le statut brouillon, la traçabilité et l’absence de données commerciales inventées.
