import { MatchboxConfig, MatchboxFactory, Matchers } from "./matchbox-types";

export * from "./matchbox-types";

export function matchboxFactory<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
>(
  config: Config,
  tagKey: TagKey = "tag" as TagKey,
): MatchboxFactory<Config, TagKey> {
  const createObj: any = {};
  for (const tag of Object.keys(config)) {
    const value = config[tag];
    if (typeof value === "function") {
      createObj[tag] = (...args: any) => {
        const data = value(...args);
        return matchbox(tag, data, tagKey);
      };
    } else if (typeof value === "object") {
      createObj[tag] = () => matchbox(tag, value, tagKey);
    } else if (value === undefined) {
      createObj[tag] = () => matchbox(tag, {}, tagKey);
    }
  }
  return createObj;
}

export function matchbox<
  Config extends MatchboxConfig,
  Tag extends keyof Config,
  TagKey extends string = "tag",
  D = any,
>(tag: Tag, data: D, tagKey: TagKey = "tag" as TagKey) {
  return new MatchboxImpl<Config, TagKey>(tag, data, tagKey);
}

class MatchboxImpl<
  Config extends MatchboxConfig,
  TagKey extends string = "tag",
  Tag extends keyof Config = keyof Config,
> {
  data: any;
  [tagKey: string]: any;

  constructor(
    public tag: Tag,
    data: any,
    tagKey: TagKey,
  ) {
    Object.assign(this, { [tagKey]: tag, tagKey }, { data });
  }

  match(casesObj: Matchers<Config>, exhaustive = true): any {
    const handler = (casesObj as any)[this.tag];
    if (handler) {
      return handler(this.data);
    } else if (casesObj._) {
      return casesObj._(this.data);
    } else if (exhaustive) {
      throw new Error(
        `Match did not handle ${this.tagKey}: '${this.tag.toString()}'`,
      );
    }
  }
}
