/*
usage:
    <script id="some-template" type="text/x-parsepage-template">
      Name: <~fname>, <~lname>
      <~rows repeat>
        <div><~repeat.iteration>. <~id>: <~title></div>
      </~rows>
      <~status_var if="status">
      <~details if="is_details" inline>
        <~det1>,<~det2>,<~det3>
      </~details>
      <~raw_string noescape>
      <~long_textarea nl2br>
      <~some.deep.1 if="obj.field">
    </script>

...

    //$.parsepage.defaults.root_url='/templates'; //root url for autoloading subtemplates
    var ps={
        fname: 'Dow',
        lname: 'Jones',
        rows: [
            {id:1,title:'test1'},
            {id:2,title:'test2'},
            {id:3,title:'test3'}
        ]
    };
    $('#sidebar').parsepage('#template-name', ps);

*/

//we really need this in RegExp core
RegExp.quote = function(str) {
    return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

(function($) {
    // Private class variable
    var defaults = {
        _is_debug: false
    };

    // Private class method
    function _logger (){
        if (defaults._is_debug && window.console) {
            if (arguments[0]=='ERROR'){
                window.console.error(arguments);
            }else{
                window.console.log(arguments);
            }
        }
    }

    // a, b - arrays: [ tag, i ]
    function _sort_tags (a,b){
        var is_inline_a = /\s(?:inline|repeat|sub)\b/i.test(a[0]);
        var is_inline_b = /\s(?:inline|repeat|sub)\b/i.test(b[0]);
        if (is_inline_a && !is_inline_b){
            return -1;
        }else if (is_inline_b && !is_inline_a){
            return 1;
        }else{
            //if both tags are same type (inline or not inline) - doesn't change order with respect to each other
            if ( a[1] < b[1] ){
                return -1;
            }else if ( a[1] > b[1] ){
                return 1;
            }else{
                return 0;
            }
        }
    }

    function _tag_value(tag,ps) {
        var result;
        if (typeof(tag)=='undefined') return '';
        if (tag.match(/\./)){
            var names=tag.split('.');
            result = ps[ names[0] ];
            if (typeof(result)!='undefined'){

                for (var i = 1; i < names.length; i++) {
                    result = result[ names[i] ];
                    if (typeof(result)=='undefined'){
                        //no need to move deeper
                        break;
                    }
                };

            }
        }else{
            result=ps[tag];
        }
        if (result==null) result=''; //treat null as empty string
        //console.log("tag value ", tag, result);
        return result;
    }

    function _htmlescape(str){
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function _nl2br (str) {
        return String(str).replace(/\r?\n/g, '<br>');
    }

    function _parse_template (html, ps){
        //_logger('parsing html:', html);
        //get tags
        var tags=[], i=0, match, r = /<~([^>]+)>/ig;
        while( match = r.exec(html) ) tags.push( [match[1], i++] );

        //early return same html if there are no tags found
        if (!tags.length) return html;

        //reorder, so inline, repeat, sub tags will be replaced first
        //(to avoid parsing subtemplate vars)
        //console.log('tags before:', tags);
        tags.sort(_sort_tags);

        //console.log('tags after:', tags);

        var TAGSEEN = {};
        $.each(tags, function(i,atag){
            var tag_full=atag[0];
            if (tag_full in TAGSEEN) return;
            TAGSEEN[tag_full]=1;
            //_logger('rendering', tag_full);
            var tag_fullq=RegExp.quote(tag_full);

            var tag_name, tag_value, attrs = {};
            if ( match=tag_full.match(/^([A-Z0-9_\.\-]+)\s/i) ){//check if there are attrs need to be parsed
                tag_name=match[1];
                var r = /([A-Z0-9_\.\-]+)\=?(?:\"(.*?)\"|'(.*?)')?/ig;
                while ( match = r.exec(tag_full) ){
                    attrs[ match[1] ] = match[2]||match[3]||'';
                }
                //console.log(attrs);
            }else{
                tag_name=tag_full;
            }

            var re_replacer;

            //check if/unless conditions
            var is_if='if' in attrs, is_unless='unless' in attrs;
            //console.log(tag_full, "IF: is_if=", is_if, " is_unless=", is_unless, " tag_value=", _tag_value(attrs.if, ps));
            if ( !is_if && !is_unless || is_if && !!_tag_value(attrs.if, ps) || is_unless && !_tag_value(attrs.unless, ps) ){

                //check for subtemplate
                if ('inline' in attrs || 'repeat' in attrs){//TODO 'sub'
                    var subhtml, m;
                    re_replacer = new RegExp('<~'+tag_fullq+'>([\\s\\S]*?)<\/~'+tag_name+'>','i');
                    if ( m = re_replacer.exec(html) ){
                        subhtml=m[1];

                        if ('repeat' in attrs){//repeat template
                            tag_value='';
                            var reprows = _tag_value(tag_name, ps);
                            if ( $.isArray(reprows) ){
                                var total = reprows.length;
                                $.each(reprows, function(i,row){
                                    row['repeat']={
                                        index       : i,
                                        iteration   : i+1,
                                        total       : total,
                                        last        : (i==total-1)?true:false,
                                        first       : (!i)?true:false,
                                        even        : (i%2)?true:false,
                                        odd         : (i%2)?false:true
                                    };
                                    //console.log('REPEAT row', row);
                                    tag_value+=_parse_template(subhtml, row);
                                });
                            }else{
                                tag_value='PP ERROR - no array passed for tag '+tag_name;
                            }

                        }else{//usual inline template
                            tag_value=_parse_template(subhtml, ps);
                        }

                    }else{
                        tag_value='PP ERROR - no close tag for inline/repeat template';
                    }

                }else{//single tag
                    tag_value=_tag_value(tag_name,ps);
                    if (tag_value && !('noescape' in attrs)) tag_value=_htmlescape(tag_value);
                    if ('nl2br' in attrs) tag_value=_nl2br(tag_value);
                }

                if (typeof(tag_value)=='undefined'){
                    _logger('WARN no value defined for tag ',tag_name);
                    tag_value='';
                }

            }else{
                tag_value='';

                //if this is inline tempalte - prepare special replacer
                if ('inline' in attrs || 'repeat' in attrs){//TODO 'sub'
                    re_replacer = new RegExp('<~'+tag_fullq+'>([\\s\\S]*?)<\/~'+tag_name+'>','i');
                }
            }

            //if no replacer set - use simple replace tag_full to tag value
            if (!re_replacer) re_replacer=new RegExp("<~"+RegExp.quote(tag_full)+">",'ig');
            //console.log("replacing ", re_replacer.source, 'with', tag_value);

            //replace tag with value
            html=html.replace(re_replacer, tag_value);
            //console.log('html now is:', html);
        })

        return html;
    }

    //alternative way - walk by tags TODO
    function _parse_template2 (html, ps){
        _logger('parsing html:', html);
    }

    $.fn.parsepage = function(tpl,ps){
        // Private instance variable
        _logger('parsing template:', tpl, ps);
        var ts = new Date().getMilliseconds();

        //first, parse the template
        var html='', jtpl=$(tpl);

        if (jtpl.length){
            html=_parse_template($(tpl).html(), ps);//template's html
        }else{
            _logger('ERROR','no such template:', tpl);
        }

        //then apply parsed template to all elements
        this.each(function(el) {
            $(this).html(html);
        });

        var tt = new Date().getMilliseconds() - ts;
        _logger('parsing template end:', tpl, 'time='+tt+'ms, '+(1000/tt).toFixed(2)+'/s');

        return this;
    };//fn.parsepage

})(jQuery);
