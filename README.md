# uploadFile
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
