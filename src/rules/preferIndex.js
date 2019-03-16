const path = require('path');

const { resolvePath } = require('../helpers/pathHelper.js');

module.exports = {
    meta: {
        fixable: 'code',
        messages: {
            preferIndexMessage: 'Import from "{{ importDirectory }}" instead of "{{ importPath }}".',
        },
        type: 'suggestion',
    },
    create(context) {
        // Get path to current file and respective directory
        const filename = context.getFilename();
        const dirname = path.dirname(filename);

        return {
            ImportDeclaration(node) {
                // Get relative and absolute path to imported module
                const importPath = node.source.value;
                const absolutePath = resolvePath(dirname, importPath);

                // If the resolved path is absolute, does not correspond to the current directory and does not correspond to an index file,
                // then it means the imported module is a file in a different directory.
                // In case there is an index file in that directory then this module should be imported from the index instead.
                if (path.isAbsolute(absolutePath) && dirname !== path.dirname(absolutePath) && !/index(\.\w+)?$/.test(absolutePath)) {
                    const importDirectory = path.dirname(importPath);

                    try {
                        // Try to resolve an import from the directory instead, if it fails it means there is no index file.
                        resolvePath(dirname, importDirectory);

                        context.report({
                            data: {
                                importDirectory,
                                importPath
                            },
                            fix(fixer) {
                                return fixer.replaceText(node.source, importDirectory);
                            },
                            messageId: 'preferIndexMessage',
                            node,
                        });


                    } catch(error) {}
                }
            },
        };
    },
};
