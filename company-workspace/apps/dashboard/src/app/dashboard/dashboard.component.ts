import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../auth/auth.service';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

export interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  priority: string;
}

type SortOption = 'none' | 'priority' | 'title' | 'type';
type FilterOption = 'all' | 'high' | 'medium' | 'low';
type CategoryOption = 'all' | 'Work' | 'Personal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  // Filter and Sort options
  sortBy: SortOption = 'none';
  filterByPriority: FilterOption = 'all';
  filterByCategory: CategoryOption = 'all';

  // Modal state
  isModalOpen = false;
  isEditMode = false;
  editingTaskId: number | null = null;
  originalTaskStatus: string = '';
  newTask = {
    title: '',
    description: '',
    type: '',
    priority: '',
    status: 'TODO'
  };
  private nextTaskId = 8;

  // Original task lists (unfiltered)
  private originalTodoTasks: Task[] = [
    { id: 1, title: 'Design new feature', description: 'Create mockups for the new dashboard layout', type: 'Work', priority: 'high' },
    { id: 2, title: 'Review pull requests', description: 'Check and approve pending PRs', type: 'Personal', priority: 'medium' },
    { id: 3, title: 'Update documentation', description: 'Add API documentation for new endpoints', type: 'Personal', priority: 'low' }
  ];

  private originalInProgressTasks: Task[] = [
    { id: 4, title: 'Implement authentication', description: 'Set up JWT authentication system', type: 'Work', priority: 'high' },
    { id: 5, title: 'Database migration', description: 'Update database schema', type: 'Personal', priority: 'medium' }
  ];

  private originalCompleteTasks: Task[] = [
    { id: 6, title: 'Setup project', description: 'Initialize Angular project with NX', type: 'Work', priority: 'high' },
    { id: 7, title: 'Configure CI/CD', description: 'Setup GitHub Actions pipeline', type: 'Work', priority: 'medium' }
  ];

  // Displayed task lists (filtered and sorted)
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  completeTasks: Task[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    this.applyFiltersAndSort();
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

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    // Update original arrays after drag and drop
    this.updateOriginalArrays();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    // Apply filters and sort to each list
    this.todoTasks = this.filterAndSortTasks([...this.originalTodoTasks]);
    this.inProgressTasks = this.filterAndSortTasks([...this.originalInProgressTasks]);
    this.completeTasks = this.filterAndSortTasks([...this.originalCompleteTasks]);
  }

  private filterAndSortTasks(tasks: Task[]): Task[] {
    let filteredTasks = tasks;

    // Filter by priority
    if (this.filterByPriority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === this.filterByPriority);
    }

    // Filter by category
    if (this.filterByCategory !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.type === this.filterByCategory);
    }

    // Sort tasks
    if (this.sortBy !== 'none') {
      filteredTasks = this.sortTasks(filteredTasks, this.sortBy);
    }

    return filteredTasks;
  }

  private sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
    const sortedTasks = [...tasks];

    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return sortedTasks.sort((a, b) =>
          priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder]
        );
      case 'title':
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
      case 'type':
        return sortedTasks.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return sortedTasks;
    }
  }

  private updateOriginalArrays(): void {
    // This method updates the original arrays after drag and drop
    // to maintain the new order when filters are applied again
    this.originalTodoTasks = [...this.todoTasks];
    this.originalInProgressTasks = [...this.inProgressTasks];
    this.originalCompleteTasks = [...this.completeTasks];
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getTypeClass(type: string): string {
    return `type-${type.toLowerCase()}`;
  }

  openCreateTaskModal(): void {
    this.isEditMode = false;
    this.isModalOpen = true;
  }

  openEditTaskModal(task: Task, currentStatus: string): void {
    this.isEditMode = true;
    this.editingTaskId = task.id;
    this.originalTaskStatus = currentStatus;
    this.newTask = {
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: currentStatus
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.editingTaskId = null;
    this.originalTaskStatus = '';
    this.resetForm();
  }

  isFormValid(): boolean {
    return !!(
      this.newTask.title.trim() &&
      this.newTask.description.trim() &&
      this.newTask.type &&
      this.newTask.priority &&
      this.newTask.status
    );
  }

  createTask(): void {
    if (!this.isFormValid()) {
      return;
    }

    const task: Task = {
      id: this.nextTaskId++,
      title: this.newTask.title.trim(),
      description: this.newTask.description.trim(),
      type: this.newTask.type,
      priority: this.newTask.priority
    };

    // Add task to the appropriate list based on status
    switch (this.newTask.status) {
      case 'TODO':
        this.originalTodoTasks.push(task);
        break;
      case 'IN_PROGRESS':
        this.originalInProgressTasks.push(task);
        break;
      case 'COMPLETE':
        this.originalCompleteTasks.push(task);
        break;
    }

    // Reapply filters and sorting
    this.applyFiltersAndSort();

    // Close modal and reset form
    this.closeModal();
  }

  updateTask(): void {
    if (!this.isFormValid() || this.editingTaskId === null) {
      return;
    }

    const updatedTask: Task = {
      id: this.editingTaskId,
      title: this.newTask.title.trim(),
      description: this.newTask.description.trim(),
      type: this.newTask.type,
      priority: this.newTask.priority
    };

    // Remove task from original status list
    this.removeTaskFromList(this.editingTaskId, this.originalTaskStatus);

    // Add task to new status list
    switch (this.newTask.status) {
      case 'TODO':
        this.originalTodoTasks.push(updatedTask);
        break;
      case 'IN_PROGRESS':
        this.originalInProgressTasks.push(updatedTask);
        break;
      case 'COMPLETE':
        this.originalCompleteTasks.push(updatedTask);
        break;
    }

    // Reapply filters and sorting
    this.applyFiltersAndSort();

    // Close modal
    this.closeModal();
  }

  deleteTask(): void {
    if (this.editingTaskId === null) {
      return;
    }

    // Remove task from the list
    this.removeTaskFromList(this.editingTaskId, this.originalTaskStatus);

    // Reapply filters and sorting
    this.applyFiltersAndSort();

    // Close modal
    this.closeModal();
  }

  private removeTaskFromList(taskId: number, status: string): void {
    switch (status) {
      case 'TODO':
        this.originalTodoTasks = this.originalTodoTasks.filter(t => t.id !== taskId);
        break;
      case 'IN_PROGRESS':
        this.originalInProgressTasks = this.originalInProgressTasks.filter(t => t.id !== taskId);
        break;
      case 'COMPLETE':
        this.originalCompleteTasks = this.originalCompleteTasks.filter(t => t.id !== taskId);
        break;
    }
  }

  private resetForm(): void {
    this.newTask = {
      title: '',
      description: '',
      type: '',
      priority: '',
      status: 'TODO'
    };
  }
}
