// LSP VARIABLE TYPES
const CONS_ALFA = 'ALFA';
const CONS_NUME = 'NUMERICO';

// LIB TO AQUIRE THE XML IN A JS OBJECT
//let xml = require('./model.xml');
let convert = require('xml-js');
let fs = require('fs');

// DEFINE THE VARIABLES NAMES AND GENERAL XML VARIABLE
let lspVarName = 'aXml';
let varArray = ['aXml'];

let xml = require('fs').readFileSync('model.xml', 'utf8');
let fullConvertion = convert.xml2js(xml); 
let xmlHeader = getXMLHeader(xml, lspVarName);

xml = simpleLspXMLCodeGen(fullConvertion.elements, lspVarName, varArray, '');
xml = xml.substring(1, xml.length);
xml = simpleVarGenerator(varArray, CONS_ALFA) + '\n' + clearVariables(varArray, CONS_ALFA) + '\n' + xmlHeader + xml + ';';
console.log(xml);

function simpleLspXMLCodeGen(tags, varName, varArray, fatherNode){
    let lsp = '';
    for(let i = 0; i < tags.length; i++){
        if(tags[i].type == 'element'){
            if(tags[i].attributes == undefined){
                lsp += ';\n'+ varName + ' = ' + varName + ' + \"<' + tags[i].name + '>\"';
            } else {
                lsp += ';\n'+ varName + ' = ' + varName + ' + \"<' + tags[i].name + ' ' + generateAttributesXMLLSP(tags[i].attributes) + '>\"';
            }
            lsp += simpleLspXMLCodeGen(tags[i].elements, varName, varArray, tags[i].name);
            if(tags[i].elements[0].type == 'text'){
                lsp += ' + \"</' + tags[i].name + '>\"';
            } else {
                lsp += ';\n'+ varName + ' = ' + varName + ' + \"</' + tags[i].name + '>\"';
            }
        } else if(tags[i].type == 'text') {
            lsp += ' + a' + fatherNode;
            if(varArray.indexOf('a'+fatherNode) == -1)
                varArray.push('a' + fatherNode);
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

function clearVariables(varArray, type){
    let variables = '';
    for(let i = 0; i < varArray.length; i++){
        if(type == CONS_ALFA){
            variables += varArray[i] + ' = "";\n';
        } else if (type == CONS_NUME){
            variables +=  varArray[i] + ' = 0;\n';
        }
    }
    return variables;
}

function getXMLHeader(xml, lspVarName){
    let closingHeader = xml.indexOf('>');
    let header = xml.substring(0, closingHeader + 1);

    header = header.split('"').join('\\"');
    
    return header = lspVarName + ' = ' + lspVarName + ' + \"' + header + '\"';;
}