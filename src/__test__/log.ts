import { ulid } from 'ulid';
import { LogType } from '../log';

export class FakeLog implements LogType {
  id: string;
  parent: FakeLog | undefined;
  static Logs = new Map<string, FakeLog>();
  keys: Record<string, unknown> | undefined;

  constructor(keys?: Record<string, unknown>, parent?: FakeLog) {
    this.id = ulid();
    this.parent = parent;
    this.keys = keys;
    FakeLog.Logs.set(this.id, this);
  }

  logs: Record<string, unknown>[] = [];

  level = 'debug';

  trace = this.logFunc('trace');
  debug = this.logFunc('debug');
  info = this.logFunc('info');
  warn = this.logFunc('warn');
  error = this.logFunc('error');
  fatal = this.logFunc('fatal');

  log(obj: Record<string, unknown>): void {
    this.logs.push(obj);
    if (this.parent) this.parent.log(obj);
  }

  logFunc(level: string) {
    return (obj: Record<string, unknown> | string, msg?: string): void => {
      const logObj = { ...this.keys, level, msg };
      if (typeof obj === 'object') Object.assign(logObj, obj);
      else logObj.msg = msg;
      this.log(logObj);
    };
  }

  child(obj: Record<string, unknown>): FakeLog {
    return new FakeLog(obj, this);
  }
}

export const fakeLog = new FakeLog();
