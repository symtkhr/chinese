// ver.1.2 since 2013/06/04

//////////////////////////////////////// main 
var conf_q = 10;
var cnt_q = 0;
var qstat = 0;
var nolimit = 0;
var flag_levelup = false;
var level;
var qs_list_subset = [];
var misspool = [];
var missrec  = [];
var failpool = [];
var stars = ["&#x2606;", "&#x2605;", "&#x203B;"];
var scores = [];
////////////////// 初期化
function init_config(num){
    var qslist = [];
    var loaders = [
        {
            file:"qs_list.dat",
            cb: (dic) => { qslist = dic.split("\n").map(line => line.split("\t")); },
        },
        {
            file: "./wc_sav_dat/" + getRequest() + ".dat",
            cb: text => {
                scores = text.split(";").filter(v=>v).map(score => score.split(":"));
                scores.forEach(d => {
                    var id = d[0];
                    if (!id) return;
                    var score = d[1];
                    var i = qslist.findIndex(q => q[0] == id);
                    qslist[i].push(score);
                });
            },
        }];

    var loadnext = () => {
        if (loaders.length == 0) return alldone();
        var g = loaders.shift();
        $.get(g.file)
            .done(x => { g.cb(x); loadnext(); })
            .fail(x => { console.log(g.file, "fail"); loadnext(); });
    };

    var alldone = () => {
        for(var i = 0; i < num && 0 < qslist.length; i++){
            var ord = parseInt(Math.random() * qslist.length);
            qs_list_subset.push(qslist[ord]);
            qslist.splice(ord, 1);
        }
        qslist = [];
        show_all_card();
    };

    loadnext();
}
////////////////// カード一覧
function show_all_card(){
  var card_all = [];
  var res = "";
  var num_exp = 0;
  var query_user = getRequest();
  //alert(qs_list_subset);
  for(var i=0; i<qs_list_subset.length; i++){
    var qs = qs_list_subset[i];
    res = "<li>" + qs[1] + " " + qs[2] + " ("+ qs[3] + ")" + "</li>";
    card_all.push( res );
    if( query_user && qs[4]=== undefined ) num_exp++;
  }
  res = "";
  if(query_user) res += 'Hi, '+ query_user + "! ";
  res += "Learn how to read the following " + conf_q + " words. ";
  if(query_user) res += scores.length + " of your scores have been saved."
  res += "<ul>" + card_all.sort().join("") + "</ul>";
  $("#result").html(res);
}

////////////////// 状態遷移
function state_machine(){
  if(qstat==0 || qstat==2){
    qstat = 1;
    question();
  } else if(qstat==1){
    qstat = 0;
    show_form();
  }
}
/////////////// 出題
function question(){
  $("h2").css( "display", "none" );
  $("#quiz").html("(Now loading)");
  var num_mis = 0;
  var qid = cnt_q;
  var phase = 0;
  
  if(cnt_q >= conf_q)
    phase = 2;
  else {
    var mislen = misspool.length;
    var percent =  mislen * mislen * cnt_q / (conf_q * 40);
    phase = (percent > Math.random() ) ? 1:0;
  }
  switch(phase){
  case 0:
    $("#quiz").html("");
    cnt_q++;
    break;
  case 1:
  case 2:
    if(phase==2 && misspool.length == 0){ go_fin(); return; }
    var rsub = parseInt(Math.random()*(misspool.length - 1));
    qid     = misspool[rsub][0];
    num_mis = misspool[rsub][1];
    misspool.splice(rsub,1);
    $("#quiz").html( stars[num_mis-1] );
    break;
  }
  var qs = qs_list_subset[qid];
  show_quiz(qid, qs[1], qs[2]);
  var res = '<span id="answer"></span> (<span id="jp"></span>)';
  res += '<span id="tf" style="color:blue; font-weight:bold; font-size:120%;">&#xd7;</span>';
  if(qs[4]) res+="<br>(Past exp: " + show_history(qs[4]) + ")";
  $("#result").html(res).css( "display", "none" );
  $("#answer").html(qs[2]);
  $("#jp").html(qs[3]);
  misspool.push([qid, num_mis]);
  $("input[type=radio]:first").focus();
}
//////////////// 履歴表示
function show_history(str){
  var res = "";
  for(var i =0; i<str.length; i++){
    var num = str.substr(i,1)-0;
    res += num>0 ? stars[num-1] : "&#x25EF;";
  }
  return res;
}

