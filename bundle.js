(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/@firebase/util/dist/postinstall.mjs
  var getDefaultsFromPostinstall;
  var init_postinstall = __esm({
    "node_modules/@firebase/util/dist/postinstall.mjs"() {
      getDefaultsFromPostinstall = () => void 0;
    }
  });

  // node_modules/@firebase/util/dist/index.esm.js
  function deepCopy(value) {
    return deepExtend(void 0, value);
  }
  function deepExtend(target, source) {
    if (!(source instanceof Object)) {
      return source;
    }
    switch (source.constructor) {
      case Date:
        const dateValue = source;
        return new Date(dateValue.getTime());
      case Object:
        if (target === void 0) {
          target = {};
        }
        break;
      case Array:
        target = [];
        break;
      default:
        return source;
    }
    for (const prop in source) {
      if (!source.hasOwnProperty(prop) || !isValidKey(prop)) {
        continue;
      }
      target[prop] = deepExtend(target[prop], source[prop]);
    }
    return target;
  }
  function isValidKey(key) {
    return key !== "__proto__";
  }
  function getGlobal() {
    if (typeof self !== "undefined") {
      return self;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof global !== "undefined") {
      return global;
    }
    throw new Error("Unable to locate global object.");
  }
  function createMockUserToken(token, projectId) {
    if (token.uid) {
      throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');
    }
    const header = {
      alg: "none",
      type: "JWT"
    };
    const project = projectId || "demo-project";
    const iat = token.iat || 0;
    const sub = token.sub || token.user_id;
    if (!sub) {
      throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");
    }
    const payload = {
      // Set all required fields to decent defaults
      iss: `https://securetoken.google.com/${project}`,
      aud: project,
      iat,
      exp: iat + 3600,
      auth_time: iat,
      sub,
      user_id: sub,
      firebase: {
        sign_in_provider: "custom",
        identities: {}
      },
      // Override with user options
      ...token
    };
    const signature = "";
    return [
      base64urlEncodeWithoutPadding(JSON.stringify(header)),
      base64urlEncodeWithoutPadding(JSON.stringify(payload)),
      signature
    ].join(".");
  }
  function getUA() {
    if (typeof navigator !== "undefined" && typeof navigator["userAgent"] === "string") {
      return navigator["userAgent"];
    } else {
      return "";
    }
  }
  function isMobileCordova() {
    return typeof window !== "undefined" && // @ts-ignore Setting up an broadly applicable index signature for Window
    // just to deal with this case would probably be a bad idea.
    !!(window["cordova"] || window["phonegap"] || window["PhoneGap"]) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA());
  }
  function isCloudflareWorker() {
    return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
  }
  function isBrowserExtension() {
    const runtime = typeof chrome === "object" ? chrome.runtime : typeof browser === "object" ? browser.runtime : void 0;
    return typeof runtime === "object" && runtime.id !== void 0;
  }
  function isReactNative() {
    return typeof navigator === "object" && navigator["product"] === "ReactNative";
  }
  function isIE() {
    const ua = getUA();
    return ua.indexOf("MSIE ") >= 0 || ua.indexOf("Trident/") >= 0;
  }
  function isNodeSdk() {
    return CONSTANTS.NODE_CLIENT === true || CONSTANTS.NODE_ADMIN === true;
  }
  function isIndexedDBAvailable() {
    try {
      return typeof indexedDB === "object";
    } catch (e) {
      return false;
    }
  }
  function validateIndexedDBOpenable() {
    return new Promise((resolve, reject) => {
      try {
        let preExist = true;
        const DB_CHECK_NAME = "validate-browser-context-for-indexeddb-analytics-module";
        const request = self.indexedDB.open(DB_CHECK_NAME);
        request.onsuccess = () => {
          request.result.close();
          if (!preExist) {
            self.indexedDB.deleteDatabase(DB_CHECK_NAME);
          }
          resolve(true);
        };
        request.onupgradeneeded = () => {
          preExist = false;
        };
        request.onerror = () => {
          reject(request.error?.message || "");
        };
      } catch (error2) {
        reject(error2);
      }
    });
  }
  function replaceTemplate(template, data) {
    return template.replace(PATTERN, (_, key) => {
      const value = data[key];
      return value != null ? String(value) : `<${key}?>`;
    });
  }
  function jsonEval(str) {
    return JSON.parse(str);
  }
  function stringify(data) {
    return JSON.stringify(data);
  }
  function contains(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }
  function safeGet(obj, key) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    } else {
      return void 0;
    }
  }
  function isEmpty(obj) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }
  function map(obj, fn, contextObj) {
    const res = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        res[key] = fn.call(contextObj, obj[key], key, obj);
      }
    }
    return res;
  }
  function deepEqual(a, b) {
    if (a === b) {
      return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    for (const k of aKeys) {
      if (!bKeys.includes(k)) {
        return false;
      }
      const aProp = a[k];
      const bProp = b[k];
      if (isObject(aProp) && isObject(bProp)) {
        if (!deepEqual(aProp, bProp)) {
          return false;
        }
      } else if (aProp !== bProp) {
        return false;
      }
    }
    for (const k of bKeys) {
      if (!aKeys.includes(k)) {
        return false;
      }
    }
    return true;
  }
  function isObject(thing) {
    return thing !== null && typeof thing === "object";
  }
  function querystring(querystringParams) {
    const params = [];
    for (const [key, value] of Object.entries(querystringParams)) {
      if (Array.isArray(value)) {
        value.forEach((arrayVal) => {
          params.push(encodeURIComponent(key) + "=" + encodeURIComponent(arrayVal));
        });
      } else {
        params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
      }
    }
    return params.length ? "&" + params.join("&") : "";
  }
  function querystringDecode(querystring2) {
    const obj = {};
    const tokens = querystring2.replace(/^\?/, "").split("&");
    tokens.forEach((token) => {
      if (token) {
        const [key, value] = token.split("=");
        obj[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    return obj;
  }
  function extractQuerystring(url) {
    const queryStart = url.indexOf("?");
    if (!queryStart) {
      return "";
    }
    const fragmentStart = url.indexOf("#", queryStart);
    return url.substring(queryStart, fragmentStart > 0 ? fragmentStart : void 0);
  }
  function createSubscribe(executor, onNoObservers) {
    const proxy = new ObserverProxy(executor, onNoObservers);
    return proxy.subscribe.bind(proxy);
  }
  function implementsAnyMethods(obj, methods) {
    if (typeof obj !== "object" || obj === null) {
      return false;
    }
    for (const method of methods) {
      if (method in obj && typeof obj[method] === "function") {
        return true;
      }
    }
    return false;
  }
  function noop() {
  }
  function errorPrefix(fnName, argName) {
    return `${fnName} failed: ${argName} argument `;
  }
  function getModularInstance(service) {
    if (service && service._delegate) {
      return service._delegate;
    } else {
      return service;
    }
  }
  function isCloudWorkstation(url) {
    try {
      const host = url.startsWith("http://") || url.startsWith("https://") ? new URL(url).hostname : url;
      return host.endsWith(".cloudworkstations.dev");
    } catch {
      return false;
    }
  }
  async function pingServer(endpoint) {
    const result = await fetch(endpoint, {
      credentials: "include"
    });
    return result.ok;
  }
  var CONSTANTS, assert, assertionError, stringToByteArray$1, byteArrayToString, base64, DecodeBase64StringError, base64Encode, base64urlEncodeWithoutPadding, base64Decode, getDefaultsFromGlobal, getDefaultsFromEnvVariable, getDefaultsFromCookie, getDefaults, getDefaultEmulatorHost, getDefaultEmulatorHostnameAndPort, getDefaultAppConfig, getExperimentalSetting, Deferred, ERROR_NAME, FirebaseError, ErrorFactory, PATTERN, decode, isValidFormat, isAdmin, Sha1, ObserverProxy, stringToByteArray, stringLength, MAX_VALUE_MILLIS;
  var init_index_esm = __esm({
    "node_modules/@firebase/util/dist/index.esm.js"() {
      init_postinstall();
      CONSTANTS = {
        /**
         * @define {boolean} Whether this is the client Node.js SDK.
         */
        NODE_CLIENT: false,
        /**
         * @define {boolean} Whether this is the Admin Node.js SDK.
         */
        NODE_ADMIN: false,
        /**
         * Firebase SDK Version
         */
        SDK_VERSION: "${JSCORE_VERSION}"
      };
      assert = function(assertion, message) {
        if (!assertion) {
          throw assertionError(message);
        }
      };
      assertionError = function(message) {
        return new Error("Firebase Database (" + CONSTANTS.SDK_VERSION + ") INTERNAL ASSERT FAILED: " + message);
      };
      stringToByteArray$1 = function(str) {
        const out = [];
        let p = 0;
        for (let i = 0; i < str.length; i++) {
          let c = str.charCodeAt(i);
          if (c < 128) {
            out[p++] = c;
          } else if (c < 2048) {
            out[p++] = c >> 6 | 192;
            out[p++] = c & 63 | 128;
          } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
            c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
            out[p++] = c >> 18 | 240;
            out[p++] = c >> 12 & 63 | 128;
            out[p++] = c >> 6 & 63 | 128;
            out[p++] = c & 63 | 128;
          } else {
            out[p++] = c >> 12 | 224;
            out[p++] = c >> 6 & 63 | 128;
            out[p++] = c & 63 | 128;
          }
        }
        return out;
      };
      byteArrayToString = function(bytes) {
        const out = [];
        let pos = 0, c = 0;
        while (pos < bytes.length) {
          const c1 = bytes[pos++];
          if (c1 < 128) {
            out[c++] = String.fromCharCode(c1);
          } else if (c1 > 191 && c1 < 224) {
            const c2 = bytes[pos++];
            out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
          } else if (c1 > 239 && c1 < 365) {
            const c2 = bytes[pos++];
            const c3 = bytes[pos++];
            const c4 = bytes[pos++];
            const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
            out[c++] = String.fromCharCode(55296 + (u >> 10));
            out[c++] = String.fromCharCode(56320 + (u & 1023));
          } else {
            const c2 = bytes[pos++];
            const c3 = bytes[pos++];
            out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
          }
        }
        return out.join("");
      };
      base64 = {
        /**
         * Maps bytes to characters.
         */
        byteToCharMap_: null,
        /**
         * Maps characters to bytes.
         */
        charToByteMap_: null,
        /**
         * Maps bytes to websafe characters.
         * @private
         */
        byteToCharMapWebSafe_: null,
        /**
         * Maps websafe characters to bytes.
         * @private
         */
        charToByteMapWebSafe_: null,
        /**
         * Our default alphabet, shared between
         * ENCODED_VALS and ENCODED_VALS_WEBSAFE
         */
        ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        /**
         * Our default alphabet. Value 64 (=) is special; it means "nothing."
         */
        get ENCODED_VALS() {
          return this.ENCODED_VALS_BASE + "+/=";
        },
        /**
         * Our websafe alphabet.
         */
        get ENCODED_VALS_WEBSAFE() {
          return this.ENCODED_VALS_BASE + "-_.";
        },
        /**
         * Whether this browser supports the atob and btoa functions. This extension
         * started at Mozilla but is now implemented by many browsers. We use the
         * ASSUME_* variables to avoid pulling in the full useragent detection library
         * but still allowing the standard per-browser compilations.
         *
         */
        HAS_NATIVE_SUPPORT: typeof atob === "function",
        /**
         * Base64-encode an array of bytes.
         *
         * @param input An array of bytes (numbers with
         *     value in [0, 255]) to encode.
         * @param webSafe Boolean indicating we should use the
         *     alternative alphabet.
         * @return The base64 encoded string.
         */
        encodeByteArray(input, webSafe) {
          if (!Array.isArray(input)) {
            throw Error("encodeByteArray takes an array as a parameter");
          }
          this.init_();
          const byteToCharMap = webSafe ? this.byteToCharMapWebSafe_ : this.byteToCharMap_;
          const output = [];
          for (let i = 0; i < input.length; i += 3) {
            const byte1 = input[i];
            const haveByte2 = i + 1 < input.length;
            const byte2 = haveByte2 ? input[i + 1] : 0;
            const haveByte3 = i + 2 < input.length;
            const byte3 = haveByte3 ? input[i + 2] : 0;
            const outByte1 = byte1 >> 2;
            const outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
            let outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
            let outByte4 = byte3 & 63;
            if (!haveByte3) {
              outByte4 = 64;
              if (!haveByte2) {
                outByte3 = 64;
              }
            }
            output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
          }
          return output.join("");
        },
        /**
         * Base64-encode a string.
         *
         * @param input A string to encode.
         * @param webSafe If true, we should use the
         *     alternative alphabet.
         * @return The base64 encoded string.
         */
        encodeString(input, webSafe) {
          if (this.HAS_NATIVE_SUPPORT && !webSafe) {
            return btoa(input);
          }
          return this.encodeByteArray(stringToByteArray$1(input), webSafe);
        },
        /**
         * Base64-decode a string.
         *
         * @param input to decode.
         * @param webSafe True if we should use the
         *     alternative alphabet.
         * @return string representing the decoded value.
         */
        decodeString(input, webSafe) {
          if (this.HAS_NATIVE_SUPPORT && !webSafe) {
            return atob(input);
          }
          return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
        },
        /**
         * Base64-decode a string.
         *
         * In base-64 decoding, groups of four characters are converted into three
         * bytes.  If the encoder did not apply padding, the input length may not
         * be a multiple of 4.
         *
         * In this case, the last group will have fewer than 4 characters, and
         * padding will be inferred.  If the group has one or two characters, it decodes
         * to one byte.  If the group has three characters, it decodes to two bytes.
         *
         * @param input Input to decode.
         * @param webSafe True if we should use the web-safe alphabet.
         * @return bytes representing the decoded value.
         */
        decodeStringToByteArray(input, webSafe) {
          this.init_();
          const charToByteMap = webSafe ? this.charToByteMapWebSafe_ : this.charToByteMap_;
          const output = [];
          for (let i = 0; i < input.length; ) {
            const byte1 = charToByteMap[input.charAt(i++)];
            const haveByte2 = i < input.length;
            const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
            ++i;
            const haveByte3 = i < input.length;
            const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
            ++i;
            const haveByte4 = i < input.length;
            const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
            ++i;
            if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
              throw new DecodeBase64StringError();
            }
            const outByte1 = byte1 << 2 | byte2 >> 4;
            output.push(outByte1);
            if (byte3 !== 64) {
              const outByte2 = byte2 << 4 & 240 | byte3 >> 2;
              output.push(outByte2);
              if (byte4 !== 64) {
                const outByte3 = byte3 << 6 & 192 | byte4;
                output.push(outByte3);
              }
            }
          }
          return output;
        },
        /**
         * Lazy static initialization function. Called before
         * accessing any of the static map variables.
         * @private
         */
        init_() {
          if (!this.byteToCharMap_) {
            this.byteToCharMap_ = {};
            this.charToByteMap_ = {};
            this.byteToCharMapWebSafe_ = {};
            this.charToByteMapWebSafe_ = {};
            for (let i = 0; i < this.ENCODED_VALS.length; i++) {
              this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
              this.charToByteMap_[this.byteToCharMap_[i]] = i;
              this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
              this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
              if (i >= this.ENCODED_VALS_BASE.length) {
                this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
                this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
              }
            }
          }
        }
      };
      DecodeBase64StringError = class extends Error {
        constructor() {
          super(...arguments);
          this.name = "DecodeBase64StringError";
        }
      };
      base64Encode = function(str) {
        const utf8Bytes = stringToByteArray$1(str);
        return base64.encodeByteArray(utf8Bytes, true);
      };
      base64urlEncodeWithoutPadding = function(str) {
        return base64Encode(str).replace(/\./g, "");
      };
      base64Decode = function(str) {
        try {
          return base64.decodeString(str, true);
        } catch (e) {
          console.error("base64Decode failed: ", e);
        }
        return null;
      };
      getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
      getDefaultsFromEnvVariable = () => {
        if (typeof process === "undefined" || typeof process.env === "undefined") {
          return;
        }
        const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
        if (defaultsJsonString) {
          return JSON.parse(defaultsJsonString);
        }
      };
      getDefaultsFromCookie = () => {
        if (typeof document === "undefined") {
          return;
        }
        let match;
        try {
          match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
        } catch (e) {
          return;
        }
        const decoded = match && base64Decode(match[1]);
        return decoded && JSON.parse(decoded);
      };
      getDefaults = () => {
        try {
          return getDefaultsFromPostinstall() || getDefaultsFromGlobal() || getDefaultsFromEnvVariable() || getDefaultsFromCookie();
        } catch (e) {
          console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
          return;
        }
      };
      getDefaultEmulatorHost = (productName) => getDefaults()?.emulatorHosts?.[productName];
      getDefaultEmulatorHostnameAndPort = (productName) => {
        const host = getDefaultEmulatorHost(productName);
        if (!host) {
          return void 0;
        }
        const separatorIndex = host.lastIndexOf(":");
        if (separatorIndex <= 0 || separatorIndex + 1 === host.length) {
          throw new Error(`Invalid host ${host} with no separate hostname and port!`);
        }
        const port = parseInt(host.substring(separatorIndex + 1), 10);
        if (host[0] === "[") {
          return [host.substring(1, separatorIndex - 1), port];
        } else {
          return [host.substring(0, separatorIndex), port];
        }
      };
      getDefaultAppConfig = () => getDefaults()?.config;
      getExperimentalSetting = (name5) => getDefaults()?.[`_${name5}`];
      Deferred = class {
        constructor() {
          this.reject = () => {
          };
          this.resolve = () => {
          };
          this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
          });
        }
        /**
         * Our API internals are not promisified and cannot because our callback APIs have subtle expectations around
         * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
         * and returns a node-style callback which will resolve or reject the Deferred's promise.
         */
        wrapCallback(callback) {
          return (error2, value) => {
            if (error2) {
              this.reject(error2);
            } else {
              this.resolve(value);
            }
            if (typeof callback === "function") {
              this.promise.catch(() => {
              });
              if (callback.length === 1) {
                callback(error2);
              } else {
                callback(error2, value);
              }
            }
          };
        }
      };
      ERROR_NAME = "FirebaseError";
      FirebaseError = class _FirebaseError extends Error {
        constructor(code, message, customData) {
          super(message);
          this.code = code;
          this.customData = customData;
          this.name = ERROR_NAME;
          Object.setPrototypeOf(this, _FirebaseError.prototype);
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrorFactory.prototype.create);
          }
        }
      };
      ErrorFactory = class {
        constructor(service, serviceName, errors) {
          this.service = service;
          this.serviceName = serviceName;
          this.errors = errors;
        }
        create(code, ...data) {
          const customData = data[0] || {};
          const fullCode = `${this.service}/${code}`;
          const template = this.errors[code];
          const message = template ? replaceTemplate(template, customData) : "Error";
          const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
          const error2 = new FirebaseError(fullCode, fullMessage, customData);
          return error2;
        }
      };
      PATTERN = /\{\$([^}]+)}/g;
      decode = function(token) {
        let header = {}, claims = {}, data = {}, signature = "";
        try {
          const parts = token.split(".");
          header = jsonEval(base64Decode(parts[0]) || "");
          claims = jsonEval(base64Decode(parts[1]) || "");
          signature = parts[2];
          data = claims["d"] || {};
          delete claims["d"];
        } catch (e) {
        }
        return {
          header,
          claims,
          data,
          signature
        };
      };
      isValidFormat = function(token) {
        const decoded = decode(token), claims = decoded.claims;
        return !!claims && typeof claims === "object" && claims.hasOwnProperty("iat");
      };
      isAdmin = function(token) {
        const claims = decode(token).claims;
        return typeof claims === "object" && claims["admin"] === true;
      };
      Sha1 = class {
        constructor() {
          this.chain_ = [];
          this.buf_ = [];
          this.W_ = [];
          this.pad_ = [];
          this.inbuf_ = 0;
          this.total_ = 0;
          this.blockSize = 512 / 8;
          this.pad_[0] = 128;
          for (let i = 1; i < this.blockSize; ++i) {
            this.pad_[i] = 0;
          }
          this.reset();
        }
        reset() {
          this.chain_[0] = 1732584193;
          this.chain_[1] = 4023233417;
          this.chain_[2] = 2562383102;
          this.chain_[3] = 271733878;
          this.chain_[4] = 3285377520;
          this.inbuf_ = 0;
          this.total_ = 0;
        }
        /**
         * Internal compress helper function.
         * @param buf Block to compress.
         * @param offset Offset of the block in the buffer.
         * @private
         */
        compress_(buf, offset) {
          if (!offset) {
            offset = 0;
          }
          const W = this.W_;
          if (typeof buf === "string") {
            for (let i = 0; i < 16; i++) {
              W[i] = buf.charCodeAt(offset) << 24 | buf.charCodeAt(offset + 1) << 16 | buf.charCodeAt(offset + 2) << 8 | buf.charCodeAt(offset + 3);
              offset += 4;
            }
          } else {
            for (let i = 0; i < 16; i++) {
              W[i] = buf[offset] << 24 | buf[offset + 1] << 16 | buf[offset + 2] << 8 | buf[offset + 3];
              offset += 4;
            }
          }
          for (let i = 16; i < 80; i++) {
            const t = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
            W[i] = (t << 1 | t >>> 31) & 4294967295;
          }
          let a = this.chain_[0];
          let b = this.chain_[1];
          let c = this.chain_[2];
          let d = this.chain_[3];
          let e = this.chain_[4];
          let f, k;
          for (let i = 0; i < 80; i++) {
            if (i < 40) {
              if (i < 20) {
                f = d ^ b & (c ^ d);
                k = 1518500249;
              } else {
                f = b ^ c ^ d;
                k = 1859775393;
              }
            } else {
              if (i < 60) {
                f = b & c | d & (b | c);
                k = 2400959708;
              } else {
                f = b ^ c ^ d;
                k = 3395469782;
              }
            }
            const t = (a << 5 | a >>> 27) + f + e + k + W[i] & 4294967295;
            e = d;
            d = c;
            c = (b << 30 | b >>> 2) & 4294967295;
            b = a;
            a = t;
          }
          this.chain_[0] = this.chain_[0] + a & 4294967295;
          this.chain_[1] = this.chain_[1] + b & 4294967295;
          this.chain_[2] = this.chain_[2] + c & 4294967295;
          this.chain_[3] = this.chain_[3] + d & 4294967295;
          this.chain_[4] = this.chain_[4] + e & 4294967295;
        }
        update(bytes, length) {
          if (bytes == null) {
            return;
          }
          if (length === void 0) {
            length = bytes.length;
          }
          const lengthMinusBlock = length - this.blockSize;
          let n = 0;
          const buf = this.buf_;
          let inbuf = this.inbuf_;
          while (n < length) {
            if (inbuf === 0) {
              while (n <= lengthMinusBlock) {
                this.compress_(bytes, n);
                n += this.blockSize;
              }
            }
            if (typeof bytes === "string") {
              while (n < length) {
                buf[inbuf] = bytes.charCodeAt(n);
                ++inbuf;
                ++n;
                if (inbuf === this.blockSize) {
                  this.compress_(buf);
                  inbuf = 0;
                  break;
                }
              }
            } else {
              while (n < length) {
                buf[inbuf] = bytes[n];
                ++inbuf;
                ++n;
                if (inbuf === this.blockSize) {
                  this.compress_(buf);
                  inbuf = 0;
                  break;
                }
              }
            }
          }
          this.inbuf_ = inbuf;
          this.total_ += length;
        }
        /** @override */
        digest() {
          const digest = [];
          let totalBits = this.total_ * 8;
          if (this.inbuf_ < 56) {
            this.update(this.pad_, 56 - this.inbuf_);
          } else {
            this.update(this.pad_, this.blockSize - (this.inbuf_ - 56));
          }
          for (let i = this.blockSize - 1; i >= 56; i--) {
            this.buf_[i] = totalBits & 255;
            totalBits /= 256;
          }
          this.compress_(this.buf_);
          let n = 0;
          for (let i = 0; i < 5; i++) {
            for (let j = 24; j >= 0; j -= 8) {
              digest[n] = this.chain_[i] >> j & 255;
              ++n;
            }
          }
          return digest;
        }
      };
      ObserverProxy = class {
        /**
         * @param executor Function which can make calls to a single Observer
         *     as a proxy.
         * @param onNoObservers Callback when count of Observers goes to zero.
         */
        constructor(executor, onNoObservers) {
          this.observers = [];
          this.unsubscribes = [];
          this.observerCount = 0;
          this.task = Promise.resolve();
          this.finalized = false;
          this.onNoObservers = onNoObservers;
          this.task.then(() => {
            executor(this);
          }).catch((e) => {
            this.error(e);
          });
        }
        next(value) {
          this.forEachObserver((observer) => {
            observer.next(value);
          });
        }
        error(error2) {
          this.forEachObserver((observer) => {
            observer.error(error2);
          });
          this.close(error2);
        }
        complete() {
          this.forEachObserver((observer) => {
            observer.complete();
          });
          this.close();
        }
        /**
         * Subscribe function that can be used to add an Observer to the fan-out list.
         *
         * - We require that no event is sent to a subscriber synchronously to their
         *   call to subscribe().
         */
        subscribe(nextOrObserver, error2, complete) {
          let observer;
          if (nextOrObserver === void 0 && error2 === void 0 && complete === void 0) {
            throw new Error("Missing Observer.");
          }
          if (implementsAnyMethods(nextOrObserver, [
            "next",
            "error",
            "complete"
          ])) {
            observer = nextOrObserver;
          } else {
            observer = {
              next: nextOrObserver,
              error: error2,
              complete
            };
          }
          if (observer.next === void 0) {
            observer.next = noop;
          }
          if (observer.error === void 0) {
            observer.error = noop;
          }
          if (observer.complete === void 0) {
            observer.complete = noop;
          }
          const unsub = this.unsubscribeOne.bind(this, this.observers.length);
          if (this.finalized) {
            this.task.then(() => {
              try {
                if (this.finalError) {
                  observer.error(this.finalError);
                } else {
                  observer.complete();
                }
              } catch (e) {
              }
              return;
            });
          }
          this.observers.push(observer);
          return unsub;
        }
        // Unsubscribe is synchronous - we guarantee that no events are sent to
        // any unsubscribed Observer.
        unsubscribeOne(i) {
          if (this.observers === void 0 || this.observers[i] === void 0) {
            return;
          }
          delete this.observers[i];
          this.observerCount -= 1;
          if (this.observerCount === 0 && this.onNoObservers !== void 0) {
            this.onNoObservers(this);
          }
        }
        forEachObserver(fn) {
          if (this.finalized) {
            return;
          }
          for (let i = 0; i < this.observers.length; i++) {
            this.sendOne(i, fn);
          }
        }
        // Call the Observer via one of it's callback function. We are careful to
        // confirm that the observe has not been unsubscribed since this asynchronous
        // function had been queued.
        sendOne(i, fn) {
          this.task.then(() => {
            if (this.observers !== void 0 && this.observers[i] !== void 0) {
              try {
                fn(this.observers[i]);
              } catch (e) {
                if (typeof console !== "undefined" && console.error) {
                  console.error(e);
                }
              }
            }
          });
        }
        close(err) {
          if (this.finalized) {
            return;
          }
          this.finalized = true;
          if (err !== void 0) {
            this.finalError = err;
          }
          this.task.then(() => {
            this.observers = void 0;
            this.onNoObservers = void 0;
          });
        }
      };
      stringToByteArray = function(str) {
        const out = [];
        let p = 0;
        for (let i = 0; i < str.length; i++) {
          let c = str.charCodeAt(i);
          if (c >= 55296 && c <= 56319) {
            const high = c - 55296;
            i++;
            assert(i < str.length, "Surrogate pair missing trail surrogate.");
            const low = str.charCodeAt(i) - 56320;
            c = 65536 + (high << 10) + low;
          }
          if (c < 128) {
            out[p++] = c;
          } else if (c < 2048) {
            out[p++] = c >> 6 | 192;
            out[p++] = c & 63 | 128;
          } else if (c < 65536) {
            out[p++] = c >> 12 | 224;
            out[p++] = c >> 6 & 63 | 128;
            out[p++] = c & 63 | 128;
          } else {
            out[p++] = c >> 18 | 240;
            out[p++] = c >> 12 & 63 | 128;
            out[p++] = c >> 6 & 63 | 128;
            out[p++] = c & 63 | 128;
          }
        }
        return out;
      };
      stringLength = function(str) {
        let p = 0;
        for (let i = 0; i < str.length; i++) {
          const c = str.charCodeAt(i);
          if (c < 128) {
            p++;
          } else if (c < 2048) {
            p += 2;
          } else if (c >= 55296 && c <= 56319) {
            p += 4;
            i++;
          } else {
            p += 3;
          }
        }
        return p;
      };
      MAX_VALUE_MILLIS = 4 * 60 * 60 * 1e3;
    }
  });

  // node_modules/@firebase/component/dist/esm/index.esm.js
  function normalizeIdentifierForFactory(identifier) {
    return identifier === DEFAULT_ENTRY_NAME ? void 0 : identifier;
  }
  function isComponentEager(component) {
    return component.instantiationMode === "EAGER";
  }
  var Component, DEFAULT_ENTRY_NAME, Provider, ComponentContainer;
  var init_index_esm2 = __esm({
    "node_modules/@firebase/component/dist/esm/index.esm.js"() {
      init_index_esm();
      Component = class {
        /**
         *
         * @param name The public service name, e.g. app, auth, firestore, database
         * @param instanceFactory Service factory responsible for creating the public interface
         * @param type whether the service provided by the component is public or private
         */
        constructor(name5, instanceFactory, type) {
          this.name = name5;
          this.instanceFactory = instanceFactory;
          this.type = type;
          this.multipleInstances = false;
          this.serviceProps = {};
          this.instantiationMode = "LAZY";
          this.onInstanceCreated = null;
        }
        setInstantiationMode(mode) {
          this.instantiationMode = mode;
          return this;
        }
        setMultipleInstances(multipleInstances) {
          this.multipleInstances = multipleInstances;
          return this;
        }
        setServiceProps(props) {
          this.serviceProps = props;
          return this;
        }
        setInstanceCreatedCallback(callback) {
          this.onInstanceCreated = callback;
          return this;
        }
      };
      DEFAULT_ENTRY_NAME = "[DEFAULT]";
      Provider = class {
        constructor(name5, container) {
          this.name = name5;
          this.container = container;
          this.component = null;
          this.instances = /* @__PURE__ */ new Map();
          this.instancesDeferred = /* @__PURE__ */ new Map();
          this.instancesOptions = /* @__PURE__ */ new Map();
          this.onInitCallbacks = /* @__PURE__ */ new Map();
        }
        /**
         * @param identifier A provider can provide multiple instances of a service
         * if this.component.multipleInstances is true.
         */
        get(identifier) {
          const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
          if (!this.instancesDeferred.has(normalizedIdentifier)) {
            const deferred = new Deferred();
            this.instancesDeferred.set(normalizedIdentifier, deferred);
            if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
              try {
                const instance = this.getOrInitializeService({
                  instanceIdentifier: normalizedIdentifier
                });
                if (instance) {
                  deferred.resolve(instance);
                }
              } catch (e) {
              }
            }
          }
          return this.instancesDeferred.get(normalizedIdentifier).promise;
        }
        getImmediate(options) {
          const normalizedIdentifier = this.normalizeInstanceIdentifier(options?.identifier);
          const optional = options?.optional ?? false;
          if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
            try {
              return this.getOrInitializeService({
                instanceIdentifier: normalizedIdentifier
              });
            } catch (e) {
              if (optional) {
                return null;
              } else {
                throw e;
              }
            }
          } else {
            if (optional) {
              return null;
            } else {
              throw Error(`Service ${this.name} is not available`);
            }
          }
        }
        getComponent() {
          return this.component;
        }
        setComponent(component) {
          if (component.name !== this.name) {
            throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
          }
          if (this.component) {
            throw Error(`Component for ${this.name} has already been provided`);
          }
          this.component = component;
          if (!this.shouldAutoInitialize()) {
            return;
          }
          if (isComponentEager(component)) {
            try {
              this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
            } catch (e) {
            }
          }
          for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            try {
              const instance = this.getOrInitializeService({
                instanceIdentifier: normalizedIdentifier
              });
              instanceDeferred.resolve(instance);
            } catch (e) {
            }
          }
        }
        clearInstance(identifier = DEFAULT_ENTRY_NAME) {
          this.instancesDeferred.delete(identifier);
          this.instancesOptions.delete(identifier);
          this.instances.delete(identifier);
        }
        // app.delete() will call this method on every provider to delete the services
        // TODO: should we mark the provider as deleted?
        async delete() {
          const services = Array.from(this.instances.values());
          await Promise.all([
            ...services.filter((service) => "INTERNAL" in service).map((service) => service.INTERNAL.delete()),
            ...services.filter((service) => "_delete" in service).map((service) => service._delete())
          ]);
        }
        isComponentSet() {
          return this.component != null;
        }
        isInitialized(identifier = DEFAULT_ENTRY_NAME) {
          return this.instances.has(identifier);
        }
        getOptions(identifier = DEFAULT_ENTRY_NAME) {
          return this.instancesOptions.get(identifier) || {};
        }
        initialize(opts = {}) {
          const { options = {} } = opts;
          const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
          if (this.isInitialized(normalizedIdentifier)) {
            throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
          }
          if (!this.isComponentSet()) {
            throw Error(`Component ${this.name} has not been registered yet`);
          }
          const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier,
            options
          });
          for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            if (normalizedIdentifier === normalizedDeferredIdentifier) {
              instanceDeferred.resolve(instance);
            }
          }
          return instance;
        }
        /**
         *
         * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
         * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
         *
         * @param identifier An optional instance identifier
         * @returns a function to unregister the callback
         */
        onInit(callback, identifier) {
          const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
          const existingCallbacks = this.onInitCallbacks.get(normalizedIdentifier) ?? /* @__PURE__ */ new Set();
          existingCallbacks.add(callback);
          this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
          const existingInstance = this.instances.get(normalizedIdentifier);
          if (existingInstance) {
            callback(existingInstance, normalizedIdentifier);
          }
          return () => {
            existingCallbacks.delete(callback);
          };
        }
        /**
         * Invoke onInit callbacks synchronously
         * @param instance the service instance`
         */
        invokeOnInitCallbacks(instance, identifier) {
          const callbacks = this.onInitCallbacks.get(identifier);
          if (!callbacks) {
            return;
          }
          for (const callback of callbacks) {
            try {
              callback(instance, identifier);
            } catch {
            }
          }
        }
        getOrInitializeService({ instanceIdentifier, options = {} }) {
          let instance = this.instances.get(instanceIdentifier);
          if (!instance && this.component) {
            instance = this.component.instanceFactory(this.container, {
              instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
              options
            });
            this.instances.set(instanceIdentifier, instance);
            this.instancesOptions.set(instanceIdentifier, options);
            this.invokeOnInitCallbacks(instance, instanceIdentifier);
            if (this.component.onInstanceCreated) {
              try {
                this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
              } catch {
              }
            }
          }
          return instance || null;
        }
        normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
          if (this.component) {
            return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
          } else {
            return identifier;
          }
        }
        shouldAutoInitialize() {
          return !!this.component && this.component.instantiationMode !== "EXPLICIT";
        }
      };
      ComponentContainer = class {
        constructor(name5) {
          this.name = name5;
          this.providers = /* @__PURE__ */ new Map();
        }
        /**
         *
         * @param component Component being added
         * @param overwrite When a component with the same name has already been registered,
         * if overwrite is true: overwrite the existing component with the new component and create a new
         * provider with the new component. It can be useful in tests where you want to use different mocks
         * for different tests.
         * if overwrite is false: throw an exception
         */
        addComponent(component) {
          const provider = this.getProvider(component.name);
          if (provider.isComponentSet()) {
            throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
          }
          provider.setComponent(component);
        }
        addOrOverwriteComponent(component) {
          const provider = this.getProvider(component.name);
          if (provider.isComponentSet()) {
            this.providers.delete(component.name);
          }
          this.addComponent(component);
        }
        /**
         * getProvider provides a type safe interface where it can only be called with a field name
         * present in NameServiceMapping interface.
         *
         * Firebase SDKs providing services should extend NameServiceMapping interface to register
         * themselves.
         */
        getProvider(name5) {
          if (this.providers.has(name5)) {
            return this.providers.get(name5);
          }
          const provider = new Provider(name5, this);
          this.providers.set(name5, provider);
          return provider;
        }
        getProviders() {
          return Array.from(this.providers.values());
        }
      };
    }
  });

  // node_modules/@firebase/logger/dist/esm/index.esm.js
  var instances, LogLevel, levelStringToEnum, defaultLogLevel, ConsoleMethod, defaultLogHandler, Logger;
  var init_index_esm3 = __esm({
    "node_modules/@firebase/logger/dist/esm/index.esm.js"() {
      instances = [];
      (function(LogLevel2) {
        LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
        LogLevel2[LogLevel2["VERBOSE"] = 1] = "VERBOSE";
        LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
        LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
        LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
        LogLevel2[LogLevel2["SILENT"] = 5] = "SILENT";
      })(LogLevel || (LogLevel = {}));
      levelStringToEnum = {
        "debug": LogLevel.DEBUG,
        "verbose": LogLevel.VERBOSE,
        "info": LogLevel.INFO,
        "warn": LogLevel.WARN,
        "error": LogLevel.ERROR,
        "silent": LogLevel.SILENT
      };
      defaultLogLevel = LogLevel.INFO;
      ConsoleMethod = {
        [LogLevel.DEBUG]: "log",
        [LogLevel.VERBOSE]: "log",
        [LogLevel.INFO]: "info",
        [LogLevel.WARN]: "warn",
        [LogLevel.ERROR]: "error"
      };
      defaultLogHandler = (instance, logType, ...args) => {
        if (logType < instance.logLevel) {
          return;
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const method = ConsoleMethod[logType];
        if (method) {
          console[method](`[${now}]  ${instance.name}:`, ...args);
        } else {
          throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
        }
      };
      Logger = class {
        /**
         * Gives you an instance of a Logger to capture messages according to
         * Firebase's logging scheme.
         *
         * @param name The name that the logs will be associated with
         */
        constructor(name5) {
          this.name = name5;
          this._logLevel = defaultLogLevel;
          this._logHandler = defaultLogHandler;
          this._userLogHandler = null;
          instances.push(this);
        }
        get logLevel() {
          return this._logLevel;
        }
        set logLevel(val) {
          if (!(val in LogLevel)) {
            throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
          }
          this._logLevel = val;
        }
        // Workaround for setter/getter having to be the same type.
        setLogLevel(val) {
          this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
        }
        get logHandler() {
          return this._logHandler;
        }
        set logHandler(val) {
          if (typeof val !== "function") {
            throw new TypeError("Value assigned to `logHandler` must be a function");
          }
          this._logHandler = val;
        }
        get userLogHandler() {
          return this._userLogHandler;
        }
        set userLogHandler(val) {
          this._userLogHandler = val;
        }
        /**
         * The functions below are all based on the `console` interface
         */
        debug(...args) {
          this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
          this._logHandler(this, LogLevel.DEBUG, ...args);
        }
        log(...args) {
          this._userLogHandler && this._userLogHandler(this, LogLevel.VERBOSE, ...args);
          this._logHandler(this, LogLevel.VERBOSE, ...args);
        }
        info(...args) {
          this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
          this._logHandler(this, LogLevel.INFO, ...args);
        }
        warn(...args) {
          this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
          this._logHandler(this, LogLevel.WARN, ...args);
        }
        error(...args) {
          this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
          this._logHandler(this, LogLevel.ERROR, ...args);
        }
      };
    }
  });

  // node_modules/idb/build/wrap-idb-value.js
  function getIdbProxyableTypes() {
    return idbProxyableTypes || (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction
    ]);
  }
  function getCursorAdvanceMethods() {
    return cursorAdvanceMethods || (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey
    ]);
  }
  function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
      const unlisten = () => {
        request.removeEventListener("success", success);
        request.removeEventListener("error", error2);
      };
      const success = () => {
        resolve(wrap(request.result));
        unlisten();
      };
      const error2 = () => {
        reject(request.error);
        unlisten();
      };
      request.addEventListener("success", success);
      request.addEventListener("error", error2);
    });
    promise.then((value) => {
      if (value instanceof IDBCursor) {
        cursorRequestMap.set(value, request);
      }
    }).catch(() => {
    });
    reverseTransformCache.set(promise, request);
    return promise;
  }
  function cacheDonePromiseForTransaction(tx) {
    if (transactionDoneMap.has(tx))
      return;
    const done = new Promise((resolve, reject) => {
      const unlisten = () => {
        tx.removeEventListener("complete", complete);
        tx.removeEventListener("error", error2);
        tx.removeEventListener("abort", error2);
      };
      const complete = () => {
        resolve();
        unlisten();
      };
      const error2 = () => {
        reject(tx.error || new DOMException("AbortError", "AbortError"));
        unlisten();
      };
      tx.addEventListener("complete", complete);
      tx.addEventListener("error", error2);
      tx.addEventListener("abort", error2);
    });
    transactionDoneMap.set(tx, done);
  }
  function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
  }
  function wrapFunction(func) {
    if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
      return function(storeNames, ...args) {
        const tx = func.call(unwrap(this), storeNames, ...args);
        transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
        return wrap(tx);
      };
    }
    if (getCursorAdvanceMethods().includes(func)) {
      return function(...args) {
        func.apply(unwrap(this), args);
        return wrap(cursorRequestMap.get(this));
      };
    }
    return function(...args) {
      return wrap(func.apply(unwrap(this), args));
    };
  }
  function transformCachableValue(value) {
    if (typeof value === "function")
      return wrapFunction(value);
    if (value instanceof IDBTransaction)
      cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
      return new Proxy(value, idbProxyTraps);
    return value;
  }
  function wrap(value) {
    if (value instanceof IDBRequest)
      return promisifyRequest(value);
    if (transformCache.has(value))
      return transformCache.get(value);
    const newValue = transformCachableValue(value);
    if (newValue !== value) {
      transformCache.set(value, newValue);
      reverseTransformCache.set(newValue, value);
    }
    return newValue;
  }
  var instanceOfAny, idbProxyableTypes, cursorAdvanceMethods, cursorRequestMap, transactionDoneMap, transactionStoreNamesMap, transformCache, reverseTransformCache, idbProxyTraps, unwrap;
  var init_wrap_idb_value = __esm({
    "node_modules/idb/build/wrap-idb-value.js"() {
      instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
      cursorRequestMap = /* @__PURE__ */ new WeakMap();
      transactionDoneMap = /* @__PURE__ */ new WeakMap();
      transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
      transformCache = /* @__PURE__ */ new WeakMap();
      reverseTransformCache = /* @__PURE__ */ new WeakMap();
      idbProxyTraps = {
        get(target, prop, receiver) {
          if (target instanceof IDBTransaction) {
            if (prop === "done")
              return transactionDoneMap.get(target);
            if (prop === "objectStoreNames") {
              return target.objectStoreNames || transactionStoreNamesMap.get(target);
            }
            if (prop === "store") {
              return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
            }
          }
          return wrap(target[prop]);
        },
        set(target, prop, value) {
          target[prop] = value;
          return true;
        },
        has(target, prop) {
          if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
            return true;
          }
          return prop in target;
        }
      };
      unwrap = (value) => reverseTransformCache.get(value);
    }
  });

  // node_modules/idb/build/index.js
  function openDB(name5, version5, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name5, version5);
    const openPromise = wrap(request);
    if (upgrade) {
      request.addEventListener("upgradeneeded", (event) => {
        upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
      });
    }
    if (blocked) {
      request.addEventListener("blocked", (event) => blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion,
        event.newVersion,
        event
      ));
    }
    openPromise.then((db) => {
      if (terminated)
        db.addEventListener("close", () => terminated());
      if (blocking) {
        db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
      }
    }).catch(() => {
    });
    return openPromise;
  }
  function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
      return;
    }
    if (cachedMethods.get(prop))
      return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, "");
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
      // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
      !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
    ) {
      return;
    }
    const method = async function(storeName, ...args) {
      const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
      let target2 = tx.store;
      if (useIndex)
        target2 = target2.index(args.shift());
      return (await Promise.all([
        target2[targetFuncName](...args),
        isWrite && tx.done
      ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
  }
  var readMethods, writeMethods, cachedMethods;
  var init_build = __esm({
    "node_modules/idb/build/index.js"() {
      init_wrap_idb_value();
      init_wrap_idb_value();
      readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
      writeMethods = ["put", "add", "delete", "clear"];
      cachedMethods = /* @__PURE__ */ new Map();
      replaceTraps((oldTraps) => ({
        ...oldTraps,
        get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
        has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
      }));
    }
  });

  // node_modules/@firebase/app/dist/esm/index.esm.js
  function isVersionServiceProvider(provider) {
    const component = provider.getComponent();
    return component?.type === "VERSION";
  }
  function _addComponent(app, component) {
    try {
      app.container.addComponent(component);
    } catch (e) {
      logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
    }
  }
  function _registerComponent(component) {
    const componentName = component.name;
    if (_components.has(componentName)) {
      logger.debug(`There were multiple attempts to register component ${componentName}.`);
      return false;
    }
    _components.set(componentName, component);
    for (const app of _apps.values()) {
      _addComponent(app, component);
    }
    for (const serverApp of _serverApps.values()) {
      _addComponent(serverApp, component);
    }
    return true;
  }
  function _getProvider(app, name5) {
    const heartbeatController = app.container.getProvider("heartbeat").getImmediate({ optional: true });
    if (heartbeatController) {
      void heartbeatController.triggerHeartbeat();
    }
    return app.container.getProvider(name5);
  }
  function _isFirebaseServerApp(obj) {
    if (obj === null || obj === void 0) {
      return false;
    }
    return obj.settings !== void 0;
  }
  function initializeApp(_options, rawConfig = {}) {
    let options = _options;
    if (typeof rawConfig !== "object") {
      const name6 = rawConfig;
      rawConfig = { name: name6 };
    }
    const config = {
      name: DEFAULT_ENTRY_NAME2,
      automaticDataCollectionEnabled: true,
      ...rawConfig
    };
    const name5 = config.name;
    if (typeof name5 !== "string" || !name5) {
      throw ERROR_FACTORY.create("bad-app-name", {
        appName: String(name5)
      });
    }
    options || (options = getDefaultAppConfig());
    if (!options) {
      throw ERROR_FACTORY.create(
        "no-options"
        /* AppError.NO_OPTIONS */
      );
    }
    const existingApp = _apps.get(name5);
    if (existingApp) {
      if (deepEqual(options, existingApp.options) && deepEqual(config, existingApp.config)) {
        return existingApp;
      } else {
        throw ERROR_FACTORY.create("duplicate-app", { appName: name5 });
      }
    }
    const container = new ComponentContainer(name5);
    for (const component of _components.values()) {
      container.addComponent(component);
    }
    const newApp = new FirebaseAppImpl(options, config, container);
    _apps.set(name5, newApp);
    return newApp;
  }
  function getApp(name5 = DEFAULT_ENTRY_NAME2) {
    const app = _apps.get(name5);
    if (!app && name5 === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
      return initializeApp();
    }
    if (!app) {
      throw ERROR_FACTORY.create("no-app", { appName: name5 });
    }
    return app;
  }
  function registerVersion(libraryKeyOrName, version5, variant) {
    let library = PLATFORM_LOG_STRING[libraryKeyOrName] ?? libraryKeyOrName;
    if (variant) {
      library += `-${variant}`;
    }
    const libraryMismatch = library.match(/\s|\//);
    const versionMismatch = version5.match(/\s|\//);
    if (libraryMismatch || versionMismatch) {
      const warning = [
        `Unable to register library "${library}" with version "${version5}":`
      ];
      if (libraryMismatch) {
        warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
      }
      if (libraryMismatch && versionMismatch) {
        warning.push("and");
      }
      if (versionMismatch) {
        warning.push(`version name "${version5}" contains illegal characters (whitespace or "/")`);
      }
      logger.warn(warning.join(" "));
      return;
    }
    _registerComponent(new Component(
      `${library}-version`,
      () => ({ library, version: version5 }),
      "VERSION"
      /* ComponentType.VERSION */
    ));
  }
  function getDbPromise() {
    if (!dbPromise) {
      dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade: (db, oldVersion) => {
          switch (oldVersion) {
            case 0:
              try {
                db.createObjectStore(STORE_NAME);
              } catch (e) {
                console.warn(e);
              }
          }
        }
      }).catch((e) => {
        throw ERROR_FACTORY.create("idb-open", {
          originalErrorMessage: e.message
        });
      });
    }
    return dbPromise;
  }
  async function readHeartbeatsFromIndexedDB(app) {
    try {
      const db = await getDbPromise();
      const tx = db.transaction(STORE_NAME);
      const result = await tx.objectStore(STORE_NAME).get(computeKey(app));
      await tx.done;
      return result;
    } catch (e) {
      if (e instanceof FirebaseError) {
        logger.warn(e.message);
      } else {
        const idbGetError = ERROR_FACTORY.create("idb-get", {
          originalErrorMessage: e?.message
        });
        logger.warn(idbGetError.message);
      }
    }
  }
  async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
    try {
      const db = await getDbPromise();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const objectStore = tx.objectStore(STORE_NAME);
      await objectStore.put(heartbeatObject, computeKey(app));
      await tx.done;
    } catch (e) {
      if (e instanceof FirebaseError) {
        logger.warn(e.message);
      } else {
        const idbGetError = ERROR_FACTORY.create("idb-set", {
          originalErrorMessage: e?.message
        });
        logger.warn(idbGetError.message);
      }
    }
  }
  function computeKey(app) {
    return `${app.name}!${app.options.appId}`;
  }
  function getUTCDateString() {
    const today = /* @__PURE__ */ new Date();
    return today.toISOString().substring(0, 10);
  }
  function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
    const heartbeatsToSend = [];
    let unsentEntries = heartbeatsCache.slice();
    for (const singleDateHeartbeat of heartbeatsCache) {
      const heartbeatEntry = heartbeatsToSend.find((hb) => hb.agent === singleDateHeartbeat.agent);
      if (!heartbeatEntry) {
        heartbeatsToSend.push({
          agent: singleDateHeartbeat.agent,
          dates: [singleDateHeartbeat.date]
        });
        if (countBytes(heartbeatsToSend) > maxSize) {
          heartbeatsToSend.pop();
          break;
        }
      } else {
        heartbeatEntry.dates.push(singleDateHeartbeat.date);
        if (countBytes(heartbeatsToSend) > maxSize) {
          heartbeatEntry.dates.pop();
          break;
        }
      }
      unsentEntries = unsentEntries.slice(1);
    }
    return {
      heartbeatsToSend,
      unsentEntries
    };
  }
  function countBytes(heartbeatsCache) {
    return base64urlEncodeWithoutPadding(
      // heartbeatsCache wrapper properties
      JSON.stringify({ version: 2, heartbeats: heartbeatsCache })
    ).length;
  }
  function getEarliestHeartbeatIdx(heartbeats) {
    if (heartbeats.length === 0) {
      return -1;
    }
    let earliestHeartbeatIdx = 0;
    let earliestHeartbeatDate = heartbeats[0].date;
    for (let i = 1; i < heartbeats.length; i++) {
      if (heartbeats[i].date < earliestHeartbeatDate) {
        earliestHeartbeatDate = heartbeats[i].date;
        earliestHeartbeatIdx = i;
      }
    }
    return earliestHeartbeatIdx;
  }
  function registerCoreComponents(variant) {
    _registerComponent(new Component(
      "platform-logger",
      (container) => new PlatformLoggerServiceImpl(container),
      "PRIVATE"
      /* ComponentType.PRIVATE */
    ));
    _registerComponent(new Component(
      "heartbeat",
      (container) => new HeartbeatServiceImpl(container),
      "PRIVATE"
      /* ComponentType.PRIVATE */
    ));
    registerVersion(name$q, version$1, variant);
    registerVersion(name$q, version$1, "esm2020");
    registerVersion("fire-js", "");
  }
  var PlatformLoggerServiceImpl, name$q, version$1, logger, name$p, name$o, name$n, name$m, name$l, name$k, name$j, name$i, name$h, name$g, name$f, name$e, name$d, name$c, name$b, name$a, name$9, name$8, name$7, name$6, name$5, name$4, name$3, name$2, name$1, name, version, DEFAULT_ENTRY_NAME2, PLATFORM_LOG_STRING, _apps, _serverApps, _components, ERRORS, ERROR_FACTORY, FirebaseAppImpl, SDK_VERSION, DB_NAME, DB_VERSION, STORE_NAME, dbPromise, MAX_HEADER_BYTES, MAX_NUM_STORED_HEARTBEATS, HeartbeatServiceImpl, HeartbeatStorageImpl;
  var init_index_esm4 = __esm({
    "node_modules/@firebase/app/dist/esm/index.esm.js"() {
      init_index_esm2();
      init_index_esm3();
      init_index_esm();
      init_index_esm();
      init_build();
      PlatformLoggerServiceImpl = class {
        constructor(container) {
          this.container = container;
        }
        // In initial implementation, this will be called by installations on
        // auth token refresh, and installations will send this string.
        getPlatformInfoString() {
          const providers = this.container.getProviders();
          return providers.map((provider) => {
            if (isVersionServiceProvider(provider)) {
              const service = provider.getImmediate();
              return `${service.library}/${service.version}`;
            } else {
              return null;
            }
          }).filter((logString) => logString).join(" ");
        }
      };
      name$q = "@firebase/app";
      version$1 = "0.15.0";
      logger = new Logger("@firebase/app");
      name$p = "@firebase/app-compat";
      name$o = "@firebase/analytics-compat";
      name$n = "@firebase/analytics";
      name$m = "@firebase/app-check-compat";
      name$l = "@firebase/app-check";
      name$k = "@firebase/auth";
      name$j = "@firebase/auth-compat";
      name$i = "@firebase/database";
      name$h = "@firebase/data-connect";
      name$g = "@firebase/database-compat";
      name$f = "@firebase/functions";
      name$e = "@firebase/functions-compat";
      name$d = "@firebase/installations";
      name$c = "@firebase/installations-compat";
      name$b = "@firebase/messaging";
      name$a = "@firebase/messaging-compat";
      name$9 = "@firebase/performance";
      name$8 = "@firebase/performance-compat";
      name$7 = "@firebase/remote-config";
      name$6 = "@firebase/remote-config-compat";
      name$5 = "@firebase/storage";
      name$4 = "@firebase/storage-compat";
      name$3 = "@firebase/firestore";
      name$2 = "@firebase/ai";
      name$1 = "@firebase/firestore-compat";
      name = "firebase";
      version = "12.15.0";
      DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
      PLATFORM_LOG_STRING = {
        [name$q]: "fire-core",
        [name$p]: "fire-core-compat",
        [name$n]: "fire-analytics",
        [name$o]: "fire-analytics-compat",
        [name$l]: "fire-app-check",
        [name$m]: "fire-app-check-compat",
        [name$k]: "fire-auth",
        [name$j]: "fire-auth-compat",
        [name$i]: "fire-rtdb",
        [name$h]: "fire-data-connect",
        [name$g]: "fire-rtdb-compat",
        [name$f]: "fire-fn",
        [name$e]: "fire-fn-compat",
        [name$d]: "fire-iid",
        [name$c]: "fire-iid-compat",
        [name$b]: "fire-fcm",
        [name$a]: "fire-fcm-compat",
        [name$9]: "fire-perf",
        [name$8]: "fire-perf-compat",
        [name$7]: "fire-rc",
        [name$6]: "fire-rc-compat",
        [name$5]: "fire-gcs",
        [name$4]: "fire-gcs-compat",
        [name$3]: "fire-fst",
        [name$1]: "fire-fst-compat",
        [name$2]: "fire-vertex",
        "fire-js": "fire-js",
        // Platform identifier for JS SDK.
        [name]: "fire-js-all"
      };
      _apps = /* @__PURE__ */ new Map();
      _serverApps = /* @__PURE__ */ new Map();
      _components = /* @__PURE__ */ new Map();
      ERRORS = {
        [
          "no-app"
          /* AppError.NO_APP */
        ]: "No Firebase App '{$appName}' has been created - call initializeApp() first",
        [
          "bad-app-name"
          /* AppError.BAD_APP_NAME */
        ]: "Illegal App name: '{$appName}'",
        [
          "duplicate-app"
          /* AppError.DUPLICATE_APP */
        ]: "Firebase App named '{$appName}' already exists with different options or config",
        [
          "app-deleted"
          /* AppError.APP_DELETED */
        ]: "Firebase App named '{$appName}' already deleted",
        [
          "server-app-deleted"
          /* AppError.SERVER_APP_DELETED */
        ]: "Firebase Server App has been deleted",
        [
          "no-options"
          /* AppError.NO_OPTIONS */
        ]: "Need to provide options, when not being deployed to hosting via source.",
        [
          "invalid-app-argument"
          /* AppError.INVALID_APP_ARGUMENT */
        ]: "firebase.{$appName}() takes either no argument or a Firebase App instance.",
        [
          "invalid-log-argument"
          /* AppError.INVALID_LOG_ARGUMENT */
        ]: "First argument to `onLog` must be null or a function.",
        [
          "idb-open"
          /* AppError.IDB_OPEN */
        ]: "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
        [
          "idb-get"
          /* AppError.IDB_GET */
        ]: "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
        [
          "idb-set"
          /* AppError.IDB_WRITE */
        ]: "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
        [
          "idb-delete"
          /* AppError.IDB_DELETE */
        ]: "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
        [
          "finalization-registry-not-supported"
          /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */
        ]: "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
        [
          "invalid-server-app-environment"
          /* AppError.INVALID_SERVER_APP_ENVIRONMENT */
        ]: "FirebaseServerApp is not for use in browser environments."
      };
      ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);
      FirebaseAppImpl = class {
        constructor(options, config, container) {
          this._isDeleted = false;
          this._options = { ...options };
          this._config = { ...config };
          this._name = config.name;
          this._automaticDataCollectionEnabled = config.automaticDataCollectionEnabled;
          this._container = container;
          this.container.addComponent(new Component(
            "app",
            () => this,
            "PUBLIC"
            /* ComponentType.PUBLIC */
          ));
        }
        get automaticDataCollectionEnabled() {
          this.checkDestroyed();
          return this._automaticDataCollectionEnabled;
        }
        set automaticDataCollectionEnabled(val) {
          this.checkDestroyed();
          this._automaticDataCollectionEnabled = val;
        }
        get name() {
          this.checkDestroyed();
          return this._name;
        }
        get options() {
          this.checkDestroyed();
          return this._options;
        }
        get config() {
          this.checkDestroyed();
          return this._config;
        }
        get container() {
          return this._container;
        }
        get isDeleted() {
          return this._isDeleted;
        }
        set isDeleted(val) {
          this._isDeleted = val;
        }
        /**
         * This function will throw an Error if the App has already been deleted -
         * use before performing API actions on the App.
         */
        checkDestroyed() {
          if (this.isDeleted) {
            throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
          }
        }
      };
      SDK_VERSION = version;
      DB_NAME = "firebase-heartbeat-database";
      DB_VERSION = 1;
      STORE_NAME = "firebase-heartbeat-store";
      dbPromise = null;
      MAX_HEADER_BYTES = 1024;
      MAX_NUM_STORED_HEARTBEATS = 30;
      HeartbeatServiceImpl = class {
        constructor(container) {
          this.container = container;
          this._heartbeatsCache = null;
          const app = this.container.getProvider("app").getImmediate();
          this._storage = new HeartbeatStorageImpl(app);
          this._heartbeatsCachePromise = this._storage.read().then((result) => {
            this._heartbeatsCache = result;
            return result;
          });
        }
        /**
         * Called to report a heartbeat. The function will generate
         * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
         * to IndexedDB.
         * Note that we only store one heartbeat per day. So if a heartbeat for today is
         * already logged, subsequent calls to this function in the same day will be ignored.
         */
        async triggerHeartbeat() {
          try {
            const platformLogger = this.container.getProvider("platform-logger").getImmediate();
            const agent = platformLogger.getPlatformInfoString();
            const date = getUTCDateString();
            if (this._heartbeatsCache?.heartbeats == null) {
              this._heartbeatsCache = await this._heartbeatsCachePromise;
              if (this._heartbeatsCache?.heartbeats == null) {
                return;
              }
            }
            if (this._heartbeatsCache.lastSentHeartbeatDate === date || this._heartbeatsCache.heartbeats.some((singleDateHeartbeat) => singleDateHeartbeat.date === date)) {
              return;
            } else {
              this._heartbeatsCache.heartbeats.push({ date, agent });
              if (this._heartbeatsCache.heartbeats.length > MAX_NUM_STORED_HEARTBEATS) {
                const earliestHeartbeatIdx = getEarliestHeartbeatIdx(this._heartbeatsCache.heartbeats);
                this._heartbeatsCache.heartbeats.splice(earliestHeartbeatIdx, 1);
              }
            }
            return this._storage.overwrite(this._heartbeatsCache);
          } catch (e) {
            logger.warn(e);
          }
        }
        /**
         * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
         * It also clears all heartbeats from memory as well as in IndexedDB.
         *
         * NOTE: Consuming product SDKs should not send the header if this method
         * returns an empty string.
         */
        async getHeartbeatsHeader() {
          try {
            if (this._heartbeatsCache === null) {
              await this._heartbeatsCachePromise;
            }
            if (this._heartbeatsCache?.heartbeats == null || this._heartbeatsCache.heartbeats.length === 0) {
              return "";
            }
            const date = getUTCDateString();
            const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
            const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
            this._heartbeatsCache.lastSentHeartbeatDate = date;
            if (unsentEntries.length > 0) {
              this._heartbeatsCache.heartbeats = unsentEntries;
              await this._storage.overwrite(this._heartbeatsCache);
            } else {
              this._heartbeatsCache.heartbeats = [];
              void this._storage.overwrite(this._heartbeatsCache);
            }
            return headerString;
          } catch (e) {
            logger.warn(e);
            return "";
          }
        }
      };
      HeartbeatStorageImpl = class {
        constructor(app) {
          this.app = app;
          this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
        }
        async runIndexedDBEnvironmentCheck() {
          if (!isIndexedDBAvailable()) {
            return false;
          } else {
            return validateIndexedDBOpenable().then(() => true).catch(() => false);
          }
        }
        /**
         * Read all heartbeats.
         */
        async read() {
          const canUseIndexedDB = await this._canUseIndexedDBPromise;
          if (!canUseIndexedDB) {
            return { heartbeats: [] };
          } else {
            const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
            if (idbHeartbeatObject?.heartbeats) {
              return idbHeartbeatObject;
            } else {
              return { heartbeats: [] };
            }
          }
        }
        // overwrite the storage with the provided heartbeats
        async overwrite(heartbeatsObject) {
          const canUseIndexedDB = await this._canUseIndexedDBPromise;
          if (!canUseIndexedDB) {
            return;
          } else {
            const existingHeartbeatsObject = await this.read();
            return writeHeartbeatsToIndexedDB(this.app, {
              lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
              heartbeats: heartbeatsObject.heartbeats
            });
          }
        }
        // add heartbeats
        async add(heartbeatsObject) {
          const canUseIndexedDB = await this._canUseIndexedDBPromise;
          if (!canUseIndexedDB) {
            return;
          } else {
            const existingHeartbeatsObject = await this.read();
            return writeHeartbeatsToIndexedDB(this.app, {
              lastSentHeartbeatDate: heartbeatsObject.lastSentHeartbeatDate ?? existingHeartbeatsObject.lastSentHeartbeatDate,
              heartbeats: [
                ...existingHeartbeatsObject.heartbeats,
                ...heartbeatsObject.heartbeats
              ]
            });
          }
        }
      };
      registerCoreComponents("");
    }
  });

  // node_modules/firebase/app/dist/esm/index.esm.js
  var name2, version2;
  var init_index_esm5 = __esm({
    "node_modules/firebase/app/dist/esm/index.esm.js"() {
      init_index_esm4();
      init_index_esm4();
      name2 = "firebase";
      version2 = "12.15.0";
      registerVersion(name2, version2, "app");
    }
  });

  // node_modules/@firebase/auth/dist/esm/index-d90d2ee5.js
  function _prodErrorMap() {
    return {
      [
        "dependent-sdk-initialized-before-auth"
        /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
      ]: "Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."
    };
  }
  function _logWarn(msg, ...args) {
    if (logClient.logLevel <= LogLevel.WARN) {
      logClient.warn(`Auth (${SDK_VERSION}): ${msg}`, ...args);
    }
  }
  function _logError(msg, ...args) {
    if (logClient.logLevel <= LogLevel.ERROR) {
      logClient.error(`Auth (${SDK_VERSION}): ${msg}`, ...args);
    }
  }
  function _fail(authOrCode, ...rest) {
    throw createErrorInternal(authOrCode, ...rest);
  }
  function _createError(authOrCode, ...rest) {
    return createErrorInternal(authOrCode, ...rest);
  }
  function _errorWithCustomMessage(auth, code, message) {
    const errorMap = {
      ...prodErrorMap(),
      [code]: message
    };
    const factory = new ErrorFactory("auth", "Firebase", errorMap);
    return factory.create(code, {
      appName: auth.name
    });
  }
  function _serverAppCurrentUserOperationNotSupportedError(auth) {
    return _errorWithCustomMessage(auth, "operation-not-supported-in-this-environment", "Operations that alter the current user are not supported in conjunction with FirebaseServerApp");
  }
  function createErrorInternal(authOrCode, ...rest) {
    if (typeof authOrCode !== "string") {
      const code = rest[0];
      const fullParams = [...rest.slice(1)];
      if (fullParams[0]) {
        fullParams[0].appName = authOrCode.name;
      }
      return authOrCode._errorFactory.create(code, ...fullParams);
    }
    return _DEFAULT_AUTH_ERROR_FACTORY.create(authOrCode, ...rest);
  }
  function _assert(assertion, authOrCode, ...rest) {
    if (!assertion) {
      throw createErrorInternal(authOrCode, ...rest);
    }
  }
  function debugFail(failure) {
    const message = `INTERNAL ASSERTION FAILED: ` + failure;
    _logError(message);
    throw new Error(message);
  }
  function debugAssert(assertion, message) {
    if (!assertion) {
      debugFail(message);
    }
  }
  function _getCurrentUrl() {
    return typeof self !== "undefined" && self.location?.href || "";
  }
  function _isHttpOrHttps() {
    return _getCurrentScheme() === "http:" || _getCurrentScheme() === "https:";
  }
  function _getCurrentScheme() {
    return typeof self !== "undefined" && self.location?.protocol || null;
  }
  function _isOnline() {
    if (typeof navigator !== "undefined" && navigator && "onLine" in navigator && typeof navigator.onLine === "boolean" && // Apply only for traditional web apps and Chrome extensions.
    // This is especially true for Cordova apps which have unreliable
    // navigator.onLine behavior unless cordova-plugin-network-information is
    // installed which overwrites the native navigator.onLine value and
    // defines navigator.connection.
    (_isHttpOrHttps() || isBrowserExtension() || "connection" in navigator)) {
      return navigator.onLine;
    }
    return true;
  }
  function _getUserLanguage() {
    if (typeof navigator === "undefined") {
      return null;
    }
    const navigatorLanguage = navigator;
    return (
      // Most reliable, but only supported in Chrome/Firefox.
      navigatorLanguage.languages && navigatorLanguage.languages[0] || // Supported in most browsers, but returns the language of the browser
      // UI, not the language set in browser settings.
      navigatorLanguage.language || // Couldn't determine language.
      null
    );
  }
  function _emulatorUrl(config, path) {
    debugAssert(config.emulator, "Emulator should always be set here");
    const { url } = config.emulator;
    if (!path) {
      return url;
    }
    return `${url}${path.startsWith("/") ? path.slice(1) : path}`;
  }
  function _addTidIfNecessary(auth, request) {
    if (auth.tenantId && !request.tenantId) {
      return {
        ...request,
        tenantId: auth.tenantId
      };
    }
    return request;
  }
  async function _performApiRequest(auth, method, path, request, customErrorMap = {}) {
    return _performFetchWithErrorHandling(auth, customErrorMap, async () => {
      let body = {};
      let params = {};
      if (request) {
        if (method === "GET") {
          params = request;
        } else {
          body = {
            body: JSON.stringify(request)
          };
        }
      }
      const query = querystring({
        ...params,
        key: auth.config.apiKey
      }).slice(1);
      const headers = await auth._getAdditionalHeaders();
      headers[
        "Content-Type"
        /* HttpHeader.CONTENT_TYPE */
      ] = "application/json";
      if (auth.languageCode) {
        headers[
          "X-Firebase-Locale"
          /* HttpHeader.X_FIREBASE_LOCALE */
        ] = auth.languageCode;
      }
      const fetchArgs = {
        method,
        headers,
        ...body
      };
      if (!isCloudflareWorker()) {
        fetchArgs.referrerPolicy = "strict-origin-when-cross-origin";
      }
      if (auth.emulatorConfig && isCloudWorkstation(auth.emulatorConfig.host)) {
        fetchArgs.credentials = "include";
      }
      return FetchProvider.fetch()(await _getFinalTarget(auth, auth.config.apiHost, path, query), fetchArgs);
    });
  }
  async function _performFetchWithErrorHandling(auth, customErrorMap, fetchFn) {
    auth._canInitEmulator = false;
    const errorMap = { ...SERVER_ERROR_MAP, ...customErrorMap };
    try {
      const networkTimeout = new NetworkTimeout(auth);
      const response = await Promise.race([
        fetchFn(),
        networkTimeout.promise
      ]);
      networkTimeout.clearNetworkTimeout();
      const json = await response.json();
      if ("needConfirmation" in json) {
        throw _makeTaggedError(auth, "account-exists-with-different-credential", json);
      }
      if (response.ok && !("errorMessage" in json)) {
        return json;
      } else {
        const errorMessage = response.ok ? json.errorMessage : json.error.message;
        const [serverErrorCode, serverErrorMessage] = errorMessage.split(" : ");
        if (serverErrorCode === "FEDERATED_USER_ID_ALREADY_LINKED") {
          throw _makeTaggedError(auth, "credential-already-in-use", json);
        } else if (serverErrorCode === "EMAIL_EXISTS") {
          throw _makeTaggedError(auth, "email-already-in-use", json);
        } else if (serverErrorCode === "USER_DISABLED") {
          throw _makeTaggedError(auth, "user-disabled", json);
        }
        const authError = errorMap[serverErrorCode] || serverErrorCode.toLowerCase().replace(/[_\s]+/g, "-");
        if (serverErrorMessage) {
          throw _errorWithCustomMessage(auth, authError, serverErrorMessage);
        } else {
          _fail(auth, authError);
        }
      }
    } catch (e) {
      if (e instanceof FirebaseError) {
        throw e;
      }
      _fail(auth, "network-request-failed", { "message": String(e) });
    }
  }
  async function _performSignInRequest(auth, method, path, request, customErrorMap = {}) {
    const serverResponse = await _performApiRequest(auth, method, path, request, customErrorMap);
    if ("mfaPendingCredential" in serverResponse) {
      _fail(auth, "multi-factor-auth-required", {
        _serverResponse: serverResponse
      });
    }
    return serverResponse;
  }
  async function _getFinalTarget(auth, host, path, query) {
    const base = `${host}${path}?${query}`;
    const authInternal = auth;
    const finalTarget = authInternal.config.emulator ? _emulatorUrl(auth.config, base) : `${auth.config.apiScheme}://${base}`;
    if (CookieAuthProxiedEndpoints.includes(path)) {
      await authInternal._persistenceManagerAvailable;
      if (authInternal._getPersistenceType() === "COOKIE") {
        const cookiePersistence = authInternal._getPersistence();
        return cookiePersistence._getFinalTarget(finalTarget).toString();
      }
    }
    return finalTarget;
  }
  function _parseEnforcementState(enforcementStateStr) {
    switch (enforcementStateStr) {
      case "ENFORCE":
        return "ENFORCE";
      case "AUDIT":
        return "AUDIT";
      case "OFF":
        return "OFF";
      default:
        return "ENFORCEMENT_STATE_UNSPECIFIED";
    }
  }
  function _makeTaggedError(auth, code, response) {
    const errorParams = {
      appName: auth.name
    };
    if (response.email) {
      errorParams.email = response.email;
    }
    if (response.phoneNumber) {
      errorParams.phoneNumber = response.phoneNumber;
    }
    const error2 = _createError(auth, code, errorParams);
    error2.customData._tokenResponse = response;
    return error2;
  }
  function isEnterprise(grecaptcha) {
    return grecaptcha !== void 0 && grecaptcha.enterprise !== void 0;
  }
  async function getRecaptchaConfig(auth, request) {
    return _performApiRequest(auth, "GET", "/v2/recaptchaConfig", _addTidIfNecessary(auth, request));
  }
  async function deleteAccount(auth, request) {
    return _performApiRequest(auth, "POST", "/v1/accounts:delete", request);
  }
  async function getAccountInfo(auth, request) {
    return _performApiRequest(auth, "POST", "/v1/accounts:lookup", request);
  }
  function utcTimestampToDateString(utcTimestamp) {
    if (!utcTimestamp) {
      return void 0;
    }
    try {
      const date = new Date(Number(utcTimestamp));
      if (!isNaN(date.getTime())) {
        return date.toUTCString();
      }
    } catch (e) {
    }
    return void 0;
  }
  async function getIdTokenResult(user, forceRefresh = false) {
    const userInternal = getModularInstance(user);
    const token = await userInternal.getIdToken(forceRefresh);
    const claims = _parseToken(token);
    _assert(
      claims && claims.exp && claims.auth_time && claims.iat,
      userInternal.auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const firebase = typeof claims.firebase === "object" ? claims.firebase : void 0;
    const signInProvider = firebase?.["sign_in_provider"];
    return {
      claims,
      token,
      authTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.auth_time)),
      issuedAtTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.iat)),
      expirationTime: utcTimestampToDateString(secondsStringToMilliseconds(claims.exp)),
      signInProvider: signInProvider || null,
      signInSecondFactor: firebase?.["sign_in_second_factor"] || null
    };
  }
  function secondsStringToMilliseconds(seconds) {
    return Number(seconds) * 1e3;
  }
  function _parseToken(token) {
    const [algorithm, payload, signature] = token.split(".");
    if (algorithm === void 0 || payload === void 0 || signature === void 0) {
      _logError("JWT malformed, contained fewer than 3 sections");
      return null;
    }
    try {
      const decoded = base64Decode(payload);
      if (!decoded) {
        _logError("Failed to decode base64 JWT payload");
        return null;
      }
      return JSON.parse(decoded);
    } catch (e) {
      _logError("Caught error parsing JWT payload as JSON", e?.toString());
      return null;
    }
  }
  function _tokenExpiresIn(token) {
    const parsedToken = _parseToken(token);
    _assert(
      parsedToken,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof parsedToken.exp !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof parsedToken.iat !== "undefined",
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return Number(parsedToken.exp) - Number(parsedToken.iat);
  }
  async function _logoutIfInvalidated(user, promise, bypassAuthState = false) {
    if (bypassAuthState) {
      return promise;
    }
    try {
      return await promise;
    } catch (e) {
      if (e instanceof FirebaseError && isUserInvalidated(e)) {
        if (user.auth.currentUser === user) {
          await user.auth.signOut();
        }
      }
      throw e;
    }
  }
  function isUserInvalidated({ code }) {
    return code === `auth/${"user-disabled"}` || code === `auth/${"user-token-expired"}`;
  }
  async function _reloadWithoutSaving(user) {
    const auth = user.auth;
    const idToken = await user.getIdToken();
    const response = await _logoutIfInvalidated(user, getAccountInfo(auth, { idToken }));
    _assert(
      response?.users.length,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const coreAccount = response.users[0];
    user._notifyReloadListener(coreAccount);
    const newProviderData = coreAccount.providerUserInfo?.length ? extractProviderData(coreAccount.providerUserInfo) : [];
    const providerData = mergeProviderData(user.providerData, newProviderData);
    const oldIsAnonymous = user.isAnonymous;
    const newIsAnonymous = !(user.email && coreAccount.passwordHash) && !providerData?.length;
    const isAnonymous = !oldIsAnonymous ? false : newIsAnonymous;
    const updates = {
      uid: coreAccount.localId,
      displayName: coreAccount.displayName || null,
      photoURL: coreAccount.photoUrl || null,
      email: coreAccount.email || null,
      emailVerified: coreAccount.emailVerified || false,
      phoneNumber: coreAccount.phoneNumber || null,
      tenantId: coreAccount.tenantId || null,
      providerData,
      metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
      isAnonymous
    };
    Object.assign(user, updates);
  }
  async function reload(user) {
    const userInternal = getModularInstance(user);
    await _reloadWithoutSaving(userInternal);
    await userInternal.auth._persistUserIfCurrent(userInternal);
    userInternal.auth._notifyListenersIfCurrent(userInternal);
  }
  function mergeProviderData(original, newData) {
    const deduped = original.filter((o) => !newData.some((n) => n.providerId === o.providerId));
    return [...deduped, ...newData];
  }
  function extractProviderData(providers) {
    return providers.map(({ providerId, ...provider }) => {
      return {
        providerId,
        uid: provider.rawId || "",
        displayName: provider.displayName || null,
        email: provider.email || null,
        phoneNumber: provider.phoneNumber || null,
        photoURL: provider.photoUrl || null
      };
    });
  }
  async function requestStsToken(auth, refreshToken) {
    const response = await _performFetchWithErrorHandling(auth, {}, async () => {
      const body = querystring({
        "grant_type": "refresh_token",
        "refresh_token": refreshToken
      }).slice(1);
      const { tokenApiHost, apiKey } = auth.config;
      const url = await _getFinalTarget(auth, tokenApiHost, "/v1/token", `key=${apiKey}`);
      const headers = await auth._getAdditionalHeaders();
      headers[
        "Content-Type"
        /* HttpHeader.CONTENT_TYPE */
      ] = "application/x-www-form-urlencoded";
      const options = {
        method: "POST",
        headers,
        body
      };
      if (auth.emulatorConfig && isCloudWorkstation(auth.emulatorConfig.host)) {
        options.credentials = "include";
      }
      return FetchProvider.fetch()(url, options);
    });
    return {
      accessToken: response.access_token,
      expiresIn: response.expires_in,
      refreshToken: response.refresh_token
    };
  }
  async function revokeToken(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts:revokeToken", _addTidIfNecessary(auth, request));
  }
  function assertStringOrUndefined(assertion, appName) {
    _assert(typeof assertion === "string" || typeof assertion === "undefined", "internal-error", { appName });
  }
  function _getInstance(cls) {
    debugAssert(cls instanceof Function, "Expected a class definition");
    let instance = instanceCache.get(cls);
    if (instance) {
      debugAssert(instance instanceof cls, "Instance stored in cache mismatched with class");
      return instance;
    }
    instance = new cls();
    instanceCache.set(cls, instance);
    return instance;
  }
  function _persistenceKeyName(key, apiKey, appName) {
    return `${"firebase"}:${key}:${apiKey}:${appName}`;
  }
  function _getBrowserName(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes("opera/") || ua.includes("opr/") || ua.includes("opios/")) {
      return "Opera";
    } else if (_isIEMobile(ua)) {
      return "IEMobile";
    } else if (ua.includes("msie") || ua.includes("trident/")) {
      return "IE";
    } else if (ua.includes("edge/")) {
      return "Edge";
    } else if (_isFirefox(ua)) {
      return "Firefox";
    } else if (ua.includes("silk/")) {
      return "Silk";
    } else if (_isBlackBerry(ua)) {
      return "Blackberry";
    } else if (_isWebOS(ua)) {
      return "Webos";
    } else if (_isSafari(ua)) {
      return "Safari";
    } else if ((ua.includes("chrome/") || _isChromeIOS(ua)) && !ua.includes("edge/")) {
      return "Chrome";
    } else if (_isAndroid(ua)) {
      return "Android";
    } else {
      const re = /([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/;
      const matches = userAgent.match(re);
      if (matches?.length === 2) {
        return matches[1];
      }
    }
    return "Other";
  }
  function _isFirefox(ua = getUA()) {
    return /firefox\//i.test(ua);
  }
  function _isSafari(userAgent = getUA()) {
    const ua = userAgent.toLowerCase();
    return ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("crios/") && !ua.includes("android");
  }
  function _isChromeIOS(ua = getUA()) {
    return /crios\//i.test(ua);
  }
  function _isIEMobile(ua = getUA()) {
    return /iemobile/i.test(ua);
  }
  function _isAndroid(ua = getUA()) {
    return /android/i.test(ua);
  }
  function _isBlackBerry(ua = getUA()) {
    return /blackberry/i.test(ua);
  }
  function _isWebOS(ua = getUA()) {
    return /webos/i.test(ua);
  }
  function _isIOS(ua = getUA()) {
    return /iphone|ipad|ipod/i.test(ua) || /macintosh/i.test(ua) && /mobile/i.test(ua);
  }
  function _isIOSStandalone(ua = getUA()) {
    return _isIOS(ua) && !!window.navigator?.standalone;
  }
  function _isIE10() {
    return isIE() && document.documentMode === 10;
  }
  function _isMobileBrowser(ua = getUA()) {
    return _isIOS(ua) || _isAndroid(ua) || _isWebOS(ua) || _isBlackBerry(ua) || /windows phone/i.test(ua) || _isIEMobile(ua);
  }
  function _getClientVersion(clientPlatform, frameworks = []) {
    let reportedPlatform;
    switch (clientPlatform) {
      case "Browser":
        reportedPlatform = _getBrowserName(getUA());
        break;
      case "Worker":
        reportedPlatform = `${_getBrowserName(getUA())}-${clientPlatform}`;
        break;
      default:
        reportedPlatform = clientPlatform;
    }
    const reportedFrameworks = frameworks.length ? frameworks.join(",") : "FirebaseCore-web";
    return `${reportedPlatform}/${"JsCore"}/${SDK_VERSION}/${reportedFrameworks}`;
  }
  async function _getPasswordPolicy(auth, request = {}) {
    return _performApiRequest(auth, "GET", "/v2/passwordPolicy", _addTidIfNecessary(auth, request));
  }
  function _castAuth(auth) {
    return getModularInstance(auth);
  }
  function _setExternalJSProvider(p) {
    externalJSProvider = p;
  }
  function _loadJS(url) {
    return externalJSProvider.loadJS(url);
  }
  function _recaptchaEnterpriseScriptUrl() {
    return externalJSProvider.recaptchaEnterpriseScript;
  }
  function _gapiScriptUrl() {
    return externalJSProvider.gapiScript;
  }
  function _generateCallbackName(prefix) {
    return `__${prefix}${Math.floor(Math.random() * 1e6)}`;
  }
  async function injectRecaptchaFields(auth, request, action, isCaptchaResp = false, isFakeToken = false) {
    const verifier = new RecaptchaEnterpriseVerifier(auth);
    let captchaResponse;
    if (isFakeToken) {
      captchaResponse = FAKE_TOKEN;
    } else {
      try {
        captchaResponse = await verifier.verify(action);
      } catch (error2) {
        captchaResponse = await verifier.verify(action, true);
      }
    }
    const newRequest = { ...request };
    if (action === "mfaSmsEnrollment" || action === "mfaSmsSignIn") {
      if ("phoneEnrollmentInfo" in newRequest) {
        const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
        const recaptchaToken = newRequest.phoneEnrollmentInfo.recaptchaToken;
        Object.assign(newRequest, {
          "phoneEnrollmentInfo": {
            phoneNumber,
            recaptchaToken,
            captchaResponse,
            "clientType": "CLIENT_TYPE_WEB",
            "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
            /* RecaptchaVersion.ENTERPRISE */
          }
        });
      } else if ("phoneSignInInfo" in newRequest) {
        const recaptchaToken = newRequest.phoneSignInInfo.recaptchaToken;
        Object.assign(newRequest, {
          "phoneSignInInfo": {
            recaptchaToken,
            captchaResponse,
            "clientType": "CLIENT_TYPE_WEB",
            "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
            /* RecaptchaVersion.ENTERPRISE */
          }
        });
      }
      return newRequest;
    }
    if (!isCaptchaResp) {
      Object.assign(newRequest, { captchaResponse });
    } else {
      Object.assign(newRequest, { "captchaResp": captchaResponse });
    }
    Object.assign(newRequest, {
      "clientType": "CLIENT_TYPE_WEB"
      /* RecaptchaClientType.WEB */
    });
    Object.assign(newRequest, {
      "recaptchaVersion": "RECAPTCHA_ENTERPRISE"
      /* RecaptchaVersion.ENTERPRISE */
    });
    return newRequest;
  }
  async function handleRecaptchaFlow(authInstance, request, actionName, actionMethod, recaptchaAuthProvider) {
    if (recaptchaAuthProvider === "EMAIL_PASSWORD_PROVIDER") {
      if (authInstance._getRecaptchaConfig()?.isProviderEnabled(
        "EMAIL_PASSWORD_PROVIDER"
        /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
      )) {
        const requestWithRecaptcha = await injectRecaptchaFields(
          authInstance,
          request,
          actionName,
          actionName === "getOobCode"
          /* RecaptchaActionName.GET_OOB_CODE */
        );
        return actionMethod(authInstance, requestWithRecaptcha);
      } else {
        return actionMethod(authInstance, request).catch(async (error2) => {
          if (error2.code === `auth/${"missing-recaptcha-token"}`) {
            console.log(`${actionName} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);
            const requestWithRecaptcha = await injectRecaptchaFields(
              authInstance,
              request,
              actionName,
              actionName === "getOobCode"
              /* RecaptchaActionName.GET_OOB_CODE */
            );
            return actionMethod(authInstance, requestWithRecaptcha);
          } else {
            return Promise.reject(error2);
          }
        });
      }
    } else if (recaptchaAuthProvider === "PHONE_PROVIDER") {
      if (authInstance._getRecaptchaConfig()?.isProviderEnabled(
        "PHONE_PROVIDER"
        /* RecaptchaAuthProvider.PHONE_PROVIDER */
      )) {
        const requestWithRecaptcha = await injectRecaptchaFields(authInstance, request, actionName);
        return actionMethod(authInstance, requestWithRecaptcha).catch(async (error2) => {
          if (authInstance._getRecaptchaConfig()?.getProviderEnforcementState(
            "PHONE_PROVIDER"
            /* RecaptchaAuthProvider.PHONE_PROVIDER */
          ) === "AUDIT") {
            if (error2.code === `auth/${"missing-recaptcha-token"}` || error2.code === `auth/${"invalid-app-credential"}`) {
              console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${actionName} flow.`);
              const requestWithRecaptchaFields = await injectRecaptchaFields(
                authInstance,
                request,
                actionName,
                false,
                // isCaptchaResp
                true
                // isFakeToken
              );
              return actionMethod(authInstance, requestWithRecaptchaFields);
            }
          }
          return Promise.reject(error2);
        });
      } else {
        const requestWithRecaptchaFields = await injectRecaptchaFields(
          authInstance,
          request,
          actionName,
          false,
          // isCaptchaResp
          true
          // isFakeToken
        );
        return actionMethod(authInstance, requestWithRecaptchaFields);
      }
    } else {
      return Promise.reject(recaptchaAuthProvider + " provider is not supported.");
    }
  }
  async function _initializeRecaptchaConfig(auth) {
    const authInternal = _castAuth(auth);
    const response = await getRecaptchaConfig(authInternal, {
      clientType: "CLIENT_TYPE_WEB",
      version: "RECAPTCHA_ENTERPRISE"
      /* RecaptchaVersion.ENTERPRISE */
    });
    const config = new RecaptchaConfig(response);
    if (authInternal.tenantId == null) {
      authInternal._agentRecaptchaConfig = config;
    } else {
      authInternal._tenantRecaptchaConfigs[authInternal.tenantId] = config;
    }
    if (config.isAnyProviderEnabled()) {
      const verifier = new RecaptchaEnterpriseVerifier(authInternal);
      void verifier.verify();
    }
  }
  function initializeAuth(app, deps) {
    const provider = _getProvider(app, "auth");
    if (provider.isInitialized()) {
      const auth2 = provider.getImmediate();
      const initialOptions = provider.getOptions();
      if (deepEqual(initialOptions, deps ?? {})) {
        return auth2;
      } else {
        _fail(
          auth2,
          "already-initialized"
          /* AuthErrorCode.ALREADY_INITIALIZED */
        );
      }
    }
    const auth = provider.initialize({ options: deps });
    return auth;
  }
  function _initializeAuthInstance(auth, deps) {
    const persistence = deps?.persistence || [];
    const hierarchy = (Array.isArray(persistence) ? persistence : [persistence]).map(_getInstance);
    if (deps?.errorMap) {
      auth._updateErrorMap(deps.errorMap);
    }
    auth._initializeWithPersistence(hierarchy, deps?.popupRedirectResolver);
  }
  function connectAuthEmulator(auth, url, options) {
    const authInternal = _castAuth(auth);
    _assert(
      /^https?:\/\//.test(url),
      authInternal,
      "invalid-emulator-scheme"
      /* AuthErrorCode.INVALID_EMULATOR_SCHEME */
    );
    const disableWarnings = !!options?.disableWarnings;
    const protocol = extractProtocol(url);
    const { host, port } = extractHostAndPort(url);
    const portStr = port === null ? "" : `:${port}`;
    const emulator = { url: `${protocol}//${host}${portStr}/` };
    const emulatorConfig = Object.freeze({
      host,
      port,
      protocol: protocol.replace(":", ""),
      options: Object.freeze({ disableWarnings })
    });
    if (!authInternal._canInitEmulator) {
      _assert(
        authInternal.config.emulator && authInternal.emulatorConfig,
        authInternal,
        "emulator-config-failed"
        /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
      );
      _assert(
        deepEqual(emulator, authInternal.config.emulator) && deepEqual(emulatorConfig, authInternal.emulatorConfig),
        authInternal,
        "emulator-config-failed"
        /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
      );
      return;
    }
    authInternal.config.emulator = emulator;
    authInternal.emulatorConfig = emulatorConfig;
    authInternal.settings.appVerificationDisabledForTesting = true;
    if (isCloudWorkstation(host)) {
      void pingServer(`${protocol}//${host}${portStr}`);
    } else if (!disableWarnings) {
      emitEmulatorWarning();
    }
  }
  function extractProtocol(url) {
    const protocolEnd = url.indexOf(":");
    return protocolEnd < 0 ? "" : url.substr(0, protocolEnd + 1);
  }
  function extractHostAndPort(url) {
    const protocol = extractProtocol(url);
    const authority = /(\/\/)?([^?#/]+)/.exec(url.substr(protocol.length));
    if (!authority) {
      return { host: "", port: null };
    }
    const hostAndPort = authority[2].split("@").pop() || "";
    const bracketedIPv6 = /^(\[[^\]]+\])(:|$)/.exec(hostAndPort);
    if (bracketedIPv6) {
      const host = bracketedIPv6[1];
      return { host, port: parsePort(hostAndPort.substr(host.length + 1)) };
    } else {
      const [host, port] = hostAndPort.split(":");
      return { host, port: parsePort(port) };
    }
  }
  function parsePort(portStr) {
    if (!portStr) {
      return null;
    }
    const port = Number(portStr);
    if (isNaN(port)) {
      return null;
    }
    return port;
  }
  function emitEmulatorWarning() {
    function attachBanner() {
      const el = document.createElement("p");
      const sty = el.style;
      el.innerText = "Running in emulator mode. Do not use with production credentials.";
      sty.position = "fixed";
      sty.width = "100%";
      sty.backgroundColor = "#ffffff";
      sty.border = ".1em solid #000000";
      sty.color = "#b50000";
      sty.bottom = "0px";
      sty.left = "0px";
      sty.margin = "0px";
      sty.zIndex = "10000";
      sty.textAlign = "center";
      el.classList.add("firebase-emulator-warning");
      document.body.appendChild(el);
    }
    if (typeof console !== "undefined" && typeof console.info === "function") {
      console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.");
    }
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", attachBanner);
      } else {
        attachBanner();
      }
    }
  }
  async function linkEmailPassword(auth, request) {
    return _performApiRequest(auth, "POST", "/v1/accounts:signUp", request);
  }
  async function signInWithPassword(auth, request) {
    return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPassword", _addTidIfNecessary(auth, request));
  }
  async function signInWithEmailLink$1(auth, request) {
    return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth, request));
  }
  async function signInWithEmailLinkForLinking(auth, request) {
    return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithEmailLink", _addTidIfNecessary(auth, request));
  }
  async function signInWithIdp(auth, request) {
    return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithIdp", _addTidIfNecessary(auth, request));
  }
  async function sendPhoneVerificationCode(auth, request) {
    return _performApiRequest(auth, "POST", "/v1/accounts:sendVerificationCode", _addTidIfNecessary(auth, request));
  }
  async function signInWithPhoneNumber$1(auth, request) {
    return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth, request));
  }
  async function linkWithPhoneNumber$1(auth, request) {
    const response = await _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth, request));
    if (response.temporaryProof) {
      throw _makeTaggedError(auth, "account-exists-with-different-credential", response);
    }
    return response;
  }
  async function verifyPhoneNumberForExisting(auth, request) {
    const apiRequest = {
      ...request,
      operation: "REAUTH"
    };
    return _performSignInRequest(auth, "POST", "/v1/accounts:signInWithPhoneNumber", _addTidIfNecessary(auth, apiRequest), VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_);
  }
  function parseMode(mode) {
    switch (mode) {
      case "recoverEmail":
        return "RECOVER_EMAIL";
      case "resetPassword":
        return "PASSWORD_RESET";
      case "signIn":
        return "EMAIL_SIGNIN";
      case "verifyEmail":
        return "VERIFY_EMAIL";
      case "verifyAndChangeEmail":
        return "VERIFY_AND_CHANGE_EMAIL";
      case "revertSecondFactorAddition":
        return "REVERT_SECOND_FACTOR_ADDITION";
      default:
        return null;
    }
  }
  function parseDeepLink(url) {
    const link = querystringDecode(extractQuerystring(url))["link"];
    const doubleDeepLink = link ? querystringDecode(extractQuerystring(link))["deep_link_id"] : null;
    const iOSDeepLink = querystringDecode(extractQuerystring(url))["deep_link_id"];
    const iOSDoubleDeepLink = iOSDeepLink ? querystringDecode(extractQuerystring(iOSDeepLink))["link"] : null;
    return iOSDoubleDeepLink || iOSDeepLink || doubleDeepLink || link || url;
  }
  async function signUp(auth, request) {
    return _performSignInRequest(auth, "POST", "/v1/accounts:signUp", _addTidIfNecessary(auth, request));
  }
  function providerIdForResponse(response) {
    if (response.providerId) {
      return response.providerId;
    }
    if ("phoneNumber" in response) {
      return "phone";
    }
    return null;
  }
  function _processCredentialSavingMfaContextIfNecessary(auth, operationType, credential, user) {
    const idTokenProvider = operationType === "reauthenticate" ? credential._getReauthenticationResolver(auth) : credential._getIdTokenResponse(auth);
    return idTokenProvider.catch((error2) => {
      if (error2.code === `auth/${"multi-factor-auth-required"}`) {
        throw MultiFactorError._fromErrorAndOperation(auth, error2, operationType, user);
      }
      throw error2;
    });
  }
  async function _link$1(user, credential, bypassAuthState = false) {
    const response = await _logoutIfInvalidated(user, credential._linkToIdToken(user.auth, await user.getIdToken()), bypassAuthState);
    return UserCredentialImpl._forOperation(user, "link", response);
  }
  async function _reauthenticate(user, credential, bypassAuthState = false) {
    const { auth } = user;
    if (_isFirebaseServerApp(auth.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
    }
    const operationType = "reauthenticate";
    try {
      const response = await _logoutIfInvalidated(user, _processCredentialSavingMfaContextIfNecessary(auth, operationType, credential, user), bypassAuthState);
      _assert(
        response.idToken,
        auth,
        "internal-error"
        /* AuthErrorCode.INTERNAL_ERROR */
      );
      const parsed = _parseToken(response.idToken);
      _assert(
        parsed,
        auth,
        "internal-error"
        /* AuthErrorCode.INTERNAL_ERROR */
      );
      const { sub: localId } = parsed;
      _assert(
        user.uid === localId,
        auth,
        "user-mismatch"
        /* AuthErrorCode.USER_MISMATCH */
      );
      return UserCredentialImpl._forOperation(user, operationType, response);
    } catch (e) {
      if (e?.code === `auth/${"user-not-found"}`) {
        _fail(
          auth,
          "user-mismatch"
          /* AuthErrorCode.USER_MISMATCH */
        );
      }
      throw e;
    }
  }
  async function _signInWithCredential(auth, credential, bypassAuthState = false) {
    if (_isFirebaseServerApp(auth.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
    }
    const operationType = "signIn";
    const response = await _processCredentialSavingMfaContextIfNecessary(auth, operationType, credential);
    const userCredential = await UserCredentialImpl._fromIdTokenResponse(auth, operationType, response);
    if (!bypassAuthState) {
      await auth._updateCurrentUser(userCredential.user);
    }
    return userCredential;
  }
  async function signInWithCredential(auth, credential) {
    return _signInWithCredential(_castAuth(auth), credential);
  }
  async function recachePasswordPolicy(auth) {
    const authInternal = _castAuth(auth);
    if (authInternal._getPasswordPolicyInternal()) {
      await authInternal._updatePasswordPolicy();
    }
  }
  async function createUserWithEmailAndPassword(auth, email, password) {
    if (_isFirebaseServerApp(auth.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
    }
    const authInternal = _castAuth(auth);
    const request = {
      returnSecureToken: true,
      email,
      password,
      clientType: "CLIENT_TYPE_WEB"
      /* RecaptchaClientType.WEB */
    };
    const signUpResponse = handleRecaptchaFlow(
      authInternal,
      request,
      "signUpPassword",
      signUp,
      "EMAIL_PASSWORD_PROVIDER"
      /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
    );
    const response = await signUpResponse.catch((error2) => {
      if (error2.code === `auth/${"password-does-not-meet-requirements"}`) {
        void recachePasswordPolicy(auth);
      }
      throw error2;
    });
    const userCredential = await UserCredentialImpl._fromIdTokenResponse(authInternal, "signIn", response);
    await authInternal._updateCurrentUser(userCredential.user);
    return userCredential;
  }
  function signInWithEmailAndPassword(auth, email, password) {
    if (_isFirebaseServerApp(auth.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
    }
    return signInWithCredential(getModularInstance(auth), EmailAuthProvider.credential(email, password)).catch(async (error2) => {
      if (error2.code === `auth/${"password-does-not-meet-requirements"}`) {
        void recachePasswordPolicy(auth);
      }
      throw error2;
    });
  }
  function onIdTokenChanged(auth, nextOrObserver, error2, completed) {
    return getModularInstance(auth).onIdTokenChanged(nextOrObserver, error2, completed);
  }
  function beforeAuthStateChanged(auth, callback, onAbort) {
    return getModularInstance(auth).beforeAuthStateChanged(callback, onAbort);
  }
  function onAuthStateChanged(auth, nextOrObserver, error2, completed) {
    return getModularInstance(auth).onAuthStateChanged(nextOrObserver, error2, completed);
  }
  function signOut(auth) {
    return getModularInstance(auth).signOut();
  }
  function startEnrollPhoneMfa(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts/mfaEnrollment:start", _addTidIfNecessary(auth, request));
  }
  function finalizeEnrollPhoneMfa(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts/mfaEnrollment:finalize", _addTidIfNecessary(auth, request));
  }
  function startEnrollTotpMfa(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts/mfaEnrollment:start", _addTidIfNecessary(auth, request));
  }
  function finalizeEnrollTotpMfa(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts/mfaEnrollment:finalize", _addTidIfNecessary(auth, request));
  }
  function getDocumentCookie(name5) {
    const escapedName = name5.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
    const matcher = RegExp(`${escapedName}=([^;]+)`);
    return document.cookie.match(matcher)?.[1] ?? null;
  }
  function getCookieName(key) {
    const isDevMode = window.location.protocol === "http:";
    return `${isDevMode ? "__dev_" : "__HOST-"}FIREBASE_${key.split(":")[3]}`;
  }
  function _allSettled(promises) {
    return Promise.all(promises.map(async (promise) => {
      try {
        const value = await promise;
        return {
          fulfilled: true,
          value
        };
      } catch (reason) {
        return {
          fulfilled: false,
          reason
        };
      }
    }));
  }
  function _generateEventId(prefix = "", digits = 10) {
    let random = "";
    for (let i = 0; i < digits; i++) {
      random += Math.floor(Math.random() * 10);
    }
    return prefix + random;
  }
  function _window() {
    return window;
  }
  function _setWindowLocation(url) {
    _window().location.href = url;
  }
  function _isWorker() {
    return typeof _window()["WorkerGlobalScope"] !== "undefined" && typeof _window()["importScripts"] === "function";
  }
  async function _getActiveServiceWorker() {
    if (!navigator?.serviceWorker) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      return registration.active;
    } catch {
      return null;
    }
  }
  function _getServiceWorkerController() {
    return navigator?.serviceWorker?.controller || null;
  }
  function _getWorkerGlobalScope() {
    return _isWorker() ? self : null;
  }
  function getObjectStore(db, isReadWrite) {
    return db.transaction([DB_OBJECTSTORE_NAME], isReadWrite ? "readwrite" : "readonly").objectStore(DB_OBJECTSTORE_NAME);
  }
  function _deleteDatabase() {
    const request = indexedDB.deleteDatabase(DB_NAME2);
    return new DBPromise(request).toPromise();
  }
  function _openDatabase() {
    const request = indexedDB.open(DB_NAME2, DB_VERSION2);
    return new Promise((resolve, reject) => {
      request.addEventListener("error", () => {
        reject(request.error);
      });
      request.addEventListener("upgradeneeded", () => {
        const db = request.result;
        try {
          db.createObjectStore(DB_OBJECTSTORE_NAME, { keyPath: DB_DATA_KEYPATH });
        } catch (e) {
          reject(e);
        }
      });
      request.addEventListener("success", async () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_OBJECTSTORE_NAME)) {
          db.close();
          await _deleteDatabase();
          resolve(await _openDatabase());
        } else {
          resolve(db);
        }
      });
    });
  }
  async function _putObject(db, key, value) {
    const request = getObjectStore(db, true).put({
      [DB_DATA_KEYPATH]: key,
      value
    });
    return new DBPromise(request).toPromise();
  }
  async function getObject(db, key) {
    const request = getObjectStore(db, false).get(key);
    const data = await new DBPromise(request).toPromise();
    return data === void 0 ? null : data.value;
  }
  function _deleteObject(db, key) {
    const request = getObjectStore(db, true).delete(key);
    return new DBPromise(request).toPromise();
  }
  function startSignInPhoneMfa(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts/mfaSignIn:start", _addTidIfNecessary(auth, request));
  }
  function finalizeSignInPhoneMfa(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts/mfaSignIn:finalize", _addTidIfNecessary(auth, request));
  }
  function finalizeSignInTotpMfa(auth, request) {
    return _performApiRequest(auth, "POST", "/v2/accounts/mfaSignIn:finalize", _addTidIfNecessary(auth, request));
  }
  async function _verifyPhoneNumber(auth, options, verifier) {
    if (!auth._getRecaptchaConfig()) {
      try {
        await _initializeRecaptchaConfig(auth);
      } catch (error2) {
        console.log("Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.");
      }
    }
    try {
      let phoneInfoOptions;
      if (typeof options === "string") {
        phoneInfoOptions = {
          phoneNumber: options
        };
      } else {
        phoneInfoOptions = options;
      }
      if ("session" in phoneInfoOptions) {
        const session = phoneInfoOptions.session;
        if ("phoneNumber" in phoneInfoOptions) {
          _assert(
            session.type === "enroll",
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          const startPhoneMfaEnrollmentRequest = {
            idToken: session.credential,
            phoneEnrollmentInfo: {
              phoneNumber: phoneInfoOptions.phoneNumber,
              clientType: "CLIENT_TYPE_WEB"
              /* RecaptchaClientType.WEB */
            }
          };
          const startEnrollPhoneMfaActionCallback = async (authInstance, request) => {
            if (request.phoneEnrollmentInfo.captchaResponse === FAKE_TOKEN) {
              _assert(
                verifier?.type === RECAPTCHA_VERIFIER_TYPE,
                authInstance,
                "argument-error"
                /* AuthErrorCode.ARGUMENT_ERROR */
              );
              const requestWithRecaptchaV2 = await injectRecaptchaV2Token(authInstance, request, verifier);
              return startEnrollPhoneMfa(authInstance, requestWithRecaptchaV2);
            }
            return startEnrollPhoneMfa(authInstance, request);
          };
          const startPhoneMfaEnrollmentResponse = handleRecaptchaFlow(
            auth,
            startPhoneMfaEnrollmentRequest,
            "mfaSmsEnrollment",
            startEnrollPhoneMfaActionCallback,
            "PHONE_PROVIDER"
            /* RecaptchaAuthProvider.PHONE_PROVIDER */
          );
          const response = await startPhoneMfaEnrollmentResponse.catch((error2) => {
            return Promise.reject(error2);
          });
          return response.phoneSessionInfo.sessionInfo;
        } else {
          _assert(
            session.type === "signin",
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          const mfaEnrollmentId = phoneInfoOptions.multiFactorHint?.uid || phoneInfoOptions.multiFactorUid;
          _assert(
            mfaEnrollmentId,
            auth,
            "missing-multi-factor-info"
            /* AuthErrorCode.MISSING_MFA_INFO */
          );
          const startPhoneMfaSignInRequest = {
            mfaPendingCredential: session.credential,
            mfaEnrollmentId,
            phoneSignInInfo: {
              clientType: "CLIENT_TYPE_WEB"
              /* RecaptchaClientType.WEB */
            }
          };
          const startSignInPhoneMfaActionCallback = async (authInstance, request) => {
            if (request.phoneSignInInfo.captchaResponse === FAKE_TOKEN) {
              _assert(
                verifier?.type === RECAPTCHA_VERIFIER_TYPE,
                authInstance,
                "argument-error"
                /* AuthErrorCode.ARGUMENT_ERROR */
              );
              const requestWithRecaptchaV2 = await injectRecaptchaV2Token(authInstance, request, verifier);
              return startSignInPhoneMfa(authInstance, requestWithRecaptchaV2);
            }
            return startSignInPhoneMfa(authInstance, request);
          };
          const startPhoneMfaSignInResponse = handleRecaptchaFlow(
            auth,
            startPhoneMfaSignInRequest,
            "mfaSmsSignIn",
            startSignInPhoneMfaActionCallback,
            "PHONE_PROVIDER"
            /* RecaptchaAuthProvider.PHONE_PROVIDER */
          );
          const response = await startPhoneMfaSignInResponse.catch((error2) => {
            return Promise.reject(error2);
          });
          return response.phoneResponseInfo.sessionInfo;
        }
      } else {
        const sendPhoneVerificationCodeRequest = {
          phoneNumber: phoneInfoOptions.phoneNumber,
          clientType: "CLIENT_TYPE_WEB"
          /* RecaptchaClientType.WEB */
        };
        const sendPhoneVerificationCodeActionCallback = async (authInstance, request) => {
          if (request.captchaResponse === FAKE_TOKEN) {
            _assert(
              verifier?.type === RECAPTCHA_VERIFIER_TYPE,
              authInstance,
              "argument-error"
              /* AuthErrorCode.ARGUMENT_ERROR */
            );
            const requestWithRecaptchaV2 = await injectRecaptchaV2Token(authInstance, request, verifier);
            return sendPhoneVerificationCode(authInstance, requestWithRecaptchaV2);
          }
          return sendPhoneVerificationCode(authInstance, request);
        };
        const sendPhoneVerificationCodeResponse = handleRecaptchaFlow(
          auth,
          sendPhoneVerificationCodeRequest,
          "sendVerificationCode",
          sendPhoneVerificationCodeActionCallback,
          "PHONE_PROVIDER"
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        );
        const response = await sendPhoneVerificationCodeResponse.catch((error2) => {
          return Promise.reject(error2);
        });
        return response.sessionInfo;
      }
    } finally {
      verifier?._reset();
    }
  }
  async function injectRecaptchaV2Token(auth, request, recaptchaV2Verifier) {
    _assert(
      recaptchaV2Verifier.type === RECAPTCHA_VERIFIER_TYPE,
      auth,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    const recaptchaV2Token = await recaptchaV2Verifier.verify();
    _assert(
      typeof recaptchaV2Token === "string",
      auth,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    const newRequest = { ...request };
    if ("phoneEnrollmentInfo" in newRequest) {
      const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
      const captchaResponse = newRequest.phoneEnrollmentInfo.captchaResponse;
      const clientType = newRequest.phoneEnrollmentInfo.clientType;
      const recaptchaVersion = newRequest.phoneEnrollmentInfo.recaptchaVersion;
      Object.assign(newRequest, {
        "phoneEnrollmentInfo": {
          phoneNumber,
          recaptchaToken: recaptchaV2Token,
          captchaResponse,
          clientType,
          recaptchaVersion
        }
      });
      return newRequest;
    } else if ("phoneSignInInfo" in newRequest) {
      const captchaResponse = newRequest.phoneSignInInfo.captchaResponse;
      const clientType = newRequest.phoneSignInInfo.clientType;
      const recaptchaVersion = newRequest.phoneSignInInfo.recaptchaVersion;
      Object.assign(newRequest, {
        "phoneSignInInfo": {
          recaptchaToken: recaptchaV2Token,
          captchaResponse,
          clientType,
          recaptchaVersion
        }
      });
      return newRequest;
    } else {
      Object.assign(newRequest, { "recaptchaToken": recaptchaV2Token });
      return newRequest;
    }
  }
  function _withDefaultResolver(auth, resolverOverride) {
    if (resolverOverride) {
      return _getInstance(resolverOverride);
    }
    _assert(
      auth._popupRedirectResolver,
      auth,
      "argument-error"
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return auth._popupRedirectResolver;
  }
  function _signIn(params) {
    return _signInWithCredential(params.auth, new IdpCredential(params), params.bypassAuthState);
  }
  function _reauth(params) {
    const { auth, user } = params;
    _assert(
      user,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return _reauthenticate(user, new IdpCredential(params), params.bypassAuthState);
  }
  async function _link(params) {
    const { auth, user } = params;
    _assert(
      user,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return _link$1(user, new IdpCredential(params), params.bypassAuthState);
  }
  async function _getAndClearPendingRedirectStatus(resolver, auth) {
    const key = pendingRedirectKey(auth);
    const persistence = resolverPersistence(resolver);
    if (!await persistence._isAvailable()) {
      return false;
    }
    const hasPendingRedirect = await persistence._get(key) === "true";
    await persistence._remove(key);
    return hasPendingRedirect;
  }
  function _overrideRedirectResult(auth, result) {
    redirectOutcomeMap.set(auth._key(), result);
  }
  function resolverPersistence(resolver) {
    return _getInstance(resolver._redirectPersistence);
  }
  function pendingRedirectKey(auth) {
    return _persistenceKeyName(PENDING_REDIRECT_KEY, auth.config.apiKey, auth.name);
  }
  async function _getRedirectResult(auth, resolverExtern, bypassAuthState = false) {
    if (_isFirebaseServerApp(auth.app)) {
      return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(auth));
    }
    const authInternal = _castAuth(auth);
    const resolver = _withDefaultResolver(authInternal, resolverExtern);
    const action = new RedirectAction(authInternal, resolver, bypassAuthState);
    const result = await action.execute();
    if (result && !bypassAuthState) {
      delete result.user._redirectEventId;
      await authInternal._persistUserIfCurrent(result.user);
      await authInternal._setRedirectUser(null, resolverExtern);
    }
    return result;
  }
  function eventUid(e) {
    return [e.type, e.eventId, e.sessionId, e.tenantId].filter((v) => v).join("-");
  }
  function isNullRedirectEvent({ type, error: error2 }) {
    return type === "unknown" && error2?.code === `auth/${"no-auth-event"}`;
  }
  function isRedirectEvent(event) {
    switch (event.type) {
      case "signInViaRedirect":
      case "linkViaRedirect":
      case "reauthViaRedirect":
        return true;
      case "unknown":
        return isNullRedirectEvent(event);
      default:
        return false;
    }
  }
  async function _getProjectConfig(auth, request = {}) {
    return _performApiRequest(auth, "GET", "/v1/projects", request);
  }
  async function _validateOrigin(auth) {
    if (auth.config.emulator) {
      return;
    }
    const { authorizedDomains } = await _getProjectConfig(auth);
    for (const domain of authorizedDomains) {
      try {
        if (matchDomain(domain)) {
          return;
        }
      } catch {
      }
    }
    _fail(
      auth,
      "unauthorized-domain"
      /* AuthErrorCode.INVALID_ORIGIN */
    );
  }
  function matchDomain(expected) {
    const currentUrl = _getCurrentUrl();
    const { protocol, hostname } = new URL(currentUrl);
    if (expected.startsWith("chrome-extension://")) {
      const ceUrl = new URL(expected);
      if (ceUrl.hostname === "" && hostname === "") {
        return protocol === "chrome-extension:" && expected.replace("chrome-extension://", "") === currentUrl.replace("chrome-extension://", "");
      }
      return protocol === "chrome-extension:" && ceUrl.hostname === hostname;
    }
    if (!HTTP_REGEX.test(protocol)) {
      return false;
    }
    if (IP_ADDRESS_REGEX.test(expected)) {
      return hostname === expected;
    }
    const escapedDomainPattern = expected.replace(/\./g, "\\.");
    const re = new RegExp("^(.+\\." + escapedDomainPattern + "|" + escapedDomainPattern + ")$", "i");
    return re.test(hostname);
  }
  function resetUnloadedGapiModules() {
    const beacon = _window().___jsl;
    if (beacon?.H) {
      for (const hint of Object.keys(beacon.H)) {
        beacon.H[hint].r = beacon.H[hint].r || [];
        beacon.H[hint].L = beacon.H[hint].L || [];
        beacon.H[hint].r = [...beacon.H[hint].L];
        if (beacon.CP) {
          for (let i = 0; i < beacon.CP.length; i++) {
            beacon.CP[i] = null;
          }
        }
      }
    }
  }
  function loadGapi(auth) {
    return new Promise((resolve, reject) => {
      function loadGapiIframe() {
        resetUnloadedGapiModules();
        gapi.load("gapi.iframes", {
          callback: () => {
            resolve(gapi.iframes.getContext());
          },
          ontimeout: () => {
            resetUnloadedGapiModules();
            reject(_createError(
              auth,
              "network-request-failed"
              /* AuthErrorCode.NETWORK_REQUEST_FAILED */
            ));
          },
          timeout: NETWORK_TIMEOUT.get()
        });
      }
      if (_window().gapi?.iframes?.Iframe) {
        resolve(gapi.iframes.getContext());
      } else if (!!_window().gapi?.load) {
        loadGapiIframe();
      } else {
        const cbName = _generateCallbackName("iframefcb");
        _window()[cbName] = () => {
          if (!!gapi.load) {
            loadGapiIframe();
          } else {
            reject(_createError(
              auth,
              "network-request-failed"
              /* AuthErrorCode.NETWORK_REQUEST_FAILED */
            ));
          }
        };
        return _loadJS(`${_gapiScriptUrl()}?onload=${cbName}`).catch((e) => reject(e));
      }
    }).catch((error2) => {
      cachedGApiLoader = null;
      throw error2;
    });
  }
  function _loadGapi(auth) {
    cachedGApiLoader = cachedGApiLoader || loadGapi(auth);
    return cachedGApiLoader;
  }
  function getIframeUrl(auth) {
    const config = auth.config;
    _assert(
      config.authDomain,
      auth,
      "auth-domain-config-required"
      /* AuthErrorCode.MISSING_AUTH_DOMAIN */
    );
    const url = config.emulator ? _emulatorUrl(config, EMULATED_IFRAME_PATH) : `https://${auth.config.authDomain}/${IFRAME_PATH}`;
    const params = {
      apiKey: config.apiKey,
      appName: auth.name,
      v: SDK_VERSION
    };
    const eid = EID_FROM_APIHOST.get(auth.config.apiHost);
    if (eid) {
      params.eid = eid;
    }
    const frameworks = auth._getFrameworks();
    if (frameworks.length) {
      params.fw = frameworks.join(",");
    }
    return `${url}?${querystring(params).slice(1)}`;
  }
  async function _openIframe(auth) {
    const context = await _loadGapi(auth);
    const gapi2 = _window().gapi;
    _assert(
      gapi2,
      auth,
      "internal-error"
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return context.open({
      where: document.body,
      url: getIframeUrl(auth),
      messageHandlersFilter: gapi2.iframes.CROSS_ORIGIN_IFRAMES_FILTER,
      attributes: IFRAME_ATTRIBUTES,
      dontclear: true
    }, (iframe) => new Promise(async (resolve, reject) => {
      await iframe.restyle({
        // Prevent iframe from closing on mouse out.
        setHideOnLeave: false
      });
      const networkError = _createError(
        auth,
        "network-request-failed"
        /* AuthErrorCode.NETWORK_REQUEST_FAILED */
      );
      const networkErrorTimer = _window().setTimeout(() => {
        reject(networkError);
      }, PING_TIMEOUT.get());
      function clearTimerAndResolve() {
        _window().clearTimeout(networkErrorTimer);
        resolve(iframe);
      }
      iframe.ping(clearTimerAndResolve).then(clearTimerAndResolve, () => {
        reject(networkError);
      });
    }));
  }
  function _open(auth, url, name5, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) {
    const top = Math.max((window.screen.availHeight - height) / 2, 0).toString();
    const left = Math.max((window.screen.availWidth - width) / 2, 0).toString();
    let target = "";
    const options = {
      ...BASE_POPUP_OPTIONS,
      width: width.toString(),
      height: height.toString(),
      top,
      left
    };
    const ua = getUA().toLowerCase();
    if (name5) {
      target = _isChromeIOS(ua) ? TARGET_BLANK : name5;
    }
    if (_isFirefox(ua)) {
      url = url || FIREFOX_EMPTY_URL;
      options.scrollbars = "yes";
    }
    const optionsString = Object.entries(options).reduce((accum, [key, value]) => `${accum}${key}=${value},`, "");
    if (_isIOSStandalone(ua) && target !== "_self") {
      openAsNewWindowIOS(url || "", target);
      return new AuthPopup(null);
    }
    const newWin = window.open(url || "", target, optionsString);
    _assert(
      newWin,
      auth,
      "popup-blocked"
      /* AuthErrorCode.POPUP_BLOCKED */
    );
    try {
      newWin.focus();
    } catch (e) {
    }
    return new AuthPopup(newWin);
  }
  function openAsNewWindowIOS(url, target) {
    const el = document.createElement("a");
    el.href = url;
    el.target = target;
    const click = document.createEvent("MouseEvent");
    click.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 1, null);
    el.dispatchEvent(click);
  }
  async function _getRedirectUrl(auth, provider, authType, redirectUrl, eventId, additionalParams) {
    _assert(
      auth.config.authDomain,
      auth,
      "auth-domain-config-required"
      /* AuthErrorCode.MISSING_AUTH_DOMAIN */
    );
    _assert(
      auth.config.apiKey,
      auth,
      "invalid-api-key"
      /* AuthErrorCode.INVALID_API_KEY */
    );
    const params = {
      apiKey: auth.config.apiKey,
      appName: auth.name,
      authType,
      redirectUrl,
      v: SDK_VERSION,
      eventId
    };
    if (provider instanceof FederatedAuthProvider) {
      provider.setDefaultLanguage(auth.languageCode);
      params.providerId = provider.providerId || "";
      if (!isEmpty(provider.getCustomParameters())) {
        params.customParameters = JSON.stringify(provider.getCustomParameters());
      }
      for (const [key, value] of Object.entries(additionalParams || {})) {
        params[key] = value;
      }
    }
    if (provider instanceof BaseOAuthProvider) {
      const scopes = provider.getScopes().filter((scope) => scope !== "");
      if (scopes.length > 0) {
        params.scopes = scopes.join(",");
      }
    }
    if (auth.tenantId) {
      params.tid = auth.tenantId;
    }
    const paramsDict = params;
    for (const key of Object.keys(paramsDict)) {
      if (paramsDict[key] === void 0) {
        delete paramsDict[key];
      }
    }
    const appCheckToken = await auth._getAppCheckToken();
    const appCheckTokenFragment = appCheckToken ? `#${FIREBASE_APP_CHECK_FRAGMENT_ID}=${encodeURIComponent(appCheckToken)}` : "";
    return `${getHandlerBase(auth)}?${querystring(paramsDict).slice(1)}${appCheckTokenFragment}`;
  }
  function getHandlerBase({ config }) {
    if (!config.emulator) {
      return `https://${config.authDomain}/${WIDGET_PATH}`;
    }
    return _emulatorUrl(config, EMULATOR_WIDGET_PATH);
  }
  function _isEmptyString(input) {
    return typeof input === "undefined" || input?.length === 0;
  }
  function getVersionForPlatform(clientPlatform) {
    switch (clientPlatform) {
      case "Node":
        return "node";
      case "ReactNative":
        return "rn";
      case "Worker":
        return "webworker";
      case "Cordova":
        return "cordova";
      case "WebExtension":
        return "web-extension";
      default:
        return void 0;
    }
  }
  function registerAuth(clientPlatform) {
    _registerComponent(new Component(
      "auth",
      (container, { options: deps }) => {
        const app = container.getProvider("app").getImmediate();
        const heartbeatServiceProvider = container.getProvider("heartbeat");
        const appCheckServiceProvider = container.getProvider("app-check-internal");
        const { apiKey, authDomain } = app.options;
        _assert(apiKey && !apiKey.includes(":"), "invalid-api-key", { appName: app.name });
        const config = {
          apiKey,
          authDomain,
          clientPlatform,
          apiHost: "identitytoolkit.googleapis.com",
          tokenApiHost: "securetoken.googleapis.com",
          apiScheme: "https",
          sdkClientVersion: _getClientVersion(clientPlatform)
        };
        const authInstance = new AuthImpl(app, heartbeatServiceProvider, appCheckServiceProvider, config);
        _initializeAuthInstance(authInstance, deps);
        return authInstance;
      },
      "PUBLIC"
      /* ComponentType.PUBLIC */
    ).setInstantiationMode(
      "EXPLICIT"
      /* InstantiationMode.EXPLICIT */
    ).setInstanceCreatedCallback((container, _instanceIdentifier, _instance) => {
      const authInternalProvider = container.getProvider(
        "auth-internal"
        /* _ComponentName.AUTH_INTERNAL */
      );
      authInternalProvider.initialize();
    }));
    _registerComponent(new Component(
      "auth-internal",
      (container) => {
        const auth = _castAuth(container.getProvider(
          "auth"
          /* _ComponentName.AUTH */
        ).getImmediate());
        return ((auth2) => new AuthInterop(auth2))(auth);
      },
      "PRIVATE"
      /* ComponentType.PRIVATE */
    ).setInstantiationMode(
      "EXPLICIT"
      /* InstantiationMode.EXPLICIT */
    ));
    registerVersion(name3, version3, getVersionForPlatform(clientPlatform));
    registerVersion(name3, version3, "esm2020");
  }
  function getAuth(app = getApp()) {
    const provider = _getProvider(app, "auth");
    if (provider.isInitialized()) {
      return provider.getImmediate();
    }
    const auth = initializeAuth(app, {
      popupRedirectResolver: browserPopupRedirectResolver,
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence
      ]
    });
    const authTokenSyncPath = getExperimentalSetting("authTokenSyncURL");
    if (authTokenSyncPath && typeof isSecureContext === "boolean" && isSecureContext) {
      const authTokenSyncUrl = new URL(authTokenSyncPath, location.origin);
      if (location.origin === authTokenSyncUrl.origin) {
        const mintCookie = mintCookieFactory(authTokenSyncUrl.toString());
        beforeAuthStateChanged(auth, mintCookie, () => mintCookie(auth.currentUser));
        onIdTokenChanged(auth, (user) => mintCookie(user));
      }
    }
    const authEmulatorHost = getDefaultEmulatorHost("auth");
    if (authEmulatorHost) {
      connectAuthEmulator(auth, `http://${authEmulatorHost}`);
    }
    return auth;
  }
  function getScriptParentElement() {
    return document.getElementsByTagName("head")?.[0] ?? document;
  }
  var prodErrorMap, _DEFAULT_AUTH_ERROR_FACTORY, logClient, Delay, FetchProvider, SERVER_ERROR_MAP, CookieAuthProxiedEndpoints, DEFAULT_API_TIMEOUT_MS, NetworkTimeout, RecaptchaConfig, ProactiveRefresh, UserMetadata, StsTokenManager, UserImpl, instanceCache, InMemoryPersistence, inMemoryPersistence, PersistenceUserManager, AuthMiddlewareQueue, MINIMUM_MIN_PASSWORD_LENGTH, PasswordPolicyImpl, AuthImpl, Subscription, externalJSProvider, MockGreCAPTCHATopLevel, MockGreCAPTCHA, RECAPTCHA_ENTERPRISE_VERIFIER_TYPE, FAKE_TOKEN, RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME, RecaptchaEnterpriseVerifier, AuthCredential, EmailAuthCredential, IDP_REQUEST_URI$1, OAuthCredential, VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_, PhoneAuthCredential, ActionCodeURL, EmailAuthProvider, FederatedAuthProvider, BaseOAuthProvider, FacebookAuthProvider, GoogleAuthProvider, GithubAuthProvider, TwitterAuthProvider, UserCredentialImpl, MultiFactorError, STORAGE_AVAILABLE_KEY, BrowserPersistenceClass, _POLLING_INTERVAL_MS$1, IE10_LOCAL_STORAGE_SYNC_DELAY, BrowserLocalPersistence, browserLocalPersistence, POLLING_INTERVAL_MS, CookiePersistence, BrowserSessionPersistence, browserSessionPersistence, Receiver, Sender, DB_NAME2, DB_VERSION2, DB_OBJECTSTORE_NAME, DB_DATA_KEYPATH, DBPromise, _POLLING_INTERVAL_MS, _TRANSACTION_RETRY_COUNT, IndexedDBLocalPersistence, indexedDBLocalPersistence, _JSLOAD_CALLBACK, NETWORK_TIMEOUT_DELAY, RECAPTCHA_VERIFIER_TYPE, PhoneAuthProvider, IdpCredential, AbstractPopupRedirectOperation, _POLL_WINDOW_CLOSE_TIMEOUT, PopupOperation, PENDING_REDIRECT_KEY, redirectOutcomeMap, RedirectAction, EVENT_DUPLICATION_CACHE_DURATION_MS, AuthEventManager, IP_ADDRESS_REGEX, HTTP_REGEX, NETWORK_TIMEOUT, cachedGApiLoader, PING_TIMEOUT, IFRAME_PATH, EMULATED_IFRAME_PATH, IFRAME_ATTRIBUTES, EID_FROM_APIHOST, BASE_POPUP_OPTIONS, DEFAULT_WIDTH, DEFAULT_HEIGHT, TARGET_BLANK, FIREFOX_EMPTY_URL, AuthPopup, WIDGET_PATH, EMULATOR_WIDGET_PATH, FIREBASE_APP_CHECK_FRAGMENT_ID, WEB_STORAGE_SUPPORT_KEY, BrowserPopupRedirectResolver, browserPopupRedirectResolver, MultiFactorAssertionImpl, PhoneMultiFactorAssertionImpl, PhoneMultiFactorGenerator, TotpMultiFactorGenerator, TotpMultiFactorAssertionImpl, TotpSecret, name3, version3, AuthInterop, DEFAULT_ID_TOKEN_MAX_AGE, authIdTokenMaxAge, lastPostedIdToken, mintCookieFactory;
  var init_index_d90d2ee5 = __esm({
    "node_modules/@firebase/auth/dist/esm/index-d90d2ee5.js"() {
      init_index_esm4();
      init_index_esm();
      init_index_esm3();
      init_index_esm2();
      prodErrorMap = _prodErrorMap;
      _DEFAULT_AUTH_ERROR_FACTORY = new ErrorFactory("auth", "Firebase", _prodErrorMap());
      logClient = new Logger("@firebase/auth");
      Delay = class {
        constructor(shortDelay, longDelay) {
          this.shortDelay = shortDelay;
          this.longDelay = longDelay;
          debugAssert(longDelay > shortDelay, "Short delay should be less than long delay!");
          this.isMobile = isMobileCordova() || isReactNative();
        }
        get() {
          if (!_isOnline()) {
            return Math.min(5e3, this.shortDelay);
          }
          return this.isMobile ? this.longDelay : this.shortDelay;
        }
      };
      FetchProvider = class {
        static initialize(fetchImpl, headersImpl, responseImpl) {
          this.fetchImpl = fetchImpl;
          if (headersImpl) {
            this.headersImpl = headersImpl;
          }
          if (responseImpl) {
            this.responseImpl = responseImpl;
          }
        }
        static fetch() {
          if (this.fetchImpl) {
            return this.fetchImpl;
          }
          if (typeof self !== "undefined" && "fetch" in self) {
            return self.fetch;
          }
          if (typeof globalThis !== "undefined" && globalThis.fetch) {
            return globalThis.fetch;
          }
          if (typeof fetch !== "undefined") {
            return fetch;
          }
          debugFail("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
        }
        static headers() {
          if (this.headersImpl) {
            return this.headersImpl;
          }
          if (typeof self !== "undefined" && "Headers" in self) {
            return self.Headers;
          }
          if (typeof globalThis !== "undefined" && globalThis.Headers) {
            return globalThis.Headers;
          }
          if (typeof Headers !== "undefined") {
            return Headers;
          }
          debugFail("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
        }
        static response() {
          if (this.responseImpl) {
            return this.responseImpl;
          }
          if (typeof self !== "undefined" && "Response" in self) {
            return self.Response;
          }
          if (typeof globalThis !== "undefined" && globalThis.Response) {
            return globalThis.Response;
          }
          if (typeof Response !== "undefined") {
            return Response;
          }
          debugFail("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill");
        }
      };
      SERVER_ERROR_MAP = {
        // Custom token errors.
        [
          "CREDENTIAL_MISMATCH"
          /* ServerError.CREDENTIAL_MISMATCH */
        ]: "custom-token-mismatch",
        // This can only happen if the SDK sends a bad request.
        [
          "MISSING_CUSTOM_TOKEN"
          /* ServerError.MISSING_CUSTOM_TOKEN */
        ]: "internal-error",
        // Create Auth URI errors.
        [
          "INVALID_IDENTIFIER"
          /* ServerError.INVALID_IDENTIFIER */
        ]: "invalid-email",
        // This can only happen if the SDK sends a bad request.
        [
          "MISSING_CONTINUE_URI"
          /* ServerError.MISSING_CONTINUE_URI */
        ]: "internal-error",
        // Sign in with email and password errors (some apply to sign up too).
        [
          "INVALID_PASSWORD"
          /* ServerError.INVALID_PASSWORD */
        ]: "wrong-password",
        // This can only happen if the SDK sends a bad request.
        [
          "MISSING_PASSWORD"
          /* ServerError.MISSING_PASSWORD */
        ]: "missing-password",
        // Thrown if Email Enumeration Protection is enabled in the project and the email or password is
        // invalid.
        [
          "INVALID_LOGIN_CREDENTIALS"
          /* ServerError.INVALID_LOGIN_CREDENTIALS */
        ]: "invalid-credential",
        // Sign up with email and password errors.
        [
          "EMAIL_EXISTS"
          /* ServerError.EMAIL_EXISTS */
        ]: "email-already-in-use",
        [
          "PASSWORD_LOGIN_DISABLED"
          /* ServerError.PASSWORD_LOGIN_DISABLED */
        ]: "operation-not-allowed",
        // Verify assertion for sign in with credential errors:
        [
          "INVALID_IDP_RESPONSE"
          /* ServerError.INVALID_IDP_RESPONSE */
        ]: "invalid-credential",
        [
          "INVALID_PENDING_TOKEN"
          /* ServerError.INVALID_PENDING_TOKEN */
        ]: "invalid-credential",
        [
          "FEDERATED_USER_ID_ALREADY_LINKED"
          /* ServerError.FEDERATED_USER_ID_ALREADY_LINKED */
        ]: "credential-already-in-use",
        // This can only happen if the SDK sends a bad request.
        [
          "MISSING_REQ_TYPE"
          /* ServerError.MISSING_REQ_TYPE */
        ]: "internal-error",
        // Send Password reset email errors:
        [
          "EMAIL_NOT_FOUND"
          /* ServerError.EMAIL_NOT_FOUND */
        ]: "user-not-found",
        [
          "RESET_PASSWORD_EXCEED_LIMIT"
          /* ServerError.RESET_PASSWORD_EXCEED_LIMIT */
        ]: "too-many-requests",
        [
          "EXPIRED_OOB_CODE"
          /* ServerError.EXPIRED_OOB_CODE */
        ]: "expired-action-code",
        [
          "INVALID_OOB_CODE"
          /* ServerError.INVALID_OOB_CODE */
        ]: "invalid-action-code",
        // This can only happen if the SDK sends a bad request.
        [
          "MISSING_OOB_CODE"
          /* ServerError.MISSING_OOB_CODE */
        ]: "internal-error",
        // Operations that require ID token in request:
        [
          "CREDENTIAL_TOO_OLD_LOGIN_AGAIN"
          /* ServerError.CREDENTIAL_TOO_OLD_LOGIN_AGAIN */
        ]: "requires-recent-login",
        [
          "INVALID_ID_TOKEN"
          /* ServerError.INVALID_ID_TOKEN */
        ]: "invalid-user-token",
        [
          "TOKEN_EXPIRED"
          /* ServerError.TOKEN_EXPIRED */
        ]: "user-token-expired",
        [
          "USER_NOT_FOUND"
          /* ServerError.USER_NOT_FOUND */
        ]: "user-token-expired",
        // Other errors.
        [
          "TOO_MANY_ATTEMPTS_TRY_LATER"
          /* ServerError.TOO_MANY_ATTEMPTS_TRY_LATER */
        ]: "too-many-requests",
        [
          "PASSWORD_DOES_NOT_MEET_REQUIREMENTS"
          /* ServerError.PASSWORD_DOES_NOT_MEET_REQUIREMENTS */
        ]: "password-does-not-meet-requirements",
        // Phone Auth related errors.
        [
          "INVALID_CODE"
          /* ServerError.INVALID_CODE */
        ]: "invalid-verification-code",
        [
          "INVALID_SESSION_INFO"
          /* ServerError.INVALID_SESSION_INFO */
        ]: "invalid-verification-id",
        [
          "INVALID_TEMPORARY_PROOF"
          /* ServerError.INVALID_TEMPORARY_PROOF */
        ]: "invalid-credential",
        [
          "MISSING_SESSION_INFO"
          /* ServerError.MISSING_SESSION_INFO */
        ]: "missing-verification-id",
        [
          "SESSION_EXPIRED"
          /* ServerError.SESSION_EXPIRED */
        ]: "code-expired",
        // Other action code errors when additional settings passed.
        // MISSING_CONTINUE_URI is getting mapped to INTERNAL_ERROR above.
        // This is OK as this error will be caught by client side validation.
        [
          "MISSING_ANDROID_PACKAGE_NAME"
          /* ServerError.MISSING_ANDROID_PACKAGE_NAME */
        ]: "missing-android-pkg-name",
        [
          "UNAUTHORIZED_DOMAIN"
          /* ServerError.UNAUTHORIZED_DOMAIN */
        ]: "unauthorized-continue-uri",
        // getProjectConfig errors when clientId is passed.
        [
          "INVALID_OAUTH_CLIENT_ID"
          /* ServerError.INVALID_OAUTH_CLIENT_ID */
        ]: "invalid-oauth-client-id",
        // User actions (sign-up or deletion) disabled errors.
        [
          "ADMIN_ONLY_OPERATION"
          /* ServerError.ADMIN_ONLY_OPERATION */
        ]: "admin-restricted-operation",
        // Multi factor related errors.
        [
          "INVALID_MFA_PENDING_CREDENTIAL"
          /* ServerError.INVALID_MFA_PENDING_CREDENTIAL */
        ]: "invalid-multi-factor-session",
        [
          "MFA_ENROLLMENT_NOT_FOUND"
          /* ServerError.MFA_ENROLLMENT_NOT_FOUND */
        ]: "multi-factor-info-not-found",
        [
          "MISSING_MFA_ENROLLMENT_ID"
          /* ServerError.MISSING_MFA_ENROLLMENT_ID */
        ]: "missing-multi-factor-info",
        [
          "MISSING_MFA_PENDING_CREDENTIAL"
          /* ServerError.MISSING_MFA_PENDING_CREDENTIAL */
        ]: "missing-multi-factor-session",
        [
          "SECOND_FACTOR_EXISTS"
          /* ServerError.SECOND_FACTOR_EXISTS */
        ]: "second-factor-already-in-use",
        [
          "SECOND_FACTOR_LIMIT_EXCEEDED"
          /* ServerError.SECOND_FACTOR_LIMIT_EXCEEDED */
        ]: "maximum-second-factor-count-exceeded",
        // Blocking functions related errors.
        [
          "BLOCKING_FUNCTION_ERROR_RESPONSE"
          /* ServerError.BLOCKING_FUNCTION_ERROR_RESPONSE */
        ]: "internal-error",
        // Recaptcha related errors.
        [
          "RECAPTCHA_NOT_ENABLED"
          /* ServerError.RECAPTCHA_NOT_ENABLED */
        ]: "recaptcha-not-enabled",
        [
          "MISSING_RECAPTCHA_TOKEN"
          /* ServerError.MISSING_RECAPTCHA_TOKEN */
        ]: "missing-recaptcha-token",
        [
          "INVALID_RECAPTCHA_TOKEN"
          /* ServerError.INVALID_RECAPTCHA_TOKEN */
        ]: "invalid-recaptcha-token",
        [
          "INVALID_RECAPTCHA_ACTION"
          /* ServerError.INVALID_RECAPTCHA_ACTION */
        ]: "invalid-recaptcha-action",
        [
          "MISSING_CLIENT_TYPE"
          /* ServerError.MISSING_CLIENT_TYPE */
        ]: "missing-client-type",
        [
          "MISSING_RECAPTCHA_VERSION"
          /* ServerError.MISSING_RECAPTCHA_VERSION */
        ]: "missing-recaptcha-version",
        [
          "INVALID_RECAPTCHA_VERSION"
          /* ServerError.INVALID_RECAPTCHA_VERSION */
        ]: "invalid-recaptcha-version",
        [
          "INVALID_REQ_TYPE"
          /* ServerError.INVALID_REQ_TYPE */
        ]: "invalid-req-type"
        /* AuthErrorCode.INVALID_REQ_TYPE */
      };
      CookieAuthProxiedEndpoints = [
        "/v1/accounts:signInWithCustomToken",
        "/v1/accounts:signInWithEmailLink",
        "/v1/accounts:signInWithIdp",
        "/v1/accounts:signInWithPassword",
        "/v1/accounts:signInWithPhoneNumber",
        "/v1/token"
        /* Endpoint.TOKEN */
      ];
      DEFAULT_API_TIMEOUT_MS = new Delay(3e4, 6e4);
      NetworkTimeout = class {
        clearNetworkTimeout() {
          clearTimeout(this.timer);
        }
        constructor(auth) {
          this.auth = auth;
          this.timer = null;
          this.promise = new Promise((_, reject) => {
            this.timer = setTimeout(() => {
              return reject(_createError(
                this.auth,
                "network-request-failed"
                /* AuthErrorCode.NETWORK_REQUEST_FAILED */
              ));
            }, DEFAULT_API_TIMEOUT_MS.get());
          });
        }
      };
      RecaptchaConfig = class {
        constructor(response) {
          this.siteKey = "";
          this.recaptchaEnforcementState = [];
          if (response.recaptchaKey === void 0) {
            throw new Error("recaptchaKey undefined");
          }
          this.siteKey = response.recaptchaKey.split("/")[3];
          this.recaptchaEnforcementState = response.recaptchaEnforcementState;
        }
        /**
         * Returns the reCAPTCHA Enterprise enforcement state for the given provider.
         *
         * @param providerStr - The provider whose enforcement state is to be returned.
         * @returns The reCAPTCHA Enterprise enforcement state for the given provider.
         */
        getProviderEnforcementState(providerStr) {
          if (!this.recaptchaEnforcementState || this.recaptchaEnforcementState.length === 0) {
            return null;
          }
          for (const recaptchaEnforcementState of this.recaptchaEnforcementState) {
            if (recaptchaEnforcementState.provider && recaptchaEnforcementState.provider === providerStr) {
              return _parseEnforcementState(recaptchaEnforcementState.enforcementState);
            }
          }
          return null;
        }
        /**
         * Returns true if the reCAPTCHA Enterprise enforcement state for the provider is set to ENFORCE or AUDIT.
         *
         * @param providerStr - The provider whose enablement state is to be returned.
         * @returns Whether or not reCAPTCHA Enterprise protection is enabled for the given provider.
         */
        isProviderEnabled(providerStr) {
          return this.getProviderEnforcementState(providerStr) === "ENFORCE" || this.getProviderEnforcementState(providerStr) === "AUDIT";
        }
        /**
         * Returns true if reCAPTCHA Enterprise protection is enabled in at least one provider, otherwise
         * returns false.
         *
         * @returns Whether or not reCAPTCHA Enterprise protection is enabled for at least one provider.
         */
        isAnyProviderEnabled() {
          return this.isProviderEnabled(
            "EMAIL_PASSWORD_PROVIDER"
            /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
          ) || this.isProviderEnabled(
            "PHONE_PROVIDER"
            /* RecaptchaAuthProvider.PHONE_PROVIDER */
          );
        }
      };
      ProactiveRefresh = class {
        constructor(user) {
          this.user = user;
          this.isRunning = false;
          this.timerId = null;
          this.errorBackoff = 3e4;
        }
        _start() {
          if (this.isRunning) {
            return;
          }
          this.isRunning = true;
          this.schedule();
        }
        _stop() {
          if (!this.isRunning) {
            return;
          }
          this.isRunning = false;
          if (this.timerId !== null) {
            clearTimeout(this.timerId);
          }
        }
        getInterval(wasError) {
          if (wasError) {
            const interval = this.errorBackoff;
            this.errorBackoff = Math.min(
              this.errorBackoff * 2,
              96e4
              /* Duration.RETRY_BACKOFF_MAX */
            );
            return interval;
          } else {
            this.errorBackoff = 3e4;
            const expTime = this.user.stsTokenManager.expirationTime ?? 0;
            const interval = expTime - Date.now() - 3e5;
            return Math.max(0, interval);
          }
        }
        schedule(wasError = false) {
          if (!this.isRunning) {
            return;
          }
          const interval = this.getInterval(wasError);
          this.timerId = setTimeout(async () => {
            await this.iteration();
          }, interval);
        }
        async iteration() {
          try {
            await this.user.getIdToken(true);
          } catch (e) {
            if (e?.code === `auth/${"network-request-failed"}`) {
              this.schedule(
                /* wasError */
                true
              );
            }
            return;
          }
          this.schedule();
        }
      };
      UserMetadata = class {
        constructor(createdAt, lastLoginAt) {
          this.createdAt = createdAt;
          this.lastLoginAt = lastLoginAt;
          this._initializeTime();
        }
        _initializeTime() {
          this.lastSignInTime = utcTimestampToDateString(this.lastLoginAt);
          this.creationTime = utcTimestampToDateString(this.createdAt);
        }
        _copy(metadata) {
          this.createdAt = metadata.createdAt;
          this.lastLoginAt = metadata.lastLoginAt;
          this._initializeTime();
        }
        toJSON() {
          return {
            createdAt: this.createdAt,
            lastLoginAt: this.lastLoginAt
          };
        }
      };
      StsTokenManager = class _StsTokenManager {
        constructor() {
          this.refreshToken = null;
          this.accessToken = null;
          this.expirationTime = null;
        }
        get isExpired() {
          return !this.expirationTime || Date.now() > this.expirationTime - 3e4;
        }
        updateFromServerResponse(response) {
          _assert(
            response.idToken,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          _assert(
            typeof response.idToken !== "undefined",
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          _assert(
            typeof response.refreshToken !== "undefined",
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          const expiresIn = "expiresIn" in response && typeof response.expiresIn !== "undefined" ? Number(response.expiresIn) : _tokenExpiresIn(response.idToken);
          this.updateTokensAndExpiration(response.idToken, response.refreshToken, expiresIn);
        }
        updateFromIdToken(idToken) {
          _assert(
            idToken.length !== 0,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          const expiresIn = _tokenExpiresIn(idToken);
          this.updateTokensAndExpiration(idToken, null, expiresIn);
        }
        async getToken(auth, forceRefresh = false) {
          if (!forceRefresh && this.accessToken && !this.isExpired) {
            return this.accessToken;
          }
          _assert(
            this.refreshToken,
            auth,
            "user-token-expired"
            /* AuthErrorCode.TOKEN_EXPIRED */
          );
          if (this.refreshToken) {
            await this.refresh(auth, this.refreshToken);
            return this.accessToken;
          }
          return null;
        }
        clearRefreshToken() {
          this.refreshToken = null;
        }
        async refresh(auth, oldToken) {
          const { accessToken, refreshToken, expiresIn } = await requestStsToken(auth, oldToken);
          this.updateTokensAndExpiration(accessToken, refreshToken, Number(expiresIn));
        }
        updateTokensAndExpiration(accessToken, refreshToken, expiresInSec) {
          this.refreshToken = refreshToken || null;
          this.accessToken = accessToken || null;
          this.expirationTime = Date.now() + expiresInSec * 1e3;
        }
        static fromJSON(appName, object) {
          const { refreshToken, accessToken, expirationTime } = object;
          const manager = new _StsTokenManager();
          if (refreshToken) {
            _assert(typeof refreshToken === "string", "internal-error", {
              appName
            });
            manager.refreshToken = refreshToken;
          }
          if (accessToken) {
            _assert(typeof accessToken === "string", "internal-error", {
              appName
            });
            manager.accessToken = accessToken;
          }
          if (expirationTime) {
            _assert(typeof expirationTime === "number", "internal-error", {
              appName
            });
            manager.expirationTime = expirationTime;
          }
          return manager;
        }
        toJSON() {
          return {
            refreshToken: this.refreshToken,
            accessToken: this.accessToken,
            expirationTime: this.expirationTime
          };
        }
        _assign(stsTokenManager) {
          this.accessToken = stsTokenManager.accessToken;
          this.refreshToken = stsTokenManager.refreshToken;
          this.expirationTime = stsTokenManager.expirationTime;
        }
        _clone() {
          return Object.assign(new _StsTokenManager(), this.toJSON());
        }
        _performRefresh() {
          return debugFail("not implemented");
        }
      };
      UserImpl = class _UserImpl {
        constructor({ uid, auth, stsTokenManager, ...opt }) {
          this.providerId = "firebase";
          this.proactiveRefresh = new ProactiveRefresh(this);
          this.reloadUserInfo = null;
          this.reloadListener = null;
          this.uid = uid;
          this.auth = auth;
          this.stsTokenManager = stsTokenManager;
          this.accessToken = stsTokenManager.accessToken;
          this.displayName = opt.displayName || null;
          this.email = opt.email || null;
          this.emailVerified = opt.emailVerified || false;
          this.phoneNumber = opt.phoneNumber || null;
          this.photoURL = opt.photoURL || null;
          this.isAnonymous = opt.isAnonymous || false;
          this.tenantId = opt.tenantId || null;
          this.providerData = opt.providerData ? [...opt.providerData] : [];
          this.metadata = new UserMetadata(opt.createdAt || void 0, opt.lastLoginAt || void 0);
        }
        async getIdToken(forceRefresh) {
          const accessToken = await _logoutIfInvalidated(this, this.stsTokenManager.getToken(this.auth, forceRefresh));
          _assert(
            accessToken,
            this.auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          if (this.accessToken !== accessToken) {
            this.accessToken = accessToken;
            await this.auth._persistUserIfCurrent(this);
            this.auth._notifyListenersIfCurrent(this);
          }
          return accessToken;
        }
        getIdTokenResult(forceRefresh) {
          return getIdTokenResult(this, forceRefresh);
        }
        reload() {
          return reload(this);
        }
        _assign(user) {
          if (this === user) {
            return;
          }
          _assert(
            this.uid === user.uid,
            this.auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          this.displayName = user.displayName;
          this.photoURL = user.photoURL;
          this.email = user.email;
          this.emailVerified = user.emailVerified;
          this.phoneNumber = user.phoneNumber;
          this.isAnonymous = user.isAnonymous;
          this.tenantId = user.tenantId;
          this.providerData = user.providerData.map((userInfo) => ({ ...userInfo }));
          this.metadata._copy(user.metadata);
          this.stsTokenManager._assign(user.stsTokenManager);
        }
        _clone(auth) {
          const newUser = new _UserImpl({
            ...this,
            auth,
            stsTokenManager: this.stsTokenManager._clone()
          });
          newUser.metadata._copy(this.metadata);
          return newUser;
        }
        _onReload(callback) {
          _assert(
            !this.reloadListener,
            this.auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          this.reloadListener = callback;
          if (this.reloadUserInfo) {
            this._notifyReloadListener(this.reloadUserInfo);
            this.reloadUserInfo = null;
          }
        }
        _notifyReloadListener(userInfo) {
          if (this.reloadListener) {
            this.reloadListener(userInfo);
          } else {
            this.reloadUserInfo = userInfo;
          }
        }
        _startProactiveRefresh() {
          this.proactiveRefresh._start();
        }
        _stopProactiveRefresh() {
          this.proactiveRefresh._stop();
        }
        async _updateTokensIfNecessary(response, reload2 = false) {
          let tokensRefreshed = false;
          if (response.idToken && response.idToken !== this.stsTokenManager.accessToken) {
            this.stsTokenManager.updateFromServerResponse(response);
            tokensRefreshed = true;
          }
          if (reload2) {
            await _reloadWithoutSaving(this);
          }
          await this.auth._persistUserIfCurrent(this);
          if (tokensRefreshed) {
            this.auth._notifyListenersIfCurrent(this);
          }
        }
        async delete() {
          if (_isFirebaseServerApp(this.auth.app)) {
            return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this.auth));
          }
          const idToken = await this.getIdToken();
          await _logoutIfInvalidated(this, deleteAccount(this.auth, { idToken }));
          this.stsTokenManager.clearRefreshToken();
          return this.auth.signOut();
        }
        toJSON() {
          return {
            uid: this.uid,
            email: this.email || void 0,
            emailVerified: this.emailVerified,
            displayName: this.displayName || void 0,
            isAnonymous: this.isAnonymous,
            photoURL: this.photoURL || void 0,
            phoneNumber: this.phoneNumber || void 0,
            tenantId: this.tenantId || void 0,
            providerData: this.providerData.map((userInfo) => ({ ...userInfo })),
            stsTokenManager: this.stsTokenManager.toJSON(),
            // Redirect event ID must be maintained in case there is a pending
            // redirect event.
            _redirectEventId: this._redirectEventId,
            ...this.metadata.toJSON(),
            // Required for compatibility with the legacy SDK (go/firebase-auth-sdk-persistence-parsing):
            apiKey: this.auth.config.apiKey,
            appName: this.auth.name
            // Missing authDomain will be tolerated by the legacy SDK.
            // stsTokenManager.apiKey isn't actually required (despite the legacy SDK persisting it).
          };
        }
        get refreshToken() {
          return this.stsTokenManager.refreshToken || "";
        }
        static _fromJSON(auth, object) {
          const displayName = object.displayName ?? void 0;
          const email = object.email ?? void 0;
          const phoneNumber = object.phoneNumber ?? void 0;
          const photoURL = object.photoURL ?? void 0;
          const tenantId = object.tenantId ?? void 0;
          const _redirectEventId = object._redirectEventId ?? void 0;
          const createdAt = object.createdAt ?? void 0;
          const lastLoginAt = object.lastLoginAt ?? void 0;
          const { uid, emailVerified, isAnonymous, providerData, stsTokenManager: plainObjectTokenManager } = object;
          _assert(
            uid && plainObjectTokenManager,
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          const stsTokenManager = StsTokenManager.fromJSON(this.name, plainObjectTokenManager);
          _assert(
            typeof uid === "string",
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          assertStringOrUndefined(displayName, auth.name);
          assertStringOrUndefined(email, auth.name);
          _assert(
            typeof emailVerified === "boolean",
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          _assert(
            typeof isAnonymous === "boolean",
            auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          assertStringOrUndefined(phoneNumber, auth.name);
          assertStringOrUndefined(photoURL, auth.name);
          assertStringOrUndefined(tenantId, auth.name);
          assertStringOrUndefined(_redirectEventId, auth.name);
          assertStringOrUndefined(createdAt, auth.name);
          assertStringOrUndefined(lastLoginAt, auth.name);
          const user = new _UserImpl({
            uid,
            auth,
            email,
            emailVerified,
            displayName,
            isAnonymous,
            photoURL,
            phoneNumber,
            tenantId,
            stsTokenManager,
            createdAt,
            lastLoginAt
          });
          if (providerData && Array.isArray(providerData)) {
            user.providerData = providerData.map((userInfo) => ({ ...userInfo }));
          }
          if (_redirectEventId) {
            user._redirectEventId = _redirectEventId;
          }
          return user;
        }
        /**
         * Initialize a User from an idToken server response
         * @param auth
         * @param idTokenResponse
         */
        static async _fromIdTokenResponse(auth, idTokenResponse, isAnonymous = false) {
          const stsTokenManager = new StsTokenManager();
          stsTokenManager.updateFromServerResponse(idTokenResponse);
          const user = new _UserImpl({
            uid: idTokenResponse.localId,
            auth,
            stsTokenManager,
            isAnonymous
          });
          await _reloadWithoutSaving(user);
          return user;
        }
        /**
         * Initialize a User from an idToken server response
         * @param auth
         * @param idTokenResponse
         */
        static async _fromGetAccountInfoResponse(auth, response, idToken) {
          const coreAccount = response.users[0];
          _assert(
            coreAccount.localId !== void 0,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          const providerData = coreAccount.providerUserInfo !== void 0 ? extractProviderData(coreAccount.providerUserInfo) : [];
          const isAnonymous = !(coreAccount.email && coreAccount.passwordHash) && !providerData?.length;
          const stsTokenManager = new StsTokenManager();
          stsTokenManager.updateFromIdToken(idToken);
          const user = new _UserImpl({
            uid: coreAccount.localId,
            auth,
            stsTokenManager,
            isAnonymous
          });
          const updates = {
            uid: coreAccount.localId,
            displayName: coreAccount.displayName || null,
            photoURL: coreAccount.photoUrl || null,
            email: coreAccount.email || null,
            emailVerified: coreAccount.emailVerified || false,
            phoneNumber: coreAccount.phoneNumber || null,
            tenantId: coreAccount.tenantId || null,
            providerData,
            metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
            isAnonymous: !(coreAccount.email && coreAccount.passwordHash) && !providerData?.length
          };
          Object.assign(user, updates);
          return user;
        }
      };
      instanceCache = /* @__PURE__ */ new Map();
      InMemoryPersistence = class {
        constructor() {
          this.type = "NONE";
          this.storage = {};
        }
        async _isAvailable() {
          return true;
        }
        async _set(key, value) {
          this.storage[key] = value;
        }
        async _get(key) {
          const value = this.storage[key];
          return value === void 0 ? null : value;
        }
        async _remove(key) {
          delete this.storage[key];
        }
        _addListener(_key, _listener) {
          return;
        }
        _removeListener(_key, _listener) {
          return;
        }
      };
      InMemoryPersistence.type = "NONE";
      inMemoryPersistence = InMemoryPersistence;
      PersistenceUserManager = class _PersistenceUserManager {
        constructor(persistence, auth, userKey) {
          this.persistence = persistence;
          this.auth = auth;
          this.userKey = userKey;
          const { config, name: name5 } = this.auth;
          this.fullUserKey = _persistenceKeyName(this.userKey, config.apiKey, name5);
          this.fullPersistenceKey = _persistenceKeyName("persistence", config.apiKey, name5);
          this.boundEventHandler = auth._onStorageEvent.bind(auth);
          this.persistence._addListener(this.fullUserKey, this.boundEventHandler);
        }
        setCurrentUser(user) {
          return this.persistence._set(this.fullUserKey, user.toJSON());
        }
        async getCurrentUser() {
          const blob = await this.persistence._get(this.fullUserKey);
          if (!blob) {
            return null;
          }
          if (typeof blob === "string") {
            const response = await getAccountInfo(this.auth, { idToken: blob }).catch(() => void 0);
            if (!response) {
              return null;
            }
            return UserImpl._fromGetAccountInfoResponse(this.auth, response, blob);
          }
          return UserImpl._fromJSON(this.auth, blob);
        }
        removeCurrentUser() {
          return this.persistence._remove(this.fullUserKey);
        }
        savePersistenceForRedirect() {
          return this.persistence._set(this.fullPersistenceKey, this.persistence.type);
        }
        async setPersistence(newPersistence) {
          if (this.persistence === newPersistence) {
            return;
          }
          const currentUser = await this.getCurrentUser();
          await this.removeCurrentUser();
          this.persistence = newPersistence;
          if (currentUser) {
            return this.setCurrentUser(currentUser);
          }
        }
        delete() {
          this.persistence._removeListener(this.fullUserKey, this.boundEventHandler);
        }
        static async create(auth, persistenceHierarchy, userKey = "authUser") {
          if (!persistenceHierarchy.length) {
            return new _PersistenceUserManager(_getInstance(inMemoryPersistence), auth, userKey);
          }
          const availablePersistences = (await Promise.all(persistenceHierarchy.map(async (persistence) => {
            if (await persistence._isAvailable()) {
              return persistence;
            }
            return void 0;
          }))).filter((persistence) => persistence);
          let selectedPersistence = availablePersistences[0] || _getInstance(inMemoryPersistence);
          const key = _persistenceKeyName(userKey, auth.config.apiKey, auth.name);
          let userToMigrate = null;
          for (const persistence of persistenceHierarchy) {
            try {
              const blob = await persistence._get(key);
              if (blob) {
                let user;
                if (typeof blob === "string") {
                  const response = await getAccountInfo(auth, {
                    idToken: blob
                  }).catch(() => void 0);
                  if (!response) {
                    break;
                  }
                  user = await UserImpl._fromGetAccountInfoResponse(auth, response, blob);
                } else {
                  user = UserImpl._fromJSON(auth, blob);
                }
                if (persistence !== selectedPersistence) {
                  userToMigrate = user;
                }
                selectedPersistence = persistence;
                break;
              }
            } catch {
            }
          }
          const migrationHierarchy = availablePersistences.filter((p) => p._shouldAllowMigration);
          if (!selectedPersistence._shouldAllowMigration || !migrationHierarchy.length) {
            return new _PersistenceUserManager(selectedPersistence, auth, userKey);
          }
          selectedPersistence = migrationHierarchy[0];
          if (userToMigrate) {
            await selectedPersistence._set(key, userToMigrate.toJSON());
          }
          await Promise.all(persistenceHierarchy.map(async (persistence) => {
            if (persistence !== selectedPersistence) {
              try {
                await persistence._remove(key);
              } catch {
              }
            }
          }));
          return new _PersistenceUserManager(selectedPersistence, auth, userKey);
        }
      };
      AuthMiddlewareQueue = class {
        constructor(auth) {
          this.auth = auth;
          this.queue = [];
        }
        pushCallback(callback, onAbort) {
          const wrappedCallback = (user) => new Promise((resolve, reject) => {
            try {
              const result = callback(user);
              resolve(result);
            } catch (e) {
              reject(e);
            }
          });
          wrappedCallback.onAbort = onAbort;
          this.queue.push(wrappedCallback);
          const index = this.queue.length - 1;
          return () => {
            this.queue[index] = () => Promise.resolve();
          };
        }
        async runMiddleware(nextUser) {
          if (this.auth.currentUser === nextUser) {
            return;
          }
          const onAbortStack = [];
          try {
            for (const beforeStateCallback of this.queue) {
              await beforeStateCallback(nextUser);
              if (beforeStateCallback.onAbort) {
                onAbortStack.push(beforeStateCallback.onAbort);
              }
            }
          } catch (e) {
            onAbortStack.reverse();
            for (const onAbort of onAbortStack) {
              try {
                onAbort();
              } catch (_) {
              }
            }
            throw this.auth._errorFactory.create("login-blocked", {
              originalMessage: e?.message
            });
          }
        }
      };
      MINIMUM_MIN_PASSWORD_LENGTH = 6;
      PasswordPolicyImpl = class {
        constructor(response) {
          const responseOptions = response.customStrengthOptions;
          this.customStrengthOptions = {};
          this.customStrengthOptions.minPasswordLength = responseOptions.minPasswordLength ?? MINIMUM_MIN_PASSWORD_LENGTH;
          if (responseOptions.maxPasswordLength) {
            this.customStrengthOptions.maxPasswordLength = responseOptions.maxPasswordLength;
          }
          if (responseOptions.containsLowercaseCharacter !== void 0) {
            this.customStrengthOptions.containsLowercaseLetter = responseOptions.containsLowercaseCharacter;
          }
          if (responseOptions.containsUppercaseCharacter !== void 0) {
            this.customStrengthOptions.containsUppercaseLetter = responseOptions.containsUppercaseCharacter;
          }
          if (responseOptions.containsNumericCharacter !== void 0) {
            this.customStrengthOptions.containsNumericCharacter = responseOptions.containsNumericCharacter;
          }
          if (responseOptions.containsNonAlphanumericCharacter !== void 0) {
            this.customStrengthOptions.containsNonAlphanumericCharacter = responseOptions.containsNonAlphanumericCharacter;
          }
          this.enforcementState = response.enforcementState;
          if (this.enforcementState === "ENFORCEMENT_STATE_UNSPECIFIED") {
            this.enforcementState = "OFF";
          }
          this.allowedNonAlphanumericCharacters = response.allowedNonAlphanumericCharacters?.join("") ?? "";
          this.forceUpgradeOnSignin = response.forceUpgradeOnSignin ?? false;
          this.schemaVersion = response.schemaVersion;
        }
        validatePassword(password) {
          const status = {
            isValid: true,
            passwordPolicy: this
          };
          this.validatePasswordLengthOptions(password, status);
          this.validatePasswordCharacterOptions(password, status);
          status.isValid && (status.isValid = status.meetsMinPasswordLength ?? true);
          status.isValid && (status.isValid = status.meetsMaxPasswordLength ?? true);
          status.isValid && (status.isValid = status.containsLowercaseLetter ?? true);
          status.isValid && (status.isValid = status.containsUppercaseLetter ?? true);
          status.isValid && (status.isValid = status.containsNumericCharacter ?? true);
          status.isValid && (status.isValid = status.containsNonAlphanumericCharacter ?? true);
          return status;
        }
        /**
         * Validates that the password meets the length options for the policy.
         *
         * @param password Password to validate.
         * @param status Validation status.
         */
        validatePasswordLengthOptions(password, status) {
          const minPasswordLength = this.customStrengthOptions.minPasswordLength;
          const maxPasswordLength = this.customStrengthOptions.maxPasswordLength;
          if (minPasswordLength) {
            status.meetsMinPasswordLength = password.length >= minPasswordLength;
          }
          if (maxPasswordLength) {
            status.meetsMaxPasswordLength = password.length <= maxPasswordLength;
          }
        }
        /**
         * Validates that the password meets the character options for the policy.
         *
         * @param password Password to validate.
         * @param status Validation status.
         */
        validatePasswordCharacterOptions(password, status) {
          this.updatePasswordCharacterOptionsStatuses(
            status,
            /* containsLowercaseCharacter= */
            false,
            /* containsUppercaseCharacter= */
            false,
            /* containsNumericCharacter= */
            false,
            /* containsNonAlphanumericCharacter= */
            false
          );
          let passwordChar;
          for (let i = 0; i < password.length; i++) {
            passwordChar = password.charAt(i);
            this.updatePasswordCharacterOptionsStatuses(
              status,
              /* containsLowercaseCharacter= */
              passwordChar >= "a" && passwordChar <= "z",
              /* containsUppercaseCharacter= */
              passwordChar >= "A" && passwordChar <= "Z",
              /* containsNumericCharacter= */
              passwordChar >= "0" && passwordChar <= "9",
              /* containsNonAlphanumericCharacter= */
              this.allowedNonAlphanumericCharacters.includes(passwordChar)
            );
          }
        }
        /**
         * Updates the running validation status with the statuses for the character options.
         * Expected to be called each time a character is processed to update each option status
         * based on the current character.
         *
         * @param status Validation status.
         * @param containsLowercaseCharacter Whether the character is a lowercase letter.
         * @param containsUppercaseCharacter Whether the character is an uppercase letter.
         * @param containsNumericCharacter Whether the character is a numeric character.
         * @param containsNonAlphanumericCharacter Whether the character is a non-alphanumeric character.
         */
        updatePasswordCharacterOptionsStatuses(status, containsLowercaseCharacter, containsUppercaseCharacter, containsNumericCharacter, containsNonAlphanumericCharacter) {
          if (this.customStrengthOptions.containsLowercaseLetter) {
            status.containsLowercaseLetter || (status.containsLowercaseLetter = containsLowercaseCharacter);
          }
          if (this.customStrengthOptions.containsUppercaseLetter) {
            status.containsUppercaseLetter || (status.containsUppercaseLetter = containsUppercaseCharacter);
          }
          if (this.customStrengthOptions.containsNumericCharacter) {
            status.containsNumericCharacter || (status.containsNumericCharacter = containsNumericCharacter);
          }
          if (this.customStrengthOptions.containsNonAlphanumericCharacter) {
            status.containsNonAlphanumericCharacter || (status.containsNonAlphanumericCharacter = containsNonAlphanumericCharacter);
          }
        }
      };
      AuthImpl = class {
        constructor(app, heartbeatServiceProvider, appCheckServiceProvider, config) {
          this.app = app;
          this.heartbeatServiceProvider = heartbeatServiceProvider;
          this.appCheckServiceProvider = appCheckServiceProvider;
          this.config = config;
          this.currentUser = null;
          this.emulatorConfig = null;
          this.operations = Promise.resolve();
          this.authStateSubscription = new Subscription(this);
          this.idTokenSubscription = new Subscription(this);
          this.beforeStateQueue = new AuthMiddlewareQueue(this);
          this.redirectUser = null;
          this.isProactiveRefreshEnabled = false;
          this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION = 1;
          this._canInitEmulator = true;
          this._isInitialized = false;
          this._deleted = false;
          this._initializationPromise = null;
          this._popupRedirectResolver = null;
          this._errorFactory = _DEFAULT_AUTH_ERROR_FACTORY;
          this._agentRecaptchaConfig = null;
          this._tenantRecaptchaConfigs = {};
          this._projectPasswordPolicy = null;
          this._tenantPasswordPolicies = {};
          this._resolvePersistenceManagerAvailable = void 0;
          this.lastNotifiedUid = void 0;
          this.languageCode = null;
          this.tenantId = null;
          this.settings = { appVerificationDisabledForTesting: false };
          this.frameworks = [];
          this.name = app.name;
          this.clientVersion = config.sdkClientVersion;
          this._persistenceManagerAvailable = new Promise((resolve) => this._resolvePersistenceManagerAvailable = resolve);
        }
        _initializeWithPersistence(persistenceHierarchy, popupRedirectResolver) {
          if (popupRedirectResolver) {
            this._popupRedirectResolver = _getInstance(popupRedirectResolver);
          }
          this._initializationPromise = this.queue(async () => {
            if (this._deleted) {
              return;
            }
            this.persistenceManager = await PersistenceUserManager.create(this, persistenceHierarchy);
            this._resolvePersistenceManagerAvailable?.();
            if (this._deleted) {
              return;
            }
            if (this._popupRedirectResolver?._shouldInitProactively) {
              try {
                await this._popupRedirectResolver._initialize(this);
              } catch (e) {
              }
            }
            await this.initializeCurrentUser(popupRedirectResolver);
            this.lastNotifiedUid = this.currentUser?.uid || null;
            if (this._deleted) {
              return;
            }
            this._isInitialized = true;
          });
          return this._initializationPromise;
        }
        /**
         * If the persistence is changed in another window, the user manager will let us know
         */
        async _onStorageEvent() {
          if (this._deleted) {
            return;
          }
          const user = await this.assertedPersistence.getCurrentUser();
          if (!this.currentUser && !user) {
            return;
          }
          if (this.currentUser && user && this.currentUser.uid === user.uid) {
            this._currentUser._assign(user);
            await this.currentUser.getIdToken();
            return;
          }
          await this._updateCurrentUser(
            user,
            /* skipBeforeStateCallbacks */
            true
          );
        }
        async initializeCurrentUserFromIdToken(idToken) {
          try {
            const response = await getAccountInfo(this, { idToken });
            const user = await UserImpl._fromGetAccountInfoResponse(this, response, idToken);
            await this.directlySetCurrentUser(user);
          } catch (err) {
            console.warn("FirebaseServerApp could not login user with provided authIdToken: ", err);
            await this.directlySetCurrentUser(null);
          }
        }
        async initializeCurrentUser(popupRedirectResolver) {
          if (_isFirebaseServerApp(this.app)) {
            const idToken = this.app.settings.authIdToken;
            if (idToken) {
              return new Promise((resolve) => {
                setTimeout(() => this.initializeCurrentUserFromIdToken(idToken).then(resolve, resolve));
              });
            } else {
              return this.directlySetCurrentUser(null);
            }
          }
          const previouslyStoredUser = await this.assertedPersistence.getCurrentUser();
          let futureCurrentUser = previouslyStoredUser;
          let needsTocheckMiddleware = false;
          if (popupRedirectResolver && this.config.authDomain) {
            await this.getOrInitRedirectPersistenceManager();
            const redirectUserEventId = this.redirectUser?._redirectEventId;
            const storedUserEventId = futureCurrentUser?._redirectEventId;
            const result = await this.tryRedirectSignIn(popupRedirectResolver);
            if ((!redirectUserEventId || redirectUserEventId === storedUserEventId) && result?.user) {
              futureCurrentUser = result.user;
              needsTocheckMiddleware = true;
            }
          }
          if (!futureCurrentUser) {
            return this.directlySetCurrentUser(null);
          }
          if (!futureCurrentUser._redirectEventId) {
            if (needsTocheckMiddleware) {
              try {
                await this.beforeStateQueue.runMiddleware(futureCurrentUser);
              } catch (e) {
                futureCurrentUser = previouslyStoredUser;
                this._popupRedirectResolver._overrideRedirectResult(this, () => Promise.reject(e));
              }
            }
            if (futureCurrentUser) {
              return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
            } else {
              return this.directlySetCurrentUser(null);
            }
          }
          _assert(
            this._popupRedirectResolver,
            this,
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
          await this.getOrInitRedirectPersistenceManager();
          if (this.redirectUser && this.redirectUser._redirectEventId === futureCurrentUser._redirectEventId) {
            return this.directlySetCurrentUser(futureCurrentUser);
          }
          return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
        }
        async tryRedirectSignIn(redirectResolver) {
          let result = null;
          try {
            result = await this._popupRedirectResolver._completeRedirectFn(this, redirectResolver, true);
          } catch (e) {
            await this._setRedirectUser(null);
          }
          return result;
        }
        async reloadAndSetCurrentUserOrClear(user) {
          try {
            await _reloadWithoutSaving(user);
          } catch (e) {
            if (e?.code !== `auth/${"network-request-failed"}`) {
              return this.directlySetCurrentUser(null);
            }
          }
          return this.directlySetCurrentUser(user);
        }
        useDeviceLanguage() {
          this.languageCode = _getUserLanguage();
        }
        async _delete() {
          this._deleted = true;
        }
        async updateCurrentUser(userExtern) {
          if (_isFirebaseServerApp(this.app)) {
            return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
          }
          const user = userExtern ? getModularInstance(userExtern) : null;
          if (user) {
            _assert(
              user.auth.config.apiKey === this.config.apiKey,
              this,
              "invalid-user-token"
              /* AuthErrorCode.INVALID_AUTH */
            );
          }
          return this._updateCurrentUser(user && user._clone(this));
        }
        async _updateCurrentUser(user, skipBeforeStateCallbacks = false) {
          if (this._deleted) {
            return;
          }
          if (user) {
            _assert(
              this.tenantId === user.tenantId,
              this,
              "tenant-id-mismatch"
              /* AuthErrorCode.TENANT_ID_MISMATCH */
            );
          }
          if (!skipBeforeStateCallbacks) {
            await this.beforeStateQueue.runMiddleware(user);
          }
          return this.queue(async () => {
            await this.directlySetCurrentUser(user);
            this.notifyAuthListeners();
          });
        }
        async signOut() {
          if (_isFirebaseServerApp(this.app)) {
            return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
          }
          await this.beforeStateQueue.runMiddleware(null);
          if (this.redirectPersistenceManager || this._popupRedirectResolver) {
            await this._setRedirectUser(null);
          }
          return this._updateCurrentUser(
            null,
            /* skipBeforeStateCallbacks */
            true
          );
        }
        setPersistence(persistence) {
          if (_isFirebaseServerApp(this.app)) {
            return Promise.reject(_serverAppCurrentUserOperationNotSupportedError(this));
          }
          return this.queue(async () => {
            await this.assertedPersistence.setPersistence(_getInstance(persistence));
          });
        }
        _getRecaptchaConfig() {
          if (this.tenantId == null) {
            return this._agentRecaptchaConfig;
          } else {
            return this._tenantRecaptchaConfigs[this.tenantId];
          }
        }
        async validatePassword(password) {
          if (!this._getPasswordPolicyInternal()) {
            await this._updatePasswordPolicy();
          }
          const passwordPolicy = this._getPasswordPolicyInternal();
          if (passwordPolicy.schemaVersion !== this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION) {
            return Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version", {}));
          }
          return passwordPolicy.validatePassword(password);
        }
        _getPasswordPolicyInternal() {
          if (this.tenantId === null) {
            return this._projectPasswordPolicy;
          } else {
            return this._tenantPasswordPolicies[this.tenantId];
          }
        }
        async _updatePasswordPolicy() {
          const response = await _getPasswordPolicy(this);
          const passwordPolicy = new PasswordPolicyImpl(response);
          if (this.tenantId === null) {
            this._projectPasswordPolicy = passwordPolicy;
          } else {
            this._tenantPasswordPolicies[this.tenantId] = passwordPolicy;
          }
        }
        _getPersistenceType() {
          return this.assertedPersistence.persistence.type;
        }
        _getPersistence() {
          return this.assertedPersistence.persistence;
        }
        _updateErrorMap(errorMap) {
          this._errorFactory = new ErrorFactory("auth", "Firebase", errorMap());
        }
        onAuthStateChanged(nextOrObserver, error2, completed) {
          return this.registerStateListener(this.authStateSubscription, nextOrObserver, error2, completed);
        }
        beforeAuthStateChanged(callback, onAbort) {
          return this.beforeStateQueue.pushCallback(callback, onAbort);
        }
        onIdTokenChanged(nextOrObserver, error2, completed) {
          return this.registerStateListener(this.idTokenSubscription, nextOrObserver, error2, completed);
        }
        authStateReady() {
          return new Promise((resolve, reject) => {
            if (this.currentUser) {
              resolve();
            } else {
              const unsubscribe = this.onAuthStateChanged(() => {
                unsubscribe();
                resolve();
              }, reject);
            }
          });
        }
        /**
         * Revokes the given access token. Currently only supports Apple OAuth access tokens.
         */
        async revokeAccessToken(token) {
          if (this.currentUser) {
            const idToken = await this.currentUser.getIdToken();
            const request = {
              providerId: "apple.com",
              tokenType: "ACCESS_TOKEN",
              token,
              idToken
            };
            if (this.tenantId != null) {
              request.tenantId = this.tenantId;
            }
            await revokeToken(this, request);
          }
        }
        toJSON() {
          return {
            apiKey: this.config.apiKey,
            authDomain: this.config.authDomain,
            appName: this.name,
            currentUser: this._currentUser?.toJSON()
          };
        }
        async _setRedirectUser(user, popupRedirectResolver) {
          const redirectManager = await this.getOrInitRedirectPersistenceManager(popupRedirectResolver);
          return user === null ? redirectManager.removeCurrentUser() : redirectManager.setCurrentUser(user);
        }
        async getOrInitRedirectPersistenceManager(popupRedirectResolver) {
          if (!this.redirectPersistenceManager) {
            const resolver = popupRedirectResolver && _getInstance(popupRedirectResolver) || this._popupRedirectResolver;
            _assert(
              resolver,
              this,
              "argument-error"
              /* AuthErrorCode.ARGUMENT_ERROR */
            );
            this.redirectPersistenceManager = await PersistenceUserManager.create(
              this,
              [_getInstance(resolver._redirectPersistence)],
              "redirectUser"
              /* KeyName.REDIRECT_USER */
            );
            this.redirectUser = await this.redirectPersistenceManager.getCurrentUser();
          }
          return this.redirectPersistenceManager;
        }
        async _redirectUserForId(id) {
          if (this._isInitialized) {
            await this.queue(async () => {
            });
          }
          if (this._currentUser?._redirectEventId === id) {
            return this._currentUser;
          }
          if (this.redirectUser?._redirectEventId === id) {
            return this.redirectUser;
          }
          return null;
        }
        async _persistUserIfCurrent(user) {
          if (user === this.currentUser) {
            return this.queue(async () => this.directlySetCurrentUser(user));
          }
        }
        /** Notifies listeners only if the user is current */
        _notifyListenersIfCurrent(user) {
          if (user === this.currentUser) {
            this.notifyAuthListeners();
          }
        }
        _key() {
          return `${this.config.authDomain}:${this.config.apiKey}:${this.name}`;
        }
        _startProactiveRefresh() {
          this.isProactiveRefreshEnabled = true;
          if (this.currentUser) {
            this._currentUser._startProactiveRefresh();
          }
        }
        _stopProactiveRefresh() {
          this.isProactiveRefreshEnabled = false;
          if (this.currentUser) {
            this._currentUser._stopProactiveRefresh();
          }
        }
        /** Returns the current user cast as the internal type */
        get _currentUser() {
          return this.currentUser;
        }
        notifyAuthListeners() {
          if (!this._isInitialized) {
            return;
          }
          this.idTokenSubscription.next(this.currentUser);
          const currentUid = this.currentUser?.uid ?? null;
          if (this.lastNotifiedUid !== currentUid) {
            this.lastNotifiedUid = currentUid;
            this.authStateSubscription.next(this.currentUser);
          }
        }
        registerStateListener(subscription, nextOrObserver, error2, completed) {
          if (this._deleted) {
            return () => {
            };
          }
          const cb = typeof nextOrObserver === "function" ? nextOrObserver : nextOrObserver.next.bind(nextOrObserver);
          let isUnsubscribed = false;
          const promise = this._isInitialized ? Promise.resolve() : this._initializationPromise;
          _assert(
            promise,
            this,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          promise.then(() => {
            if (isUnsubscribed) {
              return;
            }
            cb(this.currentUser);
          });
          if (typeof nextOrObserver === "function") {
            const unsubscribe = subscription.addObserver(nextOrObserver, error2, completed);
            return () => {
              isUnsubscribed = true;
              unsubscribe();
            };
          } else {
            const unsubscribe = subscription.addObserver(nextOrObserver);
            return () => {
              isUnsubscribed = true;
              unsubscribe();
            };
          }
        }
        /**
         * Unprotected (from race conditions) method to set the current user. This
         * should only be called from within a queued callback. This is necessary
         * because the queue shouldn't rely on another queued callback.
         */
        async directlySetCurrentUser(user) {
          if (this.currentUser && this.currentUser !== user) {
            this._currentUser._stopProactiveRefresh();
          }
          if (user && this.isProactiveRefreshEnabled) {
            user._startProactiveRefresh();
          }
          this.currentUser = user;
          if (user) {
            await this.assertedPersistence.setCurrentUser(user);
          } else {
            await this.assertedPersistence.removeCurrentUser();
          }
        }
        queue(action) {
          this.operations = this.operations.then(action, action);
          return this.operations;
        }
        get assertedPersistence() {
          _assert(
            this.persistenceManager,
            this,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          return this.persistenceManager;
        }
        _logFramework(framework) {
          if (!framework || this.frameworks.includes(framework)) {
            return;
          }
          this.frameworks.push(framework);
          this.frameworks.sort();
          this.clientVersion = _getClientVersion(this.config.clientPlatform, this._getFrameworks());
        }
        _getFrameworks() {
          return this.frameworks;
        }
        async _getAdditionalHeaders() {
          const headers = {
            [
              "X-Client-Version"
              /* HttpHeader.X_CLIENT_VERSION */
            ]: this.clientVersion
          };
          if (this.app.options.appId) {
            headers[
              "X-Firebase-gmpid"
              /* HttpHeader.X_FIREBASE_GMPID */
            ] = this.app.options.appId;
          }
          const heartbeatsHeader = await this.heartbeatServiceProvider.getImmediate({
            optional: true
          })?.getHeartbeatsHeader();
          if (heartbeatsHeader) {
            headers[
              "X-Firebase-Client"
              /* HttpHeader.X_FIREBASE_CLIENT */
            ] = heartbeatsHeader;
          }
          const appCheckToken = await this._getAppCheckToken();
          if (appCheckToken) {
            headers[
              "X-Firebase-AppCheck"
              /* HttpHeader.X_FIREBASE_APP_CHECK */
            ] = appCheckToken;
          }
          return headers;
        }
        async _getAppCheckToken() {
          if (_isFirebaseServerApp(this.app) && this.app.settings.appCheckToken) {
            return this.app.settings.appCheckToken;
          }
          const appCheckTokenResult = await this.appCheckServiceProvider.getImmediate({ optional: true })?.getToken();
          if (appCheckTokenResult?.error) {
            _logWarn(`Error while retrieving App Check token: ${appCheckTokenResult.error}`);
          }
          return appCheckTokenResult?.token;
        }
      };
      Subscription = class {
        constructor(auth) {
          this.auth = auth;
          this.observer = null;
          this.addObserver = createSubscribe((observer) => this.observer = observer);
        }
        get next() {
          _assert(
            this.observer,
            this.auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          return this.observer.next.bind(this.observer);
        }
      };
      externalJSProvider = {
        async loadJS() {
          throw new Error("Unable to load external scripts");
        },
        recaptchaV2Script: "",
        recaptchaEnterpriseScript: "",
        gapiScript: ""
      };
      MockGreCAPTCHATopLevel = class {
        constructor() {
          this.enterprise = new MockGreCAPTCHA();
        }
        ready(callback) {
          callback();
        }
        execute(_siteKey, _options) {
          return Promise.resolve("token");
        }
        render(_container, _parameters) {
          return "";
        }
      };
      MockGreCAPTCHA = class {
        ready(callback) {
          callback();
        }
        execute(_siteKey, _options) {
          return Promise.resolve("token");
        }
        render(_container, _parameters) {
          return "";
        }
      };
      RECAPTCHA_ENTERPRISE_VERIFIER_TYPE = "recaptcha-enterprise";
      FAKE_TOKEN = "NO_RECAPTCHA";
      RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME = "onFirebaseAuthREInstanceReady";
      RecaptchaEnterpriseVerifier = class _RecaptchaEnterpriseVerifier {
        /**
         *
         * @param authExtern - The corresponding Firebase {@link Auth} instance.
         *
         */
        constructor(authExtern) {
          this.type = RECAPTCHA_ENTERPRISE_VERIFIER_TYPE;
          this.auth = _castAuth(authExtern);
        }
        /**
         * Executes the verification process.
         *
         * @returns A Promise for a token that can be used to assert the validity of a request.
         */
        async verify(action = "verify", forceRefresh = false) {
          async function retrieveSiteKey(auth) {
            if (!forceRefresh) {
              if (auth.tenantId == null && auth._agentRecaptchaConfig != null) {
                return auth._agentRecaptchaConfig.siteKey;
              }
              if (auth.tenantId != null && auth._tenantRecaptchaConfigs[auth.tenantId] !== void 0) {
                return auth._tenantRecaptchaConfigs[auth.tenantId].siteKey;
              }
            }
            return new Promise(async (resolve, reject) => {
              getRecaptchaConfig(auth, {
                clientType: "CLIENT_TYPE_WEB",
                version: "RECAPTCHA_ENTERPRISE"
                /* RecaptchaVersion.ENTERPRISE */
              }).then((response) => {
                if (response.recaptchaKey === void 0) {
                  reject(new Error("recaptcha Enterprise site key undefined"));
                } else {
                  const config = new RecaptchaConfig(response);
                  if (auth.tenantId == null) {
                    auth._agentRecaptchaConfig = config;
                  } else {
                    auth._tenantRecaptchaConfigs[auth.tenantId] = config;
                  }
                  return resolve(config.siteKey);
                }
              }).catch((error2) => {
                reject(error2);
              });
            });
          }
          function retrieveRecaptchaToken(siteKey, resolve, reject) {
            const grecaptcha = window.grecaptcha;
            if (isEnterprise(grecaptcha)) {
              grecaptcha.enterprise.ready(() => {
                grecaptcha.enterprise.execute(siteKey, { action }).then((token) => {
                  resolve(token);
                }).catch(() => {
                  resolve(FAKE_TOKEN);
                });
              });
            } else {
              reject(Error("No reCAPTCHA enterprise script loaded."));
            }
          }
          if (this.auth.settings.appVerificationDisabledForTesting) {
            const mockRecaptcha = new MockGreCAPTCHATopLevel();
            return mockRecaptcha.execute("siteKey", { action: "verify" });
          }
          return new Promise((resolve, reject) => {
            retrieveSiteKey(this.auth).then(async (siteKey) => {
              if (!forceRefresh && isEnterprise(window.grecaptcha) && // If download has already been initiated, do not trigger another
              // download, await the promise here.
              _RecaptchaEnterpriseVerifier.scriptInjectionDeferred) {
                await _RecaptchaEnterpriseVerifier.scriptInjectionDeferred.promise;
                retrieveRecaptchaToken(siteKey, resolve, reject);
              } else {
                if (typeof window === "undefined") {
                  reject(new Error("RecaptchaVerifier is only supported in browser"));
                  return;
                }
                let url = _recaptchaEnterpriseScriptUrl();
                if (url.length !== 0) {
                  url += siteKey + `&onload=${RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME}`;
                }
                _RecaptchaEnterpriseVerifier.scriptInjectionDeferred = new Deferred();
                window[RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME] = () => {
                  _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.resolve();
                };
                _loadJS(url).then(() => _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.promise).then(() => {
                  retrieveRecaptchaToken(siteKey, resolve, reject);
                }).catch((error2) => {
                  reject(error2);
                });
              }
            }).catch((error2) => {
              reject(error2);
            });
          });
        }
      };
      RecaptchaEnterpriseVerifier.scriptInjectionDeferred = null;
      AuthCredential = class {
        /** @internal */
        constructor(providerId, signInMethod) {
          this.providerId = providerId;
          this.signInMethod = signInMethod;
        }
        /**
         * Returns a JSON-serializable representation of this object.
         *
         * @returns a JSON-serializable representation of this object.
         */
        toJSON() {
          return debugFail("not implemented");
        }
        /** @internal */
        _getIdTokenResponse(_auth) {
          return debugFail("not implemented");
        }
        /** @internal */
        _linkToIdToken(_auth, _idToken) {
          return debugFail("not implemented");
        }
        /** @internal */
        _getReauthenticationResolver(_auth) {
          return debugFail("not implemented");
        }
      };
      EmailAuthCredential = class _EmailAuthCredential extends AuthCredential {
        /** @internal */
        constructor(_email, _password, signInMethod, _tenantId = null) {
          super("password", signInMethod);
          this._email = _email;
          this._password = _password;
          this._tenantId = _tenantId;
        }
        /** @internal */
        static _fromEmailAndPassword(email, password) {
          return new _EmailAuthCredential(
            email,
            password,
            "password"
            /* SignInMethod.EMAIL_PASSWORD */
          );
        }
        /** @internal */
        static _fromEmailAndCode(email, oobCode, tenantId = null) {
          return new _EmailAuthCredential(email, oobCode, "emailLink", tenantId);
        }
        /** {@inheritdoc AuthCredential.toJSON} */
        toJSON() {
          return {
            email: this._email,
            password: this._password,
            signInMethod: this.signInMethod,
            tenantId: this._tenantId
          };
        }
        /**
         * Static method to deserialize a JSON representation of an object into an {@link  AuthCredential}.
         *
         * @param json - Either `object` or the stringified representation of the object. When string is
         * provided, `JSON.parse` would be called first.
         *
         * @returns If the JSON input does not represent an {@link AuthCredential}, null is returned.
         */
        static fromJSON(json) {
          const obj = typeof json === "string" ? JSON.parse(json) : json;
          if (obj?.email && obj?.password) {
            if (obj.signInMethod === "password") {
              return this._fromEmailAndPassword(obj.email, obj.password);
            } else if (obj.signInMethod === "emailLink") {
              return this._fromEmailAndCode(obj.email, obj.password, obj.tenantId);
            }
          }
          return null;
        }
        /** @internal */
        async _getIdTokenResponse(auth) {
          switch (this.signInMethod) {
            case "password":
              const request = {
                returnSecureToken: true,
                email: this._email,
                password: this._password,
                clientType: "CLIENT_TYPE_WEB"
                /* RecaptchaClientType.WEB */
              };
              return handleRecaptchaFlow(
                auth,
                request,
                "signInWithPassword",
                signInWithPassword,
                "EMAIL_PASSWORD_PROVIDER"
                /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
              );
            case "emailLink":
              return signInWithEmailLink$1(auth, {
                email: this._email,
                oobCode: this._password
              });
            default:
              _fail(
                auth,
                "internal-error"
                /* AuthErrorCode.INTERNAL_ERROR */
              );
          }
        }
        /** @internal */
        async _linkToIdToken(auth, idToken) {
          switch (this.signInMethod) {
            case "password":
              const request = {
                idToken,
                returnSecureToken: true,
                email: this._email,
                password: this._password,
                clientType: "CLIENT_TYPE_WEB"
                /* RecaptchaClientType.WEB */
              };
              return handleRecaptchaFlow(
                auth,
                request,
                "signUpPassword",
                linkEmailPassword,
                "EMAIL_PASSWORD_PROVIDER"
                /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
              );
            case "emailLink":
              return signInWithEmailLinkForLinking(auth, {
                idToken,
                email: this._email,
                oobCode: this._password
              });
            default:
              _fail(
                auth,
                "internal-error"
                /* AuthErrorCode.INTERNAL_ERROR */
              );
          }
        }
        /** @internal */
        _getReauthenticationResolver(auth) {
          return this._getIdTokenResponse(auth);
        }
      };
      IDP_REQUEST_URI$1 = "http://localhost";
      OAuthCredential = class _OAuthCredential extends AuthCredential {
        constructor() {
          super(...arguments);
          this.pendingToken = null;
        }
        /** @internal */
        static _fromParams(params) {
          const cred = new _OAuthCredential(params.providerId, params.signInMethod);
          if (params.idToken || params.accessToken) {
            if (params.idToken) {
              cred.idToken = params.idToken;
            }
            if (params.accessToken) {
              cred.accessToken = params.accessToken;
            }
            if (params.nonce && !params.pendingToken) {
              cred.nonce = params.nonce;
            }
            if (params.pendingToken) {
              cred.pendingToken = params.pendingToken;
            }
          } else if (params.oauthToken && params.oauthTokenSecret) {
            cred.accessToken = params.oauthToken;
            cred.secret = params.oauthTokenSecret;
          } else {
            _fail(
              "argument-error"
              /* AuthErrorCode.ARGUMENT_ERROR */
            );
          }
          return cred;
        }
        /** {@inheritdoc AuthCredential.toJSON}  */
        toJSON() {
          return {
            idToken: this.idToken,
            accessToken: this.accessToken,
            secret: this.secret,
            nonce: this.nonce,
            pendingToken: this.pendingToken,
            providerId: this.providerId,
            signInMethod: this.signInMethod
          };
        }
        /**
         * Static method to deserialize a JSON representation of an object into an
         * {@link  AuthCredential}.
         *
         * @param json - Input can be either Object or the stringified representation of the object.
         * When string is provided, JSON.parse would be called first.
         *
         * @returns If the JSON input does not represent an {@link  AuthCredential}, null is returned.
         */
        static fromJSON(json) {
          const obj = typeof json === "string" ? JSON.parse(json) : json;
          const { providerId, signInMethod, ...rest } = obj;
          if (!providerId || !signInMethod) {
            return null;
          }
          const cred = new _OAuthCredential(providerId, signInMethod);
          cred.idToken = rest.idToken || void 0;
          cred.accessToken = rest.accessToken || void 0;
          cred.secret = rest.secret;
          cred.nonce = rest.nonce;
          cred.pendingToken = rest.pendingToken || null;
          return cred;
        }
        /** @internal */
        _getIdTokenResponse(auth) {
          const request = this.buildRequest();
          return signInWithIdp(auth, request);
        }
        /** @internal */
        _linkToIdToken(auth, idToken) {
          const request = this.buildRequest();
          request.idToken = idToken;
          return signInWithIdp(auth, request);
        }
        /** @internal */
        _getReauthenticationResolver(auth) {
          const request = this.buildRequest();
          request.autoCreate = false;
          return signInWithIdp(auth, request);
        }
        buildRequest() {
          const request = {
            requestUri: IDP_REQUEST_URI$1,
            returnSecureToken: true
          };
          if (this.pendingToken) {
            request.pendingToken = this.pendingToken;
          } else {
            const postBody = {};
            if (this.idToken) {
              postBody["id_token"] = this.idToken;
            }
            if (this.accessToken) {
              postBody["access_token"] = this.accessToken;
            }
            if (this.secret) {
              postBody["oauth_token_secret"] = this.secret;
            }
            postBody["providerId"] = this.providerId;
            if (this.nonce && !this.pendingToken) {
              postBody["nonce"] = this.nonce;
            }
            request.postBody = querystring(postBody);
          }
          return request;
        }
      };
      VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_ = {
        [
          "USER_NOT_FOUND"
          /* ServerError.USER_NOT_FOUND */
        ]: "user-not-found"
        /* AuthErrorCode.USER_DELETED */
      };
      PhoneAuthCredential = class _PhoneAuthCredential extends AuthCredential {
        constructor(params) {
          super(
            "phone",
            "phone"
            /* SignInMethod.PHONE */
          );
          this.params = params;
        }
        /** @internal */
        static _fromVerification(verificationId, verificationCode) {
          return new _PhoneAuthCredential({ verificationId, verificationCode });
        }
        /** @internal */
        static _fromTokenResponse(phoneNumber, temporaryProof) {
          return new _PhoneAuthCredential({ phoneNumber, temporaryProof });
        }
        /** @internal */
        _getIdTokenResponse(auth) {
          return signInWithPhoneNumber$1(auth, this._makeVerificationRequest());
        }
        /** @internal */
        _linkToIdToken(auth, idToken) {
          return linkWithPhoneNumber$1(auth, {
            idToken,
            ...this._makeVerificationRequest()
          });
        }
        /** @internal */
        _getReauthenticationResolver(auth) {
          return verifyPhoneNumberForExisting(auth, this._makeVerificationRequest());
        }
        /** @internal */
        _makeVerificationRequest() {
          const { temporaryProof, phoneNumber, verificationId, verificationCode } = this.params;
          if (temporaryProof && phoneNumber) {
            return { temporaryProof, phoneNumber };
          }
          return {
            sessionInfo: verificationId,
            code: verificationCode
          };
        }
        /** {@inheritdoc AuthCredential.toJSON} */
        toJSON() {
          const obj = {
            providerId: this.providerId
          };
          if (this.params.phoneNumber) {
            obj.phoneNumber = this.params.phoneNumber;
          }
          if (this.params.temporaryProof) {
            obj.temporaryProof = this.params.temporaryProof;
          }
          if (this.params.verificationCode) {
            obj.verificationCode = this.params.verificationCode;
          }
          if (this.params.verificationId) {
            obj.verificationId = this.params.verificationId;
          }
          return obj;
        }
        /** Generates a phone credential based on a plain object or a JSON string. */
        static fromJSON(json) {
          if (typeof json === "string") {
            json = JSON.parse(json);
          }
          const { verificationId, verificationCode, phoneNumber, temporaryProof } = json;
          if (!verificationCode && !verificationId && !phoneNumber && !temporaryProof) {
            return null;
          }
          return new _PhoneAuthCredential({
            verificationId,
            verificationCode,
            phoneNumber,
            temporaryProof
          });
        }
      };
      ActionCodeURL = class _ActionCodeURL {
        /**
         * @param actionLink - The link from which to extract the URL.
         * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
         *
         * @internal
         */
        constructor(actionLink) {
          const searchParams = querystringDecode(extractQuerystring(actionLink));
          const apiKey = searchParams[
            "apiKey"
            /* QueryField.API_KEY */
          ] ?? null;
          const code = searchParams[
            "oobCode"
            /* QueryField.CODE */
          ] ?? null;
          const operation = parseMode(searchParams[
            "mode"
            /* QueryField.MODE */
          ] ?? null);
          _assert(
            apiKey && code && operation,
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
          this.apiKey = apiKey;
          this.operation = operation;
          this.code = code;
          this.continueUrl = searchParams[
            "continueUrl"
            /* QueryField.CONTINUE_URL */
          ] ?? null;
          this.languageCode = searchParams[
            "lang"
            /* QueryField.LANGUAGE_CODE */
          ] ?? null;
          this.tenantId = searchParams[
            "tenantId"
            /* QueryField.TENANT_ID */
          ] ?? null;
        }
        /**
         * Parses the email action link string and returns an {@link ActionCodeURL} if the link is valid,
         * otherwise returns null.
         *
         * @param link  - The email action link string.
         * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
         *
         * @public
         */
        static parseLink(link) {
          const actionLink = parseDeepLink(link);
          try {
            return new _ActionCodeURL(actionLink);
          } catch {
            return null;
          }
        }
      };
      EmailAuthProvider = class _EmailAuthProvider {
        constructor() {
          this.providerId = _EmailAuthProvider.PROVIDER_ID;
        }
        /**
         * Initialize an {@link AuthCredential} using an email and password.
         *
         * @example
         * ```javascript
         * const authCredential = EmailAuthProvider.credential(email, password);
         * const userCredential = await signInWithCredential(auth, authCredential);
         * ```
         *
         * @example
         * ```javascript
         * const userCredential = await signInWithEmailAndPassword(auth, email, password);
         * ```
         *
         * @param email - Email address.
         * @param password - User account password.
         * @returns The auth provider credential.
         */
        static credential(email, password) {
          return EmailAuthCredential._fromEmailAndPassword(email, password);
        }
        /**
         * Initialize an {@link AuthCredential} using an email and an email link after a sign in with
         * email link operation.
         *
         * @example
         * ```javascript
         * const authCredential = EmailAuthProvider.credentialWithLink(auth, email, emailLink);
         * const userCredential = await signInWithCredential(auth, authCredential);
         * ```
         *
         * @example
         * ```javascript
         * await sendSignInLinkToEmail(auth, email);
         * // Obtain emailLink from user.
         * const userCredential = await signInWithEmailLink(auth, email, emailLink);
         * ```
         *
         * @param auth - The {@link Auth} instance used to verify the link.
         * @param email - Email address.
         * @param emailLink - Sign-in email link.
         * @returns - The auth provider credential.
         */
        static credentialWithLink(email, emailLink) {
          const actionCodeUrl = ActionCodeURL.parseLink(emailLink);
          _assert(
            actionCodeUrl,
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
          return EmailAuthCredential._fromEmailAndCode(email, actionCodeUrl.code, actionCodeUrl.tenantId);
        }
      };
      EmailAuthProvider.PROVIDER_ID = "password";
      EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD = "password";
      EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD = "emailLink";
      FederatedAuthProvider = class {
        /**
         * Constructor for generic OAuth providers.
         *
         * @param providerId - Provider for which credentials should be generated.
         */
        constructor(providerId) {
          this.providerId = providerId;
          this.defaultLanguageCode = null;
          this.customParameters = {};
        }
        /**
         * Set the language gode.
         *
         * @param languageCode - language code
         */
        setDefaultLanguage(languageCode) {
          this.defaultLanguageCode = languageCode;
        }
        /**
         * Sets the OAuth custom parameters to pass in an OAuth request for popup and redirect sign-in
         * operations.
         *
         * @remarks
         * For a detailed list, check the reserved required OAuth 2.0 parameters such as `client_id`,
         * `redirect_uri`, `scope`, `response_type`, and `state` are not allowed and will be ignored.
         *
         * @param customOAuthParameters - The custom OAuth parameters to pass in the OAuth request.
         */
        setCustomParameters(customOAuthParameters) {
          this.customParameters = customOAuthParameters;
          return this;
        }
        /**
         * Retrieve the current list of {@link CustomParameters}.
         */
        getCustomParameters() {
          return this.customParameters;
        }
      };
      BaseOAuthProvider = class extends FederatedAuthProvider {
        constructor() {
          super(...arguments);
          this.scopes = [];
        }
        /**
         * Add an OAuth scope to the credential.
         *
         * @param scope - Provider OAuth scope to add.
         */
        addScope(scope) {
          if (!this.scopes.includes(scope)) {
            this.scopes.push(scope);
          }
          return this;
        }
        /**
         * Retrieve the current list of OAuth scopes.
         */
        getScopes() {
          return [...this.scopes];
        }
      };
      FacebookAuthProvider = class _FacebookAuthProvider extends BaseOAuthProvider {
        constructor() {
          super(
            "facebook.com"
            /* ProviderId.FACEBOOK */
          );
        }
        /**
         * Creates a credential for Facebook.
         *
         * @example
         * ```javascript
         * // `event` from the Facebook auth.authResponseChange callback.
         * const credential = FacebookAuthProvider.credential(event.authResponse.accessToken);
         * const result = await signInWithCredential(credential);
         * ```
         *
         * @param accessToken - Facebook access token.
         */
        static credential(accessToken) {
          return OAuthCredential._fromParams({
            providerId: _FacebookAuthProvider.PROVIDER_ID,
            signInMethod: _FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD,
            accessToken
          });
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromResult(userCredential) {
          return _FacebookAuthProvider.credentialFromTaggedObject(userCredential);
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
         * thrown during a sign-in, link, or reauthenticate operation.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromError(error2) {
          return _FacebookAuthProvider.credentialFromTaggedObject(error2.customData || {});
        }
        static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
          if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
            return null;
          }
          if (!tokenResponse.oauthAccessToken) {
            return null;
          }
          try {
            return _FacebookAuthProvider.credential(tokenResponse.oauthAccessToken);
          } catch {
            return null;
          }
        }
      };
      FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD = "facebook.com";
      FacebookAuthProvider.PROVIDER_ID = "facebook.com";
      GoogleAuthProvider = class _GoogleAuthProvider extends BaseOAuthProvider {
        constructor() {
          super(
            "google.com"
            /* ProviderId.GOOGLE */
          );
          this.addScope("profile");
        }
        /**
         * Creates a credential for Google. At least one of ID token and access token is required.
         *
         * @example
         * ```javascript
         * // \`googleUser\` from the onsuccess Google Sign In callback.
         * const credential = GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
         * const result = await signInWithCredential(credential);
         * ```
         *
         * @param idToken - Google ID token.
         * @param accessToken - Google access token.
         */
        static credential(idToken, accessToken) {
          return OAuthCredential._fromParams({
            providerId: _GoogleAuthProvider.PROVIDER_ID,
            signInMethod: _GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD,
            idToken,
            accessToken
          });
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromResult(userCredential) {
          return _GoogleAuthProvider.credentialFromTaggedObject(userCredential);
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
         * thrown during a sign-in, link, or reauthenticate operation.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromError(error2) {
          return _GoogleAuthProvider.credentialFromTaggedObject(error2.customData || {});
        }
        static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
          if (!tokenResponse) {
            return null;
          }
          const { oauthIdToken, oauthAccessToken } = tokenResponse;
          if (!oauthIdToken && !oauthAccessToken) {
            return null;
          }
          try {
            return _GoogleAuthProvider.credential(oauthIdToken, oauthAccessToken);
          } catch {
            return null;
          }
        }
      };
      GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD = "google.com";
      GoogleAuthProvider.PROVIDER_ID = "google.com";
      GithubAuthProvider = class _GithubAuthProvider extends BaseOAuthProvider {
        constructor() {
          super(
            "github.com"
            /* ProviderId.GITHUB */
          );
        }
        /**
         * Creates a credential for GitHub.
         *
         * @param accessToken - GitHub access token.
         */
        static credential(accessToken) {
          return OAuthCredential._fromParams({
            providerId: _GithubAuthProvider.PROVIDER_ID,
            signInMethod: _GithubAuthProvider.GITHUB_SIGN_IN_METHOD,
            accessToken
          });
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromResult(userCredential) {
          return _GithubAuthProvider.credentialFromTaggedObject(userCredential);
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
         * thrown during a sign-in, link, or reauthenticate operation.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromError(error2) {
          return _GithubAuthProvider.credentialFromTaggedObject(error2.customData || {});
        }
        static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
          if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
            return null;
          }
          if (!tokenResponse.oauthAccessToken) {
            return null;
          }
          try {
            return _GithubAuthProvider.credential(tokenResponse.oauthAccessToken);
          } catch {
            return null;
          }
        }
      };
      GithubAuthProvider.GITHUB_SIGN_IN_METHOD = "github.com";
      GithubAuthProvider.PROVIDER_ID = "github.com";
      TwitterAuthProvider = class _TwitterAuthProvider extends BaseOAuthProvider {
        constructor() {
          super(
            "twitter.com"
            /* ProviderId.TWITTER */
          );
        }
        /**
         * Creates a credential for Twitter.
         *
         * @param token - Twitter access token.
         * @param secret - Twitter secret.
         */
        static credential(token, secret) {
          return OAuthCredential._fromParams({
            providerId: _TwitterAuthProvider.PROVIDER_ID,
            signInMethod: _TwitterAuthProvider.TWITTER_SIGN_IN_METHOD,
            oauthToken: token,
            oauthTokenSecret: secret
          });
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromResult(userCredential) {
          return _TwitterAuthProvider.credentialFromTaggedObject(userCredential);
        }
        /**
         * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
         * thrown during a sign-in, link, or reauthenticate operation.
         *
         * @param userCredential - The user credential.
         */
        static credentialFromError(error2) {
          return _TwitterAuthProvider.credentialFromTaggedObject(error2.customData || {});
        }
        static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
          if (!tokenResponse) {
            return null;
          }
          const { oauthAccessToken, oauthTokenSecret } = tokenResponse;
          if (!oauthAccessToken || !oauthTokenSecret) {
            return null;
          }
          try {
            return _TwitterAuthProvider.credential(oauthAccessToken, oauthTokenSecret);
          } catch {
            return null;
          }
        }
      };
      TwitterAuthProvider.TWITTER_SIGN_IN_METHOD = "twitter.com";
      TwitterAuthProvider.PROVIDER_ID = "twitter.com";
      UserCredentialImpl = class _UserCredentialImpl {
        constructor(params) {
          this.user = params.user;
          this.providerId = params.providerId;
          this._tokenResponse = params._tokenResponse;
          this.operationType = params.operationType;
        }
        static async _fromIdTokenResponse(auth, operationType, idTokenResponse, isAnonymous = false) {
          const user = await UserImpl._fromIdTokenResponse(auth, idTokenResponse, isAnonymous);
          const providerId = providerIdForResponse(idTokenResponse);
          const userCred = new _UserCredentialImpl({
            user,
            providerId,
            _tokenResponse: idTokenResponse,
            operationType
          });
          return userCred;
        }
        static async _forOperation(user, operationType, response) {
          await user._updateTokensIfNecessary(
            response,
            /* reload */
            true
          );
          const providerId = providerIdForResponse(response);
          return new _UserCredentialImpl({
            user,
            providerId,
            _tokenResponse: response,
            operationType
          });
        }
      };
      MultiFactorError = class _MultiFactorError extends FirebaseError {
        constructor(auth, error2, operationType, user) {
          super(error2.code, error2.message);
          this.operationType = operationType;
          this.user = user;
          Object.setPrototypeOf(this, _MultiFactorError.prototype);
          this.customData = {
            appName: auth.name,
            tenantId: auth.tenantId ?? void 0,
            _serverResponse: error2.customData._serverResponse,
            operationType
          };
        }
        static _fromErrorAndOperation(auth, error2, operationType, user) {
          return new _MultiFactorError(auth, error2, operationType, user);
        }
      };
      STORAGE_AVAILABLE_KEY = "__sak";
      BrowserPersistenceClass = class {
        constructor(storageRetriever, type) {
          this.storageRetriever = storageRetriever;
          this.type = type;
        }
        _isAvailable() {
          try {
            if (!this.storage) {
              return Promise.resolve(false);
            }
            this.storage.setItem(STORAGE_AVAILABLE_KEY, "1");
            this.storage.removeItem(STORAGE_AVAILABLE_KEY);
            return Promise.resolve(true);
          } catch {
            return Promise.resolve(false);
          }
        }
        _set(key, value) {
          this.storage.setItem(key, JSON.stringify(value));
          return Promise.resolve();
        }
        _get(key) {
          const json = this.storage.getItem(key);
          return Promise.resolve(json ? JSON.parse(json) : null);
        }
        _remove(key) {
          this.storage.removeItem(key);
          return Promise.resolve();
        }
        get storage() {
          return this.storageRetriever();
        }
      };
      _POLLING_INTERVAL_MS$1 = 1e3;
      IE10_LOCAL_STORAGE_SYNC_DELAY = 10;
      BrowserLocalPersistence = class extends BrowserPersistenceClass {
        constructor() {
          super(
            () => window.localStorage,
            "LOCAL"
            /* PersistenceType.LOCAL */
          );
          this.boundEventHandler = (event, poll) => this.onStorageEvent(event, poll);
          this.listeners = {};
          this.localCache = {};
          this.pollTimer = null;
          this.fallbackToPolling = _isMobileBrowser();
          this._shouldAllowMigration = true;
        }
        forAllChangedKeys(cb) {
          for (const key of Object.keys(this.listeners)) {
            const newValue = this.storage.getItem(key);
            const oldValue = this.localCache[key];
            if (newValue !== oldValue) {
              cb(key, oldValue, newValue);
            }
          }
        }
        onStorageEvent(event, poll = false) {
          if (!event.key) {
            this.forAllChangedKeys((key2, _oldValue, newValue) => {
              this.notifyListeners(key2, newValue);
            });
            return;
          }
          const key = event.key;
          if (poll) {
            this.detachListener();
          } else {
            this.stopPolling();
          }
          const triggerListeners = () => {
            const storedValue2 = this.storage.getItem(key);
            if (!poll && this.localCache[key] === storedValue2) {
              return;
            }
            this.notifyListeners(key, storedValue2);
          };
          const storedValue = this.storage.getItem(key);
          if (_isIE10() && storedValue !== event.newValue && event.newValue !== event.oldValue) {
            setTimeout(triggerListeners, IE10_LOCAL_STORAGE_SYNC_DELAY);
          } else {
            triggerListeners();
          }
        }
        notifyListeners(key, value) {
          this.localCache[key] = value;
          const listeners = this.listeners[key];
          if (listeners) {
            for (const listener of Array.from(listeners)) {
              listener(value ? JSON.parse(value) : value);
            }
          }
        }
        startPolling() {
          this.stopPolling();
          this.pollTimer = setInterval(() => {
            this.forAllChangedKeys((key, oldValue, newValue) => {
              this.onStorageEvent(
                new StorageEvent("storage", {
                  key,
                  oldValue,
                  newValue
                }),
                /* poll */
                true
              );
            });
          }, _POLLING_INTERVAL_MS$1);
        }
        stopPolling() {
          if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
          }
        }
        attachListener() {
          window.addEventListener("storage", this.boundEventHandler);
        }
        detachListener() {
          window.removeEventListener("storage", this.boundEventHandler);
        }
        _addListener(key, listener) {
          if (Object.keys(this.listeners).length === 0) {
            if (this.fallbackToPolling) {
              this.startPolling();
            } else {
              this.attachListener();
            }
          }
          if (!this.listeners[key]) {
            this.listeners[key] = /* @__PURE__ */ new Set();
            this.localCache[key] = this.storage.getItem(key);
          }
          this.listeners[key].add(listener);
        }
        _removeListener(key, listener) {
          if (this.listeners[key]) {
            this.listeners[key].delete(listener);
            if (this.listeners[key].size === 0) {
              delete this.listeners[key];
            }
          }
          if (Object.keys(this.listeners).length === 0) {
            this.detachListener();
            this.stopPolling();
          }
        }
        // Update local cache on base operations:
        async _set(key, value) {
          await super._set(key, value);
          this.localCache[key] = JSON.stringify(value);
        }
        async _get(key) {
          const value = await super._get(key);
          this.localCache[key] = JSON.stringify(value);
          return value;
        }
        async _remove(key) {
          await super._remove(key);
          delete this.localCache[key];
        }
      };
      BrowserLocalPersistence.type = "LOCAL";
      browserLocalPersistence = BrowserLocalPersistence;
      POLLING_INTERVAL_MS = 1e3;
      CookiePersistence = class {
        constructor() {
          this.type = "COOKIE";
          this.listenerUnsubscribes = /* @__PURE__ */ new Map();
        }
        // used to get the URL to the backend to proxy to
        _getFinalTarget(originalUrl) {
          if (typeof window === void 0) {
            return originalUrl;
          }
          const url = new URL(`${window.location.origin}/__cookies__`);
          url.searchParams.set("finalTarget", originalUrl);
          return url;
        }
        // To be a usable persistence method in a chain browserCookiePersistence ensures that
        // prerequisites have been met, namely that we're in a secureContext, navigator and document are
        // available and cookies are enabled. Not all UAs support these method, so fallback accordingly.
        async _isAvailable() {
          if (typeof isSecureContext === "boolean" && !isSecureContext) {
            return false;
          }
          if (typeof navigator === "undefined" || typeof document === "undefined") {
            return false;
          }
          return navigator.cookieEnabled ?? true;
        }
        // Set should be a noop as we expect middleware to handle this
        async _set(_key, _value) {
          return;
        }
        // Attempt to get the cookie from cookieStore, fallback to document.cookie
        async _get(key) {
          if (!this._isAvailable()) {
            return null;
          }
          const name5 = getCookieName(key);
          if (window.cookieStore) {
            const cookie = await window.cookieStore.get(name5);
            return cookie?.value;
          }
          return getDocumentCookie(name5);
        }
        // Log out by overriding the idToken with a sentinel value of ""
        async _remove(key) {
          if (!this._isAvailable()) {
            return;
          }
          const existingValue = await this._get(key);
          if (!existingValue) {
            return;
          }
          const name5 = getCookieName(key);
          document.cookie = `${name5}=;Max-Age=34560000;Partitioned;Secure;SameSite=Strict;Path=/;Priority=High`;
          await fetch(`/__cookies__`, { method: "DELETE" }).catch(() => void 0);
        }
        // Listen for cookie changes, both cookieStore and fallback to polling document.cookie
        _addListener(key, listener) {
          if (!this._isAvailable()) {
            return;
          }
          const name5 = getCookieName(key);
          if (window.cookieStore) {
            const cb = ((event) => {
              const changedCookie = event.changed.find((change) => change.name === name5);
              if (changedCookie) {
                listener(changedCookie.value);
              }
              const deletedCookie = event.deleted.find((change) => change.name === name5);
              if (deletedCookie) {
                listener(null);
              }
            });
            const unsubscribe2 = () => window.cookieStore.removeEventListener("change", cb);
            this.listenerUnsubscribes.set(listener, unsubscribe2);
            return window.cookieStore.addEventListener("change", cb);
          }
          let lastValue = getDocumentCookie(name5);
          const interval = setInterval(() => {
            const currentValue = getDocumentCookie(name5);
            if (currentValue !== lastValue) {
              listener(currentValue);
              lastValue = currentValue;
            }
          }, POLLING_INTERVAL_MS);
          const unsubscribe = () => clearInterval(interval);
          this.listenerUnsubscribes.set(listener, unsubscribe);
        }
        _removeListener(_key, listener) {
          const unsubscribe = this.listenerUnsubscribes.get(listener);
          if (!unsubscribe) {
            return;
          }
          unsubscribe();
          this.listenerUnsubscribes.delete(listener);
        }
      };
      CookiePersistence.type = "COOKIE";
      BrowserSessionPersistence = class extends BrowserPersistenceClass {
        constructor() {
          super(
            () => window.sessionStorage,
            "SESSION"
            /* PersistenceType.SESSION */
          );
        }
        _addListener(_key, _listener) {
          return;
        }
        _removeListener(_key, _listener) {
          return;
        }
      };
      BrowserSessionPersistence.type = "SESSION";
      browserSessionPersistence = BrowserSessionPersistence;
      Receiver = class _Receiver {
        constructor(eventTarget) {
          this.eventTarget = eventTarget;
          this.handlersMap = {};
          this.boundEventHandler = this.handleEvent.bind(this);
        }
        /**
         * Obtain an instance of a Receiver for a given event target, if none exists it will be created.
         *
         * @param eventTarget - An event target (such as window or self) through which the underlying
         * messages will be received.
         */
        static _getInstance(eventTarget) {
          const existingInstance = this.receivers.find((receiver) => receiver.isListeningto(eventTarget));
          if (existingInstance) {
            return existingInstance;
          }
          const newInstance = new _Receiver(eventTarget);
          this.receivers.push(newInstance);
          return newInstance;
        }
        isListeningto(eventTarget) {
          return this.eventTarget === eventTarget;
        }
        /**
         * Fans out a MessageEvent to the appropriate listeners.
         *
         * @remarks
         * Sends an {@link Status.ACK} upon receipt and a {@link Status.DONE} once all handlers have
         * finished processing.
         *
         * @param event - The MessageEvent.
         *
         */
        async handleEvent(event) {
          const messageEvent = event;
          const { eventId, eventType, data } = messageEvent.data;
          const handlers = this.handlersMap[eventType];
          if (!handlers?.size) {
            return;
          }
          messageEvent.ports[0].postMessage({
            status: "ack",
            eventId,
            eventType
          });
          const promises = Array.from(handlers).map(async (handler) => handler(messageEvent.origin, data));
          const response = await _allSettled(promises);
          messageEvent.ports[0].postMessage({
            status: "done",
            eventId,
            eventType,
            response
          });
        }
        /**
         * Subscribe an event handler for a particular event.
         *
         * @param eventType - Event name to subscribe to.
         * @param eventHandler - The event handler which should receive the events.
         *
         */
        _subscribe(eventType, eventHandler) {
          if (Object.keys(this.handlersMap).length === 0) {
            this.eventTarget.addEventListener("message", this.boundEventHandler);
          }
          if (!this.handlersMap[eventType]) {
            this.handlersMap[eventType] = /* @__PURE__ */ new Set();
          }
          this.handlersMap[eventType].add(eventHandler);
        }
        /**
         * Unsubscribe an event handler from a particular event.
         *
         * @param eventType - Event name to unsubscribe from.
         * @param eventHandler - Optional event handler, if none provided, unsubscribe all handlers on this event.
         *
         */
        _unsubscribe(eventType, eventHandler) {
          if (this.handlersMap[eventType] && eventHandler) {
            this.handlersMap[eventType].delete(eventHandler);
          }
          if (!eventHandler || this.handlersMap[eventType].size === 0) {
            delete this.handlersMap[eventType];
          }
          if (Object.keys(this.handlersMap).length === 0) {
            this.eventTarget.removeEventListener("message", this.boundEventHandler);
          }
        }
      };
      Receiver.receivers = [];
      Sender = class {
        constructor(target) {
          this.target = target;
          this.handlers = /* @__PURE__ */ new Set();
        }
        /**
         * Unsubscribe the handler and remove it from our tracking Set.
         *
         * @param handler - The handler to unsubscribe.
         */
        removeMessageHandler(handler) {
          if (handler.messageChannel) {
            handler.messageChannel.port1.removeEventListener("message", handler.onMessage);
            handler.messageChannel.port1.close();
          }
          this.handlers.delete(handler);
        }
        /**
         * Send a message to the Receiver located at {@link target}.
         *
         * @remarks
         * We'll first wait a bit for an ACK , if we get one we will wait significantly longer until the
         * receiver has had a chance to fully process the event.
         *
         * @param eventType - Type of event to send.
         * @param data - The payload of the event.
         * @param timeout - Timeout for waiting on an ACK from the receiver.
         *
         * @returns An array of settled promises from all the handlers that were listening on the receiver.
         */
        async _send(eventType, data, timeout = 50) {
          const messageChannel = typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
          if (!messageChannel) {
            throw new Error(
              "connection_unavailable"
              /* _MessageError.CONNECTION_UNAVAILABLE */
            );
          }
          let completionTimer;
          let handler;
          return new Promise((resolve, reject) => {
            const eventId = _generateEventId("", 20);
            messageChannel.port1.start();
            const ackTimer = setTimeout(() => {
              reject(new Error(
                "unsupported_event"
                /* _MessageError.UNSUPPORTED_EVENT */
              ));
            }, timeout);
            handler = {
              messageChannel,
              onMessage(event) {
                const messageEvent = event;
                if (messageEvent.data.eventId !== eventId) {
                  return;
                }
                switch (messageEvent.data.status) {
                  case "ack":
                    clearTimeout(ackTimer);
                    completionTimer = setTimeout(
                      () => {
                        reject(new Error(
                          "timeout"
                          /* _MessageError.TIMEOUT */
                        ));
                      },
                      3e3
                      /* _TimeoutDuration.COMPLETION */
                    );
                    break;
                  case "done":
                    clearTimeout(completionTimer);
                    resolve(messageEvent.data.response);
                    break;
                  default:
                    clearTimeout(ackTimer);
                    clearTimeout(completionTimer);
                    reject(new Error(
                      "invalid_response"
                      /* _MessageError.INVALID_RESPONSE */
                    ));
                    break;
                }
              }
            };
            this.handlers.add(handler);
            messageChannel.port1.addEventListener("message", handler.onMessage);
            this.target.postMessage({
              eventType,
              eventId,
              data
            }, [messageChannel.port2]);
          }).finally(() => {
            if (handler) {
              this.removeMessageHandler(handler);
            }
          });
        }
      };
      DB_NAME2 = "firebaseLocalStorageDb";
      DB_VERSION2 = 1;
      DB_OBJECTSTORE_NAME = "firebaseLocalStorage";
      DB_DATA_KEYPATH = "fbase_key";
      DBPromise = class {
        constructor(request) {
          this.request = request;
        }
        toPromise() {
          return new Promise((resolve, reject) => {
            this.request.addEventListener("success", () => {
              resolve(this.request.result);
            });
            this.request.addEventListener("error", () => {
              reject(this.request.error);
            });
          });
        }
      };
      _POLLING_INTERVAL_MS = 800;
      _TRANSACTION_RETRY_COUNT = 3;
      IndexedDBLocalPersistence = class {
        constructor() {
          this.type = "LOCAL";
          this.dbPromise = null;
          this._shouldAllowMigration = true;
          this.listeners = {};
          this.localCache = {};
          this.pollTimer = null;
          this.pendingWrites = 0;
          this.receiver = null;
          this.sender = null;
          this.serviceWorkerReceiverAvailable = false;
          this.activeServiceWorker = null;
          this._workerInitializationPromise = this.initializeServiceWorkerMessaging().then(() => {
          }, () => {
          });
        }
        async _openDb() {
          if (this.dbPromise) {
            return this.dbPromise;
          }
          this.dbPromise = _openDatabase();
          this.dbPromise.catch(() => {
            this.dbPromise = null;
          });
          return this.dbPromise;
        }
        async _withRetries(op) {
          let numAttempts = 0;
          while (true) {
            try {
              const db = await this._openDb();
              return await op(db);
            } catch (e) {
              if (numAttempts++ > _TRANSACTION_RETRY_COUNT) {
                throw e;
              }
              if (this.dbPromise) {
                const db = await this.dbPromise;
                db.close();
                this.dbPromise = null;
              }
            }
          }
        }
        /**
         * IndexedDB events do not propagate from the main window to the worker context.  We rely on a
         * postMessage interface to send these events to the worker ourselves.
         */
        async initializeServiceWorkerMessaging() {
          return _isWorker() ? this.initializeReceiver() : this.initializeSender();
        }
        /**
         * As the worker we should listen to events from the main window.
         */
        async initializeReceiver() {
          this.receiver = Receiver._getInstance(_getWorkerGlobalScope());
          this.receiver._subscribe("keyChanged", async (_origin, data) => {
            const keys = await this._poll();
            return {
              keyProcessed: keys.includes(data.key)
            };
          });
          this.receiver._subscribe("ping", async (_origin, _data) => {
            return [
              "keyChanged"
              /* _EventType.KEY_CHANGED */
            ];
          });
        }
        /**
         * As the main window, we should let the worker know when keys change (set and remove).
         *
         * @remarks
         * {@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready | ServiceWorkerContainer.ready}
         * may not resolve.
         */
        async initializeSender() {
          this.activeServiceWorker = await _getActiveServiceWorker();
          if (!this.activeServiceWorker) {
            return;
          }
          this.sender = new Sender(this.activeServiceWorker);
          const results = await this.sender._send(
            "ping",
            {},
            800
            /* _TimeoutDuration.LONG_ACK */
          );
          if (!results) {
            return;
          }
          if (results[0]?.fulfilled && results[0]?.value.includes(
            "keyChanged"
            /* _EventType.KEY_CHANGED */
          )) {
            this.serviceWorkerReceiverAvailable = true;
          }
        }
        /**
         * Let the worker know about a changed key, the exact key doesn't technically matter since the
         * worker will just trigger a full sync anyway.
         *
         * @remarks
         * For now, we only support one service worker per page.
         *
         * @param key - Storage key which changed.
         */
        async notifyServiceWorker(key) {
          if (!this.sender || !this.activeServiceWorker || _getServiceWorkerController() !== this.activeServiceWorker) {
            return;
          }
          try {
            await this.sender._send(
              "keyChanged",
              { key },
              // Use long timeout if receiver has previously responded to a ping from us.
              this.serviceWorkerReceiverAvailable ? 800 : 50
              /* _TimeoutDuration.ACK */
            );
          } catch {
          }
        }
        async _isAvailable() {
          try {
            if (!indexedDB) {
              return false;
            }
            await this._withRetries(async (db) => {
              await _putObject(db, STORAGE_AVAILABLE_KEY, "1");
              await _deleteObject(db, STORAGE_AVAILABLE_KEY);
            });
            return true;
          } catch {
          }
          return false;
        }
        async _withPendingWrite(write) {
          this.pendingWrites++;
          try {
            await write();
          } finally {
            this.pendingWrites--;
          }
        }
        async _set(key, value) {
          return this._withPendingWrite(async () => {
            await this._withRetries((db) => _putObject(db, key, value));
            this.localCache[key] = value;
            return this.notifyServiceWorker(key);
          });
        }
        async _get(key) {
          const obj = await this._withRetries((db) => getObject(db, key));
          this.localCache[key] = obj;
          return obj;
        }
        async _remove(key) {
          return this._withPendingWrite(async () => {
            await this._withRetries((db) => _deleteObject(db, key));
            delete this.localCache[key];
            return this.notifyServiceWorker(key);
          });
        }
        async _poll() {
          const result = await this._withRetries((db) => {
            const getAllRequest = getObjectStore(db, false).getAll();
            return new DBPromise(getAllRequest).toPromise();
          });
          if (!result) {
            return [];
          }
          if (this.pendingWrites !== 0) {
            return [];
          }
          const keys = [];
          const keysInResult = /* @__PURE__ */ new Set();
          if (result.length !== 0) {
            for (const { fbase_key: key, value } of result) {
              keysInResult.add(key);
              if (JSON.stringify(this.localCache[key]) !== JSON.stringify(value)) {
                this.notifyListeners(key, value);
                keys.push(key);
              }
            }
          }
          for (const localKey of Object.keys(this.localCache)) {
            if (this.localCache[localKey] && !keysInResult.has(localKey)) {
              this.notifyListeners(localKey, null);
              keys.push(localKey);
            }
          }
          return keys;
        }
        notifyListeners(key, newValue) {
          this.localCache[key] = newValue;
          const listeners = this.listeners[key];
          if (listeners) {
            for (const listener of Array.from(listeners)) {
              listener(newValue);
            }
          }
        }
        startPolling() {
          this.stopPolling();
          this.pollTimer = setInterval(async () => this._poll(), _POLLING_INTERVAL_MS);
        }
        stopPolling() {
          if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
          }
        }
        _addListener(key, listener) {
          if (Object.keys(this.listeners).length === 0) {
            this.startPolling();
          }
          if (!this.listeners[key]) {
            this.listeners[key] = /* @__PURE__ */ new Set();
            void this._get(key);
          }
          this.listeners[key].add(listener);
        }
        _removeListener(key, listener) {
          if (this.listeners[key]) {
            this.listeners[key].delete(listener);
            if (this.listeners[key].size === 0) {
              delete this.listeners[key];
            }
          }
          if (Object.keys(this.listeners).length === 0) {
            this.stopPolling();
          }
        }
      };
      IndexedDBLocalPersistence.type = "LOCAL";
      indexedDBLocalPersistence = IndexedDBLocalPersistence;
      _JSLOAD_CALLBACK = _generateCallbackName("rcb");
      NETWORK_TIMEOUT_DELAY = new Delay(3e4, 6e4);
      RECAPTCHA_VERIFIER_TYPE = "recaptcha";
      PhoneAuthProvider = class _PhoneAuthProvider {
        /**
         * @param auth - The Firebase {@link Auth} instance in which sign-ins should occur.
         *
         */
        constructor(auth) {
          this.providerId = _PhoneAuthProvider.PROVIDER_ID;
          this.auth = _castAuth(auth);
        }
        /**
         *
         * Starts a phone number authentication flow by sending a verification code to the given phone
         * number.
         *
         * @example
         * ```javascript
         * const provider = new PhoneAuthProvider(auth);
         * const verificationId = await provider.verifyPhoneNumber(phoneNumber, applicationVerifier);
         * // Obtain verificationCode from the user.
         * const authCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
         * const userCredential = await signInWithCredential(auth, authCredential);
         * ```
         *
         * @example
         * An alternative flow is provided using the `signInWithPhoneNumber` method.
         * ```javascript
         * const confirmationResult = signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
         * // Obtain verificationCode from the user.
         * const userCredential = confirmationResult.confirm(verificationCode);
         * ```
         *
         * @param phoneInfoOptions - The user's {@link PhoneInfoOptions}. The phone number should be in
         * E.164 format (e.g. +16505550101).
         * @param applicationVerifier - An {@link ApplicationVerifier}, which prevents
         * requests from unauthorized clients. This SDK includes an implementation
         * based on reCAPTCHA v2, {@link RecaptchaVerifier}. If you've enabled
         * reCAPTCHA Enterprise bot protection in Enforce mode, this parameter is
         * optional; in all other configurations, the parameter is required.
         *
         * @returns A Promise for a verification ID that can be passed to
         * {@link PhoneAuthProvider.credential} to identify this flow.
         */
        verifyPhoneNumber(phoneOptions, applicationVerifier) {
          return _verifyPhoneNumber(this.auth, phoneOptions, getModularInstance(applicationVerifier));
        }
        /**
         * Creates a phone auth credential, given the verification ID from
         * {@link PhoneAuthProvider.verifyPhoneNumber} and the code that was sent to the user's
         * mobile device.
         *
         * @example
         * ```javascript
         * const provider = new PhoneAuthProvider(auth);
         * const verificationId = provider.verifyPhoneNumber(phoneNumber, applicationVerifier);
         * // Obtain verificationCode from the user.
         * const authCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
         * const userCredential = signInWithCredential(auth, authCredential);
         * ```
         *
         * @example
         * An alternative flow is provided using the `signInWithPhoneNumber` method.
         * ```javascript
         * const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
         * // Obtain verificationCode from the user.
         * const userCredential = await confirmationResult.confirm(verificationCode);
         * ```
         *
         * @param verificationId - The verification ID returned from {@link PhoneAuthProvider.verifyPhoneNumber}.
         * @param verificationCode - The verification code sent to the user's mobile device.
         *
         * @returns The auth provider credential.
         */
        static credential(verificationId, verificationCode) {
          return PhoneAuthCredential._fromVerification(verificationId, verificationCode);
        }
        /**
         * Generates an {@link AuthCredential} from a {@link UserCredential}.
         * @param userCredential - The user credential.
         */
        static credentialFromResult(userCredential) {
          const credential = userCredential;
          return _PhoneAuthProvider.credentialFromTaggedObject(credential);
        }
        /**
         * Returns an {@link AuthCredential} when passed an error.
         *
         * @remarks
         *
         * This method works for errors like
         * `auth/account-exists-with-different-credentials`. This is useful for
         * recovering when attempting to set a user's phone number but the number
         * in question is already tied to another account. For example, the following
         * code tries to update the current user's phone number, and if that
         * fails, links the user with the account associated with that number:
         *
         * ```js
         * const provider = new PhoneAuthProvider(auth);
         * const verificationId = await provider.verifyPhoneNumber(number, verifier);
         * try {
         *   const code = ''; // Prompt the user for the verification code
         *   await updatePhoneNumber(
         *       auth.currentUser,
         *       PhoneAuthProvider.credential(verificationId, code));
         * } catch (e) {
         *   if ((e as FirebaseError)?.code === 'auth/account-exists-with-different-credential') {
         *     const cred = PhoneAuthProvider.credentialFromError(e);
         *     await linkWithCredential(auth.currentUser, cred);
         *   }
         * }
         *
         * // At this point, auth.currentUser.phoneNumber === number.
         * ```
         *
         * @param error - The error to generate a credential from.
         */
        static credentialFromError(error2) {
          return _PhoneAuthProvider.credentialFromTaggedObject(error2.customData || {});
        }
        static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
          if (!tokenResponse) {
            return null;
          }
          const { phoneNumber, temporaryProof } = tokenResponse;
          if (phoneNumber && temporaryProof) {
            return PhoneAuthCredential._fromTokenResponse(phoneNumber, temporaryProof);
          }
          return null;
        }
      };
      PhoneAuthProvider.PROVIDER_ID = "phone";
      PhoneAuthProvider.PHONE_SIGN_IN_METHOD = "phone";
      IdpCredential = class extends AuthCredential {
        constructor(params) {
          super(
            "custom",
            "custom"
            /* ProviderId.CUSTOM */
          );
          this.params = params;
        }
        _getIdTokenResponse(auth) {
          return signInWithIdp(auth, this._buildIdpRequest());
        }
        _linkToIdToken(auth, idToken) {
          return signInWithIdp(auth, this._buildIdpRequest(idToken));
        }
        _getReauthenticationResolver(auth) {
          return signInWithIdp(auth, this._buildIdpRequest());
        }
        _buildIdpRequest(idToken) {
          const request = {
            requestUri: this.params.requestUri,
            sessionId: this.params.sessionId,
            postBody: this.params.postBody,
            tenantId: this.params.tenantId,
            pendingToken: this.params.pendingToken,
            returnSecureToken: true,
            returnIdpCredential: true
          };
          if (idToken) {
            request.idToken = idToken;
          }
          return request;
        }
      };
      AbstractPopupRedirectOperation = class {
        constructor(auth, filter, resolver, user, bypassAuthState = false) {
          this.auth = auth;
          this.resolver = resolver;
          this.user = user;
          this.bypassAuthState = bypassAuthState;
          this.pendingPromise = null;
          this.eventManager = null;
          this.filter = Array.isArray(filter) ? filter : [filter];
        }
        execute() {
          return new Promise(async (resolve, reject) => {
            this.pendingPromise = { resolve, reject };
            try {
              this.eventManager = await this.resolver._initialize(this.auth);
              await this.onExecution();
              this.eventManager.registerConsumer(this);
            } catch (e) {
              this.reject(e);
            }
          });
        }
        async onAuthEvent(event) {
          const { urlResponse, sessionId, postBody, tenantId, error: error2, type } = event;
          if (error2) {
            this.reject(error2);
            return;
          }
          const params = {
            auth: this.auth,
            requestUri: urlResponse,
            sessionId,
            tenantId: tenantId || void 0,
            postBody: postBody || void 0,
            user: this.user,
            bypassAuthState: this.bypassAuthState
          };
          try {
            this.resolve(await this.getIdpTask(type)(params));
          } catch (e) {
            this.reject(e);
          }
        }
        onError(error2) {
          this.reject(error2);
        }
        getIdpTask(type) {
          switch (type) {
            case "signInViaPopup":
            case "signInViaRedirect":
              return _signIn;
            case "linkViaPopup":
            case "linkViaRedirect":
              return _link;
            case "reauthViaPopup":
            case "reauthViaRedirect":
              return _reauth;
            default:
              _fail(
                this.auth,
                "internal-error"
                /* AuthErrorCode.INTERNAL_ERROR */
              );
          }
        }
        resolve(cred) {
          debugAssert(this.pendingPromise, "Pending promise was never set");
          this.pendingPromise.resolve(cred);
          this.unregisterAndCleanUp();
        }
        reject(error2) {
          debugAssert(this.pendingPromise, "Pending promise was never set");
          this.pendingPromise.reject(error2);
          this.unregisterAndCleanUp();
        }
        unregisterAndCleanUp() {
          if (this.eventManager) {
            this.eventManager.unregisterConsumer(this);
          }
          this.pendingPromise = null;
          this.cleanUp();
        }
      };
      _POLL_WINDOW_CLOSE_TIMEOUT = new Delay(2e3, 1e4);
      PopupOperation = class _PopupOperation extends AbstractPopupRedirectOperation {
        constructor(auth, filter, provider, resolver, user) {
          super(auth, filter, resolver, user);
          this.provider = provider;
          this.authWindow = null;
          this.pollId = null;
          if (_PopupOperation.currentPopupAction) {
            _PopupOperation.currentPopupAction.cancel();
          }
          _PopupOperation.currentPopupAction = this;
        }
        async executeNotNull() {
          const result = await this.execute();
          _assert(
            result,
            this.auth,
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          return result;
        }
        async onExecution() {
          debugAssert(this.filter.length === 1, "Popup operations only handle one event");
          const eventId = _generateEventId();
          this.authWindow = await this.resolver._openPopup(
            this.auth,
            this.provider,
            this.filter[0],
            // There's always one, see constructor
            eventId
          );
          this.authWindow.associatedEvent = eventId;
          this.resolver._originValidation(this.auth).catch((e) => {
            this.reject(e);
          });
          this.resolver._isIframeWebStorageSupported(this.auth, (isSupported) => {
            if (!isSupported) {
              this.reject(_createError(
                this.auth,
                "web-storage-unsupported"
                /* AuthErrorCode.WEB_STORAGE_UNSUPPORTED */
              ));
            }
          });
          this.pollUserCancellation();
        }
        get eventId() {
          return this.authWindow?.associatedEvent || null;
        }
        cancel() {
          this.reject(_createError(
            this.auth,
            "cancelled-popup-request"
            /* AuthErrorCode.EXPIRED_POPUP_REQUEST */
          ));
        }
        cleanUp() {
          if (this.authWindow) {
            this.authWindow.close();
          }
          if (this.pollId) {
            window.clearTimeout(this.pollId);
          }
          this.authWindow = null;
          this.pollId = null;
          _PopupOperation.currentPopupAction = null;
        }
        pollUserCancellation() {
          const poll = () => {
            if (this.authWindow?.window?.closed) {
              this.pollId = window.setTimeout(
                () => {
                  this.pollId = null;
                  this.reject(_createError(
                    this.auth,
                    "popup-closed-by-user"
                    /* AuthErrorCode.POPUP_CLOSED_BY_USER */
                  ));
                },
                8e3
                /* _Timeout.AUTH_EVENT */
              );
              return;
            }
            this.pollId = window.setTimeout(poll, _POLL_WINDOW_CLOSE_TIMEOUT.get());
          };
          poll();
        }
      };
      PopupOperation.currentPopupAction = null;
      PENDING_REDIRECT_KEY = "pendingRedirect";
      redirectOutcomeMap = /* @__PURE__ */ new Map();
      RedirectAction = class extends AbstractPopupRedirectOperation {
        constructor(auth, resolver, bypassAuthState = false) {
          super(auth, [
            "signInViaRedirect",
            "linkViaRedirect",
            "reauthViaRedirect",
            "unknown"
            /* AuthEventType.UNKNOWN */
          ], resolver, void 0, bypassAuthState);
          this.eventId = null;
        }
        /**
         * Override the execute function; if we already have a redirect result, then
         * just return it.
         */
        async execute() {
          let readyOutcome = redirectOutcomeMap.get(this.auth._key());
          if (!readyOutcome) {
            try {
              const hasPendingRedirect = await _getAndClearPendingRedirectStatus(this.resolver, this.auth);
              const result = hasPendingRedirect ? await super.execute() : null;
              readyOutcome = () => Promise.resolve(result);
            } catch (e) {
              readyOutcome = () => Promise.reject(e);
            }
            redirectOutcomeMap.set(this.auth._key(), readyOutcome);
          }
          if (!this.bypassAuthState) {
            redirectOutcomeMap.set(this.auth._key(), () => Promise.resolve(null));
          }
          return readyOutcome();
        }
        async onAuthEvent(event) {
          if (event.type === "signInViaRedirect") {
            return super.onAuthEvent(event);
          } else if (event.type === "unknown") {
            this.resolve(null);
            return;
          }
          if (event.eventId) {
            const user = await this.auth._redirectUserForId(event.eventId);
            if (user) {
              this.user = user;
              return super.onAuthEvent(event);
            } else {
              this.resolve(null);
            }
          }
        }
        async onExecution() {
        }
        cleanUp() {
        }
      };
      EVENT_DUPLICATION_CACHE_DURATION_MS = 10 * 60 * 1e3;
      AuthEventManager = class {
        constructor(auth) {
          this.auth = auth;
          this.cachedEventUids = /* @__PURE__ */ new Set();
          this.consumers = /* @__PURE__ */ new Set();
          this.queuedRedirectEvent = null;
          this.hasHandledPotentialRedirect = false;
          this.lastProcessedEventTime = Date.now();
        }
        registerConsumer(authEventConsumer) {
          this.consumers.add(authEventConsumer);
          if (this.queuedRedirectEvent && this.isEventForConsumer(this.queuedRedirectEvent, authEventConsumer)) {
            this.sendToConsumer(this.queuedRedirectEvent, authEventConsumer);
            this.saveEventToCache(this.queuedRedirectEvent);
            this.queuedRedirectEvent = null;
          }
        }
        unregisterConsumer(authEventConsumer) {
          this.consumers.delete(authEventConsumer);
        }
        onEvent(event) {
          if (this.hasEventBeenHandled(event)) {
            return false;
          }
          let handled = false;
          this.consumers.forEach((consumer) => {
            if (this.isEventForConsumer(event, consumer)) {
              handled = true;
              this.sendToConsumer(event, consumer);
              this.saveEventToCache(event);
            }
          });
          if (this.hasHandledPotentialRedirect || !isRedirectEvent(event)) {
            return handled;
          }
          this.hasHandledPotentialRedirect = true;
          if (!handled) {
            this.queuedRedirectEvent = event;
            handled = true;
          }
          return handled;
        }
        sendToConsumer(event, consumer) {
          if (event.error && !isNullRedirectEvent(event)) {
            const code = event.error.code?.split("auth/")[1] || "internal-error";
            consumer.onError(_createError(this.auth, code));
          } else {
            consumer.onAuthEvent(event);
          }
        }
        isEventForConsumer(event, consumer) {
          const eventIdMatches = consumer.eventId === null || !!event.eventId && event.eventId === consumer.eventId;
          return consumer.filter.includes(event.type) && eventIdMatches;
        }
        hasEventBeenHandled(event) {
          if (Date.now() - this.lastProcessedEventTime >= EVENT_DUPLICATION_CACHE_DURATION_MS) {
            this.cachedEventUids.clear();
          }
          return this.cachedEventUids.has(eventUid(event));
        }
        saveEventToCache(event) {
          this.cachedEventUids.add(eventUid(event));
          this.lastProcessedEventTime = Date.now();
        }
      };
      IP_ADDRESS_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      HTTP_REGEX = /^https?/;
      NETWORK_TIMEOUT = new Delay(3e4, 6e4);
      cachedGApiLoader = null;
      PING_TIMEOUT = new Delay(5e3, 15e3);
      IFRAME_PATH = "__/auth/iframe";
      EMULATED_IFRAME_PATH = "emulator/auth/iframe";
      IFRAME_ATTRIBUTES = {
        style: {
          position: "absolute",
          top: "-100px",
          width: "1px",
          height: "1px"
        },
        "aria-hidden": "true",
        tabindex: "-1"
      };
      EID_FROM_APIHOST = /* @__PURE__ */ new Map([
        ["identitytoolkit.googleapis.com", "p"],
        // production
        ["staging-identitytoolkit.sandbox.googleapis.com", "s"],
        // staging
        ["test-identitytoolkit.sandbox.googleapis.com", "t"]
        // test
      ]);
      BASE_POPUP_OPTIONS = {
        location: "yes",
        resizable: "yes",
        statusbar: "yes",
        toolbar: "no"
      };
      DEFAULT_WIDTH = 500;
      DEFAULT_HEIGHT = 600;
      TARGET_BLANK = "_blank";
      FIREFOX_EMPTY_URL = "http://localhost";
      AuthPopup = class {
        constructor(window2) {
          this.window = window2;
          this.associatedEvent = null;
        }
        close() {
          if (this.window) {
            try {
              this.window.close();
            } catch (e) {
            }
          }
        }
      };
      WIDGET_PATH = "__/auth/handler";
      EMULATOR_WIDGET_PATH = "emulator/auth/handler";
      FIREBASE_APP_CHECK_FRAGMENT_ID = encodeURIComponent("fac");
      WEB_STORAGE_SUPPORT_KEY = "webStorageSupport";
      BrowserPopupRedirectResolver = class {
        constructor() {
          this.eventManagers = {};
          this.iframes = {};
          this.originValidationPromises = {};
          this._redirectPersistence = browserSessionPersistence;
          this._completeRedirectFn = _getRedirectResult;
          this._overrideRedirectResult = _overrideRedirectResult;
        }
        // Wrapping in async even though we don't await anywhere in order
        // to make sure errors are raised as promise rejections
        async _openPopup(auth, provider, authType, eventId) {
          debugAssert(this.eventManagers[auth._key()]?.manager, "_initialize() not called before _openPopup()");
          const url = await _getRedirectUrl(auth, provider, authType, _getCurrentUrl(), eventId);
          return _open(auth, url, _generateEventId());
        }
        async _openRedirect(auth, provider, authType, eventId) {
          await this._originValidation(auth);
          const url = await _getRedirectUrl(auth, provider, authType, _getCurrentUrl(), eventId);
          _setWindowLocation(url);
          return new Promise(() => {
          });
        }
        _initialize(auth) {
          const key = auth._key();
          if (this.eventManagers[key]) {
            const { manager, promise: promise2 } = this.eventManagers[key];
            if (manager) {
              return Promise.resolve(manager);
            } else {
              debugAssert(promise2, "If manager is not set, promise should be");
              return promise2;
            }
          }
          const promise = this.initAndGetManager(auth);
          this.eventManagers[key] = { promise };
          promise.catch(() => {
            delete this.eventManagers[key];
          });
          return promise;
        }
        async initAndGetManager(auth) {
          const iframe = await _openIframe(auth);
          const manager = new AuthEventManager(auth);
          iframe.register("authEvent", (iframeEvent) => {
            _assert(
              iframeEvent?.authEvent,
              auth,
              "invalid-auth-event"
              /* AuthErrorCode.INVALID_AUTH_EVENT */
            );
            const handled = manager.onEvent(iframeEvent.authEvent);
            return {
              status: handled ? "ACK" : "ERROR"
              /* GapiOutcome.ERROR */
            };
          }, gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER);
          this.eventManagers[auth._key()] = { manager };
          this.iframes[auth._key()] = iframe;
          return manager;
        }
        _isIframeWebStorageSupported(auth, cb) {
          const iframe = this.iframes[auth._key()];
          iframe.send(WEB_STORAGE_SUPPORT_KEY, { type: WEB_STORAGE_SUPPORT_KEY }, (result) => {
            const isSupported = result?.[0]?.[WEB_STORAGE_SUPPORT_KEY];
            if (isSupported !== void 0) {
              cb(!!isSupported);
            }
            _fail(
              auth,
              "internal-error"
              /* AuthErrorCode.INTERNAL_ERROR */
            );
          }, gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER);
        }
        _originValidation(auth) {
          const key = auth._key();
          if (!this.originValidationPromises[key]) {
            this.originValidationPromises[key] = _validateOrigin(auth);
          }
          return this.originValidationPromises[key];
        }
        get _shouldInitProactively() {
          return _isMobileBrowser() || _isSafari() || _isIOS();
        }
      };
      browserPopupRedirectResolver = BrowserPopupRedirectResolver;
      MultiFactorAssertionImpl = class {
        constructor(factorId) {
          this.factorId = factorId;
        }
        _process(auth, session, displayName) {
          switch (session.type) {
            case "enroll":
              return this._finalizeEnroll(auth, session.credential, displayName);
            case "signin":
              return this._finalizeSignIn(auth, session.credential);
            default:
              return debugFail("unexpected MultiFactorSessionType");
          }
        }
      };
      PhoneMultiFactorAssertionImpl = class _PhoneMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
        constructor(credential) {
          super(
            "phone"
            /* FactorId.PHONE */
          );
          this.credential = credential;
        }
        /** @internal */
        static _fromCredential(credential) {
          return new _PhoneMultiFactorAssertionImpl(credential);
        }
        /** @internal */
        _finalizeEnroll(auth, idToken, displayName) {
          return finalizeEnrollPhoneMfa(auth, {
            idToken,
            displayName,
            phoneVerificationInfo: this.credential._makeVerificationRequest()
          });
        }
        /** @internal */
        _finalizeSignIn(auth, mfaPendingCredential) {
          return finalizeSignInPhoneMfa(auth, {
            mfaPendingCredential,
            phoneVerificationInfo: this.credential._makeVerificationRequest()
          });
        }
      };
      PhoneMultiFactorGenerator = class {
        constructor() {
        }
        /**
         * Provides a {@link PhoneMultiFactorAssertion} to confirm ownership of the phone second factor.
         *
         * @remarks
         * This method does not work in a Node.js environment.
         *
         * @param phoneAuthCredential - A credential provided by {@link PhoneAuthProvider.credential}.
         * @returns A {@link PhoneMultiFactorAssertion} which can be used with
         * {@link MultiFactorResolver.resolveSignIn}
         */
        static assertion(credential) {
          return PhoneMultiFactorAssertionImpl._fromCredential(credential);
        }
      };
      PhoneMultiFactorGenerator.FACTOR_ID = "phone";
      TotpMultiFactorGenerator = class {
        /**
         * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of
         * the TOTP (time-based one-time password) second factor.
         * This assertion is used to complete enrollment in TOTP second factor.
         *
         * @param secret A {@link TotpSecret} containing the shared secret key and other TOTP parameters.
         * @param oneTimePassword One-time password from TOTP App.
         * @returns A {@link TotpMultiFactorAssertion} which can be used with
         * {@link MultiFactorUser.enroll}.
         */
        static assertionForEnrollment(secret, oneTimePassword) {
          return TotpMultiFactorAssertionImpl._fromSecret(secret, oneTimePassword);
        }
        /**
         * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of the TOTP second factor.
         * This assertion is used to complete signIn with TOTP as the second factor.
         *
         * @param enrollmentId identifies the enrolled TOTP second factor.
         * @param oneTimePassword One-time password from TOTP App.
         * @returns A {@link TotpMultiFactorAssertion} which can be used with
         * {@link MultiFactorResolver.resolveSignIn}.
         */
        static assertionForSignIn(enrollmentId, oneTimePassword) {
          return TotpMultiFactorAssertionImpl._fromEnrollmentId(enrollmentId, oneTimePassword);
        }
        /**
         * Returns a promise to {@link TotpSecret} which contains the TOTP shared secret key and other parameters.
         * Creates a TOTP secret as part of enrolling a TOTP second factor.
         * Used for generating a QR code URL or inputting into a TOTP app.
         * This method uses the auth instance corresponding to the user in the multiFactorSession.
         *
         * @param session The {@link MultiFactorSession} that the user is part of.
         * @returns A promise to {@link TotpSecret}.
         */
        static async generateSecret(session) {
          const mfaSession = session;
          _assert(
            typeof mfaSession.user?.auth !== "undefined",
            "internal-error"
            /* AuthErrorCode.INTERNAL_ERROR */
          );
          const response = await startEnrollTotpMfa(mfaSession.user.auth, {
            idToken: mfaSession.credential,
            totpEnrollmentInfo: {}
          });
          return TotpSecret._fromStartTotpMfaEnrollmentResponse(response, mfaSession.user.auth);
        }
      };
      TotpMultiFactorGenerator.FACTOR_ID = "totp";
      TotpMultiFactorAssertionImpl = class _TotpMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
        constructor(otp, enrollmentId, secret) {
          super(
            "totp"
            /* FactorId.TOTP */
          );
          this.otp = otp;
          this.enrollmentId = enrollmentId;
          this.secret = secret;
        }
        /** @internal */
        static _fromSecret(secret, otp) {
          return new _TotpMultiFactorAssertionImpl(otp, void 0, secret);
        }
        /** @internal */
        static _fromEnrollmentId(enrollmentId, otp) {
          return new _TotpMultiFactorAssertionImpl(otp, enrollmentId);
        }
        /** @internal */
        async _finalizeEnroll(auth, idToken, displayName) {
          _assert(
            typeof this.secret !== "undefined",
            auth,
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
          return finalizeEnrollTotpMfa(auth, {
            idToken,
            displayName,
            totpVerificationInfo: this.secret._makeTotpVerificationInfo(this.otp)
          });
        }
        /** @internal */
        async _finalizeSignIn(auth, mfaPendingCredential) {
          _assert(
            this.enrollmentId !== void 0 && this.otp !== void 0,
            auth,
            "argument-error"
            /* AuthErrorCode.ARGUMENT_ERROR */
          );
          const totpVerificationInfo = { verificationCode: this.otp };
          return finalizeSignInTotpMfa(auth, {
            mfaPendingCredential,
            mfaEnrollmentId: this.enrollmentId,
            totpVerificationInfo
          });
        }
      };
      TotpSecret = class _TotpSecret {
        // The public members are declared outside the constructor so the docs can be generated.
        constructor(secretKey, hashingAlgorithm, codeLength, codeIntervalSeconds, enrollmentCompletionDeadline, sessionInfo, auth) {
          this.sessionInfo = sessionInfo;
          this.auth = auth;
          this.secretKey = secretKey;
          this.hashingAlgorithm = hashingAlgorithm;
          this.codeLength = codeLength;
          this.codeIntervalSeconds = codeIntervalSeconds;
          this.enrollmentCompletionDeadline = enrollmentCompletionDeadline;
        }
        /** @internal */
        static _fromStartTotpMfaEnrollmentResponse(response, auth) {
          return new _TotpSecret(response.totpSessionInfo.sharedSecretKey, response.totpSessionInfo.hashingAlgorithm, response.totpSessionInfo.verificationCodeLength, response.totpSessionInfo.periodSec, new Date(response.totpSessionInfo.finalizeEnrollmentTime).toUTCString(), response.totpSessionInfo.sessionInfo, auth);
        }
        /** @internal */
        _makeTotpVerificationInfo(otp) {
          return { sessionInfo: this.sessionInfo, verificationCode: otp };
        }
        /**
         * Returns a QR code URL as described in
         * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
         * This can be displayed to the user as a QR code to be scanned into a TOTP app like Google Authenticator.
         * If the optional parameters are unspecified, an accountName of <userEmail> and issuer of <firebaseAppName> are used.
         *
         * @param accountName the name of the account/app along with a user identifier.
         * @param issuer issuer of the TOTP (likely the app name).
         * @returns A QR code URL string.
         */
        generateQrCodeUrl(accountName, issuer) {
          let useDefaults = false;
          if (_isEmptyString(accountName) || _isEmptyString(issuer)) {
            useDefaults = true;
          }
          if (useDefaults) {
            if (_isEmptyString(accountName)) {
              accountName = this.auth.currentUser?.email || "unknownuser";
            }
            if (_isEmptyString(issuer)) {
              issuer = this.auth.name;
            }
          }
          return `otpauth://totp/${issuer}:${accountName}?secret=${this.secretKey}&issuer=${issuer}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`;
        }
      };
      name3 = "@firebase/auth";
      version3 = "1.13.3";
      AuthInterop = class {
        constructor(auth) {
          this.auth = auth;
          this.internalListeners = /* @__PURE__ */ new Map();
        }
        getUid() {
          this.assertAuthConfigured();
          return this.auth.currentUser?.uid || null;
        }
        async getToken(forceRefresh) {
          this.assertAuthConfigured();
          await this.auth._initializationPromise;
          if (!this.auth.currentUser) {
            return null;
          }
          const accessToken = await this.auth.currentUser.getIdToken(forceRefresh);
          return { accessToken };
        }
        addAuthTokenListener(listener) {
          this.assertAuthConfigured();
          if (this.internalListeners.has(listener)) {
            return;
          }
          const unsubscribe = this.auth.onIdTokenChanged((user) => {
            listener(user?.stsTokenManager.accessToken || null);
          });
          this.internalListeners.set(listener, unsubscribe);
          this.updateProactiveRefresh();
        }
        removeAuthTokenListener(listener) {
          this.assertAuthConfigured();
          const unsubscribe = this.internalListeners.get(listener);
          if (!unsubscribe) {
            return;
          }
          this.internalListeners.delete(listener);
          unsubscribe();
          this.updateProactiveRefresh();
        }
        assertAuthConfigured() {
          _assert(
            this.auth._initializationPromise,
            "dependent-sdk-initialized-before-auth"
            /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
          );
        }
        updateProactiveRefresh() {
          if (this.internalListeners.size > 0) {
            this.auth._startProactiveRefresh();
          } else {
            this.auth._stopProactiveRefresh();
          }
        }
      };
      DEFAULT_ID_TOKEN_MAX_AGE = 5 * 60;
      authIdTokenMaxAge = getExperimentalSetting("authIdTokenMaxAge") || DEFAULT_ID_TOKEN_MAX_AGE;
      lastPostedIdToken = null;
      mintCookieFactory = (url) => async (user) => {
        const idTokenResult = user && await user.getIdTokenResult();
        const idTokenAge = idTokenResult && ((/* @__PURE__ */ new Date()).getTime() - Date.parse(idTokenResult.issuedAtTime)) / 1e3;
        if (idTokenAge && idTokenAge > authIdTokenMaxAge) {
          return;
        }
        const idToken = idTokenResult?.token;
        if (lastPostedIdToken === idToken) {
          return;
        }
        lastPostedIdToken = idToken;
        await fetch(url, {
          method: idToken ? "POST" : "DELETE",
          headers: idToken ? {
            "Authorization": `Bearer ${idToken}`
          } : {}
        });
      };
      _setExternalJSProvider({
        loadJS(url) {
          return new Promise((resolve, reject) => {
            const el = document.createElement("script");
            el.setAttribute("src", url);
            el.onload = resolve;
            el.onerror = (e) => {
              const error2 = _createError(
                "internal-error"
                /* AuthErrorCode.INTERNAL_ERROR */
              );
              error2.customData = e;
              reject(error2);
            };
            el.type = "text/javascript";
            el.charset = "UTF-8";
            getScriptParentElement().appendChild(el);
          });
        },
        gapiScript: "https://apis.google.com/js/api.js",
        recaptchaV2Script: "https://www.google.com/recaptcha/api.js",
        recaptchaEnterpriseScript: "https://www.google.com/recaptcha/enterprise.js?render="
      });
      registerAuth(
        "Browser"
        /* ClientPlatform.BROWSER */
      );
    }
  });

  // node_modules/@firebase/auth/dist/esm/index.js
  var init_esm = __esm({
    "node_modules/@firebase/auth/dist/esm/index.js"() {
      init_index_d90d2ee5();
      init_index_esm4();
      init_index_esm();
      init_index_esm3();
      init_index_esm2();
    }
  });

  // node_modules/firebase/auth/dist/esm/index.esm.js
  var init_index_esm6 = __esm({
    "node_modules/firebase/auth/dist/esm/index.esm.js"() {
      init_esm();
    }
  });

  // node_modules/@firebase/database/dist/index.esm.js
  function setSDKVersion(version5) {
    SDK_VERSION2 = version5;
  }
  function each(obj, fn) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        fn(key, obj[key]);
      }
    }
  }
  function errorForServerCode(code, query) {
    let reason = "Unknown Error";
    if (code === "too_big") {
      reason = "The data requested exceeds the maximum size that can be accessed with a single request.";
    } else if (code === "permission_denied") {
      reason = "Client doesn't have permission to access the desired data.";
    } else if (code === "unavailable") {
      reason = "The service is unavailable";
    }
    const error2 = new Error(code + " at " + query._path.toString() + ": " + reason);
    error2.code = code.toUpperCase();
    return error2;
  }
  function repoInfoNeedsQueryParam(repoInfo) {
    return repoInfo.host !== repoInfo.internalHost || repoInfo.isCustomHost() || repoInfo.includeNamespaceInQueryParams;
  }
  function repoInfoConnectionURL(repoInfo, type, params) {
    assert(typeof type === "string", "typeof type must == string");
    assert(typeof params === "object", "typeof params must == object");
    let connURL;
    if (type === WEBSOCKET) {
      connURL = (repoInfo.secure ? "wss://" : "ws://") + repoInfo.internalHost + "/.ws?";
    } else if (type === LONG_POLLING) {
      connURL = (repoInfo.secure ? "https://" : "http://") + repoInfo.internalHost + "/.lp?";
    } else {
      throw new Error("Unknown connection type: " + type);
    }
    if (repoInfoNeedsQueryParam(repoInfo)) {
      params["ns"] = repoInfo.namespace;
    }
    const pairs = [];
    each(params, (key, value) => {
      pairs.push(key + "=" + value);
    });
    return connURL + pairs.join("&");
  }
  function statsManagerGetCollection(repoInfo) {
    const hashString = repoInfo.toString();
    if (!collections[hashString]) {
      collections[hashString] = new StatsCollection();
    }
    return collections[hashString];
  }
  function statsManagerGetOrCreateReporter(repoInfo, creatorFunction) {
    const hashString = repoInfo.toString();
    if (!reporters[hashString]) {
      reporters[hashString] = creatorFunction();
    }
    return reporters[hashString];
  }
  function newEmptyPath() {
    return new Path("");
  }
  function pathGetFront(path) {
    if (path.pieceNum_ >= path.pieces_.length) {
      return null;
    }
    return path.pieces_[path.pieceNum_];
  }
  function pathGetLength(path) {
    return path.pieces_.length - path.pieceNum_;
  }
  function pathPopFront(path) {
    let pieceNum = path.pieceNum_;
    if (pieceNum < path.pieces_.length) {
      pieceNum++;
    }
    return new Path(path.pieces_, pieceNum);
  }
  function pathGetBack(path) {
    if (path.pieceNum_ < path.pieces_.length) {
      return path.pieces_[path.pieces_.length - 1];
    }
    return null;
  }
  function pathToUrlEncodedString(path) {
    let pathString = "";
    for (let i = path.pieceNum_; i < path.pieces_.length; i++) {
      if (path.pieces_[i] !== "") {
        pathString += "/" + encodeURIComponent(String(path.pieces_[i]));
      }
    }
    return pathString || "/";
  }
  function pathSlice(path, begin = 0) {
    return path.pieces_.slice(path.pieceNum_ + begin);
  }
  function pathParent(path) {
    if (path.pieceNum_ >= path.pieces_.length) {
      return null;
    }
    const pieces = [];
    for (let i = path.pieceNum_; i < path.pieces_.length - 1; i++) {
      pieces.push(path.pieces_[i]);
    }
    return new Path(pieces, 0);
  }
  function pathChild(path, childPathObj) {
    const pieces = [];
    for (let i = path.pieceNum_; i < path.pieces_.length; i++) {
      pieces.push(path.pieces_[i]);
    }
    if (childPathObj instanceof Path) {
      for (let i = childPathObj.pieceNum_; i < childPathObj.pieces_.length; i++) {
        pieces.push(childPathObj.pieces_[i]);
      }
    } else {
      const childPieces = childPathObj.split("/");
      for (let i = 0; i < childPieces.length; i++) {
        if (childPieces[i].length > 0) {
          pieces.push(childPieces[i]);
        }
      }
    }
    return new Path(pieces, 0);
  }
  function pathIsEmpty(path) {
    return path.pieceNum_ >= path.pieces_.length;
  }
  function newRelativePath(outerPath, innerPath) {
    const outer = pathGetFront(outerPath), inner = pathGetFront(innerPath);
    if (outer === null) {
      return innerPath;
    } else if (outer === inner) {
      return newRelativePath(pathPopFront(outerPath), pathPopFront(innerPath));
    } else {
      throw new Error("INTERNAL ERROR: innerPath (" + innerPath + ") is not within outerPath (" + outerPath + ")");
    }
  }
  function pathEquals(path, other) {
    if (pathGetLength(path) !== pathGetLength(other)) {
      return false;
    }
    for (let i = path.pieceNum_, j = other.pieceNum_; i <= path.pieces_.length; i++, j++) {
      if (path.pieces_[i] !== other.pieces_[j]) {
        return false;
      }
    }
    return true;
  }
  function pathContains(path, other) {
    let i = path.pieceNum_;
    let j = other.pieceNum_;
    if (pathGetLength(path) > pathGetLength(other)) {
      return false;
    }
    while (i < path.pieces_.length) {
      if (path.pieces_[i] !== other.pieces_[j]) {
        return false;
      }
      ++i;
      ++j;
    }
    return true;
  }
  function validationPathPush(validationPath, child2) {
    if (validationPath.parts_.length > 0) {
      validationPath.byteLength_ += 1;
    }
    validationPath.parts_.push(child2);
    validationPath.byteLength_ += stringLength(child2);
    validationPathCheckValid(validationPath);
  }
  function validationPathPop(validationPath) {
    const last = validationPath.parts_.pop();
    validationPath.byteLength_ -= stringLength(last);
    if (validationPath.parts_.length > 0) {
      validationPath.byteLength_ -= 1;
    }
  }
  function validationPathCheckValid(validationPath) {
    if (validationPath.byteLength_ > MAX_PATH_LENGTH_BYTES) {
      throw new Error(validationPath.errorPrefix_ + "has a key path longer than " + MAX_PATH_LENGTH_BYTES + " bytes (" + validationPath.byteLength_ + ").");
    }
    if (validationPath.parts_.length > MAX_PATH_DEPTH) {
      throw new Error(validationPath.errorPrefix_ + "path specified exceeds the maximum depth that can be written (" + MAX_PATH_DEPTH + ") or object contains a cycle " + validationPathToErrorString(validationPath));
    }
  }
  function validationPathToErrorString(validationPath) {
    if (validationPath.parts_.length === 0) {
      return "";
    }
    return "in property '" + validationPath.parts_.join(".") + "'";
  }
  function NAME_ONLY_COMPARATOR(left, right) {
    return nameCompare(left.name, right.name);
  }
  function NAME_COMPARATOR(left, right) {
    return nameCompare(left, right);
  }
  function setMaxNode$1(val) {
    MAX_NODE$2 = val;
  }
  function setNodeFromJSON(val) {
    nodeFromJSON$1 = val;
  }
  function setMaxNode(val) {
    MAX_NODE$1 = val;
  }
  function nodeFromJSON(json, priority = null) {
    if (json === null) {
      return ChildrenNode.EMPTY_NODE;
    }
    if (typeof json === "object" && ".priority" in json) {
      priority = json[".priority"];
    }
    assert(priority === null || typeof priority === "string" || typeof priority === "number" || typeof priority === "object" && ".sv" in priority, "Invalid priority type found: " + typeof priority);
    if (typeof json === "object" && ".value" in json && json[".value"] !== null) {
      json = json[".value"];
    }
    if (typeof json !== "object" || ".sv" in json) {
      const jsonLeaf = json;
      return new LeafNode(jsonLeaf, nodeFromJSON(priority));
    }
    if (!(json instanceof Array) && USE_HINZE) {
      const children = [];
      let childrenHavePriority = false;
      const hinzeJsonObj = json;
      each(hinzeJsonObj, (key, child2) => {
        if (key.substring(0, 1) !== ".") {
          const childNode = nodeFromJSON(child2);
          if (!childNode.isEmpty()) {
            childrenHavePriority = childrenHavePriority || !childNode.getPriority().isEmpty();
            children.push(new NamedNode(key, childNode));
          }
        }
      });
      if (children.length === 0) {
        return ChildrenNode.EMPTY_NODE;
      }
      const childSet = buildChildSet(children, NAME_ONLY_COMPARATOR, (namedNode) => namedNode.name, NAME_COMPARATOR);
      if (childrenHavePriority) {
        const sortedChildSet = buildChildSet(children, PRIORITY_INDEX.getCompare());
        return new ChildrenNode(childSet, nodeFromJSON(priority), new IndexMap({ ".priority": sortedChildSet }, { ".priority": PRIORITY_INDEX }));
      } else {
        return new ChildrenNode(childSet, nodeFromJSON(priority), IndexMap.Default);
      }
    } else {
      let node = ChildrenNode.EMPTY_NODE;
      each(json, (key, childData) => {
        if (contains(json, key)) {
          if (key.substring(0, 1) !== ".") {
            const childNode = nodeFromJSON(childData);
            if (childNode.isLeafNode() || !childNode.isEmpty()) {
              node = node.updateImmediateChild(key, childNode);
            }
          }
        }
      });
      return node.updatePriority(nodeFromJSON(priority));
    }
  }
  function changeValue(snapshotNode) {
    return { type: "value", snapshotNode };
  }
  function changeChildAdded(childName, snapshotNode) {
    return { type: "child_added", snapshotNode, childName };
  }
  function changeChildRemoved(childName, snapshotNode) {
    return { type: "child_removed", snapshotNode, childName };
  }
  function changeChildChanged(childName, snapshotNode, oldSnap) {
    return {
      type: "child_changed",
      snapshotNode,
      childName,
      oldSnap
    };
  }
  function changeChildMoved(childName, snapshotNode) {
    return { type: "child_moved", snapshotNode, childName };
  }
  function queryParamsGetNodeFilter(queryParams) {
    if (queryParams.loadsAllData()) {
      return new IndexedFilter(queryParams.getIndex());
    } else if (queryParams.hasLimit()) {
      return new LimitedFilter(queryParams);
    } else {
      return new RangedFilter(queryParams);
    }
  }
  function queryParamsToRestQueryStringParameters(queryParams) {
    const qs = {};
    if (queryParams.isDefault()) {
      return qs;
    }
    let orderBy;
    if (queryParams.index_ === PRIORITY_INDEX) {
      orderBy = "$priority";
    } else if (queryParams.index_ === VALUE_INDEX) {
      orderBy = "$value";
    } else if (queryParams.index_ === KEY_INDEX) {
      orderBy = "$key";
    } else {
      assert(queryParams.index_ instanceof PathIndex, "Unrecognized index type!");
      orderBy = queryParams.index_.toString();
    }
    qs[
      "orderBy"
      /* REST_QUERY_CONSTANTS.ORDER_BY */
    ] = stringify(orderBy);
    if (queryParams.startSet_) {
      const startParam = queryParams.startAfterSet_ ? "startAfter" : "startAt";
      qs[startParam] = stringify(queryParams.indexStartValue_);
      if (queryParams.startNameSet_) {
        qs[startParam] += "," + stringify(queryParams.indexStartName_);
      }
    }
    if (queryParams.endSet_) {
      const endParam = queryParams.endBeforeSet_ ? "endBefore" : "endAt";
      qs[endParam] = stringify(queryParams.indexEndValue_);
      if (queryParams.endNameSet_) {
        qs[endParam] += "," + stringify(queryParams.indexEndName_);
      }
    }
    if (queryParams.limitSet_) {
      if (queryParams.isViewFromLeft()) {
        qs[
          "limitToFirst"
          /* REST_QUERY_CONSTANTS.LIMIT_TO_FIRST */
        ] = queryParams.limit_;
      } else {
        qs[
          "limitToLast"
          /* REST_QUERY_CONSTANTS.LIMIT_TO_LAST */
        ] = queryParams.limit_;
      }
    }
    return qs;
  }
  function queryParamsGetQueryObject(queryParams) {
    const obj = {};
    if (queryParams.startSet_) {
      obj[
        "sp"
        /* WIRE_PROTOCOL_CONSTANTS.INDEX_START_VALUE */
      ] = queryParams.indexStartValue_;
      if (queryParams.startNameSet_) {
        obj[
          "sn"
          /* WIRE_PROTOCOL_CONSTANTS.INDEX_START_NAME */
        ] = queryParams.indexStartName_;
      }
      obj[
        "sin"
        /* WIRE_PROTOCOL_CONSTANTS.INDEX_START_IS_INCLUSIVE */
      ] = !queryParams.startAfterSet_;
    }
    if (queryParams.endSet_) {
      obj[
        "ep"
        /* WIRE_PROTOCOL_CONSTANTS.INDEX_END_VALUE */
      ] = queryParams.indexEndValue_;
      if (queryParams.endNameSet_) {
        obj[
          "en"
          /* WIRE_PROTOCOL_CONSTANTS.INDEX_END_NAME */
        ] = queryParams.indexEndName_;
      }
      obj[
        "ein"
        /* WIRE_PROTOCOL_CONSTANTS.INDEX_END_IS_INCLUSIVE */
      ] = !queryParams.endBeforeSet_;
    }
    if (queryParams.limitSet_) {
      obj[
        "l"
        /* WIRE_PROTOCOL_CONSTANTS.LIMIT */
      ] = queryParams.limit_;
      let viewFrom = queryParams.viewFrom_;
      if (viewFrom === "") {
        if (queryParams.isViewFromLeft()) {
          viewFrom = "l";
        } else {
          viewFrom = "r";
        }
      }
      obj[
        "vf"
        /* WIRE_PROTOCOL_CONSTANTS.VIEW_FROM */
      ] = viewFrom;
    }
    if (queryParams.index_ !== PRIORITY_INDEX) {
      obj[
        "i"
        /* WIRE_PROTOCOL_CONSTANTS.INDEX */
      ] = queryParams.index_.toString();
    }
    return obj;
  }
  function newSparseSnapshotTree() {
    return {
      value: null,
      children: /* @__PURE__ */ new Map()
    };
  }
  function sparseSnapshotTreeRemember(sparseSnapshotTree, path, data) {
    if (pathIsEmpty(path)) {
      sparseSnapshotTree.value = data;
      sparseSnapshotTree.children.clear();
    } else if (sparseSnapshotTree.value !== null) {
      sparseSnapshotTree.value = sparseSnapshotTree.value.updateChild(path, data);
    } else {
      const childKey = pathGetFront(path);
      if (!sparseSnapshotTree.children.has(childKey)) {
        sparseSnapshotTree.children.set(childKey, newSparseSnapshotTree());
      }
      const child2 = sparseSnapshotTree.children.get(childKey);
      path = pathPopFront(path);
      sparseSnapshotTreeRemember(child2, path, data);
    }
  }
  function sparseSnapshotTreeForEachTree(sparseSnapshotTree, prefixPath, func) {
    if (sparseSnapshotTree.value !== null) {
      func(prefixPath, sparseSnapshotTree.value);
    } else {
      sparseSnapshotTreeForEachChild(sparseSnapshotTree, (key, tree) => {
        const path = new Path(prefixPath.toString() + "/" + key);
        sparseSnapshotTreeForEachTree(tree, path, func);
      });
    }
  }
  function sparseSnapshotTreeForEachChild(sparseSnapshotTree, func) {
    sparseSnapshotTree.children.forEach((tree, key) => {
      func(key, tree);
    });
  }
  function newOperationSourceUser() {
    return {
      fromUser: true,
      fromServer: false,
      queryId: null,
      tagged: false
    };
  }
  function newOperationSourceServer() {
    return {
      fromUser: false,
      fromServer: true,
      queryId: null,
      tagged: false
    };
  }
  function newOperationSourceServerTaggedQuery(queryId) {
    return {
      fromUser: false,
      fromServer: true,
      queryId,
      tagged: true
    };
  }
  function eventGeneratorGenerateEventsForChanges(eventGenerator, changes, eventCache, eventRegistrations) {
    const events = [];
    const moves = [];
    changes.forEach((change) => {
      if (change.type === "child_changed" && eventGenerator.index_.indexedValueChanged(change.oldSnap, change.snapshotNode)) {
        moves.push(changeChildMoved(change.childName, change.snapshotNode));
      }
    });
    eventGeneratorGenerateEventsForType(eventGenerator, events, "child_removed", changes, eventRegistrations, eventCache);
    eventGeneratorGenerateEventsForType(eventGenerator, events, "child_added", changes, eventRegistrations, eventCache);
    eventGeneratorGenerateEventsForType(eventGenerator, events, "child_moved", moves, eventRegistrations, eventCache);
    eventGeneratorGenerateEventsForType(eventGenerator, events, "child_changed", changes, eventRegistrations, eventCache);
    eventGeneratorGenerateEventsForType(eventGenerator, events, "value", changes, eventRegistrations, eventCache);
    return events;
  }
  function eventGeneratorGenerateEventsForType(eventGenerator, events, eventType, changes, registrations, eventCache) {
    const filteredChanges = changes.filter((change) => change.type === eventType);
    filteredChanges.sort((a, b) => eventGeneratorCompareChanges(eventGenerator, a, b));
    filteredChanges.forEach((change) => {
      const materializedChange = eventGeneratorMaterializeSingleChange(eventGenerator, change, eventCache);
      registrations.forEach((registration) => {
        if (registration.respondsTo(change.type)) {
          events.push(registration.createEvent(materializedChange, eventGenerator.query_));
        }
      });
    });
  }
  function eventGeneratorMaterializeSingleChange(eventGenerator, change, eventCache) {
    if (change.type === "value" || change.type === "child_removed") {
      return change;
    } else {
      change.prevName = eventCache.getPredecessorChildName(change.childName, change.snapshotNode, eventGenerator.index_);
      return change;
    }
  }
  function eventGeneratorCompareChanges(eventGenerator, a, b) {
    if (a.childName == null || b.childName == null) {
      throw assertionError("Should only compare child_ events.");
    }
    const aWrapped = new NamedNode(a.childName, a.snapshotNode);
    const bWrapped = new NamedNode(b.childName, b.snapshotNode);
    return eventGenerator.index_.compare(aWrapped, bWrapped);
  }
  function newViewCache(eventCache, serverCache) {
    return { eventCache, serverCache };
  }
  function viewCacheUpdateEventSnap(viewCache, eventSnap, complete, filtered) {
    return newViewCache(new CacheNode(eventSnap, complete, filtered), viewCache.serverCache);
  }
  function viewCacheUpdateServerSnap(viewCache, serverSnap, complete, filtered) {
    return newViewCache(viewCache.eventCache, new CacheNode(serverSnap, complete, filtered));
  }
  function viewCacheGetCompleteEventSnap(viewCache) {
    return viewCache.eventCache.isFullyInitialized() ? viewCache.eventCache.getNode() : null;
  }
  function viewCacheGetCompleteServerSnap(viewCache) {
    return viewCache.serverCache.isFullyInitialized() ? viewCache.serverCache.getNode() : null;
  }
  function compoundWriteAddWrite(compoundWrite, path, node) {
    if (pathIsEmpty(path)) {
      return new CompoundWrite(new ImmutableTree(node));
    } else {
      const rootmost = compoundWrite.writeTree_.findRootMostValueAndPath(path);
      if (rootmost != null) {
        const rootMostPath = rootmost.path;
        let value = rootmost.value;
        const relativePath = newRelativePath(rootMostPath, path);
        value = value.updateChild(relativePath, node);
        return new CompoundWrite(compoundWrite.writeTree_.set(rootMostPath, value));
      } else {
        const subtree = new ImmutableTree(node);
        const newWriteTree2 = compoundWrite.writeTree_.setTree(path, subtree);
        return new CompoundWrite(newWriteTree2);
      }
    }
  }
  function compoundWriteAddWrites(compoundWrite, path, updates) {
    let newWrite = compoundWrite;
    each(updates, (childKey, node) => {
      newWrite = compoundWriteAddWrite(newWrite, pathChild(path, childKey), node);
    });
    return newWrite;
  }
  function compoundWriteRemoveWrite(compoundWrite, path) {
    if (pathIsEmpty(path)) {
      return CompoundWrite.empty();
    } else {
      const newWriteTree2 = compoundWrite.writeTree_.setTree(path, new ImmutableTree(null));
      return new CompoundWrite(newWriteTree2);
    }
  }
  function compoundWriteHasCompleteWrite(compoundWrite, path) {
    return compoundWriteGetCompleteNode(compoundWrite, path) != null;
  }
  function compoundWriteGetCompleteNode(compoundWrite, path) {
    const rootmost = compoundWrite.writeTree_.findRootMostValueAndPath(path);
    if (rootmost != null) {
      return compoundWrite.writeTree_.get(rootmost.path).getChild(newRelativePath(rootmost.path, path));
    } else {
      return null;
    }
  }
  function compoundWriteGetCompleteChildren(compoundWrite) {
    const children = [];
    const node = compoundWrite.writeTree_.value;
    if (node != null) {
      if (!node.isLeafNode()) {
        node.forEachChild(PRIORITY_INDEX, (childName, childNode) => {
          children.push(new NamedNode(childName, childNode));
        });
      }
    } else {
      compoundWrite.writeTree_.children.inorderTraversal((childName, childTree) => {
        if (childTree.value != null) {
          children.push(new NamedNode(childName, childTree.value));
        }
      });
    }
    return children;
  }
  function compoundWriteChildCompoundWrite(compoundWrite, path) {
    if (pathIsEmpty(path)) {
      return compoundWrite;
    } else {
      const shadowingNode = compoundWriteGetCompleteNode(compoundWrite, path);
      if (shadowingNode != null) {
        return new CompoundWrite(new ImmutableTree(shadowingNode));
      } else {
        return new CompoundWrite(compoundWrite.writeTree_.subtree(path));
      }
    }
  }
  function compoundWriteIsEmpty(compoundWrite) {
    return compoundWrite.writeTree_.isEmpty();
  }
  function compoundWriteApply(compoundWrite, node) {
    return applySubtreeWrite(newEmptyPath(), compoundWrite.writeTree_, node);
  }
  function applySubtreeWrite(relativePath, writeTree, node) {
    if (writeTree.value != null) {
      return node.updateChild(relativePath, writeTree.value);
    } else {
      let priorityWrite = null;
      writeTree.children.inorderTraversal((childKey, childTree) => {
        if (childKey === ".priority") {
          assert(childTree.value !== null, "Priority writes must always be leaf nodes");
          priorityWrite = childTree.value;
        } else {
          node = applySubtreeWrite(pathChild(relativePath, childKey), childTree, node);
        }
      });
      if (!node.getChild(relativePath).isEmpty() && priorityWrite !== null) {
        node = node.updateChild(pathChild(relativePath, ".priority"), priorityWrite);
      }
      return node;
    }
  }
  function writeTreeChildWrites(writeTree, path) {
    return newWriteTreeRef(path, writeTree);
  }
  function writeTreeAddOverwrite(writeTree, path, snap, writeId, visible) {
    assert(writeId > writeTree.lastWriteId, "Stacking an older write on top of newer ones");
    if (visible === void 0) {
      visible = true;
    }
    writeTree.allWrites.push({
      path,
      snap,
      writeId,
      visible
    });
    if (visible) {
      writeTree.visibleWrites = compoundWriteAddWrite(writeTree.visibleWrites, path, snap);
    }
    writeTree.lastWriteId = writeId;
  }
  function writeTreeGetWrite(writeTree, writeId) {
    for (let i = 0; i < writeTree.allWrites.length; i++) {
      const record = writeTree.allWrites[i];
      if (record.writeId === writeId) {
        return record;
      }
    }
    return null;
  }
  function writeTreeRemoveWrite(writeTree, writeId) {
    const idx = writeTree.allWrites.findIndex((s) => {
      return s.writeId === writeId;
    });
    assert(idx >= 0, "removeWrite called with nonexistent writeId.");
    const writeToRemove = writeTree.allWrites[idx];
    writeTree.allWrites.splice(idx, 1);
    let removedWriteWasVisible = writeToRemove.visible;
    let removedWriteOverlapsWithOtherWrites = false;
    let i = writeTree.allWrites.length - 1;
    while (removedWriteWasVisible && i >= 0) {
      const currentWrite = writeTree.allWrites[i];
      if (currentWrite.visible) {
        if (i >= idx && writeTreeRecordContainsPath_(currentWrite, writeToRemove.path)) {
          removedWriteWasVisible = false;
        } else if (pathContains(writeToRemove.path, currentWrite.path)) {
          removedWriteOverlapsWithOtherWrites = true;
        }
      }
      i--;
    }
    if (!removedWriteWasVisible) {
      return false;
    } else if (removedWriteOverlapsWithOtherWrites) {
      writeTreeResetTree_(writeTree);
      return true;
    } else {
      if (writeToRemove.snap) {
        writeTree.visibleWrites = compoundWriteRemoveWrite(writeTree.visibleWrites, writeToRemove.path);
      } else {
        const children = writeToRemove.children;
        each(children, (childName) => {
          writeTree.visibleWrites = compoundWriteRemoveWrite(writeTree.visibleWrites, pathChild(writeToRemove.path, childName));
        });
      }
      return true;
    }
  }
  function writeTreeRecordContainsPath_(writeRecord, path) {
    if (writeRecord.snap) {
      return pathContains(writeRecord.path, path);
    } else {
      for (const childName in writeRecord.children) {
        if (writeRecord.children.hasOwnProperty(childName) && pathContains(pathChild(writeRecord.path, childName), path)) {
          return true;
        }
      }
      return false;
    }
  }
  function writeTreeResetTree_(writeTree) {
    writeTree.visibleWrites = writeTreeLayerTree_(writeTree.allWrites, writeTreeDefaultFilter_, newEmptyPath());
    if (writeTree.allWrites.length > 0) {
      writeTree.lastWriteId = writeTree.allWrites[writeTree.allWrites.length - 1].writeId;
    } else {
      writeTree.lastWriteId = -1;
    }
  }
  function writeTreeDefaultFilter_(write) {
    return write.visible;
  }
  function writeTreeLayerTree_(writes, filter, treeRoot) {
    let compoundWrite = CompoundWrite.empty();
    for (let i = 0; i < writes.length; ++i) {
      const write = writes[i];
      if (filter(write)) {
        const writePath = write.path;
        let relativePath;
        if (write.snap) {
          if (pathContains(treeRoot, writePath)) {
            relativePath = newRelativePath(treeRoot, writePath);
            compoundWrite = compoundWriteAddWrite(compoundWrite, relativePath, write.snap);
          } else if (pathContains(writePath, treeRoot)) {
            relativePath = newRelativePath(writePath, treeRoot);
            compoundWrite = compoundWriteAddWrite(compoundWrite, newEmptyPath(), write.snap.getChild(relativePath));
          } else ;
        } else if (write.children) {
          if (pathContains(treeRoot, writePath)) {
            relativePath = newRelativePath(treeRoot, writePath);
            compoundWrite = compoundWriteAddWrites(compoundWrite, relativePath, write.children);
          } else if (pathContains(writePath, treeRoot)) {
            relativePath = newRelativePath(writePath, treeRoot);
            if (pathIsEmpty(relativePath)) {
              compoundWrite = compoundWriteAddWrites(compoundWrite, newEmptyPath(), write.children);
            } else {
              const child2 = safeGet(write.children, pathGetFront(relativePath));
              if (child2) {
                const deepNode = child2.getChild(pathPopFront(relativePath));
                compoundWrite = compoundWriteAddWrite(compoundWrite, newEmptyPath(), deepNode);
              }
            }
          } else ;
        } else {
          throw assertionError("WriteRecord should have .snap or .children");
        }
      }
    }
    return compoundWrite;
  }
  function writeTreeCalcCompleteEventCache(writeTree, treePath, completeServerCache, writeIdsToExclude, includeHiddenWrites) {
    if (!writeIdsToExclude && !includeHiddenWrites) {
      const shadowingNode = compoundWriteGetCompleteNode(writeTree.visibleWrites, treePath);
      if (shadowingNode != null) {
        return shadowingNode;
      } else {
        const subMerge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
        if (compoundWriteIsEmpty(subMerge)) {
          return completeServerCache;
        } else if (completeServerCache == null && !compoundWriteHasCompleteWrite(subMerge, newEmptyPath())) {
          return null;
        } else {
          const layeredCache = completeServerCache || ChildrenNode.EMPTY_NODE;
          return compoundWriteApply(subMerge, layeredCache);
        }
      }
    } else {
      const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
      if (!includeHiddenWrites && compoundWriteIsEmpty(merge)) {
        return completeServerCache;
      } else {
        if (!includeHiddenWrites && completeServerCache == null && !compoundWriteHasCompleteWrite(merge, newEmptyPath())) {
          return null;
        } else {
          const filter = function(write) {
            return (write.visible || includeHiddenWrites) && (!writeIdsToExclude || !~writeIdsToExclude.indexOf(write.writeId)) && (pathContains(write.path, treePath) || pathContains(treePath, write.path));
          };
          const mergeAtPath = writeTreeLayerTree_(writeTree.allWrites, filter, treePath);
          const layeredCache = completeServerCache || ChildrenNode.EMPTY_NODE;
          return compoundWriteApply(mergeAtPath, layeredCache);
        }
      }
    }
  }
  function writeTreeCalcCompleteEventChildren(writeTree, treePath, completeServerChildren) {
    let completeChildren = ChildrenNode.EMPTY_NODE;
    const topLevelSet = compoundWriteGetCompleteNode(writeTree.visibleWrites, treePath);
    if (topLevelSet) {
      if (!topLevelSet.isLeafNode()) {
        topLevelSet.forEachChild(PRIORITY_INDEX, (childName, childSnap) => {
          completeChildren = completeChildren.updateImmediateChild(childName, childSnap);
        });
      }
      return completeChildren;
    } else if (completeServerChildren) {
      const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
      completeServerChildren.forEachChild(PRIORITY_INDEX, (childName, childNode) => {
        const node = compoundWriteApply(compoundWriteChildCompoundWrite(merge, new Path(childName)), childNode);
        completeChildren = completeChildren.updateImmediateChild(childName, node);
      });
      compoundWriteGetCompleteChildren(merge).forEach((namedNode) => {
        completeChildren = completeChildren.updateImmediateChild(namedNode.name, namedNode.node);
      });
      return completeChildren;
    } else {
      const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
      compoundWriteGetCompleteChildren(merge).forEach((namedNode) => {
        completeChildren = completeChildren.updateImmediateChild(namedNode.name, namedNode.node);
      });
      return completeChildren;
    }
  }
  function writeTreeCalcEventCacheAfterServerOverwrite(writeTree, treePath, childPath, existingEventSnap, existingServerSnap) {
    assert(existingEventSnap || existingServerSnap, "Either existingEventSnap or existingServerSnap must exist");
    const path = pathChild(treePath, childPath);
    if (compoundWriteHasCompleteWrite(writeTree.visibleWrites, path)) {
      return null;
    } else {
      const childMerge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, path);
      if (compoundWriteIsEmpty(childMerge)) {
        return existingServerSnap.getChild(childPath);
      } else {
        return compoundWriteApply(childMerge, existingServerSnap.getChild(childPath));
      }
    }
  }
  function writeTreeCalcCompleteChild(writeTree, treePath, childKey, existingServerSnap) {
    const path = pathChild(treePath, childKey);
    const shadowingNode = compoundWriteGetCompleteNode(writeTree.visibleWrites, path);
    if (shadowingNode != null) {
      return shadowingNode;
    } else {
      if (existingServerSnap.isCompleteForChild(childKey)) {
        const childMerge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, path);
        return compoundWriteApply(childMerge, existingServerSnap.getNode().getImmediateChild(childKey));
      } else {
        return null;
      }
    }
  }
  function writeTreeShadowingWrite(writeTree, path) {
    return compoundWriteGetCompleteNode(writeTree.visibleWrites, path);
  }
  function writeTreeCalcIndexedSlice(writeTree, treePath, completeServerData, startPost, count, reverse, index) {
    let toIterate;
    const merge = compoundWriteChildCompoundWrite(writeTree.visibleWrites, treePath);
    const shadowingNode = compoundWriteGetCompleteNode(merge, newEmptyPath());
    if (shadowingNode != null) {
      toIterate = shadowingNode;
    } else if (completeServerData != null) {
      toIterate = compoundWriteApply(merge, completeServerData);
    } else {
      return [];
    }
    toIterate = toIterate.withIndex(index);
    if (!toIterate.isEmpty() && !toIterate.isLeafNode()) {
      const nodes = [];
      const cmp = index.getCompare();
      const iter = reverse ? toIterate.getReverseIteratorFrom(startPost, index) : toIterate.getIteratorFrom(startPost, index);
      let next = iter.getNext();
      while (next && nodes.length < count) {
        if (cmp(next, startPost) !== 0) {
          nodes.push(next);
        }
        next = iter.getNext();
      }
      return nodes;
    } else {
      return [];
    }
  }
  function newWriteTree() {
    return {
      visibleWrites: CompoundWrite.empty(),
      allWrites: [],
      lastWriteId: -1
    };
  }
  function writeTreeRefCalcCompleteEventCache(writeTreeRef, completeServerCache, writeIdsToExclude, includeHiddenWrites) {
    return writeTreeCalcCompleteEventCache(writeTreeRef.writeTree, writeTreeRef.treePath, completeServerCache, writeIdsToExclude, includeHiddenWrites);
  }
  function writeTreeRefCalcCompleteEventChildren(writeTreeRef, completeServerChildren) {
    return writeTreeCalcCompleteEventChildren(writeTreeRef.writeTree, writeTreeRef.treePath, completeServerChildren);
  }
  function writeTreeRefCalcEventCacheAfterServerOverwrite(writeTreeRef, path, existingEventSnap, existingServerSnap) {
    return writeTreeCalcEventCacheAfterServerOverwrite(writeTreeRef.writeTree, writeTreeRef.treePath, path, existingEventSnap, existingServerSnap);
  }
  function writeTreeRefShadowingWrite(writeTreeRef, path) {
    return writeTreeShadowingWrite(writeTreeRef.writeTree, pathChild(writeTreeRef.treePath, path));
  }
  function writeTreeRefCalcIndexedSlice(writeTreeRef, completeServerData, startPost, count, reverse, index) {
    return writeTreeCalcIndexedSlice(writeTreeRef.writeTree, writeTreeRef.treePath, completeServerData, startPost, count, reverse, index);
  }
  function writeTreeRefCalcCompleteChild(writeTreeRef, childKey, existingServerCache) {
    return writeTreeCalcCompleteChild(writeTreeRef.writeTree, writeTreeRef.treePath, childKey, existingServerCache);
  }
  function writeTreeRefChild(writeTreeRef, childName) {
    return newWriteTreeRef(pathChild(writeTreeRef.treePath, childName), writeTreeRef.writeTree);
  }
  function newWriteTreeRef(path, writeTree) {
    return {
      treePath: path,
      writeTree
    };
  }
  function newViewProcessor(filter) {
    return { filter };
  }
  function viewProcessorAssertIndexed(viewProcessor, viewCache) {
    assert(viewCache.eventCache.getNode().isIndexed(viewProcessor.filter.getIndex()), "Event snap not indexed");
    assert(viewCache.serverCache.getNode().isIndexed(viewProcessor.filter.getIndex()), "Server snap not indexed");
  }
  function viewProcessorApplyOperation(viewProcessor, oldViewCache, operation, writesCache, completeCache) {
    const accumulator = new ChildChangeAccumulator();
    let newViewCache2, filterServerNode;
    if (operation.type === OperationType2.OVERWRITE) {
      const overwrite = operation;
      if (overwrite.source.fromUser) {
        newViewCache2 = viewProcessorApplyUserOverwrite(viewProcessor, oldViewCache, overwrite.path, overwrite.snap, writesCache, completeCache, accumulator);
      } else {
        assert(overwrite.source.fromServer, "Unknown source.");
        filterServerNode = overwrite.source.tagged || oldViewCache.serverCache.isFiltered() && !pathIsEmpty(overwrite.path);
        newViewCache2 = viewProcessorApplyServerOverwrite(viewProcessor, oldViewCache, overwrite.path, overwrite.snap, writesCache, completeCache, filterServerNode, accumulator);
      }
    } else if (operation.type === OperationType2.MERGE) {
      const merge = operation;
      if (merge.source.fromUser) {
        newViewCache2 = viewProcessorApplyUserMerge(viewProcessor, oldViewCache, merge.path, merge.children, writesCache, completeCache, accumulator);
      } else {
        assert(merge.source.fromServer, "Unknown source.");
        filterServerNode = merge.source.tagged || oldViewCache.serverCache.isFiltered();
        newViewCache2 = viewProcessorApplyServerMerge(viewProcessor, oldViewCache, merge.path, merge.children, writesCache, completeCache, filterServerNode, accumulator);
      }
    } else if (operation.type === OperationType2.ACK_USER_WRITE) {
      const ackUserWrite = operation;
      if (!ackUserWrite.revert) {
        newViewCache2 = viewProcessorAckUserWrite(viewProcessor, oldViewCache, ackUserWrite.path, ackUserWrite.affectedTree, writesCache, completeCache, accumulator);
      } else {
        newViewCache2 = viewProcessorRevertUserWrite(viewProcessor, oldViewCache, ackUserWrite.path, writesCache, completeCache, accumulator);
      }
    } else if (operation.type === OperationType2.LISTEN_COMPLETE) {
      newViewCache2 = viewProcessorListenComplete(viewProcessor, oldViewCache, operation.path, writesCache, accumulator);
    } else {
      throw assertionError("Unknown operation type: " + operation.type);
    }
    const changes = accumulator.getChanges();
    viewProcessorMaybeAddValueEvent(oldViewCache, newViewCache2, changes);
    return { viewCache: newViewCache2, changes };
  }
  function viewProcessorMaybeAddValueEvent(oldViewCache, newViewCache2, accumulator) {
    const eventSnap = newViewCache2.eventCache;
    if (eventSnap.isFullyInitialized()) {
      const isLeafOrEmpty = eventSnap.getNode().isLeafNode() || eventSnap.getNode().isEmpty();
      const oldCompleteSnap = viewCacheGetCompleteEventSnap(oldViewCache);
      if (accumulator.length > 0 || !oldViewCache.eventCache.isFullyInitialized() || isLeafOrEmpty && !eventSnap.getNode().equals(oldCompleteSnap) || !eventSnap.getNode().getPriority().equals(oldCompleteSnap.getPriority())) {
        accumulator.push(changeValue(viewCacheGetCompleteEventSnap(newViewCache2)));
      }
    }
  }
  function viewProcessorGenerateEventCacheAfterServerEvent(viewProcessor, viewCache, changePath, writesCache, source, accumulator) {
    const oldEventSnap = viewCache.eventCache;
    if (writeTreeRefShadowingWrite(writesCache, changePath) != null) {
      return viewCache;
    } else {
      let newEventCache, serverNode;
      if (pathIsEmpty(changePath)) {
        assert(viewCache.serverCache.isFullyInitialized(), "If change path is empty, we must have complete server data");
        if (viewCache.serverCache.isFiltered()) {
          const serverCache = viewCacheGetCompleteServerSnap(viewCache);
          const completeChildren = serverCache instanceof ChildrenNode ? serverCache : ChildrenNode.EMPTY_NODE;
          const completeEventChildren = writeTreeRefCalcCompleteEventChildren(writesCache, completeChildren);
          newEventCache = viewProcessor.filter.updateFullNode(viewCache.eventCache.getNode(), completeEventChildren, accumulator);
        } else {
          const completeNode = writeTreeRefCalcCompleteEventCache(writesCache, viewCacheGetCompleteServerSnap(viewCache));
          newEventCache = viewProcessor.filter.updateFullNode(viewCache.eventCache.getNode(), completeNode, accumulator);
        }
      } else {
        const childKey = pathGetFront(changePath);
        if (childKey === ".priority") {
          assert(pathGetLength(changePath) === 1, "Can't have a priority with additional path components");
          const oldEventNode = oldEventSnap.getNode();
          serverNode = viewCache.serverCache.getNode();
          const updatedPriority = writeTreeRefCalcEventCacheAfterServerOverwrite(writesCache, changePath, oldEventNode, serverNode);
          if (updatedPriority != null) {
            newEventCache = viewProcessor.filter.updatePriority(oldEventNode, updatedPriority);
          } else {
            newEventCache = oldEventSnap.getNode();
          }
        } else {
          const childChangePath = pathPopFront(changePath);
          let newEventChild;
          if (oldEventSnap.isCompleteForChild(childKey)) {
            serverNode = viewCache.serverCache.getNode();
            const eventChildUpdate = writeTreeRefCalcEventCacheAfterServerOverwrite(writesCache, changePath, oldEventSnap.getNode(), serverNode);
            if (eventChildUpdate != null) {
              newEventChild = oldEventSnap.getNode().getImmediateChild(childKey).updateChild(childChangePath, eventChildUpdate);
            } else {
              newEventChild = oldEventSnap.getNode().getImmediateChild(childKey);
            }
          } else {
            newEventChild = writeTreeRefCalcCompleteChild(writesCache, childKey, viewCache.serverCache);
          }
          if (newEventChild != null) {
            newEventCache = viewProcessor.filter.updateChild(oldEventSnap.getNode(), childKey, newEventChild, childChangePath, source, accumulator);
          } else {
            newEventCache = oldEventSnap.getNode();
          }
        }
      }
      return viewCacheUpdateEventSnap(viewCache, newEventCache, oldEventSnap.isFullyInitialized() || pathIsEmpty(changePath), viewProcessor.filter.filtersNodes());
    }
  }
  function viewProcessorApplyServerOverwrite(viewProcessor, oldViewCache, changePath, changedSnap, writesCache, completeCache, filterServerNode, accumulator) {
    const oldServerSnap = oldViewCache.serverCache;
    let newServerCache;
    const serverFilter = filterServerNode ? viewProcessor.filter : viewProcessor.filter.getIndexedFilter();
    if (pathIsEmpty(changePath)) {
      newServerCache = serverFilter.updateFullNode(oldServerSnap.getNode(), changedSnap, null);
    } else if (serverFilter.filtersNodes() && !oldServerSnap.isFiltered()) {
      const newServerNode = oldServerSnap.getNode().updateChild(changePath, changedSnap);
      newServerCache = serverFilter.updateFullNode(oldServerSnap.getNode(), newServerNode, null);
    } else {
      const childKey = pathGetFront(changePath);
      if (!oldServerSnap.isCompleteForPath(changePath) && pathGetLength(changePath) > 1) {
        return oldViewCache;
      }
      const childChangePath = pathPopFront(changePath);
      const childNode = oldServerSnap.getNode().getImmediateChild(childKey);
      const newChildNode = childNode.updateChild(childChangePath, changedSnap);
      if (childKey === ".priority") {
        newServerCache = serverFilter.updatePriority(oldServerSnap.getNode(), newChildNode);
      } else {
        newServerCache = serverFilter.updateChild(oldServerSnap.getNode(), childKey, newChildNode, childChangePath, NO_COMPLETE_CHILD_SOURCE, null);
      }
    }
    const newViewCache2 = viewCacheUpdateServerSnap(oldViewCache, newServerCache, oldServerSnap.isFullyInitialized() || pathIsEmpty(changePath), serverFilter.filtersNodes());
    const source = new WriteTreeCompleteChildSource(writesCache, newViewCache2, completeCache);
    return viewProcessorGenerateEventCacheAfterServerEvent(viewProcessor, newViewCache2, changePath, writesCache, source, accumulator);
  }
  function viewProcessorApplyUserOverwrite(viewProcessor, oldViewCache, changePath, changedSnap, writesCache, completeCache, accumulator) {
    const oldEventSnap = oldViewCache.eventCache;
    let newViewCache2, newEventCache;
    const source = new WriteTreeCompleteChildSource(writesCache, oldViewCache, completeCache);
    if (pathIsEmpty(changePath)) {
      newEventCache = viewProcessor.filter.updateFullNode(oldViewCache.eventCache.getNode(), changedSnap, accumulator);
      newViewCache2 = viewCacheUpdateEventSnap(oldViewCache, newEventCache, true, viewProcessor.filter.filtersNodes());
    } else {
      const childKey = pathGetFront(changePath);
      if (childKey === ".priority") {
        newEventCache = viewProcessor.filter.updatePriority(oldViewCache.eventCache.getNode(), changedSnap);
        newViewCache2 = viewCacheUpdateEventSnap(oldViewCache, newEventCache, oldEventSnap.isFullyInitialized(), oldEventSnap.isFiltered());
      } else {
        const childChangePath = pathPopFront(changePath);
        const oldChild = oldEventSnap.getNode().getImmediateChild(childKey);
        let newChild;
        if (pathIsEmpty(childChangePath)) {
          newChild = changedSnap;
        } else {
          const childNode = source.getCompleteChild(childKey);
          if (childNode != null) {
            if (pathGetBack(childChangePath) === ".priority" && childNode.getChild(pathParent(childChangePath)).isEmpty()) {
              newChild = childNode;
            } else {
              newChild = childNode.updateChild(childChangePath, changedSnap);
            }
          } else {
            newChild = ChildrenNode.EMPTY_NODE;
          }
        }
        if (!oldChild.equals(newChild)) {
          const newEventSnap = viewProcessor.filter.updateChild(oldEventSnap.getNode(), childKey, newChild, childChangePath, source, accumulator);
          newViewCache2 = viewCacheUpdateEventSnap(oldViewCache, newEventSnap, oldEventSnap.isFullyInitialized(), viewProcessor.filter.filtersNodes());
        } else {
          newViewCache2 = oldViewCache;
        }
      }
    }
    return newViewCache2;
  }
  function viewProcessorCacheHasChild(viewCache, childKey) {
    return viewCache.eventCache.isCompleteForChild(childKey);
  }
  function viewProcessorApplyUserMerge(viewProcessor, viewCache, path, changedChildren, writesCache, serverCache, accumulator) {
    let curViewCache = viewCache;
    changedChildren.foreach((relativePath, childNode) => {
      const writePath = pathChild(path, relativePath);
      if (viewProcessorCacheHasChild(viewCache, pathGetFront(writePath))) {
        curViewCache = viewProcessorApplyUserOverwrite(viewProcessor, curViewCache, writePath, childNode, writesCache, serverCache, accumulator);
      }
    });
    changedChildren.foreach((relativePath, childNode) => {
      const writePath = pathChild(path, relativePath);
      if (!viewProcessorCacheHasChild(viewCache, pathGetFront(writePath))) {
        curViewCache = viewProcessorApplyUserOverwrite(viewProcessor, curViewCache, writePath, childNode, writesCache, serverCache, accumulator);
      }
    });
    return curViewCache;
  }
  function viewProcessorApplyMerge(viewProcessor, node, merge) {
    merge.foreach((relativePath, childNode) => {
      node = node.updateChild(relativePath, childNode);
    });
    return node;
  }
  function viewProcessorApplyServerMerge(viewProcessor, viewCache, path, changedChildren, writesCache, serverCache, filterServerNode, accumulator) {
    if (viewCache.serverCache.getNode().isEmpty() && !viewCache.serverCache.isFullyInitialized()) {
      return viewCache;
    }
    let curViewCache = viewCache;
    let viewMergeTree;
    if (pathIsEmpty(path)) {
      viewMergeTree = changedChildren;
    } else {
      viewMergeTree = new ImmutableTree(null).setTree(path, changedChildren);
    }
    const serverNode = viewCache.serverCache.getNode();
    viewMergeTree.children.inorderTraversal((childKey, childTree) => {
      if (serverNode.hasChild(childKey)) {
        const serverChild = viewCache.serverCache.getNode().getImmediateChild(childKey);
        const newChild = viewProcessorApplyMerge(viewProcessor, serverChild, childTree);
        curViewCache = viewProcessorApplyServerOverwrite(viewProcessor, curViewCache, new Path(childKey), newChild, writesCache, serverCache, filterServerNode, accumulator);
      }
    });
    viewMergeTree.children.inorderTraversal((childKey, childMergeTree) => {
      const isUnknownDeepMerge = !viewCache.serverCache.isCompleteForChild(childKey) && childMergeTree.value === null;
      if (!serverNode.hasChild(childKey) && !isUnknownDeepMerge) {
        const serverChild = viewCache.serverCache.getNode().getImmediateChild(childKey);
        const newChild = viewProcessorApplyMerge(viewProcessor, serverChild, childMergeTree);
        curViewCache = viewProcessorApplyServerOverwrite(viewProcessor, curViewCache, new Path(childKey), newChild, writesCache, serverCache, filterServerNode, accumulator);
      }
    });
    return curViewCache;
  }
  function viewProcessorAckUserWrite(viewProcessor, viewCache, ackPath, affectedTree, writesCache, completeCache, accumulator) {
    if (writeTreeRefShadowingWrite(writesCache, ackPath) != null) {
      return viewCache;
    }
    const filterServerNode = viewCache.serverCache.isFiltered();
    const serverCache = viewCache.serverCache;
    if (affectedTree.value != null) {
      if (pathIsEmpty(ackPath) && serverCache.isFullyInitialized() || serverCache.isCompleteForPath(ackPath)) {
        return viewProcessorApplyServerOverwrite(viewProcessor, viewCache, ackPath, serverCache.getNode().getChild(ackPath), writesCache, completeCache, filterServerNode, accumulator);
      } else if (pathIsEmpty(ackPath)) {
        let changedChildren = new ImmutableTree(null);
        serverCache.getNode().forEachChild(KEY_INDEX, (name5, node) => {
          changedChildren = changedChildren.set(new Path(name5), node);
        });
        return viewProcessorApplyServerMerge(viewProcessor, viewCache, ackPath, changedChildren, writesCache, completeCache, filterServerNode, accumulator);
      } else {
        return viewCache;
      }
    } else {
      let changedChildren = new ImmutableTree(null);
      affectedTree.foreach((mergePath, value) => {
        const serverCachePath = pathChild(ackPath, mergePath);
        if (serverCache.isCompleteForPath(serverCachePath)) {
          changedChildren = changedChildren.set(mergePath, serverCache.getNode().getChild(serverCachePath));
        }
      });
      return viewProcessorApplyServerMerge(viewProcessor, viewCache, ackPath, changedChildren, writesCache, completeCache, filterServerNode, accumulator);
    }
  }
  function viewProcessorListenComplete(viewProcessor, viewCache, path, writesCache, accumulator) {
    const oldServerNode = viewCache.serverCache;
    const newViewCache2 = viewCacheUpdateServerSnap(viewCache, oldServerNode.getNode(), oldServerNode.isFullyInitialized() || pathIsEmpty(path), oldServerNode.isFiltered());
    return viewProcessorGenerateEventCacheAfterServerEvent(viewProcessor, newViewCache2, path, writesCache, NO_COMPLETE_CHILD_SOURCE, accumulator);
  }
  function viewProcessorRevertUserWrite(viewProcessor, viewCache, path, writesCache, completeServerCache, accumulator) {
    let complete;
    if (writeTreeRefShadowingWrite(writesCache, path) != null) {
      return viewCache;
    } else {
      const source = new WriteTreeCompleteChildSource(writesCache, viewCache, completeServerCache);
      const oldEventCache = viewCache.eventCache.getNode();
      let newEventCache;
      if (pathIsEmpty(path) || pathGetFront(path) === ".priority") {
        let newNode;
        if (viewCache.serverCache.isFullyInitialized()) {
          newNode = writeTreeRefCalcCompleteEventCache(writesCache, viewCacheGetCompleteServerSnap(viewCache));
        } else {
          const serverChildren = viewCache.serverCache.getNode();
          assert(serverChildren instanceof ChildrenNode, "serverChildren would be complete if leaf node");
          newNode = writeTreeRefCalcCompleteEventChildren(writesCache, serverChildren);
        }
        newNode = newNode;
        newEventCache = viewProcessor.filter.updateFullNode(oldEventCache, newNode, accumulator);
      } else {
        const childKey = pathGetFront(path);
        let newChild = writeTreeRefCalcCompleteChild(writesCache, childKey, viewCache.serverCache);
        if (newChild == null && viewCache.serverCache.isCompleteForChild(childKey)) {
          newChild = oldEventCache.getImmediateChild(childKey);
        }
        if (newChild != null) {
          newEventCache = viewProcessor.filter.updateChild(oldEventCache, childKey, newChild, pathPopFront(path), source, accumulator);
        } else if (viewCache.eventCache.getNode().hasChild(childKey)) {
          newEventCache = viewProcessor.filter.updateChild(oldEventCache, childKey, ChildrenNode.EMPTY_NODE, pathPopFront(path), source, accumulator);
        } else {
          newEventCache = oldEventCache;
        }
        if (newEventCache.isEmpty() && viewCache.serverCache.isFullyInitialized()) {
          complete = writeTreeRefCalcCompleteEventCache(writesCache, viewCacheGetCompleteServerSnap(viewCache));
          if (complete.isLeafNode()) {
            newEventCache = viewProcessor.filter.updateFullNode(newEventCache, complete, accumulator);
          }
        }
      }
      complete = viewCache.serverCache.isFullyInitialized() || writeTreeRefShadowingWrite(writesCache, newEmptyPath()) != null;
      return viewCacheUpdateEventSnap(viewCache, newEventCache, complete, viewProcessor.filter.filtersNodes());
    }
  }
  function viewGetServerCache(view) {
    return view.viewCache_.serverCache.getNode();
  }
  function viewGetCompleteNode(view) {
    return viewCacheGetCompleteEventSnap(view.viewCache_);
  }
  function viewGetCompleteServerCache(view, path) {
    const cache = viewCacheGetCompleteServerSnap(view.viewCache_);
    if (cache) {
      if (view.query._queryParams.loadsAllData() || !pathIsEmpty(path) && !cache.getImmediateChild(pathGetFront(path)).isEmpty()) {
        return cache.getChild(path);
      }
    }
    return null;
  }
  function viewIsEmpty(view) {
    return view.eventRegistrations_.length === 0;
  }
  function viewAddEventRegistration(view, eventRegistration) {
    view.eventRegistrations_.push(eventRegistration);
  }
  function viewRemoveEventRegistration(view, eventRegistration, cancelError) {
    const cancelEvents = [];
    if (cancelError) {
      assert(eventRegistration == null, "A cancel should cancel all event registrations.");
      const path = view.query._path;
      view.eventRegistrations_.forEach((registration) => {
        const maybeEvent = registration.createCancelEvent(cancelError, path);
        if (maybeEvent) {
          cancelEvents.push(maybeEvent);
        }
      });
    }
    if (eventRegistration) {
      let remaining = [];
      for (let i = 0; i < view.eventRegistrations_.length; ++i) {
        const existing = view.eventRegistrations_[i];
        if (!existing.matches(eventRegistration)) {
          remaining.push(existing);
        } else if (eventRegistration.hasAnyCallback()) {
          remaining = remaining.concat(view.eventRegistrations_.slice(i + 1));
          break;
        }
      }
      view.eventRegistrations_ = remaining;
    } else {
      view.eventRegistrations_ = [];
    }
    return cancelEvents;
  }
  function viewApplyOperation(view, operation, writesCache, completeServerCache) {
    if (operation.type === OperationType2.MERGE && operation.source.queryId !== null) {
      assert(viewCacheGetCompleteServerSnap(view.viewCache_), "We should always have a full cache before handling merges");
      assert(viewCacheGetCompleteEventSnap(view.viewCache_), "Missing event cache, even though we have a server cache");
    }
    const oldViewCache = view.viewCache_;
    const result = viewProcessorApplyOperation(view.processor_, oldViewCache, operation, writesCache, completeServerCache);
    viewProcessorAssertIndexed(view.processor_, result.viewCache);
    assert(result.viewCache.serverCache.isFullyInitialized() || !oldViewCache.serverCache.isFullyInitialized(), "Once a server snap is complete, it should never go back");
    view.viewCache_ = result.viewCache;
    return viewGenerateEventsForChanges_(view, result.changes, result.viewCache.eventCache.getNode(), null);
  }
  function viewGetInitialEvents(view, registration) {
    const eventSnap = view.viewCache_.eventCache;
    const initialChanges = [];
    if (!eventSnap.getNode().isLeafNode()) {
      const eventNode = eventSnap.getNode();
      eventNode.forEachChild(PRIORITY_INDEX, (key, childNode) => {
        initialChanges.push(changeChildAdded(key, childNode));
      });
    }
    if (eventSnap.isFullyInitialized()) {
      initialChanges.push(changeValue(eventSnap.getNode()));
    }
    return viewGenerateEventsForChanges_(view, initialChanges, eventSnap.getNode(), registration);
  }
  function viewGenerateEventsForChanges_(view, changes, eventCache, eventRegistration) {
    const registrations = eventRegistration ? [eventRegistration] : view.eventRegistrations_;
    return eventGeneratorGenerateEventsForChanges(view.eventGenerator_, changes, eventCache, registrations);
  }
  function syncPointSetReferenceConstructor(val) {
    assert(!referenceConstructor$1, "__referenceConstructor has already been defined");
    referenceConstructor$1 = val;
  }
  function syncPointGetReferenceConstructor() {
    assert(referenceConstructor$1, "Reference.ts has not been loaded");
    return referenceConstructor$1;
  }
  function syncPointIsEmpty(syncPoint) {
    return syncPoint.views.size === 0;
  }
  function syncPointApplyOperation(syncPoint, operation, writesCache, optCompleteServerCache) {
    const queryId = operation.source.queryId;
    if (queryId !== null) {
      const view = syncPoint.views.get(queryId);
      assert(view != null, "SyncTree gave us an op for an invalid query.");
      return viewApplyOperation(view, operation, writesCache, optCompleteServerCache);
    } else {
      let events = [];
      for (const view of syncPoint.views.values()) {
        events = events.concat(viewApplyOperation(view, operation, writesCache, optCompleteServerCache));
      }
      return events;
    }
  }
  function syncPointGetView(syncPoint, query, writesCache, serverCache, serverCacheComplete) {
    const queryId = query._queryIdentifier;
    const view = syncPoint.views.get(queryId);
    if (!view) {
      let eventCache = writeTreeRefCalcCompleteEventCache(writesCache, serverCacheComplete ? serverCache : null);
      let eventCacheComplete = false;
      if (eventCache) {
        eventCacheComplete = true;
      } else if (serverCache instanceof ChildrenNode) {
        eventCache = writeTreeRefCalcCompleteEventChildren(writesCache, serverCache);
        eventCacheComplete = false;
      } else {
        eventCache = ChildrenNode.EMPTY_NODE;
        eventCacheComplete = false;
      }
      const viewCache = newViewCache(new CacheNode(eventCache, eventCacheComplete, false), new CacheNode(serverCache, serverCacheComplete, false));
      return new View(query, viewCache);
    }
    return view;
  }
  function syncPointAddEventRegistration(syncPoint, query, eventRegistration, writesCache, serverCache, serverCacheComplete) {
    const view = syncPointGetView(syncPoint, query, writesCache, serverCache, serverCacheComplete);
    if (!syncPoint.views.has(query._queryIdentifier)) {
      syncPoint.views.set(query._queryIdentifier, view);
    }
    viewAddEventRegistration(view, eventRegistration);
    return viewGetInitialEvents(view, eventRegistration);
  }
  function syncPointRemoveEventRegistration(syncPoint, query, eventRegistration, cancelError) {
    const queryId = query._queryIdentifier;
    const removed = [];
    let cancelEvents = [];
    const hadCompleteView = syncPointHasCompleteView(syncPoint);
    if (queryId === "default") {
      for (const [viewQueryId, view] of syncPoint.views.entries()) {
        cancelEvents = cancelEvents.concat(viewRemoveEventRegistration(view, eventRegistration, cancelError));
        if (viewIsEmpty(view)) {
          syncPoint.views.delete(viewQueryId);
          if (!view.query._queryParams.loadsAllData()) {
            removed.push(view.query);
          }
        }
      }
    } else {
      const view = syncPoint.views.get(queryId);
      if (view) {
        cancelEvents = cancelEvents.concat(viewRemoveEventRegistration(view, eventRegistration, cancelError));
        if (viewIsEmpty(view)) {
          syncPoint.views.delete(queryId);
          if (!view.query._queryParams.loadsAllData()) {
            removed.push(view.query);
          }
        }
      }
    }
    if (hadCompleteView && !syncPointHasCompleteView(syncPoint)) {
      removed.push(new (syncPointGetReferenceConstructor())(query._repo, query._path));
    }
    return { removed, events: cancelEvents };
  }
  function syncPointGetQueryViews(syncPoint) {
    const result = [];
    for (const view of syncPoint.views.values()) {
      if (!view.query._queryParams.loadsAllData()) {
        result.push(view);
      }
    }
    return result;
  }
  function syncPointGetCompleteServerCache(syncPoint, path) {
    let serverCache = null;
    for (const view of syncPoint.views.values()) {
      serverCache = serverCache || viewGetCompleteServerCache(view, path);
    }
    return serverCache;
  }
  function syncPointViewForQuery(syncPoint, query) {
    const params = query._queryParams;
    if (params.loadsAllData()) {
      return syncPointGetCompleteView(syncPoint);
    } else {
      const queryId = query._queryIdentifier;
      return syncPoint.views.get(queryId);
    }
  }
  function syncPointViewExistsForQuery(syncPoint, query) {
    return syncPointViewForQuery(syncPoint, query) != null;
  }
  function syncPointHasCompleteView(syncPoint) {
    return syncPointGetCompleteView(syncPoint) != null;
  }
  function syncPointGetCompleteView(syncPoint) {
    for (const view of syncPoint.views.values()) {
      if (view.query._queryParams.loadsAllData()) {
        return view;
      }
    }
    return null;
  }
  function syncTreeSetReferenceConstructor(val) {
    assert(!referenceConstructor, "__referenceConstructor has already been defined");
    referenceConstructor = val;
  }
  function syncTreeGetReferenceConstructor() {
    assert(referenceConstructor, "Reference.ts has not been loaded");
    return referenceConstructor;
  }
  function syncTreeApplyUserOverwrite(syncTree, path, newData, writeId, visible) {
    writeTreeAddOverwrite(syncTree.pendingWriteTree_, path, newData, writeId, visible);
    if (!visible) {
      return [];
    } else {
      return syncTreeApplyOperationToSyncPoints_(syncTree, new Overwrite(newOperationSourceUser(), path, newData));
    }
  }
  function syncTreeAckUserWrite(syncTree, writeId, revert = false) {
    const write = writeTreeGetWrite(syncTree.pendingWriteTree_, writeId);
    const needToReevaluate = writeTreeRemoveWrite(syncTree.pendingWriteTree_, writeId);
    if (!needToReevaluate) {
      return [];
    } else {
      let affectedTree = new ImmutableTree(null);
      if (write.snap != null) {
        affectedTree = affectedTree.set(newEmptyPath(), true);
      } else {
        each(write.children, (pathString) => {
          affectedTree = affectedTree.set(new Path(pathString), true);
        });
      }
      return syncTreeApplyOperationToSyncPoints_(syncTree, new AckUserWrite(write.path, affectedTree, revert));
    }
  }
  function syncTreeApplyServerOverwrite(syncTree, path, newData) {
    return syncTreeApplyOperationToSyncPoints_(syncTree, new Overwrite(newOperationSourceServer(), path, newData));
  }
  function syncTreeApplyServerMerge(syncTree, path, changedChildren) {
    const changeTree = ImmutableTree.fromObject(changedChildren);
    return syncTreeApplyOperationToSyncPoints_(syncTree, new Merge(newOperationSourceServer(), path, changeTree));
  }
  function syncTreeApplyListenComplete(syncTree, path) {
    return syncTreeApplyOperationToSyncPoints_(syncTree, new ListenComplete(newOperationSourceServer(), path));
  }
  function syncTreeApplyTaggedListenComplete(syncTree, path, tag) {
    const queryKey = syncTreeQueryKeyForTag_(syncTree, tag);
    if (queryKey) {
      const r = syncTreeParseQueryKey_(queryKey);
      const queryPath = r.path, queryId = r.queryId;
      const relativePath = newRelativePath(queryPath, path);
      const op = new ListenComplete(newOperationSourceServerTaggedQuery(queryId), relativePath);
      return syncTreeApplyTaggedOperation_(syncTree, queryPath, op);
    } else {
      return [];
    }
  }
  function syncTreeRemoveEventRegistration(syncTree, query, eventRegistration, cancelError, skipListenerDedup = false) {
    const path = query._path;
    const maybeSyncPoint = syncTree.syncPointTree_.get(path);
    let cancelEvents = [];
    if (maybeSyncPoint && (query._queryIdentifier === "default" || syncPointViewExistsForQuery(maybeSyncPoint, query))) {
      const removedAndEvents = syncPointRemoveEventRegistration(maybeSyncPoint, query, eventRegistration, cancelError);
      if (syncPointIsEmpty(maybeSyncPoint)) {
        syncTree.syncPointTree_ = syncTree.syncPointTree_.remove(path);
      }
      const removed = removedAndEvents.removed;
      cancelEvents = removedAndEvents.events;
      if (!skipListenerDedup) {
        const removingDefault = -1 !== removed.findIndex((query2) => {
          return query2._queryParams.loadsAllData();
        });
        const covered = syncTree.syncPointTree_.findOnPath(path, (relativePath, parentSyncPoint) => syncPointHasCompleteView(parentSyncPoint));
        if (removingDefault && !covered) {
          const subtree = syncTree.syncPointTree_.subtree(path);
          if (!subtree.isEmpty()) {
            const newViews = syncTreeCollectDistinctViewsForSubTree_(subtree);
            for (let i = 0; i < newViews.length; ++i) {
              const view = newViews[i], newQuery = view.query;
              const listener = syncTreeCreateListenerForView_(syncTree, view);
              syncTree.listenProvider_.startListening(syncTreeQueryForListening_(newQuery), syncTreeTagForQuery(syncTree, newQuery), listener.hashFn, listener.onComplete);
            }
          }
        }
        if (!covered && removed.length > 0 && !cancelError) {
          if (removingDefault) {
            const defaultTag = null;
            syncTree.listenProvider_.stopListening(syncTreeQueryForListening_(query), defaultTag);
          } else {
            removed.forEach((queryToRemove) => {
              const tagToRemove = syncTree.queryToTagMap.get(syncTreeMakeQueryKey_(queryToRemove));
              syncTree.listenProvider_.stopListening(syncTreeQueryForListening_(queryToRemove), tagToRemove);
            });
          }
        }
      }
      syncTreeRemoveTags_(syncTree, removed);
    }
    return cancelEvents;
  }
  function syncTreeApplyTaggedQueryOverwrite(syncTree, path, snap, tag) {
    const queryKey = syncTreeQueryKeyForTag_(syncTree, tag);
    if (queryKey != null) {
      const r = syncTreeParseQueryKey_(queryKey);
      const queryPath = r.path, queryId = r.queryId;
      const relativePath = newRelativePath(queryPath, path);
      const op = new Overwrite(newOperationSourceServerTaggedQuery(queryId), relativePath, snap);
      return syncTreeApplyTaggedOperation_(syncTree, queryPath, op);
    } else {
      return [];
    }
  }
  function syncTreeApplyTaggedQueryMerge(syncTree, path, changedChildren, tag) {
    const queryKey = syncTreeQueryKeyForTag_(syncTree, tag);
    if (queryKey) {
      const r = syncTreeParseQueryKey_(queryKey);
      const queryPath = r.path, queryId = r.queryId;
      const relativePath = newRelativePath(queryPath, path);
      const changeTree = ImmutableTree.fromObject(changedChildren);
      const op = new Merge(newOperationSourceServerTaggedQuery(queryId), relativePath, changeTree);
      return syncTreeApplyTaggedOperation_(syncTree, queryPath, op);
    } else {
      return [];
    }
  }
  function syncTreeAddEventRegistration(syncTree, query, eventRegistration, skipSetupListener = false) {
    const path = query._path;
    let serverCache = null;
    let foundAncestorDefaultView = false;
    syncTree.syncPointTree_.foreachOnPath(path, (pathToSyncPoint, sp) => {
      const relativePath = newRelativePath(pathToSyncPoint, path);
      serverCache = serverCache || syncPointGetCompleteServerCache(sp, relativePath);
      foundAncestorDefaultView = foundAncestorDefaultView || syncPointHasCompleteView(sp);
    });
    let syncPoint = syncTree.syncPointTree_.get(path);
    if (!syncPoint) {
      syncPoint = new SyncPoint();
      syncTree.syncPointTree_ = syncTree.syncPointTree_.set(path, syncPoint);
    } else {
      foundAncestorDefaultView = foundAncestorDefaultView || syncPointHasCompleteView(syncPoint);
      serverCache = serverCache || syncPointGetCompleteServerCache(syncPoint, newEmptyPath());
    }
    let serverCacheComplete;
    if (serverCache != null) {
      serverCacheComplete = true;
    } else {
      serverCacheComplete = false;
      serverCache = ChildrenNode.EMPTY_NODE;
      const subtree = syncTree.syncPointTree_.subtree(path);
      subtree.foreachChild((childName, childSyncPoint) => {
        const completeCache = syncPointGetCompleteServerCache(childSyncPoint, newEmptyPath());
        if (completeCache) {
          serverCache = serverCache.updateImmediateChild(childName, completeCache);
        }
      });
    }
    const viewAlreadyExists = syncPointViewExistsForQuery(syncPoint, query);
    if (!viewAlreadyExists && !query._queryParams.loadsAllData()) {
      const queryKey = syncTreeMakeQueryKey_(query);
      assert(!syncTree.queryToTagMap.has(queryKey), "View does not exist, but we have a tag");
      const tag = syncTreeGetNextQueryTag_();
      syncTree.queryToTagMap.set(queryKey, tag);
      syncTree.tagToQueryMap.set(tag, queryKey);
    }
    const writesCache = writeTreeChildWrites(syncTree.pendingWriteTree_, path);
    let events = syncPointAddEventRegistration(syncPoint, query, eventRegistration, writesCache, serverCache, serverCacheComplete);
    if (!viewAlreadyExists && !foundAncestorDefaultView && !skipSetupListener) {
      const view = syncPointViewForQuery(syncPoint, query);
      events = events.concat(syncTreeSetupListener_(syncTree, query, view));
    }
    return events;
  }
  function syncTreeCalcCompleteEventCache(syncTree, path, writeIdsToExclude) {
    const includeHiddenSets = true;
    const writeTree = syncTree.pendingWriteTree_;
    const serverCache = syncTree.syncPointTree_.findOnPath(path, (pathSoFar, syncPoint) => {
      const relativePath = newRelativePath(pathSoFar, path);
      const serverCache2 = syncPointGetCompleteServerCache(syncPoint, relativePath);
      if (serverCache2) {
        return serverCache2;
      }
    });
    return writeTreeCalcCompleteEventCache(writeTree, path, serverCache, writeIdsToExclude, includeHiddenSets);
  }
  function syncTreeGetServerValue(syncTree, query) {
    const path = query._path;
    let serverCache = null;
    syncTree.syncPointTree_.foreachOnPath(path, (pathToSyncPoint, sp) => {
      const relativePath = newRelativePath(pathToSyncPoint, path);
      serverCache = serverCache || syncPointGetCompleteServerCache(sp, relativePath);
    });
    let syncPoint = syncTree.syncPointTree_.get(path);
    if (!syncPoint) {
      syncPoint = new SyncPoint();
      syncTree.syncPointTree_ = syncTree.syncPointTree_.set(path, syncPoint);
    } else {
      serverCache = serverCache || syncPointGetCompleteServerCache(syncPoint, newEmptyPath());
    }
    const serverCacheComplete = serverCache != null;
    const serverCacheNode = serverCacheComplete ? new CacheNode(serverCache, true, false) : null;
    const writesCache = writeTreeChildWrites(syncTree.pendingWriteTree_, query._path);
    const view = syncPointGetView(syncPoint, query, writesCache, serverCacheComplete ? serverCacheNode.getNode() : ChildrenNode.EMPTY_NODE, serverCacheComplete);
    return viewGetCompleteNode(view);
  }
  function syncTreeApplyOperationToSyncPoints_(syncTree, operation) {
    return syncTreeApplyOperationHelper_(
      operation,
      syncTree.syncPointTree_,
      /*serverCache=*/
      null,
      writeTreeChildWrites(syncTree.pendingWriteTree_, newEmptyPath())
    );
  }
  function syncTreeApplyOperationHelper_(operation, syncPointTree, serverCache, writesCache) {
    if (pathIsEmpty(operation.path)) {
      return syncTreeApplyOperationDescendantsHelper_(operation, syncPointTree, serverCache, writesCache);
    } else {
      const syncPoint = syncPointTree.get(newEmptyPath());
      if (serverCache == null && syncPoint != null) {
        serverCache = syncPointGetCompleteServerCache(syncPoint, newEmptyPath());
      }
      let events = [];
      const childName = pathGetFront(operation.path);
      const childOperation = operation.operationForChild(childName);
      const childTree = syncPointTree.children.get(childName);
      if (childTree && childOperation) {
        const childServerCache = serverCache ? serverCache.getImmediateChild(childName) : null;
        const childWritesCache = writeTreeRefChild(writesCache, childName);
        events = events.concat(syncTreeApplyOperationHelper_(childOperation, childTree, childServerCache, childWritesCache));
      }
      if (syncPoint) {
        events = events.concat(syncPointApplyOperation(syncPoint, operation, writesCache, serverCache));
      }
      return events;
    }
  }
  function syncTreeApplyOperationDescendantsHelper_(operation, syncPointTree, serverCache, writesCache) {
    const syncPoint = syncPointTree.get(newEmptyPath());
    if (serverCache == null && syncPoint != null) {
      serverCache = syncPointGetCompleteServerCache(syncPoint, newEmptyPath());
    }
    let events = [];
    syncPointTree.children.inorderTraversal((childName, childTree) => {
      const childServerCache = serverCache ? serverCache.getImmediateChild(childName) : null;
      const childWritesCache = writeTreeRefChild(writesCache, childName);
      const childOperation = operation.operationForChild(childName);
      if (childOperation) {
        events = events.concat(syncTreeApplyOperationDescendantsHelper_(childOperation, childTree, childServerCache, childWritesCache));
      }
    });
    if (syncPoint) {
      events = events.concat(syncPointApplyOperation(syncPoint, operation, writesCache, serverCache));
    }
    return events;
  }
  function syncTreeCreateListenerForView_(syncTree, view) {
    const query = view.query;
    const tag = syncTreeTagForQuery(syncTree, query);
    return {
      hashFn: () => {
        const cache = viewGetServerCache(view) || ChildrenNode.EMPTY_NODE;
        return cache.hash();
      },
      onComplete: (status) => {
        if (status === "ok") {
          if (tag) {
            return syncTreeApplyTaggedListenComplete(syncTree, query._path, tag);
          } else {
            return syncTreeApplyListenComplete(syncTree, query._path);
          }
        } else {
          const error2 = errorForServerCode(status, query);
          return syncTreeRemoveEventRegistration(
            syncTree,
            query,
            /*eventRegistration*/
            null,
            error2
          );
        }
      }
    };
  }
  function syncTreeTagForQuery(syncTree, query) {
    const queryKey = syncTreeMakeQueryKey_(query);
    return syncTree.queryToTagMap.get(queryKey);
  }
  function syncTreeMakeQueryKey_(query) {
    return query._path.toString() + "$" + query._queryIdentifier;
  }
  function syncTreeQueryKeyForTag_(syncTree, tag) {
    return syncTree.tagToQueryMap.get(tag);
  }
  function syncTreeParseQueryKey_(queryKey) {
    const splitIndex = queryKey.indexOf("$");
    assert(splitIndex !== -1 && splitIndex < queryKey.length - 1, "Bad queryKey.");
    return {
      queryId: queryKey.substr(splitIndex + 1),
      path: new Path(queryKey.substr(0, splitIndex))
    };
  }
  function syncTreeApplyTaggedOperation_(syncTree, queryPath, operation) {
    const syncPoint = syncTree.syncPointTree_.get(queryPath);
    assert(syncPoint, "Missing sync point for query tag that we're tracking");
    const writesCache = writeTreeChildWrites(syncTree.pendingWriteTree_, queryPath);
    return syncPointApplyOperation(syncPoint, operation, writesCache, null);
  }
  function syncTreeCollectDistinctViewsForSubTree_(subtree) {
    return subtree.fold((relativePath, maybeChildSyncPoint, childMap) => {
      if (maybeChildSyncPoint && syncPointHasCompleteView(maybeChildSyncPoint)) {
        const completeView = syncPointGetCompleteView(maybeChildSyncPoint);
        return [completeView];
      } else {
        let views = [];
        if (maybeChildSyncPoint) {
          views = syncPointGetQueryViews(maybeChildSyncPoint);
        }
        each(childMap, (_key, childViews) => {
          views = views.concat(childViews);
        });
        return views;
      }
    });
  }
  function syncTreeQueryForListening_(query) {
    if (query._queryParams.loadsAllData() && !query._queryParams.isDefault()) {
      return new (syncTreeGetReferenceConstructor())(query._repo, query._path);
    } else {
      return query;
    }
  }
  function syncTreeRemoveTags_(syncTree, queries) {
    for (let j = 0; j < queries.length; ++j) {
      const removedQuery = queries[j];
      if (!removedQuery._queryParams.loadsAllData()) {
        const removedQueryKey = syncTreeMakeQueryKey_(removedQuery);
        const removedQueryTag = syncTree.queryToTagMap.get(removedQueryKey);
        syncTree.queryToTagMap.delete(removedQueryKey);
        syncTree.tagToQueryMap.delete(removedQueryTag);
      }
    }
  }
  function syncTreeGetNextQueryTag_() {
    return syncTreeNextQueryTag_++;
  }
  function syncTreeSetupListener_(syncTree, query, view) {
    const path = query._path;
    const tag = syncTreeTagForQuery(syncTree, query);
    const listener = syncTreeCreateListenerForView_(syncTree, view);
    const events = syncTree.listenProvider_.startListening(syncTreeQueryForListening_(query), tag, listener.hashFn, listener.onComplete);
    const subtree = syncTree.syncPointTree_.subtree(path);
    if (tag) {
      assert(!syncPointHasCompleteView(subtree.value), "If we're adding a query, it shouldn't be shadowed");
    } else {
      const queriesToStop = subtree.fold((relativePath, maybeChildSyncPoint, childMap) => {
        if (!pathIsEmpty(relativePath) && maybeChildSyncPoint && syncPointHasCompleteView(maybeChildSyncPoint)) {
          return [syncPointGetCompleteView(maybeChildSyncPoint).query];
        } else {
          let queries = [];
          if (maybeChildSyncPoint) {
            queries = queries.concat(syncPointGetQueryViews(maybeChildSyncPoint).map((view2) => view2.query));
          }
          each(childMap, (_key, childQueries) => {
            queries = queries.concat(childQueries);
          });
          return queries;
        }
      });
      for (let i = 0; i < queriesToStop.length; ++i) {
        const queryToStop = queriesToStop[i];
        syncTree.listenProvider_.stopListening(syncTreeQueryForListening_(queryToStop), syncTreeTagForQuery(syncTree, queryToStop));
      }
    }
    return events;
  }
  function resolveDeferredValue(node, existingVal, serverValues) {
    const rawPri = node.getPriority().val();
    const priority = resolveDeferredLeafValue(rawPri, existingVal.getImmediateChild(".priority"), serverValues);
    let newNode;
    if (node.isLeafNode()) {
      const leafNode = node;
      const value = resolveDeferredLeafValue(leafNode.getValue(), existingVal, serverValues);
      if (value !== leafNode.getValue() || priority !== leafNode.getPriority().val()) {
        return new LeafNode(value, nodeFromJSON(priority));
      } else {
        return node;
      }
    } else {
      const childrenNode = node;
      newNode = childrenNode;
      if (priority !== childrenNode.getPriority().val()) {
        newNode = newNode.updatePriority(new LeafNode(priority));
      }
      childrenNode.forEachChild(PRIORITY_INDEX, (childName, childNode) => {
        const newChildNode = resolveDeferredValue(childNode, existingVal.getImmediateChild(childName), serverValues);
        if (newChildNode !== childNode) {
          newNode = newNode.updateImmediateChild(childName, newChildNode);
        }
      });
      return newNode;
    }
  }
  function treeSubTree(tree, pathObj) {
    let path = pathObj instanceof Path ? pathObj : new Path(pathObj);
    let child2 = tree, next = pathGetFront(path);
    while (next !== null) {
      const childNode = safeGet(child2.node.children, next) || {
        children: {},
        childCount: 0
      };
      child2 = new Tree(next, child2, childNode);
      path = pathPopFront(path);
      next = pathGetFront(path);
    }
    return child2;
  }
  function treeGetValue(tree) {
    return tree.node.value;
  }
  function treeSetValue(tree, value) {
    tree.node.value = value;
    treeUpdateParents(tree);
  }
  function treeHasChildren(tree) {
    return tree.node.childCount > 0;
  }
  function treeIsEmpty(tree) {
    return treeGetValue(tree) === void 0 && !treeHasChildren(tree);
  }
  function treeForEachChild(tree, action) {
    each(tree.node.children, (child2, childTree) => {
      action(new Tree(child2, tree, childTree));
    });
  }
  function treeForEachDescendant(tree, action, includeSelf, childrenFirst) {
    if (includeSelf && !childrenFirst) {
      action(tree);
    }
    treeForEachChild(tree, (child2) => {
      treeForEachDescendant(child2, action, true, childrenFirst);
    });
    if (includeSelf && childrenFirst) {
      action(tree);
    }
  }
  function treeForEachAncestor(tree, action, includeSelf) {
    let node = includeSelf ? tree : tree.parent;
    while (node !== null) {
      if (action(node)) {
        return true;
      }
      node = node.parent;
    }
    return false;
  }
  function treeGetPath(tree) {
    return new Path(tree.parent === null ? tree.name : treeGetPath(tree.parent) + "/" + tree.name);
  }
  function treeUpdateParents(tree) {
    if (tree.parent !== null) {
      treeUpdateChild(tree.parent, tree.name, tree);
    }
  }
  function treeUpdateChild(tree, childName, child2) {
    const childEmpty = treeIsEmpty(child2);
    const childExists = contains(tree.node.children, childName);
    if (childEmpty && childExists) {
      delete tree.node.children[childName];
      tree.node.childCount--;
      treeUpdateParents(tree);
    } else if (!childEmpty && !childExists) {
      tree.node.children[childName] = child2.node;
      tree.node.childCount++;
      treeUpdateParents(tree);
    }
  }
  function eventQueueQueueEvents(eventQueue, eventDataList) {
    let currList = null;
    for (let i = 0; i < eventDataList.length; i++) {
      const data = eventDataList[i];
      const path = data.getPath();
      if (currList !== null && !pathEquals(path, currList.path)) {
        eventQueue.eventLists_.push(currList);
        currList = null;
      }
      if (currList === null) {
        currList = { events: [], path };
      }
      currList.events.push(data);
    }
    if (currList) {
      eventQueue.eventLists_.push(currList);
    }
  }
  function eventQueueRaiseEventsAtPath(eventQueue, path, eventDataList) {
    eventQueueQueueEvents(eventQueue, eventDataList);
    eventQueueRaiseQueuedEventsMatchingPredicate(eventQueue, (eventPath) => pathEquals(eventPath, path));
  }
  function eventQueueRaiseEventsForChangedPath(eventQueue, changedPath, eventDataList) {
    eventQueueQueueEvents(eventQueue, eventDataList);
    eventQueueRaiseQueuedEventsMatchingPredicate(eventQueue, (eventPath) => pathContains(eventPath, changedPath) || pathContains(changedPath, eventPath));
  }
  function eventQueueRaiseQueuedEventsMatchingPredicate(eventQueue, predicate) {
    eventQueue.recursionDepth_++;
    let sentAll = true;
    for (let i = 0; i < eventQueue.eventLists_.length; i++) {
      const eventList = eventQueue.eventLists_[i];
      if (eventList) {
        const eventPath = eventList.path;
        if (predicate(eventPath)) {
          eventListRaise(eventQueue.eventLists_[i]);
          eventQueue.eventLists_[i] = null;
        } else {
          sentAll = false;
        }
      }
    }
    if (sentAll) {
      eventQueue.eventLists_ = [];
    }
    eventQueue.recursionDepth_--;
  }
  function eventListRaise(eventList) {
    for (let i = 0; i < eventList.events.length; i++) {
      const eventData = eventList.events[i];
      if (eventData !== null) {
        eventList.events[i] = null;
        const eventFn = eventData.getEventRunner();
        if (logger2) {
          log("event: " + eventData.toString());
        }
        exceptionGuard(eventFn);
      }
    }
  }
  function repoStart(repo, appId, authOverride) {
    repo.stats_ = statsManagerGetCollection(repo.repoInfo_);
    if (repo.forceRestClient_ || beingCrawled()) {
      repo.server_ = new ReadonlyRestClient(repo.repoInfo_, (pathString, data, isMerge, tag) => {
        repoOnDataUpdate(repo, pathString, data, isMerge, tag);
      }, repo.authTokenProvider_, repo.appCheckProvider_);
      setTimeout(() => repoOnConnectStatus(
        repo,
        /* connectStatus= */
        true
      ), 0);
    } else {
      if (typeof authOverride !== "undefined" && authOverride !== null) {
        if (typeof authOverride !== "object") {
          throw new Error("Only objects are supported for option databaseAuthVariableOverride");
        }
        try {
          stringify(authOverride);
        } catch (e) {
          throw new Error("Invalid authOverride provided: " + e);
        }
      }
      repo.persistentConnection_ = new PersistentConnection(repo.repoInfo_, appId, (pathString, data, isMerge, tag) => {
        repoOnDataUpdate(repo, pathString, data, isMerge, tag);
      }, (connectStatus) => {
        repoOnConnectStatus(repo, connectStatus);
      }, (updates) => {
        repoOnServerInfoUpdate(repo, updates);
      }, repo.authTokenProvider_, repo.appCheckProvider_, authOverride);
      repo.server_ = repo.persistentConnection_;
    }
    repo.authTokenProvider_.addTokenChangeListener((token) => {
      repo.server_.refreshAuthToken(token);
    });
    repo.appCheckProvider_.addTokenChangeListener((result) => {
      repo.server_.refreshAppCheckToken(result.token);
    });
    repo.statsReporter_ = statsManagerGetOrCreateReporter(repo.repoInfo_, () => new StatsReporter(repo.stats_, repo.server_));
    repo.infoData_ = new SnapshotHolder();
    repo.infoSyncTree_ = new SyncTree({
      startListening: (query, tag, currentHashFn, onComplete) => {
        let infoEvents = [];
        const node = repo.infoData_.getNode(query._path);
        if (!node.isEmpty()) {
          infoEvents = syncTreeApplyServerOverwrite(repo.infoSyncTree_, query._path, node);
          setTimeout(() => {
            onComplete("ok");
          }, 0);
        }
        return infoEvents;
      },
      stopListening: () => {
      }
    });
    repoUpdateInfo(repo, "connected", false);
    repo.serverSyncTree_ = new SyncTree({
      startListening: (query, tag, currentHashFn, onComplete) => {
        repo.server_.listen(query, currentHashFn, tag, (status, data) => {
          const events = onComplete(status, data);
          eventQueueRaiseEventsForChangedPath(repo.eventQueue_, query._path, events);
        });
        return [];
      },
      stopListening: (query, tag) => {
        repo.server_.unlisten(query, tag);
      }
    });
  }
  function repoServerTime(repo) {
    const offsetNode = repo.infoData_.getNode(new Path(".info/serverTimeOffset"));
    const offset = offsetNode.val() || 0;
    return (/* @__PURE__ */ new Date()).getTime() + offset;
  }
  function repoGenerateServerValues(repo) {
    return generateWithValues({
      timestamp: repoServerTime(repo)
    });
  }
  function repoOnDataUpdate(repo, pathString, data, isMerge, tag) {
    repo.dataUpdateCount++;
    const path = new Path(pathString);
    data = repo.interceptServerDataCallback_ ? repo.interceptServerDataCallback_(pathString, data) : data;
    let events = [];
    if (tag) {
      if (isMerge) {
        const taggedChildren = map(data, (raw) => nodeFromJSON(raw));
        events = syncTreeApplyTaggedQueryMerge(repo.serverSyncTree_, path, taggedChildren, tag);
      } else {
        const taggedSnap = nodeFromJSON(data);
        events = syncTreeApplyTaggedQueryOverwrite(repo.serverSyncTree_, path, taggedSnap, tag);
      }
    } else if (isMerge) {
      const changedChildren = map(data, (raw) => nodeFromJSON(raw));
      events = syncTreeApplyServerMerge(repo.serverSyncTree_, path, changedChildren);
    } else {
      const snap = nodeFromJSON(data);
      events = syncTreeApplyServerOverwrite(repo.serverSyncTree_, path, snap);
    }
    let affectedPath = path;
    if (events.length > 0) {
      affectedPath = repoRerunTransactions(repo, path);
    }
    eventQueueRaiseEventsForChangedPath(repo.eventQueue_, affectedPath, events);
  }
  function repoOnConnectStatus(repo, connectStatus) {
    repoUpdateInfo(repo, "connected", connectStatus);
    if (connectStatus === false) {
      repoRunOnDisconnectEvents(repo);
    }
  }
  function repoOnServerInfoUpdate(repo, updates) {
    each(updates, (key, value) => {
      repoUpdateInfo(repo, key, value);
    });
  }
  function repoUpdateInfo(repo, pathString, value) {
    const path = new Path("/.info/" + pathString);
    const newNode = nodeFromJSON(value);
    repo.infoData_.updateSnapshot(path, newNode);
    const events = syncTreeApplyServerOverwrite(repo.infoSyncTree_, path, newNode);
    eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, events);
  }
  function repoGetNextWriteId(repo) {
    return repo.nextWriteId_++;
  }
  function repoGetValue(repo, query, eventRegistration) {
    const cached = syncTreeGetServerValue(repo.serverSyncTree_, query);
    if (cached != null) {
      return Promise.resolve(cached);
    }
    return repo.server_.get(query).then((payload) => {
      const node = nodeFromJSON(payload).withIndex(query._queryParams.getIndex());
      syncTreeAddEventRegistration(repo.serverSyncTree_, query, eventRegistration, true);
      let events;
      if (query._queryParams.loadsAllData()) {
        events = syncTreeApplyServerOverwrite(repo.serverSyncTree_, query._path, node);
      } else {
        const tag = syncTreeTagForQuery(repo.serverSyncTree_, query);
        events = syncTreeApplyTaggedQueryOverwrite(repo.serverSyncTree_, query._path, node, tag);
      }
      eventQueueRaiseEventsForChangedPath(repo.eventQueue_, query._path, events);
      syncTreeRemoveEventRegistration(repo.serverSyncTree_, query, eventRegistration, null, true);
      return node;
    }, (err) => {
      repoLog(repo, "get for query " + stringify(query) + " failed: " + err);
      return Promise.reject(new Error(err));
    });
  }
  function repoSetWithPriority(repo, path, newVal, newPriority, onComplete) {
    repoLog(repo, "set", {
      path: path.toString(),
      value: newVal,
      priority: newPriority
    });
    const serverValues = repoGenerateServerValues(repo);
    const newNodeUnresolved = nodeFromJSON(newVal, newPriority);
    const existing = syncTreeCalcCompleteEventCache(repo.serverSyncTree_, path);
    const newNode = resolveDeferredValueSnapshot(newNodeUnresolved, existing, serverValues);
    const writeId = repoGetNextWriteId(repo);
    const events = syncTreeApplyUserOverwrite(repo.serverSyncTree_, path, newNode, writeId, true);
    eventQueueQueueEvents(repo.eventQueue_, events);
    repo.server_.put(path.toString(), newNodeUnresolved.val(
      /*export=*/
      true
    ), (status, errorReason) => {
      const success = status === "ok";
      if (!success) {
        warn("set at " + path + " failed: " + status);
      }
      const clearEvents = syncTreeAckUserWrite(repo.serverSyncTree_, writeId, !success);
      eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, clearEvents);
      repoCallOnCompleteCallback(repo, onComplete, status, errorReason);
    });
    const affectedPath = repoAbortTransactions(repo, path);
    repoRerunTransactions(repo, affectedPath);
    eventQueueRaiseEventsForChangedPath(repo.eventQueue_, affectedPath, []);
  }
  function repoRunOnDisconnectEvents(repo) {
    repoLog(repo, "onDisconnectEvents");
    const serverValues = repoGenerateServerValues(repo);
    const resolvedOnDisconnectTree = newSparseSnapshotTree();
    sparseSnapshotTreeForEachTree(repo.onDisconnect_, newEmptyPath(), (path, node) => {
      const resolved = resolveDeferredValueTree(path, node, repo.serverSyncTree_, serverValues);
      sparseSnapshotTreeRemember(resolvedOnDisconnectTree, path, resolved);
    });
    let events = [];
    sparseSnapshotTreeForEachTree(resolvedOnDisconnectTree, newEmptyPath(), (path, snap) => {
      events = events.concat(syncTreeApplyServerOverwrite(repo.serverSyncTree_, path, snap));
      const affectedPath = repoAbortTransactions(repo, path);
      repoRerunTransactions(repo, affectedPath);
    });
    repo.onDisconnect_ = newSparseSnapshotTree();
    eventQueueRaiseEventsForChangedPath(repo.eventQueue_, newEmptyPath(), events);
  }
  function repoAddEventCallbackForQuery(repo, query, eventRegistration) {
    let events;
    if (pathGetFront(query._path) === ".info") {
      events = syncTreeAddEventRegistration(repo.infoSyncTree_, query, eventRegistration);
    } else {
      events = syncTreeAddEventRegistration(repo.serverSyncTree_, query, eventRegistration);
    }
    eventQueueRaiseEventsAtPath(repo.eventQueue_, query._path, events);
  }
  function repoRemoveEventCallbackForQuery(repo, query, eventRegistration) {
    let events;
    if (pathGetFront(query._path) === ".info") {
      events = syncTreeRemoveEventRegistration(repo.infoSyncTree_, query, eventRegistration);
    } else {
      events = syncTreeRemoveEventRegistration(repo.serverSyncTree_, query, eventRegistration);
    }
    eventQueueRaiseEventsAtPath(repo.eventQueue_, query._path, events);
  }
  function repoInterrupt(repo) {
    if (repo.persistentConnection_) {
      repo.persistentConnection_.interrupt(INTERRUPT_REASON);
    }
  }
  function repoLog(repo, ...varArgs) {
    let prefix = "";
    if (repo.persistentConnection_) {
      prefix = repo.persistentConnection_.id + ":";
    }
    log(prefix, ...varArgs);
  }
  function repoCallOnCompleteCallback(repo, callback, status, errorReason) {
    if (callback) {
      exceptionGuard(() => {
        if (status === "ok") {
          callback(null);
        } else {
          const code = (status || "error").toUpperCase();
          let message = code;
          if (errorReason) {
            message += ": " + errorReason;
          }
          const error2 = new Error(message);
          error2.code = code;
          callback(error2);
        }
      });
    }
  }
  function repoStartTransaction(repo, path, transactionUpdate, onComplete, unwatcher, applyLocally) {
    repoLog(repo, "transaction on " + path);
    const transaction = {
      path,
      update: transactionUpdate,
      onComplete,
      // One of TransactionStatus enums.
      status: null,
      // Used when combining transactions at different locations to figure out
      // which one goes first.
      order: LUIDGenerator(),
      // Whether to raise local events for this transaction.
      applyLocally,
      // Count of how many times we've retried the transaction.
      retryCount: 0,
      // Function to call to clean up our .on() listener.
      unwatcher,
      // Stores why a transaction was aborted.
      abortReason: null,
      currentWriteId: null,
      currentInputSnapshot: null,
      currentOutputSnapshotRaw: null,
      currentOutputSnapshotResolved: null
    };
    const currentState = repoGetLatestState(repo, path, void 0);
    transaction.currentInputSnapshot = currentState;
    const newVal = transaction.update(currentState.val());
    if (newVal === void 0) {
      transaction.unwatcher();
      transaction.currentOutputSnapshotRaw = null;
      transaction.currentOutputSnapshotResolved = null;
      if (transaction.onComplete) {
        transaction.onComplete(null, false, transaction.currentInputSnapshot);
      }
    } else {
      validateFirebaseData("transaction failed: Data returned ", newVal, transaction.path);
      transaction.status = 0;
      const queueNode = treeSubTree(repo.transactionQueueTree_, path);
      const nodeQueue = treeGetValue(queueNode) || [];
      nodeQueue.push(transaction);
      treeSetValue(queueNode, nodeQueue);
      let priorityForNode;
      if (typeof newVal === "object" && newVal !== null && contains(newVal, ".priority")) {
        priorityForNode = safeGet(newVal, ".priority");
        assert(isValidPriority(priorityForNode), "Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.");
      } else {
        const currentNode = syncTreeCalcCompleteEventCache(repo.serverSyncTree_, path) || ChildrenNode.EMPTY_NODE;
        priorityForNode = currentNode.getPriority().val();
      }
      const serverValues = repoGenerateServerValues(repo);
      const newNodeUnresolved = nodeFromJSON(newVal, priorityForNode);
      const newNode = resolveDeferredValueSnapshot(newNodeUnresolved, currentState, serverValues);
      transaction.currentOutputSnapshotRaw = newNodeUnresolved;
      transaction.currentOutputSnapshotResolved = newNode;
      transaction.currentWriteId = repoGetNextWriteId(repo);
      const events = syncTreeApplyUserOverwrite(repo.serverSyncTree_, path, newNode, transaction.currentWriteId, transaction.applyLocally);
      eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, events);
      repoSendReadyTransactions(repo, repo.transactionQueueTree_);
    }
  }
  function repoGetLatestState(repo, path, excludeSets) {
    return syncTreeCalcCompleteEventCache(repo.serverSyncTree_, path, excludeSets) || ChildrenNode.EMPTY_NODE;
  }
  function repoSendReadyTransactions(repo, node = repo.transactionQueueTree_) {
    if (!node) {
      repoPruneCompletedTransactionsBelowNode(repo, node);
    }
    if (treeGetValue(node)) {
      const queue = repoBuildTransactionQueue(repo, node);
      assert(queue.length > 0, "Sending zero length transaction queue");
      const allRun = queue.every(
        (transaction) => transaction.status === 0
        /* TransactionStatus.RUN */
      );
      if (allRun) {
        repoSendTransactionQueue(repo, treeGetPath(node), queue);
      }
    } else if (treeHasChildren(node)) {
      treeForEachChild(node, (childNode) => {
        repoSendReadyTransactions(repo, childNode);
      });
    }
  }
  function repoSendTransactionQueue(repo, path, queue) {
    const setsToIgnore = queue.map((txn) => {
      return txn.currentWriteId;
    });
    const latestState = repoGetLatestState(repo, path, setsToIgnore);
    let snapToSend = latestState;
    const latestHash = latestState.hash();
    for (let i = 0; i < queue.length; i++) {
      const txn = queue[i];
      assert(txn.status === 0, "tryToSendTransactionQueue_: items in queue should all be run.");
      txn.status = 1;
      txn.retryCount++;
      const relativePath = newRelativePath(path, txn.path);
      snapToSend = snapToSend.updateChild(relativePath, txn.currentOutputSnapshotRaw);
    }
    const dataToSend = snapToSend.val(true);
    const pathToSend = path;
    repo.server_.put(pathToSend.toString(), dataToSend, (status) => {
      repoLog(repo, "transaction put response", {
        path: pathToSend.toString(),
        status
      });
      let events = [];
      if (status === "ok") {
        const callbacks = [];
        for (let i = 0; i < queue.length; i++) {
          queue[i].status = 2;
          events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, queue[i].currentWriteId));
          if (queue[i].onComplete) {
            callbacks.push(() => queue[i].onComplete(null, true, queue[i].currentOutputSnapshotResolved));
          }
          queue[i].unwatcher();
        }
        repoPruneCompletedTransactionsBelowNode(repo, treeSubTree(repo.transactionQueueTree_, path));
        repoSendReadyTransactions(repo, repo.transactionQueueTree_);
        eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, events);
        for (let i = 0; i < callbacks.length; i++) {
          exceptionGuard(callbacks[i]);
        }
      } else {
        if (status === "datastale") {
          for (let i = 0; i < queue.length; i++) {
            if (queue[i].status === 3) {
              queue[i].status = 4;
            } else {
              queue[i].status = 0;
            }
          }
        } else {
          warn("transaction at " + pathToSend.toString() + " failed: " + status);
          for (let i = 0; i < queue.length; i++) {
            queue[i].status = 4;
            queue[i].abortReason = status;
          }
        }
        repoRerunTransactions(repo, path);
      }
    }, latestHash);
  }
  function repoRerunTransactions(repo, changedPath) {
    const rootMostTransactionNode = repoGetAncestorTransactionNode(repo, changedPath);
    const path = treeGetPath(rootMostTransactionNode);
    const queue = repoBuildTransactionQueue(repo, rootMostTransactionNode);
    repoRerunTransactionQueue(repo, queue, path);
    return path;
  }
  function repoRerunTransactionQueue(repo, queue, path) {
    if (queue.length === 0) {
      return;
    }
    const callbacks = [];
    let events = [];
    const txnsToRerun = queue.filter((q) => {
      return q.status === 0;
    });
    const setsToIgnore = txnsToRerun.map((q) => {
      return q.currentWriteId;
    });
    for (let i = 0; i < queue.length; i++) {
      const transaction = queue[i];
      const relativePath = newRelativePath(path, transaction.path);
      let abortTransaction = false, abortReason;
      assert(relativePath !== null, "rerunTransactionsUnderNode_: relativePath should not be null.");
      if (transaction.status === 4) {
        abortTransaction = true;
        abortReason = transaction.abortReason;
        events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, transaction.currentWriteId, true));
      } else if (transaction.status === 0) {
        if (transaction.retryCount >= MAX_TRANSACTION_RETRIES) {
          abortTransaction = true;
          abortReason = "maxretry";
          events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, transaction.currentWriteId, true));
        } else {
          const currentNode = repoGetLatestState(repo, transaction.path, setsToIgnore);
          transaction.currentInputSnapshot = currentNode;
          const newData = queue[i].update(currentNode.val());
          if (newData !== void 0) {
            validateFirebaseData("transaction failed: Data returned ", newData, transaction.path);
            let newDataNode = nodeFromJSON(newData);
            const hasExplicitPriority = typeof newData === "object" && newData != null && contains(newData, ".priority");
            if (!hasExplicitPriority) {
              newDataNode = newDataNode.updatePriority(currentNode.getPriority());
            }
            const oldWriteId = transaction.currentWriteId;
            const serverValues = repoGenerateServerValues(repo);
            const newNodeResolved = resolveDeferredValueSnapshot(newDataNode, currentNode, serverValues);
            transaction.currentOutputSnapshotRaw = newDataNode;
            transaction.currentOutputSnapshotResolved = newNodeResolved;
            transaction.currentWriteId = repoGetNextWriteId(repo);
            setsToIgnore.splice(setsToIgnore.indexOf(oldWriteId), 1);
            events = events.concat(syncTreeApplyUserOverwrite(repo.serverSyncTree_, transaction.path, newNodeResolved, transaction.currentWriteId, transaction.applyLocally));
            events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, oldWriteId, true));
          } else {
            abortTransaction = true;
            abortReason = "nodata";
            events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, transaction.currentWriteId, true));
          }
        }
      }
      eventQueueRaiseEventsForChangedPath(repo.eventQueue_, path, events);
      events = [];
      if (abortTransaction) {
        queue[i].status = 2;
        (function(unwatcher) {
          setTimeout(unwatcher, Math.floor(0));
        })(queue[i].unwatcher);
        if (queue[i].onComplete) {
          if (abortReason === "nodata") {
            callbacks.push(() => queue[i].onComplete(null, false, queue[i].currentInputSnapshot));
          } else {
            callbacks.push(() => queue[i].onComplete(new Error(abortReason), false, null));
          }
        }
      }
    }
    repoPruneCompletedTransactionsBelowNode(repo, repo.transactionQueueTree_);
    for (let i = 0; i < callbacks.length; i++) {
      exceptionGuard(callbacks[i]);
    }
    repoSendReadyTransactions(repo, repo.transactionQueueTree_);
  }
  function repoGetAncestorTransactionNode(repo, path) {
    let front;
    let transactionNode = repo.transactionQueueTree_;
    front = pathGetFront(path);
    while (front !== null && treeGetValue(transactionNode) === void 0) {
      transactionNode = treeSubTree(transactionNode, front);
      path = pathPopFront(path);
      front = pathGetFront(path);
    }
    return transactionNode;
  }
  function repoBuildTransactionQueue(repo, transactionNode) {
    const transactionQueue = [];
    repoAggregateTransactionQueuesForNode(repo, transactionNode, transactionQueue);
    transactionQueue.sort((a, b) => a.order - b.order);
    return transactionQueue;
  }
  function repoAggregateTransactionQueuesForNode(repo, node, queue) {
    const nodeQueue = treeGetValue(node);
    if (nodeQueue) {
      for (let i = 0; i < nodeQueue.length; i++) {
        queue.push(nodeQueue[i]);
      }
    }
    treeForEachChild(node, (child2) => {
      repoAggregateTransactionQueuesForNode(repo, child2, queue);
    });
  }
  function repoPruneCompletedTransactionsBelowNode(repo, node) {
    const queue = treeGetValue(node);
    if (queue) {
      let to = 0;
      for (let from = 0; from < queue.length; from++) {
        if (queue[from].status !== 2) {
          queue[to] = queue[from];
          to++;
        }
      }
      queue.length = to;
      treeSetValue(node, queue.length > 0 ? queue : void 0);
    }
    treeForEachChild(node, (childNode) => {
      repoPruneCompletedTransactionsBelowNode(repo, childNode);
    });
  }
  function repoAbortTransactions(repo, path) {
    const affectedPath = treeGetPath(repoGetAncestorTransactionNode(repo, path));
    const transactionNode = treeSubTree(repo.transactionQueueTree_, path);
    treeForEachAncestor(transactionNode, (node) => {
      repoAbortTransactionsOnNode(repo, node);
    });
    repoAbortTransactionsOnNode(repo, transactionNode);
    treeForEachDescendant(transactionNode, (node) => {
      repoAbortTransactionsOnNode(repo, node);
    });
    return affectedPath;
  }
  function repoAbortTransactionsOnNode(repo, node) {
    const queue = treeGetValue(node);
    if (queue) {
      const callbacks = [];
      let events = [];
      let lastSent = -1;
      for (let i = 0; i < queue.length; i++) {
        if (queue[i].status === 3) ;
        else if (queue[i].status === 1) {
          assert(lastSent === i - 1, "All SENT items should be at beginning of queue.");
          lastSent = i;
          queue[i].status = 3;
          queue[i].abortReason = "set";
        } else {
          assert(queue[i].status === 0, "Unexpected transaction status in abort");
          queue[i].unwatcher();
          events = events.concat(syncTreeAckUserWrite(repo.serverSyncTree_, queue[i].currentWriteId, true));
          if (queue[i].onComplete) {
            callbacks.push(queue[i].onComplete.bind(null, new Error("set"), false, null));
          }
        }
      }
      if (lastSent === -1) {
        treeSetValue(node, void 0);
      } else {
        queue.length = lastSent + 1;
      }
      eventQueueRaiseEventsForChangedPath(repo.eventQueue_, treeGetPath(node), events);
      for (let i = 0; i < callbacks.length; i++) {
        exceptionGuard(callbacks[i]);
      }
    }
  }
  function decodePath(pathString) {
    let pathStringDecoded = "";
    const pieces = pathString.split("/");
    for (let i = 0; i < pieces.length; i++) {
      if (pieces[i].length > 0) {
        let piece = pieces[i];
        try {
          piece = decodeURIComponent(piece.replace(/\+/g, " "));
        } catch (e) {
        }
        pathStringDecoded += "/" + piece;
      }
    }
    return pathStringDecoded;
  }
  function decodeQuery(queryString) {
    const results = {};
    if (queryString.charAt(0) === "?") {
      queryString = queryString.substring(1);
    }
    for (const segment of queryString.split("&")) {
      if (segment.length === 0) {
        continue;
      }
      const kv = segment.split("=");
      if (kv.length === 2) {
        results[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
      } else {
        warn(`Invalid query segment '${segment}' in query '${queryString}'`);
      }
    }
    return results;
  }
  function ref(db, path) {
    db = getModularInstance(db);
    db._checkNotDeleted("ref");
    return path !== void 0 ? child(db._root, path) : db._root;
  }
  function child(parent, path) {
    parent = getModularInstance(parent);
    if (pathGetFront(parent._path) === null) {
      validateRootPathString("child", "path", path, false);
    } else {
      validatePathString("child", "path", path, false);
    }
    return new ReferenceImpl(parent._repo, pathChild(parent._path, path));
  }
  function set(ref2, value) {
    ref2 = getModularInstance(ref2);
    validateWritablePath("set", ref2._path);
    validateFirebaseDataArg("set", value, ref2._path, false);
    const deferred = new Deferred();
    repoSetWithPriority(
      ref2._repo,
      ref2._path,
      value,
      /*priority=*/
      null,
      deferred.wrapCallback(() => {
      })
    );
    return deferred.promise;
  }
  function get(query) {
    query = getModularInstance(query);
    const callbackContext = new CallbackContext(() => {
    });
    const container = new ValueEventRegistration(callbackContext);
    return repoGetValue(query._repo, query, container).then((node) => {
      return new DataSnapshot(node, new ReferenceImpl(query._repo, query._path), query._queryParams.getIndex());
    });
  }
  function addEventListener(query, eventType, callback, cancelCallbackOrListenOptions, options) {
    let cancelCallback;
    if (typeof cancelCallbackOrListenOptions === "object") {
      cancelCallback = void 0;
      options = cancelCallbackOrListenOptions;
    }
    if (typeof cancelCallbackOrListenOptions === "function") {
      cancelCallback = cancelCallbackOrListenOptions;
    }
    if (options && options.onlyOnce) {
      const userCallback = callback;
      const onceCallback = (dataSnapshot, previousChildName) => {
        repoRemoveEventCallbackForQuery(query._repo, query, container);
        userCallback(dataSnapshot, previousChildName);
      };
      onceCallback.userCallback = callback.userCallback;
      onceCallback.context = callback.context;
      callback = onceCallback;
    }
    const callbackContext = new CallbackContext(callback, cancelCallback || void 0);
    const container = eventType === "value" ? new ValueEventRegistration(callbackContext) : new ChildEventRegistration(eventType, callbackContext);
    repoAddEventCallbackForQuery(query._repo, query, container);
    return () => repoRemoveEventCallbackForQuery(query._repo, query, container);
  }
  function onValue(query, callback, cancelCallbackOrListenOptions, options) {
    return addEventListener(query, "value", callback, cancelCallbackOrListenOptions, options);
  }
  function repoManagerApplyEmulatorSettings(repo, hostAndPort, emulatorOptions, tokenProvider) {
    const portIndex = hostAndPort.lastIndexOf(":");
    const host = hostAndPort.substring(0, portIndex);
    const useSsl = isCloudWorkstation(host);
    repo.repoInfo_ = new RepoInfo(
      hostAndPort,
      /* secure= */
      useSsl,
      repo.repoInfo_.namespace,
      repo.repoInfo_.webSocketOnly,
      repo.repoInfo_.nodeAdmin,
      repo.repoInfo_.persistenceKey,
      repo.repoInfo_.includeNamespaceInQueryParams,
      /*isUsingEmulator=*/
      true,
      emulatorOptions
    );
    if (tokenProvider) {
      repo.authTokenProvider_ = tokenProvider;
    }
  }
  function repoManagerDatabaseFromApp(app, authProvider, appCheckProvider, url, nodeAdmin) {
    let dbUrl = url || app.options.databaseURL;
    if (dbUrl === void 0) {
      if (!app.options.projectId) {
        fatal("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp().");
      }
      log("Using default host for project ", app.options.projectId);
      dbUrl = `${app.options.projectId}-default-rtdb.firebaseio.com`;
    }
    let parsedUrl = parseRepoInfo(dbUrl, nodeAdmin);
    let repoInfo = parsedUrl.repoInfo;
    let isEmulator;
    let dbEmulatorHost = void 0;
    if (typeof process !== "undefined" && process.env) {
      dbEmulatorHost = process.env[FIREBASE_DATABASE_EMULATOR_HOST_VAR];
    }
    if (dbEmulatorHost) {
      isEmulator = true;
      dbUrl = `http://${dbEmulatorHost}?ns=${repoInfo.namespace}`;
      parsedUrl = parseRepoInfo(dbUrl, nodeAdmin);
      repoInfo = parsedUrl.repoInfo;
    } else {
      isEmulator = !parsedUrl.repoInfo.secure;
    }
    const authTokenProvider = nodeAdmin && isEmulator ? new EmulatorTokenProvider(EmulatorTokenProvider.OWNER) : new FirebaseAuthTokenProvider(app.name, app.options, authProvider);
    validateUrl("Invalid Firebase Database URL", parsedUrl);
    if (!pathIsEmpty(parsedUrl.path)) {
      fatal("Database URL must point to the root of a Firebase Database (not including a child path).");
    }
    const repo = repoManagerCreateRepo(repoInfo, app, authTokenProvider, new AppCheckTokenProvider(app, appCheckProvider));
    return new Database(repo, app);
  }
  function repoManagerDeleteRepo(repo, appName) {
    const appRepos = repos[appName];
    if (!appRepos || appRepos[repo.key] !== repo) {
      fatal(`Database ${appName}(${repo.repoInfo_}) has already been deleted.`);
    }
    repoInterrupt(repo);
    delete appRepos[repo.key];
  }
  function repoManagerCreateRepo(repoInfo, app, authTokenProvider, appCheckProvider) {
    let appRepos = repos[app.name];
    if (!appRepos) {
      appRepos = {};
      repos[app.name] = appRepos;
    }
    let repo = appRepos[repoInfo.toURLString()];
    if (repo) {
      fatal("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call.");
    }
    repo = new Repo(repoInfo, useRestClient, authTokenProvider, appCheckProvider);
    appRepos[repoInfo.toURLString()] = repo;
    return repo;
  }
  function getDatabase(app = getApp(), url) {
    const db = _getProvider(app, "database").getImmediate({
      identifier: url
    });
    if (!db._instanceStarted) {
      const emulator = getDefaultEmulatorHostnameAndPort("database");
      if (emulator) {
        connectDatabaseEmulator(db, ...emulator);
      }
    }
    return db;
  }
  function connectDatabaseEmulator(db, host, port, options = {}) {
    db = getModularInstance(db);
    db._checkNotDeleted("useEmulator");
    const hostAndPort = `${host}:${port}`;
    const repo = db._repoInternal;
    if (db._instanceStarted) {
      if (hostAndPort === db._repoInternal.repoInfo_.host && deepEqual(options, repo.repoInfo_.emulatorOptions)) {
        return;
      }
      fatal("connectDatabaseEmulator() cannot initialize or alter the emulator configuration after the database instance has started.");
    }
    let tokenProvider = void 0;
    if (repo.repoInfo_.nodeAdmin) {
      if (options.mockUserToken) {
        fatal('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".');
      }
      tokenProvider = new EmulatorTokenProvider(EmulatorTokenProvider.OWNER);
    } else if (options.mockUserToken) {
      const token = typeof options.mockUserToken === "string" ? options.mockUserToken : createMockUserToken(options.mockUserToken, db.app.options.projectId);
      tokenProvider = new EmulatorTokenProvider(token);
    }
    if (isCloudWorkstation(host)) {
      void pingServer(host);
    }
    repoManagerApplyEmulatorSettings(repo, hostAndPort, options, tokenProvider);
  }
  function registerDatabase(variant) {
    setSDKVersion(SDK_VERSION);
    _registerComponent(new Component(
      "database",
      (container, { instanceIdentifier: url }) => {
        const app = container.getProvider("app").getImmediate();
        const authProvider = container.getProvider("auth-internal");
        const appCheckProvider = container.getProvider("app-check-internal");
        return repoManagerDatabaseFromApp(app, authProvider, appCheckProvider, url);
      },
      "PUBLIC"
      /* ComponentType.PUBLIC */
    ).setMultipleInstances(true));
    registerVersion(name4, version4, variant);
    registerVersion(name4, version4, "esm2020");
  }
  function runTransaction(ref2, transactionUpdate, options) {
    ref2 = getModularInstance(ref2);
    validateWritablePath("Reference.transaction", ref2._path);
    if (ref2.key === ".length" || ref2.key === ".keys") {
      throw "Reference.transaction failed: " + ref2.key + " is a read-only object.";
    }
    const applyLocally = options?.applyLocally ?? true;
    const deferred = new Deferred();
    const promiseComplete = (error2, committed, node) => {
      let dataSnapshot = null;
      if (error2) {
        deferred.reject(error2);
      } else {
        dataSnapshot = new DataSnapshot(node, new ReferenceImpl(ref2._repo, ref2._path), PRIORITY_INDEX);
        deferred.resolve(new TransactionResult(committed, dataSnapshot));
      }
    };
    const unwatcher = onValue(ref2, () => {
    });
    repoStartTransaction(ref2._repo, ref2._path, transactionUpdate, promiseComplete, unwatcher, applyLocally);
    return deferred.promise;
  }
  var name4, version4, SDK_VERSION2, DOMStorageWrapper, MemoryStorage, createStoragefor, PersistentStorage, SessionStorage, logClient2, LUIDGenerator, sha1, buildLogMessage_, logger2, firstLog_, enableLogging$1, log, logWrapper, error, fatal, warn, warnIfPageIsSecure, isInvalidJSONNumber, executeWhenDOMReady, MIN_NAME, MAX_NAME, nameCompare, stringCompare, requireKey, ObjectToUniqueKey, splitStringBySize, doubleToIEEE754String, isChromeExtensionContentScript, isWindowsStoreApp, INTEGER_REGEXP_, INTEGER_32_MIN, INTEGER_32_MAX, tryParseInt, exceptionGuard, beingCrawled, setTimeoutNonBlocking, AppCheckTokenProvider, FirebaseAuthTokenProvider, EmulatorTokenProvider, PROTOCOL_VERSION, VERSION_PARAM, TRANSPORT_SESSION_PARAM, REFERER_PARAM, FORGE_REF, FORGE_DOMAIN_RE, LAST_SESSION_PARAM, APPLICATION_ID_PARAM, APP_CHECK_TOKEN_PARAM, WEBSOCKET, LONG_POLLING, RepoInfo, StatsCollection, collections, reporters, PacketReceiver, FIREBASE_LONGPOLL_START_PARAM, FIREBASE_LONGPOLL_CLOSE_COMMAND, FIREBASE_LONGPOLL_COMMAND_CB_NAME, FIREBASE_LONGPOLL_DATA_CB_NAME, FIREBASE_LONGPOLL_ID_PARAM, FIREBASE_LONGPOLL_PW_PARAM, FIREBASE_LONGPOLL_SERIAL_PARAM, FIREBASE_LONGPOLL_CALLBACK_ID_PARAM, FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM, FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET, FIREBASE_LONGPOLL_DATA_PARAM, FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM, MAX_URL_DATA_SIZE, SEG_HEADER_SIZE, MAX_PAYLOAD_SIZE, KEEPALIVE_REQUEST_INTERVAL, LP_CONNECT_TIMEOUT, BrowserPollConnection, FirebaseIFrameScriptHolder, WEBSOCKET_MAX_FRAME_SIZE, WEBSOCKET_KEEPALIVE_INTERVAL, WebSocketImpl, WebSocketConnection, TransportManager, UPGRADE_TIMEOUT, DELAY_BEFORE_SENDING_EXTRA_REQUESTS, BYTES_SENT_HEALTHY_OVERRIDE, BYTES_RECEIVED_HEALTHY_OVERRIDE, MESSAGE_TYPE, MESSAGE_DATA, CONTROL_SHUTDOWN, CONTROL_RESET, CONTROL_ERROR, CONTROL_PONG, SWITCH_ACK, END_TRANSMISSION, PING, SERVER_HELLO, Connection, ServerActions, EventEmitter, OnlineMonitor, MAX_PATH_DEPTH, MAX_PATH_LENGTH_BYTES, Path, ValidationPath, VisibilityMonitor, RECONNECT_MIN_DELAY, RECONNECT_MAX_DELAY_DEFAULT, RECONNECT_MAX_DELAY_FOR_ADMINS, RECONNECT_DELAY_MULTIPLIER, RECONNECT_DELAY_RESET_TIMEOUT, SERVER_KILL_INTERRUPT_REASON, INVALID_TOKEN_THRESHOLD, PersistentConnection, NamedNode, Index, __EMPTY_NODE, KeyIndex, KEY_INDEX, SortedMapIterator, LLRBNode, LLRBEmptyNode, SortedMap, MAX_NODE$2, priorityHashText, validatePriorityNode, __childrenNodeConstructor, LeafNode, nodeFromJSON$1, MAX_NODE$1, PriorityIndex, PRIORITY_INDEX, LOG_2, Base12Num, buildChildSet, _defaultIndexMap, fallbackObject, IndexMap, EMPTY_NODE, ChildrenNode, MaxNode, MAX_NODE, USE_HINZE, PathIndex, ValueIndex, VALUE_INDEX, IndexedFilter, RangedFilter, LimitedFilter, QueryParams, ReadonlyRestClient, SnapshotHolder, StatsListener, FIRST_STATS_MIN_TIME, FIRST_STATS_MAX_TIME, REPORT_STATS_INTERVAL, StatsReporter, OperationType2, AckUserWrite, ListenComplete, Overwrite, Merge, CacheNode, EventGenerator, emptyChildrenSingleton, EmptyChildren, ImmutableTree, CompoundWrite, ChildChangeAccumulator, NoCompleteChildSource_, NO_COMPLETE_CHILD_SOURCE, WriteTreeCompleteChildSource, View, referenceConstructor$1, SyncPoint, referenceConstructor, syncTreeNextQueryTag_, SyncTree, ExistingValueProvider, DeferredValueProvider, generateWithValues, resolveDeferredLeafValue, resolveScalarDeferredValue, resolveComplexDeferredValue, resolveDeferredValueTree, resolveDeferredValueSnapshot, Tree, INVALID_KEY_REGEX_, INVALID_PATH_REGEX_, MAX_LEAF_SIZE_, isValidKey2, isValidPathString, isValidRootPathString, isValidPriority, validateFirebaseDataArg, validateFirebaseData, validatePathString, validateRootPathString, validateWritablePath, validateUrl, EventQueue, INTERRUPT_REASON, MAX_TRANSACTION_RETRIES, Repo, parseRepoInfo, parseDatabaseURL, DataEvent, CancelEvent, CallbackContext, QueryImpl, ReferenceImpl, DataSnapshot, ValueEventRegistration, ChildEventRegistration, FIREBASE_DATABASE_EMULATOR_HOST_VAR, repos, useRestClient, Database, TransactionResult;
  var init_index_esm7 = __esm({
    "node_modules/@firebase/database/dist/index.esm.js"() {
      init_index_esm4();
      init_index_esm2();
      init_index_esm();
      init_index_esm3();
      name4 = "@firebase/database";
      version4 = "1.1.3";
      SDK_VERSION2 = "";
      DOMStorageWrapper = class {
        /**
         * @param domStorage_ - The underlying storage object (e.g. localStorage or sessionStorage)
         */
        constructor(domStorage_) {
          this.domStorage_ = domStorage_;
          this.prefix_ = "firebase:";
        }
        /**
         * @param key - The key to save the value under
         * @param value - The value being stored, or null to remove the key.
         */
        set(key, value) {
          if (value == null) {
            this.domStorage_.removeItem(this.prefixedName_(key));
          } else {
            this.domStorage_.setItem(this.prefixedName_(key), stringify(value));
          }
        }
        /**
         * @returns The value that was stored under this key, or null
         */
        get(key) {
          const storedVal = this.domStorage_.getItem(this.prefixedName_(key));
          if (storedVal == null) {
            return null;
          } else {
            return jsonEval(storedVal);
          }
        }
        remove(key) {
          this.domStorage_.removeItem(this.prefixedName_(key));
        }
        prefixedName_(name5) {
          return this.prefix_ + name5;
        }
        toString() {
          return this.domStorage_.toString();
        }
      };
      MemoryStorage = class {
        constructor() {
          this.cache_ = {};
          this.isInMemoryStorage = true;
        }
        set(key, value) {
          if (value == null) {
            delete this.cache_[key];
          } else {
            this.cache_[key] = value;
          }
        }
        get(key) {
          if (contains(this.cache_, key)) {
            return this.cache_[key];
          }
          return null;
        }
        remove(key) {
          delete this.cache_[key];
        }
      };
      createStoragefor = function(domStorageName) {
        try {
          if (typeof window !== "undefined" && typeof window[domStorageName] !== "undefined") {
            const domStorage = window[domStorageName];
            domStorage.setItem("firebase:sentinel", "cache");
            domStorage.removeItem("firebase:sentinel");
            return new DOMStorageWrapper(domStorage);
          }
        } catch (e) {
        }
        return new MemoryStorage();
      };
      PersistentStorage = createStoragefor("localStorage");
      SessionStorage = createStoragefor("sessionStorage");
      logClient2 = new Logger("@firebase/database");
      LUIDGenerator = /* @__PURE__ */ (function() {
        let id = 1;
        return function() {
          return id++;
        };
      })();
      sha1 = function(str) {
        const utf8Bytes = stringToByteArray(str);
        const sha12 = new Sha1();
        sha12.update(utf8Bytes);
        const sha1Bytes = sha12.digest();
        return base64.encodeByteArray(sha1Bytes);
      };
      buildLogMessage_ = function(...varArgs) {
        let message = "";
        for (let i = 0; i < varArgs.length; i++) {
          const arg = varArgs[i];
          if (Array.isArray(arg) || arg && typeof arg === "object" && // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeof arg.length === "number") {
            message += buildLogMessage_.apply(null, arg);
          } else if (typeof arg === "object") {
            message += stringify(arg);
          } else {
            message += arg;
          }
          message += " ";
        }
        return message;
      };
      logger2 = null;
      firstLog_ = true;
      enableLogging$1 = function(logger_, persistent) {
        assert(!persistent || logger_ === true || logger_ === false, "Can't turn on custom loggers persistently.");
        if (logger_ === true) {
          logClient2.logLevel = LogLevel.VERBOSE;
          logger2 = logClient2.log.bind(logClient2);
          if (persistent) {
            SessionStorage.set("logging_enabled", true);
          }
        } else if (typeof logger_ === "function") {
          logger2 = logger_;
        } else {
          logger2 = null;
          SessionStorage.remove("logging_enabled");
        }
      };
      log = function(...varArgs) {
        if (firstLog_ === true) {
          firstLog_ = false;
          if (logger2 === null && SessionStorage.get("logging_enabled") === true) {
            enableLogging$1(true);
          }
        }
        if (logger2) {
          const message = buildLogMessage_.apply(null, varArgs);
          logger2(message);
        }
      };
      logWrapper = function(prefix) {
        return function(...varArgs) {
          log(prefix, ...varArgs);
        };
      };
      error = function(...varArgs) {
        const message = "FIREBASE INTERNAL ERROR: " + buildLogMessage_(...varArgs);
        logClient2.error(message);
      };
      fatal = function(...varArgs) {
        const message = `FIREBASE FATAL ERROR: ${buildLogMessage_(...varArgs)}`;
        logClient2.error(message);
        throw new Error(message);
      };
      warn = function(...varArgs) {
        const message = "FIREBASE WARNING: " + buildLogMessage_(...varArgs);
        logClient2.warn(message);
      };
      warnIfPageIsSecure = function() {
        if (typeof window !== "undefined" && window.location && window.location.protocol && window.location.protocol.indexOf("https:") !== -1) {
          warn("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");
        }
      };
      isInvalidJSONNumber = function(data) {
        return typeof data === "number" && (data !== data || // NaN
        data === Number.POSITIVE_INFINITY || data === Number.NEGATIVE_INFINITY);
      };
      executeWhenDOMReady = function(fn) {
        if (isNodeSdk() || document.readyState === "complete") {
          fn();
        } else {
          let called = false;
          const wrappedFn = function() {
            if (!document.body) {
              setTimeout(wrappedFn, Math.floor(10));
              return;
            }
            if (!called) {
              called = true;
              fn();
            }
          };
          if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", wrappedFn, false);
            window.addEventListener("load", wrappedFn, false);
          } else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", () => {
              if (document.readyState === "complete") {
                wrappedFn();
              }
            });
            window.attachEvent("onload", wrappedFn);
          }
        }
      };
      MIN_NAME = "[MIN_NAME]";
      MAX_NAME = "[MAX_NAME]";
      nameCompare = function(a, b) {
        if (a === b) {
          return 0;
        } else if (a === MIN_NAME || b === MAX_NAME) {
          return -1;
        } else if (b === MIN_NAME || a === MAX_NAME) {
          return 1;
        } else {
          const aAsInt = tryParseInt(a), bAsInt = tryParseInt(b);
          if (aAsInt !== null) {
            if (bAsInt !== null) {
              return aAsInt - bAsInt === 0 ? a.length - b.length : aAsInt - bAsInt;
            } else {
              return -1;
            }
          } else if (bAsInt !== null) {
            return 1;
          } else {
            return a < b ? -1 : 1;
          }
        }
      };
      stringCompare = function(a, b) {
        if (a === b) {
          return 0;
        } else if (a < b) {
          return -1;
        } else {
          return 1;
        }
      };
      requireKey = function(key, obj) {
        if (obj && key in obj) {
          return obj[key];
        } else {
          throw new Error("Missing required key (" + key + ") in object: " + stringify(obj));
        }
      };
      ObjectToUniqueKey = function(obj) {
        if (typeof obj !== "object" || obj === null) {
          return stringify(obj);
        }
        const keys = [];
        for (const k in obj) {
          keys.push(k);
        }
        keys.sort();
        let key = "{";
        for (let i = 0; i < keys.length; i++) {
          if (i !== 0) {
            key += ",";
          }
          key += stringify(keys[i]);
          key += ":";
          key += ObjectToUniqueKey(obj[keys[i]]);
        }
        key += "}";
        return key;
      };
      splitStringBySize = function(str, segsize) {
        const len = str.length;
        if (len <= segsize) {
          return [str];
        }
        const dataSegs = [];
        for (let c = 0; c < len; c += segsize) {
          if (c + segsize > len) {
            dataSegs.push(str.substring(c, len));
          } else {
            dataSegs.push(str.substring(c, c + segsize));
          }
        }
        return dataSegs;
      };
      doubleToIEEE754String = function(v) {
        assert(!isInvalidJSONNumber(v), "Invalid JSON number");
        const ebits = 11, fbits = 52;
        const bias = (1 << ebits - 1) - 1;
        let s, e, f, ln, i;
        if (v === 0) {
          e = 0;
          f = 0;
          s = 1 / v === -Infinity ? 1 : 0;
        } else {
          s = v < 0;
          v = Math.abs(v);
          if (v >= Math.pow(2, 1 - bias)) {
            ln = Math.min(Math.floor(Math.log(v) / Math.LN2), bias);
            e = ln + bias;
            f = Math.round(v * Math.pow(2, fbits - ln) - Math.pow(2, fbits));
          } else {
            e = 0;
            f = Math.round(v / Math.pow(2, 1 - bias - fbits));
          }
        }
        const bits = [];
        for (i = fbits; i; i -= 1) {
          bits.push(f % 2 ? 1 : 0);
          f = Math.floor(f / 2);
        }
        for (i = ebits; i; i -= 1) {
          bits.push(e % 2 ? 1 : 0);
          e = Math.floor(e / 2);
        }
        bits.push(s ? 1 : 0);
        bits.reverse();
        const str = bits.join("");
        let hexByteString = "";
        for (i = 0; i < 64; i += 8) {
          let hexByte = parseInt(str.substr(i, 8), 2).toString(16);
          if (hexByte.length === 1) {
            hexByte = "0" + hexByte;
          }
          hexByteString = hexByteString + hexByte;
        }
        return hexByteString.toLowerCase();
      };
      isChromeExtensionContentScript = function() {
        return !!(typeof window === "object" && window["chrome"] && window["chrome"]["extension"] && !/^chrome/.test(window.location.href));
      };
      isWindowsStoreApp = function() {
        return typeof Windows === "object" && typeof Windows.UI === "object";
      };
      INTEGER_REGEXP_ = new RegExp("^-?(0*)\\d{1,10}$");
      INTEGER_32_MIN = -2147483648;
      INTEGER_32_MAX = 2147483647;
      tryParseInt = function(str) {
        if (INTEGER_REGEXP_.test(str)) {
          const intVal = Number(str);
          if (intVal >= INTEGER_32_MIN && intVal <= INTEGER_32_MAX) {
            return intVal;
          }
        }
        return null;
      };
      exceptionGuard = function(fn) {
        try {
          fn();
        } catch (e) {
          setTimeout(() => {
            const stack = e.stack || "";
            warn("Exception was thrown by user callback.", stack);
            throw e;
          }, Math.floor(0));
        }
      };
      beingCrawled = function() {
        const userAgent = typeof window === "object" && window["navigator"] && window["navigator"]["userAgent"] || "";
        return userAgent.search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i) >= 0;
      };
      setTimeoutNonBlocking = function(fn, time) {
        const timeout = setTimeout(fn, time);
        if (typeof timeout === "number" && // @ts-ignore Is only defined in Deno environments.
        typeof Deno !== "undefined" && // @ts-ignore Deno and unrefTimer are only defined in Deno environments.
        Deno["unrefTimer"]) {
          Deno.unrefTimer(timeout);
        } else if (typeof timeout === "object" && timeout["unref"]) {
          timeout["unref"]();
        }
        return timeout;
      };
      AppCheckTokenProvider = class {
        constructor(app, appCheckProvider) {
          this.appCheckProvider = appCheckProvider;
          this.appName = app.name;
          if (_isFirebaseServerApp(app) && app.settings.appCheckToken) {
            this.serverAppAppCheckToken = app.settings.appCheckToken;
          }
          this.appCheck = appCheckProvider?.getImmediate({ optional: true });
          if (!this.appCheck) {
            appCheckProvider?.get().then((appCheck) => this.appCheck = appCheck);
          }
        }
        getToken(forceRefresh) {
          if (this.serverAppAppCheckToken) {
            if (forceRefresh) {
              throw new Error("Attempted reuse of `FirebaseServerApp.appCheckToken` after previous usage failed.");
            }
            return Promise.resolve({ token: this.serverAppAppCheckToken });
          }
          if (!this.appCheck) {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                if (this.appCheck) {
                  this.getToken(forceRefresh).then(resolve, reject);
                } else {
                  resolve(null);
                }
              }, 0);
            });
          }
          return this.appCheck.getToken(forceRefresh);
        }
        addTokenChangeListener(listener) {
          this.appCheckProvider?.get().then((appCheck) => appCheck.addTokenListener(listener));
        }
        notifyForInvalidToken() {
          warn(`Provided AppCheck credentials for the app named "${this.appName}" are invalid. This usually indicates your app was not initialized correctly.`);
        }
      };
      FirebaseAuthTokenProvider = class {
        constructor(appName_, firebaseOptions_, authProvider_) {
          this.appName_ = appName_;
          this.firebaseOptions_ = firebaseOptions_;
          this.authProvider_ = authProvider_;
          this.auth_ = null;
          this.auth_ = authProvider_.getImmediate({ optional: true });
          if (!this.auth_) {
            authProvider_.onInit((auth) => this.auth_ = auth);
          }
        }
        getToken(forceRefresh) {
          if (!this.auth_) {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                if (this.auth_) {
                  this.getToken(forceRefresh).then(resolve, reject);
                } else {
                  resolve(null);
                }
              }, 0);
            });
          }
          return this.auth_.getToken(forceRefresh).catch((error2) => {
            if (error2 && error2.code === "auth/token-not-initialized") {
              log("Got auth/token-not-initialized error.  Treating as null token.");
              return null;
            } else {
              return Promise.reject(error2);
            }
          });
        }
        addTokenChangeListener(listener) {
          if (this.auth_) {
            this.auth_.addAuthTokenListener(listener);
          } else {
            this.authProvider_.get().then((auth) => auth.addAuthTokenListener(listener));
          }
        }
        removeTokenChangeListener(listener) {
          this.authProvider_.get().then((auth) => auth.removeAuthTokenListener(listener));
        }
        notifyForInvalidToken() {
          let errorMessage = 'Provided authentication credentials for the app named "' + this.appName_ + '" are invalid. This usually indicates your app was not initialized correctly. ';
          if ("credential" in this.firebaseOptions_) {
            errorMessage += 'Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.';
          } else if ("serviceAccount" in this.firebaseOptions_) {
            errorMessage += 'Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.';
          } else {
            errorMessage += 'Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.';
          }
          warn(errorMessage);
        }
      };
      EmulatorTokenProvider = class {
        constructor(accessToken) {
          this.accessToken = accessToken;
        }
        getToken(forceRefresh) {
          return Promise.resolve({
            accessToken: this.accessToken
          });
        }
        addTokenChangeListener(listener) {
          listener(this.accessToken);
        }
        removeTokenChangeListener(listener) {
        }
        notifyForInvalidToken() {
        }
      };
      EmulatorTokenProvider.OWNER = "owner";
      PROTOCOL_VERSION = "5";
      VERSION_PARAM = "v";
      TRANSPORT_SESSION_PARAM = "s";
      REFERER_PARAM = "r";
      FORGE_REF = "f";
      FORGE_DOMAIN_RE = /(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/;
      LAST_SESSION_PARAM = "ls";
      APPLICATION_ID_PARAM = "p";
      APP_CHECK_TOKEN_PARAM = "ac";
      WEBSOCKET = "websocket";
      LONG_POLLING = "long_polling";
      RepoInfo = class {
        /**
         * @param host - Hostname portion of the url for the repo
         * @param secure - Whether or not this repo is accessed over ssl
         * @param namespace - The namespace represented by the repo
         * @param webSocketOnly - Whether to prefer websockets over all other transports (used by Nest).
         * @param nodeAdmin - Whether this instance uses Admin SDK credentials
         * @param persistenceKey - Override the default session persistence storage key
         */
        constructor(host, secure, namespace, webSocketOnly, nodeAdmin = false, persistenceKey = "", includeNamespaceInQueryParams = false, isUsingEmulator = false, emulatorOptions = null) {
          this.secure = secure;
          this.namespace = namespace;
          this.webSocketOnly = webSocketOnly;
          this.nodeAdmin = nodeAdmin;
          this.persistenceKey = persistenceKey;
          this.includeNamespaceInQueryParams = includeNamespaceInQueryParams;
          this.isUsingEmulator = isUsingEmulator;
          this.emulatorOptions = emulatorOptions;
          this._host = host.toLowerCase();
          this._domain = this._host.substr(this._host.indexOf(".") + 1);
          this.internalHost = PersistentStorage.get("host:" + host) || this._host;
        }
        isCacheableHost() {
          return this.internalHost.substr(0, 2) === "s-";
        }
        isCustomHost() {
          return this._domain !== "firebaseio.com" && this._domain !== "firebaseio-demo.com";
        }
        get host() {
          return this._host;
        }
        set host(newHost) {
          if (newHost !== this.internalHost) {
            this.internalHost = newHost;
            if (this.isCacheableHost()) {
              PersistentStorage.set("host:" + this._host, this.internalHost);
            }
          }
        }
        toString() {
          let str = this.toURLString();
          if (this.persistenceKey) {
            str += "<" + this.persistenceKey + ">";
          }
          return str;
        }
        toURLString() {
          const protocol = this.secure ? "https://" : "http://";
          const query = this.includeNamespaceInQueryParams ? `?ns=${this.namespace}` : "";
          return `${protocol}${this.host}/${query}`;
        }
      };
      StatsCollection = class {
        constructor() {
          this.counters_ = {};
        }
        incrementCounter(name5, amount = 1) {
          if (!contains(this.counters_, name5)) {
            this.counters_[name5] = 0;
          }
          this.counters_[name5] += amount;
        }
        get() {
          return deepCopy(this.counters_);
        }
      };
      collections = {};
      reporters = {};
      PacketReceiver = class {
        /**
         * @param onMessage_
         */
        constructor(onMessage_) {
          this.onMessage_ = onMessage_;
          this.pendingResponses = [];
          this.currentResponseNum = 0;
          this.closeAfterResponse = -1;
          this.onClose = null;
        }
        closeAfter(responseNum, callback) {
          this.closeAfterResponse = responseNum;
          this.onClose = callback;
          if (this.closeAfterResponse < this.currentResponseNum) {
            this.onClose();
            this.onClose = null;
          }
        }
        /**
         * Each message from the server comes with a response number, and an array of data. The responseNumber
         * allows us to ensure that we process them in the right order, since we can't be guaranteed that all
         * browsers will respond in the same order as the requests we sent
         */
        handleResponse(requestNum, data) {
          this.pendingResponses[requestNum] = data;
          while (this.pendingResponses[this.currentResponseNum]) {
            const toProcess = this.pendingResponses[this.currentResponseNum];
            delete this.pendingResponses[this.currentResponseNum];
            for (let i = 0; i < toProcess.length; ++i) {
              if (toProcess[i]) {
                exceptionGuard(() => {
                  this.onMessage_(toProcess[i]);
                });
              }
            }
            if (this.currentResponseNum === this.closeAfterResponse) {
              if (this.onClose) {
                this.onClose();
                this.onClose = null;
              }
              break;
            }
            this.currentResponseNum++;
          }
        }
      };
      FIREBASE_LONGPOLL_START_PARAM = "start";
      FIREBASE_LONGPOLL_CLOSE_COMMAND = "close";
      FIREBASE_LONGPOLL_COMMAND_CB_NAME = "pLPCommand";
      FIREBASE_LONGPOLL_DATA_CB_NAME = "pRTLPCB";
      FIREBASE_LONGPOLL_ID_PARAM = "id";
      FIREBASE_LONGPOLL_PW_PARAM = "pw";
      FIREBASE_LONGPOLL_SERIAL_PARAM = "ser";
      FIREBASE_LONGPOLL_CALLBACK_ID_PARAM = "cb";
      FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM = "seg";
      FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET = "ts";
      FIREBASE_LONGPOLL_DATA_PARAM = "d";
      FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM = "dframe";
      MAX_URL_DATA_SIZE = 1870;
      SEG_HEADER_SIZE = 30;
      MAX_PAYLOAD_SIZE = MAX_URL_DATA_SIZE - SEG_HEADER_SIZE;
      KEEPALIVE_REQUEST_INTERVAL = 25e3;
      LP_CONNECT_TIMEOUT = 3e4;
      BrowserPollConnection = class _BrowserPollConnection {
        /**
         * @param connId An identifier for this connection, used for logging
         * @param repoInfo The info for the endpoint to send data to.
         * @param applicationId The Firebase App ID for this project.
         * @param appCheckToken The AppCheck token for this client.
         * @param authToken The AuthToken to use for this connection.
         * @param transportSessionId Optional transportSessionid if we are
         * reconnecting for an existing transport session
         * @param lastSessionId Optional lastSessionId if the PersistentConnection has
         * already created a connection previously
         */
        constructor(connId, repoInfo, applicationId, appCheckToken, authToken, transportSessionId, lastSessionId) {
          this.connId = connId;
          this.repoInfo = repoInfo;
          this.applicationId = applicationId;
          this.appCheckToken = appCheckToken;
          this.authToken = authToken;
          this.transportSessionId = transportSessionId;
          this.lastSessionId = lastSessionId;
          this.bytesSent = 0;
          this.bytesReceived = 0;
          this.everConnected_ = false;
          this.log_ = logWrapper(connId);
          this.stats_ = statsManagerGetCollection(repoInfo);
          this.urlFn = (params) => {
            if (this.appCheckToken) {
              params[APP_CHECK_TOKEN_PARAM] = this.appCheckToken;
            }
            return repoInfoConnectionURL(repoInfo, LONG_POLLING, params);
          };
        }
        /**
         * @param onMessage - Callback when messages arrive
         * @param onDisconnect - Callback with connection lost.
         */
        open(onMessage, onDisconnect) {
          this.curSegmentNum = 0;
          this.onDisconnect_ = onDisconnect;
          this.myPacketOrderer = new PacketReceiver(onMessage);
          this.isClosed_ = false;
          this.connectTimeoutTimer_ = setTimeout(() => {
            this.log_("Timed out trying to connect.");
            this.onClosed_();
            this.connectTimeoutTimer_ = null;
          }, Math.floor(LP_CONNECT_TIMEOUT));
          executeWhenDOMReady(() => {
            if (this.isClosed_) {
              return;
            }
            this.scriptTagHolder = new FirebaseIFrameScriptHolder((...args) => {
              const [command, arg1, arg2, arg3, arg4] = args;
              this.incrementIncomingBytes_(args);
              if (!this.scriptTagHolder) {
                return;
              }
              if (this.connectTimeoutTimer_) {
                clearTimeout(this.connectTimeoutTimer_);
                this.connectTimeoutTimer_ = null;
              }
              this.everConnected_ = true;
              if (command === FIREBASE_LONGPOLL_START_PARAM) {
                this.id = arg1;
                this.password = arg2;
              } else if (command === FIREBASE_LONGPOLL_CLOSE_COMMAND) {
                if (arg1) {
                  this.scriptTagHolder.sendNewPolls = false;
                  this.myPacketOrderer.closeAfter(arg1, () => {
                    this.onClosed_();
                  });
                } else {
                  this.onClosed_();
                }
              } else {
                throw new Error("Unrecognized command received: " + command);
              }
            }, (...args) => {
              const [pN, data] = args;
              this.incrementIncomingBytes_(args);
              this.myPacketOrderer.handleResponse(pN, data);
            }, () => {
              this.onClosed_();
            }, this.urlFn);
            const urlParams = {};
            urlParams[FIREBASE_LONGPOLL_START_PARAM] = "t";
            urlParams[FIREBASE_LONGPOLL_SERIAL_PARAM] = Math.floor(Math.random() * 1e8);
            if (this.scriptTagHolder.uniqueCallbackIdentifier) {
              urlParams[FIREBASE_LONGPOLL_CALLBACK_ID_PARAM] = this.scriptTagHolder.uniqueCallbackIdentifier;
            }
            urlParams[VERSION_PARAM] = PROTOCOL_VERSION;
            if (this.transportSessionId) {
              urlParams[TRANSPORT_SESSION_PARAM] = this.transportSessionId;
            }
            if (this.lastSessionId) {
              urlParams[LAST_SESSION_PARAM] = this.lastSessionId;
            }
            if (this.applicationId) {
              urlParams[APPLICATION_ID_PARAM] = this.applicationId;
            }
            if (this.appCheckToken) {
              urlParams[APP_CHECK_TOKEN_PARAM] = this.appCheckToken;
            }
            if (typeof location !== "undefined" && location.hostname && FORGE_DOMAIN_RE.test(location.hostname)) {
              urlParams[REFERER_PARAM] = FORGE_REF;
            }
            const connectURL = this.urlFn(urlParams);
            this.log_("Connecting via long-poll to " + connectURL);
            this.scriptTagHolder.addTag(connectURL, () => {
            });
          });
        }
        /**
         * Call this when a handshake has completed successfully and we want to consider the connection established
         */
        start() {
          this.scriptTagHolder.startLongPoll(this.id, this.password);
          this.addDisconnectPingFrame(this.id, this.password);
        }
        /**
         * Forces long polling to be considered as a potential transport
         */
        static forceAllow() {
          _BrowserPollConnection.forceAllow_ = true;
        }
        /**
         * Forces longpolling to not be considered as a potential transport
         */
        static forceDisallow() {
          _BrowserPollConnection.forceDisallow_ = true;
        }
        // Static method, use string literal so it can be accessed in a generic way
        static isAvailable() {
          if (isNodeSdk()) {
            return false;
          } else if (_BrowserPollConnection.forceAllow_) {
            return true;
          } else {
            return !_BrowserPollConnection.forceDisallow_ && typeof document !== "undefined" && document.createElement != null && !isChromeExtensionContentScript() && !isWindowsStoreApp();
          }
        }
        /**
         * No-op for polling
         */
        markConnectionHealthy() {
        }
        /**
         * Stops polling and cleans up the iframe
         */
        shutdown_() {
          this.isClosed_ = true;
          if (this.scriptTagHolder) {
            this.scriptTagHolder.close();
            this.scriptTagHolder = null;
          }
          if (this.myDisconnFrame) {
            document.body.removeChild(this.myDisconnFrame);
            this.myDisconnFrame = null;
          }
          if (this.connectTimeoutTimer_) {
            clearTimeout(this.connectTimeoutTimer_);
            this.connectTimeoutTimer_ = null;
          }
        }
        /**
         * Triggered when this transport is closed
         */
        onClosed_() {
          if (!this.isClosed_) {
            this.log_("Longpoll is closing itself");
            this.shutdown_();
            if (this.onDisconnect_) {
              this.onDisconnect_(this.everConnected_);
              this.onDisconnect_ = null;
            }
          }
        }
        /**
         * External-facing close handler. RealTime has requested we shut down. Kill our connection and tell the server
         * that we've left.
         */
        close() {
          if (!this.isClosed_) {
            this.log_("Longpoll is being closed.");
            this.shutdown_();
          }
        }
        /**
         * Send the JSON object down to the server. It will need to be stringified, base64 encoded, and then
         * broken into chunks (since URLs have a small maximum length).
         * @param data - The JSON data to transmit.
         */
        send(data) {
          const dataStr = stringify(data);
          this.bytesSent += dataStr.length;
          this.stats_.incrementCounter("bytes_sent", dataStr.length);
          const base64data = base64Encode(dataStr);
          const dataSegs = splitStringBySize(base64data, MAX_PAYLOAD_SIZE);
          for (let i = 0; i < dataSegs.length; i++) {
            this.scriptTagHolder.enqueueSegment(this.curSegmentNum, dataSegs.length, dataSegs[i]);
            this.curSegmentNum++;
          }
        }
        /**
         * This is how we notify the server that we're leaving.
         * We aren't able to send requests with DHTML on a window close event, but we can
         * trigger XHR requests in some browsers (everything but Opera basically).
         */
        addDisconnectPingFrame(id, pw) {
          if (isNodeSdk()) {
            return;
          }
          this.myDisconnFrame = document.createElement("iframe");
          const urlParams = {};
          urlParams[FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM] = "t";
          urlParams[FIREBASE_LONGPOLL_ID_PARAM] = id;
          urlParams[FIREBASE_LONGPOLL_PW_PARAM] = pw;
          this.myDisconnFrame.src = this.urlFn(urlParams);
          this.myDisconnFrame.style.display = "none";
          document.body.appendChild(this.myDisconnFrame);
        }
        /**
         * Used to track the bytes received by this client
         */
        incrementIncomingBytes_(args) {
          const bytesReceived = stringify(args).length;
          this.bytesReceived += bytesReceived;
          this.stats_.incrementCounter("bytes_received", bytesReceived);
        }
      };
      FirebaseIFrameScriptHolder = class _FirebaseIFrameScriptHolder {
        /**
         * @param commandCB - The callback to be called when control commands are received from the server.
         * @param onMessageCB - The callback to be triggered when responses arrive from the server.
         * @param onDisconnect - The callback to be triggered when this tag holder is closed
         * @param urlFn - A function that provides the URL of the endpoint to send data to.
         */
        constructor(commandCB, onMessageCB, onDisconnect, urlFn) {
          this.onDisconnect = onDisconnect;
          this.urlFn = urlFn;
          this.outstandingRequests = /* @__PURE__ */ new Set();
          this.pendingSegs = [];
          this.currentSerial = Math.floor(Math.random() * 1e8);
          this.sendNewPolls = true;
          if (!isNodeSdk()) {
            this.uniqueCallbackIdentifier = LUIDGenerator();
            window[FIREBASE_LONGPOLL_COMMAND_CB_NAME + this.uniqueCallbackIdentifier] = commandCB;
            window[FIREBASE_LONGPOLL_DATA_CB_NAME + this.uniqueCallbackIdentifier] = onMessageCB;
            this.myIFrame = _FirebaseIFrameScriptHolder.createIFrame_();
            let script = "";
            if (this.myIFrame.src && this.myIFrame.src.substr(0, "javascript:".length) === "javascript:") {
              const currentDomain = document.domain;
              script = '<script>document.domain="' + currentDomain + '";<\/script>';
            }
            const iframeContents = "<html><body>" + script + "</body></html>";
            try {
              this.myIFrame.doc.open();
              this.myIFrame.doc.write(iframeContents);
              this.myIFrame.doc.close();
            } catch (e) {
              log("frame writing exception");
              if (e.stack) {
                log(e.stack);
              }
              log(e);
            }
          } else {
            this.commandCB = commandCB;
            this.onMessageCB = onMessageCB;
          }
        }
        /**
         * Each browser has its own funny way to handle iframes. Here we mush them all together into one object that I can
         * actually use.
         */
        static createIFrame_() {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          if (document.body) {
            document.body.appendChild(iframe);
            try {
              const a = iframe.contentWindow.document;
              if (!a) {
                log("No IE domain setting required");
              }
            } catch (e) {
              const domain = document.domain;
              iframe.src = "javascript:void((function(){document.open();document.domain='" + domain + "';document.close();})())";
            }
          } else {
            throw "Document body has not initialized. Wait to initialize Firebase until after the document is ready.";
          }
          if (iframe.contentDocument) {
            iframe.doc = iframe.contentDocument;
          } else if (iframe.contentWindow) {
            iframe.doc = iframe.contentWindow.document;
          } else if (iframe.document) {
            iframe.doc = iframe.document;
          }
          return iframe;
        }
        /**
         * Cancel all outstanding queries and remove the frame.
         */
        close() {
          this.alive = false;
          if (this.myIFrame) {
            this.myIFrame.doc.body.textContent = "";
            setTimeout(() => {
              if (this.myIFrame !== null) {
                document.body.removeChild(this.myIFrame);
                this.myIFrame = null;
              }
            }, Math.floor(0));
          }
          const onDisconnect = this.onDisconnect;
          if (onDisconnect) {
            this.onDisconnect = null;
            onDisconnect();
          }
        }
        /**
         * Actually start the long-polling session by adding the first script tag(s) to the iframe.
         * @param id - The ID of this connection
         * @param pw - The password for this connection
         */
        startLongPoll(id, pw) {
          this.myID = id;
          this.myPW = pw;
          this.alive = true;
          while (this.newRequest_()) {
          }
        }
        /**
         * This is called any time someone might want a script tag to be added. It adds a script tag when there aren't
         * too many outstanding requests and we are still alive.
         *
         * If there are outstanding packet segments to send, it sends one. If there aren't, it sends a long-poll anyways if
         * needed.
         */
        newRequest_() {
          if (this.alive && this.sendNewPolls && this.outstandingRequests.size < (this.pendingSegs.length > 0 ? 2 : 1)) {
            this.currentSerial++;
            const urlParams = {};
            urlParams[FIREBASE_LONGPOLL_ID_PARAM] = this.myID;
            urlParams[FIREBASE_LONGPOLL_PW_PARAM] = this.myPW;
            urlParams[FIREBASE_LONGPOLL_SERIAL_PARAM] = this.currentSerial;
            let theURL = this.urlFn(urlParams);
            let curDataString = "";
            let i = 0;
            while (this.pendingSegs.length > 0) {
              const nextSeg = this.pendingSegs[0];
              if (nextSeg.d.length + SEG_HEADER_SIZE + curDataString.length <= MAX_URL_DATA_SIZE) {
                const theSeg = this.pendingSegs.shift();
                curDataString = curDataString + "&" + FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM + i + "=" + theSeg.seg + "&" + FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET + i + "=" + theSeg.ts + "&" + FIREBASE_LONGPOLL_DATA_PARAM + i + "=" + theSeg.d;
                i++;
              } else {
                break;
              }
            }
            theURL = theURL + curDataString;
            this.addLongPollTag_(theURL, this.currentSerial);
            return true;
          } else {
            return false;
          }
        }
        /**
         * Queue a packet for transmission to the server.
         * @param segnum - A sequential id for this packet segment used for reassembly
         * @param totalsegs - The total number of segments in this packet
         * @param data - The data for this segment.
         */
        enqueueSegment(segnum, totalsegs, data) {
          this.pendingSegs.push({ seg: segnum, ts: totalsegs, d: data });
          if (this.alive) {
            this.newRequest_();
          }
        }
        /**
         * Add a script tag for a regular long-poll request.
         * @param url - The URL of the script tag.
         * @param serial - The serial number of the request.
         */
        addLongPollTag_(url, serial) {
          this.outstandingRequests.add(serial);
          const doNewRequest = () => {
            this.outstandingRequests.delete(serial);
            this.newRequest_();
          };
          const keepaliveTimeout = setTimeout(doNewRequest, Math.floor(KEEPALIVE_REQUEST_INTERVAL));
          const readyStateCB = () => {
            clearTimeout(keepaliveTimeout);
            doNewRequest();
          };
          this.addTag(url, readyStateCB);
        }
        /**
         * Add an arbitrary script tag to the iframe.
         * @param url - The URL for the script tag source.
         * @param loadCB - A callback to be triggered once the script has loaded.
         */
        addTag(url, loadCB) {
          if (isNodeSdk()) {
            this.doNodeLongPoll(url, loadCB);
          } else {
            setTimeout(() => {
              try {
                if (!this.sendNewPolls) {
                  return;
                }
                const newScript = this.myIFrame.doc.createElement("script");
                newScript.type = "text/javascript";
                newScript.async = true;
                newScript.src = url;
                newScript.onload = newScript.onreadystatechange = function() {
                  const rstate = newScript.readyState;
                  if (!rstate || rstate === "loaded" || rstate === "complete") {
                    newScript.onload = newScript.onreadystatechange = null;
                    if (newScript.parentNode) {
                      newScript.parentNode.removeChild(newScript);
                    }
                    loadCB();
                  }
                };
                newScript.onerror = () => {
                  log("Long-poll script failed to load: " + url);
                  this.sendNewPolls = false;
                  this.close();
                };
                this.myIFrame.doc.body.appendChild(newScript);
              } catch (e) {
              }
            }, Math.floor(1));
          }
        }
      };
      WEBSOCKET_MAX_FRAME_SIZE = 16384;
      WEBSOCKET_KEEPALIVE_INTERVAL = 45e3;
      WebSocketImpl = null;
      if (typeof MozWebSocket !== "undefined") {
        WebSocketImpl = MozWebSocket;
      } else if (typeof WebSocket !== "undefined") {
        WebSocketImpl = WebSocket;
      }
      WebSocketConnection = class _WebSocketConnection {
        /**
         * @param connId identifier for this transport
         * @param repoInfo The info for the websocket endpoint.
         * @param applicationId The Firebase App ID for this project.
         * @param appCheckToken The App Check Token for this client.
         * @param authToken The Auth Token for this client.
         * @param transportSessionId Optional transportSessionId if this is connecting
         * to an existing transport session
         * @param lastSessionId Optional lastSessionId if there was a previous
         * connection
         */
        constructor(connId, repoInfo, applicationId, appCheckToken, authToken, transportSessionId, lastSessionId) {
          this.connId = connId;
          this.applicationId = applicationId;
          this.appCheckToken = appCheckToken;
          this.authToken = authToken;
          this.keepaliveTimer = null;
          this.frames = null;
          this.totalFrames = 0;
          this.bytesSent = 0;
          this.bytesReceived = 0;
          this.log_ = logWrapper(this.connId);
          this.stats_ = statsManagerGetCollection(repoInfo);
          this.connURL = _WebSocketConnection.connectionURL_(repoInfo, transportSessionId, lastSessionId, appCheckToken, applicationId);
          this.nodeAdmin = repoInfo.nodeAdmin;
        }
        /**
         * @param repoInfo - The info for the websocket endpoint.
         * @param transportSessionId - Optional transportSessionId if this is connecting to an existing transport
         *                                         session
         * @param lastSessionId - Optional lastSessionId if there was a previous connection
         * @returns connection url
         */
        static connectionURL_(repoInfo, transportSessionId, lastSessionId, appCheckToken, applicationId) {
          const urlParams = {};
          urlParams[VERSION_PARAM] = PROTOCOL_VERSION;
          if (!isNodeSdk() && typeof location !== "undefined" && location.hostname && FORGE_DOMAIN_RE.test(location.hostname)) {
            urlParams[REFERER_PARAM] = FORGE_REF;
          }
          if (transportSessionId) {
            urlParams[TRANSPORT_SESSION_PARAM] = transportSessionId;
          }
          if (lastSessionId) {
            urlParams[LAST_SESSION_PARAM] = lastSessionId;
          }
          if (appCheckToken) {
            urlParams[APP_CHECK_TOKEN_PARAM] = appCheckToken;
          }
          if (applicationId) {
            urlParams[APPLICATION_ID_PARAM] = applicationId;
          }
          return repoInfoConnectionURL(repoInfo, WEBSOCKET, urlParams);
        }
        /**
         * @param onMessage - Callback when messages arrive
         * @param onDisconnect - Callback with connection lost.
         */
        open(onMessage, onDisconnect) {
          this.onDisconnect = onDisconnect;
          this.onMessage = onMessage;
          this.log_("Websocket connecting to " + this.connURL);
          this.everConnected_ = false;
          PersistentStorage.set("previous_websocket_failure", true);
          try {
            let options;
            if (isNodeSdk()) {
              const device = this.nodeAdmin ? "AdminNode" : "Node";
              options = {
                headers: {
                  "User-Agent": `Firebase/${PROTOCOL_VERSION}/${SDK_VERSION2}/${process.platform}/${device}`,
                  "X-Firebase-GMPID": this.applicationId || ""
                }
              };
              if (this.authToken) {
                options.headers["Authorization"] = `Bearer ${this.authToken}`;
              }
              if (this.appCheckToken) {
                options.headers["X-Firebase-AppCheck"] = this.appCheckToken;
              }
              const env = process["env"];
              const proxy = this.connURL.indexOf("wss://") === 0 ? env["HTTPS_PROXY"] || env["https_proxy"] : env["HTTP_PROXY"] || env["http_proxy"];
              if (proxy) {
                options["proxy"] = { origin: proxy };
              }
            }
            this.mySock = new WebSocketImpl(this.connURL, [], options);
          } catch (e) {
            this.log_("Error instantiating WebSocket.");
            const error2 = e.message || e.data;
            if (error2) {
              this.log_(error2);
            }
            this.onClosed_();
            return;
          }
          this.mySock.onopen = () => {
            this.log_("Websocket connected.");
            this.everConnected_ = true;
          };
          this.mySock.onclose = () => {
            this.log_("Websocket connection was disconnected.");
            this.mySock = null;
            this.onClosed_();
          };
          this.mySock.onmessage = (m) => {
            this.handleIncomingFrame(m);
          };
          this.mySock.onerror = (e) => {
            this.log_("WebSocket error.  Closing connection.");
            const error2 = e.message || e.data;
            if (error2) {
              this.log_(error2);
            }
            this.onClosed_();
          };
        }
        /**
         * No-op for websockets, we don't need to do anything once the connection is confirmed as open
         */
        start() {
        }
        static forceDisallow() {
          _WebSocketConnection.forceDisallow_ = true;
        }
        static isAvailable() {
          let isOldAndroid = false;
          if (typeof navigator !== "undefined" && navigator.userAgent) {
            const oldAndroidRegex = /Android ([0-9]{0,}\.[0-9]{0,})/;
            const oldAndroidMatch = navigator.userAgent.match(oldAndroidRegex);
            if (oldAndroidMatch && oldAndroidMatch.length > 1) {
              if (parseFloat(oldAndroidMatch[1]) < 4.4) {
                isOldAndroid = true;
              }
            }
          }
          return !isOldAndroid && WebSocketImpl !== null && !_WebSocketConnection.forceDisallow_;
        }
        /**
         * Returns true if we previously failed to connect with this transport.
         */
        static previouslyFailed() {
          return PersistentStorage.isInMemoryStorage || PersistentStorage.get("previous_websocket_failure") === true;
        }
        markConnectionHealthy() {
          PersistentStorage.remove("previous_websocket_failure");
        }
        appendFrame_(data) {
          this.frames.push(data);
          if (this.frames.length === this.totalFrames) {
            const fullMess = this.frames.join("");
            this.frames = null;
            const jsonMess = jsonEval(fullMess);
            this.onMessage(jsonMess);
          }
        }
        /**
         * @param frameCount - The number of frames we are expecting from the server
         */
        handleNewFrameCount_(frameCount) {
          this.totalFrames = frameCount;
          this.frames = [];
        }
        /**
         * Attempts to parse a frame count out of some text. If it can't, assumes a value of 1
         * @returns Any remaining data to be process, or null if there is none
         */
        extractFrameCount_(data) {
          assert(this.frames === null, "We already have a frame buffer");
          if (data.length <= 6) {
            const frameCount = Number(data);
            if (!isNaN(frameCount)) {
              this.handleNewFrameCount_(frameCount);
              return null;
            }
          }
          this.handleNewFrameCount_(1);
          return data;
        }
        /**
         * Process a websocket frame that has arrived from the server.
         * @param mess - The frame data
         */
        handleIncomingFrame(mess) {
          if (this.mySock === null) {
            return;
          }
          const data = mess["data"];
          this.bytesReceived += data.length;
          this.stats_.incrementCounter("bytes_received", data.length);
          this.resetKeepAlive();
          if (this.frames !== null) {
            this.appendFrame_(data);
          } else {
            const remainingData = this.extractFrameCount_(data);
            if (remainingData !== null) {
              this.appendFrame_(remainingData);
            }
          }
        }
        /**
         * Send a message to the server
         * @param data - The JSON object to transmit
         */
        send(data) {
          this.resetKeepAlive();
          const dataStr = stringify(data);
          this.bytesSent += dataStr.length;
          this.stats_.incrementCounter("bytes_sent", dataStr.length);
          const dataSegs = splitStringBySize(dataStr, WEBSOCKET_MAX_FRAME_SIZE);
          if (dataSegs.length > 1) {
            this.sendString_(String(dataSegs.length));
          }
          for (let i = 0; i < dataSegs.length; i++) {
            this.sendString_(dataSegs[i]);
          }
        }
        shutdown_() {
          this.isClosed_ = true;
          if (this.keepaliveTimer) {
            clearInterval(this.keepaliveTimer);
            this.keepaliveTimer = null;
          }
          if (this.mySock) {
            this.mySock.close();
            this.mySock = null;
          }
        }
        onClosed_() {
          if (!this.isClosed_) {
            this.log_("WebSocket is closing itself");
            this.shutdown_();
            if (this.onDisconnect) {
              this.onDisconnect(this.everConnected_);
              this.onDisconnect = null;
            }
          }
        }
        /**
         * External-facing close handler.
         * Close the websocket and kill the connection.
         */
        close() {
          if (!this.isClosed_) {
            this.log_("WebSocket is being closed");
            this.shutdown_();
          }
        }
        /**
         * Kill the current keepalive timer and start a new one, to ensure that it always fires N seconds after
         * the last activity.
         */
        resetKeepAlive() {
          clearInterval(this.keepaliveTimer);
          this.keepaliveTimer = setInterval(() => {
            if (this.mySock) {
              this.sendString_("0");
            }
            this.resetKeepAlive();
          }, Math.floor(WEBSOCKET_KEEPALIVE_INTERVAL));
        }
        /**
         * Send a string over the websocket.
         *
         * @param str - String to send.
         */
        sendString_(str) {
          try {
            this.mySock.send(str);
          } catch (e) {
            this.log_("Exception thrown from WebSocket.send():", e.message || e.data, "Closing connection.");
            setTimeout(this.onClosed_.bind(this), 0);
          }
        }
      };
      WebSocketConnection.responsesRequiredToBeHealthy = 2;
      WebSocketConnection.healthyTimeout = 3e4;
      TransportManager = class _TransportManager {
        static get ALL_TRANSPORTS() {
          return [BrowserPollConnection, WebSocketConnection];
        }
        /**
         * Returns whether transport has been selected to ensure WebSocketConnection or BrowserPollConnection are not called after
         * TransportManager has already set up transports_
         */
        static get IS_TRANSPORT_INITIALIZED() {
          return this.globalTransportInitialized_;
        }
        /**
         * @param repoInfo - Metadata around the namespace we're connecting to
         */
        constructor(repoInfo) {
          this.initTransports_(repoInfo);
        }
        initTransports_(repoInfo) {
          const isWebSocketsAvailable = WebSocketConnection && WebSocketConnection["isAvailable"]();
          let isSkipPollConnection = isWebSocketsAvailable && !WebSocketConnection.previouslyFailed();
          if (repoInfo.webSocketOnly) {
            if (!isWebSocketsAvailable) {
              warn("wss:// URL used, but browser isn't known to support websockets.  Trying anyway.");
            }
            isSkipPollConnection = true;
          }
          if (isSkipPollConnection) {
            this.transports_ = [WebSocketConnection];
          } else {
            const transports = this.transports_ = [];
            for (const transport of _TransportManager.ALL_TRANSPORTS) {
              if (transport && transport["isAvailable"]()) {
                transports.push(transport);
              }
            }
            _TransportManager.globalTransportInitialized_ = true;
          }
        }
        /**
         * @returns The constructor for the initial transport to use
         */
        initialTransport() {
          if (this.transports_.length > 0) {
            return this.transports_[0];
          } else {
            throw new Error("No transports available");
          }
        }
        /**
         * @returns The constructor for the next transport, or null
         */
        upgradeTransport() {
          if (this.transports_.length > 1) {
            return this.transports_[1];
          } else {
            return null;
          }
        }
      };
      TransportManager.globalTransportInitialized_ = false;
      UPGRADE_TIMEOUT = 6e4;
      DELAY_BEFORE_SENDING_EXTRA_REQUESTS = 5e3;
      BYTES_SENT_HEALTHY_OVERRIDE = 10 * 1024;
      BYTES_RECEIVED_HEALTHY_OVERRIDE = 100 * 1024;
      MESSAGE_TYPE = "t";
      MESSAGE_DATA = "d";
      CONTROL_SHUTDOWN = "s";
      CONTROL_RESET = "r";
      CONTROL_ERROR = "e";
      CONTROL_PONG = "o";
      SWITCH_ACK = "a";
      END_TRANSMISSION = "n";
      PING = "p";
      SERVER_HELLO = "h";
      Connection = class {
        /**
         * @param id - an id for this connection
         * @param repoInfo_ - the info for the endpoint to connect to
         * @param applicationId_ - the Firebase App ID for this project
         * @param appCheckToken_ - The App Check Token for this device.
         * @param authToken_ - The auth token for this session.
         * @param onMessage_ - the callback to be triggered when a server-push message arrives
         * @param onReady_ - the callback to be triggered when this connection is ready to send messages.
         * @param onDisconnect_ - the callback to be triggered when a connection was lost
         * @param onKill_ - the callback to be triggered when this connection has permanently shut down.
         * @param lastSessionId - last session id in persistent connection. is used to clean up old session in real-time server
         */
        constructor(id, repoInfo_, applicationId_, appCheckToken_, authToken_, onMessage_, onReady_, onDisconnect_, onKill_, lastSessionId) {
          this.id = id;
          this.repoInfo_ = repoInfo_;
          this.applicationId_ = applicationId_;
          this.appCheckToken_ = appCheckToken_;
          this.authToken_ = authToken_;
          this.onMessage_ = onMessage_;
          this.onReady_ = onReady_;
          this.onDisconnect_ = onDisconnect_;
          this.onKill_ = onKill_;
          this.lastSessionId = lastSessionId;
          this.connectionCount = 0;
          this.pendingDataMessages = [];
          this.state_ = 0;
          this.log_ = logWrapper("c:" + this.id + ":");
          this.transportManager_ = new TransportManager(repoInfo_);
          this.log_("Connection created");
          this.start_();
        }
        /**
         * Starts a connection attempt
         */
        start_() {
          const conn = this.transportManager_.initialTransport();
          this.conn_ = new conn(this.nextTransportId_(), this.repoInfo_, this.applicationId_, this.appCheckToken_, this.authToken_, null, this.lastSessionId);
          this.primaryResponsesRequired_ = conn["responsesRequiredToBeHealthy"] || 0;
          const onMessageReceived = this.connReceiver_(this.conn_);
          const onConnectionLost = this.disconnReceiver_(this.conn_);
          this.tx_ = this.conn_;
          this.rx_ = this.conn_;
          this.secondaryConn_ = null;
          this.isHealthy_ = false;
          setTimeout(() => {
            this.conn_ && this.conn_.open(onMessageReceived, onConnectionLost);
          }, Math.floor(0));
          const healthyTimeoutMS = conn["healthyTimeout"] || 0;
          if (healthyTimeoutMS > 0) {
            this.healthyTimeout_ = setTimeoutNonBlocking(() => {
              this.healthyTimeout_ = null;
              if (!this.isHealthy_) {
                if (this.conn_ && this.conn_.bytesReceived > BYTES_RECEIVED_HEALTHY_OVERRIDE) {
                  this.log_("Connection exceeded healthy timeout but has received " + this.conn_.bytesReceived + " bytes.  Marking connection healthy.");
                  this.isHealthy_ = true;
                  this.conn_.markConnectionHealthy();
                } else if (this.conn_ && this.conn_.bytesSent > BYTES_SENT_HEALTHY_OVERRIDE) {
                  this.log_("Connection exceeded healthy timeout but has sent " + this.conn_.bytesSent + " bytes.  Leaving connection alive.");
                } else {
                  this.log_("Closing unhealthy connection after timeout.");
                  this.close();
                }
              }
            }, Math.floor(healthyTimeoutMS));
          }
        }
        nextTransportId_() {
          return "c:" + this.id + ":" + this.connectionCount++;
        }
        disconnReceiver_(conn) {
          return (everConnected) => {
            if (conn === this.conn_) {
              this.onConnectionLost_(everConnected);
            } else if (conn === this.secondaryConn_) {
              this.log_("Secondary connection lost.");
              this.onSecondaryConnectionLost_();
            } else {
              this.log_("closing an old connection");
            }
          };
        }
        connReceiver_(conn) {
          return (message) => {
            if (this.state_ !== 2) {
              if (conn === this.rx_) {
                this.onPrimaryMessageReceived_(message);
              } else if (conn === this.secondaryConn_) {
                this.onSecondaryMessageReceived_(message);
              } else {
                this.log_("message on old connection");
              }
            }
          };
        }
        /**
         * @param dataMsg - An arbitrary data message to be sent to the server
         */
        sendRequest(dataMsg) {
          const msg = { t: "d", d: dataMsg };
          this.sendData_(msg);
        }
        tryCleanupConnection() {
          if (this.tx_ === this.secondaryConn_ && this.rx_ === this.secondaryConn_) {
            this.log_("cleaning up and promoting a connection: " + this.secondaryConn_.connId);
            this.conn_ = this.secondaryConn_;
            this.secondaryConn_ = null;
          }
        }
        onSecondaryControl_(controlData) {
          if (MESSAGE_TYPE in controlData) {
            const cmd = controlData[MESSAGE_TYPE];
            if (cmd === SWITCH_ACK) {
              this.upgradeIfSecondaryHealthy_();
            } else if (cmd === CONTROL_RESET) {
              this.log_("Got a reset on secondary, closing it");
              this.secondaryConn_.close();
              if (this.tx_ === this.secondaryConn_ || this.rx_ === this.secondaryConn_) {
                this.close();
              }
            } else if (cmd === CONTROL_PONG) {
              this.log_("got pong on secondary.");
              this.secondaryResponsesRequired_--;
              this.upgradeIfSecondaryHealthy_();
            }
          }
        }
        onSecondaryMessageReceived_(parsedData) {
          const layer = requireKey("t", parsedData);
          const data = requireKey("d", parsedData);
          if (layer === "c") {
            this.onSecondaryControl_(data);
          } else if (layer === "d") {
            this.pendingDataMessages.push(data);
          } else {
            throw new Error("Unknown protocol layer: " + layer);
          }
        }
        upgradeIfSecondaryHealthy_() {
          if (this.secondaryResponsesRequired_ <= 0) {
            this.log_("Secondary connection is healthy.");
            this.isHealthy_ = true;
            this.secondaryConn_.markConnectionHealthy();
            this.proceedWithUpgrade_();
          } else {
            this.log_("sending ping on secondary.");
            this.secondaryConn_.send({ t: "c", d: { t: PING, d: {} } });
          }
        }
        proceedWithUpgrade_() {
          this.secondaryConn_.start();
          this.log_("sending client ack on secondary");
          this.secondaryConn_.send({ t: "c", d: { t: SWITCH_ACK, d: {} } });
          this.log_("Ending transmission on primary");
          this.conn_.send({ t: "c", d: { t: END_TRANSMISSION, d: {} } });
          this.tx_ = this.secondaryConn_;
          this.tryCleanupConnection();
        }
        onPrimaryMessageReceived_(parsedData) {
          const layer = requireKey("t", parsedData);
          const data = requireKey("d", parsedData);
          if (layer === "c") {
            this.onControl_(data);
          } else if (layer === "d") {
            this.onDataMessage_(data);
          }
        }
        onDataMessage_(message) {
          this.onPrimaryResponse_();
          this.onMessage_(message);
        }
        onPrimaryResponse_() {
          if (!this.isHealthy_) {
            this.primaryResponsesRequired_--;
            if (this.primaryResponsesRequired_ <= 0) {
              this.log_("Primary connection is healthy.");
              this.isHealthy_ = true;
              this.conn_.markConnectionHealthy();
            }
          }
        }
        onControl_(controlData) {
          const cmd = requireKey(MESSAGE_TYPE, controlData);
          if (MESSAGE_DATA in controlData) {
            const payload = controlData[MESSAGE_DATA];
            if (cmd === SERVER_HELLO) {
              const handshakePayload = {
                ...payload
              };
              if (this.repoInfo_.isUsingEmulator) {
                handshakePayload.h = this.repoInfo_.host;
              }
              this.onHandshake_(handshakePayload);
            } else if (cmd === END_TRANSMISSION) {
              this.log_("recvd end transmission on primary");
              this.rx_ = this.secondaryConn_;
              for (let i = 0; i < this.pendingDataMessages.length; ++i) {
                this.onDataMessage_(this.pendingDataMessages[i]);
              }
              this.pendingDataMessages = [];
              this.tryCleanupConnection();
            } else if (cmd === CONTROL_SHUTDOWN) {
              this.onConnectionShutdown_(payload);
            } else if (cmd === CONTROL_RESET) {
              this.onReset_(payload);
            } else if (cmd === CONTROL_ERROR) {
              error("Server Error: " + payload);
            } else if (cmd === CONTROL_PONG) {
              this.log_("got pong on primary.");
              this.onPrimaryResponse_();
              this.sendPingOnPrimaryIfNecessary_();
            } else {
              error("Unknown control packet command: " + cmd);
            }
          }
        }
        /**
         * @param handshake - The handshake data returned from the server
         */
        onHandshake_(handshake) {
          const timestamp = handshake.ts;
          const version5 = handshake.v;
          const host = handshake.h;
          this.sessionId = handshake.s;
          this.repoInfo_.host = host;
          if (this.state_ === 0) {
            this.conn_.start();
            this.onConnectionEstablished_(this.conn_, timestamp);
            if (PROTOCOL_VERSION !== version5) {
              warn("Protocol version mismatch detected");
            }
            this.tryStartUpgrade_();
          }
        }
        tryStartUpgrade_() {
          const conn = this.transportManager_.upgradeTransport();
          if (conn) {
            this.startUpgrade_(conn);
          }
        }
        startUpgrade_(conn) {
          this.secondaryConn_ = new conn(this.nextTransportId_(), this.repoInfo_, this.applicationId_, this.appCheckToken_, this.authToken_, this.sessionId);
          this.secondaryResponsesRequired_ = conn["responsesRequiredToBeHealthy"] || 0;
          const onMessage = this.connReceiver_(this.secondaryConn_);
          const onDisconnect = this.disconnReceiver_(this.secondaryConn_);
          this.secondaryConn_.open(onMessage, onDisconnect);
          setTimeoutNonBlocking(() => {
            if (this.secondaryConn_) {
              this.log_("Timed out trying to upgrade.");
              this.secondaryConn_.close();
            }
          }, Math.floor(UPGRADE_TIMEOUT));
        }
        onReset_(host) {
          this.log_("Reset packet received.  New host: " + host);
          this.repoInfo_.host = host;
          if (this.state_ === 1) {
            this.close();
          } else {
            this.closeConnections_();
            this.start_();
          }
        }
        onConnectionEstablished_(conn, timestamp) {
          this.log_("Realtime connection established.");
          this.conn_ = conn;
          this.state_ = 1;
          if (this.onReady_) {
            this.onReady_(timestamp, this.sessionId);
            this.onReady_ = null;
          }
          if (this.primaryResponsesRequired_ === 0) {
            this.log_("Primary connection is healthy.");
            this.isHealthy_ = true;
          } else {
            setTimeoutNonBlocking(() => {
              this.sendPingOnPrimaryIfNecessary_();
            }, Math.floor(DELAY_BEFORE_SENDING_EXTRA_REQUESTS));
          }
        }
        sendPingOnPrimaryIfNecessary_() {
          if (!this.isHealthy_ && this.state_ === 1) {
            this.log_("sending ping on primary.");
            this.sendData_({ t: "c", d: { t: PING, d: {} } });
          }
        }
        onSecondaryConnectionLost_() {
          const conn = this.secondaryConn_;
          this.secondaryConn_ = null;
          if (this.tx_ === conn || this.rx_ === conn) {
            this.close();
          }
        }
        /**
         * @param everConnected - Whether or not the connection ever reached a server. Used to determine if
         * we should flush the host cache
         */
        onConnectionLost_(everConnected) {
          this.conn_ = null;
          if (!everConnected && this.state_ === 0) {
            this.log_("Realtime connection failed.");
            if (this.repoInfo_.isCacheableHost()) {
              PersistentStorage.remove("host:" + this.repoInfo_.host);
              this.repoInfo_.internalHost = this.repoInfo_.host;
            }
          } else if (this.state_ === 1) {
            this.log_("Realtime connection lost.");
          }
          this.close();
        }
        onConnectionShutdown_(reason) {
          this.log_("Connection shutdown command received. Shutting down...");
          if (this.onKill_) {
            this.onKill_(reason);
            this.onKill_ = null;
          }
          this.onDisconnect_ = null;
          this.close();
        }
        sendData_(data) {
          if (this.state_ !== 1) {
            throw "Connection is not connected";
          } else {
            this.tx_.send(data);
          }
        }
        /**
         * Cleans up this connection, calling the appropriate callbacks
         */
        close() {
          if (this.state_ !== 2) {
            this.log_("Closing realtime connection.");
            this.state_ = 2;
            this.closeConnections_();
            if (this.onDisconnect_) {
              this.onDisconnect_();
              this.onDisconnect_ = null;
            }
          }
        }
        closeConnections_() {
          this.log_("Shutting down all connections");
          if (this.conn_) {
            this.conn_.close();
            this.conn_ = null;
          }
          if (this.secondaryConn_) {
            this.secondaryConn_.close();
            this.secondaryConn_ = null;
          }
          if (this.healthyTimeout_) {
            clearTimeout(this.healthyTimeout_);
            this.healthyTimeout_ = null;
          }
        }
      };
      ServerActions = class {
        put(pathString, data, onComplete, hash) {
        }
        merge(pathString, data, onComplete, hash) {
        }
        /**
         * Refreshes the auth token for the current connection.
         * @param token - The authentication token
         */
        refreshAuthToken(token) {
        }
        /**
         * Refreshes the app check token for the current connection.
         * @param token The app check token
         */
        refreshAppCheckToken(token) {
        }
        onDisconnectPut(pathString, data, onComplete) {
        }
        onDisconnectMerge(pathString, data, onComplete) {
        }
        onDisconnectCancel(pathString, onComplete) {
        }
        reportStats(stats) {
        }
      };
      EventEmitter = class {
        constructor(allowedEvents_) {
          this.allowedEvents_ = allowedEvents_;
          this.listeners_ = {};
          assert(Array.isArray(allowedEvents_) && allowedEvents_.length > 0, "Requires a non-empty array");
        }
        /**
         * To be called by derived classes to trigger events.
         */
        trigger(eventType, ...varArgs) {
          if (Array.isArray(this.listeners_[eventType])) {
            const listeners = [...this.listeners_[eventType]];
            for (let i = 0; i < listeners.length; i++) {
              listeners[i].callback.apply(listeners[i].context, varArgs);
            }
          }
        }
        on(eventType, callback, context) {
          this.validateEventType_(eventType);
          this.listeners_[eventType] = this.listeners_[eventType] || [];
          this.listeners_[eventType].push({ callback, context });
          const eventData = this.getInitialEvent(eventType);
          if (eventData) {
            callback.apply(context, eventData);
          }
        }
        off(eventType, callback, context) {
          this.validateEventType_(eventType);
          const listeners = this.listeners_[eventType] || [];
          for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].callback === callback && (!context || context === listeners[i].context)) {
              listeners.splice(i, 1);
              return;
            }
          }
        }
        validateEventType_(eventType) {
          assert(this.allowedEvents_.find((et) => {
            return et === eventType;
          }), "Unknown event: " + eventType);
        }
      };
      OnlineMonitor = class _OnlineMonitor extends EventEmitter {
        static getInstance() {
          return new _OnlineMonitor();
        }
        constructor() {
          super(["online"]);
          this.online_ = true;
          if (typeof window !== "undefined" && typeof window.addEventListener !== "undefined" && !isMobileCordova()) {
            window.addEventListener("online", () => {
              if (!this.online_) {
                this.online_ = true;
                this.trigger("online", true);
              }
            }, false);
            window.addEventListener("offline", () => {
              if (this.online_) {
                this.online_ = false;
                this.trigger("online", false);
              }
            }, false);
          }
        }
        getInitialEvent(eventType) {
          assert(eventType === "online", "Unknown event type: " + eventType);
          return [this.online_];
        }
        currentlyOnline() {
          return this.online_;
        }
      };
      MAX_PATH_DEPTH = 32;
      MAX_PATH_LENGTH_BYTES = 768;
      Path = class {
        /**
         * @param pathOrString - Path string to parse, or another path, or the raw
         * tokens array
         */
        constructor(pathOrString, pieceNum) {
          if (pieceNum === void 0) {
            this.pieces_ = pathOrString.split("/");
            let copyTo = 0;
            for (let i = 0; i < this.pieces_.length; i++) {
              if (this.pieces_[i].length > 0) {
                this.pieces_[copyTo] = this.pieces_[i];
                copyTo++;
              }
            }
            this.pieces_.length = copyTo;
            this.pieceNum_ = 0;
          } else {
            this.pieces_ = pathOrString;
            this.pieceNum_ = pieceNum;
          }
        }
        toString() {
          let pathString = "";
          for (let i = this.pieceNum_; i < this.pieces_.length; i++) {
            if (this.pieces_[i] !== "") {
              pathString += "/" + this.pieces_[i];
            }
          }
          return pathString || "/";
        }
      };
      ValidationPath = class {
        /**
         * @param path - Initial Path.
         * @param errorPrefix_ - Prefix for any error messages.
         */
        constructor(path, errorPrefix_) {
          this.errorPrefix_ = errorPrefix_;
          this.parts_ = pathSlice(path, 0);
          this.byteLength_ = Math.max(1, this.parts_.length);
          for (let i = 0; i < this.parts_.length; i++) {
            this.byteLength_ += stringLength(this.parts_[i]);
          }
          validationPathCheckValid(this);
        }
      };
      VisibilityMonitor = class _VisibilityMonitor extends EventEmitter {
        static getInstance() {
          return new _VisibilityMonitor();
        }
        constructor() {
          super(["visible"]);
          let hidden;
          let visibilityChange;
          if (typeof document !== "undefined" && typeof document.addEventListener !== "undefined") {
            if (typeof document["hidden"] !== "undefined") {
              visibilityChange = "visibilitychange";
              hidden = "hidden";
            } else if (typeof document["mozHidden"] !== "undefined") {
              visibilityChange = "mozvisibilitychange";
              hidden = "mozHidden";
            } else if (typeof document["msHidden"] !== "undefined") {
              visibilityChange = "msvisibilitychange";
              hidden = "msHidden";
            } else if (typeof document["webkitHidden"] !== "undefined") {
              visibilityChange = "webkitvisibilitychange";
              hidden = "webkitHidden";
            }
          }
          this.visible_ = true;
          if (visibilityChange) {
            document.addEventListener(visibilityChange, () => {
              const visible = !document[hidden];
              if (visible !== this.visible_) {
                this.visible_ = visible;
                this.trigger("visible", visible);
              }
            }, false);
          }
        }
        getInitialEvent(eventType) {
          assert(eventType === "visible", "Unknown event type: " + eventType);
          return [this.visible_];
        }
      };
      RECONNECT_MIN_DELAY = 1e3;
      RECONNECT_MAX_DELAY_DEFAULT = 60 * 5 * 1e3;
      RECONNECT_MAX_DELAY_FOR_ADMINS = 30 * 1e3;
      RECONNECT_DELAY_MULTIPLIER = 1.3;
      RECONNECT_DELAY_RESET_TIMEOUT = 3e4;
      SERVER_KILL_INTERRUPT_REASON = "server_kill";
      INVALID_TOKEN_THRESHOLD = 3;
      PersistentConnection = class _PersistentConnection extends ServerActions {
        /**
         * @param repoInfo_ - Data about the namespace we are connecting to
         * @param applicationId_ - The Firebase App ID for this project
         * @param onDataUpdate_ - A callback for new data from the server
         */
        constructor(repoInfo_, applicationId_, onDataUpdate_, onConnectStatus_, onServerInfoUpdate_, authTokenProvider_, appCheckTokenProvider_, authOverride_) {
          super();
          this.repoInfo_ = repoInfo_;
          this.applicationId_ = applicationId_;
          this.onDataUpdate_ = onDataUpdate_;
          this.onConnectStatus_ = onConnectStatus_;
          this.onServerInfoUpdate_ = onServerInfoUpdate_;
          this.authTokenProvider_ = authTokenProvider_;
          this.appCheckTokenProvider_ = appCheckTokenProvider_;
          this.authOverride_ = authOverride_;
          this.id = _PersistentConnection.nextPersistentConnectionId_++;
          this.log_ = logWrapper("p:" + this.id + ":");
          this.interruptReasons_ = {};
          this.listens = /* @__PURE__ */ new Map();
          this.outstandingPuts_ = [];
          this.outstandingGets_ = [];
          this.outstandingPutCount_ = 0;
          this.outstandingGetCount_ = 0;
          this.onDisconnectRequestQueue_ = [];
          this.connected_ = false;
          this.reconnectDelay_ = RECONNECT_MIN_DELAY;
          this.maxReconnectDelay_ = RECONNECT_MAX_DELAY_DEFAULT;
          this.securityDebugCallback_ = null;
          this.lastSessionId = null;
          this.establishConnectionTimer_ = null;
          this.visible_ = false;
          this.requestCBHash_ = {};
          this.requestNumber_ = 0;
          this.realtime_ = null;
          this.authToken_ = null;
          this.appCheckToken_ = null;
          this.forceTokenRefresh_ = false;
          this.invalidAuthTokenCount_ = 0;
          this.invalidAppCheckTokenCount_ = 0;
          this.firstConnection_ = true;
          this.lastConnectionAttemptTime_ = null;
          this.lastConnectionEstablishedTime_ = null;
          if (authOverride_ && !isNodeSdk()) {
            throw new Error("Auth override specified in options, but not supported on non Node.js platforms");
          }
          VisibilityMonitor.getInstance().on("visible", this.onVisible_, this);
          if (repoInfo_.host.indexOf("fblocal") === -1) {
            OnlineMonitor.getInstance().on("online", this.onOnline_, this);
          }
        }
        sendRequest(action, body, onResponse) {
          const curReqNum = ++this.requestNumber_;
          const msg = { r: curReqNum, a: action, b: body };
          this.log_(stringify(msg));
          assert(this.connected_, "sendRequest call when we're not connected not allowed.");
          this.realtime_.sendRequest(msg);
          if (onResponse) {
            this.requestCBHash_[curReqNum] = onResponse;
          }
        }
        get(query) {
          this.initConnection_();
          const deferred = new Deferred();
          const request = {
            p: query._path.toString(),
            q: query._queryObject
          };
          const outstandingGet = {
            action: "g",
            request,
            onComplete: (message) => {
              const payload = message["d"];
              if (message["s"] === "ok") {
                deferred.resolve(payload);
              } else {
                deferred.reject(payload);
              }
            }
          };
          this.outstandingGets_.push(outstandingGet);
          this.outstandingGetCount_++;
          const index = this.outstandingGets_.length - 1;
          if (this.connected_) {
            this.sendGet_(index);
          }
          return deferred.promise;
        }
        listen(query, currentHashFn, tag, onComplete) {
          this.initConnection_();
          const queryId = query._queryIdentifier;
          const pathString = query._path.toString();
          this.log_("Listen called for " + pathString + " " + queryId);
          if (!this.listens.has(pathString)) {
            this.listens.set(pathString, /* @__PURE__ */ new Map());
          }
          assert(query._queryParams.isDefault() || !query._queryParams.loadsAllData(), "listen() called for non-default but complete query");
          assert(!this.listens.get(pathString).has(queryId), `listen() called twice for same path/queryId.`);
          const listenSpec = {
            onComplete,
            hashFn: currentHashFn,
            query,
            tag
          };
          this.listens.get(pathString).set(queryId, listenSpec);
          if (this.connected_) {
            this.sendListen_(listenSpec);
          }
        }
        sendGet_(index) {
          const get2 = this.outstandingGets_[index];
          this.sendRequest("g", get2.request, (message) => {
            delete this.outstandingGets_[index];
            this.outstandingGetCount_--;
            if (this.outstandingGetCount_ === 0) {
              this.outstandingGets_ = [];
            }
            if (get2.onComplete) {
              get2.onComplete(message);
            }
          });
        }
        sendListen_(listenSpec) {
          const query = listenSpec.query;
          const pathString = query._path.toString();
          const queryId = query._queryIdentifier;
          this.log_("Listen on " + pathString + " for " + queryId);
          const req = {
            /*path*/
            p: pathString
          };
          const action = "q";
          if (listenSpec.tag) {
            req["q"] = query._queryObject;
            req["t"] = listenSpec.tag;
          }
          req[
            /*hash*/
            "h"
          ] = listenSpec.hashFn();
          this.sendRequest(action, req, (message) => {
            const payload = message[
              /*data*/
              "d"
            ];
            const status = message[
              /*status*/
              "s"
            ];
            _PersistentConnection.warnOnListenWarnings_(payload, query);
            const currentListenSpec = this.listens.get(pathString) && this.listens.get(pathString).get(queryId);
            if (currentListenSpec === listenSpec) {
              this.log_("listen response", message);
              if (status !== "ok") {
                this.removeListen_(pathString, queryId);
              }
              if (listenSpec.onComplete) {
                listenSpec.onComplete(status, payload);
              }
            }
          });
        }
        static warnOnListenWarnings_(payload, query) {
          if (payload && typeof payload === "object" && contains(payload, "w")) {
            const warnings = safeGet(payload, "w");
            if (Array.isArray(warnings) && ~warnings.indexOf("no_index")) {
              const indexSpec = '".indexOn": "' + query._queryParams.getIndex().toString() + '"';
              const indexPath = query._path.toString();
              warn(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${indexSpec} at ${indexPath} to your security rules for better performance.`);
            }
          }
        }
        refreshAuthToken(token) {
          this.authToken_ = token;
          this.log_("Auth token refreshed");
          if (this.authToken_) {
            this.tryAuth();
          } else {
            if (this.connected_) {
              this.sendRequest("unauth", {}, () => {
              });
            }
          }
          this.reduceReconnectDelayIfAdminCredential_(token);
        }
        reduceReconnectDelayIfAdminCredential_(credential) {
          const isFirebaseSecret = credential && credential.length === 40;
          if (isFirebaseSecret || isAdmin(credential)) {
            this.log_("Admin auth credential detected.  Reducing max reconnect time.");
            this.maxReconnectDelay_ = RECONNECT_MAX_DELAY_FOR_ADMINS;
          }
        }
        refreshAppCheckToken(token) {
          this.appCheckToken_ = token;
          this.log_("App check token refreshed");
          if (this.appCheckToken_) {
            this.tryAppCheck();
          } else {
            if (this.connected_) {
              this.sendRequest("unappeck", {}, () => {
              });
            }
          }
        }
        /**
         * Attempts to authenticate with the given credentials. If the authentication attempt fails, it's triggered like
         * a auth revoked (the connection is closed).
         */
        tryAuth() {
          if (this.connected_ && this.authToken_) {
            const token = this.authToken_;
            const authMethod = isValidFormat(token) ? "auth" : "gauth";
            const requestData = { cred: token };
            if (this.authOverride_ === null) {
              requestData["noauth"] = true;
            } else if (typeof this.authOverride_ === "object") {
              requestData["authvar"] = this.authOverride_;
            }
            this.sendRequest(authMethod, requestData, (res) => {
              const status = res[
                /*status*/
                "s"
              ];
              const data = res[
                /*data*/
                "d"
              ] || "error";
              if (this.authToken_ === token) {
                if (status === "ok") {
                  this.invalidAuthTokenCount_ = 0;
                } else {
                  this.onAuthRevoked_(status, data);
                }
              }
            });
          }
        }
        /**
         * Attempts to authenticate with the given token. If the authentication
         * attempt fails, it's triggered like the token was revoked (the connection is
         * closed).
         */
        tryAppCheck() {
          if (this.connected_ && this.appCheckToken_) {
            this.sendRequest("appcheck", { "token": this.appCheckToken_ }, (res) => {
              const status = res[
                /*status*/
                "s"
              ];
              const data = res[
                /*data*/
                "d"
              ] || "error";
              if (status === "ok") {
                this.invalidAppCheckTokenCount_ = 0;
              } else {
                this.onAppCheckRevoked_(status, data);
              }
            });
          }
        }
        /**
         * @inheritDoc
         */
        unlisten(query, tag) {
          const pathString = query._path.toString();
          const queryId = query._queryIdentifier;
          this.log_("Unlisten called for " + pathString + " " + queryId);
          assert(query._queryParams.isDefault() || !query._queryParams.loadsAllData(), "unlisten() called for non-default but complete query");
          const listen = this.removeListen_(pathString, queryId);
          if (listen && this.connected_) {
            this.sendUnlisten_(pathString, queryId, query._queryObject, tag);
          }
        }
        sendUnlisten_(pathString, queryId, queryObj, tag) {
          this.log_("Unlisten on " + pathString + " for " + queryId);
          const req = {
            /*path*/
            p: pathString
          };
          const action = "n";
          if (tag) {
            req["q"] = queryObj;
            req["t"] = tag;
          }
          this.sendRequest(action, req);
        }
        onDisconnectPut(pathString, data, onComplete) {
          this.initConnection_();
          if (this.connected_) {
            this.sendOnDisconnect_("o", pathString, data, onComplete);
          } else {
            this.onDisconnectRequestQueue_.push({
              pathString,
              action: "o",
              data,
              onComplete
            });
          }
        }
        onDisconnectMerge(pathString, data, onComplete) {
          this.initConnection_();
          if (this.connected_) {
            this.sendOnDisconnect_("om", pathString, data, onComplete);
          } else {
            this.onDisconnectRequestQueue_.push({
              pathString,
              action: "om",
              data,
              onComplete
            });
          }
        }
        onDisconnectCancel(pathString, onComplete) {
          this.initConnection_();
          if (this.connected_) {
            this.sendOnDisconnect_("oc", pathString, null, onComplete);
          } else {
            this.onDisconnectRequestQueue_.push({
              pathString,
              action: "oc",
              data: null,
              onComplete
            });
          }
        }
        sendOnDisconnect_(action, pathString, data, onComplete) {
          const request = {
            /*path*/
            p: pathString,
            /*data*/
            d: data
          };
          this.log_("onDisconnect " + action, request);
          this.sendRequest(action, request, (response) => {
            if (onComplete) {
              setTimeout(() => {
                onComplete(response[
                  /*status*/
                  "s"
                ], response[
                  /* data */
                  "d"
                ]);
              }, Math.floor(0));
            }
          });
        }
        put(pathString, data, onComplete, hash) {
          this.putInternal("p", pathString, data, onComplete, hash);
        }
        merge(pathString, data, onComplete, hash) {
          this.putInternal("m", pathString, data, onComplete, hash);
        }
        putInternal(action, pathString, data, onComplete, hash) {
          this.initConnection_();
          const request = {
            /*path*/
            p: pathString,
            /*data*/
            d: data
          };
          if (hash !== void 0) {
            request[
              /*hash*/
              "h"
            ] = hash;
          }
          this.outstandingPuts_.push({
            action,
            request,
            onComplete
          });
          this.outstandingPutCount_++;
          const index = this.outstandingPuts_.length - 1;
          if (this.connected_) {
            this.sendPut_(index);
          } else {
            this.log_("Buffering put: " + pathString);
          }
        }
        sendPut_(index) {
          const action = this.outstandingPuts_[index].action;
          const request = this.outstandingPuts_[index].request;
          const onComplete = this.outstandingPuts_[index].onComplete;
          this.outstandingPuts_[index].queued = this.connected_;
          this.sendRequest(action, request, (message) => {
            this.log_(action + " response", message);
            delete this.outstandingPuts_[index];
            this.outstandingPutCount_--;
            if (this.outstandingPutCount_ === 0) {
              this.outstandingPuts_ = [];
            }
            if (onComplete) {
              onComplete(message[
                /*status*/
                "s"
              ], message[
                /* data */
                "d"
              ]);
            }
          });
        }
        reportStats(stats) {
          if (this.connected_) {
            const request = {
              /*counters*/
              c: stats
            };
            this.log_("reportStats", request);
            this.sendRequest(
              /*stats*/
              "s",
              request,
              (result) => {
                const status = result[
                  /*status*/
                  "s"
                ];
                if (status !== "ok") {
                  const errorReason = result[
                    /* data */
                    "d"
                  ];
                  this.log_("reportStats", "Error sending stats: " + errorReason);
                }
              }
            );
          }
        }
        onDataMessage_(message) {
          if ("r" in message) {
            this.log_("from server: " + stringify(message));
            const reqNum = message["r"];
            const onResponse = this.requestCBHash_[reqNum];
            if (onResponse) {
              delete this.requestCBHash_[reqNum];
              onResponse(message[
                /*body*/
                "b"
              ]);
            }
          } else if ("error" in message) {
            throw "A server-side error has occurred: " + message["error"];
          } else if ("a" in message) {
            this.onDataPush_(message["a"], message["b"]);
          }
        }
        onDataPush_(action, body) {
          this.log_("handleServerMessage", action, body);
          if (action === "d") {
            this.onDataUpdate_(
              body[
                /*path*/
                "p"
              ],
              body[
                /*data*/
                "d"
              ],
              /*isMerge*/
              false,
              body["t"]
            );
          } else if (action === "m") {
            this.onDataUpdate_(
              body[
                /*path*/
                "p"
              ],
              body[
                /*data*/
                "d"
              ],
              /*isMerge=*/
              true,
              body["t"]
            );
          } else if (action === "c") {
            this.onListenRevoked_(body[
              /*path*/
              "p"
            ], body[
              /*query*/
              "q"
            ]);
          } else if (action === "ac") {
            this.onAuthRevoked_(body[
              /*status code*/
              "s"
            ], body[
              /* explanation */
              "d"
            ]);
          } else if (action === "apc") {
            this.onAppCheckRevoked_(body[
              /*status code*/
              "s"
            ], body[
              /* explanation */
              "d"
            ]);
          } else if (action === "sd") {
            this.onSecurityDebugPacket_(body);
          } else {
            error("Unrecognized action received from server: " + stringify(action) + "\nAre you using the latest client?");
          }
        }
        onReady_(timestamp, sessionId) {
          this.log_("connection ready");
          this.connected_ = true;
          this.lastConnectionEstablishedTime_ = (/* @__PURE__ */ new Date()).getTime();
          this.handleTimestamp_(timestamp);
          this.lastSessionId = sessionId;
          if (this.firstConnection_) {
            this.sendConnectStats_();
          }
          this.restoreState_();
          this.firstConnection_ = false;
          this.onConnectStatus_(true);
        }
        scheduleConnect_(timeout) {
          assert(!this.realtime_, "Scheduling a connect when we're already connected/ing?");
          if (this.establishConnectionTimer_) {
            clearTimeout(this.establishConnectionTimer_);
          }
          this.establishConnectionTimer_ = setTimeout(() => {
            this.establishConnectionTimer_ = null;
            this.establishConnection_();
          }, Math.floor(timeout));
        }
        initConnection_() {
          if (!this.realtime_ && this.firstConnection_) {
            this.scheduleConnect_(0);
          }
        }
        onVisible_(visible) {
          if (visible && !this.visible_ && this.reconnectDelay_ === this.maxReconnectDelay_) {
            this.log_("Window became visible.  Reducing delay.");
            this.reconnectDelay_ = RECONNECT_MIN_DELAY;
            if (!this.realtime_) {
              this.scheduleConnect_(0);
            }
          }
          this.visible_ = visible;
        }
        onOnline_(online) {
          if (online) {
            this.log_("Browser went online.");
            this.reconnectDelay_ = RECONNECT_MIN_DELAY;
            if (!this.realtime_) {
              this.scheduleConnect_(0);
            }
          } else {
            this.log_("Browser went offline.  Killing connection.");
            if (this.realtime_) {
              this.realtime_.close();
            }
          }
        }
        onRealtimeDisconnect_() {
          this.log_("data client disconnected");
          this.connected_ = false;
          this.realtime_ = null;
          this.cancelSentTransactions_();
          this.requestCBHash_ = {};
          if (this.shouldReconnect_()) {
            if (!this.visible_) {
              this.log_("Window isn't visible.  Delaying reconnect.");
              this.reconnectDelay_ = this.maxReconnectDelay_;
              this.lastConnectionAttemptTime_ = (/* @__PURE__ */ new Date()).getTime();
            } else if (this.lastConnectionEstablishedTime_) {
              const timeSinceLastConnectSucceeded = (/* @__PURE__ */ new Date()).getTime() - this.lastConnectionEstablishedTime_;
              if (timeSinceLastConnectSucceeded > RECONNECT_DELAY_RESET_TIMEOUT) {
                this.reconnectDelay_ = RECONNECT_MIN_DELAY;
              }
              this.lastConnectionEstablishedTime_ = null;
            }
            const timeSinceLastConnectAttempt = Math.max(0, (/* @__PURE__ */ new Date()).getTime() - this.lastConnectionAttemptTime_);
            let reconnectDelay = Math.max(0, this.reconnectDelay_ - timeSinceLastConnectAttempt);
            reconnectDelay = Math.random() * reconnectDelay;
            this.log_("Trying to reconnect in " + reconnectDelay + "ms");
            this.scheduleConnect_(reconnectDelay);
            this.reconnectDelay_ = Math.min(this.maxReconnectDelay_, this.reconnectDelay_ * RECONNECT_DELAY_MULTIPLIER);
          }
          this.onConnectStatus_(false);
        }
        async establishConnection_() {
          if (this.shouldReconnect_()) {
            this.log_("Making a connection attempt");
            this.lastConnectionAttemptTime_ = (/* @__PURE__ */ new Date()).getTime();
            this.lastConnectionEstablishedTime_ = null;
            const onDataMessage = this.onDataMessage_.bind(this);
            const onReady = this.onReady_.bind(this);
            const onDisconnect = this.onRealtimeDisconnect_.bind(this);
            const connId = this.id + ":" + _PersistentConnection.nextConnectionId_++;
            const lastSessionId = this.lastSessionId;
            let canceled = false;
            let connection = null;
            const closeFn = function() {
              if (connection) {
                connection.close();
              } else {
                canceled = true;
                onDisconnect();
              }
            };
            const sendRequestFn = function(msg) {
              assert(connection, "sendRequest call when we're not connected not allowed.");
              connection.sendRequest(msg);
            };
            this.realtime_ = {
              close: closeFn,
              sendRequest: sendRequestFn
            };
            const forceRefresh = this.forceTokenRefresh_;
            this.forceTokenRefresh_ = false;
            try {
              const [authToken, appCheckToken] = await Promise.all([
                this.authTokenProvider_.getToken(forceRefresh),
                this.appCheckTokenProvider_.getToken(forceRefresh)
              ]);
              if (!canceled) {
                log("getToken() completed. Creating connection.");
                this.authToken_ = authToken && authToken.accessToken;
                this.appCheckToken_ = appCheckToken && appCheckToken.token;
                connection = new Connection(
                  connId,
                  this.repoInfo_,
                  this.applicationId_,
                  this.appCheckToken_,
                  this.authToken_,
                  onDataMessage,
                  onReady,
                  onDisconnect,
                  /* onKill= */
                  (reason) => {
                    warn(reason + " (" + this.repoInfo_.toString() + ")");
                    this.interrupt(SERVER_KILL_INTERRUPT_REASON);
                  },
                  lastSessionId
                );
              } else {
                log("getToken() completed but was canceled");
              }
            } catch (error2) {
              this.log_("Failed to get token: " + error2);
              if (!canceled) {
                if (this.repoInfo_.nodeAdmin) {
                  warn(error2);
                }
                closeFn();
              }
            }
          }
        }
        interrupt(reason) {
          log("Interrupting connection for reason: " + reason);
          this.interruptReasons_[reason] = true;
          if (this.realtime_) {
            this.realtime_.close();
          } else {
            if (this.establishConnectionTimer_) {
              clearTimeout(this.establishConnectionTimer_);
              this.establishConnectionTimer_ = null;
            }
            if (this.connected_) {
              this.onRealtimeDisconnect_();
            }
          }
        }
        resume(reason) {
          log("Resuming connection for reason: " + reason);
          delete this.interruptReasons_[reason];
          if (isEmpty(this.interruptReasons_)) {
            this.reconnectDelay_ = RECONNECT_MIN_DELAY;
            if (!this.realtime_) {
              this.scheduleConnect_(0);
            }
          }
        }
        handleTimestamp_(timestamp) {
          const delta = timestamp - (/* @__PURE__ */ new Date()).getTime();
          this.onServerInfoUpdate_({ serverTimeOffset: delta });
        }
        cancelSentTransactions_() {
          for (let i = 0; i < this.outstandingPuts_.length; i++) {
            const put = this.outstandingPuts_[i];
            if (put && /*hash*/
            "h" in put.request && put.queued) {
              if (put.onComplete) {
                put.onComplete("disconnect");
              }
              delete this.outstandingPuts_[i];
              this.outstandingPutCount_--;
            }
          }
          if (this.outstandingPutCount_ === 0) {
            this.outstandingPuts_ = [];
          }
        }
        onListenRevoked_(pathString, query) {
          let queryId;
          if (!query) {
            queryId = "default";
          } else {
            queryId = query.map((q) => ObjectToUniqueKey(q)).join("$");
          }
          const listen = this.removeListen_(pathString, queryId);
          if (listen && listen.onComplete) {
            listen.onComplete("permission_denied");
          }
        }
        removeListen_(pathString, queryId) {
          const normalizedPathString = new Path(pathString).toString();
          let listen;
          if (this.listens.has(normalizedPathString)) {
            const map2 = this.listens.get(normalizedPathString);
            listen = map2.get(queryId);
            map2.delete(queryId);
            if (map2.size === 0) {
              this.listens.delete(normalizedPathString);
            }
          } else {
            listen = void 0;
          }
          return listen;
        }
        onAuthRevoked_(statusCode, explanation) {
          log("Auth token revoked: " + statusCode + "/" + explanation);
          this.authToken_ = null;
          this.forceTokenRefresh_ = true;
          this.realtime_.close();
          if (statusCode === "invalid_token" || statusCode === "permission_denied") {
            this.invalidAuthTokenCount_++;
            if (this.invalidAuthTokenCount_ >= INVALID_TOKEN_THRESHOLD) {
              this.reconnectDelay_ = RECONNECT_MAX_DELAY_FOR_ADMINS;
              this.authTokenProvider_.notifyForInvalidToken();
            }
          }
        }
        onAppCheckRevoked_(statusCode, explanation) {
          log("App check token revoked: " + statusCode + "/" + explanation);
          this.appCheckToken_ = null;
          this.forceTokenRefresh_ = true;
          if (statusCode === "invalid_token" || statusCode === "permission_denied") {
            this.invalidAppCheckTokenCount_++;
            if (this.invalidAppCheckTokenCount_ >= INVALID_TOKEN_THRESHOLD) {
              this.appCheckTokenProvider_.notifyForInvalidToken();
            }
          }
        }
        onSecurityDebugPacket_(body) {
          if (this.securityDebugCallback_) {
            this.securityDebugCallback_(body);
          } else {
            if ("msg" in body) {
              console.log("FIREBASE: " + body["msg"].replace("\n", "\nFIREBASE: "));
            }
          }
        }
        restoreState_() {
          this.tryAuth();
          this.tryAppCheck();
          for (const queries of this.listens.values()) {
            for (const listenSpec of queries.values()) {
              this.sendListen_(listenSpec);
            }
          }
          for (let i = 0; i < this.outstandingPuts_.length; i++) {
            if (this.outstandingPuts_[i]) {
              this.sendPut_(i);
            }
          }
          while (this.onDisconnectRequestQueue_.length) {
            const request = this.onDisconnectRequestQueue_.shift();
            this.sendOnDisconnect_(request.action, request.pathString, request.data, request.onComplete);
          }
          for (let i = 0; i < this.outstandingGets_.length; i++) {
            if (this.outstandingGets_[i]) {
              this.sendGet_(i);
            }
          }
        }
        /**
         * Sends client stats for first connection
         */
        sendConnectStats_() {
          const stats = {};
          let clientName = "js";
          if (isNodeSdk()) {
            if (this.repoInfo_.nodeAdmin) {
              clientName = "admin_node";
            } else {
              clientName = "node";
            }
          }
          stats["sdk." + clientName + "." + SDK_VERSION2.replace(/\./g, "-")] = 1;
          if (isMobileCordova()) {
            stats["framework.cordova"] = 1;
          } else if (isReactNative()) {
            stats["framework.reactnative"] = 1;
          }
          this.reportStats(stats);
        }
        shouldReconnect_() {
          const online = OnlineMonitor.getInstance().currentlyOnline();
          return isEmpty(this.interruptReasons_) && online;
        }
      };
      PersistentConnection.nextPersistentConnectionId_ = 0;
      PersistentConnection.nextConnectionId_ = 0;
      NamedNode = class _NamedNode {
        constructor(name5, node) {
          this.name = name5;
          this.node = node;
        }
        static Wrap(name5, node) {
          return new _NamedNode(name5, node);
        }
      };
      Index = class {
        /**
         * @returns A standalone comparison function for
         * this index
         */
        getCompare() {
          return this.compare.bind(this);
        }
        /**
         * Given a before and after value for a node, determine if the indexed value has changed. Even if they are different,
         * it's possible that the changes are isolated to parts of the snapshot that are not indexed.
         *
         *
         * @returns True if the portion of the snapshot being indexed changed between oldNode and newNode
         */
        indexedValueChanged(oldNode, newNode) {
          const oldWrapped = new NamedNode(MIN_NAME, oldNode);
          const newWrapped = new NamedNode(MIN_NAME, newNode);
          return this.compare(oldWrapped, newWrapped) !== 0;
        }
        /**
         * @returns a node wrapper that will sort equal to or less than
         * any other node wrapper, using this index
         */
        minPost() {
          return NamedNode.MIN;
        }
      };
      KeyIndex = class extends Index {
        static get __EMPTY_NODE() {
          return __EMPTY_NODE;
        }
        static set __EMPTY_NODE(val) {
          __EMPTY_NODE = val;
        }
        compare(a, b) {
          return nameCompare(a.name, b.name);
        }
        isDefinedOn(node) {
          throw assertionError("KeyIndex.isDefinedOn not expected to be called.");
        }
        indexedValueChanged(oldNode, newNode) {
          return false;
        }
        minPost() {
          return NamedNode.MIN;
        }
        maxPost() {
          return new NamedNode(MAX_NAME, __EMPTY_NODE);
        }
        makePost(indexValue, name5) {
          assert(typeof indexValue === "string", "KeyIndex indexValue must always be a string.");
          return new NamedNode(indexValue, __EMPTY_NODE);
        }
        /**
         * @returns String representation for inclusion in a query spec
         */
        toString() {
          return ".key";
        }
      };
      KEY_INDEX = new KeyIndex();
      SortedMapIterator = class {
        /**
         * @param node - Node to iterate.
         * @param isReverse_ - Whether or not to iterate in reverse
         */
        constructor(node, startKey, comparator, isReverse_, resultGenerator_ = null) {
          this.isReverse_ = isReverse_;
          this.resultGenerator_ = resultGenerator_;
          this.nodeStack_ = [];
          let cmp = 1;
          while (!node.isEmpty()) {
            node = node;
            cmp = startKey ? comparator(node.key, startKey) : 1;
            if (isReverse_) {
              cmp *= -1;
            }
            if (cmp < 0) {
              if (this.isReverse_) {
                node = node.left;
              } else {
                node = node.right;
              }
            } else if (cmp === 0) {
              this.nodeStack_.push(node);
              break;
            } else {
              this.nodeStack_.push(node);
              if (this.isReverse_) {
                node = node.right;
              } else {
                node = node.left;
              }
            }
          }
        }
        getNext() {
          if (this.nodeStack_.length === 0) {
            return null;
          }
          let node = this.nodeStack_.pop();
          let result;
          if (this.resultGenerator_) {
            result = this.resultGenerator_(node.key, node.value);
          } else {
            result = { key: node.key, value: node.value };
          }
          if (this.isReverse_) {
            node = node.left;
            while (!node.isEmpty()) {
              this.nodeStack_.push(node);
              node = node.right;
            }
          } else {
            node = node.right;
            while (!node.isEmpty()) {
              this.nodeStack_.push(node);
              node = node.left;
            }
          }
          return result;
        }
        hasNext() {
          return this.nodeStack_.length > 0;
        }
        peek() {
          if (this.nodeStack_.length === 0) {
            return null;
          }
          const node = this.nodeStack_[this.nodeStack_.length - 1];
          if (this.resultGenerator_) {
            return this.resultGenerator_(node.key, node.value);
          } else {
            return { key: node.key, value: node.value };
          }
        }
      };
      LLRBNode = class _LLRBNode {
        /**
         * @param key - Key associated with this node.
         * @param value - Value associated with this node.
         * @param color - Whether this node is red.
         * @param left - Left child.
         * @param right - Right child.
         */
        constructor(key, value, color, left, right) {
          this.key = key;
          this.value = value;
          this.color = color != null ? color : _LLRBNode.RED;
          this.left = left != null ? left : SortedMap.EMPTY_NODE;
          this.right = right != null ? right : SortedMap.EMPTY_NODE;
        }
        /**
         * Returns a copy of the current node, optionally replacing pieces of it.
         *
         * @param key - New key for the node, or null.
         * @param value - New value for the node, or null.
         * @param color - New color for the node, or null.
         * @param left - New left child for the node, or null.
         * @param right - New right child for the node, or null.
         * @returns The node copy.
         */
        copy(key, value, color, left, right) {
          return new _LLRBNode(key != null ? key : this.key, value != null ? value : this.value, color != null ? color : this.color, left != null ? left : this.left, right != null ? right : this.right);
        }
        /**
         * @returns The total number of nodes in the tree.
         */
        count() {
          return this.left.count() + 1 + this.right.count();
        }
        /**
         * @returns True if the tree is empty.
         */
        isEmpty() {
          return false;
        }
        /**
         * Traverses the tree in key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         *   node.  If it returns true, traversal is aborted.
         * @returns The first truthy value returned by action, or the last falsey
         *   value returned by action
         */
        inorderTraversal(action) {
          return this.left.inorderTraversal(action) || !!action(this.key, this.value) || this.right.inorderTraversal(action);
        }
        /**
         * Traverses the tree in reverse key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         * node.  If it returns true, traversal is aborted.
         * @returns True if traversal was aborted.
         */
        reverseTraversal(action) {
          return this.right.reverseTraversal(action) || action(this.key, this.value) || this.left.reverseTraversal(action);
        }
        /**
         * @returns The minimum node in the tree.
         */
        min_() {
          if (this.left.isEmpty()) {
            return this;
          } else {
            return this.left.min_();
          }
        }
        /**
         * @returns The maximum key in the tree.
         */
        minKey() {
          return this.min_().key;
        }
        /**
         * @returns The maximum key in the tree.
         */
        maxKey() {
          if (this.right.isEmpty()) {
            return this.key;
          } else {
            return this.right.maxKey();
          }
        }
        /**
         * @param key - Key to insert.
         * @param value - Value to insert.
         * @param comparator - Comparator.
         * @returns New tree, with the key/value added.
         */
        insert(key, value, comparator) {
          let n = this;
          const cmp = comparator(key, n.key);
          if (cmp < 0) {
            n = n.copy(null, null, null, n.left.insert(key, value, comparator), null);
          } else if (cmp === 0) {
            n = n.copy(null, value, null, null, null);
          } else {
            n = n.copy(null, null, null, null, n.right.insert(key, value, comparator));
          }
          return n.fixUp_();
        }
        /**
         * @returns New tree, with the minimum key removed.
         */
        removeMin_() {
          if (this.left.isEmpty()) {
            return SortedMap.EMPTY_NODE;
          }
          let n = this;
          if (!n.left.isRed_() && !n.left.left.isRed_()) {
            n = n.moveRedLeft_();
          }
          n = n.copy(null, null, null, n.left.removeMin_(), null);
          return n.fixUp_();
        }
        /**
         * @param key - The key of the item to remove.
         * @param comparator - Comparator.
         * @returns New tree, with the specified item removed.
         */
        remove(key, comparator) {
          let n, smallest;
          n = this;
          if (comparator(key, n.key) < 0) {
            if (!n.left.isEmpty() && !n.left.isRed_() && !n.left.left.isRed_()) {
              n = n.moveRedLeft_();
            }
            n = n.copy(null, null, null, n.left.remove(key, comparator), null);
          } else {
            if (n.left.isRed_()) {
              n = n.rotateRight_();
            }
            if (!n.right.isEmpty() && !n.right.isRed_() && !n.right.left.isRed_()) {
              n = n.moveRedRight_();
            }
            if (comparator(key, n.key) === 0) {
              if (n.right.isEmpty()) {
                return SortedMap.EMPTY_NODE;
              } else {
                smallest = n.right.min_();
                n = n.copy(smallest.key, smallest.value, null, null, n.right.removeMin_());
              }
            }
            n = n.copy(null, null, null, null, n.right.remove(key, comparator));
          }
          return n.fixUp_();
        }
        /**
         * @returns Whether this is a RED node.
         */
        isRed_() {
          return this.color;
        }
        /**
         * @returns New tree after performing any needed rotations.
         */
        fixUp_() {
          let n = this;
          if (n.right.isRed_() && !n.left.isRed_()) {
            n = n.rotateLeft_();
          }
          if (n.left.isRed_() && n.left.left.isRed_()) {
            n = n.rotateRight_();
          }
          if (n.left.isRed_() && n.right.isRed_()) {
            n = n.colorFlip_();
          }
          return n;
        }
        /**
         * @returns New tree, after moveRedLeft.
         */
        moveRedLeft_() {
          let n = this.colorFlip_();
          if (n.right.left.isRed_()) {
            n = n.copy(null, null, null, null, n.right.rotateRight_());
            n = n.rotateLeft_();
            n = n.colorFlip_();
          }
          return n;
        }
        /**
         * @returns New tree, after moveRedRight.
         */
        moveRedRight_() {
          let n = this.colorFlip_();
          if (n.left.left.isRed_()) {
            n = n.rotateRight_();
            n = n.colorFlip_();
          }
          return n;
        }
        /**
         * @returns New tree, after rotateLeft.
         */
        rotateLeft_() {
          const nl = this.copy(null, null, _LLRBNode.RED, null, this.right.left);
          return this.right.copy(null, null, this.color, nl, null);
        }
        /**
         * @returns New tree, after rotateRight.
         */
        rotateRight_() {
          const nr = this.copy(null, null, _LLRBNode.RED, this.left.right, null);
          return this.left.copy(null, null, this.color, null, nr);
        }
        /**
         * @returns Newt ree, after colorFlip.
         */
        colorFlip_() {
          const left = this.left.copy(null, null, !this.left.color, null, null);
          const right = this.right.copy(null, null, !this.right.color, null, null);
          return this.copy(null, null, !this.color, left, right);
        }
        /**
         * For testing.
         *
         * @returns True if all is well.
         */
        checkMaxDepth_() {
          const blackDepth = this.check_();
          return Math.pow(2, blackDepth) <= this.count() + 1;
        }
        check_() {
          if (this.isRed_() && this.left.isRed_()) {
            throw new Error("Red node has red child(" + this.key + "," + this.value + ")");
          }
          if (this.right.isRed_()) {
            throw new Error("Right child of (" + this.key + "," + this.value + ") is red");
          }
          const blackDepth = this.left.check_();
          if (blackDepth !== this.right.check_()) {
            throw new Error("Black depths differ");
          } else {
            return blackDepth + (this.isRed_() ? 0 : 1);
          }
        }
      };
      LLRBNode.RED = true;
      LLRBNode.BLACK = false;
      LLRBEmptyNode = class {
        /**
         * Returns a copy of the current node.
         *
         * @returns The node copy.
         */
        copy(key, value, color, left, right) {
          return this;
        }
        /**
         * Returns a copy of the tree, with the specified key/value added.
         *
         * @param key - Key to be added.
         * @param value - Value to be added.
         * @param comparator - Comparator.
         * @returns New tree, with item added.
         */
        insert(key, value, comparator) {
          return new LLRBNode(key, value, null);
        }
        /**
         * Returns a copy of the tree, with the specified key removed.
         *
         * @param key - The key to remove.
         * @param comparator - Comparator.
         * @returns New tree, with item removed.
         */
        remove(key, comparator) {
          return this;
        }
        /**
         * @returns The total number of nodes in the tree.
         */
        count() {
          return 0;
        }
        /**
         * @returns True if the tree is empty.
         */
        isEmpty() {
          return true;
        }
        /**
         * Traverses the tree in key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         * node.  If it returns true, traversal is aborted.
         * @returns True if traversal was aborted.
         */
        inorderTraversal(action) {
          return false;
        }
        /**
         * Traverses the tree in reverse key order and calls the specified action function
         * for each node.
         *
         * @param action - Callback function to be called for each
         * node.  If it returns true, traversal is aborted.
         * @returns True if traversal was aborted.
         */
        reverseTraversal(action) {
          return false;
        }
        minKey() {
          return null;
        }
        maxKey() {
          return null;
        }
        check_() {
          return 0;
        }
        /**
         * @returns Whether this node is red.
         */
        isRed_() {
          return false;
        }
      };
      SortedMap = class _SortedMap {
        /**
         * @param comparator_ - Key comparator.
         * @param root_ - Optional root node for the map.
         */
        constructor(comparator_, root_ = _SortedMap.EMPTY_NODE) {
          this.comparator_ = comparator_;
          this.root_ = root_;
        }
        /**
         * Returns a copy of the map, with the specified key/value added or replaced.
         * (TODO: We should perhaps rename this method to 'put')
         *
         * @param key - Key to be added.
         * @param value - Value to be added.
         * @returns New map, with item added.
         */
        insert(key, value) {
          return new _SortedMap(this.comparator_, this.root_.insert(key, value, this.comparator_).copy(null, null, LLRBNode.BLACK, null, null));
        }
        /**
         * Returns a copy of the map, with the specified key removed.
         *
         * @param key - The key to remove.
         * @returns New map, with item removed.
         */
        remove(key) {
          return new _SortedMap(this.comparator_, this.root_.remove(key, this.comparator_).copy(null, null, LLRBNode.BLACK, null, null));
        }
        /**
         * Returns the value of the node with the given key, or null.
         *
         * @param key - The key to look up.
         * @returns The value of the node with the given key, or null if the
         * key doesn't exist.
         */
        get(key) {
          let cmp;
          let node = this.root_;
          while (!node.isEmpty()) {
            cmp = this.comparator_(key, node.key);
            if (cmp === 0) {
              return node.value;
            } else if (cmp < 0) {
              node = node.left;
            } else if (cmp > 0) {
              node = node.right;
            }
          }
          return null;
        }
        /**
         * Returns the key of the item *before* the specified key, or null if key is the first item.
         * @param key - The key to find the predecessor of
         * @returns The predecessor key.
         */
        getPredecessorKey(key) {
          let cmp, node = this.root_, rightParent = null;
          while (!node.isEmpty()) {
            cmp = this.comparator_(key, node.key);
            if (cmp === 0) {
              if (!node.left.isEmpty()) {
                node = node.left;
                while (!node.right.isEmpty()) {
                  node = node.right;
                }
                return node.key;
              } else if (rightParent) {
                return rightParent.key;
              } else {
                return null;
              }
            } else if (cmp < 0) {
              node = node.left;
            } else if (cmp > 0) {
              rightParent = node;
              node = node.right;
            }
          }
          throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?");
        }
        /**
         * @returns True if the map is empty.
         */
        isEmpty() {
          return this.root_.isEmpty();
        }
        /**
         * @returns The total number of nodes in the map.
         */
        count() {
          return this.root_.count();
        }
        /**
         * @returns The minimum key in the map.
         */
        minKey() {
          return this.root_.minKey();
        }
        /**
         * @returns The maximum key in the map.
         */
        maxKey() {
          return this.root_.maxKey();
        }
        /**
         * Traverses the map in key order and calls the specified action function
         * for each key/value pair.
         *
         * @param action - Callback function to be called
         * for each key/value pair.  If action returns true, traversal is aborted.
         * @returns The first truthy value returned by action, or the last falsey
         *   value returned by action
         */
        inorderTraversal(action) {
          return this.root_.inorderTraversal(action);
        }
        /**
         * Traverses the map in reverse key order and calls the specified action function
         * for each key/value pair.
         *
         * @param action - Callback function to be called
         * for each key/value pair.  If action returns true, traversal is aborted.
         * @returns True if the traversal was aborted.
         */
        reverseTraversal(action) {
          return this.root_.reverseTraversal(action);
        }
        /**
         * Returns an iterator over the SortedMap.
         * @returns The iterator.
         */
        getIterator(resultGenerator) {
          return new SortedMapIterator(this.root_, null, this.comparator_, false, resultGenerator);
        }
        getIteratorFrom(key, resultGenerator) {
          return new SortedMapIterator(this.root_, key, this.comparator_, false, resultGenerator);
        }
        getReverseIteratorFrom(key, resultGenerator) {
          return new SortedMapIterator(this.root_, key, this.comparator_, true, resultGenerator);
        }
        getReverseIterator(resultGenerator) {
          return new SortedMapIterator(this.root_, null, this.comparator_, true, resultGenerator);
        }
      };
      SortedMap.EMPTY_NODE = new LLRBEmptyNode();
      priorityHashText = function(priority) {
        if (typeof priority === "number") {
          return "number:" + doubleToIEEE754String(priority);
        } else {
          return "string:" + priority;
        }
      };
      validatePriorityNode = function(priorityNode) {
        if (priorityNode.isLeafNode()) {
          const val = priorityNode.val();
          assert(typeof val === "string" || typeof val === "number" || typeof val === "object" && contains(val, ".sv"), "Priority must be a string or number.");
        } else {
          assert(priorityNode === MAX_NODE$2 || priorityNode.isEmpty(), "priority of unexpected type.");
        }
        assert(priorityNode === MAX_NODE$2 || priorityNode.getPriority().isEmpty(), "Priority nodes can't have a priority of their own.");
      };
      LeafNode = class _LeafNode {
        static set __childrenNodeConstructor(val) {
          __childrenNodeConstructor = val;
        }
        static get __childrenNodeConstructor() {
          return __childrenNodeConstructor;
        }
        /**
         * @param value_ - The value to store in this leaf node. The object type is
         * possible in the event of a deferred value
         * @param priorityNode_ - The priority of this node.
         */
        constructor(value_, priorityNode_ = _LeafNode.__childrenNodeConstructor.EMPTY_NODE) {
          this.value_ = value_;
          this.priorityNode_ = priorityNode_;
          this.lazyHash_ = null;
          assert(this.value_ !== void 0 && this.value_ !== null, "LeafNode shouldn't be created with null/undefined value.");
          validatePriorityNode(this.priorityNode_);
        }
        /** @inheritDoc */
        isLeafNode() {
          return true;
        }
        /** @inheritDoc */
        getPriority() {
          return this.priorityNode_;
        }
        /** @inheritDoc */
        updatePriority(newPriorityNode) {
          return new _LeafNode(this.value_, newPriorityNode);
        }
        /** @inheritDoc */
        getImmediateChild(childName) {
          if (childName === ".priority") {
            return this.priorityNode_;
          } else {
            return _LeafNode.__childrenNodeConstructor.EMPTY_NODE;
          }
        }
        /** @inheritDoc */
        getChild(path) {
          if (pathIsEmpty(path)) {
            return this;
          } else if (pathGetFront(path) === ".priority") {
            return this.priorityNode_;
          } else {
            return _LeafNode.__childrenNodeConstructor.EMPTY_NODE;
          }
        }
        hasChild() {
          return false;
        }
        /** @inheritDoc */
        getPredecessorChildName(childName, childNode) {
          return null;
        }
        /** @inheritDoc */
        updateImmediateChild(childName, newChildNode) {
          if (childName === ".priority") {
            return this.updatePriority(newChildNode);
          } else if (newChildNode.isEmpty() && childName !== ".priority") {
            return this;
          } else {
            return _LeafNode.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(childName, newChildNode).updatePriority(this.priorityNode_);
          }
        }
        /** @inheritDoc */
        updateChild(path, newChildNode) {
          const front = pathGetFront(path);
          if (front === null) {
            return newChildNode;
          } else if (newChildNode.isEmpty() && front !== ".priority") {
            return this;
          } else {
            assert(front !== ".priority" || pathGetLength(path) === 1, ".priority must be the last token in a path");
            return this.updateImmediateChild(front, _LeafNode.__childrenNodeConstructor.EMPTY_NODE.updateChild(pathPopFront(path), newChildNode));
          }
        }
        /** @inheritDoc */
        isEmpty() {
          return false;
        }
        /** @inheritDoc */
        numChildren() {
          return 0;
        }
        /** @inheritDoc */
        forEachChild(index, action) {
          return false;
        }
        val(exportFormat) {
          if (exportFormat && !this.getPriority().isEmpty()) {
            return {
              ".value": this.getValue(),
              ".priority": this.getPriority().val()
            };
          } else {
            return this.getValue();
          }
        }
        /** @inheritDoc */
        hash() {
          if (this.lazyHash_ === null) {
            let toHash = "";
            if (!this.priorityNode_.isEmpty()) {
              toHash += "priority:" + priorityHashText(this.priorityNode_.val()) + ":";
            }
            const type = typeof this.value_;
            toHash += type + ":";
            if (type === "number") {
              toHash += doubleToIEEE754String(this.value_);
            } else {
              toHash += this.value_;
            }
            this.lazyHash_ = sha1(toHash);
          }
          return this.lazyHash_;
        }
        /**
         * Returns the value of the leaf node.
         * @returns The value of the node.
         */
        getValue() {
          return this.value_;
        }
        compareTo(other) {
          if (other === _LeafNode.__childrenNodeConstructor.EMPTY_NODE) {
            return 1;
          } else if (other instanceof _LeafNode.__childrenNodeConstructor) {
            return -1;
          } else {
            assert(other.isLeafNode(), "Unknown node type");
            return this.compareToLeafNode_(other);
          }
        }
        /**
         * Comparison specifically for two leaf nodes
         */
        compareToLeafNode_(otherLeaf) {
          const otherLeafType = typeof otherLeaf.value_;
          const thisLeafType = typeof this.value_;
          const otherIndex = _LeafNode.VALUE_TYPE_ORDER.indexOf(otherLeafType);
          const thisIndex = _LeafNode.VALUE_TYPE_ORDER.indexOf(thisLeafType);
          assert(otherIndex >= 0, "Unknown leaf type: " + otherLeafType);
          assert(thisIndex >= 0, "Unknown leaf type: " + thisLeafType);
          if (otherIndex === thisIndex) {
            if (thisLeafType === "object") {
              return 0;
            } else {
              if (this.value_ < otherLeaf.value_) {
                return -1;
              } else if (this.value_ === otherLeaf.value_) {
                return 0;
              } else {
                return 1;
              }
            }
          } else {
            return thisIndex - otherIndex;
          }
        }
        withIndex() {
          return this;
        }
        isIndexed() {
          return true;
        }
        equals(other) {
          if (other === this) {
            return true;
          } else if (other.isLeafNode()) {
            const otherLeaf = other;
            return this.value_ === otherLeaf.value_ && this.priorityNode_.equals(otherLeaf.priorityNode_);
          } else {
            return false;
          }
        }
      };
      LeafNode.VALUE_TYPE_ORDER = ["object", "boolean", "number", "string"];
      PriorityIndex = class extends Index {
        compare(a, b) {
          const aPriority = a.node.getPriority();
          const bPriority = b.node.getPriority();
          const indexCmp = aPriority.compareTo(bPriority);
          if (indexCmp === 0) {
            return nameCompare(a.name, b.name);
          } else {
            return indexCmp;
          }
        }
        isDefinedOn(node) {
          return !node.getPriority().isEmpty();
        }
        indexedValueChanged(oldNode, newNode) {
          return !oldNode.getPriority().equals(newNode.getPriority());
        }
        minPost() {
          return NamedNode.MIN;
        }
        maxPost() {
          return new NamedNode(MAX_NAME, new LeafNode("[PRIORITY-POST]", MAX_NODE$1));
        }
        makePost(indexValue, name5) {
          const priorityNode = nodeFromJSON$1(indexValue);
          return new NamedNode(name5, new LeafNode("[PRIORITY-POST]", priorityNode));
        }
        /**
         * @returns String representation for inclusion in a query spec
         */
        toString() {
          return ".priority";
        }
      };
      PRIORITY_INDEX = new PriorityIndex();
      LOG_2 = Math.log(2);
      Base12Num = class {
        constructor(length) {
          const logBase2 = (num) => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parseInt(Math.log(num) / LOG_2, 10)
          );
          const bitMask = (bits) => parseInt(Array(bits + 1).join("1"), 2);
          this.count = logBase2(length + 1);
          this.current_ = this.count - 1;
          const mask = bitMask(this.count);
          this.bits_ = length + 1 & mask;
        }
        nextBitIsOne() {
          const result = !(this.bits_ & 1 << this.current_);
          this.current_--;
          return result;
        }
      };
      buildChildSet = function(childList, cmp, keyFn, mapSortFn) {
        childList.sort(cmp);
        const buildBalancedTree = function(low, high) {
          const length = high - low;
          let namedNode;
          let key;
          if (length === 0) {
            return null;
          } else if (length === 1) {
            namedNode = childList[low];
            key = keyFn ? keyFn(namedNode) : namedNode;
            return new LLRBNode(key, namedNode.node, LLRBNode.BLACK, null, null);
          } else {
            const middle = parseInt(length / 2, 10) + low;
            const left = buildBalancedTree(low, middle);
            const right = buildBalancedTree(middle + 1, high);
            namedNode = childList[middle];
            key = keyFn ? keyFn(namedNode) : namedNode;
            return new LLRBNode(key, namedNode.node, LLRBNode.BLACK, left, right);
          }
        };
        const buildFrom12Array = function(base122) {
          let node = null;
          let root2 = null;
          let index = childList.length;
          const buildPennant = function(chunkSize, color) {
            const low = index - chunkSize;
            const high = index;
            index -= chunkSize;
            const childTree = buildBalancedTree(low + 1, high);
            const namedNode = childList[low];
            const key = keyFn ? keyFn(namedNode) : namedNode;
            attachPennant(new LLRBNode(key, namedNode.node, color, null, childTree));
          };
          const attachPennant = function(pennant) {
            if (node) {
              node.left = pennant;
              node = pennant;
            } else {
              root2 = pennant;
              node = pennant;
            }
          };
          for (let i = 0; i < base122.count; ++i) {
            const isOne = base122.nextBitIsOne();
            const chunkSize = Math.pow(2, base122.count - (i + 1));
            if (isOne) {
              buildPennant(chunkSize, LLRBNode.BLACK);
            } else {
              buildPennant(chunkSize, LLRBNode.BLACK);
              buildPennant(chunkSize, LLRBNode.RED);
            }
          }
          return root2;
        };
        const base12 = new Base12Num(childList.length);
        const root = buildFrom12Array(base12);
        return new SortedMap(mapSortFn || cmp, root);
      };
      fallbackObject = {};
      IndexMap = class _IndexMap {
        /**
         * The default IndexMap for nodes without a priority
         */
        static get Default() {
          assert(fallbackObject && PRIORITY_INDEX, "ChildrenNode.ts has not been loaded");
          _defaultIndexMap = _defaultIndexMap || new _IndexMap({ ".priority": fallbackObject }, { ".priority": PRIORITY_INDEX });
          return _defaultIndexMap;
        }
        constructor(indexes_, indexSet_) {
          this.indexes_ = indexes_;
          this.indexSet_ = indexSet_;
        }
        get(indexKey) {
          const sortedMap = safeGet(this.indexes_, indexKey);
          if (!sortedMap) {
            throw new Error("No index defined for " + indexKey);
          }
          if (sortedMap instanceof SortedMap) {
            return sortedMap;
          } else {
            return null;
          }
        }
        hasIndex(indexDefinition) {
          return contains(this.indexSet_, indexDefinition.toString());
        }
        addIndex(indexDefinition, existingChildren) {
          assert(indexDefinition !== KEY_INDEX, "KeyIndex always exists and isn't meant to be added to the IndexMap.");
          const childList = [];
          let sawIndexedValue = false;
          const iter = existingChildren.getIterator(NamedNode.Wrap);
          let next = iter.getNext();
          while (next) {
            sawIndexedValue = sawIndexedValue || indexDefinition.isDefinedOn(next.node);
            childList.push(next);
            next = iter.getNext();
          }
          let newIndex;
          if (sawIndexedValue) {
            newIndex = buildChildSet(childList, indexDefinition.getCompare());
          } else {
            newIndex = fallbackObject;
          }
          const indexName = indexDefinition.toString();
          const newIndexSet = { ...this.indexSet_ };
          newIndexSet[indexName] = indexDefinition;
          const newIndexes = { ...this.indexes_ };
          newIndexes[indexName] = newIndex;
          return new _IndexMap(newIndexes, newIndexSet);
        }
        /**
         * Ensure that this node is properly tracked in any indexes that we're maintaining
         */
        addToIndexes(namedNode, existingChildren) {
          const newIndexes = map(this.indexes_, (indexedChildren, indexName) => {
            const index = safeGet(this.indexSet_, indexName);
            assert(index, "Missing index implementation for " + indexName);
            if (indexedChildren === fallbackObject) {
              if (index.isDefinedOn(namedNode.node)) {
                const childList = [];
                const iter = existingChildren.getIterator(NamedNode.Wrap);
                let next = iter.getNext();
                while (next) {
                  if (next.name !== namedNode.name) {
                    childList.push(next);
                  }
                  next = iter.getNext();
                }
                childList.push(namedNode);
                return buildChildSet(childList, index.getCompare());
              } else {
                return fallbackObject;
              }
            } else {
              const existingSnap = existingChildren.get(namedNode.name);
              let newChildren = indexedChildren;
              if (existingSnap) {
                newChildren = newChildren.remove(new NamedNode(namedNode.name, existingSnap));
              }
              return newChildren.insert(namedNode, namedNode.node);
            }
          });
          return new _IndexMap(newIndexes, this.indexSet_);
        }
        /**
         * Create a new IndexMap instance with the given value removed
         */
        removeFromIndexes(namedNode, existingChildren) {
          const newIndexes = map(this.indexes_, (indexedChildren) => {
            if (indexedChildren === fallbackObject) {
              return indexedChildren;
            } else {
              const existingSnap = existingChildren.get(namedNode.name);
              if (existingSnap) {
                return indexedChildren.remove(new NamedNode(namedNode.name, existingSnap));
              } else {
                return indexedChildren;
              }
            }
          });
          return new _IndexMap(newIndexes, this.indexSet_);
        }
      };
      ChildrenNode = class _ChildrenNode {
        static get EMPTY_NODE() {
          return EMPTY_NODE || (EMPTY_NODE = new _ChildrenNode(new SortedMap(NAME_COMPARATOR), null, IndexMap.Default));
        }
        /**
         * @param children_ - List of children of this node..
         * @param priorityNode_ - The priority of this node (as a snapshot node).
         */
        constructor(children_, priorityNode_, indexMap_) {
          this.children_ = children_;
          this.priorityNode_ = priorityNode_;
          this.indexMap_ = indexMap_;
          this.lazyHash_ = null;
          if (this.priorityNode_) {
            validatePriorityNode(this.priorityNode_);
          }
          if (this.children_.isEmpty()) {
            assert(!this.priorityNode_ || this.priorityNode_.isEmpty(), "An empty node cannot have a priority");
          }
        }
        /** @inheritDoc */
        isLeafNode() {
          return false;
        }
        /** @inheritDoc */
        getPriority() {
          return this.priorityNode_ || EMPTY_NODE;
        }
        /** @inheritDoc */
        updatePriority(newPriorityNode) {
          if (this.children_.isEmpty()) {
            return this;
          } else {
            return new _ChildrenNode(this.children_, newPriorityNode, this.indexMap_);
          }
        }
        /** @inheritDoc */
        getImmediateChild(childName) {
          if (childName === ".priority") {
            return this.getPriority();
          } else {
            const child2 = this.children_.get(childName);
            return child2 === null ? EMPTY_NODE : child2;
          }
        }
        /** @inheritDoc */
        getChild(path) {
          const front = pathGetFront(path);
          if (front === null) {
            return this;
          }
          return this.getImmediateChild(front).getChild(pathPopFront(path));
        }
        /** @inheritDoc */
        hasChild(childName) {
          return this.children_.get(childName) !== null;
        }
        /** @inheritDoc */
        updateImmediateChild(childName, newChildNode) {
          assert(newChildNode, "We should always be passing snapshot nodes");
          if (childName === ".priority") {
            return this.updatePriority(newChildNode);
          } else {
            const namedNode = new NamedNode(childName, newChildNode);
            let newChildren, newIndexMap;
            if (newChildNode.isEmpty()) {
              newChildren = this.children_.remove(childName);
              newIndexMap = this.indexMap_.removeFromIndexes(namedNode, this.children_);
            } else {
              newChildren = this.children_.insert(childName, newChildNode);
              newIndexMap = this.indexMap_.addToIndexes(namedNode, this.children_);
            }
            const newPriority = newChildren.isEmpty() ? EMPTY_NODE : this.priorityNode_;
            return new _ChildrenNode(newChildren, newPriority, newIndexMap);
          }
        }
        /** @inheritDoc */
        updateChild(path, newChildNode) {
          const front = pathGetFront(path);
          if (front === null) {
            return newChildNode;
          } else {
            assert(pathGetFront(path) !== ".priority" || pathGetLength(path) === 1, ".priority must be the last token in a path");
            const newImmediateChild = this.getImmediateChild(front).updateChild(pathPopFront(path), newChildNode);
            return this.updateImmediateChild(front, newImmediateChild);
          }
        }
        /** @inheritDoc */
        isEmpty() {
          return this.children_.isEmpty();
        }
        /** @inheritDoc */
        numChildren() {
          return this.children_.count();
        }
        /** @inheritDoc */
        val(exportFormat) {
          if (this.isEmpty()) {
            return null;
          }
          const obj = {};
          let numKeys = 0, maxKey = 0, allIntegerKeys = true;
          this.forEachChild(PRIORITY_INDEX, (key, childNode) => {
            obj[key] = childNode.val(exportFormat);
            numKeys++;
            if (allIntegerKeys && _ChildrenNode.INTEGER_REGEXP_.test(key)) {
              maxKey = Math.max(maxKey, Number(key));
            } else {
              allIntegerKeys = false;
            }
          });
          if (!exportFormat && allIntegerKeys && maxKey < 2 * numKeys) {
            const array = [];
            for (const key in obj) {
              array[key] = obj[key];
            }
            return array;
          } else {
            if (exportFormat && !this.getPriority().isEmpty()) {
              obj[".priority"] = this.getPriority().val();
            }
            return obj;
          }
        }
        /** @inheritDoc */
        hash() {
          if (this.lazyHash_ === null) {
            let toHash = "";
            if (!this.getPriority().isEmpty()) {
              toHash += "priority:" + priorityHashText(this.getPriority().val()) + ":";
            }
            this.forEachChild(PRIORITY_INDEX, (key, childNode) => {
              const childHash = childNode.hash();
              if (childHash !== "") {
                toHash += ":" + key + ":" + childHash;
              }
            });
            this.lazyHash_ = toHash === "" ? "" : sha1(toHash);
          }
          return this.lazyHash_;
        }
        /** @inheritDoc */
        getPredecessorChildName(childName, childNode, index) {
          const idx = this.resolveIndex_(index);
          if (idx) {
            const predecessor = idx.getPredecessorKey(new NamedNode(childName, childNode));
            return predecessor ? predecessor.name : null;
          } else {
            return this.children_.getPredecessorKey(childName);
          }
        }
        getFirstChildName(indexDefinition) {
          const idx = this.resolveIndex_(indexDefinition);
          if (idx) {
            const minKey = idx.minKey();
            return minKey && minKey.name;
          } else {
            return this.children_.minKey();
          }
        }
        getFirstChild(indexDefinition) {
          const minKey = this.getFirstChildName(indexDefinition);
          if (minKey) {
            return new NamedNode(minKey, this.children_.get(minKey));
          } else {
            return null;
          }
        }
        /**
         * Given an index, return the key name of the largest value we have, according to that index
         */
        getLastChildName(indexDefinition) {
          const idx = this.resolveIndex_(indexDefinition);
          if (idx) {
            const maxKey = idx.maxKey();
            return maxKey && maxKey.name;
          } else {
            return this.children_.maxKey();
          }
        }
        getLastChild(indexDefinition) {
          const maxKey = this.getLastChildName(indexDefinition);
          if (maxKey) {
            return new NamedNode(maxKey, this.children_.get(maxKey));
          } else {
            return null;
          }
        }
        forEachChild(index, action) {
          const idx = this.resolveIndex_(index);
          if (idx) {
            return idx.inorderTraversal((wrappedNode) => {
              return action(wrappedNode.name, wrappedNode.node);
            });
          } else {
            return this.children_.inorderTraversal(action);
          }
        }
        getIterator(indexDefinition) {
          return this.getIteratorFrom(indexDefinition.minPost(), indexDefinition);
        }
        getIteratorFrom(startPost, indexDefinition) {
          const idx = this.resolveIndex_(indexDefinition);
          if (idx) {
            return idx.getIteratorFrom(startPost, (key) => key);
          } else {
            const iterator = this.children_.getIteratorFrom(startPost.name, NamedNode.Wrap);
            let next = iterator.peek();
            while (next != null && indexDefinition.compare(next, startPost) < 0) {
              iterator.getNext();
              next = iterator.peek();
            }
            return iterator;
          }
        }
        getReverseIterator(indexDefinition) {
          return this.getReverseIteratorFrom(indexDefinition.maxPost(), indexDefinition);
        }
        getReverseIteratorFrom(endPost, indexDefinition) {
          const idx = this.resolveIndex_(indexDefinition);
          if (idx) {
            return idx.getReverseIteratorFrom(endPost, (key) => {
              return key;
            });
          } else {
            const iterator = this.children_.getReverseIteratorFrom(endPost.name, NamedNode.Wrap);
            let next = iterator.peek();
            while (next != null && indexDefinition.compare(next, endPost) > 0) {
              iterator.getNext();
              next = iterator.peek();
            }
            return iterator;
          }
        }
        compareTo(other) {
          if (this.isEmpty()) {
            if (other.isEmpty()) {
              return 0;
            } else {
              return -1;
            }
          } else if (other.isLeafNode() || other.isEmpty()) {
            return 1;
          } else if (other === MAX_NODE) {
            return -1;
          } else {
            return 0;
          }
        }
        withIndex(indexDefinition) {
          if (indexDefinition === KEY_INDEX || this.indexMap_.hasIndex(indexDefinition)) {
            return this;
          } else {
            const newIndexMap = this.indexMap_.addIndex(indexDefinition, this.children_);
            return new _ChildrenNode(this.children_, this.priorityNode_, newIndexMap);
          }
        }
        isIndexed(index) {
          return index === KEY_INDEX || this.indexMap_.hasIndex(index);
        }
        equals(other) {
          if (other === this) {
            return true;
          } else if (other.isLeafNode()) {
            return false;
          } else {
            const otherChildrenNode = other;
            if (!this.getPriority().equals(otherChildrenNode.getPriority())) {
              return false;
            } else if (this.children_.count() === otherChildrenNode.children_.count()) {
              const thisIter = this.getIterator(PRIORITY_INDEX);
              const otherIter = otherChildrenNode.getIterator(PRIORITY_INDEX);
              let thisCurrent = thisIter.getNext();
              let otherCurrent = otherIter.getNext();
              while (thisCurrent && otherCurrent) {
                if (thisCurrent.name !== otherCurrent.name || !thisCurrent.node.equals(otherCurrent.node)) {
                  return false;
                }
                thisCurrent = thisIter.getNext();
                otherCurrent = otherIter.getNext();
              }
              return thisCurrent === null && otherCurrent === null;
            } else {
              return false;
            }
          }
        }
        /**
         * Returns a SortedMap ordered by index, or null if the default (by-key) ordering can be used
         * instead.
         *
         */
        resolveIndex_(indexDefinition) {
          if (indexDefinition === KEY_INDEX) {
            return null;
          } else {
            return this.indexMap_.get(indexDefinition.toString());
          }
        }
      };
      ChildrenNode.INTEGER_REGEXP_ = /^(0|[1-9]\d*)$/;
      MaxNode = class extends ChildrenNode {
        constructor() {
          super(new SortedMap(NAME_COMPARATOR), ChildrenNode.EMPTY_NODE, IndexMap.Default);
        }
        compareTo(other) {
          if (other === this) {
            return 0;
          } else {
            return 1;
          }
        }
        equals(other) {
          return other === this;
        }
        getPriority() {
          return this;
        }
        getImmediateChild(childName) {
          return ChildrenNode.EMPTY_NODE;
        }
        isEmpty() {
          return false;
        }
      };
      MAX_NODE = new MaxNode();
      Object.defineProperties(NamedNode, {
        MIN: {
          value: new NamedNode(MIN_NAME, ChildrenNode.EMPTY_NODE)
        },
        MAX: {
          value: new NamedNode(MAX_NAME, MAX_NODE)
        }
      });
      KeyIndex.__EMPTY_NODE = ChildrenNode.EMPTY_NODE;
      LeafNode.__childrenNodeConstructor = ChildrenNode;
      setMaxNode$1(MAX_NODE);
      setMaxNode(MAX_NODE);
      USE_HINZE = true;
      setNodeFromJSON(nodeFromJSON);
      PathIndex = class extends Index {
        constructor(indexPath_) {
          super();
          this.indexPath_ = indexPath_;
          assert(!pathIsEmpty(indexPath_) && pathGetFront(indexPath_) !== ".priority", "Can't create PathIndex with empty path or .priority key");
        }
        extractChild(snap) {
          return snap.getChild(this.indexPath_);
        }
        isDefinedOn(node) {
          return !node.getChild(this.indexPath_).isEmpty();
        }
        compare(a, b) {
          const aChild = this.extractChild(a.node);
          const bChild = this.extractChild(b.node);
          const indexCmp = aChild.compareTo(bChild);
          if (indexCmp === 0) {
            return nameCompare(a.name, b.name);
          } else {
            return indexCmp;
          }
        }
        makePost(indexValue, name5) {
          const valueNode = nodeFromJSON(indexValue);
          const node = ChildrenNode.EMPTY_NODE.updateChild(this.indexPath_, valueNode);
          return new NamedNode(name5, node);
        }
        maxPost() {
          const node = ChildrenNode.EMPTY_NODE.updateChild(this.indexPath_, MAX_NODE);
          return new NamedNode(MAX_NAME, node);
        }
        toString() {
          return pathSlice(this.indexPath_, 0).join("/");
        }
      };
      ValueIndex = class extends Index {
        compare(a, b) {
          const indexCmp = a.node.compareTo(b.node);
          if (indexCmp === 0) {
            return nameCompare(a.name, b.name);
          } else {
            return indexCmp;
          }
        }
        isDefinedOn(node) {
          return true;
        }
        indexedValueChanged(oldNode, newNode) {
          return !oldNode.equals(newNode);
        }
        minPost() {
          return NamedNode.MIN;
        }
        maxPost() {
          return NamedNode.MAX;
        }
        makePost(indexValue, name5) {
          const valueNode = nodeFromJSON(indexValue);
          return new NamedNode(name5, valueNode);
        }
        /**
         * @returns String representation for inclusion in a query spec
         */
        toString() {
          return ".value";
        }
      };
      VALUE_INDEX = new ValueIndex();
      IndexedFilter = class {
        constructor(index_) {
          this.index_ = index_;
        }
        updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
          assert(snap.isIndexed(this.index_), "A node must be indexed if only a child is updated");
          const oldChild = snap.getImmediateChild(key);
          if (oldChild.getChild(affectedPath).equals(newChild.getChild(affectedPath))) {
            if (oldChild.isEmpty() === newChild.isEmpty()) {
              return snap;
            }
          }
          if (optChangeAccumulator != null) {
            if (newChild.isEmpty()) {
              if (snap.hasChild(key)) {
                optChangeAccumulator.trackChildChange(changeChildRemoved(key, oldChild));
              } else {
                assert(snap.isLeafNode(), "A child remove without an old child only makes sense on a leaf node");
              }
            } else if (oldChild.isEmpty()) {
              optChangeAccumulator.trackChildChange(changeChildAdded(key, newChild));
            } else {
              optChangeAccumulator.trackChildChange(changeChildChanged(key, newChild, oldChild));
            }
          }
          if (snap.isLeafNode() && newChild.isEmpty()) {
            return snap;
          } else {
            return snap.updateImmediateChild(key, newChild).withIndex(this.index_);
          }
        }
        updateFullNode(oldSnap, newSnap, optChangeAccumulator) {
          if (optChangeAccumulator != null) {
            if (!oldSnap.isLeafNode()) {
              oldSnap.forEachChild(PRIORITY_INDEX, (key, childNode) => {
                if (!newSnap.hasChild(key)) {
                  optChangeAccumulator.trackChildChange(changeChildRemoved(key, childNode));
                }
              });
            }
            if (!newSnap.isLeafNode()) {
              newSnap.forEachChild(PRIORITY_INDEX, (key, childNode) => {
                if (oldSnap.hasChild(key)) {
                  const oldChild = oldSnap.getImmediateChild(key);
                  if (!oldChild.equals(childNode)) {
                    optChangeAccumulator.trackChildChange(changeChildChanged(key, childNode, oldChild));
                  }
                } else {
                  optChangeAccumulator.trackChildChange(changeChildAdded(key, childNode));
                }
              });
            }
          }
          return newSnap.withIndex(this.index_);
        }
        updatePriority(oldSnap, newPriority) {
          if (oldSnap.isEmpty()) {
            return ChildrenNode.EMPTY_NODE;
          } else {
            return oldSnap.updatePriority(newPriority);
          }
        }
        filtersNodes() {
          return false;
        }
        getIndexedFilter() {
          return this;
        }
        getIndex() {
          return this.index_;
        }
      };
      RangedFilter = class _RangedFilter {
        constructor(params) {
          this.indexedFilter_ = new IndexedFilter(params.getIndex());
          this.index_ = params.getIndex();
          this.startPost_ = _RangedFilter.getStartPost_(params);
          this.endPost_ = _RangedFilter.getEndPost_(params);
          this.startIsInclusive_ = !params.startAfterSet_;
          this.endIsInclusive_ = !params.endBeforeSet_;
        }
        getStartPost() {
          return this.startPost_;
        }
        getEndPost() {
          return this.endPost_;
        }
        matches(node) {
          const isWithinStart = this.startIsInclusive_ ? this.index_.compare(this.getStartPost(), node) <= 0 : this.index_.compare(this.getStartPost(), node) < 0;
          const isWithinEnd = this.endIsInclusive_ ? this.index_.compare(node, this.getEndPost()) <= 0 : this.index_.compare(node, this.getEndPost()) < 0;
          return isWithinStart && isWithinEnd;
        }
        updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
          if (!this.matches(new NamedNode(key, newChild))) {
            newChild = ChildrenNode.EMPTY_NODE;
          }
          return this.indexedFilter_.updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator);
        }
        updateFullNode(oldSnap, newSnap, optChangeAccumulator) {
          if (newSnap.isLeafNode()) {
            newSnap = ChildrenNode.EMPTY_NODE;
          }
          let filtered = newSnap.withIndex(this.index_);
          filtered = filtered.updatePriority(ChildrenNode.EMPTY_NODE);
          const self2 = this;
          newSnap.forEachChild(PRIORITY_INDEX, (key, childNode) => {
            if (!self2.matches(new NamedNode(key, childNode))) {
              filtered = filtered.updateImmediateChild(key, ChildrenNode.EMPTY_NODE);
            }
          });
          return this.indexedFilter_.updateFullNode(oldSnap, filtered, optChangeAccumulator);
        }
        updatePriority(oldSnap, newPriority) {
          return oldSnap;
        }
        filtersNodes() {
          return true;
        }
        getIndexedFilter() {
          return this.indexedFilter_;
        }
        getIndex() {
          return this.index_;
        }
        static getStartPost_(params) {
          if (params.hasStart()) {
            const startName = params.getIndexStartName();
            return params.getIndex().makePost(params.getIndexStartValue(), startName);
          } else {
            return params.getIndex().minPost();
          }
        }
        static getEndPost_(params) {
          if (params.hasEnd()) {
            const endName = params.getIndexEndName();
            return params.getIndex().makePost(params.getIndexEndValue(), endName);
          } else {
            return params.getIndex().maxPost();
          }
        }
      };
      LimitedFilter = class {
        constructor(params) {
          this.withinDirectionalStart = (node) => this.reverse_ ? this.withinEndPost(node) : this.withinStartPost(node);
          this.withinDirectionalEnd = (node) => this.reverse_ ? this.withinStartPost(node) : this.withinEndPost(node);
          this.withinStartPost = (node) => {
            const compareRes = this.index_.compare(this.rangedFilter_.getStartPost(), node);
            return this.startIsInclusive_ ? compareRes <= 0 : compareRes < 0;
          };
          this.withinEndPost = (node) => {
            const compareRes = this.index_.compare(node, this.rangedFilter_.getEndPost());
            return this.endIsInclusive_ ? compareRes <= 0 : compareRes < 0;
          };
          this.rangedFilter_ = new RangedFilter(params);
          this.index_ = params.getIndex();
          this.limit_ = params.getLimit();
          this.reverse_ = !params.isViewFromLeft();
          this.startIsInclusive_ = !params.startAfterSet_;
          this.endIsInclusive_ = !params.endBeforeSet_;
        }
        updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator) {
          if (!this.rangedFilter_.matches(new NamedNode(key, newChild))) {
            newChild = ChildrenNode.EMPTY_NODE;
          }
          if (snap.getImmediateChild(key).equals(newChild)) {
            return snap;
          } else if (snap.numChildren() < this.limit_) {
            return this.rangedFilter_.getIndexedFilter().updateChild(snap, key, newChild, affectedPath, source, optChangeAccumulator);
          } else {
            return this.fullLimitUpdateChild_(snap, key, newChild, source, optChangeAccumulator);
          }
        }
        updateFullNode(oldSnap, newSnap, optChangeAccumulator) {
          let filtered;
          if (newSnap.isLeafNode() || newSnap.isEmpty()) {
            filtered = ChildrenNode.EMPTY_NODE.withIndex(this.index_);
          } else {
            if (this.limit_ * 2 < newSnap.numChildren() && newSnap.isIndexed(this.index_)) {
              filtered = ChildrenNode.EMPTY_NODE.withIndex(this.index_);
              let iterator;
              if (this.reverse_) {
                iterator = newSnap.getReverseIteratorFrom(this.rangedFilter_.getEndPost(), this.index_);
              } else {
                iterator = newSnap.getIteratorFrom(this.rangedFilter_.getStartPost(), this.index_);
              }
              let count = 0;
              while (iterator.hasNext() && count < this.limit_) {
                const next = iterator.getNext();
                if (!this.withinDirectionalStart(next)) {
                  continue;
                } else if (!this.withinDirectionalEnd(next)) {
                  break;
                } else {
                  filtered = filtered.updateImmediateChild(next.name, next.node);
                  count++;
                }
              }
            } else {
              filtered = newSnap.withIndex(this.index_);
              filtered = filtered.updatePriority(ChildrenNode.EMPTY_NODE);
              let iterator;
              if (this.reverse_) {
                iterator = filtered.getReverseIterator(this.index_);
              } else {
                iterator = filtered.getIterator(this.index_);
              }
              let count = 0;
              while (iterator.hasNext()) {
                const next = iterator.getNext();
                const inRange = count < this.limit_ && this.withinDirectionalStart(next) && this.withinDirectionalEnd(next);
                if (inRange) {
                  count++;
                } else {
                  filtered = filtered.updateImmediateChild(next.name, ChildrenNode.EMPTY_NODE);
                }
              }
            }
          }
          return this.rangedFilter_.getIndexedFilter().updateFullNode(oldSnap, filtered, optChangeAccumulator);
        }
        updatePriority(oldSnap, newPriority) {
          return oldSnap;
        }
        filtersNodes() {
          return true;
        }
        getIndexedFilter() {
          return this.rangedFilter_.getIndexedFilter();
        }
        getIndex() {
          return this.index_;
        }
        fullLimitUpdateChild_(snap, childKey, childSnap, source, changeAccumulator) {
          let cmp;
          if (this.reverse_) {
            const indexCmp = this.index_.getCompare();
            cmp = (a, b) => indexCmp(b, a);
          } else {
            cmp = this.index_.getCompare();
          }
          const oldEventCache = snap;
          assert(oldEventCache.numChildren() === this.limit_, "");
          const newChildNamedNode = new NamedNode(childKey, childSnap);
          const windowBoundary = this.reverse_ ? oldEventCache.getFirstChild(this.index_) : oldEventCache.getLastChild(this.index_);
          const inRange = this.rangedFilter_.matches(newChildNamedNode);
          if (oldEventCache.hasChild(childKey)) {
            const oldChildSnap = oldEventCache.getImmediateChild(childKey);
            let nextChild = source.getChildAfterChild(this.index_, windowBoundary, this.reverse_);
            while (nextChild != null && (nextChild.name === childKey || oldEventCache.hasChild(nextChild.name))) {
              nextChild = source.getChildAfterChild(this.index_, nextChild, this.reverse_);
            }
            const compareNext = nextChild == null ? 1 : cmp(nextChild, newChildNamedNode);
            const remainsInWindow = inRange && !childSnap.isEmpty() && compareNext >= 0;
            if (remainsInWindow) {
              if (changeAccumulator != null) {
                changeAccumulator.trackChildChange(changeChildChanged(childKey, childSnap, oldChildSnap));
              }
              return oldEventCache.updateImmediateChild(childKey, childSnap);
            } else {
              if (changeAccumulator != null) {
                changeAccumulator.trackChildChange(changeChildRemoved(childKey, oldChildSnap));
              }
              const newEventCache = oldEventCache.updateImmediateChild(childKey, ChildrenNode.EMPTY_NODE);
              const nextChildInRange = nextChild != null && this.rangedFilter_.matches(nextChild);
              if (nextChildInRange) {
                if (changeAccumulator != null) {
                  changeAccumulator.trackChildChange(changeChildAdded(nextChild.name, nextChild.node));
                }
                return newEventCache.updateImmediateChild(nextChild.name, nextChild.node);
              } else {
                return newEventCache;
              }
            }
          } else if (childSnap.isEmpty()) {
            return snap;
          } else if (inRange) {
            if (cmp(windowBoundary, newChildNamedNode) >= 0) {
              if (changeAccumulator != null) {
                changeAccumulator.trackChildChange(changeChildRemoved(windowBoundary.name, windowBoundary.node));
                changeAccumulator.trackChildChange(changeChildAdded(childKey, childSnap));
              }
              return oldEventCache.updateImmediateChild(childKey, childSnap).updateImmediateChild(windowBoundary.name, ChildrenNode.EMPTY_NODE);
            } else {
              return snap;
            }
          } else {
            return snap;
          }
        }
      };
      QueryParams = class _QueryParams {
        constructor() {
          this.limitSet_ = false;
          this.startSet_ = false;
          this.startNameSet_ = false;
          this.startAfterSet_ = false;
          this.endSet_ = false;
          this.endNameSet_ = false;
          this.endBeforeSet_ = false;
          this.limit_ = 0;
          this.viewFrom_ = "";
          this.indexStartValue_ = null;
          this.indexStartName_ = "";
          this.indexEndValue_ = null;
          this.indexEndName_ = "";
          this.index_ = PRIORITY_INDEX;
        }
        hasStart() {
          return this.startSet_;
        }
        /**
         * @returns True if it would return from left.
         */
        isViewFromLeft() {
          if (this.viewFrom_ === "") {
            return this.startSet_;
          } else {
            return this.viewFrom_ === "l";
          }
        }
        /**
         * Only valid to call if hasStart() returns true
         */
        getIndexStartValue() {
          assert(this.startSet_, "Only valid if start has been set");
          return this.indexStartValue_;
        }
        /**
         * Only valid to call if hasStart() returns true.
         * Returns the starting key name for the range defined by these query parameters
         */
        getIndexStartName() {
          assert(this.startSet_, "Only valid if start has been set");
          if (this.startNameSet_) {
            return this.indexStartName_;
          } else {
            return MIN_NAME;
          }
        }
        hasEnd() {
          return this.endSet_;
        }
        /**
         * Only valid to call if hasEnd() returns true.
         */
        getIndexEndValue() {
          assert(this.endSet_, "Only valid if end has been set");
          return this.indexEndValue_;
        }
        /**
         * Only valid to call if hasEnd() returns true.
         * Returns the end key name for the range defined by these query parameters
         */
        getIndexEndName() {
          assert(this.endSet_, "Only valid if end has been set");
          if (this.endNameSet_) {
            return this.indexEndName_;
          } else {
            return MAX_NAME;
          }
        }
        hasLimit() {
          return this.limitSet_;
        }
        /**
         * @returns True if a limit has been set and it has been explicitly anchored
         */
        hasAnchoredLimit() {
          return this.limitSet_ && this.viewFrom_ !== "";
        }
        /**
         * Only valid to call if hasLimit() returns true
         */
        getLimit() {
          assert(this.limitSet_, "Only valid if limit has been set");
          return this.limit_;
        }
        getIndex() {
          return this.index_;
        }
        loadsAllData() {
          return !(this.startSet_ || this.endSet_ || this.limitSet_);
        }
        isDefault() {
          return this.loadsAllData() && this.index_ === PRIORITY_INDEX;
        }
        copy() {
          const copy = new _QueryParams();
          copy.limitSet_ = this.limitSet_;
          copy.limit_ = this.limit_;
          copy.startSet_ = this.startSet_;
          copy.startAfterSet_ = this.startAfterSet_;
          copy.indexStartValue_ = this.indexStartValue_;
          copy.startNameSet_ = this.startNameSet_;
          copy.indexStartName_ = this.indexStartName_;
          copy.endSet_ = this.endSet_;
          copy.endBeforeSet_ = this.endBeforeSet_;
          copy.indexEndValue_ = this.indexEndValue_;
          copy.endNameSet_ = this.endNameSet_;
          copy.indexEndName_ = this.indexEndName_;
          copy.index_ = this.index_;
          copy.viewFrom_ = this.viewFrom_;
          return copy;
        }
      };
      ReadonlyRestClient = class _ReadonlyRestClient extends ServerActions {
        reportStats(stats) {
          throw new Error("Method not implemented.");
        }
        static getListenId_(query, tag) {
          if (tag !== void 0) {
            return "tag$" + tag;
          } else {
            assert(query._queryParams.isDefault(), "should have a tag if it's not a default query.");
            return query._path.toString();
          }
        }
        /**
         * @param repoInfo_ - Data about the namespace we are connecting to
         * @param onDataUpdate_ - A callback for new data from the server
         */
        constructor(repoInfo_, onDataUpdate_, authTokenProvider_, appCheckTokenProvider_) {
          super();
          this.repoInfo_ = repoInfo_;
          this.onDataUpdate_ = onDataUpdate_;
          this.authTokenProvider_ = authTokenProvider_;
          this.appCheckTokenProvider_ = appCheckTokenProvider_;
          this.log_ = logWrapper("p:rest:");
          this.listens_ = {};
        }
        /** @inheritDoc */
        listen(query, currentHashFn, tag, onComplete) {
          const pathString = query._path.toString();
          this.log_("Listen called for " + pathString + " " + query._queryIdentifier);
          const listenId = _ReadonlyRestClient.getListenId_(query, tag);
          const thisListen = {};
          this.listens_[listenId] = thisListen;
          const queryStringParameters = queryParamsToRestQueryStringParameters(query._queryParams);
          this.restRequest_(pathString + ".json", queryStringParameters, (error2, result) => {
            let data = result;
            if (error2 === 404) {
              data = null;
              error2 = null;
            }
            if (error2 === null) {
              this.onDataUpdate_(
                pathString,
                data,
                /*isMerge=*/
                false,
                tag
              );
            }
            if (safeGet(this.listens_, listenId) === thisListen) {
              let status;
              if (!error2) {
                status = "ok";
              } else if (error2 === 401) {
                status = "permission_denied";
              } else {
                status = "rest_error:" + error2;
              }
              onComplete(status, null);
            }
          });
        }
        /** @inheritDoc */
        unlisten(query, tag) {
          const listenId = _ReadonlyRestClient.getListenId_(query, tag);
          delete this.listens_[listenId];
        }
        get(query) {
          const queryStringParameters = queryParamsToRestQueryStringParameters(query._queryParams);
          const pathString = query._path.toString();
          const deferred = new Deferred();
          this.restRequest_(pathString + ".json", queryStringParameters, (error2, result) => {
            let data = result;
            if (error2 === 404) {
              data = null;
              error2 = null;
            }
            if (error2 === null) {
              this.onDataUpdate_(
                pathString,
                data,
                /*isMerge=*/
                false,
                /*tag=*/
                null
              );
              deferred.resolve(data);
            } else {
              deferred.reject(new Error(data));
            }
          });
          return deferred.promise;
        }
        /** @inheritDoc */
        refreshAuthToken(token) {
        }
        /**
         * Performs a REST request to the given path, with the provided query string parameters,
         * and any auth credentials we have.
         */
        restRequest_(pathString, queryStringParameters = {}, callback) {
          queryStringParameters["format"] = "export";
          return Promise.all([
            this.authTokenProvider_.getToken(
              /*forceRefresh=*/
              false
            ),
            this.appCheckTokenProvider_.getToken(
              /*forceRefresh=*/
              false
            )
          ]).then(([authToken, appCheckToken]) => {
            if (authToken && authToken.accessToken) {
              queryStringParameters["auth"] = authToken.accessToken;
            }
            if (appCheckToken && appCheckToken.token) {
              queryStringParameters["ac"] = appCheckToken.token;
            }
            const url = (this.repoInfo_.secure ? "https://" : "http://") + this.repoInfo_.host + pathString + "?ns=" + this.repoInfo_.namespace + querystring(queryStringParameters);
            this.log_("Sending REST request for " + url);
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
              if (callback && xhr.readyState === 4) {
                this.log_("REST Response for " + url + " received. status:", xhr.status, "response:", xhr.responseText);
                let res = null;
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    res = jsonEval(xhr.responseText);
                  } catch (e) {
                    warn("Failed to parse JSON response for " + url + ": " + xhr.responseText);
                  }
                  callback(null, res);
                } else {
                  if (xhr.status !== 401 && xhr.status !== 404) {
                    warn("Got unsuccessful REST response for " + url + " Status: " + xhr.status);
                  }
                  callback(xhr.status);
                }
                callback = null;
              }
            };
            xhr.open(
              "GET",
              url,
              /*asynchronous=*/
              true
            );
            xhr.send();
          });
        }
      };
      SnapshotHolder = class {
        constructor() {
          this.rootNode_ = ChildrenNode.EMPTY_NODE;
        }
        getNode(path) {
          return this.rootNode_.getChild(path);
        }
        updateSnapshot(path, newSnapshotNode) {
          this.rootNode_ = this.rootNode_.updateChild(path, newSnapshotNode);
        }
      };
      StatsListener = class {
        constructor(collection_) {
          this.collection_ = collection_;
          this.last_ = null;
        }
        get() {
          const newStats = this.collection_.get();
          const delta = { ...newStats };
          if (this.last_) {
            each(this.last_, (stat, value) => {
              delta[stat] = delta[stat] - value;
            });
          }
          this.last_ = newStats;
          return delta;
        }
      };
      FIRST_STATS_MIN_TIME = 10 * 1e3;
      FIRST_STATS_MAX_TIME = 30 * 1e3;
      REPORT_STATS_INTERVAL = 5 * 60 * 1e3;
      StatsReporter = class {
        constructor(collection, server_) {
          this.server_ = server_;
          this.statsToReport_ = {};
          this.statsListener_ = new StatsListener(collection);
          const timeout = FIRST_STATS_MIN_TIME + (FIRST_STATS_MAX_TIME - FIRST_STATS_MIN_TIME) * Math.random();
          setTimeoutNonBlocking(this.reportStats_.bind(this), Math.floor(timeout));
        }
        reportStats_() {
          const stats = this.statsListener_.get();
          const reportedStats = {};
          let haveStatsToReport = false;
          each(stats, (stat, value) => {
            if (value > 0 && contains(this.statsToReport_, stat)) {
              reportedStats[stat] = value;
              haveStatsToReport = true;
            }
          });
          if (haveStatsToReport) {
            this.server_.reportStats(reportedStats);
          }
          setTimeoutNonBlocking(this.reportStats_.bind(this), Math.floor(Math.random() * 2 * REPORT_STATS_INTERVAL));
        }
      };
      (function(OperationType3) {
        OperationType3[OperationType3["OVERWRITE"] = 0] = "OVERWRITE";
        OperationType3[OperationType3["MERGE"] = 1] = "MERGE";
        OperationType3[OperationType3["ACK_USER_WRITE"] = 2] = "ACK_USER_WRITE";
        OperationType3[OperationType3["LISTEN_COMPLETE"] = 3] = "LISTEN_COMPLETE";
      })(OperationType2 || (OperationType2 = {}));
      AckUserWrite = class _AckUserWrite {
        /**
         * @param affectedTree - A tree containing true for each affected path. Affected paths can't overlap.
         */
        constructor(path, affectedTree, revert) {
          this.path = path;
          this.affectedTree = affectedTree;
          this.revert = revert;
          this.type = OperationType2.ACK_USER_WRITE;
          this.source = newOperationSourceUser();
        }
        operationForChild(childName) {
          if (!pathIsEmpty(this.path)) {
            assert(pathGetFront(this.path) === childName, "operationForChild called for unrelated child.");
            return new _AckUserWrite(pathPopFront(this.path), this.affectedTree, this.revert);
          } else if (this.affectedTree.value != null) {
            assert(this.affectedTree.children.isEmpty(), "affectedTree should not have overlapping affected paths.");
            return this;
          } else {
            const childTree = this.affectedTree.subtree(new Path(childName));
            return new _AckUserWrite(newEmptyPath(), childTree, this.revert);
          }
        }
      };
      ListenComplete = class _ListenComplete {
        constructor(source, path) {
          this.source = source;
          this.path = path;
          this.type = OperationType2.LISTEN_COMPLETE;
        }
        operationForChild(childName) {
          if (pathIsEmpty(this.path)) {
            return new _ListenComplete(this.source, newEmptyPath());
          } else {
            return new _ListenComplete(this.source, pathPopFront(this.path));
          }
        }
      };
      Overwrite = class _Overwrite {
        constructor(source, path, snap) {
          this.source = source;
          this.path = path;
          this.snap = snap;
          this.type = OperationType2.OVERWRITE;
        }
        operationForChild(childName) {
          if (pathIsEmpty(this.path)) {
            return new _Overwrite(this.source, newEmptyPath(), this.snap.getImmediateChild(childName));
          } else {
            return new _Overwrite(this.source, pathPopFront(this.path), this.snap);
          }
        }
      };
      Merge = class _Merge {
        constructor(source, path, children) {
          this.source = source;
          this.path = path;
          this.children = children;
          this.type = OperationType2.MERGE;
        }
        operationForChild(childName) {
          if (pathIsEmpty(this.path)) {
            const childTree = this.children.subtree(new Path(childName));
            if (childTree.isEmpty()) {
              return null;
            } else if (childTree.value) {
              return new Overwrite(this.source, newEmptyPath(), childTree.value);
            } else {
              return new _Merge(this.source, newEmptyPath(), childTree);
            }
          } else {
            assert(pathGetFront(this.path) === childName, "Can't get a merge for a child not on the path of the operation");
            return new _Merge(this.source, pathPopFront(this.path), this.children);
          }
        }
        toString() {
          return "Operation(" + this.path + ": " + this.source.toString() + " merge: " + this.children.toString() + ")";
        }
      };
      CacheNode = class {
        constructor(node_, fullyInitialized_, filtered_) {
          this.node_ = node_;
          this.fullyInitialized_ = fullyInitialized_;
          this.filtered_ = filtered_;
        }
        /**
         * Returns whether this node was fully initialized with either server data or a complete overwrite by the client
         */
        isFullyInitialized() {
          return this.fullyInitialized_;
        }
        /**
         * Returns whether this node is potentially missing children due to a filter applied to the node
         */
        isFiltered() {
          return this.filtered_;
        }
        isCompleteForPath(path) {
          if (pathIsEmpty(path)) {
            return this.isFullyInitialized() && !this.filtered_;
          }
          const childKey = pathGetFront(path);
          return this.isCompleteForChild(childKey);
        }
        isCompleteForChild(key) {
          return this.isFullyInitialized() && !this.filtered_ || this.node_.hasChild(key);
        }
        getNode() {
          return this.node_;
        }
      };
      EventGenerator = class {
        constructor(query_) {
          this.query_ = query_;
          this.index_ = this.query_._queryParams.getIndex();
        }
      };
      EmptyChildren = () => {
        if (!emptyChildrenSingleton) {
          emptyChildrenSingleton = new SortedMap(stringCompare);
        }
        return emptyChildrenSingleton;
      };
      ImmutableTree = class _ImmutableTree {
        static fromObject(obj) {
          let tree = new _ImmutableTree(null);
          each(obj, (childPath, childSnap) => {
            tree = tree.set(new Path(childPath), childSnap);
          });
          return tree;
        }
        constructor(value, children = EmptyChildren()) {
          this.value = value;
          this.children = children;
        }
        /**
         * True if the value is empty and there are no children
         */
        isEmpty() {
          return this.value === null && this.children.isEmpty();
        }
        /**
         * Given a path and predicate, return the first node and the path to that node
         * where the predicate returns true.
         *
         * TODO Do a perf test -- If we're creating a bunch of `{path: value:}`
         * objects on the way back out, it may be better to pass down a pathSoFar obj.
         *
         * @param relativePath - The remainder of the path
         * @param predicate - The predicate to satisfy to return a node
         */
        findRootMostMatchingPathAndValue(relativePath, predicate) {
          if (this.value != null && predicate(this.value)) {
            return { path: newEmptyPath(), value: this.value };
          } else {
            if (pathIsEmpty(relativePath)) {
              return null;
            } else {
              const front = pathGetFront(relativePath);
              const child2 = this.children.get(front);
              if (child2 !== null) {
                const childExistingPathAndValue = child2.findRootMostMatchingPathAndValue(pathPopFront(relativePath), predicate);
                if (childExistingPathAndValue != null) {
                  const fullPath = pathChild(new Path(front), childExistingPathAndValue.path);
                  return { path: fullPath, value: childExistingPathAndValue.value };
                } else {
                  return null;
                }
              } else {
                return null;
              }
            }
          }
        }
        /**
         * Find, if it exists, the shortest subpath of the given path that points a defined
         * value in the tree
         */
        findRootMostValueAndPath(relativePath) {
          return this.findRootMostMatchingPathAndValue(relativePath, () => true);
        }
        /**
         * @returns The subtree at the given path
         */
        subtree(relativePath) {
          if (pathIsEmpty(relativePath)) {
            return this;
          } else {
            const front = pathGetFront(relativePath);
            const childTree = this.children.get(front);
            if (childTree !== null) {
              return childTree.subtree(pathPopFront(relativePath));
            } else {
              return new _ImmutableTree(null);
            }
          }
        }
        /**
         * Sets a value at the specified path.
         *
         * @param relativePath - Path to set value at.
         * @param toSet - Value to set.
         * @returns Resulting tree.
         */
        set(relativePath, toSet) {
          if (pathIsEmpty(relativePath)) {
            return new _ImmutableTree(toSet, this.children);
          } else {
            const front = pathGetFront(relativePath);
            const child2 = this.children.get(front) || new _ImmutableTree(null);
            const newChild = child2.set(pathPopFront(relativePath), toSet);
            const newChildren = this.children.insert(front, newChild);
            return new _ImmutableTree(this.value, newChildren);
          }
        }
        /**
         * Removes the value at the specified path.
         *
         * @param relativePath - Path to value to remove.
         * @returns Resulting tree.
         */
        remove(relativePath) {
          if (pathIsEmpty(relativePath)) {
            if (this.children.isEmpty()) {
              return new _ImmutableTree(null);
            } else {
              return new _ImmutableTree(null, this.children);
            }
          } else {
            const front = pathGetFront(relativePath);
            const child2 = this.children.get(front);
            if (child2) {
              const newChild = child2.remove(pathPopFront(relativePath));
              let newChildren;
              if (newChild.isEmpty()) {
                newChildren = this.children.remove(front);
              } else {
                newChildren = this.children.insert(front, newChild);
              }
              if (this.value === null && newChildren.isEmpty()) {
                return new _ImmutableTree(null);
              } else {
                return new _ImmutableTree(this.value, newChildren);
              }
            } else {
              return this;
            }
          }
        }
        /**
         * Gets a value from the tree.
         *
         * @param relativePath - Path to get value for.
         * @returns Value at path, or null.
         */
        get(relativePath) {
          if (pathIsEmpty(relativePath)) {
            return this.value;
          } else {
            const front = pathGetFront(relativePath);
            const child2 = this.children.get(front);
            if (child2) {
              return child2.get(pathPopFront(relativePath));
            } else {
              return null;
            }
          }
        }
        /**
         * Replace the subtree at the specified path with the given new tree.
         *
         * @param relativePath - Path to replace subtree for.
         * @param newTree - New tree.
         * @returns Resulting tree.
         */
        setTree(relativePath, newTree) {
          if (pathIsEmpty(relativePath)) {
            return newTree;
          } else {
            const front = pathGetFront(relativePath);
            const child2 = this.children.get(front) || new _ImmutableTree(null);
            const newChild = child2.setTree(pathPopFront(relativePath), newTree);
            let newChildren;
            if (newChild.isEmpty()) {
              newChildren = this.children.remove(front);
            } else {
              newChildren = this.children.insert(front, newChild);
            }
            return new _ImmutableTree(this.value, newChildren);
          }
        }
        /**
         * Performs a depth first fold on this tree. Transforms a tree into a single
         * value, given a function that operates on the path to a node, an optional
         * current value, and a map of child names to folded subtrees
         */
        fold(fn) {
          return this.fold_(newEmptyPath(), fn);
        }
        /**
         * Recursive helper for public-facing fold() method
         */
        fold_(pathSoFar, fn) {
          const accum = {};
          this.children.inorderTraversal((childKey, childTree) => {
            accum[childKey] = childTree.fold_(pathChild(pathSoFar, childKey), fn);
          });
          return fn(pathSoFar, this.value, accum);
        }
        /**
         * Find the first matching value on the given path. Return the result of applying f to it.
         */
        findOnPath(path, f) {
          return this.findOnPath_(path, newEmptyPath(), f);
        }
        findOnPath_(pathToFollow, pathSoFar, f) {
          const result = this.value ? f(pathSoFar, this.value) : false;
          if (result) {
            return result;
          } else {
            if (pathIsEmpty(pathToFollow)) {
              return null;
            } else {
              const front = pathGetFront(pathToFollow);
              const nextChild = this.children.get(front);
              if (nextChild) {
                return nextChild.findOnPath_(pathPopFront(pathToFollow), pathChild(pathSoFar, front), f);
              } else {
                return null;
              }
            }
          }
        }
        foreachOnPath(path, f) {
          return this.foreachOnPath_(path, newEmptyPath(), f);
        }
        foreachOnPath_(pathToFollow, currentRelativePath, f) {
          if (pathIsEmpty(pathToFollow)) {
            return this;
          } else {
            if (this.value) {
              f(currentRelativePath, this.value);
            }
            const front = pathGetFront(pathToFollow);
            const nextChild = this.children.get(front);
            if (nextChild) {
              return nextChild.foreachOnPath_(pathPopFront(pathToFollow), pathChild(currentRelativePath, front), f);
            } else {
              return new _ImmutableTree(null);
            }
          }
        }
        /**
         * Calls the given function for each node in the tree that has a value.
         *
         * @param f - A function to be called with the path from the root of the tree to
         * a node, and the value at that node. Called in depth-first order.
         */
        foreach(f) {
          this.foreach_(newEmptyPath(), f);
        }
        foreach_(currentRelativePath, f) {
          this.children.inorderTraversal((childName, childTree) => {
            childTree.foreach_(pathChild(currentRelativePath, childName), f);
          });
          if (this.value) {
            f(currentRelativePath, this.value);
          }
        }
        foreachChild(f) {
          this.children.inorderTraversal((childName, childTree) => {
            if (childTree.value) {
              f(childName, childTree.value);
            }
          });
        }
      };
      CompoundWrite = class _CompoundWrite {
        constructor(writeTree_) {
          this.writeTree_ = writeTree_;
        }
        static empty() {
          return new _CompoundWrite(new ImmutableTree(null));
        }
      };
      ChildChangeAccumulator = class {
        constructor() {
          this.changeMap = /* @__PURE__ */ new Map();
        }
        trackChildChange(change) {
          const type = change.type;
          const childKey = change.childName;
          assert(type === "child_added" || type === "child_changed" || type === "child_removed", "Only child changes supported for tracking");
          assert(childKey !== ".priority", "Only non-priority child changes can be tracked.");
          const oldChange = this.changeMap.get(childKey);
          if (oldChange) {
            const oldType = oldChange.type;
            if (type === "child_added" && oldType === "child_removed") {
              this.changeMap.set(childKey, changeChildChanged(childKey, change.snapshotNode, oldChange.snapshotNode));
            } else if (type === "child_removed" && oldType === "child_added") {
              this.changeMap.delete(childKey);
            } else if (type === "child_removed" && oldType === "child_changed") {
              this.changeMap.set(childKey, changeChildRemoved(childKey, oldChange.oldSnap));
            } else if (type === "child_changed" && oldType === "child_added") {
              this.changeMap.set(childKey, changeChildAdded(childKey, change.snapshotNode));
            } else if (type === "child_changed" && oldType === "child_changed") {
              this.changeMap.set(childKey, changeChildChanged(childKey, change.snapshotNode, oldChange.oldSnap));
            } else {
              throw assertionError("Illegal combination of changes: " + change + " occurred after " + oldChange);
            }
          } else {
            this.changeMap.set(childKey, change);
          }
        }
        getChanges() {
          return Array.from(this.changeMap.values());
        }
      };
      NoCompleteChildSource_ = class {
        getCompleteChild(childKey) {
          return null;
        }
        getChildAfterChild(index, child2, reverse) {
          return null;
        }
      };
      NO_COMPLETE_CHILD_SOURCE = new NoCompleteChildSource_();
      WriteTreeCompleteChildSource = class {
        constructor(writes_, viewCache_, optCompleteServerCache_ = null) {
          this.writes_ = writes_;
          this.viewCache_ = viewCache_;
          this.optCompleteServerCache_ = optCompleteServerCache_;
        }
        getCompleteChild(childKey) {
          const node = this.viewCache_.eventCache;
          if (node.isCompleteForChild(childKey)) {
            return node.getNode().getImmediateChild(childKey);
          } else {
            const serverNode = this.optCompleteServerCache_ != null ? new CacheNode(this.optCompleteServerCache_, true, false) : this.viewCache_.serverCache;
            return writeTreeRefCalcCompleteChild(this.writes_, childKey, serverNode);
          }
        }
        getChildAfterChild(index, child2, reverse) {
          const completeServerData = this.optCompleteServerCache_ != null ? this.optCompleteServerCache_ : viewCacheGetCompleteServerSnap(this.viewCache_);
          const nodes = writeTreeRefCalcIndexedSlice(this.writes_, completeServerData, child2, 1, reverse, index);
          if (nodes.length === 0) {
            return null;
          } else {
            return nodes[0];
          }
        }
      };
      View = class {
        constructor(query_, initialViewCache) {
          this.query_ = query_;
          this.eventRegistrations_ = [];
          const params = this.query_._queryParams;
          const indexFilter = new IndexedFilter(params.getIndex());
          const filter = queryParamsGetNodeFilter(params);
          this.processor_ = newViewProcessor(filter);
          const initialServerCache = initialViewCache.serverCache;
          const initialEventCache = initialViewCache.eventCache;
          const serverSnap = indexFilter.updateFullNode(ChildrenNode.EMPTY_NODE, initialServerCache.getNode(), null);
          const eventSnap = filter.updateFullNode(ChildrenNode.EMPTY_NODE, initialEventCache.getNode(), null);
          const newServerCache = new CacheNode(serverSnap, initialServerCache.isFullyInitialized(), indexFilter.filtersNodes());
          const newEventCache = new CacheNode(eventSnap, initialEventCache.isFullyInitialized(), filter.filtersNodes());
          this.viewCache_ = newViewCache(newEventCache, newServerCache);
          this.eventGenerator_ = new EventGenerator(this.query_);
        }
        get query() {
          return this.query_;
        }
      };
      SyncPoint = class {
        constructor() {
          this.views = /* @__PURE__ */ new Map();
        }
      };
      syncTreeNextQueryTag_ = 1;
      SyncTree = class {
        /**
         * @param listenProvider_ - Used by SyncTree to start / stop listening
         *   to server data.
         */
        constructor(listenProvider_) {
          this.listenProvider_ = listenProvider_;
          this.syncPointTree_ = new ImmutableTree(null);
          this.pendingWriteTree_ = newWriteTree();
          this.tagToQueryMap = /* @__PURE__ */ new Map();
          this.queryToTagMap = /* @__PURE__ */ new Map();
        }
      };
      ExistingValueProvider = class _ExistingValueProvider {
        constructor(node_) {
          this.node_ = node_;
        }
        getImmediateChild(childName) {
          const child2 = this.node_.getImmediateChild(childName);
          return new _ExistingValueProvider(child2);
        }
        node() {
          return this.node_;
        }
      };
      DeferredValueProvider = class _DeferredValueProvider {
        constructor(syncTree, path) {
          this.syncTree_ = syncTree;
          this.path_ = path;
        }
        getImmediateChild(childName) {
          const childPath = pathChild(this.path_, childName);
          return new _DeferredValueProvider(this.syncTree_, childPath);
        }
        node() {
          return syncTreeCalcCompleteEventCache(this.syncTree_, this.path_);
        }
      };
      generateWithValues = function(values) {
        values = values || {};
        values["timestamp"] = values["timestamp"] || (/* @__PURE__ */ new Date()).getTime();
        return values;
      };
      resolveDeferredLeafValue = function(value, existingVal, serverValues) {
        if (!value || typeof value !== "object") {
          return value;
        }
        assert(".sv" in value, "Unexpected leaf node or priority contents");
        if (typeof value[".sv"] === "string") {
          return resolveScalarDeferredValue(value[".sv"], existingVal, serverValues);
        } else if (typeof value[".sv"] === "object") {
          return resolveComplexDeferredValue(value[".sv"], existingVal);
        } else {
          assert(false, "Unexpected server value: " + JSON.stringify(value, null, 2));
        }
      };
      resolveScalarDeferredValue = function(op, existing, serverValues) {
        switch (op) {
          case "timestamp":
            return serverValues["timestamp"];
          default:
            assert(false, "Unexpected server value: " + op);
        }
      };
      resolveComplexDeferredValue = function(op, existing, unused) {
        if (!op.hasOwnProperty("increment")) {
          assert(false, "Unexpected server value: " + JSON.stringify(op, null, 2));
        }
        const delta = op["increment"];
        if (typeof delta !== "number") {
          assert(false, "Unexpected increment value: " + delta);
        }
        const existingNode = existing.node();
        assert(existingNode !== null && typeof existingNode !== "undefined", "Expected ChildrenNode.EMPTY_NODE for nulls");
        if (!existingNode.isLeafNode()) {
          return delta;
        }
        const leaf = existingNode;
        const existingVal = leaf.getValue();
        if (typeof existingVal !== "number") {
          return delta;
        }
        return existingVal + delta;
      };
      resolveDeferredValueTree = function(path, node, syncTree, serverValues) {
        return resolveDeferredValue(node, new DeferredValueProvider(syncTree, path), serverValues);
      };
      resolveDeferredValueSnapshot = function(node, existing, serverValues) {
        return resolveDeferredValue(node, new ExistingValueProvider(existing), serverValues);
      };
      Tree = class {
        /**
         * @param name - Optional name of the node.
         * @param parent - Optional parent node.
         * @param node - Optional node to wrap.
         */
        constructor(name5 = "", parent = null, node = { children: {}, childCount: 0 }) {
          this.name = name5;
          this.parent = parent;
          this.node = node;
        }
      };
      INVALID_KEY_REGEX_ = /[\[\].#$\/\u0000-\u001F\u007F]/;
      INVALID_PATH_REGEX_ = /[\[\].#$\u0000-\u001F\u007F]/;
      MAX_LEAF_SIZE_ = 10 * 1024 * 1024;
      isValidKey2 = function(key) {
        return typeof key === "string" && key.length !== 0 && !INVALID_KEY_REGEX_.test(key);
      };
      isValidPathString = function(pathString) {
        return typeof pathString === "string" && pathString.length !== 0 && !INVALID_PATH_REGEX_.test(pathString);
      };
      isValidRootPathString = function(pathString) {
        if (pathString) {
          pathString = pathString.replace(/^\/*\.info(\/|$)/, "/");
        }
        return isValidPathString(pathString);
      };
      isValidPriority = function(priority) {
        return priority === null || typeof priority === "string" || typeof priority === "number" && !isInvalidJSONNumber(priority) || priority && typeof priority === "object" && // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contains(priority, ".sv");
      };
      validateFirebaseDataArg = function(fnName, value, path, optional) {
        if (optional && value === void 0) {
          return;
        }
        validateFirebaseData(errorPrefix(fnName, "value"), value, path);
      };
      validateFirebaseData = function(errorPrefix2, data, path_) {
        const path = path_ instanceof Path ? new ValidationPath(path_, errorPrefix2) : path_;
        if (data === void 0) {
          throw new Error(errorPrefix2 + "contains undefined " + validationPathToErrorString(path));
        }
        if (typeof data === "function") {
          throw new Error(errorPrefix2 + "contains a function " + validationPathToErrorString(path) + " with contents = " + data.toString());
        }
        if (isInvalidJSONNumber(data)) {
          throw new Error(errorPrefix2 + "contains " + data.toString() + " " + validationPathToErrorString(path));
        }
        if (typeof data === "string" && data.length > MAX_LEAF_SIZE_ / 3 && stringLength(data) > MAX_LEAF_SIZE_) {
          throw new Error(errorPrefix2 + "contains a string greater than " + MAX_LEAF_SIZE_ + " utf8 bytes " + validationPathToErrorString(path) + " ('" + data.substring(0, 50) + "...')");
        }
        if (data && typeof data === "object") {
          let hasDotValue = false;
          let hasActualChild = false;
          each(data, (key, value) => {
            if (key === ".value") {
              hasDotValue = true;
            } else if (key !== ".priority" && key !== ".sv") {
              hasActualChild = true;
              if (!isValidKey2(key)) {
                throw new Error(errorPrefix2 + " contains an invalid key (" + key + ") " + validationPathToErrorString(path) + `.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);
              }
            }
            validationPathPush(path, key);
            validateFirebaseData(errorPrefix2, value, path);
            validationPathPop(path);
          });
          if (hasDotValue && hasActualChild) {
            throw new Error(errorPrefix2 + ' contains ".value" child ' + validationPathToErrorString(path) + " in addition to actual children.");
          }
        }
      };
      validatePathString = function(fnName, argumentName, pathString, optional) {
        if (optional && pathString === void 0) {
          return;
        }
        if (!isValidPathString(pathString)) {
          throw new Error(errorPrefix(fnName, argumentName) + 'was an invalid path = "' + pathString + `". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`);
        }
      };
      validateRootPathString = function(fnName, argumentName, pathString, optional) {
        if (pathString) {
          pathString = pathString.replace(/^\/*\.info(\/|$)/, "/");
        }
        validatePathString(fnName, argumentName, pathString, optional);
      };
      validateWritablePath = function(fnName, path) {
        if (pathGetFront(path) === ".info") {
          throw new Error(fnName + " failed = Can't modify data under /.info/");
        }
      };
      validateUrl = function(fnName, parsedUrl) {
        const pathString = parsedUrl.path.toString();
        if (!(typeof parsedUrl.repoInfo.host === "string") || parsedUrl.repoInfo.host.length === 0 || !isValidKey2(parsedUrl.repoInfo.namespace) && parsedUrl.repoInfo.host.split(":")[0] !== "localhost" || pathString.length !== 0 && !isValidRootPathString(pathString)) {
          throw new Error(errorPrefix(fnName, "url") + `must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`);
        }
      };
      EventQueue = class {
        constructor() {
          this.eventLists_ = [];
          this.recursionDepth_ = 0;
        }
      };
      INTERRUPT_REASON = "repo_interrupt";
      MAX_TRANSACTION_RETRIES = 25;
      Repo = class {
        constructor(repoInfo_, forceRestClient_, authTokenProvider_, appCheckProvider_) {
          this.repoInfo_ = repoInfo_;
          this.forceRestClient_ = forceRestClient_;
          this.authTokenProvider_ = authTokenProvider_;
          this.appCheckProvider_ = appCheckProvider_;
          this.dataUpdateCount = 0;
          this.statsListener_ = null;
          this.eventQueue_ = new EventQueue();
          this.nextWriteId_ = 1;
          this.interceptServerDataCallback_ = null;
          this.onDisconnect_ = newSparseSnapshotTree();
          this.transactionQueueTree_ = new Tree();
          this.persistentConnection_ = null;
          this.key = this.repoInfo_.toURLString();
        }
        /**
         * @returns The URL corresponding to the root of this Firebase.
         */
        toString() {
          return (this.repoInfo_.secure ? "https://" : "http://") + this.repoInfo_.host;
        }
      };
      parseRepoInfo = function(dataURL, nodeAdmin) {
        const parsedUrl = parseDatabaseURL(dataURL), namespace = parsedUrl.namespace;
        if (parsedUrl.domain === "firebase.com") {
          fatal(parsedUrl.host + " is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead");
        }
        if ((!namespace || namespace === "undefined") && parsedUrl.domain !== "localhost") {
          fatal("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com");
        }
        if (!parsedUrl.secure) {
          warnIfPageIsSecure();
        }
        const webSocketOnly = parsedUrl.scheme === "ws" || parsedUrl.scheme === "wss";
        return {
          repoInfo: new RepoInfo(
            parsedUrl.host,
            parsedUrl.secure,
            namespace,
            webSocketOnly,
            nodeAdmin,
            /*persistenceKey=*/
            "",
            /*includeNamespaceInQueryParams=*/
            namespace !== parsedUrl.subdomain
          ),
          path: new Path(parsedUrl.pathString)
        };
      };
      parseDatabaseURL = function(dataURL) {
        let host = "", domain = "", subdomain = "", pathString = "", namespace = "";
        let secure = true, scheme = "https", port = 443;
        if (typeof dataURL === "string") {
          let colonInd = dataURL.indexOf("//");
          if (colonInd >= 0) {
            scheme = dataURL.substring(0, colonInd - 1);
            dataURL = dataURL.substring(colonInd + 2);
          }
          let slashInd = dataURL.indexOf("/");
          if (slashInd === -1) {
            slashInd = dataURL.length;
          }
          let questionMarkInd = dataURL.indexOf("?");
          if (questionMarkInd === -1) {
            questionMarkInd = dataURL.length;
          }
          host = dataURL.substring(0, Math.min(slashInd, questionMarkInd));
          if (slashInd < questionMarkInd) {
            pathString = decodePath(dataURL.substring(slashInd, questionMarkInd));
          }
          const queryParams = decodeQuery(dataURL.substring(Math.min(dataURL.length, questionMarkInd)));
          colonInd = host.indexOf(":");
          if (colonInd >= 0) {
            secure = scheme === "https" || scheme === "wss";
            port = parseInt(host.substring(colonInd + 1), 10);
          } else {
            colonInd = host.length;
          }
          const hostWithoutPort = host.slice(0, colonInd);
          if (hostWithoutPort.toLowerCase() === "localhost") {
            domain = "localhost";
          } else if (hostWithoutPort.split(".").length <= 2) {
            domain = hostWithoutPort;
          } else {
            const dotInd = host.indexOf(".");
            subdomain = host.substring(0, dotInd).toLowerCase();
            domain = host.substring(dotInd + 1);
            namespace = subdomain;
          }
          if ("ns" in queryParams) {
            namespace = queryParams["ns"];
          }
        }
        return {
          host,
          port,
          domain,
          subdomain,
          secure,
          scheme,
          pathString,
          namespace
        };
      };
      DataEvent = class {
        /**
         * @param eventType - One of: value, child_added, child_changed, child_moved, child_removed
         * @param eventRegistration - The function to call to with the event data. User provided
         * @param snapshot - The data backing the event
         * @param prevName - Optional, the name of the previous child for child_* events.
         */
        constructor(eventType, eventRegistration, snapshot, prevName) {
          this.eventType = eventType;
          this.eventRegistration = eventRegistration;
          this.snapshot = snapshot;
          this.prevName = prevName;
        }
        getPath() {
          const ref2 = this.snapshot.ref;
          if (this.eventType === "value") {
            return ref2._path;
          } else {
            return ref2.parent._path;
          }
        }
        getEventType() {
          return this.eventType;
        }
        getEventRunner() {
          return this.eventRegistration.getEventRunner(this);
        }
        toString() {
          return this.getPath().toString() + ":" + this.eventType + ":" + stringify(this.snapshot.exportVal());
        }
      };
      CancelEvent = class {
        constructor(eventRegistration, error2, path) {
          this.eventRegistration = eventRegistration;
          this.error = error2;
          this.path = path;
        }
        getPath() {
          return this.path;
        }
        getEventType() {
          return "cancel";
        }
        getEventRunner() {
          return this.eventRegistration.getEventRunner(this);
        }
        toString() {
          return this.path.toString() + ":cancel";
        }
      };
      CallbackContext = class {
        constructor(snapshotCallback, cancelCallback) {
          this.snapshotCallback = snapshotCallback;
          this.cancelCallback = cancelCallback;
        }
        onValue(expDataSnapshot, previousChildName) {
          this.snapshotCallback.call(null, expDataSnapshot, previousChildName);
        }
        onCancel(error2) {
          assert(this.hasCancelCallback, "Raising a cancel event on a listener with no cancel callback");
          return this.cancelCallback.call(null, error2);
        }
        get hasCancelCallback() {
          return !!this.cancelCallback;
        }
        matches(other) {
          return this.snapshotCallback === other.snapshotCallback || this.snapshotCallback.userCallback !== void 0 && this.snapshotCallback.userCallback === other.snapshotCallback.userCallback && this.snapshotCallback.context === other.snapshotCallback.context;
        }
      };
      QueryImpl = class _QueryImpl {
        /**
         * @hideconstructor
         */
        constructor(_repo, _path, _queryParams, _orderByCalled) {
          this._repo = _repo;
          this._path = _path;
          this._queryParams = _queryParams;
          this._orderByCalled = _orderByCalled;
        }
        get key() {
          if (pathIsEmpty(this._path)) {
            return null;
          } else {
            return pathGetBack(this._path);
          }
        }
        get ref() {
          return new ReferenceImpl(this._repo, this._path);
        }
        get _queryIdentifier() {
          const obj = queryParamsGetQueryObject(this._queryParams);
          const id = ObjectToUniqueKey(obj);
          return id === "{}" ? "default" : id;
        }
        /**
         * An object representation of the query parameters used by this Query.
         */
        get _queryObject() {
          return queryParamsGetQueryObject(this._queryParams);
        }
        isEqual(other) {
          other = getModularInstance(other);
          if (!(other instanceof _QueryImpl)) {
            return false;
          }
          const sameRepo = this._repo === other._repo;
          const samePath = pathEquals(this._path, other._path);
          const sameQueryIdentifier = this._queryIdentifier === other._queryIdentifier;
          return sameRepo && samePath && sameQueryIdentifier;
        }
        toJSON() {
          return this.toString();
        }
        toString() {
          return this._repo.toString() + pathToUrlEncodedString(this._path);
        }
      };
      ReferenceImpl = class _ReferenceImpl extends QueryImpl {
        /** @hideconstructor */
        constructor(repo, path) {
          super(repo, path, new QueryParams(), false);
        }
        get parent() {
          const parentPath = pathParent(this._path);
          return parentPath === null ? null : new _ReferenceImpl(this._repo, parentPath);
        }
        get root() {
          let ref2 = this;
          while (ref2.parent !== null) {
            ref2 = ref2.parent;
          }
          return ref2;
        }
      };
      DataSnapshot = class _DataSnapshot {
        /**
         * @param _node - A SnapshotNode to wrap.
         * @param ref - The location this snapshot came from.
         * @param _index - The iteration order for this snapshot
         * @hideconstructor
         */
        constructor(_node, ref2, _index) {
          this._node = _node;
          this.ref = ref2;
          this._index = _index;
        }
        /**
         * Gets the priority value of the data in this `DataSnapshot`.
         *
         * Applications need not use priority but can order collections by
         * ordinary properties (see
         * {@link https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data |Sorting and filtering data}
         * ).
         */
        get priority() {
          return this._node.getPriority().val();
        }
        /**
         * The key (last part of the path) of the location of this `DataSnapshot`.
         *
         * The last token in a Database location is considered its key. For example,
         * "ada" is the key for the /users/ada/ node. Accessing the key on any
         * `DataSnapshot` will return the key for the location that generated it.
         * However, accessing the key on the root URL of a Database will return
         * `null`.
         */
        get key() {
          return this.ref.key;
        }
        /** Returns the number of child properties of this `DataSnapshot`. */
        get size() {
          return this._node.numChildren();
        }
        /**
         * Gets another `DataSnapshot` for the location at the specified relative path.
         *
         * Passing a relative path to the `child()` method of a DataSnapshot returns
         * another `DataSnapshot` for the location at the specified relative path. The
         * relative path can either be a simple child name (for example, "ada") or a
         * deeper, slash-separated path (for example, "ada/name/first"). If the child
         * location has no data, an empty `DataSnapshot` (that is, a `DataSnapshot`
         * whose value is `null`) is returned.
         *
         * @param path - A relative path to the location of child data.
         */
        child(path) {
          const childPath = new Path(path);
          const childRef = child(this.ref, path);
          return new _DataSnapshot(this._node.getChild(childPath), childRef, PRIORITY_INDEX);
        }
        /**
         * Returns true if this `DataSnapshot` contains any data. It is slightly more
         * efficient than using `snapshot.val() !== null`.
         */
        exists() {
          return !this._node.isEmpty();
        }
        /**
         * Exports the entire contents of the DataSnapshot as a JavaScript object.
         *
         * The `exportVal()` method is similar to `val()`, except priority information
         * is included (if available), making it suitable for backing up your data.
         *
         * @returns The DataSnapshot's contents as a JavaScript value (Object,
         *   Array, string, number, boolean, or `null`).
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exportVal() {
          return this._node.val(true);
        }
        /**
         * Enumerates the top-level children in the `IteratedDataSnapshot`.
         *
         * Because of the way JavaScript objects work, the ordering of data in the
         * JavaScript object returned by `val()` is not guaranteed to match the
         * ordering on the server nor the ordering of `onChildAdded()` events. That is
         * where `forEach()` comes in handy. It guarantees the children of a
         * `DataSnapshot` will be iterated in their query order.
         *
         * If no explicit `orderBy*()` method is used, results are returned
         * ordered by key (unless priorities are used, in which case, results are
         * returned by priority).
         *
         * @param action - A function that will be called for each child DataSnapshot.
         * The callback can return true to cancel further enumeration.
         * @returns true if enumeration was canceled due to your callback returning
         * true.
         */
        forEach(action) {
          if (this._node.isLeafNode()) {
            return false;
          }
          const childrenNode = this._node;
          return !!childrenNode.forEachChild(this._index, (key, node) => {
            return action(new _DataSnapshot(node, child(this.ref, key), PRIORITY_INDEX));
          });
        }
        /**
         * Returns true if the specified child path has (non-null) data.
         *
         * @param path - A relative path to the location of a potential child.
         * @returns `true` if data exists at the specified child path; else
         *  `false`.
         */
        hasChild(path) {
          const childPath = new Path(path);
          return !this._node.getChild(childPath).isEmpty();
        }
        /**
         * Returns whether or not the `DataSnapshot` has any non-`null` child
         * properties.
         *
         * You can use `hasChildren()` to determine if a `DataSnapshot` has any
         * children. If it does, you can enumerate them using `forEach()`. If it
         * doesn't, then either this snapshot contains a primitive value (which can be
         * retrieved with `val()`) or it is empty (in which case, `val()` will return
         * `null`).
         *
         * @returns true if this snapshot has any children; else false.
         */
        hasChildren() {
          if (this._node.isLeafNode()) {
            return false;
          } else {
            return !this._node.isEmpty();
          }
        }
        /**
         * Returns a JSON-serializable representation of this object.
         */
        toJSON() {
          return this.exportVal();
        }
        /**
         * Extracts a JavaScript value from a `DataSnapshot`.
         *
         * Depending on the data in a `DataSnapshot`, the `val()` method may return a
         * scalar type (string, number, or boolean), an array, or an object. It may
         * also return null, indicating that the `DataSnapshot` is empty (contains no
         * data).
         *
         * @returns The DataSnapshot's contents as a JavaScript value (Object,
         *   Array, string, number, boolean, or `null`).
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val() {
          return this._node.val();
        }
      };
      ValueEventRegistration = class _ValueEventRegistration {
        constructor(callbackContext) {
          this.callbackContext = callbackContext;
        }
        respondsTo(eventType) {
          return eventType === "value";
        }
        createEvent(change, query) {
          const index = query._queryParams.getIndex();
          return new DataEvent("value", this, new DataSnapshot(change.snapshotNode, new ReferenceImpl(query._repo, query._path), index));
        }
        getEventRunner(eventData) {
          if (eventData.getEventType() === "cancel") {
            return () => this.callbackContext.onCancel(eventData.error);
          } else {
            return () => this.callbackContext.onValue(eventData.snapshot, null);
          }
        }
        createCancelEvent(error2, path) {
          if (this.callbackContext.hasCancelCallback) {
            return new CancelEvent(this, error2, path);
          } else {
            return null;
          }
        }
        matches(other) {
          if (!(other instanceof _ValueEventRegistration)) {
            return false;
          } else if (!other.callbackContext || !this.callbackContext) {
            return true;
          } else {
            return other.callbackContext.matches(this.callbackContext);
          }
        }
        hasAnyCallback() {
          return this.callbackContext !== null;
        }
      };
      ChildEventRegistration = class _ChildEventRegistration {
        constructor(eventType, callbackContext) {
          this.eventType = eventType;
          this.callbackContext = callbackContext;
        }
        respondsTo(eventType) {
          let eventToCheck = eventType === "children_added" ? "child_added" : eventType;
          eventToCheck = eventToCheck === "children_removed" ? "child_removed" : eventToCheck;
          return this.eventType === eventToCheck;
        }
        createCancelEvent(error2, path) {
          if (this.callbackContext.hasCancelCallback) {
            return new CancelEvent(this, error2, path);
          } else {
            return null;
          }
        }
        createEvent(change, query) {
          assert(change.childName != null, "Child events should have a childName.");
          const childRef = child(new ReferenceImpl(query._repo, query._path), change.childName);
          const index = query._queryParams.getIndex();
          return new DataEvent(change.type, this, new DataSnapshot(change.snapshotNode, childRef, index), change.prevName);
        }
        getEventRunner(eventData) {
          if (eventData.getEventType() === "cancel") {
            return () => this.callbackContext.onCancel(eventData.error);
          } else {
            return () => this.callbackContext.onValue(eventData.snapshot, eventData.prevName);
          }
        }
        matches(other) {
          if (other instanceof _ChildEventRegistration) {
            return this.eventType === other.eventType && (!this.callbackContext || !other.callbackContext || this.callbackContext.matches(other.callbackContext));
          }
          return false;
        }
        hasAnyCallback() {
          return !!this.callbackContext;
        }
      };
      syncPointSetReferenceConstructor(ReferenceImpl);
      syncTreeSetReferenceConstructor(ReferenceImpl);
      FIREBASE_DATABASE_EMULATOR_HOST_VAR = "FIREBASE_DATABASE_EMULATOR_HOST";
      repos = {};
      useRestClient = false;
      Database = class {
        /** @hideconstructor */
        constructor(_repoInternal, app) {
          this._repoInternal = _repoInternal;
          this.app = app;
          this["type"] = "database";
          this._instanceStarted = false;
        }
        get _repo() {
          if (!this._instanceStarted) {
            repoStart(this._repoInternal, this.app.options.appId, this.app.options["databaseAuthVariableOverride"]);
            this._instanceStarted = true;
          }
          return this._repoInternal;
        }
        get _root() {
          if (!this._rootInternal) {
            this._rootInternal = new ReferenceImpl(this._repo, newEmptyPath());
          }
          return this._rootInternal;
        }
        _delete() {
          if (this._rootInternal !== null) {
            repoManagerDeleteRepo(this._repo, this.app.name);
            this._repoInternal = null;
            this._rootInternal = null;
          }
          return Promise.resolve();
        }
        _checkNotDeleted(apiName) {
          if (this._rootInternal === null) {
            fatal("Cannot call " + apiName + " on a deleted database.");
          }
        }
      };
      TransactionResult = class {
        /** @hideconstructor */
        constructor(committed, snapshot) {
          this.committed = committed;
          this.snapshot = snapshot;
        }
        /** Returns a JSON-serializable representation of this object. */
        toJSON() {
          return { committed: this.committed, snapshot: this.snapshot.toJSON() };
        }
      };
      PersistentConnection.prototype.simpleListen = function(pathString, onComplete) {
        this.sendRequest("q", { p: pathString }, onComplete);
      };
      PersistentConnection.prototype.echo = function(data, onEcho) {
        this.sendRequest("echo", { d: data }, onEcho);
      };
      registerDatabase();
    }
  });

  // node_modules/firebase/database/dist/esm/index.esm.js
  var init_index_esm8 = __esm({
    "node_modules/firebase/database/dist/esm/index.esm.js"() {
      init_index_esm7();
    }
  });

  // firebase-config.js
  var firebaseConfig;
  var init_firebase_config = __esm({
    "firebase-config.js"() {
      firebaseConfig = {
        apiKey: "AIzaSyB6hXxeK8eIIdZT7UGA3gausRtlwbcDmho",
        authDomain: "kumamorun-2.firebaseapp.com",
        databaseURL: "https://kumamorun-2-default-rtdb.firebaseio.com",
        projectId: "kumamorun-2",
        storageBucket: "kumamorun-2.firebasestorage.app",
        messagingSenderId: "843076165166",
        appId: "1:843076165166:web:c2c16e3b05bc8bfb8049bf",
        measurementId: "G-P9DVRER41S"
      };
    }
  });

  // renderer.js
  var require_renderer = __commonJS({
    "renderer.js"() {
      init_index_esm5();
      init_index_esm6();
      init_index_esm8();
      init_firebase_config();
      var firebaseApp = initializeApp(firebaseConfig);
      var auth = getAuth(firebaseApp);
      var db = getDatabase(firebaseApp);
      var STORAGE_KEY = "countdown";
      var SETTINGS_KEY = "settings";
      var RESTRICTIONS_KEY = "restrictions";
      var isWeekend = () => {
        const day = (/* @__PURE__ */ new Date()).getDay();
        return day === 0 || day === 6;
      };
      var DAILY_KEY = "dailyStats";
      var nowHHMM = () => {
        const d = /* @__PURE__ */ new Date();
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      };
      var getStartBlockReason = () => {
        const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || "{}");
        const weekend = isWeekend();
        const r = (weekend ? all.weekend : all.weekday) || {};
        const label = weekend ? "\u9031\u672B" : "\u5E73\u65E5";
        const cur = nowHHMM();
        if (r.lunchStart && r.lunchEnd && r.lunchStart <= cur && cur < r.lunchEnd) {
          return `${label}\u306E\u663C\u4F11\u61A9\u4E2D\uFF08${r.lunchStart}\u301C${r.lunchEnd}\uFF09\u306F\u30B9\u30BF\u30FC\u30C8\u3067\u304D\u307E\u305B\u3093`;
        }
        if (r.endTime && cur >= r.endTime) {
          return `${label}\u306E\u7D42\u4E86\u6642\u523B\uFF08${r.endTime}\uFF09\u3092\u904E\u304E\u305F\u305F\u3081\u3001\u660E\u65E5\u307E\u3067\u30B9\u30BF\u30FC\u30C8\u3067\u304D\u307E\u305B\u3093`;
        }
        return null;
      };
      var nextRestrictionBoundary = () => {
        const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || "{}");
        const r = (isWeekend() ? all.weekend : all.weekday) || {};
        const now = /* @__PURE__ */ new Date();
        const secUntil = (hhmm) => {
          if (!hhmm) return null;
          const [h, m] = hhmm.split(":").map(Number);
          const target = new Date(now);
          target.setHours(h, m, 0, 0);
          const diff = Math.floor((target - now) / 1e3);
          return diff > 0 ? diff : null;
        };
        const candidates = [];
        const ls = secUntil(r.lunchStart);
        if (ls != null) candidates.push({ sec: ls, kind: "\u663C\u4F11\u61A9" });
        const et = secUntil(r.endTime);
        if (et != null) candidates.push({ sec: et, kind: "\u7D42\u4E86" });
        if (!candidates.length) return null;
        return candidates.reduce((a, b) => b.sec < a.sec ? b : a);
      };
      var lunchBreakRemaining = () => {
        const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || "{}");
        const r = (isWeekend() ? all.weekend : all.weekday) || {};
        if (!r.lunchStart || !r.lunchEnd) return null;
        const now = /* @__PURE__ */ new Date();
        const at = (hhmm) => {
          const [h, m] = hhmm.split(":").map(Number);
          const t = new Date(now);
          t.setHours(h, m, 0, 0);
          return t;
        };
        const start = at(r.lunchStart);
        const end = at(r.lunchEnd);
        if (now >= start && now < end) return Math.ceil((end - now) / 1e3);
        return null;
      };
      var BOUNDARY_WATCH_KEY = "boundaryWatch";
      var BOUNDARY_MAX_GAP_MS = 60 * 1e3;
      var restrictionJustPassed = () => {
        const all = JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || "{}");
        const r = (isWeekend() ? all.weekend : all.weekday) || {};
        const now = Date.now();
        const prev = Number(JSON.parse(localStorage.getItem(BOUNDARY_WATCH_KEY) || "{}").at);
        const watching = Number.isFinite(prev) && prev <= now && now - prev < BOUNDARY_MAX_GAP_MS;
        const since = watching ? prev : now - 2e3;
        localStorage.setItem(BOUNDARY_WATCH_KEY, JSON.stringify({ at: now }));
        const passed = (hhmm) => {
          if (!hhmm) return false;
          const [h, m] = hhmm.split(":").map(Number);
          const t = /* @__PURE__ */ new Date();
          t.setHours(h, m, 0, 0);
          const at = t.getTime();
          return at > since && at <= now;
        };
        return {
          lunchStart: passed(r.lunchStart),
          lunchEnd: passed(r.lunchEnd),
          endTime: passed(r.endTime)
        };
      };
      var formatTime = (totalSec) => {
        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      };
      var getSpeakerId = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").speakerId || "";
      var playBeep = async (durationSec = 10, speakerIdOverride) => {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const speakerId = speakerIdOverride !== void 0 ? speakerIdOverride : getSpeakerId();
          if (speakerId && ctx.setSinkId) {
            try {
              await ctx.setSinkId(speakerId);
            } catch (e) {
              console.log("\u30B9\u30D4\u30FC\u30AB\u30FC\u306E\u5207\u308A\u66FF\u3048\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF08\u65E2\u5B9A\u30B9\u30D4\u30FC\u30AB\u30FC\u3067\u9CF4\u3089\u3057\u307E\u3059\uFF09", e);
            }
          }
          if (ctx.state === "suspended" && ctx.resume) await ctx.resume();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = 880;
          const beepOn = 0.4;
          const beepOff = 0.3;
          const cycle = beepOn + beepOff;
          gain.gain.setValueAtTime(0, ctx.currentTime);
          for (let t = 0; t < durationSec; t += cycle) {
            const start = ctx.currentTime + t;
            gain.gain.setValueAtTime(0.2, start);
            gain.gain.setValueAtTime(0, start + beepOn);
          }
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + durationSec);
          console.log("\u97F3\u3092\u518D\u751F\u3057\u307E\u3057\u305F");
        } catch (e) {
          console.log("\u97F3\u306E\u518D\u751F\u306B\u5931\u6557\u3057\u307E\u3057\u305F", e);
        }
      };
      var timer = document.getElementById("timer");
      if (timer) {
        timer.addEventListener("click", () => {
          window.location.href = "index2.html";
        });
      }
      var account = document.getElementById("account");
      if (account) {
        account.addEventListener("click", () => {
          window.location.href = "account.html";
        });
      }
      var setting = document.getElementById("setting");
      if (setting) {
        setting.addEventListener("click", () => {
          window.location.href = "index3.html";
        });
      }
      var alarm = document.getElementById("alarm");
      if (alarm) {
        alarm.addEventListener("click", () => {
          window.location.href = "alarm.html";
        });
      }
      var remainingEl = document.getElementById("remaining");
      if (remainingEl) {
        const labelEl = document.getElementById("label");
        const toggleBtn = document.getElementById("toggle");
        const evoEl = document.getElementById("evolution");
        const flowersEl = document.getElementById("flowers");
        const failuresEl = document.getElementById("failures");
        const kumamoruEl = document.getElementById("kumamoru");
        const focusBtn = document.getElementById("focus");
        const focusOverlay = document.getElementById("focus-overlay");
        if (focusBtn && focusOverlay) {
          const focusRemainingEl = document.getElementById("focus-remaining");
          const focusLabelEl = document.getElementById("focus-label");
          const focusExitBtn = document.getElementById("focus-exit");
          const syncFocus = () => {
            focusRemainingEl.textContent = remainingEl.textContent;
            if (focusLabelEl && labelEl) focusLabelEl.textContent = labelEl.textContent;
          };
          const focusObserver = new MutationObserver(syncFocus);
          focusObserver.observe(remainingEl, { childList: true, characterData: true, subtree: true });
          if (labelEl) {
            focusObserver.observe(labelEl, { childList: true, characterData: true, subtree: true });
          }
          const openFocus = () => {
            syncFocus();
            focusOverlay.hidden = false;
            if (window.kumamorunAPI) window.kumamorunAPI.setFullscreen(true);
          };
          const closeFocus = () => {
            focusOverlay.hidden = true;
            if (window.kumamorunAPI) window.kumamorunAPI.setFullscreen(false);
          };
          focusBtn.addEventListener("click", openFocus);
          focusExitBtn.addEventListener("click", closeFocus);
          focusOverlay.addEventListener("click", (e) => {
            if (e.target === focusOverlay) closeFocus();
          });
          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && !focusOverlay.hidden) closeFocus();
          });
        }
        const TIMER_KEY = "timerState";
        const loadTimerState = () => JSON.parse(localStorage.getItem(TIMER_KEY) || "null");
        const saveTimerState = (s) => localStorage.setItem(TIMER_KEY, JSON.stringify(s));
        const notify20Enabled = !!JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").notify20;
        const EYE_BREAK_INTERVAL_SEC = 20 * 60;
        const currentRemaining = (s) => s.running ? Math.max(0, Math.ceil((s.endAt - Date.now()) / 1e3)) : Math.max(0, s.remaining);
        const EVOLUTION_KEY = "evolution";
        const cachedEvolution = () => {
          const v = Number(localStorage.getItem(EVOLUTION_KEY));
          return Number.isFinite(v) ? v : 0;
        };
        let currentUser = null;
        onAuthStateChanged(auth, (user) => {
          currentUser = user;
          if (user) {
            onValue(ref(db, `users/${user.uid}/evolution`), (snap) => {
              const e = snap.val() ?? 0;
              if (e !== cachedEvolution()) {
                localStorage.setItem(EVOLUTION_KEY, String(e));
                if (evoEl) evoEl.textContent = e;
                showCharacterImage(e);
              }
            });
            onValue(ref(db, `users/${user.uid}/flowers`), (snap) => {
              if (flowersEl) flowersEl.textContent = snap.val() ?? 0;
            });
            get(ref(db, `users/${user.uid}/dailyStats`)).then((snap) => {
              const merged = mergeDailyStats(
                JSON.parse(localStorage.getItem(DAILY_KEY) || "null"),
                snap.val()
              );
              if (merged) {
                localStorage.setItem(DAILY_KEY, JSON.stringify(merged));
                set(ref(db, `users/${user.uid}/dailyStats`), merged);
              }
              evaluateDailyRollover();
            }).catch(() => evaluateDailyRollover());
          } else {
            renderFailures();
          }
        });
        const REWARD_WINDOW_MS = 3 * 60 * 1e3;
        const PLAY_FINISHED_KEY = "playFinishedAt";
        const rewardWindowRemaining = () => {
          const playFinishedAt = Number(localStorage.getItem(PLAY_FINISHED_KEY));
          if (!playFinishedAt) return null;
          const left = Math.ceil((playFinishedAt + REWARD_WINDOW_MS - Date.now()) / 1e3);
          return left > 0 ? left : null;
        };
        const EVOLVE_MAX = 7;
        const GROWTH_IMAGES = [
          "src/evo/01_\u7A2E\u5B50.png",
          "src/evo/02_\u5B50\u8449.png",
          "src/evo/03\u672C\u8449.png",
          "src/evo/04_\u672C\u8449\u3044\u3063\u3071\u3044.png",
          "src/evo/05_\u3064\u307C\u307F.png",
          "src/evo/06_\u3064\u307C\u307F\u5927\u304D\u304F.png"
        ];
        const FLOWER_IMAGES = {
          "07": "src/evo/07_\u30BF\u30F3\u30DD\u30DD.png",
          "08": "src/evo/08_\u30DC\u30BF\u30F3.png",
          "09": "src/evo/09_\u9752\u3044\u30D2\u30AC\u30F3\u30D0\u30CA.png",
          "11": "src/evo/11_\u591C\u685C.png"
        };
        const FLOWER_NAMES = { "07": "\u30BF\u30F3\u30DD\u30DD", "08": "\u30DC\u30BF\u30F3", "09": "\u9752\u3044\u30D2\u30AC\u30F3\u30D0\u30CA", "11": "\u591C\u685C" };
        const pickFlower = () => {
          const r = Math.random() * 100;
          if (r < 33) return "07";
          if (r < 66) return "08";
          if (r < 99) return "09";
          return "11";
        };
        const todayStr = () => {
          const d = /* @__PURE__ */ new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        };
        const BLOOM_KEY = "bloomDisplay";
        const showCharacterImage = (e) => {
          if (!kumamoruEl) return;
          const bloom = JSON.parse(localStorage.getItem(BLOOM_KEY) || "null");
          if (bloom && bloom.date === todayStr() && FLOWER_IMAGES[bloom.flower]) {
            kumamoruEl.src = FLOWER_IMAGES[bloom.flower];
          } else {
            kumamoruEl.src = GROWTH_IMAGES[Math.min(e, GROWTH_IMAGES.length - 1)];
          }
        };
        {
          const e = cachedEvolution();
          if (evoEl) evoEl.textContent = e;
          showCharacterImage(e);
        }
        const RANG_KEY = "boundaryRang";
        const ringOnce = (id, title, body) => {
          const store = JSON.parse(localStorage.getItem(RANG_KEY) || "{}");
          if (store.date !== todayStr()) {
            store.date = todayStr();
            store.ids = [];
          }
          if (store.ids.includes(id)) return;
          store.ids.push(id);
          localStorage.setItem(RANG_KEY, JSON.stringify(store));
          if (window.kumamorunAPI) window.kumamorunAPI.surfaceWindow();
          new Notification(title, { body });
          playBeep();
        };
        let onBoundary = null;
        const watchBoundaries = () => {
          const p = restrictionJustPassed();
          if (p.lunchStart || p.endTime) {
            const kind = p.lunchStart ? "\u663C\u4F11\u61A9" : "\u7D42\u4E86";
            const stopped = onBoundary ? onBoundary(kind) : false;
            const body = stopped ? "\u904A\u3073\u3092\u7D42\u4E86\u3057\u307E\u3059\u3002\u304A\u75B2\u308C\u3055\u307E\u3067\u3057\u305F\uFF01" : p.lunchStart ? "\u4F11\u61A9\u3057\u3088\u3046\uFF01" : "\u4ECA\u65E5\u306F\u3053\u3053\u307E\u3067\u3002\u304A\u75B2\u308C\u3055\u307E\u3067\u3057\u305F\uFF01";
            ringOnce(p.lunchStart ? "lunchStart" : "endTime", `${kind}\u306E\u6642\u9593\u306B\u306A\u308A\u307E\u3057\u305F`, body);
          }
          if (p.lunchEnd) {
            ringOnce("lunchEnd", "\u663C\u4F11\u61A9\u304C\u7D42\u308F\u308A\u307E\u3057\u305F", "\u307E\u305F\u904A\u3079\u308B\u3088\uFF01");
          }
        };
        const evolve = () => {
          if (!currentUser) {
            console.log("\u9032\u5316\u6761\u4EF6\u3092\u6E80\u305F\u3057\u307E\u3057\u305F\u304C\u3001\u672A\u30ED\u30B0\u30A4\u30F3\u306E\u305F\u3081\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093");
            return;
          }
          let bloomed = false;
          runTransaction(ref(db, `users/${currentUser.uid}/evolution`), (cur) => {
            let e = (cur || 0) + 1;
            if (e >= EVOLVE_MAX) {
              bloomed = true;
              e = 0;
            }
            return e;
          }).then(() => {
            if (bloomed) {
              const flower = pickFlower();
              const gain = flower === "11" ? 2 : 1;
              runTransaction(ref(db, `users/${currentUser.uid}/flowers`), (c) => (c || 0) + gain);
              localStorage.setItem(BLOOM_KEY, JSON.stringify({ flower, date: todayStr() }));
              if (kumamoruEl) kumamoruEl.src = FLOWER_IMAGES[flower];
              new Notification("\u304A\u82B1\u304C\u54B2\u3044\u305F\uFF01\u{1F338}", {
                body: `${FLOWER_NAMES[flower]} \u304C\u54B2\u304D\u307E\u3057\u305F\uFF01\u304A\u82B1+${gain}`
              });
              playBeep(1);
            } else {
              new Notification("\u9032\u5316\u3057\u305F\uFF01\u2728", { body: "\u30AF\u30DE\u30E2\u30EB\u304C\u80B2\u3063\u305F\u3088\uFF01" });
              playBeep(1);
            }
          });
        };
        const mergeDailyStats = (a, b) => {
          if (!a) return b || null;
          if (!b) return a;
          if (a.date === b.date) {
            return {
              date: a.date,
              plays: Math.max(a.plays, b.plays),
              failures: Math.max(a.failures, b.failures)
            };
          }
          return a.date > b.date ? a : b;
        };
        const getDailyStats = () => {
          let stats = JSON.parse(localStorage.getItem(DAILY_KEY) || "null");
          const today = todayStr();
          if (!stats || stats.date !== today) {
            if (stats && stats.plays > 0 && stats.failures === 0) {
              evolve();
            }
            localStorage.removeItem(PLAY_FINISHED_KEY);
            stats = { date: today, plays: 0, failures: 0 };
            localStorage.setItem(DAILY_KEY, JSON.stringify(stats));
          }
          return stats;
        };
        const renderFailures = () => {
          if (!failuresEl) return;
          const stats = JSON.parse(localStorage.getItem(DAILY_KEY) || "null");
          failuresEl.textContent = stats && stats.date === todayStr() ? stats.failures : 0;
        };
        const saveDailyStats = (stats) => {
          localStorage.setItem(DAILY_KEY, JSON.stringify(stats));
          renderFailures();
          if (currentUser) {
            set(ref(db, `users/${currentUser.uid}/dailyStats`), stats).then(() => console.log("\u5F53\u65E5\u306E\u7D71\u8A08\u3092\u30AF\u30E9\u30A6\u30C9\u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F", stats)).catch((e) => console.log("\u5F53\u65E5\u306E\u7D71\u8A08\u306E\u30AF\u30E9\u30A6\u30C9\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F", e));
          }
        };
        const evaluateDailyRollover = () => {
          getDailyStats();
          renderFailures();
        };
        const recordPlay = () => {
          const stats = getDailyStats();
          stats.plays += 1;
          saveDailyStats(stats);
        };
        const recordFailure = () => {
          const stats = getDailyStats();
          stats.failures += 1;
          saveDailyStats(stats);
          console.log("3\u5206\u4EE5\u5185\u306B\u4F11\u61A9\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF08\u4ECA\u65E5\u306E\u5931\u6557\u56DE\u6570\u3092+1\uFF09");
        };
        const handleTimerFinished = (label) => {
          if (label === "\u904A\u3073") {
            localStorage.setItem(PLAY_FINISHED_KEY, String(Date.now()));
            recordPlay();
          } else if (label === "\u4F11\u61A9") {
            const playFinishedAt = Number(localStorage.getItem(PLAY_FINISHED_KEY));
            localStorage.removeItem(PLAY_FINISHED_KEY);
            if (playFinishedAt && Date.now() - playFinishedAt > REWARD_WINDOW_MS) {
              recordFailure();
            }
          }
        };
        const startRequest = localStorage.getItem(STORAGE_KEY);
        if (startRequest) {
          localStorage.removeItem(STORAGE_KEY);
          const { duration, label } = JSON.parse(startRequest);
          saveTimerState({
            label,
            duration,
            running: true,
            endAt: Date.now() + duration * 1e3,
            remaining: duration,
            warned: false,
            finished: false,
            eyeBreaksSent: 0
          });
        }
        const runActiveTimer = (state) => {
          const warnAt = Math.max(1, Math.floor(state.duration * 0.2));
          const updateDisplay = () => {
            const lunch = lunchBreakRemaining();
            if (lunch != null) {
              remainingEl.textContent = formatTime(lunch);
              if (labelEl) labelEl.textContent = "\u663C\u4F11\u61A9\u4E2D\uFF08\u7D42\u4E86\u307E\u3067\uFF09";
              return;
            }
            const remaining = currentRemaining(state);
            const boundary = state.label === "\u904A\u3073" ? nextRestrictionBoundary() : null;
            if (boundary && boundary.sec < remaining) {
              remainingEl.textContent = formatTime(boundary.sec);
              if (labelEl) labelEl.textContent = `${state.label}\uFF08${boundary.kind}\u307E\u3067\uFF09`;
            } else {
              remainingEl.textContent = formatTime(remaining);
              if (labelEl) labelEl.textContent = state.label;
            }
          };
          updateDisplay();
          let tickId = null;
          let rewardId = null;
          const startRewardCountdown = () => {
            const render = () => {
              const left = rewardWindowRemaining();
              if (left == null) {
                if (rewardId) clearInterval(rewardId);
                rewardId = null;
                remainingEl.textContent = "\u6642\u9593\u5207\u308C\uFF01";
                if (labelEl) labelEl.textContent = state.label;
                return;
              }
              remainingEl.textContent = formatTime(left);
              if (labelEl) labelEl.textContent = "\u4F11\u61A9\u306E\u7336\u4E88";
            };
            render();
            rewardId = setInterval(render, 1e3);
          };
          const finish = () => {
            if (tickId) clearInterval(tickId);
            tickId = null;
            onBoundary = null;
            state.running = false;
            state.remaining = 0;
            state.finished = true;
            saveTimerState(state);
            remainingEl.textContent = "\u6642\u9593\u5207\u308C\uFF01";
            if (toggleBtn) toggleBtn.disabled = true;
            if (window.kumamorunAPI) window.kumamorunAPI.surfaceWindow();
            new Notification(`${state.label} \u304C\u7D42\u308F\u308A\u307E\u3057\u305F`, { body: "\u304A\u75B2\u308C\u3055\u307E\u3067\u3057\u305F\uFF01" });
            playBeep();
            handleTimerFinished(state.label);
            if (state.label === "\u904A\u3073") startRewardCountdown();
          };
          const stopAtBoundary = (kind) => {
            if (!state.running || state.label !== "\u904A\u3073") return false;
            if (tickId) clearInterval(tickId);
            tickId = null;
            onBoundary = null;
            state.running = false;
            state.finished = true;
            state.remaining = 0;
            saveTimerState(state);
            if (toggleBtn) toggleBtn.disabled = true;
            remainingEl.textContent = `${kind}\u306E\u6642\u9593\u3067\u3059`;
            if (labelEl) labelEl.textContent = state.label;
            return true;
          };
          const tick = () => {
            const remaining = currentRemaining(state);
            updateDisplay();
            if (notify20Enabled && state.running && state.label === "\u904A\u3073" && remaining > 0) {
              const marks = Math.floor((state.duration - remaining) / EYE_BREAK_INTERVAL_SEC);
              if (marks > (state.eyeBreaksSent || 0)) {
                state.eyeBreaksSent = marks;
                saveTimerState(state);
                new Notification("20-20-20\u30EB\u30FC\u30EB", {
                  body: "20\u79D2\u9593\u300120\u30D5\u30A3\u30FC\u30C8\uFF08\u7D046m\uFF09\u5148\u3092\u898B\u3066\u76EE\u3092\u4F11\u3081\u307E\u3057\u3087\u3046\u{1F440}"
                });
                playBeep(1);
              }
            }
            if (state.running && !state.warned && remaining > 0 && remaining <= warnAt) {
              state.warned = true;
              saveTimerState(state);
              new Notification(`${state.label} \u307E\u3082\u306A\u304F\u7D42\u4E86`, { body: `\u6B8B\u308A${warnAt}\u79D2\u3067\u3059` });
              playBeep(1);
            }
            if (remaining <= 0) finish();
          };
          if (state.running && currentRemaining(state) <= 0) {
            finish();
            return;
          }
          if (state.running) {
            onBoundary = stopAtBoundary;
            tickId = setInterval(tick, 1e3);
          }
          if (toggleBtn) {
            toggleBtn.textContent = state.running ? "\u4E00\u6642\u505C\u6B62" : "\u518D\u958B";
            toggleBtn.addEventListener("click", () => {
              if (state.running) {
                state.remaining = currentRemaining(state);
                state.running = false;
                saveTimerState(state);
                if (tickId) clearInterval(tickId);
                tickId = null;
                onBoundary = null;
                toggleBtn.textContent = "\u518D\u958B";
              } else {
                if (state.remaining <= 0) return;
                state.endAt = Date.now() + state.remaining * 1e3;
                state.running = true;
                saveTimerState(state);
                onBoundary = stopAtBoundary;
                tickId = setInterval(tick, 1e3);
                toggleBtn.textContent = "\u4E00\u6642\u505C\u6B62";
              }
            });
          }
        };
        const timerState = loadTimerState();
        if (timerState && !timerState.finished) {
          runActiveTimer(timerState);
        } else {
          if (toggleBtn) toggleBtn.disabled = true;
          const renderIdle = () => {
            const lunch = lunchBreakRemaining();
            if (lunch != null) {
              remainingEl.textContent = formatTime(lunch);
              if (labelEl) labelEl.textContent = "\u663C\u4F11\u61A9\u4E2D\uFF08\u7D42\u4E86\u307E\u3067\uFF09";
              return;
            }
            const reward = rewardWindowRemaining();
            if (reward != null) {
              remainingEl.textContent = formatTime(reward);
              if (labelEl) labelEl.textContent = "\u4F11\u61A9\u306E\u7336\u4E88";
              return;
            }
            if (timerState && timerState.finished) {
              if (labelEl) labelEl.textContent = timerState.label;
              remainingEl.textContent = "\u6642\u9593\u5207\u308C\uFF01";
            } else {
              if (labelEl) labelEl.textContent = "";
              remainingEl.textContent = "-";
            }
          };
          renderIdle();
          setInterval(renderIdle, 1e3);
        }
        setInterval(watchBoundaries, 1e3);
      }
      var startBtn = document.getElementById("start");
      var brakeBtn = document.getElementById("start-brake");
      var timeInput = document.getElementById("time");
      var settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      var sendToTimer = (label, fallbackSec) => {
        const blockReason = getStartBlockReason();
        if (blockReason) {
          alert(blockReason);
          return;
        }
        let duration = Number(timeInput.value);
        if (!Number.isFinite(duration) || duration <= 0) {
          duration = Number(fallbackSec);
        }
        if (!Number.isFinite(duration) || duration <= 0) {
          console.log("\u79D2\u6570\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
          return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration, label }));
        window.location.href = "index.html";
      };
      if (startBtn) {
        startBtn.addEventListener("click", () => sendToTimer("\u904A\u3073", settings.play));
      }
      if (brakeBtn) {
        brakeBtn.addEventListener("click", () => sendToTimer("\u4F11\u61A9", settings.break));
      }
      var saveBtn = document.getElementById("save");
      if (saveBtn) {
        const playInput = document.getElementById("play-time");
        const breakInput = document.getElementById("break-time");
        const notify20Input = document.getElementById("notify20");
        const speakerSelect = document.getElementById("speaker");
        const testSoundBtn = document.getElementById("test-sound");
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        if (saved.play != null) playInput.value = saved.play;
        if (saved.break != null) breakInput.value = saved.break;
        if (notify20Input) notify20Input.checked = !!saved.notify20;
        const loadSpeakers = async () => {
          if (!speakerSelect || !navigator.mediaDevices) return;
          const listOutputs = async () => (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audiooutput");
          let outputs = await listOutputs();
          if (outputs.some((d) => !d.label)) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((t) => t.stop());
              outputs = await listOutputs();
            } catch (e) {
              console.log("\u30C7\u30D0\u30A4\u30B9\u540D\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF08\u756A\u53F7\u3067\u8868\u793A\u3057\u307E\u3059\uFF09", e);
            }
          }
          speakerSelect.innerHTML = "";
          const addOption = (value, text) => {
            const o = document.createElement("option");
            o.value = value;
            o.textContent = text;
            speakerSelect.appendChild(o);
          };
          addOption("", "\u65E2\u5B9A\u306E\u30B9\u30D4\u30FC\u30AB\u30FC");
          outputs.forEach((d, i) => {
            if (d.deviceId === "default") return;
            addOption(d.deviceId, d.label || `\u30B9\u30D4\u30FC\u30AB\u30FC ${i + 1}`);
          });
          if (saved.speakerId) speakerSelect.value = saved.speakerId;
        };
        loadSpeakers();
        if (testSoundBtn) {
          testSoundBtn.addEventListener("click", () => {
            playBeep(1, speakerSelect ? speakerSelect.value : "");
          });
        }
        saveBtn.addEventListener("click", () => {
          const play = Number(playInput.value);
          const breakTime = Number(breakInput.value);
          const notify20 = notify20Input ? notify20Input.checked : false;
          const speakerId = speakerSelect ? speakerSelect.value : "";
          localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ play, break: breakTime, notify20, speakerId })
          );
          console.log("\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F", { play, break: breakTime, notify20, speakerId });
          window.location.href = "index.html";
        });
      }
      var restrictSaveBtn = document.getElementById("restrict-save");
      if (restrictSaveBtn) {
        const readGroup = (prefix) => {
          const val = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : "";
          };
          return {
            lunchStart: val(`${prefix}-lunch-start`),
            lunchEnd: val(`${prefix}-lunch-end`),
            endTime: val(`${prefix}-end-time`)
          };
        };
        const fillGroup = (prefix, g) => {
          if (!g) return;
          const set2 = (id, v) => {
            const el = document.getElementById(id);
            if (el && v) el.value = v;
          };
          set2(`${prefix}-lunch-start`, g.lunchStart);
          set2(`${prefix}-lunch-end`, g.lunchEnd);
          set2(`${prefix}-end-time`, g.endTime);
        };
        const fillRestrictForm = (all) => {
          fillGroup("wd", all.weekday);
          fillGroup("we", all.weekend);
        };
        fillRestrictForm(JSON.parse(localStorage.getItem(RESTRICTIONS_KEY) || "{}"));
        onAuthStateChanged(auth, (user) => {
          if (!user) return;
          onValue(ref(db, `users/${user.uid}/restrictions`), (snap) => {
            const cloud = snap.val();
            if (!cloud) return;
            localStorage.setItem(RESTRICTIONS_KEY, JSON.stringify(cloud));
            fillRestrictForm(cloud);
          });
        });
        restrictSaveBtn.addEventListener("click", async () => {
          const r = { weekday: readGroup("wd"), weekend: readGroup("we") };
          localStorage.setItem(RESTRICTIONS_KEY, JSON.stringify(r));
          if (auth.currentUser) {
            try {
              await set(ref(db, `users/${auth.currentUser.uid}/restrictions`), r);
              console.log("\u30B9\u30BF\u30FC\u30C8\u5236\u9650\u3092\u30AF\u30E9\u30A6\u30C9\u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F", r);
            } catch (e) {
              console.log("\u30B9\u30BF\u30FC\u30C8\u5236\u9650\u306E\u30AF\u30E9\u30A6\u30C9\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F", e);
            }
          } else {
            console.log("\u672A\u30ED\u30B0\u30A4\u30F3\u306E\u305F\u3081\u30ED\u30FC\u30AB\u30EB\u306B\u306E\u307F\u4FDD\u5B58\u3057\u307E\u3057\u305F", r);
          }
          window.location.href = "index.html";
        });
      }
      var loginBtn = document.getElementById("login");
      if (loginBtn) {
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const signupBtn = document.getElementById("signup");
        const logoutBtn = document.getElementById("logout");
        const statusEl = document.getElementById("auth-status");
        onAuthStateChanged(auth, (user) => {
          if (user) {
            statusEl.textContent = `\u30ED\u30B0\u30A4\u30F3\u4E2D: ${user.email}`;
            set(ref(db, `users/${user.uid}/lastLogin`), Date.now()).then(() => console.log("lastLogin \u3092\u30AF\u30E9\u30A6\u30C9\u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F")).catch((e) => console.log("lastLogin \u306E\u30AF\u30E9\u30A6\u30C9\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F", e));
          } else {
            statusEl.textContent = "\u672A\u30ED\u30B0\u30A4\u30F3";
          }
        });
        loginBtn.addEventListener("click", async () => {
          try {
            await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
          } catch (e) {
            statusEl.textContent = `\u30A8\u30E9\u30FC: ${e.message}`;
          }
        });
        signupBtn.addEventListener("click", async () => {
          try {
            await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
          } catch (e) {
            statusEl.textContent = `\u30A8\u30E9\u30FC: ${e.message}`;
          }
        });
        logoutBtn.addEventListener("click", () => signOut(auth));
      }
      onAuthStateChanged(auth, (user) => {
        if (!user) return;
        onValue(ref(db, `users/${user.uid}/restrictions`), (snap) => {
          const cloud = snap.val();
          if (cloud) localStorage.setItem(RESTRICTIONS_KEY, JSON.stringify(cloud));
        });
      });
      var back = document.getElementById("back");
      if (back) {
        back.addEventListener("click", () => {
          console.log("back");
          window.location.href = "index.html";
        });
      }
    }
  });
  require_renderer();
})();
/*! Bundled license information:

@firebase/util/dist/postinstall.mjs:
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/component/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/logger/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/database/dist/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
