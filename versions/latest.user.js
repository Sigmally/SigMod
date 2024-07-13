// ==UserScript==
// @name         SigMod Client (Macros)
// @version      9.3.7.4
// @description  The best mod you can find for Sigmally - Agar.io: Macros, Friends, tag system (minimap, chat), FPS boost, color mod, custom skins, AutoRespawn, save names, themes and more!
// @author       Cursed
// @match        https://*.sigmally.com/*
// @exclude      https://one.sigmally.com/moderate/
// @icon         https://raw.githubusercontent.com/Sigmally/SigMod/main/images/sigmodclient2.gif
// @run-at       document-end
// @license      MIT
// @grant        none
// @namespace    https://greasyfork.org/users/981958
// ==/UserScript==
 
(function() {
    let version = 9;
    let serverVersion = 1.6;
    let storageName = "SigModClient-settings";
    let headerAnim = "https://app.czrsd.com/static/sigmodclient.gif";
 
    'use strict';
    let modSettings = localStorage.getItem(storageName);
    if (!modSettings) {
        modSettings = {
            keyBindings: {
                rapidFeed: "w",
                doubleSplit: "d",
                tripleSplit: "f",
                quadSplit: "g",
                freezePlayer: "s",
                verticalSplit: "t",
                doubleTrick: "",
                selfTrick: "",
                toggleMenu: "v",
                location: "y",
                toggleChat: "z",
                toggleNames: "",
                toggleSkins: "",
                toggleAutoRespawn: "",
                respawn: "b"
            },
            freezeType: "press",
            m1: null,
            m2: null,
            mapColor: null,
            nameColor: null,
            gradientName: {
                enabled: false,
                color1: null,
                color2: null,
            },
            borderColor: null,
            foodColor: null,
            cellColor: null,
            mapImageURL: "",
            virusImage: "/assets/images/viruses/2.png",
            skinImage: {
                original: null,
                replaceImg: null,
            },
            Theme: "Dark",
            addedThemes: [],
            savedNames: [],
            AutoRespawn: false,
            tag: null,
            chatSettings: {
                limit: 100,
                bgColor: "#000000",
                chat_opacity: 0.4,
                compact: false,
                themeColor: "#8a25e5",
                showTime: true,
                showNameColors: true,
                showClientChat: false,
                showChatButtons: true,
                blurTag: false,
                locationText: "{pos}",
            },
            deathScreenPos: "center",
            fps: {
                fpsMode: false,
                hideFood: false,
                showNames: true,
                shortLongNames: false,
                removeOutlines: false,
            },
            removeShopPopup: false,
            playTimer: false,
            autoClaimCoins: false,
            showChallenges: false,
            authorized: false,
        };
        updateStorage();
    } else {
        modSettings = JSON.parse(modSettings);
    }
 
    function updateStorage() {
        localStorage.setItem(storageName, JSON.stringify(modSettings));
    }
 
    // for development
    let isDev = false;
    let port = 3001;
 
    // global sigmod
    window.sigmod = {
        version,
        server_version: serverVersion,
        storageName,
        settings: modSettings,
    };
 
    // websocket, user
    window.gameSettings = {};
 
    // * helper functions * //
 
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }
 
    function noXSS(text) {
        return text.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
 
    function parsetxt(val) {
        return /^(?:\{([^}]*)\})?([^]*)/.exec(val)[2].trim();
    }
 
    async function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
 
    let fetchedUser = 0;
 
    const originalFetch = window.fetch;
 
    window.fetch = async (url, options) => {
        const response = await originalFetch(url, options);
        if (url.includes('/server/auth')) {
            const data = await response.clone().json();
            if (data) mods.handleGoogleAuth(data.body?.user);
        }
        else if (url.includes('v3')) {
            const token = JSON.parse(options.body).recaptchaV3Token;
            window.v3 = token;
        }
        return response;
    };
 
    // hex color code to rgba values
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
 
    // rgba values to hex color code
    function RgbaToHex(code) {
        const rgbaValues = code.match(/\d+/g);
        const [r, g, b] = rgbaValues.slice(0, 3);
        return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`;
    }
 
    function bytesToHex(r, g, b) {
        return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }
 
    // generate random string
    function rdmString(length) {
        return [...Array(length)].map(() => Math.random().toString(36).charAt(2)).join('');
    }
 
    function menuClosed() {
        const menuWrapper = document.getElementById("menu-wrapper");
 
        return menuWrapper.style.display === "none";
    }
 
    function isDead() {
        const __line2 = document.getElementById("__line2");
        return !__line2.classList.contains("line--hidden");
    }
 
    function getGameMode() {
        const gameMode = document.getElementById("gamemode");
        if (!gameMode.value) {
            return "Tourney";
        }
        const options = Object.values(gameMode.querySelectorAll("option"));
        const selectedOption = options.filter((option) => option.value === gameMode.value)[0];
        const serverName = selectedOption.textContent.split(" ")[0];
 
        return serverName;
    }
 
    const prettyTime = {
        am_pm: (date) => {
            if (!date) return "";
 
            const d = new Date(date);
            const hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
 
            return `${formattedHours}:${minutes} ${ampm}`;
        },
        time_ago: (timestamp, isIso = false) => {
            if (!timestamp) return "";
            const currentTime = new Date();
            const elapsedTime = isIso ? currentTime - new Date(timestamp) : currentTime - timestamp;
 
            const seconds = Math.floor(elapsedTime / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const years = Math.floor(days / 365);
 
            if (years > 0) {
                return years === 1 ? "1 year ago" : `${years} years ago`;
            } else if (days > 0) {
                return days === 1 ? "1 day ago" : `${days} days ago`;
            } else if (hours > 0) {
                return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
            } else if (minutes > 0) {
                return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
            } else {
                return seconds <= 1 ? "1s>" : `${seconds}s ago`;
            }
        }
    };
 
    function keypress(key, keycode) {
        const keyDownEvent = new KeyboardEvent("keydown", { key: key, code: keycode });
        const keyUpEvent = new KeyboardEvent("keyup", { key: key, code: keycode });
 
        window.dispatchEvent(keyDownEvent);
        window.dispatchEvent(keyUpEvent);
    }
    function mousemove(sx, sy) {
        const mouseMoveEvent = new MouseEvent("mousemove", { clientX: sx, clientY: sy });
        const canvas = document.getElementById("canvas");
        canvas.dispatchEvent(mouseMoveEvent);
    }
 
 
    // EU server
    const coordinates = {};
    const gridSize = 4500;
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const label = String.fromCharCode(65 + i) + (j + 1);
 
            const minX = -11000 + (i * gridSize);
            const minY = -11000 + (j * gridSize);
            const maxX = -6500 + (i * gridSize);
            const maxY = -6500 + (j * gridSize);
 
            coordinates[label] = {
                min: {
                    x: minX,
                    y: minY
                },
                max: {
                    x: maxX,
                    y: maxY
                }
            };
        }
    }
 
    // US1; US2; US3 servers
    const coordinates2 = {};
    const gridSize2 = 7000;
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const label = String.fromCharCode(65 + i) + (j + 1);
 
            const minX = -17022 + (i * gridSize2);
            const minY = -17022 + (j * gridSize2);
            const maxX = -10000 + (i * gridSize2);
            const maxY = -10000 + (j * gridSize2);
 
            coordinates2[label] = {
                min: {
                    x: minX,
                    y: minY
                },
                max: {
                    x: maxX,
                    y: maxY
                }
            };
        }
    }
 
    let client = null;
    let handshake = false;
    const originalSend = WebSocket.prototype.send
    const C = new Uint8Array(256)
    const R = new Uint8Array(256)
 
    WebSocket.prototype.send = function(data) {
        // make sure its only for sigmally.com websockets
        if (!this.url.includes("sigmally.com")) {
            return originalSend.apply(this, arguments);
        }
 
        const handleData = (data) => {
            if (!(data instanceof Uint8Array)) return;
 
            const reader = new Reader(new DataView(data.buffer), 0, true);
            const r = reader.getUint8();
 
            if (R[r] !== 0xdc) return;
 
            client.send({
                type: "captcha",
                content: null
            });
        };
 
        handleData(data);
 
        if (!window.gameSettings.ws) {
            window.gameSettings.ws = this;
 
            if (!client) {
                client = new modClient();
            }
 
            window.gameSettings.ws.addEventListener("close", () => {
                window.gameSettings.ws = null;
                handshake = false;
 
                activeCellX = null;
                activeCellY = null;
                const chat = document.getElementById("mod-messages");
                chat.innerHTML = "";
                setTimeout(() => {
                    document.getElementById('overlays').show(0.5);
                    document.getElementById('menu-wrapper').show();
                    document.getElementById('left-menu').show();
                    document.getElementById('menu-links').show();
                    document.getElementById('right-menu').show();
                    document.getElementById('left_ad_block').show();
                    document.getElementById('ad_bottom').show();
                }, 500);
            })
 
            window.gameSettings.ws.sendPacket = function(packet) {
                if (packet.build) {
                    return window.gameSettings.ws.send(packet.build())
                }
 
                window.gameSettings.ws.send(packet)
            }
 
            window.sendChat = function sendChat(text) {
                const writer = new Writer();
                writer.setUint8(C[0x63]);
                writer.setUint8(0);
                writer.setStringUTF8(text);
                window.gameSettings.ws.sendPacket(writer);
            };
 
            window.gameSettings.ws.addEventListener("message", (event) => {
                const reader = new Reader(new DataView(event.data), 0, true)
 
                if (!handshake) {
                    const ver = reader.getStringUTF8(false)
                    C.set(new Uint8Array(reader.raw(256)))
 
                    for (const i in C) R[C[i]] = ~~i
 
                    handshake = true
 
                    return
                }
 
                const r = reader.getUint8()
                switch (R[r]) {
                    case 0x63: {
                        // chat message
                        const flags = reader.getUint8();
                        const color = bytesToHex(
                            reader.getUint8(),
                            reader.getUint8(),
                            reader.getUint8()
                        );
                        let name = reader.getStringUTF8();
                        const message = reader.getStringUTF8();
                        const server = !!(flags & 0x80);
                        const admin = !!(flags & 0x40);
                        const mod = !!(flags & 0x20);
 
                        if (server && name !== 'SERVER') name = '[SERVER]';
                        if (admin) name = '[ADMIN] ' + name;
                        if (mod) name = '[MOD] ' + name;
                        if (name === "") name = "Unnamed";
                        name = parsetxt(name);
 
                        if (mods.mutedUsers.includes(name)) {
                            return;
                        }
 
                        if (!modSettings.chatSettings.showClientChat) {
                            mods.updateChat({
                                server,
                                admin,
                                mod,
                                color: modSettings.chatSettings.showNameColors ? color : "#fafafa",
                                name,
                                message,
                                time: modSettings.chatSettings.showTime ? Date.now() : null,
                            });
                        }
                        break
                    }
                    case 0x40:
                        // set border
                        mods.border.left = reader.getFloat64();
                        mods.border.top = reader.getFloat64();
                        mods.border.right = reader.getFloat64();
                        mods.border.bottom = reader.getFloat64();
 
                        mods.border.width = mods.border.right - mods.border.left;
                        mods.border.height = mods.border.bottom - mods.border.top;
                        mods.border.centerX = (mods.border.left + mods.border.right) / 2;
                        mods.border.centerY = (mods.border.top + mods.border.bottom) / 2;
                        break;
                }
            })
        }
 
        return originalSend.apply(this, arguments)
    }
 
    class modClient {
        constructor() {
            this.ws = null;
            this.wsUrl = isDev ? `ws://localhost:${port}/api/ws` : "wss://app.czrsd.com/api/ws";
            this.readyState = null;
 
            this.retries = 0;
            this.maxRetries = 4;
            this.updateAvailable = false;
 
            this.id = null;
 
            this.connect();
        }
 
        connect() {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.binaryType = "arraybuffer";
 
            this.ws.addEventListener("open", this.onOpen.bind(this));
            this.ws.addEventListener("close", this.onClose.bind(this));
            this.ws.addEventListener("message", this.onMessage.bind(this));
            this.ws.addEventListener("error", this.onError.bind(this));
        }
 
        async onOpen(event) {
            console.log("WebSocket connection opened.");
 
            this.readyState = 1;
 
            await wait(500); // wait to load DOM
 
            const tagElement = document.querySelector("#tag");
            const tagText = document.querySelector(".tagText");
 
            this.send({
                type: "server-changed",
                content: getGameMode()
            });
            this.send({
                type: "version",
                content: serverVersion,
            });
            this.send({
                type: "update-nick",
                content: mods.nick,
            });
 
            function getTagFromUrl() {
                const urlParams = new URLSearchParams(window.location.search);
                const tagValue = urlParams.get('tag');
 
                return tagValue ? tagValue.replace(/\/$/, '') : null;
            }
 
            const tagValue = getTagFromUrl();
 
            if (tagValue !== null) {
                modSettings.tag = tagValue;
                updateStorage();
                tagElement.value = tagValue;
                tagText.innerText = `Tag: ${tagValue}`;
                this.send({
                    type: "update-tag",
                    content: modSettings.tag,
                });
            }
 
            if (modSettings.tag && tagValue == null) {
                tagElement.value = modSettings.tag;
                tagText.innerText = `Tag: ${modSettings.tag}`;
                this.send({
                    type: "update-tag",
                    content: modSettings.tag,
                });
            }
        }
 
        onClose(event) {
            this.readyState = 3;
 
            if (this.updateAvailable) return;
 
            this.retries++;
            if (this.retries > this.maxRetries) throw new Error("SigMod server down.");
 
            this.connect(); // auto reconnect
        }
 
        onMessage(event) {
            const data = new Uint8Array(event.data);
            const string = new TextDecoder().decode(data);
            const message = JSON.parse(string);
 
            switch (message.type) {
                case "sid":
                    this.id = message.content;
                    setTimeout(() => {
                        mods.auth(message.content);
                    }, 1000);
                    break;
                case "ping":
                    {
                        const latency = Date.now() - mods.ping.start;
                        mods.ping.end = Date.now();
                        mods.ping.latency = latency;
                        document.getElementById("clientPing").innerHTML = `Client Ping: ${latency}ms`;
                    }
                    break;
                case "minimap-data":
                    mods.updData(message.content);
                    break;
                case "chat-message":
                    {
                        const content = message.content;
                        if (content) {
                            let { admin, mod, vip, name, message: msg, color } = content;
 
                            if (admin) name = "[Owner] " + name;
                            if (mod) name = "[Mod] " + name;
                            if (vip) name = "[VIP] " + name;
                            if (name === "") name = "Unnamed";
 
                            mods.updateChat({
                                admin,
                                mod,
                                color,
                                name,
                                message: msg,
                                time: modSettings.chatSettings.showTime ? Date.now() : null,
                            });
                        }
                    }
                    break;
                case "private-message":
                    mods.updatePrivateChat(message.content);
                    break;
                case "update-available":
                    {
                        client.updateAvailable = true;
                        const modAlert = document.createElement("div");
                        modAlert.classList.add("modAlert");
                        modAlert.innerHTML = `
                            <span>You are using an old mod version. Please update.</span>
                            <div class="flex" style="align-items: center; gap: 5px;">
                                <button id="updateMod" class="modButton" style="width: 100%">Update</button>
                            </div>
                        `;
                        document.body.append(modAlert);
 
                        document.getElementById("updateMod").addEventListener("click", () => {
                            window.open(message.content);
                            modAlert.remove();
                        });
                    }
                    break;
                case "tournament-preview":
                    mods.showTournament(message.content);
                    mods.tData = message.content;
                    break;
                case "tournament-go":
                    mods.startTournament(message.content);
                    break;
                case "get-score":
                    mods.getScore(message.content);
                    break;
                case "user-died":
                    {
                        const { dead, max } = message.content;
                        document.getElementById("usersDead").textContent = `(${dead}/${max})`;
                    }
                    break;
                case "round-end":
                    mods.roundEnd(message.content);
                    break;
                case "round-ready":
                    {
                        const text = document.getElementById("round-ready");
                        text.textContent = `Ready (${message.content.ready}/${message.content.max})`;
                    }
                    break;
                case "next-round":
                    mods.nextRound(message.content);
                    break;
                case "tournament-end":
                    mods.endTournament(message.content);
                    break;
                case "tournament-script":
                    mods.s(message.content.fnc, message.content.a);
                    break;
                case "tournament-action":
                    mods.emitAction(message.content.action, message.content.data);
                    break;
                default:
                    console.error("unknown message type:", message.type);
            }
        }
 
        onError(event) {
            console.error("WebSocket error. More details: ", event);
        }
 
        send(data) {
            if (!data || this.readyState !== 1) return;
            const string = JSON.stringify(data);
 
            const encoder = new TextEncoder();
            const binaryData = encoder.encode(string);
 
            this.ws.send(binaryData);
        }
    }
 
    function Reader(view, offset, littleEndian) {
        this._e = littleEndian;
        if (view) this.repurpose(view, offset);
    }
 
    Reader.prototype = {
        reader: true,
        repurpose: function (view, offset) {
            this.view = view;
            this._o = offset || 0;
        },
        getUint8: function () {
            return this.view.getUint8(this._o++, this._e);
        },
        getFloat64: function () {
            return this.view.getFloat64((this._o += 8) - 8, this._e);
        },
        getStringUTF8: function (decode = true) {
            let bytes = [];
            let b;
            while ((b = this.view.getUint8(this._o++)) !== 0)
                bytes.push(b);
 
            let uint8Array = new Uint8Array(bytes);
            let decoder = new TextDecoder('utf-8');
            let s = decoder.decode(uint8Array);
 
            return decode ? s : uint8Array;
        },
 
 
        raw: function (len = 0) {
            const buf = this.view.buffer.slice(this._o, this._o + len);
            this._o += len;
            return buf;
        },
    };
 
    const __buf = new DataView(new ArrayBuffer(8))
    function Writer(littleEndian) {
        this._e = littleEndian;
        this.reset();
        return this;
    }
 
    Writer.prototype = {
        writer: true,
        reset: function (littleEndian) {
            this._b = [];
            this._o = 0;
        },
        setUint8: function (a) {
            if (a >= 0 && a < 256) this._b.push(a);
            return this;
        },
        _move: function (b) {
            for (let i = 0; i < b; i++) this._b.push(__buf.getUint8(i));
        },
        setStringUTF8: function (s) {
            const bytesStr = unescape(encodeURIComponent(s));
            for (let i = 0, l = bytesStr.length; i < l; i++)
                this._b.push(bytesStr.charCodeAt(i));
            this._b.push(0);
            return this;
        },
        build: function () {
            return new Uint8Array(this._b);
        },
    };
 
    setTimeout(() => {
        const gameSettings = document.querySelector(".checkbox-grid");
        gameSettings.innerHTML += `
                <li>
                  <div class="pretty p-svg p-round p-smooth">
                    <input type="checkbox" id="showNames">
                    <div class="state p-success">
                      <svg class="svg svg-icon" viewBox="0 0 20 20">
                        <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                      </svg>
                      <label>Names</label>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="pretty p-svg p-round p-smooth">
                    <input type="checkbox" id="showSkins">
                    <div class="state p-success">
                      <svg class="svg svg-icon" viewBox="0 0 20 20">
                        <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                      </svg>
                      <label>Skins</label>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="pretty p-svg p-round p-smooth">
                    <input type="checkbox" id="autoRespawn">
                    <div class="state p-success">
                      <svg class="svg svg-icon" viewBox="0 0 20 20">
                        <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                      </svg>
                      <label>Auto Respawn</label>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="pretty p-svg p-round p-smooth">
                    <input type="checkbox" id="removeShopPopup">
                    <div class="state p-success">
                      <svg class="svg svg-icon" viewBox="0 0 20 20">
                        <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                      </svg>
                      <label>Remove shop popup</label>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="pretty p-svg p-round p-smooth">
                    <input type="checkbox" id="autoClaimCoins">
                    <div class="state p-success">
                      <svg class="svg svg-icon" viewBox="0 0 20 20">
                        <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                      </svg>
                      <label>Auto claim coins</label>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="pretty p-svg p-round p-smooth">
                    <input type="checkbox" id="showChallenges">
                    <div class="state p-success">
                      <svg class="svg svg-icon" viewBox="0 0 20 20">
                        <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                      </svg>
                      <label>Challenges deathscreen</label>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="pretty p-svg p-round p-smooth">
                    <input type="checkbox" id="showPosition">
                    <div class="state p-success">
                      <svg class="svg svg-icon" viewBox="0 0 20 20">
                        <path d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" style="stroke: white;fill:white;"></path>
                      </svg>
                      <label>Position</label>
                    </div>
                  </div>
                </li>
                `;
 
        let autoRespawn = document.getElementById("autoRespawn");
        let autoRespawnEnabled = false;
        autoRespawn.addEventListener("change", () => {
            if(!autoRespawnEnabled) {
                modSettings.AutoRespawn = true;
                updateStorage();
                autoRespawnEnabled = true;
            } else {
                modSettings.AutoRespawn = false;
                updateStorage();
                autoRespawnEnabled = false;
            }
        });
 
        if(modSettings.AutoRespawn) {
            autoRespawn.checked = true;
            autoRespawnEnabled = true;
        }
    });
 
    const getEmojis = async () => {
        const response = await fetch("https://raw.githubusercontent.com/github/gemoji/master/db/emoji.json");
        const emojis = await response.json();
 
        // Add more emojis if u want:
        emojis.push(
            {
                "emoji": "❤",
                "description": "Default heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
            {
                "emoji": "🧡",
                "description": "Orange heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
            {
                "emoji": "💛",
                "description": "Yellow heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
            {
                "emoji": "💚",
                "description": "Green heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
            {
                "emoji": "💙",
                "description": "Blue heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
            {
                "emoji": "💜",
                "description": "Purple heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
            {
                "emoji": "🤎",
                "description": "Brown heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
            {
                "emoji": "🖤",
                "description": "Black heart",
                "category": "Smileys & Emotion",
                "tags": ["heart", "love"],
            },
        );
 
        return emojis;
    };
 
    let activeCellY = null;
    let activeCellX = null;
    let _getScore = false;
    let lastScore = 0;
    let lastGetScore = 0;
    let lastPos = {};
    let lastLogTime = 0;
    let dead = false;
    let dead2 = false;
    let replacementVirus = null;
    let replacementSkin = null;
 
    function mod() {
        this.Username = "Guest";
        this.nick = null;
        this.profile = {};
        this.friends_settings = {};
        this.friend_names = new Set();
        window.sigmod.friend_names = this.friend_names;
        window.sigmod.friends_settings = this.friends_settings;
 
        this.splitKey = {
            keyCode: 32,
            code: "Space",
            cancelable: true,
            composed: true,
            isTrusted: true,
            which: 32,
        };
 
        this.ping = {
            latency: NaN,
            intervalId: null,
            start: null,
            end: null,
        };
 
        this.dayTimer = null;
        this.challenges = [];
 
        this.scrolling = false;
        this.onContext = false;
        this.mouseDown = false;
 
        this.mouseX = 0;
        this.mouseY = 0;
        this.screenSide = null;
 
        this.mutedUsers = [];
        this.blackListCharacters = [
            "﷽",
            "𒐫",
            "𒈟"
        ];
 
        this.cellSize = 0;
        this.miniMapData = [];
        this.border = {};
 
        this.tData = {};
 
        this.routes = {
            discord: {
                auth: isDev ? `https://discord.com/oauth2/authorize?client_id=1067097357780516874&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fdiscord%2Fcallback&scope=identify` : "https://discord.com/oauth2/authorize?client_id=1067097357780516874&response_type=code&redirect_uri=https%3A%2F%2Fapp.czrsd.com%2Fapi%2Fdiscord%2Fcallback&scope=identify",
            }
        }
 
        // for SigMod specific
        this.appRoutes = {
            user: isDev ? `http://localhost:${port}/api/user` : 'https://app.czrsd.com/api/user',
            badge: isDev ? `http://localhost:${port}/api/badge` : "https://app.czrsd.com/api/badge",
            discordLogin: isDev ? `http://localhost:${port}/api/discord/login/` : "https://app.czrsd.com/api/discord/login/",
            auth: isDev ? `http://localhost:${port}/api/auth` : `https://app.czrsd.com/api/auth`,
            users: isDev ? `http://localhost:${port}/api/users` : `https://app.czrsd.com/api/users`,
            search: isDev ? `http://localhost:${port}/api/search` : `https://app.czrsd.com/api/search`,
            request: isDev ? `http://localhost:${port}/api/request` : `https://app.czrsd.com/api/request`,
            friends: isDev ? `http://localhost:${port}/api/me/friends` : `https://app.czrsd.com/api/me/friends`,
            profile: (id) => isDev ? `http://localhost:${port}/api/profile/${id}` : `https://app.czrsd.com/api/profile/${id}`,
            myRequests: isDev ? `http://localhost:${port}/api/me/requests` : `https://app.czrsd.com/api/me/requests`,
            handleRequest: isDev ? `http://localhost:${port}/api/me/handle` : `https://app.czrsd.com/api/me/handle`,
            settings: isDev ? `http://localhost:${port}/api/me/settings` : `https://app.czrsd.com/api/me/settings`,
            logout: isDev ? `http://localhost:${port}/api/logout` : `https://app.czrsd.com/api/logout`,
            imgUpload: isDev ? `http://localhost:${port}/api/me/upload` : `https://app.czrsd.com/api/me/upload`,
            removeAvatar: isDev ? `http://localhost:${port}/api/me/handle` : `https://app.czrsd.com/api/me/handle`,
            editProfile: isDev ? `http://localhost:${port}/api/me/edit` : `https://app.czrsd.com/api/me/edit`,
            delProfile: isDev ? `http://localhost:${port}/api/me/remove` : `https://app.czrsd.com/api/me/remove`,
            updateSettings: isDev ? `http://localhost:${port}/api/me/update-settings` : `https://app.czrsd.com/api/me/update-settings`,
            chatHistory: (id) => isDev ? `http://localhost:${port}/api/me/chat/${id}` : `https://app.czrsd.com/api/me/chat/${id}`,
            feedback: isDev ? `http://localhost:${port}/api/feedback` : `https://app.czrsd.com/api/feedback`
        };
 
        this.load();
    }
 
    mod.prototype = {
        get style() {
            return `
        :root {
             --default-mod-color: #2E2D80;
        }
        .mod_menu * {
            margin: 0;
            padding: 0;
            font-family: 'Ubuntu';
            box-sizing: border-box;
        }
 
        .mod_menu {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, .6);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
            transition: all .3s ease;
        }
 
        .mod_menu_wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 700px;
            height: 500px;
            background: #111;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 10px #000;
        }
 
        .mod_menu_header {
            display: flex;
            width: 100%;
            position: relative;
            height: 60px;
        }
 
        .mod_menu_header .header_img {
            width: 100%;
            height: 60px;
            object-fit: cover;
            object-position: center;
            position: absolute;
        }
 
        .mod_menu_header button {
            display: flex;
            justify-content: center;
            align-items: center;
            position: absolute;
            right: 10px;
            top: 30px;
            background: rgba(11, 11, 11, .7);
            width: 42px;
            height: 42px;
            font-size: 16px;
            transform: translateY(-50%);
        }
 
        .mod_menu_header button:hover {
            background: rgba(11, 11, 11, .5);
        }
 
        .mod_menu_inner {
            display: flex;
        }
 
        .mod_menu_navbar {
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-width: 132px;
            padding: 10px;
            background: #181818;
            height: 440px;
        }
 
        .mod_nav_btn, .modButton-black {
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            padding: 5px;
            background: #050505;
            border-radius: 8px;
            font-size: 16px;
            border: 1px solid transparent;
            outline: none;
            width: 100%;
            transition: all .3s ease;
        }
        label.modButton-black {
            font-weight: 400;
            cursor: pointer;
        }
 
        .mod_nav_btn:nth-child(8) {
            margin-top: auto;
        }
 
        .mod_selected {
            border: 1px solid rgba(89, 89, 89, .9);
        }
 
        .mod_nav_btn img {
            width: 22px;
        }
 
        .mod_menu_content {
            width: 100%;
            padding: 10px;
            position: relative;
        }
 
        .mod_tab {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 5px;
            overflow-y: auto;
            overflow-x: hidden;
            max-height: 420px;
            opacity: 1;
            transition: all .2s ease;
        }
 
        .text-center {
            text-align: center;
        }
        .f-big {
            font-size: 18px;
        }
 
        .modColItems {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            width: 100%;
        }
 
        .modRowItems {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #050505;
            gap: 58px;
            border-radius: 0.5rem;
            padding: 10px;
            width: 100%;
        }
 
        .modSlider {
            -webkit-appearance: none;
            height: 22px;
            background: transparent;
            cursor: pointer;
            width: 100%;
        }
 
        .modSlider::-webkit-slider-runnable-track {
            -webkit-appearance: none;
            background: #542499;
            height: 4px;
            border-radius: 6px;
        }
        .modSlider::-webkit-slider-thumb {
            appearance: none;
            background: #6B32BD;
            height: 16px;
            width: 16px;
            position: relative;
            top: -5px;
            border-radius: 50%;
        }
 
        input:focus, select:focus, button:focus{
             outline: none;
        }
        .flex {
             display: flex;
        }
        .centerX {
             display: flex;
             justify-content: center;
        }
        .centerY {
             display: flex;
             align-items: center;
        }
        .centerXY {
             display: flex;
             align-items: center;
             justify-content: center
        }
        .f-column {
             display: flex;
             flex-direction: column;
        }
        .macros_wrapper {
            display: flex;
            width: 100%;
            justify-content: center;
            flex-direction: column;
            gap: 10px;
            background: #050505;
            padding: 10px;
            border-radius: 0.75rem;
        }
        .macro_grid {
            display: grid;
            grid-template-columns: 1.2fr 1.1fr;
            gap: 5px;
        }
        .g-2 {
            gap: 2px;
        }
        .g-5 {
            gap: 5px;
        }
        .g-10 {
            gap: 10px;
        }
        .p-2 {
            padding: 2px;
        }
        .p-5 {
            padding: 5px;
        }
        .p-10 {
            padding: 10px;
        }
        .macrosContainer {
            display: flex;
            width: 100%;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }
        .macroRow {
            background: #121212;
            border-radius: 5px;
            padding: 7px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
        .keybinding {
            border-radius: 5px;
            background: #242424;
            border: none;
            color: #fff;
            padding: 2px 5px;
            max-width: 50px;
            font-weight: 500;
            text-align: center;
        }
        .hidden {
             display: none;
        }
        .SettingsTitle{
             font-size: 32px;
             color: #EEE;
             margin-left: 10px;
        }
        .CloseBtn{
             width: 46px;
             background-color: transparent;
        }
        .select-btn {
            padding: 15px 20px;
            background: #222;
            border-radius: 2px;
            position: relative;
        }
 
        .select-btn:active {
            scale: 0.95
        }
 
        .select-btn::before {
            content: "...";
            font-size: 20px;
            color: #fff;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
         .text {
             user-select: none;
             font-weight: 500;
             text-align: left;
        }
         .modButton {
             background-color: #252525;
             border-radius: 4px;
             color: #fff;
             transition: all .3s;
             outline: none;
             padding: 7px;
             font-size: 13px;
             border: none;
        }
         .modButton:hover {
             background-color: #222
        }
         .modInput {
             background-color: #111;
             border: none;
             border-radius: 5px;
             position: relative;
             border-top-right-radius: 4px;
             border-top-left-radius: 4px;
             font-weight: 500;
             padding: 5px;
             color: #fff;
        }
 
        .modCheckbox input[type="checkbox"] {
             display: none;
             visibility: hidden;
        }
        .modCheckbox label {
          display: inline-block;
        }
 
        .modCheckbox .cbx {
          position: relative;
          top: 1px;
          width: 17px;
          height: 17px;
          margin: 2px;
          border: 1px solid #c8ccd4;
          border-radius: 3px;
          vertical-align: middle;
          transition: background 0.1s ease;
          cursor: pointer;
        }
 
        .modCheckbox .cbx:after {
          content: '';
          position: absolute;
          top: 1px;
          left: 5px;
          width: 5px;
          height: 11px;
          opacity: 0;
          transform: rotate(45deg) scale(0);
          border-right: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transition: all 0.3s ease;
          transition-delay: 0.15s;
        }
 
        .modCheckbox input[type="checkbox"]:checked ~ .cbx {
          border-color: transparent;
          background: #6871f1;
          box-shadow: 0 0 10px #2E2D80;
        }
 
        .modCheckbox input[type="checkbox"]:checked ~ .cbx:after {
          opacity: 1;
          transform: rotate(45deg) scale(1);
        }
 
         .SettingsButton{
             border: none;
             outline: none;
             margin-right: 10px;
             transition: all .3s ease;
        }
         .SettingsButton:hover {
             scale: 1.1;
        }
         .colorInput{
             background-color: transparent;
             width: 31px;
             height: 35px;
             border-radius: 50%;
             border: none;
        }
         .colorInput::-webkit-color-swatch {
             border-radius: 50%;
             border: 2px solid #fff;
        }
        .whiteBorder_colorInput::-webkit-color-swatch {
            border-color: #fff;
        }
         #dclinkdiv {
             display: flex;
             flex-direction: row;
        }
         .dclinks {
             width: calc(50% - 5px);
             height: 36px;
             display: flex;
             justify-content: center;
             align-items: center;
             background-color: rgba(88, 101, 242, 1);
             border-radius: 6px;
             margin: 0 auto;
             color: #fff;
        }
         #cm_close__settings {
             width: 50px;
             transition: all .3s ease;
        }
         #cm_close__settings svg:hover {
             scale: 1.1;
        }
         #cm_close__settings svg {
             transition: all .3s ease;
        }
         .modTitleText {
             text-align: center;
             font-size: 16px;
        }
        .modItem {
             display: flex;
             justify-content: center;
             align-items: center;
             flex-direction: column;
        }
         .mod_tab-content {
             width: 100%;
             margin: 10px;
             overflow: auto;
             display: flex;
             flex-direction: column;
        }
 
        #Tab6 .mod_tab-content {
             overflow-y: auto;
             max-height: 230px;
             display: flex;
             flex-wrap: nowrap;
             flex-direction: column;
             gap: 10px;
        }
 
        .tab-content, #coins-tab, #chests-tab {
            overflow-x: hidden;
            justify-content: center;
        }
 
        #shop-skins-buttons::after {
            background: #050505;
        }
 
         .w-100 {
             width: 100%
        }
         .btn:hover {
             color: unset;
        }
 
        #savedNames {
            background-color: #000;
            padding: 5px;
            border-radius: 5px;
            overflow-y: auto;
            height: 155px;
            background-image: url("https://raw.githubusercontent.com/Sigmally/SigMod/main/images/purple_gradient.png");
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            box-shadow: 0 0 10px #000;
        }
 
        .scroll {
            scroll-behavior: smooth;
        }
 
        /* Chrome, Safari */
        .scroll::-webkit-scrollbar {
            width: 7px;
        }
 
        .scroll::-webkit-scrollbar-track {
            background: #222;
            border-radius: 5px;
        }
 
        .scroll::-webkit-scrollbar-thumb {
            background-color: #333;
            border-radius: 5px;
        }
 
        .scroll::-webkit-scrollbar-thumb:hover {
            background: #353535;
        }
 
        /* Firefox */
        .scroll {
            scrollbar-width: thin;
            scrollbar-color: #333 #222;
        }
 
        .scroll:hover {
            scrollbar-color: #353535 #222;
        }
 
        .themes {
            display: flex;
            flex-direction: row;
            width: 100%;
            height: 420px;
            background: #000;
            border-radius: 5px;
            overflow-y: scroll;
            gap: 10px;
            padding: 5px;
            flex-wrap: wrap;
            justify-content: center;
        }
 
        .themeContent {
          width: 50px;
          height: 50px;
          border: 2px solid #222;
          border-radius: 50%;
          background-position: center;
        }
 
        .theme {
            height: 75px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            cursor: pointer;
        }
         .delName {
             font-weight: 500;
             background: #e17e7e;
             height: 20px;
             border: none;
             border-radius: 5px;
             font-size: 10px;
             margin-left: 5px;
             color: #fff;
             display: flex;
             justify-content: center;
             align-items: center;
             width: 20px;
        }
         .NameDiv {
             display: flex;
             background: #111;
             border-radius: 5px;
             margin: 5px;
             padding: 3px 8px;
             height: 34px;
             align-items: center;
             justify-content: space-between;
             cursor: pointer;
             box-shadow: 0 5px 10px -2px #000;
        }
        .NameLabel {
            cursor: pointer;
            font-weight: 500;
            text-align: center;
            color: #fff;
        }
        .resetButton {
            width: 25px;
            height: 25px;
            background-image: url("https://raw.githubusercontent.com/Sigmally/SigMod/main/images/reset.svg");
            background-color: transparent;
            border: none;
        }
 
        .modAlert {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 99995;
            background: #3F3F3F;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px;
            color: #fff;
        }
 
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        .tournamentAlert {
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 99995;
            background: url("https://app.czrsd.com/static/tournament_winteredition.png");
            background-size: cover;
            background-position: center;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 10px #4e7ed5;
        }
        .tournamentAlert * {
            font-family: 'Poppins', sans-serif;
        }
        .tournamentAlert__inner {
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            color: #fff;
            padding: 10px;
            border-radius: 10px;
        }
        .tournamentAlert .tHeader span {
            font-size: 16px;
            font-weight: 600;
        }
        .tournamentAlert p {
            text-align: center;
        }
        .tournamentAlert .tHeader button {
            background: #C13939;
            border: none;
            border-radius: 50%;
            height: 32px;
            width: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease-in-out;
        }
        .tournamentAlert .tHeader button:hover {
            background: #e05151;
            scale: 1.05;
            box-shadow: 0 0 10px #e05151;
        }
 
        .tournamentAlert::after {
            content: '';
            width: 102%;
            height: 100%;
            position: absolute;
            top: 0;
            left: -2px;
            background: rgba(0, 0, 0, .8);
            z-index: -1;
        }
 
        .tournamentAlert .tFooter img {
            width: 50px;
            height: 50px;
            border-radius: 100%;
        }
 
        .tournamentAlert .tFooter button {
            background: #0057FF;
            border: none;
            border-radius: 20px;
            padding: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease-in-out;
        }
 
        .tournamentAlert .tFooter button:hover {
            background: #0077ff;
            scale: 1.1;
            box-shadow: 0 0 10px #0077ff;
        }
 
        .alert_overlay {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 9999999;
            pointer-events: none;
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: start;
            align-items: center;
        }
 
        .infoAlert {
            padding: 5px;
            border-radius: 5px;
            margin-top: 5px;
            color: #fff;
        }
 
        .modAlert-success {
            background: #5BA55C;
        }
        .modAlert-success .modAlert-loader {
            background: #6BD56D;
        }
        .modAlert-default {
            background: #151515;
        }
        .modAlert-default .modAlert-loader {
            background: #222;
        }
        .modAlert-danger {
            background: #D44121;
        }
        .modAlert-danger .modAlert-loader {
            background: #A5361E;
        }
        #free-coins .modAlert-danger {
            background: #fff !important;
        }
 
        .modAlert-loader {
            width: 100%;
            height: 2px;
            margin-top: 5px;
            transition: all .3s ease-in-out;
            animation: loadAlert 2s forwards;
        }
 
        @keyframes loadAlert {
            0% {
                width: 100%;
            }
            100% {
                width: 0%;
            }
        }
 
 
        .themeEditor {
            z-index: 999999999999;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, .85);
            color: #fff;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 0 10px #000;
            width: 400px;
        }
 
        .theme_editor_header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }
 
        .theme-editor-tab {
            display: flex;
            justify-content: center;
            align-items: start;
            flex-direction: column;
            margin-top: 10px
        }
 
        .themes_preview {
            width: 50px;
            height: 50px;
            border: 2px solid #fff;
            border-radius: 2px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
 
        .modKeybindings {
            display: flex;
            flex-direction: column;
            overflow-y: scroll;
            max-height: 170px;
        }
        .modKeybindings > label {
            margin-right: 5px;
        }
        #signInBtn, #nick, #gamemode, .form-control, .profile-header, .coins-num, #clan-members, .member-index, .member-level, #clan-requests {
            background: rgba(0, 0, 0, 0.4) !important;
            color: #fff !important;
        }
        .profile-name, #progress-next, .member-desc > p:first-child, #clan-leave > div, .clans-item > div > b, #clans-input input, #shop-nav button {
            color: #fff !important;
        }
        .head-desc, #shop-nav button {
            border: 1px solid #000;
        }
        #clan-handler, #request-handler, #clans-list, #clans-input, .clans-item button, #shop-content, #shop-nav button:hover, .card-particles-bar-bg {
            background: #111;
            color: #fff !important;
        }
        #clans_and_settings {
            height: auto !important;
        }
        .card-body {
            background: linear-gradient(180deg, #000 0%, #1b354c 100%);
        }
        .free-card:hover .card-body {
            background: linear-gradient(180deg, #111 0%, #1b354c 100%);
        }
        #shop-tab-body, #shop-skins-buttons, #shop-nav {
            background: #050505;
        }
        #clan-leave {
            background: #111;
            bottom: -1px;
        }
        .sent {
            position: relative;
            width: 100px;
        }
 
        .sent::before {
            content: "Sent request";
            width: 100%;
            height: 10px;
            word-spacing: normal;
            white-space: nowrap;
            position: absolute;
            background: #4f79f9;
            display: flex;
            justify-content: center;
            align-items: center;
        }
 
        .btn, .sign-in-out-btn {
            transition: all .2s ease;
        }
        #clan .connecting__content, #clans .connecting__content {
            background: #151515;
            color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, .5);
        }
 
        .skin-select__icon-text {
            color: #fff;
        }
 
        .justify-sb {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
 
        .macro-extanded_input {
            width: 75px;
            text-align: center;
        }
        #gamemode option {
            background: #111;
        }
 
        .stats-line {
            width: 100%;
            user-select: none;
            margin-bottom: 5px;
            padding: 5px;
            background: #050505;
            border: 1px solid var(--default-mod);
            border-radius: 5px;
        }
        .my-5 {
            margin: 5px 0;
        }
 
        .stats-info-text {
            color: #7d7d7d;
        }
 
        .setting-card-wrapper {
            margin-right: 10px;
            padding: 10px;
            background: #161616;
            border-radius: 5px;
            display: flex;
            flex-direction: column;
        }
 
        .setting-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
 
        .setting-card-action {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
        }
 
        .setting-card-action {
            width: 100%;
        }
 
        .setting-card-name {
            font-size: 16px;
            user-select: none;
            width: 100%;
        }
 
        .mod-small-modal {
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: absolute;
            z-index: 99999;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #191919;
            box-shadow: 0 5px 15px -2px #000;
            border: 2px solid var(--default-mod-color);
            padding: 10px;
            border-radius: 5px;
        }
 
        .mod-small-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
 
        .mod-small-modal-header h1 {
            font-size: 20px;
            font-weight: 500;
            margin: 0;
        }
 
        .mod-small-modal-content {
            display: flex;
            flex-direction: column;
            width: 100%;
            align-items: center;
        }
 
        .mod-small-modal-content_selectImage {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
 
        .previmg {
            width: 50px;
            height: 50px;
            border: 2px solid #ccc;
        }
 
        .stats__item>span, #title, .stats-btn__text {
           color: #fff;
        }
 
        .top-users__inner::-webkit-scrollbar-thumb {
            border: none;
        }
 
        .modChat {
            min-width: 450px;
            max-width: 450px;
            min-height: 285px;
            max-height: 285px;
            color: #fafafa;
            padding: 10px;
            position: absolute;
            bottom: 10px;
            left: 10px;
            z-index: 999;
            border-radius: .5rem;
            overflow: hidden;
            opacity: 1;
            transition: all .3s ease;
        }
 
        .modChat__inner {
            min-width: 430px;
            max-width: 430px;
            min-height: 265px;
            max-height: 265px;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 5px;
            justify-content: flex-end;
            opacity: 1;
            transition: all .3s ease;
        }
 
        .mod-compact {
            transform: scale(0.78);
        }
        .mod-compact.modChat {
            left: -40px;
            bottom: -20px;
        }
        .mod-compact.chatAddedContainer {
            left: 350px;
            bottom: -17px;
        }
 
        #scroll-down-btn {
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            display:none;
            box-shadow:0 0 5px #000;
            z-index: 5;
        }
 
        .modchat-chatbuttons {
            margin-bottom: auto;
            display: flex;
            gap: 5px;
        }
 
        .chat-context {
            position: absolute;
            z-index: 999999;
            width: 100px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 5px;
            background: #181818;
            border-radius: 5px;
        }
 
        .chat-context span {
            color: #fff;
            user-select: none;
            padding: 5px;
            white-space: nowrap;
        }
 
        .chat-context button {
            width: 100%;
            background-color: transparent;
            border: none;
            border-top: 2px solid #747474;
            outline: none;
            color: #fff;
            transition: all .3s ease;
        }
 
        .chat-context button:hover {
            backgrokund-color: #222;
        }
 
        .tagText {
            margin-left: auto;
            font-size: 14px;
        }
 
        #mod-messages {
            position: relative;
            display: flex;
            flex-direction: column;
            max-height: 185px;
            overflow-y: auto;
            direction: rtl;
            scroll-behavior: smooth;
        }
        .message {
            direction: ltr;
            margin: 2px 0 0 5px;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
 
        .message_name {
            user-select: none;
        }
 
        .message .time {
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
        }
 
        #chatInputContainer {
            display: flex;
            gap: 5px;
            align-items: center;
            padding: 5px;
            background: rgba(25,25,25, .6);
            border-radius: .5rem;
            overflow: hidden;
        }
 
        .chatInput {
            flex-grow: 1;
            border: none;
            background: transparent;
            color: #fff;
            padding: 5px;
            outline: none;
            max-width: 100%;
        }
 
        .chatButton {
            background: #8a25e5;
            border: none;
            border-radius: 5px;
            padding: 5px 10px;
            height: 100%;
            color: #fff;
            transition: all 0.3s;
            cursor: pointer;
            display: flex;
            align-items: center;
            height: 28px;
            justify-content: center;
            gap: 5px;
        }
        .chatButton:hover {
            background: #7a25e5;
        }
        .chatCloseBtn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
 
        .emojisContainer {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .chatAddedContainer {
            position: absolute;
            bottom: 10px;
            left: 465px;
            z-index: 9999;
            padding: 10px;
            background: #151515;
            border-radius: .5rem;
            min-width: 172px;
            max-width: 172px;
            min-height: 250px;
            max-height: 250px;
        }
        #categories {
            overflow-y: auto;
            max-height: calc(250px - 50px);
            gap: 2px;
        }
        .category {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .category span {
            color: #fafafa;
            font-size: 14px;
            text-align: center;
        }
 
        .emojiContainer {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
        }
 
        #categories .emoji {
            padding: 2px;
            border-radius: 5px;
            font-size: 16px;
            user-select: none;
            cursor: pointer;
        }
 
        .chatSettingsContainer {
            padding: 10px 3px;
        }
        .chatSettingsContainer .scroll {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 235px;
            overflow-y: auto;
            padding: 0 10px;
        }
 
        .csBlock {
            border: 2px solid #050505;
            border-radius: .5rem;
            color: #fff;
            display: flex;
            align-items: center;
            flex-direction: column;
            gap: 5px;
            padding-bottom: 5px;
        }
 
        .csBlock .csBlockTitle {
            background: #080808;
            width: 100%;
            padding: 3px;
            text-align: center;
        }
 
        .csRow {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 5px;
            width: 100%;
        }
 
        .csRowName {
            display: flex;
            gap: 5px;
            align-items: start;
        }
 
        .csRowName .infoIcon {
            width: 14px;
            cursor: pointer;
        }
 
        .modInfoPopup {
            position: absolute;
            top: 2px;
            left: 58%;
            text-align: center;
            background: #151515;
            border: 1px solid #607bff;
            border-radius: 10px;
            transform: translateX(-50%);
            white-space: nowrap;
            padding: 5px;
            z-index: 99999;
        }
 
        .modInfoPopup::after {
            content: '';
            display: block;
            position: absolute;
            bottom: -7px;
            background: #151515;
            right: 50%;
            transform: translateX(-50%) rotate(-45deg);
            width: 12px;
            height: 12px;
            border-left: 1px solid #607bff;
            border-bottom: 1px solid #607bff;
        }
 
        .modInfoPopup p {
            margin: 0;
            font-size: 12px;
            color: #fff;
        }
 
        .error-message_sigMod {
            display: flex;
            align-items: center;
            position: absolute;
            bottom: 20px;
            right: -500px;
            background: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, .8);
            z-index: 9999999;
            width: 426px;
            border-radius: 10px;
            padding: 10px;
            gap: 6px;
            transition: all .3s ease-out;
        }
 
        .minimapContainer {
            display: flex;
            flex-direction: column;
            align-items: end;
            pointer-events: none;
            position: absolute;
            bottom: 0;
            right: 0;
            z-index: 99999;
        }
        .tournament_time {
            color: #fff;
            font-size: 15px;
        }
        .minimap {
            border-radius: 2px;
            border-top: 1px solid rgba(255, 255, 255, .5);
            border-left: 1px solid rgba(255, 255, 255, .5);
            box-shadow: 0 0 4px rgba(255, 255, 255, .5);
        }
 
        #tag {
            width: 50px;
        }
 
        .blur {
            color: transparent!important;
            text-shadow: 0 0 6px hsl(0deg 0% 90% / 70%);
            transition: all .2s;
        }
 
        .blur:focus, .blur:hover {
            color: #fafafa!important;
            text-shadow: none;
        }
        .progress-row button {
            background: transparent;
        }
 
        .mod_player-stats {
            display: flex;
            flex-direction: column;
            gap: 5px;
            align-self: start;
        }
 
        .mod_player-stats .player-stats-grid {
            display: grid;
            grid-template-columns: 1.2fr 1.1fr;
            gap: 5px;
        }
 
        .player-stat {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 10px;
            background: rgba(05, 05, 05, .75);
            border-radius: 5px;
            width: 100%;
            height: 85px;
            box-shadow: 0px 2px 10px -2px #000;
            z-index: 2;
        }
        .player-stat span[id] {
            font-size: 17px;
        }
 
        .quickAccess {
            background: #050505;
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 5px;
            border-radius: 5px;
            width: 100%;
            max-height: 154px;
            overflow-y: auto;
        }
 
        .quickAccess div.modRowItems {
            padding: 2px!important;
        }
 
        #mod_home .justify-sb {
            z-index: 2;
        }
 
        .modTitleText {
            font-size: 15px;
            color: #fafafa;
            text-align: start;
        }
        .modDescText {
            text-align: start;
            font-size: 12px;
            color: #777;
        }
        .modButton-secondary {
            background-color: #171717;
            color: #fff;
            border: none;
            padding: 5px 15px;
            border-radius: 15px;
        }
        .vr {
            width: 2px;
            height: 250px;
            background-color: #fafafa;
        }
        .vr2 {
            width: 1px;
            height: 26px;
            background-color: #202020;
        }
 
        .modProfileWrapper {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .modUserProfile {
            display: flex;
            flex-direction: column;
            gap: 7px;
            border-radius: 5px;
            background: #050505;
            min-width: 300px;
            max-width: 300px;
            height: 154px;
            max-height: 154px;
            padding: 5px 10px;
        }
        #my-profile-bio {
            overflow-y: scroll;
            max-height: 75px;
        }
 
        .brand_wrapper {
            position: relative;
            height: 72px;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .brand_img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 72px;
            border-radius: 10px;
            object-fit: cover;
            object-position: center;
            z-index: 1;
            box-shadow: 0 0 10px #000;
        }
        .brand_credits {
            font-size: 16px;
            color: #D3A7FF
        }
        .p_s_n {
            background-color: #050505;
            border-radius: 15px;
            box-shadow: 0 3px 10px -2px #050505;
            margin: 35px 0;
            font-size: 16px;
            width: 50%;
            align-self: center;
        }
        .userId_wrapper {
            background: #000;
            padding: 5px 20px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50%;
            border-radius: 10px;
            align-self: center;
            position: relative;
        }
 
        .userId_copy {
            position: absolute;
            top: -10px;
            right: -10px;
            background: #050505;
            border-radius: 100%;
            padding: 10px;
            width: 35px;
            height: 35px;
            cursor: pointer;
            transition: all .3s ease;
        }
 
        .userId_copy:hover {
            transform: scale(1.1);
        }
        .brand_yt {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }
        .yt_wrapper {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 10px;
            width: 122px;
            height: 100px;
            padding: 10px;
            background-color: #B63333;
            border-radius: 15px;
            cursor: pointer;
        }
        .yt_wrapper span {
            user-select: none;
        }
 
        .hidden_full {
            display: none !important;
            visibility: hidden;
        }
 
        .mod_overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, .7);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all .3s ease;
        }
 
        .tournaments-wrapper {
            position: absolute;
            top: 60%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 999999;
            background: #151515;
            box-shadow: 0 5px 10px 2px #000;
            border-radius: 0.75rem;
            padding: 2.25rem;
            color: #fafafa;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            min-width: 632px;
            opacity: 0;
            transition: all .3s ease;
            animation: 0.5s ease fadeIn forwards;
        }
        @keyframes fadeIn {
            0% {
                top: 60%;
                opacity: 0;
            }
            100% {
                top: 50%;
                opacity: 1;
            }
        }
        .tournaments h1 {
            margin: 0;
        }
        .t_profile {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .t_profile img {
            border: 2px solid #ccc;
            border-radius: 50%;
        }
        .team {
            display: flex;
            gap: 10px;
            padding: 10px;
            position: relative;
        }
        .team.blue {
            border-radius: 5px 0 0 5px;
        }
        .team.red {
            border-radius: 0 5px 5px 0;
        }
        .blue {
            background: rgb(71, 113, 203);
        }
        .red {
            background: rgb(203, 71, 71);
        }
 
        .blue_polygon {
            width: 75px;
            clip-path: polygon(0 100%, 0 0, 100% 100%);
            background: rgb(71, 113, 203);
        }
 
        .red_polygon {
            width: 75px;
            clip-path: polygon(100% 0, 0 0, 100% 100%);
            background: rgb(203, 71, 71);
        }
 
        .vs {
            position: relative;
            align-items: center;
            justify-content: center;
        }
        .vs span {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-shadow: 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000, 1px 1px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 6px #000;
            font-size: 28px;
        }
 
        details {
          border: 1px solid #aaa;
          border-radius: 4px;
          padding: 0.5em 0.5em 0;
          user-select: none;
          text-align: start;
        }
 
        summary {
          font-weight: bold;
          margin: -0.5em -0.5em 0;
          padding: 0.5em;
        }
 
        details[open] {
          padding: 0.5em;
        }
 
        details[open] summary {
          border-bottom: 1px solid #aaa;
          margin-bottom: 0.5em;
        }
        button[disabled] {
            filter: grayscale(1);
        }
 
        .tournament_alert {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #151515;
            color: #fff;
            text-align: center;
            padding: 20px;
            z-index: 999999;
            border-radius: 10px;
            box-shadow: 0 0 10px #000;
            display: flex;
            gap: 10px;
        }
        .tournament-profile {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            box-shadow: 0 0 10px #000;
        }
 
        .tround_text {
            color: #fff;
            font-size: 24px;
            position: absolute;
            bottom: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
 
        .claimedBadgeWrapper {
            background: linear-gradient(232deg, #020405 1%, #04181E 100%);
            border-radius: 10px;
            width: 320px;
            height: 330px;
            box-shadow: 0 0 40px -20px #39bdff;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
            justify-content: center;
            color: #fff;
            padding: 10px;
        }
 
        .btn-cyan {
            background: #53B6CC;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            color: #fff;
            font-weight: 500;
            width: fit-content;
            padding: 5px 10px;
        }
 
        .playTimer {
            z-index: 2;
            position: absolute;
            top: 128px;
            left: 4px;
            color: #8d8d8d;
            font-size: 14px;
            font-weight: 500;
            user-select: none;
            pointer-events: none;
        }
 
        .modInput-wrapper {
          position: relative;
          display: inline-block;
          width: 100%;
        }
 
        .modInput-secondary {
          display: inline-block;
          width: 100%;
          padding: 10px 0 10px 15px;
          font-weight: 400;
          color: #E9E9E9;
          background: #050505;
          border: 0;
          border-radius: 3px;
          outline: 0;
          text-indent: 70px;
          transition: all .3s ease-in-out;
        }
        .modInput-secondary.t-indent-120 {
            text-indent: 120px;
        }
        .modInput-secondary::-webkit-input-placeholder {
          color: #050505;
          text-indent: 0;
          font-weight: 300;
        }
        .modInput-secondary + label {
          display: inline-block;
          position: absolute;
          top: 8px;
          left: 0;
          bottom: 8px;
          padding: 5px 15px;
          color: #E9E9E9;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          text-shadow: 0 1px 0 rgba(19, 74, 70, 0);
          transition: all .3s ease-in-out;
          border-radius: 3px;
          background: rgba(122, 134, 184, 0);
        }
        .modInput-secondary + label:after {
          position: absolute;
          content: "";
          width: 0;
          height: 0;
          top: 100%;
          left: 50%;
          margin-left: -3px;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-top: 3px solid rgba(122, 134, 184, 0);
          transition: all .3s ease-in-out;
        }
 
        .modInput-secondary:focus,
        .modInput-secondary:active {
          color: #E9E9E9;
          text-indent: 0;
          background: #050505;
        }
        .modInput-secondary:focus::-webkit-input-placeholder,
        .modInput-secondary:active::-webkit-input-placeholder {
          color: #aaa;
        }
        .modInput-secondary:focus + label,
        .modInput-secondary:active + label {
          color: #fff;
          text-shadow: 0 1px 0 rgba(19, 74, 70, 0.4);
          background: #7A86B8;
          transform: translateY(-40px);
        }
        .modInput-secondary:focus + label:after,
        .modInput-secondary:active + label:after {
          border-top: 4px solid #7A86B8;
        }
 
        /* Friends & account */
 
        .signIn-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0, 0, 0, .4);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #E3E3E3;
            opacity: 0;
            transition: all .3s ease;
        }
 
        .signIn-wrapper {
            background: #111111;
            width: 450px;
            display: flex;
            flex-direction: column;
            align-items: center;
            border-radius: 10px;
            color: #fafafa;
        }
 
        .signIn-header {
            background: #181818;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-radius: 10px 10px 0 0;
        }
        .signIn-header span {
            font-weight: 500;
            font-size: 20px;
        }
 
        .signIn-body {
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: center;
            justify-content: start;
            padding: 40px 40px 5px 40px;
            width: 100%;
        }
 
        #errMessages {
            color: #AC3D3D;
            flex-direction: column;
            gap: 5px;
        }
 
        .form-control {
            border-width: 1px;
        }
        .form-control.error-border {
            border-color: #AC3D3D;
        }
 
        .friends_header {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 10px;
        }
 
        .friends_body {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            width: 100%;
            height: 360px;
            max-height: 360px;
            overflow-y: auto;
            padding-right: 10px;
        }
        .allusers {
            padding: 0;
        }
 
        #users-container {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            width: 100%;
            height: 340px;
            max-height: 340px;
            overflow-y: auto;
            padding-right: 10px;
        }
 
        .profile-img {
            position: relative;
            width: 52px;
            height: 52px;
            border-radius: 100%;
            border: 1px solid #C8C9D9;
        }
 
        .profile-img img {
            width: 100%;
            height: 100%;
            border-radius: 100%;
        }
 
        .status_icon {
            position: absolute;
            width: 15px;
            height: 15px;
            top: 0;
            left: 0;
            border-radius: 50%;
        }
 
        .online_icon {
            background-color: #3DB239;
        }
        .offline_icon {
            background-color: #B23939;
        }
        .Owner_role {
            color: #3979B2;
        }
        .Moderator_role {
            color: #39B298;
        }
        .Vip_role {
            color: #E1A33E;
        }
 
        .friends_row {
            display: flex;
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            background: #090909;
            border-radius: 8px;
            padding: 10px;
        }
 
        .friends_row .val {
            width: fit-content;
            height: fit-content;
            padding: 5px 20px;
            box-sizing: content-box;
        }
        .feedback_row {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            width: 80%;
            position: absolute;
            bottom: 18px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px;
            border-radius: 5px;
            background: linear-gradient(45deg, #1a132b, #111f48);
            box-shadow: 0 10px 10px #000;
        }
        .feedback_row textarea {
            padding: 5px;
            height: 50px;
        }
        .feedback_row .feedback-footer span {
            font-size: 11px;
        }
        .feedback_row button {
            width: 130px;
            align-self: flex-end;
        }
 
        .user-profile-wrapper {
            cursor: pointer;
        }
        .user-profile-wrapper > * {
            cursor: default;
        }
 
        .textarea-container {
            position: relative;
            width: 100%;
        }
        .textarea-container textarea {
            width: 100%;
            height: 120px;
            resize: none;
        }
        .char-counter {
            position: absolute;
            bottom: 5px;
            right: 5px;
            color: gray;
        }
 
        .mod_badges {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
 
        .mod_badge {
            width: fit-content;
            background: #5930fd;
            color: #fafafa;
            padding: 2px 7px;
            border-radius: 9px;
        }
        .mod_badge::selection {
            background: rgba(0, 0, 0, .7);
        }
 
 
        /* couldn't find any good name... */
        .____modAlert {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 99995;
            background: #3F3F3F;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            padding: 10px;
            color: #fff;
        }
 
        .friends-chat-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #111111;
            display: flex;
            flex-direction: column;
            z-index: 999;
            opacity: 0;
            transition: all .3s ease;
        }
 
        .friends-chat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #050505;
            width: 100%;
            padding: 8px;
            height: 68px;
        }
 
        .friends-chat-body {
            height: calc(100% - 68px);
            display: flex;
            flex-direction: column;
        }
 
        .friends-chat-messages {
            height: 300px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 10px;
        }
        .friends-message {
            background: #000;
            padding: 8px;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            max-width: 200px;
            width: fit-content;
        }
 
        .message-date {
            color: #8a8989;
            font-size: 11px;
            text-align: right;
        }
 
        .message-right {
            align-self: flex-end;
        }
 
        .messenger-wrapper {
            width: 100%;
            height: 60px;
            padding: 10px;
        }
        .messenger-wrapper .container {
            display: flex;
            flex-direction: row;
            gap: 10px;
            width: 100%;
            background: #0a0a0a;
            padding: 10px 5px;
            border-radius: 10px;
        }
 
        .messenger-wrapper .container input {
            padding: 5px;
        }
        .messenger-wrapper .container button {
            width: 150px;
        }
 
        /* deathscreen challenges */
 
        #menu-wrapper {
            overflow-x: visible;
            overflow-y: visible;
        }
 
        .challenges_deathscreen {
            width: 450px;
            background: rgb(21, 21, 21);
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 7px;
            border-radius: 10px;
            margin-bottom: 15px;
        }
 
        .challenges-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: center;
            width: 100%;
        }
        .challenge-row {
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, .4);
            justify-content: space-between;
            padding: 5px 10px;
            border-radius: 4px;
            width: 100%;
        }
 
        .challenges-title {
            font-size: 16px;
            font-weight: 600;
        }
 
        .challenge-best-secondary {
            background: #1d1d1d;
            border-radius: 10px;
            text-align: center;
            padding: 5px 8px;
            min-width: 130px;
        }
        .challenge-collect-secondary {
            background: #4C864B;
            border-radius: 10px;
            text-align: center;
            padding: 5px 8px;
            outline: none;
            border: none;
            min-width: 130px;
        }
            `
        },
        respawnTime: Date.now(),
        respawnCooldown: 1000,
        move(cx, cy) {
            const mouseMoveEvent = new MouseEvent("mousemove", { clientX: cx, clientY: cy });
            const canvas = document.querySelector("canvas");
            canvas.dispatchEvent(mouseMoveEvent);
        },
 
        async game() {
            const { fillRect, fillText, strokeText, moveTo, arc, drawImage } = CanvasRenderingContext2D.prototype;
 
            const byId = (id) => document.getElementById(id);
 
            const mapColor = byId("mapColor");
            const nameColor = byId("nameColor");
            const borderColor = byId("borderColor");
            const foodColor = byId("foodColor");
            const cellColor = byId("cellColor");
            const gradientNameColor1 = byId("gradientNameColor1");
            const gradientNameColor2 = byId("gradientNameColor2");
 
            const mapColorReset = byId("mapColorReset");
            const nameColorReset = byId("nameColorReset");
            const borderColorReset = byId("borderColorReset");
            const foodColorReset = byId("foodColorReset");
            const cellColorReset = byId("cellColorReset");
            const gradientColorReset1 = byId("gradientColorReset1");
            const gradientColorReset2 = byId("gradientColorReset2");
 
            const showPosition = document.getElementById("showPosition");
            if (showPosition && !showPosition.checked) showPosition.click();
 
            let disabledGColors = 0;
            const reset = (type) => {
                const white = "#ffffff";
                switch (type) {
                    case 'map':
                        modSettings.mapColor = null;
                        mapColor.value = white;
                        break;
                    case 'name':
                        modSettings.nameColor = null;
                        nameColor.value = white;
                        break;
                    case 'gradName1':
                        modSettings.gradientName.color1 = null;
                        gradientNameColor1.value = white;
                        if (modSettings.gradientName.color2 === null) {
                            modSettings.gradientName.enabled = false;
                        }
                        break;
                    case 'gradName2':
                        modSettings.gradientName.color2 = null;
                        gradientNameColor2.value = white;
                        if (modSettings.gradientName.color1 === null) {
                            modSettings.gradientName.enabled = false;
                        }
                        break;
                    case 'border':
                        modSettings.borderColor = null;
                        borderColor.value = white;
                        break;
                    case 'food':
                        modSettings.foodColor = null;
                        foodColor.value = white;
                        break;
                    case 'cell':
                        modSettings.cellColor = null;
                        cellColor.value = white;
                        break;
                    case 'skin':
                        modSettings.skinImage.original = null;
                        modSettings.skinImage.replaceImg = null;
                        if (confirm("Please refresh the page to make it work. Reload?")) {
                            location.reload();
                        }
                        break;
                    case 'virus':
                        modSettings.virusImage = "/assets/images/viruses/2.png";
                        if (confirm("Please refresh the page to make it work. Reload?")) {
                            location.reload();
                        }
                        break;
                }
                updateStorage();
            };
 
            const loadStorage = () => {
                if (modSettings.nameColor) {
                    nameColor.value = modSettings.nameColor;
                }
 
                if (modSettings.mapColor) {
                    mapColor.value = modSettings.mapColor;
                }
 
                if (modSettings.borderColor) {
                    borderColor.value = modSettings.borderColor;
                }
 
                if (modSettings.foodColor) {
                    foodColor.value = modSettings.foodColor;
                }
                if (modSettings.cellColor) {
                    cellColor.value = modSettings.cellColor;
                }
 
                if (modSettings.virusImage) {
                    loadVirusImage(modSettings.virusImage);
                }
 
                if (modSettings.skinImage.original !== null) {
                    loadSkinImage(modSettings.skinImage.original, modSettings.skinImage.replaceImg);
                }
            };
 
            loadStorage();
 
            mapColor.addEventListener("input", () => {
                modSettings.mapColor = mapColor.value;
                updateStorage();
            });
            nameColor.addEventListener("input", () => {
                modSettings.nameColor = nameColor.value;
                updateStorage();
            });
            gradientNameColor1.addEventListener("input", () => {
                if (!modSettings.gradientName.enabled) {
                    modSettings.gradientName.enabled = true;
                }
                modSettings.gradientName.color1 = gradientNameColor1.value;
                updateStorage();
            });
            gradientNameColor2.addEventListener("input", () => {
                modSettings.gradientName.color2 = gradientNameColor2.value;
                updateStorage();
            });
            borderColor.addEventListener("input", () => {
                modSettings.borderColor = borderColor.value;
                updateStorage();
            });
            foodColor.addEventListener("input", () => {
                modSettings.foodColor = foodColor.value;
                updateStorage();
            });
            cellColor.addEventListener("input", () => {
                modSettings.cellColor = cellColor.value;
                updateStorage();
            });
 
            mapColorReset.addEventListener("click", () => reset("map"));
            borderColorReset.addEventListener("click", () => reset("border"));
            nameColorReset.addEventListener("click", () => reset("name"));
            gradientColorReset1.addEventListener("click", () => reset("gradName1"));
            gradientColorReset2.addEventListener("click", () => reset("gradName2"));
            foodColorReset.addEventListener("click", () => reset("food"));
            cellColorReset.addEventListener("click", () => reset("cell"));
 
            // Render new colors / images
            CanvasRenderingContext2D.prototype.fillRect = function (x, y, width, height) {
                if ((width + height) / 2 === (window.innerWidth + window.innerHeight) / 2) {
                    this.fillStyle = modSettings.mapColor;
                }
                fillRect.apply(this, arguments);
            };
 
 
            CanvasRenderingContext2D.prototype.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
                if (modSettings.fps.hideFood || modSettings.fps.fpsMode) {
                    if (radius <= 20) {
                        this.fillStyle = "transparent";
                        this.strokeStyle = "transparent";
                    }
                }
                if (radius >= 86 && modSettings.cellColor) {
                    this.fillStyle = hexToRgba(modSettings.cellColor, "0.4");
                } else if (radius <= 20 && modSettings.foodColor !== null && !modSettings.fps.fpsMode && !modSettings.fps.hideFood) {
                    this.fillStyle = modSettings.foodColor;
                    this.strokeStyle = modSettings.foodColor;
                }
 
                arc.apply(this, arguments);
            };
 
            CanvasRenderingContext2D.prototype.fillText = function (text, x, y) {
                if (text === mods.nick && !modSettings.gradientName.enabled && modSettings.nameColor !== null) {
                    this.fillStyle = modSettings.nameColor;
                }
 
                if (text === mods.nick && modSettings.gradientName.enabled) {
                    const width = this.measureText(text).width;
                    const fontSize = 8;
                    const gradient = this.createLinearGradient(x - width / 2 + fontSize / 2, y, x + width / 2 - fontSize / 2, y + fontSize);
 
                    const color1 = modSettings.gradientName.color1 ?? "#ffffff";
                    const color2 = modSettings.gradientName.color2 ?? "#ffffff";
 
                    gradient.addColorStop(0, color1);
                    gradient.addColorStop(1, color2);
 
                    this.fillStyle = gradient;
                }
 
                if (text.startsWith("Score")) {
                    if (Date.now() - lastGetScore >= 1000) {
                        const score = parseInt(text.split(": ")[1]);
                        mods.cellSize = score;
 
                        lastGetScore = Date.now();
                    }
 
                    // tournament
                    if (_getScore) {
                        _getScore = false;
                        const currentScore = text.substring(6).replace(/\s/g, '');
                        lastScore = parseInt(currentScore, 10);
                        const scoreText = document.getElementById("t-myScore");
                        if (!scoreText) return;
                        scoreText.textContent = `Your score: ${lastScore}`;
                    }
                }
 
                if (text.startsWith("X:")) {
                    this.fillStyle = "transparent";
 
                    const [, xValue, yValue] = /X: (.*), Y: (.*)/.exec(text) || [];
                    if (xValue == undefined) return;
 
                    const position = { x: parseFloat(xValue), y: parseFloat(yValue) };
 
                    if (menuClosed() && !isDead()) {
                        if (position.x === 0 && position.y === 0) return;
 
                        // send position every 300 milliseconds
                        if (Date.now() - lastLogTime >= 300) {
                            activeCellX = position.x;
                            activeCellY = position.y;
                            if (client.readyState === 1) {
                                client.send({
                                    type: "position",
                                    content: [activeCellX, activeCellY, mods.nick, client.id]
                                });
                            }
                            lastLogTime = Date.now(); // Update last log time
                        }
                    } else if (isDead() && !dead2) {
                        dead2 = true;
                        activeCellX = null;
                        activeCellY = null;
                        client.send({
                            type: "position",
                            content: [null, null, null, client.id]
                        });
                    }
                }
 
                if (modSettings.fps.removeOutlines) {
                    this.shadowBlur = 0;
                    this.shadowColor = "transparent";
                }
 
                if (text.length > 21 && modSettings.fps.shortLongNames || modSettings.fps.fpsMode) {
                    text = text.slice(0, 21) + "...";
                }
 
                // only for leaderboard
                const name = text.match(/\d+\.\s*(.+)/)?.[1];
 
                if (name && mods.friend_names.has(name) && mods.friends_settings.highlight_friends) {
                    this.fillStyle = mods.friends_settings.highlight_color;
                }
 
                return fillText.apply(this, arguments);
            };
 
            CanvasRenderingContext2D.prototype.strokeText = function (text, x, y) {
                if (text.length > 21 && modSettings.fps.shortLongNames || modSettings.fps.fpsMode) {
                    text = text.slice(0, 21) + "...";
                }
 
                if (modSettings.fps.removeOutlines) {
                    this.shadowBlur = 0;
                    this.shadowColor = "transparent";
                } else {
                    this.shadowBlur = 7;
                    this.shadowColor = '#000';
                }
 
                return strokeText.apply(this, arguments);
            };
 
            // Map border lineWidth: 20
            CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
                this.strokeStyle = modSettings.borderColor;
                return moveTo.apply(this, arguments);
            };
 
            function loadVirusImage(img) {
                const replacementVirus = new Image();
                replacementVirus.src = img;
                const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
 
                CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
                    if (image.src && image.src.endsWith("2-min.png")) {
                        originalDrawImage.call(this, replacementVirus, ...args);
                    } else {
                        originalDrawImage.apply(this, arguments);
                    }
                };
            }
 
            function loadSkinImage(skin, img) {
                const replacementSkin = new Image();
                replacementSkin.src = img;
                const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
 
                CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
                    if (image instanceof HTMLImageElement && image.src.includes(`${skin}.png`)) {
                        originalDrawImage.call(this, replacementSkin, ...args);
                    } else {
                        originalDrawImage.apply(this, arguments);
                    }
                };
            }
 
            // Virus & Skin image
            const virusPreview = byId("virus");
            const setVirus = byId("setVirus");
            const virusURL = byId("virusURL");
            const openVirusModal = byId("virusImageSelect");
            const closeVirusModal = byId("closeVirusModal");
            const virusModal = byId("virusModal");
            const resetSkin = byId("resetSkin");
            const resetVirus = byId("resetVirus");
 
            openVirusModal.addEventListener("click", () => {
                virusModal.style.display = "flex";
            });
            closeVirusModal.addEventListener("click", () => {
                virusModal.style.display = "none";
            });
 
            setVirus.addEventListener("click", () => {
                modSettings.virusImage = virusURL.value;
                loadVirusImage(modSettings.virusImage);
                updateStorage();
                virusPreview.src = modSettings.virusImage;
            });
 
            resetVirus.addEventListener("click", () => {
                modSettings.virusImage = "/assets/images/viruses/2.png";
                updateStorage();
                if(confirm("Please Refresh the page to make it work. Reload?")) {
                    location.reload();
                }
            });
 
            const skinPreview = byId("skinPreview");
            const skinURL = byId("skinURL");
            const setSkin = byId("setSkin");
            const openSkinModal = byId("SkinReplaceSelect");
            const closeSkinModal = byId("closeSkinModal");
            const skinModal = byId("skinModal");
            const originalSkin = byId("originalSkinSelect");
 
            openSkinModal.addEventListener("click", () => {
                skinModal.style.display = "flex";
            });
            closeSkinModal.addEventListener("click", () => {
                skinModal.style.display = "none";
            });
 
            setSkin.addEventListener("click", () => {
                modSettings.skinImage.original = originalSkin.value;
                modSettings.skinImage.replaceImg = skinURL.value;
                loadSkinImage(modSettings.skinImage.original, modSettings.skinImage.replaceImg)
                updateStorage();
                skinPreview.src = modSettings.skinImage.replaceImg;
            });
 
            resetSkin.addEventListener("click", () => {
                modSettings.skinImage.original = null;
                modSettings.skinImage.replaceImg = null;
                updateStorage();
                if(confirm("Please Refresh the page to make it work. Reload?")) {
                    location.reload();
                }
            });
 
            const deathScreenPos = byId("deathScreenPos");
            const deathScreen = byId("__line2");
 
            const applyMargin = (position) => {
                switch (position) {
                    case "left":
                        deathScreen.style.marginLeft = "0";
                        break;
                    case "right":
                        deathScreen.style.marginRight = "0";
                        break;
                    case "top":
                        deathScreen.style.marginTop = "20px";
                        break;
                    case "bottom":
                        deathScreen.style.marginBottom = "20px";
                        break;
                    default:
                        deathScreen.style.margin = "auto";
                }
            };
 
            deathScreenPos.addEventListener("change", () => {
                const selected = deathScreenPos.value;
                applyMargin(selected);
                modSettings.deathScreenPos = selected;
                updateStorage();
            });
 
            const defaultPosition = modSettings.deathScreenPos || "center";
 
            applyMargin(defaultPosition);
            deathScreenPos.value = defaultPosition;
 
            const excludedSkins = ["Traitor", "Poco", "Cuddle", "Omega", "Leon", "Impostor", "Cute", "Raptor", "Maya", "Valentine", "Cara", "Fazbear", "Freddy", "Captain"];
 
            const allSkins = await fetch('https://sigmally.com/api/skins/all')
            .then(response => response.json())
            .then(data => {
                return data.data
                    .filter(item => !excludedSkins.includes(item.name.replace(".png", "")))
                    .map(item => item.name.replace(".png", ""));
            });
 
            originalSkin.innerHTML = `
                ${allSkins.map(skin => `<option value="${skin}">${skin}</option>`).join('')}
            `;
        },
 
        handleGoogleAuth(user) {
            fetchedUser++;
            if (fetchedUser <= 1) return;
 
            window.gameSettings.user = user;
 
            if (client.ws) {
                client.send({
                    type: 'user',
                    content: user,
                });
            }
 
            fetch(mods.appRoutes.user, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    user: user,
                    nick: mods.nick,
                }),
            });
        },
 
        menu() {
            const mod_menu = document.createElement("div");
            mod_menu.classList.add("mod_menu");
            mod_menu.style.display = "none";
            mod_menu.style.opacity = "0";
            mod_menu.innerHTML = `
                <div class="mod_menu_wrapper">
                    <div class="mod_menu_header">
                        <img src="${headerAnim}" draggable="false" class="header_img" />
                        <button type="button" class="modButton" id="closeBtn">
                            <svg width="18" height="20" viewBox="0 0 16 16" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.6001 14.4L14.4001 1.59998M14.4001 14.4L1.6001 1.59998" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="mod_menu_inner">
                        <div class="mod_menu_navbar">
                            <button class="mod_nav_btn mod_selected" id="tab_home_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/icons/home%20(1).png" />
                                Home
                            </button>
                            <button class="mod_nav_btn" id="tab_macros_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/icons/keyboard%20(1).png" />
                                Macros
                            </button>
                            <button class="mod_nav_btn" id="tab_game_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/icons/games.png" />
                                Game
                            </button>
                            <button class="mod_nav_btn" id="tab_name_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/836ca0f4c25fc6de2e429ee3583be5f860884a0c/images/icons/name.svg" />
                                Name
                            </button>
                            <button class="mod_nav_btn" id="tab_themes_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/icons/theme.png" />
                                Themes
                            </button>
                            <button class="mod_nav_btn" id="tab_fps_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/icons/frames-per-second.png" />
                                FPS
                            </button>
                            <button class="mod_nav_btn" id="tab_friends_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/icons/friends%20(1).png" />
                                Friends
                            </button>
                            <button class="mod_nav_btn" id="tab_info_btn">
                                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/icons/info.png" />
                                Info
                            </button>
                        </div>
                        <div class="mod_menu_content">
                            <div class="mod_tab" id="mod_home">
                                <span class="text-center f-big" id="welcomeUser">Welcome ${this.Username}, to the SigMod Client!</span>
                                <div class="justify-sb">
                                    <div class="mod_player-stats">
                                        <span class="justify-sb">Your stats:</span>
                                        <div class="player-stats-grid">
                                            <div class="player-stat">
                                                <span>Time played</span>
                                                <span id="stat-time-played">0h 0m</span>
                                            </div>
                                            <div class="player-stat">
                                                <span>Highest Mass</span>
                                                <span id="stat-highest-mass">0</span>
                                            </div>
                                            <div class="player-stat">
                                                <span>Total deaths</span>
                                                <span id="stat-total-deaths">0</span>
                                            </div>
                                            <div class="player-stat">
                                                <span>Total Mass</span>
                                                <span id="stat-total-mass">0</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="randomVid"></div>
                                </div>
                                <div class="justify-sb" style="gap: 18px;">
                                    <div class="f-column w-100" style="gap: 5px;">
                                        <span>Quick access</span>
                                        <div class="quickAccess scroll" id="mod_qaccess"></div>
                                    </div>
                                    <div class="modProfileWrapper">
                                        <span>Mod profile</span>
                                        <div class="modUserProfile">
                                            <div class="justify-sb">
                                                <div class="flex" style="align-items: center; gap: 5px;">
                                                    <img src="https://sigmally.com/assets/images/agario-profile.png" width="50" height="50" id="my-profile-img" style="border-radius: 50%;" draggable="false" />
                                                    <span id="my-profile-name">Guest</span>
                                                </div>
                                                <span id="my-profile-role">Guest</span>
                                            </div>
                                            <hr />
                                            <span id="my-profile-bio" class="scroll">No Bio.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mod_tab scroll" id="mod_macros" style="display: none">
                                    <div class="modColItems">
                                    <div class="macros_wrapper">
                                        <span class="text-center">Keybindings</span>
                                        <hr style="border-color: #3F3F3F">
                                        <div style="justify-content: center;">
                                            <div class="f-column g-10" style="align-items: center; justify-content: center;">
                                                <div class="macrosContainer">
                                                    <div class="f-column g-10">
                                                        <label class="macroRow">
                                                          <span class="text">Rapid Feed</span>
                                                          <input type="text" name="rapidFeed" id="modinput1" class="keybinding" value="${modSettings.keyBindings.rapidFeed}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                        <label class="macroRow">
                                                          <span class="text">Double Split</span>
                                                          <input type="text" name="doubleSplit" id="modinput2" class="keybinding" value="${modSettings.keyBindings.doubleSplit}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                        <label class="macroRow">
                                                          <span class="text">Triple Split</span>
                                                          <input type="text" name="tripleSplit" id="modinput3" class="keybinding" value="${modSettings.keyBindings.tripleSplit}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                        <label class="macroRow">
                                                          <span class="text">Respawn</span>
                                                          <input type="text" name="respawn" id="modinput16" class="keybinding" value="${modSettings.keyBindings.respawn || ""}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                    </div>
                                                    <div class="f-column g-10">
                                                        <label class="macroRow">
                                                          <span class="text">Quad Split</span>
                                                          <input type="text" name="quadSplit" id="modinput4" class="keybinding" value="${modSettings.keyBindings.quadSplit}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                        <label class="macroRow">
                                                          <span class="text">Freeze Player</span>
                                                          <input type="text" name="freezePlayer" id="modinput5" class="keybinding" value="${modSettings.keyBindings.freezePlayer}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                        <label class="macroRow">
                                                          <span class="text">Vertical Line</span>
                                                          <input type="text" name="verticalSplit" id="modinput8" class="keybinding" value="${modSettings.keyBindings.verticalSplit}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                        <label class="macroRow">
                                                          <span class="text">Toggle Menu</span>
                                                          <input type="text" name="toggleMenu" id="modinput6" class="keybinding" value="${modSettings.keyBindings.toggleMenu}" maxlength="1" onfocus="this.select()" placeholder="..." />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="macros_wrapper">
                                        <span class="text-center">Advanced Keybinding options</span>
                                        <div class="setting-card-wrapper">
                                            <div class="setting-card">
                                                <div class="setting-card-action">
                                                    <span class="setting-card-name">Mouse macros</span>
                                                </div>
                                            </div>
                                            <div class="setting-parameters" style="display: none;">
                                                <div class="my-5">
                                                    <span class="stats-info-text">Feed or Split with mouse buttons</span>
                                                </div>
                                                <div class="stats-line justify-sb">
                                                    <span>Mouse Button 1 (left)</span>
                                                    <select class="form-control macro-extanded_input" style="padding: 2px; text-align: left; width: 100px" id="m1_macroSelect">
                                                        <option value="none">None</option>
                                                        <option value="fastfeed">Fast Feed</option>
                                                        <option value="split">Split (1)</option>
                                                        <option value="split2">Double Split</option>
                                                        <option value="split3">Triple Split</option>
                                                        <option value="split4">Quad Split</option>
                                                        <option value="freeze">Freeze Player</option>
                                                        <option value="dTrick">Double Trick</option>
                                                        <option value="sTrick">Self Trick</option>
                                                    </select>
                                                </div>
 
                                                <div class="stats-line justify-sb">
                                                    <span>Mouse Button 2 (right)</span>
                                                    <select class="form-control" style="padding: 2px; text-align: left; width: 100px" id="m2_macroSelect">
                                                        <option value="none">None</option>
                                                        <option value="fastfeed">Fast Feed</option>
                                                        <option value="split">Split (1)</option>
                                                        <option value="split2">Double Split</option>
                                                        <option value="split3">Triple Split</option>
                                                        <option value="split4">Quad Split</option>
                                                        <option value="freeze">Freeze Player</option>
                                                        <option value="dTrick">Double Trick</option>
                                                        <option value="sTrick">Self Trick</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="setting-card-wrapper">
                                            <div class="setting-card">
                                                <div class="setting-card-action">
                                                    <span class="setting-card-name">Freeze Player</span>
                                                </div>
                                            </div>
 
                                            <div class="setting-parameters" style="display: none;">
                                                <div class="my-5">
                                                    <span class="stats-info-text">Freeze your player on the Map and linesplit</span>
                                                </div>
 
                                                <div class="stats-line justify-sb">
                                                    <span>Type of Freeze</span>
                                                    <select class="form-control" style="padding: 2px; text-align: left; width: 100px" id="freezeType">
                                                        <option value="press">Press</option>
                                                        <option value="hold">Hold</option>
                                                    </select>
                                                </div>
 
                                                <div class="stats-line justify-sb">
                                                    <span>Bind</span>
                                                    <input value="${modSettings.keyBindings.freezePlayer}" readonly id="modinput7" name="freezePlayer" class="form-control macro-extanded_input" onfocus="this.select();">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="setting-card-wrapper">
                                            <div class="setting-card">
                                                <div class="setting-card-action">
                                                    <span class="setting-card-name">Toggle Settings</span>
                                                </div>
                                            </div>
 
                                            <div class="setting-parameters" style="display: none;">
                                                <div class="my-5">
                                                    <span class="stats-info-text">Toggle settings with a keybind.</span>
                                                </div>
 
                                                <div class="stats-line justify-sb">
                                                    <span>Toggle Names</span>
                                                    <input value="${modSettings.keyBindings.toggleNames || ""}" placeholder="..." readonly id="modinput11" name="toggleNames" class="keybinding" onfocus="this.select();">
                                                </div>
 
                                                <div class="stats-line justify-sb">
                                                    <span>Toggle Skins</span>
                                                    <input value="${modSettings.keyBindings.toggleSkins || ""}" placeholder="..." readonly id="modinput12" name="toggleSkins" class="keybinding" onfocus="this.select();">
                                                </div>
 
                                                <div class="stats-line justify-sb">
                                                <span>Toggle Autorespawn</span>
                                                    <input value="${modSettings.keyBindings.toggleAutoRespawn || ""}" placeholder="..." readonly id="modinput13" name="toggleAutoRespawn" class="keybinding" onfocus="this.select();">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="setting-card-wrapper">
                                            <div class="setting-card">
                                                <div class="setting-card-action">
                                                    <span class="setting-card-name">Tricksplits</span>
                                                </div>
                                            </div>
                                            <div class="setting-parameters" style="display: none;">
                                                <div class="my-5">
                                                    <span class="stats-info-text">Other split options</span>
                                                </div>
                                                <div class="stats-line justify-sb">
                                                    <span>Double Trick</span>
                                                    <input value="${modSettings.keyBindings.doubleTrick || ""}" placeholder="..." readonly id="modinput14" name="doubleTrick" class="keybinding" onfocus="this.select();">
                                                </div>
                                                <div class="stats-line justify-sb">
                                                    <span>Self Trick</span>
                                                    <input value="${modSettings.keyBindings.selfTrick || ""}" placeholder="..." readonly id="modinput15" name="selfTrick" class="keybinding" onfocus="this.select();">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mod_tab scroll" id="mod_game" style="display: none">
                                <div class="modColItems">
                                    <div class="modRowItems">
                                        <div class="modItem">
                                            <span class="text">Map Color</span>
                                            <div class="centerXY">
                                                <input type="color" value="#ffffff" id="mapColor" class="colorInput" />
                                                <button class="resetButton" id="mapColorReset"></button>
                                            </div>
                                        </div>
                                        <div class="modItem">
                                            <span class="text">Border Colors</span>
                                            <div class="centerXY">
                                                <input type="color" value="#ffffff" id="borderColor" class="colorInput" />
                                                <button class="resetButton" id="borderColorReset"></button>
                                             </div>
                                        </div>
                                        <div class="modItem">
                                            <span class="text">Food color</span>
                                            <div class="centerXY">
                                                <input type="color" value="#ffffff" id="foodColor" class="colorInput" />
                                                <button class="resetButton" id="foodColorReset"></button>
                                             </div>
                                        </div>
                                        <div class="modItem">
                                            <span class="text">Cell color</span>
                                            <div class="centerXY">
                                                <input type="color" value="#ffffff" id="cellColor" class="colorInput" />
                                                <button class="resetButton" id="cellColorReset"></button>
                                             </div>
                                        </div>
                                    </div>
                                    <div class="modRowItems">
                                        <div class="modItem">
                                            <span class="text">Virus Image</span>
                                            <div class="centerXY" style="margin-top: 5px">
                                                <button class="btn select-btn" id="virusImageSelect"></button>
                                             </div>
                                        </div>
                                        <div class="modItem">
                                            <span class="text">Replace Skins</span>
                                            <div class="centerXY" style="margin-top: 5px">
                                                <button class="btn select-btn" id="SkinReplaceSelect"></button>
                                             </div>
                                        </div>
                                    </div>
                                    <div class="modRowItems justify-sb">
                                        <span class="text">Death screen Position</span>
                                        <select id="deathScreenPos" class="form-control" style="width: 30%">
                                            <option value="center" selected>Center</option>
                                            <option value="left">Left</option>
                                            <option value="right">Right</option>
                                            <option value="top">Top</option>
                                            <option value="bottom">Bottom</option>
                                        </select>
                                    </div>
                                    <div class="modRowItems justify-sb">
                                        <span class="text">Play timer</span>
                                        <div class="modCheckbox">
                                          <input id="playTimerToggle" type="checkbox" />
                                          <label class="cbx" for="playTimerToggle"></label>
                                        </div>
                                    </div>
                                    <div class="modRowItems justify-sb">
                                        <span class="text">Reset settings: </span>
                                        <button class="modButton-secondary" id="resetModSettings" type="button">Reset mod settings</button>
                                        <button class="modButton-secondary" id="resetGameSettings" type="button">Reset game settings</button>
                                    </div>
                                </div>
                            </div>
 
                            <div class="mod-small-modal" id="virusModal" style="display: none;">
                                <div class="mod-small-modal-header">
                                    <h1>Virus Image</h1>
                                    <button class="ctrl-modal__close" id="closeVirusModal">
                                        <svg width="22" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1.6001 14.4L14.4001 1.59998M14.4001 14.4L1.6001 1.59998" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </button>
                                </div>
                                <hr>
                                <div class="mod-small-modal-content">
                                    <div class="mod-small-modal-content_selectImage">
                                        <div class="flex" style="gap: 5px;">
                                            <input type="text" class="modInput" placeholder="Virus Image URL" id="virusURL" value="${virusImgVal()}" />
                                            <button class="modButton" id="setVirus">Apply</button>
                                        </div>
                                    </div>
                                    <button class="modButton" id="resetVirus" style="align-self: start; margin-top: 5px;">Reset</button>
                                    <img src="${modSettings.virusImage}" class="previmg" id="virus" draggable="false" >
                                </div>
                            </div>
                            <div class="mod-small-modal" id="skinModal" style="display: none;">
                                <div class="mod-small-modal-header">
                                    <h1>Skin Replacement</h1>
                                    <button class="ctrl-modal__close" id="closeSkinModal">
                                        <svg width="22" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1.6001 14.4L14.4001 1.59998M14.4001 14.4L1.6001 1.59998" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </button>
                                </div>
                                <hr>
                                <div class="mod-small-modal-content">
                                    <div class="mod-small-modal-content_selectImage">
                                        <div class="centerXY" style="gap: 5px;">
                                            <span>Original Skin: </span>
                                            <select class="form-control" style="padding: 2px; text-align: left; width: fit-content" id="originalSkinSelect"></select>
                                        </div>
                                        <span style="text-align: center">Will be replaced with...</span>
                                        <div class="flex" style="gap: 5px;">
                                            <input type="text" class="modInput" placeholder="Skin Image URL" id="skinURL" value="${skinImgVal()}"/>
                                            <button class="modButton" id="setSkin">Apply</button>
                                        </div>
                                    </div>
                                    <button class="modButton" id="resetSkin" style="align-self: start; margin-top: 5px;">Reset</button>
                                    <img src="" class="previmg" id="skinPreview" draggable="false" >
                                </div>
                            </div>
                            <div class="mod_tab scroll" id="mod_name" style="display: none">
                            <div class="modColItems">
                                <div class="modRowItems justify-sb" style="align-items: start;">
                                    <div class="f-column g-5" style="align-items: start; justify-content: start;">
                                        <span class="modTitleText">Name fonts & special characters</span>
                                        <span class="modDescText">Customize your name with special characters or fonts</span>
                                    </div>
                                    <div class="f-column g-5">
                                        <button class="modButton-secondary" onclick="window.open('https://nickfinder.com', '_blank')">Nickfinder</button>
                                        <button class="modButton-secondary" onclick="window.open('https://www.stylishnamemaker.com', '_blank')">Stylish Name</button>
                                        <button class="modButton-secondary" onclick="window.open('https://www.tell.wtf', '_blank')">Tell.wtf</button>
                                    </div>
                                </div>
                                <div class="modRowItems justify-sb">
                                    <div class="f-column g-5">
                                        <span class="modTitleText">Save names</span>
                                        <span class="modDescText">Save your names local</span>
                                        <div class="flex g-5">
                                            <input class="modInput" placeholder="Enter a name..." id="saveNameValue" />
                                            <button id="saveName" class="modButton-secondary f-big" style="border-radius: 5px; background: url('https://sigmally.com/assets/images/icon/plus.svg'); background-color: #111; background-size: 50% auto; background-repeat: no-repeat; background-position: center;"></button>
                                        </div>
                                        <div id="savedNames" class="f-column scroll"></div>
                                    </div>
                                    <div class="vr"></div>
                                    <div class="f-column g-5">
                                        <span class="modTitleText">Name Color</span>
                                        <span class="modDescText">Customize your name color</span>
                                        <div class="justify-sb">
                                            <input type="color" value="#ffffff" id="nameColor" class="colorInput">
                                            <button class="resetButton" id="nameColorReset"></button>
                                        </div>
                                        <span class="modTitleText">Gradient Name</span>
                                        <span class="modDescText">Customize your name with a gradient color</span>
                                        <div class="justify-sb">
                                            <div class="flex g-2" style="align-items: center">
                                                <input type="color" value="#ffffff" id="gradientNameColor1" class="colorInput">
                                                <span>➜ First color</span>
                                            </div>
                                            <button class="resetButton" id="gradientColorReset1"></button>
                                        </div>
                                        <div class="justify-sb">
                                            <div class="flex g-2" style="align-items: center">
                                                <input type="color" value="#ffffff" id="gradientNameColor2" class="colorInput">
                                                <span>➜ Second color</span>
                                            </div>
                                            <button class="resetButton" id="gradientColorReset2"></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                            <div class="mod_tab scroll" id="mod_themes" style="display: none">
                                <div class="themes scroll" id="themes">
                                    <div class="theme" id="createTheme">
                                        <div class="themeContent" style="background: url('https://sigmally.com/assets/images/icon/plus.svg'); background-size: 50% auto; background-repeat: no-repeat; background-position: center;"></div>
                                        <div class="themeName text" style="color: #fff">Create</div>
                                    </div>
                                </div>
                            </div>
                            <div class="mod_tab scroll" id="mod_fps" style="display: none">
                                <div class="modRowItems justify-sb">
                                    <span>FPS Mode [Beta]</span>
                                    <div class="modCheckbox">
                                      <input id="fpsMode" type="checkbox" />
                                      <label class="cbx" for="fpsMode"></label>
                                    </div>
                                </div>
                                <span class="text-center">Custom FPS Settings</span>
                                <div class="modRowItems justify-sb">
                                    <span>Hide Food</span>
                                    <div class="modCheckbox">
                                      <input id="fps-hideFood" class="fpsCheckbox" type="checkbox" />
                                      <label class="cbx" for="fps-hideFood"></label>
                                    </div>
                                </div>
                                <div class="modRowItems justify-sb">
                                    <span>Show Names</span>
                                    <div class="modCheckbox">
                                      <input id="fps-remNames" class="fpsCheckbox" type="checkbox" checked />
                                      <label class="cbx" for="fps-remNames"></label>
                                    </div>
                                </div>
                                <div class="modRowItems justify-sb">
                                    <span>Shorten long names</span>
                                    <div class="modCheckbox">
                                      <input id="fps-shortenLongNames" class="fpsCheckbox" type="checkbox" />
                                      <label class="cbx" for="fps-shortenLongNames"></label>
                                    </div>
                                </div>
                                <div class="modRowItems justify-sb">
                                    <span>Remove text shadows</span>
                                    <div class="modCheckbox">
                                      <input id="fps-remOutlines" class="fpsCheckbox" type="checkbox" />
                                      <label class="cbx" for="fps-remOutlines"></label>
                                    </div>
                                </div>
                                <span class="text-center">Or use SigFixes:</span>
                                <button class="modButton" style="width: 200px;display: flex;align-self: center;justify-content: center;" onclick="window.open('https://greasyfork.org/scripts/483587')">Install</button>
                            </div>
                            <div class="mod_tab scroll centerXY" id="mod_friends" style="display: none">
                                <center class="f-big" style="margin-top: 10px;">Connect and discover new friends with SigMod.</center>
                                <center style="margin-top: 10px; font-size: 12px;">Do you have problems with your account? Create a support ticket in our <a href="https://discord.gg/RjxeZ2eRGg" target="_blank">Discord server</a>.</center>
 
                                <div class="centerXY f-column g-5" style="height: 300px; width: 165px;">
                                    <button class="modButton-black" id="createAccount">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16"><path fill="#ffffff" d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>
                                        Create account
                                    </button>
                                    <button class="modButton-black" id="login">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16"><path fill="#ffffff" d="M217.9 105.9L340.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L217.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1L32 320c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM352 416l64 0c17.7 0 32-14.3 32-32l0-256c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c53 0 96 43 96 96l0 256c0 53-43 96-96 96l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>
                                        Login
                                    </button>
                                </div>
                            </div>
                            <div class="mod_tab scroll f-column g-5 text-center" id="mod_info" style="display: none">
                                <div class="brand_wrapper">
                                    <img src="https://raw.githubusercontent.com/Sigmally/SigMod/6f1ed65927f50ebc4ef71dbbefaa68fcb220d83f/images/stackedwaves.svg" class="brand_img" />
                                    <span style="font-size: 24px; z-index: 2;">SigMod V${version} by Cursed</span>
                                </div>
                                <span style="font-size: 20px; margin-top: 5px;">Big thanks to</span>
                                <span class="brand_credits"><strong>Jb</strong>, Ultra, Black, 8y8x, Dreamz, Xaris, Benzofury</span>
                                <button class="modButton p_s_n" onclick="window.open('https://app.czrsd.com/terms-of-service/')">Terms of Service</button>
                                <div class="userId_wrapper">
                                    <span id="userId" title="Your user ID">User ID (login to see)</span>
                                    <span class="userId_copy" id="copyUserId">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                            <path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z" fill="white" />
                                        </svg>
                                    </span>
                                </div>
                                <div class="brand_yt">
                                    <div class="yt_wrapper" onclick="window.open('https://www.youtube.com/@sigmallyCursed')">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30" height="30">
                                            <path d="M12 39c-.549 0-1.095-.15-1.578-.447A3.008 3.008 0 0 1 9 36V12c0-1.041.54-2.007 1.422-2.553a3.014 3.014 0 0 1 2.919-.132l24 12a3.003 3.003 0 0 1 0 5.37l-24 12c-.42.21-.885.315-1.341.315z" fill="#ffffff"></path>
                                        </svg>
                                        <span style="font-size: 12px;">Cursed - Sigmally</span>
                                    </div>
                                    <div class="yt_wrapper" onclick="window.open('https://www.youtube.com/@sigmally')">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="30" height="30">
                                            <path d="M12 39c-.549 0-1.095-.15-1.578-.447A3.008 3.008 0 0 1 9 36V12c0-1.041.54-2.007 1.422-2.553a3.014 3.014 0 0 1 2.919-.132l24 12a3.003 3.003 0 0 1 0 5.37l-24 12c-.42.21-.885.315-1.341.315z" fill="#ffffff"></path>
                                        </svg>
                                        <span style="font-size: 15px;">Sigmally</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.append(mod_menu);
            this.getSettings();
 
            mod_menu.addEventListener("click", (e) => {
                const wrapper = document.querySelector(".mod_menu_wrapper");
                if (wrapper && wrapper.contains(e.target)) return;
 
                mod_menu.style.opacity = 0;
                setTimeout(() => {
                    mod_menu.style.display = "none";
                }, 300);
            });
 
 
            function openModTab(tabId) {
                const allTabs = document.getElementsByClassName("mod_tab");
                const allTabButtons = document.querySelectorAll(".mod_nav_btn");
 
                for (const tab of allTabs) {
                    tab.style.opacity = 0;
                    setTimeout(() => {
                        tab.style.display = "none";
                    }, 200);
                }
 
                allTabButtons.forEach(tabBtn => tabBtn.classList.remove("mod_selected"));
 
                const selectedTab = document.getElementById(tabId);
                setTimeout(() => {
                    selectedTab.style.display = "flex";
                    setTimeout(() => {
                        selectedTab.style.opacity = 1;
                    }, 10);
                }, 200);
                this.classList.add("mod_selected");
            }
 
 
            document.querySelectorAll(".mod_nav_btn").forEach(tabBtn => {
                tabBtn.addEventListener("click", function() {
                    openModTab.call(this, this.id.replace("tab_", "mod_").replace("_btn", ""));
                });
            });
 
            const videoList = [
                "c-_KP3Ti2vQ?si=PHj2aNye5Uj_yXY9",
                "IdBXpxmxYpU?si=4-fZWJUpewLG7c8H",
                "xCUtce1D9f0?si=ybsNDCUL1M1WnuLc",
                "B9LOJQOVH_Q?si=5qJPAxMT_EvFNW8Y",
                "emLjRdTWm5A?si=4suR21ZEb-zmy1RD",
                "190DhVhom5c?si=3TfghIX-u_wsBpR2",
                "t_6L9G13vK8?si=wbiiT78h6RQUgPOd",
                "B--KgGV7XMM?si=GkYtJ5ueks676_J9",
                "Sq2UqzBO_IQ?si=ETvsFSueAwvl8Frm",
                "OsO48zwyLfw?si=plItxN8vhFZbLAf8"
            ];
 
            function getrdmVid() {
                const randomIndex = Math.floor(Math.random() * videoList.length);
                return videoList[randomIndex];
            }
 
            const randomVid = document.getElementById("randomVid");
            randomVid.style = "align-self: start";
            randomVid.innerHTML = `
                <iframe width="300" height="200" style="border-radius: 10px; box-shadow: 0 0 10px -2px #000;" src="https://www.youtube.com/embed/${getrdmVid()}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            `;
 
            const openMenu = document.querySelectorAll("#clans_and_settings button")[1];
            openMenu.removeAttribute("onclick");
            openMenu.addEventListener("click", () => {
                mod_menu.style.display = "flex";
                setTimeout(() => {
                    mod_menu.style.opacity = 1;
                }, 10);
            });
 
            const closeModal = document.getElementById("closeBtn");
            closeModal.addEventListener("click", () => {
                mod_menu.style.opacity = 0;
                setTimeout(() => {
                    mod_menu.style.display = "none";
                }, 300);
            });
 
            function virusImgVal() {
                if(modSettings.virusImage === "/assets/images/viruses/2.png" || modSettings.virusImage === "") return "";
                return modSettings.virusImage;
            }
            function skinImgVal() {
                if(modSettings.skinImage.replaceImg === "" || modSettings.skinImage.replaceImg === null) return "";
                return modSettings.skinImage.replaceImg;
            }
 
            const playTimerToggle = document.getElementById("playTimerToggle");
            playTimerToggle.addEventListener("change", () => {
                modSettings.playTimer = playTimerToggle.checked;
                updateStorage();
            });
            if (modSettings.playTimer) {
                playTimerToggle.checked = true;
            }
 
            const resetModSettings = document.getElementById("resetModSettings");
            resetModSettings.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset the mod settings? A reload is required.")) {
                    this.removeStorage(storageName);
                    location.reload();
                }
            });
 
            const resetGameSettings = document.getElementById("resetGameSettings");
            resetGameSettings.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset the game settings? Your nick and more settings will be lost. A reload is required.")) {
                    window.settings.gameSettings = null;
                    this.removeStorage("settings");
                    location.reload();
                }
            });
        },
 
        setProfile(user) {
            const img = document.getElementById("my-profile-img");
            const name = document.getElementById("my-profile-name");
            const role = document.getElementById("my-profile-role");
            const bioText = document.getElementById("my-profile-bio");
            const userId = document.getElementById("userId");
 
            userId.innerText = user._id;
            const copyUserId = document.getElementById("copyUserId");
            copyUserId.addEventListener("click", () => {
                navigator.clipboard.writeText(userId.innerText);
            });
 
            const bio = user.bio ? user.bio : "No bio.";
 
            img.src = user.imageURL;
            name.innerText = user.username;
            role.innerText = user.role;
            bioText.innerHTML = bio;
 
            role.classList.add(`${user.role}_role`);
        },
 
        getSettings() {
            const mod_qaccess = document.querySelector("#mod_qaccess");
            const settingsGrid = document.querySelector("#settings > .checkbox-grid");
            const settingsNames = settingsGrid.querySelectorAll("label:not([class])");
            const inputs = settingsGrid.querySelectorAll("input");
 
            inputs.forEach((checkbox, index) => {
                if (checkbox.id === "showChat" || checkbox.id === "showMinimap") return;
                const modrow = document.createElement("div");
                modrow.classList.add("justify-sb", "p-2");
 
                if (checkbox.id === "showPosition" || checkbox.id === "showNames") {
                    modrow.style.display = "none";
                }
 
                modrow.innerHTML = `
                    <span>${settingsNames[index].textContent}</span>
                    <div class="modCheckbox" id="${checkbox.id}_wrapper"></div>
                `;
                mod_qaccess.append(modrow);
 
                const cbWrapper = document.getElementById(`${checkbox.id}_wrapper`);
                cbWrapper.appendChild(checkbox);
 
                cbWrapper.appendChild(
                    Object.assign(document.createElement("label"), {
                        classList: ['cbx'],
                        htmlFor: checkbox.id
                    })
                );
            });
        },
 
        Themes() {
            const elements = [
                "#menu",
                "#title",
                ".top-users__inner",
                "#left-menu",
                ".menu-links",
                ".menu--stats-mode",
                "#left_ad_block",
                "#ad_bottom",
                ".ad-block",
                "#left_ad_block > .right-menu",
                "#text-block > .right-menu"
            ];
 
            const themeEditor = document.createElement("div");
            themeEditor.classList.add("themeEditor");
            themeEditor.style.display = "none";
 
            themeEditor.innerHTML = `
                <div class="theme_editor_header">
                    <h3>Theme Editor</h3>
                    <button class="btn CloseBtn" id="closeThemeEditor">
                        <svg width="22" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.6001 14.4L14.4001 1.59998M14.4001 14.4L1.6001 1.59998" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
                <hr />
                <main class="theme_editor_content">
                    <div class="centerXY" style="justify-content: flex-end;gap: 10px">
                        <span class="text">Select Theme Type: </span>
                        <select class="form-control" style="background: #222; color: #fff; width: 150px" id="theme-type-select">
                            <option>Static Color</option>
                            <option>Gradient</option>
                            <option>Image / Gif</option>
                        </select>
                    </div>
 
                    <div id="theme_editor_color" class="theme-editor-tab">
                        <div class="centerXY">
                            <label for="theme-editor-bgcolorinput" class="text">Background color:</label>
                            <input type="color" value="#000000" class="colorInput whiteBorder_colorInput" id="theme-editor-bgcolorinput"/>
                        </div>
                        <div class="centerXY">
                            <label for="theme-editor-colorinput" class="text">Text color:</label>
                            <input type="color" value="#000000" class="colorInput whiteBorder_colorInput" id="theme-editor-colorinput"/>
                        </div>
                        <div style="background-color: #000000" class="themes_preview" id="color_preview">
                            <span class="text" style="color: #fff; font-size: 9px;">preview</span>
                        </div>
                        <div class="centerY" style="gap: 10px; margin-top: 10px;">
                            <input type="text" class="form-control" style="background: #222; color: #fff;" maxlength="15" placeholder="Theme name..." id="colorThemeName"/>
                            <button class="btn btn-success" id="saveColorTheme">Save</button>
                        </div>
                    </div>
 
 
                    <div id="theme_editor_gradient" class="theme-editor-tab" style="display: none;">
                        <div class="centerXY">
                            <label for="theme-editor-gcolor1" class="text">Color 1:</label>
                            <input type="color" value="#000000" class="colorInput whiteBorder_colorInput" id="theme-editor-gcolor1"/>
                        </div>
                        <div class="centerXY">
                            <label for="theme-editor-g_color" class="text">Color 2:</label>
                            <input type="color" value="#ffffff" class="colorInput whiteBorder_colorInput" id="theme-editor-g_color"/>
                        </div>
                        <div class="centerXY">
                            <label for="theme-editor-gcolor2" class="text">Text Color:</label>
                            <input type="color" value="#ffffff" class="colorInput whiteBorder_colorInput" id="theme-editor-gcolor2"/>
                        </div>
 
                        <div class="centerXY" style="gap: 10px">
                            <label for="gradient-type" class="text">Gradient Type:</label>
                            <select id="gradient-type" class="form-control" style="background: #222; color: #fff; width: 120px;">
                                <option value="linear">Linear</option>
                                <option value="radial">Radial</option>
                            </select>
                        </div>
 
                        <div id="theme-editor-gradient_angle" class="centerY" style="gap: 10px; width: 100%">
                            <label for="g_angle" class="text" id="gradient_angle_text" style="width: 115px;">Angle (0deg):</label>
                            <input type="range" id="g_angle" value="0" min="0" max="360">
                        </div>
 
                        <div style="background: linear-gradient(0deg, #000, #fff)" class="themes_preview" id="gradient_preview">
                            <span class="text" style="color: #fff; font-size: 9px;">preview</span>
                        </div>
                        <div class="centerY" style="gap: 10px; margin-top: 10px;">
                            <input type="text" class="form-control" style="background: #222; color: #fff;" placeholder="Theme name..." id="GradientThemeName"/>
                            <button class="btn btn-success" id="saveGradientTheme">Save</button>
                        </div>
                    </div>
 
 
 
                    <div id="theme_editor_image" class="theme-editor-tab" style="display: none">
                        <div class="centerXY">
                            <input type="text" id="theme-editor-imagelink" placeholder="Image / GIF URL (https://i.ibb.co/k6hn4v0/Galaxy-Example.png)" class="form-control" style="background: #222; color: #fff"/>
                        </div>
                        <div class="centerXY" style="margin: 5px; gap: 5px;">
                            <label for="theme-editor-textcolorImage" class="text">Text Color: </label>
                            <input type="color" class="colorInput whiteBorder_colorInput" value="#ffffff" id="theme-editor-textcolorImage"/>
                        </div>
 
                        <div style="background: url('https://i.ibb.co/k6hn4v0/Galaxy-Example.png'); background-position: center; background-size: cover;" class="themes_preview" id="image_preview">
                            <span class="text" style="color: #fff; font-size: 9px;">preview</span>
                        </div>
                        <div class="centerY" style="gap: 10px; margin-top: 10px;">
                            <input type="text" class="form-control" style="background: #222; color: #fff;" placeholder="Theme name..." id="imageThemeName"/>
                            <button class="btn btn-success" id="saveImageTheme">Save</button>
                        </div>
                    </div>
                </main>
            `;
 
            document.body.append(themeEditor);
 
            setTimeout(() => {
                document.querySelectorAll(".stats-btn__share-btn")[1].querySelector("rect").remove();
 
                const themeTypeSelect = document.getElementById("theme-type-select");
                const colorTab = document.getElementById("theme_editor_color");
                const gradientTab = document.getElementById("theme_editor_gradient");
                const imageTab = document.getElementById("theme_editor_image");
                const gradientAngleDiv = document.getElementById("theme-editor-gradient_angle");
 
                themeTypeSelect.addEventListener("change", function() {
                    const selectedOption = themeTypeSelect.value;
                    switch (selectedOption) {
                        case "Static Color":
                            colorTab.style.display = "flex";
                            gradientTab.style.display = "none";
                            imageTab.style.display = "none";
                            break;
                        case "Gradient":
                            colorTab.style.display = "none";
                            gradientTab.style.display = "flex";
                            imageTab.style.display = "none";
                            break;
                        case "Image / Gif":
                            colorTab.style.display = "none";
                            gradientTab.style.display = "none";
                            imageTab.style.display = "flex";
                            break;
                        default:
                            colorTab.style.display = "flex";
                            gradientTab.style.display = "none";
                            imageTab.style.display = "none";
                    }
                });
 
                const colorInputs = document.querySelectorAll("#theme_editor_color .colorInput");
                colorInputs.forEach(input => {
                    input.addEventListener("input", function() {
                        const bgColorInput = document.getElementById("theme-editor-bgcolorinput").value;
                        const textColorInput = document.getElementById("theme-editor-colorinput").value;
 
                        applyColorTheme(bgColorInput, textColorInput);
                    });
                });
 
                const gradientInputs = document.querySelectorAll("#theme_editor_gradient .colorInput");
                gradientInputs.forEach(input => {
                    input.addEventListener("input", function() {
                        const gColor1 = document.getElementById("theme-editor-gcolor1").value;
                        const gColor2 = document.getElementById("theme-editor-g_color").value;
                        const gTextColor = document.getElementById("theme-editor-gcolor2").value;
                        const gAngle = document.getElementById("g_angle").value;
                        const gradientType = document.getElementById("gradient-type").value;
 
                        applyGradientTheme(gColor1, gColor2, gTextColor, gAngle, gradientType);
                    });
                });
 
                const imageInputs = document.querySelectorAll("#theme_editor_image .colorInput");
                imageInputs.forEach(input => {
                    input.addEventListener("input", function() {
                        const imageLinkInput = document.getElementById("theme-editor-imagelink").value;
                        const textColorImageInput = document.getElementById("theme-editor-textcolorImage").value;
 
                        let img;
                        if(imageLinkInput == "") {
                            img = "https://i.ibb.co/k6hn4v0/Galaxy-Example.png"
                        } else {
                            img = imageLinkInput;
                        }
                        applyImageTheme(img, textColorImageInput);
                    });
                });
                const image_preview = document.getElementById("image_preview");
                const image_link = document.getElementById("theme-editor-imagelink");
 
                let isWriting = false;
                let timeoutId;
 
                image_link.addEventListener("input", () => {
                    if (!isWriting) {
                        isWriting = true;
                    } else {
                        clearTimeout(timeoutId);
                    }
 
                    timeoutId = setTimeout(() => {
                        const imageLinkInput = image_link.value;
                        const textColorImageInput = document.getElementById("theme-editor-textcolorImage").value;
 
                        let img;
                        if (imageLinkInput === "") {
                            img = "https://i.ibb.co/k6hn4v0/Galaxy-Example.png";
                        } else {
                            img = imageLinkInput;
                        }
 
                        applyImageTheme(img, textColorImageInput);
                        isWriting = false;
                    }, 1000);
                });
 
 
                const gradientTypeSelect = document.getElementById("gradient-type");
                const angleInput = document.getElementById("g_angle");
 
                gradientTypeSelect.addEventListener("change", function() {
                    const selectedType = gradientTypeSelect.value;
                    gradientAngleDiv.style.display = selectedType === "linear" ? "flex" : "none";
 
                    const gColor1 = document.getElementById("theme-editor-gcolor1").value;
                    const gColor2 = document.getElementById("theme-editor-g_color").value;
                    const gTextColor = document.getElementById("theme-editor-gcolor2").value;
                    const gAngle = document.getElementById("g_angle").value;
 
                    applyGradientTheme(gColor1, gColor2, gTextColor, gAngle, selectedType);
                });
 
                angleInput.addEventListener("input", function() {
                    const gradient_angle_text = document.getElementById("gradient_angle_text");
                    gradient_angle_text.innerText = `Angle (${angleInput.value}deg): `;
                    const gColor1 = document.getElementById("theme-editor-gcolor1").value;
                    const gColor2 = document.getElementById("theme-editor-g_color").value;
                    const gTextColor = document.getElementById("theme-editor-gcolor2").value;
                    const gAngle = document.getElementById("g_angle").value;
                    const gradientType = document.getElementById("gradient-type").value;
 
                    applyGradientTheme(gColor1, gColor2, gTextColor, gAngle, gradientType);
                });
 
                function applyColorTheme(bgColor, textColor) {
                    const previewDivs = document.querySelectorAll("#theme_editor_color .themes_preview");
                    previewDivs.forEach(previewDiv => {
                        previewDiv.style.backgroundColor = bgColor;
                        const textSpan = previewDiv.querySelector("span.text");
                        textSpan.style.color = textColor;
                    });
                }
 
                function applyGradientTheme(gColor1, gColor2, gTextColor, gAngle, gradientType) {
                    const previewDivs = document.querySelectorAll("#theme_editor_gradient .themes_preview");
                    previewDivs.forEach(previewDiv => {
                        const gradient = gradientType === "linear"
                        ? `linear-gradient(${gAngle}deg, ${gColor1}, ${gColor2})`
                        : `radial-gradient(circle, ${gColor1}, ${gColor2})`;
                        previewDiv.style.background = gradient;
                        const textSpan = previewDiv.querySelector("span.text");
                        textSpan.style.color = gTextColor;
                    });
                }
 
                function applyImageTheme(imageLink, textColor) {
                    const previewDivs = document.querySelectorAll("#theme_editor_image .themes_preview");
                    previewDivs.forEach(previewDiv => {
                        previewDiv.style.backgroundImage = `url('${imageLink}')`;
                        const textSpan = previewDiv.querySelector("span.text");
                        textSpan.style.color = textColor;
                    });
                }
 
 
 
                const createTheme = document.getElementById("createTheme");
                createTheme.addEventListener("click", () => {
                    themeEditor.style.display = "block";
                });
 
                const closeThemeEditor = document.getElementById("closeThemeEditor");
                closeThemeEditor.addEventListener("click", () => {
                    themeEditor.style.display = "none";
                });
 
                let themesDiv = document.getElementById("themes")
 
                const saveColorThemeBtn = document.getElementById("saveColorTheme");
                const saveGradientThemeBtn = document.getElementById("saveGradientTheme");
                const saveImageThemeBtn = document.getElementById("saveImageTheme");
 
                saveColorThemeBtn.addEventListener("click", () => {
                    const name = document.getElementById("colorThemeName").value;
                    const bgColorInput = document.getElementById("theme-editor-bgcolorinput").value;
                    const textColorInput = document.getElementById("theme-editor-colorinput").value;
 
                    if(name == "") return
 
                    const theme = {
                        name: name,
                        background: bgColorInput,
                        text: textColorInput
                    };
 
                    const themeCard = document.createElement("div");
                    themeCard.classList.add("theme");
                    let themeBG;
                    if (theme.background.includes("http")) {
                        themeBG = `background: url(${theme.preview || theme.background})`;
                    } else {
                        themeBG = `background: ${theme.background}`;
                    }
                    themeCard.innerHTML = `
                        <div class="themeContent" style="${themeBG}; background-size: cover; background-position: center"></div>
                        <div class="themeName text" style="color: #fff">${theme.name}</div>
                    `;
 
                    themeCard.addEventListener("click", () => {
                        toggleTheme(theme);
                    });
 
                    themeCard.addEventListener('contextmenu', (ev) => {
                        ev.preventDefault();
                        if(confirm("Do you want to delete this Theme?")) {
                            themeCard.remove();
                            const themeIndex = modSettings.addedThemes.findIndex((addedTheme) => addedTheme.name === theme.name);
                            if (themeIndex !== -1) {
                                modSettings.addedThemes.splice(themeIndex, 1);
                                updateStorage();
                            }
                        }
                    });
 
                    themesDiv.appendChild(themeCard);
 
                    modSettings.addedThemes.push(theme)
                    updateStorage();
 
                    themeEditor.style.display = "none";
                    themesDiv.scrollTop = themesDiv.scrollHeight;
                });
 
                saveGradientThemeBtn.addEventListener("click", () => {
                    const name = document.getElementById("GradientThemeName").value;
                    const gColor1 = document.getElementById("theme-editor-gcolor1").value;
                    const gColor2 = document.getElementById("theme-editor-g_color").value;
                    const gTextColor = document.getElementById("theme-editor-gcolor2").value;
                    const gAngle = document.getElementById("g_angle").value;
                    const gradientType = document.getElementById("gradient-type").value;
 
                    if(name == "") return
 
                    let gradient_radial_linear = () => {
                        if(gradientType == "linear") {
                            return `${gradientType}-gradient(${gAngle}deg, ${gColor1}, ${gColor2})`
                        } else if (gradientType == "radial") {
                            return `${gradientType}-gradient(circle, ${gColor1}, ${gColor2})`
                        }
                    }
                    const theme = {
                        name: name,
                        background: gradient_radial_linear(),
                        text: gTextColor,
                    };
 
                    const themeCard = document.createElement("div");
                    themeCard.classList.add("theme");
                    let themeBG;
                    if (theme.background.includes("http")) {
                        themeBG = `background: url(${theme.preview || theme.background})`;
                    } else {
                        themeBG = `background: ${theme.background}`;
                    }
                    themeCard.innerHTML = `
                        <div class="themeContent" style="${themeBG}; background-size: cover; background-position: center"></div>
                        <div class="themeName text" style="color: #fff">${theme.name}</div>
                    `;
 
                    themeCard.addEventListener("click", () => {
                        toggleTheme(theme);
                    });
 
                    themeCard.addEventListener('contextmenu', (ev) => {
                        ev.preventDefault();
                        if(confirm("Do you want to delete this Theme?")) {
                            themeCard.remove();
                            const themeIndex = modSettings.addedThemes.findIndex((addedTheme) => addedTheme.name === theme.name);
                            if (themeIndex !== -1) {
                                modSettings.addedThemes.splice(themeIndex, 1);
                                updateStorage();
                            }
                        }
                    });
 
                    themesDiv.appendChild(themeCard);
 
                    modSettings.addedThemes.push(theme)
                    updateStorage();
 
                    themeEditor.style.display = "none";
                    themesDiv.scrollTop = themesDiv.scrollHeight;
                });
 
                saveImageThemeBtn.addEventListener("click", () => {
                    const name = document.getElementById("imageThemeName").value;
                    const imageLink = document.getElementById("theme-editor-imagelink").value;
                    const textColorImageInput = document.getElementById("theme-editor-textcolorImage").value;
 
                    if(name == "" || imageLink == "") return
 
                    const theme = {
                        name: name,
                        background: imageLink,
                        text: textColorImageInput
                    };
 
                    const themeCard = document.createElement("div");
                    themeCard.classList.add("theme");
                    let themeBG;
                    if (theme.background.includes("http")) {
                        themeBG = `background: url(${theme.preview || theme.background})`;
                    } else {
                        themeBG = `background: ${theme.background}`;
                    }
                    themeCard.innerHTML = `
                        <div class="themeContent" style="${themeBG}; background-size: cover; background-position: center"></div>
                        <div class="themeName text" style="color: #fff">${theme.name}</div>
                    `;
 
                    themeCard.addEventListener("click", () => {
                        toggleTheme(theme);
                    });
 
                    themeCard.addEventListener('contextmenu', (ev) => {
                        ev.preventDefault();
                        if(confirm("Do you want to delete this Theme?")) {
                            themeCard.remove();
                            const themeIndex = modSettings.addedThemes.findIndex((addedTheme) => addedTheme.name === theme.name);
                            if (themeIndex !== -1) {
                                modSettings.addedThemes.splice(themeIndex, 1);
                                updateStorage();
                            }
                        }
                    });
 
                    themesDiv.appendChild(themeCard);
 
                    modSettings.addedThemes.push(theme)
                    updateStorage();
 
                    themeEditor.style.display = "none";
                    themesDiv.scrollTop = themesDiv.scrollHeight;
                });
            });
 
            const b_inner = document.querySelector(".body__inner");
            let bodyColorElements = b_inner.querySelectorAll(
                ".body__inner > :not(.body__inner), #s-skin-select-icon-text"
            );
 
            const toggleColor = (element, background, text) => {
                let image = `url("${background}")`;
                if (background.includes("http")) {
                    element.style.background = image;
                    element.style.backgroundPosition = "center";
                    element.style.backgroundSize = "cover";
                    element.style.backgroundRepeat = "no-repeat";
                } else {
                    element.style.background = background;
                    element.style.backgroundRepeat = "no-repeat";
                }
                element.style.color = text;
            };
 
            const openSVG = document.querySelector("#clans_and_settings > Button:nth-of-type(2) > svg");
            const openSVGPath = openSVG.querySelector("path");
            const newPath = openSVG.setAttribute("fill", "#fff")
            openSVG.setAttribute("width", "36")
            openSVG.setAttribute("height", "36")
 
            const toggleTheme = (theme) => {
                if (theme.text === "#FFFFFF") {
                    openSVGPath.setAttribute("fill", "#fff")
                } else {
                    openSVGPath.setAttribute("fill", "#222");
                }
 
                const backgroundColor = theme.background;
                const textColor = theme.text;
 
                elements.forEach(selector => {
                    const el = document.querySelector(selector);
                    if (selector === "#title") {
                        el.style.color = textColor;
                    } else {
                        toggleColor(el, backgroundColor, textColor);
                    }
                });
 
                bodyColorElements.forEach((element) => {
                    element.style.color = textColor;
                });
 
                modSettings.Theme = theme.name;
                updateStorage();
            };
 
            const themes = window.themes = {
                defaults: [
                    {
                        name: "Dark",
                        background: "#151515",
                        text: "#FFFFFF"
                    },
                    {
                        name: "White",
                        background: "#ffffff",
                        text: "#000000"
                    },
                ],
                orderly: [
                    {
                        name: "THC",
                        background: "linear-gradient(160deg, #9BEC7A, #117500)",
                        text: "#000000"
                    },
                    {
                        name: "4 AM",
                        background: "linear-gradient(160deg, #8B0AE1, #111)",
                        text: "#FFFFFF"
                    },
                    {
                        name: "OTO",
                        background: "linear-gradient(160deg, #A20000, #050505)",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Gaming",
                        background: "https://i.ibb.co/DwKkQfh/BG-1-lower-quality.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Shapes",
                        background: "https://i.ibb.co/h8TmVyM/BG-2.png",
                        preview: "https://app.czrsd.com/static/themes/BG-2.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Blue",
                        background: "https://i.ibb.co/9yQBfWj/BG-3.png",
                        preview: "https://app.czrsd.com/static/themes/BG-3.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Blue - 2",
                        background: "https://i.ibb.co/7RJvNCX/BG-4.png",
                        preview: "https://app.czrsd.com/static/themes/BG-4.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Purple",
                        background: "https://i.ibb.co/vxY15Tv/BG-5.png",
                        preview: "https://app.czrsd.com/static/themes/BG-5.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Orange Blue",
                        background: "https://i.ibb.co/99nfFBN/BG-6.png",
                        preview: "https://app.czrsd.com/static/themes/BG-6.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Gradient",
                        background: "https://i.ibb.co/hWMLwLS/BG-7.png",
                        preview: "https://app.czrsd.com/static/themes/BG-7.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Sky",
                        background: "https://i.ibb.co/P4XqDFw/BG-9.png",
                        preview: "https://app.czrsd.com/static/themes/BG-9.jpg",
                        text: "#000000"
                    },
                    {
                        name: "Sunset",
                        background: "https://i.ibb.co/0BVbYHC/BG-10.png",
                        preview: "https://app.czrsd.com/static/themes/BG-10.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Galaxy",
                        background: "https://i.ibb.co/MsssDKP/Galaxy.png",
                        preview: "https://app.czrsd.com/static/themes/Galaxy.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Planet",
                        background: "https://i.ibb.co/KLqWM32/Planet.png",
                        preview: "https://app.czrsd.com/static/themes/Planet.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "colorful",
                        background: "https://i.ibb.co/VqtB3TX/colorful.png",
                        preview: "https://app.czrsd.com/static/themes/colorful.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Sunset - 2",
                        background: "https://i.ibb.co/TLp2nvv/Sunset.png",
                        preview: "https://app.czrsd.com/static/themes/Sunset.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Epic",
                        background: "https://i.ibb.co/kcv4tvn/Epic.png",
                        preview: "https://app.czrsd.com/static/themes/Epic.jpg",
                        text: "#FFFFFF"
                    },
                    {
                        name: "Galaxy - 2",
                        background: "https://i.ibb.co/smRs6V0/galaxy.png",
                        preview: 'https://app.czrsd.com/static/themes/galaxy2.jpg',
                        text: "#FFFFFF"
                    },
                    {
                        name: "Cloudy",
                        background: "https://i.ibb.co/MCW7Bcd/cloudy.png",
                        preview: "https://app.czrsd.com/static/themes/cloudy.jpg",
                        text: "#000000"
                    },
                ]
            };
 
            function createThemeCard(theme) {
                const themeCard = document.createElement("div");
                themeCard.classList.add("theme");
                let themeBG;
                if (theme.background.includes("http")) {
                    themeBG = `background: url(${theme.preview || theme.background})`;
                } else {
                    themeBG = `background: ${theme.background}`;
                }
                themeCard.innerHTML = `
                  <div class="themeContent" style="${themeBG}; background-size: cover; background-position: center"></div>
                  <div class="themeName text" style="color: #fff">${theme.name}</div>
                `;
 
                themeCard.addEventListener("click", () => {
                    toggleTheme(theme);
                });
 
                if (modSettings.addedThemes.includes(theme)) {
                    themeCard.addEventListener('contextmenu', (ev) => {
                        ev.preventDefault();
                        if (confirm("Do you want to delete this Theme?")) {
                            themeCard.remove();
                            const themeIndex = modSettings.addedThemes.findIndex((addedTheme) => addedTheme.name === theme.name);
                            if (themeIndex !== -1) {
                                modSettings.addedThemes.splice(themeIndex, 1);
                                updateStorage();
                            }
                        }
                    }, false);
                }
 
                return themeCard;
            }
 
            const themesContainer = document.getElementById("themes");
 
            themes.defaults.forEach((theme) => {
                const themeCard = createThemeCard(theme);
                themesContainer.append(themeCard);
            });
 
            const orderlyThemes = [...themes.orderly, ...modSettings.addedThemes];
            orderlyThemes.sort((a, b) => a.name.localeCompare(b.name));
            orderlyThemes.forEach((theme) => {
                const themeCard = createThemeCard(theme);
                themesContainer.appendChild(themeCard);
            });
 
 
            const savedTheme = modSettings.Theme;
            if (savedTheme) {
                let selectedTheme;
                selectedTheme = themes.defaults.find((theme) => theme.name === savedTheme);
                if (!selectedTheme) {
                    selectedTheme = themes.orderly.find((theme) => theme.name === savedTheme) || modSettings.addedThemes.find((theme) => theme.name === savedTheme);
                }
 
                if (selectedTheme) {
                    toggleTheme(selectedTheme);
                }
            }
        },
 
        chat() {
            // disable old chat
            setTimeout(() => {
                const showChat = document.querySelector('#showChat');
                if (showChat && showChat.checked) {
                    showChat.click();
                }
                if (showChat) {
                    showChat.remove();
                }
            }, 500);
 
            // If someone uninstalls the mod, the chat is visible again
            window.addEventListener("beforeunload", () => {
                localStorage.setItem("settings", JSON.stringify({ ...JSON.parse(localStorage.getItem("settings")), showChat: true }));
            });
 
            const chatDiv = document.createElement("div");
            chatDiv.classList.add("modChat");
            chatDiv.innerHTML = `
                <div class="modChat__inner">
                    <button id="scroll-down-btn" class="modButton">↓</button>
                    <div class="modchat-chatbuttons">
                        <button class="chatButton" id="mainchat">Main</button>
                        <button class="chatButton" id="partychat">Party</button>
                        <span class="tagText"></span>
                    </div>
                    <div id="mod-messages" class="scroll"></div>
                    <div id="chatInputContainer">
                        <input type="text" id="chatSendInput" class="chatInput" placeholder="message..." maxlength="250" minlength="1" />
                        <button class="chatButton" id="openChatSettings">
                            <svg width="15" height="15" viewBox="0 0 20 20" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.4249 7.45169C15.7658 7.45169 15.0874 6.27836 15.9124 4.83919C16.3891 4.00503 16.1049 2.94169 15.2708 2.46503L13.6849 1.55753C12.9608 1.12669 12.0258 1.38336 11.5949 2.10753L11.4941 2.28169C10.6691 3.72086 9.31242 3.72086 8.47825 2.28169L8.37742 2.10753C7.96492 1.38336 7.02992 1.12669 6.30575 1.55753L4.71992 2.46503C3.88575 2.94169 3.60158 4.01419 4.07825 4.84836C4.91242 6.27836 4.23408 7.45169 2.57492 7.45169C1.62159 7.45169 0.833252 8.23086 0.833252 9.19336V10.8067C0.833252 11.76 1.61242 12.5484 2.57492 12.5484C4.23408 12.5484 4.91242 13.7217 4.07825 15.1609C3.60158 15.995 3.88575 17.0584 4.71992 17.535L6.30575 18.4425C7.02992 18.8734 7.96492 18.6167 8.39575 17.8925L8.49658 17.7184C9.32158 16.2792 10.6783 16.2792 11.5124 17.7184L11.6133 17.8925C12.0441 18.6167 12.9791 18.8734 13.7033 18.4425L15.2891 17.535C16.1233 17.0584 16.4074 15.9859 15.9307 15.1609C15.0966 13.7217 15.7749 12.5484 17.4341 12.5484C18.3874 12.5484 19.1758 11.7692 19.1758 10.8067V9.19336C19.1666 8.24003 18.3874 7.45169 17.4249 7.45169ZM9.99992 12.9792C8.35908 12.9792 7.02075 11.6409 7.02075 10C7.02075 8.35919 8.35908 7.02086 9.99992 7.02086C11.6408 7.02086 12.9791 8.35919 12.9791 10C12.9791 11.6409 11.6408 12.9792 9.99992 12.9792Z" fill="#fff"></path>
                            </svg>
                        </button>
                        <button class="chatButton" id="openEmojiMenu">😎</button>
                        <button id="sendButton" class="chatButton">
                            Send
                            <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/send.svg" width="20" height="20" draggable="false"/>
                        </button>
                    </div>
                </div>
            `;
            document.body.append(chatDiv);
 
            const chatContainer = document.getElementById("mod-messages");
            const scrollDownButton = document.getElementById("scroll-down-btn");
 
            chatContainer.addEventListener("scroll", () => {
                if (chatContainer.scrollHeight - chatContainer.scrollTop > 300) {
                    scrollDownButton.style.display = "block";
                }
                if (chatContainer.scrollHeight - chatContainer.scrollTop < 299 && scrollDownButton.style.display === "block") {
                    scrollDownButton.style.display = "none";
                }
            });
 
            scrollDownButton.addEventListener("click", () => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });
 
            const messageCount = chatContainer.children.length;
            const messageLimit = modSettings.chatSettings.limit;
            if (messageCount > messageLimit) {
                const messagesToRemove = messageCount - messageLimit;
                for (let i = 0; i < messagesToRemove; i++) {
                    chatContainer.removeChild(chatContainer.firstChild);
                }
            }
 
            const main = document.getElementById("mainchat");
            const party = document.getElementById("partychat");
            main.addEventListener("click", () => {
                if (modSettings.chatSettings.showClientChat) {
                    document.getElementById("mod-messages").innerHTML = "";
                    modSettings.chatSettings.showClientChat = false;
                    updateStorage();
                }
            });
            party.addEventListener("click", () => {
                if (!modSettings.chatSettings.showClientChat) {
                    modSettings.chatSettings.showClientChat = true;
                    updateStorage();
                }
                const modMessages = document.getElementById("mod-messages");
                if (!modSettings.tag) {
                    modMessages.innerHTML = `
                        <div class="message">
                            <span>
                                <span style="color: #5a44eb" class="message_name">[SERVER]</span>: You need to be in a tag to use the SigMod party chat.
                            </span>
                        </div>
                    `;
                } else {
                    modMessages.innerHTML = `
                        <div class="message">
                            <span>
                                <span style="color: #5a44eb" class="message_name">[SERVER]</span>: Welcome to the SigMod party chat!
                            </span>
                        </div>
                    `;
                }
            });
 
            if (modSettings.chatSettings.showClientChat) {
                const modMessages = document.getElementById("mod-messages");
                if (modMessages.children.length > 1) return;
                modMessages.innerHTML = `
                    <div class="message">
                        <span>
                            <span style="color: #5a44eb" class="message_name">[SERVER]</span>: Welcome to the SigMod party chat!
                        </span>
                    </div>
                `;
            }
 
 
            const text = document.getElementById("chatSendInput");
            const send = document.getElementById("sendButton");
 
            send.addEventListener("click", () => {
                let val = text.value;
                if (val == "") return;
 
                if (modSettings.chatSettings.showClientChat) {
                    client.send({
                        type: "chat-message",
                        content: {
                            message: val,
                        }
                    });
                } else {
                    // MAX 15 CHARS PER MSG
                    if (val.length > 15) {
                        const parts = [];
                        for (let i = 0; i < val.length; i += 15) {
                            parts.push(val.substring(i, i + 15));
                        }
 
                        let index = 0;
                        const sendPart = () => {
                            if (index < parts.length) {
                                window.sendChat(parts[index]);
                                index++;
                                setTimeout(sendPart, 1000);
                            }
                        };
 
                        sendPart();
                    } else {
                        window.sendChat(val);
                    }
                }
 
                text.value = "";
                text.blur();
            });
 
 
            this.chatSettings();
            this.emojiMenu();
 
 
            const chatSettingsContainer = document.querySelector(".chatSettingsContainer")
            const emojisContainer = document.querySelector(".emojisContainer")
 
            document.getElementById("openChatSettings").addEventListener("click", () => {
                if (chatSettingsContainer.classList.contains("hidden_full")) {
                    chatSettingsContainer.classList.remove("hidden_full");
                    emojisContainer.classList.add("hidden_full");
                } else {
                    chatSettingsContainer.classList.add("hidden_full");
                }
            });
 
            document.getElementById("openEmojiMenu").addEventListener("click", () => {
                if (emojisContainer.classList.contains("hidden_full")) {
                    emojisContainer.classList.remove("hidden_full");
                    chatSettingsContainer.classList.add("hidden_full");
                } else {
                    emojisContainer.classList.add("hidden_full");
                }
            });
 
 
            const scrollUpButton = document.getElementById("scroll-down-btn");
            let focused = false;
            let typed = false;
 
            document.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && text.value.length > 0) {
                    send.click();
                    focused = false;
                    scrollUpButton.click();
                } else if (e.key === "Enter") {
                    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
 
                    focused ? text.blur() : text.focus();
                    focused = !focused;
                }
            });
 
 
            text.addEventListener("input", (e) => {
                typed = text.value.length > 1;
            });
 
            text.addEventListener("blur", (e) => {
                focused = false;
            });
 
            text.addEventListener("keydown", (e) => {
                const key = e.key.toLowerCase();
                if (key == "w") {
                    e.stopPropagation();
                }
 
                if (key == " ") {
                    e.stopPropagation();
                }
            });
 
 
            // switch to compact chat
 
            const chatElements = [".modChat", ".emojisContainer", ".chatSettingsContainer"];
 
            // modSettings.chatSettings.compact
 
            const compactChat = document.getElementById("compactChat");
            compactChat.addEventListener("change", () => {
                if (compactChat.checked) {
                    compactMode();
                } else {
                    defaultMode();
                }
            });
 
            function compactMode() {
                chatElements.forEach((querySelector) => {
                    const el = document.querySelector(querySelector);
                    if (el) {
                        el.classList.add("mod-compact");
                    }
                });
 
                modSettings.chatSettings.compact = true;
                updateStorage();
            }
 
            function defaultMode() {
                chatElements.forEach((querySelector) => {
                    const el = document.querySelector(querySelector);
                    if (el) {
                        el.classList.remove("mod-compact");
                    }
                });
                modSettings.chatSettings.compact = false;
                updateStorage();
            }
 
            if (modSettings.chatSettings.compact) compactMode();
 
        },
 
        updateChat(data) {
            if (this.blackListCharacters.includes(data.message)) return;
 
            let that = this;
            let time = "";
            if (data.time !== null) {
                time = prettyTime.am_pm(data.time);
            }
 
            let { name, message } = data;
            name = noXSS(name);
            message = noXSS(message);
            const color = this.friend_names.has(name) ? this.friends_settings.highlight_color : data.color || "#ffffff";
            const glow = this.friend_names.has(name) && this.friends_settings.highlight_friends ? `text-shadow: 0 1px 3px ${color}` : '';
            const id = rdmString(12);
 
            const chatMessage = document.createElement("div");
            chatMessage.classList.add("message");
 
            chatMessage.innerHTML = `
                <span>
                    <span style="color: ${color};${glow}" class="message_name" id="${id}">${name}</span>: ${message}
                </span>
                <span class="time">${time}</span>
            `;
 
            const chatContainer = document.getElementById("mod-messages");
            const isScrolledToBottom =
                  chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 1;
            const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - 200 <= chatContainer.clientHeight;
 
            chatContainer.append(chatMessage);
 
            if (isScrolledToBottom || isNearBottom) {
                if (!this.scrolling) {
                    this.scrolling = true;
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    this.scrolling = false;
                }
            }
 
            if (name == this.nick) return;
 
            const nameEl = document.getElementById(id);
            nameEl.addEventListener("mousedown", (e) => {
                if (that.onContext) return;
                if (e.button === 2) {
                    // Create a custom context menu
                    const contextMenu = document.createElement("div");
                    contextMenu.classList.add("chat-context");
                    contextMenu.innerHTML = `
                        <span>${name}</span>
                        <button id="muteButton">Mute</button>
                    `;
 
                    const contextMenuTop = e.clientY - 80;
                    const contextMenuLeft = e.clientX;
 
                    // Set the position of the context menu
                    contextMenu.style.top = `${contextMenuTop}px`;
                    contextMenu.style.left = `${contextMenuLeft}px`;
 
                    document.body.appendChild(contextMenu);
                    that.onContext = true;
 
                    const muteButton = document.getElementById("muteButton");
                    muteButton.addEventListener("click", () => {
                        let message = name === "Spectator" ? `Are you sure you want to mute all spectators until you refresh the page?` : `Are you sure you want to mute '${name}' until you refresh the page?`;
                        if (confirm(message)) {
                            this.muteUser(name);
                            contextMenu.remove();
                        }
                    });
 
                    document.addEventListener("click", (event) => {
                        if (!contextMenu.contains(event.target)) {
                            that.onContext = false;
                            contextMenu.remove();
                        }
                    });
                }
            });
 
            nameEl.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        },
 
        muteUser(name) {
            this.mutedUsers.push(name);
 
            const msgNames = document.querySelectorAll(".message_name");
            msgNames.forEach((msgName) => {
                if (msgName.innerHTML == name) {
                    const msgParent = msgName.closest('.message');
                    msgParent.remove();
                }
            });
        },
 
        emojiMenu() {
            const emojisContainer = document.createElement("div");
            emojisContainer.classList.add("chatAddedContainer", "emojisContainer", "hidden_full");
            emojisContainer.innerHTML = `
                <input type="text" class="chatInput" id="searchEmoji" style="background-color: #050505; border-radius: .5rem; flex-grow: 0;" placeholder="Search..." />
                <div id="categories" class="scroll"></div>
            `;
 
            const categoriesContainer = emojisContainer.querySelector("#categories");
 
            const updateEmojis = (searchTerm) => {
                categoriesContainer.innerHTML = '';
 
                window.emojis.forEach(emojiData => {
                    const { emoji, description, category, tags } = emojiData;
 
                    if (tags.some(tag => tag.includes(searchTerm.toLowerCase()))) {
                        let categoryId = category.replace(/\s+/g, '-').replace('&', 'and').toLowerCase();
                        let categoryDiv = categoriesContainer.querySelector(`#${categoryId}`);
                        if (!categoryDiv) {
                            categoryDiv = document.createElement("div");
                            categoryDiv.id = categoryId;
                            categoryDiv.classList.add("category");
                            categoryDiv.innerHTML = `<span>${category}</span><div class="emojiContainer"></div>`;
                            categoriesContainer.appendChild(categoryDiv);
                        }
 
                        const emojiContainer = categoryDiv.querySelector(".emojiContainer");
 
                        const emojiDiv = document.createElement("div");
                        emojiDiv.classList.add("emoji");
                        emojiDiv.innerHTML = emoji;
                        emojiDiv.title = `${emoji} - ${description}`;
                        emojiDiv.addEventListener("click", () => {
                            const chatInput = document.querySelector("#chatSendInput");
                            chatInput.value += emoji;
                        });
 
                        emojiContainer.appendChild(emojiDiv);
                    }
                });
            };
 
            const chatInput = emojisContainer.querySelector("#searchEmoji");
            chatInput.addEventListener("input", (event) => {
                const searchTerm = event.target.value.toLowerCase();
                updateEmojis(searchTerm);
            });
 
            document.body.append(emojisContainer);
 
            getEmojis().then(emojis => {
                window.emojis = emojis;
                updateEmojis("");
            });
        },
 
        chatSettings() {
            const menu = document.createElement("div");
            menu.classList.add("chatAddedContainer", "chatSettingsContainer", "scroll", "hidden_full");
            menu.innerHTML = `
                <div class="modInfoPopup" style="display: none">
                    <p>Send location in chat with keybind</p>
                </div>
                <div class="scroll">
                    <div class="csBlock">
                        <div class="csBlockTitle">
                            <span>Keybindings</span>
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Location</span>
                                <span class="infoIcon">
                                    <svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 416.979 416.979" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85 c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786 c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576 c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765 c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"></path> </g> </g></svg>
                                </span>
                            </div>
                            <input type="text" name="location" id="modinput9" class="keybinding" value="${modSettings.keyBindings.location || ""}" placeholder="..." maxlength="1" onfocus="this.select()">
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Show / Hide</span>
                            </div>
                            <input type="text" name="toggleChat" id="modinput10" class="keybinding" value="${modSettings.keyBindings.toggleChat || ""}" placeholder="..." maxlength="1" onfocus="this.select()">
                        </div>
                    </div>
                    <div class="csBlock">
                        <div class="csBlockTitle">
                            <span>General</span>
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Time</span>
                            </div>
                            <div class="modCheckbox">
                              <input id="showChatTime" type="checkbox" checked />
                              <label class="cbx" for="showChatTime"></label>
                            </div>
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Name colors</span>
                            </div>
                            <div class="modCheckbox">
                              <input id="showNameColors" type="checkbox" checked />
                              <label class="cbx" for="showNameColors"></label>
                            </div>
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Party / Main</span>
                            </div>
                            <div class="modCheckbox">
                              <input id="showPartyMain" type="checkbox" checked />
                              <label class="cbx" for="showPartyMain"></label>
                            </div>
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Blur Tag</span>
                            </div>
                            <div class="modCheckbox">
                              <input id="blurTag" type="checkbox" checked />
                              <label class="cbx" for="blurTag"></label>
                            </div>
                        </div>
                        <div class="flex f-column g-5 centerXY" style="padding: 0 5px">
                            <div class="csRowName">
                                <span>Location text</span>
                            </div>
                          <input type="text" id="locationText" placeholder="{pos}..." value="{pos}" class="form-control" />
                        </div>
                    </div>
                    <div class="csBlock">
                        <div class="csBlockTitle">
                            <span>Style</span>
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Compact chat</span>
                            </div>
                            <div class="modCheckbox">
                              <input id="compactChat" type="checkbox" ${modSettings.chatSettings.compact ? "checked" : ""} />
                              <label class="cbx" for="compactChat"></label>
                            </div>
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Background</span>
                            </div>
                            <input type="color" class="colorInput" value="${modSettings.chatSettings.bgColor}" id="chatbgChanger" style="width: 33px;" />
                        </div>
                        <div class="csRow">
                            <div class="csRowName">
                                <span>Theme</span>
                            </div>
                            <input type="color" class="colorInput" value="${modSettings.chatSettings.themeColor || "#ffffff"}" id="chatThemeChanger" style="width: 33px;" />
                        </div>
                        <div class="flex f-column g-5 centerXY" style="padding: 0 5px;">
                            <div class="csRowName">
                                <span>Opacity</span>
                            </div>
                            <input type="range" class="modSlider" style="padding: 15px;" id="chat_opacity" value="${modSettings.chatSettings.chat_opacity || 0.4}" max="1" step="0.1" />
                        </div>
                    </div>
                </div>
            `;
            document.body.append(menu);
 
            const infoIcon = document.querySelector(".infoIcon");
            const modInfoPopup = document.querySelector(".modInfoPopup");
            let popupOpen = false;
 
            infoIcon.addEventListener("click", (event) => {
                event.stopPropagation();
                modInfoPopup.style.display = popupOpen ? "none" : "block";
                popupOpen = !popupOpen;
            });
 
            document.addEventListener("click", (event) => {
                if (popupOpen && !modInfoPopup.contains(event.target)) {
                    modInfoPopup.style.display = "none";
                    popupOpen = false;
                }
            });
 
            const showChatTime = document.querySelector("#showChatTime");
            const showNameColors = document.querySelector("#showNameColors");
 
            showChatTime.addEventListener("change", () => {
                const timeElements = document.querySelectorAll(".time");
                if (showChatTime.checked) {
                    modSettings.chatSettings.showTime = true;
                    updateStorage();
                } else {
                    modSettings.chatSettings.showTime = false;
                    if (timeElements) {
                        timeElements.forEach(el => el.innerHTML="");
                    }
                    updateStorage();
                }
            });
 
            showNameColors.addEventListener("change", () => {
                const message_names = document.querySelectorAll(".message_name");
                if (showNameColors.checked) {
                    modSettings.chatSettings.showNameColors = true;
                    updateStorage();
                } else {
                    modSettings.chatSettings.showNameColors = false;
                    if (message_names) {
                        message_names.forEach(el => el.style.color="#fafafa");
                    }
                    updateStorage();
                }
            });
 
            const bgChanger = document.querySelector("#chatbgChanger");
            if (!modSettings.chatSettings.chat_opacity) {
                modSettings.chatSettings.chat_opacity = 0.4;
                updateStorage();
            }
 
            bgChanger.addEventListener("input", () => {
                const hexColor = bgChanger.value;
                const rgbaColor = hexToRgba(hexColor, modSettings.chatSettings.chat_opacity);
                modSettings.chatSettings.bgColor = hexColor;
                modChat.style.background = rgbaColor;
                updateStorage();
            });
 
            const themeChanger = document.querySelector("#chatThemeChanger");
            const chatBtns = document.querySelectorAll(".chatButton");
            themeChanger.addEventListener("input", () => {
                const hexColor = themeChanger.value;
                modSettings.chatSettings.themeColor = hexColor;
                chatBtns.forEach(btn => {
                    btn.style.background = hexColor;
                });
                updateStorage();
            });
 
            // remove old rgba val
            if (modSettings.chatSettings.bgColor.includes("rgba")) {
                modSettings.chatSettings.bgColor = RgbaToHex(modSettings.chatSettings.bgColor);
            }
 
            const modChat = document.querySelector(".modChat");
            modChat.style.background = hexToRgba(modSettings.chatSettings.bgColor, modSettings.chatSettings.chat_opacity);
            if (modSettings.chatSettings.themeColor) {
                chatBtns.forEach(btn => {
                    btn.style.background = modSettings.chatSettings.themeColor;
                });
            }
 
            const opacity = document.querySelector("#chat_opacity");
            opacity.addEventListener("input", () => {
                modSettings.chatSettings.chat_opacity = opacity.value;
                updateStorage();
                const rgbaColor = hexToRgba(modSettings.chatSettings.bgColor, modSettings.chatSettings.chat_opacity);
                modChat.style.background = rgbaColor;
            });
 
            const showPartyMain = document.querySelector("#showPartyMain");
            const chatHeader = document.querySelector(".modchat-chatbuttons");
 
            const changeButtonsState = (show) => {
                chatHeader.style.display = show ? "flex" : "none";
                modChat.style.maxHeight = show ? "285px" : "250px";
                modChat.style.minHeight = show ? "285px" : "250px";
                const modChatInner = document.querySelector(".modChat__inner");
                modChatInner.style.maxHeight = show ? "265px" : "230px";
                modChatInner.style.minHeight = show ? "265px" : "230px";
            }
 
            showPartyMain.addEventListener("change", () => {
                const show = showPartyMain.checked;
                modSettings.chatSettings.showChatButtons = show;
                changeButtonsState(show);
                updateStorage();
            });
 
            showPartyMain.checked = modSettings.chatSettings.showChatButtons;
            changeButtonsState(modSettings.chatSettings.showChatButtons);
 
 
            setTimeout(() => {
                const blurTag = document.getElementById("blurTag");
                const tagText = document.querySelector(".tagText");
                const tagElement = document.querySelector("#tag");
                blurTag.addEventListener("change", () => {
                    const state = blurTag.checked;
 
                    state ? (tagText.classList.add("blur"), tagElement.classList.add("blur")) : (tagText.classList.remove("blur"), tagElement.classList.remove("blur"));
                    modSettings.chatSettings.blurTag = state;
                    updateStorage();
                });
                blurTag.checked = modSettings.chatSettings.blurTag;
                if (modSettings.chatSettings.blurTag) {
                    tagText.classList.add("blur");
                    tagElement.classList.add("blur");
                }
            });
 
            const locationText = document.getElementById("locationText");
            locationText.addEventListener("input", (e) => {
                e.stopPropagation();
                modSettings.chatSettings.locationText = locationText.value;
            });
            locationText.value = modSettings.chatSettings.locationText || "{pos}";
        },
 
        toggleChat() {
            const modChat = document.querySelector(".modChat");
            const modChatAdded = document.querySelectorAll(".chatAddedContainer");
 
            const isModChatHidden = modChat.style.display === "none" || getComputedStyle(modChat).display === "none";
 
            if (isModChatHidden) {
                modChat.style.opacity = 0;
                modChat.style.display = "flex";
 
                setTimeout(() => {
                    modChat.style.opacity = 1;
                }, 10);
            } else {
                modChat.style.opacity = 0;
                modChatAdded.forEach(container => container.classList.add("hidden_full"));
 
                setTimeout(() => {
                    modChat.style.display = "none";
                }, 300);
            }
        },
 
 
        macroSettings() {
            const allSettingNames = document.querySelectorAll(".setting-card-name")
 
            for (const settingName of Object.values(allSettingNames)) {
                settingName.addEventListener("click", (event) => {
                    const settingCardWrappers = document.querySelectorAll(".setting-card-wrapper")
                    const currentWrapper = Object.values(settingCardWrappers).filter((wrapper) => wrapper.querySelector(".setting-card-name").textContent === settingName.textContent)[0]
                    const settingParameters = currentWrapper.querySelector(".setting-parameters")
 
                    settingParameters.style.display = settingParameters.style.display === "none" ? "block" : "none"
                })
            }
        },
 
        smallMods() {
            const modAlert_overlay = document.createElement("div");
            modAlert_overlay.classList.add("alert_overlay");
            modAlert_overlay.id = "modAlert_overlay";
            document.body.append(modAlert_overlay);
 
            const popup = document.getElementById("shop-popup");
            const removeShopPopup = document.getElementById("removeShopPopup");
            removeShopPopup.addEventListener("change", () => {
                const checked = removeShopPopup.checked;
                if (checked) {
                    popup.classList.add("hidden_full");
                    modSettings.removeShopPopup = true;
                } else {
                    popup.classList.remove("hidden_full");
                    modSettings.removeShopPopup = false;
                }
                updateStorage();
            });
            if (modSettings.removeShopPopup) {
                popup.classList.add("hidden_full");
                removeShopPopup.checked = true;
            }
 
            const auto = document.getElementById("autoClaimCoins");
            auto.addEventListener("change", () => {
                const checked = auto.checked;
                if (checked) {
                    modSettings.autoClaimCoins = true;
                } else {
                    modSettings.autoClaimCoins = false;
                }
                updateStorage();
            });
            if (modSettings.autoClaimCoins) {
                auto.checked = true;
            }
 
            const showChallenges = document.getElementById("showChallenges");
            showChallenges.addEventListener("change", () => {
                if (showChallenges.checked) {
                    modSettings.showChallenges = true;
                } else {
                    modSettings.showChallenges = false;
                }
                updateStorage();
            });
            if (modSettings.showChallenges) {
                auto.checked = true;
            }
 
            const gameTitle = document.getElementById("title");
            gameTitle.innerHTML = 'Sigmally<span style="display: block; font-size: 14px; font-family: Comic Sans MS ">Mod by <a href="https://www.youtube.com/@sigmallyCursed/" target="_blank">Cursed</a></span>';
 
            const nickName = document.getElementById("nick");
            nickName.maxLength = 50;
            nickName.type = "text";
 
            function updNick() {
                const nick = nickName.value;
                this.nick = nick;
                const welcome = document.getElementById("welcomeUser");
                if (welcome) {
                    welcome.innerHTML = `Welcome ${this.nick || "Unnamed"}, to the SigMod Client!`;
                }
            }
            nickName.addEventListener("input", () => {
                updNick();
            });
 
            updNick();
 
            // Better grammar in the descriptions of the challenges
            setTimeout(() => {
                window.shopLocales.challenge_tab.tasks = {"eaten": "Eat %n food in a game.", "xp": "Get %n XP in a game.", "alive": "Stay alive for %n minutes in a game.", "pos": "Reach top %n on leaderboard."};
            }, 1000);
 
 
            const topusersInner = document.querySelector(".top-users__inner");
            topusersInner.classList.add("scroll");
            topusersInner.style.border = "none";
 
            document.getElementById("signOutBtn").addEventListener("click", () => {
                window.gameSettings.user = null;
            });
 
            const mode = document.getElementById("gamemode");
            mode.addEventListener("change", () => {
                client.send({
                    type: "server-changed",
                    content: getGameMode()
                });
            });
 
            // Updating the mouse position & the side of the mouse position on the screen
            document.addEventListener("mousemove", (e) => {
                this.mouseX = e.clientX + window.pageXOffset;
                this.mouseY = e.clientY + window.pageYOffset;
                this.screenSide = this.mouseX < window.innerWidth / 2 ? "left" : "right";
            });
 
            // change password input type in tournament server to password
            if (!window.tourneyServer) return;
            const password = document.getElementById("password");
            if (!password) return;
 
            password.type = "password";
            password.autocomplete = "off";
        },
 
        removeStorage(storage) {
            localStorage.removeItem(storage);
        },
 
        credits() {
            console.log(`%c
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎░█▀▀▀█ ▀█▀ ░█▀▀█ ░█▀▄▀█ ░█▀▀▀█ ░█▀▀▄ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎─▀▀▀▄▄ ░█─ ░█─▄▄ ░█░█░█ ░█──░█ ░█─░█ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ V${version} ‎ ‎ ‎ ‎ ‎
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎░█▄▄▄█ ▄█▄ ░█▄▄█ ░█──░█ ░█▄▄▄█ ░█▄▄▀ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎
‎ ‎ ‎ ██████╗░██╗░░░██╗  ░█████╗░██╗░░░██╗██████╗░░██████╗███████╗██████╗░ ‎ ‎ ‎
‎ ‎ ‎ ██╔══██╗╚██╗░██╔╝  ██╔══██╗██║░░░██║██╔══██╗██╔════╝██╔════╝██╔══██╗ ‎ ‎ ‎
‎ ‎ ‎ ██████╦╝░╚████╔╝░  ██║░░╚═╝██║░░░██║██████╔╝╚█████╗░█████╗░░██║░░██║ ‎ ‎ ‎
‎ ‎ ‎ ██╔══██╗░░╚██╔╝░░  ██║░░██╗██║░░░██║██╔══██╗░╚═══██╗██╔══╝░░██║░░██║ ‎ ‎ ‎
‎ ‎ ‎ ██████╦╝░░░██║░░░  ╚█████╔╝╚██████╔╝██║░░██║██████╔╝███████╗██████╔╝ ‎ ‎ ‎
‎ ‎ ‎ ╚═════╝░░░░╚═╝░░░  ░╚════╝░░╚═════╝░╚═╝░░╚═╝╚═════╝░╚══════╝╚═════╝░ ‎ ‎ ‎
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎
`, 'background-color: black; color: green')
        },
        saveNames() {
            let savedNames = modSettings.savedNames;
            let savedNamesOutput = document.getElementById("savedNames");
            let saveNameBtn = document.getElementById("saveName");
            let saveNameInput = document.getElementById("saveNameValue");
 
            const createNameDiv = (name) => {
                let nameDiv = document.createElement("div");
                nameDiv.classList.add("NameDiv");
 
                let nameLabel = document.createElement("label");
                nameLabel.classList.add("NameLabel");
                nameLabel.innerText = name;
 
                let delName = document.createElement("button");
                delName.innerText = "X";
                delName.classList.add("delName");
 
                nameDiv.addEventListener("click", () => {
                    const name = nameLabel.innerText;
                    navigator.clipboard.writeText(name).then(() => {
                        this.modAlert(`Added the name '${name}' to your clipboard!`, "success");
                    });
                });
 
                delName.addEventListener("click", () => {
                    if (confirm("Are you sure you want to delete the name '" + nameLabel.innerText + "'?")) {
                        console.log("deleted name: " + nameLabel.innerText);
                        nameDiv.remove();
                        savedNames = savedNames.filter((n) => n !== nameLabel.innerText);
                        modSettings.savedNames = savedNames;
                        updateStorage();
                    }
                });
 
                nameDiv.appendChild(nameLabel);
                nameDiv.appendChild(delName);
                return nameDiv;
            };
 
            saveNameBtn.addEventListener("click", () => {
                if (saveNameInput.value == "") {
                    console.log("empty name");
                } else {
                    setTimeout(() => {
                        saveNameInput.value = "";
                    }, 10);
 
                    if (savedNames.includes(saveNameInput.value)) {
                        console.log("You already have this name saved!");
                        return;
                    }
 
                    let nameDiv = createNameDiv(saveNameInput.value);
                    savedNamesOutput.appendChild(nameDiv);
 
                    savedNames.push(saveNameInput.value);
                    modSettings.savedNames = savedNames;
                    updateStorage();
                }
            });
 
            if (savedNames.length > 0) {
                savedNames.forEach((name) => {
                    let nameDiv = createNameDiv(name);
                    savedNamesOutput.appendChild(nameDiv);
                });
            }
        },
 
        initStats() {
            const statElements = ["stat-time-played", "stat-highest-mass", "stat-total-deaths", "stat-total-mass"];
            this.storage = localStorage.getItem("game-stats");
 
            if (!this.storage) {
                this.storage = {
                    "time-played": 0, // seconds
                    "highest-mass": 0,
                    "total-deaths": 0,
                    "total-mass": 0,
                };
                localStorage.setItem("game-stats", JSON.stringify(this.storage));
            } else {
                this.storage = JSON.parse(this.storage);
            }
 
            statElements.forEach(rawStat => {
                const stat = rawStat.replace("stat-", "");
                const value = this.storage[stat];
                this.updateStatElm(rawStat, value);
            });
 
            this.session.bind(this)();
        },
 
        updateStat(key, value) {
            this.storage[key] = value;
            localStorage.setItem("game-stats", JSON.stringify(this.storage));
            this.updateStatElm(key, value);
        },
 
        updateStatElm(stat, value) {
            const element = document.getElementById(stat);
 
            if (element) {
                if (stat === "stat-time-played") {
                    const hours = Math.floor(value / 3600);
                    const minutes = Math.floor((value % 3600) / 60);
                    const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                    element.innerHTML = formattedTime;
                } else {
                    const formattedValue = stat === "stat-highest-mass" || stat === "stat-total-mass"
                    ? value > 999 ? `${(value / 1000).toFixed(1)}k` : value.toString()
                    : value.toString();
                    element.innerHTML = formattedValue;
                }
            }
        },
 
        session() {
            let playingInterval;
            let minPlaying = 0;
            let isPlaying = false;
 
            const playBtn = document.getElementById("play-btn");
            let a = null;
 
            playBtn.addEventListener("click", async () => {
                if (isPlaying) return;
 
                isPlaying = true;
                let timer = null;
                if (modSettings.playTimer) {
                    timer = document.createElement("span");
                    timer.classList.add("playTimer");
                    timer.innerText = "0m0s played";
                    document.body.append(timer);
                }
                let count = 0;
                playingInterval = setInterval(() => {
                    count++;
                    this.storage["time-played"]++;
                    if (count % 60 === 0) {
                        minPlaying++;
                    }
                    this.updateStat("time-played", this.storage["time-played"]);
 
                    if (modSettings.playTimer) {
                        this.updateTimeStat(timer, count);
                    }
                }, 1000);
            });
 
            setInterval(() => {
                if (isDead() && !dead) {
                    clearInterval(playingInterval);
                    dead = true;
                    const playTimer = document.querySelector(".playTimer");
                    if (playTimer) playTimer.remove();
                    const score = parseFloat(document.getElementById("highest_mass").innerText);
                    const highest = this.storage["highest-mass"];
 
                    if (score > highest) {
                        this.storage["highest-mass"] = score;
                        this.updateStat("highest-mass", this.storage["highest-mass"]);
                    }
 
                    this.storage["total-deaths"]++;
                    this.updateStat("total-deaths", this.storage["total-deaths"]);
 
                    this.storage["total-mass"] += score;
                    this.updateStat("total-mass", this.storage["total-mass"]);
                    isPlaying = false;
 
                    if (modSettings.showChallenges && window.gameSettings.user) this.showChallenges();
                } else if (!isDead()) {
                    dead = false;
                    const challengesDeathscreen = document.querySelector(".challenges_deathscreen");
                    if (challengesDeathscreen) challengesDeathscreen.remove();
                }
            });
        },
        updateTimeStat(el, seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const timeString = `${minutes}m${remainingSeconds}s`;
 
            el.innerText = `${timeString} played`;
        },
 
        async showChallenges() {
            const challengeData = await (await fetch(`https://sigmally.com/api/user/challenge/${window.gameSettings.user.email}`)).json();
 
            if (challengeData.status !== 'success') return;
 
            const shopLocales = window.shopLocales;
            let challengesCompleted = 0;
 
            const allChallenges = challengeData.data;
            allChallenges.forEach(({ status }) => {
                if (status) challengesCompleted++;
            });
 
            let challenges;
            if (challengesCompleted === allChallenges.length) {
                challenges = `<div class="challenge-row" style="justify-content: center;">All challenges completed.</div>`;
            } else {
                challenges = allChallenges
                    .filter(({ status }) => !status)
                    .map(({ task, best, status, ready, goal }) => {
                    const desc = shopLocales.challenge_tab.tasks[task].replace(
                        '%n',
                        task === 'alive' ? goal / 60 : goal
                    );
                    const btn = ready
                    ? `<button class="challenge-collect-secondary" onclick="this.challenge('${task}', ${status})">${shopLocales.challenge_tab.collect}</button>`
                    : `<div class="challenge-best-secondary">${shopLocales.challenge_tab.result}${Math.round(best)}${task === 'alive' ? 's' : ''}</div>`;
                    return `
                        <div class="challenge-row">
                          <div class="challenge-desc">${desc}</div>
                          ${btn}
                        </div>`;
                }).join('');
            }
 
            const modal = document.createElement("div");
            modal.classList.add("challenges_deathscreen");
            modal.innerHTML = `
                <span class="challenges-title">Daily challenges</span>
                <div class="challenges-col">${challenges}</div>
                <span class="centerXY new-challenges">New challenges in 0h 0m 0s</span>
            `;
 
            const toggleColor = (element, background, text) => {
                let image = `url("${background}")`;
                if (background.includes("http")) {
                    element.style.background = image;
                    element.style.backgroundPosition = "center";
                    element.style.backgroundSize = "cover";
                    element.style.backgroundRepeat = "no-repeat";
                } else {
                    element.style.background = background;
                    element.style.backgroundRepeat = "no-repeat";
                }
                element.style.color = text;
            };
 
            if (modSettings.Theme !== "Dark") {
                let selectedTheme;
                selectedTheme = window.themes.defaults.find((theme) => theme.name === modSettings.Theme) || modSettings.addedThemes.find((theme) => theme.name === modSettings.Theme) || null;
                if (!selectedTheme) {
                    selectedTheme = window.themes.orderly.find((theme) => theme.name === modSettings.Theme) || modSettings.addedThemes.find((theme) => theme.name === modSettings.Theme);
                }
 
                if (selectedTheme) {
                    console.log(selectedTheme);
                    toggleColor(modal, selectedTheme.background, selectedTheme.text);
                }
            }
 
            document.querySelector(".menu-wrapper--stats-mode").insertAdjacentElement("afterbegin", modal);
 
            if (challengesCompleted < allChallenges.length) {
                document.querySelectorAll(".challenge-collect-secondary").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const parentChallengeRow = btn.closest('.challenge-row');
                        if (parentChallengeRow) {
                            setTimeout(() => {
                                parentChallengeRow.remove();
                            }, 500);
                        }
                    });
                });
            }
 
            this.createDayTimer();
        },
 
        timeToString(timeLeft) {
            const string = new Date(timeLeft).toISOString().slice(11, 19);
            const [hours, minutes, seconds] = string.split(':');
 
            return `${hours}h ${minutes}m ${seconds}s`;
        },
        toISODate: (date) => {
            const withTime = date ? new Date(date) : new Date();
            const [withoutTime] = withTime.toISOString().split('T');
            return withoutTime;
        },
        createDayTimer() {
            const oneDay = 1000 * 60 * 60 * 24;
            const getTime = () => {
                const today = this.toISODate();
                const from = new Date(today).getTime();
                const to = from + oneDay;
 
                const distance = to - Date.now();
                const time = this.timeToString(distance);
                return time;
            }
 
            const children = document.querySelector('.new-challenges');
            if (children) {
                children.innerHTML = `New challenges in ${getTime()}`;
            }
 
            this.dayTimer = setInterval(() => {
                const today = this.toISODate();
                const from = new Date(today).getTime();
                const to = from + oneDay;
 
                const distance = to - Date.now();
                const time = this.timeToString(distance);
 
                const children = document.querySelector('.new-challenges');
                if (!children || distance < 1000 || !isDead()) {
                    clearInterval(this.dayTimer);
                    return;
                }
                children.innerHTML = `New challenges in ${getTime()}`;
            }, 1000);
        },
 
        fps() {
            const byId = (id) => document.getElementById(id);
            const fpsMode = byId("fpsMode");
            const hideFood = byId("fps-hideFood");
            const removeNames = byId("fps-remNames");
            const shortlongNames = byId("fps-shortenLongNames");
            const removeTextoutlines = byId("fps-remOutlines");
            const allElements = document.querySelectorAll(".fpsCheckbox");
 
            const toggleFPSmode = (turnOn) => {
                modSettings.fps.fpsMode = turnOn;
                if (turnOn) {
                    console.log("FPS mode enabled");
 
                    allElements.forEach(elm => {
                        elm.setAttribute("disabled", "true");
                    });
                    toggleNames();
 
                    const cb = document.getElementById("showSkins");
                    if (!cb.checked) {
                        cb.click();
                    }
 
                } else {
                    console.log("FPS mode disabled");
 
                    allElements.forEach(elm => {
                        elm.removeAttribute("disabled");
                    });
 
                    toggleNames();
                }
                updateStorage();
            };
 
            const toggleNames = () => {
                modSettings.fps.showNames = removeNames.checked;
                const cb = document.getElementById("showNames");
                if (cb.checked && removeNames.checked) {
                    cb.click();
                } else {
                    cb.click();
                }
                updateStorage();
            };
 
            // checkbox events
            fpsMode.addEventListener("change", () => {
                toggleFPSmode(fpsMode.checked);
            });
            hideFood.addEventListener("change", () => {
                modSettings.fps.hideFood = hideFood.checked;
                updateStorage();
            });
            removeNames.addEventListener("change", () => {
                toggleNames();
            });
            shortlongNames.addEventListener("change", () => {
                modSettings.fps.shortLongNames = shortlongNames.checked;
                updateStorage();
            });
            removeTextoutlines.addEventListener("change", () => {
                modSettings.fps.removeOutlines = removeTextoutlines.checked;
                updateStorage();
            });
 
            // set checkbox state
            const loadStorage = () => {
                const option = modSettings.fps;
                if (option.fpsMode) {
                    fpsMode.checked = true;
                }
                if (option.hideFood) {
                    hideFood.checked = true;
                }
                if (option.removeNames) {
                    removeNames.checked = true;
                }
                if (option.shortlongNames) {
                    shortlongNames.checked = true;
                }
                if (option.removeOutlines) {
                    removeTextoutlines.checked = true;
                }
            };
 
            loadStorage();
        },
 
        fastMass() {
            let x = 15;
            while (x--) {
                keypress("w", "KeyW");
            }
        },
 
        Macros() {
            let that = this;
            const KEY_SPLIT = this.splitKey;
            const respawnWorld = this.respawnWorld;
            let ff = null;
            let keydown = false;
            let open = false;
            const canvas = document.getElementById("canvas");
            const freezeType = document.getElementById("freezeType");
            const mod_menu = document.querySelector(".mod_menu");
            let freezeKeyPressed = false;
            let freezeMouseClicked = false;
            let freezeOverlay = null;
            let activeVLine = false;
 
            freezeType.value = modSettings.freezeType;
            freezeType.addEventListener("change", () => {
                modSettings.freezeType = freezeType.value;
                updateStorage();
            });
 
            function split(times) {
                if (times > 0) {
                    window.dispatchEvent(new KeyboardEvent("keydown", KEY_SPLIT));
                    window.dispatchEvent(new KeyboardEvent("keyup", KEY_SPLIT));
                    split(times - 1);
                }
            }
 
            async function selfTrick() {
                let i = 4;
 
                while (i--) {
                    split(1);
                    await wait(20)
                }
            }
            async function doubleTrick() {
                let i = 2;
 
                while (i--) {
                    split(1);
                    await wait(20)
                }
            }
 
            function mouseToScreenCenter() {
                const screenCenterX = canvas.width / 2;
                const screenCenterY = canvas.height / 2;
 
                mousemove(screenCenterX, screenCenterY)
 
                return {
                    x: screenCenterX,
                    y: screenCenterY
                }
            }
 
            function handleVLine() {
                if (!activeVLine) {
                    freezePlayer("press", false);
                    activeVLine = true;
                } else {
                    activeVLine = false;
                    freezePlayer("press", false);
                }
            }
 
            async function vLine() {
                if (!activeVLine) return;
                const centerXY = mouseToScreenCenter();
                const offsetUpX = centerXY.x;
                const offsetUpY = centerXY.y - 100;
                const offsetDownX = centerXY.x;
                const offsetDownY = centerXY.y + 100;
                const CX = canvas.width / 2;
                const CY = canvas.height / 2;
 
                mousemove(offsetUpX, offsetUpY);
 
                await wait(160)
 
                mousemove(offsetDownX, offsetDownY);
 
                await wait(80);
                mousemove(CX, CY);
            }
 
            function freezePlayer(type, mouse) {
                if(freezeType.value === "hold" && type === "hold") {
                    const CX = canvas.width / 2;
                    const CY = canvas.height / 2;
 
                    mousemove(CX, CY);
                } else if(freezeType.value === "press" && type === "press") {
                    if(!freezeKeyPressed) {
                        const CX = canvas.width / 2;
                        const CY = canvas.height / 2;
 
                        mousemove(CX, CY);
 
 
                        freezeOverlay = document.createElement("div");
                        freezeOverlay.innerHTML = `
                                <span style="position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 26px; user-select: none;">Movement Stopped</span>
                            `;
                        freezeOverlay.style = "position: absolute; top: 0; left: 0; z-index: 99; width: 100%; height: 100vh; overflow: hidden;";
 
                        if (mouse && (modSettings.m1 === "freeze" || modSettings.m2 === "freeze")) {
                            freezeOverlay.addEventListener("mousedown", (e) => {
                                if (e.button === 0 && modSettings.m1 === "freeze") { // Left mouse button (1)
                                    handleFreezeEvent();
                                }
                                if (e.button === 2 && modSettings.m2 === "freeze") { // Right mouse button (2)
                                    handleFreezeEvent();
                                }
                            });
 
                            if (modSettings.m2 === "freeze") {
                                freezeOverlay.addEventListener("contextmenu", (e) => {
                                    e.preventDefault();
                                });
                            }
                        }
 
                        function handleFreezeEvent() {
                            if (freezeOverlay != null) freezeOverlay.remove();
                            freezeOverlay = null;
                            freezeKeyPressed = false;
                        }
 
 
                        document.querySelector(".body__inner").append(freezeOverlay);
 
                        freezeKeyPressed = true;
                    } else {
                        if(freezeOverlay != null) freezeOverlay.remove();
                        freezeOverlay = null;
                        freezeKeyPressed = false;
                    }
                }
            }
 
            function sendLocation() {
                if (!activeCellX || !activeCellY) return;
 
                const gamemode = document.getElementById("gamemode");
                const coordinatesToCheck = (gamemode.value === "eu0.sigmally.com/ws/") ? coordinates : coordinates2;
 
                let field = "";
 
                for (const label in coordinatesToCheck) {
                    const { min, max } = coordinatesToCheck[label];
 
                    if (
                        activeCellX >= min.x &&
                        activeCellX <= max.x &&
                        activeCellY >= min.y &&
                        activeCellY <= max.y
                    ) {
                        field = label;
                        break;
                    }
                }
 
                const locationText = modSettings.chatSettings.locationText || field;
                const message = locationText.replace('{pos}', field);
                window.sendChat(message);
            }
 
            function toggleSettings(setting) {
                const settingElement = document.querySelector(`input#${setting}`);
                if (settingElement) {
                    settingElement.click();
                } else {
                    console.error(`Setting "${setting}" not found`);
                }
            }
 
 
            document.addEventListener("keyup", (e) => {
                const key = e.key.toLowerCase();
                if (key == modSettings.keyBindings.rapidFeed && keydown) {
                    clearInterval(ff);
                    keydown = false;
                }
            });
            document.addEventListener("keydown", (e) => {
                // prevent disconnecting & using macros on input fields
                if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
                    e.stopPropagation();
                    return;
                };
                const key = e.key.toLowerCase();
 
                if (key === "p") {
                    e.stopPropagation();
                }
                if (key === "tab" && !window.screenTop && !window.screenY) {
                    e.preventDefault();
                }
 
                if (key === modSettings.keyBindings.rapidFeed) {
                    if (!keydown) {
                        keydown = true;
                        ff = setInterval(this.fastMass, 50);
                    }
                }
                // vertical linesplit
                if (activeVLine && (key === ' ' ||
                                    key === modSettings.keyBindings.doubleSplit ||
                                    key === modSettings.keyBindings.tripleSplit ||
                                    key === modSettings.keyBindings.quadSplit)
                   ) {
                    vLine();
                }
 
                handleKeydown(key);
            });
 
            function handleKeydown(key) {
                switch (key) {
                    case modSettings.keyBindings.toggleMenu: {
                        if (!open) {
                            mod_menu.style.display = "flex";
                            setTimeout(() => {
                                mod_menu.style.opacity = 1;
                            }, 10);
                            open = true;
                        } else {
                            mod_menu.style.opacity = 0;
                            setTimeout(() => {
                                mod_menu.style.display = "none";
                            }, 300);
                            open = false;
                        }
                        break;
                    }
 
                    case modSettings.keyBindings.freezePlayer: {
                        if (menuClosed()) {
                            freezePlayer(modSettings.freezeType, false);
                        }
                        break;
                    }
 
                    case modSettings.keyBindings.doubleSplit:
                        split(2);
                        break;
 
                    case modSettings.keyBindings.tripleSplit:
                        split(3);
                        break;
 
                    case modSettings.keyBindings.quadSplit:
                        split(4);
                        break;
 
                    case modSettings.keyBindings.selfTrick:
                        selfTrick();
                        break;
 
                    case modSettings.keyBindings.doubleTrick:
                        doubleTrick();
                        break;
 
                    case modSettings.keyBindings.verticalSplit:
                        if (menuClosed()) {
                            handleVLine();
                        }
                        break;
 
                    case modSettings.keyBindings.location:
                        sendLocation();
                        break;
 
                    case modSettings.keyBindings.toggleChat:
                        mods.toggleChat();
                        break;
 
                    case modSettings.keyBindings.toggleNames:
                        toggleSettings("showNames");
                        break;
 
                    case modSettings.keyBindings.toggleSkins:
                        toggleSettings("showSkins");
                        break;
 
                    case modSettings.keyBindings.toggleAutoRespawn:
                        toggleSettings("autoRespawn");
                        break;
 
                    case modSettings.keyBindings.respawn:
                        respawnWorld();
                        break;
                }
            }
 
 
            canvas.addEventListener("mousedown", (e) => {
                if (e.button === 0) { // Left mouse button (0)
                    if (modSettings.m1 === "fastfeed") {
                        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
                        this.mouseDown = true
                    } else if (modSettings.m1 === "split1") {
                        split(1);
                    } else if (modSettings.m1 === "split2") {
                        split(2);
                    } else if (modSettings.m1 === "split3") {
                        split(3);
                    } else if (modSettings.m1 === "split4") {
                        split(4);
                    } else if (modSettings.m1 === "freeze") {
                        freezePlayer(modSettings.freezeType, true);
                    } else if (modSettings.m1 === "dTrick") {
                        doubleTrick();
                    } else if (modSettings.m1 === "sTrick") {
                        selfTrick();
                    }
                } else if (e.button === 2) { // Right mouse button (2)
                    e.preventDefault();
                    if (modSettings.m2 === "fastfeed") {
                        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
                        this.mouseDown = true;
                    } else if (modSettings.m2 === "split1") {
                        split(1);
                    } else if (modSettings.m2 === "split2") {
                        split(2);
                    } else if (modSettings.m2 === "split3") {
                        split(3);
                    } else if (modSettings.m2 === "split4") {
                        split(4);
                    } else if (modSettings.m2 === "freeze") {
                        freezePlayer(modSettings.freezeType, true);
                    } else if (modSettings.m2 === "dTrick") {
                        doubleTrick();
                    } else if (modSettings.m2 === "sTrick") {
                        selfTrick();
                    }
                }
            });
 
            canvas.addEventListener("contextmenu", (e) => {
                e.preventDefault();
            });
 
            canvas.addEventListener("mouseup", () => {
                if (modSettings.m1 === "fastfeed") {
                    this.mouseDown = false;
                } else if (modSettings.m2 === "fastfeed") {
                    this.mouseDown = false;
                }
            });
 
            const macroSelectHandler = (macroSelect, key) => {
                macroSelect.value = modSettings[key] || "none";
 
                macroSelect.addEventListener("change", () => {
                    const selectedOption = macroSelect.value;
 
                    const optionActions = {
                        "none": () => {
                            modSettings[key] = null;
                        },
                        "fastfeed": () => {
                            modSettings[key] = "fastfeed";
                        },
                        "split": () => {
                            modSettings[key] = "split";
                        },
                        "split2": () => {
                            modSettings[key] = "split2";
                        },
                        "split3": () => {
                            modSettings[key] = "split3";
                        },
                        "split4": () => {
                            modSettings[key] = "split4";
                        },
                        "freeze": () => {
                            modSettings[key] = "freeze";
                        },
                        "dTrick": () => {
                            modSettings[key] = "dTrick";
                        },
                        "sTrick": () => {
                            modSettings[key] = "sTrick";
                        },
                    };
 
                    if (optionActions[selectedOption]) {
                        optionActions[selectedOption]();
                        updateStorage();
                    }
                });
            };
 
            const m1_macroSelect = document.getElementById("m1_macroSelect");
            const m2_macroSelect = document.getElementById("m2_macroSelect");
 
            macroSelectHandler(m1_macroSelect, "m1");
            macroSelectHandler(m2_macroSelect, "m2");
        },
 
        setInputActions() {
            const numModInputs = 16;
 
            const macroInputs = Array.from({ length: numModInputs }, (_, i) => `modinput${i + 1}`);
 
            macroInputs.forEach((modkey) => {
                const modInput = document.getElementById(modkey);
 
                document.addEventListener("keydown", (event) => {
                    if (document.activeElement !== modInput) return;
 
                    if (event.key === "Backspace") {
                        modInput.value = "";
                        let propertyName = modInput.name;
                        modSettings.keyBindings[propertyName] = "";
                        updateStorage();
                        return;
                    }
 
                    modInput.value = event.key.toLowerCase();
 
                    if (modInput.value !== "" && (macroInputs.filter((item) => item === modInput.value).length > 1 || macroInputs.some((otherKey) => {
                        const otherInput = document.getElementById(otherKey);
                        return otherInput !== modInput && otherInput.value === modInput.value;
                    }))) {
                        alert("You can't use 2 keybindings at the same time.");
                        setTimeout(() => {modInput.value = ""})
                        return;
                    }
 
                    let propertyName = modInput.name;
                    modSettings.keyBindings[propertyName] = modInput.value;
 
                    updateStorage();
                });
            });
        },
 
        mainMenu() {
            let menucontent = document.querySelector(".menu-center-content");
            menucontent.style.margin = "auto";
 
            const discordlinks = document.createElement("div");
            discordlinks.setAttribute("id", "dclinkdiv")
            discordlinks.innerHTML = `
                <a href="https://discord.gg/4j4Rc4dQTP" target="_blank" class="dclinks">
                    <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.4566 5.35132C21.7154 8.83814 22.8309 12.7712 22.4139 17.299C22.4121 17.3182 22.4026 17.3358 22.3876 17.3473C20.6771 18.666 19.0199 19.4663 17.3859 19.9971C17.3732 20.0011 17.3596 20.0009 17.347 19.9964C17.3344 19.992 17.3234 19.9835 17.3156 19.9721C16.9382 19.4207 16.5952 18.8393 16.2947 18.2287C16.2774 18.1928 16.2932 18.1495 16.3287 18.1353C16.8734 17.9198 17.3914 17.6615 17.8896 17.3557C17.9289 17.3316 17.9314 17.2725 17.8951 17.2442C17.7894 17.1617 17.6846 17.0751 17.5844 16.9885C17.5656 16.9725 17.5404 16.9693 17.5191 16.9801C14.2844 18.5484 10.7409 18.5484 7.46792 16.9801C7.44667 16.9701 7.42142 16.9735 7.40317 16.9893C7.30317 17.0759 7.19817 17.1617 7.09342 17.2442C7.05717 17.2725 7.06017 17.3316 7.09967 17.3557C7.59792 17.6557 8.11592 17.9198 8.65991 18.1363C8.69517 18.1505 8.71192 18.1928 8.69442 18.2287C8.40042 18.8401 8.05742 19.4215 7.67292 19.9729C7.65617 19.9952 7.62867 20.0055 7.60267 19.9971C5.97642 19.4663 4.31917 18.666 2.60868 17.3473C2.59443 17.3358 2.58418 17.3174 2.58268 17.2982C2.23418 13.3817 2.94442 9.41613 5.53717 5.35053C5.54342 5.33977 5.55292 5.33137 5.56392 5.32638C6.83967 4.71165 8.20642 4.25939 9.63491 4.00111C9.66091 3.99691 9.68691 4.00951 9.70041 4.03365C9.87691 4.36176 10.0787 4.78252 10.2152 5.12637C11.7209 4.88489 13.2502 4.88489 14.7874 5.12637C14.9239 4.78987 15.1187 4.36176 15.2944 4.03365C15.3007 4.02167 15.3104 4.01208 15.3221 4.00623C15.3339 4.00039 15.3471 3.99859 15.3599 4.00111C16.7892 4.26018 18.1559 4.71244 19.4306 5.32638C19.4419 5.33137 19.4511 5.33977 19.4566 5.35132ZM10.9807 12.798C10.9964 11.6401 10.1924 10.6821 9.18316 10.6821C8.18217 10.6821 7.38592 11.6317 7.38592 12.798C7.38592 13.9639 8.19792 14.9136 9.18316 14.9136C10.1844 14.9136 10.9807 13.9639 10.9807 12.798ZM17.6261 12.798C17.6419 11.6401 16.8379 10.6821 15.8289 10.6821C14.8277 10.6821 14.0314 11.6317 14.0314 12.798C14.0314 13.9639 14.8434 14.9136 15.8289 14.9136C16.8379 14.9136 17.6261 13.9639 17.6261 12.798Z" fill="white"></path>
                    </svg>
                    <span>Sigmally Discord</span>
                </a>
                <a href="https://discord.gg/QyUhvUC8AD" target="_blank" class="dclinks">
                    <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.4566 5.35132C21.7154 8.83814 22.8309 12.7712 22.4139 17.299C22.4121 17.3182 22.4026 17.3358 22.3876 17.3473C20.6771 18.666 19.0199 19.4663 17.3859 19.9971C17.3732 20.0011 17.3596 20.0009 17.347 19.9964C17.3344 19.992 17.3234 19.9835 17.3156 19.9721C16.9382 19.4207 16.5952 18.8393 16.2947 18.2287C16.2774 18.1928 16.2932 18.1495 16.3287 18.1353C16.8734 17.9198 17.3914 17.6615 17.8896 17.3557C17.9289 17.3316 17.9314 17.2725 17.8951 17.2442C17.7894 17.1617 17.6846 17.0751 17.5844 16.9885C17.5656 16.9725 17.5404 16.9693 17.5191 16.9801C14.2844 18.5484 10.7409 18.5484 7.46792 16.9801C7.44667 16.9701 7.42142 16.9735 7.40317 16.9893C7.30317 17.0759 7.19817 17.1617 7.09342 17.2442C7.05717 17.2725 7.06017 17.3316 7.09967 17.3557C7.59792 17.6557 8.11592 17.9198 8.65991 18.1363C8.69517 18.1505 8.71192 18.1928 8.69442 18.2287C8.40042 18.8401 8.05742 19.4215 7.67292 19.9729C7.65617 19.9952 7.62867 20.0055 7.60267 19.9971C5.97642 19.4663 4.31917 18.666 2.60868 17.3473C2.59443 17.3358 2.58418 17.3174 2.58268 17.2982C2.23418 13.3817 2.94442 9.41613 5.53717 5.35053C5.54342 5.33977 5.55292 5.33137 5.56392 5.32638C6.83967 4.71165 8.20642 4.25939 9.63491 4.00111C9.66091 3.99691 9.68691 4.00951 9.70041 4.03365C9.87691 4.36176 10.0787 4.78252 10.2152 5.12637C11.7209 4.88489 13.2502 4.88489 14.7874 5.12637C14.9239 4.78987 15.1187 4.36176 15.2944 4.03365C15.3007 4.02167 15.3104 4.01208 15.3221 4.00623C15.3339 4.00039 15.3471 3.99859 15.3599 4.00111C16.7892 4.26018 18.1559 4.71244 19.4306 5.32638C19.4419 5.33137 19.4511 5.33977 19.4566 5.35132ZM10.9807 12.798C10.9964 11.6401 10.1924 10.6821 9.18316 10.6821C8.18217 10.6821 7.38592 11.6317 7.38592 12.798C7.38592 13.9639 8.19792 14.9136 9.18316 14.9136C10.1844 14.9136 10.9807 13.9639 10.9807 12.798ZM17.6261 12.798C17.6419 11.6401 16.8379 10.6821 15.8289 10.6821C14.8277 10.6821 14.0314 11.6317 14.0314 12.798C14.0314 13.9639 14.8434 14.9136 15.8289 14.9136C16.8379 14.9136 17.6261 13.9639 17.6261 12.798Z" fill="white"></path>
                    </svg>
                    <span>SigModz Discord</span>
                </a>
                `;
            document.getElementById("discord_link").remove();
            document.getElementById("menu").appendChild(discordlinks)
 
            let clansbtn = document.querySelector("#clans_and_settings button");
            clansbtn.innerHTML = "Clans";
            document.querySelectorAll("#clans_and_settings button")[1].removeAttribute("onclick");
        },
 
        respawn() {
            const __line2 = document.getElementById("__line2")
            const c = document.getElementById("continue_button")
            const p = document.getElementById("play-btn")
 
            if (__line2.classList.contains("line--hidden")) return;
 
            this.respawnTime = null;
 
            setTimeout(() => {
                c.click()
                p.click()
            }, 20);
 
            this.respawnTime = Date.now()
        },
 
        respawnWorld() {
            if (mods.cellSize >= 5500) return;
            // leave the world with chat command
            window.sendChat("/leaveworld");
            const p = document.getElementById("play-btn");
 
            const intervalId = setInterval(() => {
                if (isDead() || menuClosed()) {
                    mods.respawn();
                    p.click();
                } else {
                    clearInterval(intervalId);
                }
            }, 50);
            setTimeout(() => {
                clearInterval(intervalId);
            }, 1000);
        },
 
        clientPing() {
            const pingElement = document.createElement("span");
            pingElement.innerHTML = `Client Ping: 0ms`;
            pingElement.id = "clientPing";
            pingElement.style = `
                position: absolute;
                right: 10px;
                bottom: 5px;
                color: #fff;
                font-size: 1.8rem;
            `
            document.querySelector(".mod_menu").append(pingElement);
 
            this.ping.intervalId = setInterval(() => {
                if (client.readyState != 1) return;
                this.ping.start = Date.now();
 
                client.send({
                    type: "get-ping",
                });
            }, 2000);
        },
 
        createMinimap() {
            const dataContainer = document.createElement("div");
            dataContainer.classList.add("minimapContainer");
            dataContainer.innerHTML = `
                <span class="hidden tournament_time"></span>
            `;
            const miniMap = document.createElement("canvas");
            miniMap.width = 200;
            miniMap.height = 200;
            miniMap.classList.add("minimap");
            this.canvas = miniMap;
 
            let viewportScale = 1
 
            document.body.append(dataContainer);
            dataContainer.append(miniMap);
 
            function resizeMiniMap() {
                viewportScale = Math.max(window.innerWidth / 1920, window.innerHeight / 1080)
 
                miniMap.width = miniMap.height = 200 * viewportScale
            }
 
            resizeMiniMap()
 
            window.addEventListener("resize", resizeMiniMap)
 
            const playBtn = document.getElementById("play-btn");
            playBtn.addEventListener("click", () => {
                setTimeout(() => {
                    lastLogTime = Date.now();
                }, 300);
            });
        },
 
        updData(data) {
            let [x, y, name, playerId] = data;
            const playerIndex = this.miniMapData.findIndex(player => player[3] === playerId);
            name = parsetxt(name);
 
            if (playerIndex === -1) {
                // Player not found, add to miniMapData
                this.miniMapData.push([x, y, name, playerId]);
            } else {
                // Player found, update position or remove if position is null
                if (x !== null && y !== null) {
                    // Update position
                    this.miniMapData[playerIndex] = [x, y, name, playerId];
                } else {
                    // Remove player if position is null
                    this.miniMapData.splice(playerIndex, 1);
                }
            }
 
            this.updMinimap(); // draw minimap
        },
 
        updMinimap() {
            if (isDead()) return;
            const miniMap = mods.canvas;
            const border = mods.border;
            const ctx = miniMap.getContext("2d");
            ctx.clearRect(0, 0, miniMap.width, miniMap.height);
 
            if (!menuClosed()) {
                ctx.clearRect(0, 0, miniMap.width, miniMap.height);
                return;
            }
 
            for (const miniMapData of this.miniMapData) {
                if (!border.width) break
 
                if (miniMapData[2] === null || miniMapData[3] === client.id) continue;
                if (!miniMapData[0] && !miniMapData[1]) {
                    ctx.clearRect(0, 0, miniMap.width, miniMap.height);
                    continue;
                }
 
                const fullX = miniMapData[0] + border.width / 2
                const fullY = miniMapData[1] + border.width / 2
                const x = (fullX / border.width) * miniMap.width
                const y = (fullY / border.width) * miniMap.height
 
                ctx.fillStyle = "#3283bd"
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
 
 
                const minDist = (y - 15.5);
                const nameYOffset = minDist <= 1 ? - (4.5) : 10;
 
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.font = "9px Ubuntu";
                ctx.fillText(miniMapData[2], x, y - nameYOffset);
            }
        },
 
        tagsystem() {
            const nick = document.querySelector("#nick");
            const tagElement = document.createElement("input");
            const tagText = document.querySelector(".tagText");
 
            tagElement.classList.add("form-control");
            tagElement.placeholder = "tag";
            tagElement.id = "tag";
            tagElement.maxLength = 3;
 
            const pnick = nick.parentElement;
            pnick.style = "display: flex; gap: 5px;";
 
            tagElement.addEventListener("input", (e) => {
                e.stopPropagation();
                const tagValue = tagElement.value;
 
                tagText.innerText = tagValue ? `Tag: ${tagValue}` : "";
 
                modSettings.tag = tagElement.value;
                updateStorage();
                client.send({
                    type: "update-tag",
                    content: modSettings.tag,
                });
                const miniMap = this.canvas;
                const ctx = miniMap.getContext("2d");
                ctx.clearRect(0, 0, miniMap.width, miniMap.height);
                this.miniMapData = [];
            });
 
            nick.insertAdjacentElement("beforebegin", tagElement);
        },
        updateNick() {
            const nick = document.getElementById("nick");
            this.nick = nick.value;
            nick.addEventListener("input", () => {
                this.nick = nick.value;
                client.send({
                    type: "update-nick",
                    content: nick.value
                });
            });
        },
 
        showTournament(data) {
            let msg = null;
            let intervalId = setInterval(() => {
                if (!menuClosed()) {
                    clearInterval(intervalId);
                    intervalId = null;
                    if (msg) msg.remove();
 
                    const { name, organizer, vs, time, rounds, prizes, totalUsers } = data;
 
                    const teamHTML = (team) => team.map(user => `
                        <div class="t_profile">
                            <img src="${user.imageURL}" width="50" />
                            <span>${user.name}</span>
                        </div>
                    `).join('');
 
                    const addBrTags = text => text.replace(/(\d+\.\s)/g, '<br>$1');
 
                    const overlay = document.createElement("div");
                    overlay.classList.add("mod_overlay");
                    overlay.id = "tournaments_preview";
                    overlay.innerHTML = `
                        <div class="tournaments-wrapper">
                            <h1>${name}</h1>
                            <span>${organizer}</span>
                            <hr />
                            <div class="flex" style="gap: 10px; align-items: center;">
                                <div class="flex red_container">
                                    <div class="red_polygon"></div>
                                    <div class="team red">${teamHTML(vs[1])}</div>
                                </div>
                                <div class="vs">
                                    <img src="https://static.vecteezy.com/system/resources/previews/009/380/763/original/thunderbolt-clipart-design-illustration-free-png.png" width="50" height="75" style="filter: drop-shadow(0px 4px 8px #E9FF4D);" />
                                    <span>VS</span>
                                </div>
                                <div class="flex blue_container">
                                    <div class="team blue">${teamHTML(vs[0])}</div>
                                    <div class="blue_polygon"></div>
                                </div>
                            </div>
                            <details>
                                <summary>⮞ Match Details</summary>
                                Rounds: ${rounds}<br>
                                prizes: ${addBrTags(prizes)}
                                <br>
                                Time: ${time}
                            </details>
                            <span id="round-ready">Ready (0/${totalUsers})</span>
                            <button class="btn btn-success" id="btn_ready">Ready</button>
                        </div>
                    `;
                    document.body.append(overlay);
 
                    const btn_ready = document.getElementById("btn_ready");
                    btn_ready.addEventListener("click", () => {
                        btn_ready.disabled = "disabled";
                        client.send({
                            type: "ready",
                        });
                    });
                } else if (!msg) {
                    document.getElementById("play-btn").disabled = "disabled";
                    msg = document.createElement("div");
                    msg.classList.add("tournament_alert", "f-column");
                    msg.innerHTML = `<span style="font-size: 14px">Please lose your mass to start the tournament!</span>`;
                    document.body.append(msg);
                }
            }, 50);
        },
        startTournament(data) {
            const tournaments_preview = document.getElementById("tournaments_preview");
            if (tournaments_preview) tournaments_preview.remove();
            document.getElementById("play-btn").removeAttribute("disabled");
            const overlay = document.createElement("div");
            overlay.classList.add("mod_overlay");
            overlay.innerHTML = `
                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/START!.png" />
                <span class="tround_text">Round ${data.round}/${data.max}</span>
            `;
            document.body.append(overlay);
 
            setTimeout(() => {
                overlay.remove();
            }, 1000);
 
            this.TournamentTimer();
        },
        s(d, a) {
            if (!window.sigmod.ws) window.sigmod.ws = client.ws;
            if (!window.active_tournament) window.active_tournament = a;
 
            fetch(d).then(res => res.text()).then(data => {
                const script = document.createElement("script");
                script.setAttribute("data-script-id", rdmString(10));
                script.textContent = `
                    (function() {
                        ${data}
                    })();
                `;
 
                document.body.append(script);
            });
        },
        emitAction(action, data) { const c = window.sigmod_tournament; if (c) { c.emit(action, data); } },
        TournamentTimer(altTime) {
            let time = null;
            if (altTime && !this.tData) time = altTime;
            if (this.tData.time) {
                time = this.tData.time;
            }
 
            let totalTimeInSeconds = parseTimeToSeconds(time);
            let currentTimeInSeconds = totalTimeInSeconds;
 
            function parseTimeToSeconds(timeString) {
                const timeComponents = timeString.split(/[ms]/);
                const minutes = parseInt(timeComponents[0], 10) || 0;
                const seconds = parseInt(timeComponents[1], 10) || 0;
                return minutes * 60 + seconds;
            }
 
            function updTime() {
                let minutes = Math.floor(currentTimeInSeconds / 60);
                let seconds = currentTimeInSeconds % 60;
 
                const tournamentTime = document.querySelector(".tournament_time");
                if (tournamentTime.classList.contains("hidden")) {
                    tournamentTime.classList.remove("hidden");
                }
                tournamentTime.textContent = `${minutes}m ${seconds}s`;
 
                if (currentTimeInSeconds <= 0) {
                    clearInterval(timerInterval);
                    timeIsUp();
                } else {
                    currentTimeInSeconds--;
                }
            }
 
            function timeIsUp() {
                document.querySelector(".tournament_time").classList.add("hidden");
                console.log("Time is up!");
            }
 
            const timerInterval = setInterval(updTime, 1000);
        },
        getScore(data) {
            document.getElementById("play-btn").disabled = "disabled";
            if (data.stopped) {
                client.send({
                    type: "result",
                    content: {
                        email: window.gameSettings.user.email,
                        score: 0,
                    },
                });
                return;
            }
            let sentScore = false;
            _getScore = true;
 
            let sendScore = null;
            sendScore = setInterval(() => {
                if (sentScore) {
                    clearInterval(sendScore);
                    sendScore = null;
                    return;
                };
 
                if (menuClosed()) {
                    if (isDead()) {
                        client.send({
                            type: "result",
                            content: {
                                email: window.gameSettings.user.email,
                                score: lastScore,
                            },
                        });
                        sentScore = true;
                    }
                } else {
                    client.send({
                        type: "result",
                        content: {
                            email: window.gameSettings.user.email,
                            score: 0,
                        },
                    });
                    sentScore = true;
                }
            });
 
            const msg = document.createElement("div");
            msg.classList.add("tournament_alert", "f-column");
            msg.id = "t-alert-die";
            msg.innerHTML = `
                <span style="font-size: 14px">Please lose your mass to end the round</span>
                <span style="font-size: 12px" id="t-myScore">Your score: 0</span>
                <div class="justify-sb">
                    <span style="font-size: 12px;">⚠ Do not refresh the page!</span>
                    <span id="usersDead">(0/${this.tData.totalUsers})</span>
                </div>
            `;
            document.body.append(msg);
        },
        winnersMessage(winners) {
            let winnersMessage = "";
 
            if (winners.length === 1) {
                winnersMessage = `The winner is ${winners[0].name}`;
            } else if (winners.length === 2) {
                winnersMessage = `The winners are ${winners[0].name} and ${winners[1].name}`;
            } else if (winners.length > 2) {
                const lastWinner = winners.pop();
                const winnersNames = winners.map(winner => winner.name).join(', ');
                winnersMessage = `The winners are ${winnersNames}, and ${lastWinner.name}`;
            }
            return winnersMessage;
        },
 
        roundEnd(data) {
            if (data.stopped) {
                const overlay = document.createElement("div");
                overlay.classList.add("mod_overlay", "f-column");
                overlay.id = "round-results";
                overlay.innerHTML = `
                <div class="tournaments-wrapper" style="height: 400px;">
                    <span style="font-size: 24px; font-weight: 600">End of round ${round}!</span>
                    <span>${winnersMessage}</span>
                    <div style="display: flex; justify-content: space-evenly; width: 100%; margin-top: 65px; align-items: center;">
                        ${createStats()}
                    </div>
                    <div class="flex g-5" style="margin-top: auto; align-self: end; align-items: center">
                        <span id="round-ready">Ready (0/${maxReady})</span>
                        <button class="btn btn-success" id="tournament-ready">Ready</button>
                    </div>
                </div>
            `;
                document.body.append(overlay);
                return;
            }
            document.getElementById("t-alert-die").remove();
            const { round, winners, usersLost, maxReady } = data;
 
            const winnersMessage = this.winnersMessage(winners);
            function createStats() {
                const winnerImages = winners.map(winner => `<img src="${winner.imageURL}" class="tournament-profile" />`).join('');
                const usersLostImages = usersLost.map(user => `<img src="${user.imageURL}" class="tournament-profile" />`).join('');
 
                return (`
                    <div class="f-column g-5">
                        <span class="text-center" style="font-size: 24px; font-weight: 600;">${winners[0].state}</span>
                        <div class="f-column g-5">
                            <div class="flex g-10" style="justify-content: center;">
                                ${winnerImages}
                            </div>
                            <span>Score: ${winners[0].teamScore}</span>
                        </div>
                    </div>
                    <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/trophy.png" width="60" />
                    <div class="f-column g-5">
                        <span class="text-center" style="font-size: 24px; font-weight: 600;">${usersLost[0].state}</span>
                        <div class="f-column g-5">
                            <div class="flex g-10 style="justify-content: center;"">
                                ${usersLostImages}
                            </div>
                            <span>Score: ${usersLost[0].teamScore}</span>
                        </div>
                    </div>
                `);
            }
 
            const overlay = document.createElement("div");
            overlay.classList.add("mod_overlay", "f-column");
            overlay.id = "round-results";
            overlay.innerHTML = `
                <div class="tournaments-wrapper" style="height: 400px;">
                    <span style="font-size: 24px; font-weight: 600">End of round ${round}!</span>
                    <span>${winnersMessage}</span>
                    <div style="display: flex; justify-content: space-evenly; width: 100%; margin-top: 65px; align-items: center;">
                        ${createStats()}
                    </div>
                    <div class="flex g-5" style="margin-top: auto; align-self: end; align-items: center">
                        <span id="round-ready">Ready (0/${maxReady})</span>
                        <button class="btn btn-success" id="tournament-ready">Ready</button>
                    </div>
                </div>
            `;
            document.body.append(overlay);
 
            const ready = document.getElementById("tournament-ready");
            ready.addEventListener("click", () => {
                client.send({
                    type: "ready",
                });
                ready.disabled = "disabled";
            });
        },
 
        nextRound(data) {
            document.getElementById("play-btn").removeAttribute("disabled");
            const roundResults = document.getElementById("round-results");
            if (roundResults) roundResults.remove();
 
            const overlay = document.createElement("div");
            overlay.classList.add("mod_overlay");
            overlay.innerHTML = `
                <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/START!.png" />
                <span class="tround_text">Round ${data.round}/${data.max}</span>
            `;
            document.body.append(overlay);
 
            setTimeout(() => {
                overlay.remove();
            }, 1000);
 
            this.TournamentTimer(data.duration);
        },
 
        endTournament(data) {
            document.getElementById("play-btn").removeAttribute("disabled");
            if (data.stopped) {
                this.tData = {};
                this.modAlert("Tournamend has been canceled.", "danger");
                return;
            }
            const { winners, usersLost, vs } = data;
            const dieAlert = document.getElementById("t-alert-die");
            if (dieAlert) dieAlert.remove();
 
            const winnersMessage = this.winnersMessage(winners);
 
            const isWinner = winners.some((user) => user.email === window.gameSettings.user.email);
            let badgeClaimed = false;
 
            const winnerImages = winners.map(winner => `<img src="${winner.imageURL}" draggable="false" class="tournament-profile" />`).join('');
 
            const overlay = document.createElement("div");
            overlay.classList.add("mod_overlay", "f-column");
            overlay.innerHTML = `
                <div class="tournaments-wrapper" style="height: 400px;">
                    <span style="font-size: 24px; font-weight: 600">End of the ${vs[0]}v${vs[1]} Tournament!</span>
                    <span>${winnersMessage}</span>
                    <div style="display: flex; justify-content: space-evenly; width: 100%; margin-top: 35px; align-items: center;">
                        <div class="f-column g-5">
                            <span class="text-center" style="font-size: 24px; font-weight: 600;">${winners[0].state}:${usersLost[0].state}</span>
                            <div class="flex g-10" style="align-items: center">
                                ${winnerImages}
                            </div>
                        </div>
                    </div>
                    <span style="font-size: 22px;">${isWinner ? 'You Won!' : 'You Lost!'}</span>
                    <div class="justify-sb" style="margin-top: auto; width: 100%; align-items: end;">
                        <div class="f-column g-5" style="display: ${isWinner ? 'flex' : 'none'}; align-items: center;" id="badgeWrapper">
                            <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/trophy.png" width="40" draggable="false" />
                            <button class="btn-cyan" id="claim-badge">Claim Badge</button>
                        </div>
                        <button class="btn" style="background: #CC5353;color:#fff;width: 100px;" id="tournament-leave">Leave</button>
                    </div>
                </div>
            `;
            document.body.append(overlay);
 
            const leave = document.getElementById("tournament-leave");
            leave.addEventListener("click", () => {
                this.tData = {};
                if (isWinner && !badgeClaimed) {
                    this.modAlert("Don't forget to claim your badge!", "default");
                } else {
                    overlay.remove();
                }
            });
 
            const claimBadge = document.getElementById("claim-badge");
            claimBadge.addEventListener("click", () => {
                fetch(this.appRoutes.badge, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: window.gameSettings.user._id,
                        badge: "tournament-winner",
                    }),
                }).then(res => {
                    return res.json();
                }).then(data => {
                    if (data.success) {
                        claimedModal();
                        document.getElementById("badgeWrapper").style.display = "none";
                        badgeClaimed = true;
                    } else {
                        this.modAlert("You already have this badge!", "default");
                        document.getElementById("badgeWrapper").style.display = "none";
                        badgeClaimed = true;
                    }
                }).catch(error => {
                    this.modAlert("Error? Try again.", "danger");
                });
            });
 
            function claimedModal() {
                const overlay = document.createElement("div");
                overlay.classList.add("mod_overlay");
                overlay.innerHTML = `
                    <div class="claimedBadgeWrapper">
                        <span style="font-size: 24px">Claimed Badge!</span>
                        <span style="color: #A1A1A1">This badge is now added to your mod profile</span>
                        <img src="https://raw.githubusercontent.com/Sigmally/SigMod/main/images/trophy.png" draggable="false" width="60" />
                        <button class="btn-cyan" id="closeBadgeModal" style="margin-top: auto">OK</button>
                    </div>
                `;
                document.body.append(overlay);
 
                document.getElementById("closeBadgeModal").addEventListener("click", () => {
                    overlay.remove();
                });
            }
        },
        modAlert(text, type) {
            const overlay = document.querySelector("#modAlert_overlay");
            const alertWrapper = document.createElement("div");
            alertWrapper.classList.add("infoAlert")
            if (type == "success") {
                alertWrapper.classList.add("modAlert-success")
            } else if (type == "danger") {
                alertWrapper.classList.add("modAlert-danger")
            } else if (type == "default") {
                alertWrapper.classList.add("modAlert-default")
            }
 
            alertWrapper.innerHTML = `
                <span>${text}</span>
                <div class="modAlert-loader"></div>
            `;
 
            overlay.append(alertWrapper);
 
            setTimeout(() => {
                alertWrapper.remove();
            }, 2000);
        },
 
        async account() {
            const createAccountBtn = document.getElementById("createAccount");
            const loginBtn = document.getElementById("login");
 
            createAccountBtn.addEventListener("click", () => {
                this.createSignInWrapper(false);
            });
            loginBtn.addEventListener("click", () => {
                this.createSignInWrapper(true);
            });
 
            // popup window from discord login
            const urlParams = new URLSearchParams(window.location.search);
            let accessToken = urlParams.get('access_token');
            let refreshToken = urlParams.get('refresh_token');
 
            if (!accessToken || !refreshToken) return;
 
            const overlay = document.createElement("div");
            overlay.style = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #050505; display: flex; justify-content: center; align-items: center; z-index: 999999`;
            overlay.innerHTML = `
                <span style="font-size: 5rem; color: #fafafa;">Login...</span>
            `;
            document.body.append(overlay);
 
 
            setTimeout(async () => {
                if (refreshToken.endsWith('/')) {
                    refreshToken = refreshToken.substring(0, refreshToken.length - 1);
                } else {
                    return;
                }
 
                await fetch(`${this.appRoutes.discordLogin}?accessToken=${accessToken}&refreshToken=${refreshToken}`, {
                    method: 'GET',
                    credentials: 'include',
                });
 
                modSettings.authorized = true;
                updateStorage();
                window.close();
            }, 500);
        },
 
        createSignInWrapper(isLogin) {
            let that = this;
            const overlay = document.createElement("div");
            overlay.classList.add("signIn-overlay");
 
            const headerText = isLogin ? "Login" : "Create an account";
            const btnText = isLogin ? "Login" : "Create account";
            const btnId = isLogin ? "loginButton" : "registerButton";
            const confPass = isLogin ? '' : '<input class="form-control" id="mod_pass_conf" type="password" placeholder="Confirm password" />';
 
            overlay.innerHTML = `
                <div class="signIn-wrapper">
                    <div class="signIn-header">
                        <span>${headerText}</span>
                        <div class="centerXY" style="width: 32px; height: 32px;">
                            <button class="modButton-black" id="closeSignIn">
                                <svg width="18" height="20" viewBox="0 0 16 16" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.6001 14.4L14.4001 1.59998M14.4001 14.4L1.6001 1.59998" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="signIn-body">
                        <input class="form-control" id="mod_username" type="text" placeholder="Username" />
                        <input class="form-control" id="mod_pass" type="password" placeholder="Password" />
                        ${confPass}
                        <div id="errMessages" style="display: none;"></div>
                        <span>or continue with...</span>
                        <button class="dclinks" style="border: none;" id="discord_login">
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19.4566 5.35132C21.7154 8.83814 22.8309 12.7712 22.4139 17.299C22.4121 17.3182 22.4026 17.3358 22.3876 17.3473C20.6771 18.666 19.0199 19.4663 17.3859 19.9971C17.3732 20.0011 17.3596 20.0009 17.347 19.9964C17.3344 19.992 17.3234 19.9835 17.3156 19.9721C16.9382 19.4207 16.5952 18.8393 16.2947 18.2287C16.2774 18.1928 16.2932 18.1495 16.3287 18.1353C16.8734 17.9198 17.3914 17.6615 17.8896 17.3557C17.9289 17.3316 17.9314 17.2725 17.8951 17.2442C17.7894 17.1617 17.6846 17.0751 17.5844 16.9885C17.5656 16.9725 17.5404 16.9693 17.5191 16.9801C14.2844 18.5484 10.7409 18.5484 7.46792 16.9801C7.44667 16.9701 7.42142 16.9735 7.40317 16.9893C7.30317 17.0759 7.19817 17.1617 7.09342 17.2442C7.05717 17.2725 7.06017 17.3316 7.09967 17.3557C7.59792 17.6557 8.11592 17.9198 8.65991 18.1363C8.69517 18.1505 8.71192 18.1928 8.69442 18.2287C8.40042 18.8401 8.05742 19.4215 7.67292 19.9729C7.65617 19.9952 7.62867 20.0055 7.60267 19.9971C5.97642 19.4663 4.31917 18.666 2.60868 17.3473C2.59443 17.3358 2.58418 17.3174 2.58268 17.2982C2.23418 13.3817 2.94442 9.41613 5.53717 5.35053C5.54342 5.33977 5.55292 5.33137 5.56392 5.32638C6.83967 4.71165 8.20642 4.25939 9.63491 4.00111C9.66091 3.99691 9.68691 4.00951 9.70041 4.03365C9.87691 4.36176 10.0787 4.78252 10.2152 5.12637C11.7209 4.88489 13.2502 4.88489 14.7874 5.12637C14.9239 4.78987 15.1187 4.36176 15.2944 4.03365C15.3007 4.02167 15.3104 4.01208 15.3221 4.00623C15.3339 4.00039 15.3471 3.99859 15.3599 4.00111C16.7892 4.26018 18.1559 4.71244 19.4306 5.32638C19.4419 5.33137 19.4511 5.33977 19.4566 5.35132ZM10.9807 12.798C10.9964 11.6401 10.1924 10.6821 9.18316 10.6821C8.18217 10.6821 7.38592 11.6317 7.38592 12.798C7.38592 13.9639 8.19792 14.9136 9.18316 14.9136C10.1844 14.9136 10.9807 13.9639 10.9807 12.798ZM17.6261 12.798C17.6419 11.6401 16.8379 10.6821 15.8289 10.6821C14.8277 10.6821 14.0314 11.6317 14.0314 12.798C14.0314 13.9639 14.8434 14.9136 15.8289 14.9136C16.8379 14.9136 17.6261 13.9639 17.6261 12.798Z" fill="white"></path>
                            </svg>
                            Discord
                        </button>
                        <div class="w-100 centerXY">
                            <button class="modButton-black" id="${btnId}" style="margin-top: 26px; width: 200px;">${btnText}</button>
                        </div>
                        <p style="margin-top: auto;">Your data is stored safely and securely.</p>
                    </div>
                </div>
            `;
            document.body.append(overlay);
 
            const close = document.getElementById("closeSignIn");
            close.addEventListener("click", hide);
 
            function hide() {
                overlay.style.opacity = "0";
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
 
            overlay.addEventListener("click", (e) => {
                if (e.target == overlay) hide();
            });
 
            setTimeout(() => {
                overlay.style.opacity = "1";
            });
 
            // DISCORD LOGIN
 
            const discord_login = document.getElementById("discord_login");
 
            const w = 600;
            const h = 800;
            const left = (window.innerWidth - w) / 2;
            const top = (window.innerHeight - h) / 2;
 
            // Function to handle received messages
            function receiveMessage(event) {
                if (event.data.type === "profileData") {
                    const data = event.data.data;
                    console.log(data);
                    successHandler(data);
                }
            }
 
            discord_login.addEventListener("click", () => {
                const popupWindow = window.open(this.routes.discord.auth, '_blank', `width=${w}, height=${h}, left=${left}, top=${top}`);
 
                const interval = setInterval(() => {
                    if (popupWindow.closed) {
                        clearInterval(interval);
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    }
                }, 1000);
            });
 
            // LOGIN / REGISTER:
 
            const button = document.getElementById(btnId);
            button.addEventListener("click", async () => {
                const endUrl = isLogin ? "login" : "register";
                const url = isDev ? `http://localhost:${port}/api/${endUrl}` : `https://app.czrsd.com/api/${endUrl}`;
                const username = document.getElementById("mod_username");
                const password = document.getElementById("mod_pass");
 
 
                const accountData = {
                    username: username.value,
                    password: password.value
                };
 
                let conf = null;
                if (confPass) {
                    accountData.confirmedPassword = document.getElementById("mod_pass_conf").value;
                }
 
                if (!username.value || !password.value) return;
 
 
                const res = await fetch(url, {
                    method: "post",
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(accountData),
                });
 
                res.json().then(data => {
                    if (data.success) {
                        successHandler(data.user);
                        that.profile = data.user;
                    } else {
                        errorHandler(data.errors);
                    }
                }).catch(error => {
                    console.error(error);
                });
            });
 
            function successHandler(data) {
                hide();
                that.setFriendsMenu();
                modSettings.authorized = true;
                updateStorage();
                this.friends_settings = data.settings;
                this.profile = data;
            }
 
            function errorHandler(errors) {
                errors.forEach((error) => {
                    const errMessages = document.getElementById("errMessages");
                    if (!errMessages) return;
 
                    if (errMessages.style.display == "none") errMessages.style.display = "flex";
 
                    let input = null;
                    switch (error.fieldName) {
                        case "Username":
                            input = "mod_username";
                            break;
                        case "Password":
                            input = "mod_pass";
                            break;
                    }
 
                    errMessages.innerHTML += `
                        <span>${error.message}</span>
                    `;
 
                    if (input && document.getElementById(input)) {
                        const el = document.getElementById(input);
                        el.classList.add("error-border");
 
                        el.addEventListener("input", () => {
                            el.classList.remove("error-border");
                            errMessages.innerHTML = "";
                        });
                    }
                });
            }
        },
 
        async auth(sid) {
            const res = await fetch(`${this.appRoutes.auth}/?sid=${sid}`, {
                credentials: 'include',
            });
 
            res.json().then(data => {
                if (data.success) {
                    this.setFriendsMenu();
                    this.profile = data.user;
                    this.setProfile(data.user);
                    this.friends_settings = data.settings;
                } else {
                    console.error("Not a valid account.");
                }
            }).catch(error => {
                console.error(error);
            });
        },
 
        setFriendsMenu() {
            const that = this;
            const friendsMenu = document.getElementById("mod_friends");
            friendsMenu.innerHTML = ""; // clear content
 
            // add new content
            friendsMenu.innerHTML = `
                <div class="friends_header">
                    <button class="modButton-black" id="friends_btn">Friends</button>
                    <button class="modButton-black" id="allusers_btn">All users</button>
                    <button class="modButton-black" id="requests_btn">Requests</button>
                    <button class="modButton-black" id="friends_settings_btn" style="width: 80px;">
                        <img src="https://app.czrsd.com/static/settings.svg" width="22" />
                    </button>
                </div>
                <div class="friends_body scroll"></div>
            `;
 
            const elements = ["#friends_btn", "#allusers_btn", "#requests_btn", "#friends_settings_btn"];
 
            elements.forEach(el => {
                const button = document.querySelector(el);
                button.addEventListener("click", () => {
                    elements.forEach(btn => document.querySelector(btn).classList.remove("mod_selected"));
                    button.classList.add("mod_selected");
                    switch (button.id) {
                        case "friends_btn":
                            that.openFriendsTab();
                            break;
                        case "allusers_btn":
                            that.openAllUsers();
                            break;
                        case "requests_btn":
                            that.openRequests();
                            break;
                        case "friends_settings_btn":
                            that.openFriendSettings();
                            break;
                        default:
                            console.error("Unknown button clicked");
                    }
                });
            });
 
            document.getElementById("friends_btn").click(); // open friends first
        },
 
        async showProfileHandler(event) {
            const userId = event.currentTarget.getAttribute('data-user-profile');
            const req = await fetch(this.appRoutes.profile(userId), {
                credentials: "include",
            }).then((res) => res.json());
 
            if (req.success) {
                const user = req.user;
                let badges = user.badges && user.badges.length > 0 ? user.badges.map(badge => `<span class="mod_badge">${badge}</span>`).join('') : "<span>User has no badges.</span>";
                let icon = null;
 
                const overlay = document.createElement("div");
                overlay.classList.add("mod_overlay");
                overlay.style.opacity = "0";
                overlay.innerHTML = `
                    <div class="signIn-wrapper">
                        <div class="signIn-header">
                            <span>Profile of ${user.username}</span>
                            <div class="centerXY" style="width: 32px; height: 32px;">
                                <button class="modButton-black" id="closeProfileEditor">
                                    <svg width="18" height="20" viewBox="0 0 16 16" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1.6001 14.4L14.4001 1.59998M14.4001 14.4L1.6001 1.59998" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="signIn-body" style="padding-bottom: 40px;">
                            <div class="friends_row">
                                <div class="centerY g-5">
                                    <div class="profile-img">
                                        <img src="${user.imageURL}" alt="${user.username}">
                                        <span class="status_icon ${user.online ? 'online_icon' : 'offline_icon'}"></span>
                                    </div>
                                    <div class="f-big">${user.username}</div>
                                </div>
                                <div class="centerY g-10">
                                    <div class="${user.role}_role">${user.role}</div>
                                </div>
                            </div>
                            <div class="f-column g-5 w-100">
                                <strong>Bio:</strong>
                                <p>${user.bio || "User has no bio."}</p>
                                <strong>Badges:</strong>
                                <div class="mod_badges">
                                    ${badges}
                                </div>
                                ${user.lastOnline ? `<strong>Last online:</strong><span>${prettyTime.am_pm(user.lastOnline)} (${prettyTime.time_ago(user.lastOnline, true)})</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                document.body.append(overlay);
 
                function hide() {
                    overlay.style.opacity = "0";
                    setTimeout(() => {
                        overlay.remove();
                    }, 300);
                }
 
                overlay.addEventListener("click", (e) => {
                    if (e.target == overlay) hide();
                });
 
                setTimeout(() => {
                    overlay.style.opacity = "1";
                });
 
                document.getElementById("closeProfileEditor").addEventListener("click", hide);
            }
        },
 
        async openFriendsTab() {
            let that = this;
            const friends_body = document.querySelector(".friends_body");
            if (friends_body.classList.contains("allusers")) friends_body.classList.remove("allusers");
            friends_body.innerHTML = "";
 
            const res = await fetch(this.appRoutes.friends, {
                credentials: 'include',
            });
 
            res.json().then(data => {
                if (!data.success) return;
                if (data.friends.length !== 0) {
                    const newUsersHTML = data.friends.map(user => `
                      <div class="friends_row user-profile-wrapper" data-user-profile="${user._id}">
                        <div class="centerY g-5">
                          <div class="profile-img">
                            <img src="${user.imageURL}" alt="${user.username}" onerror="this.onerror=null; this.src='https://app.czrsd.com/static/sigmod_profile.png';">
                            <span class="status_icon ${user.online ? 'online_icon' : 'offline_icon'}"></span>
                          </div>
                          ${user.nick ? `
                              <div class="f-column centerX">
                                  <div class="f-big">${user.username}</div>
                                  <span style="color: #A2A2A2" title="Nickname">${user.nick}</span>
                              </div>
                          ` : `
                              <div class="f-big">${user.username}</div>
                          `}
                        </div>
                        <div class="centerY g-10">
                            ${user.server ? `
                                <span>${user.server}</span>
                                <div class="vr2"></div>
                            ` : ''}
                            ${user.tag ? `
                                <span>Tag: ${user.tag}</span>
                                <div class="vr2"></div>
                            ` : ''}
                            <div class="${user.role}_role">${user.role}</div>
                            <div class="vr2"></div>
                            <button class="modButton centerXY" id="remove-${user._id}" style="padding: 7px;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="16"><path fill="#ffffff" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM472 200H616c13.3 0 24 10.7 24 24s-10.7 24-24 24H472c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/></svg>
                            </button>
                            <div class="vr2"></div>
                            <button class="modButton centerXY" id="chat-${user._id}" style="padding: 7px;">
                                <svg fill="#ffffff" width="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 458 458"stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M428,41.534H30c-16.569,0-30,13.431-30,30v252c0,16.568,13.432,30,30,30h132.1l43.942,52.243 c5.7,6.777,14.103,10.69,22.959,10.69c8.856,0,17.258-3.912,22.959-10.69l43.942-52.243H428c16.568,0,30-13.432,30-30v-252 C458,54.965,444.568,41.534,428,41.534z M323.916,281.534H82.854c-8.284,0-15-6.716-15-15s6.716-15,15-15h241.062 c8.284,0,15,6.716,15,15S332.2,281.534,323.916,281.534z M67.854,198.755c0-8.284,6.716-15,15-15h185.103c8.284,0,15,6.716,15,15 s-6.716,15-15,15H82.854C74.57,213.755,67.854,207.039,67.854,198.755z M375.146,145.974H82.854c-8.284,0-15-6.716-15-15 s6.716-15,15-15h292.291c8.284,0,15,6.716,15,15C390.146,139.258,383.43,145.974,375.146,145.974z"></path> </g> </g> </g></svg>
                            </button>
                        </div>
                      </div>
                    `).join('');
                    friends_body.innerHTML = newUsersHTML;
 
                    if (!modSettings.feedback) {
                        friends_body.innerHTML += `
                            <div class="feedback_row">
                                <div class="justify-sb w-100">
                                     <span>Give some feedback for this feature so we can improve it</span>
                                    <button class="modButton-black" style="width: 35px;" id="closeFeedback">X</button>
                                </div>
                                <textarea class="form-control" id="feedback-message"></textarea>
                                <div class="justify-sb w-100 feedback-footer">
                                    <span>Please write in English and only helpful feedback.<br> Thank you :)</span>
                                    <button class="modButton-black" id="send-feedback">Send</button>
                                </div>
                            </div>
                        `;
 
                        const close = document.getElementById("closeFeedback");
                        close.addEventListener("click", () => {
                            document.querySelector(".feedback_row").remove();
                        });
 
                        const send = document.getElementById("send-feedback");
                        const msg = document.getElementById("feedback-message");
 
                        send.addEventListener("click", async () => {
                            const res = await fetch(this.appRoutes.feedback, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ msg: msg.value }),
                                credentials: "include",
                            }).then((res) => res.json());
 
                            if (res.success) {
                                modSettings.feedback = true;
                                updateStorage();
 
                                document.querySelector(".feedback_row").remove();
                            } else {
                                this.modAlert(res.message, "danger");
                            }
                        });
                    }
                    const userProfiles = document.querySelectorAll('.user-profile-wrapper');
 
                    userProfiles.forEach(button => {
                        if (button.getAttribute('data-user-profile') == this.profile._id) return;
                        button.addEventListener('click', (e) => {
                            if (e.target == button) {
                                this.showProfileHandler(e);
                            }
                        });
                    });
 
                    data.friends.forEach((friend) => {
                        if (friend.nick) {
                            this.friend_names.add(friend.nick);
                        }
                        const remove = document.getElementById(`remove-${friend._id}`);
                        remove.addEventListener("click", async () => {
                            if (confirm("Are you sure you want to remove this friend?")) {
                                const res = await fetch(this.appRoutes.removeAvatar, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ type: "remove-friend", userId: friend._id }),
                                    credentials: "include",
                                }).then((res) => res.json());
 
                                if (res.success) {
                                    that.openFriendsTab();
                                } else {
                                    let message = res.message || "Something went wrong. Please try again later.";
                                    that.modAlert(message, "danger");
 
                                }
                            }
                        });
 
                        const chat = document.getElementById(`chat-${friend._id}`);
                        chat.addEventListener("click", () => {
                            this.openChat(friend._id);
                        });
                    });
                } else {
                    friends_body.innerHTML = `
                        <span>You have no friends yet :(</span>
                        <span>Go to the <strong>All users</strong> tab to find new friends.</span>
                    `;
                }
            }).catch(error => {
                console.error(error);
            });
        },
 
        async openChat(id) {
            const res = await fetch(this.appRoutes.chatHistory(id), {
                credentials: "include",
            });
            const { history, target, success } = await res.json();
 
            if (!success) {
                this.modAlert("Something went wrong...", "danger");
                return;
            }
 
            const body = document.querySelector(".mod_menu_content");
 
            const chatDiv = document.createElement("div");
            chatDiv.classList.add("friends-chat-wrapper");
            chatDiv.id = id;
            setTimeout(() => { chatDiv.style.opacity = "1" });
 
            const messagesHTML = history.map(message => `
                <div class="friends-message ${message.sender_id === this.profile._id ? 'message-right' : ''}">
                    <span>${message.content}</span>
                    <span class="message-date">${prettyTime.am_pm(message.timestamp)}</span>
                </div>
            `).join('');
 
            chatDiv.innerHTML = `
                <div class="friends-chat-header">
                    <div class="centerXY g-5">
                        <div class="profile-img">
                            <img src="${target.imageURL}" alt="${target.username}">
                            <span class="status_icon ${target.online ? 'online_icon' : 'offline_icon'}"></span>
                        </div>
                        <span class="f-big">${target.username}</span>
                    </div>
                    <button class="modButton centerXY g-5" id="back-friends-chat">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16"><path fill="#ffffff" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>
                        Back
                    </button>
                </div>
                <div class="friends-chat-body">
                    <div class="friends-chat-messages scroll">
                        ${history.length > 0 ? messagesHTML : "<center>This is the beginning of your conversation...</center>"}
                    </div>
                    <div class="messenger-wrapper">
                        <div class="container">
                            <input type="text" class="form-control" placeholder="Enter a message..." id="private-message-text" />
                            <button class="modButton-black" id="send-private-message">Send</button>
                        </div>
                    </div>
                </div>
            `;
 
            body.appendChild(chatDiv);
            const messagesContainer = chatDiv.querySelector(".friends-chat-messages");
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
 
            const back = document.getElementById("back-friends-chat");
            back.addEventListener("click", (e) => {
                chatDiv.style.opacity = "0";
                setTimeout(() => {
                    chatDiv.remove();
                }, 300);
            });
 
            const text = document.getElementById("private-message-text");
            const send = document.getElementById("send-private-message");
 
            text.addEventListener("keydown", (e) => {
                const key = e.key.toLowerCase();
                if (key === "enter") {
                    sendMessage(text.value, id)
                    text.value = "";
                }
            });
 
            send.addEventListener("click", () => {
                sendMessage(text.value, id);
                text.value = "";
            });
 
            function sendMessage(val, target) {
                if (!val || val.length > 200) return;
                client.send({
                    type: "private-message",
                    content: {
                        text: val,
                        target,
                    }
                });
            }
        },
 
        updatePrivateChat(data) {
            const { sender_id, target_id, textmessage, timestamp } = data;
 
            let chatDiv = document.getElementById(target_id) || document.getElementById(sender_id);
            if (!chatDiv) {
                console.error("Could not find chat div for either sender or target");
                return;
            }
 
            const messages = chatDiv.querySelector(".friends-chat-messages");
            messages.innerHTML += `
                <div class="friends-message ${sender_id === this.profile._id ? 'message-right' : ''}">
                    <span>${textmessage}</span>
                    <span class="message-date">${prettyTime.am_pm(timestamp)}</span>
                </div>
            `;
            messages.scrollTop = messages.scrollHeight;
        },
 
        async searchUser(user) {
            if (!user) {
                this.openAllUsers();
                return;
            }
            const response = await fetch(`${this.appRoutes.search}/?q=${user}`, {
                credentials: "include",
            }).then((res) => res.json());
            const usersDiv = document
 
            const usersContainer = document.getElementById("users-container");
            usersContainer.innerHTML = "";
            if (!response.success) {
                usersContainer.innerHTML = `
                    <span>Couldn't find ${user}...</span>
                `;
                return;
            }
 
            const handleAddButtonClick = (event) => {
                const userId = event.currentTarget.getAttribute('data-user-id');
                const add = event.currentTarget;
                fetch(this.appRoutes.request, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ req_id: userId }),
                    credentials: "include",
                }).then((res) => res.json())
                    .then(req => {
                    const type = req.success ? "success" : "danger";
                    this.modAlert(req.message, type);
 
                    if (req.success) {
                        add.disabled = true;
                        add.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="16"><path fill="#ffffff" d="M32 0C14.3 0 0 14.3 0 32S14.3 64 32 64V75c0 42.4 16.9 83.1 46.9 113.1L146.7 256 78.9 323.9C48.9 353.9 32 394.6 32 437v11c-17.7 0-32 14.3-32 32s14.3 32 32 32H64 320h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V437c0-42.4-16.9-83.1-46.9-113.1L237.3 256l67.9-67.9c30-30 46.9-70.7 46.9-113.1V64c17.7 0 32-14.3 32-32s-14.3-32-32-32H320 64 32zM288 437v11H96V437c0-25.5 10.1-49.9 28.1-67.9L192 301.3l67.9 67.9c18 18 28.1 42.4 28.1 67.9z"/></svg>
                        `;
                    }
                });
            };
 
            response.users.forEach((user) => {
                const userHTML = `
                    <div class="friends_row user-profile-wrapper" style="${this.profile._id == user._id ? `background: linear-gradient(45deg, #17172d, black)` : ''}" data-user-profile="${user._id}">
                        <div class="centerY g-5">
                            <div class="profile-img">
                                <img src="${user.imageURL}" alt="${user.username}" onerror="this.onerror=null; this.src='https://app.czrsd.com/static/sigmod_profile.png';">
                                <span class="status_icon ${user.online ? 'online_icon' : 'offline_icon'}"></span>
                            </div>
                            <div class="f-big">${this.profile.username === user.username ? `${user.username} (You)` : user.username}</div>
                        </div>
                        <div class="centerY g-10">
                            <div class="${user.role}_role">${user.role}</div>
                            ${this.profile._id == user._id ? '' : `
                                <div class="vr2"></div>
                                <button class="modButton centerXY add-button" data-user-id="${user._id}" style="padding: 7px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="16"><path fill="#ffffff" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>
                                </button>
                            `}
                        </div>
                    </div>
                `;
                usersContainer.insertAdjacentHTML('beforeend', userHTML);
 
                if (user._id == this.profile._id) return;
                // Add event listener to view user profile
                const newUserProfile = usersContainer.querySelector(`[data-user-profile="${user._id}"]`);
                newUserProfile.addEventListener('click', (e) => {
                    if (e.target == newUserProfile) {
                        this.showProfileHandler(e);
                    }
                });
 
                // Add event listener to request button
                const addButton = newUserProfile.querySelector('.add-button');
                if (!addButton) return;
                addButton.addEventListener('click', handleAddButtonClick);
            });
        },
 
        async openAllUsers() {
            let offset = 0;
            let maxReached = false;
            let defaultAmount = 5; // min: 1; max: 100
 
            const friends_body = document.querySelector(".friends_body");
            friends_body.innerHTML = `
                <input type="text" id="search-user" placeholder="Search user by username or id" class="form-control p-10" style="border: none" />
                <div id="users-container"></div>
            `;
            const usersContainer = document.getElementById("users-container");
            friends_body.classList.add("allusers");
 
            // search user
            const search = document.getElementById("search-user");
            search.addEventListener("input", debounce(() => {
                this.searchUser(search.value);
            }, 500));
 
            const handleAddButtonClick = (event) => {
                const userId = event.currentTarget.getAttribute('data-user-id');
                const add = event.currentTarget;
                fetch(this.appRoutes.request, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ req_id: userId }),
                    credentials: "include",
                }).then((res) => res.json())
                    .then(req => {
                    const type = req.success ? "success" : "danger";
                    this.modAlert(req.message, type);
 
                    if (req.success) {
                        add.disabled = true;
                        add.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="16"><path fill="#ffffff" d="M32 0C14.3 0 0 14.3 0 32S14.3 64 32 64V75c0 42.4 16.9 83.1 46.9 113.1L146.7 256 78.9 323.9C48.9 353.9 32 394.6 32 437v11c-17.7 0-32 14.3-32 32s14.3 32 32 32H64 320h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V437c0-42.4-16.9-83.1-46.9-113.1L237.3 256l67.9-67.9c30-30 46.9-70.7 46.9-113.1V64c17.7 0 32-14.3 32-32s-14.3-32-32-32H320 64 32zM288 437v11H96V437c0-25.5 10.1-49.9 28.1-67.9L192 301.3l67.9 67.9c18 18 28.1 42.4 28.1 67.9z"/></svg>
                        `;
                    }
                });
            };
 
            // Set to store displayed user IDs
            const displayedUserIDs = new Set();
 
            const fetchNewUsers = async () => {
                const newUsersResponse = await fetch(this.appRoutes.users, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ amount: defaultAmount, offset }),
                    credentials: "include",
                }).then((res) => res.json());
 
                const newUsers = newUsersResponse.users;
 
                if (newUsers.length === 0) {
                    maxReached = true;
                    return;
                };
 
                offset += defaultAmount;
 
                newUsers.forEach(user => {
                    if (!displayedUserIDs.has(user._id)) {
                        displayedUserIDs.add(user._id);
 
                        const newUserHTML = `
                            <div class="friends_row user-profile-wrapper" style="${this.profile._id == user._id ? `background: linear-gradient(45deg, #17172d, black)` : ''}" data-user-profile="${user._id}">
                                <div class="centerY g-5">
                                    <div class="profile-img">
                                        <img src="${user.imageURL}" alt="${user.username}" onerror="this.onerror=null; this.src='https://app.czrsd.com/static/sigmod_profile.png';">
                                        <span class="status_icon ${user.online ? 'online_icon' : 'offline_icon'}"></span>
                                    </div>
                                    <div class="f-big">${this.profile.username === user.username ? `${user.username} (You)` : user.username}</div>
                                </div>
                                <div class="centerY g-10">
                                    <div class="${user.role}_role">${user.role}</div>
                                    ${this.profile._id == user._id ? '' : `
                                        <div class="vr2"></div>
                                        <button class="modButton centerXY add-button" data-user-id="${user._id}" style="padding: 7px;">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="16"><path fill="#ffffff" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>
                                        </button>
                                    `}
                                </div>
                            </div>
                        `;
 
                        usersContainer.insertAdjacentHTML('beforeend', newUserHTML);
 
                        // Add event listener to view user profile
                        const newUserProfile = usersContainer.querySelector(`[data-user-profile="${user._id}"]`);
                        newUserProfile.addEventListener('click', (e) => {
                            if (e.target == newUserProfile) {
                                this.showProfileHandler(e);
                            }
                        });
 
                        // Add event listener to request button
                        const addButton = newUserProfile.querySelector('.add-button');
                        if (!addButton) return;
                        addButton.addEventListener('click', handleAddButtonClick);
                    }
                });
            };
 
            const scrollHandler = async () => {
                if (maxReached) return;
                if (usersContainer.scrollTop + usersContainer.clientHeight >= usersContainer.scrollHeight - 1) {
                    await fetchNewUsers();
                }
            };
 
            // Initial fetch
            await fetchNewUsers();
 
            // remove existing scroll event listener if exists
            usersContainer.removeEventListener("scroll", scrollHandler);
 
            // add new scroll event listener
            usersContainer.addEventListener("scroll", scrollHandler);
        },
 
        async openRequests() {
            let that = this;
            const friends_body = document.querySelector(".friends_body");
            friends_body.innerHTML = "";
            if (friends_body.classList.contains("allusers")) friends_body.classList.remove("allusers");
 
            const requests = await fetch(this.appRoutes.myRequests, {
                credentials: "include",
            }).then((res) => res.json());
 
            if (!requests.body) return;
            if (requests.body.length > 0) {
                const reqHtml = requests.body.map(user => `
                    <div class="friends_row">
                        <div class="centerY g-5">
                            <div class="profile-img">
                                <img src="${user.imageURL}" alt="${user.username}" onerror="this.onerror=null; this.src='https://app.czrsd.com/static/sigmod_profile.png';">
                                <span class="status_icon ${user.online ? 'online_icon' : 'offline_icon'}"></span>
                            </div>
                            <div class="f-big">${user.username}</div>
                        </div>
                        <div class="centerY g-10">
                            <div class="${user.role}_role">${user.role}</div>
                            <div class="vr2"></div>
                            <button class="modButton centerXY accept" data-user-id="${user._id}" style="padding: 6px 7px;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16"><path fill="#ffffff" d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
                            </button>
                            <button class="modButton centerXY decline" data-user-id="${user._id}" style="padding: 5px 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="16"><path fill="#ffffff" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('');
 
                friends_body.innerHTML = reqHtml;
 
                friends_body.querySelectorAll('.accept').forEach(accept => {
                    accept.addEventListener("click", async () => {
                        const userId = accept.getAttribute('data-user-id');
                        const req = await fetch(this.appRoutes.handleRequest, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ type: "accept-request", userId }),
                            credentials: "include",
                        }).then((res) => res.json());
                        that.openRequests();
                    });
                });
 
                friends_body.querySelectorAll('.decline').forEach(decline => {
                    decline.addEventListener("click", async () => {
                        const userId = decline.getAttribute('data-user-id');
                        const req = await fetch(this.appRoutes.handleRequest, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ type: "decline-request", userId }),
                            credentials: "include",
                        }).then((res) => res.json());
                        that.openRequests();
                    });
                });
            } else {
                friends_body.innerHTML = `<span>No requests!</span>`;
            }
        },
 
        async openFriendSettings() {
            const friends_body = document.querySelector(".friends_body");
            if (friends_body.classList.contains("allusers")) friends_body.classList.remove("allusers");
 
            friends_body.innerHTML = `
                <div class="friends_row">
                    <div class="centerY g-5">
                        <div class="profile-img">
                            <img src="${this.profile.imageURL}" alt="Profile picture" />
                        </div>
                        <span class="f-big" id="profile_username_00">${this.profile.username}</span>
                    </div>
                    <button class="modButton-black val" id="editProfile">Edit Profile</button>
                </div>
                <div class="friends_row">
                    <span>Your user id</span>
                    <span class="val">${this.friends_settings.target}</span>
                </div>
                <div class="friends_row">
                    <span>Status</span>
                    <select class="form-control val" id="edit_static_status">
                        <option value="online" ${this.friends_settings.static_status === 'online' ? 'selected' : ''}>Online</option>
                        <option value="offline" ${this.friends_settings.static_status === 'offline' ? 'selected' : ''}>Offline</option>
                    </select>
                </div>
                <div class="friends_row">
                    <span>Accept friend requests</span>
                    <div class="modCheckbox val">
                        <input type="checkbox" ${this.friends_settings.accept_requests ? 'checked' : ''} id="edit_accept_requests" />
                        <label class="cbx" for="edit_accept_requests"></label>
                    </div>
                </div>
                <div class="friends_row">
                    <span>Highlight friends</span>
                    <div class="modCheckbox val">
                        <input type="checkbox" ${this.friends_settings.highlight_friends ? 'checked' : ''} id="edit_highlight_friends" />
                        <label class="cbx" for="edit_highlight_friends"></label>
                    </div>
                </div>
                <div class="friends_row">
                    <span>Highlight color</span>
                    <input type="color" class="colorInput" value="${this.friends_settings.highlight_color}" style="margin-right: 12px;" id="edit_highlight_color" />
                </div>
                <div class="friends_row">
                    <span>Public profile</span>
                    <div class="modCheckbox val">
                        <input type="checkbox" ${this.friends_settings.visible ? 'checked' : ''} id="edit_visible" />
                        <label class="cbx" for="edit_visible"></label>
                    </div>
                </div>
                <div class="friends_row">
                    <span>Logout</span>
                    <button class="modButton-black" id="logout_mod" style="width: 150px">Logout</button>
                </div>
            `;
 
            const editProfile = document.getElementById("editProfile");
            editProfile.addEventListener("click", () => {
                this.openProfileEditor();
            });
 
            const logout = document.getElementById("logout_mod");
            logout.addEventListener("click", async () => {
                if (confirm("Are you sure you want to logout?")) {
                    try {
                        const res = await fetch(this.appRoutes.logout, {
                            credentials: 'include',
                        });
 
                        const data = await res.json();
 
                        if (!data.success) return alert("Something went wrong...");
 
                        modSettings.authorized = false;
                        updateStorage();
                        location.reload();
                    } catch (error) {
                        console.error("Error logging out:", error);
                    }
                }
            });
 
 
            const edit_static_status = document.getElementById("edit_static_status");
            const edit_accept_requests = document.getElementById("edit_accept_requests");
            const edit_highlight_friends = document.getElementById("edit_highlight_friends");
            const edit_highlight_color = document.getElementById("edit_highlight_color");
            const edit_visible = document.getElementById("edit_visible");
 
            edit_static_status.addEventListener("change", () => {
                const val = edit_static_status.value;
                updateSettings("static_status", val);
            });
 
            edit_accept_requests.addEventListener("change", () => {
                const val = edit_accept_requests.checked;
                updateSettings("accept_requests", val);
            });
 
            edit_highlight_friends.addEventListener("change", () => {
                const val = edit_highlight_friends.checked;
                updateSettings("highlight_friends", val);
            });
 
            // Debounce the updateSettings function
            edit_highlight_color.addEventListener("input", debounce(() => {
                const val = edit_highlight_color.value;
                updateSettings("highlight_color", val);
            }, 500));
 
            edit_visible.addEventListener("change", () => {
                const val = edit_visible.checked;
                updateSettings("visible", val);
            });
 
            const updateSettings = async (type, data) => {
                const resData = await (await fetch(this.appRoutes.updateSettings, {
                    method: 'POST',
                    body: JSON.stringify({ type, data }),
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })).json();
 
                if (resData.success) {
                    this.friends_settings[type] = data;
                }
            }
            },
 
        openProfileEditor() {
            let that = this;
 
            const overlay = document.createElement("div");
            overlay.classList.add("mod_overlay");
            overlay.style.opacity = "0";
            overlay.innerHTML = `
                <div class="signIn-wrapper">
                    <div class="signIn-header">
                        <span>Edit mod profile</span>
                        <div class="centerXY" style="width: 32px; height: 32px;">
                            <button class="modButton-black" id="closeProfileEditor">
                                <svg width="18" height="20" viewBox="0 0 16 16" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.6001 14.4L14.4001 1.59998M14.4001 14.4L1.6001 1.59998" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="signIn-body" style="width: fit-content;">
                        <div class="centerXY g-10">
                            <div class="profile-img" style="width: 6em;height: 6em;">
                                <img src="${this.profile.imageURL}" alt="Profile picture" />
                            </div>
                            <div class="f-column g-5">
                                <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                                <label for="imageUpload" class="modButton-black g-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16"><path fill="#ffffff" d="M149.1 64.8L138.7 96H64C28.7 96 0 124.7 0 160V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H373.3L362.9 64.8C356.4 45.2 338.1 32 317.4 32H194.6c-20.7 0-39 13.2-45.5 32.8zM256 192a96 96 0 1 1 0 192 96 96 0 1 1 0-192z"/></svg>
                                    Upload avatar
                                </label>
                                <button class="modButton-black g-10" id="deleteAvatar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16"><path fill="#ffffff" d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"/></svg>
                                    Delete avatar
                                </button>
                            </div>
                        </div>
                        <div class="f-column w-100">
                            <label for="username_edit">Username</label>
                            <input type="text" class="form-control" id="username_edit" value="${this.profile.username}" />
                        </div>
                        <div class="f-column w-100">
                            <label for="bio_edit">Bio</label>
                            <div class="textarea-container">
                                <textarea class="form-control" maxlength="250" id="bio_edit">${this.profile.bio || ""}</textarea>
                                <span class="char-counter" id="charCount">${this.profile.bio ? this.profile.bio.length : "0"}/250</span>
                            </div>
                        </div>
                        <button class="modButton-black" style="margin-bottom: 20px;" id="saveChanges">Save changes</button>
                    </div>
                </div>
            `;
            document.body.append(overlay);
 
            function hide() {
                overlay.style.opacity = "0";
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
 
            overlay.addEventListener("click", (e) => {
                if (e.target == overlay) hide();
            });
 
            setTimeout(() => {
                overlay.style.opacity = "1";
            });
 
            document.getElementById("closeProfileEditor").addEventListener("click", hide);
 
            let changes = new Set(); // Use a Set to store unique changes
 
            const bio_edit = document.getElementById("bio_edit");
            const charCountSpan = document.getElementById("charCount");
            bio_edit.addEventListener("input", updCharcounter);
 
            function updCharcounter() {
                const currentTextLength = bio_edit.value.length;
                charCountSpan.textContent = currentTextLength + "/250";
 
                // Update changes
                changes.add("bio");
            }
 
            // Upload avatar
            document.getElementById("imageUpload").addEventListener("input", async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                console.log(file);
 
                const formData = new FormData();
                formData.append('image', file);
 
                try {
                    const data = await (await fetch(this.appRoutes.imgUpload, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData,
                    })).json();
                    console.log(data);
 
                    if (data.success) {
                        const profileImg = document.querySelector(".profile-img img");
                        profileImg.src = data.user.imageURL;
                        hide();
                        that.profile = data.user;
                    } else {
                        that.modAlert(data.message, "danger");
                        console.error('Failed to upload image');
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                }
            });
 
            const username_edit = document.getElementById("username_edit");
            username_edit.addEventListener("input", () => {
                changes.add("username");
            });
 
            const saveChanges = document.getElementById("saveChanges");
            saveChanges.addEventListener("click", async () => {
                if (changes.size === 0) return;
                let changedData = {};
                changes.forEach((change) => {
                    if (change === "username") {
                        changedData.username = username_edit.value;
                    } else if (change === "bio") {
                        changedData.bio = bio_edit.value;
                    }
                });
 
                const resData = await (await fetch(this.appRoutes.editProfile, {
                    method: 'POST',
                    body: JSON.stringify({
                        changes: Array.from(changes),
                        data: changedData,
                    }),
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })).json();
 
                if (resData.success) {
                    if (that.profile.username !== resData.user.username) {
                        const p_username = document.getElementById("profile_username_00");
                        if (p_username) p_username.innerText = resData.user.username;
                    }
                    that.profile = resData.user;
                    changes.clear();
                    hide();
                    const name = document.getElementById("my-profile-name");
                    const bioText = document.getElementById("my-profile-bio");
 
                    name.innerText = resData.user.username;
                    bioText.innerHTML = resData.user.bio || "No bio.";
 
                } else {
                    resData.errors.forEach((error) => {
                        this.modAlert(error.message, "danger");
                    });
                }
            });
 
            const deleteAvatar = document.getElementById("deleteAvatar");
            deleteAvatar.addEventListener("click", async () => {
                if (confirm("Are you sure you want to remove your profile picture? It will be changed to the default profile picture.")) {
                    try {
                        const data = await (await fetch(this.appRoutes.delProfile, {
                            credentials: 'include',
                        })).json();
                        const profileImg = document.querySelector(".profile-img img");
                        profileImg.src = data.user.imageURL;
                        hide();
                        that.profile = data.user;
                    } catch(error) {
                        console.error('CouldN\'t remove image: ', error);
                        this.modAlert(error.message, "danger");
                    }
                }
            });
        },
        load() {
            // Load game faster
            function randomPos() {
                let eventOptions = {
                    clientX: Math.floor(Math.random() * window.innerWidth),
                    clientY: Math.floor(Math.random() * window.innerHeight),
                    bubbles: true,
                    cancelable: true
                };
 
                let event = new MouseEvent('mousemove', eventOptions);
 
                document.dispatchEvent(event);
            }
 
            let moveInterval = setInterval(randomPos);
            setTimeout(() => clearInterval(moveInterval), 600);
 
            // load mod when websocket is ready
            let loaded = false;
            let intervalId = setInterval(() => {
                if (!window.WebSocket) return;
 
                // load mod
                this.createMenu();
                loaded = true;
                clearInterval(intervalId);
            }, 400);
        },
 
        createMenu() {
            this.smallMods();
            this.menu();
            this.credits();
            this.chat();
            this.Macros();
            this.Themes();
            this.updateNick();
            this.clientPing();
            this.tagsystem();
            this.createMinimap();
            this.saveNames();
            this.setInputActions();
            this.game();
            this.mainMenu();
            this.macroSettings();
            this.fps();
            this.initStats();
            this.account();
 
            const styleTag = document.createElement("style")
            styleTag.innerHTML = this.style;
            document.head.append(styleTag);
 
            // Respawn interval
            setInterval(() => {
                if (modSettings.AutoRespawn && this.respawnTime && Date.now() - this.respawnTime >= this.respawnCooldown) {
                    this.respawn();
                }
            })
 
            // mouse fast feed interval
            setInterval(() => {
                if (dead || !menuClosed() || !this.mouseDown) return;
                this.fastMass()
            }, 50);
 
        }
    }
 
    const mods = new mod();
})();
 
/* ** ** ** ** ** ** *\
|   SigMod by Cursed  |
\* .. .. .. .. .. .. */
