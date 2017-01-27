'use strict';

var ffi = require('ffi');
var ref = require('ref');

var INT = ref.types.int;
var BOOL = ref.types.bool;
var VOID = ref.types.void;
var DWORD = ref.types.uint32;

var libEV = ffi.Library('../dll/Everything64', {
  'Everything_SetSearchA': [ VOID, [ ref.types.CString ] ],
  'Everything_SetMatchCase': [ VOID, [ BOOL ] ],
  'Everything_QueryA': [ VOID, [ BOOL ] ],
  'Everything_GetNumResults': [ INT, [] ],
  'Everything_GetResultFullPathNameA': [ DWORD, [ DWORD, ref.types.CString, DWORD ]  ]
});

function cleanStr(theStringBuffer) {
    var theString = theStringBuffer.toString('utf-8');
    var terminatingNullPos = theString.indexOf('\u0000');
    if (terminatingNullPos >= 0) {
        theString = theString.substr(0, terminatingNullPos);
    }
    return theString;
}

function setSearchText(param) {
    return new Promise((resolve, reject) => {
        libEV.Everything_SetSearchA.async(param, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        })
    });
}

function executeQuery() {
    return new Promise((resolve, reject) => {
        libEV.Everything_QueryA.async(1, function(err, res) {
            if (err) reject(err);
            else resolve(res);
        })
    });
}

function getNumResults() {
    return new Promise((resolve, reject) => {
        libEV.Everything_GetNumResults.async(function(err, res) {
            if (err) reject(err);
            else resolve(res);
        })
    });
}

const MAX_PATH = 4000;
var buf = new Buffer(MAX_PATH);
buf.type = ref.types.CString;

function getResultPath(num) {
    return new Promise((resolve, reject) => {
        libEV.Everything_GetResultFullPathNameA.async(num, buf, MAX_PATH, function(err, res) {
            if (err) reject(err);
            else resolve(cleanStr(buf));
        })
    });
}
async function main(term) {
    let results = [];
    try {
        await setSearchText(term);
        await executeQuery();
        let resultNum = await getNumResults();
        for(let i=0;i<resultNum;i++){
            let str = await getResultPath(i)
            results.push(str);
        }
    }catch(ex){
        console.error(ex);
    }
    return results;
}


const plugin = ({term, display, actions}) => {
  const match = term.match(/^ev\s(.+)/);
  if (match) {
    main(match[1]).then(display);
  };
};

module.exports = {
  name: 'Search Everything...',
  fn: plugin,
  keyword: 'ev'
}
