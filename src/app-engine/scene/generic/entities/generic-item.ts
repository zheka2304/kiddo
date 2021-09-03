import {GenericGameObject} from './generic-game-object';
import {Coords} from '../../common/entities';
import {GenericWriterService} from '../writers/generic-writer.service';
import {GenericReaderService} from '../readers/generic-reader.service';

export interface GenericItem {
  getItemName?(): string;

  onPicked?(writer: GenericWriterService, character: GenericGameObject, position: Coords): void;
  onPlaced?(writer: GenericWriterService, character: GenericGameObject, position: Coords): void;
  onInventoryTick?(writer: GenericWriterService, character: GenericGameObject): void;

  canBePicked?(reader: GenericReaderService, character: GenericGameObject, position: Coords): boolean;
  canBePlaced?(reader: GenericReaderService, character: GenericGameObject, position: Coords): boolean;
}

export type GenericItemGameObject = GenericItem & GenericGameObject;
