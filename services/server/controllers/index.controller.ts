import { NextFunction, Request, Response } from "express";
import DocumentService from "../../model/documents";
import Responder from "../../model/responder";
import Builder from "../../builder";

class Playbook {

  public getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = await DocumentService.getFiles({
        skip: req.params.skip ? Number(req.params.skip) : 0,
        limit: req.params.limit ? Number(req.params.limit): 10
      });
      res.status(200).send({
        success: true,
        data: files
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
      const answer = await responder.answerFromContext(retrieval.context);
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
