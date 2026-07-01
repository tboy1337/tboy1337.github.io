import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  refreshProjectStars,
  renderProjectsSection,
  updateIndexHtml
} from '../lib/projects.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectsPath = path.join(rootDir, 'data', 'projects.json');
const indexPath = path.join(rootDir, 'index.html');

/**
 * @param {string} filePath
 * @returns {string}
 */
function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

/**
 * @param {string} filePath
 * @param {string} content
 */
function writeText(filePath, content) {
  writeFileSync(filePath, content, 'utf8');
}

/**
 * @returns {Promise<boolean>}
 */
async function main() {
  const token = process.env.GITHUB_TOKEN;
  const originalProjectsJson = readText(projectsPath);
  const originalIndexHtml = readText(indexPath);

  /** @type {import('../lib/projects.mjs').ProjectsData} */
  const projectsData = JSON.parse(originalProjectsJson);
  const refreshedProjects = await refreshProjectStars(projectsData.projects, token);
  const updatedProjectsData = {
    lastUpdated: new Date().toISOString(),
    projects: refreshedProjects
  };

  const updatedProjectsJson = `${JSON.stringify(updatedProjectsData, null, 2)}\n`;
  const sectionHtml = renderProjectsSection(refreshedProjects);
  const updatedIndexHtml = updateIndexHtml(originalIndexHtml, sectionHtml);

  const projectsChanged = updatedProjectsJson !== originalProjectsJson;
  const indexChanged = updatedIndexHtml !== originalIndexHtml;

  if (projectsChanged) {
    writeText(projectsPath, updatedProjectsJson);
  }

  if (indexChanged) {
    writeText(indexPath, updatedIndexHtml);
  }

  if (projectsChanged || indexChanged) {
    console.log('Updated project star counts and portfolio ordering.');
  } else {
    console.log('Project star counts and ordering are already up to date.');
  }

  return projectsChanged || indexChanged;
}

main()
  .then((changed) => {
    process.exitCode = 0;
    if (process.env.GITHUB_OUTPUT) {
      writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: 'a' });
    }
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
