import { matchboxFactory } from 'matchina';

const Animal = matchboxFactory({
  Dog: (name: string) => ({ name }),
  Cat: (name: string) => ({ name }),
  Bird: (name: string) => ({ name })
});

const pet = Animal.Dog('Rex');

// Non-exhaustive matching (second parameter set to false)
const sound = pet.match({
  Dog: () => 'Woof',
  Cat: () => 'Meow'
}, false);

// If pet is a Bird, sound will be undefined
