import { GenericWriterService } from '../writers/generic-writer.service';
import {GenericReaderService} from '../readers/generic-reader.service';
import {GenericSceneModel} from '../models/generic-scene-model';

export class GenericSceneContextProvider {
  constructor(
    private writer: GenericWriterService
  ) {
  }

  getWriter(): GenericWriterService {
    return this.writer;
  }

  getReader(): GenericReaderService {
    return this.writer?.getReader();
  }

  getSceneModel(): GenericSceneModel {
    return this.writer?.sceneModel;
  }
}
