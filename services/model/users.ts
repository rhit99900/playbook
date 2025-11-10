import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Prisma from '../utils/prisma.utils';
import { JWT_SECRET } from '../config';

export type SanitizedUser = {
  id: number;
  email: string;
  username: string;
  created_at: Date;
  updated_at: Date;
};

type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

class Users {

  private sanitizeUser = (user: any): SanitizedUser => {
    const { password_hash, ...rest } = user;
    return rest as SanitizedUser;
  }

  private generateToken = (user: SanitizedUser) => {
    return jwt.sign({
      sub: user.id,
      email: user.email,
      username: user.username
    }, JWT_SECRET, { 
      expiresIn: '1h' 
    });
  }

  private async getUserByIdentifier(identifier: string) {
    if (!identifier) return null;
    return Prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
  }

  public getUsers = async () => {
    try {
      const users = await Prisma.users.findMany({
        select: {
          email: true, 
          username: true,
          id: true,
          created_at: true
        }
      });
      const count = await Prisma.users.count();
      return {
        users: users,
        count: count
      }
    } catch(e) {
      throw new Error('Failed to fetch users');
    }
  }

  public deleteUser = async (id: number) => {
    try {
      await Prisma.users.delete({
        where: {
          id: id
        }
      });      
      return true;
    } catch(e) {
      throw new Error('Failed to fetch users');
    }
  }

  public register = async (input: RegisterInput) => {
    const existing = await Prisma.users.findFirst({
      where: {
        OR: [
          { email: input.email },
          { username: input.username }
        ]
      }
    });

    if (existing) {
      throw new Error('User with provided email or username already exists.');
    }

    const password_hash = await bcrypt.hash(input.password, 10);
    const user = await Prisma.users.create({
      data: {
        email: input.email,
        username: input.username,
        password_hash
      }
    });

    const sanitized = this.sanitizeUser(user);
    return {
      user: sanitized,
      token: this.generateToken(sanitized)
    };
  }

  public authenticate = async (identifier: string, password: string) => {
    const user = await this.getUserByIdentifier(identifier);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const sanitized = this.sanitizeUser(user);
    return {
      user: sanitized,
      token: this.generateToken(sanitized)
    };
  }
}

const UserService = new Users();
export default UserService;
