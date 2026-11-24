<div align="center">

<img src="https://raw.githubusercontent.com/Studio1HQ/Studio1HQ/main/assets/banners/movie-planner.webp" alt="Movie Night Planner with Velt: A shared movie planning list with live cursors, huddles and presence" width="100%" />

<br />
<br />

# Movie Night Planner with Velt

### A shared movie planning list with live cursors, huddles and presence

A Vite and React app for planning a movie night with friends. It uses Velt for presence, live cursors, huddles and a live-synced planning list, with movie data from TMDB.

<br />

[![Built by Studio1](https://img.shields.io/badge/Built_by_Studio1-f97316?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgMTYwIiBmaWxsPSJub25lIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTAgMzVDMCAxNi42ODA3IDE0LjA3NDQgMS42NDg0NCAzMiAwLjEyNjk1M1YxNDFINTEuMDUyM0M1Mi40MzA4IDEzNy4zNDQgNTQuNzQ0NiAxMzMuNjg5IDU3Ljk5MzggMTMwLjAzM0M2MS4xNDQ2IDEyNi41MDggNjQuNjg5MiAxMjMuNDQgNjguNjI3NyAxMjAuODI5QzcyLjU2NjIgMTE4LjM0OSA3Ni4zNTY5IDExNi43ODIgODAgMTE2LjEyOVY4Ni43NTQ0Qzc1LjQ3MDggODcuOTI5MiA3MS4zODQ2IDg5LjY5MTkgNjcuNzQxNSA5Mi4wNDE1QzY0IDk0LjUyMjUgNjAuNzUwOCA5Ny40NiA1Ny45OTM4IDEwMC44NTRDNTYuNTM0NSAxMDIuNzIgNTUuMjU0NSAxMDQuNjU5IDU0LjE1MzkgMTA2LjY3MVYwSDEyNUMxNDQuMzMgMCAxNjAgMTUuNjY5OSAxNjAgMzVWMTI1QzE2MCAxNDQuMzMgMTQ0LjMzIDE2MCAxMjUgMTYwSDEyNFYxOEgxMDQuOTQ4QzEwMy41NjkgMjEuNjgxNiAxMDEuMjU1IDI1LjM2MjggOTguMDA2MiAyOS4wNDQ0Qzk0Ljg1NTQgMzIuNTk0MiA5MS4zMTA4IDM1LjY4NDEgODcuMzcyMyAzOC4zMTRDODMuNDMzOCA0MC44MTIgNzkuNjQzMSA0Mi4zODk2IDc2IDQzLjA0NzRWNzIuNjMwNEM4MC41MjkyIDcxLjQ0NzMgODQuNjE1NCA2OS42NzI0IDg4LjI1ODUgNjcuMzA1N0M5MiA2NC44MDc2IDk1LjI0OTIgNjEuODQ5MSA5OC4wMDYyIDU4LjQzMDdDOTkuNDY1NSA1Ni41NTEzIDEwMC43NDUgNTQuNTk4NiAxMDEuODQ2IDUyLjU3MjNWMTYwSDM1QzE1LjY3IDE2MCAwIDE0NC4zMyAwIDEyNVYzNVoiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4K)](https://studio1hq.com)
[![Built with Velt](https://img.shields.io/badge/Built_with_Velt-141414?style=for-the-badge)](https://velt.dev)
[![Live demo](https://img.shields.io/badge/Live_demo-1c1917?style=for-the-badge&logo=vercel&logoColor=white)](https://movie-planner-flame.vercel.app/)

[Velt docs](https://docs.velt.dev) &nbsp;·&nbsp; [Velt](https://velt.dev) &nbsp;·&nbsp; [More examples](https://github.com/Studio1HQ) &nbsp;·&nbsp; [studio1hq.com](https://studio1hq.com)

</div>

<br />

## Overview

Movie Night Planner is a React app where friends browse movies and TV shows from TMDB and build a shared planning list together. The list, cursors and online status update live for everyone in the session.

It shows how to add presence, live cursors, huddles and live state sync to a React and Vite app with the [Velt](https://velt.dev) SDK. Two hardcoded demo users let you test collaboration in two browser tabs.

## Features

- **Live planning list**: Planning items are stored with Velt `useLiveState` and sync across all users.
- **Presence**: `VeltPresence` and `usePresenceUsers` show who is online and active. Presence switches to away when a tab is hidden.
- **Live cursors**: `VeltCursor` shows other users' cursors. Users do not see their own cursor.
- **Huddles and Follow Me**: `VeltHuddle` and `VeltHuddleTool` start audio or video huddles. A follow mode is wired through `VeltPresence`.
- **Session cleanup**: Users are signed out of Velt on sign out, page unload and page hide, which avoids stale cursors.
- **Movie data from TMDB**: Trending, popular and now playing lists, search for movies and TV shows, and trailer playback in a details modal.

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | [React](https://react.dev) with [Vite](https://vitejs.dev) and TypeScript |
| Collaboration | [Velt](https://velt.dev) (`@veltdev/react`) |
| Movie data | [TMDB API](https://www.themoviedb.org/documentation/api) |
| Styling | [Tailwind CSS](https://tailwindcss.com), [Framer Motion](https://www.framer.com/motion/), [Lucide](https://lucide.dev) |
| Deployment | [Vercel](https://vercel.com) |

## Getting started

### Prerequisites

- Node.js and npm
- A Velt API key from the [Velt console](https://console.velt.dev)
- A TMDB API key or Read Access Token from your [TMDB account](https://www.themoviedb.org/settings/api) (free)

### Installation

```bash
git clone https://github.com/Studio1HQ/movie-planner.git
cd movie-planner
npm install
```

### Environment variables

Create a `.env` file in the project root.

| Variable | Description |
| --- | --- |
| `VITE_VELT_API_KEY` | Velt API key for collaboration features. |
| `VITE_TMDB_API_KEY` | TMDB key. Either the API Read Access Token (starts with `eyJ`, sent as a Bearer token) or the v3 API key (sent as `api_key`). The app detects which one you used. |

If no TMDB key is set, the app falls back to mock data.

### Run

```bash
npm run dev
```

Open `http://localhost:5173`. Use `npm run build` for a production build.

## How it works

- `src/App.tsx` wraps the app in `VeltProvider`, signs the selected demo user in to Velt, and cleans up the session on sign out, unload and tab hide.
- `src/MovieNightPlanner.tsx` holds the UI, a TMDB service class, the `useLiveState('planningItems', [])` planning list, and the Velt presence, cursor and huddle components.
- TMDB endpoints used: `/trending/movie/day`, `/movie/popular`, `/movie/now_playing`, `/search/movie`, `/search/tv`, `/movie/{id}/videos` and `/tv/{id}/videos`.

Troubleshooting:

- **401 from TMDB**: check the key format in `.env` or regenerate it in the TMDB dashboard.
- **Mock data shown**: `VITE_TMDB_API_KEY` is missing or not loaded.
- **Collaboration not working**: verify `VITE_VELT_API_KEY` and check the browser console for Velt connection errors.
- **Stale cursors**: use the Sign Out button so the session is cleaned up properly.

## Resources

- [Live demo](https://movie-planner-flame.vercel.app/): the deployed app.
- [Velt documentation](https://docs.velt.dev): SDK guides for presence, cursors, huddles and live state sync.
- [Velt](https://velt.dev): product site.
- [TMDB API docs](https://developer.themoviedb.org/docs): movie and TV data used by the app.

<br />

---

<div align="center">

<a href="https://studio1hq.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Studio1HQ/website/main/brand/studio1-logo-on-dark.svg" />
    <img src="https://raw.githubusercontent.com/Studio1HQ/website/main/brand/studio1-logo-on-light.svg" alt="Studio1" width="160" />
  </picture>
</a>

Built by **[Studio1](https://studio1hq.com)**, the technical content and DevRel partner for devtool teams. Made with [Velt](https://velt.dev).<br />
Browse more open-source examples at [github.com/Studio1HQ](https://github.com/Studio1HQ).

[![Website](https://img.shields.io/badge/studio1hq.com-0b0807?style=for-the-badge&logo=googlechrome&logoColor=white)](https://studio1hq.com)
[![Book a call](https://img.shields.io/badge/Book_a_strategy_call-f97316?style=for-the-badge&logo=googlecalendar&logoColor=white)](https://cal.com/studio1/collab)
[![X](https://img.shields.io/badge/%40Studio1HQ-141414?style=for-the-badge&logo=x&logoColor=white)](https://x.com/Studio1HQ)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0a66c2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/studio1hq/)

<sub><a href="https://studio1hq.com">studio1hq.com</a> · Technical content, docs, video and DevRel for devtools</sub>

</div>
