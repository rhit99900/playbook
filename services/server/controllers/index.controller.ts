import { NextFunction, Request, Response } from "express";
import DocumentService from "../../model/documents";
import Responder from "../../model/responder";
import Builder from "../../builder";
import { authorise, getFilesByIds } from "../../utils/drive.utils";
import { deleteEmbeddingsByFileIds, getChromaStatus } from "../../utils/chroma.utils";
import GitlabCodeProcessor from "../../builder/processors/gitlab-code.processor";
import { GitlabIndexRequest } from "../../types/common.types";
import { CHROMA_COLLECTION_NAME, CHROMA_CODE_COLLECTION_NAME } from "../../config";

class Playbook {

  public getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {      
      const search = typeof req.query?.search === 'string' ? req.query.search.trim() : '';
      const files = await DocumentService.getFiles({
        skip: req.query.skip ? Number(req.query.skip) : 0,
        limit: req.query.limit ? Number(req.query.limit): 10,
        search: search.length ? search : undefined
      });
      res.status(200).send({
        success: true,
        data: files.files || [],
        count: files.count
      })
    } catch(e) {
      next(e);
    }
  }

  public deleteFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileIdFromParams = typeof req.params?.id === 'string' ? req.params.id : '';
      const fileIdFromQuery = typeof req.query?.fileId === 'string' ? req.query.fileId : '';
      const fileIdFromBody = typeof req.body?.fileId === 'string' ? req.body.fileId : '';
      const targetFileId = (fileIdFromParams || fileIdFromQuery || fileIdFromBody).trim();
      const fileIdsFromBody = Array.isArray(req.body?.fileIds) ? req.body.fileIds : [];
      const cleanedFileIds = fileIdsFromBody
        .map((id: string) => typeof id === 'string' ? id.trim() : '')
        .filter((id: string) => id.length > 0);

      const filters = cleanedFileIds.length
        ? { file_ids: cleanedFileIds }
        : targetFileId
          ? { file_id: targetFileId }
          : {};

      const result = await DocumentService.deleteFiles(filters)

      if(result?.fileIds?.length) {
        await deleteEmbeddingsByFileIds(result.fileIds);
      }
      res.status(200).send({
        success: true,
        data: result
      });
    } catch(e) {
      next(e);
    }
  }

  public indexFiles = async (req: Request, res: Response, next: NextFunction) => {
    
    const fileIdsFromBody = Array.isArray(req.body?.fileIds) ? req.body.fileIds : [];
    const fileIds = fileIdsFromBody
      .map((id: string) => typeof id === 'string' ? id.trim() : '')
      .filter((id: string) => id.length > 0);

    try {
      const builder = new Builder();
      await builder.process(fileIds.length ? fileIds : undefined);
      res.status(200).send({
        success: true,
        message: fileIds.length
          ? `Processed ${fileIds.length} file(s)`
          : 'Processed all available files',
        fileIds
      });
    } catch(e) {
      next(e);
    }
  }

  public getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [ embeddedFiles, chroma ] = await Promise.all([
        DocumentService.getEmbeddedDocumentsCount(),
        getChromaStatus()
      ]);
      res.status(200).send({
        success: true,
        data: {
          embeddedFiles,
          chroma
        }
      })
    } catch (e) {
      next(e);
    }
  }

  public lookupDriveFile = async (req: Request, res: Response, next: NextFunction) => {
    const rawFileId =
      typeof req.params?.id === 'string' ? req.params.id :
      typeof req.query?.fileId === 'string' ? req.query.fileId :
      typeof req.body?.fileId === 'string' ? req.body.fileId : '';
    const fileId = rawFileId.trim();

    if (!fileId.length) {
      return res.status(400).send({
        success: false,
        message: 'File ID is required'
      });
    }

    try {
      const auth = await authorise();
      if(!auth) {
        throw new Error('Failed to authenticate with Google Drive');
      }

      const files = await getFilesByIds(auth, [fileId]);
      const file = files && files.length ? files[0] : undefined;

      if(!file) {
        return res.status(404).send({
          success: false,
          message: `File ${fileId} not found in Drive`
        });
      }

      res.status(200).send({
        success: true,
        data: {
          id: file.id,
          name: file.name,
          webViewLink: file.webViewLink
        }
      });
    } catch (e) {
      next(e);
    }
  }

  public indexGitlabCode = async (req: Request, res: Response, next: NextFunction) => {
    const projectId = typeof req.body?.projectId === 'string' ? req.body.projectId.trim() : '';
    const branch = typeof req.body?.branch === 'string' ? req.body.branch.trim() : '';
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const baseUrl = typeof req.body?.baseUrl === 'string' ? req.body.baseUrl.trim() : '';
    const includeExtensions = Array.isArray(req.body?.includeExtensions)
      ? req.body.includeExtensions
          .map((ext: unknown) => typeof ext === 'string' ? ext.trim() : '')
          .filter((ext: string) => Boolean(ext))
      : undefined;
    const rawMaxFiles = typeof req.body?.maxFiles === 'string' ? Number(req.body.maxFiles) : req.body?.maxFiles;
    const maxFiles = typeof rawMaxFiles === 'number' && rawMaxFiles > 0 ? rawMaxFiles : undefined;

    if (!projectId.length) {
      return res.status(400).send({
        success: false,
        message: 'projectId is required'
      });
    }

    const payload: GitlabIndexRequest = {
      projectId,
      token: token || undefined,
      branch: branch || undefined,
      baseUrl: baseUrl || undefined,
      includeExtensions: includeExtensions,
      maxFiles
    };

    try {
      const processor = new GitlabCodeProcessor(includeExtensions);
      const result = await processor.process(payload);
      res.status(200).send({
        success: true,
        data: result
      });
    } catch (e: any) {
      const message = e?.message || 'Failed to index GitLab code';
      res.status(400).send({
        success: false,
        message
      });
    }
  }

  public streamResponse = async (req: Request, res: Response, next: NextFunction) => {
    const queryFromBody = typeof req.body?.query === 'string' ? req.body.query : '';
    const queryFromParams = typeof req.query?.query === 'string' ? req.query.query : '';
    const query = (queryFromBody || queryFromParams).trim();
    const rawSource =
      typeof req.body?.source === 'string' ? req.body.source :
      typeof req.query?.source === 'string' ? req.query.source :
      '';
    const source = rawSource.toLowerCase() === 'code' ? 'code' : 'docs';
    const collectionName = source === 'code' ? CHROMA_CODE_COLLECTION_NAME : CHROMA_COLLECTION_NAME;

    if (!query.length) {
      return res.status(400).send({
        success: false,
        message: 'Query is required'
      });
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (event: string, payload: Record<string, any>) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const responder = new Responder(query, collectionName);
    let streamOpen = true;

    const closeStream = () => {
      if (!streamOpen) return;
      streamOpen = false;
      res.end();
    };

    req.on('close', () => {
      closeStream();
    });

    try {
      sendEvent('status', { message: `Retrieving ${source === 'code' ? 'code' : 'document'} context from ChromaDB` });
      const retrieval = await responder.retrieveDocuments();
      sendEvent('context', {
        context: retrieval.context,
        sources: retrieval.sources,
        diagrams: retrieval.diagrams
      });

      sendEvent('status', { message: 'Generating answer with OpenAI' });
      const answer = await responder.answerFromContext(retrieval.context,retrieval.sources);
      sendEvent('answer', { answer });
      sendEvent('done', { success: true });
    } catch(error) {
      console.error('Failed to stream response', error);
      sendEvent('error', {
        message: 'Unable to generate a response at this time.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      closeStream();
    }
  }
}

const PlaybookController = new Playbook();
export default PlaybookController;
