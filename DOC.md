## Preface
I didn’t start this project with the goal of creating the next big JavaScript framework. Instead, I wanted to understand why modern web frameworks like Angular and React are so complex.
My primary goal is to encapsulate HTML, CSS, and JavaScript within reusable components, thereby promoting more maintainable code. This is a direct use case for my [portfolio website](https://bluevoid.ch) bluevoid.ch where I am already using this framework right now.

## From HTML templates to Web Components
I was surprised to discover that web components are actually a web standard, built into modern browsers[MDN][https://developer.mozilla.org/en-US/docs/Web/API/Web_components]. I had previously assumed they were a feature introduced by specific web frameworks.

A very bare bone approach to create a web component is demonstrated in the following example:
```javascript
class HelloWorldComponent extends HTMLElement {
	connectedCallback() {
		this.innerHTML = 'Hello World'
	}
}
customElements.define(my-tag-name, HelloWorldComponent);

// usage: <my-tag-name></my-tag-name>
```

This simple example illustrates how a custom element, `<my-tag-name>`, is defined and associated with the `HelloWorldComponent` class. When the browser encounters this tag in the HTML, it instantiates the component, and the `connectedCallback` method is invoked, setting the inner HTML to "Hello World." As you can see the code relies heavily on existing web APIs from the browser and because of that the creation is straight forward. 

### Creating Generic Components
Taking this simple example further, I aimed to create a more generic component creation process that could handle different templates. For rendering the component I only need a tag name and the path to the template file.

```javascript
async function renderTemplate(ref, relativePathToTemplate) {
    try {
        const response = await fetch(relativePathToTemplate);
        if (response.ok) {
            ref.innerHTML = await response.text();
        } else {
            console.error("Could not fetch template, got response status: " +
	            response.status, relativePathToTemplate);
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
```

This `defineComponent` function genericizes the process of registering custom elements. It takes the desired tag name and the path to the template file as arguments. The `renderTemplate` function fetches the template and sets the component's `innerHTML`.

To my surprise, this seemingly simple improvement significantly enhanced the maintainability of my HTML code. I used this very rudimentary framework to build components for my [portfolio website](https://bluevoid.ch), and the benefits of organization and reusability are already apparent.
## Styling Components
However, a challenge arose with styling. Currently, global styles affect all components. In many cases though, I do want to have full control over what is happening inside and outside my component. Overriding these global styles requires significant manual effort and, as I've experienced firsthand, managing styles can get out of hand really quickly.
### Introducing the Shadow DOM
This is where the shadow DOM comes into play. The "Shadow DOM enables you to attach a DOM tree to an element, and have the internals of this tree hidden from JavaScript and CSS running in the page" ([MDN Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)). Instead of appending my template and style code to the main DOM, I will use the shadow DOM to create a zone around my component.

The following snippet shows the same `defineComponent` code as before, but now the element for appending the content is the shadow DOM:
```javascript
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
```

Not all properties are exempt from penetrating the shadow DOM. So called "inherited" CSS properties are still applied. I found [this list](https://www.w3.org/TR/CSS22/propidx.html) from W3C to be very helpful.
### Applying styles
With this changed, styles can be added to the template files either inline or in a `<style>` tag. While this does work, it is not my preferred way of doing CSS because it makes the HTML file unreadable.

The trivial solution to this, is to also specify a stylesheet to the render function. This code sample shows how the previous render function can be adapted to handle an optional stylesheet alongside the required template:
```javascript
async function renderTemplate(ref, relativePathToTemplate, relativePathToStylesheet) {
    try {
        const [templateResponse, styleResponse] = await Promise.all([
            fetch(relativePathToTemplate),
            relativePathToStylesheet ? fetch(relativePathToStylesheet) : null
        ]);

        if (!templateResponse.ok) {
            throw new Error(`...`);
        }
        if (styleResponse && !styleResponse.ok) {
            throw new Error(`...`);
        }

        const templateContent = await templateResponse.text();
        const styleContent = styleResponse && styleResponse.ok 
	        ? await styleResponse.text() 
	        : '';

        ref.innerHTML = relativePathToStylesheet
            ? `<style>${styleContent}</style>${templateContent}`
            : templateContent;
    } catch (error) {
        console.error('Error rendering template:', error);
    }
}
```

## Adding Content to components
When working with components, I find myself adding content in two ways: either by inserting content between the component tags, similar to standard HTML, or by passing parameters to the component.
### Content slots
The first method, adding content between tags, has already been solved by the browser. There is a so called `<slot>` tag that acts as a placeholder in my component. When rendered, it gets replaced with any content slotted between the custom component's tags ([Slot](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot)).

For example, to add content to a custom component like this:
```HTML
<custom-component>
	Hello World
</custom-component>
```
The corresponding template within the custom component can use the `<slot>` tag to display this content:
```HTML
<div>
    <slot></slot>
</div>
```

With this simple setup, the "Hello World" text placed between the `<custom-component>` tags will be rendered within the component's template, replacing the `<slot>` element.
## Passing Parameters as Attributes
The second way to add content was over parameters. In the context of HTML, this will be handled with attributes added to the component tags.
```HTML
<custom-component visible="true"> Hello World </custom-component>
```
Retrieving these attributes in the component is straight forward:
```javascript
async connectedCallback() {
	const attributes = this.getAttributeNames();
	await renderTemplate(this.shadow, templatePath, stylesheetPath, attributes);
}
```

To make using the attributes easier we would need to create a proper key value mapping between the attribute names and values like so:
```javascript
const attributes = Object.fromEntries(
	this.getAttributeNames().map(name => 
		[name, this.parseAttribute(this.getAttribute(name))])
);
```

## Component logic
The biggest challenge was handling JavaScript inside components. Inspired by Svelte’s approach, I wanted to support embedded `<script>` tags inside templates. Therefore, I wanted to recreate that in some form.

The following snippet is a representation of how I imagined it to work:
```HTML
<script>
    const isVisible = attributes.visible;
    if (isVisible) {
        console.log("I am visible");
    }
    component.getElementById('hello').innerHTML = attribtues.content;
</script>
<div id="hello"></div>
```

The first challenge that I encountered was that because the script tag is placed randomly inside the component it wouldn't execute correctly, or sometimes at all. After experimenting with different approaches, including immediately invoked function expressions (IIFEs), I resorted to a somewhat hacky solution: re-appending the script tag to the end of the Shadow DOM.

```javascript
function injectAndExecuteScripts(ref) {
    ref.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        newScript.type = oldScript.type || "text/javascript";

        const scriptContent = `
            ${oldScript.textContent}
        `;

        newScript.textContent = scriptContent;
        ref.appendChild(newScript);
        oldScript.remove();
    });
}
```

The second issue was how to pass attributes to the script. A simple and effective solution was to modify the `scriptContent` directly:
```javascript
const scriptContent = `
	const attributes = ${JSON.stringify(attributes)};
	${oldScript.textContent}
`;
```
While this does work, I'm not entirely satisfied with it. It introduces some "magic" behavior that developers need to be aware of, and the `JSON.stringify` approach to serializing attributes feels a bit clunky. But they do say "if it works don't touch it" for a reason ;).

The third and most challenging problem was obtaining a reference to the Shadow DOM within the script. This is difficult because `document.getElementById(..)` does not work because the shadow DOM is hidden from the main DOM. 

My initial attempt was to pass `this` (the component instance) to the script, similar to how I passed the attributes:
```javascript
const scriptContent = `
	const component = ${this}
	const attributes = ${JSON.stringify(attributes)};
	${oldScript.textContent}
`;
```
But that doesn't work because the `this` context within the script wasn't the correct context for referencing elements within the Shadow DOM. I tried variations of using `this` like binding `this` to an IIFE, but none of them were successful.

The final solution, while more of a workaround, leverages a technique inspired by how Angular sometimes uses randomly generated IDs for its components. I assign each component a unique random ID and then use this ID to retrieve the Shadow DOM:
```javascript
newScript.textContent = `
	const component = document.getElementById('${id}').shadowRoot;
	const attributes = ${JSON.stringify(attributes)};
	${oldScript.textContent}
`;
```
## Automatic Component Registration
The final piece of the puzzle was automating component registration. I wanted to avoid manually calling the `defineComponent('custom-component', './template.html', './template-styles.css');` function for each component.

For this I created a simple Node.js script that uses a config file called `toast-recipe.json`, to discover components within a specified directory and generate a JavaScript file containing all the component definitions. To simplify the process, I adopted a convention where all components reside in the same directory and adhere to the following structure:
```
/components
	/my-component
		- my-component.html
		- my-component.css
	/my-second-component
		- my-second-component.html
		- my-second-component.css 
```

The `toast-recipe.json` configuration file would look like this:
```json
{
    "directoryPath": "./components",
    "outputFilePath": "./toast.js",
    "componentPrefix": "custom-"
}
```
This configuration specifies the directory containing the components, the path to the output JavaScript file, and a prefix to be added to the component tag names. The Node.js script would then traverse the `components` directory, identify each component based on the presence of `.html` and `.css` files, and generate the `toast.js` file with the necessary `defineComponent` calls.

## Conclusion
And just like that the core functionality of my component framework is complete.
This project helped me gain a deeper understanding of Web Components and browser-native APIs. While it started as an experiment, it has already proven useful for my portfolio website and offers a lightweight alternative to modern frameworks for structuring reusable UI components.
