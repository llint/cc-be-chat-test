'use strict';

var WebSocket = require('ws');

var SortedMap = require("collections/sorted-map");
var List = require("collections/list");
var Set = require("collections/set");

module.exports = class ChatServer {
    constructor() {
        this.wss = new WebSocket.Server({ port: 8080 });
        this.clients = {};
        this.clientIdBase = 0;

        this.messages = new List([]);

        // at a specific time, what words are processed
        this.histogram = new SortedMap(); // {timestamp: {word: count}}

        // overall, the count of each each word
        this.wordsCount = {}; // {word: count}

        // the leaderboard that arranges words sorted by count
        this.leaderboard = new SortedMap(); // {count: set(words)}

        // We use a trie to define the profanity dictionary
        function buildProfanityWordsTrie(words) {
            var root = {}; // {char: next}
            for (var word of words) {
                var next = root;
                for (var char of word) {
                    if (!next[char]) {
                        next[char] = {};
                    }
                    next = next[char];
                }
            }
            return root;
        }
        this.profanityWords = buildProfanityWordsTrie([]);

        // Note: this function currently only detects if the word is prefixed with any profanity word, but not in the middle!
        function detectAndReplaceProfanityWords(word) {
            var next = this.profanityWords;
            for (var char of word) {
                if (next[char]) {
                    next = next[char];
                    if (next == {}) {
                        // a full profanity word is found being the prefix of the word
                        return "*".repeat(word.length);
                    }
                } else {
                    return word;
                }
            }
        }

        wss.on('connection', function connection(ws) {
            var clientId = "Client" + ++this.clientIdBase;
            this.clients[clientId] = {ws:ws, ts:Date.now()};
            ws.send(this.messages); // send the saved up to 50 messages to the new client

            function trimExpiredPopularWords(now) {
                var then = now.setSeconds(now.getSeconds() - 5);
                var tssToRemove = [];
                for (var ts in this.histogram) {
                    if (ts < then) {
                        var words = this.histogram[ts]; // {word: count}
                        //this.histogram.remove(ts); // XXX: is this safe during iteration in javascript?
                        tssToRemove.push(ts);
                        var wordsToRemove = [];
                        for (var word in words) {
                            var count = this.wordsCount[word];
                            if (count > 0) {
                                // remove the word from the leaderboard with the old count, and add it back with the decremented count
                                // if the new count is 0, don't add back to the leaderboard
                                var wordsAtLevel = this.leaderboard[count]; // set{words}
                                if (wordsAtLevel) {
                                    wordsAtLevel.remove(word);
                                    if (wordsAtLevel.length == 0) {
                                        this.leaderboard.remove(count);
                                    }
                                }
                                count -= words[word];
                                if (count <= 0) {
                                    wordsToRemove.push(word);
                                    //this.wordsCount.remove(word); // XXX: is this safe during iteration in javascript?
                                } else {
                                    var wordsAtLevel = this.leaderboard[count] || new Set(); // add word with new count
                                    wordsAtLevel.add(word);
                                    this.leaderboard[count] = wordsAtLevel;
                                }
                            }
                        }
                    } else {
                        break;
                    }
                }

                // XXX: not performant, but should be safe
                for (var ts of tssToRemove) {
                    this.histogram.remove(ts);
                }
                for (var word of wordsToRemove) {
                    this.wordsCount.remove(word);
                }
            }

            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
                var splitted = message.split(" ");
                if (splitted[0] == "/popular") {
                    trimExpiredPopularWords(Date.now());
                    ws.send(this.leaderboard.max());
                } else if (splitted[0] == "/stats") {
                    var clientId = splitted[1];
                    var client = this.clients[clientId];
                    if (client) {
                        // send the stats of the specific client to the querying client
                        var duration = Date.now() - client.ts;
                        ws.send(new Date(duration).toUTCString()); // XXX: not totally sure if this works the way expected
                    }
                } else {
                    // save the message
                    this.messages.push(message);
                    if (this.messages.length > 50) {
                        this.messages.shift();
                    }

                    // send the message to all the clients (including the sender)
                    for (var clientId in this.clients) {
                        this.clients[clientId].ws.send(message);
                    }

                    // now process the words
                    var now = Date.now();
                    var words = this.histogram[now] || {}; // {word: count}
                    for (var word of splitted) {
                        if (detectAndReplaceProfanityWords(word) == word) {
                            var count = words[word] || 0;
                            ++count;
                            words[word] = count;
                        }
                    }
                    this.histogram[now] = words; // update

                    for (var word in words) {
                        var count = this.wordsCount[word] || 0;
                        if (count > 0) {
                            // remove the word at its old level in the leaderboard
                            var wordsAtLevel = this.leaderboard[count];
                            if (wordsAtLevel) {
                                wordsAtLevel.remove(word);
                                if (wordsAtLevel.length == 0) {
                                    this.leaderboard.remove(count);
                                }
                            }
                        }
                        count += words[word];
                        this.wordsCount[word] = count;

                        // update the leaderboard for updated count for this - insert the word with new count back
                        var wordsAtLevel = this.leaderboard[count] || new Set();
                        wordsAtLevel.add(word);
                        this.leaderboard[count] = wordsAtLevel;
                    }

                    // the new message would trigger trimming of the words that were added 5 seconds ago
                    trimExpiredPopularWords(now);
                }
            });
        });
    }
}

