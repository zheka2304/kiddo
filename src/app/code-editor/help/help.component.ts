import { Component, EventEmitter, Output, OnInit } from '@angular/core';

import { CodeEditorService } from '../code-editor-service/code-editor.service';
import { environment } from 'src/environments/environment';
import { GoogleAnalyticsService } from 'src/app/shared/services';

@Component({
  selector: 'kiddo-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

  @Output() closeModal = new EventEmitter<void>();
  currentSceneType: string;
  environment = environment;

  constructor(
    private codeEditorService: CodeEditorService,
    private googleAnalyticsService: GoogleAnalyticsService,
  ) { }

  ngOnInit(): void {
    this.currentSceneType = this.codeEditorService.currentSceneType;
  }

  onCloseClick(): void {
    this.googleAnalyticsService.emitEvent(environment.googleAnalytics.events.buttonClick, 'game-player: help_close_click');
    this.closeModal.emit();
  }
}
