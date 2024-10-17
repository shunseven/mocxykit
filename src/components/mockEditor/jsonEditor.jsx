import React, { useEffect, useRef } from 'react';
import JSONEditor from 'jsoneditor/dist/jsoneditor.min.js';
import 'jsoneditor/dist/jsoneditor.min.css';

/**
 * @typedef {{
 * tree: string,
 * view: string,
 * form: string,
 * code: string,
 * text: string,
 * allValues: Array<string>
 * }} TJsonEditorModes
 */
const modes = {
  tree: 'tree',
  view: 'view',
  form: 'form',
  code: 'code',
  text: 'text'
};

const values = Object.values(modes);
modes.allValues = values;

/**
 * @type {object}
 * @property {object} [value]
 * @property {string} [mode='tree'] - Set the editor mode.
 * @property {string} [name=undefined] - Initial field name for the root node
 * @property {object} [schema] - Validate the JSON object against a JSON schema.
 * @property {object} [schemaRefs] - Schemas that are referenced using
 * the $ref property
 * @property {Function} [onChange] - Set a callback function
 * triggered when json in the JSONEditor change.
 * Will only be triggered on changes made by the user.
 * @property {Function} [onError] - Set a callback function triggered when an error occurs.
 * Invoked with the error as first argument.
 * The callback is only invoked for errors triggered by a users action,
 * like switching from code mode to tree mode or clicking
 * the Format button whilst the editor doesn't contain valid JSON.
 * @property {Function} [onModeChange] - Set a callback function
 * triggered right after the mode is changed by the user.
 * @property {object} [ace] - Provide a version of the Ace editor.
 * Only applicable when mode is code
 * @property {object} [ajv] - Provide a instance of ajv,
 * the library used for JSON schema validation.
 * @property {string} [theme] - Set the Ace editor theme,
 * uses included 'ace/theme/jsoneditor' by default.
 * @property {boolean} [history=false] - Enables history,
 * adds a button Undo and Redo to the menu of the JSONEditor. Only applicable when
 * mode is 'tree' or 'form'
 * @property {boolean} [navigationBar=true] - Adds navigation bar to the menu
 * the navigation bar visualize the current position on the
 * tree structure as well as allows breadcrumbs navigation.
 * @property {boolean} [statusBar=true] - Adds status bar to the buttom of the editor
 * the status bar shows the cursor position and a count of the selected characters.
 * Only applicable when mode is 'code' or 'text'.
 * @property {boolean} [search=true] - Enables a search box in
 * the upper right corner of the JSONEditor.
 * @property {Array<string>} [allowedModes] - Create a box in the editor menu where
 * the user can switch between the specified modes.
 * @property {(string|PropTypes.elementType)} [tag='div'] - Html element, or react element to render
 * @property {object} [htmlElementProps] - html element custom props
 * @property {Function} [innerRef] - callback to get html element reference
 * @property {boolean} [sortObjectKeys=false] If true, object keys in 'tree',
 * 'view' or 'form' mode list be listed alphabetically instead by their insertion order..
 */
const Editor = ({
  value,
  mode = modes.tree,
  name,
  schema,
  schemaRefs,
  onChange,
  onError,
  ace,
  ajv,
  theme,
  history = false,
  navigationBar = true,
  statusBar = true,
  search = true,
  allowedModes,
  tag: Tag = 'div',
  htmlElementProps,
  innerRef,
  sortObjectKeys = false,
}) => {
  const htmlElementRef = useRef(null);
  const jsonEditorRef = useRef(null);

  useEffect(() => {
    createEditor();

    return () => {
      if (jsonEditorRef.current) {
        jsonEditorRef.current.destroy();
        jsonEditorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (jsonEditorRef.current) {
      if (theme !== jsonEditorRef.current.options.theme) {
        createEditor();
      } else {
        if (schema !== jsonEditorRef.current.options.schema
          || schemaRefs !== jsonEditorRef.current.options.schemaRefs
        ) {
          jsonEditorRef.current.setSchema(schema, schemaRefs);
        }

        if (name !== jsonEditorRef.current.getName()) {
          jsonEditorRef.current.setName(name);
        }
      }
    }
  }, [schema, schemaRefs, name, theme]);

  const createEditor = () => {
    if (jsonEditorRef.current) {
      jsonEditorRef.current.destroy();
    }

    jsonEditorRef.current = new JSONEditor(htmlElementRef.current, {
      onChange: handleChange,
      mode,
      name,
      schema,
      schemaRefs,
      ace,
      ajv,
      theme,
      history,
      navigationBar,
      statusBar,
      search,
      allowedModes,
      sortObjectKeys
    });
    jsonEditorRef.current.set(value);
  };

  const handleChange = () => {
    if (onChange) {
      try {
        const text = jsonEditorRef.current.getText();
        if (text === '') {
          onChange(null);
        }

        const currentJson = jsonEditorRef.current.get();
        if (value !== currentJson) {
          onChange(currentJson);
        }
      } catch (err) {
        if (onError) {
          onError(err);
        }
      }
    }
  };

  useEffect(() => {
    if (innerRef) {
      innerRef(htmlElementRef.current);
    }
  }, [innerRef]);

  return <Tag {...htmlElementProps} ref={htmlElementRef} />;
};

Editor.modes = modes;

export default Editor;
