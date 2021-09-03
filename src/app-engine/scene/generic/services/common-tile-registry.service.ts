import {Singleton} from '../../../singleton.decorator';
import {Coords} from '../../common/entities';
import {GenericGridTile} from '../entities/generic-grid-tile';
import {SimpleGridTile, SimpleGridTileDefinition} from '../common/simple-grid-tile';
import {DefaultTileStates} from '../entities/default-tile-states.enum';
import {DefaultTags} from '../entities/default-tags.enum';


declare type GenericGridTileFactory = (position: Coords, parameters: any) => GenericGridTile;

@Singleton
export class CommonTileRegistryService {
  private factories = new Map<string, GenericGridTileFactory>();

  constructor() {
    this.registerBuiltInTileTypes();
  }

  addTileFactory(name: string, factory: GenericGridTileFactory): void {
    this.factories.set(name.toLowerCase(), factory);
  }

  addBasicTile(name: string, definition: SimpleGridTileDefinition): void {
    this.addTileFactory(name, (position: Coords, parameters: any) => new SimpleGridTile(definition, parameters, position));
  }

  newTile(name: string, position: Coords, parameters: any): GenericGridTile {
    const factory = this.factories.get(name.toLowerCase());
    if (factory) {
      return factory(position, parameters);
    } else {
      return null;
    }
  }

  parseTile(description: string, position: Coords, abortOnError?: boolean): GenericGridTile {
    const regex = /^([A-Za-z0-9\-_]+)(:([^;]+))?$/;
    const data = regex.exec(description.trim());
    if (data) {
      try {
        const name = data[1];
        const parameters = data[3] ? JSON.parse(data[3]) : null;
        return this.newTile(name, position, parameters);
      } catch (err) {
        if (abortOnError) {
          throw err;
        } else {
          console.error('error in parsing tile description: ' + description, 'error: ', err);
        }
      }
    } else {
      const err = 'error in parsing tile description: ' + description + ', regex is not parsed';
      if (abortOnError) {
        throw new Error(err);
      } else {
        console.error(err);
      }
    }
    return null;
  }

  parseTileArray(descriptions: string, position: Coords, abortOnError?: boolean): GenericGridTile[] {
    const tiles: GenericGridTile[] = [];
    for (const description of descriptions.split(';')) {
      tiles.push(this.parseTile(description, position, abortOnError));
    }
    return tiles;
  }


  //
  registerBuiltInTileTypes(): void {
    this.addBasicTile('stone', {
      texture: {
        atlas: { src: 'assets:/tile-atlas.png', width: 4, height: 4 },
        items: {
          [DefaultTileStates.MAIN]: [[0, 0]]
        }
      },
      immutableTags: [DefaultTags.OBSTACLE]
    });

    this.addBasicTile('grass', {
      texture: {
        atlas: { src: 'assets:/tile-atlas.png', width: 4, height: 4 },
        items: {
          [DefaultTileStates.MAIN]: [[1, 0]]
        }
      },
      immutableTags: []
    });

    this.addBasicTile('goal-flag', {
      texture: {
        atlas: { src: 'assets:/tile-atlas.png', width: 4, height: 4 },
        items: {
          [DefaultTileStates.MAIN]: [[2, 0]]
        }
      },
      immutableTags: [DefaultTags.GOAL]
    });
  }
}
