/**
 * @file Congratulations.ts
 * @description `/omedetou` command — posts a random congratulations reaction image.
 *
 * Extends {@link RandomMediaCommand}; picks a random file from
 * `src/assets/media/congratulations/` or the user-selected type.
 *
 * Available types span a range of anime/media sources: Bedman, Buu, Dio, Flonne,
 * Evangelion, Genius (Klim Nick), Godzilla, Sailors, Sengoku, Taiga.
 *
 * Aliases: `congratulations`, `congrats`.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { RandomMediaCommand } from '../../lib/structures/command/RandomMediaCommand';

const SHORT_DESCRIPTION = 'Congratulations!';

@ApplyOptions<RandomMediaCommand.Options>({
    name: 'omedetou',
    aliases: ['congratulations', 'congrats'],
    description: SHORT_DESCRIPTION,
    folder: 'congratulations',
    typeDescriptions: {
        bedman: "Bedman (Guilty Gear Xrd)",
        buu: "Buu (Dragon Ball Z)",
        dio: "Dio (Jojo's Bizarre Adventure)",
        flonne: "Flonne (Disgaea)",
        evangelion: "Evangelion",
        genius: "Klim Nick (Gundam Reconguista in G)",
        godzilla: "Godzilla",
        sailors: "Chibi Moon & Jupiter (Sailor Moon)",
        sengoku: "Nadeko Sengoku (Monogatari)",
        taiga: "Taiga Aisaka (Toradora!)"
    },
})
export class CongratulationsCommand extends RandomMediaCommand {
}