'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { analyticsService, StudyStats, AttendanceStats, ProductivityInsights } from '@/lib/services/analyticsService';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { StudyTimeTracker } from '@/components/analytics/StudyTimeTracker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, Target, Flame, Trophy, BookOpen } from 'lucide-react';

export default function AnalyticsPage() {
    const { user } = useAuthStore();
    const [studyStats, setStudyStats] = useState<StudyStats | null>(null);
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
    const [assignmentStats, setAssignmentStats] = useState<any>(null);
    const [insights, setInsights] = useState<ProductivityInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(30);

    useEffect(() => {
        if (user) {
            loadAnalytics();
        }
    }, [user, selectedPeriod]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [study, attendance, assignments, productivityInsights] = await Promise.all([
                analyticsService.getStudyStats(user!.id, selectedPeriod),
                analyticsService.getAttendanceStats(user!.id),
                analyticsService.getAssignmentCompletionRate(user!.id, selectedPeriod),
                analyticsService.getProductivityInsights(user!.id),
            ]);

            setStudyStats(study);
            setAttendanceStats(attendance);
            setAssignmentStats(assignments);
            setInsights(productivityInsights);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg dark:text-white">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="container mx-auto p-6 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Analytics Dashboard
                        </span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">Track your study progress and productivity</p>
                </div>

                {/* Period Selector */}
                <div className="mb-6 flex gap-2">
                    {[7, 30, 90].map((days) => (
                        <Button
                            key={days}
                            variant={selectedPeriod === days ? 'default' : 'outline'}
                            onClick={() => setSelectedPeriod(days)}
                        >
                            Last {days} Days
                        </Button>
                    ))}
                </div>

                {/* Productivity Insights */}
                {insights && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                            <div className="flex items-center gap-3">
                                <Flame className="h-8 w-8 text-orange-500" />
                                <div>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{insights.streakDays}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                            <div className="flex items-center gap-3">
                                <Trophy className="h-8 w-8 text-purple-500" />
                                <div>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{insights.totalPoints}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">Level {insights.level}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Level</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                            <div className="flex items-center gap-3">
                                <Clock className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.weeklyProgress}m</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="study" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="study">Study Time</TabsTrigger>
                                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                            </TabsList>

                            <TabsContent value="study" className="space-y-6">
                                {studyStats && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="p-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Study Time</p>
                                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {Math.floor(studyStats.totalStudyTime / 60)}h {studyStats.totalStudyTime % 60}m
                                                </p>
                                            </Card>
                                            <Card className="p-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Session</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {Math.floor(studyStats.averageSessionTime)}m
                                                </p>
                                            </Card>
                                            <Card className="p-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sessions</p>
                                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                                    {studyStats.studySessionsCount}
                                                </p>
                                            </Card>
                                        </div>

                                        <AnalyticsChart
                                            data={studyStats.dailyStudyTime}
                                            type="bar"
                                            title="Daily Study Time (Minutes)"
                                            dataKey="minutes"
                                            xAxisKey="date"
                                        />

                                        {studyStats.topSubjects.length > 0 && (
                                            <AnalyticsChart
                                                data={studyStats.topSubjects}
                                                type="pie"
                                                title="Top Subjects by Study Time"
                                                dataKey="total_minutes"
                                                xAxisKey="subject_name"
                                            />
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="attendance" className="space-y-6">
                                {attendanceStats && (
                                    <>
                                        <Card className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold dark:text-white">Overall Attendance</h3>
                                                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                    {attendanceStats.attendanceRate.toFixed(1)}%
                                                </div>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                {attendanceStats.attendedClasses} / {attendanceStats.totalClasses} classes attended
                                            </p>
                                        </Card>

                                        {attendanceStats.bySubject.length > 0 && (
                                            <AnalyticsChart
                                                data={attendanceStats.bySubject}
                                                type="bar"
                                                title="Attendance by Subject (%)"
                                                dataKey="rate"
                                                xAxisKey="subject_name"
                                                colors={['#10B981']}
                                            />
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="assignments" className="space-y-6">
                                {assignmentStats && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="p-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {assignmentStats.total}
                                                </p>
                                            </Card>
                                            <Card className="p-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completed</p>
                                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                    {assignmentStats.completed}
                                                </p>
                                            </Card>
                                            <Card className="p-4">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending</p>
                                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                                    {assignmentStats.pending}
                                                </p>
                                            </Card>
                                        </div>

                                        <Card className="p-6">
                                            <h3 className="text-lg font-semibold mb-4 dark:text-white">Completion Rate</h3>
                                            <div className="relative pt-1">
                                                <div className="flex mb-2 items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                                            Progress
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-semibold inline-block text-green-600">
                                                            {assignmentStats.completionRate.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                                                    <div
                                                        style={{ width: `${assignmentStats.completionRate}%` }}
                                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                                    ></div>
                                                </div>
                                            </div>
                                        </Card>
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div>
                        <StudyTimeTracker />
                    </div>
                </div>

                {/* Achievements */}
                {insights && insights.topAchievements.length > 0 && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Top Achievements
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {insights.topAchievements.map((achievement, index) => (
                                <div
                                    key={index}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full text-sm font-medium dark:text-white"
                                >
                                    {achievement}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
