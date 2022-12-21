import defaults from 'defaults';
import Discord from 'discord.js';
import EventEmitter from 'events';
import YAML from 'yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '../Logger/Logger';

const { DISCORD_TOKEN } = process.env;

interface Config {
    uri: string;
}

let configFile: string;
let config: Config;
let defaultConfig: Config = {
    uri: 'wss://mppclone.com:8443'
}

try {
    configFile = readFileSync(resolve(__dirname, '../../', 'config/mpp.yml')).toString();
    config = defaults(YAML.parse(configFile), defaultConfig);
} catch (err) {
    throw `Unable to load config file: ` + err;
}

export class DiscordBot extends EventEmitter {
    public client: Discord.Client = new Discord.Client({
        intents: [
            'DirectMessages',
            'GuildMembers',
            'GuildMessages'
        ]
    });

    public logger = new Logger('Discord');
    
    constructor() {
        super();
        this.bindEventListeners();
    }

    public start(): void {
        this.client.login(DISCORD_TOKEN);
    }

    public stop(): void {
        this.client.destroy();
    }

    private bindEventListeners(): void {
        this.client.on(Discord.Events.ClientReady, cl => {
            
        });
    }
}
