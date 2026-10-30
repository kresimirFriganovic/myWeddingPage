/* Mobile navigation is derived from the edited desktop header. */
(function () {
  'use strict';

  var mobile = window.matchMedia('(max-width: 767px)');
  var view = null;
  var languageMenuKey = 'wedding-mobile-language-menu';
  var languageMenuParam = 'wedding-menu';
  var language = (document.documentElement.lang || 'en').slice(0, 2);
  var labels = {
    en: { menu: 'Menu', close: 'Close menu', navigation: 'Site navigation', languages: 'Language', expand: 'Show submenu for ', top: 'Back to top' },
    hr: { menu: 'Izbornik', close: 'Zatvori izbornik', navigation: 'Navigacija', languages: 'Jezik', expand: 'Prikaži podizbornik: ', top: 'Natrag na vrh' },
    vi: { menu: 'Menu', close: 'Đóng menu', navigation: 'Điều hướng', languages: 'Ngôn ngữ', expand: 'Mở menu con: ', top: 'Lên đầu trang' }
  };
  var text = labels[language] || labels.en;

  function element(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  }

  function copyLink(source, className) {
    var link = element('a', className, source.textContent.replace(/\s+/g, ' ').trim());
    ['href', 'target', 'rel', 'title', 'lang', 'hreflang', 'data-anchor'].forEach(function (name) {
      if (source.hasAttribute(name)) link.setAttribute(name, source.getAttribute(name));
    });
    if (link.target === '_blank') link.rel = 'noopener noreferrer';
    return link;
  }

  function buildList(sourceList, path) {
    var list = element('ul', path ? 'tk-mobile-menu-sublist' : 'tk-mobile-menu-list');
    Array.prototype.forEach.call(sourceList.children, function (sourceItem, index) {
      if (sourceItem.tagName !== 'LI') return;
      var sourceLink = sourceItem.querySelector('a[href]');
      if (!sourceLink) return;
      var item = element('li', 'tk-mobile-menu-item');
      var row = element('div', 'tk-mobile-menu-row');
      var link = copyLink(sourceLink, 'tk-mobile-menu-link');
      if (sourceItem.getAttribute('data-is-current') === 'true' || sourceItem.getAttribute('aria-current') === 'true') {
        link.setAttribute('aria-current', 'page');
      }
      row.appendChild(link);
      item.appendChild(row);

      var sourceSublist = sourceItem.querySelector('ul');
      if (sourceSublist) {
        var key = (path ? path + '-' : '') + index;
        var sublist = buildList(sourceSublist, key);
        sublist.id = 'tk-mobile-submenu-' + key;
        sublist.hidden = true;
        var expander = element('button', 'tk-mobile-menu-expand');
        expander.type = 'button';
        expander.setAttribute('aria-label', text.expand + link.textContent);
        expander.setAttribute('aria-controls', sublist.id);
        expander.setAttribute('aria-expanded', 'false');
        var chevron = element('span', 'tk-mobile-menu-chevron');
        chevron.setAttribute('aria-hidden', 'true');
        expander.appendChild(chevron);
        expander.addEventListener('click', function () {
          var expanded = expander.getAttribute('aria-expanded') === 'true';
          expander.setAttribute('aria-expanded', String(!expanded));
          sublist.hidden = expanded;
        });
        row.appendChild(expander);
        item.appendChild(sublist);
      }
      list.appendChild(item);
    });
    return list;
  }

  function buildLanguages(header) {
    var sourceLinks = header.querySelectorAll('.lsd-menu a[href]');
    if (!sourceLinks.length) return null;
    var nav = element('nav', 'tk-mobile-menu-languages');
    nav.setAttribute('aria-label', text.languages);
    Array.prototype.forEach.call(sourceLinks, function (source) {
      var link = copyLink(source, 'tk-mobile-menu-language');
      link.href = languageTarget(source).href;
      var flag = source.querySelector('img');
      if (flag) link.insertBefore(flag.cloneNode(true), link.firstChild);
      if (source.getAttribute('aria-current') === 'true' || source.classList.contains('cur')) {
        link.setAttribute('aria-current', 'page');
      }
      if (source.title) link.setAttribute('aria-label', source.title);
      nav.appendChild(link);
    });
    return nav;
  }

  function languageTarget(source) {
    var target = new URL(source.href, location.href);
    var nextLanguage = source.getAttribute('lang');
    var current = new URL(location.href);
    // Keep the current page when changing language, including under a preview
    // directory or a GitHub Pages repository prefix.
    var route = current.pathname.match(/^(.*\/)anh-thu-kresimir(?:\.html|\/(.*))$/);
    if (target.origin === current.origin && route && /^(en|hr|vi)$/.test(nextLanguage)) {
      var page = route[2] || '';
      if (/^(hr|vi)\.html$/.test(page)) page = '';
      else page = page.replace(/^(hr|vi)\//, '');
      if (!page || /^[^/]+\.html$/.test(page)) {
        target.pathname = route[1] + 'anh-thu-kresimir' + (page
          ? '/' + (nextLanguage === 'en' ? '' : nextLanguage + '/') + page
          : nextLanguage === 'en' ? '.html' : '/' + nextLanguage + '.html');
      }
      target.search = current.search;
      target.searchParams.delete(languageMenuParam);
      target.hash = current.hash;
    }
    return target;
  }

  function changeLanguage(event, link) {
    // Anchors can change after the menu was created (for example gallery tabs).
    // Refresh the real href before the browser handles ordinary or modified clicks.
    var target = languageTarget(link);
    link.href = target.href;
    // Preserve browser shortcuts such as Command/Ctrl-click and opening a new tab.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
    if (target.origin !== location.origin) return;
    if (link.getAttribute('lang') === language) {
      event.preventDefault();
      return;
    }
    try {
      sessionStorage.setItem(languageMenuKey, JSON.stringify({ href: target.href, expires: Date.now() + 60000 }));
    } catch (error) {
      // Private browsing can disable storage. Carry the one-use intent in the
      // destination URL instead, and remove it as soon as the menu is restored.
      target.searchParams.set(languageMenuParam, 'open');
    }
    event.preventDefault();
    location.assign(target.href);
  }

  function restoreLanguageMenu() {
    var current = new URL(location.href);
    var restore = current.searchParams.get(languageMenuParam) === 'open';
    if (restore) {
      current.searchParams.delete(languageMenuParam);
      try { history.replaceState(history.state, '', current.href); }
      catch (error) { /* Still restore the menu if URL cleanup is unavailable. */ }
    }
    try {
      var pending = JSON.parse(sessionStorage.getItem(languageMenuKey) || 'null');
      sessionStorage.removeItem(languageMenuKey);
      if (pending && pending.href === current.href && pending.expires > Date.now()) restore = true;
    } catch (error) { /* The URL fallback works without storage. */ }
    if (restore) openMenu();
  }

  function focusableItems() {
    if (!view) return [];
    return Array.prototype.filter.call(
      view.panel.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'),
      function (node) { return node.getClientRects().length > 0; }
    );
  }

  function finishClose(restoreFocus) {
    if (!view) return;
    document.body.classList.remove('tk-mobile-menu-open');
    view.toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus && mobile.matches) {
      var target = view.previousFocus;
      if (!target || !target.isConnected || view.panel.contains(target)) target = view.toggle;
      target.focus({ preventScroll: true });
    }
    view.previousFocus = null;
  }

  function closeMenu(restoreFocus) {
    if (!view) return;
    if (view.panel.hasAttribute('open') && typeof view.panel.close === 'function') view.panel.close();
    else view.panel.removeAttribute('open');
    finishClose(restoreFocus);
  }

  function openMenu() {
    if (!view || !mobile.matches || view.panel.hasAttribute('open')) return;
    Array.prototype.forEach.call(view.panel.querySelectorAll('.tk-mobile-menu-language'), function (link) {
      link.href = languageTarget(link).href;
    });
    view.previousFocus = document.activeElement;
    if (typeof view.panel.showModal === 'function') view.panel.showModal();
    else view.panel.setAttribute('open', '');
    view.toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('tk-mobile-menu-open');
    view.closeButton.focus({ preventScroll: true });
  }

  function onKeydown(event) {
    if (!view || !view.panel.hasAttribute('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== 'Tab') return;
    var items = focusableItems();
    var first = items[0];
    var last = items[items.length - 1];
    if (!first) {
      event.preventDefault();
      view.panel.focus();
    } else if (event.shiftKey && (document.activeElement === first || !view.panel.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !view.panel.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  }

  function onFocus(event) {
    if (view && view.panel.hasAttribute('open') && !view.panel.contains(event.target)) {
      view.closeButton.focus({ preventScroll: true });
    }
  }

  function updateBackToTop() {
    if (view) view.topButton.hidden = (window.pageYOffset || document.documentElement.scrollTop || 0) <= 400;
  }

  function mount() {
    if (view) return;
    var header = document.getElementById('SITE_HEADER');
    var sourceMenu = header && header.querySelector('#comp-mgp5nrpb5 nav > ul');
    if (!sourceMenu) return;

    var toggle = element('button', 'tk-mobile-menu-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', 'tk-mobile-menu-panel');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-haspopup', 'dialog');
    toggle.appendChild(element('span', 'tk-mobile-menu-label', text.menu));
    var icon = element('span', 'tk-mobile-menu-icon');
    icon.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i += 1) icon.appendChild(element('span'));
    toggle.appendChild(icon);

    var panel = element('dialog', 'tk-mobile-menu-panel');
    panel.id = 'tk-mobile-menu-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'tk-mobile-menu-heading');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('tabindex', '-1');
    var bar = element('div', 'tk-mobile-menu-bar');
    var sourceLogo = header.querySelector('#comp-mgp5nrp21 a');
    var sourceLogoImage = sourceLogo && sourceLogo.querySelector('img');
    if (sourceLogoImage) {
      var logo = copyLink(sourceLogo, 'tk-mobile-menu-logo');
      logo.textContent = '';
      logo.appendChild(sourceLogoImage.cloneNode(true));
      bar.appendChild(logo);
    }
    var heading = element('h2', 'tk-mobile-menu-heading', text.menu);
    heading.id = 'tk-mobile-menu-heading';
    bar.appendChild(heading);
    var closeButton = element('button', 'tk-mobile-menu-close', '\u00d7');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', text.close);
    bar.appendChild(closeButton);
    panel.appendChild(bar);

    var languages = buildLanguages(header);
    if (languages) panel.appendChild(languages);
    var navigation = element('nav', 'tk-mobile-menu-navigation');
    navigation.setAttribute('aria-label', text.navigation);
    navigation.appendChild(buildList(sourceMenu, ''));
    panel.appendChild(navigation);

    var topButton = element('button', 'tk-mobile-back-to-top');
    topButton.type = 'button';
    topButton.hidden = true;
    topButton.setAttribute('aria-label', text.top);
    topButton.title = text.top;
    var topArrow = element('span', '', '\u2191');
    topArrow.setAttribute('aria-hidden', 'true');
    topButton.appendChild(topArrow);
    topButton.addEventListener('click', function () {
      var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    view = { toggle: toggle, panel: panel, closeButton: closeButton, topButton: topButton, previousFocus: null };
    header.appendChild(toggle);
    document.body.appendChild(panel);
    document.body.appendChild(topButton);
    toggle.addEventListener('click', openMenu);
    closeButton.addEventListener('click', function () { closeMenu(true); });
    panel.addEventListener('cancel', function (event) { event.preventDefault(); closeMenu(true); });
    panel.addEventListener('close', function () {
      if (view && view.panel === panel) finishClose(false);
    });
    panel.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (link && link.classList.contains('tk-mobile-menu-language')) {
        changeLanguage(event, link);
        return;
      }
      if (link) closeMenu(false);
    });
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('focusin', onFocus);
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
    restoreLanguageMenu();
  }

  function unmount() {
    if (!view) return;
    var hadFocus = document.activeElement === view.toggle || document.activeElement === view.topButton || view.panel.contains(document.activeElement);
    closeMenu(false);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('focusin', onFocus);
    window.removeEventListener('scroll', updateBackToTop);
    view.toggle.remove();
    view.panel.remove();
    view.topButton.remove();
    view = null;
    if (hadFocus) {
      var logo = document.querySelector('#comp-mgp5nrp21 a');
      if (logo) logo.focus({ preventScroll: true });
    }
  }

  function sync() { if (mobile.matches) mount(); else unmount(); }

  function init() {
    sync();
    if (mobile.addEventListener) mobile.addEventListener('change', sync);
    else mobile.addListener(sync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
