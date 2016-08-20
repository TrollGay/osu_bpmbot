var tmi = require("tmi.js");
var cfg = require("./credentials")

var options = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: cfg.username,
        password: cfg.authToken
    },
    channels: [cfg.channelName]
};

var client = new tmi.client(options);

// Connect the client to the server..
client.connect().then(function(data) {
    joinServer();
}).catch(function(err) {
    console.log(err);
});

var messagesInLast30Seconds = [];
var firstJoinMessageSent = false;
var botStfu = false;
var quitwNames = [];
var streamResults = [];

function joinMessage() {
    console.log('Join message function. Count of messages: '+messagesInLast30Seconds.length);
    if (botStfu == true) {
        return;
    }
    if (firstJoinMessageSent == true) {
        if (messagesInLast30Seconds.length > 10) {
            console.log('Sending join message');
            client.say(options.channels[0], "MrDestructoid Note to mods: no need to ban me! Just type !mutebpm to disable me. MrDestructoid");
        } else {
            console.log('Under 10 messages received in last 30 secs, not repeating join msg');
        }
    }
    else {
        if (messagesInLast30Seconds.length > 1) {
            console.log('First join message skipped');
            client.say(options.channels[0], "MrDestructoid Note to mods: no need to ban me! Just type !mutebpm to disable me for a while. MrDestructoid");
        }
        firstJoinMessageSent = true;
    }
};

// setTimeout(joinMessage, 30000);

var stfuInterval = setInterval(joinMessage, 120000);

function joinServer() {
    client.join(options.channels[0]).then(function(data){
        client.say(options.channels[0], "BPM bot is here! MrDestructoid Type !countmystreambpm to measure your stream speed!");

    }).catch(function(err) {
        console.log(err);
    });
};

var isBotAdmin = cfg.isBotAdmin;

function sayMessage(message) {
    // Check messages in last 30 seconds
    var count = messagesInLast30Seconds.length;
    var d = new Date();
    var t = d.getTime();
    if (isBotAdmin === true) {
        messageLimitPer30Secs = 97;
    } else {
        messageLimitPer30Secs = 18;
    }
    console.log('Messages in last 30s:', count);

    if (count >= messageLimitPer30Secs) {
        console.log('Limit reached (', count, ')')
        if (count < messageLimitPer30Secs + 1) {
            client.say(options.channels[0], 'Too much command spam! This bot will not respond for a few more seconds. MrDestructoid');
            messagesInLast30Seconds.push(t);
            console.log('count increased to '+count);
        }
        return;
    };

    // Add to array and remove after 30 secs
    messagesInLast30Seconds.push(t);

    setTimeout(function () {
        var msgIndex = messagesInLast30Seconds.findIndex(x => t);
        messagesInLast30Seconds.splice(msgIndex, 1);
    }, 30000);

    client.say(options.channels[0], message);
}

var usersCountingBpm = [];
var usersRequestedTemp = [];
var fastestStreamer = null;
var largestPenis = null;
var usersWhoCheckedPenisSize = [];

