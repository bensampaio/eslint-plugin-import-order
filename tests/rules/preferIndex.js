'use strict';

const path = require('path');

const RuleTester = require('eslint/lib/testers/rule-tester');

const rule = require('../../src/rules/preferIndex.js');

const ruleTester = new RuleTester({
    parserOptions: {
        sourceType: 'module',
    },
});

ruleTester.run('prefer-index', rule, {
    invalid: [
        {
            code: 'import a from "./child/a.js"',
            errors: [
                {
                    column: 1,
                    line: 1,
                    messageId: 'preferIndexMessage',
                },
            ],
            filename: path.join(process.cwd(), 'tests', 'mocks', 'parent', 'a.js'),
        },
    ],
    valid: [
        {
            code: 'import { a } from "./child"',
            filename: path.join(process.cwd(), 'tests', 'mocks', 'parent', 'a.js'),
        },
        {
            code: 'import b from "./b.js"',
            filename: path.join(process.cwd(), 'tests', 'mocks', 'parent', 'a.js'),
        },
    ],
});
