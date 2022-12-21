import { Data, data } from './Data';
import { DiscordBot } from './Discord/DiscordBot';

require('dotenv').config();

(async () => {
    const db = new Data();
    await db.connect();

    const discordBot = new DiscordBot();
    discordBot.start();
})();
