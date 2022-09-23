import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import BaseEvent from '../event'
import { LayerTilesRenderer } from './LayerTilesRenderer'

interface Vec {
  x: number
  y: number
  z: number
}

interface Options {
  url: string //模型下载地址
  position: number[],
  dracoDecoderPath?: string // DRACOLoader 的decoder路径，默认使用CDN路径
  fetchOptions?: any // 使用fetch下载文件的参数
}

class Layer3DTiles extends BaseEvent{
  layer: any // threejs的图层对象
  animationFrame = -1; //gltf动画
  tilesRenderer?: LayerTilesRenderer
  group: any

  constructor(layer: any, options: Options) {
    super();
    this.layer = layer;
    const tilesRenderer = new LayerTilesRenderer( options.url );
    tilesRenderer.setCamera( this.layer.getCamera() );
    tilesRenderer.setResolutionFromRenderer( this.layer.getCamera(), this.layer.getRender() );
    const fetchOptions = options.fetchOptions || {}
    const gltfLoader = new GLTFLoader(tilesRenderer.manager)
    if ( fetchOptions.credentials === 'include' && fetchOptions.mode === 'cors' ) {
      gltfLoader.setCrossOrigin( 'use-credentials' );
    }

    if ( 'credentials' in fetchOptions ) {
      gltfLoader.setWithCredentials( fetchOptions.credentials === 'include' );
    }

    if ( fetchOptions.headers ) {
      gltfLoader.setRequestHeader( fetchOptions.headers );
    }
    const dRACOLoader = new DRACOLoader()
    const dracoDecodePath = options.dracoDecoderPath || 'https://cdn.jsdelivr.net/npm/three@0.142/examples/js/libs/draco/'
    dRACOLoader.setDecoderPath(dracoDecodePath)
    gltfLoader.setDRACOLoader(dRACOLoader)
    tilesRenderer.manager.addHandler(/\.gltf$/i, gltfLoader)
    tilesRenderer.downloadQueue.maxJobs = 12;
    tilesRenderer.parseQueue.maxJobs = 12;
    tilesRenderer.lruCache.unloadPercent = 0.1;
    /*tilesRenderer.lruCache.unloadPriorityCallback = function (item) {
      tilesRenderer.lruCache.remove(item);
    }*/
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

  setTranslate(translate: Vec){
    if(translate){
      this.group.translateX(translate.x)
      this.group.translateY(translate.y)
      this.group.translateZ(translate.z)
      this.refresh()
    }
  }

  setScale(scale: number | Vec) {
    let scaleVec: Vec;
    if (typeof scale === 'number') {
      scaleVec = {
        x: scale,
        y: scale,
        z: scale
      };
    } else {
      scaleVec = scale;
    }
    this.group.scale.set(scaleVec.x, scaleVec.y, scaleVec.z);
    this.refresh();
  }

  refresh() {
    this.layer.update();
  }

  show() {
    this.group.visible = true;
    this.refresh();
  }

  hide() {
    this.group.visible = false;
    this.refresh();
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => {
      this.update();
      this.animate();
    });
  }

  update(){
    this.layer.getCamera().updateMatrixWorld();
    this.tilesRenderer?.update();
  }

  getGroup(){
    return this.group
  }

  getTilesRenderer(){
    return this.tilesRenderer
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame)
    this.layer.remove(this.group)
    this.tilesRenderer?.dispose()
    this.group = null
    this.tilesRenderer = undefined
    this.layer = null
    /*if (this.object) {
      clearGroup(this.object);
      this.object = null;
      this.layer = null;
    }*/
  }
}

export {Layer3DTiles}
