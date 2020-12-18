const { STATUS_CODES } = require('http');
const { DEFAULT_MIN_VERSION } = require('tls');

// LSP VARIABLE TYPES
const CONS_ALFA = 'ALFA';
const CONS_NUME = 'NUMERICO';
const CONS_DATE = 'DATE';
const COND_SE = 'SE';
const COND_ENQ = 'ENQUANTO';


let sql = require('fs').readFileSync('model.sql', 'utf8');
let varArray = [];
let cursorName = 'CUR_R034FUN';



//console.log(sql);
sql = sql.toUpperCase();
sql = removeSpecialComands(sql);
let jsonObj = sqlToJson(sql);

sql = dismantleSqlIntoBasicCursor(jsonObj, varArray);
sql = sql.substring(0, sql.length - 2).trim();
sql = generateStructure(sql, COND_SE, cursorName);
sql = simpleVarGenerator(varArray, cursorName) + sql;
console.log(sql);


function dismantleSqlIntoBasicCursor(sql, varArray){
    let code = '';
    
    // GENERATE SELECT CLAUSE
    code = 'SELECT';
    for(let i = 0; i < sql.selectFields.length; i++){
        code += ' ' + sql.selectFields[i] + ',';
    }
    code = code.substring(0, code.length - 1);

    // GENERATE FROM CLAUSE
    code += ' FROM';
    for(let i = 0; i < sql.tables.length; i++){
        code += ' ' + sql.tables[i] + ',';
    }
    code = code.substring(0, code.length - 1);

    // GENERATE WHERE CLAUSE
    if(sql.whereConditions.length > -1){
        code += ' WHERE';
        for(let i = 0; i < sql.whereConditions.length; i++){
            if(typeof sql.whereConditions[i].value == 'object'){
                code += ' ' + sql.whereConditions[i].field + ' '
                            + sql.whereConditions[i].condition + ' (' 
                            + dismantleSqlIntoBasicCursor(sql.whereConditions[i].value) + ')'
                            + sql.whereConditions[i].nextConnect + ' \\ \n';
            } else {
                code += ' ' + sql.whereConditions[i].field + ' '
                            + sql.whereConditions[i].condition + ' '
                            + varValue(sql.whereConditions[i].value, sql.whereConditions[i].field, sql.whereConditions[i].condition, varArray) + ' ' 
                            + sql.whereConditions[i].nextConnect + ' \\ \n';
            }
        }
        code = code.substring(0, code.length - 1);
    }

    return code;
}

function simpleVarGenerator(varArray, cursorVar){
    let variables = '';
    for(let i = 0; i < varArray.length; i++){
        if(varArray[i].indexOf(':a') > -1){
            variables += "Definir Alfa " + varArray[i].substring(1, varArray[i].length) + ';\n';
        } else if(varArray[i].indexOf(':n') > -1){
            variables += "Definir Numerico " + varArray[i].substring(1, varArray[i].length) + ';\n';
        } else if(varArray[i].indexOf(':d') > -1){
            variables += "Definir Data " + varArray[i].substring(1, varArray[i].length) + ';\n';
        }
    }
    return 'Definir Cursor ' + cursorVar + '\n' + variables + '\n';
}


function sqlToJson(sql){
    let auxString = '';
    let jsonObj = {
        'selectFields':[],
        'tables':[],
        'whereConditions':[],
        'union':[],
        'orderBy':[],
        'groupdBy':[]
    };

    let selectFields = sql.substring(sql.indexOf('SELECT') + 7, sql.indexOf('FROM') - 1);    

    while(selectFields != null){
        if((selectFields.indexOf('*') > -1)){
            jsonObj.selectFields.push(selectFields.substring(0, selectFields.indexOf('*')).trim());
            selectFields = selectFields.substring(selectFields.indexOf('*') + 1, selectFields.length).trim();
        } else if((selectFields.indexOf(',') > -1)){
            jsonObj.selectFields.push(selectFields.substring(0, selectFields.indexOf(',')).trim());           
            selectFields = selectFields.substring(selectFields.indexOf(',') + 1, selectFields.length).trim();
        } else {
            jsonObj.selectFields.push(selectFields.substring(0, selectFields.length).trim());
            selectFields = null;
        }
    }   

    let endTables = sql.indexOf('WHERE');
    if(endTables == -1){
        endTables = sql.length;
    } else {
        endTables--;
    }
    let selectedTables = sql.substring(sql.indexOf('FROM') + 5, endTables).trim();    

    while(selectedTables != null){
        if((selectedTables.indexOf(',') > -1)){
            jsonObj.tables.push(selectedTables.substring(0, selectedTables.indexOf(',')).trim());           
            selectedTables = selectedTables.substring(selectedTables.indexOf(',') + 1, selectedTables.length).trim();
        } else {
            jsonObj.tables.push(selectedTables.substring(0, selectedTables.length).trim());
            selectedTables = null;
        }       
    }

    if(sql.indexOf('WHERE') > -1){
        let endWhere = 0;
        if(sql.indexOf('ORDER') > -1){
            endWhere = sql.indexOf('ORDER');
        } else if(sql.indexOf('GROUP') > -1){
            endWhere = sql.indexOf('GROUP');
        } else {
            endWhere = sql.length;
        }

        let whereConditions = sql.substring(sql.indexOf('WHERE') + 6, endWhere);       
        
        let subSelectPosition = -1;
        let condition = '';
        while(whereConditions != null){
            let whereValue = {};
            let controler = 0;
            if((whereConditions.indexOf('OR') > -1) && (whereConditions.indexOf('OR') < whereConditions.indexOf('AND'))){
                controler = whereConditions.indexOf('OR');
            } else {
                controler = whereConditions.indexOf('AND');
            }
            let endWhere = false;
            if((whereConditions.indexOf('AND') == -1) && (whereConditions.indexOf('OR') == -1)){
                controler = whereConditions.length;
                endWhere = true;
            }
            
            condition = checkCondition(whereConditions.substring(0, controler - 1));
            whereValue.field = whereConditions.substring(0, whereConditions.indexOf(condition)).trim();
            whereValue.condition = condition;
            if(whereConditions.indexOf('SELECT') > -1){
                subSelectPosition = whereConditions.indexOf('SELECT');
            }
            if ((subSelectPosition > 0) 
            && (subSelectPosition < whereConditions.indexOf('AND') || subSelectPosition < whereConditions.indexOf('OR'))){
                whereValue.value = getSubSelect(whereConditions).trim(); 
                whereValue.value = whereValue.value.substring(0, whereValue.value.length - 1);
            } else {
                whereValue.value = whereConditions.substring((whereConditions.indexOf(condition) + condition.length + 1), controler).trim();
            }
            if(whereValue.value.indexOf('SELECT') > -1){ 
                whereConditions = whereConditions.substring((whereValue.field.length + 1 + 
                                                            whereValue.condition.length + 1 +
                                                            whereValue.value.length + 1), whereConditions.length);   
                whereValue.value = sqlToJson(whereValue.value); 
            }
            if((whereConditions.indexOf('OR') < whereConditions.indexOf('AND')) && whereConditions.indexOf('OR') > -1){
                whereValue.nextConnect = 'OR';
                whereConditions = whereConditions.substring(whereConditions.indexOf('OR') + 2, whereConditions.length).trim();
            } else {
                whereValue.nextConnect = 'AND';
                whereConditions = whereConditions.substring(whereConditions.indexOf('AND') + 4, whereConditions.length).trim();
            }
            if(endWhere){
                whereConditions = null;
                whereValue.nextConnect = '';
            }
            jsonObj.whereConditions.push(whereValue);
        }       
    } 
    return jsonObj;
}

