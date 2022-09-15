# @amap/three-layer
[![npm (tag)](https://img.shields.io/npm/v/@amap/layer-3dtiles)](https://www.npmjs.org/package/@amap/layer-3dtiles)
[![NPM downloads](http://img.shields.io/npm/dm/@amap/layer-3dtiles.svg)](https://npmjs.org/package/@amap/layer-3dtiles)
![JS gzip size](http://img.badgesize.io/https://unpkg.com/@amap/layer-3dtiles/dist/index.js?compression=gzip&label=gzip%20size:%20JS)
[![NPM](https://img.shields.io/npm/l/@amap/layer-3dtiles)](https://github.com/AMap-Web/layer-3dtiles)
[![star](https://badgen.net/github/stars/amap-web/layer-3dtiles)](https://github.com/AMap-Web/layer-3dtiles)

### 简介
本项目为高德地图的3DTilesLayer图层插件，依赖`@amap/three-layer`插件

### 加载方式
当前项目支持CDN加载和npm加载两种方式。

#### CDN加载
CDN加载需要先加载高德地图JS、threejs的库和`@amap/three-layer`，代码如下
```js
<!--加载高德地图JS 2.0 -->
<script src = 'https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY'></script>
<!--加载threejs -->
<script src="https://cdn.jsdelivr.net/npm/three@0.143/build/three.js"></script>
<!--加载threejs的GLTFLoader -->
<script src="https://cdn.jsdelivr.net/npm/three@0.143/examples/js/loaders/GLTFLoader.js"></script>
<!--加载three-layer插件 -->
<script src="https://cdn.jsdelivr.net/npm/@amap/three-layer/dist/index.js"></script>
<!--加载layer-3dtiles插件 -->
<script src="https://cdn.jsdelivr.net/npm/@amap/layer-3dtiles/dist/index.js"></script>
```

#### npm加载
npm加载可以直接使用安装库
```shell
npm install '@amap/layer-3dtiles'
```

### 使用示例

#### CDN方式
```js
<script src = 'https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY'></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.143/build/three.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.143/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@amap/three-layer/dist/index.js"></script>
<!--加载layer-3dtiles插件 -->
<script src="https://cdn.jsdelivr.net/npm/@amap/layer-3dtiles/dist/index.js"></script>
<script type="text/javascript">
  const map = new AMap.Map('app', {
      center: [120,31],
      zoom: 14,
      viewMode: '3D',
      pitch: 35
    })
  const layer = new AMap.ThreeLayer(map)
  layer.on('complete', () => {
      const light = new THREE.AmbientLight('#ffffff', 1);
      layer.add(light);
      const tiles = new AMap.Three3DTiles(layer, {
        // url: './data/tileset.json',
        url: 'https://a.amap.com/jsapi_demos/static/data3d/single.json',
        position: [121.502325,31.238165]
      })
      tiles.setRotation({
        x:90,
        y:0,
        z:0
      })
      console.log('layer: ', layer)
      console.log('tiles: ', tiles)
  })
</script>
```

#### npm方式
```js
import {AmbientLight} from 'three'
import {ThreeLayer, ThreeGltf} from '@amap/three-layer'
const map = new AMap.Map('app', {
  center: [120,31],
  zoom: 14,
  viewMode: '3D',
  pitch: 35
})
const layer = new ThreeLayer(map)
layer.on('complete', () => {
  const light = new AmbientLight('#ffffff', 1);
  layer.add(light);
  const gltf = new ThreeGltf(layer, {
    url: 'https://a.amap.com/jsapi_demos/static/gltf/Duck.gltf',
    position: [120, 31],
    scale: 800,
    rotation: {
      x:90,
      y:0,
      z:0
    }
  })
  console.log('layer: ', layer)
  console.log('gltf: ', gltf)
})
```

### API文档说明

#### Layer3DTiles图层说明
3dtiles图层类，提供了基础的添加、删除物体、转换坐标等功能<br/>
``  new AMap.Layer3DTiles(layer: AMap.ThreeLayer, options: Layer3DTilesOptions)  ``<br/>
###### 参数说明
layer: ThreeLayer实例对象<br/>
options: Layer3DTiles初始化参数，参数内容如下：

| 属性名 | 属性类型                             | 属性描述                              |
| ---- |----------------------------------|-----------------------------------|
| url | String                           | 模型加载地址                            |

###### 成员函数

| 函数名 | 入参                               | 返回值          | 描述               |
|-----|----------------------------------|--------------|------------------|
| setScale | Number，{x:Number, y: Number, z: Number}    | 无            | 设置缩放比例           |
| setPosition | [Number,Number] (经纬度)            | 无            | 设置模型位置           |
| setRotation | {x:Number, y: Number, z: Number} | 无            | 旋转模型             |
| setAngle | Number                           | 无            | 设置模型旋转角度 0 - 360 |
| setHeight | Number                           | 无            | 设置离地高度           |
| getObject | 无 | Object3D     | 获取模型对象           |
| refresh | 无                                | 无            | 刷新图层             |
| show | 无                                | 无            | 显示模型             |
| hide | 无                                | 无            | 隐藏模型             |
| remove | 无                                | 无            | 从layer中移出模型      |
| destroy | 无                                | 无            | 销毁模型             |

###### 事件列表

| 事件名 | 参数                               | 描述                                     |
| ---- |----------------------------------|----------------------------------------|
| complete | {target: Object3D, animations: animations} | 模型初始化成功后触发，返回模型对象和gltf自带的的animations对象 |
