import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {Vector2, Raycaster} from "three";
import {bind} from 'lodash-es';
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
  mouseEvent?: boolean // 是否开启鼠标事件，包含点击、移动、双击、右击
  debug?: boolean // 是否开启debug模式，开启后将会再最上面显示当前模型加载情况
}

class Layer3DTiles extends BaseEvent{
  layer: any // threejs的图层对象
  animationFrame = -1; //gltf动画
  tilesRenderer?: LayerTilesRenderer
  group: any
  statsContainer?: HTMLDivElement
  mouse: Vector2
  raycaster?: Raycaster
  clickMapFn: any
  mousemoveMapFn: any
  rightClickMapFn: any

  constructor(layer: any, options: Options) {
    super();
    this.mouse = new Vector2()
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
    const dracoDecodePath = options.dracoDecoderPath || 'https://cdn.jsdelivr.net/npm/three@0.143/examples/js/libs/draco/'
    dRACOLoader.setDecoderPath(dracoDecodePath)
    gltfLoader.setDRACOLoader(dRACOLoader)
    tilesRenderer.manager.addHandler(/\.gltf$/i, gltfLoader)
    tilesRenderer.onLoadTileSet = (tileSet) => {
      this.emit('loadTileSet', tileSet)
    }
    tilesRenderer.onLoadModel = (scene, tile) => {
      this.emit('loadModel', {
        scene,
        tile
      })
    }
    tilesRenderer.onDisposeModel = (scene, tile) => {
      this.emit('disposeModel', {
        scene,
        tile
      })
    }
    this.group = tilesRenderer.group
    this.layer.add( this.group );
    this.tilesRenderer = tilesRenderer
    if(options.position){
      this.setPosition(options.position)
    }
    this.animate()
    if(options.debug){
      const statsContainer = document.createElement( 'div' );
      statsContainer.style.position = 'absolute';
      statsContainer.style.top = '0px';
      statsContainer.style.left = '0px';
      statsContainer.style.color = 'white';
      statsContainer.style.width = '100%';
      statsContainer.style.textAlign = 'center';
      statsContainer.style.padding = '5px';
      statsContainer.style.pointerEvents = 'none';
      statsContainer.style.lineHeight = '1.5em';
      document.body.appendChild( statsContainer );
      this.statsContainer = statsContainer
    }
    this.bindEvents(options.mouseEvent)
  }

  bindEvents(mouseEvent?:boolean){
    if(mouseEvent){
      this.raycaster = new Raycaster();
      (this.raycaster as any).firstHitOnly = true;
      const map = this.layer.getMap()
      this.clickMapFn = bind(this.clickMap, this)
      map.on('click', this.clickMapFn)
      this.mousemoveMapFn = bind(this.mousemoveMap, this)
      map.on('mousemove', this.mousemoveMapFn)
      this.rightClickMapFn = bind(this.rightClickMap, this)
      map.on('rightclick', this.rightClickMapFn)
    }
  }
  unbindEvents(){
    const map = this.layer.getMap()
    if(this.clickMapFn){
      map.off('click', this.clickMapFn)
      this.clickMapFn = null
    }
    if(this.mousemoveMapFn){
      map.off('mousemove', this.mousemoveMapFn)
      this.mousemoveMapFn = null
    }
  }
  clickMap(e){
    const result = this._intersectGltf(e)
    this.emit('click', result)
  }

  mousemoveMap(e){
    const result = this._intersectGltf(e)
    this.emit('mousemove', result)
  }

  rightClickMap(e){
    const result = this._intersectGltf(e)
    this.emit('rightClick', result)
  }

  _intersectGltf(e) {
    const client = this.layer.getMap().getContainer();
    // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
    const bounds = client.getBoundingClientRect();
    const mouse = this.mouse;
    // window.pageYOffset 鼠标滚动的距离
    // clientTop 一个元素顶部边框的宽度
    mouse.x = e.originEvent.clientX - bounds.x;
    mouse.y = e.originEvent.clientY - bounds.y;
    mouse.x = ( mouse.x / bounds.width ) * 2 - 1;
    mouse.y = - ( mouse.y / bounds.height ) * 2 + 1;
    const camera = this.layer.getCamera();
    this.raycaster?.setFromCamera(mouse, camera);
    const intersects = this.raycaster?.intersectObject(this.group, true);
    if(intersects?.length){
      const obj = intersects[0].object
      const batchData = {}
      const batchTable = this.getBatchTable(obj)
      if(batchTable){
        const keys = batchTable.getKeys()
        keys.forEach( v => {
          batchData[v] = batchTable.getData(v)
        })
      }
      return {
        object: obj,
        batchData
      }
    }
    return null
  }

  getBatchTable(selectedMesh){
    if(!selectedMesh){
      return null
    }
    if(selectedMesh.batchTable){
      return selectedMesh.batchTable
    }
    return this.getBatchTable(selectedMesh.parent)
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
    this.layer.update()
    if(this.statsContainer){
      const tiles = this.tilesRenderer as any;
      this.statsContainer.innerHTML = `正在下载: ${ tiles.stats.downloading } 正在编译: ${ tiles.stats.parsing } 已显示: ${ tiles.group.children.length - 2 }`;
    }
  }

  getGroup(){
    return this.group
  }

  getTilesRenderer(){
    return this.tilesRenderer
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame)
    this.unbindEvents()
    this.layer.remove(this.group)
    this.tilesRenderer?.dispose()
    this.group = null
    this.tilesRenderer = undefined
    this.layer = null
    if(this.statsContainer){
      this.statsContainer.remove()
      this.statsContainer = undefined
    }
    /*if (this.object) {
      clearGroup(this.object);
      this.object = null;
      this.layer = null;
    }*/
  }
}

export {Layer3DTiles}
