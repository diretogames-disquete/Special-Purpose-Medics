/* Narration config — where to reach the serverless proxy that calls Claude to
   rewrite the patient brief in a chosen tone. Leave proxyUrl empty to keep just
   the free Web-Speech read-aloud (the "Enhance tone" button stays disabled).

   Set proxyUrl after deploying proxy/worker.js (see proxy/README.md). You can
   also override at runtime: ?proxy=<url> in the URL, or
   localStorage.setItem('spm.narration.proxy', '<url>'). */
window.NARRATION = {
  proxyUrl: "",   // e.g. "https://spm-narration-proxy.you.workers.dev"
  token: ""       // set only if the proxy uses SHARED_TOKEN
};

window.NARRATION_RESOLVE = function () {
  var cfg = window.NARRATION || {};
  var url = cfg.proxyUrl || "";
  var token = cfg.token || "";
  try {
    var q = new URLSearchParams(location.search);
    if (q.get("proxy")) url = q.get("proxy");
    if (q.get("ntoken")) token = q.get("ntoken");
    var ls = localStorage.getItem("spm.narration.proxy");
    if (ls) url = ls;
    var lt = localStorage.getItem("spm.narration.token");
    if (lt) token = lt;
  } catch (e) {}
  return { url: url, token: token };
};
