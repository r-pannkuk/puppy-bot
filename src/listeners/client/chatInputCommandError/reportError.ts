import { ApplyOptions } from '@sapphire/decorators';
import { type ChatInputCommandErrorPayload, Events, Listener, UserError } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { UserErrorEmbed } from '../../../lib/structures/message/error/UserErrorEmbed';

@ApplyOptions<Listener.Options>({
	name: 'ChatInputCommandError',
	event: Events.ChatInputCommandError
})
export class UserListener extends Listener<typeof Events.ChatInputCommandError> {
	public async run(error: Error, { interaction }: ChatInputCommandErrorPayload): Promise<Message<boolean> | void> {
		if(error instanceof UserError) {
			if (Reflect.get(Object(error.context), 'silent')) return;

			const embed = new UserErrorEmbed({
				error: error
			});
	
			if (interaction.replied || interaction.deferred) {
				return interaction.editReply({
					embeds: [embed]
				}) as Promise<Message<boolean>>;
			}
	
			return interaction.reply({
				embeds: [embed]
			});
		}
	}
}