# DevoSupport — Frontend

Application de gestion de parc informatique et support IT.

**Stack :** Angular 22 + Tailwind CSS v4 + Socket.IO Client

---

## Sommaire

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Connexion à la Base de Données](#connexion-à-la-base-de-données)
5. [Commandes](#commandes)
6. [Authentification & Rôles](#authentification--rôles)
7. [Pages & Routes](#pages--routes)
8. [Technologies Utilisées](#technologies-utilisées)

---

## Architecture

```
┌─────────────────────┐      ┌──────────────────────┐      ┌──────────────┐
│   Angular Frontend  │ ───▶ │   NestJS Backend     │ ───▶ │   MongoDB    │
│   localhost:4200    │      │   localhost:3000      │      │  Atlas/Local │
│                     │      │                      │      └──────────────┘
│  - Tailwind CSS v4  │      │  - JWT Auth           │
│  - Signals          │      │  - Google OAuth 2.0   │
│  - Socket.IO client │      │  - Socket.IO server   │
│  - Standalone comps │      │  - Mongoose ODM       │
└─────────────────────┘      └──────────────────────┘
```

## Prérequis

- **Node.js** ≥ 18 (testé avec 22.x)
- **npm** ≥ 9
- **Angular CLI :** `npm install -g @angular/cli@22`

## Installation

```bash
cd Devo_Support_Front
npm install
```

## Connexion à la Base de Données

Le frontend ne se connecte pas directement à MongoDB. Il communique avec le **backend NestJS** qui lui est connecté à MongoDB.

La configuration de la base de données se fait dans le backend :
- Fichier : `devo-support-backend/.env`
- Variable : `MONGODB_URI`

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/devosupport
```

Le frontend pointe vers le backend via l'URL `http://localhost:3000` (configurée dans `api.service.ts` et `chat.service.ts`).

## Commandes

| Commande | Description |
|----------|-------------|
| `npm start` / `ng serve` | Lancer le serveur de développement sur `:4200` |
| `npm run build` | Build production dans `dist/` |
| `ng build --configuration=development` | Build dev avec source maps |
| `ng test` | Tests unitaires (Karma) |

## Authentification & Rôles

### Flow OAuth

1. L'utilisateur clique "Se connecter avec Google" sur `/signin`
2. Redirection vers Google OAuth
3. Google redirige vers le backend `/auth/google/callback`
4. Le backend vérifie l'utilisateur en base de données :
   - Utilisateur inexistant → message "Compte non enregistré"
   - Utilisateur inactif → message "Compte désactivé"
   - Utilisateur actif → génération d'un JWT et redirection vers le frontend
5. Le frontend stocke le token JWT et les infos utilisateur dans `localStorage`
6. Redirection selon le rôle

**Important :** Les utilisateurs doivent être pré-créés en base par un ADMIN. Pas d'auto-inscription.

### Rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| `ADMIN` | Accès total au système | Gestion utilisateurs, appareils, tickets, chat, tableau de bord |
| `IT` | Personnel IT | Gestion appareils, allocation, maintenance, tickets, chat |
| `CONSULTANT` | Utilisateur final | Voir ses appareils assignés, créer des tickets, chat |

### Guards Frontend

| Guard | Fichier | Restreint à |
|-------|---------|-------------|
| `authGuard` | `guards/auth.guard.ts` | Tout utilisateur authentifié |
| `AdminGuard` | `guards/admin.guard.ts` | ADMIN uniquement |
| `ITGuard` | `guards/it.guard.ts` | IT et ADMIN |

## Pages & Routes

| Route | Page | Guard | Description |
|-------|------|-------|-------------|
| `/` | Dashboard | auth | Tableau de bord avec statistiques |
| `/signin` | Connexion | — | Page de connexion Google OAuth |
| `/auth/callback` | Callback OAuth | — | Traitement du retour OAuth |
| `/profile` | Profil | auth | Profil utilisateur |
| `/user-management` | Utilisateurs | Admin | Gestion des utilisateurs (CRUD) |
| `/user-management/:id` | Détail utilisateur | Admin | Détail d'un utilisateur |
| `/archived-users` | Utilisateurs archivés | Admin | Liste des utilisateurs archivés |
| `/device-management` | Appareils | IT | Inventaire des appareils |
| `/device-management/:id` | Détail appareil | IT | Détail d'un appareil |
| `/device-types` | Types d'appareils | IT | Gestion des types d'appareils |
| `/device-maintenance` | Maintenance | IT | Planning de maintenance |
| `/device-maintenance/:id` | Détail maintenance | IT | Détail d'une maintenance |
| `/device-allocation` | Allocation | IT | Allocation d'appareils |
| `/tickets` | Tickets | IT | Tous les tickets |
| `/my-tickets` | Mes tickets | auth | Tickets de l'utilisateur |
| `/tickets/:id` | Détail ticket | auth | Détail d'un ticket |
| `/chat` | Chat | auth | Messagerie en temps réel |
| `/consultant-devices` | Mes appareils | auth | Appareils assignés au consultant |
| `/calendar` | Calendrier | auth | Vue calendrier |

## Technologies Utilisées

- **Angular 22** — Framework (standalone components, signals)
- **Tailwind CSS v4** — Styles utilitaires
- **Socket.IO Client 4** — Communication temps réel (chat)
- **ApexCharts** — Graphiques (dashboard)
- **AmCharts 5** — Graphiques supplémentaires
- **FullCalendar** — Calendrier
- **Swiper** — Carrousels
- **Flatpickr** — Sélecteurs de date
- **xlsx (SheetJS)** — Import/Export Excel
- **rxjs** — Programmation réactive
- **Karma + Jasmine** — Tests unitaires
