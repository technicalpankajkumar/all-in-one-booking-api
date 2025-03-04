import { compare, hash } from "bcryptjs";
import { db } from "../config/db.js";
import 'dotenv/config.js'
import jwt from 'jsonwebtoken';

class AuthService {
    async createAuth(data) {
        const hashedPassword = await hash(data.password, 10);
        return await db.auth.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });
    }
    async findAuth(query){
        return await db.auth.findFirst(query)
    }

    async comparePassword(enteredPassword, storedPassword) {
        return await compare(enteredPassword, storedPassword);
    }

    signAccessToken(user) {
        return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET || '', {
            expiresIn: '59m',
        });
    }

    signRefreshToken(user) {
        return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET || '', {
            expiresIn: '1d',
        });
    }

    async blacklistToken(token) {
        await db.tokenBlacklist.create({
            data: { token },
        });
    }

    async isTokenBlacklisted(token) {
        return await db.tokenBlacklist.findUnique({
            where: { token },
        });
    }
}

export const authService = new AuthService();