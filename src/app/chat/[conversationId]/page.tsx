'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { chatService } from '@/lib/services/chatService';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export default function ChatConversationPage({
    params,
}: {
    params: Promise<{ conversationId: string }>;
}) {
    const { conversationId } = use(params);
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            loadMessages();
            const channel = chatService.subscribeToMessages(
                conversationId,
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                }
            );

            return () => {
                channel.unsubscribe();
            };
        }
    }, [user, conversationId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async () => {
        const { data } = await chatService.getMessages(conversationId);
        setMessages(data || []);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || loading) return;

        setLoading(true);
        await chatService.sendMessage(conversationId, newMessage, user!.id);
        setNewMessage('');
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
            <div className="border-b bg-white/80 backdrop-blur-sm p-4 flex items-center gap-4">
                <Link href="/chat">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-xl font-bold">Chat</h2>
                    <p className="text-xs text-gray-500">Realtime messaging</p>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md p-3 rounded-2xl shadow-sm ${msg.sender_id === user?.id
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                                        : 'bg-white border'
                                    }`}
                            >
                                <p className="break-words">{msg.content}</p>
                                <span className={`text-xs mt-1 block ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                    {new Date(msg.created_at).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="border-t bg-white/80 backdrop-blur-sm p-4">
                <div className="flex gap-2 max-w-4xl mx-auto">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
