import { appendFile } from "fs/promises";
import { mkdirSync } from "fs";
import { resolve } from "path";
import pino from "pino";

// const infoFilePath = resolve(__dirname, '../', 'logs/info.log');
// const errorFilePath = resolve(__dirname, '../', 'logs/error.log');
// const warnFilePath = resolve(__dirname, '../', 'logs/warn.log');
// const debugFilePath = resolve(__dirname, '../', 'logs/debug.log');
// const fullFilePath = resolve(__dirname, '../', 'logs/full.log');

try {
    mkdirSync(resolve(__dirname, "../../", "logs"));
} catch (err) {}

export class Logger {
    public logger: pino.Logger;
    public filePath: string;

    constructor(public id: string, filePath: string) {
        this.filePath = resolve(
            __dirname,
            "../../",
            "logs/",
            filePath + ".log"
        );

        this.logger = require("pino")(
            {
                transport: {
                    target: "pino-pretty"
                }
            },
            pino.destination(this.filePath)
        );
    }

    public info(...args: any[]): void {
        this.logger.info([`[${this.id}]`, ...args].join(" "));
    }

    public error(...args: any[]): void {
        this.logger.error([`[${this.id}]`, ...args].join(" "));
    }

    public warn(...args: any[]): void {
        this.logger.warn([`[${this.id}]`, ...args].join(" "));
    }

    public debug(...args: any[]): void {
        this.logger.debug([`[${this.id}]`, ...args].join(" "));
    }
}
