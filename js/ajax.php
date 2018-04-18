<?php
	// $file = 'emails.txt';
	// $email = $_POST['email'];
	// file_put_contents($file, $email.PHP_EOL, FILE_APPEND | LOCK_EX) or die("Put contents failed");

	$file = fopen("emails.txt", "a") or die("Unable to open file!");
	$email = $_POST['email'];
	fwrite($file, $email."\n") or die("Write failed");
	fclose($file);
?>