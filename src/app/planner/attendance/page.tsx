'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { plannerService } from '@/lib/services/plannerService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PlannerAttendancePage() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const subjectFilter = searchParams.get('subject');

    const [attendance, setAttendance] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'present' | 'absent' | 'leave'>('present');

    useEffect(() => {
        if (user) {
            loadSubjects();
            loadAttendance();
        }
    }, [user, subjectFilter]);

    const loadSubjects = async () => {
        const { data } = await plannerService.getSubjects(user!.id);
        setSubjects(data || []);
        if (subjectFilter && data) {
            const subject = data.find(s => s.id === subjectFilter);
            if (subject) setSelectedSubject(subject.id);
        }
    };

    const loadAttendance = async () => {
        const { data } = await plannerService.getAttendance(user!.id, subjectFilter || undefined);
        setAttendance(data || []);
    };

    const handleMark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject) return;

        await plannerService.markAttendance(
            user!.id,
            selectedSubject,
            format(selectedDate, 'yyyy-MM-dd'),
            selectedStatus
        );

        setOpen(false);
        loadAttendance();
        toast.success('Attendance marked!');
    };

    const getStats = () => {
        if (!subjectFilter || attendance.length === 0) return null;

        const present = attendance.filter(a => a.status === 'present').length;
        const total = attendance.length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

        return { present, total, percentage };
    };

    const stats = getStats();

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        Attendance
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track your class attendance</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
                            <Plus className="mr-2 h-4 w-4" /> Mark Attendance
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mark Attendance</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleMark} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Subject</label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject} required>
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
                                <label className="text-sm font-medium">Date</label>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    className="rounded-md border mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                        <SelectItem value="leave">On Leave</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">Mark Attendance</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {stats && (
                <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <h3 className="font-semibold mb-3">Attendance Statistics</h3>
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-4xl font-bold text-blue-600">{stats.percentage}%</p>
                            <p className="text-sm text-gray-500">Attendance Rate</p>
                        </div>
                        <div>
                            <p className="text-2xl font-semibold">{stats.present}/{stats.total}</p>
                            <p className="text-sm text-gray-500">Classes Attended</p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="space-y-2">
                {attendance.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 font-medium">No attendance records yet</p>
                        <p className="text-sm text-gray-400 mt-1">Start marking your attendance</p>
                    </Card>
                ) : (
                    attendance.map((record) => (
                        <Card key={record.id} className="p-4 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {record.status === 'present' ? (
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    ) : record.status === 'absent' ? (
                                        <XCircle className="h-6 w-6 text-red-500" />
                                    ) : (
                                        <CalendarIcon className="h-6 w-6 text-orange-500" />
                                    )}
                                    <div>
                                        <h3 className="font-semibold">{record.subjects.name}</h3>
                                        <p className="text-sm text-gray-500">{record.subjects.code}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium capitalize">{record.status}</p>
                                    <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
