import React, { useMemo } from "react";
import { FileUploaderView } from "./FileUploaderView";
import { createUploaderMachine } from "./machine";

export function FileUploaderDemo() {
  const machine = useMemo(createUploaderMachine, []);
  return <FileUploaderView machine={machine} />;
}
