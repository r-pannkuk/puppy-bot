import { ApplyOptions } from "@sapphire/decorators";
import {
	ChatInputCommandDeniedPayload,
	Events,
	Listener,
	UserError,
} from "@sapphire/framework";
import { UserErrorEmbed } from "../../../lib/structures/message/error/UserErrorEmbed";

@ApplyOptions<Listener.Options>({
	event: Events.ChatInputCommandDenied,
})
export class ChatInputCommandDeniedReportError extends Listener<typeof Events.ChatInputCommandDenied> {
	public async run(error: Error, { interaction }: ChatInputCommandDeniedPayload) {
		if(error instanceof UserError) {
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
	}}