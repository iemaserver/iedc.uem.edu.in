# Research Paper & Ongoing Project Management System

## Overview
A complete management system for research papers and ongoing projects with role-based access control for Students, Teachers, and Admins.

## System Features

### 🎓 Student Capabilities
- **Upload Research Papers**: Students can upload research papers with metadata
- **Upload Ongoing Projects**: Students can create and manage ongoing projects
- **Multi-Select Faculty Advisors**: Students can select multiple faculty advisors
- **Multi-Select Team Members**: Students can select other students as team members
- **File Uploads**: Support for documents, images, and project files
- **Keywords Management**: Add and manage keywords for submissions
- **Project Types**: Personal, Collaborative, or In-IEDC projects

### 👨‍🏫 Teacher Capabilities
- **Review Submissions**: View all submissions where they are assigned as advisors
- **Accept Advisorship**: Teachers can accept to become faculty advisors for submissions
- **Approve/Reject Papers**: Teachers can approve or reject research papers
- **Manage Project Status**: Update ongoing project statuses
- **View Submission Details**: Complete view of student submissions with files
- **Dashboard Overview**: Centralized view of all submissions requiring attention

### 🔧 Admin Capabilities
- **Complete System Access**: View and manage all submissions
- **Bulk Operations**: 
  - Bulk status updates
  - Bulk advisor assignments
  - Bulk selection and management
- **User Management**: Access to all users in the system
- **Advanced Filtering**: Filter by status, student, project type, etc.
- **System Analytics**: Overview of submission statistics

## API Endpoints

### Student APIs
- `POST /api/student/research-paper` - Upload research paper
- `GET /api/student/research-paper` - Get student's papers
- `DELETE /api/student/research-paper` - Delete papers
- `POST /api/student/ongoing-projects` - Upload ongoing project
- `GET /api/student/ongoing-projects` - Get student's projects

### Teacher APIs
- `GET /api/teacher/research-paper` - Get papers for review
- `PUT /api/teacher/research-paper/[id]` - Update paper status
- `POST /api/teacher/research-paper/accept-advisorship` - Accept advisor role
- `GET /api/teacher/ongoing-projects` - Get projects for review
- `PUT /api/teacher/ongoing-projects/[id]` - Update project status
- `POST /api/teacher/ongoing-projects/accept-advisorship` - Accept advisor role

### Admin APIs
- `GET /api/admin/research-paper` - Get all papers
- `PATCH /api/admin/research-paper/bulk-actions` - Bulk status updates
- `POST /api/admin/research-paper/bulk-actions` - Bulk advisor assignments
- `GET /api/admin/ongoing-projects` - Get all projects
- `PATCH /api/admin/ongoing-projects/bulk-actions` - Bulk operations

### General APIs
- `GET /api/general/users` - Get users by type (students/teachers)

## Database Schema
The system uses the existing Prisma schema with these key models:

### ResearchPaper
- Student ownership
- Faculty advisors (many-to-many with User)
- Team members (many-to-many with User)
- Status tracking (UPLOADED, UNDER_REVIEW, ACCEPTED, REJECTED)
- File attachments and metadata

### OngoingProject
- Student ownership
- Faculty advisors (many-to-many with User)
- Team members (many-to-many with User)
- Status tracking (ONGOING, COMPLETED, ACCEPTED, REJECTED)
- Project timeline and files

## Frontend Components

### Student Components
- `upload-research-paper-form.tsx` - Research paper upload form with multi-select
- `upload-ongoing-project-form.tsx` - Ongoing project upload form
- `research-paper-dashboard.tsx` - Student dashboard for papers
- `ongoing-project-dashboard.tsx` - Student dashboard for projects

### Teacher Components
- `teacher-submission-review.tsx` - Teacher review dashboard
- `research-paper-management.tsx` - Paper management interface
- `ongoing-project-management.tsx` - Project management interface

### Admin Components
- `admin-submission-management.tsx` - Complete admin interface with bulk operations

## Workflow

### Student Workflow
1. Student uploads research paper/project
2. Student selects faculty advisors and team members
3. System sets status to UPLOADED
4. Student can view submission status

### Teacher Workflow
1. Teacher sees available submissions needing advisors
2. Teacher can accept advisorship for submissions
3. Teacher reviews submissions they advise
4. Teacher approves/rejects submissions
5. System updates status accordingly

### Admin Workflow
1. Admin has complete visibility of all submissions
2. Admin can perform bulk operations
3. Admin can assign advisors in bulk
4. Admin can override any status or assignment

## Key Features Implemented

### Multi-Select Functionality
- ✅ Faculty advisor selection with search
- ✅ Team member selection with search
- ✅ Support for multiple advisors per submission

### Status Management
- ✅ Automated status transitions
- ✅ Role-based status update permissions
- ✅ Bulk status updates for admins

### File Management
- ✅ Document upload support
- ✅ Image upload for thumbnails
- ✅ File viewing and download

### Security
- ✅ Role-based access control
- ✅ User authentication required
- ✅ Students can only manage their own submissions
- ✅ Teachers can only manage submissions they advise
- ✅ Admins have full access

### User Experience
- ✅ Responsive design
- ✅ Search and filter functionality
- ✅ Real-time status updates
- ✅ Toast notifications for actions
- ✅ Comprehensive error handling

## Usage Instructions

### For Students
1. Navigate to the student dashboard
2. Click "Upload Research Paper" or "Upload Ongoing Project"
3. Fill in the form details
4. Select faculty advisors from the multi-select dropdown
5. Select team members if it's a collaborative project
6. Upload files and images
7. Submit for review

### For Teachers
1. Navigate to the teacher dashboard
2. View submissions in the "Submission Review" section
3. Accept advisorship for papers/projects you want to supervise
4. Review and approve/reject submissions you advise
5. View detailed information about each submission

### For Admins
1. Navigate to the admin dashboard
2. Use the "Submission Management" interface
3. Filter and search submissions
4. Select multiple submissions for bulk operations
5. Assign advisors or update statuses in bulk

## Technical Stack
- **Backend**: Next.js API Routes with TypeScript
- **Database**: CockroachDB with Prisma ORM
- **Frontend**: React with TypeScript
- **UI Components**: shadcn/ui
- **Form Handling**: React Hook Form with Zod validation
- **File Upload**: Appwrite integration
- **Styling**: Tailwind CSS

This system provides a complete workflow for managing academic research papers and ongoing projects with proper role separation and comprehensive management capabilities.