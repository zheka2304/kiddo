import {SceneModel} from '../../common/models/scene-model';
import {GenericGridField} from '../entities/generic-grid-field';
import {GenericGameObject} from '../entities/generic-game-object';
import {GenericPlayer} from '../common/player';


export interface GenericSceneModel extends SceneModel {
  field: GenericGridField;
  gameObjects: GenericGameObject[];
  player: GenericPlayer;

  // amount of cells per lowest window dimension
  inverseZoom: number;
}
