import { Router } from "express";
import { Routes } from "../../types/route.types";
import StatusRoute from "./status.route";
import PlaybookController from "../controllers/index.controller";
import AuthRoute from "./auth.route";
import UserRoute from "./users.route";
import authenticateRequest from "../middleware/auth.middleware";

class PlaybookRoutes {
  public path = '';
  public router = Router();

  constructor() {
    this.iniliaseRoutes([
      new StatusRoute(),
      new AuthRoute(),
      new UserRoute()
    ])
  }

  private iniliaseRoutes = (routes: Routes[]) => {
    routes.forEach((route: Routes, index: number) => {
      this.router.use(`/${route.path}`, route.router);
      console.info(` • Route ${index + 1}: \`/${route.path}\` Initialised`);
    })

    this.router.get(
      `${this.path}/files`,
      authenticateRequest,
      PlaybookController.getFiles,
    )

    this.router.get(
      `${this.path}/stats`,
      authenticateRequest,
      PlaybookController.getStats
    )

    this.router.delete(
      `${this.path}/files`,
      authenticateRequest,
      PlaybookController.deleteFiles
    )

    this.router.delete(
      `${this.path}/files/:id`,
      authenticateRequest,
      PlaybookController.deleteFiles
    )

    this.router.get(
      `${this.path}/files/lookup/:id`,
      authenticateRequest,
      PlaybookController.lookupDriveFile
    )

    this.router.post(
      `${this.path}/files/index`,
      authenticateRequest,
      PlaybookController.indexFiles
    )

    this.router.get(
      `${this.path}/respond`,
      PlaybookController.streamResponse
    )

    this.router.post(
      `${this.path}/respond`,
      PlaybookController.streamResponse
    )
  }
}

export default PlaybookRoutes;
