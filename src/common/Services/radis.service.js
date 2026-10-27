import { redisClient } from "../Clients/redis.client.js";


export const get = async (key) => {
  return redisClient.get(key);
}

export const del = async (key) => {
  return redisClient.del(key);
}


export const set = async ({key, value, options={}}) => {
  return redisClient.set(key, value, options);
}


export const TTL = async (key) => {
  return redisClient.ttl(key);
}


export const expire = async (key, expiresIn) => {
  return redisClient.expire(key, expiresIn);
}


export const calculateTTL = (expiration) => {
  const now = Math.floor(Date.now() / 1000);
  const ttl = expiration - now;
  return ttl;
}