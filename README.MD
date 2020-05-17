### ps-file

package used to simplify your writing or reading file

#### install

```shell
npm i ps-file@latest
```

#### import

```javascript
let psfile = require('ps-file');
```

#### usage

1,read file
```javascript
let psfile = require('ps-file'),
    pathLib = require('path'),
    workpath = process.cwd();
psfile(pathLib.resolve(workpath, './file'))
    .read()
    .then(content => {
        console.log(content);
    })
```

2,write file
```javascript
let psfile = require('ps-file'),
    pathLib = require('path'),
    workpath = process.cwd();
psfile(pathLib.resolve(workpath, './file'))
    .write('hello worlk')
    .then(node => {
        console.log('success');
    })
```

3,load file contents of current folder recusively.
```javascript
let psfile = require('ps-file'),
    pathLib = require('path'),
    workpath = process.cwd();
psfile(pathLib.resolve(workpath, './file'))
    .children((node) => true)
    .then(nodes => {
        return new Promise(nodes.map( node => {
            return node.read()
        }))
    }).then(contents => {
        console.log(contents);
    })
```