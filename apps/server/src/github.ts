import { Octokit } from '@octokit/rest';

interface GitHubClientConfig {
  pat: string;
  repo: string;
  branch: string;
}

interface ReadResult {
  content: unknown;
  sha: string;
}

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;

  constructor(config: GitHubClientConfig) {
    this.octokit = new Octokit({ auth: config.pat });
    const [owner, repo] = config.repo.split('/');
    this.owner = owner;
    this.repo = repo;
    this.branch = config.branch;
  }

  async readJsonFile(path: string): Promise<ReadResult | null> {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });

      const data = response.data;
      if (!('content' in data) || data.type !== 'file') {
        return null;
      }

      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        content: JSON.parse(decoded),
        sha: data.sha,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async writeJsonViaPR(
    path: string,
    content: unknown,
    fileSha: string,
    userId: string,
  ): Promise<{ newSha: string }> {
    const branchName = `sync/${userId}-${Date.now()}`;
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    const mainRef = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.branch}`,
    });
    const baseSha = mainRef.data.object.sha;

    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    try {
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message: `Update ${userId}'s characters`,
        content: encoded,
        sha: fileSha,
        branch: branchName,
      });

      const pr = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: `Update ${userId}'s characters`,
        head: branchName,
        base: this.branch,
        body: `Automated data sync for user **${userId}**.`,
      });

      await this.octokit.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: pr.data.number,
        merge_method: 'squash',
      });

      await this.octokit.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });

      const updated = await this.readJsonFile(path);
      return { newSha: updated?.sha ?? '' };
    } catch (error) {
      try {
        await this.octokit.git.deleteRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${branchName}`,
        });
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  async writeMultipleFilesViaPR(
    files: Array<{ path: string; content: unknown; sha: string | null }>,
    label: string,
  ): Promise<void> {
    const branchName = `sync/${label}-${Date.now()}`;

    const mainRef = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.branch}`,
    });
    const baseSha = mainRef.data.object.sha;

    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    try {
      for (const file of files) {
        const encoded = Buffer.from(JSON.stringify(file.content, null, 2)).toString('base64');
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: file.path,
          message: `Add ${file.path}`,
          content: encoded,
          ...(file.sha ? { sha: file.sha } : {}),
          branch: branchName,
        });
      }

      const pr = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: `Create user: ${label}`,
        head: branchName,
        base: this.branch,
        body: `Automated account creation for **${label}**.`,
      });

      await this.octokit.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: pr.data.number,
        merge_method: 'squash',
      });

      await this.octokit.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });
    } catch (error) {
      try {
        await this.octokit.git.deleteRef({
          owner: this.owner,
          repo: this.repo,
          ref: `heads/${branchName}`,
        });
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
}
