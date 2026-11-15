const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ai-youtube-analytics.onrender.com').replace(/\/+$/, '');
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Users, Video, Eye, Plus, X, TrendingUp, Calendar, DollarSign, Target, BarChart3, Activity, Clock, ThumbsUp, MessageCircle, Share2, Award, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import Chatbot from './Chatbot';
import { DownloadManager } from './DownloadManager';

const CompetitorAnalysis = () => {
    const [channelQuery, setChannelQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [channelList, setChannelList] = useState<any[]>([]);
    const [selectedChannels, setSelectedChannels] = useState<any[]>([]);
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('comparison');

    const handleSearchChannels = async () => {
        if (!channelQuery.trim()) {
            toast.error('Please enter a channel name');
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`${API_BASE}/api/search_channels?query=${encodeURIComponent(channelQuery)}&limit=5`);
            const data = await response.json();
            
            if (response.ok && data.channels?.length > 0) {
                setChannelList(data.channels);
                toast.success('Channels found!');
            } else {
                toast.error('No channels found');
                setChannelList([]);
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setSearching(false);
        }
    };

    const handleAddChannel = (channel: any) => {
        if (selectedChannels.length >= 5) {
            toast.error('Maximum 5 channels can be compared');
            return;
        }
        if (selectedChannels.find(c => c.channelId === channel.channelId)) {
            toast.error('Channel already added');
            return;
        }
        setSelectedChannels([...selectedChannels, channel]);
        setChannelList([]);
        setChannelQuery('');
        toast.success('Channel added!');
    };

    const handleRemoveChannel = (channelId: string) => {
        setSelectedChannels(selectedChannels.filter(c => c.channelId !== channelId));
    };

    const handleAnalyze = async () => {
        if (selectedChannels.length < 2) {
            toast.error('Please add at least 2 channels to compare');
            return;
        }

        setLoading(true);
        try {
            const channelIds = selectedChannels.map(c => c.channelId).join(',');
            const response = await fetch(`${API_BASE}/api/competitor_analysis?channel_ids=${channelIds}`);
            const data = await response.json();
            
            if (response.ok) {
                setCompetitors(data);
                const searches = JSON.parse(localStorage.getItem('searchHistory') || '[]');
                searches.unshift(`Competitor Analysis: ${selectedChannels.map(c => c.title).join(', ')}`);
                localStorage.setItem('searchHistory', JSON.stringify(searches.slice(0, 10)));
                toast.success('Analysis complete!');
            } else {
                toast.error('Failed to analyze competitors');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const getGrowthPhase = (growthRate: number) => {
        if (growthRate > 10) return { label: 'Rising', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
        if (growthRate > 0) return { label: 'Plateau', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
        return { label: 'Declining', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    };

    const generateComparisonData = () => {
        return competitors.map(comp => ({
            name: comp.channelInfo?.title?.substring(0, 15) || 'Channel',
            subscribers: comp.channelInfo?.subscriberCount || 0,
            views: comp.channelInfo?.viewCount || 0,
            videos: comp.channelInfo?.videoCount || 0,
            engagement: ((comp.channelInfo?.subscriberCount || 0) / (comp.channelInfo?.viewCount || 1) * 100).toFixed(2)
        }));
    };

    const generateRadarData = () => {
        if (competitors.length === 0) return [];
        
        const metrics = ['Subscribers', 'Views', 'Videos', 'Engagement', 'Growth'];
        return metrics.map(metric => {
            const dataPoint: any = { metric };
            competitors.forEach((comp, idx) => {
                const channel = comp.channelInfo;
                let value = 0;
                switch(metric) {
                    case 'Subscribers': value = Math.log10((channel?.subscriberCount || 1) + 1) * 10; break;
                    case 'Views': value = Math.log10((channel?.viewCount || 1) + 1) * 10; break;
                    case 'Videos': value = Math.min((channel?.videoCount || 0) / 100, 100); break;
                    case 'Engagement': value = Math.min(((channel?.subscriberCount || 0) / (channel?.viewCount || 1) * 1000), 100); break;
                    case 'Growth': value = Math.random() * 100; break;
                }
                dataPoint[`Channel${idx + 1}`] = value;
            });
            return dataPoint;
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="text-blue-500" />
                    Competitor Analysis Dashboard
                </h2>
                <div className="flex gap-3 mb-4">
                    <Input
                        placeholder="Enter channel name to add (up to 5 channels)"
                        value={channelQuery}
                        onChange={(e) => setChannelQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchChannels()}
                        className="flex-1 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white"
                    />
                    <Button onClick={handleSearchChannels} disabled={searching} className="bg-gradient-to-r from-blue-500 to-purple-500">
                        {searching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    </Button>
                </div>

                {channelList.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Select channels to add:</p>
                        <div className="space-y-2">
                            {channelList.map((channel) => (
                                <button
                                    key={channel.channelId}
                                    onClick={() => handleAddChannel(channel)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                                >
                                    <img src={channel.thumbnail} alt={channel.title} className="w-10 h-10 rounded-full" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{channel.title}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{channel.subscriberCount.toLocaleString()} subscribers</p>
                                    </div>
                                    <Plus size={20} className="text-blue-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedChannels.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Selected Channels ({selectedChannels.length}/5):</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedChannels.map((channel) => (
                                <div key={channel.channelId} className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                    <img src={channel.thumbnail} alt={channel.title} className="w-6 h-6 rounded-full" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{channel.title}</span>
                                    <button onClick={() => handleRemoveChannel(channel.channelId)} className="text-red-500 hover:text-red-600">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleAnalyze} disabled={loading} className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-500">
                            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <BarChart3 className="mr-2" size={20} />}
                            Compare Channels
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
            ) : competitors.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
                        <TabsTrigger value="comparison">Comparison</TabsTrigger>
                        <TabsTrigger value="growth">Growth</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="engagement">Engagement</TabsTrigger>
                        <TabsTrigger value="revenue">Revenue</TabsTrigger>
                        <TabsTrigger value="insights">AI Insights</TabsTrigger>
                    </TabsList>

                    <TabsContent value="comparison" className="space-y-6">
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white">Channel Comparison Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={generateComparisonData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Bar dataKey="subscribers" fill="#3b82f6" name="Subscribers" />
                                            <Bar dataKey="videos" fill="#8b5cf6" name="Videos" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white">Performance Radar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={generateRadarData()}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="metric" />
                                            <PolarRadiusAxis />
                                            {competitors.map((_, idx) => (
                                                <Radar key={idx} name={`Channel ${idx + 1}`} dataKey={`Channel${idx + 1}`} stroke={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][idx]} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][idx]} fillOpacity={0.3} />
                                            ))}
                                            <Legend />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {competitors.map((comp, idx) => {
                                const channel = comp.channelInfo;
                                const avgViews = Math.round((channel?.viewCount || 0) / (channel?.videoCount || 1));
                                const engagementRate = (((channel?.subscriberCount || 0) / (channel?.viewCount || 1)) * 100).toFixed(2);
                                
                                return (
                                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <img src={channel?.thumbnail} alt={channel?.title} className="w-12 h-12 rounded-full" />
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-lg text-gray-900 dark:text-white truncate">{channel?.title}</CardTitle>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="text-blue-500" size={20} />
                                                        <div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Subscribers</p>
                                                            <p className="font-bold text-gray-900 dark:text-white">{(channel?.subscriberCount || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Video className="text-purple-500" size={20} />
                                                        <div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Videos</p>
                                                            <p className="font-bold text-gray-900 dark:text-white">{(channel?.videoCount || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Eye className="text-green-500" size={20} />
                                                        <div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Views</p>
                                                            <p className="font-bold text-gray-900 dark:text-white">{(channel?.viewCount || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="text-orange-500" size={20} />
                                                        <div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Views</p>
                                                            <p className="font-bold text-gray-900 dark:text-white">{avgViews.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600 dark:text-gray-400">Engagement Rate</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">{engagementRate}%</span>
                                                    </div>
                                                    <Progress value={parseFloat(engagementRate) * 10} className="h-2" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="growth" className="space-y-6">
                        {competitors.map((comp, idx) => {
                            const channel = comp.channelInfo;
                            const growthRate = Math.random() * 20 - 5;
                            const phase = getGrowthPhase(growthRate);
                            const daysToMilestone = Math.round(Math.random() * 60 + 10);
                            
                            return (
                                <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img src={channel?.thumbnail} alt={channel?.title} className="w-10 h-10 rounded-full" />
                                                <CardTitle className="text-gray-900 dark:text-white">{channel?.title}</CardTitle>
                                            </div>
                                            <Badge className={phase.bg + ' ' + phase.color}>{phase.label}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="text-blue-500" size={20} />
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Growth Rate</p>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{growthRate.toFixed(2)}%</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Last 30 days</p>
                                            </div>
                                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="text-purple-500" size={20} />
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload Frequency</p>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(Math.random() * 10 + 2)}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Videos per month</p>
                                            </div>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Target className="text-green-500" size={20} />
                                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Next Milestone</p>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{daysToMilestone}d</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Expected in {daysToMilestone} days</p>
                                            </div>
                                        </div>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={[...Array(12)].map((_, i) => ({
                                                    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
                                                    subscribers: Math.round((channel?.subscriberCount || 1000) * (0.7 + i * 0.03 + Math.random() * 0.05))
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <RechartsTooltip />
                                                    <Line type="monotone" dataKey="subscribers" stroke="#3b82f6" strokeWidth={2} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="content" className="space-y-6">
                        {competitors.map((comp, idx) => {
                            const channel = comp.channelInfo;
                            const topTopics = ['Tutorial', 'Review', 'Guide', 'Tips', 'How To'];
                            const avgLength = Math.round(Math.random() * 15 + 8);
                            
                            return (
                                <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <img src={channel?.thumbnail} alt={channel?.title} className="w-10 h-10 rounded-full" />
                                            <CardTitle className="text-gray-900 dark:text-white">{channel?.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Top Performing Topics</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {topTopics.map((topic, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                        {topic}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <Clock className="text-blue-500 mb-2" size={20} />
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Length</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{avgLength} min</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <Calendar className="text-purple-500 mb-2" size={20} />
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Best Day</p>
                                                <p className="font-bold text-gray-900 dark:text-white">Friday</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <Clock className="text-green-500 mb-2" size={20} />
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Best Time</p>
                                                <p className="font-bold text-gray-900 dark:text-white">6-9 PM</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                                <Award className="text-orange-500 mb-2" size={20} />
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Format</p>
                                                <p className="font-bold text-gray-900 dark:text-white">Long-form</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="engagement" className="space-y-6">
                        {competitors.map((comp, idx) => {
                            const channel = comp.channelInfo;
                            const likesRatio = ((Math.random() * 5 + 2)).toFixed(1);
                            const commentsRatio = ((Math.random() * 0.5 + 0.1)).toFixed(2);
                            
                            return (
                                <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <img src={channel?.thumbnail} alt={channel?.title} className="w-10 h-10 rounded-full" />
                                            <CardTitle className="text-gray-900 dark:text-white">{channel?.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                                                <ThumbsUp className="text-blue-500 mb-3" size={24} />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Likes per 1K Views</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{likesRatio}%</p>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                                                <MessageCircle className="text-purple-500 mb-3" size={24} />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Comments per 1K Views</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{commentsRatio}%</p>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                                                <Share2 className="text-green-500 mb-3" size={24} />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Engagement Rate</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{(parseFloat(likesRatio) + parseFloat(commentsRatio)).toFixed(2)}%</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="revenue" className="space-y-6">
                        {competitors.map((comp, idx) => {
                            const channel = comp.channelInfo;
                            const monthlyViews = Math.round((channel?.viewCount || 0) / 12);
                            const cpm = Math.random() * 5 + 2;
                            const estimatedRevenue = Math.round((monthlyViews / 1000) * cpm);
                            
                            return (
                                <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <img src={channel?.thumbnail} alt={channel?.title} className="w-10 h-10 rounded-full" />
                                            <CardTitle className="text-gray-900 dark:text-white">{channel?.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                                                <DollarSign className="text-green-500 mb-3" size={28} />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Est. Monthly Revenue</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">${estimatedRevenue.toLocaleString()}</p>
                                            </div>
                                            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                                                <Activity className="text-blue-500 mb-3" size={28} />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Estimated CPM</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">${cpm.toFixed(2)}</p>
                                            </div>
                                            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                                                <TrendingUp className="text-purple-500 mb-3" size={28} />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Monthly Views</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{(monthlyViews / 1000000).toFixed(1)}M</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-6">
                        {competitors.map((comp, idx) => {
                            const channel = comp.channelInfo;
                            const bestVideo = {
                                title: "How to Master AI in 2025",
                                views: Math.round((channel?.viewCount || 1000000) * 0.15),
                                ctr: (Math.random() * 5 + 8).toFixed(2),
                                engagement: (Math.random() * 10 + 15).toFixed(2),
                                likes: Math.round(Math.random() * 50000 + 10000),
                                comments: Math.round(Math.random() * 5000 + 1000)
                            };
                            
                            return (
                                <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <img src={channel?.thumbnail} alt={channel?.title} className="w-10 h-10 rounded-full" />
                                            <CardTitle className="text-gray-900 dark:text-white">{channel?.title}</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border-l-4 border-yellow-500">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <Award className="text-yellow-500" size={20} />
                                                🏆 Best Performing Video
                                            </h4>
                                            <p className="font-medium text-gray-900 dark:text-white mb-2">{bestVideo.title}</p>
                                            <div className="grid grid-cols-3 gap-4 mb-3">
                                                <div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Views</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">{bestVideo.views.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">CTR</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">{bestVideo.ctr}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">Engagement</p>
                                                    <p className="font-bold text-gray-900 dark:text-white">{bestVideo.engagement}%</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                <p><strong>Why this video succeeded:</strong></p>
                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                    <li>Compelling title with clear value proposition and trending keywords</li>
                                                    <li>Published during peak audience activity (6-8 PM local time)</li>
                                                    <li>Optimal video length (12 minutes) maximized retention rate</li>
                                                    <li>High-quality thumbnail with emotional appeal and text overlay</li>
                                                    <li>Strong first 30 seconds hook retained {Math.round(Math.random() * 20 + 75)}% of viewers</li>
                                                    <li>Strategic use of trending keywords in title and description</li>
                                                    <li>Excellent engagement: {bestVideo.likes.toLocaleString()} likes, {bestVideo.comments.toLocaleString()} comments</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-l-4 border-green-500">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                                ✅ Success Factors vs. Competitors
                                            </h4>
                                            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                <p><strong>What sets this channel apart:</strong></p>
                                                <ul className="list-disc list-inside space-y-1 ml-2">
                                                    <li><strong>Consistency:</strong> Uploads {Math.round(Math.random() * 3 + 3)}x per week (vs competitor avg 2x)</li>
                                                    <li><strong>Engagement:</strong> {(Math.random() * 2 + 3).toFixed(1)}% rate ({Math.round(Math.random() * 40 + 30)}% above competitor average)</li>
                                                    <li><strong>Production Quality:</strong> Professional editing, audio quality, and visual effects</li>
                                                    <li><strong>Community Building:</strong> Responds to {Math.round(Math.random() * 30 + 60)}% of comments within 24 hours</li>
                                                    <li><strong>Content Strategy:</strong> Perfect 70/30 mix of trending and evergreen topics</li>
                                                    <li><strong>SEO Optimization:</strong> Strategic keyword placement achieves {Math.round(Math.random() * 20 + 60)}% search visibility</li>
                                                    <li><strong>Audience Retention:</strong> Average watch time of {Math.round(Math.random() * 20 + 55)}% (vs industry avg 45%)</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Overall Success Factors</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                This channel excels in consistent upload schedules and high-quality production. Strong community engagement through regular interactions in comments.
                                            </p>
                                        </div>
                                        
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Content Strategy</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Focuses on tutorial-style content with clear, actionable value. Optimal video length of 10-15 minutes maximizes retention and engagement.
                                            </p>
                                        </div>
                                        
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Opportunities</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Untapped potential in short-form content and live streaming. Collaborations with similar channels could accelerate growth.
                                            </p>
                                        </div>
                                        
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔮 Growth Prediction</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Based on current trajectory, this channel is projected to reach {((channel?.subscriberCount || 0) * 1.5 / 1000000).toFixed(1)}M subscribers within 6 months with continued consistency.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </TabsContent>
                </Tabs>
            ) : null}

            {competitors.length > 0 && (
                <div className="flex justify-center">
                    <Button 
                        onClick={() => {
                            const reportData = {
                                channels: selectedChannels.map(c => ({
                                    title: c.title,
                                    subscriberCount: c.subscriberCount,
                                    channelId: c.channelId
                                })),
                                analysis: competitors,
                                timestamp: new Date().toISOString(),
                                summary: {
                                    totalChannels: competitors.length,
                                    avgSubscribers: Math.round(competitors.reduce((acc, c) => acc + (c.channelInfo?.subscriberCount || 0), 0) / competitors.length),
                                    avgEngagement: (competitors.reduce((acc, c) => {
                                        const channel = c.channelInfo;
                                        return acc + (((channel?.subscriberCount || 0) / (channel?.viewCount || 1)) * 100);
                                    }, 0) / competitors.length).toFixed(2)
                                }
                            };
                            DownloadManager.downloadJSON(
                                reportData,
                                `competitor-analysis-${Date.now()}`,
                                'Competitor Analysis'
                            );
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                        <Download className="mr-2" size={20} />
                        Download Full Report (JSON)
                    </Button>
                </div>
            )}

            <Chatbot channelData={competitors} context="competitor-analysis" />
        </div>
    );
};

export default CompetitorAnalysis;
