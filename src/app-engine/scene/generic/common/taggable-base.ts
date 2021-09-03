import {Taggable} from '../entities/taggable';

export class TaggableBase implements Taggable {
  private mutableTags = new Set<string>();
  private immutableTags = new Set<string>();
  private allTags = new Set<string>();

  public getTags(): Set<string> {
    return this.allTags;
  }

  public addTag(tag: string): void {
    if (!this.immutableTags.has(tag)) {
      this.mutableTags.add(tag);
      this.allTags.add(tag);
    }
  }

  public removeTag(tag: string): void {
    if (this.mutableTags.delete(tag)) {
      this.allTags.delete(tag);
    }
  }

  protected addImmutableTag(tag: string): void {
    this.mutableTags.delete(tag);
    this.immutableTags.add(tag);
    this.allTags.add(tag);
  }

  protected removeImmutableTag(tag: string): void {
    if (this.immutableTags.delete(tag)) {
      this.allTags.delete(tag);
    }
  }

}
