# FORGE Quick Start Guide

## What is FORGE?

FORGE is a **modern employee training platform** with:
- Interactive courses organized by modules, lessons, and quizzes
- AI-powered chat assistant for learning support
- Role-based access (trainees, course admins, platform admins)
- Real-time progress tracking
- Admin dashboards for course and platform management

## 🚀 Getting Started

### 1. **Start the Development Server**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### 2. **Login with Demo Account**
Go to the login page and use any of these accounts:
- **Trainee**: `trainee@forge.com` (any password)
- **Course Admin**: `admin@forge.com` (any password)
- **Platform Admin**: `platform@forge.com` (any password)

## 📚 What You Can Do

### As a Trainee
✓ View your dashboard with enrolled courses  
✓ Browse course catalog  
✓ Enroll in courses  
✓ Watch video lessons  
✓ Take quizzes and exams  
✓ Track your progress  
✓ Chat with AI assistant  
✓ Take notes during lessons  

### As a Course Admin
✓ Create new courses  
✓ Manage course content (modules, lessons)  
✓ Create quizzes and exams  
✓ View course analytics  
✓ Track student enrollment  

### As a Platform Admin
✓ Manage all users  
✓ Ban/unban users  
✓ View system analytics  
✓ Access moderation dashboard  
✓ Configure platform settings  

## 🗂️ Main Pages

| Page | URL | Role |
|------|-----|------|
| Landing | `/` | Public |
| Login | `/auth/login` | Public |
| Signup | `/auth/signup` | Public |
| Dashboard | `/dashboard` | All logged in |
| Courses | `/courses` | Trainee+ |
| Course Detail | `/courses/[courseId]` | Trainee+ |
| Lesson | `/courses/[courseId]/[moduleId]/[lessonId]` | Trainee+ |
| Quiz | `/quiz/[quizId]` | Trainee+ |
| Course Admin | `/admin/courses` | Course Admin+ |
| Platform Admin | `/admin/platform` | Platform Admin |
| Settings | `/settings` | All logged in |

## 🎯 Demo Workflow

### Try as a Trainee:
1. Login with `trainee@forge.com`
2. Go to Dashboard → Click "Explore Courses"
3. Enroll in "Onboarding Essentials"
4. Start "Welcome & Overview" module
5. Watch the lesson video
6. Take the quiz
7. Use AI chat on the right for help

### Try as Admin:
1. Login with `admin@forge.com`
2. Go to `/admin/courses`
3. View course management dashboard
4. See analytics for enrolled courses

### Try Platform Admin:
1. Login with `platform@forge.com`
2. Go to `/admin/platform`
3. View all users
4. See system analytics

## 💡 Key Features

### 🤖 AI Assistant
Click the blue chat button in bottom-right corner to:
- Ask questions about lessons
- Get learning recommendations
- Get clarifications on concepts

### 📊 Progress Tracking
- See overall completion percentage
- Track module/lesson progress
- View quiz scores and results

### ⏱️ Quiz Timer
- Quizzes have 10-minute timer
- Question navigator to skip around
- Answer review after submission

### 📝 Lesson Notes
- Take notes while watching lessons
- Save them for later reference
- Notes are stored locally (mock)

## 🔌 Ready to Integrate

### Database
Currently uses mock data. Ready to connect to:
- Supabase
- Firebase
- PostgreSQL
- MongoDB

Update: `lib/mock-data.ts`

### Authentication
Currently uses mock auth. Ready to integrate:
- Auth.js (NextAuth)
- Firebase Auth
- Clerk
- Supabase Auth

Update: `lib/auth-context.tsx`

### AI
Currently uses mock AI responses. Ready to integrate:
- OpenAI GPT-4
- Anthropic Claude
- Groq
- Other LLM providers

Update: `components/layout/AIChat.tsx`

## 📁 Project Structure

```
FORGE/
├── app/                    # Next.js app pages
├── components/            # React components
├── lib/                   # Utilities, types, auth
├── FORGE_README.md       # Full documentation
└── QUICK_START.md        # This file
```

## 🎨 Customization

### Change Theme Colors
Edit `app/globals.css`:
```css
:root {
  --primary: YOUR_COLOR;
  --accent: YOUR_COLOR;
  /* ... more theme colors */
}
```

### Add More Courses
Edit `lib/mock-data.ts`:
```typescript
export const mockCourses: Course[] = [
  { /* existing courses */ },
  { /* your new course */ }
];
```

### Modify Quiz Questions
Edit `lib/mock-data.ts` under `mockQuizQuestions`

## 🆘 Troubleshooting

### "Course Not Found"
- Check the course ID in URL
- Verify mock data includes the course
- Clear browser cache and refresh

### "Quiz Won't Submit"
- Make sure all questions are answered
- Check browser console for errors
- Refresh page and try again

### AI Chat Not Working
- It uses mock responses currently
- To enable real AI, implement OpenAI integration
- Check browser console for errors

### Can't Login
- Try using exact email from demo credentials
- Any password works in demo mode
- Check localStorage isn't clearing session data

## 📚 Learn More

See `FORGE_README.md` for:
- Complete feature documentation
- Tech stack details
- Integration guides
- Security considerations
- Advanced customization

## 🚀 Next Steps

1. ✅ Explore the app with demo accounts
2. ✅ Understand the course progression
3. ✅ Try the admin features
4. ✅ Review the code structure
5. ✅ Plan your integrations
6. ✅ Customize for your needs
7. ✅ Deploy to production

---

**Happy Learning with FORGE!** 🎓
