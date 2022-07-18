import { Events, Listener, ListenerErrorPayload } from '@sapphire/framework';
import { debugLog } from '../../lib/utils/logging';

export class UserListener extends Listener<typeof Events.ListenerError> {
	public run(error: Error, context: ListenerErrorPayload) {
		debugLog('fatal', `[EVENT] ${context.piece.name}\n${error.stack || error.message}`);
	}
}