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

/**
 * Returns the bot's configured timezone abbreviation, evaluated at call time
 * using the current DST status rather than at module-load time.
 *
 * This prevents the bug where a bot started in summer would use PDT/EDT for
 * reminders created in winter (and vice-versa).
 *
 * Controlled by the `DEFAULT_TIMEZONE` environment variable:
 * - `'eastern'` → `'EST'` / `'EDT'` (default)
 * - `'pacific'` → `'PST'` / `'PDT'`
 * - `'utc'`     → `'UTC'`
 */
export function getDefaultTimezone(): string {
	const tz = envParseString('DEFAULT_TIMEZONE', 'eastern');
	// Compute DST inline so this function doesn't depend on the Date.prototype
	// extension from time.ts (which may not be imported yet at module load time).
	const now = new Date();
	const jan = new Date(now.getFullYear(), 0, 1);
	const jul = new Date(now.getFullYear(), 6, 1);
	const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
	const isDst = now.getTimezoneOffset() < stdOffset;
	switch (tz) {
		case 'pacific':
			return isDst ? 'PDT' : 'PST';
		case 'utc':
			return 'UTC';
		case 'eastern':
		default:
			return isDst ? 'EDT' : 'EST';
	}
}

/**
 * @deprecated Use {@link getDefaultTimezone}() to evaluate the timezone at
 * call time rather than relying on this module-initialization snapshot, which
 * will be incorrect if the bot started in a different DST period.
 */
export const DEFAULT_TIMEZONE = getDefaultTimezone();
