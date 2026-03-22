import { Logger } from "~/util/Logger";
import { Service, ServiceStatus } from "./Service";


export class ServiceClient extends Service {
    public ws: WebSocket | undefined;
    public logger = new Logger("Service Client");

    constructor(public uri: string, public token: string, public serviceId: string, public channelId: string) {
        super();

        this.on("connect", o => {
            this.logger.debug("connection test")
            this.transmit({
                type: "connect",
                service: this.serviceId,
                channel: this.channelId,
                token: this.token
            });
        });

        this.on("status", o => {
            if (o.status === ServiceStatus.AFU) {
                this.logger.debug("Service now in AFU mode");
            }
        });
    }

    public start() {
        this.ws = new WebSocket(this.uri);

        this.ws.addEventListener("open", () => {
            this.emit("connect");
        });

        this.ws.addEventListener("error", evt => {
            this.emit("wserror", evt);
        });

        this.ws.addEventListener("close", evt => {
            this.emit("disconnect", evt.code, evt.reason);
            setTimeout(() => {
                this.start();
            }, 3000);
        });

        this.ws.addEventListener("message", evt => {
            try {
                const message = evt.data;
                this.receive(JSON.parse(message));
            } catch (err) {
                this.logger.error(err);
            }
        });
    }

    public stop() {
        if (this.ws) this.ws.close();
    }

    public transmit(obj: Record<string, unknown>) {
        try {
            if (!this.ws)
                throw new Error("Not connected to server");
            if (typeof obj.type !== "string") throw new Error("Invalid object");
            this.ws.send(JSON.stringify(obj));
        } catch (err) {
            this.logger.error("Unable to transmit:", err);
        }
    }

    public receive(obj: Record<string, unknown>) {
        if (typeof obj.type !== "string") return;
        this.emit(obj.type, obj);
    }
}
