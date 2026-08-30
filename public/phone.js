/* The phone in the hero plays the real app.
   ---------------------------------------------------------------------------
   What is on that screen is not a drawing of the product any more. They are
   screenshots of the live app at app.worldasitwas.com, taken on a phone-sized
   viewport in both themes: the world map with every built city on it, and the
   sheet that slides up when you pick one. This file decides which sheet is up
   and nothing else, so there is no React here and none is loaded for it.

   It is a progressive enhancement in the same way the rest of the page is. The
   markup ships with London's sheet already up, so with JavaScript off, with the
   fx-phone effect switched off in the lab, or for a reader who has asked for
   reduced motion, the phone is a still of the app rather than an empty frame.

   It keeps the manners the other effects keep: it does not run while it is off
   screen, it does not run in a hidden tab, and it stops the moment the reader
   turns the effect off. */
(function () {
  "use strict";

  var root = document.documentElement;
  var stage = document.querySelector(".phone-app");
  if (!stage) return;

  var sheets = [].slice.call(stage.querySelectorAll(".phone-sheet-pic"));
  if (sheets.length < 2) return;

  var HOLD = 4600;   // long enough to read the city and its years
  var GAP  = 900;    // and the map is alone for a moment in between

  var index = Math.max(0, sheets.findIndex ? sheets.findIndex(isOn) : 0);
  var timer = null;
  var onScreen = true;

  function isOn(el) { return el.classList.contains("is-on"); }

  var reduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  function wanted() {
    return root.classList.contains("fx-phone") && !reduced.matches &&
           onScreen && !document.hidden;
  }

  function after(ms, fn) { clearTimeout(timer); timer = setTimeout(fn, ms); }

  /* One tick either lowers the sheet that is up, or raises the next one, so the
     two halves of the cycle need no state of their own. */
  function tick() {
    if (!wanted()) { timer = null; return; }
    if (isOn(sheets[index])) {
      sheets[index].classList.remove("is-on");
      index = (index + 1) % sheets.length;
      after(GAP, tick);
    } else {
      sheets[index].classList.add("is-on");
      after(HOLD, tick);
    }
  }

  function play() { if (timer === null && wanted()) after(HOLD, tick); }
  function pause() { clearTimeout(timer); timer = null; }

  document.addEventListener("visibilitychange", function () {
    document.hidden ? pause() : play();
  });

  if (reduced.addEventListener) {
    reduced.addEventListener("change", function () {
      reduced.matches ? pause() : play();
    });
  }

  /* The lab can switch fx-phone on and off while the page is open. */
  if (window.MutationObserver) {
    new MutationObserver(function () {
      wanted() ? play() : pause();
    }).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        onScreen = entry.isIntersecting;
        onScreen ? play() : pause();
      });
    }, { threshold: 0.15 }).observe(stage);
  } else {
    play();
  }
})();
