import {SceneReader} from '../../common/readers/scene.reader';
import {SceneModel} from '../../common/models/scene-model';
import {GameStatistics} from '../../common/entities';
import {SceneType} from '../../common/models/scene-type.enum';
import {Singleton} from '../../../singleton.decorator';
import {GenericSceneModel} from '../models/generic-scene-model';
import {SceneModelService} from '../../scene-model.service';


@Singleton
export class GenericReaderService implements SceneReader {
  public sceneModel: SceneModel;

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
}
