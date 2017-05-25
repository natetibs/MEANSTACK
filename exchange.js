const fs = require('fs');

const request = require('request');
const parseXml = require('xml-parser');

const time = require('./time.js');
const intent = require('./intent.js');
const rooms = require('./rooms.js');
const output = require('./output.js');
const auth = require('./auth.json');

function makeRequest(body) {
  // console.log("request body: " + body);
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: 'https://wynent04.readytalk.com/EWS/Exchange.asmx',
      body: body,
      auth: auth,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Accept': 'text/xml',
        'User-Agent': 'ExchangeServicesClient/15.00.0913.015',
      },
      callback: function(error, response, body) {
        if(error != null) {
          reject(error);
        }
        resolve(body);
      }
    });
  });
}

function basicHeader() {
  return `` +
    `<t:RequestServerVersion Version="Exchange2007_SP1" />` +
    `<t:TimeZoneContext>` +
      `<t:TimeZoneDefinition Id="GMT Standard Time" />` +
    `</t:TimeZoneContext>`;
}

function getFolderAttributesBody(name) {
  return `` +
    `<m:GetFolder>` +
      `<m:FolderShape>` +
        `<t:BaseShape>IdOnly</t:BaseShape>` +
      `</m:FolderShape>` +
      `<m:FolderIds>` +
        `<t:DistinguishedFolderId Id="${name}" />` +
      `</m:FolderIds>` +
    `</m:GetFolder>`;
}

function getFindItemBody(folderAttrs, timeRange) {
  return `` +
    `<m:FindItem Traversal="Shallow">` +
      `<m:ItemShape>` +
        `<t:BaseShape>IdOnly</t:BaseShape>` +
        `<t:AdditionalProperties>` +
          `<t:FieldURI FieldURI="item:Subject" />` +
          `<t:FieldURI FieldURI="calendar:Start" />` +
          `<t:FieldURI FieldURI="calendar:End" />` +
          `<t:FieldURI FieldURI="item:DisplayTo" />` +
          `<t:FieldURI FieldURI="calendar:Location" />` +
        `</t:AdditionalProperties>` +
      `</m:ItemShape>` +
      `<m:CalendarView StartDate="${timeRange.start.toISOString()}" EndDate="${timeRange.end.toISOString()}" />` +
      `<m:ParentFolderIds>` +
        `<t:FolderId Id="${folderAttrs.Id}" ChangeKey="${folderAttrs.ChangeKey}" />` +
      `</m:ParentFolderIds>` +
    `</m:FindItem>`;
}

function getItemBody(attrs) {
  return `` +
    `<m:GetItem>` +
      `<m:ItemShape>` +
        `<t:BaseShape>AllProperties</t:BaseShape>` +
      `</m:ItemShape>` +
      `<m:ItemIds>` +
        `<t:ItemId Id="${attrs.Id}" ChangeKey="${attrs.ChangeKey}" />` +
      `</m:ItemIds>` +
    `</m:GetItem>`;
}

function getUserAvailabilityRequestBody(start, end, roomEmail) {
  return `` +
    `<m:GetUserAvailabilityRequest>` +
      `<t:TimeZone>` +
        `<t:Bias>420</t:Bias>` +
        `<t:StandardTime>` +
          `<t:Bias>0</t:Bias>` +
          `<t:Time>02:00:00</t:Time>` +
          `<t:DayOrder>1</t:DayOrder>` +
          `<t:Month>11</t:Month>` +
          `<t:DayOfWeek>Sunday</t:DayOfWeek>` +
        `</t:StandardTime>` +
        `<t:DaylightTime>` +
          `<t:Bias>-60</t:Bias>` +
          `<t:Time>02:00:00</t:Time>` +
          `<t:DayOrder>2</t:DayOrder>` +
          `<t:Month>3</t:Month>` +
          `<t:DayOfWeek>Sunday</t:DayOfWeek>` +
        `</t:DaylightTime>` +
      `</t:TimeZone>` +
      `<m:MailboxDataArray>` +
        `<t:MailboxData>` +
          `<t:Email>` +
            `<t:Address>${roomEmail}</t:Address>` +
          `</t:Email>` +
          `<t:AttendeeType>Required</t:AttendeeType>` +
          `<t:ExcludeConflicts>false</t:ExcludeConflicts>` +
        `</t:MailboxData>` +
      `</m:MailboxDataArray>` +
      `<t:FreeBusyViewOptions>` +
        `<t:TimeWindow>` +
          `<t:StartTime>${start.toISOString()}</t:StartTime>` +
          `<t:EndTime>${end.toISOString()}</t:EndTime>` +
        `</t:TimeWindow>` +
        `<t:MergedFreeBusyIntervalInMinutes>30</t:MergedFreeBusyIntervalInMinutes>` +
        `<t:RequestedView>Detailed</t:RequestedView>` +
      `</t:FreeBusyViewOptions>` +
    `</m:GetUserAvailabilityRequest>`;
}

