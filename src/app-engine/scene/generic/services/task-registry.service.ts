import {Singleton} from '../../../singleton.decorator';
import {SimplexTaskTest} from '../tasks/simplex/task_test';
import {SimplexTask1_1} from '../tasks/simplex/task1_1';
import {SimplexTask1_2} from '../tasks/simplex/task1_2';
import {SimplexTask2_1} from '../tasks/simplex/task2_1';
import {SimplexTask3_1} from '../tasks/simplex/task3_1';
import {SimplexTask4_2} from '../tasks/simplex/task4_2';
import {SimplexTask4_1} from '../tasks/simplex/task4_1';
import {SimplexTask5_1} from '../tasks/simplex/task5_1';
import {SimplexTask5_2} from '../tasks/simplex/task5_2';
import {SimplexTask6_1} from '../tasks/simplex/task6_1';
import {SimplexTask7_1} from '../tasks/simplex/task7_1';
import {SimplexTask8_1} from '../tasks/simplex/task8_1';
import {SimplexTask8_2} from '../tasks/simplex/task8_2';
import {SimplexTask6_2} from '../tasks/simplex/task6_2';
import {SimplexTask9_1} from '../tasks/simplex/task9_1';
import {SimplexTask10_1} from '../tasks/simplex/task10_1';
import {SimplexTask11_1} from '../tasks/simplex/task11_1';


@Singleton
export class TaskRegistryService {
  private registeredTaskMap = new Map<string, () => void>();

  constructor() {
    this.registerTask('simplex_test', SimplexTaskTest);
    this.registerTask('simplex_task1_1', SimplexTask1_1);
    this.registerTask('simplex_task1_2', SimplexTask1_2);
    this.registerTask('simplex_task2_1', SimplexTask2_1);
    this.registerTask('simplex_task3_1', SimplexTask3_1);
    this.registerTask('simplex_task4_1', SimplexTask4_1);
    this.registerTask('simplex_task4_2', SimplexTask4_2);
    this.registerTask('simplex_task5_1', SimplexTask5_1);
    this.registerTask('simplex_task5_2', SimplexTask5_2);
    this.registerTask('simplex_task6_1', SimplexTask6_1);
    this.registerTask('simplex_task6_2', SimplexTask6_2);
    this.registerTask('simplex_task7_1', SimplexTask7_1);
    this.registerTask('simplex_task8_1', SimplexTask8_1);
    this.registerTask('simplex_task8_2', SimplexTask8_2);
    this.registerTask('simplex_task9_1', SimplexTask9_1);
    this.registerTask('simplex_task11_1', SimplexTask11_1);
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

