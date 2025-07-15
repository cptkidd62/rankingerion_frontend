import { User } from 'src/data/user.repository';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: User;
}
