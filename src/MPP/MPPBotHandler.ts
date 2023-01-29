import EventEmitter from 'events';
import YAML from 'yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import defaults from 'defaults';
import { Logger } from '../Logger/Logger';
const Client = require('mppclone-client');

require('dotenv').config();
const MPPCLONE_TOKEN = process.env.MPPCLONE_TOKEN;

interface Config {
    uri: string;
    user: Userset;
}

let configFile: string;
let config: Config;
let defaultConfig: Config = {
    uri: 'wss://mppclone.com:8443',
    user: {
        name: 'Bridgemaster',
        color: '#8d3f50'
    }
}

try {
    configFile = readFileSync(resolve(__dirname, '../../', 'config/mpp.yml')).toString();
    config = defaults(YAML.parse(configFile), defaultConfig);
} catch (err) {
    throw `Unable to load config file: ` + err;
}

export interface Participant {
    id: string;
    _id: string;
    name: string;
    color: `#${string}`;
}

export interface Userset {
    name: string;
    color: `#${string}`;
}

export interface MPPIncomingMessage {
    Chat: {
        m: 'a';
        a: 'string';
    }
}

export interface MPPOutgoingMessage {
    Chat: {
        m: 'a';
        message: 'string';
    }
}

export class MPPBot extends Client {
    logger: Logger;

    constructor(public bridgeChannel: string) {
        super(config.uri, MPPCLONE_TOKEN);
        this.logger = new Logger('MPP - ' + bridgeChannel, 'mpp.' + bridgeChannel.split('/').join('-'));
    }

    public start() {
        super.start();
        super.setChannel(this.bridgeChannel);
    }

    public stop() {
        super.stop();
    }

    public sendChat(str: string) {
        for (const line of str.split('\n')) {
            super.sendArray([{
                m: 'a',
                message: line
            }]);
        }
    }

    public bindEventListeners() {
        super.bindEventListeners();

        super.on('t', (msg: any) => {
            super.sendArray([{ m: 'userset', set: config.user }]);
            if (this.bridgeChannel !== this.channel.id) {
                super.setChannel(this.bridgeChannel);
                return;
            }
        });
    }
}
