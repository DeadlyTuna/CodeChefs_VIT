'use client';

import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, BookOpen, Home, LogOut, User, Moon, Sun, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
    const { user } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    // Don't show navbar on auth pages
    if (pathname?.startsWith('/auth')) {
        return null;
    }

    const navItems = [
        { name: 'Dashboard', icon: Home, href: '/dashboard' },
        { name: 'Chat', icon: MessageSquare, href: '/chat' },
        { name: 'Notes', icon: FileText, href: '/notes' },
        { name: 'Planner', icon: BookOpen, href: '/planner' },
        { name: 'Analytics', icon: BarChart3, href: '/analytics' },
        { name: 'Social', icon: Users, href: '/social' },
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">UA</span>
                        </div>
                        <span className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Unified App
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            return (
                                <Link key={item.name} href={item.href}>
                                    <Button
                                        variant={isActive ? 'default' : 'ghost'}
                                        className={`gap-2 ${isActive
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side Icons */}
                    <div className="flex items-center gap-2">
                        {/* Dark Mode Toggle */}
                        {mounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="rounded-full"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                            </Button>
                        )}

                        {/* User Menu */}
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <User className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span className="font-medium">My Account</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">{user.email}</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link key={item.name} href={item.href}>
                                <Button
                                    variant={isActive ? 'default' : 'ghost'}
                                    size="sm"
                                    className={`gap-2 whitespace-nowrap ${isActive
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <item.icon className="h-3 w-3" />
                                    {item.name}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
