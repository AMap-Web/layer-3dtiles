import { TilesRenderer } from '3d-tiles-renderer'
import {Matrix4, Vector3, Box3, Sphere} from 'three'
const vecX = new Vector3();
const vecY = new Vector3();
const vecZ = new Vector3();
export class LayerTilesRenderer extends TilesRenderer {

  preprocessNode( tile, parentTile, tileSetDir ) {

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super.preprocessNode( tile, parentTile, tileSetDir );

    const transform = new Matrix4();
    if ( tile.transform ) {

      if(!parentTile){
        tile.transform[0] = 1
        tile.transform[1] = 0
        tile.transform[2] = 0
        tile.transform[3] = 0
        tile.transform[4] = 0
        tile.transform[5] = 1
        tile.transform[6] = 0
        tile.transform[7] = 0
        tile.transform[8] = 0
        tile.transform[9] = 0
        tile.transform[10] = 1
        tile.transform[11] = 0
        tile.transform[ 12 ] = 0
        tile.transform[ 13 ] = 0
        tile.transform[ 14 ] = 0
        tile.transform[ 15 ] = 1.0
      }
      const transformArr = tile.transform;
      for ( let i = 0; i < 16; i ++ ) {

        transform.elements[ i ] = transformArr[ i ];

      }
    }

    if ( parentTile ) {

      transform.premultiply( parentTile.cached.transform );

    }
    const transformInverse = new Matrix4().copy( transform ).invert();

    let box: null | Box3 = null;
    let boxTransform: null | Matrix4 = null;
    let boxTransformInverse: null | Matrix4 = null;
    if ( 'box' in tile.boundingVolume ) {

      const data = tile.boundingVolume.box;
      box = new Box3();
      boxTransform = new Matrix4();
      boxTransformInverse = new Matrix4();

      // get the extents of the bounds in each axis
      vecX.set( data[ 3 ], data[ 4 ], data[ 5 ] );
      vecY.set( data[ 6 ], data[ 7 ], data[ 8 ] );
      vecZ.set( data[ 9 ], data[ 10 ], data[ 11 ] );

      const scaleX = vecX.length();
      const scaleY = vecY.length();
      const scaleZ = vecZ.length();

      vecX.normalize();
      vecY.normalize();
      vecZ.normalize();

      // handle the case where the box has a dimension of 0 in one axis
      if ( scaleX === 0 ) {

        vecX.crossVectors( vecY, vecZ );

      }

      if ( scaleY === 0 ) {

        vecY.crossVectors( vecX, vecZ );

      }

      if ( scaleZ === 0 ) {

        vecZ.crossVectors( vecX, vecY );

      }

      // create the oriented frame that the box exists in
      boxTransform.set(
        vecX.x, vecY.x, vecZ.x, data[ 0 ],
        vecX.y, vecY.y, vecZ.y, data[ 1 ],
        vecX.z, vecY.z, vecZ.z, data[ 2 ],
        0, 0, 0, 1
      );
      boxTransform.premultiply( transform );
      boxTransformInverse.copy( boxTransform ).invert();

      // scale the box by the extents
      box.min.set( - scaleX, - scaleY, - scaleZ );
      box.max.set( scaleX, scaleY, scaleZ );

    }

    let sphere: null | Sphere = null;
    if ( 'sphere' in tile.boundingVolume ) {

      const data = tile.boundingVolume.sphere;
      sphere = new Sphere();
      sphere.center.set( data[ 0 ], data[ 1 ], data[ 2 ] );
      sphere.radius = data[ 3 ];
      sphere.applyMatrix4( transform );

    } else if ( 'box' in tile.boundingVolume ) {

      const data = tile.boundingVolume.box;
      sphere = new Sphere();
      box?.getBoundingSphere( sphere );
      sphere.center.set( data[ 0 ], data[ 1 ], data[ 2 ] );
      sphere.applyMatrix4( transform );

    }

    const region = null;
    if ( 'region' in tile.boundingVolume ) {

      console.warn( 'ThreeTilesRenderer: region bounding volume not supported.' );

    }

    tile.cached = {

      loadIndex: 0,
      transform,
      transformInverse,

      active: false,
      inFrustum: [],

      box,
      boxTransform,
      boxTransformInverse,
      sphere,
      region,

      scene: null,
      geometry: null,
      material: null,

    };

  }

  dispose() {

    super.dispose();
    const _this = this as any
    _this.lruCache.itemList.forEach( tile => {
      _this.disposeTile( tile );
    } );
    _this.lruCache.itemSet.clear();
    _this.lruCache.itemList = [];
    _this.lruCache.callbacks.clear();
    _this.lruCache = null;
    _this.visibleTiles.clear();
    _this.activeTiles.clear();
    _this.downloadQueue.callbacks.clear();
    _this.downloadQueue.items = [];
    _this.downloadQueue = null;
    _this.parseQueue.callbacks.clear();
    _this.parseQueue.items = [];
    _this.parseQueue = null;
    this.clearGroup( this.group );
    _this.tileSets = {};
    _this.cameraMap.clear();
    _this.cameras = [];
    _this.cameraInfo = [];
    _this.group = null;

  }

  clearGroup( group ) {
    group.traverse( ( item ) => {

      if ( item.isMesh ) {

        item.geometry.dispose();
        item.material.dispose();
        if ( item.material.texture && item.material.texture.dispose ) {

          item.material.texture.dispose();

        }

      }
      delete item.featureTable;
      delete item.batchTable;

    } );
    delete group.tilesRenderer;
    group.remove( ...group.children );

  }
}
