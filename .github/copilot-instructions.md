<!-- Copilot instructions for working on Puppy Bot -->
# Puppy Bot — Copilot Instructions

This file gives concise, actionable guidance for an AI coding agent to be productive in this repository.

- **Big picture**: This is a TypeScript Discord bot built on the Sapphire framework. The runtime entrypoint is `src/index.ts`, which imports `src/lib/setup.ts` to register Sapphire plugins and then constructs `PuppyBotClient` (in `src/lib/structures/client/`). Build output is placed in `dist/` and `package.json` `main` points at `./dist/index.js`.

- **Key components**:
  - `src/lib/setup.ts`: registers Sapphire plugins and exports `CLIENT_OPTIONS` — must be imported before constructing the client.
  - `src/index.ts`: application bootstrap (Sentry init, client login).
  - `src/commands/` and `src/listeners/`: command and event handler locations (Sapphire conventions).
  - `src/scheduled-tasks/`: background jobs; uses `bull` and Redis connection configured via environment variables in `CLIENT_OPTIONS.tasks.bull`.
  - `prisma/schema.prisma`: database schema (Prisma Client used in runtime).
  - `lavalink/`: self-hosted Lavalink config and helper scripts; `package.json` provides a `lavalink` script that runs the jar with `lavalink/application.yml`.

- **Build / run / test workflows (concrete commands)**:
  - Build: `npm run build` (runs `tsc -b src`, output -> `dist/`).
  - Start (production): `npm start` (runs `node --enable-source-maps dist/index.js`).
  - Dev mode: `npm run dev` (build + start via `run-s`).
  - Start Lavalink locally: `npm run lavalink` (requires Java and `lavalink/Lavalink.jar`). There is also a VS Code task `lavalink` defined for convenience.
  - JS tests (Vitest): `npm run test:js` or `npm run test:unit` / `npm run test:integration`.
  - Python tests (project includes Python scripts): `npm run test:python` uses the repository `.venv` to run pytest on `tests/python/`.
  - Full test suite: `npm test` (runs Python + JS tests).

- **Project-specific conventions & gotchas**:
  - `src/lib/setup.ts` must be imported before creating the client — it registers framework plugins (logger, editable-commands, API, scheduled-tasks). Look at the top of `src/index.ts` for the pattern.
  - Commands/listeners follow Sapphire file-based loading. New commands go into `src/commands/` and use Sapphire decorators/exports.
  - The project expects environment configuration (dotenv). Sensitive config (token, Sentry DSN, Redis) comes from environment variables; `SENTRY_URL` toggles Sentry init in `src/index.ts`.
  - Task scheduler uses Bull + Redis — connection options are declared in `CLIENT_OPTIONS.tasks.bull` and will reject fast if Redis is unreachable (see `connectTimeout` / `retryStrategy`).
  - TypeScript build uses project references (`tsc -b src`) — incremental builds may be faster using `npm run watch`.
  - Deploy script force-adds `dist/` into a commit for subtree deployment — avoid changing `dist/` manually except through `npm run build`.

- **Integration points & external dependencies**:
  - Discord API via `discord.js` and `@sapphire/framework`.
  - Prisma for DB access (`prisma` CLI + `@prisma/client`).
  - Redis for task queues (`bull` + `@redis/client`).
  - Lavalink (music) — see `lavalink/` and `shoukaku` usage in `src/commands/music`.
  - Python helper scripts in `scripts/` and `tests/python/`; `.venv` is used by `npm run test:python` (see `requirements.txt`).

- **Where to look for examples when generating code**:
  - Command patterns: `src/commands/*` (see `PingCommand.ts` and `custom/CustomCommand.ts`).
  - Listener startup flow: `src/listeners/client/ready/` (loads guild data and scheduled tasks).
  - Scheduled tasks and job definitions: `src/scheduled-tasks/`.
  - Error handling / logging: plugin registration and Sentry + Sapphire logger are used project-wide — consult `src/index.ts` and `src/lib/setup.ts`.

- **If you need to run tests locally**:
  - Ensure the Python virtualenv is available at `.venv` and Java is installed for Lavalink if you run music-related integration tests.
  - Run `npm test` for the full pipeline, or run `npm run test:js` / `npm run test:python` selectively.

- **Safety rules for code changes**:
  - Do not change plugin registration ordering: keep `src/lib/setup.ts` load semantics intact.
  - Prefer adding new commands/listeners as independent files under `src/` rather than editing global bootstrapping.
  - Keep `CLIENT_OPTIONS.baseUserDirectory` usage in mind when referencing runtime `__dirname` paths; compiled layout places `dist/` as the base for runtime relative paths.

If any section is unclear or you'd like me to include more examples (e.g., a sample command template or a small contributor quickstart), tell me which area to expand. 
