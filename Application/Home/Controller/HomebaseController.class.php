<?php
/**
 * Created by PhpStorm.
 * User: kangly
 * Date: 2017/7/28
 * Time: 15:27
 */
namespace Home\Controller;
use Think\Controller;

class HomebaseController extends Controller
{
    public $userInfo;
    public $pageSize = 20;

    function _initialize()
    {
        header("Content-type:text/html;charset=UTF-8");

        $this->userInfo = session('admin');
        if(!$this->userInfo){
            $this->redirect('home/login/index');
        }

        $menu_data = session('menu_auth');
        if(!$menu_data){
            $rules = $this->check_auth_access();
            $menu_data = $this->get_menu($rules);
            session('menu_auth',$menu_data);
        }

        $this->assign('authInfo',$this->userInfo);
        $this->assign('menu_data',$menu_data);
        $this->assign('__PUBLIC__',__ROOT__.'/Public');
    }

    /**
     * 分页,便于调用
     * @param $count
     * @param $page_size
     * @param array $parameter
     */
    protected function get_pager($count,$page_size,$parameter=array())
    {
        if(!$page_size || $page_size<=0){
            $page_size = $this->pageSize;
        }

        $page  = new \Think\Page($count,$page_size,$parameter);
        $page->setConfig('theme', "共%TOTAL_ROW%条 %FIRST% %UP_PAGE% %LINK_PAGE% %DOWN_PAGE% %END%");
        $show  = $page->show();
        $this->assign('page',$show);
    }

    /**
     * 检测权限
     * @param int $user_id
     * @return array
     */
    protected function check_auth_access($user_id=0)
    {
        if(!$user_id){
            $user_id = $this->userInfo['id'];
        }

        $auth = new \Think\Auth();

        $rule_name  = strtolower(MODULE_NAME.'/'.CONTROLLER_NAME.'/'.ACTION_NAME);
        $result = $auth->check($rule_name,$user_id);
        if(!$result){
            exit('无访问权限!');
        }

        //读取用户所属用户组,获取用户所属用户组设置的所有权限规则id
        $groups = $auth->getGroups($user_id);
        $ids = array();
        foreach ($groups as $g){
            $ids = array_merge($ids, explode(',', trim($g['rules'], ',')));
        }
        $ids = array_unique($ids);

        return $ids;
    }

    /**
     * 目前左侧菜单限定为最多两级,不考虑多级
     * @param array $rules 规则id数组
     * @return array
     */
    protected function get_menu($rules=array())
    {
        $map = [
            'type' => 1,
            'status' => 1,
            'is_menu' => 1
        ];

        if($rules){
            $map['id'] = ['in',$rules];
        }

        $nav = M('auth_rule')
            ->field("id,title,name,pid,order_num,icon")
            ->where($map)
            ->order('order_num asc,id asc')
            ->select();

        $list = [];

        foreach($nav as $v)
        {
            if($v['pid'] == 0)
            {
                foreach($nav as $sv)
                {
                    if($sv['pid'] == $v['id'])
                    {
                        $v['son'][] = $sv;
                        $v['son_count']++;
                    }
                }

                $list[] = $v;
            }
        }

        return $list;
    }

    /**
     * 目前权限列表限定为最多三级,便于管理
     * @return array
     */
    protected function get_rules()
    {
        $map = [
            'status' => 1,
            'type' => 1
        ];

        $rules = M('auth_rule')
            ->where($map)
            ->order('order_num asc,id asc')
            ->select();

        return $rules;
    }

    /**
     * 获取所有规则名称
     * @return array
     */
    protected function get_all_rules_name()
    {
        $all_rules = $this->get_rules();

        $all_rules_title = [];

        foreach($all_rules as $v)
        {
            $all_rules_title[]= $v['name'];
        }

        return $all_rules_title;
    }

    //获取所有用户,后续添加条件限制显示用户
    public function load_user()
    {
        $users = M('user')->field('id,username')->where(['status'=>1])->select();
        $this->ajaxReturn($users,'json');
    }

    /**
     * 获取所有角色
     * @return mixed
     */
    protected function load_all_user_group()
    {
        $groups = M('auth_group')->field('id,title')->where(['status'=>1])->select();
        return $groups;
    }

    /**
     * 获取用户所属角色
     * @param int $uid
     * @return mixed
     */
    protected function load_user_group($uid=0)
    {
        if(!$uid){
            $uid = $this->userInfo['id'];
        }

        $groups = M('auth_group a')
            ->join('join destoon_auth_group_access b on a.id = b.group_id')
            ->where(['b.uid'=>$uid,'a.status'=>1])
            ->field('a.id,a.title')
            ->select();

        return $groups;
    }

    /**
     * 判断用户是否为超级管理员角色
     * @param int $uid
     * @return int
     */
    protected function is_admin_role($uid=0)
    {
        $result = 0;

        if(!$uid){
            $uid = $this->userInfo['id'];
        }

        $role = M('auth_group_access')
            ->where([
                'uid' => $uid,
                'group_id' => 1
            ])
            ->field('uid')
            ->find();

        if($role){
            $result = 1;
        }

        return $result;
    }

    //联动加载省市地区
    public function load_key_data()
    {
        $pid = I('pid',0);

        if($pid>0){
            $map['parentid'] = $pid;
        }else{
            $map['parentid'] = 0;
        }

        $data_list = M('area')
            ->field('areaid,areaname')
            ->where($map)
            ->order('listorder asc')
            ->select();

        $this->ajaxReturn($data_list,'json');
    }

    //联动加载模块行业分类
    public function load_module_category()
    {
        $map = [];

        $module_id = I('module_id',0);
        if($module_id>0){
            $map['moduleid'] = $module_id;
        }else{
            $map['moduleid'] = 0;
        }

        $pid = I('pid',0);
        if($pid>0){
            $map['parentid'] = $pid;
        }else{
            $map['parentid'] = 0;
        }

        //行业分类,线上为二级分类,先不考虑其他
        $category_data = M('category')
            ->field('catid,catname')
            ->where($map)
            ->order('listorder asc')
            ->select();

        $this->ajaxReturn($category_data,'json');
    }
}