function removeSpecialComands(sql){
    while((sql.indexOf('\n') > -1) || (sql.indexOf('\t') > -1) ||
          (sql.indexOf('\r') > -1) || (sql.indexOf('  ') > -1)){
        if(sql.indexOf('\n') > -1){
            sql = sql.replace('\n', ' ');
        } 
        if(sql.indexOf('\t') > -1){
            sql = sql.replace('\t', ' ');
        } 
        if(sql.indexOf('\r') > -1){
            sql = sql.replace('\r', ' ');
        } 
        if(sql.indexOf('  ') > -1){
            sql = sql.replace('  ', ' ');
        } 
    }
    return sql;
}

function getSubSelect(whereConditions) {
    let closingCounts = 1;
    let auxString = whereConditions.substring(whereConditions.indexOf('SELECT'), whereConditions.length);
    whereConditions = '';
    let nextOpen = 0
    let nextClose = 0;
    while(closingCounts > 0){
        nextOpen = auxString.indexOf('(');
        nextClose = auxString.indexOf(')');

        if((nextOpen < nextClose) && (nextOpen > -1)){
            whereConditions += auxString.substring(0, nextOpen + 1);
            auxString = auxString.substring(nextOpen + 1, auxString.length);
            closingCounts++;
        } else {
            whereConditions += auxString.substring(0, nextClose + 1);
            auxString = auxString.substring(nextClose + 1, auxString.length);
            closingCounts--;
        }
    }

    return whereConditions;
}

function checkCondition(condition){
    if(condition.indexOf('=') > -1){
        condition = '=';
    } else if(condition.indexOf('>=') > -1){
        condition = '>=';
    } else if(condition.indexOf('<=') > -1){
        condition = '<=';
    } else if(condition.indexOf('<>') > -1){
        condition = '<>';
    } else if(condition.indexOf('IN') > -1){
        condition = 'IN';
    } else if(condition.indexOf('LIKE') > -1){
        condition = 'LIKE';
    } else {
        condition = '=';
    }

    return condition 
}

function varValue(value, field, condition, varArray){

    if(field.indexOf('.') > -1){
        field = field.substring(field.indexOf('.') + 1, field.length);
    } else {
        field = field;
    }
    
    if(condition == '=' || condition == '>=' || condition == '<=' || condition == '<>'){
        if((value.indexOf('\'') > -1) || (value.indexOf('"') > -1)){
            if(value.match(/^\d{2}\/\d{2}\/\d{4}$/)){
                value = ':d' + field; 
                varArray.push(value);   
            } else {
                value = ':a' + field ;
                varArray.push(value);
            }
        } else if(!isNaN(value)){
            value = ':n' + field;
            varArray.push(value);
        } else if(value.indexOf('DAY(') > -1){
            value = ':d' + field; 
            varArray.push(value);
        }
    }

    if(condition == 'LIKE'){
        if(value.indexOf('\'') > -1 || value.indexOf('%') > -1 ){
            value = ':a' + field 
            varArray.push(value);
        }      
    }

    if(condition == 'IN'){
        // -----------------------------
    }

    return value
}

function generateStructure(sql, condition, cursorName){
    if(condition == COND_SE){
        sql = cursorName + '.SQL \"'+ sql + '\";\n\n' + cursorName + '.abrirCursor();\nSe(' + cursorName + '.achou){\n\n};\n\n' + cursorName + '.fecharCursor();';
    } else if (condition == COND_ENQ) {
        sql = cursorName + '.SQL \"'+ sql + '\";\n\n' + cursorName + '.abrirCursor();\nEnquanto(' + cursorName + '.achou){\n\n\t' + cursorName + '.proximo();\n}\n\n'+ cursorName + '.fecharCursor();';
    }

    return sql;
}