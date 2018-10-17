<?php
$array = array(
	//'配置项'=>'配置值'
    'DEFAULT_FILTER'        =>  'trim,htmlspecialchars', // 默认参数过滤方法 用于I函数...
);
$custom = include CONF_PATH.'config.php';
return array_merge($custom,$array);