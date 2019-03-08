'use strict';

const RuleTester = require('eslint/lib/testers/rule-tester');

const { BUILTIN_IMPORT, EXTERNAL_IMPORT, INTERNAL_IMPORT, PARENT_IMPORT, SIBLING_IMPORT, INDEX_IMPORT } = require('../../src/constants/IMPORT_TYPES');
const rule = require('../../src/rules/order-by-path');

const ascendingOrder = [
    BUILTIN_IMPORT,
    EXTERNAL_IMPORT,
    INTERNAL_IMPORT,
    PARENT_IMPORT,
    SIBLING_IMPORT,
    INDEX_IMPORT,
];

const descendingOrder = [...ascendingOrder].reverse();

const ruleTester = new RuleTester({
    parserOptions: {
        sourceType: 'module',
    },
});

ruleTester.run('order-by-path', rule, {
    invalid: [
        {
            code: `
                import bb from '../b';
                import aa from '../a';
                import cc from '../c';
                import c from './c';
                import a from './a';
                import index from '.';
                import b from './b';
            `.replace(/\n\s*/g, '\n').trim(),
            errors: [
                {
                    column: 1,
                    line: 2,
                    messageId: 'wrongOrderMessage',
                },
                {
                    column: 1,
                    line: 5,
                    messageId: 'wrongOrderMessage',
                },
                {
                    column: 1,
                    line: 7,
                    messageId: 'wrongOrderMessage',
                },
            ],
            filename: './tests/mocks/parent/child/index.js',
            options: [{
                groups: ascendingOrder,
            }],
        },
        {
            code: `
                import a from './a';
                import index from '.';
                import b from './b';
                import aa from '../a';
                import c from './c';
                import cc from '../c';
                import bb from '../b';
            `.replace(/\n\s*/g, '\n').trim(),
            errors: [
                {
                    column: 1,
                    line: 2,
                    messageId: 'wrongOrderMessage',
                },
                {
                    column: 1,
                    line: 5,
                    messageId: 'wrongOrderMessage',
                },
                {
                    column: 1,
                    line: 7,
                    messageId: 'wrongOrderMessage',
                },
            ],
            filename: './tests/mocks/parent/child/index.js',
            options: [{
                groups: descendingOrder,
            }],
        },
    ],
    valid: [
        {
            code: `
                import path from 'path';
                import eslint from 'eslint';
                import aa from '../a';
                import bb from '../b';
                import cc from '../c';
                import a from './a';
                import b from './b';
                import c from './c';
                import index from '.';
            `,
            filename: './tests/mocks/parent/child/index.js',
            options: [{
                groups: ascendingOrder,
            }],
        },
        {
            code: `
                import index from '.';
                import a from './a';
                import b from './b';
                import c from './c';
                import aa from '../a';
                import bb from '../b';
                import cc from '../c';
            `,
            filename: './tests/mocks/parent/child/index.js',
            options: [{
                groups: descendingOrder,
            }],
        },
    ],
});
