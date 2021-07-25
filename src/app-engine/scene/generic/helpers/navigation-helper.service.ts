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

  offset(position: Coords, direction: Direction, offset: Coords = { x: 0, y: 1 }): Coords {
    switch (direction) {
      case Direction.UP: {
        return { x: position.x + offset.x, y: position.y - offset.y };
      }
      case Direction.DOWN: {
        return { x: position.x - offset.x, y: position.y + offset.y };
      }
      case Direction.LEFT: {
        return { x: position.x - offset.y, y: position.y + offset.x };
      }
      case Direction.RIGHT: {
        return { x: position.x + offset.y, y: position.y - offset.x };
      }
    }
    return position;
  }
}
