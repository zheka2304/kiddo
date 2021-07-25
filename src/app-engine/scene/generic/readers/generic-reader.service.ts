import {SceneReader} from '../../common/readers/scene.reader';
import {SceneModel} from '../../common/models/scene-model';
import {GameStatistics} from '../../common/entities';
import {SceneType} from '../../common/models/scene-type.enum';
import {Singleton} from '../../../singleton.decorator';
import {GenericSceneModel} from '../models/generic-scene-model';
import {SceneModelService} from '../../scene-model.service';
import {GenericGridCell} from '../entities/generic-grid-field';
import {GenericGameObject} from '../entities/generic-game-object';
import {DefaultTags} from '../entities/default-tags.enum';


@Singleton
export class GenericReaderService implements SceneReader {
  public sceneModel: GenericSceneModel;

  constructor(
    private sceneModelService: SceneModelService
  ) {
  }

  init(): void {
    this.sceneModel = this.sceneModelService.sceneModel as GenericSceneModel;
  }

  isLevelFinished(): boolean {
    return true;
  }

  getGameFailMessage(): string {
    return null;
  }

  getGameStatistics(): GameStatistics {
    return {
      failReason: null,
      failRowNumber: 0,
      gameFinished: false,
      levelPassed: false
    };
  }

  getSceneType(): SceneType {
    return SceneType.GENERIC;
  }

  sceneIsPlaybackable(): boolean {
    return false;
  }


  checkLevelCompletedSuccessfully(): boolean {
    return false;
  }


  isPositionOnField(x: number, y: number): boolean {
    const field = this.sceneModel.field;
    return x >= 0 && x < field.width && y >= 0 && y < field.height;
  }

  getCellAt(x: number, y: number): GenericGridCell {
    const field = this.sceneModel.field;
    if (x >= 0 && x < field.width && y >= 0 && y < field.height) {
      return field.grid[Math.floor(x) + Math.floor(y) * field.width];
    } else {
      return null;
    }
  }

  getGameObjectsAt(x: number, y: number, exclude?: GenericGameObject[]): GenericGameObject[] {
    x = Math.floor(x);
    y = Math.floor(y);
    const gameObjects: GenericGameObject[] = [];
    for (const gameObject of this.sceneModel.gameObjects) {
      if (
        gameObject.position.x === x && gameObject.position.y === y &&
        (!exclude || exclude.indexOf(gameObject) === -1) &&
        !gameObject.getTags().has(DefaultTags.DESTROYED)
      ) {
        gameObjects.push(gameObject);
      }
    }
    return gameObjects;
  }

  getTileTagsAt(x: number, y: number): Set<string> {
    const tags = new Set<string>();
    const cell = this.getCellAt(x, y);
    if (cell) {
      for (const tile of cell.tiles) {
        tile.getTags().forEach(tag => tags.add(tag));
      }
    } else {
      tags.add(DefaultTags.OUTSIDES);
    }
    return tags;
  }

  getGameObjectTagsAt(x: number, y: number, exclude?: GenericGameObject[]): Set<string> {
    const tags = new Set<string>();
    for (const gameObject of this.getGameObjectsAt(x, y, exclude)) {
      gameObject.getTags().forEach(tag => tags.add(tag));
    }
    return tags;
  }

  getAllTagsAt(x: number, y: number, exclude?: GenericGameObject[], minLightLevel?: number): Set<string> {
    if (minLightLevel) {
      const cell = this.getCellAt(x, y);
      if (cell && cell.lightLevel < minLightLevel) {
        return new Set<string>([DefaultTags.DARKNESS]);
      }
    }
    const tags = this.getTileTagsAt(x, y);
    this.getGameObjectTagsAt(x, y, exclude).forEach(tag => tags.add(tag));
    return tags;
  }
}
