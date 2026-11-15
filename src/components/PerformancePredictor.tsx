import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Brain,
  BarChart3,
  Clock,
  Target,
  Sparkles,
  ThumbsUp,
  MessageCircle,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ai-youtube-analytics.onrender.com').replace(/\/+$/, '') + '/api';

interface PredictionResult {
  predicted_views_30d: number;
  confidence_interval: {
    lower: number;
    upper: number;
    confidence_score: number;
  };
  features_analyzed: any;
  recommendations: string[];
  similar_videos?: any[];
}

interface PredictionHistory {
  id: number;
  video_title: string;
  predicted_views: number;
  confidence_score: number;
  created_at: string;
}

const PerformancePredictor = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('22');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const userEmail = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    if (userEmail) {
      fetchHistory();
    }
  }, [userEmail]);

  // Auto-analyze as user types (debounced)
  useEffect(() => {
    if (title.length > 10 && description.length > 20) {
      const timer = setTimeout(() => {
        setAnalyzing(true);
        setTimeout(() => setAnalyzing(false), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [title, description, tags]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/predictions_history?user_email=${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.predictions.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handlePredict = async () => {
    if (!title || !description) {
      toast.error('Please enter both title and description');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/predict_performance_realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          title,
          description,
          tags,
          category_id: categoryId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
        fetchHistory();
        toast.success('Prediction completed!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Prediction failed');
      }
    } catch (error) {
      toast.error('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const confidenceData = prediction ? [
    { name: 'Lower', value: prediction.confidence_interval.lower },
    { name: 'Predicted', value: prediction.predicted_views_30d },
    { name: 'Upper', value: prediction.confidence_interval.upper }
  ] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Brain size={32} className="text-purple-500" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Real-Time Performance Predictor
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered predictions with live YouTube data analysis
        </p>
      </motion.div>

      <Tabs defaultValue="predict" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predict">Make Prediction</TabsTrigger>
          <TabsTrigger value="history">
            <History size={16} className="mr-2" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predict" className="space-y-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={20} />
                Video Details
                {analyzing && (
                  <Badge variant="outline" className="ml-auto">
                    <Loader2 className="animate-spin mr-1" size={12} />
                    Analyzing...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Video Title
                </label>
                <Input
                  placeholder="Enter your video title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length} characters (recommended: 50-60)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Description
                </label>
                <Textarea
                  placeholder="Enter video description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-white dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length} characters (recommended: 300+)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Tags (comma-separated)
                </label>
                <Input
                  placeholder="tag1, tag2, tag3..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-white dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {tags.split(',').filter(t => t.trim()).length} tags (recommended: 10-15)
                </p>
              </div>

              <Button
                onClick={handlePredict}
                disabled={loading || !title || !description}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Analyzing Real-Time Data...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2" size={20} />
                    Predict Performance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Prediction Results */}
          <AnimatePresence>
            {prediction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Main Prediction Card */}
                <Card className="border-2 border-purple-500">
                  <CardContent className="pt-6">
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Predicted Views (30 days)
                      </p>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <h2 className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                          {formatNumber(prediction.predicted_views_30d)}
                        </h2>
                      </motion.div>
                    </div>

                    {/* Confidence Score */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Confidence Level
                        </span>
                        <Badge className={getConfidenceColor(prediction.confidence_interval.confidence_score)}>
                          {getConfidenceLabel(prediction.confidence_interval.confidence_score)} (
                          {(prediction.confidence_interval.confidence_score * 100).toFixed(0)}%)
                        </Badge>
                      </div>
                      <Progress
                        value={prediction.confidence_interval.confidence_score * 100}
                        className="h-3"
                      />
                    </div>

                    {/* Confidence Interval Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={confidenceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatNumber(Number(value))} />
                          <Bar dataKey="value" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Features Analyzed */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 size={20} />
                      Real-Time Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Trending Match
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {prediction.features_analyzed.trending_match_score}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Sentiment Score
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {prediction.features_analyzed.sentiment_score.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Engagement Est.
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {prediction.features_analyzed.engagement_rate_estimate}%
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Similar Videos
                        </p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {prediction.features_analyzed.similar_video_count}
                        </p>
                      </div>
                      <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Avg Competitor
                        </p>
                        <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                          {formatNumber(prediction.features_analyzed.avg_competitor_views)}
                        </p>
                      </div>
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Tag Count
                        </p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {prediction.features_analyzed.tag_count}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target size={20} />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {prediction.recommendations.map((rec, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <AlertCircle size={20} className="text-blue-500 mt-0.5" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Your Prediction History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((pred) => (
                    <div
                      key={pred.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {pred.video_title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              {formatNumber(pred.predicted_views)} views
                            </span>
                            <Badge variant="outline">
                              {(pred.confidence_score * 100).toFixed(0)}% confidence
                            </Badge>
                            <span className="text-gray-500">
                              {new Date(pred.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No predictions yet. Make your first prediction!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformancePredictor;
