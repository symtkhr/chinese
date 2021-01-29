// ver.1.2 since 2013/06/04

//////////////////////////////////////// main 
let Q = {
    conf: 10,
    count: 0,
    state: 0,
    qlist: [],
    misspool: [],
    missrec : [],
    failpool: [],
    scores: [],
};
const stars = ["&#x2606;", "&#x2605;", "&#x203B;"];

////////////////// 初期化
function init_config(num){
    let qslist = [];
    const loaders = [
        {
            file:"qs_list.dat",
            cb: (dic) => { qslist = dic.trim().split("\n").map(line => line.split("\t")); },
        },
        {
            file: "./wc_sav_dat/x.dat", // + getRequest() + ".dat",
            cb: text => {
                Q.scores = text.split(";").filter(v=>v).map(score => score.split(":"));
                Q.scores.forEach(d => {
                    let id = d[0];
                    if (!id) return;
                    let score = d[1];
                    let i = qslist.findIndex(q => q[0] == id);
                    qslist[i].push(score);
                });
            },
        }];

    const loadnext = () => {
        if (loaders.length == 0) return alldone();
        let g = loaders.shift();
        $.get(g.file)
            .done(x => { g.cb(x); loadnext(); })
            .fail(x => { console.log(g.file, "fail"); loadnext(); });
    };

    const alldone = () => {
        try {
            Q.scores = JSON.parse(localStorage["score"]);
        } catch(e) {
            console.log(e);
        }
        Q.scores.forEach(d => {
            let id = d[0];
            if (!id) return;
            let score = d[1];
            let i = qslist.findIndex(q => q[0] == id);
            qslist[i].push(score);
        });

        qslist.sort((a,b)=>{
            let dlen = a[1].length - b[1].length;
            if (dlen) return dlen;
            let dtone = a[2].split(" ").map(v => v.slice(-1)).join("")
                - b[2].split(" ").map(v => v.slice(-1)).join("");
            if (dtone) return dtone;
            return a[2] < b[2] ? -1 : 1;
        }).map(v => show_card(v, $("#fullbox .cardlist")));
        
        for (let i = 0; i < num && 0 < qslist.length; i++) {
            let ord = parseInt(Math.random() * qslist.length);
            Q.qlist.push(qslist[ord]);
            qslist.splice(ord, 1);
        }
        qslist = [];
        show_all_card();
    };

    loadnext();
}

const show_card = (qs, $obj) => {
    $obj.append("<li class=card>"
                + "<span class=word>" + qs[1] + "</span> "
                + "<span class=read>" + qs[2] + "</span> "
                + "<span class=mean>("+ qs[3] + ")"
                + '<a class="weblio" href="https://cjjc.weblio.jp/content/' + encodeURI(qs[1]) + '" target="_blank">Weblio</a>'
                + "</span>"
                + "</li>");
};

let card_reader = () => {
    $(".card").click(function() {
        let ssu = new SpeechSynthesisUtterance();
        ssu.text = $(this).text().split(" ").shift();
        ssu.lang = 'zh';
        ssu.rate = 1;
        ssu.onerror = function() {
            $(this).append("[error]");
        };
        ssu.onend = function() {
            //voice_finished();
        };
        speechSynthesis.speak(ssu);
    });
};

////////////////// カード一覧
function show_all_card(){
    let query_user = getRequest();
    let res = "Learn how to read the following " + Q.conf + " words. ";

    if (Q.scores.length) {
        //res = 'Hi, '+ query_user + "! " + res;
        res += Q.scores.length + " of your scores have been saved.";
    }
    res += "<div class=cardlist></div>";

    $("#result").html(res);
    Q.qlist.map(v => v.join(";")).sort().map(v => show_card(v.split(";"), $(".cardlist").eq(0)));
    card_reader();
}

