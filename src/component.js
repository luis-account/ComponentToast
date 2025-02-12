const templateCache = new Map();
const styleCache = new Map();

async function renderTemplate(ref, relativePathToTemplate, relativePathToStylesheet, attributes, id) {
    const templateContent = await getTemplateContent(relativePathToTemplate);
    const styleContent = await getStylesheetContent(relativePathToStylesheet);

    ref.innerHTML = relativePathToStylesheet
            ? `<style>${styleContent}</style>${templateContent}`
            : templateContent;

    injectAndExecuteScripts(ref, attributes, id);
}

async function getTemplateContent(relativePath) {
    let templateContent = '';
    if (templateCache.has(relativePath)) {
        templateContent = templateCache.get(relativePath);
    } else {
        templateContent = await fetchTextFromPath(relativePath);
        templateCache.set(relativePath, templateContent);
    }
    return templateContent;
}

async function getStylesheetContent(relativePath) {
    let styleContent = '';
    if (relativePath) {
        if (styleCache.has(relativePath)) {
            styleContent = styleCache.get(relativePath);
        } else {
            styleContent = await fetchTextFromPath(relativePath);
            styleCache.set(relativePath, styleContent);
        }
    }
    return styleContent;
}

async function fetchTextFromPath(relativePath) {
    const response = await fetch(relativePath);
    if (!response.ok) {
        throw new Error(`Failed to fetch text (${response.status}): ${relativePath}`);
    }
    return response.text();
}

function injectAndExecuteScripts(ref, attributes, id) {
    ref.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        newScript.type = oldScript.type || "text/javascript";
        newScript.textContent = `
            const component = document.getElementById('${id}').shadowRoot;
            const attributes = ${JSON.stringify(attributes)};
            ${oldScript.textContent}
        `;

        ref.appendChild(newScript);
        oldScript.remove();
    });
}

function defineComponent(tagName, templatePath, stylesheetPath) {
    class CustomComponent extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
            this.id = `${Math.random().toString(36).substring(2, 15)}`;
        }

        async connectedCallback() {
            const attributes = Object.fromEntries(
                this.getAttributeNames().map(name => [name, this.parseAttribute(this.getAttribute(name))])
            );
            await renderTemplate(this.shadow, templatePath, stylesheetPath, attributes, this.id);
        }

        disconnectedCallback() {
            this.shadow.remove();
        }

        parseAttribute(value) {
            if (value === "true") return true;
            if (value === "false") return false;
            if (!isNaN(value) && value.trim() !== "") return Number(value);
            return value;
        }
    }
    customElements.define(tagName, CustomComponent);
}