/**
 * Project star fetching, sorting, and HTML rendering for the portfolio.
 */

/** @typedef {{ label: string, color: string }} ProjectTag */
/** @typedef {{ type: 'repository', owner: string, repo: string, url: string } | { type: 'organization', url: string }} ProjectGithub */
/** @typedef {{ text: string, gradient: string, hoverGradient: string }} ProjectButton */
/** @typedef {{ id: string, title: string, description: string, tags: ProjectTag[], github: ProjectGithub, button: ProjectButton, stars: number | null }} Project */
/** @typedef {{ lastUpdated: string | null, projects: Project[] }} ProjectsData */

export const PROJECTS_START_MARKER = '<!-- projects:start -->';
export const PROJECTS_END_MARKER = '<!-- projects:end -->';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * @param {number | null | undefined} stars
 * @returns {number}
 */
export function getSortableStarCount(stars) {
  if (typeof stars === 'number' && stars > 0) {
    return stars;
  }
  return 0;
}

/**
 * @param {Project[]} projects
 * @returns {Project[]}
 */
export function sortProjectsByStars(projects) {
  return [...projects].sort((left, right) => {
    const starDiff = getSortableStarCount(right.stars) - getSortableStarCount(left.stars);
    if (starDiff !== 0) {
      return starDiff;
    }
    return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });
  });
}

/**
 * @param {string} owner
 * @param {string} repo
 * @param {string | undefined} token
 * @returns {Promise<number>}
 */
export async function fetchRepoStars(owner, repo, token) {
  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'tboy1337-portfolio-update',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API error for ${owner}/${repo}: ${response.status} ${response.statusText}`);
  }

  /** @type {{ stargazers_count?: number }} */
  const payload = await response.json();
  return typeof payload.stargazers_count === 'number' ? payload.stargazers_count : 0;
}

/**
 * @param {Project[]} projects
 * @param {string | undefined} token
 * @returns {Promise<Project[]>}
 */
export async function refreshProjectStars(projects, token) {
  const updatedProjects = await Promise.all(
    projects.map(async (project) => {
      if (project.github.type !== 'repository') {
        return { ...project, stars: null };
      }

      const stars = await fetchRepoStars(project.github.owner, project.github.repo, token);
      return { ...project, stars };
    })
  );

  return updatedProjects;
}

/**
 * @param {ProjectTag} tag
 * @returns {string}
 */
function renderTag(tag) {
  return `<span class="tag bg-${tag.color}">${escapeHtml(tag.label)}</span>`;
}

/**
 * @param {number} stars
 * @returns {string}
 */
function renderStarBadge(stars) {
  if (stars <= 0) {
    return '';
  }

  const label = `${stars} GitHub star${stars === 1 ? '' : 's'}`;
  return `<span class="text-yellow-400 text-sm font-medium shrink-0" role="img" aria-label="${escapeHtml(label)}"><i class="fas fa-star" aria-hidden="true"></i> ${stars}</span>`;
}

/**
 * @param {Project} project
 * @param {number | null} stars
 * @returns {string}
 */
function renderTitleBlock(project, stars) {
  const starBadgeHtml = stars !== null && stars > 0 ? renderStarBadge(stars) : '';

  if (!starBadgeHtml) {
    return `<h3 class="text-xl font-semibold mb-2">${escapeHtml(project.title)}</h3>`;
  }

  return `<div class="flex items-center justify-between gap-3 mb-2">
                            <h3 class="text-xl font-semibold">${escapeHtml(project.title)}</h3>
                            ${starBadgeHtml}
                        </div>`;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * @param {Project} project
 * @returns {string}
 */
export function renderProjectCard(project) {
  const tagsHtml = project.tags.map(renderTag).join('\n                            ');
  const stars = typeof project.stars === 'number' ? project.stars : null;
  const titleBlockHtml = renderTitleBlock(project, stars);
  const ariaLabel = project.button.text === 'View Organization'
    ? `View ${project.title} organization on GitHub`
    : `View ${project.title} on GitHub`;

  return `                <div class="project-card bg-black/40 p-6 rounded-lg backdrop-blur-sm border border-white/10">
                    <div class="card-content">
                        <div class="mb-3">
                            ${tagsHtml}
                        </div>
                        ${titleBlockHtml}
                        <p class="mb-4 text-gray-300">${escapeHtml(project.description)}</p>
                    </div>
                    <a href="${escapeHtml(project.github.url)}" class="inline-block bg-gradient-to-r ${project.button.gradient} ${project.button.hoverGradient} text-white px-4 py-2 rounded transition-colors" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(ariaLabel)}">${escapeHtml(project.button.text)}</a>
                </div>`;
}

/**
 * @param {Project[]} projects
 * @returns {string}
 */
export function renderProjectsSection(projects) {
  return sortProjectsByStars(projects).map(renderProjectCard).join('\n');
}

/**
 * @param {string} html
 * @param {string} sectionHtml
 * @returns {string}
 */
export function updateIndexHtml(html, sectionHtml) {
  const startIndex = html.indexOf(PROJECTS_START_MARKER);
  const endIndex = html.indexOf(PROJECTS_END_MARKER);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('Project markers not found in index.html');
  }

  const before = html.slice(0, startIndex + PROJECTS_START_MARKER.length);
  const after = html.slice(endIndex);
  return `${before}\n${sectionHtml}\n                ${after}`;
}

/**
 * @param {ProjectsData} data
 * @returns {ProjectsData}
 */
export function withSortedProjects(data) {
  return {
    ...data,
    projects: sortProjectsByStars(data.projects)
  };
}
