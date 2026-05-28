# FORGE - Employee Training Platform

A modern, AI-powered training platform built with Next.js, TypeScript, and Tailwind CSS. FORGE provides comprehensive course management, interactive lessons, AI-assisted learning, and robust admin controls.

## Features

### For Trainees
- **Dashboard**: Overview of enrolled courses, progress tracking, and personalized recommendations
- **Course Catalog**: Browse and search available training courses by category
- **Structured Learning**: Navigate through modules → lessons → quizzes progression
- **Interactive Lessons**: Video content, reading materials, and downloadable resources
- **Quizzes & Exams**: Timed assessments with instant feedback and score tracking
- **AI Assistant**: Chat with AI for course-related questions and learning support
- **Progress Tracking**: Real-time progress visualization and completion rates
- **Notes & Bookmarks**: Save notes during lessons for future reference

### For Course Admins
- **Course Management**: Create, edit, and publish training courses
- **Module & Lesson Builder**: Organize content into modules and lessons
- **Quiz Designer**: Create interactive quizzes and exams with multiple question types
- **Course Analytics**: Track student enrollment, completion rates, and performance
- **Content Management**: Manage course metadata, descriptions, and categories

### For Platform Admins
- **User Management**: View all users, manage roles, and ban users if needed
- **Moderation Dashboard**: Handle reports and maintain platform integrity
- **Analytics Dashboard**: System-wide insights into platform health and usage
- **Settings**: Configure platform-level features and maintenance

## Demo Credentials

Test the platform with these demo accounts:

```
Trainee:
- Email: trainee@forge.com
- Password: any password (demo mode)

Course Admin:
- Email: admin@forge.com
- Password: any password (demo mode)

Platform Admin:
- Email: platform@forge.com
- Password: any password (demo mode)
```

## Project Structure

```
app/
├── layout.tsx                           # Root layout with auth provider
├── page.tsx                             # Landing page
├── auth/
│   ├── login/page.tsx                   # Login page
│   └── signup/page.tsx                  # Signup page
├── dashboard/page.tsx                   # Trainee dashboard
├── courses/
│   ├── page.tsx                         # Course catalog
│   └── [courseId]/
│       ├── page.tsx                     # Course detail with modules
│       └── [moduleId]/[lessonId]/
│           └── page.tsx                 # Lesson view with video & notes
├── quiz/
│   └── [quizId]/page.tsx               # Interactive quiz interface
├── admin/
│   ├── courses/page.tsx                 # Course admin panel
│   └── platform/page.tsx                # Platform admin panel
└── settings/page.tsx                    # User settings

components/
├── layout/
│   ├── Navbar.tsx                       # Navigation bar
│   ├── AIChat.tsx                       # AI chat widget
├── ProtectedRoute.tsx                   # Authentication guard
└── ui/                                  # shadcn components

lib/
├── types.ts                             # TypeScript interfaces
├── mock-data.ts                         # Demo data
├── auth-context.tsx                     # Auth state management
└── utils.ts                             # Utility functions
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **State Management**: React Context + custom hooks
- **Authentication**: Mock auth context (ready for Auth.js integration)
- **Database**: Mock data (ready for Supabase integration)
- **AI**: Mock AI responses (ready for OpenAI integration)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Navigate as a Trainee
1. Go to `/auth/login` and use trainee credentials
2. View your enrolled courses on the dashboard
3. Explore the course catalog and enroll in courses
4. Complete lessons, take quizzes, and track progress
5. Use the AI chat widget for learning support

### Manage Courses (Course Admin)
1. Login with course admin credentials
2. Navigate to `/admin/courses`
3. Create new courses, add modules and lessons
4. View course analytics and enrollment data
5. Publish or draft courses

### Administer Platform (Platform Admin)
1. Login with platform admin credentials
2. Navigate to `/admin/platform`
3. Manage all users and ban if needed
4. View system analytics and health metrics
5. Configure platform settings

## Integration Points

### Authentication
Currently uses mock auth context. To integrate with production:
- Replace `lib/auth-context.tsx` with Auth.js
- Update environment variables for your auth provider
- Implement proper password hashing and session management

### Database
Currently uses mock data. To integrate with Supabase or other databases:
- Update `lib/mock-data.ts` with database queries
- Implement API routes in `app/api/`
- Use database client library (e.g., `@supabase/supabase-js`)

### AI Integration
Currently uses mock AI responses. To integrate with OpenAI:
- Update `components/layout/AIChat.tsx` with OpenAI API calls
- Add OpenAI API key to environment variables
- Implement context-aware prompting with course content

## Key Features Implementation

### Protected Routes
Routes are protected using the `ProtectedRoute` component which:
- Checks if user is authenticated
- Verifies user role for admin pages
- Redirects to login if not authenticated

### Real-time Progress
Progress is tracked and displayed in:
- Dashboard progress cards
- Course detail sidebar
- Lesson progress indicators

### Quiz System
Features include:
- Multiple question types (multiple choice, true/false, short answer)
- Timed exams with countdown
- Instant score calculation
- Question navigator
- Answer review after submission

## Customization

### Theming
Colors and styling are configured in `app/globals.css` using CSS variables. Modify the `--color-*` and other theme variables to customize the appearance.

### Mock Data
Edit `lib/mock-data.ts` to change:
- Demo users and courses
- Module and lesson content
- Quiz questions
- User progress data

### API Endpoints
Add new API endpoints in `app/api/` following Next.js conventions:
- `app/api/courses/route.ts` → `/api/courses`
- `app/api/quiz/submit/route.ts` → `/api/quiz/submit`

## Performance Optimizations

- Server-side rendering for main pages
- Client-side data fetching with proper loading states
- Optimized image loading with next/image
- CSS-in-JS with Tailwind for minimal bundle size
- Code splitting with dynamic imports

## Security Considerations

When deploying to production, ensure:
- Implement proper authentication (Auth.js, Firebase Auth, etc.)
- Use HTTPS for all communications
- Validate and sanitize all user inputs
- Implement rate limiting on API endpoints
- Set up proper CORS policies
- Use environment variables for sensitive data
- Implement Row-Level Security (RLS) if using Supabase

## Common Issues & Solutions

### Quiz Timer Not Working
- Clear browser cache and refresh
- Check browser console for errors
- Ensure JavaScript is enabled

### AI Chat Not Responding
- Currently uses mock responses
- To enable real AI, implement OpenAI integration
- Check API key and usage limits

### Courses Not Loading
- Verify mock data is properly imported
- Check browser Network tab for API errors
- Ensure authentication is working

## Future Enhancements

- [ ] Connect to real database (Supabase)
- [ ] Implement real OpenAI integration
- [ ] Add email notifications
- [ ] Support for video uploads
- [ ] Certificate generation
- [ ] Advanced analytics dashboard
- [ ] Team/department management
- [ ] Gamification (badges, leaderboards)
- [ ] Mobile app with React Native
- [ ] Video conferencing for live sessions

## Support & Contributions

For issues or questions:
1. Check existing documentation
2. Review the code comments
3. Test with demo credentials first
4. Check the browser console for errors

## License

This project is provided as-is for training and demonstration purposes.

---

**FORGE** - Master Your Skills Through Intelligent Training
