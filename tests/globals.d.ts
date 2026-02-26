/**
 * Global type augmentations for the test suite.
 *
 * Triple-slash references pull in the project's central augment declarations
 * (Container.database, Guild.settings, etc.) so that all test files see the
 * same extended types without having to import each manager file explicitly.
 */

/// <reference path="../src/lib/types/augments.d.ts" />
/// <reference path="../src/lib/env/types.d.ts" />
