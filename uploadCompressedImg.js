/**
 * @name: 前端压缩图片上传
 * @desc: 1M以下图片未做处理，原图上传，1M以上按压缩规则压缩上传
 * @example:
 *      $('dom').uploadImg({
 *           fileSize:1024*1024,    //图片大小，小于不压缩
 *           multiple: true,        //【可选】 ,默认false单文件上传
 *          ajaxData:{
 *                     url:xxxx,
 *                     type:"post"
 *                 },
 *            formData:{
 *                       caseId:11111,
 *                       sortId:1
 *                     },
 *            fileChange:function(){},   //【可选】 文件选中触发事件， 用于判断选中文件的个数是否超标
 *            fileSelected:function(){}, //【可选】 文件选中后，用于判断文件格式，文件大小是否符合
 *            uploadBefore:function(){}, //【可选】 文件上传之前，用于加载loading图片等
 *            uploadSuccess:function(){},    //上传成功
 *            uploadFail:function(){}，        //上传失败
 *    });
 *
 * 注意： $('dom')不用自带input
 * @depend: jQuery
 * @date: 2019/3/21
 * @author: lichunhui
 */

$.fn.extend({
    uploadImg: function (option) {
        var t = $(this);
        var defaults = {
            fileSize: 1024*1024,              //限制文件大小，小于不压缩，大于进行压缩，单位KB
            ratio: 1,                   //压缩比例
            ajaxData: {},               //ajax请求配置参数 url,type等
            formData:{},                // 上传的data
            multiple: false,            //文件单选多选
            inputStyle:{},
            defaultInputStyle:{
                width:0,
                height:0,
                "z-index":5,
                top:0,
                left:0,
                position:"absolute"
            },
            fileChange: null,
            fileSelected:null,
            uploadBefore: null,
            uploadSuccess:null,
            uploadFail:null,
            //maxSize: 10                 //文件最大值（单位MB）
        };
        var opt = $.extend({}, defaults, option);
//           图片压缩规则redmine#32426 压缩比例0.5
//           1： w,h都小于1280，不变
//           2：w/h<=2 并且 w或h>1280,取较大值=1280，较小值比例压缩
//           3：w/h>2  并且 w或H>1280 并且w或h<1280,不变
//           4：w/h>2  并且 wh都大于1280，取较小值为1280，较大值等比压缩

        var imgSizeFn = function (w, h) { //图片压缩后宽高
            if (w <= 1280 && h <= 1280) {
                return {w: w, h: h};
            } else if (w / h <= 2 && (w > 1280 || h > 1280)) {
                opt.ratio=(option.ratio!=1 ? option.ratio: 1);
                if (w > h) {
                    return {w: 1280, h: parseInt(h / w * 1280)};
                } else {
                    return {w: parseInt(w / h * 1280), h: 1280};
                }

            } else if (w / h > 2) {
                if (w > 1280 && h > 1280) {
                    opt.ratio=(option.ratio!=1 ? option.ratio: 1);
                    if (w > h) { //压缩规则第4条，宽高都大于1280时，取较小值为1280，经多次测试数据过大造成浏览器卡死崩溃，故更改为取较大值为1280，小值等比压缩
                        if(h/w*1280>500){   //如果h较小，但长度大于500，按宽1280等比压缩   （小值按1280算，ajax上传时报413 Request Entity Too Large）
                            return {w: 1280, h: parseInt(h / w * 1280)};
                        }else{//如果h小于500，按H500等比压缩
                            return {w: w*500/h, h: 500};
                        }
                    } else {
                        if(w/h*1280>500){   //如果h较小，但长度大于500，按宽1280等比压缩
                            return {w: parseInt(w / h * 1280), h: 1280};
                        }else{//如果h小于500，按H500等比压缩
                            return {w: 500, h: h*500/w};
                        }
                    }
                } else {
                    opt.ratio=(option.ratio!=1 ? option.ratio: 1);
                    return {w: w, h: h};
                }
            }
        };

        var width = $(this).width();
        var height = $(this).height();
        var _style = '';
        opt.inputStyle = $.extend({},opt.defaultInputStyle,opt.inputStyle);
        if(!opt.inputStyle.width){
            opt.inputStyle.width = width+"px";
        }
        if(!opt.inputStyle.height){
            opt.inputStyle.height = height+"px";
        }
        for(var item in opt.inputStyle){
            _style+= item+':'+opt.inputStyle[item]+";";
        }
        var appendDom = $('<input type="file" ' + (opt.multiple ? "multiple" : "") + ' style='+_style+' >');
        $(this).append(appendDom);

        var fileSelect = $(this).find('input[type=file]');

        fileSelect.on('change', function (eve) {
            var self = $(this);
            if (!this.files.length) return;
            if (typeof(opt.fileChange) == "function") {
                if(opt.fileChange(this)==false){
                    return false;
                }

            }
            var files = Array.prototype.slice.call(this.files);


            files.forEach(function (file, index) {
                var reader = new FileReader(),
                    img = new Image();
                /*
                * 文件选择确定后fn  此处判断文件类型，大小是否合规
                * **/
                if (typeof(opt.fileSelected) == "function") {
                    if(opt.fileSelected(file)==false){
                        return false;
                    }

                    //var fileSize = file.size / 1024; //单位KB
                    //
                    //if (!/^image\/(jpg|jpeg|png|gif)$/.test(file.type)) {
                    //    alert('只允许上传.jpg .jpeg .png .gif类型的图片文件');
                    //    return false;
                    //}
                    //if (fileSize > opt.maxSize * 1024) {
                    //    alert('文件不能大于10M');
                    //    return false;
                    //}
                }

                reader.readAsDataURL(file);
                /*
                 * 提交之前
                 * */
                if (typeof(opt.uploadBefore) == "function") {

                    if(opt.uploadBefore(file)==false){
                        return false;
                    }
                }
                reader.onload = function (e) {
                    img.src = e.target.result;
                    var formdata = getFormData();
                    var fileSize = file.size;
                    /*
                    * 判断filesize大小，小于1M不做处理直接上传，否则进行压缩（图片小时压缩后的大小比原文件大）
                    * */
                    if (fileSize < opt.fileSize) {
                        formdata.append((option.fileName?option.fileName:'uploadify'),file);
                        //其他参数
                        // for (var i in opt.formData) {
                        //  formdata.append(i, opt.formData[i]);
                        // }
                        uploadAction(formdata);
                    } else {
                        /*
                        * 此处需要在img onload之后，否则img的宽高为0，上传失败
                        * */
                        img.onload = function(){
                            var size = imgSizeFn(img.width, img.height);
                            self.after('<canvas width="' + size.w + '" height="' + size.h + '" style="opacity:0;visibility:hidden;position:absolute;"/>');
                            var canvas = self.siblings('canvas')[0];
                            var context = canvas.getContext('2d');

                            context.drawImage(img, 0, 0, img.width, img.height, 0, 0, size.w, size.h);
                            var result = canvas.toDataURL('image/png', opt.ratio);
                            fileSelect.val("");
                            var text = window.atob(result.split(",")[1]);
                            var buffer = new Uint8Array(text.length);
                            for (var i = 0; i < text.length; i++) {
                                buffer[i] = text.charCodeAt(i);
                            }
                            var blob = getBlob([buffer], 'image/png');
                            //var blob = dataURLtoBlob(result);
                            formdata.append((option.fileName?option.fileName:'uploadify'), blob, 'image.png');
                            //其他参数
                            // for (var i in opt.formData) {
                            //  formdata.append(i, opt.formData[i]);
                            // }
                            uploadAction(formdata);

                        }
                    }


                };
                function uploadAction(formdata){//上传
                    if(window.uploadCount>0){
                        // opt.formData.sortId = window.uploadCount+index+1;
                        opt.formData.sortId = window.uploadCount-files.length+index+1;
                    }else{
                        opt.formData.sortId = index+1;
                    }
                    for (var i in opt.formData) {
                        formdata.append(i, opt.formData[i]);

                    }
                    $.ajax({
                        url: opt.ajaxData.url,
                        data: formdata,
                        type: opt.ajaxData.type || "post",
                        processData: false,
                        contentType: false,
                        success: function (x) {
                            if (typeof(opt.uploadSuccess) == "function") {
                                opt.uploadSuccess(x,file)
                            }
                        },
                        error:function(){
                            if (typeof(opt.uploadFail) == "function") {
                                opt.uploadFail(file)
                            }
                        }
                    });
                }
                function dataURLtoBlob(dataurl) {
                    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                    while(n--){
                        u8arr[n] = bstr.charCodeAt(n);
                    }
                    return new Blob([u8arr], {type:mime});
                }
                /**
                 * 获取blob对象的兼容性写法
                 * @param buffer
                 * @param format
                 * @returns {*}
                 */
                function getBlob(buffer, format) {
                    try {
                        return new Blob(buffer, {type: format});
                    } catch (e) {
                        var bb = new (window.BlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder);
                        buffer.forEach(function (buf) {
                            bb.append(buf);
                        });
                        return bb.getBlob(format);
                    }
                }

                /**
                 * 获取formdata
                 */
                function getFormData() {
                    var isNeedShim = ~navigator.userAgent.indexOf('Android')
                        && ~navigator.vendor.indexOf('Google')
                        && !~navigator.userAgent.indexOf('Chrome')
                        && navigator.userAgent.match(/AppleWebKit\/(\d+)/).pop() <= 534;
                    return isNeedShim ? new FormDataShim() : new FormData()
                }

                /**
                 * formdata 补丁, 给不支持formdata上传blob的android机打补丁
                 * @constructor
                 */
                function FormDataShim() {
                    console.warn('using formdata shim');
                    var o = this,
                        parts = [],
                        boundary = Array(21).join('-') + (+new Date() * (1e16 * Math.random())).toString(36),
                        oldSend = XMLHttpRequest.prototype.send;
                    this.append = function (name, value, filename) {
                        parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="' + name + '"');
                        if (value instanceof Blob) {
                            parts.push('; filename="' + (filename || 'blob') + '"\r\nContent-Type: ' + value.type + '\r\n\r\n');
                            parts.push(value);
                        }
                        else {
                            parts.push('\r\n\r\n' + value);
                        }
                        parts.push('\r\n');
                    };
                    // Override XHR send()
                    XMLHttpRequest.prototype.send = function (val) {
                        var fr,
                            data,
                            oXHR = this;
                        if (val === o) {
                            // Append the final boundary string
                            parts.push('--' + boundary + '--\r\n');
                            // Create the blob
                            data = getBlob(parts);
                            // Set up and read the blob into an array to be sent
                            fr = new FileReader();
                            fr.onload = function () {
                                oldSend.call(oXHR, fr.result);
                            };
                            fr.onerror = function (err) {
                                throw err;
                            };
                            fr.readAsArrayBuffer(data);
                            // Set the multipart content type and boudary
                            this.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
                            XMLHttpRequest.prototype.send = oldSend;
                        }
                        else {
                            oldSend.call(this, val);
                        }
                    };
                }

            });
        });
        return this;
    }
});
