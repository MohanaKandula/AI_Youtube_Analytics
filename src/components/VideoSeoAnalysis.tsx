import React, { useState } from 'react';
import { Search, Target, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api';

const VideoSeoAnalysis = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const analyzeVideo = async () => {
        if (!videoUrl && !keyword) {
            toast.error('Please enter a video URL or keyword');
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (videoUrl) params.append('video_url', videoUrl);
            if (keyword) params.append('keyword', keyword);

            const response = await fetch(`${API_BASE}/video_seo_analysis?${params}`);
            const data = await response.json();

            if (response.ok) {
                setAnalysis(data);
                toast.success('SEO analysis completed');
            } else {
                toast.error(data.error || 'Failed to analyze video');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Improvement';
    };

    const scoreData = analysis ? [
        { name: 'Overall', value: analysis.overallScore, fill: '#3b82f6' }
    ] : [];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Real-Time Video SEO Analysis</h1>
                <p className="text-gray-600 dark:text-gray-400">Get actionable SEO recommendations for YouTube videos</p>
            </motion.div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Input
                        placeholder="Enter YouTube video URL..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && analyzeVideo()}
                    />
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                        <span className="text-sm text-gray-500">OR</span>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                    </div>
                    <div className="flex gap-3">
                        <Input
                            placeholder="Enter keyword to analyze top video..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && analyzeVideo()}
                            className="flex-1"
                        />
                        <Button onClick={analyzeVideo} disabled={loading}>
                            {loading ? 'Analyzing...' : <><Search className="mr-2 h-4 w-4" />Analyze</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {analysis && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-6 w-6 text-yellow-500" />
                                Overall SEO Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-8">
                                <div className="flex-1">
                                    <div className="text-6xl font-bold mb-2">
                                        <span className={getScoreColor(analysis.overallScore)}>{analysis.overallScore}</span>
                                        <span className="text-2xl text-gray-400">/100</span>
                                    </div>
                                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                                        {getScoreLabel(analysis.overallScore)}
                                    </p>
                                </div>
                                <div className="w-64 h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={scoreData}>
                                            <RadialBar dataKey="value" cornerRadius={10} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Title Analysis</CardTitle>
                                <CardDescription>Score: {analysis.titleAnalysis.score}/100</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Progress value={analysis.titleAnalysis.score} />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Title</p>
                                    <p className="font-semibold">{analysis.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{analysis.titleAnalysis.length} characters</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-2">Suggestions:</p>
                                    <ul className="space-y-1">
                                        {analysis.titleAnalysis.suggestions.map((suggestion, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                                <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Description Analysis</CardTitle>
                                <CardDescription>Score: {analysis.descriptionAnalysis.score}/100</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Progress value={analysis.descriptionAnalysis.score} />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Word Count</p>
                                    <p className="text-2xl font-bold">{analysis.descriptionAnalysis.wordCount}</p>
                                    <p className="text-xs text-gray-500">Recommended: 300+ words</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-2">Suggestions:</p>
                                    <ul className="space-y-1">
                                        {analysis.descriptionAnalysis.suggestions.map((suggestion, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                                <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Tags Analysis</CardTitle>
                                <CardDescription>Score: {analysis.tagsAnalysis.score}/100</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Progress value={analysis.tagsAnalysis.score} />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tags</p>
                                    <p className="text-2xl font-bold">{analysis.tagsAnalysis.count}</p>
                                    <p className="text-xs text-gray-500">Recommended: 10-15 tags</p>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold mb-2">Suggestions:</p>
                                    <ul className="space-y-1">
                                        {analysis.tagsAnalysis.suggestions.map((suggestion, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                                <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Engagement Analysis</CardTitle>
                                <CardDescription>Score: {analysis.engagementAnalysis.score}/100</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Progress value={analysis.engagementAnalysis.score} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
                                        <p className="text-xl font-bold">{analysis.engagementAnalysis.views.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
                                        <p className="text-xl font-bold">{analysis.engagementAnalysis.likes.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                                        <p className="text-xl font-bold">{analysis.engagementAnalysis.comments.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</p>
                                        <p className="text-xl font-bold">{analysis.engagementAnalysis.rate}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {analysis.competitors.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Competitor Benchmarking</CardTitle>
                                <CardDescription>Top performing videos for comparison</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {analysis.competitors.map((comp, i) => (
                                        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                            <p className="font-semibold mb-2">{comp.title}</p>
                                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span>{comp.views.toLocaleString()} views</span>
                                                <span>{comp.likes.toLocaleString()} likes</span>
                                                <span>{comp.tags} tags</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {analysis.recommendations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-500" />
                                    Priority Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {analysis.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                            <TrendingUp className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default VideoSeoAnalysis;
