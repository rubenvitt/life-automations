import { Injectable, Logger } from '@nestjs/common';
import { TodoistApi } from '@doist/todoist-api-typescript';
import { ConfigService } from '@nestjs/config';
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, format, subWeeks, subMonths } from 'date-fns';

type ProjectColor = 'project' | 'lebensbereich';

const colorMap = {
  project: 'sky_blue',
  lebensbereich: 'orange',
};

@Injectable()
export class TodoistService {
  private readonly logger: Logger = new Logger(TodoistService.name);
  private readonly todoistApi: TodoistApi;

  constructor(configService: ConfigService) {
    const todoistApiKey = configService.getOrThrow<string>('TODOIST_API_KEY');
    this.todoistApi = new TodoistApi(todoistApiKey);
  }

  async createProject(
    projectLabel: string,
    projectColor: ProjectColor,
    parentId?: string,
  ) {
    this.logger.log(
      `Creating project with color '${projectColor.valueOf().toString()}'`,
    );
    try {
      const project = await this.todoistApi.addProject({
        name: projectLabel,
        color: colorMap[projectColor],
        viewStyle: 'list',
        parentId,
      });

      await this.todoistApi.addTask({
        projectId: project.id,
        content: 'Mein neues Projekt prüfen',
        labels: ['Automatisch angelegt'],
        dueString: 'heute',
        dueLang: 'de',
      });

      return project;
    } catch (e) {
      console.log('Got error', e);
      throw e;
    }
  }

  async createTask(title: string, note: string) {
    await this.todoistApi.addTask({
      content: title,
      description: note,
    });
  }

  async getAllProjects() {
    return await this.todoistApi.getProjects();
  }

  async getProjectTasks(projectId: string) {
    return await this.todoistApi.getTasks({ projectId });
  }

  async getCompletedTasks(projectId?: string, since?: string, until?: string) {
    // Use filter to get completed tasks for a project within date range
    let query = 'completed';
    
    if (projectId) {
      query += ` & #${projectId}`;
    }
    
    if (since && until) {
      query += ` & completed_on: ${since}..${until}`;
    } else if (since) {
      query += ` & completed_on: ${since}..`;
    } else if (until) {
      query += ` & completed_on: ..${until}`;
    }

    try {
      return await this.todoistApi.getTasksByFilter({
        query,
        limit: 200
      });
    } catch (error) {
      this.logger.warn('Failed to fetch completed tasks with filter, returning empty result:', error.message);
      return { results: [], nextCursor: null };
    }
  }

  async getProjectStats(projectId: string) {
    const [activeTasks, completedTasks] = await Promise.all([
      this.getProjectTasks(projectId),
      this.getCompletedTasks(projectId, format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
    ]);

    const totalTasks = activeTasks.results.length + completedTasks.results.length;
    const completionRate = totalTasks > 0 ? (completedTasks.results.length / totalTasks) * 100 : 0;

    return {
      projectId,
      activeTasks: activeTasks.results.length,
      completedTasks: completedTasks.results.length,
      totalTasks,
      completionRate,
      overdueTasks: activeTasks.results.filter(task => task.due && new Date(task.due.date) < new Date()).length
    };
  }

  async getWeeklyStats(projectId?: string) {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    const completedThisWeek = await this.getCompletedTasks(projectId, weekStart, weekEnd);
    
    return {
      period: `${weekStart} - ${weekEnd}`,
      completedTasks: completedThisWeek.results.length,
      tasks: completedThisWeek.results
    };
  }

  async getMonthlyStats(projectId?: string) {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    
    const completedThisMonth = await this.getCompletedTasks(projectId, monthStart, monthEnd);
    
    return {
      period: `${monthStart} - ${monthEnd}`,
      completedTasks: completedThisMonth.results.length,
      tasks: completedThisMonth.results
    };
  }
}