function sendMeetingInvitationsBody(info) {
  return `` +
    `<m:CreateItem SendMeetingInvitations="SendOnlyToAll">` +
      `<m:Items>` +
        `<t:CalendarItem>` +
          `<t:Subject>${info.subject}</t:Subject>` +
          `<t:Start>${info.start.toISOString()}</t:Start>` +
          `<t:End>${info.end.toISOString()}</t:End>` +
          `<t:Location>${info.location}</t:Location>` +
          `<t:IsResponseRequested>true</t:IsResponseRequested>` +
          `<t:RequiredAttendees>` +
            `<t:Attendee>` +
              `<t:Mailbox>` +
                `<t:EmailAddress>${info.attendeeEmail}</t:EmailAddress>` +
              `</t:Mailbox>` +
            `</t:Attendee>` +
          `</t:RequiredAttendees>` +
          `<t:Resources>` +
            `<t:Attendee>` +
              `<t:Mailbox>` +
                `<t:EmailAddress>${info.roomEmail}</t:EmailAddress>` +
              `</t:Mailbox>` +
            `</t:Attendee>` +
          `</t:Resources>` +
          `<t:MeetingTimeZone TimeZoneName="GMT Standard Time" />` +
        `</t:CalendarItem>` +
      `</m:Items>` +
    `</m:CreateItem>`;
}

function cancelCalendarItemBody(attrs) {
  return `` +
    `<m:CreateItem MessageDisposition="SendAndSaveCopy">` +
      `<m:Items>` +
        `<t:CancelCalendarItem>` +
          `<t:ReferenceItemId Id="${attrs.Id}" ChangeKey="${attrs.ChangeKey}" />` +
          `<t:NewBodyContent BodyType="HTML">Removed by SquattyBot</t:NewBodyContent>` +
        `</t:CancelCalendarItem>` +
      `</m:Items>` +
    `</m:CreateItem>`;
}

