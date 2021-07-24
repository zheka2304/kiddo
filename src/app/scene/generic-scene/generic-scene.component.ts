import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {GenericSceneRenderService} from './render/generic-scene-render.service';
import {GenericSceneRenderer} from './render/generic-scene-renderer';
import {SceneAccessorsService} from '../../../app-engine/scene/scene-accessors.service';


@Component({
  selector: 'kiddo-generic-scene',
  templateUrl: './generic-scene.component.html',
  styleUrls: ['./generic-scene.component.scss']
})
export class GenericSceneComponent implements AfterViewInit, OnDestroy {
  @Input() isStatic: boolean;
  @ViewChild('genericSceneCanvas') canvasRef: ElementRef;

  private sceneAccessorsService: SceneAccessorsService;

  constructor(
    private sceneRenderService: GenericSceneRenderService,
  ) {
    this.sceneAccessorsService = new SceneAccessorsService();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    const renderContext = this.sceneRenderService.createRenderContext(canvas);
    renderContext.setRenderer(new GenericSceneRenderer(this.sceneAccessorsService));
  }

  ngOnDestroy(): void {
  }

}
