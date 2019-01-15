run `node index.js` in terminal to run the chat client

when a new client is connected to the server, a new clientId (GUID) will be generated

messages are ordered by a timestamp when they are received

popular words are arranged in a dictionary of {<word>: count}, and then they are also tracked by a timestamp ordered map {timestamp: {<word>: count}}

as new words come in, they are updated for both containers; as time elapses (either by checking every second, or triggered by every new word coming in using its timestamp), the expired words are removed from the timestamp sorted list, and the word count are also decreased for the respective word

finally, we use a collections/SortedMap to track the {count: [words]} as the leaderboard