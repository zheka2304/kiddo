import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {GenericSceneRenderService} from './render/generic-scene-render.service';
import {GenericSceneRenderer} from './render/generic-scene-renderer';
import {SceneAccessorsService} from '../../../app-engine/scene/scene-accessors.service';
import {GenericSceneRenderContext} from './render/generic-scene-render-context';


@Component({
  selector: 'kiddo-generic-scene',
  templateUrl: './generic-scene.component.html',
  styleUrls: ['./generic-scene.component.scss']
})
export class GenericSceneComponent implements AfterViewInit, OnDestroy {
  @Input() isStatic: boolean;
  @ViewChild('genericSceneCanvas') canvasRef: ElementRef;
  @ViewChild('genericSceneCanvasTarget') targetRef: ElementRef;

  private sceneAccessorsService: SceneAccessorsService;
  private renderContext: GenericSceneRenderContext = null;

  isDragging = false;

  constructor(
    private sceneRenderService: GenericSceneRenderService,
  ) {
    this.sceneAccessorsService = new SceneAccessorsService();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    this.renderContext = this.sceneRenderService.createRenderContext(canvas, this.targetRef.nativeElement);
    this.renderContext.setRenderer(new GenericSceneRenderer(this.sceneAccessorsService));
  }

  ngOnDestroy(): void {
    this.sceneRenderService.destroyRenderContext(this.renderContext);
  }

  onMouseDrag(event: MouseEvent): void {
    if (this.renderContext) {
      this.renderContext.onMouseDrag(event.movementX, event.movementY);
    }
  }
}
