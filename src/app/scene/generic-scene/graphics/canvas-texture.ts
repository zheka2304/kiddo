export class CanvasTexture {
  private image: HTMLImageElement;
  private promise: Promise<HTMLImageElement> = null;

  constructor(src: string) {
    this.promise = new Promise<HTMLImageElement>(resolve => {
      this.image = new Image();
      this.image.onload = () => {
        resolve(this.image);
      };
      this.image.onerror = e => {
        console.error('failed to load image ' + src + ': ', e);
      };
      this.image.src = src;
    });
  }

  async getImage(): Promise<HTMLImageElement> {
    return this.promise;
  }

}
