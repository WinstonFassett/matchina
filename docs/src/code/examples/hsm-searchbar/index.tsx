import React, { useMemo } from "react";
import { SearchBarView } from "./SearchBarView";
import { createSearchBarMachine } from "./machine";

export function SearchBarDemo() {
  const machine = useMemo(createSearchBarMachine, []);
  return <SearchBarView machine={machine} />;
}
