import {Singleton} from '../../../singleton.decorator';
import {SimplexTaskTest} from '../tasks/simplex/task_test';
import {SimplexTask1_1} from '../tasks/simplex/task1_1';
import {SimplexTask1_2} from '../tasks/simplex/task1_2';
import {SimplexTask1_3} from '../tasks/simplex/task1_3';


@Singleton
export class TaskRegistryService {
  private registeredTaskMap = new Map<string, () => void>();

  constructor() {
    this.registerTask('simplex_test', SimplexTaskTest);
    this.registerTask('simplex_task1_1', SimplexTask1_1);
    this.registerTask('simplex_task1_2', SimplexTask1_2);
    this.registerTask('simplex_task1_3', SimplexTask1_3);
  }

  registerTask(name: string, initFunc: () => void): void {
    this.registeredTaskMap.set(name, initFunc);
  }

  // receives a function source, returns caller, that passes all variables from parameter scope
  // to given source code and executes it
  addScopeToEval(func: string, scope: { [key: string]: any }): () => void {
    const evaluateInScope = (context: { [key: string]: any }, expr: string): any => {
      const evaluator = Function.apply(null, [...Object.keys(context), 'expr', 'return eval(expr)']);
      return evaluator.apply(null, [...Object.values(context), expr]);
    };
    return () => {
      evaluateInScope(scope, func);
    };
  }

  // for given function, returns caller, that adds all variables from parameter scope
  // to global scope (window) and calls function, using them
  addScopeToRegisteredTask(func: () => void, scope: { [key: string]: any }): () => void {
    return () => {
      // inject scope into global scope, save overridden properties
      const overrides: { [key: string]: any } = {};
      for (const key in scope) {
        if (scope.hasOwnProperty(key)) {
          if (window.hasOwnProperty(key)) {
            overrides[key] = window[key];
          }
          window[key] = scope[key];
        }
      }
      // call the function
      func();
      // restore global scope: restore overridden properties, and delete others
      for (const key in scope) {
        if (scope.hasOwnProperty(key)) {
          if (overrides.hasOwnProperty(key)) {
            window[key] = overrides[key];
          } else {
            delete window[key];
          }
        }
      }
    };
  }

  parseTaskInitializerFunc(initFunc: string, scope: { [key: string]: any }): () => void {
    initFunc = initFunc.trim();

    const prefix = 'task:';
    if (initFunc.startsWith('task:')) {
      const registeredFunc = this.registeredTaskMap.get(initFunc.substr(prefix.length).trim());
      if (registeredFunc) {
        return this.addScopeToRegisteredTask(registeredFunc, scope);
      } else {
        return () => { throw new Error(`no task with name: ${initFunc}`); };
      }
    }

    return this.addScopeToEval(initFunc, scope);
  }
}

