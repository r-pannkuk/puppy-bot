import { MessageEmbed } from "discord.js";
import { ZERO_WIDTH_SPACE } from "../../utils/constants";

const EMBED_DESCRIPTION_CHARACTER_LIMIT = 4096;
const EMBED_FIELD_CHARACTER_LIMIT = 1024;

export class PuppyBotEmbed extends MessageEmbed {
	public splitFields(options: {
		title?: string,
		content?: string | string[],
	}) {
		if (typeof options.content === 'undefined' && options.title === 'undefined') return this;

		let title: string = options.title ?? ZERO_WIDTH_SPACE;
		let content: string | string[] = options.content ?? ZERO_WIDTH_SPACE;

		if (Array.isArray(content)) content = content.join('\n');

		if (title === ZERO_WIDTH_SPACE && !this.description && content.length < EMBED_DESCRIPTION_CHARACTER_LIMIT) {
			this.description = content;
			return this;
		}

		let x: number;
		let slice: string;

		while (content.length) {
			if (content.length < EMBED_FIELD_CHARACTER_LIMIT) {
				this.fields.push({
					name: title,
					value: content,
					inline: false
				});
				return this;
			}

			slice = content.slice(0, EMBED_FIELD_CHARACTER_LIMIT);
			x = slice.lastIndexOf('\n');
			if (x === -1) x = slice.lastIndexOf(' ');
			if (x === -1) x = EMBED_FIELD_CHARACTER_LIMIT;

			this.fields.push({
				name: title,
				value: content.trim().slice(0, x),
				inline: false,
			});
			content = content.slice(x + 1);
			title = ZERO_WIDTH_SPACE;
		}

		return this;
	}
}