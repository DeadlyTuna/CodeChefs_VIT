'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { chatService } from '@/lib/services/chatService';
import { postsService, Post, PostComment } from '@/lib/services/postsService';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Send, Plus, Image as ImageIcon, Users, X, Search, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export default function ChatPage() {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [showMessages, setShowMessages] = useState(false);
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [postsError, setPostsError] = useState<string | null>(null);
    const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
    const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'groups'>('all');
    const [newDMDialogOpen, setNewDMDialogOpen] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            loadConversations();
            loadPosts();

            const channel = postsService.subscribeToNewPosts(() => {
                loadPosts();
            });

            return () => {
                channel.unsubscribe();
            };
        }
    }, [user]);

    useEffect(() => {
        // Filter conversations based on view mode
        if (viewMode === 'groups') {
            setFilteredConversations(conversations.filter(c => c.is_group));
        } else {
            setFilteredConversations(conversations);
        }
    }, [viewMode, conversations]);

    const loadConversations = async () => {
        try {
            const { data } = await chatService.getConversations(user!.id);
            setConversations(data || []);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const loadPosts = async () => {
        try {
            const postsData = await postsService.getPosts(user!.id);
            setPosts(postsData);
            setPostsError(null);
        } catch (error) {
            console.error('Error loading posts:', error);
            setPostsError('Unable to load posts');
        }
    };

    const handleSelectChat = async (conv: any) => {
        setSelectedChat(conv);
        setShowMessages(true);

        try {
            const { data } = await chatService.getMessages(conv.id);
            setMessages(data || []);

            chatService.subscribeToMessages(conv.id, (payload) => {
                setMessages((prev) => [...prev, payload.new]);
            });
        } catch (error) {
            toast.error('Failed to load messages');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;

        try {
            await chatService.sendMessage(selectedChat.id, newMessage, user!.id);
            setNewMessage('');
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;

        setLoading(true);
        try {
            await postsService.createPost(user!.id, newPostContent);
            setNewPostContent('');
            setCreatePostOpen(false);
            toast.success('Post created!');
            loadPosts();
        } catch (error) {
            toast.error('Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleLike = async (post: Post) => {
        try {
            if (post.is_liked) {
                await postsService.unlikePost(post.id, user!.id);
            } else {
                await postsService.likePost(post.id, user!.id);
            }
            loadPosts();
        } catch (error) {
            toast.error('Failed to update like');
        }
    };

    const handleOpenComments = async (post: Post) => {
        setSelectedPostForComments(post);
        setCommentsDialogOpen(true);

        try {
            const commentsData = await postsService.getComments(post.id);
            setComments(commentsData);
        } catch (error) {
            toast.error('Failed to load comments');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPostForComments) return;

        try {
            await postsService.addComment(selectedPostForComments.id, user!.id, newComment);
            setNewComment('');
            const commentsData = await postsService.getComments(selectedPostForComments.id);
            setComments(commentsData);
            toast.success('Comment added!');
            loadPosts();
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleCreateDM = async () => {
        if (!searchEmail.trim()) return;

        try {
            // Find user by email
            const { data: users } = await supabase
                .from('profiles')
                .select('id, email')
                .eq('email', searchEmail)
                .single();

            if (!users) {
                toast.error('User not found');
                return;
            }

            // Create or get conversation
            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({
                    name: searchEmail.split('@')[0],
                    is_group: false
                } as any)
                .select()
                .single();

            if (error) throw error;

            // Add participants
            await supabase.from('conversation_participants').insert([
                { conversation_id: (newConv as any).id, user_id: user!.id },
                { conversation_id: (newConv as any).id, user_id: users.id },
            ] as any);

            setSearchEmail('');
            setNewDMDialogOpen(false);
            toast.success('DM created!');
            loadConversations();
        } catch (error) {
            toast.error('Failed to create DM');
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) {
            toast.error('Please enter group name and select members');
            return;
        }

        try {
            // Create group conversation
            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({ name: groupName, is_group: true } as any)
                .select()
                .single();

            if (error) throw error;

            // Add current user and selected members
            const participants = [
                { conversation_id: (newConv as any).id, user_id: user!.id },
                ...selectedMembers.map(memberId => ({
                    conversation_id: (newConv as any).id,
                    user_id: memberId,
                })),
            ];

            await supabase.from('conversation_participants').insert(participants as any);

            setGroupName('');
            setSelectedMembers([]);
            setCreateGroupDialogOpen(false);
            toast.success('Group created!');
            loadConversations();
        } catch (error) {
            toast.error('Failed to create group');
        }
    };

    // Get unique users from DM conversations for group creation
    const getDMContacts = () => {
        const contacts = new Set<any>();
        conversations.forEach(conv => {
            if (!conv.is_group && conv.participants) {
                conv.participants.forEach((p: any) => {
                    if (p.user_id !== user!.id) {
                        contacts.add({ id: p.user_id, email: p.email || 'Contact' });
                    }
                });
            }
        });
        return Array.from(contacts);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
            {/* Left Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Messages
                    </h2>
                </div>

                {/* Navigation */}
                <div className="space-y-2 mb-4">
                    <Button
                        variant={viewMode === 'all' ? 'default' : 'ghost'}
                        className={`w-full justify-start gap-2 ${viewMode === 'all' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'dark:text-gray-300 dark:hover:bg-gray-800'}`}
                        onClick={() => setViewMode('all')}
                    >
                        <MessageCircle className="h-5 w-5" />
                        All Messages
                    </Button>
                    <Button
                        variant={viewMode === 'groups' ? 'default' : 'ghost'}
                        className={`w-full justify-start gap-2 ${viewMode === 'groups' ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'dark:text-gray-300 dark:hover:bg-gray-800'}`}
                        onClick={() => setViewMode('groups')}
                    >
                        <Users className="h-5 w-5" />
                        Groups
                    </Button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mb-4">
                    <Dialog open={newDMDialogOpen} onOpenChange={setNewDMDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full gap-2 dark:border-gray-700 dark:text-gray-300">
                                <UserPlus className="h-4 w-4" /> New DM
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-gray-900">
                            <DialogHeader>
                                <DialogTitle className="dark:text-white">Start New DM</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by email..."
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                        className="pl-10 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <Button onClick={handleCreateDM} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                                    Create DM
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={createGroupDialogOpen} onOpenChange={setCreateGroupDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full gap-2 dark:border-gray-700 dark:text-gray-300">
                                <Users className="h-4 w-4" /> Create Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-gray-900">
                            <DialogHeader>
                                <DialogTitle className="dark:text-white">Create Group</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Group name..."
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="dark:bg-gray-800 dark:text-white"
                                />
                                <div>
                                    <p className="text-sm font-medium mb-2 dark:text-white">Select members from your DMs:</p>
                                    <ScrollArea className="h-48 border rounded-lg p-2 dark:border-gray-700">
                                        {getDMContacts().length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                No DM contacts yet. Start a DM first!
                                            </p>
                                        ) : (
                                            getDMContacts().map((contact: any) => (
                                                <div key={contact.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                                                    <Checkbox
                                                        checked={selectedMembers.includes(contact.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedMembers([...selectedMembers, contact.id]);
                                                            } else {
                                                                setSelectedMembers(selectedMembers.filter(id => id !== contact.id));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm dark:text-white">{contact.email}</span>
                                                </div>
                                            ))
                                        )}
                                    </ScrollArea>
                                </div>
                                <Button onClick={handleCreateGroup} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                                    Create Group
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Conversations List */}
                <ScrollArea className="h-[calc(100vh-450px)]">
                    <div className="space-y-2">
                        {filteredConversations.length === 0 && (
                            <Card className="p-4 text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {viewMode === 'groups' ? 'No groups yet' : 'No messages yet'}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {viewMode === 'groups' ? 'Create a group to get started' : 'Start a DM to get started'}
                                </p>
                            </Card>
                        )}
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => handleSelectChat(conv)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedChat?.id === conv.id
                                    ? 'bg-blue-100 dark:bg-blue-900/30'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>
                                            {conv.is_group ? <Users className="h-4 w-4" /> : conv.name?.[0] || 'C'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate dark:text-white">{conv.name || 'Chat'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {conv.is_group ? 'Group' : 'DM'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Center Feed */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Feed Header */}
                    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                            <h3 className="text-xl font-bold dark:text-white">Feed</h3>
                            <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 gap-2">
                                        <Plus className="h-4 w-4" /> Create Post
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="dark:bg-gray-900">
                                    <DialogHeader>
                                        <DialogTitle className="dark:text-white">Create New Post</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Textarea
                                            placeholder="What's on your mind?"
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            rows={4}
                                            className="dark:bg-gray-800 dark:text-white"
                                        />
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1 gap-2 dark:border-gray-700 dark:text-gray-300">
                                                <ImageIcon className="h-4 w-4" /> Add Image
                                            </Button>
                                            <Button
                                                onClick={handleCreatePost}
                                                disabled={loading}
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                                            >
                                                {loading ? 'Posting...' : 'Post'}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Posts Feed */}
                    <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-950">
                        <div className="max-w-2xl mx-auto p-4 space-y-4">
                            {postsError && (
                                <Card className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                                    <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">⚠️ {postsError}</p>
                                </Card>
                            )}
                            {!postsError && posts.length === 0 && (
                                <Card className="p-8 text-center bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                    <p className="text-gray-500 dark:text-gray-400">No posts yet. Be the first to post!</p>
                                </Card>
                            )}
                            {posts.map((post) => (
                                <Card key={post.id} className="p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar>
                                            <AvatarFallback>{post.user_email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium dark:text-white">{post.user_email?.split('@')[0]}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mb-4 text-gray-800 dark:text-gray-200">{post.content}</p>

                                    <div className="flex items-center gap-6 pt-3 border-t border-gray-200 dark:border-gray-800">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`gap-2 ${post.is_liked ? 'text-red-500' : 'dark:text-gray-300'}`}
                                            onClick={() => handleToggleLike(post)}
                                        >
                                            <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                                            {post.likes_count}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-2 dark:text-gray-300"
                                            onClick={() => handleOpenComments(post)}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            {post.comments_count}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Right Messages Panel */}
            <div
                className={`bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transition-all duration-300 ${showMessages ? 'w-96' : 'w-0'
                    }`}
            >
                {showMessages && selectedChat && (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{selectedChat.is_group ? <Users className="h-4 w-4" /> : selectedChat.name?.[0] || 'C'}</AvatarFallback>
                                </Avatar>
                                <p className="font-medium dark:text-white">{selectedChat.name || 'Chat'}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowMessages(false)} className="dark:text-gray-300">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.length === 0 && (
                                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                                )}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs p-3 rounded-2xl ${msg.sender_id === user?.id
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-800 dark:text-white'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                />
                                <Button onClick={handleSendMessage} size="icon" className="bg-gradient-to-r from-blue-600 to-purple-600">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Comments Dialog */}
            <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
                <DialogContent className="dark:bg-gray-900 max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">Comments</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-96">
                        <div className="space-y-4">
                            {comments.length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No comments yet. Be the first!</p>
                            )}
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">{comment.user_email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                            <p className="font-medium text-sm dark:text-white">{comment.user_email?.split('@')[0]}</p>
                                            <p className="text-sm dark:text-gray-300 mt-1">{comment.content}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(comment.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="flex gap-2 mt-4">
                        <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                        <Button onClick={handleAddComment} className="bg-gradient-to-r from-blue-600 to-purple-600">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
