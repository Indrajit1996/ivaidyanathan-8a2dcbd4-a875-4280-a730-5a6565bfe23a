import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TaskStatistics } from '../services/task.service';

Chart.register(...registerables);

@Component({
  selector: 'app-task-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-chart.component.html',
  styleUrls: ['./task-chart.component.css']
})
export class TaskChartComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() statistics: TaskStatistics | null = null;
  @ViewChild('statusChartCanvas') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChartCanvas') priorityChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChartCanvas') typeChartCanvas!: ElementRef<HTMLCanvasElement>;

  private statusChart: Chart | null = null;
  private priorityChart: Chart | null = null;
  private typeChart: Chart | null = null;

  ngOnInit(): void {
    // Charts will be initialized in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Create charts after view is initialized
    if (this.statistics) {
      this.createCharts();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['statistics'] && !changes['statistics'].firstChange) {
      // Update charts when statistics change
      if (this.statistics) {
        this.updateCharts();
      }
    }
  }

  private createCharts(): void {
    this.createStatusChart();
    this.createPriorityChart();
    this.createTypeChart();
  }

  private updateCharts(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
    }
    if (this.priorityChart) {
      this.priorityChart.destroy();
    }
    if (this.typeChart) {
      this.typeChart.destroy();
    }
    this.createCharts();
  }

  private createStatusChart(): void {
    if (!this.statistics || !this.statusChartCanvas) return;

    const ctx = this.statusChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.statusChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['TODO', 'IN PROGRESS', 'COMPLETED'],
        datasets: [{
          label: 'Task Count',
          data: [
            this.statistics.todoCount,
            this.statistics.inProgressCount,
            this.statistics.completedCount
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',  // Blue for TODO
            'rgba(251, 191, 36, 0.7)',  // Yellow for IN_PROGRESS
            'rgba(34, 197, 94, 0.7)'    // Green for COMPLETED
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(251, 191, 36)',
            'rgb(34, 197, 94)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Task Status Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                const total = this.statistics?.totalTasks || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${value} tasks (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  private createPriorityChart(): void {
    if (!this.statistics || !this.priorityChartCanvas) return;

    const ctx = this.priorityChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.priorityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
        datasets: [{
          label: 'Task Count',
          data: [
            this.statistics.priorityBreakdown.urgent,
            this.statistics.priorityBreakdown.high,
            this.statistics.priorityBreakdown.medium,
            this.statistics.priorityBreakdown.low
          ],
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',   // Red for URGENT
            'rgba(249, 115, 22, 0.7)',  // Orange for HIGH
            'rgba(59, 130, 246, 0.7)',  // Blue for MEDIUM
            'rgba(156, 163, 175, 0.7)'  // Gray for LOW
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(249, 115, 22)',
            'rgb(59, 130, 246)',
            'rgb(156, 163, 175)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Task Priority Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                const total = this.statistics?.totalTasks || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${value} tasks (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  private createTypeChart(): void {
    if (!this.statistics || !this.typeChartCanvas) return;

    const ctx = this.typeChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const types = Object.keys(this.statistics.typeBreakdown);
    const counts = Object.values(this.statistics.typeBreakdown);

    // Generate colors dynamically based on number of types
    const colors = this.generateColors(types.length);

    this.typeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: types,
        datasets: [{
          label: 'Task Count',
          data: counts,
          backgroundColor: colors.map(c => c.replace(')', ', 0.7)')),
          borderColor: colors,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Task Type Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                const total = this.statistics?.totalTasks || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${value} tasks (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  private generateColors(count: number): string[] {
    const baseColors = [
      'rgb(59, 130, 246)',   // Blue
      'rgb(16, 185, 129)',   // Green
      'rgb(249, 115, 22)',   // Orange
      'rgb(139, 92, 246)',   // Purple
      'rgb(236, 72, 153)',   // Pink
      'rgb(14, 165, 233)',   // Sky
      'rgb(251, 146, 60)',   // Amber
      'rgb(168, 85, 247)'    // Violet
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  ngOnDestroy(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
    }
    if (this.priorityChart) {
      this.priorityChart.destroy();
    }
    if (this.typeChart) {
      this.typeChart.destroy();
    }
  }
}
