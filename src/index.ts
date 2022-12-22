import { resolve } from 'path';
import { Data, data } from './Data';
import { DiscordBot } from './Discord/DiscordBot';
import { config as dotenv } from 'dotenv';

dotenv({
    path: resolve(__dirname, '../', '.env')
});

const { DISCORD_TOKEN } = process.env;

(async () => {
    const db = new Data();
    await db.connect();

    const discordBot = new DiscordBot();
    discordBot.start(DISCORD_TOKEN as string);
})();
