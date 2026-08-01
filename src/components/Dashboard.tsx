import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  Bookmark,
  Bell,
  Download,
  Activity,
  Users,
  Video,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:5000/api';

interface DashboardStats {
  totalSaved: number;
  savedChannels: number;
  savedVideos: number;
  recentActivities: number;
  unreadNotifications: number;
  totalExports: number;
  topActivities: Array<{ type: string; count: number }>;
}

interface SavedItem {
  id: number;
  item_type: string;
  item_title: string;
  created_at: string;
}

interface RecentPrediction {
  id: number;
  video_title: string;
  predicted_views: number;
  confidence_score: number;
  created_at: string;
}

const Dashboard = ({ userEmail }: { userEmail: string }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSaved, setRecentSaved] = useState<SavedItem[]>([]);
  const [recentPredictions, setRecentPredictions] = useState<RecentPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      fetchDashboardData();
    }
  }, [userEmail]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, savedRes, predictionsRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard_stats?user_email=${userEmail}`),
        fetch(`${API_BASE}/get_saved_items?user_email=${userEmail}`),
        fetch(`${API_BASE}/predictions_history?user_email=${userEmail}`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (savedRes.ok) {
        const savedData = await savedRes.json();
        setRecentSaved(savedData.saved_items.slice(0, 5));
      }

      if (predictionsRes.ok) {
        const predictionsData = await predictionsRes.json();
        setRecentPredictions(predictionsData.predictions.slice(0, 5));
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              {change !== undefined && (
                <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  <span className="ml-1">{Math.abs(change)}%</span>
                </div>
              )}
            </div>
            <div className={`p-4 rounded-full ${color}`}>
              <Icon size={24} className="text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your overview.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
        >
          <Activity size={18} />
          Refresh
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Bookmark}
          title="Total Saved Items"
          value={stats?.totalSaved || 0}
          change={12}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Users}
          title="Saved Channels"
          value={stats?.savedChannels || 0}
          change={8}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon={Video}
          title="Saved Videos"
          value={stats?.savedVideos || 0}
          change={15}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={Bell}
          title="Notifications"
          value={stats?.unreadNotifications || 0}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Activity size={20} />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topActivities && stats.topActivities.length > 0 ? (
                stats.topActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                      {activity.type.replace('_', ' ')}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                      {activity.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Bookmark size={20} />
              Recently Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSaved.length > 0 ? (
                recentSaved.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {item.item_type === 'channel' ? <Users size={16} /> : <Video size={16} />}
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium text-sm">
                          {item.item_title || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {item.item_type}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No saved items yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp size={20} />
              Recent Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPredictions.length > 0 ? (
                recentPredictions.map((pred) => (
                  <div
                    key={pred.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium text-sm line-clamp-1">
                        {pred.video_title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                        {pred.predicted_views >= 1000000 
                          ? `${(pred.predicted_views / 1000000).toFixed(1)}M`
                          : pred.predicted_views >= 1000 
                          ? `${(pred.predicted_views / 1000).toFixed(1)}K`
                          : pred.predicted_views}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(pred.confidence_score * 100).toFixed(0)}% conf.
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No predictions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <TrendingUp size={20} />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock size={24} className="mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.recentActivities || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 Days</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Download size={24} className="mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalExports || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Exports</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <BarChart2 size={24} className="mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {((stats?.savedChannels || 0) + (stats?.savedVideos || 0))}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Bell size={24} className="mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.unreadNotifications || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
