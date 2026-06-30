# Free Angular Tailwind Admin Dashboard Template - TailAdmin Angular

TailAdmin Angular is a **free and open-source admin dashboard template** built with **Angular** and **Tailwind CSS**. It provides developers with everything they need to create a feature-rich, data-driven **back-end, dashboard, or admin panel** for any type of web project.

![TailAdmin Angular Admin Dashboard](./angular-tailwind.png)


With TailAdmin Angular, you’ll get access to a complete set of **dashboard UI components, elements, and ready-to-use pages** to build a modern, high-quality admin panel. Whether it’s for a **complex web application** or a **lightweight project**, TailAdmin Angular is designed to speed up development of any kind of dashboards and admin panels.

TailAdmin leverages the **powerful ecosystem of Angular 20+**, along with **TypeScript** and the utility-first styling of **Tailwind CSS v4**. Combined, they make TailAdmin Angular a perfect foundation to launch your dashboard or admin panel quickly and effectively.

TailAdmin Angular comes with essential UI components and layouts for building **feature-rich, data-driven dashboards** and **admin panels**. TailAdmin Angular is built on:

* **Angular 20+**
* **TypeScript**
* **Tailwind CSS v4**

### Quick Links

- ✨ [Visit Website](https://tailadmin.com/)
- 🚀 [Angular Demo](https://angular-demo.tailadmin.com/)
- 📄 [Documentation](https://tailadmin.com/docs)
- ⬇️ [Download](https://tailadmin.com/download)
- 🖌️ [Figma Design File (Free Edition)](https://www.figma.com/community/file/1463141366275764364)
- ⚡ [Get PRO Version](https://tailadmin.com/pricing)
---

## Feature Comparison

| Feature | Free Version | Pro Version 🌟 |
|---------|--------------|----------------|
| **Dashboards** | 1 Unique Dashboard | 7 Unique Dashboards: Analytics, Ecommerce, Marketing, SaaS, CRM, Stocks, Logistics and more (more coming soon) 📈 |
| **UI Elements and Components** | 100+ UI elements and components | Included in 500+ components and UI elements |
| **Design Files** | Basic Figma design files | Complete Figma design system file |
| **Support** | Community support| Email support |

### Other Versions

- [Next.js Version](https://github.com/TailAdmin/free-nextjs-admin-dashboard)
- [React.js Version](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard)
- [Vue.js Version](https://github.com/TailAdmin/vue-tailwind-admin-dashboard)
- [Angular Version](https://github.com/TailAdmin/free-angular-tailwind-dashboard)
- [Laravel Version](https://github.com/TailAdmin/tailadmin-laravel)

## Installation

### Prerequisites

Before you start, make sure you have:

* **Node.js 20.x or later** (Node.js 20.x recommended)
* **Angular CLI** installed globally:

```bash
npm install -g @angular/cli
```

---

### Cloning the Repository

Clone the repository:

```bash
git clone https://github.com/TailAdmin/free-angular-admin-dashboard.git
```

---

### Install Dependencies

```bash
npm install
# or
yarn install
```

---

### Start Development Server

```bash
npm start
```

Then open:
👉 `http://localhost:4200`

---

## Angualr.js Tailwind Components

TailAdmin Angular ships with a rich set of **ready-to-use dashboard features**:

* **Ecommerce Dashboard** with essential elements
* Modern, accessible **sidebar navigation**
* **Data visualization** with charts and graphs
* **User profile management** and a **custom 404 page**
* **Tables** and **charts** (line, bar, etc.)
* **Authentication forms** and reusable input components
* **UI elements**: alerts, dropdowns, modals, buttons, and more
* Built-in **Dark Mode** 🕶️
* and many more


## DevoSupport Customizations

This project has been extensively customized from the original TailAdmin template to create a unique DevoSupport application with the following enhancements:

### Branding Updates
- **Application Name**: Changed from "TailAdmin" to "DevoSupport" across all pages
- **Custom Logo**: Implemented custom PNG logo (`DevoLgo.png`) displayed in sidebar, header, and authentication pages
- **Page Title**: Updated browser tab title to "DevoSupport"

### Authentication System
- **Modern Sign-In Page**: Completely redesigned authentication page with:
  - Glassmorphism card design with backdrop blur effects
  - Animated gradient background with floating blobs
  - Google OAuth as primary authentication method
  - Enhanced form inputs with icons and improved UX
  - Account verification warning messages with clear visual indicators
  - Full dark mode support
- **Sign-Out Functionality**: Implemented proper sign-out that clears all authentication data from localStorage
- **Auth Guard**: Protected routes require valid authentication token

### User Management
- **Role-Based Access Control**: Restricted user management page to admin-only access
- **User Actions**: Enhanced user management with:
  - Activate/Deactivate user accounts
  - Archive users with validation (requires deactivation first)
  - Delete users with confirmation modal
  - Edit user roles with modal interface
- **Archive Validation**: Added warning modal when attempting to archive active users
- **Dark Mode**: Implemented dark mode support for user management and archived users tables
- **UI Improvements**: Changed delete button to icon, cleaned sidebar for better clarity

### Technical Stack
- **Frontend**: Angular 20+ with TypeScript and Tailwind CSS v4
- **Backend**: NestJS with Mongoose for MongoDB integration
- **Authentication**: Google OAuth integration with localStorage-based session management
- **Styling**: Custom Tailwind CSS utility classes for modern, responsive design

### File Structure
- Frontend: `Devo_Support_Front/` - Angular application
- Backend: `devo-support-backend/` - NestJS API server

## Changelog

### DevoSupport v1.0.0 (2026-06-30)
- **Branding**: Complete rebranding to DevoSupport with custom logo and naming
- **Authentication**: Redesigned sign-in page with modern glassmorphism UI
- **User Management**: Enhanced with role editing, archive validation, and dark mode
- **Security**: Implemented proper sign-out with localStorage cleanup
- **UI/UX**: Improved dark mode support across all user management pages

### v1.1.1 (2026-05-23)
- **New Feature**: Added **AI Settings** page to configure models, keys, and token limits.
- **New Feature**: Added **Maps** page with MapLibre GL, Leaflet, and iframe styles.
- **New Feature**: Added **Vector Maps** page powered by AmCharts 5 geodata (World & USA).
- **New Feature**: Added **Radar Charts** page with 3 unique formats.
- **New Feature**: Added **Radial Progress Charts** page featuring 4 custom layout templates.
- **Enhancement**: Introduced new **Bar Charts Five & Six** and **Pie Charts Four & Five**.
- **Bug Fix**: Resolved dropdown menu z-index stacking context overlapping issue in AI Chat history.
- **Enhancement**: Resolved spacing gaps under map card containers.

### Version 1.1.0 - [April 28, 2026]
- Added **AI Dashboard** with token usage and revenue tracking.
- Added **Sales Dashboard** with retention and multi-channel analytics.
- Added **Finance Dashboard** with cashflow and balance management.
- Introduced **6 New Layout variations** for improved UI flexibility.
- Integrated **Advanced Data Visualization** with 7+ new chart types.

### v1.0.3 (2026-03-15)

- **update**: update Angular dependencies to version 21.2.x.

### v1.0.2 (2025-12-30)

- **Upgrade**: Successfully upgraded project to **Angular 21**.
- **New Feature**: Implementing **Dynamic API Keys** management.
  - Added functionalities to **Add**, **Edit**, **Delete**, and **Regenerate** API Keys.
- **Enhancement**: Integrated **Flatpickr** date range picker in `StatisticsChartComponent`.
- **Bug Fix**: Resolved `NG0100` ExpressionChangedAfterItHasBeenCheckedError in `PieChartTwoComponent`.
- **Bug Fix**: Fixed `NG8113` warning in `AddApiKeyModalComponent` by removing unused imports.
- **Cleanup**: Removed unused imports and optimized code across various components.
