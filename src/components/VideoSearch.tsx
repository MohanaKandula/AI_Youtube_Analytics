import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, TrendingUp, Eye, ThumbsUp, MessageCircle, Bookmark, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ExportManager from './ExportManager';

const VideoSearch = () => {
    const [query, setQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortBy, setSortBy] = useState('relevance');
    const [language, setLanguage] = useState('en');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [showExport, setShowExport] = useState(false);
    const userEmail = localStorage.getItem('userEmail') || '';

    useEffect(() => {
        let interval;
        if (autoRefresh && videos.length > 0) {
            interval = setInterval(() => {
                refreshMetrics();
            }, 30000); // Refresh every 30 seconds
        }
        return () => clearInterval(interval);
    }, [autoRefresh, videos]);

    const searchVideos = async () => {
        if (!query.trim()) {
            toast.error('Please enter a search query');
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                query,
                sort: sortBy,
                language,
                use_cache: 'false'
            });
            if (duration) params.append('duration', duration);
            if (dateFilter) params.append('date', dateFilter);

            const response = await fetch(`http://localhost:5000/api/search_videos?${params}`);
            const data = await response.json();

            if (response.ok) {
                setVideos(data.videos || []);
                setLastUpdate(new Date());
                toast.success(`Found ${data.videos?.length || 0} videos`);
            } else {
                toast.error(data.error || 'Failed to search videos');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const refreshMetrics = async () => {
        if (videos.length === 0) return;

        try {
            const videoIds = videos.map(v => v.videoId);
            const response = await fetch('http://localhost:5000/api/refresh_video_metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_ids: videoIds })
            });
            const data = await response.json();

            if (response.ok && data.videos) {
                setVideos(prevVideos => prevVideos.map(video => {
                    const updated = data.videos.find(v => v.videoId === video.videoId);
                    if (updated) {
                        const hasChanges = 
                            updated.views !== video.views || 
                            updated.likes !== video.likes || 
                            updated.commentsCount !== video.commentsCount;
                        return { ...video, ...updated, isNew: hasChanges };
                    }
                    return video;
                }));
                setLastUpdate(new Date());
                toast.success('Metrics updated');
            }
        } catch (error) {
            console.error('Failed to refresh metrics:', error);
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'Positive': return 'bg-green-500';
            case 'Negative': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const saveVideo = async (video) => {
        try {
            const response = await fetch('http://localhost:5000/api/save_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_email: userEmail,
                    item_type: 'video',
                    item_id: video.videoId,
                    item_title: video.title,
                    item_data: video,
                    tags: [query, video.sentiment],
                    notes: `Found via search: ${query}`
                })
            });

            if (response.ok) {
                toast.success('Video saved!');
            } else {
                toast.error('Failed to save video');
            }
        } catch (error) {
            toast.error('Error saving video');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Real-Time Video Search</h1>
                <p className="text-gray-600 dark:text-gray-400">Search YouTube videos with live metrics and sentiment analysis</p>
            </motion.div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-3">
                        <Input
                            placeholder="Search for videos..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                            className="flex-1"
                        />
                        <Button onClick={searchVideos} disabled={loading}>
                            {loading ? 'Searching...' : <><Search className="mr-2 h-4 w-4" />Search</>}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                                <SelectValue placeholder="Duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="short">Short (&lt;4 min)</SelectItem>
                                <SelectItem value="medium">Medium (4-20 min)</SelectItem>
                                <SelectItem value="long">Long (&gt;20 min)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Upload Date" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last_hour">Last Hour</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="relevance">Relevance</SelectItem>
                                <SelectItem value="views">Views</SelectItem>
                                <SelectItem value="likes">Likes</SelectItem>
                                <SelectItem value="comments">Comments</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger>
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                                <SelectItem value="de">German</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {videos.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex gap-2">
                                <Button variant={autoRefresh ? 'default' : 'outline'} onClick={() => setAutoRefresh(!autoRefresh)}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                                    {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                                </Button>
                                <Button variant="outline" onClick={refreshMetrics}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Refresh Metrics
                                </Button>
                                <Button variant="outline" onClick={() => setShowExport(!showExport)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                            {lastUpdate && (
                                <span className="text-sm text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showExport && videos.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <ExportManager 
                        userEmail={userEmail}
                        data={videos}
                        dataType="video_search"
                        defaultFileName={`video_search_${query}`}
                    />
                </motion.div>
            )}

            <AnimatePresence>
                {videos.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {videos.map((video, index) => (
                            <motion.div
                                key={video.videoId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                layout
                            >
                                <Card className={`hover:shadow-lg transition-shadow ${video.isNew ? 'ring-2 ring-blue-500' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            <div className="relative">
                                                <img 
                                                    src={video.thumbnail} 
                                                    alt={video.title} 
                                                    className="w-48 h-28 object-cover rounded"
                                                />
                                                {video.isNew && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute -top-2 -right-2"
                                                    >
                                                        <Badge className="bg-blue-500">Updated</Badge>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-2">
                                                        {video.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{video.channelTitle}</p>
                                                </div>

                                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                                    {video.description}
                                                </p>

                                                <div className="flex flex-wrap gap-3 text-sm">
                                                    <motion.div 
                                                        className="flex items-center gap-1"
                                                        animate={video.isNew ? { scale: [1, 1.1, 1] } : {}}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <Eye className="h-4 w-4 text-blue-500" />
                                                        <span className="font-semibold">{formatNumber(video.views)}</span>
                                                    </motion.div>
                                                    <motion.div 
                                                        className="flex items-center gap-1"
                                                        animate={video.isNew ? { scale: [1, 1.1, 1] } : {}}
                                                        transition={{ duration: 0.5, delay: 0.1 }}
                                                    >
                                                        <ThumbsUp className="h-4 w-4 text-green-500" />
                                                        <span className="font-semibold">{formatNumber(video.likes)}</span>
                                                    </motion.div>
                                                    <motion.div 
                                                        className="flex items-center gap-1"
                                                        animate={video.isNew ? { scale: [1, 1.1, 1] } : {}}
                                                        transition={{ duration: 0.5, delay: 0.2 }}
                                                    >
                                                        <MessageCircle className="h-4 w-4 text-purple-500" />
                                                        <span className="font-semibold">{formatNumber(video.commentsCount)}</span>
                                                    </motion.div>
                                                </div>

                                                <div className="flex gap-2 flex-wrap">
                                                    <Badge className={getSentimentColor(video.sentiment)}>
                                                        {video.sentiment} ({video.sentimentScore})
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        Score: {video.finalScore}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        Relevance: {video.relevanceScore}
                                                    </Badge>
                                                </div>

                                                <div className="flex gap-2 mt-3">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => saveVideo(video)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Bookmark className="h-3 w-3" />
                                                        Save
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}
                                                    >
                                                        Watch
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {!loading && videos.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Search for videos to see results with real-time metrics</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default VideoSearch;







// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Search, Clock, X, ArrowLeft, Eye, Star, MessageCircle, TrendingUp, Filter, BookOpen, Utensils, Shirt, Gamepad2, Code, Music, Palette, Dumbbell, Globe, Briefcase, Languages, Sparkles, Award } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { toast } from 'sonner';

// const topicCategories = [
//     { 
//         id: 'education', 
//         label: 'Education', 
//         icon: BookOpen, 
//         keywords: 'tutorial learn course lecture study',
//         topics: [
//             'Math Tutorial', 'Physics Explained', 'Chemistry Basics', 'Biology Lessons',
//             'History Documentary', 'Geography Facts', 'English Grammar', 'Study Tips',
//             'Exam Preparation', 'Online Courses', 'Educational Lectures', 'Science Experiments'
//         ]
//     },
//     { 
//         id: 'cooking', 
//         label: 'Cooking', 
//         icon: Utensils, 
//         keywords: 'recipe food cooking baking',
//         topics: [
//             'Easy Recipes', 'Baking Tutorial', 'Healthy Meals', 'Quick Dinner Ideas',
//             'Dessert Recipes', 'Vegan Cooking', 'Meal Prep', 'Cooking Tips',
//             'International Cuisine', 'Breakfast Ideas', 'Cooking Techniques', 'Kitchen Hacks'
//         ]
//     },
//     { 
//         id: 'fashion', 
//         label: 'Fashion', 
//         icon: Shirt, 
//         keywords: 'fashion style outfit clothing',
//         topics: [
//             'Outfit Ideas', 'Fashion Trends', 'Style Guide', 'Wardrobe Essentials',
//             'Fashion Haul', 'Styling Tips', 'Seasonal Fashion', 'Budget Fashion',
//             'Fashion DIY', 'Accessories Guide', 'Fashion History', 'Sustainable Fashion'
//         ]
//     },
//     { 
//         id: 'gaming', 
//         label: 'Gaming', 
//         icon: Gamepad2, 
//         keywords: 'gaming gameplay walkthrough',
//         topics: [
//             'Game Walkthrough', 'Gaming Tips', 'Best Games', 'Game Reviews',
//             'Esports', 'Gaming Setup', 'Game Strategy', 'Speedrun',
//             'Gaming News', 'Game Mods', 'Multiplayer Games', 'Indie Games'
//         ]
//     },
//     { 
//         id: 'programming', 
//         label: 'Programming', 
//         icon: Code, 
//         keywords: 'programming coding development tutorial',
//         topics: [
//             'Python Programming', 'JavaScript Complete', 'Java Full Course', 'C++ Tutorial',
//             'C Programming', 'C# Development', 'React.js', 'Angular Framework',
//             'Vue.js Tutorial', 'Node.js Backend', 'Django Framework', 'Flask Python',
//             'Spring Boot Java', 'ASP.NET Core', 'PHP Development', 'Ruby on Rails',
//             'Go Programming', 'Rust Language', 'Swift iOS', 'Kotlin Android',
//             'Data Structures', 'Algorithms DSA', 'System Design', 'Design Patterns',
//             'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 'Data Science',
//             'SQL Database', 'MongoDB NoSQL', 'PostgreSQL', 'MySQL Tutorial',
//             'Git Version Control', 'Docker Containers', 'Kubernetes', 'AWS Cloud',
//             'Azure Cloud', 'Google Cloud', 'DevOps Tutorial', 'CI/CD Pipeline',
//             'Web Development', 'Frontend Development', 'Backend Development', 'Full Stack',
//             'Mobile Development', 'App Development', 'Game Development', 'Unity 3D',
//             'HTML5 CSS3', 'Bootstrap Framework', 'Tailwind CSS', 'SASS/SCSS',
//             'TypeScript', 'GraphQL API', 'REST API', 'Microservices',
//             'Blockchain', 'Smart Contracts', 'Cybersecurity', 'Ethical Hacking',
//             'Linux Commands', 'Shell Scripting', 'PowerShell', 'Bash Scripting',
//             'Testing Automation', 'Unit Testing', 'Code Review', 'Clean Code',
//             'Competitive Programming', 'Coding Interview', 'LeetCode Solutions', 'HackerRank'
//         ]
//     },
//     { 
//         id: 'music', 
//         label: 'Music', 
//         icon: Music, 
//         keywords: 'music song cover lesson',
//         topics: [
//             'Music Theory', 'Guitar Lessons', 'Piano Tutorial', 'Vocal Training',
//             'Music Production', 'Song Cover', 'Music History', 'Instrument Guide',
//             'Music Composition', 'Beat Making', 'Music Software', 'Live Performance'
//         ]
//     },
//     { 
//         id: 'art', 
//         label: 'Art & Design', 
//         icon: Palette, 
//         keywords: 'art drawing design painting',
//         topics: [
//             'Drawing Tutorial', 'Digital Art', 'Painting Techniques', 'Graphic Design',
//             'UI/UX Design', 'Art History', 'Sketching Tips', 'Color Theory',
//             'Animation Tutorial', '3D Modeling', 'Photography', 'Creative Projects'
//         ]
//     },
//     { 
//         id: 'fitness', 
//         label: 'Fitness', 
//         icon: Dumbbell, 
//         keywords: 'workout fitness exercise yoga',
//         topics: [
//             'Home Workout', 'Yoga for Beginners', 'Weight Training', 'Cardio Exercise',
//             'Fitness Tips', 'Nutrition Guide', 'Muscle Building', 'Fat Loss',
//             'Flexibility Training', 'Meditation', 'Fitness Motivation', 'Exercise Routine'
//         ]
//     },
//     { 
//         id: 'science', 
//         label: 'Science', 
//         icon: Globe, 
//         keywords: 'science physics chemistry biology',
//         topics: [
//             'Science Experiments', 'Space & Astronomy', 'Environmental Science', 'Technology Explained',
//             'Medical Science', 'Quantum Physics', 'Neuroscience', 'Scientific Method',
//             'Climate Change', 'Genetics', 'Evolution', 'Scientific Discoveries'
//         ]
//     },
//     { 
//         id: 'business', 
//         label: 'Business', 
//         icon: Briefcase, 
//         keywords: 'business entrepreneurship marketing finance',
//         topics: [
//             'Business Strategy', 'Marketing Tips', 'Entrepreneurship', 'Financial Planning',
//             'Stock Market', 'Business Ideas', 'Leadership Skills', 'Sales Techniques',
//             'Digital Marketing', 'Startup Guide', 'Investment Tips', 'Business Growth'
//         ]
//     },
// ];

// const languages = [
//     { code: 'en', name: 'English' },
//     { code: 'hi', name: 'Hindi' },
//     { code: 'te', name: 'Telugu' },
//     { code: 'ta', name: 'Tamil' },
// ];

// const SearchBar = ({ onSearch, recentSearches, onDeleteSearch, onClearAll, onCategorySelect, currentLanguage, onLanguageChange }) => {
//     const [searchTerm, setSearchTerm] = useState("");
//     const [selectedCategory, setSelectedCategory] = useState(null);
//     const [showRecent, setShowRecent] = useState(false);
//     const searchRef = useRef(null);

//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (searchRef.current && !searchRef.current.contains(event.target)) {
//                 setShowRecent(false);
//             }
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const handleSearch = () => {
//         const query = searchTerm.trim() || (selectedCategory ? topicCategories.find(c => c.id === selectedCategory)?.keywords : '');
//         if (!query) {
//             toast.error('Please enter a search term or select a category');
//             return;
//         }
//         onSearch(query, currentLanguage);
//         setSearchTerm("");
//         setShowRecent(false);
//     };

//     const handleCategoryClick = (category) => {
//         setSelectedCategory(category.id);
//         onCategorySelect(category);
//     };

//     return (
//         <div ref={searchRef} className="space-y-6">
//             <div className="relative">
//                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50"></div>
//                 <div className="relative bg-white dark:bg-gradient-to-r dark:from-gray-800/80 dark:via-gray-900/80 dark:to-black/80 backdrop-blur-lg border border-gray-300 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl">
//                     <div className="flex items-center gap-3 mb-4">
//                         <Search className="text-gray-400" size={24} />
//                         <Input
//                             type="text"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                             onKeyDown={(e) => e.key === "Enter" && handleSearch()}
//                             onFocus={() => setShowRecent(true)}
//                             placeholder="Search for videos, topics, or courses..."
//                             className="flex-1 text-lg bg-transparent border-none focus-visible:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
//                         />
//                         <Select value={currentLanguage} onValueChange={onLanguageChange}>
//                             <SelectTrigger className="w-40 bg-gray-100 dark:bg-gray-800">
//                                 <Languages size={16} className="mr-2" />
//                                 <SelectValue />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {languages.map(lang => (
//                                     <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
//                                 ))}
//                             </SelectContent>
//                         </Select>
//                         <Button onClick={handleSearch} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
//                             Search
//                         </Button>
//                     </div>

//                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
//                         {topicCategories.map((category) => {
//                             const Icon = category.icon;
//                             return (
//                                 <motion.button
//                                     key={category.id}
//                                     onClick={() => handleCategoryClick(category)}
//                                     whileHover={{ scale: 1.05 }}
//                                     whileTap={{ scale: 0.95 }}
//                                     className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
//                                         selectedCategory === category.id
//                                             ? 'bg-blue-500 text-white'
//                                             : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
//                                     }`}
//                                 >
//                                     <Icon size={24} />
//                                     <span className="text-xs font-medium text-center">{category.label}</span>
//                                 </motion.button>
//                             );
//                         })}
//                     </div>
//                 </div>
//             </div>

//             <AnimatePresence>
//                 {showRecent && recentSearches?.length > 0 && (
//                     <motion.div
//                         initial={{ opacity: 0, y: -10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: -10 }}
//                         className="bg-white dark:bg-gray-900/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4"
//                     >
//                         <div className="flex justify-between items-center mb-3">
//                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Searches</span>
//                             <button onClick={onClearAll} className="text-xs text-red-500 hover:text-red-400">Clear All</button>
//                         </div>
//                         <div className="space-y-2">
//                             {recentSearches.map((term, idx) => (
//                                 <div key={idx} className="flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/70 rounded-lg">
//                                     <button onClick={() => { setSearchTerm(term); onSearch(term, currentLanguage); setShowRecent(false); }} className="flex items-center gap-2 flex-1 text-left">
//                                         <Clock size={14} className="text-gray-400" />
//                                         <span className="truncate">{term}</span>
//                                     </button>
//                                     <button onClick={() => onDeleteSearch(term)} className="text-gray-400 hover:text-red-500 p-1">
//                                         <X size={16} />
//                                     </button>
//                                 </div>
//                             ))}
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </div>
//     );
// };

// const TopicSelector = ({ category, onTopicSelect, onBack }) => {
//     return (
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
//             <div className="flex items-center gap-3 mb-6">
//                 <Button onClick={onBack} variant="ghost" size="icon">
//                     <ArrowLeft size={24} />
//                 </Button>
//                 <div>
//                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select a {category.label} Topic</h2>
//                     <p className="text-sm text-gray-600 dark:text-gray-400">Choose a specific topic to find the best videos</p>
//                 </div>
//             </div>

//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//                 {category.topics.map((topic, idx) => (
//                     <motion.button
//                         key={idx}
//                         initial={{ opacity: 0, scale: 0.9 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         transition={{ delay: idx * 0.03 }}
//                         onClick={() => onTopicSelect(topic)}
//                         className="group relative p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-lg"
//                     >
//                         <Sparkles className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" size={16} />
//                         <p className="font-semibold text-gray-900 dark:text-white text-center">{topic}</p>
//                     </motion.button>
//                 ))}
//             </div>
//         </motion.div>
//     );
// };

// const SearchResults = ({ videos = [], onBack, searchTerm, filters, onFilterChange, currentLanguage, onLanguageChange }) => {
//     return (
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//                 <div className="flex items-center gap-3">
//                     <Button onClick={onBack} variant="ghost" size="icon">
//                         <ArrowLeft size={24} />
//                     </Button>
//                     <div>
//                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Results</h2>
//                         <p className="text-sm text-gray-600 dark:text-gray-400">Found {videos.length} videos for "{searchTerm}"</p>
//                     </div>
//                 </div>

//                 <div className="flex flex-wrap gap-2">
//                     <Select value={currentLanguage} onValueChange={onLanguageChange}>
//                         <SelectTrigger className="w-32 bg-gray-100 dark:bg-gray-800">
//                             <Languages size={16} className="mr-2" />
//                             <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                             {languages.map(lang => (
//                                 <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
//                             ))}
//                         </SelectContent>
//                     </Select>

//                     <Select value={filters.duration} onValueChange={(val) => onFilterChange('duration', val)}>
//                         <SelectTrigger className="w-32 bg-gray-100 dark:bg-gray-800">
//                             <SelectValue placeholder="Duration" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="any">Any Duration</SelectItem>
//                             <SelectItem value="short">Short (&lt;4 min)</SelectItem>
//                             <SelectItem value="medium">Medium (4-20 min)</SelectItem>
//                             <SelectItem value="long">Long (&gt;20 min)</SelectItem>
//                         </SelectContent>
//                     </Select>

//                     <Select value={filters.date} onValueChange={(val) => onFilterChange('date', val)}>
//                         <SelectTrigger className="w-32 bg-gray-100 dark:bg-gray-800">
//                             <SelectValue placeholder="Upload Date" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="any">Any Time</SelectItem>
//                             <SelectItem value="last_hour">Last Hour</SelectItem>
//                             <SelectItem value="today">Today</SelectItem>
//                             <SelectItem value="this_week">This Week</SelectItem>
//                             <SelectItem value="this_month">This Month</SelectItem>
//                             <SelectItem value="this_year">This Year</SelectItem>
//                         </SelectContent>
//                     </Select>

//                     <Select value={filters.sort} onValueChange={(val) => onFilterChange('sort', val)}>
//                         <SelectTrigger className="w-32 bg-gray-100 dark:bg-gray-800">
//                             <SelectValue placeholder="Sort By" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="relevance">Relevance</SelectItem>
//                             <SelectItem value="views">Most Viewed</SelectItem>
//                             <SelectItem value="likes">Most Liked</SelectItem>
//                             <SelectItem value="comments">Most Commented</SelectItem>
//                         </SelectContent>
//                     </Select>

//                     <Select value={filters.limit.toString()} onValueChange={(val) => onFilterChange('limit', parseInt(val))}>
//                         <SelectTrigger className="w-24 bg-gray-100 dark:bg-gray-800">
//                             <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="10">10 videos</SelectItem>
//                             <SelectItem value="20">20 videos</SelectItem>
//                             <SelectItem value="30">30 videos</SelectItem>
//                             <SelectItem value="50">50 videos</SelectItem>
//                         </SelectContent>
//                     </Select>
//                 </div>
//             </div>

//             {videos?.length > 0 ? (
//                 <div className="space-y-4">
//                     {videos.map((video, idx) => (
//                         <motion.div
//                             key={video.videoId}
//                             initial={{ opacity: 0, x: -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ delay: idx * 0.05 }}
//                             onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, "_blank")}
//                             className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all flex gap-4 p-4"
//                         >
//                             <div className="flex items-center justify-center min-w-16">
//                                 <div className="relative">
//                                     <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
//                                         idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
//                                         idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
//                                         idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
//                                         'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-600 dark:text-blue-400'
//                                     }`}>
//                                         {idx === 0 ? <Award size={24} /> : idx + 1}
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="relative aspect-video w-64 flex-shrink-0 overflow-hidden rounded-lg">
//                                 <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
//                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
//                             </div>

//                             <div className="flex-1 min-w-0">
//                                 <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 text-lg">{video.title}</h3>
//                                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{video.channelTitle}</p>
//                                 <div className="flex flex-wrap items-center gap-4 text-sm">
//                                     <Badge className="bg-black/70 text-white">
//                                         <Eye size={12} className="mr-1" />
//                                         {(video.views || 0).toLocaleString()} views
//                                     </Badge>
//                                     <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
//                                         <Star size={14} className="text-yellow-500" />
//                                         {(video.likes || 0).toLocaleString()}
//                                     </span>
//                                     <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
//                                         <MessageCircle size={14} className="text-blue-500" />
//                                         {(video.commentsCount || 0).toLocaleString()}
//                                     </span>
//                                     {video.sentiment && (
//                                         <Badge variant={video.sentiment === 'Positive' ? 'default' : video.sentiment === 'Negative' ? 'destructive' : 'secondary'} className="text-xs">
//                                             {video.sentiment}
//                                         </Badge>
//                                     )}
//                                     {video.customScore && (
//                                         <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
//                                             <TrendingUp size={12} />
//                                             {Math.round(video.customScore / 100)}% Quality
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </motion.div>
//                     ))}
//                 </div>
//             ) : (
//                 <div className="text-center py-16">
//                     <div className="inline-block p-6 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-4">
//                         <Search size={48} className="text-gray-400" />
//                     </div>
//                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
//                     <p className="text-gray-600 dark:text-gray-400">Try different keywords or adjust your filters</p>
//                 </div>
//             )}
//         </motion.div>
//     );
// };

// const VideoSearch = () => {
//     const [view, setView] = useState('search');
//     const [videos, setVideos] = useState([]);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [selectedCategory, setSelectedCategory] = useState(null);
//     const [recentSearches, setRecentSearches] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [language, setLanguage] = useState('en');
//     const [filters, setFilters] = useState({
//         duration: 'any',
//         date: 'any',
//         sort: 'relevance',
//         limit: 20
//     });

//     useEffect(() => {
//         const saved = JSON.parse(localStorage.getItem('videoSearchHistory') || '[]');
//         setRecentSearches(saved);
//     }, []);

//     const handleSearch = async (query, searchLanguage = language) => {
//         setLoading(true);
//         setSearchTerm(query);
        
//         try {
//             const params = new URLSearchParams({ 
//                 query, 
//                 limit: filters.limit.toString(), 
//                 sort: filters.sort,
//                 language: searchLanguage
//             });
//             if (filters.duration !== 'any') params.append('duration', filters.duration);
//             if (filters.date !== 'any') params.append('date', filters.date);

//             const response = await fetch(`http://127.0.0.1:5000/api/search_videos?${params}`);
//             const data = await response.json();
            
//             if (response.ok) {
//                 setVideos(data.videos || []);
//                 setView('results');
                
//                 const searches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
//                 setRecentSearches(searches);
//                 localStorage.setItem('videoSearchHistory', JSON.stringify(searches));
                
//                 const mainHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
//                 mainHistory.unshift(`Video Search: ${query}`);
//                 localStorage.setItem('searchHistory', JSON.stringify(mainHistory.slice(0, 10)));
                
//                 toast.success(`Found ${data.videos?.length || 0} videos!`);
//             } else {
//                 toast.error(data.error || 'Search failed');
//             }
//         } catch (error) {
//             toast.error('Failed to connect to server');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleLanguageChange = (newLanguage) => {
//         setLanguage(newLanguage);
//         if (view === 'results' && searchTerm) {
//             handleSearch(searchTerm, newLanguage);
//         }
//     };

//     const handleCategorySelect = (category) => {
//         setSelectedCategory(category);
//         setView('topics');
//     };

//     const handleTopicSelect = (topic) => {
//         handleSearch(topic, language);
//     };

//     const handleFilterChange = (key, value) => {
//         const newFilters = { ...filters, [key]: value };
//         setFilters(newFilters);
//         if (view === 'results') {
//             handleSearch(searchTerm, language);
//         }
//     };

//     const handleDeleteSearch = (term) => {
//         const updated = recentSearches.filter(s => s !== term);
//         setRecentSearches(updated);
//         localStorage.setItem('videoSearchHistory', JSON.stringify(updated));
//     };

//     const handleClearAll = () => {
//         setRecentSearches([]);
//         localStorage.setItem('videoSearchHistory', JSON.stringify([]));
//         toast.success('Search history cleared');
//     };

//     return (
//         <div className="max-w-7xl mx-auto">
//             {loading && (
//                 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
//                     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
//                         <div className="flex items-center gap-3">
//                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//                             <span className="text-gray-900 dark:text-white font-medium">Searching videos...</span>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {view === 'search' && (
//                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
//                     <div className="text-center mb-8">
//                         <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
//                             Discover Educational Videos
//                         </h1>
//                         <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
//                             Search millions of educational videos with advanced filters, sentiment analysis, and quality scoring
//                         </p>
//                     </div>
//                     <SearchBar
//                         onSearch={handleSearch}
//                         recentSearches={recentSearches}
//                         onDeleteSearch={handleDeleteSearch}
//                         onClearAll={handleClearAll}
//                         onCategorySelect={handleCategorySelect}
//                         currentLanguage={language}
//                         onLanguageChange={handleLanguageChange}
//                     />
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
//                         <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
//                             <Filter className="text-blue-500 mb-3" size={32} />
//                             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Advanced Filters</h3>
//                             <p className="text-sm text-gray-700 dark:text-gray-300">Filter by duration, upload date, language, and sort by relevance or engagement</p>
//                         </div>
//                         <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
//                             <MessageCircle className="text-purple-500 mb-3" size={32} />
//                             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sentiment Analysis</h3>
//                             <p className="text-sm text-gray-700 dark:text-gray-300">See audience reactions with positive, negative, or neutral sentiment scores</p>
//                         </div>
//                         <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
//                             <TrendingUp className="text-green-500 mb-3" size={32} />
//                             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quality Scoring</h3>
//                             <p className="text-sm text-gray-700 dark:text-gray-300">Videos ranked by engagement, relevance, and overall quality metrics</p>
//                         </div>
//                     </div>
//                 </motion.div>
//             )}

//             {view === 'topics' && selectedCategory && (
//                 <TopicSelector
//                     category={selectedCategory}
//                     onTopicSelect={handleTopicSelect}
//                     onBack={() => setView('search')}
//                 />
//             )}

//             {view === 'results' && (
//                 <SearchResults
//                     videos={videos}
//                     onBack={() => setView('search')}
//                     searchTerm={searchTerm}
//                     filters={filters}
//                     onFilterChange={handleFilterChange}
//                     currentLanguage={language}
//                     onLanguageChange={handleLanguageChange}
//                 />
//             )}
//         </div>
//     );
// };

// export default VideoSearch;
