//主要部分与vix相同
var itn_tab_Page_Idx = 1;
var itn_tabContainerId_default = "tab_content";
var itn_tabPageContainerId_default = "tab_content_page";
var _tab_default_top_scroll_val = -1;
var _tab_link_page_id = "href";
var _tab_link_page_url = "page";

var _tab_delay_reload = false;

//当前显示标签页id,默认#tab_home
var _default_tab_page_id = '#tab1 ';
var _current_tab_page_id = _default_tab_page_id;

//上一个显示的标签，默认与_current_tab_page_id相同
var _last_show_tab_page_id;

//
var _sub_tab_opener_Page_id;

//正在关闭(与_current相同)，或已经关闭（上一个）tabId
var _closing_tab_page_id;

//马上显示（一定会显示），或已经显示（显示后与_current相同）tabId
//暂时未处理新建tab时，对_activating_tab_page_id的赋值
var _activating_tab_page_id;

function _tab_reload_current(){
	_tab_reload_page(_current_tab_page_id);
}
function _tab_reload_last(){
	_tab_reload_page(_last_show_tab_page_id);
}
function _tab_reload_opener(){
	if(_sub_tab_opener_Page_id && _sub_tab_opener_Page_id.length>0)
		_tab_reload_page(_sub_tab_opener_Page_id);
	else
		_tab_reload_page(_last_show_tab_page_id);
}

function _tab_reload_page(_page_id){
	//var tabLinkA =$('#tab_content').find('li.active').find('a:first');
	var tempHref = _page_id;
	if(tempHref && tempHref.length>0)
		tempHref = tempHref.substring(0,tempHref.length-1);

	var tabLinkA = $('#'+itn_tabContainerId_default).find('li a['+_tab_link_page_id+'="'+tempHref+'"]');

	_tab_load_page_content(tabLinkA);
}

//关闭当前，并刷新父tab
function _tab_close_current_and_reload_opener(){
	_tabCloseByPageId(_current_tab_page_id);
	_tab_reload_opener();
}

//关闭当前，尝试只刷新opener的tab中的grid,包含pageNo
function _tab_close_current_and_reload_opener_grid(){
	_tabCloseByPageId(_current_tab_page_id);

	if(_tab_delay_reload)
		setTimeout(_tab_reload_opener_grid, 700);
	else
		_tab_reload_opener_grid();
}

function _tab_reload_opener_grid(){
	var reloadSuccess = _tab_reload_tab_grid(_sub_tab_opener_Page_id);

	//if(!reloadSuccess)
	//	_tab_reload_opener();
}

function _tab_reload_tab_grid(tabPageId){
	var reloadGridSuccess = false;
	var openerContainer = $(tabPageId);
	if(openerContainer && openerContainer.length>0){
		var anyGrid = _pad_findGridByContainerId(openerContainer.attr('id'));
		if(anyGrid && anyGrid.length>0){
			//在pad_all.js中有为加载的grid table添加containerId属性
			var gridContainerId = anyGrid.attr('containerId');
			if(gridContainerId && gridContainerId.length>0){
				reloadGridSuccess = true;
				_pad_grid_loadPage(gridContainerId);
			}
		}
	}
	return reloadGridSuccess;
}

//刷新当前页面中的第一个grid
function _tab_reload_current_tab_grid(){
	_tab_reload_tab_grid(_current_tab_page_id);
}

//从新设置tab的链接
function _tabLocateUrl(url, containerId){
	if(containerId.substring(0,1)!='#')
		containerId = '#' + containerId;
	var tabLink = $('#'+itn_tabContainerId_default+'>ul.nav-tabs>li>a['+_tab_link_page_id+'="'+containerId+'"]');
	if(tabLink.length>0){
		tabLink.attr(_tab_link_page_url,url);

		_tab_load_page_content(tabLink,null,null,true);
	}
}

