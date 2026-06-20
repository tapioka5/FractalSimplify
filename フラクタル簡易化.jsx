"use strict";

(function (thisObj) {

    // =========================
    // ウィンドウ作成
    // =========================
    var win = (thisObj instanceof Panel)
        ? thisObj
        : new Window("palette", "フラクタル簡易化");
    $.global.fractalSimpleWin = win;

    // =========================
    // スライダー作成関数
    // =========================
    function createSlider(parent, labelText, initVal, minVal, maxVal) {
        var group = parent.add("group");
        group.orientation = "column";
        group.alignChildren = ["left", "center"];

        // ラベル
        var label = group.add("statictext", undefined, labelText);
        label.preferredSize.width = 100;

        // スライダー行
        var sliderGroup = group.add("group");
        sliderGroup.orientation = "row";

        // スライダー
        var slider = sliderGroup.add("slider", undefined, initVal, minVal, maxVal);
        slider.preferredSize.width = 150;

        // 数値表示
        var valueText = sliderGroup.add("statictext", undefined, Math.round(initVal));
        valueText.preferredSize.width = 40;

        // 動的更新
        slider.onChanging = function () {
            valueText.text = Math.round(slider.value);
        };
        return {
            slider: slider,
            valueText: valueText
        };
    }

    // =========================
    // スライダー生成
    // =========================
    var contrastSlider = createSlider(win, "コントラスト：", 100, 0, 999);
    var brightnessSlider = createSlider(win, "明るさ：", 0, -100, 100);
    var subSlider = createSlider(win, "サブ影響：", 70, 0, 100);

    // =========================
    // 入力ボックス
    // =========================
    var group2 = win.add("group");
    group2.orientation = "row";
    group2.alignChildren = ["left", "center"];

    var inputGroup = win.add("group");
    inputGroup.orientation = "row";
    inputGroup.alignment = ["center", "center"];
    inputGroup.add("statictext", undefined, "複雑度");
    var complexityInput = inputGroup.add("edittext", undefined, "1");
    complexityInput.preferredSize.width = 40;

    complexityInput.onChange = function () {

        //数値取得、数値変換
        var aVal = parseInt(complexityInput.text, 10);

        if (isNaN(aVal)) {
            complexityInput.text = "1";
        }
        else if (aVal < 1) {
            complexityInput.text = "1";
        }
        else if (aVal > 20) {
            complexityInput.text = "20";
        }
    };

    // =========================
    // ドロップダウン
    // =========================
    var optionGroup = group2.add("group");
    optionGroup.orientation = "row";
    var timeDropdown = optionGroup.add("dropdownlist", undefined, ["time*10", "time*50", "time*100"]);
    var exprCheck = group2.add("checkbox", undefined, "適用する");
    exprCheck.value = false;
    timeDropdown.selection = 0;
    timeDropdown.preferredSize.width = 100;

    // 適用ボタン
    var applyButton = win.add("button", undefined, "適用");
    applyButton.preferredSize.width = 60;
    applyButton.alignment = ["center", "center"];

    // =========================
    // ボタン処理
    // =========================
    //エラー対策
    applyButton.onClick = function () {
        //プロジェクト存在確認
        if (!app.project) {
            alert("プロジェクトが開かれていません");
            return;
        }

        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem) ||
            comp.selectedLayers.length === 0) {
            alert("レイヤーを選択してください");
            return;
        }

        var aVal = parseInt(complexityInput.text, 10);
        if (isNaN(aVal)) {
            alert("数字を入れてください");
            return;
        }

        if (aVal < 1 || aVal > 20) {
            alert("１以上２０以下の数字を入れてください");
            return;
        }

        // =========================
        // Undoグループ開始
        // =========================
        app.beginUndoGroup("フラクタル簡易化");
        var activeLayer = comp.selectedLayers[0];

        //エフェクト適用可能なレイヤーか判定
        if (!(activeLayer instanceof AVLayer)) {
            alert("このレイヤーにはエフェクトを追加できません");
            app.endUndoGroup();
            return;
        }

        var effects = activeLayer.property("ADBE Effect Parade");
        var fractal = effects.property("ADBE Fractal Noise");
        if (!fractal) {
            fractal = effects.addProperty("ADBE Fractal Noise");
        }

        //プロパティ取得
        var keyDelete4 = fractal.property("ADBE Fractal Noise-0004");
        var keyDelete5 = fractal.property("ADBE Fractal Noise-0005");
        var keyDelete17 = fractal.property("ADBE Fractal Noise-0017");

        //キーフレーム判定、削除
        while (keyDelete4.numKeys > 0) {
            keyDelete4.removeKey(1);
        }
        while (keyDelete5.numKeys > 0) {
            keyDelete5.removeKey(1);
        }
        while (keyDelete17.numKeys > 0) {
            keyDelete17.removeKey(1);
        }

        // =========================
        //処理
        // =========================
        //数値取得
        //スライダー
        var cVal = Math.round(contrastSlider.slider.value);
        var bVal = Math.round(brightnessSlider.slider.value);
        var sVal = Math.round(subSlider.slider.value);

        //エクスプレッション
        var eVal = timeDropdown.selection.text;

        //スライダー出力
        try { fractal.property("ADBE Fractal Noise-0004").setValue(cVal); } catch (e) { }
        try { fractal.property("ADBE Fractal Noise-0005").setValue(bVal); } catch (e) { }
        try { fractal.property("ADBE Fractal Noise-0017").setValue(sVal); } catch (e) { }

        //複雑度出力
        try { fractal.property("ADBE Fractal Noise-0015").setValue(aVal); } catch (e) { }

        //エクスプレッション出力
        if (exprCheck.value) {
            try { fractal.property("ADBE Fractal Noise-0023").expression = eVal; } catch (e) { }
        }

        //Undoグループ終了
        app.endUndoGroup();
    };

    // =========================
    // 表示
    // =========================
    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }

})(this);