client.on("chat", function (channel, userstate, message, self) {
    // Don't listen to my own messages..
    if (self) return;

    var userName = userstate['display-name'];

    if (message == '!largestpenis') {
        if (largestPenis) {
            sayMessage('MrDestructoid The fastest penis so far belongs to ' + largestPenis.name + ' at '+ largestPenis.size + 'inches. MrDestructoid');
        } else {
            sayMessage('No one has measured their dick size yet! MrDestructoid');
        }
    }

    else if (message == '!fasteststreamer') {
        if (fastestStreamer) {
            sayMessage('MrDestructoid The fastest streamer so far is ' + fastestStreamer.name + ' with '+ Math.floor(fastestStreamer.bpm)+ 'bpm. MrDestructoid');
        } else {
            sayMessage('There is no fastest streamer yet! MrDestructoid');
        }
    }

    else if (message == '!mutebpm') {
        if (userstate.mod == true) {
            botStfu = true;
            clearInterval(stfuInterval);
            client.say(options.channels[0], 'MrDestructoid BPM Bot has been disabled by a moderator for 15 minutes. Sorry for the nazi mods! Kappa Type !unmutebpm to undo.');
            setTimeout(function () {
                botStfu = false;
                var stfuInterval = setInterval(joinMessage, 60000);
                client.say(options.channels[0], "BPM bot is here again! MrDestructoid Type !countmystreambpm to measure your stream speed!");
            }, 900000);
        }
    }

    else if (message == '!unmutebpm') {
        if (userstate.mod == true) {
            botStfu = false;
            var stfuInterval = setInterval(joinMessage, 60000);
            client.say(options.channels[0], "BPM bot is here again! MrDestructoid Type !countmystreambpm to measure your stream speed!");
        }
    }

    if (botStfu == true) return;

    if (message == '!quit w') {
        quitwNames.push(userName);
        if (quitwNames.length > 50) {
            quitwNames.splice(0, quitwNames.length - 50);
        }
        sayMessage('People who quitted w: '+quitwNames.join(', ')+'. Type !quit w to join the crew!');
    }

    else if (message == '!penissize') {

        if (userName == 'filsdesale') {
            sayMessage(userName+' Sorry, your penis is too small to be measured! Keepo');
            return;
        }

        if ( usersWhoCheckedPenisSize.indexOf(userName) > -1 ) {
            if (userstate.mod == false && userstate.subscriber == false) {
                sayMessage(userName+' Sorry, but you only get one chance to check your penis size!');
                return;
            }
        }

        var penisSize = (Math.random() * 14) + 1;
        penisSize = Math.round(penisSize * 1000) / 1000;
        sayString = userName+' your penis size is '+  penisSize +' inches';
      // Check if fastest
      if (penisSize < 5) {
          sayString+= ' BibleThump ';
      }

      if (!largestPenis || largestPenis.size < penisSize) {
          largestPenis = {
              name: userName,
              size: penisSize
          };
          sayString += ". Congratulations, you are have the largest penis yet!";

      }
        sayMessage(sayString);
        usersWhoCheckedPenisSize.push(userName);
    }

    var userBpmIndex = usersCountingBpm.findIndex(x => x.name==userName);
    // Count BPM
    if (userBpmIndex > -1) {
        console.log('Checking bpm for ', userName);

        // Check if message contains anything other than 'cv' characters
        var containsIllegalCharacters = message.match(/[^cv]+/) ? 1 : 0;
        if (containsIllegalCharacters) {
            usersCountingBpm.splice(userBpmIndex, 1);
            sayMessage(userName+" you choked! You must use only c and v to stream! Try again with !countmystreambpm");
            console.log('|| Returning || characters not c or v: ', userName, message);
            return;
        }

        // Calculate time taken
        var d = new Date();
        var obj = usersCountingBpm.find(x => x.name==userName);
        var startTime = obj.startTime;
        var bpmCountEndTime = d.getTime();
        var lagTime = 0.13;
        timeTaken = (bpmCountEndTime - startTime) / 1000;

        if (timeTaken < 2) {
            usersCountingBpm.splice(userBpmIndex, 1);
            sayMessage(userName+" you didn't stream for long enough! You must stream for longer than 2 seconds to measure accurately. Try again by typing !countmystreambpm");
            return;
        }

        console.log('time taken:', timeTaken, 'secs', 'hits: ' + message.length);
        var numberOfCharacters = message.length;
        bpm = numberOfCharacters * 60 / (timeTaken - lagTime) / 4;

        console.log('Number of characters: ', message.length);

        if (bpm > 300) {
            sayMessage(userName+' You streamed extremely fast (over 300pm), therefore you must be cheating and your result is disqualified! MrDestructoid');
            usersCountingBpm.splice(userBpmIndex, 1);
            return;
        }

        var resultObject = {name: userName, bpm: bpm};
        var personalBest = false;
        var nameFound = false;

        for (var i =0; i<streamResults.length; i++) {
            if (streamResults[i].name == userName) {
                nameFound = true;
                if (bpm > streamResults[i].bpm) {
                    console.log('deleting from array', bpm, streamResults[i].bpm);
                    streamResults.splice(i, 1);
                    personalBest = true;
                }
            }
        }

        if (personalBest === true || nameFound == false) {streamResults.push(resultObject);}

        sortStreamResults();

        console.log(streamResults);
        var rank = findWithAttr(streamResults, 'name', userName);

        var sayString = userName+" - You streamed "+Math.floor(bpm)+"bpm over " + Math.round(timeTaken * 100) / 100 + " seconds!";
        // Check if fastest



        if (!fastestStreamer || fastestStreamer.bpm <= bpm) {
            fastestStreamer = {
                name: userName,
                bpm: bpm
            };
            sayString += " Congratulations, you are the fastest streamer yet!";
        } else if (personalBest === true){
            sayString += "Personal best! You are the"
            if (rank > 0) {
                sayString += " "+ordinal_suffix_of(rank);
            }
            sayString += " fastest streamer";
        }

        sayString += " MrDestructoid";

        sayMessage(sayString);
        usersCountingBpm.splice(userBpmIndex, 1);
    } // End counting bpm


    // Check if not already counting user's bpm and command is !countmystreambpm.
    if (message == '!countmystreambpm' && userBpmIndex == -1) {
        // Check if user has used command in last 10 seconds
        // if ( usersRequestedTemp.indexOf(userName) > -1) {
        //     client.say(options.channels[0], userName+" You can only use this command every 10 seconds. Try again after a few seconds.");
        //     return;
        // }

        var d = new Date();
        var bpmCountStartTime = d.getTime();
        usersCountingBpm.push({name: userName, startTime: bpmCountStartTime});
        usersRequestedTemp.push(userName);
        sayMessage(userName+" quick, stream with c and v as fast as you can then hit enter. Go!");

        setTimeout(function () {
            // Check if user is still in array
            if ((indexToRemove = usersCountingBpm.findIndex(x => x.name==userName && x.startTime==bpmCountStartTime)) > -1) {
                sayMessage(userName+" Time's up! You must hit enter before 10 secs.");
                usersCountingBpm.splice(indexToRemove, 1);
                console.log(usersCountingBpm);
            }
            // if (indexToRemove2 = usersRequestedTemp.indexOf(userName)) {
            //     usersRequestedTemp.splice(indexToRemove2, 1);
            // }
        }, 10000);

    } else if (message == '!countmystreambpm') {
        console.log('canceled');
        usersCountingBpm.splice(userBpmIndex, 1);
    }

});

function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

function sortStreamResults() {
    streamResults.sort(function(a, b) {
        if (a.bpm < b.bpm) {
            return 1
        }
        if (b.bpm > a.bpm){
            return -1;
        }
        return 0;
    });
}
