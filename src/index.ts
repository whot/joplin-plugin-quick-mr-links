import joplin from 'api';
import { ContentScriptType, SettingItemType } from 'api/types';

interface Interface {
	host: string,
	username: string,
	projects: string,
}

const MAX_INSTANCES = 5;

let instances: Interface[] = [];

for (let i = 0; i < MAX_INSTANCES; i++) {
	instances[i] = { host: "", username: "", projects: ""};
};

async function onInstanceConfigChanged(idx: number) {
	let host = await joplin.settings.value(`SETTING_HOST${idx}`);
	let username = await joplin.settings.value(`SETTING_USERNAME${idx}`);
	let projects = await joplin.settings.value(`SETTING_PROJECTS${idx}`);
	instances[idx] = { host: host, username: username, projects: projects };
}

async function initSettings() {
	const SECTION = 'QuickMRLinks';

	await joplin.settings.registerSection(SECTION, {
		description: 'Quick MR Links Plugin Settings',
		label: 'Quick MR Links',
		iconName: 'fas fa-link'
	});

	let settings = {};
	for (let i = 0; i < MAX_INSTANCES; i++) {
			const host_identifier =  String.fromCharCode(65 + i);

			settings[`SETTING_HOST${i}`] = {
			public: true,
			section: SECTION,
			type: SettingItemType.String,
			value: instances[i].host,
			label: `Host ${host_identifier}`,
			description: 'Hostname without https:// prefix, e.g. "gitlab.example.com" or "github.com"'
		};
		settings[`SETTING_USERNAME${i}`] = {
			public: true,
			section: SECTION,
			type: SettingItemType.String,
			value: instances[i].username,
			label: `Username on Host ${host_identifier}`,
			description: 'Your username on this instance e.g. "FredFlintstone"'
		}
		settings[`SETTING_PROJECTS${i}`] = {
			public: true,
			section: SECTION,
			type: SettingItemType.String,
			value: instances[i].projects,
			label: `Projects on Host ${host_identifier}`,
			description: 'Comma-separated list of projects on this instance using the full name, e.g. "blah/foo" or a regex "boink/python.*"'
		}
	}
	await joplin.settings.registerSettings(settings);

	for (let i = 0; i < MAX_INSTANCES; i++) {
		await onInstanceConfigChanged(i);
	}

	await joplin.settings.onChange(change => {
		for (let i = 0; i < MAX_INSTANCES; i++) {
			let sidx = change.keys.indexOf(`SETTING_HOST${i}`);
			let uidx = change.keys.indexOf(`SETTING_USERNAME${i}`);
			let pidx = change.keys.indexOf(`SETTING_PROJECTS${i}`);
			if (sidx >= 0 || uidx >= 0 || pidx >= 0) {
				onInstanceConfigChanged(i);
			}
		}
	});
}

joplin.plugins.register({
	onStart: async function() {
		await initSettings();

		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			'quickMRLinks',
			'./QuickMRLinksPlugin.js'
		);

		await joplin.contentScripts.onMessage('quickMRLinks', async (message: any) => {
			if (message.command == 'getInstances') {
				let instances_return = [];
				instances
				  .filter((instance) => instance.host && instance.username && instance.projects)
				  .forEach((instance) => {
						let projects = [];

						instance.projects.split(",").forEach((p: string) => {
							projects.push(p.trim());
						});
						instances_return.push({host: instance.host, username: instance.username, projects: projects});
					});
				return instances_return;
			}
		});
	}
});
