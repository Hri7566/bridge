import EventEmitter from 'events';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RedisClientOptions, createClient } from 'redis';
import YAML from 'yaml';
import defaults from 'defaults';
import { Logger } from './Logger/Logger';

export let data: Record<string, any>;

require('dotenv').config();

let configFile: string;
let config: RedisClientOptions;
let defaultConfig: RedisClientOptions = {
    url: 'redis://127.0.0.1',
    password: process.env.REDIS_PASSWORD
}

try {
    configFile = readFileSync(resolve(__dirname, '../', 'config/redis.yml')).toString();
    config = defaults(YAML.parse(configFile), defaultConfig);
} catch (err) {
    throw `Unable to load config file: ` + err;
}

export class Data extends EventEmitter {
    public db = createClient(config);
	public logger = new Logger('Database', 'db');

    constructor() {
        super();
    }

    async connect() {
        await this.db.connect();
		this.logger.info('Connected to Redis');
		
        const dataHandler: ProxyHandler<Record<string, any>> = {
            set: (target: any, prop: string, value: any) => {
                target[prop] = value;
                this.db.set(prop, value);
                return true;
            },
            get: async (target: Record<string, any>, prop: string, receiver: any) => {
                let value = await this.db.get(prop);
                target[prop] = value;
                return value;
            }
        }

        data = new Proxy({}, dataHandler);
    }

    async disconnect() {
        await this.db.disconnect();
        this.logger.info('Disconnected from Redis');
    }

    async getBridges() {
        let bridges = await this.db.get('bridges');
        let out = bridges || '{ "bridges": [] }';
        return JSON.parse(out);
    }

    async setBridges(bridges: ChannelManagerConfig) {
        await this.db.set('bridges', JSON.stringify(bridges));
    }
}
