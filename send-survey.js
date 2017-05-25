const fs = require('fs');
const http = require('http');
const request = require('request');

let token = fs.readFileSync('token.txt').toString().trim();
//
// request('https://slack.com/api/users.list?token=' + token, (err, response, body) => {
//   if(err != null) {
//     console.error(err);
//     return;
//   }
//
//   console.log(body);
// });

function getUserIds(emails) {
  return new Promise((resolve, reject) => {
    request('https://slack.com/api/users.list?token=' + token, (err, response, body) => {
      if(err != null) {
        reject(err);
        return;
      }

      const es = new Set(emails);

      const ids = new Map();

      try {
        const parsed = JSON.parse(body);
        if(!parsed.ok) {
          reject(parsed);
          return;
        }
        const users = parsed.members;
        for(let u of users) {
          if(es.has(u.profile.email)) {
            ids.set(u.profile.email, u.id)
          }
        }
        resolve(ids);
      } catch(e) {
        reject(e);
      }
    });
  });
}

const survey = "Hi there, SquattyBot here!  Would you have a few minutes to fill out a quick survey?  https://www.getfeedback.com/r/vJsfogPj  Thanks!";

// function makeChannel(id) {
//   return new Promise((resolve, reject) => {
//     request.post(`https://slack.com/api/postMessage?token=${token}&channel=${id}&text=${encodeURIComponent(survey)}`, (err, response, body) => {
//       if(err != null) {
//         reject(err);
//         return;
//       }
//       resolve(JSON.parse(body));
//     });
//   });
// }

function sendSurvey(id) {
  return new Promise((resolve, reject) => {
    request.post(`https://slack.com/api/chat.postMessage?token=${token}&channel=${id}&text=${encodeURIComponent(survey)}&as_user=true`, (err, response, body) => {
      if(err != null) {
        reject(err);
        return;
      }
      const parsed = JSON.parse(body);
      if(parsed.ok) {
        reject(parsed);
        return;
      }
      resolve(parsed);
    });
  });
}

const users = [
  'joshua.warner@readytalk.com',
  'andrea.hill@gmail.com',
  'andrew.suderman@readytalk.com',
  'casey.vick@readytalk.com',
  'jason.miller@readytalk.com',
  'jeffrey.stephens@readytalk.com',
  'kristina.kemmer@readytalk.com',
  'samantha.morgan@readytalk.com',
  'santino.vialpando@readytalk.com',
  'sean.sutherland@readytalk.com',
];

getUserIds(users)
.then(ids => {
  console.log('ids ', ids);
  let plan = [];
  let sleep = 0;
  for(let [email, id] of ids.entries()) {
    console.log('result ' + id);
    const s = sleep;
    plan.push(new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          console.log('plan ' + id);
          resolve(sendSurvey(id))
        } catch(e) {
          reject(e);
        }
      }, s);
    }));
    sleep += 1000;
  }

  return Promise.all(plan);
})
.catch(e => console.error(e.stack ? e.stack : e));
