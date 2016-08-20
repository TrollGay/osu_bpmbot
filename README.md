**How to setup/use:**

- Rename credentials.js.example to credentials.js
- Obtain an authenticatino token from http://twitchapps.com/tmi/. Note: You must be logged in to the twitch account you want your bot to use while getting a key.
- Edit credentials.js and put in your bot's username, authentication token and the channel name you want to connect to (this is the twitch username of the streamer).
- Set isBotAdmin in credentials.js to true if your bot has admin rights on the channel (this increases the message rate limit on twitch).
- Open a command line/terminal window and change directory to where bot.js is located.
- Run the command 'node bot.js' to install the required dependencies and start the bot.
- Press ctrl+c or close the window to stop the bot.
