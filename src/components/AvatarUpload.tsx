'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userEmail: string;
    onUploadComplete: (url: string) => void;
    onUploadStart?: () => void;
}

export function AvatarUpload({ currentAvatarUrl, userEmail, onUploadComplete, onUploadStart }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be less than 2MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        setUploading(true);
        onUploadStart?.();

        try {
            // In a real implementation, this would upload to your profile service
            // For now, we'll simulate the upload
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Call the onUploadComplete with the preview URL
            // In production, this would be the actual uploaded URL from Supabase
            onUploadComplete(preview!);
            toast.success('Avatar uploaded successfully!');
            setPreview(null);
        } catch (error) {
            toast.error('Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getInitials = () => {
        return userEmail.split('@')[0].substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-gray-200 dark:border-gray-700">
                    <AvatarImage src={preview || currentAvatarUrl || undefined} alt="Profile" />
                    <AvatarFallback className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {getInitials()}
                    </AvatarFallback>
                </Avatar>

                {!preview && (
                    <Button
                        size="icon"
                        variant="outline"
                        className="absolute bottom-0 right-0 rounded-full h-10 w-10 border-2 bg-white dark:bg-gray-900"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {preview && (
                <div className="flex gap-2">
                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Save Avatar'
                        )}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={uploading}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
}
