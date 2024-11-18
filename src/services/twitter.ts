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
      apiKey: config.BROWSERBASE_API_KEY,
      projectId: config.BROWSERBASE_PROJECT_ID,
      enableCaching: true,
      verbose: 1,
    });
    
    if (!fs.existsSync(COOKIES_PATH)) {
      fs.mkdirSync(COOKIES_PATH);
      console.log("Created cookies directory at:", COOKIES_PATH);
    }
  }

  private async loadCookies(): Promise<any[]> {
    const cookiePath = path.join(COOKIES_PATH, "twitter.json");
    if (fs.existsSync(cookiePath)) {
      console.log("Loading cookies from:", cookiePath);
      return JSON.parse(fs.readFileSync(cookiePath, "utf-8"));
    }
    console.log("No cookies found at:", cookiePath);
    return [];
  }

  private async saveCookies(): Promise<void> {
    const cookies = await this.stagehand.context.cookies();
    fs.writeFileSync(
      path.join(COOKIES_PATH, "twitter.json"),
      JSON.stringify(cookies, null, 2)
    );
    console.log("Cookies saved to:", path.join(COOKIES_PATH, "twitter.json"));
  }

  async init(): Promise<void> {
    console.log("Initializing Twitter service...");
    await this.stagehand.init();
    const cookies = await this.loadCookies();
    if (cookies.length) {
      console.log("Adding cookies to stagehand context...");
      await this.stagehand.context.addCookies(cookies);
    }
  }

  async postTweet(content: string, imagePath?: string): Promise<boolean> {
    try {
      console.log("Navigating to tweet compose page...");
      await this.stagehand.page.goto("https://x.com/compose/post");

      // Check if we need to login
      const needsLogin = await this.stagehand.extract({
        instruction: "check if login form is visible, it should be visible if you are not logged in",
        schema: z.object({
          needsLogin: z.boolean()
        })
      });

      if (needsLogin.needsLogin) {
        await this.stagehand.act({ action: "click the button that says 'Phone, email, or username'"});
        console.log("Login required, proceeding with login...");
        await this.stagehand.act({ 
          action: `type "${config.TWITTER_USERNAME}" in the field that says "Phone, email, or username"` 
        });
        await this.stagehand.act({ action: "click the button that says Next" });
        await this.stagehand.act({ 
          action: `type "${config.TWITTER_PASSWORD}" in the field that says "Password"` 
        });
        await this.stagehand.act({ action: "click the button that says Log in" });
        await this.saveCookies();
      }

      console.log("Typing tweet content...");
      await this.stagehand.act({ action: `type "${content}" in the field that says "What is happening?"` });

      if (imagePath) {
        console.log("Uploading image from:", imagePath);
        await this.stagehand.act({ action: "click the media button" });
        await this.stagehand.page.setInputFiles('input[type="file"]', imagePath);
        await this.stagehand.act({ action: "wait for image upload" });
      }

      console.log("Posting tweet...");
      await this.stagehand.act({ action: "click the blue button that says Post" });

      const result = await this.stagehand.extract({
        instruction: "check if tweet was posted successfully",
        schema: z.object({
          success: z.boolean(),
          message: z.string(),
        }),
      });

      console.log("Tweet post result:", result);
      return result.success;

    } catch (error) {
      console.error("Failed to post tweet:", error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log("Cleaning up stagehand page...");
    await this.stagehand.page.close();
  }
} 