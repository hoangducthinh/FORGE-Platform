# FORGE API Routes Structure

This document outlines the API routes ready for implementation. Currently using mock data, but these routes should be implemented when connecting to a real backend.

## Authentication Routes

### POST `/api/auth/login`
Login with email and password
- **Body**: `{ email: string, password: string }`
- **Returns**: `{ user: User, token: string }`

### POST `/api/auth/signup`
Create a new account
- **Body**: `{ email: string, name: string, password: string }`
- **Returns**: `{ user: User, token: string }`

### POST `/api/auth/logout`
Logout current user
- **Returns**: `{ success: boolean }`

### GET `/api/auth/me`
Get current user
- **Returns**: `{ user: User }`

## Course Routes

### GET `/api/courses`
Get all published courses
- **Query**: `?category=string&search=string&page=number`
- **Returns**: `{ courses: Course[], total: number }`

### GET `/api/courses/:id`
Get course details with modules
- **Returns**: `{ course: Course, modules: Module[] }`

### POST `/api/courses`
Create a new course (admin only)
- **Body**: `{ title: string, description: string, category: string }`
- **Returns**: `{ course: Course }`

### PUT `/api/courses/:id`
Update course (admin only)
- **Body**: `{ title?: string, description?: string, category?: string, status?: string }`
- **Returns**: `{ course: Course }`

### DELETE `/api/courses/:id`
Delete course (admin only)
- **Returns**: `{ success: boolean }`

## Module Routes

### GET `/api/courses/:courseId/modules`
Get all modules in a course
- **Returns**: `{ modules: Module[] }`

### POST `/api/courses/:courseId/modules`
Create module (admin only)
- **Body**: `{ title: string, description: string, order: number }`
- **Returns**: `{ module: Module }`

## Lesson Routes

### GET `/api/modules/:moduleId/lessons`
Get all lessons in a module
- **Returns**: `{ lessons: Lesson[] }`

### GET `/api/lessons/:id`
Get lesson details
- **Returns**: `{ lesson: Lesson }`

### POST `/api/modules/:moduleId/lessons`
Create lesson (admin only)
- **Body**: `{ title: string, content: string, videoUrl?: string, order: number }`
- **Returns**: `{ lesson: Lesson }`

### PUT `/api/lessons/:id`
Update lesson (admin only)
- **Body**: `{ title?: string, content?: string, videoUrl?: string }`
- **Returns**: `{ lesson: Lesson }`

## Quiz Routes

### GET `/api/lessons/:lessonId/quizzes`
Get quizzes for a lesson
- **Returns**: `{ quizzes: Quiz[] }`

### GET `/api/quizzes/:id`
Get quiz with questions
- **Returns**: `{ quiz: Quiz, questions: QuizQuestion[] }`

### POST `/api/quizzes/:id/submit`
Submit quiz answers
- **Body**: `{ answers: Record<string, string> }`
- **Returns**: `{ score: number, passed: boolean, results: QuizAttempt }`

### POST `/api/lessons/:lessonId/quizzes`
Create quiz (admin only)
- **Body**: `{ title: string, type: string, passingScore: number }`
- **Returns**: `{ quiz: Quiz }`

### POST `/api/quizzes/:id/questions`
Add question to quiz (admin only)
- **Body**: `{ questionText: string, questionType: string, options?: string[], correctAnswer: string }`
- **Returns**: `{ question: QuizQuestion }`

## Progress Routes

### GET `/api/users/:userId/progress`
Get user's course progress
- **Returns**: `{ progress: UserProgress[] }`

### GET `/api/users/:userId/progress/:courseId`
Get progress for specific course
- **Returns**: `{ progress: UserProgress }`

### PUT `/api/users/:userId/progress/:courseId`
Update course progress
- **Body**: `{ progressPercentage?: number, status?: string }`
- **Returns**: `{ progress: UserProgress }`

### POST `/api/lessons/:lessonId/complete`
Mark lesson as complete
- **Body**: `{ timeSpentMinutes: number }`
- **Returns**: `{ completion: LessonCompletion }`

## AI Routes

### POST `/api/ai/chat`
Send message to AI
- **Body**: `{ message: string, courseId?: string, lessonId?: string }`
- **Returns**: `{ response: string, conversationId: string }`

