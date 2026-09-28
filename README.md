# COLORS (LAMP Stack)

The small web-app we created in the COP 4331C LAMP lab is called COLORS. Once logged in, a user may be able to view the colors which they have saved in their profile and can add new colors to their profile. Each user will only see their own colors.

It's intentionally simple. The idea behind the app is that it should demonstrate each layer of a LAMP stack, HTML/CSS/JS in the browser, PHP endpoints that communicate with JSON in and out, and MySQL storing the data behind all of those.The concept behind the app is that it should show all these layers of the LAMP stack on one and the same Linux server running Apache, with PHP endpoints that accept/return JSON, and a MySQL database beneath it.

## Technologies used

Download the LAMP marketplace image (Ubuntu droplet on DigitalOcean).
Using the Apache web server
MySQL for the Users table and the Colors table
For PHP, use mysqli with prepared statements.
On the front end, it's HTML, CSS, and vanilla JavaScript, with `XMLHttpRequest` calling the API.
[JavaScript-MD5](https://github.com/blueimp/JavaScript-MD5) (MIT) — located in public/js/md5.js.

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

When user clicks on login, it sends the user to Login.php, which contains user's login name and password. When there is a matching user, the id and name of that user are returned.
2. `code.js` places the user's id and name in a cookie that has a 20 minute expiration set and redirects to `color.html`.
3. On loading, 3 loads a cookie into a file called color.html. If there's no valid user id it sends you back to the login page.
Search and Add use the user id as part of the request and therefore it only reads or writes a user's rows.
5. Log Out will remove the cookie and go back to the index.html.

## Setup

You need a Linux server with the Apache, PHP and MySQL software installed, along with the "mysqli" extension for PHP. The lab utilised the DigitalOcean LAMP droplet that already has the three preinstalled. The same is true about any Ubuntu machine that has apache2, php, php-mysql and mysql-server installed.

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

The `UserID` in the `Colors` table will need to match the newly added user row's ID (which is '1' on a new table).

### 2. Deploy the files

The front end assumes that the API resides in an LAMPAPI folder with the HTML pages. On the server from the repo root:

```bash
sudo cp -r public/* /var/www/html/
sudo mkdir -p /var/www/html/LAMPAPI
sudo cp api/*.php /var/www/html/LAMPAPI/
```

Other options: You can use FileZilla or PSFTP to upload the same files. Note that the names and capitalization are important as they are used in the Linux path and case is important.

### 3. Set up and connect to the database

This repo does not contain the "real" credentials. On the server, copy the template and fill in the MySQL user you created in step 1:

```bash
cd /var/www/html/LAMPAPI
sudo cp config.example.php config.php
sudo nano config.php
```

If you are developing a clone, it includes a .gitignore file and won't commit `config.php`.

The app provides access to game options.The app offers access to game options.

There's no additional file to start since Apache already serves up /var/www/html. Access a Web browser to open http://`<your-domain-or-server-ip>/` in a browser and use part of a color name (e.g., blue) or a new color name for a search, logging in with the user you inserted.

You should test the API directly by sending a post, with a body of the form of json, and Content-Type application/json, all of which are supported and can be done in Postman, ARC and CURL (all are examples):

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


All end points return 200. Use the `error` field (or `id` equal to 0 for login) to indicate whether the call was successful or not.

## Assumptions and limitations

This is a Lab demo, not a production App. It is a plain HTTP based application, thus username and passwords are not encrypted during transfer. It should be deployed with HTTPS (Let's Encrypt/certbot is capable of it on the droplet).
Plain text storage and comparison of passwords. Where they were showing storing MD5 hashes and hashing on the client with `md5.js` is still weaker than server-side hashing with the `password_hash()` function, so that would be the first thing to change.
This session is simply a cookie containing the user id and the API assumes that what the browser returns is the user id. Readers can change or add colors to the cookie and to the request; anyone editing the request can do the same to the cookie as well. Server side sessions would take care of that.
The input to `SearchColors` and `AddColor` is not validated beyond that which is specified in the prepared statements. Unrecognized colors and duplicates are allowed.
API responses are constructed using string concatentation; therefore a colour name that includes an apostrophe will return a bad JSON. This could be corrected by changing to `json_encode()`.
The front end is hardcoded to look for the API folder to be named LAMPAPI and to be located in the same web root as the web pages.
The `Password` column is declared as `VARCHAR(50)`, it will contain plain text passwords and 32 character MD5 hashes, but not bcrypt hashes. It would have to expand if hashing was performed on the server.

## License

MIT. See [LICENSE.md](LICENSE.md).
