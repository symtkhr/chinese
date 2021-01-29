<?php

$DIR = "./wc_sav_dat/";
$EXT = ".dat";

if(isset($_POST["user"])){
  $filename = $DIR . $_POST["user"] . $EXT;
  $result = Array();
  if(file_exists($filename)){
    $rs_list = explode(";", file_get_contents($filename));
    foreach($rs_list as $rs){
      $rd = explode(":", $rs);
      if($rd[0]==0) continue;
      $result[$rd[0]] = $rd[1];
    }
  }
  for($i=0; $i<4; $i++){
    $miss_list = explode(",", $_POST["miss".$i]);
    foreach($miss_list as $qid){
      if($qid==0) continue;
      $result[$qid] = substr($result[$qid] . $i, -8);
    }
  }
  ksort($result);
  $fp = fopen($filename, "w+");
  foreach($result as $qid=>$res){
    fputs($fp, $qid.":".$res.";");
  }
  fclose($fp);
  header("Location: ./wordcard.php?user=" . $_POST["user"]);
  exit;
}

if(isset($_GET["user"]) || true){
  $filename = $DIR . $_GET["user"] . $EXT;
  $filename = $DIR . "ankoroto" . $EXT;
  $result = Array();
  if(file_exists($filename)){
    $rs_list = explode(";", file_get_contents($filename));
    foreach($rs_list as $rs){
      $rd = explode(":", $rs);
      $result[$rd[0]] = $rd[1];
    }
  }
}

$rec_size = 0;
echo "var qs_list = new Array(\n";
foreach(explode("\n", file_get_contents("qs_list.dat")) as $i=>$qs){
  $qs_t = explode( "\t", trim($qs) );
  if(count($qs_t)!= 4) continue;
  if($i>0) echo ", \n";
  $qid = array_shift($qs_t);
  if(isset($result[$qid])) array_push($qs_t, $result[$qid]);
  echo '  [' . $qid . ', "' . implode('", "', $qs_t ) . '"]';
  $rec_size += strlen($result[$qid]);
}
echo "\n);\n";
echo "var num_score = ". $rec_size . ";\n";

?>