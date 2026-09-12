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
    var complexityInput = inputGroup.add("edittext", undefined, "6");
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

        var activeLayer = comp.selectedLayers[0];

        //エフェクト適用可能なレイヤーか判定
        if (!(activeLayer instanceof AVLayer)) {
            alert("このレイヤーにはエフェクトを追加できません");
            return;
        }

        // =========================
        // Undoグループ開始
        // =========================
        app.beginUndoGroup("フラクタル簡易化");
        try {
            var effects = activeLayer.property("ADBE Effect Parade");
            var fractal = effects.property("ADBE Fractal Noise");
            if (!fractal) {
                fractal = effects.addProperty("ADBE Fractal Noise");
            }

            //プロパティ取得
            var contrastProp = fractal.property("ADBE Fractal Noise-0004");
            var brightnessProp = fractal.property("ADBE Fractal Noise-0005");
            var complexityProp = fractal.property("ADBE Fractal Noise-0015");
            var subInfluenceProp = fractal.property("ADBE Fractal Noise-0017");

            //キーフレーム判定、削除
            while (contrastProp.numKeys > 0) {
                contrastProp.removeKey(1);
            }
            while (brightnessProp.numKeys > 0) {
                brightnessProp.removeKey(1);
            }
            while (complexityProp.numKeys > 0) {
                complexityProp.removeKey(1);
            }
            while (subInfluenceProp.numKeys > 0) {
                subInfluenceProp.removeKey(1);
            }

            // =========================
            //処理
            // =========================
            //数値取得
            var cVal = Math.round(contrastSlider.slider.value);
            var bVal = Math.round(brightnessSlider.slider.value);
            var sVal = Math.round(subSlider.slider.value);

            //値の出力
            contrastProp.setValue(cVal);
            brightnessProp.setValue(bVal);
            complexityProp.setValue(aVal);
            subInfluenceProp.setValue(sVal);

            //エクスプレッション出力
            if (exprCheck.value) {
                fractal.property("ADBE Fractal Noise-0023").expression = timeDropdown.selection.text;
            }

        } finally {
            //Undoグループ終了
            app.endUndoGroup();
        }
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