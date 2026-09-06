-- ============================================================================
-- SQUIBL DATABASE SCHEMA MIGRATION (SUPABASE / POSTGRESQL)
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TABLES DEFINITION
-- ============================================================================

-- ─── 2.1 BUILDER PROFILES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.builder_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    role TEXT,
    location TEXT,
    skills TEXT[] DEFAULT '{}',
    stack TEXT[] DEFAULT '{}',
    experience_level TEXT DEFAULT 'Mid',
    looking_for TEXT[] DEFAULT '{}',
    availability TEXT DEFAULT 'Open to collab',
    github_url TEXT,
    twitter_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_builder_profiles_updated_at
BEFORE UPDATE ON public.builder_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user sign-up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_username TEXT;
    clean_username TEXT;
    base_username TEXT;
    final_username TEXT;
    counter INT := 0;
BEGIN
    raw_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'user_name',
        split_part(NEW.email, '@', 1)
    );
    
    clean_username := lower(regexp_replace(raw_username, '[^a-zA-Z0-9_]', '', 'g'));
    IF length(clean_username) < 3 THEN
        clean_username := 'builder_' || substr(NEW.id::text, 1, 6);
    END IF;

    base_username := clean_username;
    final_username := base_username;

    -- Ensure unique username
    WHILE EXISTS (SELECT 1 FROM public.builder_profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || counter::text;
    END LOOP;

    INSERT INTO public.builder_profiles (
        id,
        email,
        full_name,
        username,
        avatar_url,
        bio,
        onboarding_completed,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        final_username,
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
        ),
        COALESCE(NEW.raw_user_meta_data->>'bio', ''),
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile upon auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── 2.2 CONNECTIONS (FOLLOWS) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT connections_no_self_follow CHECK (follower_id <> following_id),
    CONSTRAINT connections_unique_pair UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_follower ON public.connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_connections_following ON public.connections(following_id);


-- ─── 2.3 POSTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_avatar TEXT,
    author_username TEXT,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
    stack_tags TEXT[] DEFAULT '{}',
    post_type TEXT NOT NULL DEFAULT 'update' CHECK (post_type IN ('update', 'looking_for', 'build_log')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'collabs')),
    project TEXT,
    media_url TEXT,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_uid ON public.posts(uid);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ─── 2.4 POST LIKES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT post_likes_unique_user_post UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);


-- ─── 2.5 POST COMMENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_avatar TEXT,
    author_username TEXT,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_created ON public.post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON public.post_comments(author_uid);


-- ─── 2.6 PROJECTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) > 0),
    tagline TEXT,
    description TEXT,
    stack TEXT[] DEFAULT '{}',
    team TEXT[] DEFAULT '{}',
    github_url TEXT,
    live_url TEXT,
    status TEXT NOT NULL DEFAULT 'BETA' CHECK (status IN ('SHIPPED', 'LIVE', 'BETA', 'OPEN SOURCE')),
    author_name TEXT,
    author_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_uid ON public.projects(owner_uid);
CREATE INDEX IF NOT EXISTS idx_projects_created_at_desc ON public.projects(created_at DESC);

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ─── 2.7 PROJECT LIKES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT project_likes_unique_user_project UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON public.project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON public.project_likes(user_id);


-- ─── 2.8 CONVERSATIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_message TEXT DEFAULT '',
    last_message_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON public.conversations(last_message_time DESC);

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ─── 2.9 CONVERSATION PARTICIPANTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0 CHECK (unread_count >= 0),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT conversation_participants_unique UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);


-- ─── 2.10 MESSAGES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
    read BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);


-- ─── 2.11 NOTIFICATIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_name TEXT NOT NULL,
    actor_avatar TEXT,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
    target_id TEXT,
    content TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT notifications_no_self CHECK (user_id <> actor_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);


-- ─── 2.12 SPACES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    dot_color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spaces_created_by ON public.spaces(created_by, created_at DESC);