//显示新tab
function _tabShow(title,contentUrl,pageId,tabContainerId,tabPageContainerId,params,callBack){
	if(!tabContainerId)tabContainerId = itn_tabContainerId_default;
	if(!tabPageContainerId)tabPageContainerId = itn_tabPageContainerId_default;

	_sub_tab_opener_Page_id = _current_tab_page_id;

	var tabContainer = $('#'+tabContainerId);
	var tabList = tabContainer.find('ul:first');
	var tabPageContainer = $('#'+tabPageContainerId);

	if(!pageId){
		pageId = 'subPage_'+itn_tab_Page_Idx;
		itn_tab_Page_Idx++;
	}
	if(!title)title=pageId;
	var newTab;
	var newTabContent;
	var tabSwitcher;

	if($('#'+pageId).length>0){
		newTab = tabList.find("li[pageId='"+pageId+"']");
		tabSwitcher = newTab.find('a:first');
		//注释掉下面3行，并添加trigger和return，可以防止从新加载已有页面
		newTabContent = $('#'+pageId);
		tabSwitcher.text(title);
		tabSwitcher.attr(_tab_link_page_url,contentUrl);
		//tabSwitcher.trigger('click');
		//return;
	}else{
		newTab = $('<li pageId="'+pageId+'" class="sub"></li>');
		tabSwitcher = $('<a data-toggle="tab" '+_tab_link_page_id+'="#'+pageId+'" '+_tab_link_page_url+'="'+contentUrl+'">'+title+' </a>');
		newTab.append(tabSwitcher);
		tabList.append(newTab);

		var tabClose = $('<span id="tab_close_'+ pageId +'" class="sub_close"></span>');
		newTab.append(tabClose);
		tabClose.bind('click',function(){
			var tabObj = $(this).parent();
			var tabListObj = tabObj.parent();
			var pageId = tabObj.attr('pageId');

			if(tabObj.hasClass('active') || tabObj.hasClass('current')){
				var tempHref = _last_show_tab_page_id;
				if(tempHref && tempHref.length>0)
					tempHref = tempHref.substring(0,tempHref.length-1);
				var lastTabLink = tabListObj.find('li a['+_tab_link_page_id+'="'+tempHref+'"]');

				var prevTabLink;
				if(lastTabLink.length>0){
					prevTabLink = lastTabLink;
				}else{
					var prevTab = tabObj.prev();

					prevTabLink = prevTab.find('a:first');
				}

				_closing_tab_page_id = _current_tab_page_id;
				if(prevTabLink && prevTabLink.length>0){
					prevTabLink.tab('show');
					//prevTabLink.trigger('click');

					_activating_tab_page_id = prevTabLink.attr(_tab_link_page_id);
				}
			}
			tabObj.remove();
			$('#'+pageId).remove();

			if(tabListObj.children('li').length==1){
				//暂时在关闭时不隐藏
				//tabList.slideUp('fast');
				//tabList.addClass('off_show');
				_tab_default_top_scroll_val = -1;
			}
		});

		newTabContent = $('<div id="'+pageId+'" class="tab-pane new_tab" ></div>');
		tabPageContainer.append(newTabContent);
	}

	//load content for new tab
	_tab_load_page_content(tabSwitcher,params,callBack);

	if(tabList.hasClass('off_show')){
		tabList.slideDown('fast');
		tabList.removeClass('off_show');
		_tab_default_top_scroll_val = tabList.offset().top;
	}

	//tabSwitcher.tab('show');把挪到_tab_load_page_content里，可以避免每次没加载完html内容就显示时，页面会跳到最上面
	//switch to new tab
	//tabSwitcher.tab('show');

	return pageId;
}

function _tab_page_init(tabLinkA, tabPageContainerId){
	var jLinkA = $(tabLinkA);
	var pageId = jLinkA.attr(_tab_link_page_id);
	if(pageId!=''){
		return;
	}else{
		pageId = 'subPage_'+itn_tab_Page_Idx;
		itn_tab_Page_Idx++;
		jLinkA.attr(_tab_link_page_id,'#'+pageId);
	}

	if(!tabPageContainerId)tabPageContainerId = itn_tabPageContainerId_default;

	var tabPageContainer = $('#'+tabPageContainerId);

	var newTabContent = $('<div id="'+pageId+'" class="tab-pane new_tab" ></div>');
	tabPageContainer.append(newTabContent);

	_tab_load_page_content(jLinkA);
}

function _tab_load(tabLinkA, params, callback, tabPageContainerId){
	var jLinkA = $(tabLinkA);
	var pageId = jLinkA.attr(_tab_link_page_id);
	if(pageId==''){
		return;
	}

	_tab_load_page_content(jLinkA,params,callback);
}

function _tab_load_once(tabLinkA, tabPageContainerId){
	var jLinkA = $(tabLinkA);
	var pageId = jLinkA.attr(_tab_link_page_id);
	if(pageId==''){
		return;
	}
	var loadCount = jLinkA.attr('load_count');
	if(loadCount && loadCount>0){
		jLinkA.tab('show');
	}else{
		jLinkA.attr('load_count',1);
		_tab_load_page_content(jLinkA);
	}
}

