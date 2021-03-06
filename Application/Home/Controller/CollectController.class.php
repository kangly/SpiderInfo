<?php
/**
 * Created by PhpStorm.
 * User: kangly
 * Date: 2018/5/8
 * Time: 17:38
 */
namespace Home\Controller;

class CollectController extends HomebaseController
{
    public function index()
    {
        $this->display();
    }
  
  	public function task_list()
    {
        $task = M('task_info')
            ->where(['is_enable'=>1])
            ->select();

        $this->assign('task',$task);

        $this->display();
    }

    public function start_task()
    {
        $pid = I('pid');
      	$file = I('file');

        if($pid && $file)
        {
            exec('cd '.C('CMD_DIR').';php curl'.$file.'.php >/dev/null &',$result);
        }

        echo 'success';
    }

    public function end_task()
    {
        $pid = I('pid');

        if($pid)
        {
            M('task_info')->where(['pid'=>$pid])->save(['state'=>0]);

            echo 'success';
        }
    }

    public function collect()
    {
        $this->display();
    }

    public function collect_list()
    {
        $page_size = 20;
        $page_no = I('get.p',1);

        $map = [];

        $pid = I('pid',0);
        if($pid){
            $map['pid'] = $pid;
        }

        $keyword = I('keyword');
        if($keyword){
            $map['a.title'] =['like',sprintf('%%%s%%',$keyword)];
        }

        $area1 = I('area1');
        $area2 = I('area2');
        if($area2){
            $map['a.area_id'] = $area2;
        }else if($area1){
            $map['a.province_id'] = $area1;
        }

        $data_list = M('collect_data a')
            ->field('a.*,left(create_time,16) create_time')
            ->where($map)
            ->order('a.is_change asc,a.id desc')
            ->page($page_no,$page_size)
            ->select();

        $count = M('collect_data a')
            ->where($map)
            ->count('a.id');

        $this->get_pager($count,$page_size,[
          	'pid' => $pid,
            'keyword' => $keyword,
            'area1' => $area1,
            'area2' => $area2
        ]);

        $this->assign('data_list',$data_list);
        $this->assign('pid',$pid);
      
      	$task_list = M('task_info')
            ->where(['is_enable'=>1])
            ->select();

        $this->assign('task_list',$task_list);

        $this->display();
    }

    public function edit_collect()
    {
        $id = I('id');
        $mid = I('mid');

        if($id>0)
        {
            $info = M('collect_data')->where(['id'=>$id])->find();
          
          	if($mid==27)
            {
                $file_data = json_decode($info['file_data'],true);
                $this->assign('file_data',$file_data);
            }
            else
            {
                $info['content'] = strip_tags($info['content'],'<p>');
            }
          
          	$img_data = json_decode($info['img_data'],true);
            $this->assign('img_data',$img_data);

            if($info['area_id']>0)
            {
                $area = M('area')
                    ->field('areaid,parentid')
                    ->where(['areaid'=>$info['area_id']])
                    ->find();

                if($area['parentid']>0){
                    $info['area1'] = $area['parentid'];
                    $info['area2'] = $area['areaid'];
                }else{
                    $info['area1'] = $area['areaid'];
                }
            }
            else if($info['province_id']>0)
            {
                $info['area1'] = $info['province_id'];
            }

            $this->assign('edit',$info);
          	$this->assign('mid',$mid);
        }

        $this->display();
    }

    public function save_collect()
    {
        $id = I('id');
      	$mid = I('mid');
        $title = I('title');
        $contact = I('contact');
        $phone = I('phone');
        $content = htmlspecialchars_decode(I('content'));

        if($id>0 && $title && $content && ($mid==27 || ($contact && $phone)))
        {
            $data = [
                'title' => $title,
                'area_id' => I('area_id',0),
                'content' => $content
            ];
          
          	if($mid!=27){
                $data['contact'] = $contact;
                $data['phone'] = $phone;
            }

            M('collect_data')->where(['id'=>$id])->save($data);

            echo 'success';
        }
    }

    public function delete_collect()
    {
        $id = I('id');

        if($id>0)
        {
            $ori_info = M('collect_data')->field('img_data,file_data')->where(['id'=>$id])->find();
          
          	//删除图片
            $ori_img_data = json_decode($ori_info['img_data'],true);
            if($ori_img_data){
                foreach($ori_img_data as $v){
                    unlink('.'.$v['img']);
                }
            }
          
          	//删除附件
            $ori_file_data = json_decode($ori_info['file_data'],true);
            if($ori_file_data){
                foreach($ori_file_data as $v){
                    unlink('.'.$v['url']);
                }
            }

            M('collect_data')->where(['id'=>$id])->delete();

            echo $id;
        }
    }
  
  	public function delete_all_collect()
    {
        $ids = I('id');
        if($ids)
        {
            $ids_data = explode(',',$ids);
            foreach($ids_data as $id)
            {
                $ori_info = M('collect_data')->field('img_data,file_data')->where(['id'=>$id])->find();

                //删除图片
                $ori_img_data = json_decode($ori_info['img_data'],true);
                if($ori_img_data){
                    foreach($ori_img_data as $v){
                        unlink('.'.$v['img']);
                    }
                }

                //删除附件
                $ori_file_data = json_decode($ori_info['file_data'],true);
                if($ori_file_data){
                    foreach($ori_file_data as $v){
                        unlink('.'.$v['url']);
                    }
                }

                M('collect_data')->where(['id'=>$id])->delete();
            }

            echo 200;
        }
    }
}