import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

const faqs = [
    {
        question: 'How do I analyze my YouTube channel?',
        answer: 'Navigate to Channel Performance, enter your channel name or URL, and click "Analyze". You\'ll get comprehensive metrics including subscriber growth, engagement rates, and content strategy insights.'
    },
    {
        question: 'Can I compare multiple channels at once?',
        answer: 'Yes! Use the Competitor Analysis feature to add up to 5 channels for side-by-side comparison. You\'ll see detailed metrics, growth charts, and AI-powered insights.'
    },
    {
        question: 'How accurate are the performance predictions?',
        answer: 'Our AI model analyzes millions of videos and achieves 75-85% accuracy for 30-day view predictions. Accuracy improves with more specific metadata and historical data.'
    },
    {
        question: 'What are trending hashtags and how do I use them?',
        answer: 'In Topic Trends, select a category to see 10 trending hashtags. Use these in your video titles, descriptions, and tags to increase discoverability and reach trending audiences.'
    },
    {
        question: 'How do I export my data?',
        answer: 'Click the "Download Report" button on any feature page. You can export as JSON, CSV, or PDF. All downloaded reports are saved in your History for easy access.'
    },
    {
        question: 'Are email notifications free?',
        answer: 'Yes! All notification features are completely free. Enable them in Profile Settings > Preferences to receive trending topic updates, channel alerts, and weekly digests.'
    },
    {
        question: 'How is my data protected?',
        answer: 'We take privacy seriously. Your data is stored locally in your browser and never shared with third parties. You can export or delete your data anytime from Privacy Settings.'
    },
    {
        question: 'What languages are supported for video search?',
        answer: 'We support English, Hindi, Telugu, Tamil, and more. Select your preferred language in the search filters to find region-specific content.'
    },
    {
        question: 'How does the SEO analysis work?',
        answer: 'Enter a video title or keyword, and our AI analyzes top-performing videos to provide optimization recommendations for titles, descriptions, tags, and engagement strategies.'
    },
    {
        question: 'Can I schedule content analysis reports?',
        answer: 'Currently, reports are generated on-demand. Enable Weekly Digest in notification settings to receive automated weekly summaries of your channel performance.'
    }
];

const HelpSupport = () => {
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!contactForm.email || !contactForm.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Simulate sending email to kandulamohana14@gmail.com
        const emailData = {
            to: 'kandulamohana14@gmail.com',
            from: contactForm.email,
            subject: contactForm.subject || 'TutorTrace Support Request',
            body: `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}\n\nSent from TutorTrace at ${new Date().toLocaleString()}`
        };

        console.log('Email would be sent:', emailData);

        // In production, this would call your backend API:
        // await fetch('/api/send-support-email', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(emailData)
        // });

        setSubmitted(true);
        toast.success('Your message has been sent! We\'ll respond within 24 hours.');
        
        setTimeout(() => {
            setContactForm({ name: '', email: '', subject: '', message: '' });
            setSubmitted(false);
        }, 3000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-2xl">
                        <HelpCircle className="text-blue-500" size={32} />
                        Help & Support Center
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">
                        Find answers to common questions or contact our support team. We're here to help you make the most of TutorTrace!
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, idx) => (
                            <AccordionItem key={idx} value={`item-${idx}`}>
                                <AccordionTrigger className="text-left text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-700 dark:text-gray-300">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="text-purple-500" />
                        Contact Support
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {submitted ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center py-8"
                        >
                            <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                We've received your message and will respond to <strong>{contactForm.email}</strong> within 24 hours.
                            </p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Name</label>
                                    <Input
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        placeholder="Your name"
                                        className="bg-gray-50 dark:bg-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Email *</label>
                                    <Input
                                        type="email"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        placeholder="your.email@example.com"
                                        required
                                        className="bg-gray-50 dark:bg-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Subject</label>
                                <Input
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                    placeholder="Brief description of your issue"
                                    className="bg-gray-50 dark:bg-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Message *</label>
                                <Textarea
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                    placeholder="Describe your issue or question in detail..."
                                    required
                                    rows={6}
                                    className="bg-gray-50 dark:bg-gray-900"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                                <Send className="mr-2" size={18} />
                                Send Message to Support
                            </Button>
                            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                                Your message will be sent to <strong>kandulamohana14@gmail.com</strong>
                            </p>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default HelpSupport;
