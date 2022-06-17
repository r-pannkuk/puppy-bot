import type { container } from "@sapphire/framework";

export abstract interface IGuildManager {
	// protected guildId: string;
	get guild() {
		return container.client.guilds.cache.get(this.guildId);
	}
}