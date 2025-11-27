import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
export const JWT_SECRET = process.env.JWT_SECRET || 'playbook-dev-secret';

export const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
export const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

export const GOOGLE_DRIVE_CREDENTIALS = require(CREDENTIALS_PATH);


export const CHUNK_SIZE = 1500;
export const CHUNK_OVERLAP = 200;

export const CHROMA_COLLECTION_NAME = 'google_drive_playbook';
export const CHROMA_CODE_COLLECTION_NAME = process.env.CHROMA_CODE_COLLECTION_NAME || 'gitlab_code_playbook';

export const CHROMADB_HOST_URI = process.env.CHROMADB_HOST_URI;
export const CHROMADB_PORT = Number(process.env.CHROMADB_PORT!);

export const PORT = Number(process.env.PORT!);

export const GITLAB_BASE_URL = process.env.GITLAB_BASE_URL || 'https://gitlab.com';
export const GITLAB_ACCESS_TOKEN = process.env.GITLAB_ACCESS_TOKEN;
export const DEFAULT_GITLAB_BRANCH = process.env.DEFAULT_GITLAB_BRANCH || 'master';
