import React from "react";
import * as Composer from "./Composer.tsx";

export const CommonActions = React.memo(() => {
  return (
    <>
      <Composer.PlusMenu />
      <Composer.TextFormat />
      <Composer.Emojis />
      <Composer.Mentions />
      <Composer.Divider />
      <Composer.Video />
      <Composer.Audio />
      <Composer.SlashCommands />
    </>
  );
});
