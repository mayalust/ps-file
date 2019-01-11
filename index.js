const fs = require("fs"),
  pathLib = require("path"),
  { extend } = require("ps-ultility");
module.exports = function( path ){
  class filetree{
    constructor( path ){
      if(typeof path === "string"){
        path = {
          path : path
        }
      }
      extend( this, path );
    }
    stat(){
      return getState( this.path );
    }
    exist( name ){
      let path = [ this.path ];
      typeof name !== "undefined" ? path.push( `./${name}` ) : null;
      return fs.existsSync( pathLib.resolve.apply( pathLib, path ));
    }
    isDirectory(){
      return typeof this.isDir !== "undefined"
        ? createImmediatePromise( this.isDir )
        : getState( this.path ).then( d => {
          return createImmediatePromise( d.isDir );
        })
    }
    write( name, content ){
      let path;
      if( typeof content == "undefined" ){
        content = name;
        path = this.path;
      } else {
        path = pathLib.join( this.path, `./${name}` );
      }
      return typeof content === "undefined"
        ? createError(`content is undeined`)
        : write(path, content)
          .then( d => getState( path ))
    }
    read( name ){
      if( typeof name == "undefined" ){
        path = this.path;
      } else {
        path = pathLib.join( this.path, `./${name}` );
      }
      return typeof content === "undefined"
        ? createError(`content is undeined`)
        : read( path ).then( content => {
          return getState( path ).then( d => {
            d.content = content
            return createImmediatePromise( d );
          });
        })
    }
    remove(){
      return remove( this.path );
    }
    mkdir( name ){
      let path = pathLib.resolve( this.path, `./${name}`)
      return mkdir( path )
        .then( d => getState( path ))
    }
    children( callback ){
      let rs = [];
      callback = callback || function(){ return true };
      return new Promise((resolve, reject) => {
        function load( paths ){
          return Promise.all(paths.map( path => {
            return readDir( path ).then( d => {
              [].push.apply(rs, d.filter(callback));
              return load( d.filter( d => d.isDir).map( d => d.path) );
            })
          }));
        }
        load([ this.path ]).then( d => {
          resolve( rs );
        })
      });
    }
    readDir(){
      return readDir( this.path );
    }
  }
  function createImmediatePromise( d ){
    return new Promise( resolve => {
      resolve( d );
    });
  }
  function createError( e ){
    return new Promise( ( resolve, reject ) => {
      reject( e );
    });
  }
  function readDir( path ){
    return new Promise((resolve, reject) => {
      fs.readdir( path, (err, d) => {
        if(!err){
          return Promise.all(d.map( n => {
            return getState( pathLib.resolve(path, `./${n}`) );
          })).then( d => {
            resolve( d );
          }).catch( e => {
            reject( e );
          })
        } else {
          reject(err)
        }
      })
    });
  }
  function write( path, content ){
    return new Promise((resolve, reject) => {
      fs.writeFile(path, content, (err, d) => {
        if(err) {
          reject(err);
        } else {
          resolve( `success` );
        }
      })
    });
  }
  function read( path ){
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, d) => {
        if(err) {
          reject(err);
        } else {
          resolve( d );
        }
      })
    });
  }
  function remove(path){
    return new Promise((resolve, reject) => {
      fs.unlink(path, (err, d) => {
        if (err) {
          reject(err);
        } else {
          resolve( "removed" );
        }
      })
    });

  }
  function mkdir(path){
    return new Promise((resolve, reject) => {
      fs.mkdir(path, 0o777, (err, d) => {
        if (err) {
          reject(err);
        } else {
          resolve( "dir made" );
        }
      })
    });
  }
  function getExt( path ){
    let match = /\.([^.\\\/]+)$/.exec( path );
    return match ? match[ 1 ] : ""
  }
  function getState( path ){
    return new Promise((resolve, reject) => {
      fs.stat( path , (err, d) => {
        if(!err){
          resolve(new filetree({
            path : path,
            isDir : d.isDirectory(),
            modifytime : d.mtime,
            data : d,
            ext : getExt( path )
          }))
        } else {
          err.path = path;
          reject(err)
        }
      });
    })
  }
  return new filetree( path )
}