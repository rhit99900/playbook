import { NextFunction, Request, Response } from "express";
import DocumentService from "../../model/documents";
import Responder from "../../model/responder";
import Builder from "../../builder";
import { authorise, getFilesByIds } from "../../utils/drive.utils";

class Playbook {

  public getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {      
      const files = await DocumentService.getFiles({
        skip: req.query.skip ? Number(req.query.skip) : 0,
        limit: req.query.limit ? Number(req.query.limit): 10
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
      const result = await DocumentService.deleteFiles({})
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

  public streamResponse = async (req: Request, res: Response, next: NextFunction) => {
    const queryFromBody = typeof req.body?.query === 'string' ? req.body.query : '';
    const queryFromParams = typeof req.query?.query === 'string' ? req.query.query : '';
    const query = (queryFromBody || queryFromParams).trim();

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
    res.flushHeaders();

    const sendEvent = (event: string, payload: Record<string, any>) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const responder = new Responder(query);
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
      sendEvent('status', { message: 'Retrieving relevant context from ChromaDB' });
      const retrieval = await responder.retrieveDocuments();
      sendEvent('context', {
        context: retrieval.context,
        sources: retrieval.sources
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
