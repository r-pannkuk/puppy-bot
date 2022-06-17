import { envParseString } from "../env/utils";

export const enum Emojis {
	ArrowDown = '⬇',
	ArrowDownLeft = '↙',
	ArrowDownRight = '↘',
	ArrowLeft = '⬅',
	ArrowRight = '➡',
	ArrowUp = '⬆',
	ArrowUpLeft = '↖',
	ArrowUpRight = '↗',
	Asterisk = '*️⃣',
	CrossMark = '✖',
	CrossMarkRed = '❌',
	GreenTick = '✅',
	Loading = '⌛',
	Memo = '📝',
	MinusSign = '➖',
	NoSign = '🚫',
	Paperclips = '🖇️',
	Pause = '⏸',
	Pencil = '✏️',
	PlusSign = '➕',
	RepeatOnce = '🔂',
	RepeatInfinite = '🔁',
	Resume = '▶️',
	Rename = '🪧',
	Skip = '⏩',
	StopSign = '🛑',
	Timer = '⏲️',
}

export const ZERO_WIDTH_SPACE = '\u200B';
export const LONG_WIDTH_SPACE = '\u3000';
export const WHITE_CIRCLE = '◦'

export const enum ContextMenuCommandType {
	CHAT_INPUT = 1,
	USER = 2,
	MESSAGE = 3
}

export const SELECT_MENU_OPTION_LIMIT = 25;
export const CHAT_INPUT_OPTION_CHOICE_LIMIT = 25;
export const DEFAULT_TIMEZONE = (() => {
	const defaultTimezone = envParseString('DEFAULT_TIMEZONE');

	switch (defaultTimezone) {
		case ('pacific'):
			return (new Date().isDstObserved()) ? 'PDT' : 'PST';
		case ('utc'):
			return 'UTC';
		case ('eastern'):
		default:
			return (new Date().isDstObserved()) ? 'EDT' : 'EST';
	}
})()