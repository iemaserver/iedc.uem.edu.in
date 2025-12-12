# Student Profile Page - Schema Alignment

## Schema Structure (from prisma/schema.prisma)

### StudentProfile Fields
```prisma
model StudentProfile {
  id              String          @id @default(uuid())
  userId          String          @unique
  user            User            @relation(...)
  
  // Academic Information
  rollNumber      String          @unique
  batch           String
  year            Int
  section         String
  department      String
  
  // Personal Information (Optional)
  phoneNumber     String?
  address         String?
  dateOfBirth     DateTime?       @db.Date
  
  // Guardian Information (Optional)
  guardianName    String?
  guardianPhone   String?
  
  // Timestamps
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Relations
  researchPapers  ResearchPaper[]      // Student's research papers
  ongoingProjects OngoingProject[]     // Student's projects
}
```

### User Fields (Parent Model)
```prisma
model User {
  id              String          @id @default(uuid())
  email           String          @unique
  emailVerified   DateTime?
  name            String
  image           String?
  role            UserRole        @default(STUDENT)
  isActive        Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  // Profile relation
  studentProfile  StudentProfile?
  
  // Achievements
  achievements    Achievement[]
}
```

### ResearchPaper Model (Student's Work)
```prisma
model ResearchPaper {
  id              String              @id @default(uuid())
  studentId       String
  student         StudentProfile      @relation(...)
  
  title           String
  abstract        String?
  imageUrl        String?
  documentUrl     String?
  
  status          SubmissionStatus    @default(DRAFT)
  keywords        String[]
  
  submittedAt     DateTime?
  approvedAt      DateTime?
  publishedAt     DateTime?
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  // Relations
  members         ResearchPaperMember[]    // Many-to-many with Users
  reviewedBy      TeacherProfile?          // Single teacher reviewer
  reviewedById    String?
}

model ResearchPaperMember {
  id              String
  researchPaperId String
  memberId        String              // References User.id
  member          User                @relation(...)
  role            String?             // Lead Author, Co-Author, etc.
  joinedAt        DateTime            @default(now())
}
```

### OngoingProject Model (Student's Work)
```prisma
model OngoingProject {
  id              String              @id @default(uuid())
  studentId       String
  student         StudentProfile      @relation(...)
  
  title           String
  abstract        String?
  imageUrl        String?
  documentUrl     String?
  repositoryUrl   String?
  
  status          SubmissionStatus    @default(DRAFT)
  keywords        String[]
  
  startDate       DateTime?           @db.Date
  expectedEndDate DateTime?           @db.Date
  completedAt     DateTime?
  
  submittedAt     DateTime?
  approvedAt      DateTime?
  publishedAt     DateTime?
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  // Relations
  advisors        OngoingProjectAdvisor[]   // Many-to-many with Users
  members         OngoingProjectMember[]    // Many-to-many with Users
}

model OngoingProjectAdvisor {
  id              String
  projectId       String
  advisorId       String              // References User.id
  advisor         User                @relation(...)
  assignedAt      DateTime            @default(now())
}

model OngoingProjectMember {
  id              String
  projectId       String
  memberId        String              // References User.id
  member          User                @relation(...)
  role            String?             // Team Lead, Developer, Researcher, etc.
  joinedAt        DateTime            @default(now())
}
```

### Status Enums
```prisma
enum SubmissionStatus {
  DRAFT
  UNDER_REVIEW
  APPROVED
  PUBLISHED
  REJECTED
}

enum UserRole {
  STUDENT
  TEACHER
  ADMIN
}
```

## Profile Page Implementation

### ✅ Sections Implemented

1. **Cover Photo Banner**
   - Gradient background using custom colors
   - Camera icon for editing

2. **Profile Card (Overlapping Cover)**
   - Avatar with gradient border
   - Name (from User.name)
   - Roll Number (StudentProfile.rollNumber)
   - Role Badge (User.role)
   - Department, Year, Section

3. **Contact Information Grid**
   - Email (User.email) - Required
   - Phone (StudentProfile.phoneNumber) - Optional
   - Date of Birth (StudentProfile.dateOfBirth) - Optional
   - Address (StudentProfile.address) - Optional

4. **Statistics Cards**
   - Research Papers Count
   - Ongoing Projects Count
   - Achievements Count

