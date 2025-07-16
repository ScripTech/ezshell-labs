import { Request, Response } from 'express';

export const debugSecretController = (req: Request, res: Response) => {
  const secret = process.env.NEXTAUTH_SECRET;

  res.json({
    secretAvailable: !!secret,
    secretLength: secret?.length || 0,
    secretFirst10: secret?.substring(0, 10) || 'N/A',
    secretLast10: secret?.substring(secret.length - 10) || 'N/A'
  });
};
