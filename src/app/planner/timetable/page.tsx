'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, GripVertical, X } from 'lucide-react';
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

function DraggableTimeSlot({ slot }: { slot: TimeSlot }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative group"
        >
            <Card
                className="p-2 text-white text-xs font-medium cursor-move hover:shadow-lg transition-all"
                style={{ backgroundColor: slot.color }}
            >
                <div {...attributes} {...listeners} className="flex items-start gap-1">
                    <GripVertical className="h-3 w-3 opacity-70 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{slot.subject}</div>
                        <div className="text-[10px] opacity-90">{slot.type.toUpperCase()}</div>
                        <div className="text-[10px] opacity-80">{slot.startTime}-{slot.endTime}</div>
                        {slot.room && <div className="text-[10px] opacity-80">{slot.room}</div>}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function TimetablePage() {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
        {
            id: '1',
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            subject: 'Data Structures',
            type: 'theory',
            room: 'Room 101',
            color: COLORS[8],
        },
        {
            id: '2',
            day: 'Monday',
            startTime: '10:00',
            endTime: '11:00',
            subject: 'Algorithms Lab',
            type: 'lab',
            room: 'Lab 1',
            color: COLORS[2],
        },
    ]);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [newSlot, setNewSlot] = useState({
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        subject: '',
        type: 'theory' as 'theory' | 'lab',
        room: '',
        color: COLORS[0],
    });

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        // Implement drag logic if needed for reordering
    };

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

    const getSlotForDayAndTime = (day: string, time: string) => {
        return timeSlots.filter(slot => {
            const slotStart = parseInt(slot.startTime.split(':')[0]);
            const slotEnd = parseInt(slot.endTime.split(':')[0]);
            const currentTime = parseInt(time.split(':')[0]);
            return slot.day === day && currentTime >= slotStart && currentTime < slotEnd;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/50 to-red-50/50 p-6">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/planner">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                Weekly Timetable
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Drag and drop to organize your schedule</p>
                        </div>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-orange-600 to-red-600">
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

                {/* Timetable Grid */}
                <Card className="p-4 bg-white overflow-x-auto">
                    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-gray-200 p-2 bg-gray-50 text-sm font-semibold w-24 sticky left-0 z-10">
                                        Time
                                    </th>
                                    {DAYS.map(day => (
                                        <th key={day} className="border border-gray-200 p-2 bg-gray-50 text-sm font-semibold min-w-[120px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIME_SLOTS.map(time => (
                                    <tr key={time}>
                                        <td className="border border-gray-200 p-2 text-xs font-medium text-gray-600 bg-gray-50 sticky left-0 z-10">
                                            {time}
                                        </td>
                                        {DAYS.map(day => {
                                            const slots = getSlotForDayAndTime(day, time);
                                            return (
                                                <td key={`${day}-${time}`} className="border border-gray-200 p-1 align-top min-h-16 relative">
                                                    <SortableContext items={slots.map(s => s.id)} strategy={rectSortingStrategy}>
                                                        <div className="space-y-1">
                                                            {slots.map(slot => (
                                                                <div key={slot.id} className="relative group">
                                                                    <DraggableTimeSlot slot={slot} />
                                                                    <button
                                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DndContext>
                </Card>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4" />
                        <span>Drag to reorder</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        <span>Hover to delete</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
