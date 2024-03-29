import { ApplicationCommandRegistry, ChatInputCommandContext, UserError } from '@sapphire/framework';
import type { ChatInputCommandInteraction, Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators'
import { PuppyBotCommand } from '../lib/structures/command/PuppyBotCommand';

@ApplyOptions<PuppyBotCommand.Options>({
	name: 'error',
	description: 'Simulates throwing an error for listening.',
	preconditions: ['OwnerOnly']
})
export class ErrorCommand extends PuppyBotCommand {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
			,
			this.slashCommandOptions
		)
	}

	public async messageRun(message: Message) {
		throw new UserError({
			identifier: `[Message] Testing something`,
			context: {
				message,
				context
			},
		})
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction, context: ChatInputCommandContext) {
		throw new UserError({
			identifier: `[Slash] Testing something`,
			context: {
				interaction,
				context
			},
		})
	}
}
