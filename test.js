import test from 'ava';
const ChatServer = require("./ChatServer.js");

test('foo', t => {
    t.pass();
});

test('bar', async t => {
    const bar = Promise.resolve('bar');
    t.is(await bar, 'bar');
});

test ('ChatServer', t => {
    var chatServer = new ChatServer();

});
