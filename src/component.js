async function renderTemplate(ref, relativePathToTemplate) {
    try {
        const response = await fetch(relativePathToTemplate);
        if (response.ok) {
            ref.innerHTML = await response.text();
        } else {
            console.error("Could not fetch template, got response status: " + response.status, relativePathToTemplate);
        }   
    } catch (error) {
        console.error('Error fetching template:', error);
    }
}

function defineComponent(tagName, templatePath) {
    class CustomComponent extends HTMLElement {
        constructor() {
            super();
            this.shadow = this.attachShadow({ mode: 'open' });
        }
        connectedCallback() {
            renderTemplate(this.shadow, templatePath);
        }
    }
    customElements.define(tagName, CustomComponent);
}