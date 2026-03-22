import { EventEmitter } from "node:events";
import { Logger } from "~/util/Logger";

export enum ServiceStatus {
    BFU,
    AFU
}

export abstract class Service extends EventEmitter {
    public status = ServiceStatus.BFU;
    public logger = new Logger("Service");

    constructor() {
        super();

        this.on("status", o => {
            this.status = o.status;
        });
    }

    public abstract transmit(obj: unknown): unknown;
    public abstract receive(obj: unknown): unknown;
}

export default Service;
