const time = require('./time.js');
const intent = require('./intent.js');
const rooms = require('./rooms.js');
const output = require('./output.js');

function checkJsonEqual(a, b, input) {
  a = JSON.stringify(a, null, 2);
  b = JSON.stringify(b, null, 2);

  if(a != b) {
    console.error(`for input ${JSON.stringify(input, null, 2)}`);
    console.error("a != b");
    console.error("a = " + a);
    console.error("b = " + b);

    if(a.length == b.length) {
      console.error(`(same length: ${a.length})`);

      let pos = 0;
      for(; pos < a.length; pos++) {
        if(a.charAt(pos) != b.charAt(pos)) {
          break;
        }
      }
      let a_part = a.substring(pos, pos + 10);
      let b_part = b.substring(pos, pos + 10);
      console.error(`(first diff at: ${pos}: "${a_part}" vs "${b_part}")`);
    }

    throw new Error('assertion failure');
  }
}

function checkRoomParse(text, expected) {
  checkJsonEqual(rooms.parseRooms(text), expected);
}

for(let room of rooms.getAllRooms()) {
  checkRoomParse(room, [room]);
  checkRoomParse(room.toUpperCase(), [room]);
  checkRoomParse(rooms.getDisplayName(room), [room]);
  checkRoomParse('cr' + room + '@readytalk.com', [room]);

  checkJsonEqual(rooms.getNearbyRooms(room)[0][0], room);
}

let now = new Date('2016-07-19T21:27:02.923Z');
let timeRange = {start: new Date('2016-07-19T21:30:00.000Z'), end: new Date('2016-07-19T22:30:00.000Z')};
let defaultRooms = ["larimer","market","wynkoop","wazee","blake","wewatta"];

function checkIntentTest([input, output]) {
  checkJsonEqual(intent.parseIntent(now, input), output, input)
}

[
  ["1.5 hr", 1.5*60*60*1000],
  ["0.5 hr", 0.5*60*60*1000],
  [".5 hr", 0.5*60*60*1000],
  ["1hr", 1*60*60*1000],
  ["10 hours", 10*60*60*1000],
  ["31 minutes", 31*60*1000],
  ["200m", 200*60*1000],
  ["an hour", 1*60*60*1000],
  ["one hour", 1*60*60*1000],
  ["2/3 hours", (2/3)*60*60*1000],
].forEach(([input, output]) => {
  checkJsonEqual(intent.parseDuration(now, input), output, input);
  checkJsonEqual(intent.parseDuration(now, "blah " + input + " blah"), output, "blah " + input + " blah");
});

[
  ['list', {name: 'list'}],
  ['cancel', {name: 'cancel', timeRange}],
  ['help', {name: 'help'}],
  ['available', {name: 'available', timeRange, rooms: defaultRooms}],
  ['rooms', {name: 'list'}],
  ['rooms blake', {name: 'schedule', timeRange, rooms: ['blake'] }],
  ['wewatta', {name: 'schedule', timeRange, rooms: ['wewatta']}],
  ['executive for 2hr',
    {
      name: 'schedule',
      timeRange: {
        start:timeRange.start,
        end: new Date(timeRange.start.getTime() + 2*60*60*1000)
      },
      rooms: ['execboard']
    }
  ],
  ['blake for 1.5 hours',
    {
      name: 'schedule',
      timeRange: {
        start:timeRange.start,
        end: new Date(timeRange.start.getTime() + 1.5*60*60*1000)
      },
      rooms: ['blake']
    }
  ]
].forEach(checkIntentTest);

function check(input, fn, output) {
  checkJsonEqual(fn(input), output, input);
}

check(['larimer', 'market'], rooms.getNearbyRooms, [
  ['larimer'],
  ['market'],
  ['wynkoop', 'wazee', 'blake','wewatta']
]);

function checkAvailability(timeRange, events, output) {
  checkJsonEqual(time.computeAvailability(timeRange, events), output, [timeRange, events]);
}

function datify(events) {
  return events.map(e => {return {start: new Date(e.start), end: new Date(e.end)}});
}

let hour = 60*60*1000;
let nowt = time.roundTo15Minutes(now).getTime();
let events = datify([
  {start: nowt, end: nowt + hour},
  {start: nowt+hour, end: nowt+hour+hour/2},
  {start: nowt+hour*2, end: nowt+hour*3},
  {start: nowt+hour*4, end: nowt+hour*5},
  {start: nowt+hour*7, end: nowt+hour*8},
]);

let offsets = [
  [0.0*hour, false, 0],
  [0.5*hour, false, 0],
  [1.0*hour, false, 0],
  [1.5*hour, false, 0],
  [2.0*hour, false, 0],
  [2.5*hour, false, 0],
  [3.0*hour, true, 0],
  [3.5*hour, false, 0],
  [4.0*hour, false, 0],
  [4.5*hour, false, 0],
  [5.0*hour, true, hour],
  [5.5*hour, true, hour/2],
  [6.0*hour, true, 0],
  [6.5*hour, false, 0],
  [7.0*hour, false, 0],
  [7.5*hour, false, 0],
  [8.0*hour, true, 0],
  [8.5*hour, true, 0],
]

for(let [offset, avail, adjustment] of offsets) {
  let input = {offset: offset / hour, start: new Date(nowt + offset), end: new Date(nowt + offset + hour)};
  checkAvailability(input, events, {
    available: avail,
    start: input.start,
    end: new Date(input.end.getTime() + adjustment)
  });
}
