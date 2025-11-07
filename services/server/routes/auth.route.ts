import { Router } from "express";
import AuthController from "../controllers/auth.controller";

class AuthRoute {
  public path: string = 'auth';
  public router = Router();

  constructor() {
    this.iniliaseRoutes();
  }

  private iniliaseRoutes = () => {
    this.router.post(
      `/register`,
      AuthController.register
    );

    this.router.post(
      `/login`,
      AuthController.login
    );
  }
}

export default AuthRoute;
