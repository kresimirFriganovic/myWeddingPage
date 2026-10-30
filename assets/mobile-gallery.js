/* Phone category tabs and smaller photo batches; restore the saved desktop gallery on resize. */
(function () {
  'use strict';
  var media = window.matchMedia('(max-width: 767px)');
  var root, tabList, tabs, panels, photos, more, stage, posterTemplate, state = null;
  var selected = 'wedding-photos';
  var shown = 8;
  var step = 8;

  function saveAttributes(node, names) {
    return names.map(function (name) { return [name, node.getAttribute(name)]; });
  }

  function restoreAttributes(node, attributes) {
    attributes.forEach(function (entry) {
      if (entry[1] === null) node.removeAttribute(entry[0]);
      else node.setAttribute(entry[0], entry[1]);
    });
  }

  function idFromHash(hash) {
    var id = (hash || '').replace(/^#/, '');
    return panels.some(function (panel) { return panel.id === id; }) ? id : null;
  }

  function applyPhotos() {
    photos.forEach(function (photo, index) { photo.classList.toggle('tk-gallery-hidden', index >= shown); });
    if (more) more.style.display = shown >= photos.length ? 'none' : '';
  }

  function stopHiddenFilm() {
    if (!stage || !posterTemplate || !stage.querySelector('iframe')) return;
    var poster = posterTemplate.cloneNode(true);
    var card = [].slice.call(root.querySelectorAll('.yt-card')).find(function (item) {
      return item.getAttribute('data-yt') === stage.getAttribute('data-yt');
    });
    if (card) {
      var thumbnail = card.querySelector('img');
      var title = card.querySelector('.yt-title');
      if (thumbnail) poster.querySelector('img').src = thumbnail.src;
      if (title) poster.querySelector('.yt-feature-title').textContent = title.textContent;
      if (card.hasAttribute('aria-label')) poster.setAttribute('aria-label', card.getAttribute('aria-label'));
    }
    // Removing the iframe stops audio when its category is no longer visible.
    stage.replaceChildren(poster);
  }

  function select(id, changeHistory) {
    if (!state) return;
    selected = id;
    if (id !== 'wedding-films') stopHiddenFilm();
    panels.forEach(function (panel) { panel.hidden = panel.id !== id; });
    tabs.forEach(function (tab) {
      var active = tab.hash === '#' + id;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.setAttribute('tabindex', active ? '0' : '-1');
    });
    if (changeHistory && location.hash !== '#' + id) {
      history.pushState(null, '', '#' + id);
    }
  }

  function onTabClick(event) {
    if (!state || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var tab = event.target.closest('.gal-tabs a');
    if (!tab || tabs.indexOf(tab) === -1) return;
    var id = idFromHash(tab.hash);
    if (!id) return;
    event.preventDefault();
    select(id, true);
  }

  function onTabKey(event) {
    if (!state || tabs.indexOf(event.target) === -1) return;
    var current = tabs.indexOf(event.target), next;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    select(idFromHash(tabs[next].hash), true);
    tabs[next].focus({ preventScroll: true });
  }

  function onMore(event) {
    if (!state) return;
    // The desktop handler remains installed, but mobile batches have their own size.
    event.preventDefault();
    event.stopImmediatePropagation();
    shown = Math.min(photos.length, shown + step);
    applyPhotos();
  }

  function onHistory() {
    if (!state) return;
    select(idFromHash(location.hash) || 'wedding-photos', false);
    tabList.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  function mount() {
    if (state) return;
    state = {
      tabs: tabs.map(function (tab) { return saveAttributes(tab, ['id', 'role', 'aria-controls', 'aria-selected', 'tabindex', 'class']); }),
      panels: panels.map(function (panel) { return saveAttributes(panel, ['role', 'aria-labelledby', 'hidden', 'data-mobile-gallery-panel']); }),
      tabList: saveAttributes(tabList, ['role']),
      moreDisplay: more ? [more.style.getPropertyValue('display'), more.style.getPropertyPriority('display')] : null
    };
    root.classList.add('tk-mobile-gallery');
    tabList.setAttribute('role', 'tablist');
    tabs.forEach(function (tab, index) {
      tab.id = 'tk-gallery-tab-' + index;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', tab.hash.slice(1));
      var panel = panels.find(function (item) { return '#' + item.id === tab.hash; });
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.setAttribute('data-mobile-gallery-panel', '');
    });
    tabList.addEventListener('click', onTabClick);
    tabList.addEventListener('keydown', onTabKey);
    if (more) more.addEventListener('click', onMore, true);
    window.addEventListener('hashchange', onHistory);
    window.addEventListener('popstate', onHistory);
    applyPhotos();
    select(idFromHash(location.hash) || selected, false);
    if (idFromHash(location.hash)) {
      requestAnimationFrame(function () {
        if (state) tabList.scrollIntoView({ block: 'start', behavior: 'auto' });
      });
    }
  }

  function unmount() {
    if (!state) return;
    tabList.removeEventListener('click', onTabClick);
    tabList.removeEventListener('keydown', onTabKey);
    if (more) more.removeEventListener('click', onMore, true);
    window.removeEventListener('hashchange', onHistory);
    window.removeEventListener('popstate', onHistory);
    root.classList.remove('tk-mobile-gallery');
    tabs.forEach(function (tab, index) { restoreAttributes(tab, state.tabs[index]); });
    panels.forEach(function (panel, index) { restoreAttributes(panel, state.panels[index]); });
    restoreAttributes(tabList, state.tabList);
    photos.forEach(function (photo) { photo.classList.remove('tk-gallery-hidden'); });
    if (more) {
      if (state.moreDisplay[0]) more.style.setProperty('display', state.moreDisplay[0], state.moreDisplay[1]);
      else more.style.removeProperty('display');
    }
    state = null;
  }

  function sync() { if (media.matches) mount(); else unmount(); }

  function init() {
    root = document.getElementById('o9y9h');
    tabList = root && root.querySelector('.gal-tabs');
    if (!tabList) return;
    panels = ['wedding-photos', 'wedding-films', 'pre-wedding'].map(function (id) { return document.getElementById(id); });
    if (panels.some(function (panel) { return !panel; })) return;
    tabs = [].slice.call(tabList.querySelectorAll('a[href]')).filter(function (tab) { return idFromHash(tab.hash); });
    if (tabs.length !== panels.length) return;
    photos = [].slice.call(root.querySelectorAll('#wedding-photos .wg-item'));
    more = root.querySelector('#wedding-photos .wg-more');
    stage = root.querySelector('.yt-stage');
    posterTemplate = stage && stage.querySelector('.yt-feature');
    if (posterTemplate) posterTemplate = posterTemplate.cloneNode(true);
    sync();
    if (media.addEventListener) media.addEventListener('change', sync);
    else media.addListener(sync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
