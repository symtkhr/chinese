<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta http-equiv="Content-Style-Type" content="text/css" />
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wordcard</title>
<script type="text/javascript" src="../../jquery-1.2.6.js"></script>
<script type="text/javascript" src="jZhong_v12.js"></script>
<script type="text/javascript" src="qs_list.php<? if(isset($_GET["user"])) echo "?user=".$_GET["user"]; ?>"></script>
<script type="text/javascript" src="pn_list.js"></script>
<style type="text/css">
div.vowel {
   clear: both;
   float: left;
   background-color: #dddddd;
  font-size: 180%;
}
div.consonant {
   float: left;
   background-color: #ffbbbb;
  font-size: 180%;
}
div.pitch {
   float: left;
   background-color: #ffffbb;
  font-size: 180%;
}
#start {
  font-size: 180%;
}
input[type="radio"] {
  font-size:x-large;
} 
</style>

<body>
<h2>WordCard</h2>
<div id="game">
<div style="background:#cccccc; padding:10px;">
<div id="command">
</div>
<div id="inputform">
<div id="quiz"></div>
<div id="opt"></div>
<div id="submit_button" style="clear:both;">
<form method="post" name="start" onsubmit="state_machine(); return false;">
<input type="button" id="start" name="st_button" value="Proceed">
</form>
</div>
<div id="result">(Now loading)</div>
</div>
<hr>
<div style="text-align:right" id="back">
<a href="#" id="fin">終</a>
</div>
<hr>
</body>
