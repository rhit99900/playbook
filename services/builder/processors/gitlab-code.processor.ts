import { CHROMA_CODE_COLLECTION_NAME, DEFAULT_GITLAB_BRANCH, GITLAB_ACCESS_TOKEN, GITLAB_BASE_URL } from "../../config";
import { getEmbeddings } from "../../model/embeddings.model";
import { addEmbeddingsToCollection } from "../../utils/chroma.utils";
import { CodeChunk, chunkCode } from "../../utils/code-chunk.utils";
import {
  buildGitlabFileUrl,
  fetchProjectMetadata,
  fetchProjectTree,
  fetchRawFile,
  GitlabProject,
  GitlabTreeItem
} from "../../utils/gitlab.utils";
import { GitlabIndexRequest } from "../../types/common.types";

const DEFAULT_CODE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt', '.kts',
  '.swift', '.php', '.cs', '.cpp', '.c', '.h', '.hpp',
  '.scala', '.sql', '.sh', '.bash', '.ps1', '.json', '.yaml', '.yml', '.md'
];

class GitlabCodeProcessor {
  private includeExtensions: string[];

  constructor(includeExtensions: string[] = DEFAULT_CODE_EXTENSIONS) {
    this.includeExtensions = includeExtensions;
  }

  public async process(request: GitlabIndexRequest) {
    const token = request.token || GITLAB_ACCESS_TOKEN;
    const baseUrl = request.baseUrl || GITLAB_BASE_URL;

    if (!token) {
      throw new Error('GitLab token is required to index code');
    }

    const projectId = request.projectId;
    const project = await fetchProjectMetadata(projectId, { token, baseUrl });
    const branch = request.branch || project.default_branch || DEFAULT_GITLAB_BRANCH;
    const tree = await fetchProjectTree(projectId, { token, baseUrl, ref: branch });
    const codeFiles = this.filterCodeFiles(tree, request.includeExtensions);
    const limitedFiles = request.maxFiles ? codeFiles.slice(0, request.maxFiles) : codeFiles;

    const results = {
      indexedFiles: 0,
      skippedFiles: codeFiles.length - limitedFiles.length
    };

    for (const file of limitedFiles) {
      try {
        await this.embedFile({
          project,
          projectId,
          file,
          token,
          baseUrl,
          branch
        });
        results.indexedFiles += 1;
      } catch (e: any) {
        console.error(`Failed to embed ${file.path}:`, e?.message || e);
      }
    }

    return {
      project: project.path_with_namespace,
      branch,
      ...results
    };
  }

  private filterCodeFiles(tree: GitlabTreeItem[], includeExtensions?: string[]) {
    const extensions = includeExtensions && includeExtensions.length
      ? includeExtensions
      : this.includeExtensions;

    return tree.filter((item) => {
      if (item.type !== 'blob') return false;
      return extensions.some((ext) => item.path.toLowerCase().endsWith(ext));
    });
  }

  private async embedFile(params: {
    project: GitlabProject;
    projectId: string | number;
    file: GitlabTreeItem;
    token: string;
    baseUrl?: string;
    branch: string;
  }) {
    const { project, projectId, file, token, baseUrl, branch } = params;
    const raw = await fetchRawFile(projectId, file.path, { token, baseUrl, ref: branch });
    const chunks = chunkCode(raw)
      .map((chunk) => ({
        ...chunk,
        content: chunk.content.trim().length ? chunk.content : ''
      }))
      .filter((chunk) => Boolean(chunk.content));

    if (!chunks.length) {
      return;
    }

    const documents = chunks.map((chunk) => chunk.content);
    const embeddings = await getEmbeddings(documents);
    const ids = documents.map((_, idx) => `${project.id}-${file.path}-chunk-${idx}`);
    const metadatas = chunks.map((chunk: CodeChunk, idx: number) => ({
      id: `${project.id}:${file.path}`,
      chunkIndex: idx,
      path: file.path,
      repo: project.path_with_namespace,
      branch,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      fileUrl: buildGitlabFileUrl(project, branch, file.path, chunk.startLine, chunk.endLine),
      source: 'gitlab'
    }));

    await addEmbeddingsToCollection({
      ids,
      documents,
      embeddings,
      metadatas,
      collectionName: CHROMA_CODE_COLLECTION_NAME
    });
  }
}

export default GitlabCodeProcessor;
