'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { plannerService } from '@/lib/services/plannerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, BookOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'
];

export default function PlannerSubjectsPage() {
    const { user } = useAuthStore();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [newSubject, setNewSubject] = useState({
        name: '',
        code: '',
        professor: '',
        color: COLORS[0],
    });

    useEffect(() => {
        if (user) {
            loadSubjects();
        }
    }, [user]);

    const loadSubjects = async () => {
        const { data } = await plannerService.getSubjects(user!.id);
        setSubjects(data || []);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.name.trim() || !newSubject.code.trim()) return;

        await plannerService.createSubject(user!.id, newSubject);
        setNewSubject({ name: '', code: '', professor: '', color: COLORS[0] });
        setOpen(false);
        loadSubjects();
        toast.success('Subject added!');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this subject? This will also delete related attendance and assignments.')) {
            await plannerService.deleteSubject(id);
            loadSubjects();
            toast.success('Subject deleted!');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        Subjects
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your courses</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-green-600 to-teal-600">
                            <Plus className="mr-2 h-4 w-4" /> Add Subject
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Subject</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Subject Name</label>
                                <Input
                                    value={newSubject.name}
                                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                    placeholder="Data Structures"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Subject Code</label>
                                <Input
                                    value={newSubject.code}
                                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                                    placeholder="CS201"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Professor (optional)</label>
                                <Input
                                    value={newSubject.professor}
                                    onChange={(e) => setNewSubject({ ...newSubject, professor: e.target.value })}
                                    placeholder="Dr. Smith"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Color</label>
                                <div className="flex gap-2 mt-2">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewSubject({ ...newSubject, color })}
                                            className={`w-8 h-8 rounded-full ${newSubject.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Add Subject</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.length === 0 ? (
                    <Card className="col-span-full p-12 text-center border-dashed">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 font-medium">No subjects yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first subject to get started</p>
                    </Card>
                ) : (
                    subjects.map((subject) => (
                        <Card
                            key={subject.id}
                            className="p-4 hover:shadow-lg transition-all border-l-4"
                            style={{ borderLeftColor: subject.color }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{subject.name}</h3>
                                    <p className="text-sm text-gray-500">{subject.code}</p>
                                    {subject.professor && (
                                        <p className="text-xs text-gray-400 mt-1">{subject.professor}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(subject.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Link href={`/planner/attendance?subject=${subject.id}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full">
                                        Attendance
                                    </Button>
                                </Link>
                                <Link href={`/planner/assignments?subject=${subject.id}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full">
                                        Assignments
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
