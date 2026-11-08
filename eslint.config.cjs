const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        files: ["public/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "script",
            globals: globals.browser
        },
        rules: js.configs.recommended.rules
    },
    {
        files: ["public/js/code.js"],
        rules: {
            "eqeqeq": ["error", "always"],
            "prefer-const": "error",
            "no-var": "error"
        }
    },
    {
        files: ["public/js/md5.js"],
        linterOptions: { reportUnusedDisableDirectives: false },
        languageOptions: {
            globals: { module: "readonly" }
        }
    }
];
