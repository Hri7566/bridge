import Discord, { StringSelectMenuBuilder } from 'discord.js';
import { Logger } from '../Logger/Logger';
import { DiscordBot } from './DiscordBot';
import { ChannelManager } from '../ChannelManager';
import { MPPBridgePost } from '../ChannelManager/BridgePost';

export class DiscordCommand {
    constructor(
        public id: string,
        public callback: (msg: Discord.ChatInputCommandInteraction, bot: DiscordBot) => Promise<void | string> | void | string,
        public slashCommandData: Discord.SlashCommandBuilder | Omit<Discord.SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
    ) {}
}

export class DiscordCommandExtendedInteraction extends DiscordCommand {
    constructor(
        id: string,
        callback: (int: Discord.ChatInputCommandInteraction, bot: DiscordBot) => Promise<void | string> | void | string,
        slashCommandData: Discord.SlashCommandBuilder | Omit<Discord.SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">,
        public interactionCallback?: (int: any, bot: DiscordBot) => Promise<void> | void
    ) {
        super(id, callback, slashCommandData);
    }
}

export interface DiscordCommandInterface {
    id: string;
    callback: (msg: Discord.ChatInputCommandInteraction, bot: DiscordBot) => Promise<void | string> | void | string;
    slashCommandData: Discord.SlashCommandBuilder | Omit<Discord.SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;
}

export interface DiscordCommandExtendedInteractionInterface extends DiscordCommandInterface {
    interactionCallback?: (int: any, bot: DiscordBot) => Promise<void> | void;
}

export type DiscordCommandAnyInterface = DiscordCommandInterface & DiscordCommandExtendedInteractionInterface;

class DiscordModalHandler {
    constructor(
        public modalId: string,
        public callback: (int: Discord.ModalSubmitInteraction, bot: DiscordBot) => Promise<void> | void
    ) {}
}

export interface DiscordModalHandlerInterface {
    modalId: string;
    callback: (int: Discord.ModalSubmitInteraction, bot: DiscordBot) => Promise<void> | void;
}

export class DiscordCommandHandler {
    public static logger: Logger = new Logger('Discord Command Handler', 'discordcmdh');
    public static commands: DiscordCommandAnyInterface[] = [];
    public static modalHandlers: DiscordModalHandler[] = [];

    public static registerCommand(cmd: DiscordCommand): void {
        this.commands.push(cmd);
    }

    public static registerModalHandler(modalHandler: DiscordModalHandler) {
        this.modalHandlers.push(modalHandler);
    }
}

DiscordCommandHandler.registerCommand(new DiscordCommand(
    'help',
    async (int) => {
        return `This bot is a bot used to create channel bridges between Multiplayer Piano, Discord, and IRC.`
    },
    new Discord.SlashCommandBuilder()
        .setName('help')
        .setDescription('Show the help menu')
));

DiscordCommandHandler.registerCommand(new DiscordCommand(
    'createchannel',
    async (int, bot) => {
        const member = int.member;
        if (!member) {
            int.reply(`You don't exist.`);
            return;
        }

        let hasRole = false;
        if (member.roles instanceof Discord.GuildMemberRoleManager) {
            member.roles.cache.some((val, key) => {
                if (val.id == bot.config.adminRole) {
                    hasRole = true;
                }
            });
        } else {
            int.reply(`Roles aren't working.`);
            return;
        }

        if (!hasRole) return;

        const modal = new Discord.ModalBuilder()
            .setCustomId('channelModal')
            .setTitle('Create Channel');
        
        const channelInput = new Discord.TextInputBuilder()
            .setCustomId('channelNameInput')
            .setLabel('New Channel Name')
            .setStyle(Discord.TextInputStyle.Short);
        
        const actionRow1 = new Discord.ActionRowBuilder<Discord.ModalActionRowComponentBuilder>().addComponents(channelInput);
        modal.addComponents(actionRow1);
        int.showModal(modal);
    },
    new Discord.SlashCommandBuilder()
        .setName('createchannel')
        .setDescription('Create a bridge channel')
));

