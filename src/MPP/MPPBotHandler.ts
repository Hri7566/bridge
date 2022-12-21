import EventEmitter from 'events';
import YAML from 'yaml';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import defaults from 'defaults';
const Client = require('mppclone-client');

const { MPPCLONE_TOKEN } = process.env;

interface Config {
    uri: string;
}

let configFile: string;
let config: Config;
let defaultConfig: Config = {
    uri: 'wss://mppclone.com:8443'
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
    constructor() {
        super(config.uri, MPPCLONE_TOKEN);
    }

    public start() {
        super.start();
    }

    public stop() {
        super.stop();
    }

    public sendChat(str: string) {
        for (const line of str.split('\n')) {
            this.sendArray([{
                m: 'a',
                message: line
            }]);
        }
    }

    public bindEventListeners() {
        super.bindEventListeners();

        this.on('a', (msg: any) => {

        });
    }
}

export class MPPBotHandler extends EventEmitter {

}
