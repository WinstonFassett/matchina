import { createFactoryMachine, matchboxFactory } from "../src";

const ConnectionProtocol = matchboxFactory({
  connecting: undefined,
  connected: undefined,
  disconnected: undefined,
  error: (error: Error) => ({ error }),
}, "type")

type HandshakeContext = {
  name: string;
}

const HandshakeProtocol = matchboxFactory({
  handshake: (handshake: HandshakeContext) => handshake,
  accepted: (handshake: HandshakeContext) => handshake,
  rejected: (handshake: HandshakeContext, reason: string) => ({ ...handshake, reason }),
}, "type")

const createHandshakeMachine = (name: string, options: { maxTries?: number } = {} ) => {
  return createFactoryMachine(HandshakeProtocol, {
    handshake: {
      accepted: "accepted",
      rejected: "rejected"
    },
    accepted: {},
    rejected: {}
  }, HandshakeProtocol.handshake({ name }))
}

const RequestResponseProtocol = matchboxFactory({
  request: (url: string, data?: any) => ({ url, data }),
  response: (data: any) => ({ data }),
  error: (error: Error) => ({ error }),
}, "type")

const ErrorProtocol = matchboxFactory({
  error: (error: Error) => ({ error }),
}, "type")

const TodoOutProtocol = matchboxFactory({
  todo: (text: string) => ({ text }),
  done: (idList: string) => ({ done: idList.split(' ') }),
  clear: undefined,
}, "type")

const TodoInProtocol = matchboxFactory({
  added: (id: string, text: string) => ({ id, text }),
  done: (ids: string[]) => ({ ids }),
  removed: (id: string, text?: string) => ({ id, text }),
}, "type")

const WriterOutProtocol = matchboxFactory({
  go: (index: number) => ({ index }),
  select: (index: number, length: number) => ({ index, length }),
  write: (text: string) => ({ text }),
  delete: (index: number) => ({ index }),
  error: (error: Error) => ({ error }),
}, "type")

const WriterInProtocol = matchboxFactory({
  wrote: (index: number, text: string) => ({ index, text }),
  selected: (index: number, length: number) => ({ index, length }),
  deleted: (index: number) => ({ index }),  
}, "type")

const RequestContentRangeProtocol = matchboxFactory({
  request: (index: number, length: number) => ({ index, length }),
  response: (data: any) => ({ data }),
  error: (error: Error) => ({ error }),
}, "type")

type AllowPromise<T> = T | Promise<T>;

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function retry<T>(
  fn: () => AllowPromise<T>,
  maxTimes: number,
  wait: (retry: number) => Promise<void>,
): Promise<T> {
  let error;
  for (let i = 0; i < maxTimes; i++) {
    try {
      return await fn();
    } catch (e) {
      error = e;
      await wait(1 + i);
    }
  }
  throw error;
}