DiscordCommandHandler.registerModalHandler(new DiscordModalHandler(
    'channelModal',
    async (int, bot) => {
        let channelName = int.fields.getTextInputValue('channelNameInput');

        if (!int.guild) {
            int.reply({ ephemeral: true, content: `No guild found...` });
            return;
        }

        let channel = await int.guild.channels.create({
            name: channelName
        });

        channel.setParent(bot.config.category);

        int.reply({
            ephemeral: true,
            content: `Created channel ${channelName}`
        });
    }
));

DiscordCommandHandler.registerCommand(new DiscordCommand(
    'bridgempp',
    async (int, bot) => {
        const member = int.member;
        if (!member) {
            int.reply(`You don't exist.`);
            return;
        }

        let hasRole = false;
        if (member.roles instanceof Discord.GuildMemberRoleManager) {
            member.roles.cache.some((val, key) => {
                if (val.id == bot.config.adminRole) {
                    hasRole = true;
                }
            });
        } else {
            int.reply(`Roles aren't working.`);
            return;
        }

        if (!hasRole) return;

        const channel = int.options.getString('channel');
        if (!channel) {
            int.reply('No channel name given!');
            return;
        }

        if (!int.channel) {
            int.reply(`this interaction wasn't used in a channel?!`);
            return;
        }

        await ChannelManager.createBridge({
                channels: [
                    {
                        type: 'mpp',
                        id: channel,
                        channelSettings: {
                            color: '#000000',
                            color2: '#000000',
                            chat: true,
                            crownsolo: false,
                            visible: true
                        }
                    },
                    {
                        type: 'discord',
                        id: int.channel.id
                    }
                ]
        });

        int.reply('Bridged to ' + channel);
    },
    new Discord.SlashCommandBuilder()
        .setName('bridgempp')
        .setDescription('Create a bridge to MPP')
        .addStringOption(opt =>
            opt.setName('channel')
                .setDescription('MPP channel to bridge')
        )
));

DiscordCommandHandler.registerCommand(new DiscordCommand(
    'deletebridges',
    async (int, bot) => {
        const member = int.member;
        if (!member) {
            int.reply(`You don't exist.`);
            return;
        }

        let hasRole = false;
        if (member.roles instanceof Discord.GuildMemberRoleManager) {
            member.roles.cache.some((val, key) => {
                if (val.id == bot.config.adminRole) {
                    hasRole = true;
                }
            });
        } else {
            int.reply(`Roles aren't working.`);
            return;
        }

        if (!hasRole) return;

        if (!int.channel) {
            int.reply(`this interaction wasn't used in a channel?!`);
            return;
        }

        for (let b of ChannelManager.bridges) {
            let p = b.posts.find(p => p.type == 'discord');
            if (!p) continue;
            if (p.id == int.channel.id) {
                b.posts.forEach(p => p.id == 'mpp' ? (p as MPPBridgePost).bot.stop() : undefined);
                ChannelManager.bridges.splice(ChannelManager.bridges.indexOf(b), 1);

                // b.posts.forEach(p => {
                //     if (p.type !== 'mpp') return;
                //     (p as MPPBridgePost).bot.stop();
                // });
            }
        }

        bridgeConfigLoop:
        for (let b of ChannelManager.bridgeConfigs) {
            for (let bc of b.channels) {
                if (bc.type == 'discord' && bc.id == int.channel.id) {
                    ChannelManager.bridgeConfigs.splice(ChannelManager.bridgeConfigs.indexOf(b), 1);
                    ChannelManager.saveBridgeConfig();
                    break bridgeConfigLoop;
                }
            }
        }

        int.reply('Removed all bridges from this channel');
    },
    new Discord.SlashCommandBuilder()
        .setName('deletebridges')
        .setDescription('Delete all bridges in the current channel')
));
