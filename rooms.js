let roomNearness = {
  seventh: {
    general: [['lawrence', 'arapahoe'], ['curtis', 'champa', 'stout'], ['california', 'welton']],
    nerd: 'nerdlounge',
    small: 'dartroom',
  },
  sixth: {
    general: [['larimer', 'market'], ['wynkoop', 'wazee', 'blake'], ['wewatta']],
    large: 'execboard',
    small: ['enclave1', 'enclave2'],
    depressing: 'delgany',
  }
};

let roomGroups = [
  [['6th', 'sixth'], roomNearness.sixth.general],
  [['7th', 'seventh'], roomNearness.seventh.general],
];

function findStrings(obj) {
  if(typeof obj == 'string') {
    return [obj];
  }

  if(typeof obj != 'object' || obj == null) {
    return [];
  }

  let res = [];
  if(obj instanceof Array) {
    for(let v of obj) {
      for(let s of findStrings(v)) {
        res.push(s);
      }
    }
  } else {
    for(let k of Object.keys(obj)) {
      let v = obj[k];
      for(let s of findStrings(v)) {
        res.push(s);
      }
    }
  }

  return res;
}

let extraRoomNames = {
  nerdlounge: 'nerd\\s*lounge',
  execboard: 'executive(\\s*board(\\s*room)?)?',
  dartroom: 'dart(\\s*room)?',
  enclave1: 'enclave\\s*(1|one)',
  enclave2: 'enclave\\s*(2|two)',
};

function entriesToObject(pairs) {
  let res = {};
  for(let [k, v] of pairs) {
    res[k] = v;
  }
  return res;
}

let roomList = findStrings(roomNearness);
let roomEmails = entriesToObject(roomList.map(r => [r, 'cr' + r + '@readytalk.com']));
let roomDisplayNames = entriesToObject(roomList.map(r => [r, r.charAt(0).toUpperCase() + r.slice(1)]));

roomDisplayNames['execboard'] = 'the Executive Board Room';
roomDisplayNames['nerdlounge'] = 'the Nerd Lounge';
roomDisplayNames['dartroom'] = 'the Dart room';
roomDisplayNames['enclave1'] = 'Enclave 1';
roomDisplayNames['enclave2'] = 'Enclave 2';

if(Object.values == null) {
  Object.values = (obj) => Object.keys(obj).map(k => obj[k]);
}

if(Object.entries == null) {
  Object.entries = (obj) => Object.keys(obj).map(k => [k, obj[k]]);
}

let roomRegExp = new RegExp(roomList.concat(Object.values(extraRoomNames)).join('|'), 'gi');

let individualRoomRegExps =
  roomList.map(r => [new RegExp(r, 'i'), r])
    .concat(Object.entries(extraRoomNames).map(([k, v]) => [new RegExp(v, 'i'), k]));

function findNearness(room) {
  return (function inner(obj) {
    if(obj === room) {
      return [[obj]];
    }

    if(typeof obj != 'object' || obj == null) {
      return null;
    }

    if(obj instanceof Array) {
      for(let v of obj) {
        let i = inner(v);
        if(i != null) {
          let outer = findStrings(obj);
          let alreadyMentioned = new Set(findStrings(i));
          return i.concat([outer.filter(o => !alreadyMentioned.has(o))]);
        }
      }
      return null;
    } else {
      for(let k of Object.keys(obj)) {
        let v = obj[k];
        let i = inner(v);
        if(i != null) {
          return i;
        }
      }
    }
  })(roomNearness);
}

let nearnessMap = entriesToObject(roomList.map(r => [r, findNearness(r)]));

function getNearbyRooms(room) {
  if(room instanceof Array) {
    let rooms = room.map(getNearbyRooms);
    let max = rooms.map(r => r.length).reduce((a, b) => Math.max(a, b), 0);
    let res = [];
    let set = new Set();
    for(let i = 0; i < max; i++) {
      for(let r of rooms) {
        if(r.length > i) {
          let g = r[i].filter(e => !set.has(e));
          if(g.length > 0) {
            res.push(g);
            g.forEach(e => set.add(e));
          }
        }
      }
    }
    return res;
  } else {
    for(let [regexp, m] of individualRoomRegExps) {
      if(regexp.exec(room) != null) {
        return nearnessMap[m];
      }
    }
    throw new Error("unknown room: " + room);
  }
}

function parseRooms(text) {
  return [...new Set((text.match(roomRegExp) || []).map(room => {
    for(let [regexp, m] of individualRoomRegExps) {
      if(regexp.exec(room) != null) {
        return m;
      }
    }
    throw new Error("unreachable");
  }))];
}

function getEmail(room) {
  for(let [regexp, m] of individualRoomRegExps) {
    if(regexp.exec(room) != null) {
      return roomEmails[m];
    }
  }
  throw new Error("unknown room: " + room);
}

function getDisplayName(room) {
  for(let [regexp, m] of individualRoomRegExps) {
    if(regexp.exec(room) != null) {
      return roomDisplayNames[m];
    }
  }
  throw new Error("unknown room: " + room);
}

let defaultRooms = findStrings(roomNearness.seventh.general);

function getDefaultRooms() {
  return defaultRooms;
}

function getAllRooms() {
  return roomList;
}

module.exports = {parseRooms, getNearbyRooms, getEmail, getDisplayName, getDefaultRooms, getAllRooms};
