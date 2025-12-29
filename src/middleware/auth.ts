import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const secretKey = process.env.API_SECRET_KEY;

  if (!secretKey) {
    return next(); // В dev режиме пропускаем
  }

  if (apiKey !== secretKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}


