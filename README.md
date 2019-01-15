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
- popular words: two class methods `updatePopularity` and `trimExpiredPopularWords` would be used for testing purposes.