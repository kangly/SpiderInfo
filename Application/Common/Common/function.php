<?php
/**
 * Created by PhpStorm.
 * User: kangly
 * Date: 2017/8/20
 * Time: 11:04
 */

/**
 * 有格式的输出
 * @param array|string $str 要输出的内容
 */
function de($str)
{
    header("Content-type: text/html; charset=utf-8");
    echo '<pre>';
    print_r($str);
    echo '</pre>';
}

/**
 * 当前时间
 * @return bool|string
 */
function _time()
{
    return date('Y-m-d H:i:s');
}

/**
 * 获取客户端IP地址
 * @param integer   $type 返回类型 0 返回IP地址 1 返回IPV4地址数字
 * @param boolean   $adv 是否进行高级模式获取（有可能被伪装）
 * @return mixed
 */
function ip($type = 0, $adv = false)
{
    $type      = $type ? 1 : 0;
    static $ip = null;
    if (null !== $ip) {
        return $ip[$type];
    }

    if ($adv) {
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $arr = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $pos = array_search('unknown', $arr);
            if (false !== $pos) {
                unset($arr[$pos]);
            }
            $ip = trim(current($arr));
        } elseif (isset($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (isset($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
    } elseif (isset($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    // IP地址合法验证
    $long = sprintf("%u", ip2long($ip));
    $ip   = $long ? [$ip, $long] : ['0.0.0.0', 0];
    return $ip[$type];
}

/**
 * 检测是否使用手机访问
 * @access public
 * @return bool
 */
function isMobile()
{
    if (isset($_SERVER['HTTP_VIA']) && stristr($_SERVER['HTTP_VIA'], "wap")) {
        return true;
    } elseif (isset($_SERVER['HTTP_ACCEPT']) && strpos(strtoupper($_SERVER['HTTP_ACCEPT']), "VND.WAP.WML")) {
        return true;
    } elseif (isset($_SERVER['HTTP_X_WAP_PROFILE']) || isset($_SERVER['HTTP_PROFILE'])) {
        return true;
    } elseif (isset($_SERVER['HTTP_USER_AGENT']) && preg_match('/(blackberry|configuration\/cldc|hp |hp-|htc |htc_|htc-|iemobile|kindle|midp|mmp|motorola|mobile|nokia|opera mini|opera |Googlebot-Mobile|YahooSeeker\/M1A1-R2D2|android|iphone|ipod|mobi|palm|palmos|pocket|portalmmm|ppc;|smartphone|sonyericsson|sqh|spv|symbian|treo|up.browser|up.link|vodafone|windows ce|xda |xda_)/i', $_SERVER['HTTP_USER_AGENT'])) {
        return true;
    } else {
        return false;
    }
}

/**
 * 分类树(递归)
 * @param $category
 * @param string $limiter
 * @param int $pid
 * @param int $level
 * @return array
 */
function tree_to_level($category, $limiter = '&nbsp;&nbsp;&nbsp;&nbsp;', $pid = 0, $level = 0) 
{
    $tree = array();

    foreach ($category as $v)
    {
        if ($v['pid'] == $pid)
        {
            $v['level'] = $level + 1;
            $v['limiter'] = str_repeat($limiter, $level);

            $tree[] = $v;

            $tree = array_merge($tree, tree_to_level($category, $limiter, $v['id'], $v['level']));
        }
    }

    return $tree;
}

/**
 * 把返回的数据集转换成Tree
 * @param $list
 * @param string $pk
 * @param string $pid
 * @param string $child
 * @param int $root
 * @return array
 */
function list_to_tree($list, $pk='id', $pid = 'pid', $child = '_child', $root = 0) 
{
    // 创建Tree
    $tree = array();

    if(is_array($list))
    {
        // 创建基于主键的数组引用
        $refer = array();

        foreach ($list as $key => $data){
            $refer[$data[$pk]] =& $list[$key];
        }

        foreach ($list as $key => $data)
        {
            // 判断是否存在parent
            $parentId =  $data[$pid];

            if($root == $parentId)
            {
                $tree[] =& $list[$key];
            }
            else
            {
                if(isset($refer[$parentId]))
                {
                    $parent =& $refer[$parentId];
                    $parent[$child][] =& $list[$key];
                }
            }
        }
    }

    return $tree;
}

/**
 * 将树形结构数据以html代码输出,后续可能会组成多级的左侧导航菜单
 * @param $tree
 * @param string $child
 * @param string $title
 * @return string
 */
function tree_to_html($tree,$child = '_child',$title = 'title')
{
    $html = '';

    foreach($tree as $t)
    {
        if($t[$child] == '')
        {
            $html .= "<li>{$t[$title]}</li>";
        }
        else
        {
            $html .= "<li>".$t[$title];
            $html .= tree_to_html($t[$child]);
            $html = $html."</li>";
        }
    }

    return $html ? '<ul>'.$html.'</ul>' : $html ;
}

/**
 * 二维数组根据字段进行排序
 * @param array $array 要排序的数组
 * @param string $field 要排序的字段
 * @param string $sort SORT_DESC 降序；SORT_ASC 升序
 * @return mixed
 */
function array_sort_by_field($array,$field,$sort='SORT_ASC')
{
    $sort_data = [];

    foreach ($array as $k=>$v)
    {
        foreach ($v as $m=>$n)
        {
            $sort_data[$m][$k] = $n;
        }
    }

    array_multisort($sort_data[$field],constant($sort),$array);

    return $array;
}

/**
 * curl get
 * @param $url
 * @param array $headers
 * @return bool|mixed
 */
function curl_get($url,$headers=[])
{
    $timeout = 30;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER,$headers);
    curl_setopt($ch, CURLOPT_URL, $url);
    $body = curl_exec($ch);
    if ($body === false) {
        echo "CURL Error: " . curl_error($body);
        return false;
    }
    curl_close($ch);
    return $body;
}

/**
 * 去掉空格、换行等字符
 * @param $content
 * @param string $replace
 * @return mixed
 */
function _str_replace($content,$replace='')
{
    $content = str_replace(['&nbsp;','&#160;'],$replace,$content);
    $content = str_replace("    ",$replace,$content);
    $content = str_replace([" ","　"," ","\t","\n","\r"],$replace,$content);
    return $content;
}

/**
 * 获取url参数信息
 * @param $url
 * @return array
 */
function convertUrlQuery($url)
{
    $data = parse_url($url);
    $query = $data['query'];
    $queryParts = explode('&', $query);
    $params = array();
    foreach ($queryParts as $param) {
        $item = explode('=', $param);
        $params[$item[0]] = $item[1];
    }
    return $params;
}