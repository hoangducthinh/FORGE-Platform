# FORGE - Worker Training Platform
## Thymeleaf HTML Templates

Complete HTML template set for a Java Spring Boot worker training platform with AI integration, modular course structure, and admin capabilities.

---

## 📁 Template Structure

```
templates/
├── layout/
│   └── base.html                 # Base layout template with navbar, sidebar, AI chat widget
├── trainee/
│   ├── dashboard.html            # Trainee dashboard with progress overview
│   ├── courses.html              # Course catalog with filtering
│   ├── course-detail.html        # Course detail with modules & lessons
│   ├── lesson.html               # Video lesson viewer with notes & resources
│   └── quiz.html                 # Interactive quiz with timer & AI help
└── admin/
    ├── course-admin.html         # Course creation & management
    └── platform-admin.html       # Platform admin, users, moderation, analytics
```

---

## 🎯 Features

### For Trainees
- **Dashboard**: Quick overview of progress, active courses, upcoming assignments
- **Course Catalog**: Browse, filter, and enroll in courses
- **Learning Path**: Modules → Lessons → Quizzes → Certification Exam
- **Video Lessons**: Watch training videos with notes and resource downloads
- **Interactive Quizzes**: Multiple choice, true/false, short answer questions with timer
- **AI Assistant**: Built-in chat widget for personalized help and recommendations
- **Progress Tracking**: Visual progress bars, completion badges, certificates

### For Course Admins
- **Course Management**: Create, edit, and manage courses
- **Module & Lesson Creation**: Build structured training content
- **Quiz Builder**: Create and manage assessments
- **Trainee Analytics**: Track enrollment, completion rates, performance
- **Resource Management**: Upload and manage course materials

### For Platform Admins
- **User Management**: Add users, assign roles, manage permissions
- **Content Moderation**: Review reports, manage flagged content, ban users
- **System Analytics**: Track platform growth, user engagement, system health
- **Platform Settings**: Configure system parameters, enable/disable features
- **Activity Monitoring**: View recent activities and system status

---

## 🔧 Integration Guide

### 1. **Setup Thymeleaf in Spring Boot**

Add to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

### 2. **Directory Structure**

Place templates in: `src/main/resources/templates/`

```
src/main/resources/
└── templates/
    ├── layout/
    ├── trainee/
    └── admin/
```

### 3. **Base Layout Configuration**

The `layout/base.html` template includes:
- Navigation bar with role-based menu items
- Sidebar navigation
- Main content area
- AI chat widget (fixed to bottom-right)
- Bootstrap 5 & Font Awesome icons
- Custom FORGE styling with CSS variables

### 4. **Using Fragments in Controllers**

Example Spring Boot Controller:

```java
@Controller
public class DashboardController {
    
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("title", "Dashboard");
        model.addAttribute("userName", "John Doe");
        model.addAttribute("userRole", "TRAINEE");
        model.addAttribute("activeCourses", 3);
        model.addAttribute("overallProgress", 65);
        model.addAttribute("certificatesEarned", 2);
        
        // Load course data from database
        List<CourseDTO> courses = courseService.getUserCourses(userId);
        model.addAttribute("courses", courses);
        
        List<AssignmentDTO> assignments = assignmentService.getUpcoming();
        model.addAttribute("upcomingAssignments", assignments);
        
        return "trainee/dashboard";
    }
}
```

### 5. **Create Course Model**

```java
@Entity
public class Course {
    @Id
    private Long id;
    private String title;
    private String description;
    private String difficulty; // beginner, intermediate, advanced
    private Integer modules;
    private Double duration;
    private String instructor;
    private Integer progress;
    private String status; // draft, published, archived
    
    @OneToMany(mappedBy = "course")
    private List<Module> moduleList;
    
    @OneToMany(mappedBy = "course")
    private List<CourseEnrollment> enrollments;
}

@Entity
public class Module {
    @Id
    private Long id;
    private String title;
    private Integer moduleNumber;
    
    @ManyToOne
    private Course course;
    
    @OneToMany(mappedBy = "module")
    private List<Lesson> lessons;
    
    @OneToOne
    private Quiz quiz;
}

@Entity
public class Lesson {
    @Id
    private Long id;
    private String title;
    private String description;
    private String type; // video, text, interactive
    private String videoUrl;
    private Integer duration;
    
    @ManyToOne
    private Module module;
}

@Entity
public class Quiz {
    @Id
    private Long id;
    private String title;
    private Integer totalQuestions;
    private Integer timeLimit;
    private Integer passingScore;
    
    @OneToMany(mappedBy = "quiz")
    private List<Question> questions;
}
```

---

## 🎨 Customization

