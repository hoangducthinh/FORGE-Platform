# FORGE Project Index

Welcome to FORGE! This document serves as a directory for all project files and documentation.

## 📖 Documentation Files (Start Here!)

### For First-Time Users
1. **[QUICK_START.md](./QUICK_START.md)** ⭐ START HERE
   - What is FORGE
   - Getting started in 3 steps
   - Demo workflow
   - Common troubleshooting

### For Developers
2. **[FORGE_README.md](./FORGE_README.md)** - Full Documentation
   - Complete feature list
   - Project structure
   - Tech stack details
   - Integration guides

3. **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** - Build Overview
   - What's been built
   - What's included
   - Integration points
   - Next steps

4. **[API_ROUTES.md](./API_ROUTES.md)** - API Structure
   - All endpoint specifications
   - Request/response formats
   - Implementation notes
   - Database queries

## 🚀 Quick Navigation

### Start Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Demo Credentials
```
Trainee:        admin@forge.com  (any password)
Course Admin:   admin@forge.com  (any password)
Platform Admin: platform@forge.com (any password)
```

### Key URLs
| Page | URL | Demo |
|------|-----|------|
| Home | `/` | No login needed |
| Login | `/auth/login` | Use demo credentials |
| Signup | `/auth/signup` | Create new account |
| Dashboard | `/dashboard` | Trainee home |
| Courses | `/courses` | Browse courses |
| Course Admin | `/admin/courses` | Login as admin@forge.com |
| Platform Admin | `/admin/platform` | Login as platform@forge.com |

## 📁 Project Structure

### Pages (`/app`)
```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
├── auth/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── dashboard/page.tsx          # Trainee dashboard
├── courses/
│   ├── page.tsx               # Course catalog
│   └── [courseId]/
│       └── [moduleId]/[lessonId]/
│           └── page.tsx       # Lesson view
├── quiz/
│   └── [quizId]/page.tsx      # Quiz interface
├── admin/
│   ├── courses/page.tsx       # Course management
│   └── platform/page.tsx      # Platform admin
└── settings/page.tsx          # User settings
```

### Components (`/components`)
```
components/
├── layout/
│   ├── Navbar.tsx             # Navigation bar
│   └── AIChat.tsx             # AI chat widget
├── ProtectedRoute.tsx         # Auth guard
└── ui/                        # shadcn components (auto-generated)
```

### Libraries (`/lib`)
```
lib/
├── types.ts                   # TypeScript interfaces
├── mock-data.ts              # Demo data (replace with API calls)
├── auth-context.tsx          # Auth state management
└── utils.ts                  # Utility functions
```

## 🔑 Key Files Reference

### Authentication
- **`lib/auth-context.tsx`** - Auth state, login, logout, signup
- **`app/auth/login/page.tsx`** - Login page UI
- **`app/auth/signup/page.tsx`** - Signup page UI
- **`components/ProtectedRoute.tsx`** - Route protection wrapper

### Course Management
- **`app/courses/page.tsx`** - Course catalog
- **`app/courses/[courseId]/page.tsx`** - Course detail with modules
- **`lib/mock-data.ts`** - Course data (lines 1-50)

### Learning Features
- **`app/courses/[courseId]/[moduleId]/[lessonId]/page.tsx`** - Lesson player
- **`app/quiz/[quizId]/page.tsx`** - Quiz interface

### AI Integration
- **`components/layout/AIChat.tsx`** - AI chat widget

### Admin Features
- **`app/admin/courses/page.tsx`** - Course admin panel
- **`app/admin/platform/page.tsx`** - Platform admin panel

### Data Models
- **`lib/types.ts`** - All TypeScript interfaces
- **`lib/mock-data.ts`** - Demo data structures

## 🎨 Customization Guide

### Change Theme Colors
**File**: `app/globals.css` (Lines 7-30)
```css
:root {
  --primary: blue;           /* Change primary color */
  --accent: purple;          /* Change accent color */
  --background: white;       /* Change background */
  /* ... more colors ... */
}
```

### Add More Courses
**File**: `lib/mock-data.ts` (Lines 20-50)
```typescript
export const mockCourses: Course[] = [
  // ... existing courses ...
  {
    id: 'new-course-id',
    title: 'Your Course Title',
    // ... other properties ...
  }
];
```

### Add Quiz Questions
**File**: `lib/mock-data.ts` (Lines 200+)
```typescript
export const mockQuizQuestions: Record<string, QuizQuestion[]> = {
  'quiz-id': [
    {
      questionText: 'Your question?',
      questionType: 'multiple_choice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
    }
  ]
};
```

### Update Demo Users
**File**: `lib/mock-data.ts` (Lines 1-20)
```typescript
export const mockUsers: User[] = [
  {
    email: 'your-email@company.com',
    name: 'Your Name',
    role: 'trainee',
    // ... other properties ...
  }
];
```

