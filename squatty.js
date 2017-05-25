const fs = require('fs');

const time = require('./time.js');
const intent = require('./intent.js');
const rooms = require('./rooms.js');
const output = require('./output.js');
const exchange = require('./exchange.js');
const rtm = require('./bot.js').rtm
function getPossibleEmails(email) {
  let list = [email];
  let e2 = email.replace("@readytalk.com", "@foxden.io");
  if(e2 != email) {
    list.push(e2);
  }
  return list;
}

function callSquatty(user, text, callback) {
	text = text || "";
	user = user || "";
	function reply(response) {
		console.log("from " + user + ": " + text);
		console.log("to " + user + ": " + response);
		callback("squattybot",response);
	}
	function getEmail(user) {
		console.log("converting " + user)
		if (user.toLowerCase().endsWith("@readytalk.com")) return user;
		if (user.toLowerCase().endsWith("@foxden.io")) return user.replace("@foxden.io","@readytalk.com")
		if (!user.includes("@")) return user + "@readytalk.com"
		let list = getPossibleEmails(user);
		return list[list.length - 1]
	}
	if (!getEmail(user).endsWith("@readytalk.com")) {
		reply("Incorrect readytalk email.")
		return;
	}
	user = getEmail(user);
	let theRooms = rooms.parseRooms(text);
  	let userInfo = rtm.dataStore.getUserById(user);
	let theIntent = intent.parseIntent(new Date(), text);

	if(theIntent.name == 'help') {
		reply(`Try "book Lawrence".\n` +
			`If you ask for an unavailable room, I'll try to find you an open one nearby.\n` +
			`If you don't need the room I scheduled for you, you can always use "cancel".\n` +
			`You can also specify a time, like "champa until 4" or "welton for 8 hours".\n` +
			`Ask for the list of rooms I know about with "list".`);
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
					attendeeEmail: getEmail(user),
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

		exchange.cancelMeeting(getPossibleEmails(user), {start, end})
		.then(res => reply(output.describeCancelation(user, start, res)))
		.catch(e => reply(output.describeError(e)));
		return;
	}

	reply(`I couldn't figure out what room you're referring to. Try "book Lawrence".  I also respond to "help", "list", and "available".`);
}
module.exports = {callSquatty};