/////////////// 出題表示
function show_quiz(qid, hanji, pinyin){
  var ans = pinyin.split(" ");
  var opt = [];
  $("#opt").html("");
  $("#quiz").append( (qid+1) + ": " + hanji );
  var flag_redup = hanji.match(/^(.+)\1$/);
  
  for(var j=0; j<ans.length; j++){
    var opt = make_options(ans[j].replace(/[0-4]$/,""));
    dump_opt(opt, j);
    if(flag_redup){
      dump_opt(opt,true);
      break;
    }
  }
}

//////////////// リスト先頭文字取得
function find_key(pinyin){
  var st;
  if(pinyin.match(/^[awueo]/))
    st = "#";
  else if(pinyin.match(/^[csz]h/) )
    st = pinyin.substr(0,2);
  else
    st = pinyin.substr(0,1);
  if(pn_list[st]) return st;
  return false;
}

//////////////// 似た子音を返す
function get_sim_heads(head){
  var sim_heads = [head];
  for(var i=0; i<similarity_nest.length; i++){
    var sim_st = similarity_nest[i].split("-");
    var pos = $.inArray(head, sim_st);
    if(pos<0) continue;
    if(sim_st[pos-1]) sim_heads.push(sim_st[pos-1]);
    if(sim_st[pos+1]) sim_heads.push(sim_st[pos+1]);
  }
  return sim_heads;
}

//////////////// 選択肢作成
function make_options(pinyin){
  var head = find_key(pinyin);
  if(!head) return;
  var flag_diff = false; // ( Math.random() * 5 < 1 );
  var sim_heads = get_sim_heads(head);
/*
  if(flag_diff){
    var sim_heads = get_sim_heads(head);
    var simlen = sim_heads.length;
    if(simlen==0) flag_diff = false;
    var sim_head = sim_heads[parseInt( Math.random() * sim_heads.length )];
  }
*/
  while( sim_heads.length < 4 ){
    tmp = pn_heads[parseInt( Math.random() * pn_heads.length )];
    if( $.inArray(tmp, sim_heads) < 0 ) sim_heads.push(tmp);
  }
  while( sim_heads.length > 4){
    sim_heads.splice(parseInt(Math.random()*(sim_heads.length-1)+1),1);
  }
  //alert(sim_heads);
  
  // select one with the same head
  var opt = [(head==="#"?"#":"")+pinyin];
  var pn = pn_list[head];
  var samelen = flag_diff ? 2 : 4;
  while( opt.length < samelen ){
    var tmp = head + pn[parseInt( Math.random() * pn.length )];
    if($.inArray(tmp, opt)<0) opt.push(tmp);
  }
/*  
  if(flag_diff){
    //select one with the similar head & the same vowel
    var headlen = (head==="#") ? 0:head.length;
    pn = pn_list[sim_head];
    for(var i=0; i<2; i++){
      var vowel = opt[i].slice(head.length);
      if($.inArray(vowel, pn) >= 0 ) opt.push(sim_head + vowel);
    }
    
    //select one with the similar head & the different vowel
    sim_heads.push(head);
    while( opt.length < 4 ){
      sim_head = sim_heads[parseInt( Math.random() * sim_heads.length )];
      if(!sim_head) continue;
      pn = pn_list[sim_head];
      tmp = sim_head + pn[parseInt( Math.random() * pn.length )];
      if( $.inArray(tmp, opt) < 0 ) opt.push(tmp);
    }
  }
*/
  for(var i=0; i<4; i++)
    //if(opt[i].substr(0,1)==="#") 
    opt[i] = opt[i].substr(head.length);
  
  return sim_heads.sort().concat(opt.sort());
}

function show_radio(group, opt, nth){  
  var radio_id = group + "-" + nth;
  var html_opt = '<label for="' + radio_id + '">';
  html_opt += '<input type=radio name="' + group +'" value="' + opt + '" id="' + radio_id + '">';
  html_opt += opt + '</label><br>';
  return html_opt;
}

