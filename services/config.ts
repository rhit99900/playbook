import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
export const JWT_SECRET = process.env.JWT_SECRET || 'playbook-dev-secret';

export const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
export const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

export const GOOGLE_DRIVE_CREDENTIALS = require(CREDENTIALS_PATH);


export const CHUNK_SIZE = 500;
export const CHUNK_OVERLAP = 100;

export const CHROMA_COLLECTION_NAME = 'google_drive_playbook';

export const CHROMADB_HOST_URI = process.env.CHROMADB_HOST_URI;
export const CHROMADB_PORT = Number(process.env.CHROMADB_PORT!);

export const PORT = Number(process.env.PORT!);
