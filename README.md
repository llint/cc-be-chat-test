run `node index.js` in terminal to run the chat client

===========================

## External modules used:
- `collections`: `SortedMap`, `List`, `Set`
- `ava`: testing

## General
when a new client is connected to the server, a new clientId will be generated, the scheme is: `"Client" + id`, such as `Client42`

## Popular words in a time period
popular words are arranged in a dictionary of `wordsCount` of type `{word: count}`, and then they are also tracked by a timestamp ordered map `histogram` of type `{timestamp: {word: count}}`

as new words come in, they are updated for both containers; as time elapses (either by checking every second, or triggered by every new word coming in using its timestamp), the expired words are removed from the timestamp sorted list, and the word count are also decreased for the respective words expired, then the leaderboard is also updated

finally, we use a collections/SortedMap `SortedMap{count: Set(words)}` to track the `leaderboard`

## Profanity filtering

- A trie `profanityWords` is used to keep track of the profanity words
- if any word in a message has any profanity word as a prefix (or the whole word), the word is replaced as "*", and the word is not tracked by popular words

## Test

I don't have a lot of time writing test cases, but would like to lay out the _plan_ here:
- profanity filtering: building a trie with a few words, and then pick a set of words, and check against the trie, and see if the result match expectation - the functions `buildProfanityWordsTrie` and `detectAndReplaceProfanityWords` are exported for testing purposes
- popular words: two class methods `updatePopularity` and `trimExpiredPopularWords` would be used for testing purposes, given a sample of input words, and wait a few seconds, and get the `leaderboard.max()` would indicate the most popular words for the last 5 seconds
- for actual chat messaging and commands, need to write a simple ChatClient, which allows the user to enter messages and send to server; the tests would involve 1 and 2 clients, some pre-defined messages, see if any new client connects, does it receive the lastest 50 messages, and if any clients sends a message, do all the clients gets the message, etc.

## Scalability considerations

Node is essentially asynchronous single threaded. with a single node, it's hard to justify scalability, since scalability in the server world is always achieved with a cluster of nodes (for load balancing) with the high level concept of service oriented architecture. Node.js itself if event driven, asynchronous, and single threaded, so the scalability is confined by a single core (thread) usage at the application level, and for the Node.js API, no single API is blocking, so this basically makes the utilization of the single core/thread to maximum. Otherwise, a server cluster of nodes needs to be set up, so ideally, one VPC with 8 cores, would run 8 instances of the chat nodes, and there are considerations to distribute the chat rooms on to each of the chat nodes, and since the client cannot directly talk to all the internal chat nodes, so some kind of proxy/gateway nodes need to be in place for the clients to talk directly, and internally the traffic will be routed around. So it is definitely not appropriate to talk about scalability with a single node, client direct connection to that node setup.

PS: multithreading is not the key to solve scalability issues, multiprocessing (cluster of nodes with inter-node communication) is.