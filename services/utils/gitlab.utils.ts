import { DEFAULT_GITLAB_BRANCH, GITLAB_ACCESS_TOKEN, GITLAB_BASE_URL } from "../config";

type GitlabRequestOptions = {
  token?: string;
  baseUrl?: string;
  searchParams?: Record<string, string | number | undefined>;
};

export type GitlabTreeItem = {
  id: string;
  path: string;
  type: 'tree' | 'blob';
};

export type GitlabProject = {
  id: number;
  web_url: string;
  path_with_namespace: string;
  default_branch?: string;
};

const buildUrl = (path: string, options: GitlabRequestOptions) => {
  const base = (options.baseUrl || GITLAB_BASE_URL || 'https://gitlab.com').replace(/\/$/, '');
  const url = new URL(`${base}/api/v4/${path.replace(/^\//, '')}`);
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url;
};

const gitlabRequest = async <T>(path: string, options: GitlabRequestOptions = {}): Promise<T> => {
  const url = buildUrl(path, options);
  const token = options.token || GITLAB_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  if (token) {
    headers['PRIVATE-TOKEN'] = token;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitLab request failed (${response.status}): ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  // @ts-ignore - caller handles types
  return response.text();
};

const fetchProjectMetadata = async (projectId: string | number, options: GitlabRequestOptions = {}): Promise<GitlabProject> => {
  const path = `projects/${encodeURIComponent(projectId)}`;
  return gitlabRequest<GitlabProject>(path, options);
};

const fetchProjectTree = async (
  projectId: string | number,
  options: GitlabRequestOptions & { ref?: string; recursive?: boolean } = {}
): Promise<GitlabTreeItem[]> => {
  const ref = options.searchParams?.ref || options.ref || DEFAULT_GITLAB_BRANCH;
  let page = 1;
  const perPage = 100;
  const results: GitlabTreeItem[] = [];

  while (true) {
    const path = `projects/${encodeURIComponent(projectId)}/repository/tree`;
    const pageResults = await gitlabRequest<GitlabTreeItem[]>(path, {
      ...options,
      searchParams: {
        ref,
        recursive: (options.recursive ?? true) ? 'true' : 'false',
        per_page: perPage,
        page,
        ...(options.searchParams || {})
      }
    });
    results.push(...pageResults);
    if (pageResults.length < perPage) {
      break;
    }
    page += 1;
  }

  return results;
};

const fetchRawFile = async (
  projectId: string | number,
  filePath: string,
  options: GitlabRequestOptions & { ref?: string } = {}
): Promise<string> => {
  const ref = options.searchParams?.ref || options.ref || DEFAULT_GITLAB_BRANCH;
  const path = `projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}/raw`;
  return gitlabRequest<string>(path, {
    ...options,
    searchParams: {
      ref,
      ...(options.searchParams || {})
    }
  });
};

const buildGitlabFileUrl = (project: GitlabProject, branch: string, filePath: string, startLine?: number, endLine?: number) => {
  const cleanBranch = branch || project.default_branch || DEFAULT_GITLAB_BRANCH;
  const url = `${project.web_url}/-/blob/${cleanBranch}/${filePath}`;
  if (startLine) {
    const endFragment = endLine && endLine !== startLine ? `-L${endLine}` : '';
    return `${url}#L${startLine}${endFragment}`;
  }
  return url;
};

export {
  gitlabRequest,
  fetchProjectTree,
  fetchRawFile,
  fetchProjectMetadata,
  buildGitlabFileUrl
};
