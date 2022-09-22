import { LayerTilesRenderer } from './LayerTilesRenderer'
import BaseEvent from '../event'

interface Vec {
  x: number
  y: number
  z: number
}

interface Options {
  url: string //模型下载地址
  position: number[]
}

class Layer3DTiles extends BaseEvent{
  layer: any // threejs的图层对象
  animationFrame = -1; //gltf动画
  tilesRenderer: LayerTilesRenderer
  group: any

  constructor(layer: any, options: Options) {
    super();
    this.layer = layer;
    const tilesRenderer = new LayerTilesRenderer( options.url );
    tilesRenderer.setCamera( this.layer.getCamera() );
    tilesRenderer.setResolutionFromRenderer( this.layer.getCamera(), this.layer.getRender() );
    this.group = tilesRenderer.group
    this.layer.add( this.group );
    this.tilesRenderer = tilesRenderer
    if(options.position){
      this.setPosition(options.position)
    }
    this.animate()
  }

  setPosition(position) {
    const positionConvert = this.layer.convertLngLat(position);
    this.group.position.setX(positionConvert[0]);
    this.group.position.setY(positionConvert[1]);
    this.refresh();
  }

  setRotation(rotation: Vec) {
    if (rotation) {
      const x = Math.PI / 180 * (rotation.x || 0);
      const y = Math.PI / 180 * (rotation.y || 0);
      const z = Math.PI / 180 * (rotation.z || 0);
      this.group.rotation.set(x, y, z);
      this.refresh();
    }
  }

  refresh() {
    this.layer.update();
  }

  show() {
    // this.object.visible = true;
    this.refresh();
  }

  hide() {
    // this.object.visible = false;
    this.refresh();
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => {
      this.layer.getCamera().updateMatrixWorld();
      this.tilesRenderer.update();
      this.refresh();
      this.animate();
    });
  }

  getGroup(){
    return this.group
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame)
    this.tilesRenderer.dispose()
    /*if (this.object) {
      clearGroup(this.object);
      this.object = null;
      this.layer = null;
    }*/
  }
}

export {Layer3DTiles}
