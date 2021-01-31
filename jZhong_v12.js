// ver.1.2 since 2013/06/04
const $id = (id) => document.getElementById(id);
const $name = (name) => [... document.getElementsByName(name)];
const $c = (c, $dom) => [... ($dom ? $dom : document).getElementsByClassName(c)];
const $q = (query) => [... document.querySelectorAll(query)];

const getfile = (fname, cb) => {
    const ajax = new XMLHttpRequest();
    ajax.onreadystatechange = () => {
        if (ajax.readyState != 4) return;
        if (ajax.status != 200) return;
        cb(ajax.responseText);
    };
    ajax.open("GET", fname, true);
    ajax.send(null);
};

//////////////////////////////////////// main 
let Q = {
    conf: 10,
    count: 0,
    state: 0,
    qlist: [],
    qpool: {retry: [], fail: []}, // mistaken [qid, take] [[1,2],[4,1],...]
    missrec : [], // mistaken {qid: take} [0,2,0,3,1,...]
    scores: [],   // total history
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
        }].slice(0,1);

    const loadnext = () => {
        if (loaders.length == 0) return alldone();
        let g = loaders.shift();
        getfile(g.file, x => { g.cb(x); loadnext(); })
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

        $q("#fullbox .cardlist")[0].innerHTML = qslist.sort((a,b) => {
            let dlen = a[1].length - b[1].length;
            if (dlen) return dlen;
            let dtone = a[2].split(" ").map(v => v.slice(-1)).join("")
                - b[2].split(" ").map(v => v.slice(-1)).join("");
            if (dtone) return dtone;
            return a[2] < b[2] ? -1 : 1;
        }).map(v => show_card(v)).join("");
        
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
    return "<li class=card>"
        + "<span class=word>" + qs[1] + "</span> "
        + "<span class=read>" + qs[2] + "</span> "
        + "<span class=mean>("+ qs[3] + ")"
        + '<a class="weblio" href="https://cjjc.weblio.jp/content/' + encodeURI(qs[1]) + '" target="_blank">Weblio</a>'
        + "</span>"
        + "</li>";
};

