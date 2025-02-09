async function renderTemplate(ref, relativePathToTemplate, relativePathToStylesheet) {
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
    } catch (error) {
        console.error('Error rendering template:', error);
    }
}

function defineComponent(tagName, templatePath, stylesheetPath) {
    class CustomComponent extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
        }
        async connectedCallback() {
            await renderTemplate(this.shadow, templatePath, stylesheetPath);
        }
    }
    customElements.define(tagName, CustomComponent);
}