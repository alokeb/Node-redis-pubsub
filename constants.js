const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const publisherRedisChannel = "publisherRedisChannel";
const subscriberRedisChannel = "subscriberRedisChannel";