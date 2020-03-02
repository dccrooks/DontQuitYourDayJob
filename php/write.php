<?php

$path = $_POST["path"];
$txt = $_POST["txt"];

if (!file_exists($path)) {
    mkdir($path, 0777, true);
}

$fh = fopen($path . DIRECTORY_SEPARATOR . "data.csv", "w");
fwrite($fh, $txt);
fclose($fh);

?>