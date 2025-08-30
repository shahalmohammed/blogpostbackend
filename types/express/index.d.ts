import type { UserDocumentLean } from '../../src/models/User';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocumentLean; // attached by auth middlewares
    }
  }
}
export {};
