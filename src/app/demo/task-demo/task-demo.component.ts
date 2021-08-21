import {Component, OnInit, ViewChild} from '@angular/core';
import {KiddoInitService} from '../../kiddo-init.service';
import {MarkdownComponent} from 'ngx-markdown';
import {SceneConfigService} from '../../config/scene-config.service';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';


@Component({
  selector: 'kiddo-task-demo',
  templateUrl: './task-demo.component.html',
  styleUrls: ['./task-demo.component.scss']
})
export class TaskDemoComponent implements OnInit {
  taskPath = this.route.paramMap.pipe(
      map(params => params.get('taskPath'))
    );
  taskDescription = '';

  constructor(
    private kiddoInitService: KiddoInitService,
    private sceneConfigService: SceneConfigService,
    private route: ActivatedRoute
  ) {
  }

  private async loadTask(config: string): Promise<void> {
    const sceneConfig = await this.sceneConfigService.processSceneConfiguration({
      sceneConfig: config
    });
    await this.kiddoInitService.initializeKiddo({ sceneConfig });
    this.taskDescription = sceneConfig.taskDescription;
  }

  async ngOnInit(): Promise<void> {
    this.taskPath.subscribe(async (taskPath) => {
      const path = `${window.location.protocol + '//' + window.location.host}/assets/scene_config/${taskPath}/task.yaml`;
      await this.loadTask(path);
    });
  }

}
