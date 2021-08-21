import {GenericGridTile} from './generic-grid-tile';
import {Coords} from '../../common/entities';
import {GenericGameObject} from './generic-game-object';


export interface GenericGridField {
  grid: GenericGridCell[];
  width: number;
  height: number;
}

export interface GenericGridCell {
  position: Coords;
  tiles: GenericGridTile[];
  stationaryGameObjects: GenericGameObject[];
  light: {
    level: number,
    color: number[],
    ambient: number,
    ambientColor: number[]
  };
}
