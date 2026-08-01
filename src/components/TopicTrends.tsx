import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Globe, Filter, Search, Calendar, MapPin, Hash, Users, Sparkles, BarChart3, Award, Download, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const categories = ['All', 'Tech', 'Education', 'Entertainment', 'Gaming', 'Music', 'Sports', 'News', 'Science', 'Business'];
const countries = ['Global', 'United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Japan'];
const languages = ['All', 'English', 'Hindi', 'Spanish', 'Japanese', 'German', 'French'];

const TopicTrends = () => {
    const [activeTab, setActiveTab] = useState('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('All');
    const [country, setCountry] = useState('Global');
    const [language, setLanguage] = useState('All');
    const [dateRange, setDateRange] = useState('7days');
    const [loading, setLoading] = useState(false);
    const [trends, setTrends] = useState<any[]>([]);

    const mockTrends = [
        { id: 1, topic: 'AI Tools 2025', views: 1200000, growth: 42, sentiment: 'Positive', sentimentScore: 85, category: 'Tech', lifecycle: 'Rising', peakDate: '2025-02-15', relatedTags: ['#AI', '#ChatGPT', '#Automation'], topCreators: ['Tech Guru', 'AI Explained'], region: 'Global' },
        { id: 2, topic: 'Python Tutorial', views: 890000, growth: 28, sentiment: 'Positive', sentimentScore: 78, category: 'Education', lifecycle: 'Stable', peakDate: '2025-01-20', relatedTags: ['#Python', '#Programming', '#Coding'], topCreators: ['Code Academy', 'Dev Tips'], region: 'United States' },
        { id: 3, topic: 'Gaming Setup', views: 650000, growth: -12, sentiment: 'Neutral', sentimentScore: 60, category: 'Gaming', lifecycle: 'Declining', peakDate: '2024-12-10', relatedTags: ['#Gaming', '#Setup', '#PCGaming'], topCreators: ['Gaming Pro', 'Setup Master'], region: 'Global' },
        { id: 4, topic: 'Healthy Recipes', views: 540000, growth: 35, sentiment: 'Positive', sentimentScore: 82, category: 'Entertainment', lifecycle: 'Rising', peakDate: '2025-02-01', relatedTags: ['#Healthy', '#Recipes', '#Cooking'], topCreators: ['Chef Life', 'Healthy Eats'], region: 'India' },
        { id: 5, topic: 'Stock Market Tips', views: 720000, growth: 18, sentiment: 'Mixed', sentimentScore: 55, category: 'Business', lifecycle: 'Stable', peakDate: '2025-01-15', relatedTags: ['#Stocks', '#Investing', '#Finance'], topCreators: ['Money Talks', 'Invest Smart'], region: 'United States' },
    ];

    useEffect(() => {
        loadTrends();
    }, [category, country, language, dateRange]);

    const loadTrends = () => {
        setLoading(true);
        setTimeout(() => {
            let filtered = [...mockTrends];
            if (category !== 'All') filtered = filtered.filter(t => t.category === category);
            if (country !== 'Global') filtered = filtered.filter(t => t.region === country || t.region === 'Global');
            setTrends(filtered);
            setLoading(false);
        }, 500);
    };

    const getSentimentColor = (sentiment: string) => {
        if (sentiment === 'Positive') return 'text-green-500 bg-green-100 dark:bg-green-900/30';
        if (sentiment === 'Negative') return 'text-red-500 bg-red-100 dark:bg-red-900/30';
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
    };

    const getLifecycleIcon = (lifecycle: string) => {
        if (lifecycle === 'Rising') return <TrendingUp className="text-green-500" size={20} />;
        if (lifecycle === 'Declining') return <TrendingDown className="text-red-500" size={20} />;
        return <BarChart3 className="text-yellow-500" size={20} />;
    };

    const generateTimelineData = () => {
        return [...Array(30)].map((_, i) => ({
            day: `Day ${i + 1}`,
            popularity: Math.round(50 + Math.random() * 50 + (i > 20 ? -i : i) * 2)
        }));
    };

    const generateRegionalData = () => {
        return [
            { region: 'United States', value: 85 },
            { region: 'India', value: 72 },
            { region: 'United Kingdom', value: 68 },
            { region: 'Canada', value: 55 },
            { region: 'Australia', value: 48 }
        ];
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            Topic Trends Analytics
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time trending topics with AI-powered insights</p>
                    </div>
                    <Button onClick={() => toast.success('Subscribed to trend alerts!')} className="bg-gradient-to-r from-blue-500 to-purple-500">
                        <Bell className="mr-2" size={18} />
                        Subscribe to Alerts
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                            <Filter size={16} className="mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                            <Globe size={16} className="mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                            <MapPin size={16} className="mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="bg-gray-50 dark:bg-gray-800">
                            <Calendar size={16} className="mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24hours">Last 24 Hours</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="90days">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={loadTrends} className="bg-gradient-to-r from-green-500 to-emerald-500">
                        <Search size={18} className="mr-2" />
                        Apply Filters
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        placeholder="Search trending topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-50 dark:bg-gray-800"
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="trending">Trending Now</TabsTrigger>
                    <TabsTrigger value="emerging">Emerging</TabsTrigger>
                    <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                    <TabsTrigger value="regional">Regional</TabsTrigger>
                    <TabsTrigger value="creators">Top Creators</TabsTrigger>
                    <TabsTrigger value="predictions">Predictions</TabsTrigger>
                </TabsList>

                <TabsContent value="trending" className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>
                    ) : (
                        trends.map((trend, idx) => (
                            <motion.div key={trend.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{trend.topic}</h3>
                                                    {getLifecycleIcon(trend.lifecycle)}
                                                    <Badge className={getSentimentColor(trend.sentiment)}>{trend.sentiment}</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {trend.relatedTags.map((tag: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                            <Hash size={12} className="mr-1" />
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${trend.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {trend.growth > 0 ? '+' : ''}{trend.growth}%
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Views</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{(trend.views / 1000000).toFixed(1)}M</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Category</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{trend.category}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lifecycle</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{trend.lifecycle}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peak Date</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{trend.peakDate}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Region</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{trend.region}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-600 dark:text-gray-400">Sentiment Score</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{trend.sentimentScore}%</span>
                                            </div>
                                            <Progress value={trend.sentimentScore} className="h-2" />
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Users className="text-purple-500" size={16} />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Top Creators:</span>
                                                <div className="flex gap-2">
                                                    {trend.topCreators.map((creator: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="text-xs">{creator}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="emerging" className="space-y-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-yellow-500" />
                                Emerging vs. Declining Topics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={generateTimelineData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="popularity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Popularity" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingUp className="text-green-500" />
                                    Rising Topics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {trends.filter(t => t.growth > 0).map((trend, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <span className="font-medium text-gray-900 dark:text-white">{trend.topic}</span>
                                        <Badge className="bg-green-500 text-white">+{trend.growth}%</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                    <TrendingDown className="text-red-500" />
                                    Declining Topics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {trends.filter(t => t.growth < 0).map((trend, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                        <span className="font-medium text-gray-900 dark:text-white">{trend.topic}</span>
                                        <Badge className="bg-red-500 text-white">{trend.growth}%</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="sentiment" className="space-y-6">
                    {trends.map((trend, idx) => (
                        <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-gray-900 dark:text-white">{trend.topic}</CardTitle>
                                    <Badge className={getSentimentColor(trend.sentiment)}>{trend.sentiment}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400">Overall Sentiment</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{trend.sentimentScore}% Positive</span>
                                        </div>
                                        <Progress value={trend.sentimentScore} className="h-3" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{trend.sentimentScore}%</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Positive</p>
                                        </div>
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{100 - trend.sentimentScore - 10}%</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Neutral</p>
                                        </div>
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">10%</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Negative</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="regional" className="space-y-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <Globe className="text-blue-500" />
                                Regional Popularity Heatmap
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={generateRegionalData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="region" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="value" fill="#3b82f6" name="Popularity Score" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="creators" className="space-y-6">
                    {trends.map((trend, idx) => (
                        <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                    <Award className="text-yellow-500" />
                                    {trend.topic} - Top Creators
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {trend.topCreators.map((creator: string, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{creator}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{Math.round(Math.random() * 500 + 100)}K subscribers</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 dark:text-white">{(Math.random() * 2 + 1).toFixed(1)}M views</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{Math.round(Math.random() * 10 + 5)} videos/month</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="predictions" className="space-y-6">
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-purple-500" />
                                AI-Powered Future Trend Predictions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-purple-500">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔮 Next Month's Rising Topics</h4>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li>• <strong>AI Video Editing Tools</strong> - Expected 65% growth</li>
                                    <li>• <strong>Sustainable Living Tips</strong> - Expected 48% growth</li>
                                    <li>• <strong>Remote Work Productivity</strong> - Expected 42% growth</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Content Gap Opportunities</h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    High engagement topics with low content volume: <strong>AI Tools for Students</strong>, <strong>No-Code Development</strong>, <strong>Mental Health for Developers</strong>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-center gap-3">
                <Button onClick={() => toast.success('Report exported!')} className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <Download className="mr-2" size={18} />
                    Export Report (CSV)
                </Button>
                <Button onClick={() => toast.success('Report exported!')} variant="outline">
                    <Download className="mr-2" size={18} />
                    Export Report (PDF)
                </Button>
            </div>
        </div>
    );
};

export default TopicTrends;
