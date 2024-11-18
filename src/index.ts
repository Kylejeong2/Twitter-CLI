import { Command } from "commander";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const program = new Command();
const API_URL = process.env.API_URL || "http://localhost:3000";

program
  .name("twitter-cli")
  .description("CLI to post tweets from your terminal")
  .version("1.0.0");

program
  .command("post")
  .description("Post a tweet")
  .argument("<content>", "Tweet content")
  .option("-i, --image <path>", "Image to attach")
  .action(async (content: string, options) => {
    try {
      if (options.image) {
        const formData = new FormData();
        formData.append("content", content); 
        formData.append("image", fs.createReadStream(options.image));
        
        const response = await axios.post(`${API_URL}/tweet`, formData, {
          headers: formData.getHeaders()
        });
        console.log(response.data.message);
      } else {
        const response = await axios.post(`${API_URL}/cli/tweet`, {
          content
        });
        console.log(response.data.message);
      }
    } catch (error: any) {
      console.error("Error:", error.response?.data?.error || error.message);
    }
  });

program.parse(); 