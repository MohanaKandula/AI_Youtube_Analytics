import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Send, Instagram, Copy, Download, Clock, BarChart3, Hash, Sparkles, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const SocialSharing = () => {
    const [activeTab, setActiveTab] = useState('share');
    const [customCaption, setCustomCaption] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [shareHistory, setShareHistory] = useState([
        { id: 1, content: 'AI Tools 2025 trending 🔥', platforms: ['Twitter', 'LinkedIn'], date: '2025-02-10', clicks: 342, engagement: 28 },
        { id: 2, content: 'My channel grew 22% 🚀', platforms: ['Facebook', 'Instagram'], date: '2025-02-08', clicks: 198, engagement: 15 },
    ]);

    const platforms = [
        { name: 'Twitter', icon: Twitter, color: 'bg-blue-400', handle: '@username' },
        { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', handle: 'facebook.com/user' },
        { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', handle: 'linkedin.com/in/user' },
        { name: 'Instagram', icon: Instagram, color: 'bg-pink-500', handle: '@username' },
        { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', handle: '+1234567890' },
        { name: 'Telegram', icon: Send, color: 'bg-blue-500', handle: '@username' },
    ];

    const templates = [
        { id: 1, text: '🔥 Check out this trending topic: {topic}\n📊 Avg Views: {views}\n📈 Growth: +{growth}% this week!\n\n#Trending #YouTube', category: 'Trending' },
        { id: 2, text: '🚀 My channel analytics:\n👥 Subscribers: {subs}\n📹 Videos: {videos}\n🎯 Growth: +{growth}%\n\n#ContentCreator #YouTubeGrowth', category: 'Analytics' },
        { id: 3, text: '💡 Just discovered: {topic}\n✨ This is game-changing!\n\n#Innovation #Tech #Tutorial', category: 'Discovery' },
    ];

    const mockShareData = {
        topic: 'AI Tools 2025',
        views: '1.2M',
        growth: 42,
        subs: '50K',
        videos: 125,
    };

    const togglePlatform = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
        );
    };

    const generateHashtags = () => {
        const hashtags = ['#AI', '#Technology', '#Tutorial', '#2025', '#Trending', '#YouTube', '#ContentCreator'];
        return hashtags.slice(0, Math.floor(Math.random() * 3) + 3).join(' ');
    };

    const generateAICaption = () => {
        const captions = [
            '🔥 Discover the hottest trends in AI! Our analysis shows 42% growth this week. Don\'t miss out!',
            '🚀 Level up your content game with these insights! Join thousands of creators already benefiting.',
            '💡 The future is here! Check out what\'s trending and stay ahead of the curve.',
        ];
        setCustomCaption(captions[Math.floor(Math.random() * captions.length)] + '\n\n' + generateHashtags());
        toast.success('AI-generated caption created!');
    };

    const handleShare = () => {
        if (selectedPlatforms.length === 0) {
            toast.error('Please select at least one platform');
            return;
        }
        toast.success(`Shared to ${selectedPlatforms.join(', ')}!`);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const generateShareLink = () => {
        const shortLink = 'https://bit.ly/' + Math.random().toString(36).substring(7);
        copyToClipboard(shortLink);
    };

    const downloadCard = () => {
        toast.success('Performance card downloaded!');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <Share2 className="text-blue-500" />
                    Social Sharing Hub
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Share your insights across all platforms with one click</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="share">Quick Share</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="share" className="space-y-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Select Platforms</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                {platforms.map((platform) => {
                                    const Icon = platform.icon;
                                    const isSelected = selectedPlatforms.includes(platform.name);
                                    return (
                                        <motion.button
                                            key={platform.name}
                                            onClick={() => togglePlatform(platform.name)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`p-4 rounded-xl border-2 transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-full ${platform.color} flex items-center justify-center mb-2 mx-auto`}>
                                                <Icon className="text-white" size={24} />
                                            </div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-center">{platform.name}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">{platform.handle}</p>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-900 dark:text-white">Custom Caption</label>
                                        <Button onClick={generateAICaption} size="sm" variant="outline">
                                            <Sparkles className="mr-2" size={16} />
                                            AI Generate
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder="Write your caption or use AI to generate one..."
                                        value={customCaption}
                                        onChange={(e) => setCustomCaption(e.target.value)}
                                        className="min-h-32 bg-gray-50 dark:bg-gray-900"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{customCaption.length} characters</span>
                                        <Button onClick={() => setCustomCaption(customCaption + ' ' + generateHashtags())} size="sm" variant="ghost">
                                            <Hash className="mr-1" size={14} />
                                            Add Hashtags
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={generateShareLink} variant="outline" className="w-full">
                                        <Copy className="mr-2" size={18} />
                                        Generate Short Link
                                    </Button>
                                    <Button onClick={downloadCard} variant="outline" className="w-full">
                                        <Download className="mr-2" size={18} />
                                        Download Card
                                    </Button>
                                </div>

                                <Button onClick={handleShare} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-lg py-6">
                                    <Share2 className="mr-2" size={20} />
                                    Share to {selectedPlatforms.length || 'Selected'} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Performance Preview Card</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{mockShareData.topic}</h3>
                                    <Badge className="bg-green-500 text-white">+{mockShareData.growth}%</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-500">{mockShareData.views}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Avg Views</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-purple-500">{mockShareData.subs}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Subscribers</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-500">{mockShareData.videos}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Videos</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    {templates.map((template) => (
                        <Card key={template.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <Badge variant="secondary">{template.category}</Badge>
                                    <Button onClick={() => { setCustomCaption(template.text); toast.success('Template loaded!'); }} size="sm">
                                        Use Template
                                    </Button>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{template.text}</p>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="schedule" className="space-y-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="text-blue-500" />
                                Schedule Post
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Select Date & Time</label>
                                <Input type="datetime-local" className="bg-gray-50 dark:bg-gray-900" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Post Content</label>
                                <Textarea placeholder="What do you want to share?" className="min-h-32 bg-gray-50 dark:bg-gray-900" />
                            </div>
                            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500">
                                <Clock className="mr-2" size={18} />
                                Schedule Post
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {shareHistory.map((item) => (
                        <Card key={item.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-white mb-2">{item.content}</p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {item.platforms.map((platform, idx) => (
                                                <Badge key={idx} variant="secondary">{platform}</Badge>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{item.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-500">{item.clicks}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Clicks</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="text-green-500" size={16} />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.engagement}% engagement</span>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <ExternalLink className="mr-2" size={14} />
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Share Performance Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Shares</p>
                                    <p className="text-3xl font-bold text-blue-500">248</p>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Clicks</p>
                                    <p className="text-3xl font-bold text-green-500">1.2K</p>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Engagement</p>
                                    <p className="text-3xl font-bold text-purple-500">24%</p>
                                </div>
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversions</p>
                                    <p className="text-3xl font-bold text-orange-500">89</p>
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[...Array(7)].map((_, i) => ({ day: `Day ${i + 1}`, clicks: Math.round(Math.random() * 100 + 50) }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">🎉 Sharing Impact</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg text-gray-700 dark:text-gray-300">
                                Your shares brought <strong className="text-green-600 dark:text-green-400">1,240 visits</strong> to your content this month!
                                That's a <strong className="text-green-600 dark:text-green-400">32% increase</strong> from last month.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SocialSharing;
