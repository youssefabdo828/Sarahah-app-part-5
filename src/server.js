import './Config/env.config.js'
import express from "express";
import authcontroller from "./modules/Auth/auth.controller.js";
import userController from "./modules/User/user.controller.js";
import messageController from "./modules/Message/message.controller.js";
import  connectDB  from "./DB/connection.js";
import globalErrorHandler from './Middlewares/global-error-handler.middleware.js';
import cors from 'cors'
import { redisConnection } from './common/Clients/redis.client.js';
import { emailTransporter } from './common/Clients/email.client.js';
import { sendEmail } from './common/Services/email.service.js';


const app = express();


app.use(cors() , express.json());

app.use('/uploads', express.static('uploads'))


connectDB();
redisConnection();

app.use("/auth", authcontroller);
app.use("/user", userController);
app.use("/message", messageController);




app.all("/*dummy", (req, res) => {
    return res.status(404).json({
        message: "Route not found"
    });
});



app.use(globalErrorHandler);


const PORT = process.env.PORT || 3000;

function startServer() {
  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });
}

startServer();
