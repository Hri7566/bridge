const defaultConfig: ChannelManagerConfig = {
	bridges: []
}

export class ChannelManager {
	public static start(config: ChannelManagerConfig = defaultConfig): void {
		for (let bridge of config.bridges) {
			for (let ch of bridge.channels) {
				// each channel has its own connection rules based on ch.type
				
			}
		}
	}
}
