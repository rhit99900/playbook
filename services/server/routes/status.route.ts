import { NextFunction, Request, Response, Router } from "express";

class StatusRoute {
  public path: string = 'status';
  public router = Router();

  constructor() {
    this.iniliaseRoutes();
  }

  private iniliaseRoutes = () => {

    this.router.get(
      `/`,
      (req: Request, res: Response, next: NextFunction) => {
        res.status(200).send({
          status: true,
          message: 'Playbook is Up & Running!'
        });
      }
    )

  }
}

export default StatusRoute;