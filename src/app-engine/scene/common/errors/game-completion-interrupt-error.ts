export class GameCompletionInterruptError extends Error {
  constructor() {
    super('GameCompletionInterruptError');
    this.name = 'GameCompletionInterruptError';
  }
}
