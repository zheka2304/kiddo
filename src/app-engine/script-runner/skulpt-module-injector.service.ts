import {Injectable} from '@angular/core';

declare const Sk: any;

@Injectable({
    providedIn: 'root'
})
export class SkulptModuleInjectorService {
    private addedModules: Set<string> = new Set<string>();

    constructor() {
    }

    private static getModulePathByName(name: string): string {
        return `src/lib/${name}/__init__.js`;
    }

    addModule(name: string, module: any): void {
        this.addedModules.add(name);

        Sk.builtins[name] = module;
        Sk.buildModuleFromJs = (moduleName: string) => {
            const jsModule: any = Sk.builtins[moduleName];
            const pyModule = {};

            const addFunction = (functionName: string) => {
                const func = (...args) => {
                    return jsModule[functionName](...args);
                };
                pyModule[functionName] = new Sk.builtin.func((...args) => {
                    const result = func(...args.map(c => Sk.ffi.remapToJs(c)));
                    if (result instanceof Promise) {
                        return Sk.misceval.promiseToSuspension(result.then(value => Sk.ffi.remapToPy(value)));
                    } else {
                        return Sk.ffi.remapToPy(result);
                    }
                });
            };

            for (const functionName in jsModule) {
                if (jsModule.hasOwnProperty(functionName)) {
                    addFunction(functionName);
                }
            }

            return pyModule;
        };

        Sk.builtinFiles.files[SkulptModuleInjectorService.getModulePathByName(name)] = `
            const $builtinmodule = function(name) {
                return Sk.buildModuleFromJs(\"${name}\");
            };
        `;
    }

    removeModule(name: string): void {
        this.addedModules.delete(name);
        delete Sk.builtinFiles.files[SkulptModuleInjectorService.getModulePathByName(name)];
        delete Sk.builtins[name];
    }

    removeAllInjectedModules(): void {
        this.addedModules.forEach(name => this.removeModule(name));
    }
}
