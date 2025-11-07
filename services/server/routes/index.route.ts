import { NextFunction, Router } from "express";
import { Routes } from "../../types/route.types";
import StatusRoute from "./status.route";
import PlaybookController from "../controllers/index.controller";

class PlaybookRoutes {
  public path = '';
  public router = Router();

  constructor() {
    this.iniliaseRoutes([
      new StatusRoute()
    ])
  }

  private iniliaseRoutes = (routes: Routes[]) => {
    routes.forEach((route: Routes, index: number) => {
      this.router.use(`/${route.path}`, route.router);
      console.info(` • Route ${index + 1}: \`/${route.path}\` Initialised`);
    })

    this.router.get(
      `${this.path}/files`,
      PlaybookController.getFiles,
    )

    this.router.delete(
      `${this.path}/files`,
      PlaybookController.deleteFiles
    )

    this.router.post(
      `${this.path}/files/index`,
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
