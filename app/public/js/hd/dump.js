/* global HD namespace */

'use strict';

var HD = namespace('HD');

/**
 * Változó dump-olása
 * példa:
 * const obj = {x:1,y:{a:'valami',b:[1,function func(x, y){return 1;},'karakterlánc',44],c:{p:1,q:true}},z:null};
 * alert(nt.var_dump(obj, true));
 * @param {*} variable - bármilyen típusú változó
 * @param {Boolean} [withType=true] - típusok kiírása
 * @param {Number} [maxDeep=5] - maximális rekurzív ménység
 * @param {Number} [maxNum=30] - maximális elemszám objektumon és tömbön belül
 * @param {Number} [indent] - belső használatú argumentum
 * @returns {String} formázott alak
 */
HD.var_dump = function(variable, withType, maxDeep, maxNum, indent){
    if (typeof withType === 'undefined') withType = true;
    if (typeof maxDeep === 'undefined') maxDeep = 5;
    if (typeof maxNum === 'undefined') maxNum = 30;
    if (typeof indent === 'undefined') indent = 0;
    let i;
    let type = typeof variable;
    let dump;

    const space = function(n){
        let ret = '';
        for (let x = 0; x < n; x++){
            ret += '    ';
        }
        return ret;
    };

    if (type === 'undefined'){
        dump = 'undefined';
    }
    else if (type === 'boolean'){
        dump = (variable === true ? 'true' : 'false');
    }
    else if (type === 'number'){
        dump = variable.toString();
    }
    else if (type === 'string'){
        dump = `"${variable}"`;
    }
    else if (type === 'function'){
        const name = /^function\s+([\w$]+)\s*\(/.exec(variable.toString());
        if (!name){
            dump = '(anonymous)( )';
        }
        else {
            dump = `${name[1]}( )`;
        }
    }
    else if (type === 'object'){
        if (variable === null){
            type = 'null';
            dump = 'null';
        }
        else {
            type = Object.prototype.toString.call(variable).split(' ')[1].slice(0, -1);
            if (type === 'Array'){
                // tömb
                dump = '';
                if (maxDeep === 0){
                    dump = `[\n${space(indent + 1)}...\n${space(indent)}]`;
                }
                else {
                    ++indent;
                    --maxDeep;
                    dump += '[\n';
                    for (i = 0; i < variable.length; i++){
                        if (i < maxNum){
                            dump += `${space(indent)}${i}: ${
                                this.var_dump(variable[i], withType, maxDeep, maxNum, indent)
                            }\n`;
                        }
                        else {
                            dump += `${space(indent)}...\n`;
                            break;
                        }
                    }
                    dump += `${space(indent - 1)}]`;
                }
            }
            else {
                // objektum
                let n = 0;
                dump = '';
                if (maxDeep === 0){
                    dump = `{\n${space(indent + 1)}...\n${space(indent)}}`;
                }
                else if (typeof variable.nodeType !== 'undefined'){
                    n = 0;
                    type = 'DOM element';
                    ++indent;
                    dump += '{\n';
                    for (i in variable){
                        if (n < maxNum){
                            dump += `${space(indent)}"${i}": ${
                                this.var_dump(variable[i], withType, 0, maxNum, indent)
                            }\n`;
                        }
                        else {
                            dump += `${space(indent)}...\n`;
                            break;
                        }
                        ++n;
                    }
                    dump += `${space(indent - 1)}}`;
                }
                else {
                    ++indent;
                    --maxDeep;
                    dump += '{\n';
                    for (i in variable){
                        if (n < maxNum){
                            dump += `${space(indent)}"${i}": ${
                                this.var_dump(variable[i], withType, maxDeep, maxNum, indent)
                            }\n`;
                        }
                        else {
                            dump += `${space(indent)}...\n`;
                            break;
                        }
                        ++n;
                    }
                    dump += `${space(indent - 1)}}`;
                }
            }
        }
    }
    dump = (withType ? `(${type}) ` : ``) + dump;
    return dump;
};

HD.win_dump = function(dump){
    window.open().document.write(
        `<html><head></head><body><pre>${HD.var_dump(dump, true, 5, 100)}</pre></body></html>`
    );
};
