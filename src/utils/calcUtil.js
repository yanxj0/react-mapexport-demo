import saveAs from 'file-saver';

export const getBase64Img = function (url, ext, width, height) {
    return new Promise((resolve) => {
        let canvas = document.createElement("canvas");   //创建canvas DOM元素
        let ctx = canvas.getContext("2d");
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = function () {
            let auto,
                devicePixelRatio = window.devicePixelRatio || 1,
                ratio = devicePixelRatio;
            // canvas.height = height; //指定画板的高度,自定义
            // canvas.width = width; //指定画板的宽度，自定义
            if (typeof auto === 'undefined') {
                auto = true;
            }
            // upscale the canvas if the two ratios don't match
            // if (auto && devicePixelRatio !== backingStoreRatio) {
            if (auto && devicePixelRatio) {
                let oldWidth = width;
                let oldHeight = height;
                canvas.width = oldWidth * ratio;
                canvas.height = oldHeight * ratio;
                canvas.style.width = oldWidth + 'px';
                canvas.style.height = oldHeight + 'px';
                // now scale the context to counter
                // the fact that we've manually scaled
                // our canvas element
                ctx.scale(ratio, ratio);
            }

            ctx.drawImage(img, 0, 0, width, height); //参数可自定义
            let dataURL = canvas.toDataURL("image/" + ext);
            canvas = null;
            // callback.call(this, dataURL); //回掉函数获取Base64编码
            resolve(dataURL);
        };
    })

}

const papers = {
    'A5': [148, 210],
    'A4': [210, 297],
    'A3': [297, 420],
    'A2': [420, 594],
    'A1': [594, 841],
    'A0': [841, 1189]
};
const margins = {
    'common': { 'top': 25.4, 'right': 31.8, 'bottom': 25.4, 'left': 31.8 },
    'Narrow': { 'top': 12.7, 'right': 12.7, 'bottom': 12.7, 'left': 12.7 },
    'Moderate': { 'top': 25.4, 'right': 19.1, 'bottom': 25.4, 'left': 19.1 },
    'Wide': { 'top': 25.4, 'right': 50.8, 'bottom': 25.4, 'left': 50.8 }
};

const calcInner = function (paper, direction, margin = 'Moderate') {
    let _p = papers[paper],
        _m = margins[margin],
        resArr = [];

    resArr.push(_p[0] - _m.top - _m.bottom);
    resArr.push(_p[1] - _m.right - _m.left);

    if (direction === 'H') {
        resArr.reverse();
    }
    return resArr;
};
/**
 * 获取模板内容尺寸
 * @param paper 模板
 * @param direction 方向
 * @param margin 边距
 * @param dpi  精度
 * @returns {object}
 */
export const getTemplateInnerSize = function (paper, direction, dpi, margin) {
    let inner = calcInner(paper, direction, margin);
    return { 'width': (inner[0] / 25.4 * dpi).toFixed(2), 'height': (inner[1] / 25.4 * dpi).toFixed(2) };
};

export const dataURItoBlob = function (dataURI) {
    let byteString = atob(dataURI.split(',')[1]);
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    let ab = new ArrayBuffer(byteString.length);
    let dw = new DataView(ab);
    for (let i = 0; i < byteString.length; i++) {
        dw.setUint8(i, byteString.charCodeAt(i));
    }
    return new Blob([ab], { type: mimeString });
};
export const downLoad = function(dataURI){
    const blob = dataURItoBlob(dataURI);
    saveAs(blob, +new Date() + '.png');
}

export const getContainerSize = function () {
    let container = document.getElementById('root');
    let width = parseInt(window.getComputedStyle(container).width.split('px')[0],10)*0.7;
    let height = parseFloat(window.getComputedStyle(container).height.split('px')[0]);
    return {
        width: width,
        height: height
    }
}