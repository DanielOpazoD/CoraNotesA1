export function createNoteManager({
  registry,
  noteTypes,
  scheduleTopicNoteIndicatorRefresh,
  requestAnimationFrame: requestAnimationFrameFn,
  pluginManager = null
}) {
  if (!registry) {
    throw new Error('Note manager requires a registry instance');
  }

  if (!noteTypes || !noteTypes.FLOATING || !noteTypes.SUPER) {
    throw new Error('Note manager requires floating and super note type definitions');
  }

  const scheduleTopicIndicator = typeof scheduleTopicNoteIndicatorRefresh === 'function'
    ? scheduleTopicNoteIndicatorRefresh
    : () => {};

  const raf = typeof requestAnimationFrameFn === 'function'
    ? requestAnimationFrameFn
    : callback => setTimeout(callback, 16);

  const emitPluginEvent = (hook, payload) => {
    if (!pluginManager || typeof pluginManager.emit !== 'function') {
      return;
    }
    pluginManager.emit(hook, { ...payload, manager: pluginManager });
  };

  let notesViewController = null;
  let pendingNotesViewUpdate = false;

  function ensureNoteData(noteId, overrides = {}) {
    const normalizedId = typeof noteId === 'string' ? noteId.trim() : '';
    const existed = normalizedId ? registry.has(normalizedId) : false;
    const note = registry.ensure(noteId, overrides);

    if (existed) {
      emitPluginEvent('notes:updated', {
        noteId: note.id,
        note,
        updates: overrides,
        source: 'ensure'
      });
    } else {
      emitPluginEvent('notes:created', {
        noteId: note.id,
        note,
        overrides
      });
    }

    return note;
  }

  function updateNoteData(noteId, updates = {}, { silent = false } = {}) {
    const note = registry.update(noteId, updates, { silent });
    if (note) {
      emitPluginEvent('notes:updated', {
        noteId,
        note,
        updates,
        options: { silent }
      });
    }
    return note;
  }

  function removeNoteData(noteId) {
    if (!noteId) return;
    const existing = registry.get(noteId);
    const removed = registry.remove(noteId);
    if (removed) {
      emitPluginEvent('notes:removed', {
        noteId,
        note: existing || null
      });
    }
  }

  function isFloatingFamilyNote(note) {
    if (!note) return false;
    const type = note?.type || noteTypes.FLOATING;
    return type === noteTypes.FLOATING || type === noteTypes.SUPER;
  }

  function scheduleNotesViewRefresh() {
    scheduleTopicIndicator();
    if (!notesViewController) return;
    if (pendingNotesViewUpdate) return;
    pendingNotesViewUpdate = true;
    raf(() => {
      pendingNotesViewUpdate = false;
      notesViewController.notifyNotesUpdated();
    });
  }

  registry.setChangeListener(() => {
    scheduleNotesViewRefresh();
  });

  function setNotesViewController(controller) {
    notesViewController = controller || null;
  }

  function getNotesViewController() {
    return notesViewController;
  }

  return {
    ensureNoteData,
    updateNoteData,
    removeNoteData,
    isFloatingFamilyNote,
    scheduleNotesViewRefresh,
    setNotesViewController,
    getNotesViewController
  };
}
