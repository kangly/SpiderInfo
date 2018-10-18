<?php
return array(
	//'配置项'=>'配置值'
    'DB_TYPE' => 'mysql',
    'DB_HOST' => '127.0.0.1',
    'DB_PORT'=>  '3306',
    'DB_USER' => 'root',
    'DB_PWD' => '922419',
    'DB_NAME' => 'spider',
    'DB_PREFIX' => 'destoon_',
    'URL_MODEL' => 2,
    'MODULE_DENY_LIST' => array('Common','Runtime'),//禁止访问的模块列表
    'MODULE_ALLOW_LIST' => array('Home'), //允许访问列表
    'CMD_DIR' => '/www/wwwroot/spider/run/',//为cmd设置的路径
);