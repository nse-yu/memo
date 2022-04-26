window.onload = () => {
    //変数定義
    let body_changed = 0;

    //イベント設定
    document.querySelectorAll(".btn").forEach(btn => {
        if(btn.classList.contains("btn__save")) btn.addEventListener("click",write_notepad);
        else if(btn.classList.contains("btn__del")) btn.addEventListener("click",del_notepad);
        else if(btn.classList.contains("btn__open")) btn.addEventListener("click",read_notepad);
    });

    //初期処理
    list_notepad();

    /**[POST]btn__saveによって発火するイベントリスナー */
    function write_notepad(){
        const title = document.querySelector(".title__text");
        const bigText = document.querySelector(".bigtext__text");

        //本文なし -> write終了
        if(bigText.value === ""){
            display_status("本文が入力されていません。");
            return;
        }

        //タイトルなし -> 入力催促
        if(title.value === ""){
            let new_title = prompt("メモのタイトルを入力してください");
            //write終了
            if(!new_title){
                display_status("保存処理をキャンセルしました。");
                return;
            }
            title.value = new_title;
        }
        if(!confirm("保存しますか？")) return;
        display_status(`「${title.value}」を保存しています。`);

        //TODO:ajax request
        let req_body = {title:title.value,body:bigText.value};
        const req = ajaxRequest("write","POST",req_body);

        //コールバック定義
        let func = () => {
            list_notepad()
        }
        onCompleted(req,func);

        return false;
    }

    /**[GET]btn__delによって発火するイベントリスナー */
    function del_notepad(){
        let title = get_selected_title();
        
        //nothing selected
        if(typeof(title) === "undefined"){
            display_status("削除するファイルを選択してください。");
            return;
        }

        if(!confirm(`「${title}」を削除してもよろしいですか？`)) return;
        display_status(`「${title}」を削除しています。`);

        //TODO:ajax request
        let req_body = {title:title};
        let req = ajaxRequest("del","GET",req_body);

        //コールバック定義
        let func = () => {
            list_notepad();
        }
        onCompleted(req,func);

        return false;
    }

    /**[GET]btn__openによって発火するイベントリスナー */
    function read_notepad(){
        if(body_changed){
            const title = document.querySelector(".title__text");
            if(!confirm(`「${title.value}」は変更されています。\n変更内容を破棄してもよろしいですか?`)) return;
        }
        let title = get_selected_title();

        //nothing selected
        if(typeof(title) === "undefined"){
            display_status("開くファイルを選択してください。");
            return;
        }
        display_status(`「${title}」を開いています。`);

        //TODO:ajax request
        let req_body = {title:title};
        let req = ajaxRequest("open","GET",req_body);

        //コールバック定義
        let func = req => {
            let res = JSON.parse(req.responseText);
            console.log(res);
            document.querySelector(".title__text").value = res["title"];
            document.querySelector(".bigtext__text").value = res["body"];
        }
        onCompleted(req,func);

        return false;
    }

    /**入力状況を表示する */
    function display_status(message){
        console.log(message);
    }

    /**セレクトボックスで選択されているファイル名を返す */
    function get_selected_title(){
        const files = document.querySelector("#files");
        for(let i = 0;i < files.children.length;i++){
            if(files.children[i].selected){
                return files.children[i].value;
            }
        }
    }

    /**window読み込み時に呼び出される。 */
    function list_notepad(){
        display_status("ファイル一覧を更新しています。");

        //TODO:ajax request
        let req = ajaxRequest("","GET",{});

        //コールバック定義
        let func = req => {
            let select = document.querySelector("#files");
            Array.from(select.childNodes).forEach(child => {
                select.removeChild(child);
            });
            for(let file of req.responseText.split(","))
            {
                let textNode = document.createTextNode(file);
                let opt = document.createElement("option");
                opt.setAttribute("value",file);
                opt.appendChild(textNode);
                select.appendChild(opt);
            }
        }
        onCompleted(req,func);

        return false;
    }

    /**Ajaxリクエストのためのインスタンスを生成 */
    function createXmlHttpRequest(){
        let req = null;
        if(window.XMLHttpRequest){
            req = new XMLHttpRequest();
        }
        return req;
    }

    function ajaxRequest(host,method="POST",req_body){
        //リクエスト生成
        let req = createXmlHttpRequest();

        //FIXME:送信処理
        if(req){
            let param = (method === "GET") ? ToQueryParam(req_body) : "";
            req.open(method,`http://localhost:8080/${host}`+param);
            req.setRequestHeader('Content-Type','application/json;');
            req.send(JSON.stringify(req_body));
        }
        return req;
    }

    /**オブジェクトをクエリ文字列に変換して返す */
    function ToQueryParam(data){
        if(Object.keys(data).length === 0) return "";
        let query = [];
        let i = 0;
        for(key in data){
            query[i] = key + "=" + data[key];
            i++;
        }
        return "?"+query.join("&");
    }

    /**リクエストオブジェクトから完了ステータスが返されたときのコールバックを設定する */
    function onCompleted(req,func){
        //イベントリスナー追加
        req.onreadystatechange = () => {
            //completed and successful
            if(req.readyState === 4 && req.status === 200){
                func(req);
            }else{
                //FIXME:レスポンスに対する別の処理
            }
        }
    }
}