import defaults from 'defaults';
import Discord from 'discord.js';
import EventEmitter from 'events';
import YAML from 'yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Logger } from '../Logger/Logger';
import { DiscordCommand, DiscordCommandAnyInterface, DiscordCommandHandler } from './DiscordCommandHandler';

interface Config {
    server: string;
    client: string;
    category: string;
    adminRole: string;
}

let configFile: string;
let config: Config;
let defaultConfig: Config = {
    server: '1029618816235347999',
    client: '951605776273772675',
    category: '1061824322878058496',
    adminRole: '1029619091427819541'
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
            'GuildMessages',
            'MessageContent',
            'GuildPresences'
        ]
    });

    public config = config;
    public logger = new Logger('Discord', 'discord');
    public rest: Discord.REST | undefined;
    public guild: Discord.Guild | undefined;
    
    constructor() {
        super();
        this.registerSlashCommands();
        this.bindEventListeners();
    }

    public start(token: string): void {
        this.client.login(token);
        this.rest = new Discord.REST({ version: '10' }).setToken(token);
        this.registerSlashCommands();
    }

    public stop(): void {
        this.client.destroy();
        this.logger.info('Disconnected from Discord');
    }

    private bindEventListeners(): void {
        this.client.on(Discord.Events.ClientReady, async cl => {
            this.logger.info('Connected');

            const guilds = await this.client.guilds.fetch();
            const guild = await (guilds.find(g => g.id == config.server))?.fetch()
            if (!guild) return;
            this.guild = guild;

            const channels = await guild.channels.fetch();
            // console.log(channels);

			// `/createmppbridge channelName mppRoom`
			// creates discord channel
			// get its id
			// bridge the channel and the room with a default config
        });

        this.client.on(Discord.Events.InteractionCreate, async int => {
            if (int.isChatInputCommand()) {
                let id = int.commandName;
                let cmd = DiscordCommandHandler.commands.find(c => c.id == id);

                if (!cmd) {
                    return this.logger.error(`Couldn't find command with ID '${id}'`);
                }

                try {
                    let out = await cmd.callback(int, this);
                    if (out) {
                        await int.reply(out);
                    }
                } catch (err) {
                    console.error(err);
                    await int.reply({
                        content: `An error has occurred.`,
                        ephemeral: true
                    });
                }
            }

            if (int.isAnySelectMenu() || int.isButton()) {
                let id: any;
                let cmd: DiscordCommandAnyInterface | undefined;
                if (!int.message.interaction) return;
                id = int.message.interaction.commandName;
                cmd = DiscordCommandHandler.commands.find(c => c.id == id);

                if (int.isModalSubmit()) {
                    console.log(int);
                }

                if (!cmd) {
                    return this.logger.error(`Couldn't find command with ID '${id}'`);
                }

                if (cmd.interactionCallback) cmd.interactionCallback(int, this);
            }

            if (int.isModalSubmit()) {
                let modalId = int.customId;
                let modalHandler = DiscordCommandHandler.modalHandlers.find(m => m.modalId == modalId);
                if (!modalHandler) return this.logger.error(`Couldn't find modal with ID '${modalId}'`);
                modalHandler.callback(int, this);
            }
        });
    }

    public async registerSlashCommands() {
        if (!this.rest) return;

        let commands: (Discord.SlashCommandBuilder | Omit<Discord.SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">)[] = [];
        const cmds = DiscordCommandHandler.commands;

        for (let cmd of cmds) {
            commands.push(cmd.slashCommandData);
        }

        await this.rest.put(Discord.Routes.applicationGuildCommands(config.client, config.server), { body: commands });
    }
}
