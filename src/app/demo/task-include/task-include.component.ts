import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {KiddoInitService} from '../../kiddo-init.service';
import {SceneConfigService} from '../../config/scene-config.service';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {zip} from 'rxjs';


@Component({
  selector: 'kiddo-task-include',
  templateUrl: './task-include.component.html',
  styleUrls: ['./task-include.component.scss']
})
export class TaskIncludeComponent implements OnInit, AfterViewInit {
  taskPathOrConfig = zip(
    this.route.paramMap.pipe(
      map(params => params.get('taskPath'))
    ),
    this.route.queryParamMap.pipe(
      map(params => {
        return params.get('config');
      })
    ),
    (path, config) => ({ path, config })
  );

  activated = false;
  taskDescription = '';
  playerWrapperHeight = '100px';

  @ViewChild('taskWrapper') taskWrapper;
  @ViewChild('playerWrapper') playerWrapper;
  @ViewChild('descriptionWrapper') descriptionWrapper;

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

  private postSizeCheck(): void {
    // This will wait for description wrapper to measure and stabilize height,
    // and will resize player to make their sum match window height
    // to fill include frame fully and without scrolls
    let lastDescriptionHeight = 0;
    const postSizeCheck = () => {
      setTimeout(() => {
        const descriptionHeight = this.descriptionWrapper.nativeElement.getBoundingClientRect().height;
        if (descriptionHeight > 0) {
          this.playerWrapperHeight = (window.innerHeight - descriptionHeight - 25) + 'px';
        }
        if (descriptionHeight === 0 || lastDescriptionHeight !== descriptionHeight) {
          lastDescriptionHeight = descriptionHeight;
          postSizeCheck();
        }
      }, 20);
    };

    // Sorry, I am not a web developer
    postSizeCheck();
  }

  onActivateClick(): void {
    this.activated = true;
    this.postSizeCheck();
  }

  ngAfterViewInit(): void {
    if (this.activated) {
      this.postSizeCheck();
    }
  }

  async ngOnInit(): Promise<void> {
    this.taskPathOrConfig.subscribe(async ({ path, config }) => {
      if (config) {
        // if config passed as a query parameter, use it
        await this.loadTask(config);
      } else if (path) {
        // otherwise load config from assets using url path
        path = `${window.location.protocol + '//' + window.location.host}/assets/scene_config/${path}/task.yaml`;
        await this.loadTask(path);
      }
    });
  }


}
