import { Router } from "express";
import UserController from "../controllers/user.controller";
import authenticateRequest from "../middleware/auth.middleware";

class UserRoute {
  public path: string = 'users';
  public router = Router();

  constructor() {
    this.router.use(authenticateRequest);
    this.iniliaseRoutes();
  }

  private iniliaseRoutes = () => {
    // Get all users.
    this.router.get(`/`, UserController.getUsers); 
    // Delete seleected users.
    this.router.delete(`/:id`, UserController.deleteUser);
  }
}

export default UserRoute;
