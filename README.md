# ComponentToast
Light and crispy — just pop your elements into components and watch them toast to perfection.
Component Toast is a lightweight JavaScript framework that enables developers to create reusable web components with HTML, CSS, and JavaScript. It leverages Web Components and the Shadow DOM to provide encapsulated, modular UI components without external dependencies.

[More Documentation](https://github.com/luis-account/component-toast/DOC.md)

## Features
- **Web Component-based**: Uses native browser APIs for performance and simplicity.
- **Shadow DOM Support**: Ensures encapsulated styling and behavior.
- **Template & Stylesheet Caching**: Optimized performance by caching component files.
- **Automatic Component Registration**: Scans a directory and registers components dynamically.
- **Attribute Parsing**: Automatically converts attribute values to appropriate types.
- **Scoped JavaScript Execution**: Executes component scripts in an isolated scope.

## Installation
Clone the repository and navigate to the project directory:

```sh
git clone https://github.com/luis-account/component-toast.git
cd component-toast
```

## Project Structure
```
/component-toast
  /components
    /my-component
      - my-component.html
      - my-component.css
    /my-second-component
      - my-second-component.html
      - my-second-component.css
  toast-recipe.json
  toast.js
  index.html
```

### Configuration
The framework is configured via `toast-recipe.json`:

```json
{
    "directoryPath": "./components",
    "outputFilePath": "./toast.js",
    "componentPrefix": "custom-"
}
```
- `directoryPath`: Defines the directory where components are stored.
- `outputFilePath`: Specifies the generated JavaScript file containing component registrations.
- `componentPrefix`: Prefix applied to component names.

## Defining Components
### Creating a New Component
1. Inside the `components` directory, create a folder for your component (e.g., `my-component`).
2. Add an HTML file (`my-component.html`) for the component’s template.
3. (Optional) Add a CSS file (`my-component.css`) for styles.

Example:
#### **my-component.html**
```html
<div>
    <h1><slot></slot></h1>
</div>
<script>
    console.log("Component loaded:", component);
</script>
```

#### **my-component.css**
```css
div {
    color: blue;
}
```

## Registering Components
To register all components automatically, run:

```sh
node autoregister.js
```
This will generate `toast.js`, which registers all components found in `components/`.

## Using Components
Include `toast.js` in your HTML file and use the components as custom elements:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="toast.js" defer></script>
    <title>Component Toast Demo</title>
</head>
<body>
    <custom-my-component>Hello, World!</custom-my-component>
</body>
</html>
```

## Attribute Handling
Attributes can be passed to components and are automatically parsed:

```html
<custom-my-component visible="true"></custom-my-component>
```

The framework converts:
- `"true"` → `true`
- `"false"` → `false`
- `"123"` → `123`
- Other values remain strings.

[More Documentation](https://github.com/luis-account/component-toast/DOC.md)


