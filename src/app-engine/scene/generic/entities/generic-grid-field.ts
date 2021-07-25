import {GenericGridTile} from './generic-grid-tile';

export interface GenericGridField {
  grid: GenericGridCell[];
  width: number;
  height: number;
}

export interface GenericGridCell {
  tiles: GenericGridTile[];
  light: {
    level: number,
    ambient: number,
    color: string
  };
}
