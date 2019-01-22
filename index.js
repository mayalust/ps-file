const fs = require("fs"),
  pathLib = require("path"),
  { extend, dateparser, pathResolver } = require("ps-ultility");
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
      typeof name !== "undefined" ? path.push( pathResolver.join("./", name) ) : null;
      return fs.existsSync( pathLib.resolve.apply( pathLib, path ));
    }
    isDirectory(){
      return typeof this.isDir !== "undefined"
        ? createSuccess( this.isDir )
        : getState( this.path ).then( d => {
          return createSuccess( d.isDir );
        })
    }
    write( name, content ){
      let path;
      if( typeof content == "undefined" ){
        content = name;
        path = this.path;
      } else {
        path = pathLib.join( this.path, pathResolver.join("./", name) );
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
        path = pathLib.join( this.path, pathResolver.join("./", name) );
      }
      return read( path ).then( content => {
        return getState( path ).then( d => {
          return createSuccess( content );
        });
      })
    }
    removeAll( name ){
      return this.find( d => {
        return d.path == pathLib.resolve( this.path, `${ pathResolver.join("./", name)}`);
      }).then( foler => {
        foler ? foler.children( d => {
          return !d.isDir;
        } ).then( files => {
          return Promise.all(files.map( file => {
            return file.remove();
          }))
        }).then( d => {
          return foler.children().then( dirs => {
            return Promise.all(dirs.map( dir => {
              return dir.remove();
            }))
          }).then( d => {
            return createSuccess("removed!!")
          })
        }).then( d => {
          return foler.remove();
        }) : createSuccess("empty")
      });
    }
    remove(){
      return this.isDir ? removeDir( this.path ) : remove( this.path );
    }
    mkdir( name ){
      let path = pathLib.resolve( this.path, pathResolver.join("./", name))
      return mkdir( path )
        .then( d => getState( path ))
    }
    find( callback ){
      if(typeof callback !== "function"){
        throw new Error("query condition is not a valid function but a " + typeof callback);
      }
      function load( paths ){
        return paths.length > 0 ? Promise.all(paths.map( path => {
          return readDir( path );
        })).then( d => {
          let arr = d.reduce((a, b) => a.concat( b ),[]),
            fd = arr.find(callback)
          return fd ? createSuccess(fd)
            : load( arr.filter( d => d.isDir).map( d => d.path) );
        }) : createSuccess( undefined );
      }
      return load( [this.path] ).then( d => {
        return createSuccess( d );
      })
    }
    children( callback ){
      let rs = [];
      callback = callback || function(){ return true };
      function load( paths ){
        return Promise.all(paths.map( path => {
          return readDir( path ).then( d => {
            [].push.apply(rs, d.filter(callback));
            return load( d.filter( d => d.isDir).map( d => d.path) );
          })
        }));
      }
      return load([ this.path ]).then( d => {
        return createSuccess( rs );
      });
    }
    readDir(){
      return readDir( this.path );
    }
  }
  function createSuccess( d ){
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
            return getState( pathLib.resolve(path, pathResolver.join("./", n)) )
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
  function removeDir(path){
    return new Promise((resolve, reject) => {
      fs.rmdir(path, (err, d) => {
        if (err) {
          reject(err);
        } else {
          resolve( "directory removed" );
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
  function getBasename( path ){
    let match = /[\\\/]([^\\\/]*)\.[^.\\\/]+$/.exec( path );
    return match ? match[ 1 ] : ""
  }
  function getState( path ){
    return new Promise((resolve, reject) => {
      fs.stat( path , (err, d) => {
        if(!err){
          resolve(new filetree({
            basename : getBasename( path ),
            path : path,
            isDir : d.isDirectory(),
            modifytime : d.mtime,
            modifytimeStr : dateparser(d.mtime).getDateString("yyyy-MM-dd,hh:mm:ss"),
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