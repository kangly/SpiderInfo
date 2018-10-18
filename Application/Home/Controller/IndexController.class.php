<?php
namespace Home\Controller;

class IndexController extends HomebaseController {

    public function index(){

        $this->display();
    }

    //个人信息
    public function user_info(){

        $user = M('user')
            ->field('*')
            ->where(['id'=>$this->userInfo['id']])
            ->find();

        $this->assign('user',$user);

        $this->display();
    }

    //修改密码
    public function edit_password(){

        $this->display();
    }

    //保存密码
    public function save_password(){

        $ori_password = I('ori_password');
        $new_password = I('new_password');
        $confirm_password = I('confirm_password');

        if($ori_password && $new_password && $confirm_password)
        {
            $user = M('user')->field('password')->where(['id'=>$this->userInfo['id']])->find();

            if($user['password'] != md5($ori_password))
            {
                echo '原密码错误';
            }
            else
            {
                if($new_password != $confirm_password)
                {
                    echo '新密码和确认密码必须相同';
                }
                else
                {
                    M('user')->where(['id'=>$this->userInfo['id']])->save(['password'=>md5($new_password)]);

                    echo 'success';
                }
            }
        }
    }

    //修改昵称
    public function edit_nickname(){

        $user = M('user')->field('nickname')->where(['id'=>$this->userInfo['id']])->find();
        $this->assign('user',$user);

        $this->display();
    }

    //保存昵称
    public function save_nickname(){

        $password = I('password');
        $nickname = I('nickname');

        if($password && $nickname)
        {
            $user = M('user')->field('password')->where(['id'=>$this->userInfo['id']])->find();

            if($user['password'] != md5($password))
            {
                echo '密码错误';
            }
            else
            {
                M('user')->where(['id'=>$this->userInfo['id']])->save(['nickname'=>$nickname]);

                echo 'success';
            }
        }
    }
}