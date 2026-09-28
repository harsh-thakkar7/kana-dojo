import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NAMESPACES } from '../namespaces';

const LOCALES_DIR = join(process.cwd(), 'core/i18n/locales');

// Must stay in sync with routing.locales (core/i18n/routing.ts).
// next-intl/navigation pulls in `next/navigation`, which is not available in
// the test environment, so the canonical list is duplicated here.
const SUPPORTED_LOCALES = ['en', 'es'] as const;

describe('i18n locale structure', () => {
  it('forbids orphaned flat files at the root of locales/', () => {
    // Regression guard for orphaned flat locale files (e.g. en.json /
    // es.json / zh.json that were never loaded at runtime, #28964).
    const strayFiles = readdirSync(LOCALES_DIR).filter(
      entry => !statSync(join(LOCALES_DIR, entry)).isDirectory(),
    );

    expect(strayFiles).toEqual([]);
  });

  it('provides every namespace file as valid JSON for each supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const localeDir = join(LOCALES_DIR, locale);
      expect(existsSync(localeDir), `missing locale directory ${locale}`).toBe(
        true,
      );

      const presentFiles = readdirSync(localeDir);
      for (const namespace of NAMESPACES) {
        const fileName = `${namespace}.json`;
        expect(presentFiles, `${locale} is missing ${fileName}`).toContain(
          fileName,
        );

        // request.ts imports these at runtime and merges them into messages;
        // a corrupted file silently breaks the namespace's translations.
        expect(
          () => JSON.parse(readFileSync(join(localeDir, fileName), 'utf8')),
          `${locale}/${fileName} is not valid JSON`,
        ).not.toThrow();
      }
    }
  });
});
