import {GenericGridTile} from './generic-grid-tile';
import {Coords} from '../../common/entities';


export interface GenericGridField {
  grid: GenericGridCell[];
  width: number;
  height: number;
}

export interface GenericGridCell {
  position: Coords;
  tiles: GenericGridTile[];
  light: {
    level: number,
    color: number[],
    ambient: number,
    ambientColor: number[]
  };
}
