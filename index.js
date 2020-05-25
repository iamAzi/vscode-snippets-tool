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

    const { snippetName, description, scope } = await inquirer.prompt([
        {
            name: 'snippetName',
            type: 'input',
            message: 'Prefix (热键): ',
            validate: (input) => {
                if (!input) {
                    console.log(c.red('💩 热键不能为空！'))
                    return false;
                } else {
                    return true;
                }
            }
        },
        {
            name: 'description',
            type: 'input',
            message: 'description (描述): ',
            default: `Fast Snippet Created in ${new Date().toLocaleString()}`
        },
        {
            name: 'scope',
            type: 'list',
            choices: [{
                name: 'all',
                short: 'All Scope',
                value: '',
            }, {
                name: 'css',
                short: 'css (include CSS/SCSS/LESS)',
                value: 'css, scss, less',
            }, {
                name: 'es',
                short: 'js (include js, jsx, ts, tsx)',
                value: 'javascript, javascriptreact, typescript, typescriptreact',
            }, {
                name: 'html',
                short: 'HTML',
                value: 'html',
            }],
            message: 'scope (使用范围): ',
            default: `Fast Snippet Created in ${new Date().toLocaleString()}`
        }
    ])

    const outputFile = `/Users/${whoAmI}/Library/Application Support/Code/User/snippets/${baseSnippets}`;
    const exists = await checkFileExist(outputFile);
    let content = {};
    if (exists) {
        const curSnip = fse.readFileSync(outputFile, 'utf-8');
        content = JSON.parse(curSnip);
        content[snippetName] = {
            prefix: snippetName,
            body: res,
            description: description
        }
    } else {
        content[snippetName] = {
            prefix: snippetName,
            body: res,
            description: description
        }
    }

    if (scope) {
        content[snippetName] = {
            scope,
            ...content[snippetName],
        }
    }
    fse.writeFileSync(outputFile, `${JSON.stringify(content, null, 4)}`);
    console.log(c.green.bold(`\n 🖨  Snippets 已添加！`));
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
