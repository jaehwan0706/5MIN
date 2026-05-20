import "dotenv/config";
import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

async function bootstrap() {
  await prisma.$connect();
  console.log("DB connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
