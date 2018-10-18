/**
 * Created by kangly on 2017/9/1.
 */

//检查项
function comm_check(field){
    $('.fieldtip').remove();
    var isTrue = true;
    if(field){
        var f = field.split(',');
        for(var i in f){
            var obj = $('#'+f[i]);
            if(obj.val() == ''){
                isTrue = false;
                var fieldtip = $('<span class="fieldtip"><i class="icon-caret-left"></i> 需要填写哦！</span>');
                obj.after(fieldtip);
                var lab = $(obj).parent().parent().find('label');
                if(lab.html())
                    tip(lab.html()+' 需要填写哦！',5);
            }
        }
    }
    if(!isTrue)
        return false;
    else
        return true;
}

//通用提交
function submitform(field,debug,callback,url){
    submittheform('form1',field,callback,url);
}

function submittheform(formId,field,callback,url){
    if(!comm_check(field))
        return false;

    if(op_start('提交中...')){
        $('#'+formId).ajaxSubmit({success: function (data) {
            op_end();
            if(data && data.errcode==0){
                if(data.errcode==0){
                    tip_success('添加/修改成功！',5);
                    if(url){
                        sformback(url);
                    }else{
                        callback && callback(data);
                    }
                }else{
                    tip(data.errmsg,8);
                }
            }else if (data == 'success'){
                tip_success('添加/修改成功！',5);
                if(url){
                    sformback(url);
                }else{
                    callback && callback(data);
                }
            }
            else if(data>0)
            {
                tip_success('添加/修改成功！',5);
                if(url){
                    sformback(url);
                }else{
                    callback && callback(data);
                }
            }
            else if(data){
                if(!isJson(data))
                    tip_error(data);
            }
            else{
                tip_error('添加/修改失败，请稍后再试');
            }
        }});
    }
}

function isJson(obj){
    var isjson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
    return isjson;
}

function isString(obj){
    return Object.prototype.toString.call(obj) === "[object String]"
}

function isFunction(obj){
    return typeof(obj)=='function' && Object.prototype.toString.call(obj)==='[object Function]'
}

//手机验证
function isMobile(s)
{
    //var reg=/^((13[0-9])|(15[^4,\D])|(18[0,5-9]))\d{8}$/;
    var reg=/^1\d{10}$/;
    if (!reg.exec(s)) {
        return false;
    }
    return true;
}

function isEmail(s){
    var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
    if(!reg.test(s))
    {
        return false;
    }
    return true;
}

function isEmpty(obj){
    var data = $('#'+obj).val();
    if (data == undefined || data == 'undefined' || data==''){
        return true;
    }
    return false;
}

function loading(str, time){
    var loading = $('#loading');
    if (loading.length<=0){
        loading = $('<div id="loading"><img style="margin-right: 5px;" src="/Public/img/ajax-loader.gif"> <span>加载中</span></div>');
        $('body').append(loading);
    }
    if(str) loading.find('span').html(str);
    $('#loading').css({'position':"fixed", 'background':"#F74D4D", 'color':"#FFF", 'font-size':"12px", padding:'3px 30px'});
    $('#loading').css({'text-align':'center', 'min-width':'150px', "z-index":9999, 'border-radius':'0px 0px 5px 5px'});
    var _windowWidth = $(window).width(),//获取当前窗口宽度
        _popupWeight = loading.width(),//获取弹出层宽度
        _popupHeight = loading.height(),//获取弹出层高度
        _posiLeft = (_windowWidth - _popupWeight)/2;
    $('#loading').css({"left": _posiLeft + "px","top":-_popupHeight-20 + "px"});//设置position
    $('#loading').animate({top:0},200);
}

function _loading(){
    var _popupHeight = $('#loading').height();//获取弹出层高度
    $('#loading').animate({top:-_popupHeight -20},500);
}

function tip_error(msg_or_json, time, closeFunc){
    if(!msg_or_json){
        msg_or_json = '操作失败';
    }

    if(!time || time<=0){
        time = 10;
    }

    if(!isFunction(closeFunc)){
        closeFunc = null;
    }

    tip(msg_or_json,time,null,closeFunc,'error');
}

function tip_success(msg_or_json, time, closeFunc){
    if(!msg_or_json){
        msg_or_json = '操作成功';
    }

    if(!time || time<=0){
        time = 4;
    }

    if(!isFunction(closeFunc)){
        closeFunc = null;
    }

    tip(msg_or_json,time,null,closeFunc,'success');
}

function tip_message(msg_or_json, time, closeFunc){
    if(!msg_or_json){
        tip_error('消息提示调用异常',5);
        return;
    }

    if(!time || time<=0){
        time = 600;
    }

    if(!isFunction(closeFunc)){
        closeFunc = null;
    }

    tip(msg_or_json,time,null,closeFunc,'message');
}

