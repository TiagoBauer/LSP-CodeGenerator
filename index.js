// LSP VARIABLE TYPES
const CONS_ALFA = 'ALFA';
const CONS_NUME = 'NUMERICO';

// LIB TO AQUIRE THE XML IN A JS OBJECT
//let xml = require('./model.xml');
let convert = require('xml-js');

// DEFINE THE VARIABLES NAMES AND GENERAL XML VARIABLE
let lspVarName = 'aXml';
let varArray = ['aXml'];

let xml ='<?xml version="1.0" encoding="utf-8"?>' +
'<note importance="high" logged="true">' +
'    <title ccy="TEXTE">15</title>' +
'    <todo>Work</todo>' +
'    <todo>15</todo>' +
'</note>';
let fullConvertion = convert.xml2js(xml); 

//FULL BODY CONVERTION
//console.log(fullConvertion.elements[0]);
//console.log(fullConvertion.elements[0].elements[0]);

xml = simpleLspXMLCodeGen(fullConvertion.elements, lspVarName, varArray);
xml = xml.substring(1, xml.length);
xml = simpleVarGenerator(varArray, CONS_ALFA) + xml + ';';
console.log(xml);

function simpleLspXMLCodeGen(tags, varName, varArray){
    let lsp = '';
    for(let i = 0; i < tags.length; i++){
        if(tags[i].type == 'element'){
            if(tags[i].attributes == undefined){
                lsp += ';\n'+ varName + ' = ' + varName + ' + \"<' + tags[i].name + '>\"';
            } else {
                lsp += ';\n'+ varName + ' = ' + varName + ' + \"<' + tags[i].name + ' ' + generateAttributesXMLLSP(tags[i].attributes) + '>\"';
            }
            lsp += simpleLspXMLCodeGen(tags[i].elements, varName, varArray);
            lsp += ';\n'+ varName + ' = ' + varName + ' + \"</' + tags[i].name + '>\"';
        } else if(tags[i].type == 'text') {
            lsp += ' + a' + tags[i].text;
            varArray.push('a' + tags[i].text);
        }
    }
    return lsp;
}

function simpleVarGenerator(varArray, type){
    let variables = '';
    for(let i = 0; i < varArray.length; i++){
        if(type == CONS_ALFA){
            variables += "Definir Alfa " + varArray[i] + ';\n';
        } else if (type == CONS_NUME){
            variables += "Definir Numerico " + varArray[i] + ';\n';
        }
    }
    return variables;
}

function generateAttributesXMLLSP(attributes){
    let code = '';
    for(let field in attributes){
        code += field + '=\\"' + attributes[field] + '\\" ';
    }
    code = code.substring(0, code.length-1);
    return code;
}