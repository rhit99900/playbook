import { NextFunction, Request, Response } from "express";
import UserService from "../../model/users";

class AuthController {

  private validateRegisterPayload(body: any) {
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    return { email, username, password };
  }

  private validateLoginPayload(body: any) {
    const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    return { identifier, password };
  }

  public register = async (req: Request, res: Response, next: NextFunction) => {
    const { email, username, password } = this.validateRegisterPayload(req.body);

    if (!email || !username || !password) {
      return res.status(400).send({
        success: false,
        message: 'Email, username, and password are required.'
      });
    }

    try {
      const result = await UserService.register({ email, username, password });
      res.status(201).send({
        success: true,
        ...result
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('already exists')) {
        return res.status(400).send({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  public login = async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, password } = this.validateLoginPayload(req.body);
    if (!identifier || !password) {
      return res.status(400).send({
        success: false,
        message: 'Identifier (email or username) and password are required.'
      });
    }

    try {
      const result = await UserService.authenticate(identifier, password);
      res.status(200).send({
        success: true,
        ...result
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('invalid credentials')) {
        return res.status(401).send({
          success: false,
          message: 'Invalid credentials'
        });
      }
      next(error);
    }
  }
}

export default new AuthController();
