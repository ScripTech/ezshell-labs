# Lab Task Editor

The Lab Task Editor is a comprehensive admin feature that allows editing lab questions/tasks and managing their status.

## Features

### Task Management
- **Create Tasks**: Add new tasks to any lab with markdown description support
- **Edit Tasks**: Modify existing task details including title, description, points, and difficulty
- **Delete Tasks**: Remove tasks with confirmation dialog
- **Reorder Tasks**: Manage task ordering within a lab

### Status Management
- **Enable/Disable Tasks**: Toggle task visibility for users
- **Status Tracking**: Set task status (active, maintenance, deprecated, etc.)
- **Maintenance Messages**: Add custom messages when tasks are disabled

### Security
- **Admin Only**: Only users with admin role can access the task editor
- **Authentication**: Integrated with NextAuth session management
- **API Protection**: All endpoints require proper authentication

## Components

### LabTaskEditor
Main component that provides:
- Task list table with sortable columns
- Bulk actions and quick status toggles
- Create/Edit/Delete operations
- Admin permission checks

### TaskEditDialog
Modal form for task creation/editing:
- Rich form validation with Zod schemas
- Markdown editor for task descriptions
- Status management controls
- Real-time validation feedback

## Usage

The task editor is integrated into the admin lab edit page at `/admin/labs/[id]/edit` under the "Tasks & Questions" tab.

### Navigation
1. Go to Admin Labs
2. Click "Edit" on any lab
3. Switch to "Tasks & Questions" tab
4. Use the interface to manage tasks

### Creating Tasks
1. Click "Add Task" button
2. Fill in required fields (title, description, points)
3. Set optional fields (difficulty, status, maintenance message)
4. Toggle enabled status as needed
5. Save the task

### Editing Tasks
1. Click the action menu (⋮) on any task row
2. Select "Edit Task"
3. Modify fields in the dialog
4. Save changes

### Quick Actions
- **Enable/Disable**: Use the action menu for quick status toggles
- **Delete**: Remove tasks with confirmation
- **Status Updates**: Change task status without full edit

## Technical Implementation

### Database Schema
Tasks are stored in the `lab_tasks` table with these key fields:
- `isEnabled`: Boolean for visibility control
- `status`: Enum for task lifecycle status
- `maintenanceMessage`: Optional message for disabled tasks

### API Endpoints
- `GET /api/labs/[id]/tasks` - Fetch lab tasks
- `POST /api/labs/[id]/tasks` - Create new task
- `GET /api/labs/[id]/tasks/[taskId]` - Get specific task
- `PUT /api/labs/[id]/tasks/[taskId]` - Update task
- `PATCH /api/labs/[id]/tasks/[taskId]` - Update task status
- `DELETE /api/labs/[id]/tasks/[taskId]` - Delete task

### Type Safety
Full TypeScript support with:
- Interface definitions in `@/types/lab-tasks`
- Form validation schemas with Zod
- Service layer with typed methods

## Dependencies

### UI Components
- shadcn/ui components (Table, Dialog, Form, etc.)
- Lucide React icons
- React Hook Form with Zod validation

### Services
- LabTasksService for API communication
- NextAuth for authentication
- Sonner for toast notifications

## Future Enhancements

### Planned Features
- Drag & drop task reordering
- Bulk task operations
- Task templates
- Import/Export functionality
- Version history tracking
- Advanced status workflows

### UI Improvements
- Enhanced markdown editor
- Preview mode for tasks
- Better responsive design
- Advanced filtering options

## Troubleshooting

### Common Issues
- **Permission denied**: Ensure user has admin role
- **Tasks not loading**: Check API endpoint authentication
- **Save failures**: Verify form validation and network connectivity

### Development
- Components are in `/src/components/lab-task-editor/`
- Type definitions in `/src/types/lab-tasks.ts`
- Service layer in `/src/services/labTasksService.ts`
- API routes in `/src/app/api/labs/[id]/tasks/`
