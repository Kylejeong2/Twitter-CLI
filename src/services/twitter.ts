import { Stagehand } from "@browserbasehq/stagehand";
import { config } from "../config";
import fs from "fs";
import path from "path";
import { z } from "zod";

const COOKIES_PATH = path.join(__dirname, "../../.cookies");

export class TwitterService {
  private stagehand: Stagehand;

  constructor() {
    this.stagehand = new Stagehand({
      env: "BROWSERBASE",
      enableCaching: true,
      verbose: 1,
    });
    
    // Ensure cookies directory exists
    if (!fs.existsSync(COOKIES_PATH)) {
      fs.mkdirSync(COOKIES_PATH);
    }
  }

  private async loadCookies(): Promise<any[]> {
    const cookiePath = path.join(COOKIES_PATH, "twitter.json");
    if (fs.existsSync(cookiePath)) {
      return JSON.parse(fs.readFileSync(cookiePath, "utf-8"));
    }
    return [];
  }

  private async saveCookies(): Promise<void> {
    const cookies = await this.stagehand.context.cookies();
    fs.writeFileSync(
      path.join(COOKIES_PATH, "twitter.json"),
      JSON.stringify(cookies, null, 2)
    );
  }

  async init(): Promise<void> {
    await this.stagehand.init();
    const cookies = await this.loadCookies();
    if (cookies.length) {
      await this.stagehand.context.addCookies(cookies);
    }
  }

  async login(): Promise<boolean> {
    try {
      await this.stagehand.page.goto("https://twitter.com/login");

      // Check if already logged in by looking for compose tweet button
      const isLoggedIn = await this.stagehand.extract({
        instruction: "check if the compose tweet button is visible",
        schema: z.object({
          isVisible: z.boolean()
        })
      });

      if (isLoggedIn.isVisible) {
        return true;
      }

      // Login flow
      await this.stagehand.act({ 
        action: `type "${config.TWITTER_USERNAME}" in the username field` 
      });
      await this.stagehand.act({ action: "click the Next button" });
      await this.stagehand.act({ 
        action: `type "${config.TWITTER_PASSWORD}" in the password field` 
      });
      await this.stagehand.act({ action: "click the Log in button" });

      // Save cookies after successful login
      await this.saveCookies();
      return true;

    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  async postTweet(content: string, imagePath?: string): Promise<boolean> {
    try {
      // Ensure we're logged in
      if (!await this.login()) {
        throw new Error("Failed to login");
      }

      await this.stagehand.act({ action: "click the Post button or New Tweet button" });
      await this.stagehand.act({ action: `type "${content}" in the tweet compose box` });

      if (imagePath) {
        await this.stagehand.act({ action: "click the media button" });
        await this.stagehand.page.setInputFiles('input[type="file"]', imagePath);
        await this.stagehand.act({ action: "wait for image upload" });
      }

      await this.stagehand.act({ action: "click the Post button" });

      const result = await this.stagehand.extract({
        instruction: "check if tweet was posted successfully",
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
        }),
      });

      return result.success;

    } catch (error) {
      console.error("Failed to post tweet:", error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.stagehand.page.close();
  }
} 