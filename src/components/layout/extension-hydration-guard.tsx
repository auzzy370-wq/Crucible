import Script from "next/script";

/**
 * Browser extensions (Grammarly, LanguageTool, ColorZilla, …) inject attributes
 * onto <body>/<html> before React hydrates, which trips Next's hydration overlay.
 * Strip known extension attrs as early as possible so SSR HTML matches the DOM.
 */
export function ExtensionHydrationGuard() {
  return (
    <Script id="extension-hydration-guard" strategy="beforeInteractive">{`
(function () {
  var ATTRS = [
    "data-new-gr-c-s-check-loaded",
    "data-gr-ext-installed",
    "data-gr-c-s-loaded",
    "data-lt-installed",
    "cz-shortcut-listen",
    "data-darkreader-mode",
    "data-darkreader-scheme",
    "bis_skin_checked"
  ];
  function strip(el) {
    if (!el || !el.removeAttribute) return;
    for (var i = 0; i < ATTRS.length; i++) {
      if (el.hasAttribute(ATTRS[i])) el.removeAttribute(ATTRS[i]);
    }
  }
  function scrub() {
    strip(document.documentElement);
    strip(document.body);
  }
  scrub();
  try {
    var obs = new MutationObserver(scrub);
    obs.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
    window.addEventListener("DOMContentLoaded", scrub);
    window.addEventListener("load", function () {
      scrub();
      setTimeout(function () { try { obs.disconnect(); } catch (e) {} }, 3000);
    });
  } catch (e) {}
})();
`}</Script>
  );
}
