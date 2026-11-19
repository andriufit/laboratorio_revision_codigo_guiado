<?php
include 'db.php';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = $_POST['email'];
    $password = $_POST['password'];
    $sql = "SELECT id, email, nombre FROM usuarios WHERE email = '$email' AND password = '$password'";
    $res = mysqli_query($conn, $sql);
    if ($res && $fila = mysqli_fetch_assoc($res)) {
        echo '<h2>Bienvenido, ' . htmlspecialchars($fila['nombre']) . '</h2>';
        echo '<p>Ya puedes cerrar esta pestaña.</p>';
        exit;
    }
    $error = 'Credenciales incorrectas';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Acceso — Panel ciber</title>
</head>
<body>
  <h2>Acceso al panel (demo de clase)</h2>
  <?php if ($error) { echo '<p style="color:red">' . $error . '</p>'; } ?>
  <form method="post" action="login.php">
    Email:   <input type="text" name="email"><br><br>
    Clave:   <input type="password" name="password"><br><br>
    <button type="submit">Entrar</button>
  </form>
  <p>Usuario de prueba: ana@demo.es / 123456</p>
</body>
</html>
