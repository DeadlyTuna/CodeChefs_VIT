# Unified App 🚀

A beautiful all-in-one platform combining **Chat**, **Notes**, and **University Planner** into a single, seamless experience. Built with modern web technologies and designed for students.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CN-38B2AC?logo=tailwind-css)

## ✨ Features

### 🔵 Chat Application
- **Real-time Messaging**: Instant message delivery with Supabase Realtime
- **Beautiful UI**: Modern chat interface with gradient message bubbles
- **Conversation Management**: Create and manage multiple conversations
- **Message History**: Persistent chat history

### 🟣 Notes Application (Offline-First)
- **Work Offline**: Create and edit notes without internet connection
- **Auto Sync**: Automatic synchronization when back online
- **Smart Search**: Search notes by title, content, or tags
- **Tag Organization**: Organize notes with custom tags
- **IndexedDB Storage**: Local storage using Dexie.js

### 🟢 University Planner
- **Subject Management**: Track all your courses with color coding
- **Attendance Tracker**: Mark attendance with real-time statistics
- **Assignment Manager**: Track assignments with deadlines
- **Dashboard Statistics**: Visual overview of your academic progress

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Authentication**: Supabase Auth
- **Offline Storage**: Dexie.js (IndexedDB)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from the setup guide artifact
   - Enable Realtime for chat tables

3. **Configure environment variables**:
   Create `.env.local` in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Detailed Setup

For detailed setup instructions including database schema, see the setup guide artifact.

## 🎯 Usage

### Getting Started
1. **Create Account**: Sign up with your email
2. **Verify Email**: Check your inbox for verification link
3. **Login**: Access your personalized dashboard

### Using the Apps

#### Chat
- Click on Chat from the dashboard
- Create a new conversation
- Send messages in real-time
- Messages are persisted in the database

#### Notes
- Access Notes from the dashboard
- Create notes that work offline
- Add tags for organization
- Use search to find notes quickly
- Notes automatically sync when online

#### Planner
1. **Subjects**: Add your courses with codes and professors
2. **Attendance**: Mark daily attendance and track percentages
3. **Assignments**: Add assignments with deadlines and descriptions

## 🏗️ Project Structure

```
unified-app/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── auth/               # Authentication pages
│   │   ├── chat/               # Chat application
│   │   ├── notes/              # Notes application
│   │   ├── planner/            # University planner
│   │   └── dashboard/          # Main dashboard
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── providers/          # Context providers
│   ├── lib/                    # Utilities and services
│   │   ├── supabase/           # Supabase client & types
│   │   ├── services/           # API service layers
│   │   └── offline/            # Offline storage
│   └── stores/                 # Zustand state stores
└── public/                     # Static assets
```

## 🎨 Design Principles

- **Beautiful Gradients**: Premium look with vibrant color gradients
- **Responsive Design**: Works perfectly on mobile and desktop
- **Consistent UI**: Unified design language across all apps
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Optimized bundle size and lazy loading

## 🔐 Security

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Secure email/password with Supabase Auth
- **Environment Variables**: Sensitive data in .env files
- **Client-side Validation**: Form validation with Zod

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy automatically

---

Built with ❤️ for students
