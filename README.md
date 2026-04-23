# BookHub — Frontend

Interface utilisateur de la plateforme de gestion de bibliothèque communautaire BookHub.

## Stack technique

- React 19 + Vite
- React Router DOM v7
- Tailwind CSS v4
- Axios
- Vitest + Testing Library

## Prérequis

- Node.js >= 18
- npm >= 9
- Le backend Symfony doit tourner localement (ou être accessible via l'URL configurée)

## Installation

```bash
git clone <url-du-repo>
cd bookhub-frontend
npm install
```

## Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
VITE_API_URL=http://localhost:8000
```

| Variable       | Description                        | Valeur par défaut          |
| -------------- | ---------------------------------- | -------------------------- |
| `VITE_API_URL` | URL de base de l'API Symfony       | `http://localhost:8000`    |

## Lancer le projet

```bash
# Développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

## Lancer les tests

```bash
# Tous les tests
npm test

# Avec couverture de code
npm test -- --coverage
```

Le projet vise un minimum de **20% de couverture de code**.

## Lint

```bash
npm run lint
```

## Routes de l'application

| Route                        | Page                    | Accès requis         |
| ---------------------------- | ----------------------- | -------------------- |
| `/login`                     | Connexion               | Public               |
| `/register`                  | Inscription             | Public               |
| `/forgot-password`           | Mot de passe oublié     | Public               |
| `/books`                     | Catalogue               | Connecté             |
| `/books/:id`                 | Détail d'un livre       | Connecté             |
| `/my-dashboard`              | Dashboard lecteur       | Connecté             |
| `/my-loans`                  | Mes emprunts            | Connecté             |
| `/mon-compte/reservations`   | Mes réservations        | Connecté             |
| `/mes-avis`                  | Mes avis                | Connecté             |
| `/profile`                   | Profil utilisateur      | Connecté             |
| `/dashboard`                 | Dashboard libraire      | `ROLE_LIBRARIAN`     |
| `/admin/reservations`        | Gestion réservations    | `ROLE_LIBRARIAN`     |

## Structure du projet

```
src/
├── components/       # Composants réutilisables
├── context/          # Contextes React (Auth…)
├── pages/            # Pages de l'application
├── test/             # Tests unitaires (Vitest)
└── main.jsx          # Point d'entrée
```

## Rôles et accès

| Rôle              | Accès                                              |
| ----------------- | -------------------------------------------------- |
| `ROLE_USER`       | Catalogue, emprunts, réservations, profil          |
| `ROLE_LIBRARIAN`  | Dashboard libraire, gestion des retours            |
| `ROLE_ADMIN`      | Accès complet                                      |


## Repo backend

[bookhub-backend](https://github.com/romainBeauger/bookhub-backend) — API Symfony 7 + API Platform + JWT

## Équipe

- Mathilde — Maquette
- Youssef — back + front
- Romain — back + front