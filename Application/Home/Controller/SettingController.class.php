<?php
/**
 * Created by PhpStorm.
 * User: kangly
 * Date: 2017/9/5
 * Time: 14:04
 */

namespace Home\Controller;

class SettingController extends HomebaseController
{
    public function index()
    {
        $this->display();
    }

    //权限管理start
    public function rule()
    {
        $this->display();
    }

    public function rule_list()
    {
        $menu_rules = $this->get_rules();
        $menu_rules_tree = tree_to_level($menu_rules);

        $this->assign('menu_rules',$menu_rules_tree);

        $this->display();
    }

    public function edit_rule()
    {
        $id = I('id');

        if($id>0)
        {
            $is_add_son = I('is_add_son');

            if($is_add_son)
            {
                $rule  = ['pid'=>$id];
            }
            else
            {
                $map = [
                    'id' => $id
                ];

                $rule = M('auth_rule')
                    ->where($map)
                    ->find();
            }

            $this->assign('edit',$rule);
        }

        $menu_rules = $this->get_rules();
        $menu_rules_tree = tree_to_level($menu_rules);
        $this->assign('menu_rules',$menu_rules_tree);

        $this->display();
    }

    public function save_rule()
    {
        $name = trim(I('name'));
        $title = trim(I('title'));

        if($name && $title)
        {
            $data = [
                'pid' => I('pid'),
                'name' => $name,
                'title' => $title,
                'type' => 1,//默认值
                'status' => I('status'),
                'icon' => I('icon'),
                'order_num' => I('order_num'),
                'is_menu' => I('is_menu'),
                'condition' => '',//目前未使用
            ];

            $id = I('id');

            if($id>0){
                M('auth_rule')->where(['id'=>$id])->save($data);
            }else{
                M('auth_rule')->add($data);
                $id = M('auth_rule')->getLastInsID();
            }

            echo $id;
        }
    }

    public function delete_rule()
    {
        $id = I('id');

        if($id>0)
        {
            M('auth_rule')->where(['id'=>$id])->delete();

            echo $id;
        }
    }
    //权限管理end

    //用户组管理start
    public function group()
    {
        $this->display();
    }

    public function group_list()
    {
        $map = [];

        $group = M('auth_group')
            ->where($map)
            ->select();

        $this->assign('group',$group);

        $this->display();
    }

    public function edit_group()
    {
        $id = I('id');

        if($id>0)
        {
            $map = [
                'id' => $id
            ];

            $group = M('auth_group')
                ->where($map)
                ->find();

            $this->assign('edit',$group);
        }

        $this->display();
    }

    public function save_group()
    {
        $title = trim(I('title'));

        if($title)
        {
            $data = [
                'title' => $title,
                'status' => I('status')
            ];

            $id = I('id');

            if($id>0)
            {
                M('auth_group')->where(['id'=>$id])->save($data);
            }
            else
            {
                M('auth_group')->add($data);
                $id = M('auth_group')->getLastInsID();
            }

            echo $id;
        }
    }

    public function delete_group()
    {
        $id = I('id');

        if($id>0)
        {
            M('auth_group')->where(['id'=>$id])->delete();

            echo $id;
        }
    }

    public function add_group_user()
    {
        $id = I('id');
        $this->assign('group_id',$id);

        $this->display();
    }

    public function save_group_user()
    {
        $user_id = I('user_id');
        $group_id = I('group_id');

        if($user_id && $group_id)
        {
            $map = [
                'uid' => $user_id,
                'group_id' => $group_id
            ];

            $group_access = M('auth_group_access')->where($map)->find();

            if(!$group_access)
            {
                M('auth_group_access')->add($map);
                echo 'success';
            }
            else
            {
                echo 'exist';
            }
        }
    }

    public function set_group_access()
    {
        $id = I('id');

        if($id>0)
        {
            $rule = M('auth_group')->field('id,rules')->where(['id'=>$id])->find();
            $this->assign('rule',$rule);

            $menu_rules = $this->get_rules();
            $all_rules = tree_to_level($menu_rules);

            $this->assign('all_rules',$all_rules);
        }

        $this->display();
    }

