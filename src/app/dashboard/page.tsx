'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { plannerService } from '@/lib/services/plannerService';
import { notesService } from '@/lib/services/notesService';
import { chatService } from '@/lib/services/chatService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, BookOpen, CheckCircle, Calendar, ClipboardList, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        notes: 0,
        subjects: 0,
        upcomingAssignments: 0,
        conversations: 0,
    });

    useEffect(() => {
        if (user) {
            loadStats();
        }
    }, [user]);

    const loadStats = async () => {
        const [notesData, subjectsData, assignmentsData, conversationsData] = await Promise.all([
            notesService.getNotes(user!.id),
            plannerService.getSubjects(user!.id),
            plannerService.getAssignments(user!.id),
            chatService.getConversations(user!.id),
        ]);

        setStats({
            notes: notesData.length,
            subjects: subjectsData.data?.length || 0,
            upcomingAssignments: assignmentsData.data?.filter((a: any) => !a.completed).length || 0,
            conversations: conversationsData.data?.length || 0,
        });
    };

    const apps = [
        {
            name: 'Chat',
            description: 'Real-time messaging',
            icon: MessageSquare,
            href: '/chat',
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'from-blue-50 to-indigo-50',
            count: stats.conversations,
            countLabel: 'conversations',
            task: 'Task 1',
        },
        {
            name: 'Notes',
            description: 'Offline-first notes',
            icon: FileText,
            href: '/notes',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-50 to-pink-50',
            count: stats.notes,
            countLabel: 'notes',
            task: 'Task 2',
        },
        {
            name: 'Planner',
            description: 'University organization',
            icon: BookOpen,
            href: '/planner',
            color: 'from-green-500 to-teal-500',
            bgColor: 'from-green-50 to-teal-50',
            count: stats.subjects,
            countLabel: 'subjects',
            task: 'Task 3',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="container mx-auto p-6 max-w-7xl">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Unified App
                        </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Your all-in-one platform for chat, notes, and university planning
                    </p>
                </div>

                {/* Main Apps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {apps.map((app) => (
                        <Link key={app.name} href={app.href}>
                            <Card className={`p-6 hover:shadow-2xl transition-all cursor-pointer border-2 hover:border-transparent h-full bg-gradient-to-br ${app.bgColor} dark:from-gray-800 dark:to-gray-700 dark:border-gray-600`}>
                                <div className="flex flex-col items-center text-center">
                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{app.task}</div>
                                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${app.color} mb-4`}>
                                        <app.icon className="h-10 w-10 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 dark:text-white">{app.name}</h2>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">{app.description}</p>
                                    <div className="text-3xl font-bold bg-gradient-to-r ${app.color} bg-clip-text text-transparent mb-1">
                                        {app.count}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{app.countLabel}</p>
                                    <Button variant="ghost" className="mt-4 gap-2 dark:text-gray-200">
                                        Open <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.upcomingAssignments}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Assignments</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.subjects}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Active Subjects</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.notes}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Notes</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Built with Next.js, Supabase, and shadcn/ui</p>
                </div>
            </div>
        </div>
    );
}
