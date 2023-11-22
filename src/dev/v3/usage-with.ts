import { createNanoEvents } from 'nanoevents'
import { atom } from 'nanostores'
import { defineStates } from '../../states';
import { createFactoryMachine } from './factory-machine';
import { setupMachine, guard, before, after, notify } from './machine-setup';


const states = defineStates({
  Idle: undefined,
  Pending: (x: number) => ({ s: `#${x}` }),
  Resolved: (ok: boolean) => ({ ok }),
  Rejected: (err: Error) => ({ err })
});

const m4 = createFactoryMachine(states, {
  Idle: { execute: 'Pending'},
  Pending: { resolve: 'Resolved', reject: 'Rejected' },
  Resolved: {},
  Rejected: {}
}, states.Idle())
m4.getChange().to

setupMachine(m4)(
  guard(ev => ev.type !== 'execute' || ev.params[0] > 0),
  before(ev => { if(ev.type == 'execute'){ console.log('executing') } }),
  after(ev => console.log(ev.to.match<any>({
    Pending: (ev) => ev.s,
    Resolved: (ev) => ev.ok,
    Rejected: (ev) => ev.err,
    _: () => false
  }))),
)

m4.send('execute', 1)

const it = createNanoEvents()
setupMachine(m4)(
  m => { 
    Object.assign(m, {
      emit: v => it.emit(v),
      subscribe: (t,l) => it.on(t, l)
    })
    return () => {
      delete m.emit
      delete m.subscribe
    }
  },
  notify((m4 as any).emit)
)

