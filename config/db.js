import pkg from "@prisma/client";
const { PrismaClient } = pkg;

export const db = new PrismaClient();

export const connectToDatabase = async () => {
  try {
    await db.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }finally{
        await db.$disconnect();
    }
};