### GET `/api/ai/conversations/:id`
Get conversation history
- **Returns**: `{ conversation: AIConversation }`

### GET `/api/users/:userId/conversations`
Get all conversations for user
- **Returns**: `{ conversations: AIConversation[] }`

## User Routes

### GET `/api/users`
Get all users (admin only)
- **Query**: `?role=string&search=string&page=number`
- **Returns**: `{ users: User[], total: number }`

### GET `/api/users/:id`
Get user details
- **Returns**: `{ user: User }`

### PUT `/api/users/:id`
Update user (admin only or self)
- **Body**: `{ name?: string, role?: string }`
- **Returns**: `{ user: User }`

### POST `/api/users/:id/ban`
Ban user (admin only)
- **Returns**: `{ user: User }`

### POST `/api/users/:id/unban`
Unban user (admin only)
- **Returns**: `{ user: User }`

## Admin Routes

### GET `/api/admin/analytics`
Get platform analytics (admin only)
- **Returns**: `{ totalUsers: number, totalCourses: number, completionRate: number }`

### GET `/api/admin/reports`
Get moderation reports (admin only)
- **Query**: `?status=string&page=number`
- **Returns**: `{ reports: ModerationReport[], total: number }`

### POST `/api/admin/reports`
Create moderation report
- **Body**: `{ reportType: string, content: string }`
- **Returns**: `{ report: ModerationReport }`

### PUT `/api/admin/reports/:id`
Update report status (admin only)
- **Body**: `{ status: string }`
- **Returns**: `{ report: ModerationReport }`

## Implementation Notes

### Authentication
- Use JWT tokens or session cookies
- Include token in Authorization header: `Authorization: Bearer token`
- Implement refresh token strategy
- Set token expiration appropriately

### Error Handling
Standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

### Rate Limiting
- Implement rate limiting to prevent abuse
- Suggested: 100 requests per minute per user
- Return `429` status when limit exceeded

### Pagination
- Default page size: 10
- Include `total` in responses
- Return `page` and `pageSize` in response

### Validation
- Validate all user inputs
- Return detailed error messages
- Use schema validation (e.g., Zod)

### Authorization
- Check user role before sensitive operations
- Implement row-level security for multi-tenant data
- Validate user owns resources before modification

## Database Queries

When implementing these routes, consider:

### Courses
```sql
-- Get published courses
SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC

-- Get course with modules
SELECT c.*, m.* FROM courses c 
LEFT JOIN modules m ON c.id = m.course_id 
WHERE c.id = $1

-- Get user's enrolled courses
SELECT DISTINCT c.* FROM courses c
JOIN user_progress up ON c.id = up.course_id
WHERE up.user_id = $1
```

### Progress
```sql
-- Update progress percentage
UPDATE user_progress SET progress_percentage = $1, last_accessed = NOW()
WHERE user_id = $2 AND course_id = $3

-- Calculate progress
SELECT 
  COUNT(DISTINCT lc.lesson_id) as completed_lessons,
  COUNT(DISTINCT l.id) as total_lessons,
  ROUND(100.0 * COUNT(DISTINCT lc.lesson_id) / COUNT(DISTINCT l.id)) as percentage
FROM lessons l
LEFT JOIN lesson_completion lc ON l.id = lc.lesson_id AND lc.user_id = $1
WHERE l.module_id IN (SELECT id FROM modules WHERE course_id = $2)
```

### Analytics
```sql
-- Course completion rate
SELECT 
  c.id, c.title,
  COUNT(DISTINCT up.user_id) as total_enrolled,
  COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.user_id END) as completed,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.user_id END) / COUNT(DISTINCT up.user_id)) as completion_rate
FROM courses c
LEFT JOIN user_progress up ON c.id = up.course_id
GROUP BY c.id, c.title
```

## Testing the API

Use tools like:
- Postman
- Thunder Client
- Insomnia
- curl

Example:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainee@forge.com","password":"password"}'

# Get courses
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit quiz
curl -X POST http://localhost:3000/api/quizzes/q1/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"answers":{"qq1":"Correct Answer","qq2":"True"}}'
```

---

**Note**: Currently using mock data. Implement these routes to connect to a real backend.
