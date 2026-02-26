import { ApplyOptions } from '@sapphire/decorators';
import { Listener, UserError, MessageCommandErrorPayload, Events } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { UserErrorEmbed } from '../../../lib/structures/message/error/UserErrorEmbed';

@ApplyOptions<Listener.Options>({
	name: 'MessageCommandError',
	event: Events.MessageCommandError
})
export class UserListener extends Listener<typeof Events.MessageCommandError> {
	public async run(error: Error, { message }: MessageCommandErrorPayload): Promise<Message<boolean> | void> {
		if (error instanceof UserError) {
			if (Reflect.get(Object(error.context), 'silent')) return;

			const embed = new UserErrorEmbed({ error });
			return message.reply({ embeds: [embed] });
		} else {
			// Unexpected (non-UserError) exceptions — log and reply so the user
			// gets feedback instead of silence.
			this.container.logger.error(error);
			try {
				return await message.reply('An unexpected error occurred. Please try again.');
			} catch {
				// Message may have been deleted — nothing more we can do.
			}
		}
	}
}