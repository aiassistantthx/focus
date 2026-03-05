import { Project, Tag } from '../../lib/types';
import { getFilterState, setProjectFilter, toggleTagFilter, FilterState } from '../filter-state';

export function renderFilterBar(
  projects: Project[],
  tags: Tag[],
  onFilterChange: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'filter-bar';

  const filter = getFilterState();

  // Project dropdown
  const projectSelect = document.createElement('select');
  projectSelect.className = 'filter-project-select';

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Projects';
  projectSelect.appendChild(allOption);

  for (const project of projects) {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    if (filter.projectId === project.id) {
      option.selected = true;
    }
    projectSelect.appendChild(option);
  }

  projectSelect.addEventListener('change', () => {
    setProjectFilter(projectSelect.value || null);
    onFilterChange();
  });

  container.appendChild(projectSelect);

  // Tags container
  if (tags.length > 0) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'filter-tags';

    for (const tag of tags) {
      const tagBtn = document.createElement('button');
      tagBtn.className = 'filter-tag-btn';
      if (filter.tagIds.includes(tag.id)) {
        tagBtn.classList.add('active');
      }
      tagBtn.style.setProperty('--tag-color', tag.color);
      tagBtn.textContent = tag.name;

      tagBtn.addEventListener('click', () => {
        toggleTagFilter(tag.id);
        onFilterChange();
      });

      tagsContainer.appendChild(tagBtn);
    }

    container.appendChild(tagsContainer);
  }

  return container;
}
