import { resolve } from 'path';
import { Data, data } from './Data';
import { DiscordBot } from './Discord/DiscordBot';
import { config as dotenv } from 'dotenv';
import { Logger } from './Logger/Logger';
import { ChannelManager } from './ChannelManager';

dotenv({
    path: resolve(__dirname, '../', '.env')
});

const { DISCORD_TOKEN } = process.env;

export class Bridgemaster {
    public static logger = new Logger('Main', 'main');
    public static discordBot = new DiscordBot();
    public static db = new Data();

    public static async start() {
        this.logger.info('Starting...');
        await this.db.connect();
        this.discordBot.start(DISCORD_TOKEN as string);
        await ChannelManager.start();
    }

    public static async stop() {
        this.logger.info('Stopping...');
        await ChannelManager.stop();
        this.discordBot.stop();
        await this.db.disconnect();
    }
}

(async () => {
    Bridgemaster.start();
})();
