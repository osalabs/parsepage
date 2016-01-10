# ParsePage for Javascript
Javascript version of the ParsePage template parser engine.

Currently implemented as a jQuery plugin.

Note: JS version is limited in features. See parent folder for full details/documentation.


## Usage

Template definition:

```
    <script id="template-name" type="text/x-parsepage-template">
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
```

Use in javascript:

```js
    var ps={
        fname: 'Dow',
        lname: 'Jones',
        rows: [
            {id:1,title:'test1'},
            {id:2,title:'test2'},
            {id:3,title:'test3'}
        ],
        some: {
            deep: [0,1,2,3]
        }
    };
    $('#sidebar').parsepage('#template-name', ps); //#sidebar now rendered as parsed template
```

## TODO
- ability to autoload templates (async, promises)
- ability to include sub-templates
- non-jQuery version
- more samples