////////////////// 状態遷移
function state_machine(){
    if (Q.state == 1) {
        Q.state = 0;
        show_answer();
        return;
    }
    Q.state = 1;
    question();
}
/////////////// 出題
function question(){
    let take = 0;
    let qid = Q.count;
    let phase = (() => {
        if (Q.count >= Q.conf) {
            return (Q.misspool.length == 0) ? 2 : 1;
        }
        let mislen = Q.misspool.length;
        let percent =  mislen * mislen * Q.count / (Q.conf * 40);
        console.log(percent);
        return (percent > Math.random()) ? 1 : 0;
    })();

    switch(phase){
    case 0:
        // new card
        Q.count++;
        break;
    case 1:
        let rsub = parseInt(Math.random() * (Q.misspool.length - 1));
        qid  = Q.misspool[rsub][0];
        take = Q.misspool[rsub][1];
        Q.misspool.splice(rsub, 1);
        break;
    case 2:
        return go_fin();
    }

    $("h2, #dump").hide();
    $("#quiz").html("(Now loading)");
    $("#result").hide().html("");

    let qs = Q.qlist[qid];
    show_quiz(qid, qs, take);

    //履歴表示
    if (qs[4])
        $("#result").hide().html(
            " (History: " + qs[4].split("")
                .map(c => '<span class="r' + c + ' qid">' + (0 < (c - 0) ? stars[c - 1] : "&#x25ef;") + '</span>')
                .join("") + ")"
        ).css("display","flex");
    Q.misspool.push([qid, take]);
    $("input[type=radio]:first").focus();
}

