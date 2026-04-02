import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "error", emit: "event" },
    { level: "warn", emit: "event" },
  ],
});

prisma.$on("error", (e) => logger.error({ err: e }, "Prisma error"));
prisma.$on("warn", (e) => logger.warn({ msg: e.message }, "Prisma warning"));

export default prisma;
