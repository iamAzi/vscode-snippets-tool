#!/usr/bin/env node
const execa = require('execa');
const readline = require('readline');
const fse = require('fs-extra')
const path = require('path');
const inquirer = require('inquirer');
const c = require('chalk');
const { baseSnippets } = require('./lib/filename');

let res = [];
let inputFlag = true;
// record input time
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '|'
});

console.log(c.green(`请输入 Snippet: `), c.gray(`(使用单行 '---' 表示输入完成)`))
// console.log(c.gray(`(最后一行 '---' 表示结束输入)`))

console.log('|---')
rl.prompt();
rl.on('line', (line) => {
    if (/^\-{3,}$/.test(line) && inputFlag) {
        // 用户输入终止指令
        inputFlag = false;
        rl.removeListener('line', () => { });
        addFile();
    } else if (inputFlag) {
        // 正在输入 snippet 代码
        res.push(line);
        rl.prompt();
    }
})

async function addFile() {
    const { stdout } = await execa('whoami');
    const whoAmI = stdout;

    const { snippetName, description, ccc } = await inquirer.prompt([
        {
            name: 'snippetName',
            type: 'input',
            message: 'Snippet 热键: '
        },
        {
            name: 'description',
            type: 'input',
            message: 'Snippet 描述: ',
            default: `Fast Snippet Created in ${new Date().toLocaleString()}`
        }
    ])

    const outputFile = `/Users/${whoAmI}/Library/Application Support/Code/User/snippets/${baseSnippets}`;
    const exists = await checkFileExist(outputFile);
    let content = {};
    if (exists) {
        const curSnip = fse.readFileSync(outputFile, 'utf-8');
        const curSnipObj = JSON.parse(curSnip);
        curSnipObj[snippetName] = {
            prefix: snippetName,
            body: res,
            description: description
        }
        content = curSnipObj;
    } else {
        content = {
            snippetName: {
                prefix: snippetName,
                body: res,
                description: description
            }
        }
    }
    fse.writeFileSync(outputFile, `${JSON.stringify(content, null, 2)}`);
    console.log('代码片段已添加！');
    rl.close();
}

/**
 * check if the target snippet file exists
 * @param {string}} filePath 
 */
async function checkFileExist(filePath) {
    const exists = await fse.pathExists(filePath)
    return exists;
}
