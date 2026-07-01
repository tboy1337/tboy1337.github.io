import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PROJECTS_END_MARKER,
  PROJECTS_START_MARKER,
  escapeHtml,
  fetchRepoStars,
  getSortableStarCount,
  refreshProjectStars,
  renderProjectCard,
  renderProjectsSection,
  sortProjectsByStars,
  updateIndexHtml,
  withSortedProjects
} from '../../lib/projects.mjs';

/** @type {import('../../lib/projects.mjs').Project} */
const sampleProject = {
  id: 'sample',
  title: 'Sample Project',
  description: 'A sample description.',
  tags: [
    { label: 'Python', color: 'blue-600' },
    { label: 'Networking', color: 'gray-700' }
  ],
  github: {
    type: 'repository',
    owner: 'tboy1337',
    repo: 'sample',
    url: 'https://github.com/tboy1337/sample'
  },
  button: {
    text: 'View Project',
    gradient: 'from-blue-500 to-indigo-600',
    hoverGradient: 'hover:from-blue-600 hover:to-indigo-700'
  },
  stars: 12
};

describe('projects', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes sortable star counts', () => {
    expect(getSortableStarCount(5)).toBe(5);
    expect(getSortableStarCount(0)).toBe(0);
    expect(getSortableStarCount(null)).toBe(0);
  });
  it('sorts projects by stars descending with alphabetical tie-breaking', () => {
    const sorted = sortProjectsByStars([
      { ...sampleProject, id: 'b', title: 'Bravo', stars: 5 },
      { ...sampleProject, id: 'a', title: 'Alpha', stars: 10 },
      { ...sampleProject, id: 'c', title: 'Charlie', stars: 5 },
      { ...sampleProject, id: 'd', title: 'Delta', stars: 0 },
      { ...sampleProject, id: 'e', title: 'Echo', stars: null, github: { type: 'organization', url: 'https://github.com/example' } }
    ]);

    expect(sorted.map((project) => project.title)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta',
      'Echo'
    ]);
  });

  it('renders a star badge only when stars are greater than zero', () => {
    const withStars = renderProjectCard({ ...sampleProject, stars: 3 });
    const withoutStars = renderProjectCard({ ...sampleProject, stars: 0 });
    const orgProject = renderProjectCard({
      ...sampleProject,
      stars: null,
      github: { type: 'organization', url: 'https://github.com/example' }
    });

    expect(withStars).toContain('role="img" aria-label="3 GitHub stars"');
    expect(withStars).toContain('<i class="fas fa-star"');
    expect(withoutStars).not.toContain('fas fa-star');
    expect(orgProject).not.toContain('fas fa-star');
  });

  it('escapes HTML in project content', () => {
    const html = renderProjectCard({
      ...sampleProject,
      title: 'Test & Co <script>',
      description: 'Uses "quotes" and <tags>'
    });

    expect(html).toContain('Test &amp; Co &lt;script&gt;');
    expect(html).toContain('Uses &quot;quotes&quot; and &lt;tags&gt;');
  });

  it('renders a sorted projects section', () => {
    const section = renderProjectsSection([
      { ...sampleProject, id: 'low', title: 'Low Stars', stars: 1 },
      { ...sampleProject, id: 'high', title: 'High Stars', stars: 99 }
    ]);

    expect(section.indexOf('High Stars')).toBeLessThan(section.indexOf('Low Stars'));
    expect(section).toContain('project-card');
  });

  it('replaces content between project markers in index.html', () => {
    const html = `<div>
${PROJECTS_START_MARKER}
old content
${PROJECTS_END_MARKER}
</div>`;

    const updated = updateIndexHtml(html, 'new content');

    expect(updated).toContain(`${PROJECTS_START_MARKER}\nnew content\n                ${PROJECTS_END_MARKER}`);
    expect(updated).not.toContain('old content');
  });

  it('throws when project markers are missing', () => {
    expect(() => updateIndexHtml('<html></html>', 'cards')).toThrow(/markers not found/i);
  });

  it('escapes attribute values', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('fetches repository star counts from the GitHub API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 42 })
    }));

    await expect(fetchRepoStars('tboy1337', 'sample', 'token-123')).resolves.toBe(42);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/tboy1337/sample',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123'
        })
      })
    );
  });

  it('throws when the GitHub API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    }));

    await expect(fetchRepoStars('tboy1337', 'missing')).rejects.toThrow(/404/);
  });

  it('refreshes stars for repositories and leaves organizations unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 9 })
    }));

    const refreshed = await refreshProjectStars([
      { ...sampleProject, id: 'repo', stars: null },
      {
        ...sampleProject,
        id: 'org',
        stars: null,
        github: { type: 'organization', url: 'https://github.com/example' }
      }
    ]);

    expect(refreshed[0]?.stars).toBe(9);
    expect(refreshed[1]?.stars).toBeNull();
  });

  it('returns sorted project data', () => {
    const sorted = withSortedProjects({
      lastUpdated: null,
      projects: [
        { ...sampleProject, id: 'low', title: 'Low Stars', stars: 1 },
        { ...sampleProject, id: 'high', title: 'High Stars', stars: 99 }
      ]
    });

    expect(sorted.projects[0]?.title).toBe('High Stars');
  });
});
