# Covoiturini

Tunisia-focused carpooling application built with HTML5, CSS3, vanilla JavaScript, PHP/PDO, and MySQL.

## XAMPP setup

1. Install and start **Apache** and **MySQL** in XAMPP.
2. Copy this folder to:
   `C:\xampp\htdocs\covoiturini`
3. Open phpMyAdmin at `http://localhost/phpmyadmin`.
4. Import [`sql/covoiturini.sql`](sql/covoiturini.sql).
5. Open:
   `http://localhost/covoiturini/index.html`

The default database connection is:

- Host: `127.0.0.1`
- Database: `covoiturini`
- User: `root`
- Password: empty

To override it, set `COVOITURINI_DB_HOST`, `COVOITURINI_DB_NAME`, `COVOITURINI_DB_USER`, and `COVOITURINI_DB_PASSWORD` in the PHP/Apache environment.

## Demo account

The SQL seed creates demo users. Their password is:

`password`

## Test scenarios

1. Register a new account from `register.html`.
2. Log in using the new account or a seeded demo account.
3. Publish a ride using Tunisian cities and a future date.
4. Confirm the new ride appears in the profile.
5. Search for a route such as `Manouba` to `Ariana`.
6. Open a result to view its live ride details.
7. Toggle light/dark mode and FR/AR/EN language modes.
8. Delete a ride from your profile with the confirmation dialog.
9. Verify dark mode, RTL Arabic mode, and mobile navigation.

## Deployment guide

1. Export `sql/covoiturini.sql` or upload it through your hosting phpMyAdmin.
2. Upload the complete project folder via FTP/SFTP to the PHP web root.
3. Create the database and a restricted database account; do not use `root` on public hosting.
4. Set the four `COVOITURINI_DB_*` environment variables if your PHP host supports them. Otherwise update `php/db.php` only for your deployment credentials.
5. Enable HTTPS and force redirects to HTTPS.
6. Public Leaflet, Nominatim, and OSRM services are suitable for demos and light use. Respect their usage policies.

## API endpoints

All PHP endpoints return JSON. Mutating requests use the session CSRF token from `php/csrf.php`.

- `csrf.php`
- `register.php`
- `login.php`
- `logout.php`
- `profile.php`
- `add_ride.php`
- `get_rides.php`
- `get_ride.php`
- `search_rides.php`
- `delete_ride.php`
