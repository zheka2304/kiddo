import {SceneModel} from '../../common/models/scene-model';
import {GenericGridField} from '../entities/generic-grid-field';
import {GenericGameObject} from '../entities/generic-game-object';
import {GenericPlayer} from '../common/player';


export interface GenericSceneModel extends SceneModel {
  // unique string used to force render rebuild, when scene is re-initialized
  sceneUid: string;

  field: GenericGridField;
  gameObjects: GenericGameObject[];
  player: GenericPlayer;

  lightMapEnabled: boolean;

  // amount of cells per lowest window dimension
  inverseZoom: number;

  // optional - resolution of tile texture for pixel-perfect render
  pixelPerfect?: number;
}
