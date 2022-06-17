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

			const embed = new UserErrorEmbed({
				error
			});

			return message.reply({
				embeds: [embed]
			});
		}
	}
}