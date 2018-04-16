<?php
 
 
//if (isset($_POST['downloadtype'])) { // if page is not submitted to itself echo the form

	//echo $_POST['downloadtype'];
//    $remoteURL = "http://teamcity.labkey.org:8080/app/rest/buildTypes/id:" . $_POST['downloadtype'] . "/builds?status=SUCCESS&count=1&guest=1";
error_reporting(E_ALL);

    $remoteURL = "http://teamcity.labkey.org:8080/app/rest/buildTypes/id:bt36/builds?status=SUCCESS&count=1&guest=1";
	echo "hello\n";
	readfile("$remoteURL");
	$teamCityInfoString = file_get_contents("$remoteURL");
	
	if ($teamCityInfoString === false) { echo "shit\n"; } else { echo "all good\n"; }

	
	echo $teamCityInfoString;
	exit;
	 
	preg_match("/build id=\"(\d+)\"/", $teamCityInfoString, $matches);
	$buildId = $matches[1];
	$versionURL = "http://teamcity.labkey.org:8080/repository/download/" . $_POST['downloadtype'] . "/" . $buildId . ":id/VERSION&guest=1";
	$versionString = file_get_contents($versionURL);
	$versionString = preg_replace('/\./', '_', $versionString);
	$artifactURL = "http://teamcity.labkey.org:8080/viewLog.html?buildId=". $buildId ."&tab=artifacts&buildTypeId=". $_POST['downloadtype'] . "&guest=1";
	$artifactString = file_get_contents($artifactURL);
	$matchString = '/<a href=\'repository\/download\/' . $_POST['downloadtype'] . '\/' . $buildId . ':id\/(.*?)\'>/';
	preg_match($matchString,$artifactString, $matches);
	$downloadFile = $matches[1];
		
	$downloadURL = "http://teamcity.labkey.org:8080/guestAuth/repository/download/" . $_POST['downloadtype'] . "/" .  $buildId . ":id/" . $downloadFile ;
	
	
	http://teamcity.labkey.org:8080/repository/download/bt81/29928:id/pwiz-src-without-v-2_1_2636.tar.bz2
	
    $mm_type="application/x-bzip2"; 

	header("Pragma: public");
	header("Expires: 0");
	header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
	header("Cache-Control: public");
	header("Content-Description: File Transfer");
	header("Content-Type: " . $mm_type);
#	header("Content-Length: " .(string)($fs[1]) );  //for whatever reason I can't the size...
	header('Content-Disposition: attachment; filename="'.basename($downloadURL).'"');
	header("Content-Transfer-Encoding: binary\n");
	readfile($downloadURL); // outputs the content of the file
	exit;
//}
//else {
//	print 'Please go <a href="downloads.shtml">HERE</a> to download ProteoWizard' ;
//}

?>
