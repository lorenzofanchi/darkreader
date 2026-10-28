// @ts-check
// Signs the Firefox release build as an unlisted add-on on addons.mozilla.org, so that
// release Firefox keeps it installed. Run through `npm run firefox:sign`, which builds first.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

import {getDestDir} from './paths.js';
import {PLATFORM} from './platform.js';

// AMO_JWT_ISSUER and AMO_JWT_SECRET, named as on the AMO credentials page
process.loadEnvFile('.env.amo');
const {AMO_JWT_ISSUER, AMO_JWT_SECRET} = process.env;
if (!AMO_JWT_ISSUER || !AMO_JWT_SECRET) {
    throw new Error('Fill in the AMO API credentials in .env.amo');
}

// `addon@darkreader.org` belongs to Dark Reader's AMO account. Never change this one:
// a new ID is a new add-on to Firefox, which starts over from default settings.
const ADDON_ID = 'darkreader@lorenzofanchi';

const sourceDir = getDestDir({debug: false, platform: PLATFORM.FIREFOX_MV2});
const artifactsDir = `${sourceDir}-signed`;
const manifestPath = `${sourceDir}/manifest.json`;
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// AMO rejects a version it has signed before, and upstream keeps one version for many
// commits. Minutes since the epoch never repeat, always increase and fit in the 9 digits
// Firefox allows per version part.
const version = `${manifest.version}.${Math.floor(Date.now() / 60000)}`;
manifest.version = version;
manifest.browser_specific_settings.gecko.id = ADDON_ID;
// Required for new add-ons on AMO
manifest.browser_specific_settings.gecko.data_collection_permissions = {required: ['none']};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));

execFileSync('npx', [
    '--yes', 'web-ext@10.7.0', 'sign',
    '--channel=unlisted',
    `--source-dir=${sourceDir}`,
    `--artifacts-dir=${artifactsDir}`,
], {
    stdio: 'inherit',
    // Through the environment rather than arguments, which other processes can read
    env: {...process.env, WEB_EXT_API_KEY: AMO_JWT_ISSUER, WEB_EXT_API_SECRET: AMO_JWT_SECRET},
});

const xpi = fs.readdirSync(artifactsDir).find((name) => name.endsWith(`-${version}.xpi`));
if (!xpi) {
    throw new Error(`Signed ${version} .xpi not found in ${artifactsDir}`);
}
// Firefox asks to install (or update) the add-on
execFileSync('open', ['-a', 'Firefox', `${artifactsDir}/${xpi}`]);
