import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from '../github.js';

const mockGetContent = vi.fn();
const mockCreateRef = vi.fn();
const mockCreateOrUpdateFileContents = vi.fn();
const mockCreatePull = vi.fn();
const mockMergePull = vi.fn();
const mockDeleteRef = vi.fn();
const mockGetRef = vi.fn();

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      getContent: mockGetContent,
      createOrUpdateFileContents: mockCreateOrUpdateFileContents,
    },
    git: {
      createRef: mockCreateRef,
      getRef: mockGetRef,
      deleteRef: mockDeleteRef,
    },
    pulls: {
      create: mockCreatePull,
      merge: mockMergePull,
    },
  })),
}));

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubClient({
      pat: 'test-token',
      repo: 'owner/repo',
      branch: 'main',
    });
  });

  describe('readJsonFile', () => {
    it('reads and decodes a JSON file from the repo', async () => {
      const content = JSON.stringify([{ id: 'gandalf', name: 'Gandalf' }]);
      mockGetContent.mockResolvedValue({
        data: {
          type: 'file',
          content: Buffer.from(content).toString('base64'),
          sha: 'abc123',
        },
      });

      const result = await client.readJsonFile('data/users/alice/characters.json');
      expect(result).toEqual({
        content: [{ id: 'gandalf', name: 'Gandalf' }],
        sha: 'abc123',
      });
      expect(mockGetContent).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        path: 'data/users/alice/characters.json',
        ref: 'main',
      });
    });

    it('returns null when file not found', async () => {
      mockGetContent.mockRejectedValue({ status: 404 });

      const result = await client.readJsonFile('data/users/nobody/characters.json');
      expect(result).toBeNull();
    });
  });

  describe('writeJsonViaPR', () => {
    it('creates a branch, commits, opens PR, merges, and cleans up', async () => {
      mockGetRef.mockResolvedValue({ data: { object: { sha: 'main-sha-123' } } });
      mockCreateRef.mockResolvedValue({ data: {} });
      mockCreateOrUpdateFileContents.mockResolvedValue({ data: {} });
      mockCreatePull.mockResolvedValue({ data: { number: 42 } });
      mockMergePull.mockResolvedValue({ data: { merged: true } });
      mockDeleteRef.mockResolvedValue({ data: {} });
      // Mock readback for newSha
      mockGetContent.mockResolvedValue({
        data: { type: 'file', content: Buffer.from('[]').toString('base64'), sha: 'new-sha-456' },
      });

      const result = await client.writeJsonViaPR(
        'data/users/alice/characters.json',
        [{ id: 'gandalf' }],
        'abc123',
        'alice',
      );

      expect(result.newSha).toBe('new-sha-456');
      expect(mockGetRef).toHaveBeenCalled();
      expect(mockCreateRef).toHaveBeenCalled();
      expect(mockCreateOrUpdateFileContents).toHaveBeenCalled();
      expect(mockCreatePull).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('alice') }),
      );
      expect(mockMergePull).toHaveBeenCalledWith(
        expect.objectContaining({ pull_number: 42 }),
      );
      expect(mockDeleteRef).toHaveBeenCalled();
    });
  });
});
