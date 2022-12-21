import { appendFile } from 'fs/promises';
import { resolve } from 'path';

const logger = require('pino')();

const infoFilePath = resolve(__dirname, '../', 'logs/info.log');
const errorFilePath = resolve(__dirname, '../', 'logs/error.log');
const warnFilePath = resolve(__dirname, '../', 'logs/warn.log');
const debugFilePath = resolve(__dirname, '../', 'logs/debug.log');
const fullFilePath = resolve(__dirname, '../', 'logs/full.log');

export class Logger {
    constructor(public id: string) { }

    public info(args: any[]): void {
        logger.info(`[${this.id}]`, ...args);
    }

    public error(args: any[]): void {
        logger.error(`[${this.id}]`, ...args);
    }

    public warn(args: any[]): void {
        logger.warn(`[${this.id}]`, ...args);
    }

    public debug(args: any[]): void {
        logger.debug(`[${this.id}]`, ...args);
    }
}