function tip(msg_or_json, time, url, closeFunc, tip_type){
    time = time?time*1000:2000;

    var str = '';

    if(isString(msg_or_json)){
        str = msg_or_json;
    }
    else if(isJson(msg_or_json))
    {
        if(msg_or_json.err_text){
            str = msg_or_json.err_text;
        }
    }

    var class_name = 'info';
    if(tip_type=='success'){
        class_name = 'success';
    }else if(tip_type=='error'){
        class_name = 'error';
    }else if(tip_type=='alarm'){
        class_name = 'alarm';
    }else if(tip_type=='message'){
        class_name = 'message';
    }

    var tip_title = '操作提示';
    if(tip_type=='success'){
        tip_title = '操作成功';
    }else if(tip_type=='error'){
        tip_title = '操作异常';
    }else if(tip_type=='alarm'){
        tip_title = '招蜜提醒';
    }else if(tip_type=='message'){
        tip_title = '新消息通知';
    }

    var _unique_id = $.gritter.add({
        title:	tip_title,
        text:	str ,
        time: time,
        class_name: class_name,
        after_open: function(e){},
        before_close:function(e){
            if(closeFunc){
                closeFunc();
            }
            if(url){
                setTimeout(function(){
                    window.location.href = url;
                },800);
            }
        },
        after_close:function(e){}
    });

    if(tip_type=='alarm'){
        _alarm_tip_id = _unique_id;
    }

    return _unique_id;
}

function tip_end(){
    $.gritter.removeAll();
}

function _show_top_loading(){
    $('#top_loading_mark').fadeIn('fast');
}
function _hide_top_loading(){
    $('#top_loading_mark').fadeOut('fast');
}

var _operate_is_processing = 0;
function op_start(text){
    if(!text || text==''){
        text = '提交中...';
    }

    if(_operate_is_processing==0)
    {
        _operate_is_processing = tip(text,100,null,function(){
            _operate_is_processing = 0;
        });
        _show_top_loading();

        return true;
    }
    else
    {
        tip('上次操作未结束',2);
        return false;
    }
}

function op_end(){
    $.gritter.remove(_operate_is_processing);
    _operate_is_processing = 0;
    _hide_top_loading();
}

uuid = function() {
    var id = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
    return id.replace('-','');
};

$.extend({
    password: function (length, special) {
        var iteration = 0;
        var password = "";
        var randomNumber;
        if(special == undefined){
            var special = false;
        }
        while(iteration < length){
            randomNumber = (Math.floor((Math.random() * 100)) % 94) + 33;
            if(!special){
                if ((randomNumber >=33) && (randomNumber <=47)) { continue; }
                if ((randomNumber >=58) && (randomNumber <=64)) { continue; }
                if ((randomNumber >=91) && (randomNumber <=96)) { continue; }
                if ((randomNumber >=123) && (randomNumber <=126)) { continue; }
            }
            iteration++;
            password += String.fromCharCode(randomNumber);
        }
        return password;
    }
});

String.prototype.replaceAll = function(reallyDo, replaceWith, ignoreCase) {
    if (!RegExp.prototype.isPrototypeOf(reallyDo)) {
        return this.replace(new RegExp(reallyDo, (ignoreCase ? "gi": "g")), replaceWith);
    } else {
        return this.replace(reallyDo, replaceWith);
    }
};

