import { Task, Project, Tag } from '../../lib/types';

export function renderTaskMetadata(
  task: Task,
  projects: Project[],
  tags: Tag[]
): HTMLElement | null {
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const taskTags = (task.tagIds ?? [])
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => t !== undefined);

  if (!project && taskTags.length === 0) {
    return null;
  }

  const container = document.createElement('div');
  container.className = 'task-metadata';

  if (project) {
    const projectBadge = document.createElement('span');
    projectBadge.className = 'project-badge';
    projectBadge.style.setProperty('--project-color', project.color);
    projectBadge.textContent = project.name;
    container.appendChild(projectBadge);
  }

  for (const tag of taskTags) {
    const tagBadge = document.createElement('span');
    tagBadge.className = 'tag-badge';
    tagBadge.style.setProperty('--tag-color', tag.color);
    tagBadge.textContent = tag.name;
    container.appendChild(tagBadge);
  }

  return container;
}
