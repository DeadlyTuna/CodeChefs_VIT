'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { notesService } from '@/lib/services/notesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Trash2, Save, FileText, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { RichTextEditor } from '@/components/RichTextEditor';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NoteDetailPage({
    params,
}: {
    params: Promise<{ noteId: string }>;
}) {
    const { noteId } = use(params);
    const { user } = useAuthStore();
    const router = useRouter();
    const [note, setNote] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [drawing, setDrawing] = useState<string>('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('text');

    useEffect(() => {
        if (user) {
            loadNote();
        }
    }, [user, noteId]);

    const loadNote = async () => {
        const notes = await notesService.getNotes(user!.id);
        const foundNote = notes.find(n => n.id === noteId);
        if (foundNote) {
            setNote(foundNote);
            setTitle(foundNote.title);
            setContent(foundNote.content);
            setDrawing(foundNote.drawing || '');
            setTags(foundNote.tags.join(', '));
        }
        setLoading(false);
    };

    const handleSave = async () => {
        const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
        await notesService.updateNote(noteId, {
            title,
            content,
            drawing,
            tags: tagArray,
        });
        toast.success('Note saved!');
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this note?')) {
            await notesService.deleteNote(noteId);
            toast.success('Note deleted!');
            router.push('/notes');
        }
    };

    if (loading) return <div className="p-8 dark:text-white">Loading...</div>;
    if (!note) return <div className="p-8 dark:text-white">Note not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/notes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDelete} className="border-red-300 text-red-600 hover:bg-red dark:border-red-800 dark:text-red-400">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-pink-600">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>

                {/* Title */}
                <Card className="p-6 mb-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <Input
                        placeholder="Note title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-2xl font-bold border-0 focus-visible:ring-0 px-0 dark:bg-gray-900 dark:text-white"
                    />
                    <Input
                        placeholder="Tags (comma separated)..."
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="mt-4 text-sm border-0 focus-visible:ring-0 px-0 dark:bg-gray-900 dark:text-gray-400"
                    />
                </Card>

                {/* Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="text" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Rich Text Editor
                        </TabsTrigger>
                        <TabsTrigger value="drawing" className="gap-2">
                            <PenTool className="h-4 w-4" />
                            Drawing Canvas
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                        />
                    </TabsContent>

                    <TabsContent value="drawing">
                        <DrawingCanvas
                            onSave={setDrawing}
                            initialData={drawing}
                        />
                    </TabsContent>
                </Tabs>

                {/* Auto-save Indicator */}
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>All changes are saved manually. Click the Save button to update your note.</p>
                </div>
            </div>
        </div>
    );
}
