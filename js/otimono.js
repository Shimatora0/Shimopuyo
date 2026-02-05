//初期設定
//落ち物パズル : wws.js　ライブラリ使用
//---定数定義(Constants)
//constは定数を宣言するときに使う
//一度当たりを設定したら後から変更しない(できない)変数
//ゲームすべてで使う設定値などを入れておくと便利
const CANVAS_W = 1000;  //ゲーム画面の幅
const CANVAS_H = 1200;  //ゲーム画面の高さ
const FPS_RATE = 15;    //フレームレート(1秒間に何回mainloopを動かすか)
//盤面に関する定数
const BOARD_ROWS = 13;  //盤面の行数(縦のマス数)
const BOARD_COLS = 7;   //盤面の列数(ブロックを置ける横のマス数)
const BOARD_V_ROWS = 15;    //盤面全体の行数(上下含む)
const BOARD_V_COLS = 9;     //盤面全体の列数
const BLOCK_SIZE = 80;  //ブロック一つあたりのピクセルサイズ
const EFFECT_MAX = 100;
const EFFECT_DURATION = 20;
const RAINBOW_COLORS=["#D7FFFF","#BBFFFF","#B9E7FF","#B0E7FF","#8BE7FF","#6CE7FF","#47E7FF","#23E7FF","#04E7FF","#00E7FF"];
//ゲームの進行状態に名前を付けて管理します
//'gameProc = 1'が何の状態なのか一目でわかります
const GAME_STATE = {
    CONTROL:0,//プレイヤーがブロック捜査中
    FALL:1, //ブロックが落下中
    CHECK:2,//消去チェック中
    DELETE_:3,
    NEXT:4//次のブロック準備中
};
const SCENE = {//ゲーム全体のシーンを管理する定数
    TITLE:0,    //タイトル画面
    PLAY:1,     //ゲームプレイ中
    TIMEUP:2,   //タイムアップ画面
    GAMEOVER:3, //ゲームオーバー画面
    GAMECLEAR:4 //追加：クリア画面
};
//グローバル変数
//letは変数定義　後から値変更可能
let playerBlocks = [0,0,0];
let nextBlocks = [0,0,0];
let playerBlockX = 0;
let playerBlockY = 0;
let tapKey = [0,0,0,0,0];//ボタンのアイコンをタップしているか
//ブロックの方向
let blockDirection = 0;//0横向き１縦向き
//ゲームプレイ中の状態
let gameTimer = 0;
let gameProc = GAME_STATE.CONTROL;   //初期値をCONTROLに設定
let currentScene = SCENE.TITLE; //現在のシーンを管理する変数
let color = 5;      //ブロックの種類
let SpeedUp = false;
let dropSpeed = 120; //落下時間
let masu = [];
let kesu = [];
//エフェクトデータエフェクトのデータを管理する配列
let effects =[];
//次に使うエフェクトデータが配列の何番目かを指すインデックス
let effectIndex = 0;
//ゲームの制限時間を秒数で設定
const INITIAL_GAME_TIME_SECONDS = 120;
const TIME_BONUS_SECONDS = 5;   //タイムボーナスの秒数を定数化
const PLUS = 5;                 //連鎖時のボーナス
let score;              //score
let hiscore = 00000;    //ハイスコア
let rensa;               //連鎖回数
let points;             //ブロックを消した時の特典
let extendTime;         //ブロックを消す演出時間


//ゲームの盤面を表す２時配列
//constで宣言、中身は後から変更可能
//-1:壁 0空きスペース,1~6 各色のブロック

//起動時の処理
function setup(){
    setFPS(15);
    canvasSize(CANVAS_W,CANVAS_H);
    //画像とサウンドのリソースを読み込む
    loadImg(0,"image/bg2.png");
    //イメージデータ、1~6までの画像を読み込む
    for(let i=0; i<10; i++)loadImg(1 + i, "image/oti"+(i+1)+".png");
    loadImg(11,"image/title.png");
    loadSound(0,"sound/Shower.mp4");//BGM
    loadSound(1,"sound/se5.mp3");//SE
    //ゲームで使う変数を初期状態にする関数を呼び出す
    initVar();
}



