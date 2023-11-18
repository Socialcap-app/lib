import { Field } from 'o1js';

export { UTCDateTime, ISO8601 } ;

type ISO8601 = string; // 2023‐06‐23T20:20:11.000Z // UTC time

class UTCDateTime extends Field {

  constructor(ts: number) {
    super(ts);
  }

  static fromString(isoString?: ISO8601): Field {
    const utc = isoString || (new Date()).toISOString();
    const ts = (new Date(utc)).getTime();
    return new UTCDateTime(ts);
  }

  static now(): Field {
    const utc = (new Date()).toISOString();
    const ts = (new Date(utc)).getTime();
    return new UTCDateTime(ts);
  }

  static fromField(f: Field): string {
    let ts = Number(f.toBigInt()); // millisec since 1970 in UTC
    const utc = new Date(ts).toISOString();
    return utc;
  }

  toPrettyDate(): string {
    let ts = Number(this.toBigInt()); // millisec since 1970 in UTC
    const utc = new Date(ts);
    const mo = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
    return `${utc.getDate()} ${mo[utc.getMonth()]} ${utc.getFullYear()}`;
  }
  
  toPrettyDateTime(): string {
    // utc.getHours()
    // utc.getMinutes()
    // utc.getSeconds
    // utc.getS
    return "";
  }

  /*
    UTCDateTime.now().toString();
  */
}

function testIt() {
  let createdUTC = "2023-05-01 12:01:01.000";

  let fi = UTCDateTime.fromString(createdUTC);
  let fi2str= UTCDateTime.fromField(fi);

  console.log(`${createdUTC} | ${fi.toString()} | ${fi2str}`);
}

//testIt();
