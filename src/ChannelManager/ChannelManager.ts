import { readFileSync } from "fs";
import { Bridgemaster } from "..";
import { Logger } from "../Logger/Logger";
import Discord from "discord.js";
import { resolve } from "path";
import defaults from "defaults";
import YAML from "yaml";
import { Bridge } from "./Bridge";
import {
    BridgePost,
    DiscordBridgePost,
    IRCBridgePost,
    MPPBridgePost
} from "./BridgePost";
import { MPPBot } from "../MPP/MPPBotHandler";
import { IRCBot } from "../IRC/IRCBot";
import { MessageTypes as IRCMessageTypes } from "node-nirc";

let configFile: string;
let config: ChannelManagerConfig;
const defaultConfig: ChannelManagerConfig = {
    bridges: []
};

try {
    configFile = readFileSync(
        resolve(__dirname, "../../", "config/channel_manager.yml")
    ).toString();
    config = defaults(YAML.parse(configFile), defaultConfig);
} catch (err) {
    throw `Unable to load config file: ` + err;
}

export class ChannelManager {
    public static logger = new Logger("Channel Manager", "channel_manager");
    public static bridges: Bridge[] = [];
    public static bridgeConfigs: BridgeConfig[] = [];

    public static async start(): Promise<void> {
        this.logger.info("Loading saved bridges...");
        let savedBridges =
            (await Bridgemaster.db.getBridges()) || defaultConfig;
        let bridgeConfigsMerged: BridgeConfig[] = savedBridges.bridges;

        // console.debug("Saved bridges:", savedBridges);

        if (savedBridges.bridges) {
            for (let bc of config.bridges) {
                let existing = savedBridges.bridges.find((sc: BridgeConfig) => {
                    let existing = Bridge.stringify(sc) == Bridge.stringify(bc);
                    // console.debug(Bridge.stringify(sc), Bridge.stringify(bc));
                    return existing;
                });
                if (!existing) {
                    this.logger.debug("Bridge does not exist");
                    bridgeConfigsMerged.push(bc);
                }
            }
        }

        // console.debug("Merged bridges:", bridgeConfigsMerged);

        for (let bridgeConfig of bridgeConfigsMerged) {
            this.createBridge(bridgeConfig);
        }
    }

    public static async stop(): Promise<void> {
        // TODO channel manager stop
    }

    public static async createBridge(bridgeConfig: BridgeConfig) {
        let bridge = new Bridge();
        for (let channelConfig of bridgeConfig.channels) {
            // each channel has its own connection rules based on ch.type
            if (channelConfig.type == "discord") {
                let guild = await Bridgemaster.discordBot.client.guilds.fetch(
                    Bridgemaster.discordBot.config.server
                );
                if (!guild) {
                    this.logger.warn(
                        "Unable to bridge Discord channel: Guild not found"
                    );
                    continue;
                }

                const channel = await guild.channels.fetch(channelConfig.id);
                if (!channel) {
                    this.logger.warn(
                        "Unable to bridge Discord channel: Channel not found"
                    );
                    continue;
                }

                this.logger.info("Creating Discord post...");
                const discordPost = new DiscordBridgePost(
                    Bridgemaster.discordBot,
                    channel
                );

                Bridgemaster.discordBot.client.on(
                    Discord.Events.MessageCreate,
                    msg => {
                        if (
                            msg.author.id ==
                            Bridgemaster.discordBot.config.client
                        )
                            return;
                        if (msg.channel.id !== channelConfig.id) return;

                        bridge.eventStream.emit(
                            "message",
                            discordPost,
                            `[Discord] \`${msg.author.id.substring(0, 6)}\` ${
                                msg.author.username
                            }: ${msg.content}`
                        );
                    }
                );

                bridge.eventStream.on("message", (post, message) => {
                    if (!channel.isTextBased()) return;
                    if (post.type == "discord") return;
                    channel.send({
                        content: message,
                        allowedMentions: {
                            parse: []
                        }
                    });
                });

                bridge.addPost(discordPost);
            }

            if (channelConfig.type == "mpp") {
                const bot = new MPPBot(channelConfig.id);
                this.logger.info(`Creating MPP post in ${channelConfig.id}...`);
                const mppPost = new MPPBridgePost(bot, channelConfig.id);
                bot.start();

                bot.on("a", (msg: any) => {
                    if (msg.p._id == bot.getOwnParticipant()._id) return;
                    if (channelConfig.id !== bot.channel._id) {
                        bot.setChannel(channelConfig.id);
                        return;
                    }

                    bridge.eventStream.emit(
                        "message",
                        mppPost,
                        `[MPP - ${bot.bridgeChannel}] \`${msg.p._id.substring(
                            0,
                            6
                        )}\` ${msg.p.name}: ${msg.a}`
                    );
                });

                // bot.on("participant added", (p: any) => {
                //     if (bot.channel) {
                //         if (channelConfig.id !== bot.channel._id) {
                //             bot.setChannel(channelConfig.id);
                //             return;
                //         }
                //     }

                //     bridge.eventStream.emit(
                //         "message",
                //         mppPost,
                //         `[MPP] \`${p._id.substring(0, 6)}\` ${
                //             p.name
                //         } joined the room`
                //     );
                // });

                // bot.on("participant removed", (p: any) => {
                //     if (bot.channel) {
                //         if (channelConfig.id !== bot.channel._id) {
                //             bot.setChannel(channelConfig.id);
                //             return;
                //         }
                //     }

                //     bridge.eventStream.emit(
                //         "message",
                //         mppPost,
                //         `[MPP] \`${p._id.substring(0, 6)}\` ${
                //             p.name
                //         } left the room`
                //     );
                // });

                bridge.addPost(mppPost);

                bridge.eventStream.on(
                    "message",
                    (post: BridgePost, message) => {
                        // if (post.type == "mpp") return;
                        if (post.id == mppPost.id) return; // FIXME
                        bot.sendChat(message);
                    }
                );
            }

            if (channelConfig.type == "irc") {
                const bot = new IRCBot(channelConfig.id);
                this.logger.info(`Creating IRC post in ${channelConfig.id}...`);
                const ircPost = new IRCBridgePost(bot, channelConfig.id);
                bot.start();

                bot.irc.on(
                    IRCMessageTypes.PRIVMSG,
                    (args: string[], sender: string) => {
                        let ch = args[0];
                        let msg = args[args.length - 1].replace(":", "");
                        let nick = sender.split("!")[0].split(":").join("");
                        let user = sender.split("!")[1];
                        let host = sender.split("@")[1];

                        bridge.eventStream.emit(
                            "message",
                            ircPost,
                            `[IRC - #${channelConfig.id}] ${nick}: ${msg}`
                        );
                    }
                );

                bridge.eventStream.on(
                    "message",
                    (post: BridgePost, message) => {
                        if (post.id == ircPost.id) return; // FIXME
                        bot.sendChat(message);
                    }
                );
            }
        }

        this.bridges.push(bridge);
        this.bridgeConfigs.push(bridgeConfig);
        await this.saveBridgeConfig();
    }

    static async saveBridgeConfig() {
        await Bridgemaster.db.setBridges({
            bridges: this.bridgeConfigs
        });
    }
}
