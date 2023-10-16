export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export const delayed = (ms: number, result: any) => async () => {
  await delay(ms);
  return result;
};
