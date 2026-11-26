/**********************************************************************
// scripts for fetching urls and reading / writing to working directory
***********************************************************************/

import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {parse} from 'yaml';


export function exists(fileName, cwd = process.cwd()) {
    try {
        readFile(fileName, cwd);
        return true;
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        return false;
    }
}

export function readFile(fileName, cwd = process.cwd()) {
    return readFileSync(path.join(cwd, fileName), 'utf8');
}

export function writeFile(fileName, data, cwd = process.cwd()) {
    return writeFileSync(path.join(cwd, fileName), data);
}

export function readJsonFile(fileName, cwd = process.cwd()) {
    const contents = readFile(fileName, cwd);
    return JSON.parse(contents);
}

export function writeJsonFile(fileName, data, cwd = process.cwd()) {
    const prettied = JSON.stringify(data, null, 2);
    return writeFile(fileName, `${prettied}\n`, cwd);
}

/** reads yaml file and returns as js object */
export function readYamlFile(fileName, cwd = process.cwd()) {
    const fileContents = readFile(fileName, cwd);
    return parse(fileContents);
}
