import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.getProfile(req.user!.id);
      res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.updateProfile(req.user!.id, req.body);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  };
}
