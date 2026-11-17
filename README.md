# My Social Networks API

API REST réalisée avec Node.js pour le TP **My Social Networks API** du M1 Data Engineering & IA. Bastien Coutte

## Objectif

L’API modélise les événements d’un réseau social : utilisateurs, événements, groupes, discussions, messages, albums photo, sondages, billetterie, shopping list et covoiturage.

Le projet utilise les modules natifs de Node.js et un stockage en mémoire. Les données sont réinitialisées au redémarrage.

## Installation

```bash
npm install
npm start
```

API disponible sur `http://localhost:3000`.

## Ressources et endpoints

Toutes les ressources exposent `GET /collection`, `GET /collection/:id`, `POST /collection`, `PATCH /collection/:id` et `DELETE /collection/:id`.

| Ressource | Collection |
| --- | --- |
| Utilisateurs | `/api/v1/users` |
| Événements | `/api/v1/events` |
| Groupes | `/api/v1/groups` |
| Discussions | `/api/v1/discussions` |
| Messages | `/api/v1/messages` |
| Albums photo | `/api/v1/albums` |
| Photos | `/api/v1/photos` |
| Sondages | `/api/v1/polls` |
| Types de billets | `/api/v1/ticketTypes` |
| Billets | `/api/v1/tickets` |
| Shopping list | `/api/v1/shoppingItems` |
| Covoiturage | `/api/v1/carpools` |

Les listes acceptent `page`, `limit` et des filtres simples, par exemple `GET /api/v1/events?visibility=public&page=1&limit=10`.

## Règles métier implémentées

- Un utilisateur possède un email unique.
- Un événement possède au moins un organisateur et une liste de membres.
- Un groupe possède au moins un membre et un administrateur.
- Un fil de discussion appartient à un groupe ou à un événement, jamais aux deux.
- Une photo est rattachée à un album et doit être publiée par un membre de l’événement.
- Un sondage contient au moins une question, chaque question ayant au moins deux choix.
- La billetterie est réservée aux événements publics ; un type est limité en quantité et une personne ne peut obtenir qu’un billet par événement.
- La shopping list et le covoiturage ne sont utilisables que lorsque l’option correspondante est activée.
- Un élément de shopping list est unique par événement.

## Documentation Postman

Importer `postman/My-Social-Networks-API.postman_collection.json` dans Postman. La collection contient les endpoints de découverte et les exemples de requêtes pour chaque ressource.

La documentation détaillée est également disponible dans [`postman/API-DOCUMENTATION.md`](postman/API-DOCUMENTATION.md) pour être copiée dans les descriptions Postman.

Après publication dans Postman, ajouter l’URL publique générée dans ce README et dans la description de la collection avant le dépôt GitHub ou GitLab.

## Tests

```bash
npm test
```

## Format des réponses

Réponse réussie :

```json
{ "data": { "id": "..." } }
```

Réponse de liste :

```json
{ "data": [], "pagination": { "page": 1, "limit": 20, "total": 0 } }
```

Erreur :

```json
{ "error": { "status": 400, "message": "..." } }
```
