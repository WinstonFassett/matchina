type Thing<T> = { t: T}

const thing = { t: 1 }

function anything (thing: Thing<any>) {

}
anything(thing)

type StateMachineContext = {
  states: Record<string, any>,
  transitions: TransitionRecord
}