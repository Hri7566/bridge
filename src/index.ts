import { Data } from "./Data";
import { ServiceStatus } from "./services/Service";
import { ServiceSocket } from "./services/ServiceSocket";
import { startReadline } from "./util/cli";
import { ConfigManager } from "./util/config";
import { Logger } from "./util/Logger";

startReadline();
const logger = new Logger("Bridge Server");

const defaultConfig = {
    host: "127.0.0.1",
    port: 7566,
    allowedMessageTypes: ["auth", "chat"]
};

const config = ConfigManager.loadConfig("./config/server.yml", defaultConfig);

export interface WebSocketData {
    sid: number; // session id
}

let _s = 0;

function getNextSessionId() {
    return ++_s;
}

const services = new Map<number, ServiceSocket>();

const globalEvents = ["chat"];

const server = Bun.serve({
    hostname: config.host,
    port: config.port,
    fetch(req, server) {
        if (!server.upgrade(req, {
            data: {
                sid: getNextSessionId()
            }
        })) {
            --_s;
            return new Response("upgrade required");
        }
    },
    websocket: {
        data: {} as WebSocketData,
        open(ws) {
            logger.debug("Socket connected: " + ws.data.sid);
            services.set(ws.data.sid, new ServiceSocket(ws));
        },
        close(ws, code, reason) {
            logger.debug("Socket disconnected: " + ws.data.sid, code, reason);
            const s = services.get(ws.data.sid);

            if (s) {
                s.destroy();
                services.delete(ws.data.sid);
            }
        },
        message(ws, message) {
            try {
                const s = services.get(ws.data.sid);
                if (!s) return;

                const data = JSON.parse(message);
                if (typeof data.type !== "string") return;
                if (s.status !== ServiceStatus.AFU && data.type !== "connect") return;
                s.emit(data.type, data);

                if (globalEvents.indexOf(data.type) === -1) return;

                data.user = ws.data;
                data.origin = s.getOrigin();

                logger.debug(data);

                for (const se of services.values()) {
                    if (se === s) continue;
                    if (se.status !== ServiceStatus.AFU) continue;
                    se.transmit(data);
                }
            } catch (err) {
                logger.error(err);
            }
        }
    },
    error(err) {
        logger.error(err);
    }
});

logger.info(`Server listening on ${server.hostname}:${server.port}`);

process.on("SIGINT", async () => {
    logger.info("Received SIGINT");
    logger.info("Shutting down...");
    await server.stop();
    process.exit();
});
