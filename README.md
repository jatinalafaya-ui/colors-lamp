# COLORS (LAMP Stack)

COLORS is an individual COP4331C lab project built with PHP, MySQL, HTML, CSS, and JavaScript. The application supports login, adding colors, searching saved colors by partial name, and logout.

## Technologies

Apache serves the browser files and PHP endpoints. The PHP API uses mysqli prepared statements to access the MySQL database. The browser sends JSON requests through XMLHttpRequest. Node.js 22 runs development tools only; it is not an application server.

The repository includes the MIT-licensed [JavaScript-MD5 library](https://github.com/blueimp/JavaScript-MD5) in `public/js/md5.js`. The login page loads this library, but the login handler does not call it.

## Repository layout

| Path | Contents |
|---|---|
| `api/` | Login, add-color, and search endpoints; database configuration example |
| `database/schema.sql` | COP4331 database and Users/Colors table definitions |
| `public/index.html` | Login page |
| `public/color.html` | Color search and add page |
| `public/css/styles.css` | Application styles |
| `public/js/code.js` | Login, cookies, logout, and API requests |
| `public/js/md5.js` | Third-party MD5 library |
| `docs/uml/` | Use case, activity, and class diagram sources and renders |
| `.github/workflows/lint.yml` | Automated HTML, CSS, and JavaScript lint checks |
| `.htmlhintrc` | HTMLHint rules |
| `.stylelintrc.json` | Stylelint rules |
| `eslint.config.cjs` | ESLint rules |
| `package.json` | Development dependencies and lint commands |
| `package-lock.json` | Locked development dependency versions |

## Application behavior

`Login.php` checks the submitted login and password against the Users table. A matching row returns the user ID, first name, and last name. The browser stores these values in a cookie with a 20-minute expiration and opens `color.html`.

The color page reads the cookie and redirects to the login page when the user ID is missing. Search requests return names containing the submitted search text for the supplied user ID. Add requests insert a color associated with that ID. Logout expires the cookie and returns to `index.html`.

## Deployment

The application requires a Linux server running Apache, PHP with mysqli, and MySQL. The deployment directory is `/var/www/html`. Database administration requires an existing MySQL administrator account.

From the repository root, load the schema:

```sh
mysql -u root -p < database/schema.sql
```

Provision an application database account with access to COP4331 and at least one Users record through the server's database administration interface. The application has no registration page. Database credentials and login passwords are server-managed values and are not stored in this repository.

Copy the application files into the Apache document root:

```sh
sudo cp -r public/* /var/www/html/
sudo mkdir -p /var/www/html/LAMPAPI
sudo cp api/*.php /var/www/html/LAMPAPI/
cd /var/www/html/LAMPAPI
sudo cp config.example.php config.php
sudo nano config.php
```

The deployed `config.php` defines `DB_HOST`, `DB_USER`, `DB_PASS`, and `DB_NAME` using the server's database account settings. `DB_NAME` is `COP4331`. The repository excludes `api/config.php` through `.gitignore`.

Apache serves `index.html` at the configured site's root. The PHP endpoints must be accessible under `LAMPAPI/` at that same root. Linux filenames and paths are case-sensitive.

## API

All three endpoints accept POST requests with `Content-Type: application/json`. Request fields are listed with their types below.

| Endpoint | Request fields | Successful response | Handled error response |
|---|---|---|---|
| `LAMPAPI/Login.php` | `login`: string; `password`: string | Numeric `id`, string `firstName`, string `lastName`, and empty `error` | `id` is 0, names are empty, and `error` contains the message |
| `LAMPAPI/SearchColors.php` | `search`: string; `userId`: integer | `results` contains matching color names; `error` is empty | `results` is empty; `error` contains the message |
| `LAMPAPI/AddColor.php` | `color`: string; `userId`: integer | `error` is empty | `error` contains the database connection message |

The endpoints communicate handled failures through response fields rather than explicitly setting HTTP error status codes. Login with unmatched credentials and searches with no matches return `No Records Found` in the `error` field.

## Automated linting

From the repository root, install the locked development dependencies and run all checks:

```sh
npm ci
npm run lint
```

| Command | Coverage |
|---|---|
| `npm run lint:html` | Every `public/**/*.html` file, using HTMLHint |
| `npm run lint:css` | Every `public/**/*.css` file, using Stylelint |
| `npm run lint:js` | Every `public/**/*.js` file, including the MD5 library, using ESLint |

Stylelint extends the standard configuration. Its ID naming rule accepts the application's existing camelCase and hyphenated IDs. ESLint applies the recommended rules and browser globals. Application JavaScript also requires strict equality, block-scoped declarations, and `const` for bindings that are not reassigned. The exported-function comment identifies the handlers called by the HTML pages. The MD5 library retains its upstream directives and CommonJS/AMD compatibility.

The `Lint` workflow runs on every push and pull request. Its matrix creates separate HTML, CSS, and JavaScript jobs, each using Node.js 22 and `npm ci`. A failure in one job does not cancel the other checks. All three jobs must pass. ESLint and Stylelint treat warnings as failures. Lint results appear in the Actions logs; the workflow does not create or upload lint reports.

The workflow also supports manual dispatch after it is present on the default branch.

## Current limitations

The lab implementation stores and compares passwords as plain text. Transport encryption depends on the Apache deployment. The session cookie contains client-controlled identity values, and the API trusts the submitted user ID without server-side session authorization.

Color names and duplicates are not validated beyond the prepared statements. API responses are assembled through string concatenation, so double quotes, backslashes, and control characters in returned data can produce invalid JSON. The Password column is `VARCHAR(50)`. The add-color handler reports success after sending the request successfully without inspecting the API error field.

## License

MIT. See [LICENSE.md](LICENSE.md).
