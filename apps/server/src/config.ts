export interface ServerConfig {
  port: number;
  githubPat: string;
  githubRepo: string;
  githubBranch: string;
  githubDataBranch: string;
  staticDir: string;
}

export function loadConfig(): ServerConfig {
  const githubPat = process.env.GITHUB_PAT;
  if (!githubPat) {
    throw new Error('GITHUB_PAT environment variable is required');
  }

  const githubRepo = process.env.GITHUB_REPO;
  if (!githubRepo) {
    throw new Error('GITHUB_REPO environment variable is required (e.g. owner/repo)');
  }

  const githubBranch = process.env.GITHUB_BRANCH || 'main';

  return {
    port: Number(process.env.PORT) || 3001,
    githubPat,
    githubRepo,
    githubBranch,
    githubDataBranch: process.env.GITHUB_DATA_BRANCH || githubBranch,
    staticDir: process.env.STATIC_DIR || '../../web/dist',
  };
}
