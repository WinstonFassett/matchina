import { StarlightTypeDocTheme } from "./theme";

export function load(app: any) {
  app.renderer.defineTheme("starlight-typedoc-custom", StarlightTypeDocTheme);
}
