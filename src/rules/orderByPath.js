const fs = require('fs');
const path = require('path');

const {
    BUILTIN_IMPORT,
    EXTERNAL_IMPORT,
    INTERNAL_IMPORT,
    PARENT_IMPORT,
    SIBLING_IMPORT,
    INDEX_IMPORT,
} = require('../constants/IMPORT_TYPES.js');
const {
    isAncestor,
    isIndex,
    isPackage,
    isRelative,
    isSibling,
} = require('../helpers/pathHelper.js');

/**
 * Metadata that identifies an import declaration.
 * @typedef {{absolutePath:string, importPath:string, importRank:number, node:ESTree.ImportDeclaration}} ImportMetadata
 */

/**
 * Default configuration for the groups option.
 * @type {string[]}
 */
const defaultGroups = [
    BUILTIN_IMPORT,
    EXTERNAL_IMPORT,
    INTERNAL_IMPORT,
    PARENT_IMPORT,
    SIBLING_IMPORT,
    INDEX_IMPORT,
];

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

/**
 * Rank the given import based on its path.
 *
 * An import can refer to a builtin module (part of node), an external module (node_modules),
 * an internal module (node_modules but defined locally), a parent module (relative path starting with ../),
 * a sibling module (relative path starting with ./) or an index module (relative path to .).
 *
 * Imports are ranked based on the order each one of those types are specified in the given list of groups.
 *
 * @param {string[]} groups
 * @param {ImportMetadata} importMetadata
 * @returns {number}
 */
const rankImport = (groups, { absolutePath, importPath }) => {
    return groups.findIndex((importType) => {
        switch (importType) {
            case BUILTIN_IMPORT:
                return absolutePath === importPath;

            case EXTERNAL_IMPORT:
                return path.isAbsolute(absolutePath)
                    && isPackage(importPath)
                    && absolutePath.includes('node_modules');

            case INTERNAL_IMPORT:
                return path.isAbsolute(absolutePath)
                    && isPackage(importPath)
                    && !absolutePath.includes('node_modules');

            case PARENT_IMPORT:
                return path.isAbsolute(absolutePath)
                    && isAncestor(importPath);

            case SIBLING_IMPORT:
                return path.isAbsolute(absolutePath)
                    && isSibling(importPath)
                    && !isIndex(importPath);

            case INDEX_IMPORT:
                return path.isAbsolute(absolutePath)
                    && isIndex(importPath);
        }
    });
};

/**
 * Adds the given import node to the given list of import nodes
 * together with its absolute path and rank.
 * @param {ImportMetadata[]} list
 * @param {ESTree.ImportDeclaration} node
 * @param {string} fromPath
 * @param {string[]} groups
 */
const registerNode = (list, node, fromPath, groups) => {
    const importPath = node.source.value;
    const absolutePath = resolvePath(fromPath, importPath);
    const importRank = rankImport(groups, { absolutePath, importPath });

    list.push({
        absolutePath,
        importPath,
        importRank,
        node,
    });
};

/**
 * Iterates through the given list and reports the imports that are out of order.
 *
 * An import is considered out of order if its rank is smaller than the ranking of the previous import
 * or if its path is smaller than the path of the previous import.
 *
 * @param {Rule.RuleContext} context
 * @param {ImportMetadata[]} list
 */
const findOutOfOrder = (context, list) => {
    let prevImportPath = '';
    let prevImportRank = 0;

    for (const { node, importPath, importRank } of list) {
        if (prevImportPath && (
            importRank < prevImportRank
            || (importRank === prevImportRank && importPath < prevImportPath)
        )) {
            context.report({
                data: {
                    prevImportPath,
                    importPath,
                },
                messageId: 'wrongOrderMessage',
                node,
            });
        }

        prevImportRank = importRank;
        prevImportPath = importPath;
    }
};


module.exports = {
    meta: {
        messages: {
            wrongOrderMessage: 'The import of "{{importPath}}" should come before "{{prevImportPath}}"',
        },
        schema: [
            {
                properties: {
                    groups: {
                        items: {
                            enum: [
                                BUILTIN_IMPORT,
                                EXTERNAL_IMPORT,
                                INTERNAL_IMPORT,
                                PARENT_IMPORT,
                                SIBLING_IMPORT,
                                INDEX_IMPORT,
                            ],
                        },
                        type: 'array',
                    },
                },
                type: 'object',
            },
        ],
        type: 'suggestion',
    },
    create(context) {
        const filename = context.getFilename();
        const dirname = path.dirname(filename);

        const { groups = defaultGroups } = context.options[0];

        /** @type {ImportMetadata[]} */
        const imports = [];

        return {
            ImportDeclaration(node) {
                registerNode(imports, node, dirname, groups);
            },
            ['Program:exit']() {
                findOutOfOrder(context, imports);
            },
        };
    },
};
