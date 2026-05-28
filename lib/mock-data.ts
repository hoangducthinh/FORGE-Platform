import { Course, Module, Lesson, User, UserProgress } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'trainee@forge.com',
    name: 'Sarah Johnson',
    role: 'trainee',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-24'),
  },
  {
    id: '2',
    email: 'admin@forge.com',
    name: 'Alex Chen',
    role: 'course_admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-24'),
  },
  {
    id: '3',
    email: 'platform@forge.com',
    name: 'Maria Garcia',
    role: 'platform_admin',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-02-24'),
  },
];

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Onboarding Essentials',
    description: 'Learn the fundamentals of our company culture, policies, and systems',
    category: 'Onboarding',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: '2',
    title: 'Advanced Sales Techniques',
    description: 'Master the art of closing deals and building lasting client relationships',
    category: 'Sales',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    title: 'Project Management Fundamentals',
    description: 'Lead teams effectively with proven project management methodologies',
    category: 'Management',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '4',
    title: 'Customer Service Excellence',
    description: 'Deliver exceptional service and resolve conflicts with confidence',
    category: 'Customer Service',
    creatorId: '2',
    status: 'draft',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-22'),
  },
  {
    id: '5',
    title: 'AI Sales Pitch Simulator',
    description: 'Practice your sales skills by pitching products to an AI customer. Use voice to simulate real-world sales conversations.',
    category: 'Sales',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    createdAt: new Date('2024-02-24'),
    updatedAt: new Date('2024-02-24'),
  },
  {
    id: '6',
    title: 'Leadership & Team Building',
    description: 'Develop essential leadership skills to inspire and manage high-performing teams.',
    category: 'Management',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
  },
  {
    id: '7',
    title: 'Data Analysis for Beginners',
    description: 'Learn how to extract insights from raw data using modern analytics tools.',
    category: 'Technology',
    creatorId: '3',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: '8',
    title: 'Public Speaking Mastery',
    description: 'Overcome stage fright and deliver compelling presentations to any audience.',
    category: 'Communication',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1475721028070-2051d52a2253?w=400&h=300&fit=crop',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-18'),
  },
  {
    id: '9',
    title: 'Time Management Strategies',
    description: 'Boost your productivity by learning how to effectively manage your time and prioritize tasks.',
    category: 'Personal Development',
    creatorId: '3',
    status: 'draft',
    imageUrl: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=300&fit=crop',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: '10',
    title: 'Digital Marketing Fundamentals',
    description: 'Understand the core concepts of SEO, social media marketing, and email campaigns.',
    category: 'Marketing',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&h=300&fit=crop',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-05'),
  },
  {
    id: '11',
    title: 'Culinary Sales: The Perfect Dish',
    description: 'Pitch a premium restaurant dish by highlighting its exquisite ingredients and preparation.',
    category: 'Sales',
    creatorId: '2',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01'),
  }
];

export const mockModules: Record<string, Module[]> = {
  '1': [
    {
      id: 'm1',
      courseId: '1',
      title: 'Welcome & Overview',
      description: 'Start your journey with FORGE',
      order: 1,
      createdAt: new Date(),
    },
    {
      id: 'm2',
      courseId: '1',
      title: 'Company Culture & Values',
      description: 'Understanding what makes us unique',
      order: 2,
      createdAt: new Date(),
    },
    {
      id: 'm3',
      courseId: '1',
      title: 'Systems & Tools',
      description: 'Master the tools you\'ll use daily',
      order: 3,
      createdAt: new Date(),
    },
  ],
  '2': [
    {
      id: 'm4',
      courseId: '2',
      title: 'Sales Fundamentals',
      description: 'Core principles of effective selling',
      order: 1,
      createdAt: new Date(),
    },
    {
      id: 'm5',
      courseId: '2',
      title: 'Handling Objections',
      description: 'Turn no into yes',
      order: 2,
      createdAt: new Date(),
    },
  ],
  '5': [
    {
      id: 'm6',
      courseId: '5',
      title: 'EcoBot Water Bottle Pitch',
      description: 'Learn to pitch an eco-friendly water bottle to an AI customer',
      order: 1,
      createdAt: new Date(),
    },
    {
      id: 'm7',
      courseId: '5',
      title: 'Advanced Negotiation',
      description: 'Master discount negotiation and closing techniques',
      order: 2,
      createdAt: new Date(),
    },
  ],
  '6': [
    {
      id: 'm8',
      courseId: '6',
      title: 'Introduction to Leadership',
      description: 'Understanding what makes a great leader',
      order: 1,
      createdAt: new Date(),
    },
    {
      id: 'm9',
      courseId: '6',
      title: 'Building Trust',
      description: 'Strategies to build trust within your team',
      order: 2,
      createdAt: new Date(),
    }
  ],
  '7': [
    {
      id: 'm10',
      courseId: '7',
      title: 'Data Collection Methods',
      description: 'How to properly collect and store data',
      order: 1,
      createdAt: new Date(),
    }
  ],
  '8': [
    {
      id: 'm11',
      courseId: '8',
      title: 'Crafting Your Message',
      description: 'How to structure a compelling speech',
      order: 1,
      createdAt: new Date(),
    }
  ],
  '11': [
    {
      id: 'm12',
      courseId: '11',
      title: 'Truffle Wagyu Steak Pitch',
      description: 'Convince the food critic to try our signature dish.',
      order: 1,
      createdAt: new Date(),
    }
  ]
};