5. **Academic Details Card**
   - Department (StudentProfile.department)
   - Year (StudentProfile.year)
   - Section (StudentProfile.section)
   - Batch (StudentProfile.batch)
   - Guardian Name (StudentProfile.guardianName) - Optional
   - Guardian Phone (StudentProfile.guardianPhone) - Optional

6. **Research Papers Section**
   - Title, Abstract, Keywords
   - Status Badge (DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, REJECTED)
   - Reviewed By (Single Teacher - reviewedBy.user.name)
   - Team Members (members[].member.name with role)
   - Links to paper details

7. **Ongoing Projects Section**
   - Title, Abstract, Keywords
   - Status Badge (DRAFT, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
   - Start Date (startDate)
   - Expected End Date (expectedEndDate)
   - Advisors (advisors[].advisor.name)
   - Team Members (members[].member.name with role)
   - Links to project details

### 🎨 Design Features

- **Custom Colors**: Uses CSS variables (--first-color, --second-color, --third-color, --forth-color)
- **Gradient Backgrounds**: Throughout the page for visual appeal
- **Facebook-like Layout**: Cover photo + overlapping profile card
- **Hover Effects**: Scale animations, shadow transitions
- **Responsive Design**: Mobile, tablet, and desktop layouts
- **Status Color Coding**:
  - Published/Completed: Green gradient
  - In Progress: Blue gradient
  - Under Review/On Hold: Yellow/Amber gradient
  - Draft: Light gray
  - Rejected/Cancelled: Red gradient

### 📊 Data Flow

```typescript
// API Response Structure Expected
{
  success: true,
  data: {
    // User fields
    id: string,
    email: string,
    name: string,
    image: string | null,
    role: "STUDENT",
    
    // Student Profile
    studentProfile: {
      id: string,
      rollNumber: string,
      batch: string,
      year: number,
      section: string,
      department: string,
      phoneNumber: string | null,
      address: string | null,
      dateOfBirth: string | null,
      guardianName: string | null,
      guardianPhone: string | null,
      
      // Research Papers (with relations)
      researchPapers: [{
        id: string,
        title: string,
        abstract: string | null,
        keywords: string[],
        status: SubmissionStatus,
        imageUrl: string | null,
        documentUrl: string | null,
        
        // Single reviewer
        reviewedBy: {
          id: string,
          user: {
            id: string,
            name: string,
            email: string
          }
        } | null,
        
        // Team members (many-to-many)
        members: [{
          id: string,
          role: string | null,
          member: {
            id: string,
            name: string,
            email: string
          }
        }]
      }],
      
      // Ongoing Projects (with relations)
      ongoingProjects: [{
        id: string,
        title: string,
        abstract: string | null,
        keywords: string[],
        status: SubmissionStatus,
        startDate: string | null,
        expectedEndDate: string | null,
        repositoryUrl: string | null,
        
        // Advisors (many-to-many)
        advisors: [{
          id: string,
          advisor: {
            id: string,
            name: string,
            email: string
          }
        }],
        
        // Team members (many-to-many)
        members: [{
          id: string,
          role: string | null,
          member: {
            id: string,
            name: string,
            email: string
          }
        }]
      }]
    },
    
    // Statistics
    stats: {
      researchPapers: number,
      ongoingProjects: number,
      achievements: number
    }
  }
}
```

### 🔧 Key Corrections Made

1. **Research Papers**: 
   - Changed from `advisors[]` (incorrect) to `reviewedBy` (single teacher reviewer)
   - Added `members[]` display (team members who worked on the paper)

2. **Ongoing Projects**:
   - Properly displays `advisors[]` (many-to-many relationship)
   - Properly displays `members[]` with their roles

3. **Status Handling**:
   - Matches exact enum values from schema: DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, REJECTED

### 📱 Responsive Breakpoints

- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

### 🎯 Features

- ✅ Schema-aligned data structure
- ✅ Eye-catching Facebook-like design
- ✅ Custom color theme integration
- ✅ Hover effects and animations
- ✅ Proper optional field handling
- ✅ Empty states for research papers and projects
- ✅ Quick action buttons (Edit, Share, More)
- ✅ Status badges with appropriate colors
- ✅ Member and advisor listings
- ✅ Date formatting
- ✅ Keyword tags

### 🚀 Next Steps (Optional Enhancements)

1. Add achievements section display
2. Implement actual image upload functionality
3. Add profile completion percentage
4. Add activity timeline
5. Add filters for research papers and projects
6. Add export profile functionality
7. Add social sharing capabilities
