import {Singleton} from '../../../singleton.decorator';
import {Coords} from '../../common/entities';
import {GenericReaderService} from '../readers/generic-reader.service';


export interface LightSourceParams {
  radius: number;
  brightness: number;
  shadows?: boolean;

  offset?: Coords;
  startingAngle?: number;
  endingAngle?: number;
}

@Singleton
export class LightingHelperService {
  lightAround(
    reader: GenericReaderService,
    position: Coords,
    interpolatedPos: Coords,
    params: LightSourceParams
  ): void {
    const offset = params.offset || { x: 0, y: 0 };
    if (params.shadows) {
      this.lightAroundWithShadows(
        reader,
        { x: position.x + offset.x, y: position.y + offset.y },
        { x: interpolatedPos.x + offset.x, y: interpolatedPos.y + offset.y },
        params
      );
    } else {
      this.lightAroundNoShadows(
        reader,
        { x: position.x + offset.x, y: position.y + offset.y },
        { x: interpolatedPos.x + offset.x, y: interpolatedPos.y + offset.y },
        params
      );
    }
  }

  protected lightAroundNoShadows(
    reader: GenericReaderService,
    position: Coords,
    interpolatedPos: Coords,
    params: LightSourceParams
  ): void {
    const { radius, brightness } = params;
    const interpolationDelta = {
      x: position.x - interpolatedPos.x,
      y: position.y - interpolatedPos.y
    };
    const r2 = radius * radius;

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        const dx = interpolationDelta.x + x;
        const dy = interpolationDelta.y + y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r2) {
          const cell = reader.getCellAt(x + position.x, y + position.y);
          if (cell) {
            cell.light.level += (1 - Math.sqrt(d2) / radius) * brightness;
          }
        }
      }
    }
  }

  protected lightAroundWithShadows(
    reader: GenericReaderService,
    position: Coords,
    interpolatedPos: Coords,
    params: LightSourceParams
  ): void {
  }
}
