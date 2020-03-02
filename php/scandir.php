<?php

$path = $_GET["path"];
$order = $_GET["order"];
$dirs = scandir($path, $order);
$dirs = array_diff($dirs, array(".", ".."));

foreach ($dirs as $dir) {
    echo $dir;
    echo ",";
}

?>