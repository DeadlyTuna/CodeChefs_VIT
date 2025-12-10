'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { notesService } from '@/lib/services/notesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Wifi, WifiOff, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NotesPage() {
    const { user } = useAuthStore();
    const [notes, setNotes] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOnline, setIsOnline] = useState(true);
    const [open, setOpen] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });

    useEffect(() => {
        if (user) {
            loadNotes();
        }

        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Back online - syncing notes...');
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('Offline mode - changes will sync when back online');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [user]);

    useEffect(() => {
        if (searchQuery && user) {
            handleSearch();
        } else if (user) {
            loadNotes();
        }
    }, [searchQuery, user]);

    const loadNotes = async () => {
        const allNotes = await notesService.getNotes(user!.id);
        setNotes(allNotes);
    };

    const handleSearch = async () => {
        const results = await notesService.searchNotes(user!.id, searchQuery);
        setNotes(results);
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.title.trim()) return;

        const tags = newNote.tags.split(',').map(t => t.trim()).filter(Boolean);
        await notesService.createNote(user!.id, newNote.title, newNote.content, tags);

        setNewNote({ title: '', content: '', tags: '' });
        setOpen(false);
        loadNotes();
        toast.success('Note created!');
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Notes
                        </h1>
                        {isOnline ? (
                            <Wifi className="h-5 w-5 text-green-500" />
                        ) : (
                            <WifiOff className="h-5 w-5 text-orange-500" />
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {isOnline ? 'Online & synced' : 'Offline mode - changes will sync later'}
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                            <Plus className="mr-2 h-4 w-4" /> New Note
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Note</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateNote} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                    placeholder="Note title"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Content</label>
                                <Textarea
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                    placeholder="Write your note..."
                                    rows={6}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Tags (comma-separated)</label>
                                <Input
                                    value={newNote.tags}
                                    onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                                    placeholder="work, personal, ideas"
                                    className="mt-1"
                                />
                            </div>
                            <Button type="submit" className="w-full">Create Note</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes by title, content, or tags..."
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.length === 0 ? (
                    <Card className="col-span-full p-12 text-center border-dashed">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 font-medium">
                            {searchQuery ? 'No notes found' : 'No notes yet'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery ? 'Try a different search' : 'Create your first note to get started'}
                        </p>
                    </Card>
                ) : (
                    notes.map((note) => (
                        <Link key={note.id} href={`/notes/${note.id}`}>
                            <Card className="p-4 hover:shadow-lg transition-all cursor-pointer h-full border hover:border-purple-200 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                                        {note.title}
                                    </h3>
                                    {!note.synced && (
                                        <Badge variant="outline" className="text-xs">Syncing</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                                    {note.content || 'No content'}
                                </p>
                                {note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {note.tags.map((tag: string) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-3">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </p>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
