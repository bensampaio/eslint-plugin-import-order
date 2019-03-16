const fs = require('fs');
const path = require('path');

const isAncestor = (importPath) => {
    return /^\.\./.test(importPath);
};

const isDirectory = (absolutePath) => {
    return fs.lstatSync(absolutePath).isDirectory();
};

const isIndex = (importPath) => {
    return /^\.(\/index\.\w+)?$/.test(importPath);
};

const isPackage = (importPath) => {
    return /^[@\w]/.test(importPath);
};

const isRelative = (importPath) => {
    return /^\./.test(importPath);
};

const isSibling = (importPath) => {
    return /^\.\//.test(importPath);
};

/**
 * Resolve the given import path into an absolute path.
 *
 * If the given import path is a relative path then simply resolve it from the perspective
 * of the given path.
 *
 * Otherwise, it must be the path to a node module or a builtin module so resolve it
 * using node resolve algorithm.
 *
 * @param {string} fromPath
 * @param {string} importPath
 * @returns {string}
 */
const resolvePath = (fromPath, importPath) => {
    if (isRelative(importPath)) {
        return fs.realpathSync(
            require.resolve(
                path.resolve(fromPath, importPath)
            )
        );
    }

    return require.resolve(importPath);
};

module.exports = {
    isAncestor,
    isDirectory,
    isIndex,
    isPackage,
    isRelative,
    isSibling,
    resolvePath,
};