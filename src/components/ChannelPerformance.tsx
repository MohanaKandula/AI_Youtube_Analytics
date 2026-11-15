import React, { useState } from 'react';
import { Search, TrendingUp, Users, Eye, DollarSign, Calendar, BarChart3, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api';

const ChannelPerformance = () => {
    const [channelQuery, setChannelQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [channelData, setChannelData] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [topVideos, setTopVideos] = useState([]);
    const [trendPeriod, setTrendPeriod] = useState(30);
    const [videoSortBy, setVideoSortBy] = useState('recent');

    const searchChannel = async () => {
        if (!channelQuery.trim()) {
            toast.error('Please enter a channel name');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/channel_performance?channel=${encodeURIComponent(channelQuery)}`);
            const data = await response.json();

            if (response.ok) {
                setChannelData(data);
                toast.success('Channel data loaded successfully');
                
                // Fetch trend data
                fetchTrendData(data.channelId, trendPeriod);
                
                // Fetch top videos
                fetchTopVideos(data.channelId, videoSortBy);
            } else {
                toast.error(data.error || 'Failed to fetch channel data');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendData = async (channelId, period) => {
        try {
            const response = await fetch(`${API_BASE}/channel_trends?channel_id=${channelId}&period=${period}`);
            const data = await response.json();

            if (response.ok && data.trends) {
                const formattedTrends = data.trends.map(trend => ({
                    date: new Date(trend.date).toLocaleDateString(),
                    subscribers: trend.subscribers,
                    views: trend.views
                }));
                setTrendData(formattedTrends);
            }
        } catch (error) {
            console.error('Failed to fetch trend data:', error);
        }
    };

    const fetchTopVideos = async (channelId, sortBy) => {
        try {
            const response = await fetch(`${API_BASE}/top_videos?channel_id=${channelId}&sort_by=${sortBy}&max_results=20`);
            const data = await response.json();

            if (response.ok) {
                setTopVideos(data.videos || []);
            }
        } catch (error) {
            console.error('Failed to fetch top videos:', error);
        }
    };

    const handlePeriodChange = (period) => {
        setTrendPeriod(period);
        if (channelData) {
            fetchTrendData(channelData.channelId, period);
        }
    };

    const handleVideoSortChange = (sortBy) => {
        setVideoSortBy(sortBy);
        if (channelData) {
            fetchTopVideos(channelData.channelId, sortBy);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Channel Performance Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400">Get detailed insights and real-time trends for any YouTube channel</p>
            </motion.div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <Input
                            placeholder="Enter channel name or ID..."
                            value={channelQuery}
                            onChange={(e) => setChannelQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchChannel()}
                            className="flex-1"
                        />
                        <Button onClick={searchChannel} disabled={loading}>
                            {loading ? 'Searching...' : <><Search className="mr-2 h-4 w-4" />Search</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {channelData && (
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="videos">Top Videos</TabsTrigger>
                        <TabsTrigger value="monetization">Monetization</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <img src={channelData.thumbnail} alt={channelData.channelName} className="w-20 h-20 rounded-full" />
                                    <div>
                                        <CardTitle className="text-2xl">{channelData.channelName}</CardTitle>
                                        <CardDescription>{channelData.description?.substring(0, 150)}...</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Subscribers</p>
                                            <p className="text-2xl font-bold">{formatNumber(channelData.subscriberCount)}</p>
                                        </div>
                                        <Users className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                                            <p className="text-2xl font-bold">{formatNumber(channelData.viewCount)}</p>
                                        </div>
                                        <Eye className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Videos</p>
                                            <p className="text-2xl font-bold">{channelData.videoCount}</p>
                                        </div>
                                        <Video className="h-8 w-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Channel Age</p>
                                            <p className="text-2xl font-bold">{channelData.channelAge}</p>
                                        </div>
                                        <Calendar className="h-8 w-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Avg Views/Video</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-blue-600">{formatNumber(channelData.avgViewsPerVideo)}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Views/Day</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold text-green-600">{formatNumber(channelData.viewsPerDay)}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="trends" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Growth Trends</CardTitle>
                                    <div className="flex gap-2">
                                        <Button variant={trendPeriod === 30 ? 'default' : 'outline'} size="sm" onClick={() => handlePeriodChange(30)}>30 Days</Button>
                                        <Button variant={trendPeriod === 90 ? 'default' : 'outline'} size="sm" onClick={() => handlePeriodChange(90)}>90 Days</Button>
                                        <Button variant={trendPeriod === 365 ? 'default' : 'outline'} size="sm" onClick={() => handlePeriodChange(365)}>1 Year</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={trendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="subscribers" stroke="#3b82f6" name="Subscribers" strokeWidth={2} />
                                            <Line yAxisId="right" type="monotone" dataKey="views" stroke="#10b981" name="Total Views" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center">
                                        <p className="text-gray-500">No historical data available yet. Data will be collected over time.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="videos" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Top Videos</CardTitle>
                                    <div className="flex gap-2">
                                        <Button variant={videoSortBy === 'recent' ? 'default' : 'outline'} size="sm" onClick={() => handleVideoSortChange('recent')}>Most Recent</Button>
                                        <Button variant={videoSortBy === 'engagement' ? 'default' : 'outline'} size="sm" onClick={() => handleVideoSortChange('engagement')}>Highest Engagement</Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(topVideos.length > 0 ? topVideos : channelData.recentVideos).map((video) => (
                                        <div key={video.videoId} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                            <img src={video.thumbnail} alt={video.title} className="w-32 h-20 object-cover rounded" />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{video.title}</h4>
                                                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <span>{formatNumber(video.views)} views</span>
                                                    <span>{formatNumber(video.likes)} likes</span>
                                                    <span>{formatNumber(video.comments)} comments</span>
                                                    <Badge variant="secondary">{video.engagementRate}% engagement</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="monetization" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-6 w-6 text-green-500" />
                                    Estimated Earning Potential
                                </CardTitle>
                                <CardDescription>
                                    Based on industry averages. Actual earnings may vary significantly.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Estimated Monthly Revenue</p>
                                        <p className="text-4xl font-bold text-green-600">${channelData.estimatedMonthlyRevenue.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 mt-2">Based on ${channelData.estimatedCPM} CPM</p>
                                    </div>

                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Daily Views</p>
                                        <p className="text-4xl font-bold text-blue-600">{formatNumber(channelData.viewsPerDay)}</p>
                                        <p className="text-xs text-gray-500 mt-2">Average views per day</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        <strong>Disclaimer:</strong> This is an estimated earning potential based on average CPM rates. 
                                        Actual YouTube earnings depend on many factors including content type, audience location, 
                                        ad engagement, and monetization eligibility.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default ChannelPerformance;
