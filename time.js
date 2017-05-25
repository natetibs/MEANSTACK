
function roundTo15Minutes(date) {
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();
  let millisecond = date.getMilliseconds();

  let ts = millisecond + (second + (minute + hour*60)*60)*1000;

  let mod = 15*60*1000;

  ts = ts - ((ts + mod/2) % mod) + mod/2;

  hour = ts / 60 / 60 / 1000;
  minute = (ts / 60 / 1000) % 60;
  second = 0;
  millisecond = 0;

  return new Date(year, month, day, hour, minute, second, millisecond);
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60*1000);
}

function roundToUtcDay(date) {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth();
  let day = date.getUTCDate();
  return new Date(Date.UTC(year, month, day));
}

function roundToLocalDay(date) {
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();
  return new Date(year, month, day);
}

function roundToLocalAmPm(date) {
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();
  let hour = Math.floor(date.getHours() / 12) * 12;
  return new Date(year, month, day, hour);
}

function nextHourRoundedTo15Minutes(date) {
  date = roundTo15Minutes(date);
  return {
    start: date,
    end: addMinutes(date, 60)
  };
}

function sameLocalDate(a, b) {
  return roundToLocalDay(a).toString() == roundToLocalDay(b).toString();
}

function sameLocalAmPm(a, b) {
  return roundToLocalAmPm(a).toString() == roundToLocalAmPm(b).toString();
}

function zeroPad(text, len) {
  text += '';
  var res = "";
  for(var i = 0; i < len - text.length; i++) {
    res += "0";
  }
  return res + text;
}

function simpleHoursMinutes(date) {
  if(date.toString() == new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toString()) {
    return '' + ((date.getHours() - 1) % 12 + 1);
  } else {
    return ((date.getHours() - 1) % 12 + 1) + ':' + zeroPad(date.getMinutes(), 2);
  }
}

function hoursMinutesAmOrPm(date) {
  return simpleHoursMinutes(date) + amOrPm(date);
}


function amOrPm(date) {
  if(date.getHours() >= 12) {
    return 'pm';
  } else {
    return 'am';
  }
}

function simpleDate(date) {
  let r = date.toISOString();

  return r.substring(r.indexOf('T'));
}

function overlaps(a, b) {
  if(!(a.start instanceof Date) || !(a.end instanceof Date) || !(b.start instanceof Date) || !(b.end instanceof Date) ) {
    throw new Error("I need Date objects!");
  }
  // consider a < 1-second overlap to NOT be an overlap.
  return a.end.getTime() > b.start.getTime() + 1000 && b.end.getTime() > a.start.getTime() + 1000;
}

function toLocalISOString(date) {
  return `${date.getFullYear()}-${zeroPad(date.getMonth(), 2)}-${zeroPad(date.getDate(), 2)}` +
    `T${zeroPad(date.getHours(), 2)}:${zeroPad(date.getMinutes(), 2)}:${zeroPad(date.getSeconds(), 2)}`;

}

function toString(now, time) {
  // console.log(now, time);
  if(!(now instanceof Date) || !(time instanceof Date)) {
    throw new Error("I need Date objects!");
  }

  let basicTime;

  if(sameLocalAmPm(now, time)) {
    basicTime = simpleHoursMinutes(time);
  } else {
    basicTime = hoursMinutesAmOrPm(time);
  }

  if(sameLocalDate(now, time)) {
    return basicTime;
  } else {
    return basicTime + ` on ${simpleDate(timeRange.start)}`;
  }
}

function toRangeString(now, timeRange) {
  if(!(now instanceof Date) || !(timeRange.start instanceof Date) || !(timeRange.end instanceof Date) ) {
    throw new Error("I need Date objects!");
  }

  let basicTime;

  if(sameLocalDate(timeRange.start, timeRange.end)) {
    if(sameLocalAmPm(timeRange.start, timeRange.end)) {
      basicTime = `from ${simpleHoursMinutes(timeRange.start)} to ${simpleHoursMinutes(timeRange.end)} ${amOrPm(timeRange.start)}`
    } else {
      basicTime = `from ${hoursMinutesAmOrPm(timeRange.start)} to ${hoursMinutesAmOrPm(timeRange.end)}`
    }

    if(sameLocalDate(now, timeRange.start)) {
      return basicTime;
    } else {
      return basicTime + ` on ${simpleDate(timeRange.start)}`;
    }
  } else {
    return `from ${toLocalISOString(timeRange.start)} to ${toLocalISOString(timeRange.end)}`;
  }
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes*60*1000);
}

// If the requested timeRange doesn't overlap with any of the events (of type timeRange[]):
//   Expand the "end" of the range until it hits the next event
//   Return that it's available, as well as the expanded range
// If not, return that it's not available (and the original range)
function computeAvailability(timeRange, events) {
  events = events.slice(0).sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
  let available = !events.some(e => overlaps(e, timeRange));

  let start = timeRange.start;
  let end = timeRange.end;

  if(available) {
    // console.log(JSON.stringify(events, null, 2));
    for(let ev of events) {
      // console.log(`cmp ${ev.start.toISOString()} and ${end.toISOString()}: ${ev.start.getTime() > end.getTime() - 1000}`);
      if(ev.start.getTime() > end.getTime() - 1000) {
        end = ev.start;
        break;
      }
    }
  }

  return {available, start, end};
}

module.exports = {
  roundTo15Minutes,
  addMinutes,
  roundToUtcDay,
  nextHourRoundedTo15Minutes,
  overlaps,
  toString,
  toRangeString,
  addMinutes,
  computeAvailability,
};
