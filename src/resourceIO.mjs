/***********************************************************************
// scripts for fetching urls and reading / writeing to working directory
************************************************************************/

import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

// const cwd = process.cwd()

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

export async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

export async function fetchYaml(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    return await response.text();
}