## 🔌 Integration Checklist

### When Connecting to Backend

- [ ] Update `lib/auth-context.tsx` with real auth API
- [ ] Replace mock data in `lib/mock-data.ts` with API calls
- [ ] Create API routes in `app/api/`
- [ ] Update `components/layout/AIChat.tsx` with OpenAI integration
- [ ] Add environment variables to `.env.local`
- [ ] Update TypeScript types if needed
- [ ] Test all features with real data
- [ ] Update error handling for API failures

### Environment Variables Needed
```env
# Database
DATABASE_URL=your_database_url

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# AI/LLM
OPENAI_API_KEY=your_openai_key

# Other services
SERVICE_API_URL=your_api_url
```

## 📊 Statistics

- **Total Pages**: 11
- **Components**: 3 main
- **TypeScript Files**: 8
- **Lines of Code**: 4000+
- **Documentation Pages**: 5
- **Demo Data Records**: 20+
- **Quiz Questions**: 5+

## 🧪 Testing

### Test Scenarios

**As Trainee:**
1. Login with trainee@forge.com
2. View dashboard
3. Enroll in a course
4. Watch a lesson
5. Take a quiz
6. Chat with AI

**As Course Admin:**
1. Login with admin@forge.com
2. View course management
3. See analytics
4. Create a course (form exists)

**As Platform Admin:**
1. Login with platform@forge.com
2. View user management
3. View moderation dashboard
4. Check analytics

## 🐛 Debugging Tips

### Enable Debug Logging
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Check Application tab for localStorage

### Reset Application State
1. Clear localStorage: DevTools → Application → Storage → Local Storage → Clear All
2. Clear cookies if needed
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. Close and reopen the browser

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module" | Missing import | Check file path |
| "useAuth must be used within AuthProvider" | Missing provider | Check layout.tsx |
| Blank page | JavaScript error | Check console |
| Quiz timer not working | Browser issue | Refresh page |

## 📚 Learning Resources

### About Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js 16 Features](https://nextjs.org/blog/next-16)

### About React
- [React Documentation](https://react.dev)
- [React 19 Features](https://react.dev/blog/2024/12/19/react-19)

### About TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### About Tailwind
- [Tailwind CSS](https://tailwindcss.com/docs)

### About shadcn/ui
- [shadcn/ui Components](https://ui.shadcn.com)

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables
4. Deploy

### Deploy to Other Platforms

- **Netlify**: Supports Next.js, follow their Next.js guide
- **AWS**: Use Amplify or EC2
- **Heroku**: Not recommended for Next.js 16
- **DigitalOcean**: Use App Platform

## 📞 Getting Help

### Documentation
- Check QUICK_START.md first
- Review FORGE_README.md for details
- See API_ROUTES.md for API info

### Code Comments
- Most functions have comments
- Check existing implementations as examples
- TypeScript types provide good guidance

### Common Questions

**Q: How do I add a new course?**
A: Edit `lib/mock-data.ts` and add to `mockCourses` array. When connected to database, use Course Admin UI.

**Q: How do I change the colors?**
A: Edit `app/globals.css` and update CSS variables in `:root` section.

**Q: Can I use this with my own backend?**
A: Yes! Replace mock data with API calls in the same functions.

**Q: How do I add real AI?**
A: Update `components/layout/AIChat.tsx` to call OpenAI API instead of returning mock responses.

## 🎯 Next Steps

1. ✅ Read QUICK_START.md
2. ✅ Run the project locally
3. ✅ Test with demo credentials
4. ✅ Explore the code structure
5. ✅ Review documentation files
6. ✅ Plan your customizations
7. ✅ Set up your backend
8. ✅ Deploy!

## 📋 Checklist Before Production

- [ ] Replace mock auth with real auth
- [ ] Connect to real database
- [ ] Integrate OpenAI (or use mock)
- [ ] Add error handling
- [ ] Set up logging
- [ ] Configure CORS
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Test all features
- [ ] Security audit
- [ ] Performance testing
- [ ] Load testing
- [ ] Documentation updated
- [ ] Team trained

---

## 📁 File Locations Quick Reference

| Need | File | Line |
|------|------|------|
| Auth logic | `lib/auth-context.tsx` | All |
| User types | `lib/types.ts` | 1-20 |
| Course types | `lib/types.ts` | 20-40 |
| Demo users | `lib/mock-data.ts` | 1-20 |
| Demo courses | `lib/mock-data.ts` | 20-60 |
| Quiz data | `lib/mock-data.ts` | 140-250 |
| Theme colors | `app/globals.css` | 1-50 |
| AI chat | `components/layout/AIChat.tsx` | All |
| Navbar | `components/layout/Navbar.tsx` | All |
| Protected routes | `components/ProtectedRoute.tsx` | All |

---

**Welcome to FORGE! Happy Learning! 🎓**

For questions, refer to the documentation files or review the source code comments.