//メインループ
function mainloop(){
    drawScene();//最初に必ず描画処理を呼ぶ　関数名を変える
    //現在のシーンに応じて、処理を分岐させる
    switch(currentScene){
        case SCENE.TITLE:
            //タイトル画面の処理　何かキーが押されたか、または画面がタップされたら次へ
            if(inkey > 0||tapC ==1){
                initVar();//ゲームを初期化
                currentScene = SCENE.PLAY;//プレイ画面へ移行
                playBgm(0);
                inkey = 0;//キー入力をリセット
                tapC = 0;//タップ入力をリセット
            }
            break;
            case SCENE.PLAY:
                procPzl();//ゲームプレイ中の処理　今までのprocPzlを呼び出す
                break;
                case SCENE.TIMEUP:
                    case SCENE.GAMEOVER:
                    case SCENE.GAMECLEAR: //クリア画面の共通処理
                        //タイムアップ画面とゲームオーバー画面の共通処理　キーが押されたか、画面がタップされたら
                        if(inkey > 0||tapC ==1){
                            currentScene = SCENE.TITLE;//タイトル画面へ戻る
                            stopBgm();
                            inkey = 0;
                            tapC = 0;
                        }
                        break;
    }
    drawEffect();
}
function initVar(){
    //エフェクト配列を初期化する
    effects = [];   //配列をいったん空にする
    for(let i = 0; i < EFFECT_MAX;i ++){
        //timeが0のエフェクトデータを最大数分用意しておく
        effects.push({x:0,y:0,time:0});
    }
    effectIndex = 0;    //インデックスもリセット
    score = 0;
    rensa = 1;
    SpeedUp = false;
    color = 4;
    //盤面とkesu盤面を初期化
    for(let y = 0; y<BOARD_V_ROWS;y++){
        masu[y] = [] ;
        kesu[y] = [] ;
        for(let x =0;x<BOARD_V_COLS;x++){
            masu[y][x]=(y==0||y==BOARD_V_ROWS-1||x==0||x==BOARD_V_COLS-1) ?-1:0;
            kesu[y][x]=0; //修正:0を代入
        }
    }
    playerBlockX = 4;   //ブロックの初期位置
    playerBlockY = 1;
    //プレイヤーが操作するブロックの初期の色を設定します
    playerBlocks = [1,2,3];
    //ゲーム開始時のネクストブロックをランダムに設定
    nextBlocks[0]=1+rnd(4);
    nextBlocks[1]=1+rnd(4);
    nextBlocks[2]=1+rnd(4);
    dropSpeed = 10
    //「秒数×1秒当たりのフレーム数」で、残り時間をフレーム単位に変換して設定します

    gameTimer = (INITIAL_GAME_TIME_SECONDS * FPS_RATE)-1;
    //ゲーム開始時のブロックの向きも横に
    blockDirection = 0
}
function drawScene(){
    let x, y;
    //シーンに応じて描画内容を切り替える
    switch(currentScene){
        case SCENE.TITLE:
            setAlp(10);
            fill("aqua");
            setAlp(100)
            drawImgC(11,CANVAS_W/2,CANVAS_H/2-100);//タイトル画面を描画
            //点滅するテキスト　main_tmrはWWSのグローバルタイマーを使用
            if(int(main_tmr/20)%2 == 0){
                fText("始める(Start)開始",CANVAS_W/2,CANVAS_H/2+150,50,"yellow");
            }
            break;
        case SCENE.PLAY:
            //ネクストブロックの表示
            drawImg(0,0,0);//背景画像描画
            fText("NEXT",720+BLOCK_SIZE,50,40,"orange")//ネクストを表示
            for (let i = 0; i<3; i++){
                //ネクストブロック配列の画像を描画　720基準に80ずつ右にずらす
                drawImgC(nextBlocks[i],720+i*BLOCK_SIZE,120);
            }
            //盤面(マス配列)の状態に応じ、固定されたブロックを描画　ループ2つ使用、全マスチェック
            for(y=1;y<=BOARD_ROWS;y++){
                for(x=1;x<=BOARD_COLS;x++){
                    if(masu[y][x]>0)drawImgC(masu[y][x],BLOCK_SIZE*x,BLOCK_SIZE*y);
            }   }
            //プレイヤーブロック1+ｘはｘ－1の時[0]x=0のとき[1]となる
            //BLOCK_SIZE*(playerblokX+x)はブロックの中心位置から左右にずらしたピクセル座標
            if(gameProc == GAME_STATE.CONTROL){
                if(blockDirection == 0){//横向き
                    //今までの描画処理と同じ
                    for(let x = -1;x<=1; x++){
                        drawImgC(playerBlocks[1+x],BLOCK_SIZE*(playerBlockX+x),BLOCK_SIZE*playerBlockY-2);
                    }
                }else{//縦向きの場合
                    //縦に3つ並べて描画する
                    for(let y = -1;y<=1;y++){
                        drawImgC(playerBlocks[1+y],BLOCK_SIZE*playerBlockX,BLOCK_SIZE*(playerBlockY+y)-2);
                    }

                }
            }
            //ここでエフェクトを描画
            drawEffect();
            //残り時間を秒に変換して表示
            let remainingSeconds = Math.max(0,int(gameTimer/FPS_RATE));
            fTextN("TIME\n" + remainingSeconds,800,280,70,60,"black");
            fTextN("SCORE\n"+score,800,560,70,60,"blue");      //スコアの表示
            fTextN("HI-SCORE\n"+hiscore,800,680,70,60,"red");   //ハイスコア
            break;
            case SCENE.TIMEUP:
                setAlp(10);
                fill("blue");
                setAlp(100);
                fText("O- time up sitanka!?",CANVAS_W/2,CANVAS_H/2,100,"orange");
                if(int(main_tmr/10)%2==0){
                    fText("サイキックでゆで卵作りに行く",CANVAS_W/2,CANVAS_H/2+150,50,"yellow");
                }
                break;
            case SCENE.GAMEOVER:
                setAlp(10);
                fill("black");
                setAlp(100);
                fText("ばたんきゅー",CANVAS_W/2,CANVAS_H/2,100,"white");
                if(int(main_tmr/10)%2==0){
                    fText("もう一回霜ぷよする",CANVAS_W/2,CANVAS_H/2+150,50,"cyan");
                }
                break;
            case SCENE.GAMECLEAR: //追加
                setAlp(10);
                fill("gold");
                setAlp(100);
                fText("霜ぷよクリア！",CANVAS_W/2,CANVAS_H/2,100,"red");
                if(int(main_tmr/10)%2==0){
                    fText("タイトルへ戻り愉悦部の皆に報告する",CANVAS_W/2,CANVAS_H/2+150,50,"cyan");
                }
                break;
    }
}
function procPzl(){
    if(tapC > 0){//画面のどこかがタップされているか
        //左ボタン
        if(tapX > 650 && tapX<750 && tapY > 900 && tapY <990){tapKey[0]++;}
        //右ボタンの判定
        if(tapX > 880 && tapX <990 && tapY > 900 && tapY < 990){tapKey[1]++;}
        //下ボタンの判定
        if(tapX > 780 && tapX < 880 && tapY > 990 && tapY < 1150){tapKey[2]++;}
        //スピンボタンの判定
        if(tapX > 750 && tapX < 880 && tapY > 900 && tapY < 990){tapKey[3]++;}
        //回転ボタンの判定
        if(tapX > 750 && tapX < 880 && tapY > 850 && tapY < 900){tapKey[4]++;}
        }else{//tapCが0の場合(タップが離されている場合
            //すべてのタップキーの状態をリセットする
            for(let i = 0; i<5; i++){tapKey[i] = 0;}
    }
    switch(gameProc){
        case GAME_STATE.CONTROL://プレイヤーがブロックを捜査中
        //移動判定フラグ
        //このフレームで左に動くべきか右に動くべきかを一時的に覚えておく変数
        let moveLeft = false;
        let moveRight = false;
            //左移動の条件チェック
            if(key[K_LEFT]==1||key[K_LEFT]>4||tapKey[0]==1||tapKey[0]>8){
                moveLeft =true;
            }
            //右移動の条件チェック
            if(key[K_RIGHT]==1||key[K_RIGHT]>4||tapKey[1]==1||tapKey[1]>8){
                moveRight = true;
            }
            //実際の移動処理
            //フラグが立っていたら、実際にブロックを動かす
            if(moveLeft){
                if(blockDirection == 0){//横向き
                    if(masu[playerBlockY][playerBlockX-2]==0)playerBlockX--;
                }else{//縦向き  
                    if(masu[playerBlockY-1][playerBlockX-1] ==0&&
                    masu[playerBlockY][playerBlockX-1]==0&&
                    masu[playerBlockY+1][playerBlockX - 1]==0){
                        playerBlockX--;
                }
            }
        }
            if(moveRight){
                if(blockDirection == 0 ){//横向き
                     if(masu[playerBlockY][playerBlockX+2]==0)playerBlockX++;
                }else{//縦向き
                    if(masu[playerBlockY-1][playerBlockX+1]==0&&
                    masu[playerBlockY][playerBlockX + 1]==0 &&
                    masu[playerBlockY+1][playerBlockX+1]==0){
                        playerBlockX++;
            }
        }
    }
        //上キーでブロックの向きを回転
        if(key[38]==1||tapKey[4]==1){
            let newDirection = 1- blockDirection;//向きを仮に切り替えてみる
            let canRotate = false;//回転可能かどうかのフラグ
            if(newDirection == 1){//横→縦への回転チェック
                //開店後の縦３マスが開いているか
                if(masu[playerBlockY-1][playerBlockX]==0&&
                    masu[playerBlockY+1][playerBlockX]==0){
                        canRotate = true;
                    }
            }else{//縦→横への回転チェック
                if(masu[playerBlockY][playerBlockX-1]==0 &&
                    masu[playerBlockY][playerBlockX+1]==0){
                        canRotate = true;
                    }
            }
            //回転可能なら向きを正式に変更する
            if(canRotate){
                blockDirection = newDirection;
            }
        }
        //ブロックの入れ替え
            if(key[32]==1||tapKey[3]==1){
                let junban = playerBlocks[2];
                playerBlocks[2] = playerBlocks[1];
                playerBlocks[1] = playerBlocks[0];
                playerBlocks[0] = junban;
            }
        //自動落下、下キーでの高速落下
        if(gameTimer % dropSpeed ==0||key[40]>0||tapKey[2]>0){
            let canFall = false;
            if(blockDirection ==0){//横向きの落下判定
                if(masu[playerBlockY+1][playerBlockX-1]==0&&
                    masu[playerBlockY+1][playerBlockX]==0&&
                    masu[playerBlockY+1][playerBlockX+1]==0){
                        canFall = true;
                    }
                }else{//縦向きの落下判定
                    //一番下のブロック(y+1)のさらに下が開いているか
                    if(masu[playerBlockY+2][playerBlockX]==0){
                        canFall = true;
                    }
                }
                if(canFall){
                    playerBlockY++;//落下させる
                }else{
                    //着地処理
                    if(blockDirection == 0){//横向きで着地
                        masu[playerBlockY][playerBlockX-1] = playerBlocks[0];
                        masu[playerBlockY][playerBlockX] = playerBlocks[1];
                        masu[playerBlockY][playerBlockX+1] = playerBlocks[2];
                    }else{//縦向きで着地
                        masu[playerBlockY-1][playerBlockX] = playerBlocks[0];
                        masu[playerBlockY][playerBlockX] = playerBlocks[1];
                        masu[playerBlockY+1][playerBlockX] = playerBlocks[2];
                    }
                    gameProc = GAME_STATE.FALL;//状態を落下処理へ
                }
            }

        gameTimer--;
        if(gameTimer <= 0){
            if(hiscore<score)hiscore=score;
            currentScene = SCENE.TIMEUP;
            return
        }
        break;//コントロールの処理はここまで






        case GAME_STATE.FALL://宙に浮いたブロックを落とす処理
            let hasFallen = false;//このフレームでブロックが落下したかどうかのフラグ
        //盤面の下から上に向かってチェックするのが重要
        for(let y=BOARD_ROWS-1; y>=1;y--){
            for(let x=1;x<=BOARD_COLS;x++){
                if(masu[y][x]>0&& masu[y+1][x]==0){
                    masu[y+1][x]=masu[y][x];
                    masu[y][x] = 0;
                    hasFallen = true;//ブロックが落下したことを記録
                }
            }
        }
        //もしこのフレームで一つもブロックが落下しなかったら
        if(hasFallen == false){
            gameProc = GAME_STATE.CHECK;//すべて着地したので、次のブロックを準備する状態へ
        }
        break;//FALLの処理はここまで




        case GAME_STATE.CHECK://次のブロックを準備する処理
        let erasedCount = 0;//消去されるブロックの数をカウント
        for(y=1;y<=BOARD_ROWS;y++){
            for(x=1;x<=BOARD_COLS;x++){
            let c = masu[y][x];
                if(c>0){
                if(c==masu[y-1][x] && c==masu[y+1][x]){
                    kesu[y][x]=1;kesu[y-1][x]=1;kesu[y+1][x]=1;}//縦にそろっている

                if(c==masu[y][x-1] && c==masu[y][x+1]){
                    kesu[y][x]=1;kesu[y][x-1]=1;kesu[y][x+1]=1;}//横にそろっている

                if(c==masu[y+1][x-1] && c==masu[y-1][x+1]){
                    kesu[y][x]=1;kesu[y+1][x-1]=1;kesu[y-1][x+1]=1;}//斜め／にそろっている

                if(c==masu[y-1][x-1] && c==masu[y+1][x+1]){
                    kesu[y][x]=1;kesu[y-1][x-1]=1;kesu[y+1][x+1]=1;}//斜め＼にそろっている
            }
                }
            }
            //消えるブロックの数を数える
            for(let y=1;y<=BOARD_ROWS;y++){
                for(let x=1;x<=BOARD_COLS;x++){
                    if(kesu[y][x]==1){
                        erasedCount++;
                        //消えることが確定したブロックの位置にエフェクトを発生
                        //升目の座標をピクセル座標に変換してaddEffect関数に渡す
                        addEffect(x*BLOCK_SIZE,y*BLOCK_SIZE);
                    }
                }
                
            }
            //消えるブロックがあればデリートなければネクスト状態へ
            if(erasedCount > 0){
                //スコア加算
                playSE(1);
                score += 50 * erasedCount * rensa *PLUS;
                //クリア判定
                if(score >= 50000){
                    if(hiscore < score) hiscore = score;
                    currentScene = SCENE.GAMECLEAR;
                    return;
                }
                //タイムボーナス(連鎖時のみ)
                if(rensa>1){    //最初の消去(連鎖１)ではボーナスなし
                    gameTimer += 2*TIME_BONUS_SECONDS * FPS_RATE;
                    }
                    //次の連鎖のために倍率を上げる
                    rensa *=2;
                    //削除状態へ移行
                gameProc = GAME_STATE.DELETE_;
            }else{
                gameProc = GAME_STATE.NEXT;
            }
            
            break;
            
        case GAME_STATE.DELETE_:
        //kesuフラグが1の場所のブロックを消す
        for(let y=1;y<=BOARD_ROWS;y++){
            for(let x=1;x<=BOARD_COLS;x++){
                if(kesu[y][x] ==1){
                    kesu[y][x] = 0;//フラグをリセット
                    masu[y][x] = 0;//ブロックを消す
                }
            }
        }
        //ブロックを消したら再度落下処理を行う(連鎖のため)
        gameProc = GAME_STATE.FALL;
        break;//デリーとここまで
        case GAME_STATE.NEXT://次のブロックを準備する処理
        //新しいブロックを準備する前にゲームオーバーかどうかチェック
        //新しいブロックんじょ出現位置(y=1,x=3,4,5)がすでに埋まっているか確認
        if(masu[1][3]>0||masu[1][4]>0||masu[1][5]>0){
            //埋まっている場合はゲームオーバー
            if(hiscore<score)hiscore=score;
            currentScene = SCENE.GAMEOVER;
            return;
        }
        //ゲームオーバーでなければここから通常処理
        //連鎖が途切れたので、倍率を初期値に
        rensa = 1;
               playerBlocks = nextBlocks.slice();//sliceをつかっえてゃい列をコピー
        //操作ブロックを、今までのネクストブロックにする
        //新しいネクストブロックをランダムに決める
        color =5;//ブロックの種類
        if(score >2000) color = 6;
        if(score >3000) color = 7;
        if(score >4000) color = 8;
        if(score >5000) color = 9;
        if(score >6000) color = 10;
        nextBlocks[0] = 1+rnd(color);//次のブロックセット
        nextBlocks[1] = 1+rnd(color);
        nextBlocks[2] = 1+rnd(color);
            if(gameTimer <=40*FPS_RATE&&SpeedUp == false){
                //落下速度を現在の1/3にする
                dropSpeed = Math.max(1,int(dropSpeed/3));
                //スピードアップしたことを記録する これによりこの処理はゲーム中一度しか実行されなくなる
                SpeedUp = true;
            }

        playerBlockX = 4;
        playerBlockY = 1;
        gameProc = GAME_STATE.CONTROL;//状態をプレイヤー捜査中に戻す
                //ブロックの向きも横向きに
        blockDirection = 0;
        break;//ネクストの処理ここまで
    } 
}

 //エフェクト関連の関数
                function addEffect(x,y){
                    effects[effectIndex].x = x;
                    effects[effectIndex].y = y;
                    effects[effectIndex].time = EFFECT_DURATION;
                    //effectIndexを１つ進める。最大数に達したら0にもどる
                    effectIndex = (effectIndex + 1)%EFFECT_MAX;
                }
                //発生してるすべてのエフェクトを描画する
function drawEffect(){
                    //線の太さを20に設定
                    lineW(20);

                    //すべてのエフェクトデータをチェック
                    for(const eff of effects){
                        //timeが0より大きいのエフェクトだけを描画
                        if(eff.time>0){
                            const t= eff.time;
                            //setAlpで透明度を設定、時間差で薄くなる
                            setAlp(t*5);
                            //sCirで円を描画　時間がたつと大きくなる
                            sCir(eff.x,eff.y,110-t*5,RAINBOW_COLORS[(t+2)%RAINBOW_COLORS.length]);
                            sCir(eff.x,eff.y,90-t*4,RAINBOW_COLORS[(t+3)%RAINBOW_COLORS.length]);
                            sCir(eff.x,eff.y,70-t*3,RAINBOW_COLORS[(t+4)%RAINBOW_COLORS.length]);
                            //残り時間を1減らす
                            eff.time--;
                        }
                    }
                    //描画が終わったら、透明度と線の太さを基に戻しておく
                    setAlp(100);
                    lineW(1);
}