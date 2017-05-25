const time = require('./time.js');
const rooms = require('./rooms.js');

function firstRegexMatch(text, regexes) {
  for(let r of regexes) {
    let res = r[0].exec(text);
    if(res != null) {
      let f = r[1](res);
      if(f != null) {
        return f;
      }
    }
  }
  return null;
}

function parseDuration(now, text) {
  return firstRegexMatch(text, [
    [/(^|\s)([0-9]+)\s*\/\s*([0-9+])?\s*(h|hr|hours?)\b.*/i, (res) => parseFloat(res[2])/parseFloat(res[3])*60*60*1000],
    [/(^|\s)half\s+(an?\s+)?hour\b.*/i, (res) => 30*60*1000],
    [/(^|\s)(an?|one)\s+(hour|hr)\b.*/i, (res) => 60*60*1000],
    [/(^|\s)([0-9]+(\.[0-9]*)?)\s*(m|mn|min|minutes?)\b.*/i, (res) => parseFloat(res[2])*60*1000],
    [/(^|\s)(\.[0-9]+)\s*(m|mn|min|minutes?)\b.*/i, (res) => parseFloat("0" + res[2])*60*1000],
    [/(^|\s)([0-9]+(\.[0-9]*)?)\s*(h|hr|hours?)\b.*/i, (res) => parseFloat(res[2])*60*60*1000],
    [/(^|\s)(\.[0-9]+)\s*(h|hr|hours?)\b.*/i, (res) => parseFloat("0" + res[2])*60*60*1000],
  ]);
}

function parseEndTime(now, text) {
  return firstRegexMatch(text, [
    [/.*\b(until|til|to)\s+([0-9]+)(\:([0-9]+))?\s*(am|pm)\b.*/i, (res) => {
      let hr = parseInt(res[2]);
      let min = res[4] != null ? parseInt(res[4]) : 0;
      if(res[5].toLowerCase() == 'pm') {
        hr += 12;
      }
      let r = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hr, min);
      if(r > now) {
        return r;
      }
      return null;
    }],
    [/.*\b(until|til|to)\s+([0-9]+)(:([0-9]+))?\b.*/i, (res) => {
      let min = res[4] != null ? parseInt(res[4]) : 0;
      let hr1 = parseInt(res[2]);
      let hr2 = hr1 + 12;
      let t1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hr1, min);
      let t2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hr2, min);
      if(hr2 >= 24) {
        return t1;
      }
      if(t1 > now) {
        return t1;
      }
      if(t2 > now) {
        return t2
      }
      return null;
    }],
  ])
}

function parseTimeRange(now, text) {
  let end = parseEndTime(now, text);
  let duration = parseDuration(now, text);

  let start = time.roundTo15Minutes(now);
  if(end == null) {
    if(duration == null) {
      duration = 60*60*1000;
    }
    end = new Date(start.getTime() + duration);
  }

  return {start, end};
}

function parseRooms(roomMap, text) {
  let roomRegex = new RegExp(Object.keys(roomMap).join('|'), 'i');

  return text.match(roomRegex).map(r => roomMap[r.toLowerCase()]);
}

function parseIntent(now, text) {
  let timeRange = parseTimeRange(now, text);
  let theRooms = rooms.parseRooms(text);

  return firstRegexMatch(text, [
    [/.*\bhelp\b.*/i, (res) => {
      return {name: 'help'};
    }],
    [/.*\b(list)\b.*/i, (res) => {
      return {name: 'list'};
    }],
    [/.*\b(rooms)\b.*/i, (res) => {
      if(theRooms.length > 0) {
        return null;
      }
      return {name: 'list'};
    }],
    [/.*\bavailable\b.*/i, (res) => {
      if(theRooms.length == 0) {
        theRooms = rooms.getDefaultRooms();
      }
      return {name: 'available', timeRange, rooms: theRooms};
    }],
    [/.*\bcancel\b.*/i, (res) => {
      return {name: 'cancel', timeRange};
    }],
    [/.*/, (res) => {
      if(theRooms.length > 0) {
        return {name: 'schedule', timeRange, rooms: theRooms};
      } else if(/book|schedule|find/i.exec(text) != null) {
        return {name: 'schedule', timeRange, rooms: rooms.getDefaultRooms()};
      } else {
        return {name: 'unknown', timeRange, rooms: theRooms};
      }
    }]
  ]);
}

module.exports = {parseDuration, parseEndTime, parseDuration, parseIntent};
