# Movie Night Planner Setup Guide

## Required API Keys

This application requires two API keys to function properly:

### 1. Velt API Key
- Sign up at [Velt.dev](https://velt.dev)
- Create a new project
- Copy your API key from the dashboard

### 2. TMDB API Key
- Sign up at [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Go to your account settings
- Navigate to the API section
- Request an API key (it's free!)
- You can use **either**:
  - **API Read Access Token** (recommended) - starts with `eyJ` (JWT format)
  - **API Key (v3 auth)** - regular API key string

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```bash
# Velt API Key for collaboration features
VITE_VELT_API_KEY=your_velt_api_key_here

# TMDB API Key for movie data (can be either Read Access Token or regular API key)
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

## Installation & Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Features

- **Real-time collaboration** with Velt (cursors, huddles, live state sync)
- **Collaborative movie planning** - Real-time synced planning list across all users
- **Live movie data** from TMDB API
- **Search functionality** for movies and TV shows
- **Trending, Popular, and Now Playing** movie categories
- **Trailer playback** in movie details modal
- **User presence** - See who's online and active

## API Endpoints Used

### TMDB API v3
- `/trending/movie/day` - Trending movies
- `/movie/popular` - Popular movies  
- `/movie/now_playing` - Now playing movies
- `/search/movie` - Movie search
- `/search/tv` - TV show search
- `/movie/{id}/videos` - Movie trailers
- `/tv/{id}/videos` - TV show trailers

### Authentication
Supports both authentication methods:
- **Bearer Token**: `Authorization: Bearer <read_access_token>` (for JWT tokens starting with `eyJ`)
- **Query Parameter**: `?api_key=<api_key>` (for regular API keys)

The app automatically detects which type you're using and applies the correct authentication method.

## Troubleshooting

- **Getting 401 errors**: Your TMDB API key might be invalid or expired
  - Double-check your API key in the `.env` file
  - Make sure you're using the correct key format (Read Access Token or regular API key)
  - Try regenerating your API key in the TMDB dashboard
- **Seeing mock data**: Check that your TMDB API key is correctly set in `VITE_TMDB_API_KEY`
- **Collaboration features not working**: Verify your Velt API key in `VITE_VELT_API_KEY`
- **Check browser console**: Look for detailed error messages and API responses 