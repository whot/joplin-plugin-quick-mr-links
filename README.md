# Quick Links to GitHub/GitLab MRs and Issues - a plugin for Joplin

This Plugin for the note taking app [Joplin](https://joplinapp.org/) gives you
a quicker way to add links to pull/merge requests and issues on GitHub and
GitLab.

This plugin is a a direct descendant of the [Quick Links
plugin](https://github.com/roman-r-m/joplin-plugin-quick-links).

**The plugin is working only in the Markdown editor. The WYSIWG editor is not supported**

## How to use

In `Tools->Options` configure the projects that you want to resolve.
Up to five instances are supported, use a configuration like:
- `Host` set to the non-protocol-prefixed name `gitlab.example.com`
- `Username` set to your username on that instance, e.g. `flintstone`
- `Projects` set to a comma-separated list of regexes matching your projects *full name*, e.g. `blah/foo,boink/python-.*`.

This plugin will strip the group name (`blah`) and replace it with your username so for
every configured project you also get the option of `flintstone/foo`.

In the Markdown editor:
- type `[foo!123]` and select from the popup the MR you want to link to.
- type `[foo#123]` and select from the popup the issue you want to link to.

## How to install

From Joplin desktop open Options - Plugins, search for "quick mr links" and install.


# Developing on the plugin

The main two files you will want to look at are:

- `/src/index.ts`, which contains the entry point for the plugin source code.
- `/src/manifest.json`, which is the plugin manifest. It contains information such as the plugin a name, version, etc.

## Building the plugin

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can use to distribute the plugin.

To build the plugin, simply run `npm run dist`.

The project is setup to use TypeScript, although you can change the configuration to use plain JavaScript.

## Updating the plugin framework

To update the plugin framework, run `npm run update`.

In general this command tries to do the right thing - in particular it's going to merge the changes in package.json and .gitignore instead of overwriting. It will also leave "/src" as well as README.md untouched.

The file that may cause problem is "webpack.config.js" because it's going to be overwritten. For that reason, if you want to change it, consider creating a separate JavaScript file and include it in webpack.config.js. That way, when you update, you only have to restore the line that include your file.
