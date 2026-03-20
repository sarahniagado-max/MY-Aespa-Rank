/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Achievements from './pages/Achievements';
import AdminSongs from './pages/AdminSongs';
import Albums from './pages/Albums';
import Analytics from './pages/Analytics';
import AppFeatures from './pages/AppFeatures';
import Battle from './pages/Battle';
import Community from './pages/Community';
import Favorites from './pages/Favorites';
import Feedback from './pages/Feedback';
import Home from './pages/Home';
import MoodRanking from './pages/MoodRanking';
import NumberOneStats from './pages/NumberOneStats';
import RankingReveal from './pages/RankingReveal';
import Results from './pages/Results';
import SavedRankings from './pages/SavedRankings';
import Settings from './pages/Settings';
import ShareCard from './pages/ShareCard';
import SongDetail from './pages/SongDetail';
import Songs from './pages/Songs';
import Stats from './pages/Stats';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Achievements": Achievements,
    "AdminSongs": AdminSongs,
    "Albums": Albums,
    "Analytics": Analytics,
    "AppFeatures": AppFeatures,
    "Battle": Battle,
    "Community": Community,
    "Favorites": Favorites,
    "Feedback": Feedback,
    "Home": Home,
    "MoodRanking": MoodRanking,
    "NumberOneStats": NumberOneStats,
    "RankingReveal": RankingReveal,
    "Results": Results,
    "SavedRankings": SavedRankings,
    "Settings": Settings,
    "ShareCard": ShareCard,
    "SongDetail": SongDetail,
    "Songs": Songs,
    "Stats": Stats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};