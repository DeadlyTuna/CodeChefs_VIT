'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { analyticsService } from '@/lib/services/analyticsService';
import { plannerService } from '@/lib/services/plannerService';
import { useAuthStore } from '@/stores/authStore';

export function StudyTimeTracker() {
    const { user } = useAuthStore();
    const [isTracking, setIsTracking] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [subjects, setSubjects] = useState<any[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (user) {
            loadSubjects();
            checkActiveSession();
        }
    }, [user]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTracking) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking]);

    const loadSubjects = async () => {
        const { data } = await plannerService.getSubjects(user!.id);
        setSubjects(data || []);
    };

    const checkActiveSession = async () => {
        const activeSession = await analyticsService.getActiveStudySession(user!.id);
        if (activeSession) {
            setSessionId(activeSession.id);
            setIsTracking(true);
            setSelectedSubject(activeSession.subject_id || '');
            setNotes(activeSession.notes || '');

            // Calculate elapsed time
            const start = new Date(activeSession.start_time);
            const now = new Date();
            const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
            setElapsedTime(diff);
        }
    };

    const startTracking = async () => {
        try {
            const session = await analyticsService.startStudySession(
                user!.id,
                selectedSubject || undefined,
                notes
            );
            setSessionId(session.id);
            setIsTracking(true);
            setElapsedTime(0);
        } catch (error) {
            console.error('Error starting study session:', error);
        }
    };

    const pauseTracking = () => {
        setIsTracking(false);
    };

    const resumeTracking = () => {
        setIsTracking(true);
    };

    const stopTracking = async () => {
        if (sessionId) {
            try {
                await analyticsService.endStudySession(sessionId);
                setSessionId(null);
                setIsTracking(false);
                setElapsedTime(0);
                setNotes('');
            } catch (error) {
                console.error('Error ending study session:', error);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Study Time Tracker</h3>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Subject (Optional)</label>
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={isTracking}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                >
                    <option value="">No Subject</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                            {subject.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Notes (Optional)</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={sessionId !== null}
                    placeholder="What are you studying?"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50"
                    rows={2}
                />
            </div>

            <div className="flex items-center justify-center mb-6">
                <div className="text-6xl font-mono font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {formatTime(elapsedTime)}
                </div>
            </div>

            <div className="flex gap-2 justify-center">
                {!sessionId ? (
                    <Button onClick={startTracking} className="gap-2 bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4" />
                        Start
                    </Button>
                ) : (
                    <>
                        {isTracking ? (
                            <Button onClick={pauseTracking} variant="outline" className="gap-2">
                                <Pause className="h-4 w-4" />
                                Pause
                            </Button>
                        ) : (
                            <Button onClick={resumeTracking} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <Play className="h-4 w-4" />
                                Resume
                            </Button>
                        )}
                        <Button onClick={stopTracking} variant="destructive" className="gap-2">
                            <Square className="h-4 w-4" />
                            Stop
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}
