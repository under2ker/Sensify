declare module "turndown" {
  export default class TurndownService {
    constructor(options?: Record<string, unknown>);
    turndown(html: string): string;
    addRule(
      name: string,
      rule: {
        filter: string | string[] | ((node: unknown) => boolean);
        replacement: (content: string, node: unknown) => string;
      }
    ): void;
  }
}
