/* OBSOLETE - Not valid with limitations on slash commands. */

import type { CustomCommand } from "@prisma/client";
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, Command, container, RegisterBehavior } from "@sapphire/framework";
import { Message, CommandInteraction, ChatInputCommandInteraction } from "discord.js";
import { PuppyBotCommand } from "./PuppyBotCommand";

export class PuppyBotCustomCommand extends PuppyBotCommand {
	protected schema: CustomCommand;

	public constructor(options: PuppyBotCustomCommand.Options) {
		super({
			name: `${options.schema.guildId}-${options.schema.name}`,
			path: '',
			root: '',
			store: container.stores.get('commands')
		} as Command.Context, {
			...options,
			name: `${options.schema.guildId}-${options.schema.name}`,
			aliases: [options.schema.name].concat(options.schema.aliases),
			description: `Custom command created by ${container.client.users.cache.get(options.schema.ownerId)}.`,
			runIn: "GUILD_ANY"
		})

		this.schema = options.schema;
	}

	public override async registerApplicationCommands(registry: ApplicationCommandRegistry) {
		const names: string[] = [this.schema.name].concat(this.schema.aliases);

		for (const name of names) {
			registry.registerChatInputCommand((builder) => builder
				.setName(name)
				// Add alias to the description.
				.setDescription(this.description + (name === this.schema.name) ? "" : `  (Alias of ${this.schema.name}).`), {
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
				guildIds: [this.schema.guildId]
			})
		}
	}

	public async unregisterApplicationCommands() {
		const names: string[] = [this.schema.name].concat(this.schema.aliases);
		const guild = container.client.guilds.cache.get(this.schema.guildId);

		for (const name of names) {
			await guild?.commands.delete(name);
		}
	}

	public override async messageRun(message: Message, _args: Args) {
		await this.run(message);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
		await this.run(interaction);
	}

	public async run(messageOrInteraction: Message<boolean> | CommandInteraction) {
		if (messageOrInteraction instanceof Message) {
			await messageOrInteraction.edit(this.schema.content);
		} else {
			if (messageOrInteraction.replied || messageOrInteraction.deferred) {
				await messageOrInteraction.editReply(this.schema.content);
			} else {
				await messageOrInteraction.reply(this.schema.content);
			}
		}

		var customCommand = messageOrInteraction.guild!.customCommandSystem.customCommands.get(this.schema.id as unknown as [commandId: string]);

		if (customCommand) {
			if (!customCommand.useCount) {
				customCommand.useCount = 0;
			}

			customCommand.useCount += 1;

			await messageOrInteraction.guild!.customCommandSystem.edit(customCommand);
		}
	}
}

export namespace PuppyBotCustomCommand {
	export type Options = PuppyBotCommand.Options & {
		schema: CustomCommand
	}
}