'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, X, BookOpen, CheckCircle, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSlot {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    type: 'theory' | 'lab';
    room?: string;
    color: string;
}

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function PlannerPage() {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
        {
            id: '1',
            day: 'Monday',
            startTime: '09:00',
            endTime: '11:00',
            subject: 'Data Structures',
            type: 'theory',
            room: 'Room 101',
            color: COLORS[8],
        },
        {
            id: '2',
            day: 'Monday',
            startTime: '14:00',
            endTime: '17:00',
            subject: 'Algorithms Lab',
            type: 'lab',
            room: 'Lab 1',
            color: COLORS[2],
        },
    ]);

    const [open, setOpen] = useState(false);
    const [draggedSlot, setDraggedSlot] = useState<TimeSlot | null>(null);
    const [newSlot, setNewSlot] = useState({
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        subject: '',
        type: 'theory' as 'theory' | 'lab',
        room: '',
        color: COLORS[0],
    });

    const handleAddSlot = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSlot.subject.trim()) return;

        const slot: TimeSlot = {
            id: Date.now().toString(),
            ...newSlot,
        };

        setTimeSlots([...timeSlots, slot]);
        setNewSlot({
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            subject: '',
            type: 'theory',
            room: '',
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
        setOpen(false);
    };

    const handleDeleteSlot = (id: string) => {
        setTimeSlots(timeSlots.filter(slot => slot.id !== id));
    };

    const handleDragStart = (slot: TimeSlot) => {
        setDraggedSlot(slot);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (day: string, time: string) => {
        if (!draggedSlot) return;

        const startHour = parseInt(time.split(':')[0]);
        const duration = parseInt(draggedSlot.endTime.split(':')[0]) - parseInt(draggedSlot.startTime.split(':')[0]);
        const newEndHour = startHour + duration;

        const updatedSlot = {
            ...draggedSlot,
            day,
            startTime: time,
            endTime: `${newEndHour.toString().padStart(2, '0')}:00`,
        };

        setTimeSlots(timeSlots.map(s => s.id === draggedSlot.id ? updatedSlot : s));
        setDraggedSlot(null);
    };

    const getSlotHeight = (startTime: string, endTime: string) => {
        const start = parseInt(startTime.split(':')[0]);
        const end = parseInt(endTime.split(':')[0]);
        return end - start;
    };

    const getSlotAtPosition = (day: string, time: string) => {
        const currentHour = parseInt(time.split(':')[0]);
        return timeSlots.find(slot => {
            if (slot.day !== day) return false;
            const startHour = parseInt(slot.startTime.split(':')[0]);
            const endHour = parseInt(slot.endTime.split(':')[0]);
            return currentHour === startHour;
        });
    };

    const isSlotOccupied = (day: string, time: string) => {
        const currentHour = parseInt(time.split(':')[0]);
        return timeSlots.some(slot => {
            if (slot.day !== day) return false;
            const startHour = parseInt(slot.startTime.split(':')[0]);
            const endHour = parseInt(slot.endTime.split(':')[0]);
            return currentHour >= startHour && currentHour < endHour;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-teal-50/50 p-6">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                                Planner - Weekly Timetable
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Drag and drop to organize your schedule</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/planner/subjects">
                            <Button variant="outline">
                                <BookOpen className="mr-2 h-4 w-4" /> Subjects
                            </Button>
                        </Link>
                        <Link href="/planner/attendance">
                            <Button variant="outline">
                                <CheckCircle className="mr-2 h-4 w-4" /> Attendance
                            </Button>
                        </Link>
                        <Link href="/planner/assignments">
                            <Button variant="outline">
                                <ClipboardList className="mr-2 h-4 w-4" /> Assignments
                            </Button>
                        </Link>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-green-600 to-teal-600">
                                    <Plus className="mr-2 h-4 w-4" /> Add Class
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Class</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddSlot} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium">Subject Name</label>
                                        <Input
                                            value={newSlot.subject}
                                            onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                                            placeholder="Data Structures"
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Day</label>
                                            <Select value={newSlot.day} onValueChange={(v) => setNewSlot({ ...newSlot, day: v })}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DAYS.map(day => (
                                                        <SelectItem key={day} value={day}>{day}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Type</label>
                                            <Select value={newSlot.type} onValueChange={(v: any) => setNewSlot({ ...newSlot, type: v })}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="theory">Theory</SelectItem>
                                                    <SelectItem value="lab">Lab</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Start Time</label>
                                            <Select value={newSlot.startTime} onValueChange={(v) => setNewSlot({ ...newSlot, startTime: v })}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIME_SLOTS.map(time => (
                                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">End Time</label>
                                            <Select value={newSlot.endTime} onValueChange={(v) => setNewSlot({ ...newSlot, endTime: v })}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIME_SLOTS.map(time => (
                                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Room (optional)</label>
                                        <Input
                                            value={newSlot.room}
                                            onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                                            placeholder="Room 101"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Color</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewSlot({ ...newSlot, color })}
                                                    className={`w-8 h-8 rounded-full ${newSlot.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full">Add to Timetable</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Timetable Grid */}
                <Card className="p-4 bg-white overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="border border-gray-200 p-2 bg-gray-50 text-sm font-semibold w-24 sticky left-0 z-10">
                                    Time
                                </th>
                                {DAYS.map(day => (
                                    <th key={day} className="border border-gray-200 p-2 bg-gray-50 text-sm font-semibold min-w-[140px]">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TIME_SLOTS.map((time, timeIdx) => (
                                <tr key={time} style={{ height: '60px' }}>
                                    <td className="border border-gray-200 p-2 text-xs font-medium text-gray-600 bg-gray-50 sticky left-0 z-10">
                                        {time}
                                    </td>
                                    {DAYS.map(day => {
                                        const slot = getSlotAtPosition(day, time);
                                        const isOccupied = isSlotOccupied(day, time);

                                        return (
                                            <td
                                                key={`${day}-${time}`}
                                                className="border border-gray-200 p-1 align-top relative"
                                                onDragOver={handleDragOver}
                                                onDrop={() => handleDrop(day, time)}
                                            >
                                                {slot && (
                                                    <div
                                                        draggable
                                                        onDragStart={() => handleDragStart(slot)}
                                                        className="absolute inset-1 cursor-move group"
                                                        style={{
                                                            height: `calc(${getSlotHeight(slot.startTime, slot.endTime) * 60}px - 8px)`,
                                                            backgroundColor: slot.color,
                                                            zIndex: 5,
                                                        }}
                                                    >
                                                        <Card className="h-full p-2 text-white text-xs font-medium border-0 rounded-lg shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor: slot.color }}>
                                                            <div className="flex flex-col h-full">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div className="font-bold text-sm">{slot.subject}</div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteSlot(slot.id);
                                                                        }}
                                                                        className="opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-opacity"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                                <div className="text-[10px] opacity-90 uppercase">{slot.type}</div>
                                                                <div className="text-[11px] opacity-90 mt-auto">
                                                                    {slot.startTime} - {slot.endTime}
                                                                </div>
                                                                {slot.room && <div className="text-[10px] opacity-80">{slot.room}</div>}
                                                            </div>
                                                        </Card>
                                                    </div>
                                                )}
                                                {!isOccupied && (
                                                    <div className="h-full flex items-center justify-center text-gray-300 hover:bg-gray-50 transition-colors">
                                                        <span className="text-xs">+</span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>Drag blocks to reschedule</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        <span>Hover to delete</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Blocks automatically span multiple hours</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
