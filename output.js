const time = require('./time.js');
const rooms = require('./rooms.js');

function englishifyList(list) {
  if(list.length < 2) {
    throw new Error("need list of length >= 2");
  }

  if(list.length == 2) {
    return `${list[0]} and ${list[1]}`;
  }

  return list.slice(0, list.length - 1).map(e => e + ', ').join('') + 'and ' + list[list.length - 1];
}

function describeAvailability(availability, timeRange) {
  let now = new Date();
  let timeString = time.toRangeString(now, timeRange);
  if(availability.length == 1) {
    if(availability[0].available) {
      return `${rooms.getDisplayName(availability[0].room)} is available ${time.toRangeString(now, availability[0])}.`;
    } else {
      return `Sorry, it looks like ${rooms.getDisplayName(availability[0].room)} is unavailable ${timeString}.`;
    }
  } else {
    let theRooms = availability.filter(a => a.available);
    if(theRooms.length == 0) {
      return `Sorry, ${englishifyList(availability.map(a => rooms.getDisplayName(a.room)))} are ${availability.length == 2 ? 'both' : 'all'} unavailable ${timeString}.`;
    } else if(theRooms.length == 1) {
      return `Looks like ${rooms.getDisplayName(theRooms[0].room)} is available ${time.toRangeString(now, theRooms[0])}.`;
    } else {
      let end = theRooms.map(r => r.end).reduce((a, b) => new Date(Math.min(a.getTime(), b.getTime())), timeRange.end);
      timeString = time.toRangeString(now, {start: timeRange.start, end});
      return `Looks like ${englishifyList(theRooms.map(a => rooms.getDisplayName(a.room)))} are ${theRooms.length == 2 ? 'both' : 'all'} available ${timeString}.`;
    }
  }
}

function describeError(e) {
  console.log(e);
  return `Something went wrong, try again later!`;
}

function describeCancelation(email, startTime, cancellation) {
  if(cancellation.status == 'notfound') {
    return `I couldn't find a "Squatting in ..." meeting for ${email} at ${time.toString(startTime, startTime)}.`;
  } else if(cancellation.status == 'canceled') {
    return `I canceled the booking in ${rooms.getDisplayName(cancellation.location)} for ${email}`;
  } else {
    return describeError('bad cancelation status');
  }
}

function describeScheduled(info, originalRooms) {
  let r = rooms.parseRooms(info.roomEmail)[0];
  let now = new Date();

  if(originalRooms.indexOf(r) >= 0) {
    return`I booked ${rooms.getDisplayName(r)} for you ${time.toRangeString(now, info)}`;
  } else if(originalRooms.length == 1) {
    return`Looks like ${rooms.getDisplayName(originalRooms)} is already booked, but I went ahead and booked ${rooms.getDisplayName(r)} for you instead, ${time.toRangeString(now, info)}`;
  } else {
    return`Looks like ${englishifyList(originalRooms.map(a => rooms.getDisplayName(a.room)))} are already booked, but I went ahead and booked ${rooms.getDisplayName(r)} for you instead, ${time.toRangeString(now, info)}`;
  }
}

module.exports = {describeAvailability, describeError, describeCancelation, describeScheduled};
