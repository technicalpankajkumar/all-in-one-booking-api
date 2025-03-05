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
    async updateAuthPassword(query,data){
        const hashedPassword = await hash(data.password, 10);
        return await db.auth.update({
            ...query,
            data:{
                ...data,
                password: hashedPassword
            }
        })
    }
    async updateAuth(query,data){
        return await db.auth.update({
            ...query,
            data
        })
    }

    async comparePassword(enteredPassword, storedPassword) {
        return await compare(enteredPassword, storedPassword);
    }

    signAccessToken(user) {
        return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET || '', {
            expiresIn: '1h',
        });
    }

    signRefreshToken(user) {
        return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET || '', {
            expiresIn: '1d',
        });

    }
    async storeRefreshToken(authId, refreshToken) {
        await db.refreshTokenList.create({
            data: {
                auth_id:authId,
                token: refreshToken,
                expire_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
            },
        });
    }

    async revokeRefreshToken(token) {
        await db.refreshTokenList.delete({
            where: { token },
        });
    }

    async findRefreshToken(token) {
        return await db.refreshTokenList.findUnique({
            where: { token },
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