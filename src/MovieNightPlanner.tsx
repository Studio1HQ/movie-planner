'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Star, 
  Calendar, 
  Clock, 
  Play, 
  Plus, 
  Users, 
  Video, 
  Heart,
  Filter,
  TrendingUp,
  Film,
  Tv,
  ChevronDown,
  X,
  User,
  Check,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Info,
  Bookmark,
  Share,
  LogOut,
  UserPlus
} from 'lucide-react';
import { useVeltClient, usePresenceUsers, VeltCursor, VeltHuddle, VeltHuddleTool, useLiveState, VeltPresence } from '@veltdev/react';

// Utility function for cn
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Types
interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
  name?: string;
  first_air_date?: string;
}

interface Genre {
  id: number;
  name: string;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface PlanningItem {
  id: string;
  movie: Movie;
  addedBy: Friend;
  votes: number;
  userVote?: number;
}

interface MovieDetailsModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToPlanning: (movie: Movie) => void;
}

// Mock data
const mockFriends: Friend[] = [
  { id: '1', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', isOnline: true },
  { id: '2', name: 'Mike Johnson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', isOnline: true },
  { id: '3', name: 'Emma Davis', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', isOnline: false },
  { id: '4', name: 'Alex Rodriguez', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', isOnline: true },
];

const mockGenres: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
];

// API Service
class TMDbService {
  private baseUrl = 'https://api.themoviedb.org/3';
  private imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_TMDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('TMDB API key not found. Please add VITE_TMDB_API_KEY to your environment variables.');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.apiKey) {
      console.warn('No API key available, falling back to mock data');
      return this.getMockResponse(endpoint);
    }

    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Add common parameters
      const searchParams = new URLSearchParams({
        language: 'en-US',
        ...params
      });
      
      // Try Bearer token first (for Read Access Token)
      let headers: Record<string, string> = {
        'accept': 'application/json'
      };

      // Check if this looks like a Read Access Token (starts with 'eyJ' for JWT) or regular API key
      if (this.apiKey.startsWith('eyJ')) {
        // This looks like a Read Access Token (JWT format)
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      } else {
        // This looks like a regular API key, use query parameter
        searchParams.append('api_key', this.apiKey);
      }
      
      url.search = searchParams.toString();

      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('TMDB API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          endpoint,
          params
        });
        
        // If Bearer token fails, try with API key as query parameter
        if (response.status === 401 && headers['Authorization']) {
          console.log('Bearer token failed, trying with API key as query parameter...');
          delete headers['Authorization'];
          
          const retryUrl = new URL(`${this.baseUrl}${endpoint}`);
          const retryParams = new URLSearchParams({
            language: 'en-US',
            api_key: this.apiKey,
            ...params
          });
          retryUrl.search = retryParams.toString();
          
          const retryResponse = await fetch(retryUrl.toString(), { headers });
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status} - ${retryResponse.statusText}`);
          }
          
          return await retryResponse.json();
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      console.warn('Falling back to mock data due to API error');
      return this.getMockResponse(endpoint);
    }
  }

  private getMockResponse(endpoint: string): any {
    if (endpoint.includes('/trending/') || endpoint.includes('/movie/popular') || endpoint.includes('/movie/now_playing')) {
      return { results: this.getMockMovies() };
    }
    if (endpoint.includes('/search/')) {
      return { results: [...this.getMockMovies(), ...this.getMockTVShows()] };
    }
    if (endpoint.includes('/videos')) {
      return { 
        results: [
          {
            key: 'dQw4w9WgXcQ',
            site: 'YouTube',
            type: 'Trailer',
            name: 'Official Trailer'
          }
        ]
      };
    }
    return { results: [] };
  }

  async fetchMovies(category: 'trending' | 'popular' | 'now_playing'): Promise<Movie[]> {
    let endpoint = '';
    
    switch (category) {
      case 'trending':
        endpoint = '/trending/movie/day';
        break;
      case 'popular':
        endpoint = '/movie/popular';
        break;
      case 'now_playing':
        endpoint = '/movie/now_playing';
        break;
    }

    const data = await this.makeRequest(endpoint);
    return data.results.map((movie: any) => ({
      ...movie,
      media_type: 'movie'
    }));
  }

  async searchMovies(query: string): Promise<Movie[]> {
    if (!query.trim()) return [];
    
    const data = await this.makeRequest('/search/movie', { query });
    return data.results.map((movie: any) => ({
      ...movie,
      media_type: 'movie'
    }));
  }

  async searchTVShows(query: string): Promise<Movie[]> {
    if (!query.trim()) return [];
    
    const data = await this.makeRequest('/search/tv', { query });
    return data.results.map((show: any) => ({
      ...show,
      title: show.name,
      release_date: show.first_air_date,
      media_type: 'tv'
    }));
  }

  async getMovieVideos(movieId: number): Promise<any[]> {
    try {
      const data = await this.makeRequest(`/movie/${movieId}/videos`);
      console.log('Movie videos response:', data);
      return data.results || [];
    } catch (error) {
      console.error('Error fetching movie videos:', error);
      return [];
    }
  }

  async getTVVideos(tvId: number): Promise<any[]> {
    try {
      const data = await this.makeRequest(`/tv/${tvId}/videos`);
      console.log('TV videos response:', data);
      return data.results || [];
    } catch (error) {
      console.error('Error fetching TV videos:', error);
      return [];
    }
  }

  getImageUrl(path: string): string {
    if (!path) return '/placeholder-movie.jpg';
    return `${this.imageBaseUrl}${path}`;
  }

  getBackdropUrl(path: string): string {
    if (!path) return '/placeholder-backdrop.jpg';
    return `https://image.tmdb.org/t/p/w1280${path}`;
  }

  async getTrailerUrl(movieId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<string> {
    try {
      const videos = mediaType === 'movie' 
        ? await this.getMovieVideos(movieId)
        : await this.getTVVideos(movieId);
      
      console.log('All videos:', videos);
      
      // Find the first trailer from YouTube, prefer 'Trailer' over 'Teaser'
      const trailer = videos.find(video => 
        video.site === 'YouTube' && video.type === 'Trailer'
      ) || videos.find(video => 
        video.site === 'YouTube' && video.type === 'Teaser'
      ) || videos.find(video => 
        video.site === 'YouTube'
      );
      
      if (trailer) {
        console.log('Selected trailer:', trailer);
        // Return base URL without parameters - we'll add them dynamically
        return `https://www.youtube.com/embed/${trailer.key}`;
      }
      
      console.log('No trailer found, using fallback');
      // Fallback to a placeholder video
      return `https://www.youtube.com/embed/dQw4w9WgXcQ`;
    } catch (error) {
      console.error('Error fetching trailer:', error);
      return `https://www.youtube.com/embed/dQw4w9WgXcQ`;
    }
  }

  private getMockMovies(): Movie[] {
    return [
      {
        id: 1,
        title: "The Dark Knight",
        overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
        poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
        release_date: "2008-07-18",
        vote_average: 9.0,
        genre_ids: [28, 80, 18],
        media_type: 'movie'
      },
      {
        id: 2,
        title: "Inception",
        overview: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.",
        poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
        release_date: "2010-07-16",
        vote_average: 8.8,
        genre_ids: [28, 878, 53],
        media_type: 'movie'
      },
      {
        id: 3,
        title: "Interstellar",
        overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        backdrop_path: "/pbrkL804c8yAv3zBZR4QPWZAAn8.jpg",
        release_date: "2014-11-07",
        vote_average: 8.6,
        genre_ids: [18, 878],
        media_type: 'movie'
      },
      {
        id: 4,
        title: "Parasite",
        overview: "A poor family schemes to become employed by a wealthy family and infiltrate their household.",
        poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        backdrop_path: "/TU9NIjwzjoKPwQHoHshkBcQZzr.jpg",
        release_date: "2019-05-30",
        vote_average: 8.5,
        genre_ids: [35, 18, 53],
        media_type: 'movie'
      },
      {
        id: 5,
        title: "Dune",
        overview: "Paul Atreides leads nomadic tribes in a revolt against the galactic emperor and his father's evil nemesis.",
        poster_path: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
        backdrop_path: "/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg",
        release_date: "2021-10-22",
        vote_average: 8.0,
        genre_ids: [12, 18, 878],
        media_type: 'movie'
      },
      {
        id: 6,
        title: "Spider-Man: No Way Home",
        overview: "Spider-Man's identity is revealed and he asks Doctor Strange for help, but things go wrong.",
        poster_path: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        backdrop_path: "/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",
        release_date: "2021-12-17",
        vote_average: 8.4,
        genre_ids: [28, 12, 878],
        media_type: 'movie'
      }
    ];
  }

  private getMockTVShows(): Movie[] {
    return [
      {
        id: 101,
        name: "Breaking Bad",
        title: "Breaking Bad",
        overview: "A high school chemistry teacher turned methamphetamine producer partners with a former student.",
        poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
        first_air_date: "2008-01-20",
        release_date: "2008-01-20",
        vote_average: 9.5,
        genre_ids: [18, 80],
        media_type: 'tv'
      },
      {
        id: 102,
        name: "Stranger Things",
        title: "Stranger Things",
        overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments.",
        poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
        backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
        first_air_date: "2016-07-15",
        release_date: "2016-07-15",
        vote_average: 8.7,
        genre_ids: [18, 14, 27],
        media_type: 'tv'
      }
    ];
  }
}

