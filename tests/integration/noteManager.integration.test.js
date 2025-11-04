import { describe, it, expect, beforeEach } from '@jest/globals';

import { createNoteManager } from '../../scripts/modules/editor/noteManager.js';
import { NoteRegistry } from '../../scripts/modules/notes/NoteRegistry.js';
import { NOTE_TYPES } from '../../scripts/modules/notes/noteConstants.js';
import {
  createPluginManager,
  registerPlugin,
  __resetRegisteredPlugins
} from '../../scripts/modules/plugins/pluginManager.js';

describe('note manager integration with plugins', () => {
  beforeEach(() => {
    __resetRegisteredPlugins();
  });

  it('emite eventos cuando se crean, actualizan y eliminan notas', () => {
    const events = [];
    registerPlugin({
      name: 'collector',
      hooks: {
        'notes:created': payload => events.push({ hook: 'created', payload }),
        'notes:updated': payload => events.push({ hook: 'updated', payload }),
        'notes:removed': payload => events.push({ hook: 'removed', payload })
      }
    });

    const pluginManager = createPluginManager({
      availableHooks: ['notes:created', 'notes:updated', 'notes:removed']
    });

    const registry = new NoteRegistry();
    const noteManager = createNoteManager({
      registry,
      noteTypes: NOTE_TYPES,
      pluginManager
    });

    const note = noteManager.ensureNoteData(null, { title: 'Nota' });
    noteManager.updateNoteData(note.id, { title: 'Nota actualizada' });
    noteManager.removeNoteData(note.id);

    expect(events.map(event => event.hook)).toEqual(['created', 'updated', 'removed']);
    expect(events[0].payload.note.title).toBe('Nota');
    expect(events[1].payload.updates).toEqual({ title: 'Nota actualizada' });
    expect(events[2].payload.noteId).toBe(note.id);
  });
});
