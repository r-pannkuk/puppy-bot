import { container } from "@sapphire/framework";
import { envIsDefined } from "../env/utils";

export type LoggingType = 'info' | 'debug' | 'warn' | 'error' | 'fatal'

export function debugLog(type: LoggingType, text: string) {
	switch (type) {
		case 'debug':
			if(envIsDefined('LOG_DEBUG')) container.logger.debug(text);
			break;
		case 'info':
			if(envIsDefined('LOG_INFO')) container.logger.info(text);
			break;
		case 'warn':
			if(envIsDefined('LOG_WARN')) container.logger.warn(text);
			break;
		default:
			container.logger[type](text);
	}
}