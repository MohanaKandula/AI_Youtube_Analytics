const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://ai-youtube-analytics.onrender.com').replace(/\/+$/, '');
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const KeywordResearch = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [keywords, setKeywords] = useState<any[]>([]);

    const handleSearch = async () => {
        if (!query.trim()) {
            toast.error('Please enter a topic');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/keyword-research?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (response.ok) {
                setKeywords(data.suggestedKeywords || []);
                toast.success('Keywords found!');
            } else {
                toast.error('Failed to fetch keywords');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Keyword Research Tool</h2>
                <div className="flex gap-3">
                    <Input placeholder="Enter topic or niche" value={query} onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white" />
                    <Button onClick={handleSearch} disabled={loading} className="bg-gradient-to-r from-blue-500 to-purple-500">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
            ) : keywords.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Suggested Keywords</h3>
                    <div className="grid gap-3">
                        {keywords.map(([keyword, count]: [string, number], idx: number) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="text-blue-500" size={20} />
                                    <span className="font-semibold text-gray-900 dark:text-white">{keyword}</span>
                                </div>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-bold">
                                    {count} uses
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default KeywordResearch;
