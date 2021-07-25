export enum DefaultTags {
  // must not be added to any objects, returned, when accessing tiles outside of the field
  OUTSIDES = 'outsides',

  // must not be added to any objects, returned, when accessing tiles with low light level, that could not be visible
  DARKNESS = 'darkness',

  // game object is marked destroyed and should not be processed
  DESTROYED = 'destroyed',

  // should be assigned to level goal, when player is
  GOAL = 'goal',

  // only player must have this tag
  PLAYER = 'player',

  // being in one cell with tile or game object with this tag will result in player destroyed & level failed
  DEADLY = 'deadly',

  // tiles or objects with this tag cannot be traversed
  OBSTACLE = 'obstacle',

  // default tag for marking deadly creatures, required only for distinguishing monsters from other deadly objects
  MONSTER = 'monster',

  // game objects marked with this tag should be able to be picked by player
  ITEM = 'item',
}
