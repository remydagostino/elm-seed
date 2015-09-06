- [ ] Proper error reporting for failed builds
- [ ] Incremental compilation for JS resources
- [ ] Only rebuild elm when source changes
- [ ] Add support for middlware to be added to express server (best way?)
- [ ] Add support for compiling and serving static assets
- [x] Add support for autoprefixed and compressed css
- [ ] Command line tool with project scaffolding
- [ ] Documentation and readme

---


Elm Seed
----------

Rewrite of Elm-template as a library and command line tool. This grants greater
flexibility and justifies more functionality since bugs can be fixed and the
version updated without needing to regenerate the template.

Very much WIP


Example Config
-----------------

```js
{
  name: String
  port: Number

  buildDir: String, // Absolute path
  htmlPath: String,
  elm: {
    dir: String,
    main: String,
    test: String // TODO
  },
  js: {
    dir: String,
    main: String
  },
  css: {
    dir: String,
    main: String,
    autoprefix: [String],
    useImports: Boolean,
    useAssets: Boolean // TODO
  },
  server: {
    logRequests: String // null to disable
  },
  routes: { // TODO
    '/api': Function // (req, res, next) -> void
  }
}
```
