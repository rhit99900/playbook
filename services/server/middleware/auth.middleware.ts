import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../../config";

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

const extractBearerToken = (req: Request): string | null => {
  const header = req.headers['authorization'];
  if (!header) return null;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const [scheme, token] = value.split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') {
    return null;
  }
  return token.trim();
}

export const authenticateRequest = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).send({
        success: false,
        message: 'Authentication token missing'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed', error instanceof Error ? error.message : error);
    return res.status(401).send({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
};

export default authenticateRequest;
