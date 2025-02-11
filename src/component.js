async function renderTemplate(ref, relativePathToTemplate, relativePathToStylesheet, attributes) {
    try {
        const [templateResponse, styleResponse] = await Promise.all([
            fetch(relativePathToTemplate),
            relativePathToStylesheet ? fetch(relativePathToStylesheet) : null
        ]);

        if (!templateResponse.ok) {
            throw new Error(`Failed to fetch template (${templateResponse.status}): ${relativePathToTemplate}`);
        }
        if (styleResponse && !styleResponse.ok) {
            throw new Error(`Failed to fetch stylesheet (${styleResponse.status}): ${relativePathToStylesheet}`);
        }

        const templateContent = await templateResponse.text();
        const styleContent = styleResponse && styleResponse.ok ? await styleResponse.text() : '';

        ref.innerHTML = relativePathToStylesheet
            ? `<style>${styleContent}</style>${templateContent}`
            : templateContent;

        injectAndExecuteScripts(ref, attributes);
    } catch (error) {
        console.error('Error rendering template:', error);
    }
}

function injectAndExecuteScripts(ref, attributes) {
    ref.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        newScript.textContent = `
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
        }

        async connectedCallback() {
            const attributes = Object.fromEntries(
                this.getAttributeNames().map(name => [name, this.parseAttribute(this.getAttribute(name))])
            );
            await renderTemplate(this.shadow, templatePath, stylesheetPath, attributes);
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