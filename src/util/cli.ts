import readline from "node:readline/promises";
import { Data } from "~/Data";
import { Logger } from "./Logger";

export const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const logger = new Logger("CLI");

export function startReadline() {
    (globalThis as any).rl = rl;
    rl.setPrompt("bridge> ");
    rl.prompt();

    rl.on("line", async data => {
        // TODO: CLI commands
        if (data.startsWith("/gentoken")) {
            const token = await Data.createToken();
            logger.info("New token:", token);
        }

        if (data.startsWith("/listtokens")) {
            const list = [];

            for await (const key of Data.db.keys({ gte: "token." })) {
                list.push(key.substring("token.".length));
            }

            logger.info(`Tokens:\n- ${list.join("\n- ")}`);
        }

        rl.prompt();
    });

    rl.on("SIGINT", () => {
        process.emit("SIGINT");
    });
}

