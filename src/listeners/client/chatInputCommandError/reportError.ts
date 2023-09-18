import { ApplyOptions } from '@sapphire/decorators';
import { type ChatInputCommandErrorPayload, Events, Listener, UserError } from '@sapphire/framework';
import { UserErrorEmbed } from '../../../lib/structures/message/error/UserErrorEmbed';

@ApplyOptions<Listener.Options>({
	name: 'ChatInputCommandError',
	event: Events.ChatInputCommandError
})
export class UserListener extends Listener<typeof Events.ChatInputCommandError> {
	public async run(error: Error, { interaction }: ChatInputCommandErrorPayload) {
		if(error instanceof UserError) {
			if (Reflect.get(Object(error.context), 'silent')) return;

			const embed = new UserErrorEmbed({
				error: error
			});
	
			if (interaction.replied || interaction.deferred) {
				await interaction.editReply({
					embeds: [embed]
				});
				return;
			}
	
			await interaction.reply({
				embeds: [embed]
			});
		}
	}
}