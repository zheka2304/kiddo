import {SceneReader} from '../../common/readers/scene.reader';
import {SceneModel} from '../../common/models/scene-model';
import {GameStatistics} from '../../common/entities';
import {SceneType} from '../../common/models/scene-type.enum';
import {Singleton} from '../../../singleton.decorator';
import {GenericSceneModel} from '../models/generic-scene-model';
import {SceneModelService} from '../../scene-model.service';
import {GenericGridCell} from '../entities/generic-grid-field';


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


  getCellAt(x: number, y: number): GenericGridCell {
    const field = this.sceneModel.field;
    if (x >= 0 && x < field.width && y >= 0 && y < field.height) {
      return field.grid[Math.floor(x) + Math.floor(y) * field.width];
    } else {
      return null;
    }
  }
}