// Theme Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme Toggle Component
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-1.5 rounded-md bg-card border border-border hover:bg-muted/50 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {theme === 'light' ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
    </motion.button>
  );
};

// Movie Details Modal Component
const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({ 
  movie, 
  isOpen, 
  onClose, 
  onAddToPlanning 
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [baseTrailerUrl, setBaseTrailerUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
  const tmdbService = new TMDbService();

  // Load trailer URL when movie changes
  useEffect(() => {
    if (movie && isOpen) {
      const loadTrailer = async () => {
        try {
          setVideoError(false);
          setIsMuted(true); // Reset to muted for autoplay compliance
          const url = await tmdbService.getTrailerUrl(movie.id, movie.media_type);
          console.log('Trailer URL loaded:', url);
          setBaseTrailerUrl(url);
        } catch (error) {
          console.error('Error loading trailer:', error);
          setVideoError(true);
        }
      };
      loadTrailer();
    }
  }, [movie, isOpen]);

  // Create dynamic trailer URL based on mute state
  const trailerUrl = React.useMemo(() => {
    if (!baseTrailerUrl) return '';
    
    // YouTube embed parameters for better compatibility
    const params = new URLSearchParams({
      autoplay: '1',
      mute: isMuted ? '1' : '0',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
      origin: window.location.origin
    });
    
    const finalUrl = `${baseTrailerUrl}?${params.toString()}`;
    console.log('Final trailer URL:', finalUrl);
    return finalUrl;
  }, [baseTrailerUrl, isMuted]);

  if (!movie) return null;

  const title = movie.title || movie.name || 'Unknown Title';
  const releaseDate = movie.release_date || movie.first_air_date || '';
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const backdropUrl = movie.backdrop_path ? tmdbService.getBackdropUrl(movie.backdrop_path) : '';

  const genres = movie.genre_ids.map(id => 
    mockGenres.find(genre => genre.id === id)?.name
  ).filter(Boolean).join(' • ');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-4 md:inset-8 lg:inset-16 xl:inset-24 bg-card rounded-lg overflow-hidden shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Background */}
            <div className="relative w-full h-full flex flex-col">
                             {/* Video Container */}
               <div className="relative flex-1 bg-black">
                 {trailerUrl && !videoError ? (
                   <iframe
                     key={`${baseTrailerUrl}-${isMuted}`} // Force re-render when URL or mute changes
                     src={trailerUrl}
                     className="w-full h-full"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                     allowFullScreen
                     loading="lazy"
                     style={{ border: 'none' }}
                     title="Movie Trailer"
                     onError={() => {
                       console.error('Iframe failed to load');
                       setVideoError(true);
                     }}
                   />
                 ) : backdropUrl ? (
                   <div 
                     className="w-full h-full bg-cover bg-center relative"
                     style={{ backgroundImage: `url(${backdropUrl})` }}
                   >
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                       <div className="text-center text-white">
                         <Play className="h-16 w-16 mx-auto mb-2" />
                         <p className="text-sm">Trailer not available</p>
                         <p className="text-xs opacity-70">Click to view details</p>
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="w-full h-full bg-muted flex items-center justify-center">
                     <div className="text-center text-muted-foreground">
                       <Play className="h-16 w-16 mx-auto mb-2" />
                       <p className="text-sm">Loading trailer...</p>
                     </div>
                   </div>
                 )}
                
                {/* Video Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Controls */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-black/70 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="bg-black/70 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Content Section */}
              <div className="bg-card p-4 md:p-6 border-t border-border">
                <div className="max-w-none">
                  <motion.h1 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2 text-left"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {title}
                  </motion.h1>

                  <motion.div 
                    className="flex items-center gap-4 mb-4 text-muted-foreground"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-foreground">{movie.vote_average.toFixed(1)}</span>
                    </div>
                    <span className="text-sm">{year}</span>
                    <span className="text-sm">{movie.media_type === 'tv' ? 'TV Series' : 'Movie'}</span>
                    {genres && <span className="text-sm hidden md:inline">{genres}</span>}
                  </motion.div>

                  <motion.p 
                    className="text-foreground/90 text-sm md:text-base mb-6 text-left leading-relaxed"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {movie.overview}
                  </motion.p>

                  <motion.div 
                    className="flex flex-wrap gap-2 justify-start"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      onClick={() => {
                        onAddToPlanning(movie);
                        onClose();
                      }}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Add to List
                    </button>
                    
                    <button className="bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-1.5">
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">Watch Trailer</span>
                    </button>
                    
                    <button className="bg-muted text-foreground p-2 rounded-md hover:bg-muted/80 transition-colors">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    
                    <button className="bg-muted text-foreground p-2 rounded-md hover:bg-muted/80 transition-colors">
                      <Share className="h-4 w-4" />
                    </button>
                  </motion.div>

                  {/* Additional Info Toggle for Mobile */}
                  <motion.button
                    onClick={() => setShowInfo(!showInfo)}
                    className="md:hidden mt-4 text-muted-foreground text-sm flex items-center gap-1"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Info className="h-4 w-4" />
                    {showInfo ? 'Less Info' : 'More Info'}
                  </motion.button>

                  <AnimatePresence>
                    {(showInfo || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 text-muted-foreground text-sm space-y-2"
                      >
                        <p className="text-left"><span className="font-medium text-foreground">Genres:</span> {genres || 'N/A'}</p>
                        <p className="text-left"><span className="font-medium text-foreground">Release Date:</span> {releaseDate || 'N/A'}</p>
                        <p className="text-left"><span className="font-medium text-foreground">Type:</span> {movie.media_type === 'tv' ? 'TV Series' : 'Movie'}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Star Rating Component
interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false,
  onRate 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <motion.button
          key={star}
          type="button"
          className={cn(
            "focus:outline-none",
            interactive && "cursor-pointer hover:scale-110"
          )}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          whileHover={interactive ? { scale: 1.1 } : undefined}
          whileTap={interactive ? { scale: 0.9 } : undefined}
          disabled={!interactive}
        >
          <Star 
            className={cn(
              sizeClasses[size],
              "transition-colors",
              (hoverRating || rating) >= star 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-300 text-gray-300"
            )} 
          />
        </motion.button>
      ))}
    </div>
  );
};

