import { initializeEditor } from './editor.js';

document.addEventListener('DOMContentLoaded', () => {
  const preloadPlugins = (typeof window !== 'undefined'
    && window.coraNotes
    && Array.isArray(window.coraNotes.preloadPlugins))
    ? window.coraNotes.preloadPlugins
    : [];

  initializeEditor({ plugins: preloadPlugins }).catch(error => {
    console.error('No se pudo inicializar el editor:', error);
  });
});
