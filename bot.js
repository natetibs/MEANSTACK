const fs = require('fs');

const time = require('./time.js');
const intent = require('./intent.js');
const rooms = require('./rooms.js');
const output = require('./output.js');
const exchange = require('./exchange.js');

let token = fs.readFileSync('token.txt').toString().trim();

let {RtmClient, CLIENT_EVENTS, RTM_EVENTS, MemoryDataStore} = require('@slack/client');

var rtm = new RtmClient(token, {
  logLevel: 'info',
  dataStore: new MemoryDataStore()
});
rtm.start();

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

function getPossibleEmails(email) {
  let list = [email];
  let e2 = email.replace("@readytalk.com", "@foxden.io");
  if(e2 != email) {
    list.push(e2);
  }
  return list;
}

rtm.on(RTM_EVENTS.MESSAGE, function (message) {
  let text = message.text || "";
  console.log("message: ", message);
  let theRooms = rooms.parseRooms(text);
  let userInfo = rtm.dataStore.getUserById(message.user);
  let channelInfo = rtm.dataStore.getChannelGroupOrDMById(message.channel);

  console.log("userInfo: ", userInfo);
  console.log("channelInfo: ", channelInfo);

  function reply(response) {
    console.log(`to ${userInfo.profile.email}: ${response}`);
    if(channelInfo.is_im) {
      rtm.sendMessage(response, message.channel, function() {});
    } else {
      rtm.sendMessage(`<@${message.user}>: ${response}`, message.channel, function() {});
    }
  }

  let isSquattyBotMessage = (channelInfo.is_im || (text.indexOf('@' + rtm.activeUserId) >= 0)) && message.bot_id == null;
  if(isSquattyBotMessage) {
    console.log(`from ${userInfo.profile.email}: ${text}`);
    let theIntent = intent.parseIntent(new Date(), text);

    if(theIntent.name == 'help') {
      reply(`Try "@squattybot: book Lawrence".\n` +
        `If you ask for an unavailable room, I'll try to find you an open one nearby.\n` +
        `If you don't need the room I scheduled for you, you can always use "@squattybot: cancel".\n` +
        `You can also specify a time, like "@squattybot: champa until 4" or "@squattybot: welton for 8 hours".\n` +
        `Ask for the list of rooms I know about with "@squattybot: list".`);
      return;
    }

    if(theIntent.name == 'list') {
      reply(`Here's a list of rooms that I know about:\n` +
          rooms.getAllRooms().map(r => r.charAt(0).toUpperCase() + r.slice(1)).join('\n'));
      return;
    }

    if(theIntent.name == 'available') {
      Promise.all(theIntent.rooms.map(r => exchange.getUsefulRoomAvailability(rooms.getEmail(r), theIntent.timeRange)))
      .then(availability =>
        reply(output.describeAvailability(availability, theIntent.timeRange)))
      .catch(e => console.log(e));
      return;
    }

    if(theIntent.name == 'schedule') {
      let roomOptions = rooms
        .getNearbyRooms(theIntent.rooms)
        .reduce((a, b) => a.concat(b), []);

      Promise.all(roomOptions.map(r =>
        exchange.getUsefulRoomAvailability(rooms.getEmail(r), theIntent.timeRange)))
      .then(availability => {
        let theRooms = availability.filter(a => a.available).map(a => a.room);

        if(theRooms.length == 0) {
          reply(output.describeAvailability(availability, theIntent.timeRange));
        } else {
          return exchange.sendMeetingInvitation({
            subject: `Squatting in ${rooms.getDisplayName(theRooms[0])}`,
            start: theIntent.timeRange.start,
            end: theIntent.timeRange.end,
            location: rooms.getDisplayName(theRooms[0]),
            attendeeEmail: userInfo.profile.email,
            roomEmail: rooms.getEmail(theRooms[0])
          }).then(res =>
            reply(output.describeScheduled(res, theIntent.rooms)));
        }
      })
      .catch(e => reply(output.describeError(e)));
      return;
    }

    if(theIntent.name == 'cancel') {
      let start = new Date();
      let end = time.addMinutes(start, 15);

      exchange.cancelMeeting(getPossibleEmails(userInfo.profile.email), {start, end})
      .then(res => reply(output.describeCancelation(userInfo.profile.email, start, res)))
      .catch(e => reply(output.describeError(e)));
      return;
    }

    reply(`I couldn't figure out what room you're referring to. Try "@squattybot: book Lawrence".  I also respond to "help", "list", and "available".`);
  }
});
//
// // you need to wait for the client to fully connect before you can send messages
// rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
//   // This will send the message 'this is a test message' to the channel identified by id 'C0CHZA86Q'
//   rtm.sendMessage('this is a test message', 'C0CHZA86Q', function messageSent() {
//     // optionally, you can supply a callback to execute once the message has been sent
//   });
// });

module.exports = {rtm}
