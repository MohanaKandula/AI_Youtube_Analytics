import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, TrendingUp, Eye, BarChart3, Zap, Sparkles, Download, Award, Users, Monitor, Smartphone, Target, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const ThumbnailTesting = () => {
    const [activeTab, setActiveTab] = useState('testing');
    const [thumbnails, setThumbnails] = useState([
        { id: 'A', name: 'Variant A', url: 'https://via.placeholder.com/320x180/3b82f6/ffffff?text=Variant+A', ctr: 7.2, vtr: 65, engagement: 8.5, bounceRate: 32, score: 82, views: 1240 },
        { id: 'B', name: 'Variant B', url: 'https://via.placeholder.com/320x180/8b5cf6/ffffff?text=Variant+B', ctr: 5.8, vtr: 58, engagement: 6.2, bounceRate: 45, score: 68, views: 980 },
        { id: 'C', name: 'Variant C', url: 'https://via.placeholder.com/320x180/10b981/ffffff?text=Variant+C', ctr: 8.9, vtr: 72, engagement: 9.1, bounceRate: 28, score: 91, views: 1520 },
    ]);

    const winner = thumbnails.reduce((prev, current) => (prev.ctr > current.ctr ? prev : current));

    const handleUpload = () => {
        toast.success('Thumbnail uploaded successfully!');
    };

    const generateAIThumbnail = () => {
        toast.success('AI thumbnail generated!');
    };

    const selectBestThumbnail = () => {
        toast.success(`Variant ${winner.id} selected as winner!`);
    };

    const exportReport = () => {
        toast.success('Test report exported!');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ImageIcon className="text-blue-500" />
                            Thumbnail A/B Testing
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Test multiple variants and optimize for maximum CTR</p>
                    </div>
                    <Button onClick={generateAIThumbnail} className="bg-gradient-to-r from-purple-500 to-pink-500">
                        <Sparkles className="mr-2" size={18} />
                        AI Generate
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="testing">A/B Testing</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="scoring">AI Scoring</TabsTrigger>
                    <TabsTrigger value="comparison">Competitor</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="testing" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {thumbnails.map((thumb, idx) => (
                            <motion.div key={thumb.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                                <Card className={`bg-white dark:bg-gray-800 border-2 ${
                                    thumb.id === winner.id ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'
                                }`}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-gray-900 dark:text-white">{thumb.name}</CardTitle>
                                            {thumb.id === winner.id && (
                                                <Badge className="bg-green-500 text-white">
                                                    <Award className="mr-1" size={14} />
                                                    Winner
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="relative group cursor-pointer">
                                            <img src={thumb.url} alt={thumb.name} className="w-full rounded-lg" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                <Button size="sm">View Heatmap</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">CTR (Click-Through Rate)</span>
                                                    <span className="font-bold text-blue-500">{thumb.ctr}%</span>
                                                </div>
                                                <Progress value={thumb.ctr * 10} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">VTR (View-Through Rate)</span>
                                                    <span className="font-bold text-purple-500">{thumb.vtr}%</span>
                                                </div>
                                                <Progress value={thumb.vtr} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">Engagement Score</span>
                                                    <span className="font-bold text-green-500">{thumb.engagement}/10</span>
                                                </div>
                                                <Progress value={thumb.engagement * 10} className="h-2" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Views</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{thumb.views}</p>
                                            </div>
                                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Bounce</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{thumb.bounceRate}%</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={handleUpload} variant="outline" className="flex-1">
                            <Upload className="mr-2" size={18} />
                            Upload New Variant
                        </Button>
                        <Button onClick={selectBestThumbnail} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                            <Award className="mr-2" size={18} />
                            Select Best Thumbnail
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white">CTR Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={[...Array(7)].map((_, i) => ({
                                            day: `Day ${i + 1}`,
                                            A: 7.2 + Math.random() * 2 - 1,
                                            B: 5.8 + Math.random() * 2 - 1,
                                            C: 8.9 + Math.random() * 2 - 1
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="day" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="A" stroke="#3b82f6" />
                                            <Line type="monotone" dataKey="B" stroke="#8b5cf6" />
                                            <Line type="monotone" dataKey="C" stroke="#10b981" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-white">Device Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="text-blue-500" size={20} />
                                                <span className="font-semibold text-gray-900 dark:text-white">Mobile</span>
                                            </div>
                                            <span className="text-2xl font-bold text-blue-500">8.4%</span>
                                        </div>
                                        <Progress value={84} className="h-2" />
                                    </div>
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="text-purple-500" size={20} />
                                                <span className="font-semibold text-gray-900 dark:text-white">Desktop</span>
                                            </div>
                                            <span className="text-2xl font-bold text-purple-500">6.1%</span>
                                        </div>
                                        <Progress value={61} className="h-2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="scoring" className="space-y-6">
                    {thumbnails.map((thumb, idx) => (
                        <Card key={thumb.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-gray-900 dark:text-white">{thumb.name} - AI Analysis</CardTitle>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-blue-500">{thumb.score}/100</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Brightness</p>
                                        <div className="flex items-center gap-2">
                                            <Progress value={85} className="flex-1 h-2" />
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">85%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contrast</p>
                                        <div className="flex items-center gap-2">
                                            <Progress value={78} className="flex-1 h-2" />
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">78%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Text Readability</p>
                                        <div className="flex items-center gap-2">
                                            <Progress value={92} className="flex-1 h-2" />
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">92%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">✅ Strengths</h4>
                                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                            <li>• High contrast makes text very readable</li>
                                            <li>• Facial expression creates emotional connection</li>
                                            <li>• Color scheme aligns with video content</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Suggestions</h4>
                                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                            <li>• Increase brightness by 15% for better visibility</li>
                                            <li>• Add a face for 23% better CTR</li>
                                            <li>• Consider using warmer colors (+18% engagement)</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="comparison" className="space-y-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white">Competitor Thumbnail Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Your Best', ctr: 8.9, color: '#10b981' },
                                        { name: 'Competitor 1', ctr: 7.5, color: '#3b82f6' },
                                        { name: 'Competitor 2', ctr: 9.2, color: '#8b5cf6' },
                                        { name: 'Competitor 3', ctr: 6.8, color: '#f59e0b' },
                                        { name: 'Category Avg', ctr: 7.1, color: '#6b7280' }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="ctr" fill="#3b82f6" name="CTR %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="insights" className="space-y-6">
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-purple-500" />
                                Thumbnail Style Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Industry Analysis (1000+ thumbnails)</h4>
                                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <p>• <strong>Yellow backgrounds</strong> with faces increase CTR by <strong className="text-green-600">+32%</strong></p>
                                    <p>• <strong>Emotion-driven expressions</strong> boost engagement by <strong className="text-green-600">+28%</strong></p>
                                    <p>• <strong>Bold text (3-5 words)</strong> performs <strong className="text-green-600">+24%</strong> better</p>
                                    <p>• <strong>High contrast</strong> improves mobile CTR by <strong className="text-green-600">+41%</strong></p>
                                </div>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🎯 Recommended Actions</h4>
                                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <p>✓ Test thumbnails with human faces in your niche</p>
                                    <p>✓ Use warm colors (red, orange, yellow) for attention</p>
                                    <p>✓ Keep text minimal and highly readable</p>
                                    <p>✓ A/B test for at least 7 days for reliable data</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="text-green-500" />
                                ROI Estimation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                                Improving CTR from <strong>6%</strong> to <strong>9%</strong> could generate:
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-500">+12,400</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Extra Views</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-500">$45</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Ad Revenue</p>
                                </div>
                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg text-center">
                                    <p className="text-2xl font-bold text-green-500">+320</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">New Subscribers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {[
                        { version: 'V3', date: 'Feb 10, 2025', ctr: 8.9, status: 'Active' },
                        { version: 'V2', date: 'Feb 3, 2025', ctr: 8.1, status: 'Previous' },
                        { version: 'V1', date: 'Jan 28, 2025', ctr: 6.5, status: 'Archived' },
                    ].map((item, idx) => (
                        <Card key={idx} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                            {item.version}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{item.version} - {item.date}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">CTR: {item.ctr}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={item.status === 'Active' ? 'default' : 'secondary'}>{item.status}</Badge>
                                        <Button size="sm" variant="outline">View</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>

            <div className="flex justify-center gap-3">
                <Button onClick={exportReport} className="bg-gradient-to-r from-blue-500 to-purple-500">
                    <Download className="mr-2" size={18} />
                    Export Test Report
                </Button>
            </div>
        </div>
    );
};

export default ThumbnailTesting;