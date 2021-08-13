import {GenericGameObject} from '../entities/generic-game-object';
import {Coords, Direction} from '../../common/entities';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GenericReaderService} from '../readers/generic-reader.service';
import {DefaultTags} from '../entities/default-tags.enum';
import {LightSourceParams} from '../helpers/lighting-helper.service';
import {CharacterSkin} from '../services/character-skin-registry.service';
import {CharacterActionType, CharacterBase} from './character-base';


export interface GenericPlayerParameters {
  skin?: string | CharacterSkin;
  defaultLightSources?: LightSourceParams[];

  minVisibleLightLevel?: number;
  interactRange?: number;
  lookRange?: number;
  initialRotation?: Direction;
}

export class GenericPlayer extends CharacterBase {
  private failReason: string = null;

  constructor(
    position: Coords,
    private parameters: GenericPlayerParameters
  ) {
    super(position, parameters?.initialRotation || Direction.RIGHT, parameters?.skin);
    this.addImmutableTag(DefaultTags.PLAYER);
  }

  onTick(writer: GenericWriterService): void {
    super.onTick(writer);
  }

  onPostTick(writer: GenericWriterService): void {
    super.onPostTick(writer);
    this.checkForHazards(writer.getReader());
  }

  protected checkForHazards(reader: GenericReaderService): void {
    const tags = reader.getAllTagsAt(this.position.x, this.position.y, [ this ]);
    if (tags.has(DefaultTags.DEADLY)) {
      this.failReason = 'DESTROYED';
      if (tags.has(DefaultTags.MONSTER)) {
        this.failReason = 'CAUGHT_BY_MONSTER';
      }
    } else if (tags.has(DefaultTags.OBSTACLE)) {
      this.failReason = 'IN_OBSTACLE';
    }
  }


  getFailReason(): string {
    return this.failReason;
  }

  getMinVisibleLightLevel(reader: GenericReaderService): number {
    return this.parameters?.minVisibleLightLevel || 0;
  }

  validateInspectOffset(offset: Coords): boolean {
    const range = this.parameters?.lookRange;
    return range ? (Math.abs(offset.x) <= range && Math.abs(offset.y) <= range) : true;
  }

  validateInteractOffset(offset: Coords): boolean {
    const range = this.parameters?.interactRange || 1;
    return (Math.abs(offset.x) <= range && Math.abs(offset.y) <= range);
  }

  validateLookRange(range: number): boolean {
    const lookRange = this.parameters?.lookRange;
    return lookRange ? range <= lookRange : true;
  }

  getLookRange(): number {
    const lookRange = this.parameters?.lookRange;
    return lookRange ? lookRange : 32;
  }

  getLightSources(): LightSourceParams[] {
    return this.parameters?.defaultLightSources || [];
  }


  move(reader: GenericReaderService, offset: Coords = { x: 0, y: 1 }): boolean {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    if (
      reader.isPositionOnField(position.x, position.y) &&
      !reader.getAllTagsAt(position.x, position.y, [this]).has(DefaultTags.OBSTACLE)
    ) {
      this.position = position;
      return true;
    } else {
      return false;
    }
  }

  turn(reader: GenericReaderService, rotate: Direction): void {
    this.direction = this.navigationHelper.rotate(this.direction, rotate);
  }

  getAllTagsRelativeToPlayer(
    reader: GenericReaderService,
    offset: Coords,
    exclude?: GenericGameObject[],
    showAction?: boolean
  ): Set<string> {
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    if (showAction) {
      this.addAction(position, CharacterActionType.READ);
    }
    return reader.getAllTagsAt(position.x, position.y, exclude, this.getMinVisibleLightLevel(reader));
  }

  lookForCellsWithTag(
    reader: GenericReaderService,
    tag: string,
    range: number,
    showAction?: boolean
  ): Coords[] {
    const result: Coords[] = [];
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        const tags = reader.getAllTagsAt(this.position.x + x, this.position.y + y, [], this.getMinVisibleLightLevel(reader));
        if (tags.has(tag)) {
          result.push(this.navigationHelper.offset({ x: 0, y: 0 }, this.direction, { x, y }));
          if (showAction) {
            this.addAction({ x: this.position.x + x, y: this.position.y + y }, CharacterActionType.READ);
          }
        }
      }
    }
    result.sort((a, b) => (Math.abs(a.x) + Math.abs(a.y)) - (Math.abs(b.x) + Math.abs(b.y)));
    return result;
  }

  interact(
    writer: GenericWriterService,
    offset: Coords,
    exclude?: GenericGameObject[],
    showAction?: boolean
  ): GenericGameObject {
    const reader = writer.getReader();
    const position = this.navigationHelper.offset(this.position, this.direction, offset);
    if (showAction) {
      this.addAction(position, CharacterActionType.INTERACT);
    }
    if (reader.getLightLevelAt(position.x, position.y) >= this.getMinVisibleLightLevel(reader)) {
      return writer.interact(position.x, position.y, this, exclude);
    }
    return null;
  }
}
