import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  GraduationCap,
  Cpu,
  ChefHat,
  Dumbbell,
  Gamepad2,
  Music,
  Briefcase,
  Film,
  Globe,
  Search,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

interface VideoCategoriesProps {
  onSelectCategory: (category: string, topic: string, language: string) => void;
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  topics: string[];
}

const CATEGORIES: CategoryData[] = [
  {
    id: 'programming',
    name: 'Programming & Tech',
    description: 'Learn modern software development, web stacks, and AI',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    topics: [
      'Python Tutorials',
      'React & Next.js',
      'Full Stack Development',
      'Machine Learning & AI',
      'System Design',
      'Data Structures & Algorithms',
      'TypeScript Guide',
      'DevOps & Docker'
    ]
  },
  {
    id: 'education',
    name: 'Education & Science',
    description: 'Academic concepts, research, physics, mathematics, and tutorials',
    icon: GraduationCap,
    color: 'from-emerald-500 to-teal-500',
    topics: [
      'Calculus & Linear Algebra',
      'Quantum Physics',
      'Data Science Fundamentals',
      'World History',
      'Biology & Genetics',
      'Economics 101',
      'Critical Thinking'
    ]
  },
  {
    id: 'technology',
    name: 'Emerging Technologies',
    description: 'Latest breakthroughs in robotics, blockchain, gadgets, and computing',
    icon: Cpu,
    color: 'from-violet-500 to-purple-500',
    topics: [
      'Generative AI Trends',
      'Quantum Computing',
      'Cybersecurity & Ethical Hacking',
      'Smart Home Tech',
      'Cloud Architecture',
      'Robotics Engineering'
    ]
  },
  {
    id: 'business',
    name: 'Business & Finance',
    description: 'Entrepreneurship, market analysis, personal finance, and growth',
    icon: Briefcase,
    color: 'from-amber-500 to-orange-500',
    topics: [
      'Startup Growth Strategies',
      'Personal Finance & Investing',
      'Stock Market Analysis',
      'SaaS Marketing',
      'Product Management',
      'Cryptocurrency & Web3'
    ]
  },
  {
    id: 'gaming',
    name: 'Gaming & Esports',
    description: 'Game design, walkthroughs, esports analysis, and game dev',
    icon: Gamepad2,
    color: 'from-pink-500 to-rose-500',
    topics: [
      'Game Dev in Unity & Unreal',
      'Speedrunning Analysis',
      'Esports Tournaments',
      'Game Design Breakdown',
      'Retro Game Lore',
      'Strategy Guides'
    ]
  },
  {
    id: 'creative',
    name: 'Creative & Media',
    description: 'Music production, video editing, 3D design, and digital art',
    icon: Music,
    color: 'from-fuchsia-500 to-pink-500',
    topics: [
      'Music Production & Beatmaking',
      'Video Editing in Premiere',
      'Blender 3D Modeling',
      'UI/UX Design in Figma',
      'Sound Design Tips',
      'Photography & Cinematography'
    ]
  },
  {
    id: 'culinary',
    name: 'Culinary Arts & Cooking',
    description: 'Recipes, kitchen techniques, food science, and restaurant reviews',
    icon: ChefHat,
    color: 'from-red-500 to-orange-500',
    topics: [
      'Mastering Knife Skills',
      'Sourdough Baking',
      'Food Science Deep Dives',
      'Quick Weeknight Dinners',
      'Street Food Chronicles',
      'Artisan Coffee Brewing'
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness & Health',
    description: 'Workout programs, nutrition science, mobility, and wellness',
    icon: Dumbbell,
    color: 'from-green-500 to-emerald-500',
    topics: [
      'Hypertrophy Science',
      'HIIT & Cardio Routines',
      'Calisthenics Progressions',
      'Meal Prep & Nutrition',
      'Mobility & Recovery',
      'Mindfulness & Sleep Science'
    ]
  }
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'all', label: 'Any Language' }
];

export const VideoCategories: React.FC<VideoCategoriesProps> = ({ onSelectCategory }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCategory, setSelectedCategory] = useState<CategoryData>(CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTopics = selectedCategory.topics.filter((topic) =>
    topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Sparkles size={14} />
          <span>Curated Discovery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Explore Video Categories & Topics
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Pick a subject or trending topic to instantly analyze top-performing content, keywords, and competitor benchmarks.
        </p>
      </div>

      {/* Language & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800/80 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Globe size={18} className="text-gray-500 dark:text-gray-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Target Language:
          </span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.label}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filter topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Grid: Categories on Left, Topics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category List */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
            Categories ({CATEGORIES.length})
          </h2>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500'
                      : 'bg-white dark:bg-gray-800/70 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700/60'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : `bg-gradient-to-br ${cat.color} text-white`
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{cat.name}</div>
                      <div
                        className={`text-xs line-clamp-1 ${
                          isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {cat.topics.length} topics
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={isSelected ? 'text-white' : 'text-gray-400'}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics Panel */}
        <div className="lg:col-span-7">
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-gray-800/80 shadow-lg border border-gray-200 dark:border-gray-700/60">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700/60">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedCategory.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedCategory.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTopics.length > 0 ? (
                filteredTopics.map((topic) => (
                  <motion.button
                    key={topic}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectCategory(selectedCategory.name, topic, selectedLanguage)}
                    className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-gray-200 dark:border-gray-700/60 hover:border-blue-400 dark:hover:border-blue-600 transition flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {topic}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition"
                    />
                  </motion.button>
                ))
              ) : (
                <div className="col-span-2 py-10 text-center text-gray-500 dark:text-gray-400">
                  No topics matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCategories;
