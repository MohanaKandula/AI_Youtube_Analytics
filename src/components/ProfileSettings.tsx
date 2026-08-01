import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save, User, Bell, Shield, Download, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DownloadManager } from './DownloadManager';

const ProfileSettings = ({ userEmail, userAvatar, onAvatarChange }) => {
    const [avatar, setAvatar] = useState(userAvatar || '');
    const [name, setName] = useState('User');
    const [bio, setBio] = useState('');
    const [notifications, setNotifications] = useState({
        trendingTopics: true,
        channelUpdates: true,
        weeklyDigest: false,
        emailAlerts: false
    });
    const [privacy, setPrivacy] = useState({
        showHistory: true,
        publicProfile: false,
        shareAnalytics: false
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            setNotifications(settings.notifications || notifications);
            setPrivacy(settings.privacy || privacy);
        }
        const savedName = localStorage.getItem('userName');
        const savedBio = localStorage.getItem('userBio');
        if (savedName) setName(savedName);
        if (savedBio) setBio(savedBio);
    }, []);

    const handleAvatarUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatar(result);
                onAvatarChange(result);
                localStorage.setItem('userAvatar', result);
                toast.success('Avatar updated successfully!');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = () => {
        localStorage.setItem('userName', name);
        localStorage.setItem('userBio', bio);
        toast.success('Profile updated successfully!');
    };

    const handleSaveSettings = () => {
        const settings = { notifications, privacy };
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        // Email notification setup
        if (notifications.emailAlerts && userEmail) {
            const emailPrefs = {
                email: userEmail,
                trendingTopics: notifications.trendingTopics,
                channelUpdates: notifications.channelUpdates,
                weeklyDigest: notifications.weeklyDigest,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('emailNotificationPrefs', JSON.stringify(emailPrefs));
            console.log('Email notifications configured:', emailPrefs);
            
            toast.success(`Settings saved! Email notifications will be sent to ${userEmail}`);
        } else {
            toast.success('Settings saved successfully!');
        }
    };

    const handleExportData = () => {
        const activityData = {
            profile: { 
                name, 
                email: userEmail, 
                bio,
                avatar: localStorage.getItem('userAvatar')
            },
            settings: { notifications, privacy },
            searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
            videoSearchHistory: JSON.parse(localStorage.getItem('videoSearchHistory') || '[]'),
            featureUsage: {
                videoSearch: {
                    totalSearches: JSON.parse(localStorage.getItem('videoSearchHistory') || '[]').length,
                    lastUsed: localStorage.getItem('lastVideoSearch')
                },
                competitorAnalysis: {
                    totalAnalyses: JSON.parse(localStorage.getItem('competitorAnalysisHistory') || '[]').length,
                    lastUsed: localStorage.getItem('lastCompetitorAnalysis')
                },
                topicTrends: {
                    viewedCategories: JSON.parse(localStorage.getItem('viewedTrendCategories') || '[]'),
                    lastUsed: localStorage.getItem('lastTopicTrendsView')
                },
                seoAnalysis: {
                    totalAnalyses: JSON.parse(localStorage.getItem('seoAnalysisHistory') || '[]').length,
                    lastUsed: localStorage.getItem('lastSeoAnalysis')
                }
            },
            downloadedReports: DownloadManager.getReports(),
            exportTimestamp: new Date().toISOString(),
            accountCreated: localStorage.getItem('accountCreatedDate') || new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(activityData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tutortrace-complete-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Complete user data exported successfully!');
    };

    const handleClearHistory = () => {
        localStorage.setItem('searchHistory', '[]');
        localStorage.setItem('videoSearchHistory', '[]');
        toast.success('History cleared successfully!');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h3>
                        
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                                    {avatar ? (
                                        <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={64} className="text-white" />
                                    )}
                                </div>
                                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-colors">
                                    <Camera size={20} />
                                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                                </label>
                            </div>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Click camera to upload avatar</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-gray-900 dark:text-white">Full Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <Label htmlFor="email" className="text-gray-900 dark:text-white">Email Address</Label>
                                <Input id="email" value={userEmail} disabled className="mt-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <Label htmlFor="bio" className="text-gray-900 dark:text-white">Bio</Label>
                                <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." className="mt-2 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white" />
                            </div>
                            <Button onClick={handleSaveProfile} className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                                <Save size={18} className="mr-2" />
                                Save Profile
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'trendingTopics', label: 'Trending Topics Updates', desc: 'Get notified about new trending topics' },
                                    { key: 'channelUpdates', label: 'Channel Updates', desc: 'Alerts when tracked channels upload new content' },
                                    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive weekly summary of your analytics' },
                                    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Send notifications to your email' }
                                ].map(({ key, label, desc }) => (
                                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Bell className="text-blue-500" size={20} />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                                            </div>
                                        </div>
                                        <Switch checked={notifications[key]} onCheckedChange={(val) => setNotifications({ ...notifications, [key]: val })} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                            <Save size={18} className="mr-2" />
                            Save Preferences
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'showHistory', label: 'Show Search History', desc: 'Display your search history in the app' },
                                    { key: 'publicProfile', label: 'Public Profile', desc: 'Make your profile visible to others' },
                                    { key: 'shareAnalytics', label: 'Share Analytics', desc: 'Allow sharing your analytics data' }
                                ].map(({ key, label, desc }) => (
                                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Shield className="text-green-500" size={20} />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                                            </div>
                                        </div>
                                        <Switch checked={privacy[key]} onCheckedChange={(val) => setPrivacy({ ...privacy, [key]: val })} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Data Management</h3>
                            <div className="space-y-3">
                                <Button onClick={handleExportData} variant="outline" className="w-full justify-start">
                                    <Download size={18} className="mr-2" />
                                    Export My Data (JSON)
                                </Button>
                                <Button onClick={handleClearHistory} variant="outline" className="w-full justify-start text-orange-600 dark:text-orange-400">
                                    <Trash2 size={18} className="mr-2" />
                                    Clear Search History
                                </Button>
                                <Button variant="destructive" className="w-full justify-start">
                                    <Trash2 size={18} className="mr-2" />
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProfileSettings;
