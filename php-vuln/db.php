<?php
// Panel de acceso — demo para clase (vulnerabilidades DELIBERADAS)
$host = '127.0.0.1';
$usu  = 'root';
$pass = '';
$base = 'ciber';
$conn = mysqli_connect($host, $usu, $pass, $base);
if (!$conn) {
    die('Error de conexión con la base de datos');
}
mysqli_set_charset($conn, 'utf8mb4');
