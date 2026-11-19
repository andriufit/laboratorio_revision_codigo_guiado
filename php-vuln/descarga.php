<?php
$archivo = $_GET['archivo'] ?? 'docs/nota.txt';
$fichero = __DIR__ . '/' . $archivo;
header('Content-Type: text/plain; charset=utf-8');
readfile($fichero);
