import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export class SipuniCallItem {
  type: string;
  status: string;
  time: Date;
  from: string;
  to: string;
  answeredBy: string;
  totalDuration: number;
  callDuration: number;

  constructor(line: string) {
    const data = line.split(';');

    this.type = data[0];
    this.status = data[1];
    this.time = dayjs(data[2], 'DD.MM.YYYY HH:mm:ss').toDate();
    this.from = data[4];
    this.to = data[5];
    this.answeredBy = data[6];
    this.totalDuration = +data[7];
    this.callDuration = +data[8];
  }
}