### Color Scheme (CSS Variables in base.html)
```css
:root {
    --forge-primary: #1e3a8a;      /* Deep Blue */
    --forge-accent: #f97316;       /* Orange */
    --forge-success: #22c55e;      /* Green */
    --forge-warning: #f59e0b;      /* Amber */
    --forge-danger: #ef4444;       /* Red */
    --forge-bg: #f8fafc;           /* Light Gray */
    --forge-border: #e2e8f0;       /* Gray Border */
}
```

### Fonts
- **Sans-serif**: Segoe UI, Tahoma, Geneva, Verdana (default system fonts)
- Uses Bootstrap 5.3 for responsive design
- Font Awesome 6.4 for icons

### Responsive Breakpoints
- Mobile: < 576px
- Tablet: 576px - 768px
- Desktop: > 768px

---

## 📝 Required Model Attributes

### Dashboard Page
```thymeleaf
${title} - Page title
${userName} - Current user name
${userRole} - User role (TRAINEE, COURSE_ADMIN, PLATFORM_ADMIN)
${activeCourses} - Number
${overallProgress} - Percentage
${certificatesEarned} - Number
${hoursLearned} - Number
${courses} - List of CourseDTO
${upcomingAssignments} - List of AssignmentDTO
```

### Course Page
```thymeleaf
${course} - Course object with all properties
${modules} - List of Module objects
${modulesCompleted} - Number
${enrolledDate} - LocalDate
```

### Quiz Page
```thymeleaf
${quiz} - Quiz object
${questions} - List of Question objects
```

---

## 🤖 AI Chat Integration

The AI chat widget is built into the base layout and communicates via JavaScript:

```javascript
function sendAIChatMessage() {
    const message = document.getElementById('aiChatInput').value;
    // Send to your backend API endpoint
    fetch('/api/ai/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => displayAIResponse(data.response));
}
```

**Backend Endpoint Example:**
```java
@PostMapping("/api/ai/chat")
public ResponseEntity<?> sendMessage(@RequestBody ChatRequest request) {
    String response = aiService.getResponse(
        request.getMessage(), 
        getCurrentUser()
    );
    return ResponseEntity.ok(new ChatResponse(response));
}
```

---

## 🔐 Role-Based Access Control

Use Thymeleaf `th:if` for role-based visibility:

```thymeleaf
<a href="/admin/courses" th:if="${userRole == 'COURSE_ADMIN'}">
    Manage Courses
</a>

<a href="/admin/platform" th:if="${userRole == 'PLATFORM_ADMIN'}">
    Admin Panel
</a>
```

---

## 📊 Data Flow Example

1. **User Enrolls in Course**
   - Frontend: User clicks "Enroll Now" button
   - POST `/course/{id}/enroll`
   - Backend: Create CourseEnrollment record
   - Redirect to course detail page

2. **User Completes Lesson**
   - Frontend: User clicks "Mark as Complete"
   - POST `/lesson/{id}/complete`
   - Backend: Update Lesson completion status, increment progress
   - Trigger AI recommendation engine

3. **User Takes Quiz**
   - Frontend: Submit quiz answers (POST `/quiz/{id}/submit`)
   - Backend: Grade answers, save results, unlock certification exam if passed

---

## 🚀 Deployment Checklist

- [ ] Configure database connection in `application.properties`
- [ ] Implement all controller endpoints
- [ ] Create service layer for business logic
- [ ] Setup Spring Security for authentication
- [ ] Implement AI service integration
- [ ] Configure file upload for course materials
- [ ] Setup email notifications
- [ ] Test responsive design on mobile devices
- [ ] Configure HTTPS/SSL
- [ ] Setup logging and monitoring
- [ ] Performance optimization (caching, CDN)

---

## 📚 Technologies Used

- **Frontend**: HTML5, Bootstrap 5.3, Font Awesome 6.4
- **Template Engine**: Thymeleaf
- **Backend**: Spring Boot
- **Styling**: Bootstrap CSS + Custom CSS
- **JavaScript**: Vanilla JS for interactivity
- **Icons**: Font Awesome

---

## 💡 Tips

1. **Use Fragments**: Split common parts into reusable fragments
   ```thymeleaf
   <th:block th:insert="fragments/navbar"></th:block>
   ```

2. **Pass Data Efficiently**: Use DTOs for cleaner templates

3. **Optimize Images**: Use lazy loading for course images

4. **Cache Templates**: Enable Thymeleaf template caching in production

5. **Accessibility**: Use semantic HTML, ARIA labels, proper contrast

---

## 📞 Support

For issues or questions about integrating these templates:
1. Ensure all Thymeleaf syntax is correct
2. Check model attributes match template variables
3. Verify Bootstrap and Font Awesome CDNs are loaded
4. Test locally before deployment

---

## 📄 License

These templates are provided as-is for the FORGE training platform project.

---

**Happy Training! 🚀**
