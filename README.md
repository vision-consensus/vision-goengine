# Vision GoEngine for Cocos Creator

Vision GoEngine is the framework for Cocos Creator editor. Cocos Creator is the new generation of game development tool in Cocos family, it brings a complete set of 3D features and provides an intuitive, low cost and collaboration friendly workflow to game developers.

![image](https://user-images.githubusercontent.com/1503156/111037166-f27c7600-845d-11eb-988f-4c2c8b5c7321.png)

Vision GoEngine is mainly written in TypeScript and support users to use TypeScript or ES6 to write game logics. The engine itself is mostly self-contained, with full-fledged runtime modules including lighting, material, particle, animation, physical, UI, terrain, sound, resource and scene-graph management, etc. It supports both native and web platforms, including Windows, Mac, iOS, Android, Web. What's more exciting is that it supports rapidly expanding instant gaming platforms like WeChat Mini Game and Facebook Instant Games.

The engine is naturally integrated within Cocos Creator, designed to only be the essential runtime library and not to be used independently.

## Developer

### Prerequisite

- Install [node.js v9.11.2 +](https://nodejs.org/)
- Install [gulp-cli v2.3.0 +](https://github.com/gulpjs/gulp/tree/master/docs/getting-started)

### Install

In the cloned repo, run the following command to setup dev environment:

```bash
# download & build engine dependencies
npm install
```

This is all you have to do to setup engine development environment.

### Build

- If running inside Cocos Creator, the engine will automatically compile and build after the editor window is opened.

- Outside the editor, you need to run the following command to build:

  ```bash
  npm run build
  ```

