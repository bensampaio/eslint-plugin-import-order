const fs = require('fs');
const path = require('path');

const { BUILTIN_IMPORT, EXTERNAL_IMPORT, INTERNAL_IMPORT, PARENT_IMPORT, SIBLING_IMPORT, INDEX_IMPORT } = require('../constants/IMPORT_TYPES');
const { isAncestor, isIndex, isPackage, isRelative, isSibling } = require('../helpers/pathHelper.js');

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
                    && isSibling(importPath);

            case INDEX_IMPORT:
                return path.isAbsolute(absolutePath)
                    && isIndex(importPath);
        }
    });
};


module.exports = {
    meta: {
        messages: {
            wrongOrderMessage: 'The import of "{{importPath}}" should come before "{{currentImportPath}}"',
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

        const {
            groups = [],
        } = context.options[0];

        const imports = [];

        return {
            ImportDeclaration(node) {
                const importPath = node.source.value;
                const absolutePath = resolvePath(dirname, importPath);
                const rank = rankImport(groups, { absolutePath, importPath });

                imports.push({
                    absolutePath,
                    importPath,
                    node,
                    rank,
                });
            },
            ['Program:exit']() {
                let currentImportPath = '';
                let currentRank = 0;

                for (const { node, importPath, rank } of imports) {
                    if (rank < currentRank) {
                        context.report({
                            data: {
                                currentImportPath,
                                importPath,
                            },
                            messageId: 'wrongOrderMessage',
                            node,
                        });
                    }

                    if (currentImportPath && rank === currentRank && importPath < currentImportPath) {
                        context.report({
                            data: {
                                currentImportPath,
                                importPath,
                            },
                            messageId: 'wrongOrderMessage',
                            node,
                        });
                    }

                    currentRank = rank;
                    currentImportPath = importPath;
                }
            },
        };
    },
};
