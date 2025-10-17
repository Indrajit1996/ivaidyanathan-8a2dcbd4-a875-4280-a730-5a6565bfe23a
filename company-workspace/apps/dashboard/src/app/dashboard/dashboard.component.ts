import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../auth/auth.service';
import { TaskService, Task, CreateTaskDto, UpdateTaskDto } from '../services/task.service';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

type SortOption = 'none' | 'priority' | 'title' | 'type';
type FilterOption = 'all' | 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
type CategoryFilterOption = 'all' | 'Work' | 'Personal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  providers: [TaskService, HttpClient],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  // Filter and Sort options
  sortBy: SortOption = 'none';
  filterByPriority: FilterOption = 'all';
  filterByCategory: CategoryFilterOption = 'all';

  // Modal state
  isModalOpen = false;
  isEditMode = false;
  editingTaskId: string | null = null;
  originalTaskStatus: string = '';
  newTask = {
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
    dueDate: '',
    type: 'Work'
  };

  // Loading and error states
  isLoading = false;
  errorMessage = '';

  // Displayed task lists (filtered and sorted)
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  completeTasks: Task[] = [];

  // Original unfiltered tasks
  private allTasks: Task[] = [];

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadTasks();
      }
    });
  }

  /**
   * GET /tasks – List accessible tasks (scoped to role/org)
   */
  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.organizeTasks();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.errorMessage = error.error?.message || 'Failed to load tasks';
        this.isLoading = false;
      }
    });
  }

  /**
   * Organize tasks into TODO, IN_PROGRESS, and COMPLETED lists
   */
  private organizeTasks(): void {
    const filteredTasks = this.applyFilters(this.allTasks);

    this.todoTasks = this.sortTasks(
      filteredTasks.filter(task => task.status === 'TODO')
    );
    this.inProgressTasks = this.sortTasks(
      filteredTasks.filter(task => task.status === 'IN_PROGRESS')
    );
    this.completeTasks = this.sortTasks(
      filteredTasks.filter(task => task.status === 'COMPLETED')
    );
  }

  /**
   * Apply filters to tasks
   */
  private applyFilters(tasks: Task[]): Task[] {
    let filteredTasks = [...tasks];

    // Filter by priority
    if (this.filterByPriority !== 'all') {
      filteredTasks = filteredTasks.filter(
        task => task.priority === this.filterByPriority
      );
    }

    // Filter by category
    if (this.filterByCategory !== 'all') {
      filteredTasks = filteredTasks.filter(
        task => task.type === this.filterByCategory
      );
    }

    return filteredTasks;
  }

  /**
   * Sort tasks based on selected option
   */
  private sortTasks(tasks: Task[]): Task[] {
    if (this.sortBy === 'none') {
      return tasks;
    }

    const sortedTasks = [...tasks];

    switch (this.sortBy) {
      case 'priority':
        const priorityOrder = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
        return sortedTasks.sort((a, b) =>
          priorityOrder[a.priority] - priorityOrder[b.priority]
        );
      case 'title':
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
      case 'type':
        return sortedTasks.sort((a, b) => {
          const typeA = a.type || '';
          const typeB = b.type || '';
          return typeA.localeCompare(typeB);
        });
      default:
        return sortedTasks;
    }
  }

  onSortChange(): void {
    this.organizeTasks();
  }

  onFilterChange(): void {
    this.organizeTasks();
  }

  /**
   * Handle drag and drop between task lists
   * Automatically calls PUT /tasks/:id to update status
   */
  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];

      // Determine new status based on container
      let newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' = 'TODO';
      if (event.container.data === this.inProgressTasks) {
        newStatus = 'IN_PROGRESS';
      } else if (event.container.data === this.completeTasks) {
        newStatus = 'COMPLETED';
      }

      // Update task status via API
      this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
        next: (updatedTask) => {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
          // Update the task in the list with the response
          event.container.data[event.currentIndex] = updatedTask;

          // Update in allTasks array
          const index = this.allTasks.findIndex(t => t.id === updatedTask.id);
          if (index !== -1) {
            this.allTasks[index] = updatedTask;
          }
        },
        error: (error) => {
          console.error('Error updating task status:', error);
          this.errorMessage = error.error?.message || 'Failed to update task status. You may not have permission.';
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getTypeClass(type: string): string {
    return `type-${type.toLowerCase()}`;
  }

  openCreateTaskModal(): void {
    this.isEditMode = false;
    this.isModalOpen = true;
    this.resetForm();
  }

  openEditTaskModal(task: Task, currentStatus: string): void {
    this.isEditMode = true;
    this.editingTaskId = task.id;
    this.originalTaskStatus = currentStatus;
    this.newTask = {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      type: task.type || 'Work'
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.editingTaskId = null;
    this.originalTaskStatus = '';
    this.errorMessage = '';
    this.resetForm();
  }

  isFormValid(): boolean {
    return !!(
      this.newTask.title.trim() &&
      this.newTask.description.trim() &&
      this.newTask.priority &&
      this.newTask.status
    );
  }

  /**
   * POST /tasks – Create task (with permission check)
   */
  createTask(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const taskData: CreateTaskDto = {
      title: this.newTask.title.trim(),
      description: this.newTask.description.trim(),
      priority: this.newTask.priority,
      status: this.newTask.status,
      type: this.newTask.type,
      dueDate: this.newTask.dueDate || undefined
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.createTask(taskData).subscribe({
      next: (task) => {
        this.allTasks.push(task);
        this.organizeTasks();
        this.closeModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.errorMessage = error.error?.message || 'Failed to create task. You may not have permission.';
        this.isLoading = false;
      }
    });
  }

  /**
   * PUT /tasks/:id – Edit task (if permitted)
   */
  updateTask(): void {
    if (!this.isFormValid() || !this.editingTaskId) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const updateData: UpdateTaskDto = {
      title: this.newTask.title.trim(),
      description: this.newTask.description.trim(),
      priority: this.newTask.priority,
      status: this.newTask.status,
      type: this.newTask.type,
      dueDate: this.newTask.dueDate || undefined
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.updateTask(this.editingTaskId, updateData).subscribe({
      next: (updatedTask) => {
        // Update task in allTasks array
        const index = this.allTasks.findIndex(t => t.id === this.editingTaskId);
        if (index !== -1) {
          this.allTasks[index] = updatedTask;
        }
        this.organizeTasks();
        this.closeModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.errorMessage = error.error?.message || 'Failed to update task. You may not have permission.';
        this.isLoading = false;
      }
    });
  }

  /**
   * DELETE /tasks/:id – Delete task (if permitted)
   */
  deleteTask(): void {
    if (!this.editingTaskId) {
      return;
    }

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.deleteTask(this.editingTaskId).subscribe({
      next: () => {
        // Remove task from allTasks array
        this.allTasks = this.allTasks.filter(t => t.id !== this.editingTaskId);
        this.organizeTasks();
        this.closeModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.errorMessage = error.error?.message || 'Failed to delete task. You may not have permission.';
        this.isLoading = false;
      }
    });
  }

  private resetForm(): void {
    this.newTask = {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      type: 'Work'
    };
  }

  /**
   * Check if current user can edit tasks
   */
  canEditTasks(): boolean {
    return this.currentUser?.role === 'OWNER' || this.currentUser?.role === 'ADMIN';
  }

  /**
   * Check if current user can delete tasks
   */
  canDeleteTasks(): boolean {
    return this.currentUser?.role === 'OWNER' || this.currentUser?.role === 'ADMIN';
  }
}
