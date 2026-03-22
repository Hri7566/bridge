import type { ServerWebSocket } from "bun";
import { Data } from "~/Data";
import type { WebSocketData } from "..";
import Service, { ServiceStatus } from "./Service";

export class ServiceSocket extends Service {
    private destroyed = false;
    public serviceId: string = "";
    public channelId: string = "";

    constructor(public ws: ServerWebSocket<WebSocketData>) {
        super();

        this.on("connect", o => {
            this.logger.debug(o)
            // TODO: check token against Data.validateToken()
            if (typeof o.service !== "string") return;
            if (typeof o.channel !== "string") return;
            if (typeof o.token !== "string") return;
            if (!Data.isTokenValid(o.token)) return;

            this.serviceId = o.service;
            this.channelId = o.channel;
            this.logger.debug(this.serviceId, this.channelId);

            this.setStatus(ServiceStatus.AFU);
        });
    }

    public destroy() {
        this.destroyed = true;
    }

    public transmit(obj: unknown) {
        if (this.destroyed) return;

        try {
            this.ws.sendText(JSON.stringify(obj));
        } catch (err) { }
    }

    public receive(obj: Record<string, unknown>) {
        if (this.destroyed) return;

        try {
            if (typeof obj.type !== "string") return;
            this.emit(obj.type, obj);
        } catch (err) { }
    }

    public setStatus(status: ServiceStatus) {
        const st = {
            type: "status",
            status
        };

        this.emit(st.type, st);
        this.transmit(st);
    }

    public getOrigin() {
        return `${this.serviceId}:${this.channelId}`;
    }
}
