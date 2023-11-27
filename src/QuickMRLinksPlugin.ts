import { Editor } from "codemirror";

interface Hint {
	text: string;
	hint: Function;
	displayText?: string;
	render?: Function;
}

interface Instance {
	host: string,
	username: string,
	projects: string[],
}

module.exports = {
	default: function(context: any) {
		const buildHints = async (project: string, link_type: string, number: string) =>{

			const response = await context.postMessage({command: 'getInstances'});

			let urls: string[] = [];
			response.forEach((instance: Instance) => {
				instance.projects.forEach((name_with_path: string) => {
					/* projects are stored as group/projectname */
					const components = name_with_path.split("/");
					if (components.length == 2) {
						const gname = components[0];
						const pname = components[1];
						if (project === pname || project.match(pname)) {
							let api_hook: string;

							if (instance.host.includes("github.com")) {
								switch (link_type) {
									case "!":
										api_hook = "pull";
										break;
									case "#":
										api_hook = "issues";
										break;
									case "@":
										api_hook = "commit";
										break;
								}
							} else {
								switch (link_type) {
									case "!":
										api_hook = "-/merge_requests";
										break;
									case "#":
										api_hook = "-/issues";
										break;
									case "@":
										api_hook = "-/commit";
										break;
								}
							}

							for (const g of [gname, instance.username]) {
								urls.push(`https://${instance.host}/${g}/${project}/${api_hook}/${number}`)
							}
						}
					} else {
						console.log(`Invalid project: ${name_with_path} - must be of form group/project-name`);
					}
				});
			});

			let hints: Hint[] = [];
			urls.forEach((url) => {
				const hint: Hint = {
					text: url,
					hint: async (cm: Editor, data, completion) => {
						const from = completion.from || data.from;
						const to = completion.to || data.to;
						cm.replaceRange(`[${project}${link_type}${number}](${url}) `, from, to, "complete");
					},
				};
				hints.push(hint);
			});

			return hints;
		}

		const plugin = function(CodeMirror) {
			CodeMirror.defineOption('quickMRLinks', false, function(cm, value, prev) {
				if (!value) return;

				cm.on('inputRead', async function (cm1, change) {
					if (!cm1.state.completionActive) {
						/* Resolve something like [mutter#1234] into
						 * [mutter#1234](https://gitlab.gnome.org/GNOME/mutter/-/issues/1234)
						 *
						 * Main problem here: the tokenizer treats ! and # as a new token (except for ## on its own) so
						 * we can't work on a single token.
						 */
						const tokens = cm.getLineTokens(cm.getCursor().line);
						const ntokens = tokens.length
						if (ntokens >= 3 && tokens[ntokens - 1].string === "]") {
							let project: string;
							let ltype: string;
							let number: string;
							let start: number;
							let end: number = tokens[ntokens - 1].end;
							let have_match: boolean = false;
							if (ntokens >= 3 && tokens[ntokens - 3].string === "[" && tokens[ntokens - 2].string.match(/\w+@[0-9a-f]{7,}/)) {
								let matches = tokens[ntokens-2].string.match(/(\w+)@([0-9a-f]{7,})/);
								ltype = "@";
								project = matches[1];
								number = matches[2];
								have_match = true;
								start = tokens[ntokens - 3].start
							} else if (ntokens >= 5 && tokens[ntokens - 5].string === "[") {
								project = tokens[ntokens - 4].string;
								ltype = tokens[ntokens - 3].string;
								number = tokens[ntokens - 2].string;
								if ((ltype === "!" || ltype === "#") && number.match(/\d+/)) {
									have_match = true;
									start = tokens[ntokens - 5].start
								}
							}
							if (have_match) {

								const hint = function(cm, callback) {
									buildHints(project, ltype, number).then(hints => {
									callback({
											list: hints,
											from: {line: change.from.line, ch: start },
											to: {line: change.to.line, ch: end},
										});
									});
								};

								setTimeout(function () {
								CodeMirror.showHint(cm, hint, {
										completeSingle: false,
										closeOnUnfocus: true,
										async: true,
										closeCharacters: /[()\[\]{};:>,1234567890]/
									});
								}, 10);
							}
						}
					}
				});
			});
		};

		return {
			plugin: plugin,
			codeMirrorResources: [
				'addon/hint/show-hint',
			],
			codeMirrorOptions: {
				'quickMRLinks': true,
			},
			assets: function() {
				return [
					{ name: './show-hint.css'},
				]
			}
		}
	}
}
