import { Funcware } from "./Funcware";



export const whenware = <F extends (...params: any[]) => any>(
  test: (...params: Parameters<F>) => boolean | void,
  ware: Funcware<F>
) => {
  return (inner: F) => (...params: Parameters<F>) => {
    // console.log('whenware')
    if (test(...params)) {
      // console.log('PASSED')
      return ware(inner)(...params);
    }
    // console.log('FAILED')
    return inner(...params);
  };
};