var _ue_default_toolbar1 = [['source', 'undo', 'redo', 'bold','fontsize','underline','superscript','subscript', 'forecolor', 'backcolor','indent','justifyleft','justifyright','justifycenter','justifyjustify','insertorderedlist','insertunorderedlist']];
var _ue_default_toolbar2 = [['source', 'undo', 'redo', 'bold','fontsize','underline','superscript','subscript', 'forecolor', 'backcolor','link', 'removeformat','indent','justifyleft','justifyright','justifycenter','justifyjustify','insertorderedlist','insertunorderedlist','insertimage']];
function _gen_ueditor(objId,width,height,options){
    if(!objId || objId==''){
        alert('编辑器初始化失败');
    }
    if(!width || width<=0){
        width = 640;
    }
    if(!height || height<=0){
        height = 150;
    }
    UE.delEditor(objId);

    if(!options){
        options = {};
    }

    if(!options.initialFrameHeight){
        options.initialFrameHeight = height;
    }
    if(!options.initialFrameWidth){
        options.initialFrameWidth = width;
    }
    if(!options.toolbars){
        options.toolbars = _ue_default_toolbar1;
    }
    if(!options.autoHeightEnabled){
        options.autoHeightEnabled = false;
    }
    if(!options.pasteplain){
        options.pasteplain = false;
    }
    if(!options.enableAutoSave){
        options.enableAutoSave = false;
    }
  
    options.autoClearEmptyNode = false;

    options.whitList = {
            a:      ['target', 'href', 'title', 'class', 'style','id'],
            abbr:   ['title', 'class', 'style'],
            address: ['class', 'style'],
            area:   ['shape', 'coords', 'href', 'alt'],
            article: [],
            aside:  [],
            audio:  ['autoplay', 'controls', 'loop', 'preload', 'src', 'class', 'style'],
            b:      ['class', 'style'],
            bdi:    ['dir'],
            bdo:    ['dir'],
            big:    [],
            blockquote: ['cite', 'class', 'style'],
            br:     [],
            caption: ['class', 'style'],
            center: [],
            cite:   [],
            code:   ['class', 'style'],
            col:    ['align', 'valign', 'span', 'width', 'class', 'style'],
            colgroup: ['align', 'valign', 'span', 'width', 'class', 'style'],
            dd:     ['class', 'style','id','name'],
            del:    ['datetime'],
            details: ['open'],
            div:    ['class', 'style','id','name'],
            dl:     ['class', 'style','id','name'],
            dt:     ['class', 'style','id','name'],
            em:     ['class', 'style','id','name'],
            font:   ['color', 'size', 'face','id','name'],
            footer: [],
            h1:     ['class', 'style','id','name'],
            h2:     ['class', 'style','id','name'],
            h3:     ['class', 'style','id','name'],
            h4:     ['class', 'style','id','name'],
            h5:     ['class', 'style','id','name'],
            h6:     ['class', 'style','id','name'],
            header: [],
            hr:     [],
            i:      ['class', 'style','id','name'],
            img:    ['src', 'alt', 'title', 'width', 'height', 'id', '_src', 'loadingclass', 'class', 'data-latex','name'],
            ins:    ['datetime','id','name'],
            li:     ['class', 'style','id','name'],
            mark:   [],
            nav:    [],
            ol:     ['class', 'style','id','name'],
            p:      ['class', 'style','id','name'],
            pre:    ['class', 'style','id','name'],
            s:      [],
            section:[],
            small:  [],
            span:   ['class', 'style','id','name'],
            sub:    ['class', 'style','id','name'],
            sup:    ['class', 'style','id','name'],
            strong: ['class', 'style','id','name'],
            table:  ['width', 'border', 'align', 'valign', 'class', 'style','id','name'],
            tbody:  ['align', 'valign', 'class', 'style','id','name'],
            td:     ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style','id','name'],
            tfoot:  ['align', 'valign', 'class', 'style','id','name'],
            th:     ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style','id','name'],
            thead:  ['align', 'valign', 'class', 'style','id','name'],
            tr:     ['rowspan', 'align', 'valign', 'class', 'style','id','name'],
            tt:     [],
            u:      [],
            ul:     ['class', 'style','id','name'],
            video:  ['autoplay', 'controls', 'loop', 'preload', 'src', 'height', 'width', 'class', 'style','id','name']
    };

    return UE.getEditor(objId, options);
}

function loadKeyData(pid,selectObjId,defaultVal,callback)
{
    var load_params = {};
    if(pid>0){
        load_params.pid = pid;
    }
    $.ajax({
        dataType:"json",
        type: "GET",
        url: '/home/collect/load_key_data',//固定访问地址和格式
        data: load_params,
        success: function(json){
            var obj = $("#"+selectObjId);
            obj.html('<option value="0">请选择省市</option>');
            var select_id = '';
            if(json){
                for(var i=0;i<json.length;i++){
                    var data = json[i];
                    var select_status = '';
                    if(data.areaid==defaultVal){
                        select_status = 'selected';
                        select_id = data.areaid;
                    }
                    obj.append("<option data-id='"+data.areaid+"' value='"+data.areaid+"' "+select_status+">"+data.areaname+"</option>");
                }
            }
            obj.trigger('change');

            if(callback){
                callback(select_id);
            }
        }
    });
}

function loadCategory(module_id,pid,selectObjId,defaultVal,callback)
{
    var load_params = {
        module_id:module_id
    };
    if(pid>0){
        load_params.pid = pid;
    }
    $.ajax({
        dataType:"json",
        type: "GET",
        url: '/home/collect/load_module_category',//固定访问地址和格式
        data: load_params,
        success: function(json){
            var obj = $('#'+selectObjId);
            obj.html('<option value="0">请选择</option>');
            var select_id = '';
            if(json){
                for(var i=0;i<json.length;i++){
                    var data = json[i];
                    var select_status = '';
                    if(data.catid==defaultVal){
                        select_status = 'selected';
                        select_id = data.catid;
                    }
                    obj.append("<option data-id='"+data.catid+"' data-text='"+data.catname+"' value='"+data.catid+"' "+select_status+">"+data.catname+"</option>");
                }
            }
            obj.trigger('change');

            if(callback){
                callback(select_id);
            }
        }
    });
}

//回车事件
function _add_enter_event(obj_id, event_function){
    $('#'+obj_id).bind('keypress',function(e){
        var ev = document.all ? window.event : e;
        if(ev.keyCode==13) {
            if(event_function){
                event_function();
                return false;
            }
        }
    });
}

//去除空白字符,并重新赋值
function _trim_assign(obj){
    var new_content = $.trim(obj.val());
    if(new_content!=''){
        obj.val(new_content);
    }
    return new_content;
}

//联动加载省市
function loadArea(prefix){
    if(typeof prefix == 'undefined'){
        prefix = '';
    }
    var area1_id = $('#'+prefix+'area1 > option:selected').attr('data-id');
    if(area1_id>0){
        loadKeyData(area1_id,prefix+'area2',$('#'+prefix+'area2_name').val());
    }else{
        $('#'+prefix+'area2').html('');
    }
}