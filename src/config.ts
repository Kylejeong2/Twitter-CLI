import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  BROWSERBASE_API_KEY: z.string(),
  BROWSERBASE_PROJECT_ID: z.string(),
  TWITTER_USERNAME: z.string(),
  TWITTER_PASSWORD: z.string(),
});

export const config = envSchema.parse(process.env); 