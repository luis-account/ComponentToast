import { readdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../');

const configPath = join(projectRoot, 'toast-recipe.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const outputFilePath = join(projectRoot, config.outputFilePath);

let componentDefinitions = "";
readdirSync(join(projectRoot, config.directoryPath), { withFileTypes: true }).forEach(dirent => {  
    if (dirent.isDirectory()) {
        const templatePath = join(config.directoryPath, dirent.name, dirent.name + '.html');
        const stylesheetPath = join(config.directoryPath, dirent.name, dirent.name + '.css');      

        if (existsSync(join(projectRoot, templatePath))) {
            const componentName = config.componentPrefix + dirent.name;
            if (existsSync(join(projectRoot, stylesheetPath))) {
                componentDefinitions += `defineComponent('${componentName}', '${templatePath}', '${stylesheetPath}');\n`;
            } else {
                componentDefinitions += `defineComponent('${componentName}', '${templatePath}', null);\n`;
            }
        }
    }
});

componentDefinitions = componentDefinitions.replace(/\\/g, '/');
writeFileSync(outputFilePath, componentDefinitions);