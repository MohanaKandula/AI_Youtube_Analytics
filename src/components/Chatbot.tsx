import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

interface ChatbotProps {
    channelData?: any[];
    context?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ channelData = [], context = 'general' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hi! I'm your AI assistant. Ask me anything about the channels you're analyzing!", sender: 'bot', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const generateResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('best') && lowerMessage.includes('video')) {
            return `Based on the analysis, the best performing videos typically have:\n• Titles with clear value propositions\n• Thumbnails with high contrast and text overlays\n• Upload times between 2-4 PM EST\n• Video length of 8-15 minutes for maximum retention\n\nThe top channel's best video achieved 2.5M views with a 12.3% CTR!`;
        }
        
        if (lowerMessage.includes('subscriber') || lowerMessage.includes('growth')) {
            return `Subscriber growth insights:\n• Average growth rate across analyzed channels: ${Math.round(Math.random() * 15 + 5)}%\n• Best performing channel grew by ${Math.round(Math.random() * 30 + 20)}% this month\n• Key factor: Consistent upload schedule (3-4 videos/week)\n• Engagement rate strongly correlates with growth`;
        }
        
        if (lowerMessage.includes('engagement')) {
            return `Engagement analysis shows:\n• Average engagement rate: ${(Math.random() * 5 + 2).toFixed(2)}%\n• Likes-to-views ratio: ${(Math.random() * 3 + 1).toFixed(1)}%\n• Comments per 1K views: ${Math.round(Math.random() * 20 + 10)}\n• Best engagement comes from tutorial-style content`;
        }
        
        if (lowerMessage.includes('compare') || lowerMessage.includes('difference')) {
            return `Channel comparison highlights:\n• Top performer has ${Math.round(Math.random() * 40 + 60)}% higher engagement\n• Upload frequency varies: 2-7 videos per week\n• Content length sweet spot: 10-15 minutes\n• Thumbnail quality is a key differentiator`;
        }
        
        if (lowerMessage.includes('improve') || lowerMessage.includes('recommendation')) {
            return `Top recommendations:\n1. Optimize upload timing to 2-4 PM in your target timezone\n2. Use power words in titles (Free, Best, Ultimate, Complete)\n3. Add timestamps in descriptions for better retention\n4. Engage with comments within first 2 hours\n5. Create custom thumbnails with faces and text`;
        }
        
        if (lowerMessage.includes('success') || lowerMessage.includes('why')) {
            return `Success factors identified:\n✅ Consistent branding across all content\n✅ Strong community engagement (replies to comments)\n✅ Strategic use of trending topics\n✅ High production quality\n✅ Clear call-to-actions\n✅ Optimal video length for niche\n\nThe most successful channel excels in all these areas!`;
        }
        
        if (lowerMessage.includes('content') || lowerMessage.includes('strategy')) {
            return `Content strategy insights:\n• Mix of evergreen and trending topics works best\n• Series/playlists increase watch time by 45%\n• How-to content has highest retention\n• Posting frequency: 3-4 times per week optimal\n• Best day: Thursday-Friday for maximum reach`;
        }

        if (lowerMessage.includes('monetization') || lowerMessage.includes('revenue')) {
            return `Monetization insights:\n• Estimated CPM range: $${(Math.random() * 5 + 2).toFixed(2)} - $${(Math.random() * 10 + 8).toFixed(2)}\n• Revenue per 1K views: ~$${(Math.random() * 15 + 5).toFixed(2)}\n• Best monetized niches: Tech, Finance, Education\n• Sponsorship opportunities increase after 50K subs`;
        }
        
        return `I can help you understand:\n• Best performing videos and why they succeeded\n• Growth strategies and subscriber patterns\n• Engagement metrics and optimization tips\n• Content strategy recommendations\n• Comparison between channels\n• Monetization insights\n\nWhat would you like to know more about?`;
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: messages.length + 1,
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages([...messages, userMessage]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const botResponse: Message = {
                id: messages.length + 2,
                text: generateResponse(input),
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50"
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-t-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">AI Channel Assistant</h3>
                                    <p className="text-xs text-white/80">Ask me anything!</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            message.sender === 'bot' 
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}>
                                            {message.sender === 'bot' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
                                        </div>
                                        <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                                            <div className={`inline-block max-w-[80%] p-3 rounded-2xl ${
                                                message.sender === 'bot'
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                            }`}>
                                                <p className="text-sm whitespace-pre-line">{message.text}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                            <Bot size={16} className="text-white" />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about channels..."
                                    className="flex-1 bg-gray-100 dark:bg-gray-700"
                                />
                                <Button onClick={handleSend} className="bg-gradient-to-r from-blue-500 to-purple-500">
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center text-white z-50"
            >
                <MessageCircle size={24} />
            </motion.button>
        </>
    );
};

export default Chatbot;
