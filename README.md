# COLORS (LAMP Stack)

COLORS is a small web app built in the COP 4331C LAMP lab. A user logs in, then can search the colors saved under their account and add new ones. Each user only sees their own colors.

It's intentionally simple. The point of the app is to show every layer of a LAMP stack working together: HTML/CSS/JS in the browser, PHP endpoints that take and return JSON, and a MySQL database behind them, all on one Linux server running Apache.

## Technologies used

- **Linux** (Ubuntu droplet on DigitalOcean, from the LAMP marketplace image)
- **Apache** as the web server
- **MySQL** for the `Users` and `Colors` tables
- **PHP** (mysqli with prepared statements) for the API
- **HTML, CSS, and vanilla JavaScript** on the front end, using `XMLHttpRequest` to call the API
- [JavaScript-MD5](https://github.com/blueimp/JavaScript-MD5) (MIT) in `public/js/md5.js`

## Repository layout

```
colors-lamp/
├── api/
│   ├── AddColor.php          adds a color for a user
│   ├── Login.php             checks login/password, returns the user's id and name
│   ├── SearchColors.php      partial-match search on the user's colors
│   └── config.example.php    template for database credentials
├── database/
│   └── schema.sql            creates the COP4331 database and both tables
├── public/
│   ├── index.html            login page
│   ├── color.html            search/add page (requires login)
│   ├── css/styles.css
│   └── js/
│       ├── code.js           login, cookie handling, API calls
│       └── md5.js
├── .gitignore
├── LICENSE.md
└── README.md
```

## How it works

1. `index.html` sends the login and password to `Login.php`. If a matching user exists, the API returns their id and name.
2. `code.js` saves the user's id and name in a cookie that expires after 20 minutes, then redirects to `color.html`.
3. `color.html` reads the cookie on load. If there's no valid user id it sends you back to the login page.
4. Search and Add send the user id along with the request, so the API only reads or writes that user's rows.
5. Log Out clears the cookie and returns to `index.html`.

## Setup

You need a Linux server with Apache, PHP (with the mysqli extension), and MySQL. The DigitalOcean LAMP droplet has all three preinstalled, which is what the lab used. Any Ubuntu machine with `apache2`, `php`, `php-mysql`, and `mysql-server` installed works the same way.

### 1. Create the database

SSH into the server and load the schema:

```bash
mysql -u root -p < database/schema.sql
```

Then create a MySQL user for the app and give it access to the database. Pick your own username and password here:

```sql
CREATE USER 'colors_app'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON COP4331.* TO 'colors_app'@'localhost';
```

Add at least one login so you have something to sign in with, plus a few colors for that user:

```sql
USE COP4331;
INSERT INTO Users (FirstName, LastName, Login, Password) VALUES ('Test', 'User', 'testuser', 'pick-a-password');
INSERT INTO Colors (Name, UserID) VALUES ('Blue', 1), ('Light Blue', 1), ('Red', 1);
```

The `UserID` in `Colors` has to match the `ID` of the user row you just created (it's `1` on a fresh table).

### 2. Deploy the files

The front end expects the API to live in a folder called `LAMPAPI` next to the HTML pages. From the repo root on the server:

```bash
sudo cp -r public/* /var/www/html/
sudo mkdir -p /var/www/html/LAMPAPI
sudo cp api/*.php /var/www/html/LAMPAPI/
```

You can also upload the same files with FileZilla or PSFTP. Keep the names and capitalization exactly as they are, since Linux paths are case sensitive.

### 3. Configure the database connection

The real credentials are not in this repo. On the server, copy the template and fill in the MySQL user from step 1:

```bash
cd /var/www/html/LAMPAPI
sudo cp config.example.php config.php
sudo nano config.php
```

`config.php` is in `.gitignore`, so it won't be committed if you work out of a clone.

## Running and accessing the app

Apache is already serving `/var/www/html`, so there's nothing extra to start. Open `http://<your-domain-or-server-ip>/` in a browser, log in with the user you inserted, and try searching for part of a color name (for example `blue`) or adding a new one.

To test the API directly, send a `POST` with a JSON body and `Content-Type: application/json` (Postman, ARC, or curl all work):

```bash
curl -X POST http://<your-domain>/LAMPAPI/Login.php \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser","password":"pick-a-password"}'
```

| Endpoint | Request body | Success response | Failure response |
|---|---|---|---|
| `LAMPAPI/Login.php` | `{"login", "password"}` | `{"id":1,"firstName":"Test","lastName":"User","error":""}` | `{"id":0,"firstName":"","lastName":"","error":"No Records Found"}` |
| `LAMPAPI/SearchColors.php` | `{"search", "userId"}` | `{"results":["Blue","Light Blue"],"error":""}` | `{"results":[],"error":"No Records Found"}` |
| `LAMPAPI/AddColor.php` | `{"color", "userId"}` | `{"error":""}` | `{"error":"<MySQL error>"}` if the connection fails |

Every endpoint returns HTTP 200. Check the `error` field (or `id` of 0 for login) to tell whether the call worked.

## Assumptions and limitations

- This is a lab demo, not a production app. It runs over plain HTTP, so the login and password are sent unencrypted. A real deployment should put it behind HTTPS (Let's Encrypt/certbot works on the droplet).
- Passwords are stored and compared as plain text. The lab also showed storing MD5 hashes and hashing on the client with `md5.js`; that's still weaker than server-side hashing with `password_hash()` and would be the first thing to change.
- The session is just a cookie holding the user id, and the API trusts whatever `userId` the browser sends. Anyone who edits the cookie or the request can read or add colors for another user. Server-side sessions would fix that.
- `SearchColors` and `AddColor` don't validate input beyond what the prepared statements provide. Empty color names and duplicates are accepted.
- API responses are built by string concatenation, so a color name containing a double quote would produce invalid JSON. Switching to `json_encode()` would fix it.
- The front end assumes the API folder is named `LAMPAPI` and sits in the same web root as the pages.
- The `Password` column is `VARCHAR(50)`, which fits plain text and 32-character MD5 hashes but not bcrypt hashes. It would need to grow if hashing moved server side.

## License

MIT. See [LICENSE.md](LICENSE.md).
