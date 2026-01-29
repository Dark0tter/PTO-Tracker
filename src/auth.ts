import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface User {
  id: string;
  username: string;
  tenantId: string;
  role: 'admin' | 'user';
}

export interface AuthRequest extends Request {
  user?: User;
}

// In-memory user store (in production, use a database)
// Password: "password123" hashed
const users: Array<User & { passwordHash: string }> = [
  {
    id: '1',
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    tenantId: 'acme',
    role: 'admin',
  },
  {
    id: '2',
    username: 'demo',
    passwordHash: bcrypt.hashSync('demo123', 10),
    tenantId: 'demo',
    role: 'user',
  },
  {
    id: '3',
    username: 'test',
    passwordHash: bcrypt.hashSync('test123', 10),
    tenantId: 'testco',
    role: 'user',
  },
];

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = users.find((u) => u.username === username);
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    tenantId: user.tenantId,
    role: user.role,
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}

export function addUser(username: string, password: string, tenantId: string, role: 'admin' | 'user' = 'user'): User {
  const id = String(users.length + 1);
  const passwordHash = bcrypt.hashSync(password, 10);
  
  const newUser: User & { passwordHash: string } = {
    id,
    username,
    passwordHash,
    tenantId,
    role,
  };
  
  users.push(newUser);
  
  return {
    id: newUser.id,
    username: newUser.username,
    tenantId: newUser.tenantId,
    role: newUser.role,
  };
}

export function getUsers(): User[] {
  return users.map(({ passwordHash, ...user }) => user);
}
