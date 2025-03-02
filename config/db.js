
import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();

export const connectToDatabase = async () =>{
    try {
        await db.$connect();
        console.log('Database connected successfully')
    } catch (error) {
        console.log('error connection to database : ', error.message)
    } finally{
        await db.$disconnect();
    }
}

