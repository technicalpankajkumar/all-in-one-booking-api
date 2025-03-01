
import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();

export const connectToDatabase = async () =>{
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log('Database connected successfully')
    } catch (error) {
        console.log('error connection to database : ', error.message)
    } finally{
        await prisma.$disconnect();
    }
}