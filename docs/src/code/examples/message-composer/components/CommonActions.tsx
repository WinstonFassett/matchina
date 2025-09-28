import * as Composer from './Composer.tsx';

export function CommonActions() {
  return (
    <>
  <Composer.PlusMenu />
  <Composer.TextFormat />
  <Composer.Emojis />
  <Composer.Mentions />
  <Composer.Divider />
  <Composer.Video />
  <Composer.Audio />
  <Composer.Divider />
  <Composer.SlashCommands />
    </>
  );
}
