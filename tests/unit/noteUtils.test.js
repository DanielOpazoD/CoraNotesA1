import { describe, it, expect } from '@jest/globals';

import {
  sanitizeTags,
  escapeHtml,
  normalizePriority,
  getNoteDisplayTitle,
  getNoteCategoryInfo
} from '../../scripts/modules/notes/noteUtils.js';

import {
  DEFAULT_NOTE_PRIORITY,
  NOTE_CATEGORIES,
  DEFAULT_NOTE_CATEGORY
} from '../../scripts/modules/notes/noteConstants.js';

describe('noteUtils', () => {
  describe('sanitizeTags', () => {
    it('trims and filters tag strings', () => {
      const input = ['  alpha ', 'beta', '', '  ', 'gamma'];
      expect(sanitizeTags(input)).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('ignores non-string entries and non-arrays', () => {
      expect(sanitizeTags(['one', null, 2, {}, 'three'])).toEqual(['one', 'three']);
      expect(sanitizeTags(null)).toEqual([]);
    });
  });

  describe('escapeHtml', () => {
    it('escapes the main HTML special characters', () => {
      const input = "<span class='name'>& \"quote\"</span>";
      const expected = '&lt;span class=&#39;name&#39;&gt;&amp; &quot;quote&quot;&lt;/span&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('returns empty string for non-string input', () => {
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(123)).toBe('');
    });
  });

  describe('normalizePriority', () => {
    it('normalizes valid priority values case-insensitively', () => {
      expect(normalizePriority('HIGH')).toBe('high');
      expect(normalizePriority('low')).toBe('low');
    });

    it('falls back to the default priority for unknown values', () => {
      expect(normalizePriority('urgent')).toBe(DEFAULT_NOTE_PRIORITY);
      expect(normalizePriority(null)).toBe(DEFAULT_NOTE_PRIORITY);
    });
  });

  describe('getNoteCategoryInfo', () => {
    it('returns the configuration for a known category', () => {
      const category = getNoteCategoryInfo('IMPORTANT');
      expect(category).toBe(NOTE_CATEGORIES.IMPORTANT);
    });

    it('falls back to the default category when unknown', () => {
      const category = getNoteCategoryInfo('UNKNOWN');
      expect(category).toBe(NOTE_CATEGORIES[DEFAULT_NOTE_CATEGORY]);
    });
  });

  describe('getNoteDisplayTitle', () => {
    it('returns trimmed title or fallback', () => {
      expect(getNoteDisplayTitle('  Hola  ', 'fallback')).toBe('Hola');
      expect(getNoteDisplayTitle('   ', 'fallback')).toBe('fallback');
      expect(getNoteDisplayTitle(null, 'fallback')).toBe('fallback');
    });
  });
});
