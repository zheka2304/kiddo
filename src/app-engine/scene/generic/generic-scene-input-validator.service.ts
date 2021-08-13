import {Singleton} from '../../singleton.decorator';
import {GameFailError} from '../common/errors';
import {Direction} from "../common/entities";


@Singleton
export class GenericSceneInputValidatorService {
  validateEach(params: any[], validator: (value: any, index: number) => boolean, error: string): void {
    let index = 0;
    for (const param of params) {
      if (!validator(param, index++)) {
        throw new GameFailError(error);
      }
    }
  }

  validateNoParams(params: any[], error: string = 'UNEXPECTED_PARAMETER'): void {
    this.validateEach(params, value => false, error);
  }

  validateIntegers(params: any[], error: string = 'EXPECTED_INTEGER'): void {
    this.validateEach(params, value => (typeof(value) === 'number' && Math.floor(value) === value), error);
  }

  validateNonNegativeIntegers(params: any[], error: string = 'EXPECTED_NON_NEGATIVE_INTEGER'): void {
    this.validateEach(params, value => (typeof(value) === 'number' && Math.floor(value) === value && value >= 0), error);
  }

  validateStrings(params: any[], error: string = 'EXPECTED_STRING'): void {
    this.validateEach(params, value => (typeof(value) === 'string'), error);
  }

  validateDirections(params: any[], error: string = 'EXPECTED_DIRECTION_STRING'): void {
    const directions = [Direction.RIGHT, Direction.LEFT, Direction.UP, Direction.DOWN];
    this.validateEach(params, value => (typeof(value) === 'string' && directions.indexOf(value.toUpperCase() as Direction) !== -1), error);
  }

  private checkIsTag(value: any): boolean {
    return typeof(value) === 'string' && !value.startsWith('-') && !value.startsWith('_');
  }

  validateTag(params: any[], error: string = 'EXPECTED_TAG'): void {
    this.validateEach(params, value => this.checkIsTag(value), error);
  }

  validateTagOrTagArray(params: any[], error: string = 'EXPECTED_TAG_OR_TAG_ARRAY'): void {
    this.validateEach(params, value => {
      if (typeof(value) === 'string') {
        return this.checkIsTag(value);
      }
      return Array.isArray(value) && (value.length === 0 || this.checkIsTag(value[0]));
    }, error);
  }
}
