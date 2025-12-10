'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import { profileService } from '@/lib/services/profileService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/AvatarUpload';
import { Loader2, Save, X, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
    });

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            // Try to get profile from profiles table first
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();

            if (data) {
                setProfile(data);
                setFormData({
                    full_name: (data as any).full_name || '',
                    bio: (data as any).bio || '',
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name || null,
                    bio: formData.bio || null,
                    updated_at: new Date().toISOString(),
                } as any)
                .eq('id', user!.id)
                .select()
                .single();

            if (error) throw error;

            setProfile(data);
            setEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error('Failed to update profile');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            full_name: profile?.full_name || '',
            bio: profile?.bio || '',
        });
        setEditing(false);
    };

    const handleAvatarUpload = (url: string) => {
        setProfile({ ...profile, avatar_url: url });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Profile
                </h1>
                <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Avatar Section */}
                <Card className="p-6 md:col-span-1">
                    <AvatarUpload
                        currentAvatarUrl={profile?.avatar_url}
                        userEmail={user?.email || ''}
                        onUploadComplete={handleAvatarUpload}
                    />
                </Card>

                {/* Profile Information */}
                <Card className="p-6 md:col-span-2">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

                            {/* Email (read-only) */}
                            <div className="mb-4">
                                <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </Label>
                                <Input
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-gray-50 dark:bg-gray-900"
                                />
                            </div>

                            {/* Full Name */}
                            <div className="mb-4">
                                <Label className="text-sm font-medium mb-2 block">Full Name</Label>
                                <Input
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    disabled={!editing}
                                    placeholder="Enter your full name"
                                    className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''}
                                />
                            </div>

                            {/* Bio */}
                            <div className="mb-4">
                                <Label className="text-sm font-medium mb-2 block">Bio</Label>
                                <Textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    disabled={!editing}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    maxLength={500}
                                    className={!editing ? 'bg-gray-50 dark:bg-gray-900' : ''}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.bio.length}/500 characters
                                </p>
                            </div>

                            {/* Member Since */}
                            <div className="mb-4">
                                <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Calendar className="h-4 w-4" />
                                    Member Since
                                </Label>
                                <Input
                                    value={profile?.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : 'N/A'}
                                    disabled
                                    className="bg-gray-50 dark:bg-gray-900"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t">
                            {!editing ? (
                                <Button
                                    onClick={() => setEditing(true)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                                >
                                    Edit Profile
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                                        <X className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
