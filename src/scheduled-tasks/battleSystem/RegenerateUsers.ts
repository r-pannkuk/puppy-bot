import { ApplyOptions } from "@sapphire/decorators";
import { container } from "@sapphire/framework";
import { ScheduledTask, ScheduledTaskOptions } from "@sapphire/plugin-scheduled-tasks";
import { debugLog } from "../../lib/utils/logging";

@ApplyOptions<ScheduledTaskOptions>({
	name: 'BattleSystem_RegenerateUsers'
})
export class RegenerateUsersTask extends ScheduledTask {
	public override async run({ guildId }) {
		const guild = container.client.guilds.cache.get(guildId)!;
		if(!guild) {
			debugLog('error', `No guild found for guild ID: ${guildId}`);
			return;
		}

		var writeRequired = false;

		guild.battleSystem.battleUsers.forEach((battleUser, id) => {
			const levelConfig = battleUser.level();

			if (battleUser.stats.health < levelConfig.maxHealth) {
				battleUser.stats.health += levelConfig.baseHealthRegen;
				writeRequired = true;
			}

			if (battleUser.stats.energy < levelConfig.maxEnergy) {
				battleUser.stats.energy += levelConfig.baseEnergyRegen;
				writeRequired = true;
			}

			guild.battleSystem.battleUsers.set(id, battleUser);
		})

		if(writeRequired) {
			await guild.battleSystem.writeToDB(undefined, [], [])
		}
	}
}