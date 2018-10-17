<?php
/**
 * Created by PhpStorm.
 * User: kangly
 * Date: 2017/7/28
 * Time: 15:42
 */

namespace Home\Controller;
use Think\Controller;

class LoginController extends Controller
{
    public function index()
    {
        $this->assign('__PUBLIC__',__ROOT__.'/Public');

        if(session('admin')){
            $this->redirect('home/index/index');
        }

        $this->display();
    }

    //登录验证
    public function login()
    {
        $username = I('post.username');
        $password = I('post.password');

        if($username && $password)
        {
            $admin = M('user')->where(['username' => $username])->find();

            if($admin)
            {
                $password = md5($password);

                if($admin['password'] == $password)
                {
                    unset($admin['password']);

                    $data = [
                        'last_login_ip' => get_client_ip(),
                        'last_login_time' => date('Y-m-d H:i:s')
                    ];

                    M('user')->where(['id'=>$admin['id']])->save($data);

                    $admin['last_login_ip'] = $data['last_login_ip'];
                    $admin['last_login_time'] = $data['last_login_time'];
                    session('admin',$admin);

                    echo 'success';
                }
                else
                {
                    echo '密码错误';
                }
            }
            else
            {
                echo '用户名不存在';
            }
        }
        else
        {
            //正常情况,进不到这里
            if(!$username)
            {
                echo '用户名不能为空';
            }
            else if(!$password)
            {
                echo '密码不能为空';
            }
        }
    }

    //退出系统
    public function login_out()
    {
        session(null);
        session_destroy();
        $this->redirect('home/login/index');
    }
}