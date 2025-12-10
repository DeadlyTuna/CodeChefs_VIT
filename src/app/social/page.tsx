'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function SocialPage() {
    const features = [
        {
            title: 'Friends',
            description: 'Connect with classmates and study partners',
            icon: UserPlus,
            href: '/social/friends',
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'from-blue-50 to-indigo-50',
        },
        {
            title: 'Study Groups',
            description: 'Join or create collaborative study groups',
            icon: Users,
            href: '/social/groups',
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-50 to-pink-50',
        },
        {
            title: 'Leaderboard',
            description: 'See how you rank among peers',
            icon: Trophy,
            href: '/social/leaderboard',
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'from-yellow-50 to-orange-50',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="container mx-auto p-6 max-w-7xl">
                <div className="mb-12 text-center">
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Social Hub
                        </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        Connect, collaborate, and compete with fellow students
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <Link key={feature.title} href={feature.href}>
                            <Card
                                className={`p-8 hover:shadow-2xl transition-all cursor-pointer border-2 hover:border-transparent h-full bg-gradient-to-br ${feature.bgColor} dark:from-gray-800 dark:to-gray-700 dark:border-gray-600`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-4`}>
                                        <feature.icon className="h-10 w-10 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 dark:text-white">{feature.title}</h2>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                                    <Button variant="ghost" className="mt-auto">
                                        Explore →
                                    </Button>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>

                <div className="mt-12">
                    <Card className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-200 dark:border-purple-800">
                        <h3 className="text-lg font-semibold mb-2 dark:text-white">🎯 Coming Soon</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                            Profile pages, friend requests, study group chat, and leaderboard competitions are being finalized!
                            Database schemas and services are ready to go.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