export const mockLessons: Record<string, Lesson[]> = {
  'm1': [
    {
      id: 'l1',
      moduleId: 'm1',
      title: 'Welcome to FORGE',
      content: '<h2>Welcome to FORGE Training Platform</h2><p>This is your gateway to professional development. Over the next weeks, you\'ll learn everything you need to succeed in your role.</p><ul><li>Learn at your own pace</li><li>Access expert knowledge</li><li>Track your progress</li><li>Get AI-powered support</li></ul>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      createdAt: new Date(),
      resources: [
        { title: 'Welcome PDF', url: '#' },
        { title: 'Quick Start Guide', url: '#' },
      ],
    },
    {
      id: 'l2',
      moduleId: 'm1',
      title: 'Getting Started',
      content: '<h2>Your First Steps</h2><p>Here\'s how to navigate the platform:</p><ol><li>Complete your profile</li><li>Enroll in your first course</li><li>Watch lessons</li><li>Take quizzes</li><li>Track your certificates</li></ol>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 2,
      createdAt: new Date(),
    },
  ],
  'm2': [
    {
      id: 'l3',
      moduleId: 'm2',
      title: 'Our Values',
      content: '<h2>Core Values</h2><p>Our company is built on:</p><ul><li><strong>Innovation:</strong> We embrace change</li><li><strong>Integrity:</strong> We do the right thing</li><li><strong>Impact:</strong> We create value</li><li><strong>Inclusivity:</strong> We respect all</li></ul>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      createdAt: new Date(),
    },
  ],
  'm3': [
    {
      id: 'l4',
      moduleId: 'm3',
      title: 'Communication Tools',
      content: '<h2>Essential Communication</h2><p>Learn to use our primary communication tools effectively.</p>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      createdAt: new Date(),
    },
  ],
  'm6': [
    {
      id: 'l5',
      moduleId: 'm6',
      title: 'EcoBot Water Bottle Interactive Pitch',
      content: '<h2>Your Task: Pitch an EcoBot Water Bottle</h2><p><strong>Product:</strong> EcoBot Smart Water Bottle</p><ul><li>Price: $89.99</li><li>Features: App-integrated, temperature control, 48-hour cold/hot retention</li><li>Made from 100% recycled materials</li><li>AI-powered hydration reminders</li></ul><p><strong>Your Mission:</strong> Convince the AI customer to buy this product using your voice. Speak naturally as if in a real sales call!</p>',
      videoUrl: '',
      order: 1,
      createdAt: new Date(),
      resources: [
        { title: 'EcoBot Product Specs', url: '#' },
        { title: 'Sales Talking Points', url: '#' },
      ],
    },
  ],
  'm7': [
    {
      id: 'l6',
      moduleId: 'm7',
      title: 'Advanced Negotiation Practice',
      content: '<h2>Master the Art of Negotiation</h2><p>Practice handling price objections and closing techniques with our AI customer.</p><p><strong>Scenario:</strong> The customer wants a bulk discount. Can you negotiate a deal?</p>',
      videoUrl: '',
      order: 1,
      createdAt: new Date(),
    },
  ],
  'm8': [
    {
      id: 'l7',
      moduleId: 'm8',
      title: 'Leadership Styles',
      content: '<h2>Exploring Different Leadership Styles</h2><p>Learn about transformational, democratic, and autocratic leadership.</p>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      createdAt: new Date(),
    }
  ],
  'm9': [
    {
      id: 'l8',
      moduleId: 'm9',
      title: 'The Foundation of Trust',
      content: '<h2>Why Trust Matters</h2><p>Trust is the cornerstone of any successful team. Learn how to foster it.</p>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      createdAt: new Date(),
    }
  ],
  'm10': [
    {
      id: 'l9',
      moduleId: 'm10',
      title: 'Quantitative vs Qualitative',
      content: '<h2>Understanding Data Types</h2><p>An overview of the different types of data you will encounter.</p>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      createdAt: new Date(),
    }
  ],
  'm11': [
    {
      id: 'l10',
      moduleId: 'm11',
      title: 'The Art of Storytelling',
      content: '<h2>Storytelling in Speeches</h2><p>How to use stories to captivate your audience.</p>',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: 1,
      createdAt: new Date(),
    }
  ],
  'm12': [
    {
      id: 'l11',
      moduleId: 'm12',
      title: 'Truffle Wagyu Steak Interactive Pitch',
      content: '<h2>Your Task: Pitch the Signature Dish</h2><p><strong>Product:</strong> Truffle Wagyu Ribeye Steak</p><ul><li>Price: $150.00</li><li>Features: A5 Japanese Wagyu, infused with white truffle butter, served with Himalayan salt and rosemary reduction</li><li>Sourced from sustainable farms</li><li>A culinary experience like no other</li></ul><p><strong>Your Mission:</strong> Convince the AI customer (a food enthusiast or critic) to order this premium dish using your voice. Emphasize the ingredients and preparation!</p>',
      videoUrl: '',
      order: 1,
      createdAt: new Date(),
      resources: [
        { title: 'Dish Ingredients Details', url: '#' },
      ],
    }
  ]
};



export const mockUserProgress: UserProgress[] = [
  {
    id: 'up1',
    userId: '1',
    courseId: '1',
    enrollmentDate: new Date('2024-02-15'),
    progressPercentage: 45,
    status: 'in_progress',
    lastAccessed: new Date('2024-02-24'),
  },
  {
    id: 'up2',
    userId: '1',
    courseId: '2',
    enrollmentDate: new Date('2024-02-20'),
    progressPercentage: 10,
    status: 'in_progress',
    lastAccessed: new Date('2024-02-23'),
  },
];
