/* The motion lab.
   A floating dock for judging each effect against the others. It loads only on
   localhost, or anywhere with ?lab in the URL, so it never reaches a visitor.
   Choices persist in localStorage, so a reload keeps whatever you were judging. */
(function () {
  "use strict";

  var KEY = "waiw-fx";
  var root = document.documentElement;

  var EFFECTS = [
    { id: "timeline", cls: "fx-timeline", on: true,
      name: "Tactile timeline", note: "Springs, rolling year, staggered record" },
    { id: "load", cls: "fx-load", on: true,
      name: "Load sequence", note: "The hero sets itself, line by line" },
    { id: "marks", cls: "fx-marks", on: true,
      name: "Confidence draws in", note: "Known, then likely, then generated" },
    { id: "drift", cls: "fx-drift", on: true,
      name: "Ambient hero drift", note: "The Thames, 1647 to today, by itself" },
    { id: "atmos", cls: "fx-atmos", on: false,
      name: "Atmosphere", note: "Slow drift on plates, faint smoke" },
    { id: "edge", cls: "fx-edge", on: false,
      name: "Travelling edge", note: "A light runs the border of the invitation" },
    { id: "pulse", cls: "fx-pulse", on: false,
      name: "Pulse", note: "The panel breathes, the dot beats" },
    { id: "lift", cls: "fx-lift", on: false,
      name: "Surfaces lift", note: "Cards and plates answer the cursor" },
    { id: "count", cls: "fx-count", on: false,
      name: "Years arrive", note: "Numerals settle in as they scroll up" },
    { id: "parallax", cls: "fx-parallax", on: false,
      name: "Parallax", note: "Not recommended, the brief says no" }
  ];

  function defaults() {
    var d = {};
    EFFECTS.forEach(function (e) { d[e.id] = e.on; });
    return d;
  }

  function load() {
    var state = defaults();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        EFFECTS.forEach(function (e) {
          if (typeof saved[e.id] === "boolean") state[e.id] = saved[e.id];
        });
      }
    } catch (err) {}
    return state;
  }

  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) {}
  }

  function apply(state) {
    EFFECTS.forEach(function (e) { root.classList.toggle(e.cls, !!state[e.id]); });
    window.dispatchEvent(new CustomEvent("waiw:fx", { detail: state }));
  }

  var state = load();
  apply(state);

  function build() {
    var lab = document.createElement("aside");
    lab.className = "lab";
    lab.setAttribute("aria-label", "Motion lab");

    var head = document.createElement("div");
    head.className = "lab-head";
    head.innerHTML = '<span class="dot"></span><b>Motion lab</b><span class="chev">▾</span>';
    head.addEventListener("click", function () {
      lab.classList.toggle("closed");
      try { localStorage.setItem(KEY + "-closed", lab.classList.contains("closed") ? "1" : "0"); } catch (e) {}
    });
    lab.appendChild(head);

    var body = document.createElement("div");
    body.className = "lab-body";

    EFFECTS.forEach(function (e) {
      var row = document.createElement("label");
      row.className = "lab-row";

      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = !!state[e.id];
      box.addEventListener("change", function () {
        state[e.id] = box.checked;
        save(state);
        apply(state);
      });

      var txt = document.createElement("span");
      txt.className = "lab-txt";
      var b = document.createElement("b");
      b.textContent = e.name;
      var s = document.createElement("span");
      s.textContent = e.note;
      txt.appendChild(b);
      txt.appendChild(s);

      row.appendChild(box);
      row.appendChild(txt);
      body.appendChild(row);
    });

    var foot = document.createElement("div");
    foot.className = "lab-foot";

    function action(label, fn) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener("click", fn);
      foot.appendChild(btn);
      return btn;
    }
    function setAll(value) {
      EFFECTS.forEach(function (e) { state[e.id] = value; });
      save(state);
      apply(state);
      sync();
    }
    function sync() {
      var boxes = body.querySelectorAll("input");
      EFFECTS.forEach(function (e, i) { boxes[i].checked = !!state[e.id]; });
    }

    action("Recommended", function () { state = defaults(); save(state); apply(state); sync(); });
    action("All off", function () { setAll(false); });
    action("All on", function () { setAll(true); });

    body.appendChild(foot);
    lab.appendChild(body);
    document.body.appendChild(lab);

    try {
      if (localStorage.getItem(KEY + "-closed") === "1") lab.classList.add("closed");
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