//////////////// 選択肢作成
function make_options(pinyin){
    // リスト先頭文字取得
    const find_key = (pinyin) => {
        let st;
        if(pinyin.match(/^[awueo]/))
            st = "#";
        else if(pinyin.match(/^[csz]h/) )
            st = pinyin.slice(0,2);
        else
            st = pinyin.slice(0,1);
        return (pn_list[st]) ? st : false;
    };

    // 似た子音を返す
    const get_sim_heads = (head) => {
        let sim_heads = [head];
        for(let i=0; i<similarity_nest.length; i++){
            let sim_st = similarity_nest[i].split("-");
            let pos = $.inArray(head, sim_st);
            if(pos<0) continue;
            if(sim_st[pos-1]) sim_heads.push(sim_st[pos-1]);
            if(sim_st[pos+1]) sim_heads.push(sim_st[pos+1]);
        }
        return sim_heads;
    };

    let head = find_key(pinyin);
    if(!head) return;
    let flag_diff = false; // ( Math.random() * 5 < 1 );
    let sim_heads = get_sim_heads(head);
/*
  if(flag_diff){
    var sim_heads = get_sim_heads(head);
    var simlen = sim_heads.length;
    if(simlen==0) flag_diff = false;
    var sim_head = sim_heads[parseInt( Math.random() * sim_heads.length )];
  }
*/
    while (sim_heads.length < 4) {
        let tmp = pn_heads[parseInt( Math.random() * pn_heads.length )];
        if (sim_heads.indexOf(tmp) < 0) sim_heads.push(tmp);
    }
    while (sim_heads.length > 4) {
        sim_heads.splice(parseInt(Math.random()*(sim_heads.length-1)+1),1);
    }
    
    // select one with the same head
    var opt = [(head==="#"?"#":"")+pinyin];
    var pn = pn_list[head];
    var samelen = flag_diff ? 2 : 4;
    while( opt.length < samelen ){
        var tmp = head + pn[parseInt( Math.random() * pn.length )];
        if(opt.indexOf(tmp) < 0) opt.push(tmp);
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
        opt[i] = opt[i].slice(head.length);
    
    return sim_heads.sort().concat(opt.sort());
}

/////////////// 出題表示
function show_quiz(qid, qs, retest) {
    let hanji = qs[1];
    let pinyin = qs[2];

    $("#opt").html("");
    $("#quiz").html("<span class=qid>" +  (qid + 1) + "</span>");
    $("#quiz").append('<span id="tf">&#xd7;</span>');
    $(".qid").addClass("r" + retest);
    $("#start").val("Submit");
    show_card(qs, $("#quiz"));
    card_reader();
    $(".card .read, .card .mean, #tf").hide();

    // 選択肢の表示
    const create_radio = (group, value, nth) => {
        let id = group + "-" + nth;
        let $radio = '<label for="' + id + '">';
        $radio += '<input type=radio name="' + group +'" value="' + value + '" id="' + id + '">';
        $radio += value + '</label><br />';
        return $radio;
    };

    const dump_opt = (opt,qing) => {
        let $opt = '';
        $opt += '<div style="display:flex; margin:5px;">';
        $opt += '<div class="vowel">';
        for(let i=0; i<4; i++) $opt += create_radio("vowel" + qing, opt[i], i);
        $opt += ("</div>");
        $opt += '<div class="consonant">';
        for(let i=4; i<8; i++) $opt += create_radio("consonant" + qing, opt[i], i);
        $opt += ("</div>");
        $opt += '<div class="pitch">';
        for(let i=1; i<=4; i++) $opt += create_radio("pitch" + qing, i, i);
        if(qing) $opt += create_radio("pitch" + qing, 0, 0);
        $opt += "</div>";
        $opt += "</div>";
    
        $("#opt").append($opt);
        $('input').click(function(){
            let name = $(this).attr("name");
            $('input[name=' + name + ']').parent('label').css( { color: "black", fontWeight:"normal" } );
            $(this).parent('label').css( { color: 'red', fontWeight:"bold" } );
        });
    };

    let opts = pinyin.split(" ").map(a => make_options(a.replace(/[0-4]$/,"")));
    if (hanji.match(/^(.+)\1$/)) opts[1] = opts[0];
    opts.map((opt, i)=> dump_opt(opt, i));
};


/////////////// 解答表示
function show_answer(){

    let ans = "";
    let ans2 = $('input[type="radio"]:checked')
        .map(function(){ return $(this).val(); })
        .get().join("").split("#").join("");
    let rig = $("#quiz .card .read").text().split(" ").join("");
    let flag_correct = (ans === rig || ans2 === rig);
    let miss = Q.misspool.pop();
    
    if(flag_correct){
        $("#tf").html("&#x25EF;").css("color","red");
    } else {
        miss[1]++;
        Q.missrec[miss[0]] = miss[1];
        (miss[1] < 3 ? Q.misspool : Q.failpool).push(miss);
    }
    $("#result").append("[" + (Q.misspool.length + Q.failpool.length) + " remain unsolved]" ).show();
    $(".read, .mean, #tf").show();
    $("#start").val("Next");
}

/////////////// 終了
function go_fin(){
    if ($("#start").val() == "Submit") return;
    $("#quiz").html("Today's mistake");
    $("#opt").html("");

    let misslist = [[], [], [], []];
    let res_txt = "";
    for (let i = 0; i < Q.count; i++) {
        let mislen = (Q.missrec[i]) ? Q.missrec[i] :0;
        misslist[mislen].push(Q.qlist[i][0]);
        if (mislen > 0)
            res_txt += stars[Q.missrec[i]-1] + Q.qlist[i][1]
            + ":" + Q.qlist[i][2] + "\n";
    }
    if (Q.missrec.length)
        $("#result").html("<textarea>" + res_txt + "</textarea>");
    else if (Q.count >= Q.conf)
        $("#result").html("Congraturation for perfect clear!");
    else
        $("#result").html("(No mistakes)");

    misslist.forEach((qids, i) => {
        qids.forEach(qid => {
            let idx = Q.scores.findIndex(score => score[0] == qid);
            if (idx < 0) {
                idx = Q.scores.length;
                Q.scores.push([qid, ""]);
            }
            Q.scores[idx][1] = (Q.scores[idx][1] + i.toString()).slice(-8);
        });
    });
    $("#result").append(
        "<textarea>" + JSON.stringify(misslist) + "</textarea>"
            + "<textarea id=qscores>" +
            JSON.stringify(Q.scores) + "</textarea>"
    );
    localStorage["score"] = JSON.stringify(Q.scores);
    
    $("#result textarea").css("height","200px").prop("disabled", true);
    $("#qscores").prop("disabled", false);
    
    $("#start").val("Save").unbind().click(function() {
        localStorage["score"] = $("#qscores").val();
    }).show();

}

/////////////// クエリ取得
function getRequest(){
    if (location.search.length < 2) return;
    let ret = location.search.slice(1).split("&")
        .find(q => q.indexOf("user=") == 0);
    if (!ret) return;
};
/////////////// イベントハンドラ
$(function() {
    $("#fullbox").hide();
    $("#dump").click(function() {
        $("#fullbox, #game").toggle();
    });
    $("#start").click(function(){ state_machine(); });
    $("#fin").click(go_fin);
    init_config(Q.conf);
});
