import { Task } from '../lib/types';

export interface FilterState {
  projectId: string | null;
  tagIds: string[];
}

let currentFilter: FilterState = {
  projectId: null,
  tagIds: [],
};

export function getFilterState(): FilterState {
  return { ...currentFilter };
}

export function setProjectFilter(projectId: string | null): void {
  currentFilter.projectId = projectId;
}

export function toggleTagFilter(tagId: string): void {
  const index = currentFilter.tagIds.indexOf(tagId);
  if (index === -1) {
    currentFilter.tagIds.push(tagId);
  } else {
    currentFilter.tagIds.splice(index, 1);
  }
}

export function clearFilters(): void {
  currentFilter = {
    projectId: null,
    tagIds: [],
  };
}

export function filterTasks(tasks: Task[], filter: FilterState): Task[] {
  return tasks.filter((task) => {
    // Filter by project
    if (filter.projectId !== null) {
      if (task.projectId !== filter.projectId) {
        return false;
      }
    }

    // Filter by tags (task must have ALL selected tags)
    if (filter.tagIds.length > 0) {
      const taskTagIds = task.tagIds ?? [];
      for (const tagId of filter.tagIds) {
        if (!taskTagIds.includes(tagId)) {
          return false;
        }
      }
    }

    return true;
  });
}
