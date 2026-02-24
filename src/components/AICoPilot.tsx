import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    timestamp: Date;
}

export default function AICoPilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your Citadel AI Safety Co-Pilot. I monitor system logs and USB activity for potential threats. How can I assist you with security monitoring today?",
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStartingModel, setIsStartingModel] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const startOllamaModel = async (originalInput: string) => {
        setIsStartingModel(true);
        try {
            const res = await fetch("http://localhost:3005/api/ai/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            
            if (res.ok) {
                const data = await res.json();
                const statusMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: `🤖 ${data.message} Please wait a moment for model to fully load...`,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, statusMessage]);
                
                // Wait a bit for model to start, then retry the original message
                setTimeout(() => {
                    retryOriginalMessage(originalInput);
                }, 5000);
            }
        } catch (err) {
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "❌ Failed to start AI model automatically. Please run 'ollama run gemma3' manually in command prompt.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsStartingModel(false);
        }
    };

    const retryOriginalMessage = async (originalInput: string) => {
        try {
            const res = await fetch("http://localhost:3005/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: originalInput })
            });

            if (res.ok) {
                const data = await res.json();
                const aiMessage: Message = {
                    id: (Date.now() + 3).toString(),
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, aiMessage]);
            } else {
                const retryMessage: Message = {
                    id: (Date.now() + 3).toString(),
                    role: 'assistant',
                    content: "⚠️ Model is still starting. Please try again in a moment.",
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, retryMessage]);
            }
        } catch (err) {
            const retryMessage: Message = {
                id: (Date.now() + 3).toString(),
                role: 'assistant',
                content: "⚠️ Model is still loading. Please wait a bit longer or try manually running 'ollama run gemma3'.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, retryMessage]);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch("http://localhost:3005/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: input })
            });

            if (!res.ok) throw new Error("AI Offline");

            const data = await res.json();
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "System Alert: Local AI Co-Pilot is currently offline or the model is loading. Please check Ollama status.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            
            // Automatically try to start the model
            if (!isStartingModel) {
                startOllamaModel(input);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 z-40"
            >
                <MessageSquare className="w-6 h-6" />
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
                />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        className="fixed bottom-24 right-6 w-96 h-[500px] bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">AI Safety Co-Pilot</h3>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] opacity-80 uppercase tracking-tighter">System Scanning Active</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                        </div>
                                        <div className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask me anything..."
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-1.5 w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
