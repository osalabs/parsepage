# ParsePage
ParsePage is a template parser engine, good for web development

## Languages supported
- [PHP](php)
- [.NET](dot.net)
- [Javascript](js) (limited features for now)
- Perl

## Overview

When you create a website you have to generate html code for the client's browser. There are many ways how to do that, but one of the best practices is to separate _code_, _data_ and _design_. It works as: _data_ stored in some database, _code_ read it, combine with _design_ and output to browser. Something like that implemented in modern MVC web frameworks.

Separating _design_ from _code_ and _data_ can be done using _templates_. Therefore each html page generated for browser should be created with one or more templates.

Websites contains many pages, but usually most of pages have same layout (i.e. top nav, aside nav, main content area, footer).

**Core idea of ParsePage templates** is to have main page template and then build final page from sub-templates stored in directory specific for particular page. This is a bit different approach from what other template engines offer.

Templates contains special tags `<~tag>`, which replaced by actual data passed to ParsePage engine or by content of other templates (i.e. templates may include other templates).

TODO - add image here how templates works

## Sample

### Sample main template:

_/page_tpl.html_
```html
<!DOCTYPE html>
<html lang="en"><head></head>
<body>
  <h1><~title></h1>
  <~main>
  <footer>site footer<footer>
</body>
</html>
```

### Sub-templates for test page:

_/test/title.html_
```html
Test page header
```

_/test/main.html_
```html
<p><~data></p>
<p><~more_data></p>
```

### Sample code. 
This will load `page_tpl.html` layout and insert/parse sub-templates from `/test` directory, then output to browser;
```php
$ps=array(
  'data' => 'Hello World!',
  'more_data' => 12345,
);
parse_page('/test', '/page_tpl.html', $ps);
```

## Documentation

### /template directory structure

All templates should be placed under single directory accessible by website code, we name it `/template` (relative to website root).
Sample stucture:
```
page_tpl.html  - main template for website pages
page_tpl_print.html - main template for printed pages
page_tpl_layout2.html - main template for website pages with layout 2
common/ - directory with common sub-templates
home/ - directory with sub-templates for website Home page
contact/ - directory with sub-templates for website Contact page
```

### Code

Generally ParsePage called as following (depending on language syntax will differ):

`parse_page(BASE_DIR, PAGE_TPL_FILE, PS, [OUTPUT_FILENAME])`

where:
- `BASE_DIR` - directory (relative to /template) with sub-templates for current page 
- `PAGE_TPL_FILE` - path (relative to /template) to main page template/layout used for current page
- `PS` - "parse strings" - associative array (hashtable) with variable names/values to be replaced in templates
- `OUTPUT_FILENAME` - optional, output file name, if defined ParsePage will write output to this file, instead of output to browser
 
### Tag syntax

Tags in templates should be in `<~tag_name [optional attributes]>` format. 

`tag_name` could be:

- **name of the variable** passed to ParsePage engine. In this case ParsePage replace tag with variable value (optionally processed according attributes).
  - if variable is an array/hashtable squares can be used to get particular keys/index - `<~var[aaa][0][bbb]>`
  - if no variable with such name passed ParsePage will look for sub-template file with such name (see below)
- **path to sub-template**. In this case ParsePage will look for sub-template file, parse it recursively and replace tag with parsed content
  - if no file found tag repalced with empty string
  - path can be:
    - `tag_name` - will look for `tag_name.html` in `BASE_DIR` (i.e. default sub-template extension is `html`)
    - `tag_name.ext` - will look for `tag_name.ext` in `BASE_DIR`
    - `./tag_name` - (relative path) will look for `tag_name.html` in directory relative to currently parsed template file (see samples)
    - `/subdir/tag_name` - (absolute path) will look for `/subdir/tag_name.html` relative to `/template` directory

### Supported attributes

- `var` - tag is variable, no fileseek necessary even if no such variable passed to ParsePage: `<~tag var>`
- `ifXX` - if confitions, if false - tag replaced with empty string
  - `<~tag ifeq="var" value="XXX">` - tag/template will be parsed only if var=XXX
  - `<~tag ifne="var" value="XXX">` - tag/template will be parsed only if var!=XXX
  - `<~tag ifgt="var" value="XXX">` - tag/template will be parsed only if var>XXX
  - `<~tag ifge="var" value="XXX">` - tag/template will be parsed only if var>=XXX
  - `<~tag iflt="var" value="XXX">` - tag/template will be parsed only if var<XXX
  - `<~tag ifle="var" value="XXX">` - tag/template will be parsed only if var<=XXX


