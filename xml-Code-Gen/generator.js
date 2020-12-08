const xml = require('./model.xml');
const runner = require('../index');

console.log('[FSW-LAMBDA-MOCK]: Iniciando a execução da função...');

runner.handler(xml).then(response => {
    let resultMessage;
    response.statusCode == 400 ? resultMessage = 'A execução da função gerou uma mensagem de validação...' : resultMessage = 'A execução da função NÃO gerou nenhuma mensagem de validação...';
    
    console.log(`[FSW-LAMBDA-MOCK]: Resultado da execução: ${resultMessage}`);
    console.log(response);
    console.log('[FSW-LAMBDA-MOCK]: Finalizando a execução da função...');
});