//页面内的tab元素加载
function _tab_load_page_content(_tab_page_tabA,params,callBack,isLoadNewTab){
	var _tab_page_tabUl;
	var _tab_page_tabLi;
	if(_tab_page_tabA && _tab_page_tabA.length>0){
		_tab_page_tabLi = _tab_page_tabA.parent();
		_tab_page_tabUl = _tab_page_tabLi.parent();
	}else{
		_tab_page_tabUl = $('#'+itn_tabContainerId_default+'>ul.nav-tabs');
		_tab_page_tabLi	= _tab_page_tabUl.children('li:first');
		_tab_page_tabA = _tab_page_tabLi.find('a:first');

		//这种情况应该是发生在页面初次加载默认tab时，给_current_tab_page_id赋值
		_current_tab_page_id = _tab_page_tabA.attr(_tab_link_page_id) + ' ';
	}

	_tab_page_tabA.attr('load_count',1);

	var _tab_page_load_url = _tab_page_tabA.attr(_tab_link_page_url);
	var _tab_page_load_container = _tab_page_tabA.attr(_tab_link_page_id);


	var thisTabCallBack = new _tab_after_load_event(callBack);

	var keepParams = true;
	if(isLoadNewTab)
		keepParams = false;

	//from pad_all.js
	_pad_all_loadPage(_tab_page_load_url,_tab_page_load_container,keepParams,params,function(pageContainerId){
		if(thisTabCallBack.userCallBackFunc)
			thisTabCallBack.userCallBackFunc(pageContainerId);
		//switch to new tab，放在这里可以避免每次没加载完html内容就显示时，页面会跳到最上面
		_tab_page_tabA.tab('show');
		//thisTabCallBack.scrollContent(pageContainerId);
	});
}

function _tab_after_load_event(userCallBack){
	this.userCallBackFunc = userCallBack;
	this.scrollContent=_tab_scrollTabContent;
}

function _tab_scrollTabContent(pageContainerId){
	//滚动到tab内容顶部
	if(_tab_default_top_scroll_val!=-1)
		$(window).scrollTop(_tab_default_top_scroll_val);
}

function _load_tab_page_content(_tab_page_tabA,params,callback){
	if(!_tab_page_tabA){
		_tab_page_tabA = $('#myTab a[page]:first');
	}

	_tab_load_page_content(_tab_page_tabA,params,callback);
}

function _tabCloseByPageId(pageId){
	if(!pageId)pageId=_current_tab_page_id;
	if(pageId.substring(0,1)=='#')pageId = pageId.substring(1);

	$('#tab_close_'+pageId).trigger('click');
}

function addTabFixedEvent(){
	$(window).bind('scroll',function(){
		if($('.addable_tab>.nav-tabs').is('.off_show')){
			$('.addable_tab>.nav-tabs').removeClass('fixed_tab');
			$('.addable_tab').removeClass('with_fixed');
		}else{
			//_tab_default_top_scroll_val is in inc_tab_page.js
			if($(window).scrollTop()>=_tab_default_top_scroll_val){
				$('.addable_tab>.nav-tabs').addClass('fixed_tab');
				$('.addable_tab').addClass('with_fixed');
			}else{
				$('.addable_tab>.nav-tabs').removeClass('fixed_tab');
				$('.addable_tab').removeClass('with_fixed');
			}
		}
	});
}

$(function(){
	$('#content').delegate('ul.nav-tabs>li>a','click',function(event){
		$(this).tab('show');
	});

	$('#content').delegate('ul.nav-tabs>li>a','show',function(event){
		if($(_last_show_tab_page_id).length==0)
			_last_show_tab_page_id = null;

		var toShowPageId = $(this).attr(_tab_link_page_id) + ' ';

		if(_current_tab_page_id == toShowPageId)
			return;

		$(_current_tab_page_id).attr('tab_scrollTop',$(window).scrollTop());

		_last_show_tab_page_id = _current_tab_page_id;
		_current_tab_page_id = toShowPageId;
	});

	$('#content').delegate('ul.nav-tabs>li>a','show',function(event){
		//恢复新现实tab的scrollTop
		var oldST = $(_current_tab_page_id).attr('tab_scrollTop');
		if(oldST && oldST>0){
			//_tab_default_top_scroll_val 可以判断大小，将tab设置到顶部
			if(_tab_default_top_scroll_val!=-1 && oldST<_tab_default_top_scroll_val)
				oldST = _tab_default_top_scroll_val;
			$(window).scrollTop(oldST);
		}
	});
});