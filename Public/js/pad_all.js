$(document).ready(function(){
	$('.data-table').dataTable({
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		"sDom": '<""l>t<"F"fp>'
	});

	$('input[type=checkbox],input[type=radio],input[type=file]').uniform();

	$('select').select2();

	$("span.icon input:checkbox, th input:checkbox").click(function() {
		var checkedStatus = this.checked;
		var checkbox = $(this).parents('.widget-box').find('tr td:first-child input:checkbox');
		checkbox.each(function() {
			this.checked = checkedStatus;
			if (checkedStatus == this.checked) {
				$(this).closest('.checker > span').removeClass('checked');
			}
			if (this.checked) {
				$(this).closest('.checker > span').addClass('checked');
			}
		});
	});
});

//数据列表检索排序字符串保存的键值(值以$.data的方式保存在_current_tab_page_id对应的对象上)
var _pad_adv_filter_id = "_pad_adv_filter_id";
//数据列表检索条件数据
var _pad_search_params_id = "_pad_search_params_id";
//页面初次加载时保存参数
var _pad_page_base_params_id = "_pad_page_base_params_id";
var _pad_grid_page_size = "gridPageSize";

/**
*@param {string} url 完整的URL地址
*@returns {object} 自定义的对象
*@description 用法示例：
*	var myURL = parseURL('http://abc.com:8080/dir/index.html?id=255&m=hello#top');
*	myURL.file='index.html'
*	myURL.hash= 'top'
*	myURL.host= 'abc.com'
*	myURL.query= '?id=255&m=hello'
*	myURL.params= Object = { id: 255, m: hello }
*	myURL.path= '/dir/index.html'
*	myURL.segments= Array = ['dir', 'index.html']
*	myURL.port= '8080'
*	yURL.protocol= 'http'
*	myURL.source= 'http://abc.com:8080/dir/index.html?id=255&m=hello#top'
*/
function _pad_all_parseURL(url) {
	var a =  document.createElement('a');
	a.href = url;
	return {
		  source: url,
		protocol: a.protocol.replace(':',''),
		    host: a.hostname,
		    port: a.port,
		   query: a.search,
		  params: (function(){
		    var ret = {},
		        seg = a.search.replace(/^\?/,'').split('&'),
		        len = seg.length, i = 0, s;
		    for (;i<len;i++) {
		        if (!seg[i]) { continue; }
		        s = seg[i].split('=');
		        ret[s[0]] = s[1];
		    }
		    return ret;
		  })(),
		  	file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
		    hash: a.hash.replace('#',''),
		    path: a.pathname.replace(/^([^\/])/,'/$1'),
		relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
		segments: a.pathname.replace(/^\//,'').split('/')
	};
}

//给指定元素加载内容
function _p_a_load(url,pageContainerId,keepParams,data,callBack, isGridInit){
	_pad_all_loadPage(url,pageContainerId,keepParams,data,callBack, isGridInit);
}

//keepParams 是否保留container上缓存的参数，首次加载时一般为false
function _pad_all_loadPage(url,pageContainerId,keepParams,data,callBack, isGridInit)
{
	if(typeof(pageContainerId)=='string'){
		if(pageContainerId.substring(0,1)=='#')
			pageContainerId = pageContainerId.substring(1);
	}

	var containerObj = find_jquery_object(pageContainerId);

	if(!data)
	{
		data = {};
	}

	var initPageSize = containerObj.attr(_pad_grid_page_size);
	if(initPageSize && initPageSize>0){
		//有初始化containerObj 中grid的pageSize
		data = _pad_add_param_to_post_data(data,'gridPageSize',initPageSize);
	}

	//将容器id传入到action的loadPageId，在页面初始化脚本中可以使用
    if(url.indexOf('loadPageId')==-1 && (!data || !data.loadPageId) && (typeof(data)!='string'||data.indexOf('loadPageId')==-1)){
        data = _pad_add_param_to_post_data(data,'loadPageId',pageContainerId);
    }

	if(isGridInit && data){
		containerObj.data(_pad_search_params_id, data);
	}

	if(!keepParams)
		_pad_clear_container_old_data(pageContainerId);

	var pageBaseParams = containerObj.data(_pad_page_base_params_id);

	//2018-05-27 参数先不从url中获取
	/*var param_idx = url.indexOf('?');
	if(param_idx!=-1)
	{
		var param_idx_2 = url.indexOf('#');

		var params_str = '';
		if(param_idx_2!=-1){
			params_str = url.substring(param_idx+1,param_idx_2);
		}else{
			params_str = url.substring(param_idx+1);
		}
		url = url.substring(0,param_idx);

		if(params_str.length>0){
			if(!data){
				data = {};
			}else if(Object.prototype.toString.call(data) === "[object String]"){
				params_str = params_str + '&' + data;
				data = {};
			}

			var param_arr = params_str.split('&');
			for(pi=0;pi<param_arr.length;pi++){
				var p_key_val = param_arr[pi].split('=');
				if(p_key_val.length>1){
					data[p_key_val[0]] = p_key_val[1];
				}
			}
		}
	}*/

	if(!pageBaseParams && data){
		pageBaseParams = data;
	}else{
		pageBaseParams = _pad_mergeJsonObject(pageBaseParams, data);
	}
	containerObj.data(_pad_page_base_params_id, pageBaseParams);

	$.ajax({
		url:url ,
		type: "post",
		data: pageBaseParams,
		cache:false,
		success:function(html){
			if(html && isJson(html)){
				//返回错误异常
				if(html.err_text){
					tip_error(html.err_text);
					_hide_top_loading();
				}
				return;
			}

			_pad_add_pageInfo_to_loadPageHtml(html, pageContainerId, url);

			//处理如果html中有grid，为grid加上containerId
			var tempIdx1 = html.indexOf('<table');
			if(tempIdx1!=-1){
				tempIdx1 = tempIdx1 + 6;
				var tempIdx2 = html.indexOf('>',tempIdx1);
				var tempIdx3 = html.indexOf('table',tempIdx1);
				if(tempIdx3!=-1 && tempIdx3< tempIdx2){
					//尝试准确的定位"table.table:first"的table
					html = html.substring(0,tempIdx1) + ' containerId="#'+pageContainerId+'"' + html.substring(tempIdx1);
				}
			}

			containerObj.html(html);

			containerObj.trigger('new_content_load');

			//添加输入框相关效果,如 必填 等等
			_pad_add_input_element(containerObj);

			_update_pager_click_event(containerObj);

			var anyGrid = _pad_findGridByContainerId(pageContainerId);

            if(anyGrid.length>0){
                add_event_for_jm_table(anyGrid);
            }

			//添加详情弹层事件
			_pad_add_detail_view_event(pageContainerId);


			//添加clearable输入框清楚按键
			_pad_add_clearable_input_btn(pageContainerId);

			if(callBack){
				callBack(pageContainerId);
			}
		}
	}).always(function(){});
}

function _pad_all_reload_my_container(obj,more_parems,callback)
{
	var jobj = find_jquery_object(obj);

	var parent_container = jobj.parents('.tab-pane.active');

	_pad_all_reloadPage(parent_container.attr('id'), more_parems, callback);
}

function _pad_all_reloadPage(pageContainerId,more_parems,callback)
{
	var container = find_jquery_object(pageContainerId);

	if(container)
	{
		var url = container.attr('content_url');

		_pad_all_loadPage(url, pageContainerId, true, more_parems, callback);
	}
}

function _pad_all_set_active_tab_title(title, pageContainerId){

	var more = '';
	if(pageContainerId && pageContainerId!=''){
		more = '[href="#'+pageContainerId+'"]';
	}

	var tab = $('.nav-tabs > li.active > a'+more);
	if(tab.length>0){
		tab.text(title);
	}
}

function _pad_add_detail_view_event(containerId){

	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;
	var container = $(containerId);

	container.find('.pop_detail_view').each(function(){
		var obj = $(this);
		var data_id = obj.attr('data_id');
		if(data_id && data_id!=''){
			obj.addClass('on');

			if(obj.is('.guwen')){
				obj.click(function(){
					view_guwen_details($(this).attr('data_id'));
				});
			}else if(obj.is('.cdd')){
				obj.click(function(){
					view_cdd_details($(this).attr('data_id'));
				});
			}else if(obj.is('.job')){
				obj.click(function(){
					view_job_details($(this).attr('data_id'));
				});
			}else if(obj.is('.company')){
				obj.click(function(){
					view_company_details($(this).attr('data_id'));
				});
			}
		}
	});
}

function _pad_add_clearable_input_btn(containerId){

	var container = find_jquery_object(containerId);

	container.find('input.clearable').each(function(){
		$(this).wrap('<div class="clearable_container"></div>');
		var clear_btn = $('<i class="icon-remove clear_btn"></i>');
		clear_btn.click(function(){
			$(this).prev('input').val('');
		});
		$(this).after(clear_btn);
	});
}

function add_event_for_jm_table(gridTable){

    var gridContainerId = gridTable.attr('containerId');
    add_event_for_jm_table_sort(gridContainerId);
}

function add_event_for_jm_table_sort(containerId){

    if(containerId.substring(0,1)!='#')
        containerId = '#' + containerId;

    var container = $(containerId);

    var page_params = container.data(_pad_page_base_params_id);


    if(page_params && page_params.sort_column){
        var on_sorting = container.find('[sort_column="'+page_params.sort_column+'"]');
        if(on_sorting.length==1){
            on_sorting.attr('sort_type', page_params.sort_type);
        }
    }

    container.find('.tab_sorter').each(function(){
        var column = $(this);
        var sort_column = column.attr('sort_column');
        if(sort_column!=''){

            var column_table = column.parents('[content_url]:first');

            var sort_type = column.attr('sort_type');

            column_table.removeClass('icon-sort-up icon-sort-down');
            if(sort_type=='asc'){
                column.addClass('icon-sort-up');
            }else if(sort_type=='desc'){
                column.addClass('icon-sort-down');
            }else{
                column.addClass('icon-sort');
            }

            column.unbind('click').bind('click',function(){
				_show_top_loading();

                var thiscolumn = $(this);
                var thissort = thiscolumn.attr('sort_column');
                var thistype = thiscolumn.attr('sort_type');
                if(thiscolumn.is('.icon-sort-down'))
                {
                    thistype = 'asc';
                }
                else if(thiscolumn.is('.icon-sort-up'))
                {
                    thistype = '';
                }
                else
                {
                    thistype = 'desc';
                }
                thiscolumn.attr('sort_type',thistype);

                var table_id = column_table.attr('id');
                var table_url = column_table.attr('content_url');
                var params = column_table.data(_pad_page_base_params_id);
                if(!params){
                    params = {};
                }

                params = _pad_add_param_to_post_data(params,'sort_column',thissort);
                params = _pad_add_param_to_post_data(params,'sort_type',thistype);

                _p_a_load(table_url, table_id, null, params, function(){
					_hide_top_loading();
				});
            });
        }
    });

}

function _update_pager_click_event(container){
	var pagerObjs = container.find('.pagination.in_tab');

	pagerObjs.each(function(){
		$(this).find('a').each(function() {
			$(this).click(function (event) {
				var url = $(this).attr('href');

				_pad_all_loadPage(url,container.attr('id'),true);

				return false;//阻止链接跳转
			});
		});
	});
}

var _pad_temp_input_id_idx = 1;
function _pad_add_input_element(container){
	var mustObjs = container.find('.must_input');
	mustObjs.each(function(){
		var inputId = _pad_check_temp_id_to_jobj($(this));
		var miGroup = _pad_check_input_group_parent($(this));

		var miSign = $('<i class="icon-warning-sign mi_sign" title="必填"> 必填</i>');
		miSign.attr('input_id',inputId);
		$(this).after(miSign);
		miSign.click(function(){
			$(this).removeClass('shake');
		});
	});

	var clearAbleObjs = container.find('.clear_able');
	clearAbleObjs.each(function(){
		var inputId = _pad_check_temp_id_to_jobj($(this));
		var miGroup = _pad_check_input_group_parent($(this));

		var inner_btn_clear = $('<span class="input_inner_btn icon-remove red"></span>');
		inner_btn_clear.attr('input_id',inputId);
		$(this).after(inner_btn_clear);

		miGroup.hover(
			function(){
				inner_btn_clear.show();
			}
			,function(){
				inner_btn_clear.hide();
			}
		);
		inner_btn_clear.click(function(e){
			e.stopPropagation();
			e.preventDefault();
			var targetId = $(this).attr('input_id');
			var targetObj = $('#'+targetId);
			targetObj.prop("value",'');
			//targetObj.val('');
			targetObj.removeData();
		});
	});

	var _cp_colorPicker = $('#_cp_color_select_div');
	if(_cp_colorPicker.length>0){
		var colorableObjs = container.find('.color_picker');
		colorableObjs.each(function(){
			var inputId = _pad_check_temp_id_to_jobj($(this));
			$(this).click(function(e){
				e.stopPropagation();
				e.preventDefault();
				_cp_showColorPicker($(this));
			});
		});
	}
}

function _pad_check_temp_id_to_jobj(jobj){
	var inputId = jobj.attr('id');
	if(!inputId || inputId==''){
		inputId = 'input_temp_id_'+_pad_temp_input_id_idx;
		_pad_temp_input_id_idx ++;
		jobj.attr('id',inputId);
	}
	return inputId;
}

function _pad_check_input_group_parent(jobj){
	var parent = jobj.parent();
	var retobj = null;

	if(parent.is('.mi_group')){
		retobj = parent;
	}else{
		retobj = $('<div class="mi_group"></div>');
		jobj.wrap(retobj);
	}
	return jobj.parent();
}

function _pad_check_must_input_value(containerId){
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;

	var container = $(containerId);
	var mustObjs = container.find('.must_input');

	var check_ret = true;
	mustObjs.each(function(){
		if($(this).is('input[type="text"]')){
			if($(this).val()==''){
				check_ret = false;
				_pad_mi_sign_shake($(this));
			}else{
				$(this).next('.mi_sign').removeClass('shake');
			}
		}else if($(this).is('select')){
			if($(this).val()==''){
				check_ret = false;
				_pad_mi_sign_shake($(this));
			}else{
				$(this).next('.mi_sign').removeClass('shake');
			}
		}
	});
	return check_ret;
}

function _pad_mi_sign_shake(shakeInput){
	var placeHolder = shakeInput.attr('placeholder');
	_show_page_error('操作提示','有必填项未填写  '+placeHolder,1500);
	var signObj = shakeInput.next('.mi_sign');
	if(signObj.length>0){
		signObj.addClass('shake');
		for(var i=0;i<10;i++){
			signObj.stop().animate({top:"3px",opacity:"0.6"},150).animate({top:"5px",opacity:"1"},150);
		}
	}
}

function _pad_clear_container_old_data(containerId){
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;

	var container = $(containerId);

	container.attr('content_url','');
	//不去掉就没法设置pageSize
	//container.removeAttr(_pad_grid_page_size);
	container.removeAttr('pageNo');

	container.removeData(_pad_adv_filter_id);
	container.removeData(_pad_search_params_id);
	container.removeData(_pad_page_base_params_id);

	try{
		container.removeData(_grid_row_selected_row_ids);
	}catch(e){}

	try{
		//页面暂时没有这个逻辑，vix中有
		//_all_gridSearchClear(containerId);
	}catch(e){
		alert(e);
	}
}

function _pad_findGridByContainerId(containerId){
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;
	var containerObj = $(containerId);
	var anyGrid = containerObj.find('table.table:first');

	if(anyGrid.length>0){
		var ori_containerId = anyGrid.attr('containerId');

		if(!ori_containerId || ori_containerId==''){
			anyGrid.attr('containerId',containerId);
		}
	}

	return anyGrid;
}

function _pad_bind_grid_sort_event(containerId){
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;

	var sortableTable = $(containerId);
	if(!sortableTable.is('table.sort-able'))
		sortableTable = sortableTable.find('table.sort-able');

	if(sortableTable.length==0)
		return;

	var gridAdvFilterStr = $(containerId).data(_pad_adv_filter_id);
	var lastColumn = '';
	var lastSort = '';
	if(gridAdvFilterStr && gridAdvFilterStr.length>0){
		var advStrs = gridAdvFilterStr.split(',');
		for(var ti = 0;ti<advStrs.length;ti++){
			var advStr = advStrs[ti];
			if(advStr.indexOf('__')==-1){
				var csf = advStr.split('_');
				lastColumn = csf[0];
				lastSort = csf[1];
				break;
			}
		}
	}

	sortableTable.each(function(){
		var sortTd = $(this).find('thead td[sColumn]');
		if(sortTd.length==0)
			sortTd = $(this).find('thead th[sColumn]');
		sortTd.each(function(){
			var title = $(this).text();
			var sortColumn = $(this).attr('sColumn');
			var sortLink = $('<a href="javascript:void(0);" class="sort-link"></a>');
			sortLink.attr('sColumn',sortColumn);
			sortLink.attr('sort','');
			sortLink.text(title);
			sortLink.append('<i></i>');
			$(this).html(sortLink);

			if(sortColumn == lastColumn){
				sortLink.attr('sort',lastSort);
				_pad_add_grid_sort_icon(sortLink);
			}

			//set sort event
			sortLink.bind('click',function(){

				var sort = sortLink.attr('sort');
				if(sort==''){
					sort = "asc";
					sortLink.attr('sort',sort);
				}else if(sort=='asc'){
					sort = "desc";
					sortLink.attr('sort',sort);
				}else{
					sort = '';
					sortLink.attr('sort',sort);
				}

				_pad_add_grid_sort_icon($(this));

				_pad_set_sort_column_by_grid(containerId,$(this));

				_pad_pager_goPage(containerId, 1);
			});
		});
	});
}

function _pad_add_grid_sort_icon(sortLink){
	var sort = sortLink.attr('sort');
	if(sort=='asc'){
		sortLink.find('i:first').removeClass('icon-caret-down');
		sortLink.find('i:first').addClass('icon-caret-up');
	}else if(sort=='desc'){
		sortLink.find('i:first').removeClass('icon-caret-up');
		sortLink.find('i:first').addClass('icon-caret-down');
	}else{
		sortLink.find('i:first').removeClass('icon-caret-up');
		sortLink.find('i:first').removeClass('icon-caret-down');
	}
}

//使用高级搜索的逻辑处理用户点击排序
function _pad_set_sort_column_by_grid(containerId,sortColumn){
	var column = sortColumn.attr('sColumn');
	var sort = sortColumn.attr('sort');

	var gridAdvFilterStr = $(containerId).data(_pad_adv_filter_id);
	if(gridAdvFilterStr && gridAdvFilterStr.length>0)
	{
		//忽略其他排序设置
		gridAdvFilterStr = gridAdvFilterStr.replace('_asc_','__');
		gridAdvFilterStr = gridAdvFilterStr.replace('_desc_','__');
		var temp = ',' + gridAdvFilterStr;
		var findKey = ','+column+'_'
		var idx = temp.indexOf(findKey);
		if(idx!=-1){
			var oldStr = ',' + column + '__';
			var newStr = ',' + column + '_' + sort + '_';
			temp = temp.replace(oldStr, newStr);
			gridAdvFilterStr = temp.substring(1);
		}else{
			gridAdvFilterStr = gridAdvFilterStr + ',' + column + '_' + sort + '_';
		}
	}else{
		gridAdvFilterStr = column+'_'+sort+'_';
	}
	$(containerId).data(_pad_adv_filter_id, gridAdvFilterStr);
}

function _pad_add_pageInfo_to_loadPageHtml(jqHtml, pageContainerId, url){
	var container = find_jquery_object(pageContainerId);
	container.attr('content_url',url);
}

function _pad_reload_my_container(contentId){
	var container = $('#'+contentId).parent();
	var containerId = container.attr('id');
	var url = container.attr('content_url');

	_pad_all_loadPage(url,containerId,true);
}

function _pad_reload_content_page(){
	var container = $('#'+resource_page_content_container_id);
	var containerId = container.attr('id');
	var url = container.attr('content_url');

	_pad_all_loadPage(url,containerId,true);
}

//给grid添加pager信息及今后的事件扩展
//pagerJsonStr 是java代码中pager的genPagerInfoJsonStr方法获取的字符串
function _pad_init_grid_event(gridTable, pagerJsonStr){
	if(!gridTable)
		return;
	if(gridTable instanceof jQuery){
	}else{
		if(gridTable.substring(0,1)!='#')
			gridTable = '#' + gridTable;
		gridTable = $(gridTable);
	}

	var pagerJson = eval('('+pagerJsonStr+')');
	var gridContainerId = gridTable.attr('containerId');

	var tfoot = $('<tfoot></tfoot>');
	var tfootTr = $('<tr></tr>');
	var tfootTd = $('<td></td>');
	var tfootTdColspan = gridTable.find('thead > tr:first').children().length;
	tfootTd.attr('colspan',tfootTdColspan);
	var tfootTdId =  gridTable.attr('id') + '_pager';
	tfootTd.attr('id',tfootTdId);

	tfootTr.append(tfootTd);
	tfoot.append(tfootTr);
	gridTable.append(tfoot);

	_pad_add_grid_pager(tfootTdId, gridContainerId, pagerJson);
}

function _pad_add_grid_refresh_btn(gridTable){
	var gridContainerId = gridTable.attr('containerId');

	//在_pad_all_loadPage方法中给所有grid加上了refresh-able
	if(gridTable.is('.refresh-able')){
		var refreshBtn = gridTable.find('.table-refresh-btn');
		if(refreshBtn.length==0){
			refreshBtn = $('<div class="table-refresh-btn"><i class="icon-refresh"></i></div>');
			gridTable.append(refreshBtn);
		}
		refreshBtn.click(function(){_pad_grid_loadPage(gridContainerId);});
		gridTable.hover(
			function(){
				//var refBtn = $(this).children('.table-refresh-btn:first');
				if(refreshBtn.not('.show')){
					refreshBtn.addClass('show');
					refreshBtn.stop().fadeIn();
				}
			},
			function(){
				//var refBtn = $(this).children('.table-refresh-btn:first');
				if(refreshBtn.is('.show')){
					refreshBtn.removeClass('show');
					refreshBtn.stop().fadeOut();
				}
			}
		);
	}
}

//处理数据列表的pager及搜索
function _pad_add_grid_pager(putInId, gridContainerId, pagerInfo){
	var pagerBody = $('<div class="pagination"></div>');
	var pagerStep = $('<ul class="pager"></ul>');
	var pagerList = $('<ul></ul>');
	var pagerInfoDiv = $('<span class="pager_info grey"></span>');
	pagerBody.append(pagerStep);
	pagerBody.append(pagerList);
	pagerBody.append(pagerInfoDiv);

	var prevStep = $('<li class="previous"><a href="javascript:_pad_pager_goPage(\''+gridContainerId+'\','+pagerInfo.prePage+')">&larr;上一页</a></li>');
	if(pagerInfo.isFirstPage==1)
		prevStep.addClass('disabled');
	pagerStep.append(prevStep);

	var nextStep = $('<li class="next"><a href="javascript:_pad_pager_goPage(\''+gridContainerId+'\','+pagerInfo.nextPage+')">下一页&rarr;</a></li>');
	if(pagerInfo.isLastPage==1)
		nextStep.addClass('disabled');
	pagerStep.append(nextStep);

	var listFirst = $('<li><a href="javascript:_pad_pager_goPage(\''+gridContainerId+'\',1)"><i class="icon-double-angle-left"></i></a></li>');
	if(pagerInfo.isFirstPage==1)
		listFirst.addClass('disabled');
	pagerList.append(listFirst);

	for(i=pagerInfo.pagerStart;i<=pagerInfo.pagerEnd;i++)
	{
		var listNum = $('<li><a href="javascript:_pad_pager_goPage(\''+gridContainerId+'\','+i+')">'+i+'</a></li>');
		if(pagerInfo.pageNo==i)
			listNum.addClass('active');
		pagerList.append(listNum);
	}

	var listEnd = $('<li><a href="javascript:_pad_pager_goPage(\''+gridContainerId+'\','+pagerInfo.pageCount+')"><i class="icon-double-angle-right"></i></a></li>');
	if(pagerInfo.isLastPage==1)
		listEnd.addClass('disabled');
	pagerList.append(listEnd);

	pagerInfoDiv.html('共 '+pagerInfo.totalCount+' 条记录');


   $('#'+putInId).html('');
   $('#'+putInId).append(pagerBody);
}

function _pad_pager_goPage(containerId, pageNo){
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;
	//将新页码添加到信息中
	$(containerId).attr('pageNo',pageNo);

	_pad_grid_loadPage(containerId);
}

function _pad_grid_search(containerId,params){
	_pad_grid_loadPage(containerId,params);
}

function _pad_grid_loadPage(containerId,params)
{
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;

	//params 是列表上方检索条件的值
	//如果params有效，则判断为点击搜做按键，pageNo条件清空,从新记录检索条件
	if(!params){
		var savedParam = $(containerId).data(_pad_search_params_id);
		if(!savedParam)
			params = {};
		else
			params = savedParam;
	}else{
		//保存检索条件
		$(containerId).data(_pad_search_params_id, params);
		//kill pageNo attribute
		$(containerId).attr('pageNo','1');
	}

	//处理高级搜索、排序（导出）处产生的设定
	var gridAdvFilterStr = $(containerId).data(_pad_adv_filter_id);
	if(gridAdvFilterStr && gridAdvFilterStr.length>0)
	{
		//将params清空，即如果有高级搜索条件，忽略普通搜索
		//params = {};
		params = combineParams(params,gridAdvFilterStr);

		params['advFilterStr'] = gridAdvFilterStr;
	}

	//处理页面加载原始参数，其实可以与search_params合并处理
	var page_base_params = $(containerId).data(_pad_page_base_params_id);
	if(page_base_params){
		params = _pad_mergeJsonObject(page_base_params, params);
	}

	//处理当前pageNo
	var reloadUrl = $(containerId).attr('content_url');
	var pageNo = $(containerId).attr('pageNo');
	if(!pageNo)
		pageNo = 1;

	//set pageNo to post attribute 'page'
	params.page=pageNo;

	_pad_all_loadPage(reloadUrl,containerId,true,params);
}

function _pad_mergeJsonObject(baseData, newData){
	if(!baseData)
		return newData;
	if(!newData)
		return baseData;

    var resultJsonObject={};
    for(var attr in baseData){
        resultJsonObject[attr]=baseData[attr];
    }
    for(var attr in newData){
        resultJsonObject[attr]=newData[attr];
    }

    return resultJsonObject;
}

function combineParams(params, advFilterStr){
	if(!advFilterStr || advFilterStr=='')
		return params;

	var newParams = {};
	if(params){
		for(var paramKey in params){
			var keyMark = paramKey + '_';
			if(advFilterStr.length<=keyMark.length || advFilterStr.substring(0,keyMark.length)!=keyMark){
				newParams[paramKey] = params[paramKey];
			}
		}
	}

	newParams['advFilterStr'] = advFilterStr;

	return newParams;
}

//左侧菜单点击处理
function _sidebar_menu_activeMenu(sidebar_menu_activedObj){
	if(sidebar_menu_activedObj.length>0){
		$('#sidebar ul.nav-list').find('li.active').each(function(){
			if(!$(this).hasClass('open'))
				$(this).removeClass('active');
		});

		var sidebar_menu_activedParentLi = sidebar_menu_activedObj.parent();
		var sidebar_menu_activedParentUl = sidebar_menu_activedParentLi.parent();

		var sidebar_menu_actived_text = sidebar_menu_activedObj.text();
		var sidebar_menu_actived_url = sidebar_menu_activedObj.attr('page');

		if(sidebar_menu_activedParentUl.hasClass('submenu')){
			//点击的是二级菜单
			var sidebar_menu_activedUpLevelLi = sidebar_menu_activedParentUl.parent();
			if(!sidebar_menu_activedUpLevelLi.hasClass('open')){
				sidebar_menu_activedParentUl.siblings('a.dropdown-toggle:first').trigger('click');
				sidebar_menu_activedUpLevelLi.addClass('open active');
			}else{
				sidebar_menu_activedUpLevelLi.addClass('active');
			}
			sidebar_menu_activedUpLevelLi.siblings('li.open').each(function(){
				$(this).children('a.dropdown-toggle:first').trigger('click');
				$(this).removeClass('active');
			});

			var sidebar_menu_actived_parent_text = sidebar_menu_activedUpLevelLi.find('.menu-text:first').text();

			_breadcrumbs_clear();
			_breadcrumbs_setText(sidebar_menu_actived_parent_text);
			_breadcrumbs_setText(sidebar_menu_actived_text,sidebar_menu_actived_url);

		}else{
			//点击的是一级菜单
			sidebar_menu_activedParentLi.siblings('li.open').each(function(){
				$(this).children('a.dropdown-toggle:first').trigger('click');
				$(this).removeClass('active');
			});

			_breadcrumbs_clear();
			_breadcrumbs_setText(resource_text_index_page);
			_breadcrumbs_setText(sidebar_menu_actived_text,sidebar_menu_actived_url);
		}
		sidebar_menu_activedParentLi.addClass('active');

		_breadcrumbs_bindEvent();

		var sidebar_menu_pageUrl = sidebar_menu_activedObj.attr('page');
		if(sidebar_menu_pageUrl!='' && sidebar_menu_pageUrl!='#'){
			_pad_all_loadPage(sidebar_menu_pageUrl,resource_page_content_container_id,false,null,function(pageContainerId){
			});
		}
	}
}

//清楚面包屑内容
function _breadcrumbs_clear(){
	$('#breadcrumbUL').html('');
}

//设定面包屑，根据调用顺序累加名称
function _breadcrumbs_setText(text,textUrl){
	var _breadcrumbs_container = $('#breadcrumbUL');
	var _breadcrumbs_text_li_list = _breadcrumbs_container.children('li');
	var nowIndex = _breadcrumbs_text_li_list.length;

	var _breadcrumbs_html = '<li>';

	if(nowIndex==0){
		_breadcrumbs_html += '<i class="icon-home home-icon"></i>';
	}else{
		_breadcrumbs_text_li_list.last().append('<span class="divider"><i class="icon-angle-right arrow-icon"></i></span>');
	}

	if(textUrl && textUrl.length>0){
		_breadcrumbs_html += '<a ';
		if(nowIndex>0)
			_breadcrumbs_html += 'class="bc_s_link" ';
		_breadcrumbs_html += ' href="javascript:void(0);" page="' + textUrl + '" >' + text + '</a>';
	}else{
		_breadcrumbs_html += text;
	}

	_breadcrumbs_html += '</li>';

	_breadcrumbs_container.append(_breadcrumbs_html);
}

function _breadcrumbs_bindEvent(){
	$('#breadcrumbs a.bc_s_link').bind('click',function(){
		var bc_url = $(this).attr('page');
		_pad_all_loadPage(bc_url,resource_page_content_container_id);
	});
}

function _show_page_notice(title,text,time){
	if(!time)
		time="1500";
	$.gritter.add({
		title: title,
		text: text,
//		image: $path_assets+'/avatars/avatar.png',
		sticky: false,
		time: time,
		class_name: 'gritter-light'
	});
}

function _show_page_error(title,text,time){
	if(!time)
		time="4000";
	$.gritter.add({
		title: title,
		text: text,
//		image: $path_assets+'/avatars/avatar.png',
		sticky: false,
		time: time,
		class_name: 'gritter-light gritter-error'
	});
}

var _ready_to_paste = 0;
//添加input事件，只允许输入整数和小数
function _pad_addInputCheckNumEvent(obj,onlyInteger){

	var jObj = find_jquery_object(obj);

	if(jObj==null || jObj.length==0){
		//2017-03-31 去掉提示,错误调用并没有什么影响
		//alert('数字输入框初始化条件异常');
		return;
	}


	if(onlyInteger){
		jObj.keyup(function(event){
			$(this).val(fix_only_num($(this).val()));
		}).blur(function(event){
			$(this).val(fix_only_num($(this).val()));
		}).focus(function() {
			this.style.imeMode = 'disabled';
		});

		return;
	}

	jObj.keydown(function(event) {
        var keyCode = event.which;

		if(keyCode==17 || keyCode==224)
		{
			_ready_to_paste = 1;
			return true;
		}else if(keyCode==86 && _ready_to_paste==1){
			_ready_to_paste = 0;
			return true;
		}

        var oldVal = $(this).val();
		if(keyCode==9){
			return true;
		}
        if(onlyInteger && keyCode == 190)
        	return false;
        if(oldVal.indexOf('.')>0 && keyCode == 190)
        	return false;
        if(oldVal=='' && keyCode == 190)
        	return false;
        if (keyCode == 46 || keyCode == 8 || keyCode == 190 || (keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105) || keyCode == 110) {
            return true;
        }else {
			return false;
		}
    }).focus(function() {
        this.style.imeMode = 'disabled';
    }).keyup(function(event){
		if(isNaN($(this).val())){
			$(this).val('');
		}
	});
}

function fix_money_input(obj, can_minus){
	var jObj = find_jquery_object(obj);

	if(jObj && jObj.length>0)
	{
		jObj.keyup(function(event){
			var val = $(this).val();
			if(can_minus){
				val = val.replace(/[^\d\.\-]+/g,'');
			}else{
				val = val.replace(/[^\d\.]+/g,'');
			}
			$(this).val(val);
		}).blur(function(event){
			var val = $(this).val();
			if(can_minus){
				val = val.replace(/(\-?\.\d{2})\d*$/,'\$1');
			}else{
				val = val.replace(/(\.\d{2})\d*$/,'\$1');
			}
			$(this).val(val);
		}).focus(function() {
			this.style.imeMode = 'disabled';
		});
	}
}

function fix_only_num(value){
	return value.replace(/[^\d]/g,'');
}


function find_jquery_object(obj){
	var jObj = null;
	//check if obj is just id
	if(obj instanceof jQuery){
		jObj = obj;
	}else{
		if(typeof(obj)=='string'){
			if(obj.substring(0,1)!='#')
				obj = '#' + obj;
			jObj = $(obj);
		}else{
			jObj = $(obj);
		}
	}

	return jObj;
}

//使用nestable样式添加tep_book_leibie
function genNestableEle(jsonList,idStr){
	var listObj = $('<ol class="dd-list"></ol>');
	for(var i=0;i<jsonList.length;i++){
		var data = jsonList[i];

		var itemLi = $('<li class="dd-item"></li>');
		itemLi.attr('data-id',data.id);

		var item = $('<div class="dd2-content"></div>');
		var myId = 'id' + idMark;
		item.attr('id',myId);
		var myIdLevel = idStr + myId;
		idMark ++;
		item.attr('idLevel',myIdLevel);
		item.text(data.title);

		itemLi.append(item);
		if(data.children && data.children.length>0){
			itemLi.append(genNestableEle(data.children, myIdLevel + '-'));
		}

		listObj.append(itemLi);
	}

	return listObj;
}

function switchFormToTextView(containerSelector){
	_pad_switchFormToTextView(containerSelector);
}

function _pad_switchFormToTextView(containerSelector){
	$(containerSelector).find("label.control-label").each(function(){
		var textView = $('<span class="view_text">：</span>');
		$(this).append(textView);
	});

	$(containerSelector).find("input[type='text']").each(function(){
		var parent = $(this).parent();
		var textView = $('<span class="view_text"></span>');
		textView.html($(this).val());
		parent.append(textView);
	});

	$(containerSelector).find("input[type='radio']").each(function(){
		if($(this).attr('checked')&&$(this).attr('checked')=='checked'){
			var parent = $(this).parent();
			var textView = $('<span class="view_text"></span>');
			textView.html($(this).val());
			parent.append(textView);
		}
	});


	$(containerSelector).find("select option:selected").each(function(){
		var parent = $(this).parent().parent();
		var textView = $('<span class="view_text"></span>');
		textView.html($(this).html());
		parent.append(textView);
	});

	$(containerSelector).find("div.wysiwyg-editor").each(function(){
		var parent = $(this).parent();
		var textView = $('<span class="view_text"></span>');
		textView.html($(this).html());
		parent.append(textView);
	});
}

function openBlank(action,data){
    var form = $("<form/>").attr('action',action).attr('method','post');
    form.attr('target','_blank');
    var input = '';
    $.each(data, function(i,n){
        input += '<input type="hidden" name="'+ i +'" value="'+ n +'" />';
    });
    form.append(input).appendTo("body").css('display','none').submit();
    form.remove();
}

function exportGridData(containerId, exportType){
	if(containerId.substring(0,1)!='#')
		containerId = '#' +containerId;
	var advFilterStr = $(containerId).data(_pad_adv_filter_id);

	var url = resource_padall_tep_url_base + '/wxp/wxpWorkAction!exoprtExcelData.action';

	openBlank(url,{advFilterStr:advFilterStr,exportType:exportType});
}

function _pad_loadSubSchoolForTeacher(selectObj,relSchoolId){
	selectObj.html('');
	var url = resource_padall_tep_url_base + '/tep/tepSchoolAction!loadSubSchoolData.action?schoolId='+relSchoolId;
	$.ajax({
		url:url ,
		type: "post",
		data: 'json',
		cache:false,
		success:function(json){
			var dataList = json.rows;
			if(dataList && dataList.length>0){
				$.each(dataList,function(idx,item){
					var option = $('<option></option>');
					option.attr('value',item.id);
					option.text(item.mingcheng);
					selectObj.append(option);
				});
			}
		}
	});
}

function _pad_loadSubKd(parentSel, subSel, subVal, callBackFunc)
{
	if(parentSel.substring(0,1)!='#')
		parentSel = '#'+parentSel;
	if(subSel.substring(0,1)!='#')
		subSel = '#'+subSel;

	var parentObj = $(parentSel);
	var subObj = $(subSel);

	subObj.html('');
	var pid = parentObj.find('option:selected').attr('kdId');
	if(!pid || pid=='')
		return;

	var url = resource_padall_tep_url_base + '/tep/tepWorkAction!getSubKeyDataList.action?kdPid='+pid;
	$.ajax({
		url:url ,
		type: "post",
		data: 'json',
		cache:false,
		success:function(json){
			var dataList = json;

			if(dataList && dataList.length>0){
				if(subObj.is('.default_empty')){
					var option = $('<option>&nbsp;</option>');
					option.attr('value','');
					subObj.append(option);
				}
				$.each(dataList,function(idx,item){
					var option = $('<option></option>');
					option.attr('value',item.dataValue);
					option.text(item.dataTitle);
					option.attr('kdId',item.id);
					subObj.append(option);
				});
				if(subVal && subVal.length>0){
					subObj.val(subVal);
				}else{
					var initVal = subObj.attr('initVal');
					if(initVal && initVal.length>0){
						subObj.val(initVal);
					}
				}
			}
			subObj.attr('initVal','');
			subObj.trigger('change');

			if(callBackFunc)
				callBackFunc(subObj.val());
		}
	});
}

/**
 * 将txtObj内容同步到hiddenObj
 * 目前只测试了div（contentEditable=true）
 * 可设置绑定字数限制
 */
function _pad_bind_div_text_limit_event(txtObj, hiddenObj, lengthLimit, callBack){
	if(!txtObj || txtObj.length==0){
		return;
	}

	if(lengthLimit && lengthLimit>0)
		txtObj.attr('maxlength',lengthLimit);
	else{
		var tempLimit = txtObj.attr('maxlength');
		if(!tempLimit || tempLimit=='')
			txtObj.attr('maxlength',0);
	}

	if(!hiddenObj || hiddenObj.length==0 || !hiddenObj.is('input[type="hidden"]')){
		var hiddenPartner = $('<input type="hidden" id="_txt_limit_content_partner" />');
		txtObj.attr('hidden-obj-id','_txt_limit_content_partner');
		txtObj.parent().append(hiddenPartner);
	}else{
		if(hiddenObj.attr('id')=='')
			hiddenObj.attr('id','_txt_limit_content_partner');
		txtObj.attr('hidden-obj-id',hiddenObj.attr('id'));
	}

	txtObj.bind('DOMSubtreeModified',function(){
		//DOMNodeInserted DOMSubtreeModified DOMNodeRemoved
		var textRemain = _pad_div_text_limit_check($(this));

		if(callBack)
			callBack(textRemain);
	});

	_pad_div_text_limit_check(txtObj);
}

function _pad_div_text_limit_check(txtObj){
	var maxLimit = txtObj.attr('maxlength');
	var hiddenObjId = txtObj.attr('hidden-obj-id');
	var hiddenObj = $('#'+hiddenObjId);

	if(maxLimit && maxLimit>0){
		var textCount = _pad_div_text_limit_text_count(txtObj);
		var textRemain = maxLimit - textCount;
		//alert(maxLimit+'   '+textCount)
		if(textRemain<0){
			var hiddenContent = hiddenObj.val();
			var hiddenTextCount = _pad_div_text_limit_text_count($('<div>'+hiddenContent+'</div>'));

			var oriOverflow = txtObj.attr('oriOverflow');
			//如果初始值已经超出范围
			if(oriOverflow && oriOverflow=='1'){
				if(textCount <= hiddenTextCount){
					hiddenObj.val(txtObj.html());
				}else{
					txtObj.html(hiddenContent);
					textCount = _pad_div_text_limit_text_count(txtObj);
				}
			}else{
				//隐藏值（初始值）已经是超出内容长度限制
				if(hiddenTextCount>maxLimit){
					//本意是不截取，扔设定为超长内容，然后可以删，不能加，但是有光标定位问题，无法正常删除，暂时使用截取
					hiddenContent = hiddenContent.substring(0,maxLimit);
					//txtObj.attr('oriOverflow','1');
				}
				txtObj.html(hiddenContent);
				textCount = _pad_div_text_limit_text_count(txtObj);
			}

			textRemain = maxLimit - textCount;

			if(textRemain<0)
				textRemain = 0;
		}else{
			txtObj.attr('oriOverflow','0');
			hiddenObj.val(txtObj.html());
		}

		return textRemain;
	}else{
		hiddenObj.val(txtObj.html());
		return 0;
	}
}
function _pad_div_text_limit_text_count(obj){
	var imgCount = obj.find('img').length;
	var textCount = obj.text().length;
	return imgCount + textCount;
}

//scripts for zTree begin

function _pad_refreshTreeSelectedNote(treeDomId){
	if(!treeDomId||treeDomId=='')
		treeDomId = "tree_root";
	var myTree = $.fn.zTree.getZTreeObj(treeDomId);

	if(!myTree)
		return;
	//var selectedNode = myTree.getNodeByTId($("#selectIdTreeId").val());
	var nodes = myTree.getSelectedNodes();

	if(!nodes || nodes.length==0){
		myTree.reAsyncChildNodes(null,"refresh");
		return;
	}

	var selectedNode = nodes[0];
	if(!selectedNode){
		myTree.reAsyncChildNodes(null,"refresh");
	}else{
		if(selectedNode.isParent){
			myTree.reAsyncChildNodes(selectedNode,"refresh");
		}else{
			var parentTreeId = selectedNode.parentTId;
			if(parentTreeId){
				var parentNode = myTree.getNodeByTId(parentTreeId);
				myTree.reAsyncChildNodes(parentNode,"refresh");
			}else{
				myTree.reAsyncChildNodes(null,"refresh");
			}
		}
	}
}
//scripts for zTree end

//scripts for keywords inputing tag show and value save, begin
function _pad_bind_keywords_input_event(inputObj,hiddenObj,tagDiv,initOnce){
	if(!inputObj || inputObj.length==0)
		return;
	if(!hiddenObj || hiddenObj.length==0)
		return;
	if(!tagDiv || tagDiv.length==0)
		return;

	inputObj.bind('keypress',function(e){
		var ev = document.all ? window.event : e;
	    if(ev.keyCode==13) {
	    	var newVal = $(this).val();
	    	if($.trim(newVal)=='')
	    		return;

	    	var mkObj = hiddenObj;
	    	var mkVal = mkObj.val();
	    	if(mkVal!='')
	    		mkObj.val(mkVal + ',' + newVal);
	    	else
	    		mkObj.val(newVal);

	    	_pad_keywords_make_tag_show(hiddenObj,tagDiv);

	    	$(this).val('');
	    }
	});

	if(initOnce){
    	_pad_keywords_make_tag_show(hiddenObj,tagDiv);
	}
}

function _pad_keywords_make_tag_show(hiddenObj,tagDiv){
	var mkObj = hiddenObj;
	var mkVals = mkObj.val();
	if(!mkVals || mkVals=='')
		return;

	var tagDiv = tagDiv;
	tagDiv.html('');
	var tags = mkVals.split(',');
	for(i=0;i<tags.length;i++){
		var tagHtml = $('<span class="tag"></span>');
		tagHtml.text(tags[i]);
		var tagClose = $('<button class="close" type="button">×</button>');
		tagClose.click(function(){
			$(this).parent().remove();
			_pad_keywords_reset_hidden_by_tag(hiddenObj,tagDiv);
		});
		tagHtml.append(tagClose);
		tagDiv.append(tagHtml);
	}
}

function _pad_keywords_reset_hidden_by_tag(hiddenObj,tagDiv){
	var tags = tagDiv.find('span.tag');
	var retStr = '';
	tags.each(function(i){
		var temp = $('<div></div>');
		temp.html($(this).html());
		var btn = temp.find('.close');
		btn.remove();
		retStr = retStr + ',' + temp.text();
	});
	hiddenObj.val(retStr.substring(1));
}
//scripts for keywords inputing tag show and value save, end

function _pad_add_value_to_values(value, values, isChecked){
	var checkType = 2;// 2 addOrRemove, 0 remove, 1 add
	if(typeof isChecked != 'undefined'){
		checkType = isChecked?1:0;
	}

	var temp = values;
	if(temp.substring(0,1)!=',')
		temp = ',' + temp;
	if(temp.substring(temp.length-1)!=',')
		temp = temp + ',';

	var key = ',' + value + ',';
	//假设包含当前key的情况为（之前已经选择）当前操作是取消选择，
	var tempIdx = temp.indexOf(key);
	if(tempIdx==-1){
		if(checkType==2)
			checkType = 1;//should add
		else if(checkType==0)
			checkType = -1;//do nothing
	}else{
		if(checkType==1)
			checkType = -1;//do nothing
		else if(checkType==2)
			checkType = 0; //should remove
	}

	if(checkType==1){
		values = values + ',' + value;
	}else if(checkType==0){
		values = temp.substring(0,tempIdx) + ',' + temp.substring(tempIdx + key.length);
		values = values.substring(1,values.length-1);
	}

	return values;
}

/**
 * 解析页面传递参数advFilterStr，生成相应的检索、排序
 * advFilterStr的格式：column_order_filter_datetype_filtertype
 * column：字段名称
 * order：排序asc、desc
 * filter：过滤条件
 * dateType：字段类型，默认是string，使用like检索。可选值:string/integer/date/long/double
 * filtertype：过滤方式，默认按string使用like检索，可选值:like/eq/le/ge/gt/lt/in/ne/is/bt
 * 				bt=wetween,此时过去条件格式为abc!def
 * action处理见：WxpBaseAction.addAdvFilterAndSort
 * inputObj.attr:data_type,filter_type,order_by
 */
function _pad_add_adv_filter_input(containerId, inputObj){
	var value = inputObj.val();
	var column = inputObj.attr('column');
	if(!column || column=='')
		column = inputObj.attr('name');
	if(!column || column==''){
		alert('搜索条件没有指定栏目名称');
		return;
	}

	value = value.replace(',','[douhao]');
	value = value.replace('_','[xiahuaxian]');

	//没有值也应该继续处理，相当于清楚之前的值
	//if((!value && isNaN(value)) || $.trim(value)=='')
	//	return;

	var orderBy = inputObj.attr('order_by');
	if(!orderBy)
		orderBy = '';
	var dataType = inputObj.attr('data_type');
	if(!dataType)
		dataType = '';
	var filterType = inputObj.attr('filter_type');
	if(!filterType)
		filterType = '';

	if(filterType=='bt'){
		//尝试设置value的正确格式abc!def
		if(value.indexOf(',')!=-1){
			var range = value.split(',');
		}else if(value.indexOf('-')!=-1){
			var range = value.split('-');
		}else{
			return;
		}
		value = $.trim(range[0]) + '!' + $.trim(range[1]);
	}

	var advFilterStr = $('#'+containerId).data(_pad_adv_filter_id);
	if(advFilterStr && advFilterStr.length>0){
		if(advFilterStr.substring(0,1)!=',')
			advFilterStr = ',' + advFilterStr;

		var columnMark = ',' + column + '_';
		var idx = advFilterStr.indexOf(columnMark);
		if(idx!=-1){
			var tempAFS = advFilterStr + ',';
			var idx2 = tempAFS.indexOf(',',idx+1);
			advFilterStr = advFilterStr.substring(0,idx) + advFilterStr.substring(idx2);
		}
	}else{
		advFilterStr = '';
	}

	var addFilter = ',' + column + '_'+orderBy+'_' + value;

	if(dataType!='' || filterType !=''){
		addFilter = addFilter + '_' + dataType + '_' + filterType;
	}

	advFilterStr = advFilterStr + addFilter;
	advFilterStr = advFilterStr.substring(1);
	$('#'+containerId).data(_pad_adv_filter_id, advFilterStr);
}

function _pad_mergeJson(jBase, jAdd)
{
	if(!jBase)
		return jAdd;
	if(!jAdd)
		return jBass;

    var resultJsonObject={};
    for(var attr in jBase){
        resultJsonObject[attr]=jBase[attr];
    }

    for(var attr in jAdd){
        resultJsonObject[attr]=jAdd[attr];
    }

    return resultJsonObject;
}

function _pad_add_param_to_post_data(data, paramName, paramValue){
	if(!data || data.length==0){
		data = paramName+'='+paramValue;
	}else{
		if(typeof(data)=='string'){
			if(data!=''){
                if(data.substring(0,1)=='&'){
                    data = data.substring(1);
                }
                if(data.substring(data.length-1)=='&'){
                    data = data.substring(0,data.length-1);
                }

                if(data!=''){
                    var param_arr = data.split('&');
                    data = {};
                    for(pi=0;pi<param_arr.length;pi++){
                        var p_key_val = param_arr[pi].split('=');
                        if(p_key_val.length>1){
                            data[p_key_val[0]] = p_key_val[1];
                        }
                    }
                }
            }
		}

        data[paramName] = paramValue;
	}
	return data;
}

function _pad_put_pageUuid(containerId, pageUuid){
	if(!pageUuid || pageUuid.length==0)
		return;

	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;

	var container = $(containerId);

	container.data('pageUuid',pageUuid);
}

function _pad_get_pageUuid(containerId){
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;

	var container = $(containerId);

	var pageUuid = container.data('pageUuid');

	if(!pageUuid && isNaN(pageUuid))
		pageUuid = '';

	return pageUuid;
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

function _tab_close_if_one_tab(){
	$('.widget-title').each(function(){
		var tab_li = $(this).find('ul.nav > li');
		if(tab_li.length==1)
		{
			$(this).addClass('hide');
		}
	});
}