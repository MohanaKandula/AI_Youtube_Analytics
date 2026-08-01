import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Users,
  Video,
  Trash2,
  Search,
  Filter,
  Tag,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:5000/api';

interface SavedItem {
  id: number;
  item_type: string;
  item_id: string;
  item_title: string;
  item_data: Record<string, unknown>;
  tags: string[];
  notes: string;
  created_at: string;
}

const SavedItems = ({ userEmail }: { userEmail: string }) => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'channel' | 'video'>('all');

  useEffect(() => {
    if (userEmail) {
      fetchSavedItems();
    }
  }, [userEmail]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, filterType]);

  const fetchSavedItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/get_saved_items?user_email=${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.saved_items);
      } else {
        toast.error('Failed to load saved items');
      }
    } catch (error) {
      toast.error('Error loading saved items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.item_type === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.item_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredItems(filtered);
  };

  const handleDelete = async (itemId: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/delete_saved_item?user_email=${userEmail}&id=${itemId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
        toast.success('Item removed');
      } else {
        toast.error('Failed to delete item');
      }
    } catch (error) {
      toast.error('Error deleting item');
    }
  };

  const ItemCard = ({ item }: { item: SavedItem }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-3 rounded-lg ${
                item.item_type === 'channel' 
                  ? 'bg-purple-100 dark:bg-purple-900/30' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {item.item_type === 'channel' ? (
                  <Users size={24} className="text-purple-600 dark:text-purple-400" />
                ) : (
                  <Video size={24} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.item_title || 'Untitled'}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {item.item_type}
                  </Badge>
                </div>

                {item.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {item.notes}
                  </p>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center gap-1"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Saved on {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {item.item_type === 'channel' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://youtube.com/channel/${item.item_id}`, '_blank')}
                >
                  <ExternalLink size={16} />
                </Button>
              )}
              {item.item_type === 'video' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://youtube.com/watch?v=${item.item_id}`, '_blank')}
                >
                  <ExternalLink size={16} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
              </Button>
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Saved Items
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bookmarked channels and videos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filteredItems.length} items
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'channel' ? 'default' : 'outline'}
            onClick={() => setFilterType('channel')}
            className="flex items-center gap-2"
          >
            <Users size={16} />
            Channels
          </Button>
          <Button
            variant={filterType === 'video' ? 'default' : 'outline'}
            onClick={() => setFilterType('video')}
            className="flex items-center gap-2"
          >
            <Video size={16} />
            Videos
          </Button>
        </div>
      </div>

      {/* Items List */}
      <AnimatePresence mode="popLayout">
        {filteredItems.length > 0 ? (
          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Bookmark size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No saved items
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start saving channels and videos to see them here
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedItems;
