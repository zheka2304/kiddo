export interface Taggable {
  getTags(): Set<string>;
  addTag(tag: string): void;
  removeTag(tag: string): void;
}
