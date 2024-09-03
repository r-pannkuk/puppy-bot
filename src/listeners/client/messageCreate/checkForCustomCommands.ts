import { ApplyOptions } from "@sapphire/decorators";
import { container, Events, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";

@ApplyOptions<Listener.Options>({
	event: Events.MessageCreate
})
export class MessageCreateCheckForCustomCommands extends Listener<typeof Events.MessageCreate> {
	public override async run(message: Message) {
		if (!message.guild) return;

		var sapphirePrefix = (await container.client.fetchPrefix(message)) as string | readonly string[] | null;

		if (!sapphirePrefix) return;
		if (typeof sapphirePrefix === 'string') sapphirePrefix = [sapphirePrefix];

		// Replacing escaped characters for regex.
		const prefixes: readonly string[] = ['\/'].concat(sapphirePrefix.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

		const customCommands = message.guild.customCommandSystem?.customCommands;

		if (!customCommands) return;

		for (
			var [_id, command] of
			customCommands.filter((command) => (
				message.content.toLowerCase().match(
					new RegExp(`^(${prefixes.join('|')})(${[command.name].concat(command.aliases).join('|')})$`)
				) ?? []
			).length > 0)
		) {
			await message.guild!.customCommandSystem.run(message, command);
		}
	}
}