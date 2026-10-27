import { createClient } from "redis";
import { redisConfig } from "../../Config/redis.config.js";

export const redisClient = await createClient(redisConfig);


export const redisConnection = async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis");
    } catch (error) {
        console.error("Error connecting to Redis:", error);
    }
};