declare interface ChannelConfigDiscord {
	type: 'discord';
}

declare interface ChannelConfigIRC {
	type: 'irc';
}

declare interface ChannelConfigMPP {
	type: 'mpp';
	channelSettings: ChannelSettings;
}

declare type ChannelConfig = (ChannelConfigDiscord | ChannelConfigIRC | ChannelConfigMPP) & {
	type: string;
	id: string; // mpp room name/discord channel id/irc channel name
}

declare interface BridgeConfig {
	channels: ChannelConfig[];
}

declare interface ChannelManagerConfig {
	bridges: BridgeConfig[];
}
