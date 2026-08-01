import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {Youtube,Sun,Moon,History,UserCircle,ChevronDown,Settings,LogOut,User,Clock,X,HelpCircle,BarChart2,ChevronRight,
    PlayCircle,TrendingUp,Users,Eye,Tag,Share2,Search,BarChartBig,ArrowLeft,Mail,Lock,Award,Database,Bookmark,Bell,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import authService from '@/services/authService';
import ErrorBoundary from './ErrorBoundary';
import ChannelPerformance from './ChannelPerformance';
import TopicTrends from './TopicTrends';
import VideoSeoAnalysis from './VideoSeoAnalysis';
import CompetitorAnalysis from './CompetitorAnalysis';
import ThumbnailTesting from './ThumbnailTesting';
import KeywordResearch from './KeywordResearch';
import SocialSharing from './SocialSharing';
import PerformancePredictor from './PerformancePredictor';
import VideoSearch from './VideoSearch';
import VideoCategories from './VideoCategories';
import ProfileSettings from './ProfileSettings';
import SavedItems from './SavedItems';
import NotificationCenter from './NotificationCenter';
import Login from './Login';
import Register from './Register';
interface FeatureDetails {
    keyBenefits: string[];
    howItWorks: string;
    dataProvided: string[];}
interface FeatureDetailsMap {
    [key: string]: FeatureDetails;}
interface Feature {
    id: string;
    title: string;
    description: string;
    iconName: string;}
// Feature Information Modal with 3 Cards
const FeatureInfoModal: React.FC<{ feature: Feature | null; onClose: () => void; onNavigate: (id: string) => void }> = ({ feature, onClose, onNavigate }) => {
    if (!feature) return null;
    const featureDetails: FeatureDetailsMap = {
        videoCategories: {
            keyBenefits: [
                "Browse videos by organized categories",
                "Discover content across 10+ major topics",
                "Filter by multiple languages",
                "Intelligent topic-based search"
            ],
            howItWorks: "Select from curated categories like Education, Programming, Cooking, and more. Each category contains dozens of specific topics. Choose your preferred language and let our intelligent system find the most relevant videos matching your selection.",
            dataProvided: [
                "10+ Major Categories",
                "100+ Topic Options",
                "Multi-language Support",
                "Curated Topic Lists",
                "Smart Category Navigation",
                "Language-specific Results"
            ]
        },
        videoSearch: {
            keyBenefits: [
                "Find relevant videos quickly with advanced filters",
                "Analyze sentiment from video comments",
                "Sort by views, likes, or comments",
                "Track your search history"
            ],
            howItWorks: "Enter any search term and our system queries YouTube's database with advanced filtering options. You can filter by duration, upload date, video type, and sort results by various metrics. The tool also analyzes comment sentiment to gauge audience reception.",
            dataProvided: [
                "Video Title & Thumbnail",
                "View Count & Engagement Metrics",
                "Sentiment Analysis (Positive/Negative/Neutral)",
                "Channel Information",
                "Advanced Filter Options",
                "Search History Tracking"
            ]
        },
        channelPerformance: {
            keyBenefits: [
                "Benchmark against competitors in your niche",
                "Identify successful content strategies",
                "Track growth trajectory over time",
                "Make data-driven content decisions"
            ],
            howItWorks: "Search for any YouTube channel and instantly access comprehensive analytics. Our system fetches real-time data including subscriber count, total views, video count, engagement rates, and historical growth trends. The dashboard visualizes performance metrics through interactive charts and provides actionable insights.",
            dataProvided: [
                "Subscriber Count & Growth Rate",
                "Total Views & Average Views per Video",
                "Engagement Rate (Likes + Comments)",
                "Channel Age & Upload Frequency",
                "Recent Video Performance Trends",
                "Subscriber-to-View Ratio"
            ]
        },
        topicTrends: {
            keyBenefits: [
                "Discover trending topics before they peak",
                "Increase video discoverability",
                "Stay ahead of content trends",
                "Target high-demand keywords"
            ],
            howItWorks: "Our system analyzes trending keywords from popular videos across different regions using YouTube's trending data. It processes video titles, tags, and descriptions to identify emerging topics and calculates growth rates to show you what's gaining momentum right now.",
            dataProvided: [
                "Trending Keywords by Region",
                "Keyword Popularity Scores",
                "Growth Rate Percentages",
                "Topic Frequency Analysis",
                "Regional Trend Comparisons",
                "Historical Trend Data"
            ]
        },
        videoSeoAnalysis: {
            keyBenefits: [
                "Rank higher in YouTube search results",
                "Increase organic video views",
                "Optimize metadata effectively",
                "Learn from top-performing videos"
            ],
            howItWorks: "Enter a keyword or topic, and our tool examines top-ranking videos to provide SEO recommendations. It analyzes titles, descriptions, tags, and engagement patterns to suggest optimizations that can improve your video's search visibility and click-through rate.",
            dataProvided: [
                "Optimized Title Suggestions",
                "High-Performance Tag Recommendations",
                "Description Best Practices",
                "Keyword Density Analysis",
                "Top-Ranking Video Examples",
                "SEO Score & Improvement Tips"
            ]
        },
        competitorAnalysis: {
            keyBenefits: [
                "Identify content gaps in your niche",
                "Understand what works for competitors",
                "Develop differentiation strategies",
                "Track competitive performance"
            ],
            howItWorks: "Select multiple channels to compare side-by-side. Our system fetches comprehensive metrics for each channel and visualizes comparative performance through charts. Analyze posting frequency, engagement patterns, content strategies, and audience growth to inform your own strategy.",
            dataProvided: [
                "Side-by-Side Channel Metrics",
                "Comparative Growth Charts",
                "Content Strategy Analysis",
                "Posting Frequency Patterns",
                "Engagement Rate Comparisons",
                "Audience Overlap Insights"
            ]
        },
        thumbnailTesting: {
            keyBenefits: [
                "Maximize click-through rates",
                "Test designs before committing",
                "Make data-driven design choices",
                "Improve video performance"
            ],
            howItWorks: "Upload multiple thumbnail variations for A/B testing. Our system tracks impressions (how many times each thumbnail is shown) and clicks to calculate click-through rates. Compare performance metrics to identify which thumbnail design resonates best with your audience.",
            dataProvided: [
                "Click-Through Rate (CTR) per Thumbnail",
                "Total Impressions & Clicks",
                "Performance Comparison Charts",
                "Winner Identification",
                "Statistical Significance Data",
                "Design Recommendations"
            ]
        },
        keywordResearch: {
            keyBenefits: [
                "Find low-competition keywords",
                "Target high-volume search terms",
                "Improve content discoverability",
                "Rank faster in search results"
            ],
            howItWorks: "Enter a topic or niche, and our tool analyzes tags from top-performing videos to discover high-volume, low-competition keywords. It processes thousands of videos to identify keyword opportunities that can help your content reach the right audience.",
            dataProvided: [
                "High-Volume Keyword List",
                "Competition Level Analysis",
                "Related Keyword Suggestions",
                "Tag Frequency Data",
                "Search Volume Estimates",
                "Top-Performing Video Examples"
            ]
        },
        socialSharing: {
            keyBenefits: [
                "Expand reach beyond YouTube",
                "Drive traffic from social media",
                "Save time with automation",
                "Schedule posts for optimal times"
            ],
            howItWorks: "Connect your social media accounts and automatically share videos across multiple platforms. Schedule posts for future dates or share immediately. Our system formats your content appropriately for each platform and tracks engagement from social sources.",
            dataProvided: [
                "Platform Reach Metrics",
                "Cross-Platform Engagement Rates",
                "Traffic Source Analytics",
                "Scheduled Post Calendar",
                "Share Performance History",
                "Best Time to Post Insights"
            ]
        },
        performancePredictor: {
            keyBenefits: [
                "Set realistic view expectations",
                "Optimize before publishing",
                "Identify improvement opportunities",
                "Make informed content decisions"
            ],
            howItWorks: "Our machine learning model analyzes your video metadata (title, description, tags) and compares it against historical performance data from thousands of videos. It predicts potential view counts for the next 30 days and provides optimization suggestions to improve predicted performance.",
            dataProvided: [
                "30-Day View Prediction",
                "Confidence Score",
                "Optimization Suggestions",
                "Historical Comparison Data",
                "Performance Probability Range",
                "Metadata Quality Score"
            ]
        }
    };

    const details = featureDetails[feature.id] || {
        keyBenefits: [],
        howItWorks: 'No information available.',
        dataProvided: [],
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 max-w-5xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{feature.title}</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* 3 Cards Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Card 1: Key Benefits */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="text-blue-600 dark:text-blue-400" size={24} />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Key Benefits</h3>
                        </div>
                        <ul className="space-y-3">
                            {details.keyBenefits.map((benefit: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <ChevronRight size={16} className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                    <span className="text-sm">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Card 2: How It Works */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle className="text-purple-600 dark:text-purple-400" size={24} />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">How It Works</h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                            {details.howItWorks}
                        </p>
                    </div>

                    {/* Card 3: Data Provided */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="text-green-600 dark:text-green-400" size={24} />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Data Provided</h3>
                        </div>
                        <ul className="space-y-3">
                            {details.dataProvided.map((data: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                    <ChevronRight size={16} className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                                    <span className="text-sm">{data}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate(feature.id)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                    >
                        Try It Now
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all duration-300"
                    >
                        Close
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};
// Enhanced Header Component
const Header: React.FC<{
    onBack: () => void;
    showBackButton: boolean;
    isLoggedIn: boolean;
    onLogout: () => void;
    onShowProfile: () => void;
    onShowSettings: () => void;
    userEmail: string;
    userAvatar: string;
}> = ({ onBack, showBackButton, isLoggedIn, onLogout, onShowProfile, onShowSettings, userEmail, userAvatar }) => {
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
    const [showHistoryMenu, setShowHistoryMenu] = useState<boolean>(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            const { darkMode: savedDarkMode } = JSON.parse(savedSettings);
            setDarkMode(savedDarkMode);
            applyTheme(savedDarkMode);
        }
        loadHistory();
    }, []);
    const loadHistory = (): void => {
        const saved = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setRecentSearches(saved);
    };
    const applyTheme = (isDark: boolean): void => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    const toggleDarkMode = (): void => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('userSettings', JSON.stringify({ darkMode: newMode }));
        applyTheme(newMode);
    };
    const handleClearHistory = (): void => {
        setRecentSearches([]);
        localStorage.setItem('searchHistory', JSON.stringify([]));
        toast.success('Search history cleared');
    };
    return (
        <header className={`relative z-50 p-4 md:p-6 flex justify-between items-center border-b transition-all duration-300 ${
            darkMode 
                ? 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-lg border-gray-700/50' 
                : 'bg-white/90 backdrop-blur-lg border-gray-200'
        }`}>
            {showBackButton && (
                <motion.button
                    onClick={onBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 transition-colors duration-200 ${
                        darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <ArrowLeft size={24} />
                    <span className="hidden md:inline">Back</span>
                </motion.button>
            )}           
            <div className={`flex items-center space-x-2 ${showBackButton ? '' : 'mx-auto md:mx-0'}`}>
                <Youtube size={32} className="text-red-500" />
                <h1 className="text-2xl font-bold tracking-tight">
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>Tutor</span>
                    <span className="text-red-500">Trace</span>
                </h1>
            </div>
            <div className="flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <motion.button
                    onClick={toggleDarkMode}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                        darkMode 
                            ? 'bg-white hover:bg-gray-100' 
                            : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                >
                    {darkMode ? (
                        <Sun size={24} className="text-yellow-500" />
                    ) : (
                        <Moon size={24} className="text-white" />
                    )}
                </motion.button>
                {isLoggedIn && (
                    <>
                        {/* Saved Items Button */}
                        <motion.button
                            onClick={() => window.location.hash = '#saved-items'}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center space-x-2 py-2 px-4 rounded-full transition-all duration-200 ${
                                darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            }`}
                        >
                            <Bookmark size={20} />
                            <span className="hidden md:inline">Saved</span>
                        </motion.button>

                        {/* Notifications Button */}
                        <motion.button
                            onClick={() => window.location.hash = '#notifications'}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center space-x-2 py-2 px-4 rounded-full transition-all duration-200 ${
                                darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            }`}
                        >
                            <Bell size={20} />
                            <span className="hidden md:inline">Alerts</span>
                        </motion.button>

                        {/* History Dropdown */}
                        <div className="relative">
                            <motion.button
                                onClick={() => {
                                    setShowHistoryMenu(!showHistoryMenu);
                                    loadHistory();
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center space-x-2 py-2 px-4 rounded-full transition-all duration-200 ${
                                    darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                }`}
                            >
                                <History size={20} />
                                <span className="hidden md:inline">History</span>
                                <ChevronDown size={16} />
                            </motion.button>

                            <AnimatePresence>
                                {showHistoryMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border overflow-hidden ${
                                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    Search History
                                                </span>
                                                {recentSearches.length > 0 && (
                                                    <button
                                                        onClick={handleClearHistory}
                                                        className="text-xs text-red-500 hover:text-red-600"
                                                    >
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {recentSearches.length > 0 ? (
                                                recentSearches.map((search: string, idx: number) => (
                                                    <div 
                                                        key={idx} 
                                                        className={`p-3 border-b last:border-b-0 ${
                                                            darkMode 
                                                                ? 'border-gray-700 hover:bg-gray-700' 
                                                                : 'border-gray-100 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {search}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={`p-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    No search history yet
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Profile Dropdown */}
                        <div className="relative">
                            <motion.button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center space-x-2 py-2 px-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-200"
                            >
                                {userAvatar ? (
                                    <img src={userAvatar} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                    <UserCircle size={20} />
                                )}
                                <span className="hidden md:inline">Profile</span>
                                <ChevronDown size={16} />
                            </motion.button>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border overflow-hidden ${
                                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                                                    {userAvatar ? (
                                                        <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={20} className="text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        User
                                                    </p>
                                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {userEmail || 'user@example.com'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={onShowProfile}
                                            className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                                                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <UserCircle size={18} />
                                            <span>My Profile</span>
                                        </button>
                                        <button 
                                            onClick={onShowSettings}
                                            className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                                                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <Settings size={18} />
                                            <span>Settings</span>
                                        </button>
                                        <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <button
                                                onClick={onLogout}
                                                className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                                                    darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                                                }`}
                                            >
                                                <LogOut size={18} />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};
const FeatureCard: React.FC<{
    title: string;
    description: string;
    iconName: string;
    onClick: () => void;
}> = ({ title, description, iconName, onClick }) => {
    const icons: Record<string, React.ReactNode> = {
        BarChart2: <BarChart2 size={48} className="text-blue-500" />,
        TrendingUp: <TrendingUp size={48} className="text-green-500" />,
        Users: <Users size={48} className="text-purple-500" />,
        Eye: <Eye size={48} className="text-indigo-500" />,
        Tag: <Tag size={48} className="text-orange-500" />,
        Share2: <Share2 size={48} className="text-pink-500" />,
        Search: <Search size={48} className="text-teal-500" />,
        BarChartBig: <BarChartBig size={48} className="text-cyan-500" />,
    };
    return (
        <motion.div
            className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/50 shadow-lg hover:shadow-2xl cursor-pointer overflow-hidden relative group transition-all duration-300"
            whileHover={{ y: -8, scale: 1.03 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10">
                <motion.div 
                    className="mb-4"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                >
                    {icons[iconName]}
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{description}</p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                    <span className="mr-2">Learn More</span>
                    <ChevronRight size={16} />
                </div>
            </div>
        </motion.div>
    );};
const dashboardFeatures: Feature[] = [
    {
        title: "Video Categories",
        description: "Browse videos by category, topic, and language with intelligent categorization.",
        iconName: "Search",
        id: "videoCategories",
    },
    {
        title: "Video Search",
        description: "Search and analyze YouTube videos with advanced filters and sentiment analysis.",
        iconName: "Search",
        id: "videoSearch",
    },
    {
        title: "Channel Performance",
        description: "Monitor views, engagement, and audience growth with detailed analytics.",
        iconName: "BarChartBig",
        id: "channelPerformance",
    },
    {
        title: "Topic Trends",
        description: "Identify popular content topics and find top-performing videos in your niche.",
        iconName: "TrendingUp",
        id: "topicTrends",
    },
    {
        title: "Video SEO Analysis",
        description: "Get recommendations to optimize your video titles, descriptions, and tags.",
        iconName: "Tag",
        id: "videoSeoAnalysis",
    },
    {
        title: "Competitor Analysis",
        description: "Track the performance of your competitors to identify gaps and opportunities.",
        iconName: "Users",
        id: "competitorAnalysis"
    },
    {
        title: "Thumbnail Testing",
        description: "Test different thumbnails and titles to see which ones attract the most clicks.",
        iconName: "Eye",
        id: "thumbnailTesting",
    },
    {
        title: "Keyword Research",
        description: "Discover high-volume, low-competition keywords to target in your content.",
        iconName: "Search",
        id: "keywordResearch",
    },
    {
        title: "Social Sharing",
        description: "Automatically share your new videos across social media platforms.",
        iconName: "Share2",
        id: "socialSharing"
    },
    {
        title: "Performance Predictor",
        description: "Estimate how many views your new video might get in 30 days.",
        iconName: "TrendingUp",
        id: "performancePredictor",
    }
];
// Forgot Password Component
const ForgotPasswordPage: React.FC<{
    onBack: () => void;
    onSwitchToLogin: () => void;
}> = ({ onBack, onSwitchToLogin }) => {
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (!email) {
            setError('Please enter your email address.');
            setLoading(false);
            return;
        }
        try {
            const response = await authService.forgotPassword(email);
            setSuccess(true);
            toast.success('Password reset link sent to your email!');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }};
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-128px)]"
        >
            <div className="relative p-8 md:p-12 rounded-3xl shadow-2xl bg-white dark:bg-gradient-to-br dark:from-gray-800/70 dark:to-gray-900/70 backdrop-blur-lg border border-gray-200 dark:border-gray-700/50 max-w-lg w-full">
                <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                    Forgot Password
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                    Enter your email and we'll send you a reset link
                </p>                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
                            />
                        </div>
                        {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: loading ? 1 : 1.03 }}
                            whileTap={{ scale: loading ? 1 : 0.97 }}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </motion.button>
                        <button
                            type="button"
                            onClick={onBack}
                            className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold"
                        >
                            Back to Login
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <Mail size={32} className="text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                            Check your email for the password reset link.
                        </p>
                        <button
                            onClick={onSwitchToLogin}
                            className="text-blue-500 hover:text-blue-600 font-semibold"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </motion.div>);};
// Profile Page Component
const ProfilePage: React.FC<{
    userEmail: string;
    userAvatar: string;
    onAvatarChange: (avatar: string) => void;
}> = ({ userEmail, userAvatar, onAvatarChange }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <ProfileSettings userEmail={userEmail} userAvatar={userAvatar} onAvatarChange={onAvatarChange} />
        </motion.div>);};
// Settings Page Component
const SettingsPage: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notifications</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your notification preferences</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Privacy</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Control your privacy settings</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">API Keys</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your API integrations</p>
                    </div>
                </div>
            </div>
        </motion.div>);};
// Feature Page Component Router
const FeaturePage: React.FC<{
    featureId: string;
    userEmail: string;
}> = ({ featureId, userEmail }) => {
    const [categorySearch, setCategorySearch] = React.useState<{category: string; topic: string; language: string} | null>(null);

    const handleCategorySelect = (category: string, topic: string, language: string) => {
        setCategorySearch({ category, topic, language });
    };

    const featureComponents: Record<string, React.ReactNode> = {
        videoCategories: categorySearch ? <VideoSearch initialQuery={`${categorySearch.topic} ${categorySearch.language}`} /> : <VideoCategories onSelectCategory={handleCategorySelect} />,
        videoSearch: <VideoSearch />,
        channelPerformance: <ChannelPerformance />,
        topicTrends: <TopicTrends />,
        videoSeoAnalysis: <VideoSeoAnalysis />,
        competitorAnalysis: <CompetitorAnalysis />,
        thumbnailTesting: <ThumbnailTesting />,
        keywordResearch: <KeywordResearch />,
        socialSharing: <SocialSharing />,
        performancePredictor: <PerformancePredictor />
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {featureComponents[featureId] || <div className="text-center text-gray-900 dark:text-white">Feature not found</div>}
        </motion.div>
    );
};
const App: React.FC = () => {
    const [view, setView] = useState<string>('landing');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
    const [showFeatureInfo, setShowFeatureInfo] = useState<boolean>(false);
    const [userEmail, setUserEmail] = useState<string>('');
    const [userAvatar, setUserAvatar] = useState<string>('');
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    useEffect(() => {
        // Verify authentication on mount
        const verifyAuth = async (): Promise<void> => {
            setAuthLoading(true);
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const result = await authService.verifyToken();
                    if (result.valid && result.user) {
                        setIsLoggedIn(true);
                        setUserEmail(result.user.email);
                        setUserAvatar(result.user.avatar_url || '');
                        setView('dashboard');
                    } else {
                        // Token invalid, clear storage and show login
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setIsLoggedIn(false);
                        setView('landing');
                    }
                } catch (error) {
                    // Error verifying token, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsLoggedIn(false);
                    setView('landing');
                }
            } else {
                setView('landing');
            }
            setAuthLoading(false);
        };
        verifyAuth();
    }, []);
    useEffect(() => {
        const handleHashChange = (): void => {
            const hash = window.location.hash.slice(1);
            if (hash && isLoggedIn) {
                setView(hash);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isLoggedIn]);
    const handleLogin = (email: string): void => {
        setIsLoggedIn(true);
        setUserEmail(email);
        setView('dashboard');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user) {
            setUserAvatar(user.avatar_url || '');
        }
    };
    const handleLogout = async (): Promise<void> => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }    
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUserEmail('');
        setUserAvatar('');
        setView('landing');
        toast.success('Logged out successfully');
    };
    const handleFeatureClick = (featureId: string): void => {
        const feature = dashboardFeatures.find((f: Feature) => f.id === featureId);
        setSelectedFeature(feature || null);
        setShowFeatureInfo(true);
    };
    const handleNavigateToFeature = (featureId: string): void => {
        setShowFeatureInfo(false);
        setView(featureId);
    };
    const handleAvatarChange = (newAvatar: string): void => {
        setUserAvatar(newAvatar);
    };
    // Show loading screen while verifying authentication
    if (authLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div> );}
    return (
        <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
            <Toaster position="top-right" />
            {/* Animated Background Icons - Darker with More Spacing */}
            <motion.div
                className="absolute top-[5%] left-[2%] text-teal-600 dark:text-teal-500 opacity-8 dark:opacity-12 z-0"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 0.08 }}
                transition={{ duration: 2.0, repeat: Infinity, repeatType: "reverse", repeatDelay: 3 }}
            >
                <PlayCircle size={180} strokeWidth={1.2} />
            </motion.div>
            <motion.div
                className="absolute top-[70%] right-[8%] text-purple-600 dark:text-purple-500 opacity-8 dark:opacity-12 z-0"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 360, opacity: 0.08 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <TrendingUp size={140} strokeWidth={1.2} />
            </motion.div>
            <motion.div
                className="absolute bottom-[8%] left-[12%] text-blue-600 dark:text-blue-500 opacity-8 dark:opacity-12 z-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0.08 }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            >
                <BarChart2 size={160} strokeWidth={1.2} />
            </motion.div>
            <motion.div
                className="absolute top-[35%] right-[25%] text-pink-600 dark:text-pink-500 opacity-8 dark:opacity-12 z-0"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 20, opacity: 0.08 }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
            >
                <Users size={120} strokeWidth={1.2} />
            </motion.div>
            <motion.div
                className="absolute bottom-[40%] right-[5%] text-orange-600 dark:text-orange-500 opacity-8 dark:opacity-12 z-0"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: -20, opacity: 0.08 }}
                transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
            >
                <Eye size={130} strokeWidth={1.2} />
            </motion.div>
            <motion.div
                className="absolute top-[15%] right-[40%] text-green-600 dark:text-green-500 opacity-8 dark:opacity-12 z-0"
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 10, opacity: 0.08 }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            >
                <Tag size={100} strokeWidth={1.2} />
            </motion.div>
            <Header
                onBack={() => setView('dashboard')}
                showBackButton={view !== 'landing' && view !== 'dashboard' && view !== 'login' && view !== 'signup' && view !== 'forgot-password'}
                isLoggedIn={isLoggedIn}
                onLogout={handleLogout}
                onShowProfile={() => setView('profile')}
                onShowSettings={() => setView('settings')}
                userEmail={userEmail}
                userAvatar={userAvatar}
            />
            <div className="container mx-auto px-4 py-8 relative z-10">
                <AnimatePresence mode="wait">
                    {!isLoggedIn && view === 'landing' && (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-12 py-8"
                        >
                            {/* Hero Section */}
                            <div className="text-center max-w-5xl mx-auto">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                                        Unlock Your YouTube Potential
                                    </h1>
                                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                                        Transform your channel with powerful analytics, AI-driven insights, and data-backed strategies to grow your audience
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setView('login')}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-full shadow-2xl text-lg"
                                    >
                                        Get Started Free
                                    </motion.button>
                                </motion.div>
                            </div>

                            {/* What is TutorTrace Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="max-w-6xl mx-auto"
                            >
                                <div className="text-center mb-12">
                                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                        What is TutorTrace?
                                    </h2>
                                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                                        TutorTrace is your intelligent YouTube analytics companion that transforms raw data into actionable insights. 
                                        We empower content creators to understand their audience, optimize their content strategy, and accelerate channel growth through data-driven decision making.
                                    </p>
                                </div>

                                {/* Unique Value Proposition Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                    {/* Card 1: For Beginners */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border-2 border-blue-200 dark:border-blue-800"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300/20 dark:bg-blue-600/10 rounded-full -mr-16 -mt-16" />
                                        <div className="relative">
                                            <div className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full mb-4">
                                                For Growing Creators
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                                Start Your Journey Right
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                                Whether you're just starting or have a small following, TutorTrace helps you understand what content resonates with your audience. 
                                                Get clear, actionable recommendations without the complexity of traditional analytics tools.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">Simple, beginner-friendly interface</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">Learn from top-performing channels</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">Discover trending topics in your niche</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Card 2: For Established Creators */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border-2 border-purple-200 dark:border-purple-800"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300/20 dark:bg-purple-600/10 rounded-full -mr-16 -mt-16" />
                                        <div className="relative">
                                            <div className="inline-block px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-full mb-4">
                                                For Established Channels
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                                Scale Your Success
                                            </h3>
                                            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                                Already have an audience? TutorTrace provides deep analytics to help you maintain momentum, identify growth opportunities, 
                                                and stay ahead of competitors with AI-powered predictions and advanced insights.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">Advanced competitor benchmarking</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">AI-powered performance predictions</span>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="text-gray-700 dark:text-gray-300">Historical trend analysis & forecasting</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* How It Works Section */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-3xl p-10 border border-gray-200 dark:border-gray-700 shadow-xl mb-12"
                                >
                                    <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
                                        How TutorTrace Works
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <span className="text-2xl font-bold text-white">1</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Channel</h4>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Simply sign up and connect your YouTube channel to start analyzing your performance
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <span className="text-2xl font-bold text-white">2</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get Instant Insights</h4>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Our AI analyzes your content, competitors, and trends to provide actionable recommendations
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                <span className="text-2xl font-bold text-white">3</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Grow Your Channel</h4>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Implement data-driven strategies and watch your views, subscribers, and engagement soar
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* CTA Section */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl"
                                >
                                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                        Ready to Grow Your Channel?
                                    </h3>
                                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                                        Join thousands of creators who are already using TutorTrace to make smarter decisions and accelerate their growth
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setView('login')}
                                        className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-12 rounded-full shadow-xl text-lg"
                                    >
                                        Start Your Free Trial
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                    {!isLoggedIn && view === 'login' && (
                        <Login 
                            onSuccess={() => {
                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                handleLogin(user.email);
                            }}
                            onSwitchToRegister={() => setView('signup')}
                            onForgotPassword={() => setView('forgot-password')}
                        />
                    )}
                    {!isLoggedIn && view === 'signup' && (
                        <Register 
                            onSuccess={() => {
                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                handleLogin(user.email);
                            }}
                            onSwitchToLogin={() => setView('login')}
                        />
                    )}
                    {!isLoggedIn && view === 'forgot-password' && (
                        <ForgotPasswordPage 
                            onBack={() => setView('login')}
                            onSwitchToLogin={() => setView('login')}
                        />
                    )}
                    {isLoggedIn && view === 'dashboard' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-10">
                                <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                                    Welcome to Your Dashboard
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400">
                                    Explore powerful features to analyze and grow your YouTube channel
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dashboardFeatures.map((feature: Feature) => (
                                    <FeatureCard
                                        key={feature.id}
                                        title={feature.title}
                                        description={feature.description}
                                        iconName={feature.iconName}
                                        onClick={() => handleFeatureClick(feature.id)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {isLoggedIn && view === 'profile' && (
                        <ProfilePage 
                            userEmail={userEmail} 
                            userAvatar={userAvatar}
                            onAvatarChange={handleAvatarChange}
                        />
                    )}
                    {isLoggedIn && view === 'settings' && (
                        <SettingsPage />
                    )}
                    {isLoggedIn && view === 'saved-items' && (
                        <SavedItems userEmail={userEmail} />
                    )}
                    {isLoggedIn && view === 'notifications' && (
                        <NotificationCenter userEmail={userEmail} />
                    )}
                    {isLoggedIn && dashboardFeatures.some((f: Feature) => f.id === view) && (
                        <FeaturePage featureId={view} userEmail={userEmail} />
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {showFeatureInfo && (
                    <FeatureInfoModal
                        feature={selectedFeature}
                        onClose={() => setShowFeatureInfo(false)}
                        onNavigate={handleNavigateToFeature}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
const AppWithErrorBoundary: React.FC = () => { return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>);};
export default AppWithErrorBoundary;