-- ─── 2.13 AUTH EVENTS (SECURITY AUDIT) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event TEXT NOT NULL,
    method TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user ON public.auth_events(user_id, created_at DESC);


-- ─── 2.14 APP WAITLIST ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'both')),
    referred_by TEXT,
    position SERIAL NOT NULL,
    ref_code TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_waitlist_email ON public.app_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_app_waitlist_position ON public.app_waitlist(position ASC);


-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_waitlist ENABLE ROW LEVEL SECURITY;

-- ─── 3.1 BUILDER PROFILES POLICIES ──────────────────────────────────────────
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.builder_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.builder_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.builder_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- ─── 3.2 CONNECTIONS POLICIES ───────────────────────────────────────────────
CREATE POLICY "Authenticated users can view connections"
ON public.connections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can follow others"
ON public.connections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

CREATE POLICY "Users can unfollow others"
ON public.connections FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);


-- ─── 3.3 POSTS POLICIES ─────────────────────────────────────────────────────
CREATE POLICY "Posts are viewable by everyone"
ON public.posts FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE
TO authenticated
USING (auth.uid() = uid)
WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
TO authenticated
USING (auth.uid() = uid);


-- ─── 3.4 POST LIKES POLICIES ────────────────────────────────────────────────
CREATE POLICY "Post likes are viewable by everyone"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like posts"
ON public.post_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ─── 3.5 POST COMMENTS POLICIES ─────────────────────────────────────────────
CREATE POLICY "Post comments are viewable by everyone"
ON public.post_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add comments"
ON public.post_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_uid);

CREATE POLICY "Authors or post owners can delete comments"
ON public.post_comments FOR DELETE
TO authenticated
USING (
    auth.uid() = author_uid OR 
    EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_comments.post_id AND posts.uid = auth.uid())
);


-- ─── 3.6 PROJECTS POLICIES ──────────────────────────────────────────────────
CREATE POLICY "Projects are viewable by everyone"
ON public.projects FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE
TO authenticated
USING (auth.uid() = owner_uid)
WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = owner_uid);


-- ─── 3.7 PROJECT LIKES POLICIES ─────────────────────────────────────────────
CREATE POLICY "Project likes are viewable by everyone"
ON public.project_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like projects"
ON public.project_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike projects"
ON public.project_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ─── 3.8 CONVERSATIONS & PARTICIPANTS POLICIES ──────────────────────────────
CREATE POLICY "Users can view conversations they are part of"
ON public.conversations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own participant record"
ON public.conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ─── 3.9 MESSAGES POLICIES ──────────────────────────────────────────────────
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Participants can update messages (e.g. reactions, read status)"
ON public.messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
);


-- ─── 3.10 NOTIFICATIONS POLICIES ────────────────────────────────────────────
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications for others"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = actor_id AND user_id <> actor_id);

CREATE POLICY "Users can mark their own notifications as read"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ─── 3.11 SPACES POLICIES ───────────────────────────────────────────────────
CREATE POLICY "Authenticated users can view spaces"
ON public.spaces FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create spaces"
ON public.spaces FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own spaces"
ON public.spaces FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own spaces"
ON public.spaces FOR DELETE
TO authenticated
USING (auth.uid() = created_by);


-- ─── 3.12 AUTH EVENTS POLICIES ──────────────────────────────────────────────
CREATE POLICY "Users can view their own auth events"
ON public.auth_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert auth events"
ON public.auth_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- ─── 3.13 APP WAITLIST POLICIES ─────────────────────────────────────────────
CREATE POLICY "Anyone can view waitlist count"
ON public.app_waitlist FOR SELECT
USING (true);

CREATE POLICY "Anyone can join waitlist"
ON public.app_waitlist FOR INSERT
WITH CHECK (true);


-- ============================================================================
-- 4. REALTIME CONFIGURATION
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
    END IF;
END $$;


-- ============================================================================
-- 5. STORAGE BUCKETS & STORAGE POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Post media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'post-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'post-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