// Movie Card Component
interface MovieCardProps {
  movie: Movie;
  onAddToPlanning: (movie: Movie) => void;
  onViewDetails: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onAddToPlanning, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const tmdbService = new TMDbService();
  const posterUrl = movie.poster_path ? tmdbService.getImageUrl(movie.poster_path) : '/placeholder-movie.jpg';
  const title = movie.title || movie.name || 'Unknown Title';
  const releaseDate = movie.release_date || movie.first_air_date || '';
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';

  return (
    <motion.div
      className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      layout
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={posterUrl}
          alt={title}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onViewDetails(movie)}
                className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <Play className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAddToPlanning(movie)}
                className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {movie.vote_average.toFixed(1)}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground text-xs mb-2">
          {year} • {movie.media_type === 'tv' ? 'TV Show' : 'Movie'}
        </p>
        <p className="text-muted-foreground text-xs line-clamp-2">
          {movie.overview}
        </p>
      </div>
    </motion.div>
  );
};

// Search Component
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search movies and TV shows..." }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<number>();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }, [onSearch]);

  return (
    <div className="relative">
      <motion.div
        className={cn(
          "relative flex items-center border rounded-lg transition-all duration-200",
          isFocused ? "border-primary shadow-sm" : "border-border"
        )}
        whileFocus={{ scale: 1.02 }}
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </motion.div>
    </div>
  );
};

