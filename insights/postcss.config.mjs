import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function resolveProjectRoot() {
	let dir = path.dirname(fileURLToPath(import.meta.url));
	for (;;) {
		if (fs.existsSync(path.join(dir, "package.json"))) {
			return dir;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			return process.cwd();
		}
		dir = parent;
	}
}

const config = {
	plugins: [
		[
			"@tailwindcss/postcss",
			{
				base: resolveProjectRoot(),
				optimize: false,
			},
		],
	],
};

export default config;
