import { container } from '@sapphire/framework';
import 'dotenv/config';
import { PuppyBotClient } from './lib/structures/client/PuppyBotClient';
import { getRootData } from '@sapphire/pieces';
import * as Sentry from '@sentry/node'
import { RewriteFrames } from '@sentry/integrations'
import { join } from 'node:path';

// Load in Sentry for error logging
if (process.env.SENTRY_URL) {
    Sentry.init({
        dsn: process.env.SENTRY_URL,
        integrations: [
            new Sentry.Integrations.Modules(),
            new Sentry.Integrations.FunctionToString(),
            new Sentry.Integrations.LinkedErrors(),
            new Sentry.Integrations.Console(),
            new Sentry.Integrations.Http({ breadcrumbs: true, tracing: true }),
            new RewriteFrames({ root: join(getRootData().root, '..') })
        ]
    });
}

/* Bot Client Creation */
/** @type {SapphireClient} */
const client = new PuppyBotClient();

// /* Guild settings load. */
// var provider = new EnmapProvider('global');
// client.setProvider(provider).catch(console.error);

/* Login */
client.login(process.env.TOKEN);

client.on('ready', async () => {
    container.logger.info("Puppy-Bot connected.");
})