function soapEnvelope(header, body) {
  return `` +
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope ` +
      `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
      `xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages" ` +
      `xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types" ` +
      `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
      `<soap:Header>${header}</soap:Header>` +
      `<soap:Body>${body}</soap:Body>` +
    `</soap:Envelope>`;
}

function xmlPath(xml, path) {
  for(let p of path) {
    let found = false;
    for(let ch of xml.children) {
      if(ch.name == p) {
        xml = ch;
        found = true;
        break;
      }
    }
    if(!found) {
      throw new Error("couldn't find path element '" + p + "'.");
    }
  }
  return xml;
}

function xmlContents(xml, tags) {
  const res = {}
  for(let a of Object.keys(tags)) {
    let t = tags[a];
    if(!(t instanceof Array)) {
      t = [t];
    }
    res[a] = xmlPath(xml, t).content;
  }
  return res;
}

function xmlEach(xml, name) {
  return xml.children.filter(ch => ch.name == name);
}

function getFolderAttributes(name) {
  return makeRequest(soapEnvelope(basicHeader(), getFolderAttributesBody(name)))
    .then(parseXml)
    .then(xml => {
      const resp = xmlPath(xml.root, ['s:Body', 'm:GetFolderResponse', 'm:ResponseMessages', 'm:GetFolderResponseMessage']);
      const status = xmlPath(resp, ['m:ResponseCode']).content;

      if(status != "NoError") {
        throw new Error("bad status on response: " + JSON.stringify(xml, null, 2));
      }

      const folders = xmlPath(resp, ['m:Folders']);

      if(folders.children.length != 1) {
        throw new Error("too many (or zero) response folders: " + JSON.stringify(xml, null, 2));
      }

      const folder = folders.children[0];

      let attrs = xmlPath(folder, ['t:FolderId']).attributes;

      if(typeof attrs.Id === 'string' && typeof attrs.ChangeKey === 'string') {
        return attrs;
      }

      throw new Error("couldn't find folder id in response: " + JSON.stringify(xml, null, 2));
    });
}

let calendar = getFolderAttributes('calendar');

function findMeetings(timeRange) {
  const startDay = time.roundToUtcDay(timeRange.start);
  const endDay = time.roundToUtcDay(timeRange.end);
  endDay.setDate(endDay.getDate() + 1);

  return calendar.then(calendarFolderAttrs => {
    return makeRequest(soapEnvelope(basicHeader(), getFindItemBody(calendarFolderAttrs, {start: startDay, end: endDay})))
  }).then(parseXml)
  .then(xml => {
    // console.log(JSON.stringify(xml, null, 2));
    const resp = xmlPath(xml.root, ['s:Body', 'm:FindItemResponse', 'm:ResponseMessages', 'm:FindItemResponseMessage']);
    const status = xmlPath(resp, ['m:ResponseCode']).content;

    if(status != "NoError") {
      throw new Error("bad status on response: " + JSON.stringify(xml, null, 2));
    }

    const items = xmlPath(resp, ['m:RootFolder', 't:Items']);

    return xmlEach(items, 't:CalendarItem').map((it) => {
      const attrs = xmlPath(it, ['t:ItemId']).attributes;
      const props = xmlContents(it, {subject: 't:Subject', start: 't:Start', end: 't:End', location: 't:Location'});

      props.attrs = attrs;

      props.start = new Date(props.start);
      props.end = new Date(props.end);

      return props;
    }).filter(it => time.overlaps(it, timeRange));
  });
}

function getItem(attrs) {
  // console.log("attrs: ", attrs);
  return makeRequest(soapEnvelope(basicHeader(), getItemBody(attrs)))
  .then(parseXml)
  .then(xml => {
    const resp = xmlPath(xml.root, ['s:Body', 'm:GetItemResponse', 'm:ResponseMessages', 'm:GetItemResponseMessage']);
    const status = xmlPath(resp, ['m:ResponseCode']).content;

    if(status != "NoError") {
      throw new Error("bad status on response: " + JSON.stringify(xml, null, 2));
    }

    // console.log("resp: " + JSON.stringify(resp, null, 2));

    const items = xmlPath(resp, ['m:Items', 't:CalendarItem']);

    const keys = [
      "ItemId", "ParentFolderId", "ItemClass", "Subject", "Sensitivity",
      "Body", "DateTimeReceived", "Size", "Importance", "IsSubmitted",
      "IsDraft", "IsFromMe", "IsResend", "IsUnmodified", "DateTimeSent",
      "DateTimeCreated", "ReminderDueBy", "ReminderIsSet",
      "ReminderMinutesBeforeStart", "DisplayCc", "DisplayTo", "HasAttachments",
      "Culture", "LastModifiedName", "LastModifiedTime", "UID", "DateTimeStamp",
      "Start", "End", "IsAllDayEvent", "LegacyFreeBusyStatus", "Location",
      "IsMeeting", "IsCancelled", "IsRecurring", "MeetingRequestWasSent",
      "IsResponseRequested", "CalendarItemType", "MyResponseType",
      "ConflictingMeetingCount", "AdjacentMeetingCount", "Duration", "TimeZone",
      "AppointmentSequenceNumber", "AppointmentState"
    ];

    const keyObj = {};

    for(let k of keys) {
      keyObj[k.charAt(0).toLowerCase() + k.slice(1)] = 't:' + k;
    }

    const props = xmlContents(items, keyObj);

    props.organizer = xmlPath(items, ['t:Organizer', 't:Mailbox', 't:EmailAddress']);
    props.requiredAttendees = xmlEach(xmlPath(items, ['t:RequiredAttendees']), 't:Attendee').map(a =>
      xmlPath(a, ['t:Mailbox', 't:EmailAddress']).content);
    props.attrs = attrs;

    props.start = new Date(props.start);
    props.end = new Date(props.end);

    return props;
  });
}

function getAvailability(timeRange, roomEmail) {
  const startDay = time.roundToUtcDay(timeRange.start);
  const endDay = time.roundToUtcDay(timeRange.end);
  endDay.setDate(endDay.getDate() + 1);

  return makeRequest(soapEnvelope(basicHeader(), getUserAvailabilityRequestBody(startDay, endDay, roomEmail)))
  .then(parseXml)
  .then(xml => {
    // console.log(JSON.stringify(xml, null, 2));
    const resp = xmlPath(xml.root, ['s:Body', 'GetUserAvailabilityResponse', 'FreeBusyResponseArray', 'FreeBusyResponse']);

    const status = xmlPath(resp, ['ResponseMessage', 'ResponseCode']).content;

    if(status != "NoError") {
      throw new Error("bad status on response: " + JSON.stringify(xml, null, 2));
    }

    const arrays = xmlEach(xmlPath(resp, ['FreeBusyView']), 'CalendarEventArray');


    return arrays.map(arr => {
      const events = xmlEach(arr, 'CalendarEvent');

      return events.map(e => {
        // console.log(roomEmail + ": " + JSON.stringify(e, null, 2));
        let r = xmlContents(e, {start: 'StartTime', end: 'EndTime'});
        r.start = new Date(r.start + 'Z');
        r.end = new Date(r.end + 'Z');
        r.room = roomEmail;
        return r;
      });
    }).reduce((a, b) => a.concat(b), []);
  });
}

function sendMeetingInvitation(info) {
  return makeRequest(soapEnvelope(basicHeader(), sendMeetingInvitationsBody(info)))
  // .then(r => { console.log(r); return r;})
  .then(parseXml)
  .then(xml => {
    const resp = xmlPath(xml.root, ['s:Body', 'm:CreateItemResponse', 'm:ResponseMessages', 'm:CreateItemResponseMessage']);

    const status = xmlPath(resp, ['m:ResponseCode']).content;

    if(status != "NoError") {
      throw new Error("bad status on response: " + JSON.stringify(xml, null, 2));
    }

    return {
        status:"success",
        roomEmail: info.roomEmail,
        start: info.start,
        end: info.end,
    };
  });
}

function getUsefulRoomAvailability(room, timeRange) {
  return getAvailability(timeRange, room).then(events => {
    // console.log(room + ": " + JSON.stringify(events, null, 2));
    let avail = time.computeAvailability(timeRange, events);
    avail.room = room;
    return avail;
  });
}

function cancelMeeting(inviteeEmails, timeRange) {
  return findMeetings(timeRange).then(meetings =>
    Promise.all(meetings.map(m => getItem(m.attrs))))
    .then(meetings => {
      for(let m of meetings) {
        if(m.subject.indexOf("Squatting in ") == 0 && inviteeEmails.some(e => m.requiredAttendees.indexOf(e) >= 0)) {
          return makeRequest(soapEnvelope(basicHeader(), cancelCalendarItemBody(m.attrs)))
          .then(parseXml)
          .then(xml => {
            const resp = xmlPath(xml.root, ['s:Body', 'm:CreateItemResponse', 'm:ResponseMessages', 'm:CreateItemResponseMessage']);
            const status = xmlPath(resp, ['m:ResponseCode']).content;

            if(status != "NoError") {
              throw new Error("bad status on response: " + JSON.stringify(xml, null, 2));
            }

            return {
              status: 'canceled',
              start: m.start,
              end: m.end,
              subject: m.subject,
              location: m.location,
              attendeeEmail: inviteeEmails[0],
            };
          });
        }
      }

      return {
        status: 'notfound'
      };
    });
}

module.exports = {getAvailability, getUsefulRoomAvailability, cancelMeeting, sendMeetingInvitation};

let t = time.nextHourRoundedTo15Minutes(new Date());

// console.log(sendMeetingInvitation({
//             subject: `Squatting in lawrence`,
//             start: t.start,
//             end: t.end,
//             location: "Lawrence",
//             attendeeEmail: "joshua.warner@readytalk.com",
//             roomEmail: "crlawrence@readytalk.com"}));

// getUsefulRoomAvailability('crlawrence@readytalk.com', t).then(avail => {
//   console.log(JSON.stringify(avail, null, 2));
// });
