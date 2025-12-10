'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { plannerService } from '@/lib/services/plannerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CheckSquare, Square, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

function AssignmentsContent() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const subjectFilter = searchParams.get('subject');

    const [assignments, setAssignments] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        subject_id: '',
        title: '',
        description: '',
        deadline: '',
    });

    useEffect(() => {
        if (user) {
            loadSubjects();
            loadAssignments();
        }
    }, [user, subjectFilter]);

    const loadSubjects = async () => {
        const { data } = await plannerService.getSubjects(user!.id);
        setSubjects(data || []);
        if (subjectFilter && data) {
            const subject = data.find(s => s.id === subjectFilter);
            if (subject) setNewAssignment(prev => ({ ...prev, subject_id: subject.id }));
        }
    };

    const loadAssignments = async () => {
        const { data } = await plannerService.getAssignments(user!.id, subjectFilter || undefined);
        setAssignments(data || []);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAssignment.subject_id || !newAssignment.title.trim()) return;

        await plannerService.createAssignment(user!.id, newAssignment);
        setNewAssignment({ subject_id: '', title: '', description: '', deadline: '' });
        setOpen(false);
        loadAssignments();
        toast.success('Assignment added!');
    };

    const handleToggleComplete = async (id: string, currentStatus: boolean) => {
        await plannerService.updateAssignment(id, { completed: !currentStatus });
        loadAssignments();
        toast.success(currentStatus ? 'Marked as incomplete' : 'Marked as complete');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this assignment?')) {
            await plannerService.deleteAssignment(id);
            loadAssignments();
            toast.success('Assignment deleted!');
        }
    };

    const upcomingAssignments = assignments.filter(a => !a.completed);
    const completedAssignments = assignments.filter(a => a.completed);

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        Assignments
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track your assignments and deadlines</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-orange-600 to-red-600">
                            <Plus className="mr-2 h-4 w-4" /> Add Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Assignment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Subject</label>
                                <Select
                                    value={newAssignment.subject_id}
                                    onValueChange={(v) => setNewAssignment({ ...newAssignment, subject_id: v })}
                                    required
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                {subject.name} ({subject.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    placeholder="Assignment title"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    placeholder="Assignment details..."
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Deadline</label>
                                <Input
                                    type="datetime-local"
                                    value={newAssignment.deadline}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <Button type="submit" className="w-full">Add Assignment</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-6">
                {upcomingAssignments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Upcoming ({upcomingAssignments.length})
                        </h2>
                        <div className="space-y-2">
                            {upcomingAssignments.map((assignment) => (
                                <Card
                                    key={assignment.id}
                                    className="p-4 hover:shadow-md transition-all border-l-4"
                                    style={{ borderLeftColor: assignment.subjects.color }}
                                >
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => handleToggleComplete(assignment.id, assignment.completed)}
                                            className="mt-1"
                                        >
                                            <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        </button>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {assignment.subjects.name} • {assignment.subjects.code}
                                            </p>
                                            {assignment.description && (
                                                <p className="text-sm text-gray-500 mb-2">{assignment.description}</p>
                                            )}
                                            {assignment.deadline && (
                                                <p className="text-xs text-orange-600 font-medium">
                                                    Due: {new Date(assignment.deadline).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(assignment.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {completedAssignments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                            <CheckSquare className="h-5 w-5 text-green-500" />
                            Completed ({completedAssignments.length})
                        </h2>
                        <div className="space-y-2">
                            {completedAssignments.map((assignment) => (
                                <Card
                                    key={assignment.id}
                                    className="p-4 opacity-60 hover:opacity-100 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => handleToggleComplete(assignment.id, assignment.completed)}
                                            className="mt-1"
                                        >
                                            <CheckSquare className="h-5 w-5 text-green-500" />
                                        </button>
                                        <div className="flex-1">
                                            <h3 className="font-semibold line-through">{assignment.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {assignment.subjects.name} • {assignment.subjects.code}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(assignment.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {assignments.length === 0 && (
                    <Card className="p-12 text-center border-dashed">
                        <Square className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 font-medium">No assignments yet</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first assignment to get started</p>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default function PlannerAssignmentsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto p-6 max-w-6xl">Loading...</div>}>
            <AssignmentsContent />
        </Suspense>
    );
}
