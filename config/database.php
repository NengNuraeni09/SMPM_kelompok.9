<?php
/* =============================================
   SMPM — Config: Database Connection
   Support local (Laragon) & Railway (env vars)
   ============================================= */

// Railway inject env vars dengan nama DB_HOST, DB_PORT, dll.
define('DB_HOST',    getenv('DB_HOST')       ?: getenv('MYSQLHOST')     ?: 'localhost');
define('DB_PORT',    getenv('DB_PORT')       ?: getenv('MYSQLPORT')     ?: '3306');
define('DB_NAME',    getenv('DB_DATABASE')   ?: getenv('MYSQLDATABASE') ?: 'SMPM');
define('DB_USER',    getenv('DB_USERNAME')   ?: getenv('MYSQLUSER')     ?: 'root');
define('DB_PASS',    getenv('DB_PASSWORD')   ?: getenv('MYSQLPASSWORD') ?: '');
define('DB_CHARSET', 'utf8mb4');

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
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
                error_log('DB Connection failed: ' . $e->getMessage());
                die('Koneksi database gagal: ' . $e->getMessage());
            }
        }
        return self::$instance;
    }

    private function __clone() {}
    public function __wakeup() { throw new \Exception("Cannot unserialize singleton."); }
}
