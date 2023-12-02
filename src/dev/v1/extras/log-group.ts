function logGroup(name: string, logFunction: () => void) {
  console.log(`${name}`);
  console.group();
  logFunction();
  console.groupEnd();
  console.log(`/${name}`);
}
