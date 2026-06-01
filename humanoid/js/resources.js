/* Spline asset map. Points the patched spline-viewer runtime at the local
   scene + lazy WASM modules (it reads these window globals on load).

   The process/navmesh JS are loaded via dynamic import(), so their URLs must
   be valid module specifiers — resolve them to absolute URLs against the
   document so a bare "assets/..." path doesn't throw. */
(function () {
  var abs = function (p) {
    try { return new URL(p, document.baseURI).href; } catch (e) { return p; }
  };
  window.__resources = window.__resources || {
    splineScene:       abs("assets/spline/scene.splinecode"),
    splineProcess:     abs("assets/spline/process.js"),
    splineProcessWasm: abs("assets/spline/process.wasm"),
    splineNavmesh:     abs("assets/spline/navmesh.js"),
    splineNavmeshWasm: abs("assets/spline/navmesh.wasm")
  };
  var r = window.__resources;
  window.__SPLINE_PROCESS_JS_URL   = abs(r.splineProcess     || "assets/spline/process.js");
  window.__SPLINE_PROCESS_WASM_URL = abs(r.splineProcessWasm || "assets/spline/process.wasm");
  window.__SPLINE_NAVMESH_JS_URL   = abs(r.splineNavmesh     || "assets/spline/navmesh.js");
  window.__SPLINE_NAVMESH_WASM_URL = abs(r.splineNavmeshWasm || "assets/spline/navmesh.wasm");
})();