// Friends List Component
interface FriendsListProps {
  friends: Friend[];
  currentUser: any;
  onStartHuddle: (friend: Friend) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ friends, currentUser, onStartHuddle }) => {
  const { client } = useVeltClient();
  const onlineFriends = friends.filter(friend => friend.isOnline);
  
  // Sort users to put current user first
  const sortedFriends = React.useMemo(() => {
    return onlineFriends.sort((a, b) => {
      if (currentUser && a.id === currentUser.userId) return -1;
      if (currentUser && b.id === currentUser.userId) return 1;
      return 0;
    });
  }, [onlineFriends, currentUser]);

  const handleStartFollowing = async (friend: Friend) => {
    if (client) {
      try {
        const presenceElement = client.getPresenceElement();
        if (presenceElement) {
          // Use the Velt SDK method to start following
          await (presenceElement as any).startFollowingUser(friend.id);
          console.log(`Started following ${friend.name}...`);
        }
      } catch (error) {
        console.error('Error starting follow mode:', error);
        // Fallback: The Follow Me mode should work through the VeltPresence component
        // Users can click on avatars in the presence bar to start following
        console.log('Use the presence avatars in the header to start following users');
      }
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Users className="h-4 w-4" />
        Online Friends ({onlineFriends.length})
      </h3>
      
      <div className="space-y-3">
        {sortedFriends.map((friend) => {
          const isCurrentUser = currentUser && friend.id === currentUser.userId;
          
          return (
            <motion.div
              key={friend.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <span className="text-sm font-medium text-foreground">{friend.name}</span>
              </div>
              
              {isCurrentUser ? (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  You
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <VeltHuddleTool className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs hover:bg-primary/90 transition-colors flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Huddle
                  </VeltHuddleTool>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Planning List Component
interface PlanningListProps {
  items: PlanningItem[];
  onVote: (itemId: string, rating: number) => void;
  onRemove: (itemId: string) => void;
}

const PlanningList: React.FC<PlanningListProps> = ({ items, onVote, onRemove }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Tonight's Picks ({items.length})
      </h3>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No movies added yet</p>
          <p className="text-xs">Start browsing to add movies to your list!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="border border-border rounded-lg p-3 bg-background"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex gap-3">
                <img
                  src={item.movie.poster_path ? new TMDbService().getImageUrl(item.movie.poster_path) : '/placeholder-movie.jpg'}
                  alt={item.movie.title || item.movie.name || ''}
                  className="w-12 h-16 object-cover rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-left text-sm text-foreground mb-1 truncate">
                    {item.movie.title || item.movie.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={item.addedBy.avatar}
                      alt={item.addedBy.name}
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="text-xs text-muted-foreground">
                      Added by {item.addedBy.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <StarRating
                      rating={item.userVote || 0}
                      size="sm"
                      interactive
                      onRate={(rating) => onVote(item.id, rating)}
                    />
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {item.votes} votes
                      </span>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Filter Component
interface FilterProps {
  selectedGenres: number[];
  onGenreChange: (genres: number[]) => void;
  selectedType: 'all' | 'movie' | 'tv';
  onTypeChange: (type: 'all' | 'movie' | 'tv') => void;
}

const FilterComponent: React.FC<FilterProps> = ({
  selectedGenres,
  onGenreChange,
  selectedType,
  onTypeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleGenre = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onGenreChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onGenreChange([...selectedGenres, genreId]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2.5 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Filter className="h-3.5 w-3.5" />
        <span className="text-sm">Filters</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-50"
          >
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2">Content Type</h4>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'movie', label: 'Movies' },
                  { value: 'tv', label: 'TV Shows' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => onTypeChange(type.value as any)}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs transition-colors",
                      selectedType === type.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Genres</h4>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {mockGenres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors text-left",
                      selectedGenres.includes(genre.id)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 border rounded-sm flex items-center justify-center",
                      selectedGenres.includes(genre.id) && "bg-primary-foreground"
                    )}>
                      {selectedGenres.includes(genre.id) && (
                        <Check className="h-2 w-2 text-primary" />
                      )}
                    </div>
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Movie Night Planner Component
interface MovieNightPlannerProps {
  currentUser: any;
  onSignOut?: () => Promise<void>;
}

const MovieNightPlanner: React.FC<MovieNightPlannerProps> = ({ currentUser, onSignOut }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'trending' | 'popular' | 'now_playing'>('trending');
  // Use Velt Live State Sync for collaborative planning items
  const [planningItems, setPlanningItems] = useLiveState<PlanningItem[]>('planningItems', []);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { client } = useVeltClient();
  const presenceUsers = usePresenceUsers();
  const tmdbService = new TMDbService();

  // Initialize Velt document and Follow Me mode
  useEffect(() => {
    const initializeVeltDocument = async () => {
      if (client) {
        await client.setDocument('movie-night-planner');
        
        // Enable Follow Me mode via API for better compatibility
        try {
          const presenceElement = client.getPresenceElement();
          if (presenceElement && (presenceElement as any).enableFlockMode) {
            (presenceElement as any).enableFlockMode();
            console.log('Follow Me mode enabled via API');
          }
        } catch (error) {
          console.log('Follow Me mode will work through VeltPresence component');
        }
      }
    };
    initializeVeltDocument();
  }, [client]);

  // Convert Velt presence users to our Friend format and ensure current user is included
  const onlineUsers: Friend[] = React.useMemo(() => {
    let users: Friend[] = presenceUsers ? presenceUsers.map(user => ({
      id: user.userId,
      name: user.name || user.email || 'Unknown User',
      avatar: user.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || user.userId}`,
      isOnline: true
    })) : [];

    // Ensure current user is included in the list if they're not already there
    if (currentUser && !users.find(user => user.id === currentUser.userId)) {
      users.push({
        id: currentUser.userId,
        name: currentUser.name || 'You',
        avatar: currentUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name || currentUser.userId}`,
        isOnline: true
      });
    }

    return users;
  }, [presenceUsers, currentUser]);

  // Load initial movies
  useEffect(() => {
    loadMovies();
  }, [selectedCategory]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadMovies();
    }
  }, [searchQuery]);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const data = await tmdbService.fetchMovies(selectedCategory);
      setMovies(data);
    } catch (error) {
      console.error('Error loading movies:', error);
      setMovies([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const [movieResults, tvResults] = await Promise.all([
        tmdbService.searchMovies(searchQuery),
        tmdbService.searchTVShows(searchQuery)
      ]);
      
      let results = [...movieResults, ...tvResults];
      
      // Apply filters
      if (selectedType !== 'all') {
        results = results.filter(item => item.media_type === selectedType);
      }
      
      if (selectedGenres.length > 0) {
        results = results.filter(item => 
          item.genre_ids.some(id => selectedGenres.includes(id))
        );
      }
      
      setMovies(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlanning = (movie: Movie) => {
    const existingItem = planningItems.find(item => item.movie.id === movie.id);
    if (existingItem) return;

    if (!currentUser) return;

    const currentUserAsFriend: Friend = {
      id: currentUser.userId,
      name: currentUser.name,
      avatar: currentUser.photoUrl,
      isOnline: true
    };

    const newItem: PlanningItem = {
      id: `${movie.id}-${Date.now()}`,
      movie,
      addedBy: currentUserAsFriend,
      votes: 1,
      userVote: 5
    };

    // Update with Velt Live State - replace entire array
    setPlanningItems([...planningItems, newItem]);
  };

  const handleVote = (itemId: string, rating: number) => {
    const updatedItems = planningItems.map(item =>
      item.id === itemId
        ? { ...item, userVote: rating, votes: item.votes + (item.userVote ? 0 : 1) }
        : item
    );
    setPlanningItems(updatedItems);
  };

  const handleRemoveFromPlanning = (itemId: string) => {
    const updatedItems = planningItems.filter(item => item.id !== itemId);
    setPlanningItems(updatedItems);
  };

  const handleStartHuddle = (friend: Friend) => {
    // Start Velt huddle with the selected friend
    if (client) {
      // Velt huddle will automatically handle the huddle functionality
      // The VeltHuddle component below will manage the UI
      console.log(`Starting huddle with ${friend.name}...`);
    }
  };

    const handleViewDetails = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  const categories = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'popular', label: 'Popular', icon: Star },
    { id: 'now_playing', label: 'Now Playing', icon: Play }
  ];

    return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Velt Live Cursors - Shows cursors of all online users */}
        <VeltCursor />
        
        {/* Velt Huddle - Enables voice/video calls between users */}
        <VeltHuddle />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Film className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-left">Movie Night Planner</h1>
                <p className="text-xs text-muted-foreground">Plan the perfect movie night with friends</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {/* Velt Presence with Follow Me Mode - Click on avatars to follow users */}
              <VeltPresence flockMode={true} />
              
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Welcome back, {currentUser?.name || 'User'}!</p>
                <p className="text-xs text-muted-foreground">Ready for movie night?</p>
              </div>
              {onSignOut && (
                <motion.button
                  onClick={onSignOut}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </motion.button>
              )}
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar onSearch={setSearchQuery} />
            </div>
            <FilterComponent
              selectedGenres={selectedGenres}
              onGenreChange={setSelectedGenres}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Category Tabs */}
            {!searchQuery && (
              <div className="flex gap-1 mb-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <motion.button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as any)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                        selectedCategory === category.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border hover:bg-muted/50"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {category.label}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Movies Grid */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 text-left">
                {searchQuery ? `Search Results for "${searchQuery}"` : categories.find(c => c.id === selectedCategory)?.label}
              </h2>
              
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-muted animate-pulse rounded-lg aspect-[2/3]" />
                  ))}
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  layout
                >
                  <AnimatePresence>
                    {movies.map((movie) => (
                      <motion.div
                        key={movie.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MovieCard
                          movie={movie}
                          onAddToPlanning={handleAddToPlanning}
                          onViewDetails={handleViewDetails}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
              
              {!loading && movies.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No movies found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <FriendsList
              friends={onlineUsers}
              currentUser={currentUser}
              onStartHuddle={handleStartHuddle}
            />
            
            <PlanningList
              items={planningItems}
              onVote={handleVote}
              onRemove={handleRemoveFromPlanning}
            />
          </div>
        </div>
      </div>

      {/* Movie Details Modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToPlanning={handleAddToPlanning}
      />
    </div>
    </ThemeProvider>
  );
};

export default MovieNightPlanner;
