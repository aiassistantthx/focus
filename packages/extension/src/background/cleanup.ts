import { getTasks, saveTasks } from '../lib/storage';
import { TASK_EXPIRY_DAYS } from '../lib/constants';

export async function runCleanup(): Promise<void> {
  const tasks = await getTasks();
  const now = Date.now();
  const expiryMs = TASK_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const activeTasks = tasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'deleted') return true;
    const age = now - task.lastInteractedAt;
    if (age >= expiryMs) {
      return false; // Remove expired tasks
    }
    return true;
  });

  if (activeTasks.length !== tasks.length) {
    await saveTasks(activeTasks);
  }
}
