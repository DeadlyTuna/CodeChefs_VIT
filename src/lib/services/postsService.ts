import { supabase } from '../supabase/client';

export interface Post {
    id: string;
    user_id: string;
    content: string;
    image_url?: string;
    created_at: string;
    updated_at: string;
    user_email?: string;
    likes_count?: number;
    comments_count?: number;
    is_liked?: boolean;
}

export interface PostComment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user_email?: string;
}

class PostsService {
    // Get all posts with user info, likes count, and comments count
    async getPosts(userId: string) {
        try {
            // First, get all posts
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (postsError) {
                console.error('Supabase error fetching posts:', postsError);
                return [];
            }

            if (!posts || posts.length === 0) {
                return [];
            }

            // Get user emails from auth.users via profiles or directly
            const userIds = [...new Set(posts.map(p => p.user_id))];

            // Get likes count for each post
            const { data: likesData } = await supabase
                .from('post_likes')
                .select('post_id');

            const likesCounts = likesData?.reduce((acc: any, like: any) => {
                acc[like.post_id] = (acc[like.post_id] || 0) + 1;
                return acc;
            }, {}) || {};

            // Get comments count for each post
            const { data: commentsData } = await supabase
                .from('post_comments')
                .select('post_id');

            const commentsCounts = commentsData?.reduce((acc: any, comment: any) => {
                acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
                return acc;
            }, {}) || {};

            // Check which posts the current user has liked
            const { data: userLikes } = await supabase
                .from('post_likes')
                .select('post_id')
                .eq('user_id', userId);

            const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);

            // Get user data
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            return posts.map(post => ({
                id: post.id,
                user_id: post.user_id,
                content: post.content,
                image_url: post.image_url,
                created_at: post.created_at,
                updated_at: post.updated_at,
                user_email: post.user_id === currentUser?.id ? currentUser.email! : 'User',
                likes_count: likesCounts[post.id] || 0,
                comments_count: commentsCounts[post.id] || 0,
                is_liked: likedPostIds.has(post.id),
            }));
        } catch (error) {
            console.error('Exception fetching posts:', error);
            return [];
        }
    }

    // Create a new post
    async createPost(userId: string, content: string, imageUrl?: string) {
        const { data, error } = await supabase
            .from('posts')
            .insert({
                user_id: userId,
                content,
                image_url: imageUrl,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete a post
    async deletePost(postId: string) {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
    }

    // Like a post
    async likePost(postId: string, userId: string) {
        const { error } = await supabase
            .from('post_likes')
            .insert({
                post_id: postId,
                user_id: userId,
            });

        if (error) throw error;
    }

    // Unlike a post
    async unlikePost(postId: string, userId: string) {
        const { error } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    // Get comments for a post
    async getComments(postId: string) {
        const { data, error } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data?.map(comment => ({
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.content,
            created_at: comment.created_at,
            user_email: 'User',
        })) || [];
    }

    // Add a comment to a post
    async addComment(postId: string, userId: string, content: string) {
        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: userId,
                content,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Delete a comment
    async deleteComment(commentId: string) {
        const { error } = await supabase
            .from('post_comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
    }

    // Subscribe to new posts
    subscribeToNewPosts(callback: (post: any) => void) {
        const channel = supabase
            .channel('posts-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'posts' },
                (payload) => callback(payload.new)
            )
            .subscribe();

        return channel;
    }
}

export const postsService = new PostsService();