/////////////// 選択肢表示
function dump_opt(opt,qing){
  var html_opt = '';
  if(qing) html_opt += '<hr style="clear:both;">';
  html_opt += '<div class="vowel">';
  for(var i=0; i<4; i++) html_opt += show_radio("vowel" + qing, opt[i], i);
  html_opt += ("</div>");
  html_opt += '<div class="consonant">';
  for(var i=4; i<8; i++) html_opt += show_radio("consonant" + qing, opt[i], i);
  html_opt += ("</div>");
  html_opt += '<div class="pitch">';
  for(var i=1; i<=4; i++) html_opt += show_radio("pitch" + qing, i, i);
  if(qing) html_opt += show_radio("pitch" + qing, 0, 0);
  html_opt += "</div>";

  $("#opt").append(html_opt);
  $( 'input' ).click( function(){
    var name = $(this).attr("name");
    $('input[name=' + name + ']').parent('label').css( { color: "black", fontWeight:"normal" } );
    $(this).parent('label').css( { color: 'red', fontWeight:"bold" } );
  } );
}

/////////////// 解答表示
function show_form(){

  //var ans = $("select.py").children("option:selected").text();
  var ans = "";
  //docomoのフルブラウザ対策
  var ans2= "";
  $('input[type="radio"]:checked').each(function(){
    ans2 += $(this).val();
  });
/*
  $("select.py").each(function(){
    var i = $(this).get(0).selectedIndex;
    ans2 += $(this).children("option").get(i).text;
  });
*/
  ans2 = ans2.split("#").join("");
  var rig = $("#answer").text().split(" ").join("");
  var flag_correct = (ans === rig || ans2 === rig);
  var miss = misspool.pop();

  if(flag_correct){
    $("#tf").html("&#x25EF;").css("color","red");
  } else {
    miss[1]++;
    missrec[miss[0]] = miss[1];
    (miss[1]<3 ? misspool:failpool).push(miss);
  }
  var num_error = misspool.length + failpool.length;
  $("#result").append("<br>[" + num_error + " remain unsolved]" ).css( "display", "block" );
  //alert( "misspool: " + misspool + "\nfailpool: " + failpool + "\nmissrec:" + missrec );
}

/////////////// 終了
function go_fin(){
  if($("#result").css("display")=="none") return;
  $("#quiz").html("Today's mistake");
  $("#opt").html("");

  var misslist = [[], [], [], []];
  var res_txt = "";
  for(var i=0; i<cnt_q; i++){
    var mislen = (missrec[i]) ? missrec[i] :0;
    misslist[mislen].push(qs_list_subset[i][0]);
    if(mislen > 0)
      res_txt += stars[missrec[i]-1] + qs_list_subset[i][1]
        + ":" + qs_list_subset[i][2] + "\n";
  }
  if(missrec.length)
    $("#result").html("<textarea>" + res_txt + "</textarea>");
  else if(cnt_q >= conf_q)
    $("#result").html("Congraturation for perfect clear!");
  else
    $("#result").html("(No mistakes)");

    misslist.forEach((qids, i) => {
        qids.forEach(qid => {
            var idx = scores.findIndex(score => score[0] == qid);
            scores[idx][1] = (scores[idx][1] + i.toString()).slice(-8);
        });
    });
    $("#submit_button").html(
        "<textarea>" + JSON.stringify(misslist) + "</textarea>"
            + "<textarea>" +
            JSON.stringify(scores) + "</textarea>"
    );

    
}

/////////////// クエリ取得
function getRequest(){
  if(location.search.length > 1){
    var get = new Object();
    var ret = location.search.substr(1).split("&");
    for(var i=0; i<ret.length; i++){
      if(ret[i].indexOf("user=")==0) return ret[i].split("=").pop();
    }
  }
  return false;
}
/////////////// イベントハンドラ
$(document).ready( function() {
  var all_hitags = "";
  $("#start").click( function(){  state_machine(); } );
  $("#fin").click( go_fin );
  init_config(conf_q);
});
