// Defense in depth for isolated test children. No live service hosts are allowed.
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const tls = require('node:tls');
function allowed(host) {
  host = String(host || 'localhost').replace(/^\[|\]$/g, '').toLowerCase();
  return ['localhost', '127.0.0.1', '::1'].includes(host) ||
    (process.env.FSC_ALLOW_FONT_NETWORK === '1' && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host));
}
function check(host) {
  if (!allowed(host)) {
    if (process.env.FSC_NETWORK_VIOLATION) require('node:fs').appendFileSync(process.env.FSC_NETWORK_VIOLATION, 'FSC_NETWORK_BLOCKED\n');
    throw new Error('FSC_NETWORK_BLOCKED: external destination');
  }
}
function hostFrom(args) {
  const value = args[0];
  if (typeof value === 'string' && /^https?:/.test(value)) return new URL(value).hostname;
  if (value instanceof URL) return value.hostname;
  if (value && typeof value === 'object') return value.hostname || value.host || value.servername;
  return typeof args[1] === 'string' ? args[1] : 'localhost';
}
for (const module of [http, https]) for (const method of ['request', 'get']) {
  const original = module[method];
  module[method] = function (...args) { check(hostFrom(args)); return original.apply(this, args); };
}
for (const [module, methods] of [[net, ['connect', 'createConnection']], [tls, ['connect']]]) {
  for (const method of methods) {
    const original = module[method];
    module[method] = function (...args) { check(hostFrom(args)); return original.apply(this, args); };
  }
}
const originalSocketConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const normalized = Array.isArray(args[0]) ? args[0] : args;
  check(hostFrom(normalized));
  return originalSocketConnect.apply(this, args);
};
if (globalThis.fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = function (input, init) {
    check(new URL(typeof input === 'string' || input instanceof URL ? input : input.url).hostname);
    return original.call(this, input, init);
  };
}
