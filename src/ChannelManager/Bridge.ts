import EventEmitter from "events";
import { BridgePost } from "./BridgePost";

export class Bridge {
    eventStream = new EventEmitter();

    constructor(
        public posts: BridgePost[] = []
    ) {}

    addPost(post: BridgePost): void {
        if (this.posts.indexOf(post) == -1) this.posts.push(post);
    }

    public static stringify(cfg: BridgeConfig) {
        let str = "";

        for (let ch of cfg.channels) {
            str += `${ch.type}#${ch.id}+`
        }

        str = str.substring(0, str.length - 1);

        return str;
    }
}
