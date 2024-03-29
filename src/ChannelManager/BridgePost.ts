import { DiscordBot } from "../Discord/DiscordBot";
import Discord from "discord.js";
import { MPPBot } from "../MPP/MPPBotHandler";
import { IRCBot } from "../IRC/IRCBot";

export abstract class BridgePost {
    constructor(public type: string, public id: string) {}
}

export class DiscordBridgePost extends BridgePost {
    constructor(public bot: DiscordBot, public channel: Discord.Channel) {
        super("discord", channel.id);
    }
}

export class MPPBridgePost extends BridgePost {
    constructor(public bot: MPPBot, public channel: string) {
        super("mpp", channel);
    }
}

export class IRCBridgePost extends BridgePost {
    constructor(public bot: IRCBot, public channel: string) {
        super("irc", channel);
    }
}
