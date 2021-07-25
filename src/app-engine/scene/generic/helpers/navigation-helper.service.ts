import {Singleton} from '../../../singleton.decorator';
import {Coords, Direction} from '../../common/entities';


@Singleton
export class NavigationHelperService {
  rotate(direction: Direction, rotate: Direction): Direction {
    const turns = {
      [Direction.RIGHT]: {
        [Direction.DOWN]: Direction.LEFT,
        [Direction.LEFT]: Direction.UP,
        [Direction.UP]: Direction.RIGHT,
        [Direction.RIGHT]: Direction.DOWN,
      },
      [Direction.LEFT]: {
        [Direction.DOWN]: Direction.RIGHT,
        [Direction.RIGHT]: Direction.UP,
        [Direction.UP]: Direction.LEFT,
        [Direction.LEFT]: Direction.DOWN,
      },
    };
    if (turns[rotate]) {
      return turns[rotate][direction];
    } else {
      return direction;
    }
  }

  offset(position: Coords, direction: Direction, distance: number = 1): Coords {
    switch (direction) {
      case Direction.UP: {
        return { x: position.x, y: position.y - distance };
      }
      case Direction.DOWN: {
        return { x: position.x, y: position.y + distance };
      }
      case Direction.LEFT: {
        return { x: position.x - distance, y: position.y };
      }
      case Direction.RIGHT: {
        return { x: position.x + distance, y: position.y };
      }
    }
    return position;
  }
}
