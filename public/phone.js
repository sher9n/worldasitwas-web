/* The phone in the hero, as a working thing rather than a picture of one.
   ---------------------------------------------------------------------------
   A React component with real state: you can type a place, drag the year, and
   press Travel. The map is drawn from the year rather than cross-faded between
   two stills, so scrubbing continuously redraws the city: lanes straighten into
   a grid, blocks fill in, the river narrows as it is embanked, the parks arrive.

   It progressively enhances. The static markup in index.html stands until React
   is on the page; if the CDN never answers, the page keeps the still version and
   nothing is lost. */
(function () {
  "use strict";

  var mount = document.getElementById("phoneApp");
  if (!mount) return;

  function boot() {
    if (!window.React || !window.ReactDOM) return false;

    var React = window.React;
    var h = React.createElement;
    var useState = React.useState, useEffect = React.useEffect,
        useRef = React.useRef, useMemo = React.useMemo, useCallback = React.useCallback;

    var MIN_YEAR = 1600, MAX_YEAR = 2026, HOME = 1850;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

    // ---- the record, so arriving says something true -----------------------
    var ERAS = [
      { from: 1600, name: "Elizabethan",  people: "about 200,000",   ruler: "Elizabeth I" },
      { from: 1603, name: "Jacobean",     people: "about 225,000",   ruler: "James I" },
      { from: 1625, name: "Caroline",     people: "about 320,000",   ruler: "Charles I" },
      { from: 1649, name: "Commonwealth", people: "about 375,000",   ruler: "no monarch" },
      { from: 1660, name: "Restoration",  people: "about 400,000",   ruler: "Charles II" },
      { from: 1714, name: "Georgian",     people: "about 630,000",   ruler: "George I" },
      { from: 1837, name: "Victorian",    people: "about 2 million", ruler: "Victoria" },
      { from: 1901, name: "Edwardian",    people: "about 6.5 million", ruler: "Edward VII" },
      { from: 1936, name: "Wartime",      people: "about 8.6 million", ruler: "George VI" },
      { from: 1953, name: "Modern",       people: "about 8.2 million", ruler: "Elizabeth II" },
      { from: 2022, name: "Today",        people: "about 8.9 million", ruler: "Charles III" }
    ];
    function eraFor(year) {
      var found = ERAS[0];
      for (var i = 0; i < ERAS.length; i++) if (year >= ERAS[i].from) found = ERAS[i];
      return found;
    }

    // ---- the map is a function of the year --------------------------------
    // One fixed layout, modulated continuously, so dragging morphs the city
    // instead of cutting between two drawings.
    var W = 280, H = 380;
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    function buildMap(year) {
      var t = clamp01((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)); // 0 old, 1 now
      var wobble = (1 - t) * 16;          // lanes wander in the old city
      var density = Math.round(6 + t * 20); // and fill in as it grows

      // streets: straighter and more regular the later it gets
      var across = [], down = [];
      for (var r = 0; r < 5; r++) {
        var y = 74 + r * 44;
        var w1 = Math.sin(r * 2.1) * wobble, w2 = Math.cos(r * 1.7) * wobble;
        across.push("M0 " + (y + w1) + " C 70 " + (y - w2) + ", 140 " + (y + w2) +
                    ", 200 " + (y + w1 * 0.4) + " S 250 " + (y - w1) + ", " + W + " " + y);
      }
      for (var c = 0; c < 4; c++) {
        var x = 62 + c * 58;
        var v1 = Math.cos(c * 1.9) * wobble;
        down.push("M" + (x + v1) + " 30 C " + (x - v1) + " 110, " + (x + v1) + " 180, " + x + " 250");
      }

      // blocks: a few in 1600, a dense grain by today
      var blocks = [];
      var cols = 5, rows = 4, made = 0;
      for (var by = 0; by < rows && made < density; by++) {
        for (var bx = 0; bx < cols && made < density; bx++) {
          var jitter = (1 - t) * 7;
          var px = 24 + bx * 52 + Math.sin(bx * 3.1 + by) * jitter;
          var py = 52 + by * 46 + Math.cos(by * 2.3 + bx) * jitter;
          var bw = 30 + t * 14, bh = 22 + t * 10;
          blocks.push("M" + px.toFixed(1) + " " + py.toFixed(1) + " h" + bw.toFixed(1) +
                      " v" + bh.toFixed(1) + " h-" + bw.toFixed(1) + " z");
          made++;
        }
      }

      // the river, embanked and narrowed as the centuries pass
      var spread = 34 - t * 13;
      var river = "M-12 268 C 34 246, 78 254, 118 274 S 196 308, 238 288 S 282 266, 300 274 " +
                  "L 300 " + (274 + spread) + " C 262 " + (306 + spread * 0.4) +
                  ", 232 " + (330 + spread * 0.2) + ", 190 322 S 108 298, 66 292 S 18 282, -12 " +
                  (296 + spread * 0.3) + " Z";

      return { t: t, across: across, down: down, blocks: blocks, river: river,
               park: t > 0.13, rail: t > 0.55 };
    }

    // ---- the component ------------------------------------------------------
    function Phone() {
      var [place, setPlace] = useState("London");
      var [year, setYear] = useState(HOME);
      var [arrived, setArrived] = useState(true);
      var [touched, setTouched] = useState(false);
      var demo = useRef({ timers: [], on: false });

      var map = useMemo(function () { return buildMap(year); }, [year]);
      var era = eraFor(year);

      function stopDemo() {
        demo.current.timers.forEach(clearTimeout);
        demo.current.timers = [];
        demo.current.on = false;
      }
      var handsOn = useCallback(function () {
        if (!touched) setTouched(true);
        stopDemo();
      }, [touched]);

      // it demonstrates itself until someone takes over, then never again
      useEffect(function () {
        if (touched || (reduced && reduced.matches)) return;
        var d = demo.current;
        function at(ms, fn) { d.timers.push(setTimeout(fn, ms)); }
        function run() {
          if (d.on) return;
          d.on = true;
          setArrived(false);
          setPlace("");
          setYear(MAX_YEAR);
          "London".split("").forEach(function (ch, i) {
            at(500 + i * 105, function () { setPlace(function (p) { return p + ch; }); });
          });
          var from = MAX_YEAR, to = HOME, steps = 26;
          for (var i = 1; i <= steps; i++) {
            (function (i) {
              at(1900 + i * 62, function () {
                setYear(Math.round(from + (to - from) * (i / steps)));
              });
            })(i);
          }
          at(1900 + steps * 62 + 500, function () { setArrived(true); });
          at(11000, function () { d.on = false; d.timers = []; run(); });
        }
        var io = null;
        if ("IntersectionObserver" in window) {
          io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
              if (en.isIntersecting) run(); else stopDemo();
            });
          }, { threshold: 0.3 });
          io.observe(mount);
        } else { run(); }
        return function () { stopDemo(); if (io) io.disconnect(); };
      }, [touched]);

      var pct = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

      return h("div", { className: "ph" + (arrived ? " is-arrived" : "") },
        h("div", { className: "ph-status" },
          h("span", null, "9:41"), h("span", null, "100%")),

        h("label", { className: "ph-search" },
          h("span", { className: "ph-where" }, "Where"),
          h("input", {
            value: place, "aria-label": "Place",
            placeholder: "Search a place",
            onChange: function (e) { handsOn(); setPlace(e.target.value); },
            onFocus: handsOn
          })),

        h("div", { className: "ph-map" }, h(MapView, { map: map, arrived: arrived, place: place })),

        h("div", { className: "ph-sheet" },
          h("p", { className: "ph-label" }, "When"),
          h("div", { className: "ph-yearrow" },
            h("span", { className: "ph-year" }, year),
            h("span", { className: "ph-era" }, era.name)),
          h("div", { className: "ph-slider" },
            h("div", { className: "ph-track" }),
            h("div", { className: "ph-fill", style: { width: pct + "%" } }),
            h("div", { className: "ph-knob", style: { left: pct + "%" } }),
            h("input", {
              type: "range", min: MIN_YEAR, max: MAX_YEAR, step: 1, value: year,
              "aria-label": "Year", "aria-valuetext": year + ", " + era.name,
              onPointerDown: handsOn,
              onChange: function (e) { handsOn(); setYear(Number(e.target.value)); setArrived(false); }
            })),
          h("div", { className: "ph-scale" },
            [1600, 1700, 1800, 1900, 2000].map(function (y) {
              return h("span", { key: y }, y);
            })),
          h("button", {
            type: "button", className: "ph-go",
            onClick: function () { handsOn(); setArrived(true); }
          }, arrived ? "You are in " + year : "Travel"),
          h("p", { className: "ph-foot" }, arrived
            ? era.people + " · " + era.ruler
            : "6 stops · 42 min · on foot")));
    }

    function MapView(props) {
      var map = props.map;
      return h("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid slice",
                        role: "presentation" },
        h("rect", { className: "m-ground", width: W, height: H }),
        map.park && h("path", { className: "m-park",
          d: "M12 96 C 34 84, 68 86, 84 102 S 92 142, 70 152 S 22 150, 12 130 Z" }),
        h("path", { className: "m-water", d: map.river }),
        h("g", { className: "m-blocks" },
          map.blocks.map(function (d, i) { return h("path", { key: i, d: d }); })),
        h("g", { className: "m-streets", strokeWidth: 1.1, strokeLinecap: "round" },
          map.across.concat(map.down).map(function (d, i) { return h("path", { key: i, d: d }); })),
        map.rail && h("path", { className: "m-rail", d: "M0 214 C 60 208, 120 220, 180 212 S 250 200, 280 206",
          strokeDasharray: "5 4" }),
        props.arrived && h("g", null,
          h("path", { className: "m-route", d: "M46 226 L 82 214 L 118 196 L 152 178 L 186 172 L 214 150",
            strokeWidth: 1.6, strokeDasharray: "1 5", strokeLinecap: "round", strokeLinejoin: "round" }),
          h("g", { className: "m-stops", strokeWidth: 1.5 },
            [[46,226],[82,214],[118,196],[186,172],[214,150]].map(function (p, i) {
              return h("circle", { key: i, cx: p[0], cy: p[1], r: 3.4 });
            }))),
        h("circle", { className: "m-halo", cx: 152, cy: 178, r: 30 }),
        h("circle", { className: "m-pin", cx: 152, cy: 178, r: 6, strokeWidth: 2 }),
        h("g", { transform: "translate(166 166)" },
          h("rect", { className: "m-chip", width: 92, height: 23, rx: 6 }),
          h("text", { className: "m-chip-text", x: 46, y: 15.5, textAnchor: "middle",
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 8.5,
            letterSpacing: 1 }, (props.place || "London").slice(0, 14).toUpperCase())),
        h("text", { className: "m-label", x: 20, y: 316,
          fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 8,
          letterSpacing: 1.4 }, "THAMES"));
    }

    var root = window.ReactDOM.createRoot(mount);
    root.render(h(Phone));
    mount.classList.add("live");
    document.documentElement.classList.add("phone-live");
    return true;
  }

  // React arrives async; try until it is here, then give up quietly
  if (boot()) return;
  var tries = 0;
  var poll = setInterval(function () {
    if (boot() || ++tries > 60) clearInterval(poll);
  }, 100);
})();
