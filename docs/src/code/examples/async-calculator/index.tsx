import { AsyncCalculatorView } from "./AsyncCalculatorView";
import { useAsyncCalculator } from "./hooks";

export function AsyncCalculator() {
  const calculator = useAsyncCalculator();
  return <AsyncCalculatorView machine={calculator} />;
}
