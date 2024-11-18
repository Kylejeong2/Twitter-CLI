import express from "express";
import multer from "multer";
import { TwitterService } from "./services/twitter";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });
const twitter = new TwitterService();

// Initialize Twitter service when server starts
twitter.init().catch(console.error);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Post tweet endpoint
app.post("/tweet", upload.single("image"), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Tweet content is required" });
    }

    const imagePath = req.file?.path;
    const success = await twitter.postTweet(content, imagePath);

    if (success && req.file?.path) {
      // Delete uploaded file after successful tweet
      fs.unlinkSync(req.file.path);
    }

    if (success) {
      res.json({ status: "success", message: "Tweet posted successfully" });
    } else {
      res.status(500).json({ error: "Failed to post tweet" });
    }
  } catch (error) {
    if (req.file?.path) {
      // Clean up file on error
      fs.unlinkSync(req.file.path);
    }
    console.error("Error posting tweet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// CLI command to post tweet
app.post("/cli/tweet", async (req, res) => {
  try {
    const { content, imagePath } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Tweet content is required" });
    }

    const success = await twitter.postTweet(content, imagePath);

    if (success) {
      res.json({ status: "success", message: "Tweet posted successfully" });
    } else {
      res.status(500).json({ error: "Failed to post tweet" });
    }
  } catch (error) {
    console.error("Error posting tweet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cleanup on server shutdown
process.on("SIGTERM", async () => {
  await twitter.cleanup();
  process.exit(0);
}); 