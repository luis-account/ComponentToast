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
        connectedCallback() {
            renderTemplate(this, templatePath);
        }
    }
    customElements.define(tagName, CustomComponent);
}