    public function save_group_access()
    {
        $group_id = I('id');
        $target_id  = I('target_id');

        if($group_id>0 && $target_id)
        {
            M('auth_group')->where(['id'=>$group_id])->save(['rules'=>$target_id]);

            echo $group_id;
        }
    }
    //用户组管理end

    //用户管理start
    public function user()
    {
        //用户组
        $gid = I('gid');
        $this->assign('gid',$gid);

        $this->display();
    }

    public function user_list()
    {
        $gid = I('gid');
        $this->assign('gid',$gid);

        $map = [];

        if($gid)
        {
            $map['b.group_id'] = $gid;
        }

        $users = M('user a')
            ->join('left join destoon_auth_group_access b on a.id = b.uid')
            ->field('a.*,left(a.register_time,10) register_time,left(a.last_login_time,10) last_login_time')
            ->where($map)
            ->select();

        $this->assign('users',$users);

        $all_user_groups = $this->load_all_user_group();
        $this->assign('all_user_groups',$all_user_groups);

        $this->display();
    }

    public function edit_user()
    {
        $id = I('id');

        if($id>0)
        {
            $users = M('user')->where(['id'=>$id])->find();

            $this->assign('edit',$users);
        }

        $this->display();
    }

    public function save_user()
    {
        $user_id = I('user_id');
        $username = I('username');

        if($username)
        {
            $nickname = I('nickname');
            $password = I('password');
            $confirm_password = I('confirm_password');

            if(!$nickname){
                $nickname = $username;
            }

            $data = [
                'username' => $username,
                'nickname' => $nickname
            ];

            if($user_id>0)
            {
                //编辑
                if($password)
                {
                    if(!$confirm_password)
                    {
                        echo '确认密码不能为空';
                    }
                    else if($confirm_password != $password)
                    {
                        echo '两次输入密码不同';
                    }
                    else
                    {
                        $data['password'] = md5($password);
                        M('user')->where(['id'=>$user_id])->save($data);

                        echo 'success';
                    }
                }
                else
                {
                    M('user')->where(['id'=>$user_id])->save($data);

                    echo 'success';
                }
            }
            else
            {
                //添加
                $is_user = M('user')->field('id')->where(['username'=>$username])->find();

                if($is_user)
                {
                    echo '用户名重复';
                }
                else
                {
                    if(!$password)
                    {
                        echo '密码不能为空';
                    }
                    else if(!$confirm_password)
                    {
                        echo '确认密码不能为空';
                    }
                    else if($confirm_password != $password)
                    {
                        echo '两次输入密码不同';
                    }
                    else
                    {
                        $data['register_time'] = _time();
                        $data['password'] = md5($password);
                        M('user')->add($data);

                        echo 'success';
                    }
                }
            }
        }
        else
        {
            echo '用户名不能为空';
        }
    }

    public function delete_user()
    {
        $id = I('id');

        if($id>0)
        {
            M('user')->where(['id'=>$id])->delete();

            echo $id;
        }
    }

    public function set_user_role()
    {
        $id = I('id');
        $this->assign('id',$id);

        $user_roles = $this->load_all_user_group();
        $this->assign('user_roles',$user_roles);

        $this_role = $this->load_user_group($id);

        $roles = '';
        foreach($this_role as $v){
            $roles .= ','.$v['id'];
        }
        $roles = ltrim($roles,',');

        $this->assign('roles',$roles);

        $this->display();
    }

    public function save_user_role()
    {
        $id = I('id');
        $target_id  = I('target_id');

        if($id>0 && $target_id)
        {
            $map = [
                'uid' => $id
            ];

            M('auth_group_access')->where($map)->delete();

            $target_id_data = explode(',',$target_id);

            foreach($target_id_data as $v)
            {
                M('auth_group_access')->add([
                    'uid' => $id,
                    'group_id' => $v
                ]);
            }

            echo $id;
        }
    }

    public function set_user_status()
    {
        $target_id = I('target_id');
        $status = I('status');

        if($target_id)
        {
            $target_id_data = explode(',',$target_id);

            $user_ids = [];

            foreach($target_id_data as $v)
            {
                $user_ids[] = $v;
            }

            if($user_ids)
            {
                M('user')->where(['id'=>['in',$user_ids]])->save(['status'=>$status]);

                echo 'success';
            }
        }
    }
    //用户管理end
}