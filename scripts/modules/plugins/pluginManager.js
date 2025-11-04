const globalPlugins = new Map();

function ensurePluginName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Plugin must include a non-empty name');
  }
  return name.trim();
}

function normalizePlugin(plugin) {
  if (plugin && plugin.__normalizedPlugin) {
    return plugin;
  }

  if (!plugin || typeof plugin !== 'object') {
    throw new TypeError('Plugin definition must be an object');
  }

  const name = ensurePluginName(plugin.name);
  const normalized = {
    name,
    version: typeof plugin.version === 'string' ? plugin.version : '0.0.0',
    setup: typeof plugin.setup === 'function' ? plugin.setup.bind(plugin) : null,
    initialize: typeof plugin.initialize === 'function' ? plugin.initialize.bind(plugin) : null,
    hooks: plugin.hooks && typeof plugin.hooks === 'object' ? { ...plugin.hooks } : {}
  };

  Object.defineProperty(normalized, '__normalizedPlugin', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true
  });

  return normalized;
}

function safeInvoke(callback, { pluginName, hookName }) {
  try {
    return callback();
  } catch (error) {
    console.error(`Plugin '${pluginName}' failed while running '${hookName}':`, error);
    return undefined;
  }
}

function addGlobalPlugin(pluginDefinition) {
  const plugin = normalizePlugin(pluginDefinition);
  globalPlugins.set(plugin.name, plugin);
  return plugin;
}

export function registerPlugin(pluginDefinition) {
  return addGlobalPlugin(pluginDefinition);
}

export function getRegisteredPlugins() {
  return Array.from(globalPlugins.values());
}

export function __resetRegisteredPlugins() {
  globalPlugins.clear();
}

export function createPluginManager({ availableHooks = [], plugins = [] } = {}) {
  const listeners = new Map();
  const activePlugins = new Map();

  function ensureHook(hook) {
    if (!listeners.has(hook)) {
      listeners.set(hook, new Set());
    }
  }

  availableHooks.forEach(ensureHook);

  function registerListener(hook, handler, pluginName = 'anonymous') {
    if (typeof handler !== 'function') {
      return () => {};
    }

    ensureHook(hook);
    const wrapped = payload =>
      safeInvoke(() => handler(payload), { pluginName, hookName: hook });
    listeners.get(hook).add(wrapped);

    return () => {
      listeners.get(hook).delete(wrapped);
    };
  }

  function emit(hook, payload) {
    if (!listeners.has(hook)) {
      return;
    }
    listeners.get(hook).forEach(handler => handler(payload));
  }

  function activatePlugin(plugin) {
    if (!plugin || activePlugins.has(plugin.name)) {
      return;
    }

    activePlugins.set(plugin.name, plugin);

    const hookEntries = Object.entries(plugin.hooks || {});
    hookEntries.forEach(([hookName, handler]) => {
      registerListener(hookName, handler, plugin.name);
    });
  }

  const manager = {
    on: registerListener,
    off(hook, handler) {
      if (!listeners.has(hook)) {
        return;
      }
      listeners.get(hook).delete(handler);
    },
    emit,
    registerPlugin(pluginDefinition) {
      const plugin = addGlobalPlugin(pluginDefinition);
      activatePlugin(plugin);
      return manager;
    },
    use(pluginDefinition) {
      const plugin = normalizePlugin(pluginDefinition);
      activatePlugin(plugin);
      return manager;
    },
    getRegisteredPlugins() {
      return Array.from(activePlugins.values());
    },
    initialize(context = {}) {
      const payload = { ...context, manager };
      emit('editor:beforeInit', payload);

      activePlugins.forEach(plugin => {
        if (plugin.setup) {
          safeInvoke(() => plugin.setup(payload), { pluginName: plugin.name, hookName: 'setup' });
        }
      });

      activePlugins.forEach(plugin => {
        if (plugin.initialize) {
          safeInvoke(() => plugin.initialize(payload), {
            pluginName: plugin.name,
            hookName: 'initialize'
          });
        }
      });

      emit('editor:afterInit', payload);
    }
  };

  const initialPlugins = [...getRegisteredPlugins(), ...plugins];
  const seenNames = new Set();
  initialPlugins.forEach(pluginDefinition => {
    const plugin = normalizePlugin(pluginDefinition);
    if (seenNames.has(plugin.name)) {
      return;
    }
    seenNames.add(plugin.name);
    activatePlugin(plugin);
  });

  return manager;
}
