import Redis, { Cluster } from 'ioredis';
import { env } from './env.js';

export type RedisConnection = Redis | Cluster;

let redis: RedisConnection;

if (env.REDIS_MODE === 'cluster' && env.REDIS_CLUSTER_NODES) {
    // Parse "host1:port1,host2:port2,host3:port3"
    const nodes = env.REDIS_CLUSTER_NODES.split(',').map((node) => {
        const [host, port] = node.trim().split(':');
        return { host, port: parseInt(port, 10) };
    });

    redis = new Cluster(nodes, {
        redisOptions: {
            maxRetriesPerRequest: 3,
            connectTimeout: 10000,
        },
        clusterRetryStrategy: (times: number) => {
            if (times > 5) return null; // Stop retrying
            return Math.min(times * 200, 2000);
        },
    });

    console.log(`🔗 Redis Cluster connecting to ${nodes.length} nodes...`);
} else {
    redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        retryStrategy: (times: number) => {
            if (times > 5) return null;
            return Math.min(times * 200, 2000);
        },
    });

    console.log(`🔗 Redis Standalone connecting to ${env.REDIS_URL}...`);
}

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

export { redis };
