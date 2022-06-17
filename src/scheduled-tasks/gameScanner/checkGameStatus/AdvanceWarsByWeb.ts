import { ApplyOptions } from '@sapphire/decorators';
import type { PieceContext } from '@sapphire/framework';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { AdvanceWarsByWeb, AWBWScanner } from '../../../lib/structures/managers/games/AWBWScanner';

@ApplyOptions<ScheduledTask.Options>({
	name: AdvanceWarsByWeb.ScheduledTask.CheckGameStatus,

})
export class CheckGameStatus_AdvanceWarsByWeb extends ScheduledTask {
	public constructor(context: PieceContext, options: ScheduledTask.Options) {
		super(context, options);
	}

	public async run(_payload: AdvanceWarsByWeb.ScheduledTaskPayload) {
		await AWBWScanner.checkActiveGames();
	}
}

declare module '@sapphire/framework' {
	interface ScheduledTasks {
		CheckGameStatus_AWBW: never;
	}
}