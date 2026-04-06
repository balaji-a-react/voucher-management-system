import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET || "fallback-secret";
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Access denied. Not authenticated." });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Access denied. Insufficient permissions." });
      return;
    }

    next();
  };
};
