import defaults from 'defaults';
import Discord from 'discord.js';
import EventEmitter from 'events';
import YAML from 'yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '../Logger/Logger';

interface Config {
    server: string;
}

let configFile: string;
let config: Config;
let defaultConfig: Config = {
    server: '1029618816235347999'
}

try {
    configFile = readFileSync(resolve(__dirname, '../../', 'config/discord.yml')).toString();
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

    public logger = new Logger('Discord', 'discord');
    
    constructor() {
        super();
        this.bindEventListeners();
    }

    public start(token: string): void {
        this.client.login(token);
    }

    public stop(): void {
        this.client.destroy();
    }

    private bindEventListeners(): void {
        this.client.on(Discord.Events.ClientReady, async cl => {
            this.logger.info('Connected');

            const guilds = await this.client.guilds.fetch();
            const guild = await (guilds.find(g => g.id == config.server))?.fetch()
            if (!guild) return;

            const channels = await guild.channels.fetch();
            // console.log(channels);

			// `/createmppbridge channelName mppRoom`
			// creates discord channel
			// get its id
			// bridge the channel and the room with a default config
        });
    }

    public createChannel() {

    }
}
