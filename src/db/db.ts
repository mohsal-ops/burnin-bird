
import { PrismaClient } from '../../generated/prisma'
import { PrismaPg } from "@prisma/adapter-pg";

// Small pools: `next build` prerenders pages in several workers at once, and
// each serverless instance only serves one request at a time - a big default
// pool (10) per process exhausted the database's connection slots and failed
// builds with "Too many database connections" (P2037).
const building = process.env.NEXT_PHASE === "phase-production-build";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: building ? 2 : 5,
});

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;