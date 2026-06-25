<?php
/* =============================================
   SMPM — Config: Database Connection
   Support local (Laragon) & Railway (env vars)
   ============================================= */

// Railway inject env vars: MYSQLHOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
// Fallback ke nilai lokal (Laragon) jika tidak ada env
define('DB_HOST',    getenv('MYSQLHOST')     ?: getenv('MYSQL_HOST')     ?: 'localhost');
define('DB_PORT',    getenv('MYSQLPORT')     ?: getenv('MYSQL_PORT')     ?: '3306');
define('DB_NAME',    getenv('MYSQLDATABASE') ?: getenv('MYSQL_DATABASE') ?: 'SMPM');
define('DB_USER',    getenv('MYSQLUSER')     ?: getenv('MYSQL_USER')     ?: 'root');
define('DB_PASS',    getenv('MYSQLPASSWORD') ?: getenv('MYSQL_PASSWORD') ?: '');
define('DB_CHARSET', 'utf8mb4');

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            // Cek ekstensi PDO MySQL tersedia
            if (!extension_loaded('pdo')) {
                die('DB Error: Ekstensi PDO tidak tersedia.');
            }
            if (!extension_loaded('pdo_mysql')) {
                die('DB Error: Ekstensi pdo_mysql tidak tersedia. Aktifkan extension=pdo_mysql di php.ini.');
            }

            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
            );
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                $isDev = (getenv('APP_ENV') === 'development');
                if ($isDev) {
                    die('DB Error: ' . $e->getMessage());
                } else {
                    error_log('DB Connection failed: ' . $e->getMessage());
                    die('Koneksi database gagal. Coba lagi nanti.');
                }
            }
        }
        return self::$instance;
    }

    private function __clone() {}
    public function __wakeup() { throw new \Exception("Cannot unserialize singleton."); }
}
