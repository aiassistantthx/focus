import { getTasks, saveTasks, getAllDayPlans, saveDayPlanForDate, updateTask } from '../lib/storage';
import { TASK_EXPIRY_DAYS } from '../lib/constants';
import { getToday } from '../lib/utils';

export async function runCleanup(): Promise<void> {
  const today = getToday();

  // Move tasks from past days' plans to backlog
  await cleanupPastDayPlans(today);

  // Remove expired tasks
  await removeExpiredTasks();
}

async function cleanupPastDayPlans(today: string): Promise<void> {
  const allPlans = await getAllDayPlans();

  for (const [date, plan] of Object.entries(allPlans)) {
    // Skip today and future dates
    if (date >= today) continue;

    // Move tasks from this past day to backlog
    for (const taskId of plan.taskIds) {
      await updateTask(taskId, { status: 'backlog' });
    }

    // Clear the past day's plan
    if (plan.taskIds.length > 0) {
      await saveDayPlanForDate(date, { date, taskIds: [] });
    }
  }
}

async function removeExpiredTasks(): Promise<void> {
  const tasks = await getTasks();
  const now = Date.now();
  const expiryMs = TASK_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const activeTasks = tasks.filter((task) => {
    // Never auto-delete completed or deleted tasks
    if (task.status === 'completed' || task.status === 'deleted') return true;

    // Never auto-delete active tasks (they're in today's plan)
    if (task.status === 'active') return true;

    // For backlog tasks, check expiry
    const age = now - task.lastInteractedAt;
    if (age >= expiryMs) {
      return false; // Remove expired backlog tasks
    }
    return true;
  });

  if (activeTasks.length !== tasks.length) {
    await saveTasks(activeTasks);
  }
}
