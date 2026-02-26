/**
 * @file index.ts
 * @description Bot entry point.
 *
 * Initializes Sentry (if configured), creates the PuppyBotClient, and begins
 * the Discord login flow. All further initialization (guild data loading,
 * reminder scheduling, subsystem startup) is handled through Sapphire's
 * event listener system in src/listeners/client/ready/.
 */
import 'dotenv/config';
// setup.ts must be imported before PuppyBotClient to register Sapphire plugins
import './lib/setup';
import { PuppyBotClient } from './lib/structures/client/PuppyBotClient';
import * as Sentry from '@sentry/node';

// Initialize Sentry error tracking when a DSN is provided.
if (process.env.SENTRY_URL) {
    Sentry.init({
        dsn: process.env.SENTRY_URL,
        integrations: [
            Sentry.modulesIntegration(),
            Sentry.consoleIntegration(),
            Sentry.linkedErrorsIntegration(),
        ],
        tracesSampleRate: 0.1,
    });
}

const client = new PuppyBotClient();

// Begin the login process. On fatal failure, log the error and exit cleanly
// so that process managers (e.g., Heroku, PM2) can restart the bot.
client.login(process.env.TOKEN).catch((error) => {
    client.logger.fatal(error);
    client.destroy();
    process.exit(1);
});

