# JSZ4 - A Browser-Based Zettelkasten

JSZ4 is a simple, self-contained Zettelkasten system that runs entirely in your web browser. It uses HTML, CSS, and JavaScript to provide a personal note-taking environment following the Zettelkasten methodology.

## Core Features

*   **Create and Edit Notes (Zettels):** Easily create new Zettels and edit existing ones. Each Zettel has a unique key, a name, content, creation date, and links.
*   **Linking:** Connect Zettels using `[[link_key]]` syntax within the content.
*   **Automatic Backlinks:** The system automatically identifies and displays backlinks, showing which other Zettels link to the current one.
*   **Save and Load:** Persist your entire Zettelkasten by downloading it as a JSON file (`zettelkasten.json`). You can later load this file to resume your work.
*   **Search:** Find Zettels by searching their names using regular expressions.
*   **Font Size Adjustment:** Increase or decrease the font size of the interface for better readability.
*   **Local Storage:** Utilizes browser local storage for temporary data persistence during a session.

## File Structure

The project consists of three main files:

*   **`JSZ4.html`**: This file contains the main HTML structure of the web application. It defines the layout, buttons, text areas, and other UI elements.
*   **`JSZ4.css`**: This CSS file provides the styling for the application, including the color scheme, font choices, and element positioning.
*   **`jsz4.js`**: This JavaScript file contains all the core logic for the Zettelkasten system. It handles Zettel creation, linking, storage, search functionality, and UI interactions.

## Basic Usage

1.  **Open the Application:** To start using JSZ4, simply open the `JSZ4.html` file in a modern web browser.
2.  **Interface Overview:**
    *   **Font Size Controls:** Buttons at the top (`Larger Font (+)`, `Smaller Font (-)`) allow you to adjust the text size.
    *   **Zettel Fields:**
        *   `Current Zettel Key`: Displays the key of the currently viewed Zettel. You can also type a key here and click `parse & load fields` to navigate or create.
        *   `Keys Searchable Field`: The name of the Zettel. This field is used for searching.
        *   `Creation Date`: Shows the creation date of the Zettel.
        *   `Zettels zettel count`: Displays the total number of Zettels.
        *   `parse & load fields`: Click this button after editing Zettel fields (like key, name, content) to save the changes to the current Zettel in memory.
    *   **Zettel Content:** The large text area is where you write the main content of your Zettel. Use `[[link_key]]` to create links to other Zettels.
    *   **Saving and Loading:**
        *   `set browser store`: Saves the current state of your Zettelkasten to the browser's local storage.
        *   `load browser store`: Loads the Zettelkasten from local storage.
        *   `Download to zettelkasten.json file`: Downloads your entire Zettelkasten as a `zettelkasten.json` file.
        *   `Load JSON File`: Allows you to select a previously saved `zettelkasten.json` file to load into the application.
    *   **Navigation and Link Management:**
        *   `Reload Back Buttons`: Refreshes the backlink information for all Zettels.
        *   `Parse All Zettels`: Re-parses all Zettels to update their link lists.
        *   `go to key`: Navigates to the Zettel key entered in the `top` (default) text area next to it.
    *   **Searching:**
        *   `Search`: Click to search for Zettels.
        *   `SearchRegEx`: Enter your search term (supports regular expressions) here. Results appear below.
    *   **Link Panes:**
        *   `Incoming links`: Displays Zettels that link to the currently viewed Zettel.
        *   `Outgoing links`: Displays Zettels that the current Zettel links to.
3.  **Creating a New Zettel:**
    *   Type a new, unique key in the `Current Zettel Key` field.
    *   Fill in the `Keys Searchable Field` (name) and the `Zettel Content`.
    *   Click `parse & load fields`. The system will create the new Zettel. If the key for a linked Zettel (e.g. `[[new_key]]`) does not exist, it will be created when the linking Zettel is parsed and saved.
4.  **Saving Your Work:** Regularly use `Download to zettelkasten.json file` to save your work to a file, as browser local storage can be cleared.

## Potential Future Development & Known Limitations

*   **Global Variables:** The `jsz4.js` script currently uses global variables (e.g., `current`, `zettel`). Refactoring this to use a more structured approach (e.g., namespacing or classes) would improve code maintainability.
*   **File Links:** The code includes a function `findFileLinks` to parse `<<file_link>>` style links, but this feature is not currently integrated into the UI or actively used.
*   **Error Handling:** Robustness could be improved with more comprehensive error handling (e.g., for JSON parsing, file operations).
*   **User Interface/User Experience (UI/UX):**
    *   The UI is functional but could be modernized.
    *   Visual feedback for operations (e.g., saving, loading) could be clearer.
*   **Rich Text Editing:** Currently, content is plain text. A Markdown editor or other rich text capabilities could be a valuable addition.
*   **No Server-Side Component:** JSZ4 is entirely client-side. This means all data is stored and processed in the browser or through manual file downloads/uploads. There's no central server or automatic cloud synchronization.
