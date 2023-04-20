import defaults from "defaults";
import EventEmitter from "events";
import { readFileSync } from "fs";
import IRC, { MessageTypes } from "node-nirc";
import { resolve } from "path";
import YAML from "yaml";

require("dotenv").config();

interface Config {
    host: string;
    port: number;
    fullName: string;
    nick: string;
    password?: string;
}

let configFile: string;
let config: Config;
let defaultConfig: Config = {
    host: "home.hri7566.info",
    port: 6697,
    fullName: "Bridgemaster",
    nick: "Bridgemaster",
    password: process.env.IRC_PASSWORD
};

try {
    configFile = readFileSync(
        resolve(__dirname, "../../", "config/irc.yml")
    ).toString();
    config = defaults(YAML.parse(configFile), defaultConfig);
} catch (err) {
    throw `Unable to load config file: ` + err;
}

export class IRCBot extends EventEmitter {
    public irc: IRC;

    constructor(public channel: string) {
        super();
        this.irc = new IRC(config);
    }

    start() {
        // console.debug("irc connecting");
        this.irc.connect();

        setTimeout(() => {
            this.irc.join(`#${this.channel}`);
        }, 5000);

        this.irc.on("PRIVMSG", (args, sender) => {
            let ch = args[0];
        });
    }

    sendChat(str: string) {
        // console.debug("irc message test");
        this.irc.sendChat(`#${this.channel}`, str);
    }
}
