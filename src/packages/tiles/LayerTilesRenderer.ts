import { TilesRenderer } from '3d-tiles-renderer'
import {Matrix4, Vector3, Box3, Sphere} from 'three'
const vecX = new Vector3();
const vecY = new Vector3();
const vecZ = new Vector3();
export class LayerTilesRenderer extends TilesRenderer {

  preprocessNode( tile, parentTile, tileSetDir ) {

    super.preprocessNode( tile, parentTile, tileSetDir );

    const transform = new Matrix4();
    if ( tile.transform ) {

      if(!parentTile){
        transform.elements[0] = 1
        transform.elements[1] = 0
        transform.elements[2] = 0
        transform.elements[3] = 0
        transform.elements[4] = 0
        transform.elements[5] = 1
        transform.elements[6] = 0
        transform.elements[7] = 0
        transform.elements[8] = 0
        transform.elements[9] = 0
        transform.elements[10] = 1
        transform.elements[11] = 0
        transform.elements[ 12 ] = 0
        transform.elements[ 13 ] = 0
        transform.elements[ 14 ] = 0
        transform.elements[ 15 ] = 1.0
      }else{
        const transformArr = tile.transform;
        for ( let i = 0; i < 16; i ++ ) {

          transform.elements[ i ] = transformArr[ i ];

        }
      }
    }

    if ( parentTile ) {

      transform.premultiply( parentTile.cached.transform );

    }

    const transformInverse = new Matrix4().copy( transform ).invert();

    let box = null;
    let boxTransform = null;
    let boxTransformInverse = null;
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

    let sphere = null;
    if ( 'sphere' in tile.boundingVolume ) {

      const data = tile.boundingVolume.sphere;
      sphere = new Sphere();
      sphere.center.set( data[ 0 ], data[ 1 ], data[ 2 ] );
      sphere.radius = data[ 3 ];
      sphere.applyMatrix4( transform );

    } else if ( 'box' in tile.boundingVolume ) {

      const data = tile.boundingVolume.box;
      sphere = new Sphere();
      box.getBoundingSphere( sphere );
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
}
