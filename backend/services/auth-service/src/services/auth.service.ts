import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 10;

interface AuthResult {
    token: string;
    user: { id: string; email: string; name: string };
}

// ── Register a new user ──────────────────────────────────────────
export async function registerUser(email: string, name: string, password: string): Promise<AuthResult> {
    console.log(`📝 Registering user: ${email}`);
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            email,
            name,
            passwordHash,
            provider: 'local',
        },
        select: { id: true, email: true, name: true },
    });

    const token = generateToken(user);

    return { token, user };
}

// ── Login with email + password ──────────────────────────────────
export async function loginUser(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
        where: { email, isActive: true },
        select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!user) {
        throw new UnauthorizedError('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
        throw new UnauthorizedError('Invalid credentials');
    }

    const { passwordHash: _, ...safeUser } = user;
    const token = generateToken(safeUser);

    return { token, user: safeUser };
}

// ── Verify token and return user ─────────────────────────────────
export async function verifyAndGetUser(token: string) {
    try {
        const decoded = verify(token, env.JWT_SECRET) as jwt.JwtPayload;
        const userId = (decoded.sub ?? decoded.id ?? decoded.userId) as string;

        const user = await prisma.user.findUnique({
            where: { id: userId, isActive: true },
            select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
        });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        return user;
    } catch (err) {
        if (err instanceof UnauthorizedError) throw err;
        throw new UnauthorizedError('Invalid or expired token');
    }
}

// ── Generate JWT ─────────────────────────────────────────────────
function generateToken(user: { id: string; email: string; name: string }): string {
    return sign(
        { sub: user.id, email: user.email, name: user.name },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as any }
    );
}

// ── Custom Errors ────────────────────────────────────────────────
export class ConflictError extends Error {
    statusCode = 409;
    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}

export class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message: string) {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
