import { Level } from "level";
import { Logger } from "./util/Logger";

const dbPath = process.env.DB_PATH || "./data";

enum DBKeys {
    Token = "token",
}

export class Data {
    public static logger = new Logger("Database");

    public static db = new Level(dbPath, {
        valueEncoding: "json"
    });

    public static async createToken() {
        const token = crypto.randomUUID();
        await this.db.put(`${DBKeys.Token}.${token}`, true as unknown as string);
        return token;
    }

    public static async deleteToken(token: string) {
        await this.db.del(`${DBKeys.Token}.${token}`);
    }

    public static async isTokenValid(token: string) {
        const data = await this.db.get(`${DBKeys.Token}.${token}`) as unknown as boolean;
        return data === true;
    }
}
