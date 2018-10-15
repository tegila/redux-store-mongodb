/* eslint-disable */

const utils = require('./utils');
const auth = require('./auth');
const nacl = require('tweetnacl');
const socket = require('socket.io-client');
const util = require('tweetnacl-util');

const enc = util.encodeBase64;

let io = null;

module.exports = (url) => {
  return {
    me: () => {
      return new Promise((resolve) => {
        io.once('me', (data) => {
          console.log("[index.js] ONCE ME");
          if (data) resolve(data);
        });
        io.emit('me');
      });
    },
    connect: (secretKey) => {
      const auth_enc = auth.auth_from_secretKey(secretKey);
      // https://localhost/socket.io?query={signature=...&pubkey=...&message=...}
      io = socket.connect(url, { rejectUnauthorized: false, reconnect: true, query: auth_enc });
    },
    close: () => {
      io.close();
    },
    on: (topic, callback) => {
      io.on(topic, callback);
    },
    once: (topic, callback) => {
      io.once(topic, callback);
    },
    findOne: (path, payload) => {
      return new Promise((resolve, reject) => {
        const payload_hash = nacl.hash(utils.str2ab(JSON.stringify(payload)));
        const signature = enc(nacl.sign.detached(payload_hash, auth.get_secretKey()));
        io.once(signature, (data) => {
          const _local = Object.assign({}, data);
          console.log("[index.js] ONCE findOne", _local);
          if (_local.err) reject(_local.err);
          if (_local.res) resolve(_local.res);
        });
        io.emit('link', {
          action: "findOne",
          path,
          payload,
          signature
        });
      });
    },
    query: (payload) => {
      utils.__parse_regex__(payload);
      return new Promise((resolve, reject) => {
        const payload_hash = nacl.hash(utils.str2ab(JSON.stringify(payload.payload)));
        const signature = enc(nacl.sign.detached(payload_hash, auth.get_secretKey()));
        io.once(signature, (data) => {
          const _local = Object.assign({}, data);
          // console.log("[index.js] ONCE QUERY", _local);
          if (_local.err) reject(_local.err);
          if (_local.res) resolve(_local.res);
        });
        io.emit('link', {
          action: "query",
          payload,
          signature
        });
      });
    },
    remove: (path, payload) => {
      return new Promise((resolve, reject) => {
        const payload_hash = nacl.hash(utils.str2ab(JSON.stringify(payload)));
        const signature = enc(nacl.sign.detached(payload_hash, auth.get_secretKey()));
        io.once(signature, (data) => {
          console.log("[index.js] ONCE DELETE");
          if (data.err) reject(data.err);
          if (data.res) resolve(data.res);
        });
        io.emit('link', {
          action: "remove",
          path,
          payload,
          signature
        });
      });
    },
    save: (path, payload) => {
      return new Promise((resolve, reject) => {
        const payload_hash = nacl.hash(utils.str2ab(JSON.stringify(payload)));
        const signature = enc(nacl.sign.detached(payload_hash, auth.get_secretKey()));
        console.log('[index.js] save', path, signature);
        io.once(signature, (data) => {
          console.log("[index.js] ONCE SAVE");
          if (data.err) reject(data.err);
          if (data) resolve(data);
        });
        io.emit('link', {
          action: "save",
          path,
          payload,
          signature
        });
      });
    },
    update: (path, payload) => {
      return new Promise((resolve, reject) => {
        const payload_hash = nacl.hash(utils.str2ab(JSON.stringify(payload)));
        const signature = enc(nacl.sign.detached(payload_hash, auth.get_secretKey()));
        console.log('[index.js] update', path, signature);
        io.once(signature, (data) => {
          console.log("[index.js] ONCE UPDATE");
          if (data.err) reject(data.err);
          if (data) resolve(data);
        });
        io.emit('link', {
          action: "update",
          path,
          payload,
          signature
        });
      });
    }
  };
};
