import Discord from "discord.js";
import { ConfigManager } from "~/util/config";
import { Logger } from "~/util/Logger";

const configPath = process.argv[2] ?? "./config/discord.yml";

const defaultConfig = {
    uri: "ws://127.0.0.1:7566",
    channelId: "1426758857358704722",
    user: {
        name: "Bridgemaster",
        color: '#00ff99'
    },
    envToken: "DISCORD_SERVICE_TOKEN",
    envDiscordToken: "DISCORD_TOKEN"
}

const config = ConfigManager.loadConfig(configPath, defaultConfig);
const logger = new Logger("Discord");

const cl = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.MessageContent,

        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.GuildMessageTyping
    ]
});

cl.on("clientReady", () => {
});

cl.on("messageCreate", msg => {
});

cl.login(process.env[config.envDiscordToken])
