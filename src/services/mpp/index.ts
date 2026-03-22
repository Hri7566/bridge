import { Client, OutgoingEvents } from "mpp-client-net";
import { ConfigManager } from "~/util/config";
import { Logger } from "~/util/Logger";
import { ServiceClient } from "../ServiceClient";

const configPath = process.argv[2] ?? "./config/mpp.yml";

const defaultConfig = {
    mppUri: "wss://backend.multiplayerpiano.net",
    mppServerId: "mppnet",
    uri: "ws://127.0.0.1:7566",
    channel: "cheez",
    user: {
        name: "Bridgemaster",
        color: '#00ff99'
    },
    envToken: "MPPNET_SERVICE_TOKEN",
    envMPPToken: "MPPNET_TOKEN"
}

const config = ConfigManager.loadConfig(configPath, defaultConfig);

const cl = new Client(config.mppUri, process.env[config.envMPPToken]);
const logger = new Logger(`MPP - ${config.channel}`);

const s = new ServiceClient(
    config.uri,
    process.env[config.envToken] || "",
    "mpp",
    `${config.mppServerId}/${config.channel}`
);

s.start();

s.on("connect", () => {
    s.logger.debug("Connected to bridge server");
    if (!cl.isConnected())
        cl.start();
});

s.on("disconnect", (code, reason) => {
    s.logger.debug("Disconnected from bridge server:", code, reason);
});

s.on("chat", o => {
    const destroy = {
        m: "userset",
        set: {
            name: `[${o.origin}] ${o.name}`,
            color: o.color
        }
    } as OutgoingEvents["userset"];

    const fix = {
        m: "userset",
        set: config.user
    } as OutgoingEvents["userset"];

    if (o.name) {
        cl.sendArray([destroy, { m: "a", message: `\u034f${o.message}` }, fix]);
    } else {
        cl.sendChat(`\u034f[${o.origin}] ${o.message}`);
    }
});

cl.on("hi", msg => {
    logger.info(`Connected to ${cl.uri} as ${msg.u.name} (${msg.u._id})`);
    cl.setChannel(config.channel);

    if (
        msg.u.name !== config.user.name ||
        msg.u.color !== config.user.color
    ) {
        cl.userset(config.user);
    }

    setTimeout(() => {
        cl.once("participant added", p => {
            s.transmit({
                type: "chat",
                message: `- ${p.name} joined the channel`
            });
        });

        cl.once("participant removed", p => {
            s.transmit({
                type: "chat",
                message: `${p.name} left the channel`
            });
        });
    }, 2000);
});

cl.on("a", msg => {
    if (msg.p._id == cl.getOwnParticipant()._id) return;

    logger.debug(`${msg.p._id.substring(0, 6)} ${msg.p.name}: ${msg.a}`);

    s.transmit({
        type: "chat",
        name: `${msg.p._id.substring(0, 6)} ${msg.p.name}`,
        message: msg.a,
        color: msg.p.color
    });
});
