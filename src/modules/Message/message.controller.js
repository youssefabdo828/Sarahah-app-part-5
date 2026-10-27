import { Router } from "express";
import * as messageService from "./message.service.js";
const messageController = Router();



messageController.get("/health", (req, res) => {
  res.status(200).json({ status: "Message service is healthy" });
});



export default messageController;