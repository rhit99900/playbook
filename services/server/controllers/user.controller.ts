import { NextFunction, Request, Response } from "express";
import UserService from "../../model/users";

class Users {

  public getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await UserService.getUsers();
      res.status(200).send({
        success: true,
        data: users.users,
        count: users.count
      });
    } catch(e) {
      next(e);
    }    
  }  

  public deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;      
      if(id) {
        await UserService.deleteUser(Number(id));
        res.status(200).send({
          success: true,
          data: true          
        });
      } else {
        throw new Error('UserID not available');
      }
    } catch(e) {
      next(e);
    }    
  }  
}


const UserController = new Users();
export default UserController;
