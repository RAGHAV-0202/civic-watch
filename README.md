# CivicWatch - Community Safety Reporting Platform
React TypeScript Supabase

https://civicwatch.netlify.app/

A full-stack community safety reporting platform with real-time isssues mapping, administrative dashboard, and notification system, built with React, TypeScript, and Supabase.

🌟 Features

## Core Features

### User Authentication & Authorization
- Supabase Auth integration with email/password
- Role-based access control (User, Admin, Officer)
- Protected routes and middleware verification
- Anonymous reporting option

### Issues Reporting System
- Submit detailed Issue reports with location data
- Category-based Issue classification
- Anonymous and identified reporting options
- Report status tracking

### Interactive Crime Mapping
- Real-time crime visualization with Leaflet maps
- Location-based report clustering
- Interactive markers with detailed report information
- Administrative map view for officers

### Administrative Dashboard
- Comprehensive admin panel with analytics
- Report management and status updates
- User management tools
- Flag management system for inappropriate content

## Technical Features
- Real-time data synchronization
- Optimistic UI updates
- Error handling and loading states
- SEO-optimized routing

🛠️ Tech Stack

## Frontend
- **React 18** - Frontend library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Leaflet** - Interactive maps

## Backend & Infrastructure
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Row Level Security (RLS)** - Database security
- **Supabase Auth** - Authentication system
- **Supabase Storage** - File storage
- **Supabase Edge Functions** - Serverless functions
- **Resend** - Email delivery service

## Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript** - Static type checking

📋 Database Schema

### Core Tables
```sql
-- User profiles
profiles (id, user_id, full_name, avatar_url, created_at, updated_at)

-- Crime reports
crime_reports (id, user_id, title, description, location, status, category_id, is_anonymous, created_at, updated_at)

-- Crime categories
crime_categories (id, name, description, icon, color)

-- Report flags
report_flags (id, report_id, user_id, reason, status, created_at)
```

### Key Features
- Row Level Security (RLS) policies for data protection
- Automated timestamp triggers
- Geographic data support for location mapping
- File storage integration for evidence uploads

🚀 Installation & Setup

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

## Supabase Setup

1. **Create a new Supabase project**
   - Visit [supabase.com](https://supabase.com)
   - Create a new project
   - Save your project URL and API keys

2. **Run database migrations**
```bash
npx supabase db reset
```

3. **Deploy Edge Functions**
```bash
npx supabase functions deploy send-status-notification
```

4. **Configure Environment Variables**

In your Supabase dashboard, add the following environment variables:
```
RESEND_API_KEY=your_resend_api_key
```

## Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add the API key to your Supabase Edge Function environment variables

📁 Project Structure

```
crimewatch/
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthForm.tsx
│   │   │   └── AuthPage.tsx
│   │   ├── layout/
│   │   │   └── Navbar.tsx
│   │   ├── map/
│   │   │   ├── AdminMap.tsx
│   │   │   ├── CrimeMap.tsx
│   │   │   └── IssueMap.tsx
│   │   └── ui/
│   │       └── [shadcn components]
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── pages/
│   │   ├── AdminPage.tsx
│   │   ├── Index.tsx
│   │   ├── ProfilePage.tsx
│   │   └── ReportIssuePage.tsx
│   ├── types/
│   │   └── leaflet.d.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── supabase/
│   ├── functions/
│   │   └── send-status-notification/
│   │       └── index.ts
│   ├── migrations/
│   └── config.toml
│
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

🔧 Configuration

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint

# Supabase
npx supabase start   # Start local Supabase
npx supabase db reset # Reset database with migrations
npx supabase functions deploy # Deploy edge functions
```

## Environment Variables

```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Edge Functions (Supabase Dashboard)
RESEND_API_KEY=your_resend_api_key
```

🚦 Features Roadmap

- [ ] Real-time chat for community discussions
- [ ] Push notifications for mobile devices
- [ ] Advanced reporting analytics
- [ ] Integration with local law enforcement APIs
- [ ] Multi-language support
- [ ] Mobile app development



📧 Contact

Project Link: [GitHub](https://github.com/RAGHAV-0202/civic-watch))

🙏 Acknowledgements

- [React](https://reactjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Leaflet](https://leafletjs.com/)
- [Resend](https://resend.com/)
- [Vite](https://vitejs.dev/)
