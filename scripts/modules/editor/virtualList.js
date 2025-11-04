export function createVirtualList({
  container,
  renderItem,
  estimatedItemHeight = 160,
  overscan = 4
} = {}) {
  if (!container) {
    throw new Error('Virtual list requires a container element');
  }

  if (typeof renderItem !== 'function') {
    throw new TypeError('Virtual list requires a renderItem function');
  }

  const host = container;
  host.innerHTML = '';

  const topSpacer = document.createElement('div');
  topSpacer.className = 'virtual-list-spacer';
  const itemsHost = document.createElement('div');
  itemsHost.className = 'virtual-list-items';
  const bottomSpacer = document.createElement('div');
  bottomSpacer.className = 'virtual-list-spacer';

  host.append(topSpacer, itemsHost, bottomSpacer);

  let items = [];
  let measuredHeights = [];
  let prefixHeights = [0];
  let totalHeight = 0;
  let renderScheduled = false;
  let lastRange = { start: 0, end: -1 };
  let listGap = 0;

  const computedStyles = window.getComputedStyle(itemsHost);
  const gapValue = parseFloat(computedStyles.rowGap || computedStyles.gap || '0');
  if (Number.isFinite(gapValue)) {
    listGap = gapValue;
  }

  function ensurePrefix() {
    prefixHeights = new Array(items.length + 1).fill(0);
    for (let index = 0; index < items.length; index += 1) {
      const baseHeight = measuredHeights[index] ?? estimatedItemHeight;
      const gap = index < items.length - 1 ? listGap : 0;
      prefixHeights[index + 1] = prefixHeights[index] + baseHeight + gap;
    }
    totalHeight = prefixHeights[prefixHeights.length - 1];
  }

  function getOffset(index) {
    if (index <= 0) return 0;
    if (index >= prefixHeights.length) return totalHeight;
    return prefixHeights[index];
  }

  function findIndexForOffset(offset) {
    let low = 0;
    let high = items.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const midOffset = getOffset(mid);
      const nextOffset = getOffset(mid + 1);
      if (offset >= nextOffset) {
        low = mid + 1;
      } else if (offset < midOffset) {
        high = mid;
      } else {
        return mid;
      }
    }
    return Math.max(0, Math.min(low, items.length - 1));
  }

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      renderVisibleItems();
    });
  }

  function measureItemHeight(index, element) {
    if (!element) return;
    const height = Math.ceil(element.offsetHeight || element.getBoundingClientRect().height || 0);
    if (!Number.isFinite(height) || height <= 0) {
      return;
    }
    if (measuredHeights[index] !== height) {
      measuredHeights[index] = height;
      ensurePrefix();
      scheduleRender();
    }
  }

  function renderVisibleItems() {
    if (!host.isConnected) {
      return;
    }

    if (items.length === 0) {
      itemsHost.innerHTML = '';
      topSpacer.style.height = '0px';
      bottomSpacer.style.height = '0px';
      lastRange = { start: 0, end: -1 };
      return;
    }

    const scrollTop = host.scrollTop;
    const viewportHeight = host.clientHeight || window.innerHeight || 0;
    const startIndex = Math.max(0, findIndexForOffset(scrollTop) - overscan);
    const endIndex = Math.min(items.length - 1, findIndexForOffset(scrollTop + viewportHeight) + overscan);

    if (lastRange.start === startIndex && lastRange.end === endIndex) {
      return;
    }

    lastRange = { start: startIndex, end: endIndex };

    const fragment = document.createDocumentFragment();
    for (let index = startIndex; index <= endIndex; index += 1) {
      const element = renderItem(items[index], index);
      if (!element) continue;
      fragment.appendChild(element);
      requestAnimationFrame(() => measureItemHeight(index, element));
    }

    itemsHost.innerHTML = '';
    itemsHost.appendChild(fragment);

    const startOffset = getOffset(startIndex);
    const endOffset = getOffset(endIndex + 1);
    topSpacer.style.height = `${startOffset}px`;
    const bottomHeight = Math.max(totalHeight - endOffset, 0);
    bottomSpacer.style.height = `${bottomHeight}px`;
  }

  function onScroll() {
    scheduleRender();
  }

  function onResize() {
    scheduleRender();
  }

  host.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  function setItems(nextItems = []) {
    items = Array.isArray(nextItems) ? nextItems : [];
    measuredHeights = new Array(items.length);
    ensurePrefix();
    lastRange = { start: 0, end: -1 };
    scheduleRender();
  }

  function refresh() {
    ensurePrefix();
    scheduleRender();
  }

  function destroy() {
    host.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    items = [];
    measuredHeights = [];
    prefixHeights = [0];
    totalHeight = 0;
    renderScheduled = false;
    host.innerHTML = '';
  }

  return {
    setItems,
    refresh,
    destroy
  };
}
