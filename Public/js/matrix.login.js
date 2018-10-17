
$(function(){
    //jq版本1.9.0以上去掉了browser改为support
    if($.support.msie == true && $.support.version.slice(0,3) < 10) {
        $('input[placeholder]').each(function(){
            alert(1);
            var input = $(this);

            $(input).val(input.attr('placeholder'));

            $(input).focus(function(){
                if (input.val() == input.attr('placeholder')) {
                    input.val('');
                }
            });

            $(input).blur(function(){
                if (input.val() == '' || input.val() == input.attr('placeholder')) {
                    input.val(input.attr('placeholder'));
                }
            });
        });
    }
});