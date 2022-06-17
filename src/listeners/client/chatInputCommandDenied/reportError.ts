import { ApplyOptions } from "@sapphire/decorators";
import {
	ChatInputCommandDeniedPayload,
	Events,
	Listener,
	UserError,
} from "@sapphire/framework";
import type { Message } from "discord.js";
import { UserErrorEmbed } from "../../../lib/structures/message/error/UserErrorEmbed";

@ApplyOptions<Listener.Options>({
	event: Events.ChatInputCommandDenied,
})
export class ChatInputCommandDeniedReportError extends Listener<typeof Events.ChatInputCommandDenied> {
	public async run(error: Error, { interaction }: ChatInputCommandDeniedPayload): Promise<Message<boolean> | void> {
		if(error instanceof UserError) {
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
	}}