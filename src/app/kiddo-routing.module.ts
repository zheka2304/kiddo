import { NgModule } from '@angular/core';
import {Routes, RouterModule, UrlSegment} from '@angular/router';
import { ApiTestingComponent } from './api-testing/api-testing.component';
import { TaskEditorComponent } from './task-editor/task-editor.component';
import { GamePlayerComponent } from './game-player/game-player.component';
import {TaskDemoComponent} from './demo/task-demo/task-demo.component';


const routes: Routes = [
    { path: 'api-testing/:id', component: ApiTestingComponent },
    {
        matcher: (url) => {
            if (url.length >= 1 && url[0].path === 'task-demo') {
                return {
                    consumed: url,
                    posParams: {
                        taskPath: new UrlSegment(url.map(u => u.path).slice(1).join('/'), {})
                    }
                };
            }
            return null;
        },
        component: TaskDemoComponent
    },
    { path: 'task-editor', component: TaskEditorComponent },
    { path: '**', data: { title: 'player' }, component: GamePlayerComponent },
];

@NgModule({
    imports: [ RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