const card_reader = () => {
    $c("card").map($dom => $dom.onclick = () => {
        let ssu = new SpeechSynthesisUtterance();
        ssu.text = $c("word", $dom)[0].innerText.split(" ").shift();
        ssu.lang = 'zh';
        ssu.rate = 1;
        ssu.onerror = () => $dom.append("[error]");
        ssu.onend = () => console.log("voice_finished");
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

    $id("result").innerHTML = (res);
    $c("cardlist")[0].innerHTML = Q.qlist
        .map(v => v.join(";"))
        .sort().map(v => show_card(v.split(";")))
        .join("");

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
    const phase = (() => {
        let mislen = Q.qpool.retry.length;
        if (Q.count >= Q.conf) {
            return (mislen == 0) ? 2 : 1;
        }
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
        let rsub = parseInt(Math.random() * (Q.qpool.retry.length - 1));
        qid  = Q.qpool.retry[rsub][0];
        take = Q.qpool.retry[rsub][1];
        Q.qpool.retry.splice(rsub, 1);
        break;
    case 2:
        return go_fin();
    }

    $id("quiz").innerHTML = "(Now loading)";
    $id("result").innerHTML = "";
    $q("h2, #dump, #result").map($dom => $dom.style.display = "none");

    let qs = Q.qlist[qid];
    show_quiz(qid, qs, take);

    //履歴表示
    if (qs[4]) {
        $id("result").ineerHTML =
            " (History: " + qs[4].split("")
            .map(c => '<span class="r' + c + ' qid">' + (0 < (c - 0) ? stars[c - 1] : "&#x25ef;") + '</span>')
            .join("") + ")";
        $id("result").style.display = "flex";
    }
    Q.qpool.retry.push([qid, take]);
    $q("input[type=radio]")[0].focus();
}

//////////////// 選択肢作成
function make_options(pinyin){
    // リスト先頭文字取得
    const find_key = (pinyin) => {
        let st;
        if (pinyin.match(/^[awueo]/))
            st = "#";
        else if (pinyin.match(/^[csz]h/))
            st = pinyin.slice(0,2);
        else
            st = pinyin.slice(0,1);
        return (pn_list[st]) ? st : false;
    };

    // 似た子音を返す
    const get_sim_heads = (head) => {
        let sim_heads = [head];
        for (let i = 0; i < similarity_nest.length; i++){
            let sim_st = similarity_nest[i].split("-");
            let pos = sim_st.indexOf(head);
            if (pos < 0) continue;
            if (sim_st[pos - 1]) sim_heads.push(sim_st[pos - 1]);
            if (sim_st[pos + 1]) sim_heads.push(sim_st[pos + 1]);
        }
        return sim_heads;
    };

    let head = find_key(pinyin);
    if (!head) return;
    let flag_diff = false; // ( Math.random() * 5 < 1 );
    let sim_heads = get_sim_heads(head);

    const pn_heads = Object.keys(pn_list);
    while (sim_heads.length < 4) {
        let tmp = pn_heads[parseInt( Math.random() * pn_heads.length )];
        if (sim_heads.indexOf(tmp) < 0) sim_heads.push(tmp);
    }
    while (sim_heads.length > 4) {
        sim_heads.splice(parseInt(Math.random()*(sim_heads.length-1)+1),1);
    }
    
    // select one with the same head
    let opt = [(head === "#" ? "#" : "") + pinyin];
    let pn = pn_list[head];
    let samelen = flag_diff ? 2 : 4;
    while (opt.length < samelen) {
        let tmp = head + pn[parseInt( Math.random() * pn.length )];
        if (opt.indexOf(tmp) < 0) opt.push(tmp);
    }

    for (var i = 0; i < 4; i++)
        opt[i] = opt[i].slice(head.length);
    
    return sim_heads.sort().concat(opt.sort());
}

/////////////// 出題表示
function show_quiz(qid, qs, retest) {
    let hanji = qs[1];
    let pinyin = qs[2];

    $id("opt").innerHTML = "";
    $id("quiz").innerHTML = ("<span class=qid>" +  (qid + 1) + "</span>")
        + ('<span id="tf">&#xd7;</span>')
        + show_card(qs);
    $c("qid")[0].classList.add("r" + retest);
    $id("start").value = ("Submit");

    card_reader();
    $q(".card .read, .card .mean, #tf").map($dom => $dom.style.display = "none");

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
        if (qing) $opt += create_radio("pitch" + qing, 0, 0);
        $opt += "</div>";
        $opt += "</div>";
        
        $id("opt").innerHTML += $opt;
    };

    let opts = pinyin.split(" ").map(a => make_options(a.replace(/[0-4]$/,"")));
    if (hanji.match(/^(.+)\1$/)) opts[1] = opts[0];
    opts.map((opt, i)=> dump_opt(opt, i));


    $q('#opt input').map($dom => $dom.onchange = () => {
        $q('input[name=' + $dom.name + ']').map($dom => $dom.parentNode.classList.remove("checked"));
        $dom.parentNode.classList.add("checked"); //css( { color: 'red', fontWeight:"bold" } );
    });
};


/////////////// 解答表示
function show_answer(){

    let ans = $q('input[type="radio"]:checked')
        .map($dom => $dom.value).join("")
        .split("#").join("");
    let correct = $q("#quiz .card .read")[0].innerText.split(" ").join("");
    let miss = Q.qpool.retry.pop();

    if (ans === correct) {
        $id("tf").innerHTML = ("&#x25EF;");
        $id("tf").style.color = "red";
    } else {
        miss[1]++;
        Q.missrec[miss[0]] = miss[1];
        Q.qpool[(miss[1] < 3 ? "retry" : "fail")].push(miss);
    }
    $id("result").innerHTML += "[" + (Q.qpool.retry.length + Q.qpool.fail.length) + " remain unsolved]";
    $id("start").value = ("Next");
    $q(".read, .mean, #tf, #result").map($dom => $dom.style.display = "");
}

/////////////// 終了
function go_fin(){
    if ($id("start").value == "Submit") return;

    let misslist = [[], [], [], []];
    for (let i = 0; i < Q.count; i++) {
        let mislen = (Q.missrec[i]) ? Q.missrec[i] : 0;
        misslist[mislen].push(Q.qlist[i][0]);
    }
    
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

    const mistakes = (Q) => {
        if (Q.missrec.length)
            return "Your mistakes:\n" //res_txt;
            + Q.missrec.map((v,i) => stars[v - 1]
                            + Q.qlist[i][1] + "(" + Q.qlist[i][0] + ")"
                            + ":" + Q.qlist[i][2]).join("\n");
        if (Q.count >= Q.conf)
            return ("Congraturation for perfect clear!");
        return ("(No mistakes)");
    };

    $id("quiz").innerHTML =
        "<textarea>" + mistakes(Q) + "</textarea>"
        + "<textarea id=qscores>"
        + JSON.stringify(Q.scores) + "</textarea>";
    localStorage["score"] = JSON.stringify(Q.scores);

    $id("result").innerHTML = ("");
    $id("opt").innerHTML = ("");

    
    $q("#quiz textarea").map($dom => {
        $dom.style.height = "200px";
        $dom.disabled = true;
    });

    $id("exit").onclick = null;
    $id("qscores").disabled = false;
    $id("start").value = ("Save");
    $id("start").onclick = () => {
        localStorage["score"] = $id("qscores").value;
        $id("start").disabled = true;
        $id("qscores").disabled = true;
        $id("result").innerHTML += ("Saved");
    };
}

/////////////// クエリ取得
function getRequest(){
    if (location.search.length < 2) return;
    let ret = location.search.slice(1).split("&")
        .find(q => q.indexOf("user=") == 0);
    if (!ret) return;
};
/////////////// イベントハンドラ
window.onload = () => {
    $id("dump").onclick = () => [$id("fullbox"), $id("game")].map($dom => $dom.classList.toggle("hidden"));
    $id("start").onclick = () => state_machine();
    $id("exit").onclick = go_fin;
    init_config(Q.conf);
};
