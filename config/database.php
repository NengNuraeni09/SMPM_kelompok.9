<?php
/* =============================================
   SMPM — Config: Database Connection
   Support local (Laragon) & Railway (DATABASE_URL)
   ============================================= */

// Coba parse DATABASE_URL dulu (Railway inject ini)
$databaseUrl = getenv('DATABASE_URL');

if ($databaseUrl) {
    $parts = parse_url($databaseUrl);
    define('DB_HOST',    $parts['host']);
    define('DB_PORT',    $parts['port'] ?? 3306);
    define('DB_NAME',    ltrim($parts['path'], '/'));
    define('DB_USER',    $parts['user']);
    define('DB_PASS',    $parts['pass']);
} else {
    // Fallback lokal (Laragon)
    define('DB_HOST',    getenv('MYSQLHOST')     ?: 'localhost');
    define('DB_PORT',    getenv('MYSQLPORT')     ?: '3306');
    define('DB_NAME',    getenv('MYSQLDATABASE') ?: 'SMPM');
    define('DB_USER',    getenv('MYSQLUSER')     ?: 'root');
    define('DB_PASS',    getenv('MYSQLPASSWORD') ?: '');
}

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
                PDO::ATTR_TIMEOUT            => 10, // timeout koneksi 10 detik
            ];
            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                error_log('DB Connection failed: ' . $e->getMessage());
                // Kembalikan JSON agar frontend bisa handle dengan benar
                if (!headers_sent()) {
                    header('Content-Type: application/json; charset=utf-8');
                }
                http_response_code(503);
                echo json_encode(['ok' => false, 'message' => 'Database sedang tidak tersedia. Coba lagi dalam beberapa saat.']);
                exit;
            }
        }
        return self::$instance;
    }

    private function __clone() {}
    public function __wakeup() { throw new \Exception("Cannot unserialize singleton."); }
}
