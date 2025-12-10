import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type KeyboardShortcut = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
                const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.alt ? event.altKey : !event.altKey;
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

export function useGlobalShortcuts() {
    const router = useRouter();

    const shortcuts: KeyboardShortcut[] = [
        {
            key: 'k',
            ctrl: true,
            description: 'Search / Command Palette',
            action: () => {
                // TODO: Open command palette
                console.log('Command palette');
            },
        },
        {
            key: 'n',
            ctrl: true,
            description: 'New Note',
            action: () => router.push('/notes'),
        },
        {
            key: 'n',
            ctrl: true,
            shift: true,
            description: 'New Assignment',
            action: () => router.push('/planner/assignments'),
        },
        {
            key: 'h',
            ctrl: true,
            description: 'Go to Dashboard',
            action: () => router.push('/dashboard'),
        },
        {
            key: 'c',
            ctrl: true,
            shift: true,
            description: 'Go to Chat',
            action: () => router.push('/chat'),
        },
        {
            key: 'a',
            ctrl: true,
            shift: true,
            description: 'Go to Analytics',
            action: () => router.push('/analytics'),
        },
    ];

    useKeyboardShortcuts(shortcuts);

    return shortcuts;
}
