import { describe, it, expect, beforeEach } from '@jest/globals';

import {
  createPluginManager,
  registerPlugin,
  getRegisteredPlugins,
  __resetRegisteredPlugins
} from '../../scripts/modules/plugins/pluginManager.js';

describe('pluginManager', () => {
  beforeEach(() => {
    __resetRegisteredPlugins();
  });

  it('registers plugins globally and exposes them to new managers', () => {
    registerPlugin({ name: 'alpha' });
    registerPlugin({ name: 'beta' });

    const manager = createPluginManager();
    expect(manager.getRegisteredPlugins().map(plugin => plugin.name)).toEqual(['alpha', 'beta']);
  });

  it('emits hooks to registered listeners', () => {
    const manager = createPluginManager();
    const calls = [];
    manager.on('custom:hook', payload => calls.push(payload));

    manager.emit('custom:hook', { value: 1 });
    manager.emit('custom:hook', { value: 2 });

    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual({ value: 1 });
    expect(calls[1]).toEqual({ value: 2 });
  });

  it('activates plugin hooks declared in the plugin definition', () => {
    registerPlugin({
      name: 'listener-plugin',
      hooks: {
        'editor:afterInit': payload => {
          expect(payload.flag).toBe(true);
        }
      }
    });

    const manager = createPluginManager({ availableHooks: ['editor:afterInit'] });
    manager.initialize({ flag: true });
  });
});
