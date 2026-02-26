import { ApplyOptions } from '@sapphire/decorators';
import { type ChatInputCommandErrorPayload, Events, Listener, UserError } from '@sapphire/framework';
import { UserErrorEmbed } from '../../../lib/structures/message/error/UserErrorEmbed';

@ApplyOptions<Listener.Options>({
	name: 'ChatInputCommandError',
	event: Events.ChatInputCommandError
})
export class UserListener extends Listener<typeof Events.ChatInputCommandError> {
	public async run(error: Error, { interaction }: ChatInputCommandErrorPayload) {
		if (error instanceof UserError) {
			if (Reflect.get(Object(error.context), 'silent')) return;

			const embed = new UserErrorEmbed({ error });

			if (interaction.replied || interaction.deferred) {
				await interaction.editReply({ embeds: [embed] });
				return;
			}

			await interaction.reply({ embeds: [embed] });
		} else {
			// Unexpected (non-UserError) exceptions — log and send a generic reply
			// so Discord receives a response instead of timing out silently.
			this.container.logger.error(error);

			const content = 'An unexpected error occurred. Please try again.';
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.editReply({ content });
				} else {
					await interaction.reply({ content, ephemeral: true });
				}
			} catch {
				// Interaction may have already expired — nothing more we can do.
			}
		}
	}
}